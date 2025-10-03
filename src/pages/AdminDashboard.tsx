import React, { useState, useEffect } from 'react';
import { Users, Clock, CheckCircle, XCircle, RefreshCw, Eye, Loader2, AlertTriangle, Check, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Navigate, Link, useNavigate } from 'react-router-dom';

interface Member {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  mobile: string;
  district: string;
  city: string;
  status: string;
  created_at: string;
  expiry_date: string | null;
  membership_id: string | null;
  approved_at: string | null;
}

const StatCard: React.FC<{ icon: React.ElementType, title: string, value: number | string, colorClass: { bg: string, text: string } }> = ({ icon: Icon, title, value, colorClass }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center space-x-4">
    <div className={`p-3 rounded-full ${colorClass.bg}`}>
      <Icon className={`h-6 w-6 ${colorClass.text}`} />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

export default function AdminDashboard() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchMembers();
    }
  }, [authLoading, isAdmin]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, company_name, contact_person, email, mobile, district, city, status, created_at, expiry_date, membership_id, approved_at')
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
    setProcessingId(memberId);
    try {
      const updates: any = { status };
      
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (memberError) throw memberError;
      
      if (status === 'approved') {
        const { data: membershipIdResult } = await supabase.rpc('generate_membership_id');
        updates.membership_id = membershipIdResult;
        
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        updates.expiry_date = expiryDate.toISOString();
        updates.approved_at = new Date().toISOString();
        
        const { error: certError } = await supabase.functions.invoke('generate-certificate', {
          body: {
            member_id: memberId,
            certificate_number: updates.membership_id,
            valid_until: updates.expiry_date
          }
        });
        
        if (certError) {
          console.error('Certificate generation failed:', certError);
        }
      }

      const { error } = await supabase
        .from('members')
        .update(updates)
        .eq('id', memberId);

      if (error) throw error;

      if (status === 'approved') {
        await sendApprovalEmail({
          ...member,
          membership_id: updates.membership_id,
          expiry_date: updates.expiry_date,
          approved_at: updates.approved_at
        });
      } else if (status === 'rejected') {
        await sendRejectionEmail(member);
      }

      addToast(
        `Member ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
        'success'
      );
      
      setLoading(true);
      fetchMembers();
    } catch (error: any) {
      console.error('Status update error:', error);
      addToast(`Failed to update member status: ${error.message}`, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const sendApprovalEmail = async (member: any) => {
    try {
      const subject = 'KMDA Membership Approved - Welcome!';
      const expiryDate = new Date(member.expiry_date);
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #047857; text-align: center;">Congratulations!</h1>
          <p>Hello <strong>${member.contact_person}</strong>,</p>
          <p>Your KMDA membership application has been successfully approved!</p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; margin: 20px 0;">
            <h2 style="color: #047857;">Your Membership Details</h2>
            <p><strong>Member ID:</strong> ${member.membership_id}</p>
            <p><strong>Valid Until:</strong> ${expiryDate.toLocaleDateString('en-IN')}</p>
          </div>
          <p>Best regards,<br>KMDA Administration Team</p>
        </div>
      `;
      await supabase.functions.invoke('send-email', { body: { to: member.email, subject, html } });
      addToast('Approval email sent.', 'success');
    } catch (error: any) {
      addToast('Member approved, but failed to send email.', 'warning');
    }
  };

  const sendRejectionEmail = async (member: any) => {
    try {
      const subject = 'KMDA Membership Application Status';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Application Status Update</h1>
          <p>Dear <strong>${member.contact_person}</strong>,</p>
          <p>We regret to inform you that your application could not be approved at this time.</p>
          <p>Best regards,<br>KMDA Administration Team</p>
        </div>
      `;
      await supabase.functions.invoke('send-email', { body: { to: member.email, subject, html } });
      addToast('Rejection email sent.', 'info');
    } catch (error: any) {
      addToast('Member rejected, but failed to send email.', 'warning');
    }
  };
  
  const renewMembership = async (memberId: string) => {
    setProcessingId(memberId);
    try {
      const memberDetails = members.find(m => m.id === memberId);
      if (!memberDetails) {
        addToast('Member details not found.', 'error');
        return;
      }

      const renewalAmount = 500;
      const gatewayCharges = renewalAmount * 0.02;
      const totalAmount = renewalAmount + gatewayCharges;

      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          member_id: memberId,
          amount: totalAmount,
          membership_fee: renewalAmount,
          gateway_charges: gatewayCharges,
          donation_amount: 0,
          status: 'pending',
          payment_type: 'renewal'
        });

      if (paymentError) {
        throw new Error(`Failed to create renewal payment record: ${paymentError.message}`);
      }

      const renewalPaymentData = {
        memberId: memberId,
        amount: totalAmount,
        membershipFee: renewalAmount,
        gatewayCharges: gatewayCharges,
        donationAmount: 0,
        companyName: memberDetails.company_name,
        contactPerson: memberDetails.contact_person,
        email: memberDetails.email,
        mobile: memberDetails.mobile,
        isRenewal: true
      };
      
      sessionStorage.setItem('paymentData', JSON.stringify(renewalPaymentData));
      addToast('Redirecting to payment page for renewal...', 'info');
      navigate('/payment/razorpay', { state: renewalPaymentData });

    } catch (error: any) {
      console.error('Renewal initiation error:', error);
      addToast(`Failed to initiate renewal: ${error.message}`, 'error');
    } finally {
      setProcessingId(null);
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
    if (filter === 'pending') return member.status === 'pending';
    if (filter === 'expired') {
      return member.expiry_date && new Date(member.expiry_date) < new Date() && member.status === 'approved';
    }
    return member.status === filter;
  });

  const stats = {
    total: members.length,
    pending: members.filter(m => m.status === 'pending').length,
    approved: members.filter(m => m.status === 'approved').length,
    rejected: members.filter(m => m.status === 'rejected').length,
    expired: members.filter(m => m.status === 'approved' && m.expiry_date && new Date(m.expiry_date) < new Date()).length,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage KMDA membership applications and renewals</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatCard icon={Users} title="Total Registrations" value={stats.total} colorClass={{bg: 'bg-blue-100', text: 'text-blue-600'}} />
          <StatCard icon={Clock} title="Pending" value={stats.pending} colorClass={{bg: 'bg-yellow-100', text: 'text-yellow-600'}} />
          <StatCard icon={CheckCircle} title="Approved" value={stats.approved} colorClass={{bg: 'bg-green-100', text: 'text-green-600'}} />
          <StatCard icon={XCircle} title="Rejected" value={stats.rejected} colorClass={{bg: 'bg-red-100', text: 'text-red-600'}} />
          <StatCard icon={AlertTriangle} title="Expired" value={stats.expired} colorClass={{bg: 'bg-orange-100', text: 'text-orange-600'}} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {['all', 'pending', 'approved', 'rejected', 'expired'].map(tab => (
              <button key={tab} onClick={() => setFilter(tab)} className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${filter === tab ? 'text-emerald-700 border-b-2 border-emerald-700' : 'text-gray-600 hover:text-emerald-700'}`}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700 mx-auto"></div></div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredMembers.map(member => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{member.company_name}</div>
                            <div className="text-sm text-gray-500">{new Date(member.created_at).toLocaleDateString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{member.contact_person}</div>
                            <div className="text-sm text-gray-500">{member.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.district}, {member.city}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                              member.status === 'approved' ? 'bg-green-100 text-green-800' :
                              member.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              member.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>{member.status === 'approved' && member.expiry_date && new Date(member.expiry_date) < new Date() ? 'Expired' : member.status}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-4">
                              <Link to={`/admin/member/${member.id}`} className="text-gray-400 hover:text-blue-600" title="View Details">
                                <Eye size={18} />
                              </Link>
                              {member.status === 'approved' && member.expiry_date && new Date(member.expiry_date) < new Date() && (
                                <button
                                  onClick={() => renewMembership(member.id)}
                                  disabled={!!processingId}
                                  className="text-gray-400 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                  title="Renew Membership"
                                >
                                  {processingId === member.id ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-4 p-4">
                  {filteredMembers.map(member => (
                    <div key={member.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm">{member.company_name}</h3>
                          <p className="text-xs text-gray-500">{member.contact_person}</p>
                          <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          member.status === 'approved' ? 'bg-green-100 text-green-800' :
                          member.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          member.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {member.status === 'approved' && member.expiry_date && new Date(member.expiry_date) < new Date() ? 'Expired' : member.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mb-3">
                        {member.district}, {member.city}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(member.created_at).toLocaleDateString()}
                        </span>
                        <div className="flex items-center space-x-3">
                          <Link to={`/admin/member/${member.id}`} className="text-gray-400 hover:text-blue-600" title="View Details">
                            <Eye size={16} />
                          </Link>
                          {member.status === 'approved' && member.expiry_date && new Date(member.expiry_date) < new Date() && (
                            <button
                              onClick={() => renewMembership(member.id)}
                              disabled={!!processingId}
                              className="text-gray-400 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              title="Renew Membership"
                            >
                              {processingId === member.id ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
