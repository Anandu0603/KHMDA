import React from 'react';
import { MapPin, Mail, Phone } from 'lucide-react';

const ContactPage: React.FC = () => {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-24 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Contact Us
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            We're here to help. Reach out to us with your questions, feedback, or inquiries.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-700 text-white mx-auto">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-lg font-medium text-gray-900">Our Address</h3>
            <p className="mt-2 text-base text-gray-600">
              KMDA Head Office<br />
              123 Association Lane<br />
              Trivandrum, Kerala, 695001
            </p>
          </div>
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-700 text-white mx-auto">
              <Mail className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-lg font-medium text-gray-900">Email Us</h3>
            <p className="mt-2 text-base text-gray-600">
              For general inquiries:<br />
              <a href="mailto:info@kmda.org" className="text-emerald-600 hover:text-emerald-800">info@kmda.org</a>
            </p>
            <p className="mt-1 text-base text-gray-600">
              For membership support:<br />
              <a href="mailto:support@kmda.org" className="text-emerald-600 hover:text-emerald-800">support@kmda.org</a>
            </p>
          </div>
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-700 text-white mx-auto">
              <Phone className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-lg font-medium text-gray-900">Call Us</h3>
            <p className="mt-2 text-base text-gray-600">
              Office Landline:<br />
              <a href="tel:+911234567890" className="text-emerald-600 hover:text-emerald-800">+91 123 456 7890</a>
            </p>
            <p className="mt-1 text-sm text-gray-500">(Mon-Fri, 9am - 5pm)</p>
          </div>
        </div>

        <div className="mt-16 bg-gray-50 rounded-lg p-8 lg:p-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center">Send us a Message</h2>
          <form action="#" method="POST" className="mt-8 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
            <div>
              <label htmlFor="first-name" className="block text-sm font-medium text-gray-700">First name</label>
              <div className="mt-1">
                <input type="text" name="first-name" id="first-name" autoComplete="given-name" className="py-3 px-4 block w-full shadow-sm focus:ring-emerald-500 focus:border-emerald-500 border-gray-300 rounded-md" />
              </div>
            </div>
            <div>
              <label htmlFor="last-name" className="block text-sm font-medium text-gray-700">Last name</label>
              <div className="mt-1">
                <input type="text" name="last-name" id="last-name" autoComplete="family-name" className="py-3 px-4 block w-full shadow-sm focus:ring-emerald-500 focus:border-emerald-500 border-gray-300 rounded-md" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1">
                <input id="email" name="email" type="email" autoComplete="email" className="py-3 px-4 block w-full shadow-sm focus:ring-emerald-500 focus:border-emerald-500 border-gray-300 rounded-md" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
              <div className="mt-1">
                <textarea id="message" name="message" rows={4} className="py-3 px-4 block w-full shadow-sm focus:ring-emerald-500 focus:border-emerald-500 border border-gray-300 rounded-md" defaultValue={''} />
              </div>
            </div>
            <div className="sm:col-span-2 text-center">
              <button type="submit" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-emerald-700 hover:bg-emerald-800">
                Send Message
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
