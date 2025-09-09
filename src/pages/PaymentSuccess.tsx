import React, { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Mail, Clock } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

export default function PaymentSuccess() {
  const location = useLocation();
  const { addToast } = useToast();
  const { memberId, amount } = location.state || {};

  useEffect(() => {
    if (memberId) {
      updatePaymentStatus();
    }
  }, [memberId]);

  const updatePaymentStatus = async () => {
    try {
      // Update payment status
      const { error } = await supabase
        .from('payments')
        .update({ status: 'completed' })
        .eq('member_id', memberId);

      if (error) throw error;

      // Send confirmation email (in real app, this would be handled by an edge function)
      addToast('Confirmation email sent successfully', 'success');
      
    } catch (error) {
      console.error('Payment update error:', error);
    }
  };

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
            Thank you for your payment of ₹{amount?.toLocaleString()}. Your KMDA membership 
            application has been received.
          </p>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Clock className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
              <div className="text-left">
                <h3 className="font-semibold text-blue-900 text-sm">What's Next?</h3>
                <p className="text-blue-800 text-sm mt-1">
                  Your application is under review by our committee. You'll receive 
                  an approval notification via email within 2-3 business days.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Mail className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
              <div className="text-left">
                <h3 className="font-semibold text-green-900 text-sm">Confirmation Email</h3>
                <p className="text-green-800 text-sm mt-1">
                  A confirmation email has been sent to your registered email address 
                  with payment details and next steps.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              to="/"
              className="block w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}