import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Navigate, useNavigate } from 'react-router-dom';
import { CreditCard, RefreshCw } from 'lucide-react';

const RENEWAL_FEE = 500;

export default function RenewalPage() {
  const { user, loading: authLoading } = useAuth();
  const [member, setMember] = useState<any>(null);
  const [donationAmount, setDonationAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const paymentGatewayCharges = 0.02 * (RENEWAL_FEE + donationAmount);
  const totalAmount = RENEWAL_FEE + paymentGatewayCharges + donationAmount;

  useEffect(() => {
    if (!authLoading && user) {
      fetchMemberProfile();
    }
  }, [authLoading, user]);

  const fetchMemberProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('email', user?.email)
        .single();

      if (error) throw error;
      setMember(data);
    } catch (error) {
      addToast('Failed to load member information', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          member_id: member.id,
          amount: totalAmount,
          membership_fee: RENEWAL_FEE,
          gateway_charges: paymentGatewayCharges,
          donation_amount: donationAmount,
          status: 'pending',
          payment_type: 'renewal',
        });

      if (paymentError) throw paymentError;

      addToast('Redirecting to payment gateway...', 'info');
      
      const paymentData = { 
        memberId: member.id, 
        amount: totalAmount,
        membershipFee: RENEWAL_FEE,
        gatewayCharges: paymentGatewayCharges,
        donationAmount: donationAmount,
        companyName: member.company_name,
        contactPerson: member.contact_person,
        email: member.email,
        mobile: member.mobile,
        isRenewal: true
      };

      sessionStorage.setItem('paymentData', JSON.stringify(paymentData));

      navigate('/payment/razorpay', { 
        state: paymentData
      });

    } catch (error) {
      console.error('Renewal error:', error);
      addToast('Renewal failed. Please try again.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  if (!user || !member) {
    return <Navigate to="/" replace />;
  }

  if (member.status !== 'approved') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Renewal Not Available
          </h1>
          <p className="text-gray-600">
            Your membership must be approved before you can renew.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="h-8 w-8 text-emerald-700" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Renew Membership
            </h1>
            <p className="text-gray-600">
              Extend your KMDA membership for another year
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Current Membership
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Company:</span>
                <span className="font-medium">{member.company_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Member ID:</span>
                <span className="font-mono">{member.member_id}</span>
              </div>
              <div className="flex justify-between">
                <span>Current Expiry:</span>
                <span className="font-medium">
                  {member.expiry_date ? new Date(member.expiry_date).toLocaleDateString('en-IN') : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleRenewal} className="space-y-6">
            <div className="bg-amber-50 rounded-lg p-6 border border-amber-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Support KMDA (Optional)
              </h3>
              <p className="text-gray-600 mb-4">
                Your donation helps us improve services for all members
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Donation Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={donationAmount || ''}
                  onChange={(e) => setDonationAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div className="bg-emerald-50 rounded-lg p-6 border border-emerald-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Renewal Payment Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Renewal Fee</span>
                  <span>₹{RENEWAL_FEE.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Gateway Charges</span>
                  <span>₹{paymentGatewayCharges.toFixed(2)}</span>
                </div>
                {donationAmount > 0 && (
                  <div className="flex justify-between text-amber-700 font-medium">
                    <span>Donation</span>
                    <span>₹{donationAmount.toLocaleString()}</span>
                  </div>
                )}
                <hr className="border-emerald-200" />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total Amount</span>
                  <span>₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-white rounded-md border">
                <p className="text-xs text-gray-600 text-center">
                  New expiry date: {new Date(new Date(member.expiry_date).setFullYear(new Date(member.expiry_date).getFullYear() + 1)).toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-semibold text-lg transition-colors duration-300"
            >
              {processing ? 'Processing...' : (
                <>
                  <CreditCard className="h-5 w-5 inline mr-2" />
                  Proceed to Payment
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
