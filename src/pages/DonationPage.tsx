import React, { useState, useEffect } from 'react';
import { IndianRupee, MessageSquare, Phone, Mail, User, AlertTriangle, Loader2 } from 'lucide-react';
import Logo from '../components/Logo';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function DonationPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(''); // Optional
  const [amount, setAmount] = useState<string>('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string }>({});
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    // Preload Razorpay script for faster checkout
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  const validate = () => {
    const newErrors: { amount?: string } = {};
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) newErrors.amount = 'Please enter a valid amount (> 0)';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);
    if (!validate()) return;
    setSubmitting(true);

    try {
      // Ensure Razorpay is loaded
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          script.onload = resolve;
          script.onerror = () => reject(new Error('Failed to load Razorpay script'));
          document.head.appendChild(script);
        });
      }

      const rupees = parseFloat(amount);
      const paise = Math.round(rupees * 100);

      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
        body: { amount: paise },
      });

      if (orderError) {
        let message = orderError.message || 'Failed to create order';
        try {
          const ctx: any = (orderError as any).context;
          if (ctx && typeof ctx.json === 'function') {
            const body = await ctx.json();
            if (body?.error) message = body.error;
          }
        } catch {}
        throw new Error(message);
      }

      const { order_id } = orderData || {};
      if (!order_id) throw new Error('Could not get a valid order id');

      // Create pending donation record
      const { data: donationData, error: donationError } = await supabase
        .from('donations')
        .insert({
          donor_name: name || null,
          phone: phone || null,
          email: email || null,
          amount: rupees,
          remarks: remarks || null,
          status: 'pending',
          razorpay_order_id: order_id,
        })
        .select('id')
        .single();

      if (donationError) {
        console.error('Failed to create donation record:', donationError);
        // Continue with payment even if insert fails, as it's best-effort
      }

      const donationId = donationData?.id || null;

      const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;
      if (!keyId) throw new Error('API keys are not configured: VITE_RAZORPAY_KEY_ID missing');

      const options: any = {
        key: keyId,
        amount: paise,
        currency: 'INR',
        name: 'KMDA Donation',
        description: 'Voluntary Donation',
        order_id,
        prefill: {
          name: name || undefined,
          email: email || undefined,
          contact: phone || undefined,
        },
        notes: {
          remarks: remarks || '',
        },
        theme: { color: '#047857' },
        handler: async (response: any) => {
          try {
            const { data: verificationData, error: verificationError } = await supabase.functions.invoke('verify-razorpay-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                donation_id: donationId,
                // Public donation details for server-side persistence (fallback if no donation_id)
                donor_name: name || null,
                phone: phone || null,
                email: email || null,
                amount: rupees,
                remarks: remarks || null,
              },
            });
  
            if (verificationError || !verificationData || verificationData.status !== 'success') {
              let detailed = verificationError?.message || 'Payment verification failed';
              try {
                const ctx: any = (verificationError as any)?.context;
                if (ctx && typeof ctx.json === 'function') {
                  const body = await ctx.json();
                  if (body?.error) detailed = body.error;
                }
              } catch {}
              throw new Error(detailed);
            }
  
            navigate('/donation/success', { state: { amount: rupees, donorName: name } });
          } catch (err: any) {
            navigate('/donation/cancel', { state: { error: err.message, amount: rupees } });
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        navigate('/donation/cancel', {
          state: {
            error: response?.error?.description || 'Payment failed',
            amount: rupees,
          },
        });
      });

      rzp.open();
    } catch (err: any) {
      setErrorText(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="text-center">
          <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4 p-1">
            <Logo className="w-12 h-12 text-emerald-700" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Make a Donation</h1>
          <p className="mt-4 text-gray-600">Support KMDA initiatives. Provide your details and amount to proceed.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6 bg-gray-50 rounded-xl p-6">
          {errorText && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
              <p className="text-sm text-red-800">{errorText}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </span>
                <input
                  type="text"
                  className="pl-9 py-3 px-3 block w-full focus:ring-emerald-500 focus:border-emerald-500 border-gray-300 rounded-md"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-gray-400" />
                </span>
                <input
                  type="tel"
                  className="pl-9 py-3 px-3 block w-full focus:ring-emerald-500 focus:border-emerald-500 border-gray-300 rounded-md"
                  placeholder="e.g. 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Email (optional)</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </span>
                <input
                  type="email"
                  className="pl-9 py-3 px-3 block w-full focus:ring-emerald-500 focus:border-emerald-500 border-gray-300 rounded-md"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Email helps us send you a receipt.</p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Amount (INR)</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IndianRupee className="h-4 w-4 text-gray-400" />
                </span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  className={`pl-9 py-3 px-3 block w-full focus:ring-emerald-500 focus:border-emerald-500 border rounded-md ${errors.amount ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Remarks</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <span className="absolute top-3 left-3 pointer-events-none">
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                </span>
                <textarea
                  rows={4}
                  className="pl-9 py-3 px-3 block w-full focus:ring-emerald-500 focus:border-emerald-500 border-gray-300 rounded-md"
                  placeholder="Optional remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-md text-white bg-emerald-700 hover:bg-emerald-800 transition-colors ${submitting ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {submitting ? (
                <span className="inline-flex items-center"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Processing...</span>
              ) : (
                'Proceed to Pay'
              )}
            </button>
            <p className="mt-3 text-xs text-gray-500 text-center">Email is non-compulsory. Amount is required.</p>
          </div>
        </form>
      </div>
    </div>
  );
}
