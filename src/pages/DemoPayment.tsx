import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Shield, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

interface PaymentData {
  memberId: string;
  amount: number;
  membershipFee: number;
  gatewayCharges: number;
  donationAmount: number;
  companyName: string;
  email: string;
  isRenewal?: boolean;
}

export default function DemoPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // First, try to get data from location state
    const data = location.state as PaymentData | undefined;
    
    if (data && Object.keys(data).length > 0) {
      console.log('Payment data from location state:', data);
      setPaymentData(data);
      return;
    }
    
    // If no data in location state, try to get from session storage as fallback
    const storedData = sessionStorage.getItem('paymentData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData) as PaymentData;
        console.log('Payment data from session storage:', parsedData);
        setPaymentData(parsedData);
        return;
      } catch (error) {
        console.error('Error parsing stored payment data:', error);
      }
    }
    
    // If we get here, no valid payment data was found
    console.error('No valid payment data found');
    addToast('Invalid payment session. Please register again.', 'error');
    navigate('/register');
  }, [location.state, navigate, addToast]);

  const handlePayment = async (success: boolean) => {
    if (!paymentData) return;
    
    setLoading(true);
    
    try {
      if (success) {
        // Update payment status to completed
        const { error: paymentError } = await supabase
          .from('payments')
          .update({ 
            status: 'completed',
            transaction_id: `DEMO_${Date.now()}`,
            payment_gateway: 'demo'
          })
          .eq('member_id', paymentData.memberId);

        if (paymentError) throw paymentError;

        // Update member status based on payment type
        if (paymentData.isRenewal) {
          // For renewals, extend the expiry date
          const newExpiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
          const { error: memberError } = await supabase
            .from('members')
            .update({ 
              expires_at: newExpiryDate.toISOString(),
              status: 'approved'
            })
            .eq('id', paymentData.memberId);
          
          if (memberError) throw memberError;
        } else {
          // For new registrations, set to pending approval
          const { error: memberError } = await supabase
            .from('members')
            .update({ status: 'pending_approval' })
            .eq('id', paymentData.memberId);
          
          if (memberError) throw memberError;
        }

        setShowSuccess(true);
        
        // Redirect to success page after 2 seconds
        setTimeout(() => {
          navigate('/payment/success', { 
            state: { 
              memberId: paymentData.memberId, 
              amount: paymentData.amount,
              isRenewal: paymentData.isRenewal
            } 
          });
        }, 2000);
      } else {
        // Payment failed - redirect to cancel page
        navigate('/payment/cancel');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      addToast('Payment processing failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-4">Loading payment details...</p>
          <div className="bg-gray-100 p-4 rounded-lg text-left max-w-md mx-auto">
            <p className="text-sm text-gray-600 mb-2">Debug Info:</p>
            <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
              {JSON.stringify({
                hasLocationState: !!location.state,
                locationStateKeys: location.state ? Object.keys(location.state) : null,
                sessionStorageHasData: !!sessionStorage.getItem('paymentData'),
                currentPath: window.location.pathname
              }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Payment Successful!
            </h1>
            <p className="text-gray-600 mb-6">
              Redirecting to confirmation page...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-emerald-700 text-white p-6">
            <h1 className="text-2xl font-bold flex items-center">
              <CreditCard className="h-6 w-6 mr-3" />
              {paymentData.isRenewal ? 'Renewal Payment' : 'Demo Payment Gateway'}
            </h1>
            <p className="text-emerald-100 mt-2">
              {paymentData.isRenewal 
                ? 'Complete your membership renewal payment'
                : 'This is a demo payment flow for testing purposes'
              }
            </p>
          </div>

          <div className="p-6">
            {/* Payment Summary */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Company:</span>
                  <span className="font-medium">{paymentData.companyName}</span>
                </div>
                <div className="flex justify-between">
                  <span>{paymentData.isRenewal ? 'Renewal Fee:' : 'Membership Fee:'}</span>
                  <span>₹{paymentData.membershipFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Gateway Charges:</span>
                  <span>₹{paymentData.gatewayCharges.toFixed(2)}</span>
                </div>
                {paymentData.donationAmount > 0 && (
                  <div className="flex justify-between text-amber-700 font-medium">
                    <span>Donation:</span>
                    <span>₹{paymentData.donationAmount.toLocaleString()}</span>
                  </div>
                )}
                <hr className="border-gray-200" />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total Amount:</span>
                  <span>₹{paymentData.amount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Payment Method</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'card', label: 'Credit/Debit Card', icon: '💳' },
                  { id: 'upi', label: 'UPI', icon: '📱' },
                  { id: 'netbanking', label: 'Net Banking', icon: '🏦' }
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      paymentMethod === method.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{method.icon}</div>
                    <div className="text-sm font-medium">{method.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Demo Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Shield className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 text-sm">Demo Payment</h4>
                  <p className="text-blue-800 text-sm mt-1">
                    This is a demonstration payment flow. No real money will be charged.
                    Choose "Pay Now" to simulate a successful payment or "Cancel" to simulate failure.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => handlePayment(true)}
                disabled={loading}
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-300 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Pay Now (Demo Success)
                  </>
                )}
              </button>
              
              <button
                onClick={() => handlePayment(false)}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-300 flex items-center justify-center"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel (Demo Failure)
              </button>
            </div>

            {/* Security Notice */}
            <div className="mt-6 text-center">
              <div className="flex items-center justify-center text-gray-500 text-sm">
                <Shield className="h-4 w-4 mr-2" />
                <span>Secure demo payment powered by KMDA</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
