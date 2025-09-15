import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CreditCard, Shield, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

interface PaymentData {
  memberId: string;
  amount: number;
  membershipFee: number;
  gatewayCharges: number;
  donationAmount: number;
  companyName: string;
  contactPerson: string;
  email: string;
  mobile: string;
  isRenewal?: boolean;
}

export default function RazorpayPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [statusText, setStatusText] = useState('Initiating Secure Payment...');
  const [errorState, setErrorState] = useState<string | null>(null);

  useEffect(() => {
    const data = location.state as PaymentData | undefined;
    
    if (data && Object.keys(data).length > 0) {
      setPaymentData(data);
    } else {
      const storedData = sessionStorage.getItem('paymentData');
      if (storedData) {
        setPaymentData(JSON.parse(storedData));
      } else {
        addToast('Invalid payment session. Please start over.', 'error');
        navigate('/register');
      }
    }
  }, [location.state, navigate, addToast]);

  useEffect(() => {
    if (paymentData) {
      initiatePayment();
    }
  }, [paymentData]);

  const initiatePayment = async () => {
    if (!paymentData) return;

    setLoading(true);
    setErrorState(null);

    try {
      // Check if Razorpay script is loaded
      if (!window.Razorpay) {
        // Dynamically load Razorpay script if not present
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          console.log('Razorpay script loaded successfully');
          // Retry payment initiation
          setTimeout(() => initiatePayment(), 500);
        };
        script.onerror = () => {
          throw new Error('Failed to load Razorpay checkout script. Please check your internet connection.');
        };
        document.head.appendChild(script);
        return; // Exit and wait for script to load
      }

      setStatusText('Creating secure payment order...');
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
        body: { amount: Math.round(paymentData.amount * 100) },
      });

      if (orderError) {
        let detailedError = orderError.message;
        if (orderError.context && typeof orderError.context.json === 'function') {
            try {
                const errorBody = await orderError.context.json();
                if (errorBody.error) detailedError = errorBody.error;
            } catch (e) { /* fallback */ }
        }
        throw new Error(detailedError);
      }
      
      const { order_id } = orderData;
      
      if (!order_id) {
        throw new Error('Failed to get a valid order_id from the server.');
      }

      setStatusText('Redirecting to Razorpay...');

      const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;
      if (!keyId) {
        throw new Error('API keys are not configured: VITE_RAZORPAY_KEY_ID is missing in your .env file.');
      }

      const options = {
        key: keyId,
        amount: Math.round(paymentData.amount * 100),
        currency: 'INR',
        name: 'KMDA Membership',
        description: paymentData.isRenewal ? 'Membership Renewal' : 'New Member Registration',
        order_id: order_id,
        handler: async (response: any) => {
          try {
            console.log('Payment successful, verifying...', response);
            
            const { data: verificationData, error: verificationError } = await supabase.functions.invoke('verify-razorpay-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                member_id: paymentData.memberId,
              },
            });

            if (verificationError || !verificationData || verificationData.status !== 'success') {
              let detailedVerificationError = 'Payment verification failed on server.';
              if (verificationError) {
                detailedVerificationError = verificationError.message || detailedVerificationError;
                // Try to read body from context for more details
                const ctx: any = (verificationError as any).context;
                if (ctx && typeof ctx.json === 'function') {
                  try {
                    const body = await ctx.json();
                    if (body?.error) detailedVerificationError = body.error;
                  } catch {}
                }
              } else if (verificationData?.error) {
                detailedVerificationError = verificationData.error;
              }
              console.error('Verification error:', verificationError, verificationData);
              throw new Error(detailedVerificationError);
            }

            console.log('Payment verified successfully');
            // Database updates are handled server-side in the verification function
            
            // Clear session storage
            sessionStorage.removeItem('paymentData');
            
            addToast('Payment successful! Processing your application...', 'success');
            
            navigate('/payment/success', {
              state: {
                memberId: paymentData!.memberId,
                amount: paymentData!.amount,
                companyName: paymentData!.companyName,
                isRenewal: paymentData!.isRenewal
              }
            });
          } catch (error: any) {
            console.error('Payment handler error:', error);
            addToast(`Payment processing failed: ${error.message}`, 'error');
            navigate('/payment/cancel', {
              state: {
                error: error.message,
                amount: paymentData?.amount
              }
            });
          }
        },
        prefill: {
          name: paymentData.contactPerson,
          email: paymentData.email,
          contact: paymentData.mobile,
        },
        theme: {
          color: '#047857',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async (response: any) => {
        console.error('Payment Failed:', response.error);
        
        try {
          // Update payment status to failed
          await supabase
            .from('payments')
            .update({
              status: 'failed',
              razorpay_payment_id: response.error?.metadata?.payment_id || null
            })
            .eq('member_id', paymentData?.memberId)
            .eq('status', 'pending');
        } catch (updateError) {
          console.error('Failed to update payment status:', updateError);
        }
        
        addToast(`Payment failed: ${response.error.description || 'Unknown error'}`, 'error');
        navigate('/payment/cancel', {
          state: {
            error: response.error.description,
            amount: paymentData?.amount
          }
        });
      });
      
      rzp.open();
      setLoading(false);

    } catch (error: any) {
      console.error('Payment initiation error:', error);
      const rawMessage = error.message || '';
      let friendlyMessage = `A technical error occurred: ${rawMessage}`;

      if (rawMessage.includes('API keys are not configured')) {
        friendlyMessage = 'The backend is missing its payment gateway keys. The administrator needs to set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` as secrets for the Supabase Edge Functions.';
      } else if (rawMessage.includes('Authentication failed')) {
        friendlyMessage = 'Authentication with the payment gateway failed. The API keys configured in the backend (Supabase Edge Function secrets) are likely incorrect.';
      } else if (rawMessage.includes('Failed to fetch')) {
        friendlyMessage = 'A network error occurred. Please check your internet connection. The backend service might also be temporarily unavailable or not deployed correctly.';
      } else if (rawMessage.includes('window.Razorpay')) {
          friendlyMessage = 'The Razorpay payment script failed to load. Please check your internet connection and if you have any ad-blockers enabled, then try refreshing the page.';
      }
      
      addToast('Could not initiate payment.', 'error');
      setErrorState(friendlyMessage);
      setLoading(false);
    }
  };

  const updateDatabaseOnSuccess = async (razorpayPaymentId: string, razorpayOrderId: string) => {
    if (!paymentData) return;

    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        razorpay_payment_id: razorpayPaymentId,
        razorpay_order_id: razorpayOrderId
      })
      .eq('member_id', paymentData.memberId)
      .eq('status', 'pending')
      .select('id')
      .single();

    if (paymentError) {
      console.error('Payment update error:', paymentError);
      throw new Error('Failed to update payment status');
    }

    if (paymentData.isRenewal) {
      const newExpiryDate = new Date();
      newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
      
      const { error: memberError } = await supabase
        .from('members')
        .update({
          expiry_date: newExpiryDate.toISOString(),
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', paymentData.memberId);
      
      if (memberError) {
        console.error('Member renewal update error:', memberError);
        throw new Error('Failed to update membership renewal');
      }
    } else {
      // For new registrations, keep status as 'pending' for admin approval
      // No change needed here, already set to 'pending' during registration
      console.log('New member registration payment completed, awaiting admin approval');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          {errorState ? (
            <div className="text-left">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="h-12 w-12 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">Payment Error</h1>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 text-sm mb-2">Error Details:</h3>
                <p className="text-sm text-red-800 whitespace-pre-wrap">{errorState}</p>
              </div>
              <Link to="/register" className="mt-6 block w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 px-4 rounded-lg font-semibold transition-colors text-center">
                Go Back to Registration
              </Link>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CreditCard className="h-12 w-12 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {statusText}
              </h1>
              <p className="text-gray-600 mb-6">
                Please wait while we securely process your request. Do not close or refresh this page.
              </p>
              {loading && <Loader2 className="h-8 w-8 text-emerald-600 mx-auto animate-spin" />}
            </>
          )}
          <div className="mt-8 flex items-center justify-center text-gray-500 text-sm">
            <Shield className="h-4 w-4 mr-2" />
            <span>Powered by Razorpay</span>
          </div>
        </div>
      </div>
    </div>
  );
}
