import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SENDER_EMAIL = Deno.env.get('SENDER_EMAIL') || 'KMDA Membership <noreply@kmda.org>';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Crucial check for environment variable
    if (!RESEND_API_KEY) {
      throw new Error('Resend API key is not configured. Please set RESEND_API_KEY in your Supabase project secrets for Edge Functions.');
    }

    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      throw new Error('Missing required email parameters: to, subject, or html.');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: SENDER_EMAIL,
        to: to,
        subject: subject,
        html: html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Resend API Error: ${data?.message || 'Failed to send email.'}`);
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
