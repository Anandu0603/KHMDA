import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Linkedin } from 'lucide-react';
import Logo from './Logo';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* About Section */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex flex-col items-center mb-3 sm:mb-4">
              <Logo className="w-16 h-16 sm:w-20 sm:h-20" />
              <h2 className="text-base sm:text-lg font-bold text-center mt-2">Kerala Medical Distributors Association</h2>
            </div>
            <div className="text-xs sm:text-sm text-gray-400 text-center mb-2">
              <p>Reg No TVM/C-149/2023</p>
              <p>Affiliated to Kerala Vyapari Vyavasaya Samithi</p>
            </div>
            <p className="text-gray-400 text-xs sm:text-sm text-center">
              Dedicated to empowering medical distributors across the state.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Links</h3>
            <ul className="space-y-1 sm:space-y-2">
              <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">About Us</Link></li>
              <li><Link to="/membership" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Membership</Link></li>
              <li><Link to="/news" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">News & Events</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Contact</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Legal</h3>
            <ul className="space-y-1 sm:space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Terms of Service</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Contact Us</h3>
            <address className="not-italic text-gray-400 space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <p>KMDA Head Office, Trivandrum, Kerala</p>
              <p>Email: <a href="mailto:info@kmda.org" className="hover:text-white">info@kmda.org</a></p>
              <p>Phone: <a href="tel:+911234567890" className="hover:text-white">+91 123 456 7890</a></p>
            </address>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 border-t border-gray-700 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <p className="text-gray-400 text-xs sm:text-sm text-center sm:text-left">
            &copy; {currentYear} KMDA. All rights reserved.
          </p>
          <div className="text-center">
            <p className="text-gray-500 text-xs sm:text-sm">
            Technology Partner <a href="https://streamsmax.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 font-medium hover:underline">Streams Max Technologies Pvt Ltd</a>
            </p>
          </div>
          <div className="flex space-x-3 sm:space-x-4">
            <a href="#" className="text-gray-400 hover:text-white"><Facebook size={16} /></a>
            <a href="#" className="text-gray-400 hover:text-white"><Twitter size={16} /></a>
            <a href="#" className="text-gray-400 hover:text-white"><Linkedin size={16} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
