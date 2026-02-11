import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import { checkRateLimit } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
  order_index: number;
  showing_time: string | null;
}

function formatShowingTime(time: string | null): string {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

interface DocumentData {
  id: string;
  name: string;
  doc_type: string | null;
  file_url: string;
  session_property_id: string;
}

interface SessionData {
  id: string;
  title: string;
  client_name: string;
  session_date: string | null;
  admin_id: string;
}

function getDocTypeLabel(type: string | null): string {
  const labels: Record<string, string> = {
    disclosure: "Disclosure",
    inspection: "Inspection",
    floor_plan: "Floor Plan",
    hoa: "HOA",
    survey: "Survey",
    title: "Title",
    mls_info: "MLS Info",
    other: "Document",
  };
  return labels[type || "other"] || "Document";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { shareToken } = await req.json();

    if (!shareToken) {
      return new Response(
        JSON.stringify({ error: "Share token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting: 10 session PDF generations per hour per session
    const identifier = `token:${shareToken}`;
    const rateLimit = await checkRateLimit(identifier, {
      maxRequests: 10,
      windowSeconds: 3600, // 1 hour
      operation: "generate-session-pdf",
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
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-RateLimit-Reset": rateLimit.resetAt.toISOString(),
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify share token is valid
    const { data: isValid } = await supabase.rpc("is_valid_share_token", {
      token: shareToken,
    });

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Invalid access" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch session details
    const { data: sessionResult, error: sessionError } = await supabase
      .rpc("get_public_session", { p_share_token: shareToken });

    const sessionData = sessionResult?.[0] as SessionData | undefined;

    if (sessionError || !sessionData) {
      console.error("Session fetch error:", sessionError);
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all properties for the session
    const { data: properties, error: propsError } = await supabase
      .from("session_properties")
      .select("*")
      .eq("session_id", sessionData.id)
      .order("order_index", { ascending: true });

    if (propsError) {
      console.error("Properties fetch error:", propsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch properties" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!properties || properties.length === 0) {
      return new Response(
        JSON.stringify({ error: "No properties in session" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const propertyIds = properties.map(p => p.id);

    // Fetch all documents for all properties
    const { data: documents } = await supabase
      .from("property_documents")
      .select("id, name, doc_type, file_url, session_property_id")
      .in("session_property_id", propertyIds);

    // Group documents by property
    const docsByProperty: Record<string, DocumentData[]> = {};
    (documents || []).forEach(doc => {
      if (!docsByProperty[doc.session_property_id]) {
        docsByProperty[doc.session_property_id] = [];
      }
      docsByProperty[doc.session_property_id].push(doc);
    });

    // Fetch agent info
    let agentName = "Your Agent";
    let agentAvatarUrl: string | null = null;
    const { data: profile } = await supabase
      .from("public_agent_profile")
      .select("full_name, company, avatar_url")
      .eq("user_id", sessionData.admin_id)
      .single();
    if (profile?.full_name) {
      agentName = profile.full_name;
    }
    if (profile?.avatar_url) {
      agentAvatarUrl = profile.avatar_url;
    }

    // Generate PDF
    const pdfDoc = await PDFDocument.create();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 612; // Letter size
    const pageHeight = 792;
    const margin = 50;
    const contentWidth = pageWidth - margin * 2;

    // Helper functions
    const createTextDrawer = (page: ReturnType<typeof pdfDoc.addPage>, startY: number) => {
      let yPosition = startY;
      
      const drawText = (text: string, options: { font?: typeof helvetica; size?: number; color?: ReturnType<typeof rgb>; maxWidth?: number } = {}) => {
        const font = options.font || helvetica;
        const size = options.size || 11;
        const color = options.color || rgb(0.1, 0.1, 0.1);
        const maxWidth = options.maxWidth || contentWidth;

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
            return { needsNewPage: true, remainingLines: lines.slice(lines.indexOf(ln)) };
          }
          page.drawText(ln, { x: margin, y: yPosition, size, font, color });
          yPosition -= size + 4;
        }
        return { needsNewPage: false, yPosition };
      };

      const addSpace = (height: number) => {
        yPosition -= height;
      };

      const getY = () => yPosition;

      return { drawText, addSpace, getY };
    };

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

    // Fetch agent avatar
    let agentAvatar = null;
    if (agentAvatarUrl) {
      try {
        const avatarResponse = await fetch(agentAvatarUrl);
        if (avatarResponse.ok) {
          const avatarArrayBuffer = await avatarResponse.arrayBuffer();
          const avatarUint8Array = new Uint8Array(avatarArrayBuffer);
          const contentType = avatarResponse.headers.get("content-type") || "";

          if (contentType.includes("png")) {
            agentAvatar = await pdfDoc.embedPng(avatarUint8Array);
          } else if (contentType.includes("jpeg") || contentType.includes("jpg")) {
            agentAvatar = await pdfDoc.embedJpg(avatarUint8Array);
          }
        }
      } catch (err) {
        console.log("Could not load agent avatar:", err);
      }
    }

    // Cover page
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let drawer = createTextDrawer(page, pageHeight - margin - 180);

    // Add HomeFolio logo at top right
    if (logoImage) {
      const logoDims = logoImage.scale(1);
      const logoWidth = 80;
      const logoHeight = (logoDims.height / logoDims.width) * logoWidth;
      page.drawImage(logoImage, {
        x: pageWidth - margin - logoWidth,
        y: pageHeight - margin - logoHeight,
        width: logoWidth,
        height: logoHeight,
      });
    } else {
      // Fallback text if logo doesn't load
      page.drawText("HomeFolio", {
        x: pageWidth - margin - 70,
        y: pageHeight - margin - 20,
        size: 16,
        font: helveticaBold,
        color: rgb(0.13, 0.27, 0.43),
      });
    }

    // Title (with more top spacing)
    page.drawText("PROPERTY TOUR", {
      x: margin,
      y: pageHeight - margin - 120,
      size: 28,
      font: helveticaBold,
      color: rgb(0.13, 0.27, 0.43),
    });

    page.drawText(sessionData.title, {
      x: margin,
      y: pageHeight - margin - 155,
      size: 18,
      font: helvetica,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText(`Prepared for ${sessionData.client_name}`, {
      x: margin,
      y: pageHeight - margin - 185,
      size: 14,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Draw agent name with avatar
    const agentByText = `by ${agentName}`;
    const agentByY = pageHeight - margin - 205;

    if (agentAvatar) {
      // Draw circular avatar next to agent name
      const avatarSize = 24;
      const avatarX = margin;
      const avatarY = agentByY - 4;

      // Draw avatar (circular crop approximation using a square for simplicity)
      page.drawImage(agentAvatar, {
        x: avatarX,
        y: avatarY,
        width: avatarSize,
        height: avatarSize,
      });

      // Draw agent name next to avatar
      page.drawText(agentByText, {
        x: margin + avatarSize + 8,
        y: agentByY,
        size: 12,
        font: helvetica,
        color: rgb(0.5, 0.5, 0.5),
      });
    } else {
      // No avatar, just draw the text
      page.drawText(agentByText, {
        x: margin,
        y: agentByY,
        size: 12,
        font: helvetica,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    if (sessionData.session_date) {
      const date = new Date(sessionData.session_date);
      const dateStr = date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      page.drawText(dateStr, {
        x: margin,
        y: pageHeight - margin - 235,
        size: 12,
        font: helvetica,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    // Properties summary
    page.drawText(`${properties.length} Properties`, {
      x: margin,
      y: pageHeight - margin - 280,
      size: 16,
      font: helveticaBold,
      color: rgb(0.13, 0.27, 0.43),
    });

    let summaryY = pageHeight - margin - 310;
    for (let i = 0; i < properties.length; i++) {
      const prop = properties[i];
      const propDocs = docsByProperty[prop.id] || [];
      const price = prop.price 
        ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(prop.price)
        : "";
      const showingTime = formatShowingTime(prop.showing_time);
      
      // Address with optional showing time
      const addressLine = showingTime 
        ? `${i + 1}. ${prop.address}  —  ${showingTime}`
        : `${i + 1}. ${prop.address}`;
      
      page.drawText(addressLine, {
        x: margin,
        y: summaryY,
        size: 11,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.1),
      });
      
      const details = [price, prop.beds ? `${prop.beds} bed` : "", prop.baths ? `${prop.baths} bath` : ""].filter(Boolean).join(" • ");
      if (details) {
        page.drawText(details, {
          x: margin + 20,
          y: summaryY - 15,
          size: 10,
          font: helvetica,
          color: rgb(0.4, 0.4, 0.4),
        });
      }
      
      if (propDocs.length > 0) {
        page.drawText(`${propDocs.length} document${propDocs.length > 1 ? "s" : ""} attached`, {
          x: margin + 20,
          y: summaryY - 28,
          size: 9,
          font: helvetica,
          color: rgb(0.5, 0.5, 0.5),
        });
        summaryY -= 45;
      } else {
        summaryY -= 35;
      }

      if (summaryY < margin + 50) break;
    }

    // Generate pages for each property with their documents
    for (let i = 0; i < properties.length; i++) {
      const property = properties[i] as PropertyData;
      const propDocs = docsByProperty[property.id] || [];

      // Property summary page
      page = pdfDoc.addPage([pageWidth, pageHeight]);

      // Add HomeFolio logo at top right of each property page
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

      let yPosition = pageHeight - margin - 80;

      const drawText = (text: string, options: { font?: typeof helvetica; size?: number; color?: ReturnType<typeof rgb>; maxWidth?: number } = {}) => {
        const font = options.font || helvetica;
        const size = options.size || 11;
        const color = options.color || rgb(0.1, 0.1, 0.1);
        const maxWidth = options.maxWidth || contentWidth;

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

      // Property number header
      drawText(`PROPERTY ${i + 1} OF ${properties.length}`, { font: helveticaBold, size: 10, color: rgb(0.5, 0.5, 0.5) });
      addSpace(8);

      // Address
      const fullAddress = [property.address, property.city, property.state, property.zip_code]
        .filter(Boolean)
        .join(", ");

      drawText(fullAddress, { font: helveticaBold, size: 16, color: rgb(0.13, 0.27, 0.43) });
      addSpace(12);

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
      if (propDocs.length > 0) {
        drawText("ATTACHED DOCUMENTS", { font: helveticaBold, size: 13, color: rgb(0.13, 0.27, 0.43) });
        addSpace(6);
        for (const doc of propDocs) {
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

      // Bundle all uploaded documents for this property
      for (const doc of propDocs) {
        try {
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from("property-documents")
            .createSignedUrl(doc.file_url, 60);

          if (signedUrlError || !signedUrlData?.signedUrl) {
            console.log(`Could not get signed URL for ${doc.name}:`, signedUrlError);
            continue;
          }

          const response = await fetch(signedUrlData.signedUrl);
          if (!response.ok) {
            console.log(`Could not fetch ${doc.name}`);
            continue;
          }

          const contentType = response.headers.get("content-type") || "";
          const arrayBuffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);

          if (contentType.includes("pdf")) {
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
            try {
              let image;
              if (contentType.includes("png")) {
                image = await pdfDoc.embedPng(uint8Array);
              } else if (contentType.includes("jpeg") || contentType.includes("jpg")) {
                image = await pdfDoc.embedJpg(uint8Array);
              }

              if (image) {
                const imgDims = image.scale(1);
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
    const sanitizedTitle = sessionData.title.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "-");

    console.log(`Generated PDF with ${pdfDoc.getPageCount()} pages for session ${sessionData.id}`);

    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${sanitizedTitle}-complete.pdf"`,
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
