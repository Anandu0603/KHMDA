import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// Inlined CORS headers to avoid external _shared dependency in Dashboard deployments
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Initialize Supabase client with service role key
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Only POST method allowed');
    }

    const { member_id, certificate_number, valid_until } = await req.json();

    if (!member_id || !certificate_number || !valid_until) {
      throw new Error('Missing required parameters: member_id, certificate_number, valid_until');
    }

    // Fetch member details
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('company_name, contact_person, email, district, city, created_at')
      .eq('id', member_id)
      .single();

    if (memberError || !member) {
      throw new Error(`Member not found: ${memberError?.message || 'Unknown error'}`);
    }

    // Generate PDF certificate
    const pdfBuffer = await generateCertificatePDF({
      certificateNumber: certificate_number,
      memberName: member.contact_person,
      companyName: member.company_name,
      district: member.district,
      city: member.city,
      issueDate: new Date().toISOString(),
      validUntil: valid_until,
      email: member.email,
      logoUrl: 'https://i.ibb.co/h1FQZp7q/kmdalogo.png'
    });

    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `certificates/${certificate_number}_${timestamp}.pdf`;
    
    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Failed to upload certificate: ${uploadError.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('certificates')
      .getPublicUrl(fileName);

    const pdfUrl = publicUrlData.publicUrl;

    // Insert into certificates table
    const { error: dbError } = await supabase
      .from('certificates')
      .insert({
        member_id: member_id,
        certificate_number: certificate_number,
        valid_until: valid_until,
        pdf_url: pdfUrl,
        generated_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Failed to insert certificate record:', dbError);
      // Continue even if DB insert fails, PDF is generated
    }

    // Send email with certificate link
    console.log('Attempting to send certificate email to:', member.email);
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2d3748; text-align: center;">Your KMDA Membership Certificate</h2>
        <p>Dear ${member.contact_person},</p>
        <p>Your membership certificate for <strong>${member.company_name}</strong> has been generated successfully.</p>
        <p><strong>Certificate Number:</strong> ${certificate_number}</p>
        <p><strong>Valid Until:</strong> ${new Date(valid_until).toLocaleDateString('en-IN')}</p>
        <p>Download your certificate here: <a href="${pdfUrl}" style="color: #3182ce; text-decoration: none; font-weight: bold;">View/Download Certificate</a></p>
        <p style="margin-top: 20px;">If the link doesn't work, you can access it from your member profile in the KMDA portal.</p>
        <p>Best regards,<br/>Kerala Medical Distributors Association (KMDA)</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="font-size: 12px; color: #718096; text-align: center;">This is an automated message. Please do not reply.</p>
      </div>
    `

    const emailPayload = {
      to: member.email,
      subject: `KMDA Membership Certificate - ${certificate_number}`,
      html: emailBody
    };

    const { data: emailData, error: emailError } = await supabase.functions.invoke('send-email', {
      body: emailPayload
    });

    console.log('Email invoke result:', { data: emailData, error: emailError });

    if (emailError) {
      console.error('Failed to send certificate email to', member.email, ':', emailError);
      // Don't fail the response; certificate is still generated and uploaded
    } else {
      console.log('Certificate email sent successfully to:', member.email);
    }

    return new Response(
      JSON.stringify({
        success: true,
        certificate_url: pdfUrl,
        certificate_number: certificate_number
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

// PDF Generation using pdf-lib
async function generateCertificatePDF(data: {
  certificateNumber: string;
  memberName: string;
  companyName: string;
  district: string;
  city: string;
  issueDate: string;
  validUntil: string;
  email: string;
  logoUrl?: string;
}): Promise<Uint8Array> {
  try {
    const pdfLib = await import('https://esm.sh/pdf-lib@1.17.1');
    const { PDFDocument, StandardFonts, rgb } = pdfLib;

    const pdfDoc = await PDFDocument.create();
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();

    // Helpers
    const centerX = (text: string, size: number, font = regularFont) =>
      (width - font.widthOfTextAtSize(text, size)) / 2;

    const formatLongDate = (iso: string) =>
      new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

    // Background
    page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 0.98, 0.95) });

    // Border - gold (subtle, using separate rectangles as pdf-lib doesn't support borders directly)
    const borderColor = rgb(1, 0.84, 0);
    page.drawRectangle({ x: 20, y: 20, width: width - 40, height: height - 40, color: borderColor, opacity: 0.08 });
    page.drawRectangle({ x: 20, y: 20, width: width - 40, height: 5, color: borderColor });
    page.drawRectangle({ x: 20, y: height - 25, width: width - 40, height: 5, color: borderColor });
    page.drawRectangle({ x: 20, y: 20, width: 5, height: height - 40, color: borderColor });
    page.drawRectangle({ x: width - 25, y: 20, width: 5, height: height - 40, color: borderColor });

    // Colors
    const blueColor = rgb(0, 0.4, 0.8);
    const whiteColor = rgb(1, 1, 1);

    // Logo - positioned higher with more margin from top
    let embeddedLogo = null;
    let logoHeight = 60; // Default for fallback
    try {
      const resp = await fetch(data.logoUrl || 'https://i.ibb.co/h1FQZp7q/kmdalogo.png');
      if (resp.ok) {
        const contentType = resp.headers.get('content-type') || '';
        const bytes = await resp.arrayBuffer();
        if (contentType.includes('png')) {
          embeddedLogo = await pdfDoc.embedPng(bytes);
        } else {
          embeddedLogo = await pdfDoc.embedJpg(bytes);
        }
        if (embeddedLogo) {
          logoHeight = (embeddedLogo.height / embeddedLogo.width) * 60;
        }
      }
    } catch (err) {
      console.warn('Logo embed error:', err);
    }

    const logoTopMargin = 40; // Increased margin from top
    const logoTopY = height - logoTopMargin;
    const logoY = logoTopY - logoHeight;
    if (embeddedLogo) {
      page.drawImage(embeddedLogo, {
        x: 80,
        y: logoY,
        width: 60,
        height: logoHeight,
      });
    } else {
      // Fallback placeholder, fixed size
      const fallbackHeight = 30;
      page.drawRectangle({ x: 80, y: logoTopY - fallbackHeight, width: 30, height: fallbackHeight, color: blueColor });
      page.drawLine({ start: { x: 95, y: logoTopY - 15 }, end: { x: 95, y: logoTopY + 15 }, thickness: 4, color: whiteColor });
      page.drawLine({ start: { x: 65, y: logoTopY - fallbackHeight / 2 }, end: { x: 125, y: logoTopY - fallbackHeight / 2 }, thickness: 4, color: whiteColor });
      logoHeight = fallbackHeight;
    }

    // Header text - positioned well below logo with larger buffer
    const headerBuffer = 30; // Increased buffer
    const title1Y = logoY - headerBuffer;
    page.drawText('KERALA MEDICAL DISTRIBUTORS ASSOCIATION', {
      x: centerX('KERALA MEDICAL DISTRIBUTORS ASSOCIATION', 22, boldFont),
      y: title1Y,
      size: 22,
      font: boldFont,
      color: blueColor,
    });
    page.drawText('(KMDA)', {
      x: centerX('(KMDA)', 14, regularFont),
      y: title1Y - 25,
      size: 14,
      font: regularFont,
      color: blueColor,
    });
    page.drawText('CERTIFICATE OF REGISTRATION', {
      x: centerX('CERTIFICATE OF REGISTRATION', 18, boldFont),
      y: title1Y - 50,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Decorative divider - below titles with space
    const dividerY = title1Y - 70;
    page.drawRectangle({
      x: 60,
      y: dividerY,
      width: width - 120,
      height: 8,
      color: blueColor,
      opacity: 0.8,
    });
    page.drawRectangle({
      x: 60,
      y: dividerY - 2,
      width: width - 120,
      height: 4,
      color: whiteColor,
      opacity: 0.9,
    });

    // Start body text - more space below divider
    let curY = dividerY - 50;
    const lineGap = 28; // Adjusted for better spacing

    const drawCenteredLine = (text: string, size: number, font = regularFont, color = rgb(0, 0, 0)) => {
      page.drawText(text, {
        x: centerX(text, size, font),
        y: curY,
        size,
        font,
        color,
      });
      curY -= lineGap;
    };

    // Body
    drawCenteredLine('This is to certify that', 14);

    // Name with bullet - on next line
    const nameText = data.companyName || data.memberName || '—';
    const nameSize = 16;
    const nameWidth = boldFont.widthOfTextAtSize(nameText, nameSize);
    const nameX = (width - nameWidth) / 2;
    page.drawCircle({ x: nameX - 12, y: curY + 5, size: 5, color: blueColor });
    page.drawText(nameText, { x: nameX, y: curY, size: nameSize, font: boldFont, color: rgb(0, 0, 0) });
    curY -= lineGap;

    drawCenteredLine('is a registered member of the KMDA', 14);

    // Registration number - with small gap
    const regBoxWidth = width - 200;
    const regBoxX = (width - regBoxWidth) / 2;
    page.drawRectangle({ x: regBoxX, y: curY - 8, width: regBoxWidth, height: 22, color: blueColor, opacity: 0.08 });
    const regText = `Registration Number: ${data.certificateNumber || 'N/A'}`;
    page.drawText(regText, { x: centerX(regText, 12, regularFont), y: curY - 2, size: 12, font: regularFont, color: blueColor });
    curY -= lineGap;

    // Issue Date
    const doi = `Date of Issue: ${formatLongDate(data.issueDate || new Date().toISOString())}`;
    page.drawRectangle({ x: regBoxX, y: curY - 8, width: regBoxWidth, height: 20, color: borderColor, opacity: 0.2 });
    page.drawText(doi, { x: centerX(doi, 12, regularFont), y: curY - 2, size: 12, font: regularFont, color: rgb(0, 0, 0) });
    curY -= lineGap;

    // Expiry Date
    const doe = `Expiry Date: ${formatLongDate(data.validUntil)}`;
    page.drawRectangle({ x: regBoxX, y: curY - 8, width: regBoxWidth, height: 20, color: borderColor, opacity: 0.2 });
    page.drawText(doe, { x: centerX(doe, 12, regularFont), y: curY - 2, size: 12, font: regularFont, color: rgb(0, 0, 0) });
    curY -= lineGap;

    // Paragraph - use smaller gap for lines
    const paraGap = 18;
    const p1 = 'This certificate confirms the validity of';
    page.drawText(p1, { x: centerX(p1, 12, regularFont), y: curY, size: 12, font: regularFont, color: rgb(0, 0, 0) });
    curY -= paraGap;
    const p2 = 'membership and all associated rights and';
    page.drawText(p2, { x: centerX(p2, 12, regularFont), y: curY, size: 12, font: regularFont, color: rgb(0, 0, 0) });
    curY -= paraGap;
    const p3 = 'privileges until the expiry date.';
    page.drawText(p3, { x: centerX(p3, 12, regularFont), y: curY, size: 12, font: regularFont, color: rgb(0, 0, 0) });

    // Seals - fixed positions
    page.drawCircle({ x: 120, y: 120, size: 40, color: blueColor, opacity: 0.18 });
    page.drawText('KMDA', { x: 120 - boldFont.widthOfTextAtSize('KMDA', 10) / 2, y: 125, size: 10, font: boldFont, color: blueColor });

    page.drawCircle({ x: width - 120, y: 120, size: 40, color: borderColor, opacity: 0.28 });
    page.drawText('SEAL', { x: width - 120 - regularFont.widthOfTextAtSize('SEAL', 8) / 2, y: 125, size: 8, font: regularFont, color: rgb(0, 0, 0) });

    // Signature - fixed
    const sigY = 100;
    const sigLineWidth = 220;
    const sigX = (width - sigLineWidth) / 2;
    page.drawLine({ start: { x: sigX, y: sigY }, end: { x: sigX + sigLineWidth, y: sigY }, thickness: 1, color: rgb(0, 0, 0) });
    page.drawText('President, KMDA', { x: centerX('President, KMDA', 12), y: sigY - 18, size: 12, font: regularFont, color: rgb(0, 0, 0) });
    const sigDate = `Date: ${formatLongDate(data.issueDate || new Date().toISOString())}`;
    page.drawText(sigDate, { x: centerX(sigDate, 10), y: sigY - 35, size: 10, font: regularFont, color: rgb(0.3, 0.3, 0.3) });

    return await pdfDoc.save();
  } catch (error) {
    throw new Error(`Failed to generate PDF certificate: ${error.message}`);
  }
}
