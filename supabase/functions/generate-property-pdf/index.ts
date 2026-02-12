import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import { checkRateLimit, getRateLimitIdentifier } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PropertyData {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  price: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  year_built: number | null;
  lot_size: string | null;
  garage: string | null;
  agent_notes: string | null;
  description: string | null;
  summary: string | null;
  features: string[] | null;
}

interface DocumentData {
  id: string;
  name: string;
  doc_type: string | null;
  file_url: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { propertyId, shareToken } = await req.json();

    if (!propertyId || !shareToken) {
      return new Response(
        JSON.stringify({ error: "Property ID and share token are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting: 20 PDF generations per hour per session
    const identifier = `token:${shareToken}`;
    const rateLimit = await checkRateLimit(identifier, {
      maxRequests: 20,
      windowSeconds: 3600, // 1 hour
      operation: "generate-property-pdf",
    });

    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for ${identifier}`);
      return new Response(
        JSON.stringify({
          error: rateLimit.error,
          retryAfter: Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)),
            "X-RateLimit-Limit": "20",
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-RateLimit-Reset": rateLimit.resetAt.toISOString(),
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify share token is valid for this property
    const { data: isValid } = await supabase.rpc("is_valid_property_share_token", {
      p_property_id: propertyId,
      p_share_token: shareToken,
    });

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Invalid access" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch property details
    const { data: property, error: propError } = await supabase
      .from("session_properties")
      .select("*")
      .eq("id", propertyId)
      .single();

    if (propError || !property) {
      console.error("Property fetch error:", propError);
      return new Response(
        JSON.stringify({ error: "Property not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch property documents
    const { data: documents } = await supabase
      .from("property_documents")
      .select("id, name, doc_type, file_url")
      .eq("session_property_id", propertyId);

    // Fetch agent info
    const { data: sessionData } = await supabase
      .from("showing_sessions")
      .select("admin_id")
      .eq("id", property.session_id)
      .single();

    let agentName = "Your Agent";
    if (sessionData?.admin_id) {
      const { data: profile } = await supabase
        .from("public_agent_profile")
        .select("full_name, company")
        .eq("user_id", sessionData.admin_id)
        .single();
      if (profile?.full_name) {
        agentName = profile.full_name;
      }
    }

    // Generate PDF
    const pdfDoc = await PDFDocument.create();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 612; // Letter size
    const pageHeight = 792;
    const margin = 50;
    const contentWidth = pageWidth - margin * 2;

    // Fetch HomeFolio logo
    let logoImage = null;
    try {
      const logoUrl = "https://storage.googleapis.com/gpt-engineer-file-uploads/RctDwzRtwzgNKOYbrreyhlinrR32/uploads/1770365379409-4A3B7777-C913-4A64-82CD-EE898D971633.PNG";
      const logoResponse = await fetch(logoUrl);
      if (logoResponse.ok) {
        const logoArrayBuffer = await logoResponse.arrayBuffer();
        const logoUint8Array = new Uint8Array(logoArrayBuffer);
        logoImage = await pdfDoc.embedPng(logoUint8Array);
      }
    } catch (err) {
      console.log("Could not load logo:", err);
    }

    let page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Add HomeFolio logo at top right
    if (logoImage) {
      const logoDims = logoImage.scale(1);
      const logoWidth = 70;
      const logoHeight = (logoDims.height / logoDims.width) * logoWidth;
      page.drawImage(logoImage, {
        x: pageWidth - margin - logoWidth,
        y: pageHeight - margin - logoHeight - 10,
        width: logoWidth,
        height: logoHeight,
      });
    } else {
      // Fallback text if logo doesn't load
      page.drawText("HomeFolio", {
        x: pageWidth - margin - 70,
        y: pageHeight - margin - 20,
        size: 14,
        font: helveticaBold,
        color: rgb(0.13, 0.27, 0.43),
      });
    }

    let yPosition = pageHeight - margin - 90;

    const drawText = (text: string, options: { font?: any; size?: number; color?: any; maxWidth?: number } = {}) => {
      const font = options.font || helvetica;
      const size = options.size || 11;
      const color = options.color || rgb(0.1, 0.1, 0.1);
      const maxWidth = options.maxWidth || contentWidth;

      // Simple word wrap
      const words = text.split(" ");
      let line = "";
      const lines: string[] = [];

      for (const word of words) {
        const testLine = line ? `${line} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, size);
        if (testWidth > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = testLine;
        }
      }
      if (line) lines.push(line);

      for (const ln of lines) {
        if (yPosition < margin + 20) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          // Add logo to new page
          if (logoImage) {
            const logoDims = logoImage.scale(1);
            const logoWidth = 60;
            const logoHeight = (logoDims.height / logoDims.width) * logoWidth;
            page.drawImage(logoImage, {
              x: pageWidth - margin - logoWidth,
              y: pageHeight - margin - logoHeight - 10,
              width: logoWidth,
              height: logoHeight,
            });
          }
          yPosition = pageHeight - margin - 80;
        }
        page.drawText(ln, { x: margin, y: yPosition, size, font, color });
        yPosition -= size + 4;
      }
    };

    const addSpace = (height: number) => {
      yPosition -= height;
    };

    // Header with Address
    const fullAddress = [property.address, property.city, property.state, property.zip_code]
      .filter(Boolean)
      .join(", ");

    drawText(fullAddress, { font: helveticaBold, size: 14, color: rgb(0.13, 0.27, 0.43) });
    addSpace(6);

    // Price (prominent)
    if (property.price) {
      const formattedPrice = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(property.price);
      drawText(formattedPrice, { font: helveticaBold, size: 24, color: rgb(0.13, 0.27, 0.43) });
      addSpace(4);
    }

    // Quick stats (basic info)
    const quickStats: string[] = [];
    if (property.beds) quickStats.push(`${property.beds} Bd`);
    if (property.baths) quickStats.push(`${property.baths} Ba`);
    if (property.sqft) quickStats.push(`${property.sqft.toLocaleString()} Sq Ft`);
    if (quickStats.length > 0) {
      drawText(quickStats.join("  •  "), { size: 11, color: rgb(0.4, 0.4, 0.4) });
      addSpace(3);
    }

    // Estimated monthly payment
    if (property.price) {
      const monthlyRate = 0.07 / 12;
      const numPayments = 30 * 12;
      const monthlyPayment = (property.price * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
                             (Math.pow(1 + monthlyRate, numPayments) - 1);
      const formattedMonthly = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(monthlyPayment);
      drawText(`Est. ${formattedMonthly}/mo`, { size: 10, color: rgb(0.4, 0.4, 0.4) });
      addSpace(16);
    }

    // Agent Notes
    if (property.agent_notes) {
      drawText("AGENT'S NOTE", { font: helveticaBold, size: 13, color: rgb(0.13, 0.27, 0.43) });
      addSpace(6);
      drawText(property.agent_notes, { size: 11, color: rgb(0.3, 0.3, 0.3) });
      addSpace(12);
    }

    // Summary
    if (property.summary) {
      drawText("SUMMARY", { font: helveticaBold, size: 13, color: rgb(0.13, 0.27, 0.43) });
      addSpace(6);
      const summaryLines = property.summary.split("\n");
      for (const line of summaryLines) {
        const bulletLine = line.startsWith("•") || line.startsWith("-") ? line : `• ${line}`;
        drawText(bulletLine, { size: 11, color: rgb(0.3, 0.3, 0.3) });
      }
      addSpace(12);
    }

    // Features
    if (property.features && property.features.length > 0) {
      drawText("FEATURES", { font: helveticaBold, size: 13, color: rgb(0.13, 0.27, 0.43) });
      addSpace(6);
      drawText(property.features.join("  •  "), { size: 11 });
      addSpace(12);
    }

    // Description
    if (property.description) {
      drawText("ABOUT THIS HOME", { font: helveticaBold, size: 13, color: rgb(0.13, 0.27, 0.43) });
      addSpace(6);
      drawText(property.description, { size: 11, color: rgb(0.3, 0.3, 0.3) });
      addSpace(12);
    }

    // Comprehensive Property Details Section
    const allDetails: { label: string; value: string }[] = [];
    if (property.beds) allDetails.push({ label: "Bedrooms", value: String(property.beds) });
    if (property.baths) allDetails.push({ label: "Bathrooms", value: String(property.baths) });
    if (property.sqft) allDetails.push({ label: "Square Feet", value: property.sqft.toLocaleString() });
    if (property.year_built) allDetails.push({ label: "Year Built", value: String(property.year_built) });
    if (property.lot_size) allDetails.push({ label: "Lot Size", value: property.lot_size });
    if (property.price && property.sqft) {
      allDetails.push({ label: "Price/Sq Ft", value: `$${Math.round(property.price / property.sqft).toLocaleString()}` });
    }
    if (property.garage) allDetails.push({ label: "Parking", value: property.garage });

    if (allDetails.length > 0) {
      drawText("PROPERTY DETAILS", { font: helveticaBold, size: 13, color: rgb(0.13, 0.27, 0.43) });
      addSpace(6);
      for (const detail of allDetails) {
        drawText(`${detail.label}: ${detail.value}`, { size: 11 });
      }
      addSpace(12);
    }

    // Documents list
    if (documents && documents.length > 0) {
      drawText("ATTACHED DOCUMENTS", { font: helveticaBold, size: 13, color: rgb(0.13, 0.27, 0.43) });
      addSpace(6);
      for (const doc of documents) {
        const docTypeLabel = getDocTypeLabel(doc.doc_type);
        drawText(`• ${doc.name} (${docTypeLabel})`, { size: 11 });
      }
      addSpace(12);
    }

    // Footer with Agent Info
    addSpace(20);

    // Agent information at bottom
    if (agentName && agentName !== "Your Agent") {
      drawText(`Prepared by ${agentName}`, { font: helveticaBold, size: 10, color: rgb(0.3, 0.3, 0.3) });
      addSpace(4);
    }

    drawText(`Generated on ${new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })}`, { size: 9, color: rgb(0.5, 0.5, 0.5) });
    drawText("Powered by HomeFolio", { size: 9, color: rgb(0.5, 0.5, 0.5) });

    // Bundle all uploaded documents after the summary pages
    if (documents && documents.length > 0) {
      for (const doc of documents) {
        try {
          // Generate signed URL for the document
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from("property-documents")
            .createSignedUrl(doc.file_url, 60);

          if (signedUrlError || !signedUrlData?.signedUrl) {
            console.log(`Could not get signed URL for ${doc.name}:`, signedUrlError);
            continue;
          }

          // Fetch the document
          const response = await fetch(signedUrlData.signedUrl);
          if (!response.ok) {
            console.log(`Could not fetch ${doc.name}`);
            continue;
          }

          const contentType = response.headers.get("content-type") || "";
          const arrayBuffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);

          if (contentType.includes("pdf")) {
            // Append PDF pages directly
            try {
              const externalPdf = await PDFDocument.load(uint8Array);
              const pageIndices = externalPdf.getPageIndices();
              const copiedPages = await pdfDoc.copyPages(externalPdf, pageIndices);
              
              for (const copiedPage of copiedPages) {
                pdfDoc.addPage(copiedPage);
              }
              console.log(`Appended ${pageIndices.length} pages from ${doc.name}`);
            } catch (pdfErr) {
              console.log(`Could not embed PDF ${doc.name}:`, pdfErr);
            }
          } else if (contentType.includes("image")) {
            // Add image as a new page
            try {
              let image;
              if (contentType.includes("png")) {
                image = await pdfDoc.embedPng(uint8Array);
              } else if (contentType.includes("jpeg") || contentType.includes("jpg")) {
                image = await pdfDoc.embedJpg(uint8Array);
              }

              if (image) {
                const imgDims = image.scale(1);
                // Create page sized to image (max letter size)
                const imgPageWidth = Math.min(imgDims.width, pageWidth);
                const imgPageHeight = Math.min(imgDims.height, pageHeight);
                const scale = Math.min(pageWidth / imgDims.width, pageHeight / imgDims.height, 1);
                
                const imgPage = pdfDoc.addPage([pageWidth, pageHeight]);
                imgPage.drawImage(image, {
                  x: (pageWidth - imgDims.width * scale) / 2,
                  y: (pageHeight - imgDims.height * scale) / 2,
                  width: imgDims.width * scale,
                  height: imgDims.height * scale,
                });
                console.log(`Appended image ${doc.name}`);
              }
            } catch (imgErr) {
              console.log(`Could not embed image ${doc.name}:`, imgErr);
            }
          }
        } catch (docErr) {
          console.log(`Error processing document ${doc.name}:`, docErr);
        }
      }
    }

    const pdfBytes = await pdfDoc.save();
    const sanitizedAddress = property.address.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "-");

    return new Response(pdfBytes as unknown as BodyInit, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${sanitizedAddress}-details.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate PDF" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getDocTypeLabel(type: string | null): string {
  const labels: Record<string, string> = {
    disclosure: "Disclosure",
    inspection: "Inspection",
    floor_plan: "Floor Plan",
    hoa: "HOA",
    survey: "Survey",
    title: "Title",
    other: "Document",
  };
  return labels[type || "other"] || "Document";
}
