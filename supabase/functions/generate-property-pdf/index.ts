import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

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

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let yPosition = pageHeight - margin;

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
          yPosition = pageHeight - margin;
        }
        page.drawText(ln, { x: margin, y: yPosition, size, font, color });
        yPosition -= size + 4;
      }
    };

    const addSpace = (height: number) => {
      yPosition -= height;
    };

    // Header
    const fullAddress = [property.address, property.city, property.state, property.zip_code]
      .filter(Boolean)
      .join(", ");

    drawText("PROPERTY DETAILS", { font: helveticaBold, size: 20, color: rgb(0.13, 0.27, 0.43) });
    addSpace(8);
    drawText(fullAddress, { font: helveticaBold, size: 14 });
    addSpace(4);
    drawText(`Prepared by ${agentName}`, { size: 10, color: rgb(0.4, 0.4, 0.4) });
    addSpace(16);

    // Price
    if (property.price) {
      const formattedPrice = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(property.price);
      drawText(formattedPrice, { font: helveticaBold, size: 24, color: rgb(0.13, 0.27, 0.43) });
      addSpace(12);
    }

    // Quick stats
    const stats: string[] = [];
    if (property.beds) stats.push(`${property.beds} Beds`);
    if (property.baths) stats.push(`${property.baths} Baths`);
    if (property.sqft) stats.push(`${property.sqft.toLocaleString()} Sq Ft`);
    if (property.year_built) stats.push(`Built ${property.year_built}`);
    if (stats.length > 0) {
      drawText(stats.join("  •  "), { font: helveticaBold, size: 12 });
      addSpace(16);
    }

    // Property Details Section
    const details: { label: string; value: string }[] = [];
    if (property.year_built) details.push({ label: "Year Built", value: String(property.year_built) });
    if (property.lot_size) details.push({ label: "Lot Size", value: property.lot_size });
    if (property.garage) details.push({ label: "Parking", value: property.garage });
    if (property.price && property.sqft) {
      details.push({ label: "Price/Sq Ft", value: `$${Math.round(property.price / property.sqft).toLocaleString()}` });
    }

    if (details.length > 0) {
      drawText("PROPERTY DETAILS", { font: helveticaBold, size: 13, color: rgb(0.13, 0.27, 0.43) });
      addSpace(6);
      for (const detail of details) {
        drawText(`${detail.label}: ${detail.value}`, { size: 11 });
      }
      addSpace(12);
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

    // Footer
    addSpace(20);
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

    return new Response(pdfBytes, {
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
