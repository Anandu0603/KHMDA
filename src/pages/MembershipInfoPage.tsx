import React from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, UserPlus, Award, BookOpen } from 'lucide-react';

const MembershipInfoPage: React.FC = () => {
  const benefits = [
    'Access to a state-wide network of distributors.',
    'Representation in government and regulatory bodies.',
    'Exclusive access to industry reports and data.',
    'Participation in seminars, workshops, and training programs.',
    'Dispute resolution and legal support.',
    'Digital membership certificate and ID.',
  ];

  const steps = [
    { name: 'Fill Application', description: 'Complete the online registration form with your business and contact details.', icon: UserPlus },
    { name: 'Upload Documents', description: 'Submit required documents like Drug License and ID proof for verification.', icon: BookOpen },
    { name: 'Pay Fee', description: 'Pay the annual membership fee securely through our online payment gateway.', icon: Award },
    { name: 'Get Approved', description: 'Our committee will review your application. Upon approval, you become an official KMDA member.', icon: Check },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="bg-gray-50 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Become a KMDA Member
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Join a thriving community of medical distributors and unlock a world of opportunities for growth and collaboration.
          </p>
          <div className="mt-8">
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-emerald-700 hover:bg-emerald-800"
            >
              Register Now <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-emerald-600 font-semibold tracking-wide uppercase">Member Benefits</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Why You Should Join Us
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Membership with KMDA offers numerous advantages to help your business succeed.
            </p>
          </div>

          <div className="mt-12">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-700 text-white">
                      <Check className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-lg leading-6 font-medium text-gray-900">{benefit}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* How to Join Section */}
      <div className="bg-gray-50 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">A Simple 4-Step Process</h2>
            <p className="mt-4 text-lg text-gray-600">Joining KMDA is straightforward and secure.</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.name} className="text-center p-6 bg-white rounded-lg shadow-md">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-100 text-emerald-700 mx-auto">
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-medium text-gray-900">{step.name}</h3>
                <p className="mt-2 text-base text-gray-500">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipInfoPage;
