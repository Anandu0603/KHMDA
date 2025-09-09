import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Phone, Mail, MapPin } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

interface FormData {
  companyName: string;
  mobile: string;
  email: string;
  address: string;
  state: string;
  district: string;
  taluk: string;
  city: string;
  donationAmount: number;
}

const MEMBERSHIP_FEE = 500;

export default function MemberRegistration() {
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    mobile: '',
    email: '',
    address: '',
    state: 'Kerala',
    district: '',
    taluk: '',
    city: '',
    donationAmount: 0,
  });
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const paymentGatewayCharges = 0.02 * (MEMBERSHIP_FEE + formData.donationAmount);
  const totalAmount = MEMBERSHIP_FEE + paymentGatewayCharges + formData.donationAmount;

  const keraladDistricts = [
    'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kollam',
    'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad', 'Pathanamthitta',
    'Thiruvananthapuram', 'Thrissur', 'Wayanad'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Save member registration
      const { data: member, error: memberError } = await supabase
        .from('members')
        .insert({
          company_name: formData.companyName,
          mobile: formData.mobile,
          email: formData.email,
          address: formData.address,
          state: formData.state,
          district: formData.district,
          taluk: formData.taluk,
          city: formData.city,
          status: 'pending',
          membership_fee: MEMBERSHIP_FEE,
          payment_gateway_charges: paymentGatewayCharges,
        })
        .select()
        .single();

      if (memberError) throw memberError;

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          member_id: member.id,
          amount: totalAmount,
          membership_fee: MEMBERSHIP_FEE,
          gateway_charges: paymentGatewayCharges,
          donation_amount: formData.donationAmount,
          status: 'pending',
          payment_type: 'registration',
        });

      if (paymentError) throw paymentError;

      // Simulate payment gateway redirect
      addToast('Redirecting to payment gateway...', 'info');
      
      // In a real app, you'd integrate with Stripe/Razorpay here
      setTimeout(() => {
        navigate('/payment/success', { 
          state: { 
            memberId: member.id, 
            amount: totalAmount 
          } 
        });
      }, 2000);

    } catch (error) {
      console.error('Registration error:', error);
      addToast('Registration failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Join KMDA
            </h1>
            <p className="text-gray-600">
              Register as a member of Kerala Medical Distributors Association
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Details */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-emerald-700" />
                Company Information
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  required
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Phone className="h-5 w-5 mr-2 text-emerald-700" />
                Contact Information
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    required
                    value={formData.mobile}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Address Details */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-emerald-700" />
                Office Address
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Office Address *
                </label>
                <textarea
                  name="address"
                  required
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District *
                  </label>
                  <select
                    name="district"
                    required
                    value={formData.district}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  >
                    <option value="">Select District</option>
                    {keraladDistricts.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taluk *
                  </label>
                  <input
                    type="text"
                    name="taluk"
                    required
                    value={formData.taluk}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Donation Section */}
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
                  name="donationAmount"
                  min="0"
                  value={formData.donationAmount || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-emerald-50 rounded-lg p-6 border border-emerald-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Payment Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Membership Fee</span>
                  <span>₹{MEMBERSHIP_FEE.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Gateway Charges</span>
                  <span>₹{paymentGatewayCharges.toFixed(2)}</span>
                </div>
                {formData.donationAmount > 0 && (
                  <div className="flex justify-between text-amber-700 font-medium">
                    <span>Donation</span>
                    <span>₹{formData.donationAmount.toLocaleString()}</span>
                  </div>
                )}
                <hr className="border-emerald-200" />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total Amount</span>
                  <span>₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-semibold text-lg transition-colors duration-300"
            >
              {loading ? 'Processing...' : 'Proceed to Payment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}