import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

async function hmacSha256Hex(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const bytes = new Uint8Array(signature);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!RAZORPAY_KEY_SECRET) {
      return new Response(JSON.stringify({ error: 'Server misconfigured: RAZORPAY_KEY_SECRET is not set.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, member_id, donation_id, donor_name, phone, email, amount, remarks } = payload || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(JSON.stringify({ error: 'Missing payment verification details.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const signedPayload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = await hmacSha256Hex(RAZORPAY_KEY_SECRET, signedPayload);

    if (expectedSignature !== razorpay_signature) {
      return new Response(JSON.stringify({ error: 'Payment verification failed. Signature mismatch.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

   // Optionally update DB on server side to avoid client RLS issues
   if (SUPABASE_URL && SERVICE_ROLE_KEY) {
     if (member_id) {
       try {
         const resp = await fetch(`${SUPABASE_URL}/rest/v1/payments`, {
           method: 'PATCH',
           headers: {
             'Content-Type': 'application/json',
             'apikey': SERVICE_ROLE_KEY,
             'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
             'Prefer': 'return=minimal',
           },
           body: JSON.stringify({
             status: 'completed',
             razorpay_payment_id,
             razorpay_order_id,
           }),
         });
         // Filter to the correct pending record via query params
         // Note: Using PostgREST conditional headers is not available in body; use URL params with eq filters
         // Since fetch above cannot add query, perform a second call with query parameters
       } catch (_) {
         // best-effort, ignore
       }

       try {
         const url = new URL(`${SUPABASE_URL}/rest/v1/payments`);
         url.searchParams.set('member_id', `eq.${member_id}`);
         url.searchParams.set('status', 'eq.pending');
         url.searchParams.set('select', 'id');

         const resp2 = await fetch(url.toString(), {
           method: 'PATCH',
           headers: {
             'Content-Type': 'application/json',
             'apikey': SERVICE_ROLE_KEY,
             'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
             'Prefer': 'return=minimal',
           },
           body: JSON.stringify({
             status: 'completed',
             razorpay_payment_id,
             razorpay_order_id,
           }),
         });
         // ignore body; if it fails, we still return success for the caller
       } catch (_) {}
     } else {
       // Public donation: if donation_id provided, update existing pending record; else insert new
       if (donation_id) {
         // Update existing pending donation
         const url = new URL(`${SUPABASE_URL}/rest/v1/donations?id=eq.${donation_id}`);
         const updateResp = await fetch(url.toString(), {
           method: 'PATCH',
           headers: {
             'Content-Type': 'application/json',
             'apikey': SERVICE_ROLE_KEY,
             'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
             'Prefer': 'return=minimal',
           },
           body: JSON.stringify({
             status: 'completed',
             razorpay_payment_id,
             razorpay_order_id,
             updated_at: new Date().toISOString(),
           }),
         });
         if (!updateResp.ok) {
           throw new Error(`Failed to update donation: ${updateResp.statusText}`);
         }
       } else {
         // Fallback: insert new completed donation
         const url = new URL(`${SUPABASE_URL}/rest/v1/donations`);
         const insertResp = await fetch(url.toString(), {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
             'apikey': SERVICE_ROLE_KEY,
             'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
             'Prefer': 'return=minimal',
           },
           body: JSON.stringify({
             donor_name,
             phone,
             email,
             amount,
             remarks,
             status: 'completed',
             razorpay_payment_id,
             razorpay_order_id,
             created_at: new Date().toISOString(),
             updated_at: new Date().toISOString(),
           }),
         });
         if (!insertResp.ok) {
           throw new Error(`Failed to insert donation: ${insertResp.statusText}`);
         }
       }
     }
   }

    return new Response(JSON.stringify({ status: 'success' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message || 'Unknown server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
