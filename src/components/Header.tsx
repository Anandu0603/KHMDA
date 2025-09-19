import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Settings, User, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import Logo from './Logo';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'About KMDA', path: '/about' },
  { name: 'Vision & Mission', path: '/vision-mission' },
  { name: 'Committee', path: '/committee' },
  { name: 'Membership', path: '/membership' },
  { name: 'News', path: '/news' },
  { name: 'Donate', path: '/donate' },
  { name: 'Contact Us', path: '/contact' },
];

export default function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-3">
            <Logo className="w-10 h-10" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">KMDA</h1>
              <p className="text-xs text-gray-600 hidden sm:block">Kerala Medical Distributors</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
            {navLinks.map(link => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === link.path 
                    ? 'text-emerald-700' 
                    : 'text-gray-600 hover:text-emerald-700'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {user ? (
              <>
                {isAdmin ? (
                  <div className="flex items-center space-x-4">
                    <Link to="/admin/dashboard" className="flex items-center space-x-1 text-sm font-medium text-gray-600 hover:text-emerald-700 transition-colors">
                      <Settings className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                    <Link to="/admin/reports" className="flex items-center space-x-1 text-sm font-medium text-gray-600 hover:text-emerald-700 transition-colors">
                      <span>Reports</span>
                    </Link>
                  </div>
                ) : (
                  <Link to="/member/profile" className="flex items-center space-x-1 text-sm font-medium text-gray-600 hover:text-emerald-700 transition-colors">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                )}
                <button onClick={handleSignOut} className="flex items-center space-x-1 text-sm font-medium text-gray-600 hover:text-emerald-700 transition-colors">
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/register" className="text-sm font-medium text-gray-600 hover:text-emerald-700">
                  Register
                </Link>
                <Link to="/admin/login" className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  Admin Login
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map(link => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === link.path
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="px-5 flex items-center justify-between">
              {user ? (
                <div className="flex items-center space-x-4">
                  {isAdmin ? (
                    <>
                      <Link to="/admin/dashboard" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-1 text-base font-medium text-gray-700 hover:text-gray-900">
                        <Settings className="h-5 w-5" />
                        <span>Dashboard</span>
                      </Link>
                      <Link to="/admin/reports" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-1 text-base font-medium text-gray-700 hover:text-gray-900">
                        <span>Reports</span>
                      </Link>
                    </>
                  ) : (
                    <Link to="/member/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-1 text-base font-medium text-gray-700 hover:text-gray-900">
                      <User className="h-5 w-5" />
                      <span>Profile</span>
                    </Link>
                  )}
                  <button onClick={() => { handleSignOut(); setIsMenuOpen(false); }} className="flex items-center space-x-1 text-base font-medium text-gray-700 hover:text-gray-900">
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link to="/register" onClick={() => setIsMenuOpen(false)} className="text-base font-medium text-gray-700 hover:text-gray-900">
                    Register
                  </Link>
                  <Link to="/admin/login" onClick={() => setIsMenuOpen(false)} className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-md text-base font-medium transition-colors">
                    Admin Login
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
