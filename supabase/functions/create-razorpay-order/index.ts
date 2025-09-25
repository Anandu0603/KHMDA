import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Crucial check for environment variables
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay API keys are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your current upabase project secrets for Edge Functions.');
    }

    const { amount } = await req.json();
    if (!amount || amount < 100) { // Razorpay minimum is 1 INR (100 paise)
      throw new Error('Invalid amount. Amount must be at least 1 INR.');
    }

    const orderOptions = {
      amount: amount,
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
    };

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(RAZORPAY_KEY_ID + ':' + RAZORPAY_KEY_SECRET)}`,
      },
      body: JSON.stringify(orderOptions),
    });

    const responseBody = await response.json();

    if (!response.ok) {
      const errorMessage = responseBody?.error?.description || 'Failed to create Razorpay order.';
      throw new Error(`Razorpay API Error: ${errorMessage}`);
    }

    return new Response(JSON.stringify({ order_id: responseBody.id }), {
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
