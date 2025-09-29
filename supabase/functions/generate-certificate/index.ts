import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://cdn.skypack.dev/pdf-lib";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
async function generateCertificatePDF(data) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([
    800,
    600
  ]);
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  // === Background color ===
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(1, 0.98, 0.95)
  });
  // === Outer border (thin gold-like stroke effect) ===
  page.drawRectangle({
    x: 8,
    y: 8,
    width: width - 16,
    height: height - 16,
    borderColor: rgb(0.85, 0.65, 0.13),
    borderWidth: 6
  });
  // === Try to fetch & embed logo once (supports PNG/JPG) ===
  let embeddedLogo = null;
  try {
    const logoResp = await fetch(data.logoUrl);
    if (logoResp.ok) {
      const contentType = (logoResp.headers.get("content-type") || "").toLowerCase();
      const logoBytes = await logoResp.arrayBuffer();
      try {
        if (contentType.includes("png")) {
          embeddedLogo = await pdfDoc.embedPng(logoBytes);
        } else if (contentType.includes("jpeg") || contentType.includes("jpg")) {
          embeddedLogo = await pdfDoc.embedJpg(logoBytes);
        } else {
          // try png then jpg
          try {
            embeddedLogo = await pdfDoc.embedPng(logoBytes);
          } catch  {
            embeddedLogo = await pdfDoc.embedJpg(logoBytes);
          }
        }
      } catch (embedErr) {
        console.error("Error embedding logo image:", embedErr);
      }
    } else {
      console.error("Logo fetch failed, status:", logoResp.status);
    }
  } catch (err) {
    console.error("Logo fetch error:", err);
  }
  // === Watermark using the embedded logo (fallback to text watermark) ===
  if (embeddedLogo) {
    try {
      const wmMaxWidth = Math.min(340, width * 0.6);
      const wmHeight = embeddedLogo.height / embeddedLogo.width * wmMaxWidth;
      page.drawImage(embeddedLogo, {
        x: width / 2 - wmMaxWidth / 2,
        y: height / 2 - wmHeight / 2,
        width: wmMaxWidth,
        height: wmHeight,
        opacity: 0.08
      });
    } catch (e) {
      console.error("Failed to draw watermark image:", e);
      page.drawText("KMDA", {
        x: width / 2 - 100,
        y: height / 2,
        size: 80,
        font,
        color: rgb(0.9, 0.9, 0.9),
        opacity: 0.2
      });
    }
  } else {
    // fallback text watermark
    page.drawText("KMDA", {
      x: width / 2 - 100,
      y: height / 2,
      size: 80,
      font,
      color: rgb(0.9, 0.9, 0.9),
      opacity: 0.2
    });
  }
  // === Heading banner (lighter blue) ===
  const bannerHeight = 40;
  page.drawRectangle({
    x: 100,
    y: height - 180,
    width: width - 200,
    height: bannerHeight,
    color: rgb(0.3, 0.5, 0.85) // lighter blue
  });
  const heading = "KERALA MEDICAL DISTRIBUTORS ASSOCIATION (KMDA)";
  const headingSize = 16;
  const headingWidth = font.widthOfTextAtSize(heading, headingSize);
  page.drawText(heading, {
    x: width / 2 - headingWidth / 2,
    y: height - 170,
    size: headingSize,
    font,
    color: rgb(1, 1, 1)
  });
  // === Top logo (reuse embedded image if available) ===
  if (embeddedLogo) {
    try {
      const topLogoWidth = 90;
      const topLogoHeight = embeddedLogo.height / embeddedLogo.width * topLogoWidth;
      page.drawImage(embeddedLogo, {
        x: width / 2 - topLogoWidth / 2,
        y: height - topLogoHeight - 50,
        width: topLogoWidth,
        height: topLogoHeight
      });
    } catch (e) {
      console.error("Failed to draw top logo:", e);
    }
  }
  // === Certificate Title in golden box ===
  const title = "CERTIFICATE OF MEMBERSHIP";
  const titleSize = 24;
  const titleWidth = font.widthOfTextAtSize(title, titleSize);
  const boxPadding = 12;
  const boxWidth = titleWidth + boxPadding * 2;
  const boxHeight = titleSize + boxPadding;
  const boxX = width / 2 - boxWidth / 2;
  const boxY = height - 260;
  // white box with gold border
  page.drawRectangle({
    x: boxX,
    y: boxY,
    width: boxWidth,
    height: boxHeight,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.85, 0.65, 0.13),
    borderWidth: 2
  });
  page.drawText(title, {
    x: width / 2 - titleWidth / 2,
    y: boxY + (boxHeight - titleSize) / 2,
    size: titleSize,
    font,
    color: rgb(0, 0, 0)
  });
  // === Certificate Content ===
  const contentLines = [
    "This is to certify that",
    "",
    data.memberName,
    data.companyName,
    "",
    `from ${data.city}, ${data.district},`,
    "",
    "is a registered member of KMDA."
  ];
  let yPosition = height - 330;
  const lineHeight = 22;
  for (const line of contentLines){
    if (line.trim() === "") {
      yPosition -= lineHeight / 2;
      continue;
    }
    const lineWidth = font.widthOfTextAtSize(line, 14);
    page.drawText(line, {
      x: width / 2 - lineWidth / 2,
      y: yPosition,
      size: 14,
      font,
      color: rgb(0, 0, 0)
    });
    yPosition -= lineHeight;
  }
  // === Certificate details ===
  page.drawText(`Certificate No: ${data.certificateNumber}`, {
    x: 50,
    y: 100,
    size: 12,
    font,
    color: rgb(0, 0, 0)
  });
  page.drawText(`Issued: ${new Date(data.issueDate).toLocaleDateString()}`, {
    x: 50,
    y: 80,
    size: 12,
    font,
    color: rgb(0, 0, 0)
  });
  page.drawText(`Valid Until: ${new Date(data.validUntil).toLocaleDateString()}`, {
    x: 50,
    y: 60,
    size: 12,
    font,
    color: rgb(0, 0, 0)
  });
  // === Signature Image (bottom-right) ===
  try {
    const signUrl = "https://tlrtnjaxklleegwjyzxs.supabase.co/storage/v1/object/public/Signatures/kmda_signature.png";
    const signResp = await fetch(signUrl);
    if (signResp.ok) {
      const signBytes = await signResp.arrayBuffer();
      // try embedPng then embedJpg
      let signImage;
      try {
        signImage = await pdfDoc.embedPng(signBytes);
      } catch  {
        signImage = await pdfDoc.embedJpg(signBytes);
      }
      const signDims = signImage.scale(0.2);
      page.drawImage(signImage, {
        x: width - 220,
        y: 70,
        width: signDims.width,
        height: signDims.height
      });
      page.drawText("Anil Kumar", {
        x: width - 200,
        y: 55,
        size: 10,
        font,
        color: rgb(0, 0, 0)
      });
      page.drawText("State Secretary", {
        x: width - 200,
        y: 43,
        size: 10,
        font,
        color: rgb(0, 0, 0)
      });
    } else {
      console.error("Signature fetch failed:", signResp.status);
    }
  } catch (e) {
    console.error("Signature fetch error:", e);
  }
  // === Timestamp inside certificate ===
  const timestamp = new Date().toLocaleString();
  page.drawText(`Generated on: ${timestamp}`, {
    x: 50,
    y: 40,
    size: 8,
    font,
    color: rgb(0.4, 0.4, 0.4)
  });
  return await pdfDoc.save();
}
async function sendCertificateEmail(to, name, url) {
  const from = "KMDA Membership <noreply@kmda.in>";
  const subject = "Your KMDA Membership Certificate";
  const html = `
    <p>Dear ${name},</p>
    <p>Congratulations! Your KMDA Membership Certificate has been issued.</p>
    <p>You can view and download it using the link below:</p>
    <p><a href="${url}" target="_blank">Download Certificate</a></p>
    <p>Best regards,<br>KMDA Team</p>
  `;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html
    })
  });
}
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({
        error: "Only POST allowed"
      }), {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const { member_id, certificate_number, valid_until } = await req.json();
    if (!member_id || !certificate_number || !valid_until) {
      return new Response(JSON.stringify({
        error: "Missing required parameters"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // === Fetch member ===
    const { data: member, error: memberError } = await supabase.from("members").select("contact_person, company_name, district, city, email").eq("id", member_id).single();
    if (memberError || !member) {
      return new Response(JSON.stringify({
        error: "Member not found"
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // === Generate PDF ===
    const pdfBuffer = await generateCertificatePDF({
      certificateNumber: certificate_number,
      memberName: member.contact_person,
      companyName: member.company_name,
      district: member.district,
      city: member.city,
      issueDate: new Date().toISOString(),
      validUntil: valid_until,
      email: member.email,
      logoUrl: "https://tlrtnjaxklleegwjyzxs.supabase.co/storage/v1/object/public/Logos/LGOS.png"
    });
    // === Unique filename with timestamp ===
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filePath = `certificates/${certificate_number}_${timestamp}.pdf`;
    // === Upload PDF ===
    const { error: uploadError } = await supabase.storage.from("certificates").upload(filePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: false
    });
    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
    // === Get public URL ===
    const { data: publicUrlData, error: publicUrlError } = supabase.storage.from("certificates").getPublicUrl(filePath);
    if (publicUrlError) throw new Error(`Public URL retrieval failed: ${publicUrlError.message}`);
    const publicUrl = publicUrlData?.publicUrl;
    if (publicUrl && member.email) {
      await sendCertificateEmail(member.email, member.contact_person, publicUrl);
    }
    return new Response(JSON.stringify({
      success: true,
      certificate_url: publicUrl,
      path: filePath
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({
      error: err.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
