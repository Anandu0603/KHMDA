import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Facebook, Twitter, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-emerald-700 rounded-lg flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl font-bold">KMDA</h2>
            </div>
            <p className="text-gray-400 text-sm">
              Kerala Medical Distributors Association, dedicated to empowering medical distributors across the state.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/membership" className="text-gray-400 hover:text-white transition-colors">Membership</Link></li>
              <li><Link to="/news" className="text-gray-400 hover:text-white transition-colors">News & Events</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <address className="not-italic text-gray-400 space-y-2 text-sm">
              <p>KMDA Head Office, Trivandrum, Kerala</p>
              <p>Email: <a href="mailto:info@kmda.org" className="hover:text-white">info@kmda.org</a></p>
              <p>Phone: <a href="tel:+911234567890" className="hover:text-white">+91 123 456 7890</a></p>
            </address>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            &copy; {currentYear} KMDA. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white"><Facebook size={20} /></a>
            <a href="#" className="text-gray-400 hover:text-white"><Twitter size={20} /></a>
            <a href="#" className="text-gray-400 hover:text-white"><Linkedin size={20} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
