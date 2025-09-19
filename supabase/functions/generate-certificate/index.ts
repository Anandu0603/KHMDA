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
      email: member.email
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
}): Promise<Uint8Array> {
  try {
    // Import pdf-lib
    const pdfLib = await import('https://esm.sh/pdf-lib@1.17.1');
    const { PDFDocument, StandardFonts, rgb } = pdfLib;

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Add a page (A4)
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

    // Background - cream/off-white
    page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 0.98, 0.95) });

    // Border - gold
    const borderColor = rgb(1, 0.84, 0);
    page.drawRectangle({
      x: 20, y: 20, width: width - 40, height: height - 40,
      color: borderColor, opacity: 0.1
    });
    page.drawRectangle({
      x: 20, y: 20, width: width - 40, height: 5,
      color: borderColor
    });
    page.drawRectangle({
      x: 20, y: height - 25, width: width - 40, height: 5,
      color: borderColor
    });
    page.drawRectangle({
      x: 20, y: 20, width: 5, height: height - 40,
      color: borderColor
    });
    page.drawRectangle({
      x: width - 25, y: 20, width: 5, height: height - 40,
      color: borderColor
    });

    // Header with blue color
    const blueColor = rgb(0, 0.4, 0.8);
    const title1 = 'KERALA MEDICAL DISTRIBUTORS ASSOCIATION';
    const title2 = '(KMDA)';
    const title3 = 'CERTIFICATE OF REGISTRATION';

    // Association logo - simple medical cross
    page.drawRectangle({
      x: 80, y: height - 70, width: 30, height: 30,
      color: blueColor
    });
    const whiteColor = rgb(1, 1, 1);
    page.drawLine({
      start: { x: 95, y: height - 85 }, end: { x: 95, y: height - 55 },
      thickness: 4, color: whiteColor
    });
    page.drawLine({
      start: { x: 65, y: height - 70 }, end: { x: 125, y: height - 70 },
      thickness: 4, color: whiteColor
    });

    page.drawText(title1, {
      x: centerX(title1, 22, boldFont),
      y: height - 80,
      size: 22,
      font: boldFont,
      color: blueColor,
    });

    page.drawText(title2, {
      x: centerX(title2, 14, regularFont),
      y: height - 105,
      size: 14,
      font: regularFont,
      color: blueColor,
    });

    page.drawText(title3, {
      x: centerX(title3, 18, boldFont),
      y: height - 130,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Decorative divider - blue ribbon style
    page.drawRectangle({
      x: 60, y: height - 145, width: width - 120, height: 8,
      color: blueColor, opacity: 0.8
    });
    page.drawRectangle({
      x: 60, y: height - 147, width: width - 120, height: 4,
      color: rgb(1, 1, 1), opacity: 0.9
    });

    // Body
    const line1 = 'This is to certify that';
    page.drawText(line1, {
      x: centerX(line1, 14, regularFont),
      y: height - 175,
      size: 14,
      font: regularFont,
      color: rgb(0, 0, 0),
    });

    // Company name with bullet
    const companySize = 16;
    const companyText = data.companyName;
    const companyTextWidth = boldFont.widthOfTextAtSize(companyText, companySize);
    const companyX = (width - companyTextWidth) / 2;
    // Blue diamond/circle bullet
    page.drawCircle({ x: companyX - 10, y: height - 231, size: 4, color: blueColor });
    page.drawText(companyText, {
      x: companyX,
      y: height - 235,
      size: companySize,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    const line2 = 'is a registered member of the KMDA';
    page.drawText(line2, {
      x: centerX(line2, 14, regularFont),
      y: height - 265,
      size: 14,
      font: regularFont,
      color: rgb(0, 0, 0),
    });

    // Registration details with blue banners
    page.drawRectangle({
      x: 100, y: height - 285, width: width - 200, height: 20,
      color: blueColor, opacity: 0.1
    });
    const regText = `Registration Number: ${data.certificateNumber}`;
    page.drawText(regText, {
      x: centerX(regText, 12, regularFont),
      y: height - 300,
      size: 12,
      font: regularFont,
      color: blueColor,
    });

    // Dates with ribbon banners
    const doi = `Date of Issue: ${formatLongDate(data.issueDate)}`;
    const doe = `Expiry Date: ${formatLongDate(data.validUntil)}`;
    
    // Issue date banner
    page.drawRectangle({
      x: 80, y: height - 320, width: width - 160, height: 18,
      color: borderColor, opacity: 0.3
    });
    page.drawText(doi, {
      x: centerX(doi, 12, regularFont),
      y: height - 325,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    });
    
    // Expiry date banner
    page.drawRectangle({
      x: 80, y: height - 350, width: width - 160, height: 18,
      color: borderColor, opacity: 0.3
    });
    page.drawText(doe, {
      x: centerX(doe, 12, regularFont),
      y: height - 345,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    });

    // Paragraph
    const p1 = 'This certificate confirms the validity of';
    const p2 = 'membership and all associated rights and';
    const p3 = 'privileges until the expiry date.';
    page.drawText(p1, { x: centerX(p1, 12, regularFont), y: height - 380, size: 12, font: regularFont, color: rgb(0,0,0) });
    page.drawText(p2, { x: centerX(p2, 12, regularFont), y: height - 400, size: 12, font: regularFont, color: rgb(0,0,0) });
    page.drawText(p3, { x: centerX(p3, 12, regularFont), y: height - 420, size: 12, font: regularFont, color: rgb(0,0,0) });

    // Seals and signature
    // Left seal - KMDA logo
    page.drawCircle({
      x: 120, y: 120, size: 40,
      color: blueColor, opacity: 0.2
    });
    page.drawText('KMDA', {
      x: 120, y: 125,
      size: 10, font: boldFont, color: blueColor
    });

    // Right seal
    page.drawCircle({
      x: width - 120, y: 120, size: 40,
      color: borderColor, opacity: 0.3
    });
    page.drawText('SEAL', {
      x: width - 120, y: 125,
      size: 8, font: regularFont, color: rgb(0,0,0)
    });

    // Signature line
    const sigY = 100;
    const lineWidth = 220;
    const lineStartX = (width - lineWidth) / 2;
    page.drawLine({ start: { x: lineStartX, y: sigY }, end: { x: lineStartX + lineWidth, y: sigY }, thickness: 1, color: rgb(0, 0, 0) });
    const sigText = 'President, KMDA';
    page.drawText(sigText, { x: centerX(sigText, 12, regularFont), y: sigY - 18, size: 12, font: regularFont, color: rgb(0, 0, 0) });

    // Date below signature
    const sigDate = `Date: ${formatLongDate(data.issueDate)}`;
    page.drawText(sigDate, { x: centerX(sigDate, 10, regularFont), y: sigY - 35, size: 10, font: regularFont, color: rgb(0.3, 0.3, 0.3) });

    // Serialize the PDF
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (error) {
    throw new Error(`Failed to generate PDF certificate: ${error.message}`);
  }
}
