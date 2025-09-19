import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function DonationCancel() {
  const location = useLocation();
  const { amount, error } = (location.state || {}) as { amount?: number; error?: string };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Unsuccessful</h1>
          <p className="text-gray-600 mb-4">{error || 'The payment was cancelled or failed.'}</p>
          {amount ? (
            <p className="text-gray-500 mb-6">Amount attempted: ₹{amount.toLocaleString()}</p>
          ) : null}

          <div className="space-y-3">
            <Link to="/donate" className="block w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 px-4 rounded-lg font-semibold transition-colors">
              Try Again
            </Link>
            <Link to="/" className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-semibold transition-colors">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}