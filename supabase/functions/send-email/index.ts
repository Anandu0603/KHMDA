import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, subject, html, pdfBase64, certificateNumber } = await req.json();

    const from = 'KMDA Membership <noreply@kmda.in>'; // ✅ must be verified in Resend

    // ✅ Build payload with optional attachment
    const body: any = {
      from,
      to,
      subject,
      html
    };

    if (pdfBase64 && certificateNumber) {
      body.attachments = [
        {
          filename: `KMDA_${certificateNumber}.pdf`,
          content: pdfBase64,
          type: 'application/pdf'
        }
      ];
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(`Resend API Error: ${JSON.stringify(errorBody)}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
