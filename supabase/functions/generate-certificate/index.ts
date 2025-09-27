import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://cdn.skypack.dev/pdf-lib";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Only POST allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { member_id, certificate_number, valid_until } = await req.json();

    if (!member_id || !certificate_number || !valid_until) {
      return new Response(JSON.stringify({ error: "Missing required parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("contact_person, company_name, district, city, email")
      .eq("id", member_id)
      .single();

    if (memberError || !member) {
      return new Response(JSON.stringify({ error: "Member not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

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

    const filePath = `certificates/${certificate_number}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("certificates")
      .upload(filePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from("certificates")
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData?.publicUrl || null;

    if (publicUrl && member.email) {
      await sendCertificateEmail(member.email, member.contact_person, publicUrl);
    }

    return new Response(JSON.stringify({
      success: true,
      certificate_url: publicUrl,
      path: filePath
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

async function sendCertificateEmail(to: string, name: string, url: string) {
  const from = "KMDA Membership <noreply@kmda.in>";
  const subject = "Your KMDA Membership Certificate";
  const html = `
    <p>Dear ${name},</p>
    <p>Congratulations! Your KMDA Membership Certificate has been issued.</p>
    <p>You can view and download it using the link below:</p>
    <p><a href="${url}" target="_blank">Download Certificate</a></p>
    <p>Best regards,<br>KMDA Team</p>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`
    },
    body: JSON.stringify({ from, to, subject, html })
  });

  if (!response.ok) {
    const errorBody = await response.json();
    console.error("Resend API Error:", errorBody);
  }
}

async function generateCertificatePDF(data: any) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([800, 600]);
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 0.98, 0.95) });

  try {
    const resp = await fetch(data.logoUrl);
    if (resp.ok) {
      const bytes = await resp.arrayBuffer();
      const embeddedLogo = await pdfDoc.embedPng(bytes);
      const logoWidth = 120;
      const logoHeight = (embeddedLogo.height / embeddedLogo.width) * logoWidth;
      page.drawImage(embeddedLogo, {
        x: width / 2 - logoWidth / 2,
        y: height - logoHeight - 40,
        width: logoWidth,
        height: logoHeight
      });
    }
  } catch {
    page.drawText("KMDA", {
      x: width / 2 - 30,
      y: height - 80,
      size: 24,
      font,
      color: rgb(0, 0.4, 0.8)
    });
  }

  const title = "Certificate of Membership";
  const titleSize = 24;
  const titleWidth = font.widthOfTextAtSize(title, titleSize);
  page.drawText(title, {
    x: width / 2 - titleWidth / 2,
    y: height - 200,
    size: titleSize,
    font,
    color: rgb(0, 0, 0)
  });

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

  let yPosition = height - 260;
  const lineHeight = 22;

  for (const line of contentLines) {
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

  page.drawLine({
    start: { x: width / 2 - 100, y: 40 },
    end: { x: width / 2 + 100, y: 40 },
    thickness: 1,
    color: rgb(0, 0, 0)
  });

  page.drawText("Authorized Signature", {
    x: width / 2 - 50,
    y: 25,
    size: 10,
    font,
    color: rgb(0.5, 0.5, 0.5)
  });

  return await pdfDoc.save();
}