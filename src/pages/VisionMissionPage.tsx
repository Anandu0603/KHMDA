import React from 'react';
import { Eye, Rocket, ShieldCheck } from 'lucide-react';

const VisionMissionPage: React.FC = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-emerald-800">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover"
            src="https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/1920x800/022c22/34d399?text=KMDA"
            alt="Abstract background"
          />
          <div className="absolute inset-0 bg-emerald-800 mix-blend-multiply" aria-hidden="true" />
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">Our Vision & Mission</h1>
          <p className="mt-6 text-xl text-emerald-100 max-w-3xl mx-auto">
            Guiding our path to a stronger, more efficient, and ethical medical distribution network in Kerala.
          </p>
        </div>
      </div>

      {/* Vision Section */}
      <div className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
            <div className="lg:col-span-1">
              <div className="flex items-center text-emerald-700 mb-4">
                <Eye className="h-8 w-8 mr-3" />
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Our Vision</h2>
              </div>
              <p className="mt-4 text-xl text-gray-600">
                To be the benchmark for excellence and integrity in the medical distribution industry, fostering a robust and technologically advanced supply chain that ensures timely and affordable access to healthcare products for every citizen of Kerala.
              </p>
            </div>
            <div className="mt-10 lg:mt-0 flex justify-center">
              <img
                className="rounded-lg shadow-xl"
                src="https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/600x400/d1fae5/047857?text=Future+Focus"
                alt="Vision illustration"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="bg-gray-50 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
            <div className="mt-10 lg:mt-0 flex justify-center lg:order-2">
              <img
                className="rounded-lg shadow-xl"
                src="https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/600x400/a7f3d0/065f46?text=Our+Commitment"
                alt="Mission illustration"
              />
            </div>
            <div className="lg:col-span-1 lg:order-1">
              <div className="flex items-center text-emerald-700 mb-4">
                <Rocket className="h-8 w-8 mr-3" />
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Our Mission</h2>
              </div>
              <ul className="mt-6 space-y-5 text-lg text-gray-600">
                <li className="flex items-start">
                  <ShieldCheck className="flex-shrink-0 h-6 w-6 text-emerald-500 mr-3 mt-1" />
                  <span><strong>Unite & Empower:</strong> To bring together all medical distributors in Kerala under one umbrella, providing a strong platform for collective growth and advocacy.</span>
                </li>
                <li className="flex items-start">
                  <ShieldCheck className="flex-shrink-0 h-6 w-6 text-emerald-500 mr-3 mt-1" />
                  <span><strong>Uphold Standards:</strong> To promote and enforce ethical business practices, ensuring compliance with all regulatory standards for the safety of the public.</span>
                </li>
                <li className="flex items-start">
                  <ShieldCheck className="flex-shrink-0 h-6 w-6 text-emerald-500 mr-3 mt-1" />
                  <span><strong>Foster Education:</strong> To facilitate continuous learning and professional development for our members through workshops, seminars, and knowledge sharing.</span>
                </li>
                <li className="flex items-start">
                  <ShieldCheck className="flex-shrink-0 h-6 w-6 text-emerald-500 mr-3 mt-1" />
                  <span><strong>Advocate & Represent:</strong> To act as a liaison between our members and government bodies, advocating for fair policies and resolving industry-wide challenges.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisionMissionPage;
