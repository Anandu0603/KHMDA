import React, { useState, useEffect } from 'react';
import { Users, Clock, CheckCircle, XCircle, RefreshCw, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Navigate, Link } from 'react-router-dom';

interface Member {
  id: string;
  company_name: string;
  email: string;
  mobile: string;
  district: string;
  city: string;
  status: string;
  created_at: string;
  expires_at: string | null;
  member_id: string | null;
}

export default function AdminDashboard() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { addToast } = useToast();

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchMembers();
    }
  }, [authLoading, isAdmin]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      addToast('Failed to load members', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateMemberStatus = async (memberId: string, status: string) => {
    try {
      const updates: any = { status };
      
      if (status === 'approved') {
        // Generate unique member ID
        const memberCount = members.filter(m => m.status === 'approved').length + 1;
        const memberIdNumber = String(memberCount).padStart(4, '0');
        updates.member_id = `KMDA ${memberIdNumber}`;
        updates.expires_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      }

      const { error } = await supabase
        .from('members')
        .update(updates)
        .eq('id', memberId);

      if (error) throw error;

      addToast(
        `Member ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
        'success'
      );
      
      fetchMembers();
    } catch (error) {
      addToast('Failed to update member status', 'error');
    }
  };

  const renewMembership = async (memberId: string) => {
    try {
      const newExpiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      
      const { error } = await supabase
        .from('members')
        .update({
          expires_at: newExpiryDate.toISOString(),
          status: 'approved'
        })
        .eq('id', memberId);

      if (error) throw error;

      addToast('Membership renewed successfully', 'success');
      fetchMembers();
    } catch (error) {
      addToast('Failed to renew membership', 'error');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  const filteredMembers = members.filter(member => {
    if (filter === 'all') return true;
    return member.status === filter;
  });

  const stats = {
    total: members.length,
    pending: members.filter(m => m.status === 'pending').length,
    approved: members.filter(m => m.status === 'approved').length,
    expired: members.filter(m => {
      if (!m.expires_at) return false;
      return new Date(m.expires_at) < new Date();
    }).length,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage KMDA membership applications and renewals
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-gray-900">{stats.expired}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            {[
              { key: 'all', label: 'All Members' },
              { key: 'pending', label: 'Pending' },
              { key: 'approved', label: 'Approved' },
              { key: 'rejected', label: 'Rejected' },
              { key: 'expired', label: 'Expired' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? 'text-emerald-700 border-b-2 border-emerald-700'
                    : 'text-gray-600 hover:text-emerald-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700 mx-auto"></div>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMembers.map(member => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {member.company_name}
                          </div>
                          {member.member_id && (
                            <div className="text-xs text-gray-500">
                              ID: {member.member_id}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{member.email}</div>
                        <div className="text-sm text-gray-500">{member.mobile}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{member.district}</div>
                        <div className="text-sm text-gray-500">{member.city}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          member.status === 'approved' ? 'bg-green-100 text-green-800' :
                          member.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          member.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {member.status}
                        </span>
                        {member.expires_at && (
                          <div className="text-xs text-gray-500 mt-1">
                            Expires: {new Date(member.expires_at).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <Link
                            to={`/admin/member/${member.id}`}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-900 text-sm font-medium"
                          >
                            <Eye className="h-3 w-3" />
                            <span>View</span>
                          </Link>
                          {member.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateMemberStatus(member.id, 'approved')}
                                className="text-green-600 hover:text-green-900 text-sm font-medium"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => updateMemberStatus(member.id, 'rejected')}
                                className="text-red-600 hover:text-red-900 text-sm font-medium"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {member.status === 'approved' && member.expires_at && (
                            <button
                              onClick={() => renewMembership(member.id)}
                              className="flex items-center space-x-1 text-emerald-600 hover:text-emerald-900 text-sm font-medium"
                            >
                              <RefreshCw className="h-3 w-3" />
                              <span>Renew</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}