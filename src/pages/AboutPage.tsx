import React from 'react';
import { Building, Target, Users } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="bg-white py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            About KMDA
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            The Kerala Medical Distributors Association (KMDA) is the principal organization representing medical distributors across the state of Kerala.
          </p>
        </div>

        <div className="mt-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-700 text-white mx-auto">
                <Building className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Our Foundation</h3>
                <p className="mt-2 text-base text-gray-600">
                  Established in [Year], KMDA was formed to create a unified voice for medical distributors, ensuring ethical practices and fostering a collaborative environment for business growth.
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-700 text-white mx-auto">
                <Target className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Our Mission</h3>
                <p className="mt-2 text-base text-gray-600">
                  To empower our members by providing a platform for networking, advocacy, and professional development, while upholding the highest standards of quality and service in medical distribution.
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-700 text-white mx-auto">
                <Users className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Our Community</h3>
                <p className="mt-2 text-base text-gray-600">
                  With over 500 active members spanning all 14 districts of Kerala, we are a diverse and robust community committed to advancing the healthcare supply chain.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-24 bg-gray-50 rounded-lg p-8 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">A Message from the President</h2>
              <p className="mt-4 text-lg text-gray-600">
                "Welcome to the digital home of KMDA. In an era of rapid change, our association remains a steadfast pillar of support for our members. We are committed to navigating the challenges of the industry together, driving innovation, and ensuring that the people of Kerala have access to safe and effective medical supplies. Join us as we build a healthier future."
              </p>
              <p className="mt-6 font-semibold text-gray-900">[President's Name]</p>
              <p className="text-sm text-gray-500">President, KMDA</p>
            </div>
            <div className="flex justify-center">
              <img 
                className="h-48 w-48 rounded-full object-cover shadow-lg" 
                src="https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/400x400/E2E8F0/4A5568?text=President" 
                alt="KMDA President" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
