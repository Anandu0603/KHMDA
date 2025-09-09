import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Navigate, Link, useParams } from 'react-router-dom';
import { Building2, Mail, Phone, MapPin, Calendar, CreditCard } from 'lucide-react';

export default function MemberProfile() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { id } = useParams();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    if (!authLoading && (user || isAdmin)) {
      fetchMemberProfile();
    }
  }, [authLoading, user, isAdmin, id]);

  const fetchMemberProfile = async () => {
    try {
      let query = supabase.from('members').select('*');
      
      if (id) {
        // Admin viewing specific member by ID
        query = query.eq('id', id);
      } else {
        // User viewing their own profile
        query = query.eq('email', user?.email);
      }
      
      const { data, error } = await query.single();

      if (error) throw error;
      setMember(data);
    } catch (error) {
      addToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  if ((!user && !isAdmin) || !member) {
    return <Navigate to="/" replace />;
  }

  const isExpiring = member.expires_at && 
    new Date(member.expires_at) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-emerald-700 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">Member Profile</h1>
            <p className="text-emerald-100">Welcome back to KMDA</p>
          </div>

          {/* Status Banner */}
          <div className={`px-8 py-4 ${
            member.status === 'approved' ? 'bg-green-50 border-b border-green-200' :
            member.status === 'pending' ? 'bg-yellow-50 border-b border-yellow-200' :
            'bg-red-50 border-b border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-semibold ${
                  member.status === 'approved' ? 'text-green-800' :
                  member.status === 'pending' ? 'text-yellow-800' :
                  'text-red-800'
                }`}>
                  Membership Status: {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                </p>
                {member.member_id && (
                  <p className="text-sm text-gray-600">Member ID: {member.member_id}</p>
                )}
              </div>
              {isExpiring && member.status === 'approved' && (
                <Link
                  to="/member/renew"
                  className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Renew Now
                </Link>
              )}
            </div>
          </div>

          {/* Profile Information */}
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Company Information */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-emerald-700" />
                  Company Information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Company Name</label>
                    <p className="text-lg text-gray-900">{member.company_name}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-emerald-700" />
                  Contact Information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Email</label>
                    <p className="text-lg text-gray-900">{member.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Mobile</label>
                    <p className="text-lg text-gray-900">{member.mobile}</p>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-emerald-700" />
                  Address
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Office Address</label>
                    <p className="text-lg text-gray-900">{member.address}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">District</label>
                      <p className="text-lg text-gray-900">{member.district}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">City</label>
                      <p className="text-lg text-gray-900">{member.city}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Membership Information */}
              {member.status === 'approved' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-emerald-700" />
                    Membership Details
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Member ID</label>
                      <p className="text-lg font-mono text-gray-900">{member.member_id}</p>
                    </div>
                    {member.expires_at && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Expires On</label>
                        <p className="text-lg text-gray-900">
                          {new Date(member.expires_at).toLocaleDateString('en-IN')}
                        </p>
                        {isExpiring && (
                          <p className="text-sm text-amber-600 mt-1">
                            Membership expiring soon! Please renew to continue your benefits.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {member.status === 'approved' && isExpiring && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <Link
                  to="/member/renew"
                  className="inline-flex items-center bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Renew Membership
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}