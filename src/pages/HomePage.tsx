import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Shield, Award, TrendingUp } from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: Users,
      title: 'Member Registration',
      description: 'Simple and secure registration process for medical distributors across Kerala',
    },
    {
      icon: Shield,
      title: 'Verified Network',
      description: 'Join a trusted network of authenticated medical distributors',
    },
    {
      icon: Award,
      title: 'Digital Certificates',
      description: 'Receive official digital certificates upon membership approval',
    },
    {
      icon: TrendingUp,
      title: 'Business Growth',
      description: 'Access exclusive opportunities and industry connections',
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Kerala Medical <br />
              <span className="text-emerald-200">Distributors Association</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-emerald-100 max-w-3xl mx-auto leading-relaxed">
              Connecting and empowering medical distributors across Kerala through 
              professional networking and industry standards
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Join KMDA Today
              </Link>
              <Link
                to="/admin/login"
                className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-white hover:text-emerald-700 transition-all duration-300"
              >
                Admin Access
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Join KMDA?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Become part of Kerala's premier medical distributors network
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-emerald-700" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="text-3xl md:text-4xl font-bold text-emerald-700 mb-2">500+</div>
              <div className="text-gray-600 font-medium">Active Members</div>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="text-3xl md:text-4xl font-bold text-emerald-700 mb-2">14</div>
              <div className="text-gray-600 font-medium">Districts Covered</div>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="text-3xl md:text-4xl font-bold text-emerald-700 mb-2">5+</div>
              <div className="text-gray-600 font-medium">Years of Service</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-emerald-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Join KMDA?
          </h2>
          <p className="text-xl text-emerald-100 mb-8 leading-relaxed">
            Start your membership application today and become part of Kerala's 
            leading medical distributors community
          </p>
          <Link
            to="/register"
            className="inline-block bg-amber-500 hover:bg-amber-600 text-white px-10 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Begin Registration
          </Link>
        </div>
      </section>
    </div>
  );
}
