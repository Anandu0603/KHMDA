import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-700 rounded-lg flex items-center justify-center">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">KMDA</h1>
              <p className="text-xs text-gray-600">Kerala Medical Distributors</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors ${
                location.pathname === '/' 
                  ? 'text-emerald-700' 
                  : 'text-gray-600 hover:text-emerald-700'
              }`}
            >
              Home
            </Link>
            {!user && (
              <>
                <Link
                  to="/register"
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === '/register' 
                      ? 'text-emerald-700' 
                      : 'text-gray-600 hover:text-emerald-700'
                  }`}
                >
                  Register
                </Link>
                <Link
                  to="/admin/login"
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === '/admin/login' 
                      ? 'text-emerald-700' 
                      : 'text-gray-600 hover:text-emerald-700'
                  }`}
                >
                  Admin Login
                </Link>
              </>
            )}
          </nav>

          {user && (
            <div className="flex items-center space-x-4">
              {isAdmin ? (
                <>
                  <Link
                    to="/admin/dashboard"
                    className="flex items-center space-x-1 text-sm font-medium text-gray-600 hover:text-emerald-700 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/admin/reports"
                    className="flex items-center space-x-1 text-sm font-medium text-gray-600 hover:text-emerald-700 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Reports</span>
                  </Link>
                </>
              ) : (
                <Link
                  to="/member/profile"
                  className="flex items-center space-x-1 text-sm font-medium text-gray-600 hover:text-emerald-700 transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-1 text-sm font-medium text-gray-600 hover:text-emerald-700 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}