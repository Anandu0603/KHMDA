import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function DonationSuccess() {
  const location = useLocation();
  const { amount, donorName } = (location.state || {}) as { amount?: number; donorName?: string };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You{donorName ? `, ${donorName}` : ''}!</h1>
          <p className="text-gray-600 mb-6">Your donation of ₹{amount?.toLocaleString()} was successful.</p>

          <Link to="/" className="block w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 px-4 rounded-lg font-semibold transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}