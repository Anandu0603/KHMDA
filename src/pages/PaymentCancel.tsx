import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';

export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Payment Cancelled
          </h1>
          
          <p className="text-gray-600 mb-8">
            Your payment was cancelled. No charges have been made to your account.
            You can try again or contact us for assistance.
          </p>

          <div className="space-y-3">
            <Link
              to="/register"
              className="block w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
            >
              <ArrowLeft className="h-4 w-4 inline mr-2" />
              Try Again
            </Link>
            <Link
              to="/"
              className="block w-full text-gray-600 hover:text-gray-800 py-3 px-4 font-medium transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
