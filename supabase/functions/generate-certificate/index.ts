import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
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
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Add a page
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();

    // Background color
    page.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: height,
      color: rgb(0.95, 0.95, 0.95),
    });

    // Title
    page.drawText('KERALA MEDICAL DISTRIBUTORS ASSOCIATION', {
      x: 50,
      y: height - 100,
      size: 24,
      font: font,
      color: rgb(0.02, 0.78, 0.55), // Emerald color
    });

    page.drawText('MEMBERSHIP CERTIFICATE', {
      x: 50,
      y: height - 130,
      size: 18,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Certificate number
    page.drawText(`Certificate No: ${data.certificateNumber}`, {
      x: 50,
      y: height - 160,
      size: 12,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Main content
    const textY = height - 220;
    page.drawText('This is to certify that', {
      x: 50,
      y: textY,
      size: 14,
      font: regularFont,
      color: rgb(0, 0, 0),
    });

    page.drawText(`${data.memberName}`, {
      x: 50,
      y: textY - 25,
      size: 16,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`of ${data.companyName}`, {
      x: 50,
      y: textY - 50,
      size: 14,
      font: regularFont,
      color: rgb(0, 0, 0),
    });

    page.drawText(`from ${data.city}, ${data.district} District, Kerala`, {
      x: 50,
      y: textY - 75,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    });

    // Membership details
    page.drawText('has been admitted as a Member of the', {
      x: 50,
      y: textY - 110,
      size: 14,
      font: regularFont,
      color: rgb(0, 0, 0),
    });

    page.drawText('KERALA MEDICAL DISTRIBUTORS ASSOCIATION (KMDA)', {
      x: 50,
      y: textY - 135,
      size: 14,
      font: font,
      color: rgb(0.02, 0.78, 0.55),
    });

    // Validity period
    const issueDate = new Date(data.issueDate);
    const validUntilDate = new Date(data.validUntil);
    
    page.drawText('This membership is valid from', {
      x: 50,
      y: textY - 170,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    });

    page.drawText(`${issueDate.toLocaleDateString('en-IN')} to ${validUntilDate.toLocaleDateString('en-IN')}`, {
      x: 50,
      y: textY - 195,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Contact information
    page.drawText(`Email: ${data.email}`, {
      x: 50,
      y: textY - 230,
      size: 10,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Footer
    page.drawText('Issued by KMDA Administration', {
      x: 50,
      y: 80,
      size: 10,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    page.drawText(`Date of Issue: ${issueDate.toLocaleDateString('en-IN')}`, {
      x: 50,
      y: 60,
      size: 10,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Decorative line
    page.drawLine({
      start: { x: 50, y: height - 250 },
      end: { x: width - 50, y: height - 250 },
      thickness: 1,
      color: rgb(0.02, 0.78, 0.55),
    });

    // Serialize the PDF
    const pdfBytes = await pdfDoc.save();

    return pdfBytes;

  } catch (error) {
    throw new Error(`Failed to generate PDF certificate: ${error.message}`);
  }
}
