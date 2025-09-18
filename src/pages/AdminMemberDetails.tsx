import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, AlertTriangle, Loader2, ArrowLeft, Building2, User, Mail, Phone, MapPin, FileText, Calendar, FileText as FileTextIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Member } from '../types/database';

const AdminMemberDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAdmin, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && isAdmin && id) {
      fetchMember();
    }
  }, [authLoading, isAdmin, id]);

  const fetchMember = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setMember(data);
    } catch (error) {
      addToast('Failed to load member details', 'error');
      navigate('/admin/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const updateMemberStatus = async (status: string) => {
    if (!member || !id) return;
    setProcessing(true);
    try {
      const updates: any = { status };

      if (status === 'approved') {
        const { data: membershipIdResult } = await supabase.rpc('generate_membership_id');
        updates.membership_id = membershipIdResult;
        
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        updates.expiry_date = expiryDate.toISOString();
        updates.approved_at = new Date().toISOString();
        
        const { error: certError } = await supabase.functions.invoke('generate-certificate', {
          body: {
            member_id: id,
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
        .eq('id', id);

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
      
      fetchMember();
    } catch (error: any) {
      console.error('Status update error:', error);
      addToast(`Failed to update member status: ${error.message}`, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const sendApprovalEmail = async (memberData: any) => {
    try {
      const subject = 'KMDA Membership Approved - Welcome!';
      const expiryDate = new Date(memberData.expiry_date);
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #047857; text-align: center;">Congratulations!</h1>
          <p>Hello <strong>${memberData.contact_person}</strong>,</p>
          <p>Your KMDA membership application has been successfully approved!</p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; margin: 20px 0;">
            <h2 style="color: #047857;">Your Membership Details</h2>
            <p><strong>Member ID:</strong> ${memberData.membership_id}</p>
            <p><strong>Valid Until:</strong> ${expiryDate.toLocaleDateString('en-IN')}</p>
          </div>
          <p>Best regards,<br>KMDA Administration Team</p>
        </div>
      `;
      await supabase.functions.invoke('send-email', { body: { to: memberData.email, subject, html } });
      addToast('Approval email sent.', 'success');
    } catch (error: any) {
      addToast('Member approved, but failed to send email.', 'warning');
    }
  };

  const sendRejectionEmail = async (memberData: any) => {
    try {
      const subject = 'KMDA Membership Application Status';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Application Status Update</h1>
          <p>Dear <strong>${memberData.contact_person}</strong>,</p>
          <p>We regret to inform you that your application could not be approved at this time.</p>
          <p>Best regards,<br>KMDA Administration Team</p>
        </div>
      `;
      await supabase.functions.invoke('send-email', { body: { to: memberData.email, subject, html } });
      addToast('Rejection email sent.', 'info');
    } catch (error: any) {
      addToast('Member rejected, but failed to send email.', 'warning');
    }
  };

  const generateCertificate = async () => {
    if (!member || !id || !member.membership_id) {
      addToast('Cannot generate certificate: Member not approved or missing membership ID', 'error');
      return;
    }
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-certificate', {
        body: {
          member_id: id,
          certificate_number: member.membership_id,
          valid_until: member.expiry_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      });

      if (error) throw error;

      if (data && data.certificate_url) {
        // Open certificate in new tab for viewing
        window.open(data.certificate_url, '_blank');
        addToast('Certificate generated and opened for viewing', 'success');
      } else {
        addToast('Certificate generated but URL not available for viewing', 'warning');
      }
      
      fetchMember();
    } catch (error: any) {
      console.error('Certificate generation error:', error);
      addToast(`Failed to generate certificate: ${error.message}`, 'error');
    } finally {
      setProcessing(false);
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
    navigate('/admin/login');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-center text-gray-500">Member not found</p>
        </div>
      </div>
    );
  }

  const isExpired = member.status === 'approved' && member.expiry_date && new Date(member.expiry_date) < new Date();
  const displayStatus = isExpired ? 'expired' : member.status;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center text-emerald-600 hover:text-emerald-700 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Member Details</h1>
            <p className="text-sm text-gray-600 mt-1">
              {member.company_name} - {member.contact_person}
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Company Info */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Building2 className="h-5 w-5 text-gray-400" />
                  <div>
                    <h3 className="font-medium text-gray-900">Company</h3>
                    <p className="text-sm text-gray-600">{member.company_name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <h3 className="font-medium text-gray-900">Contact Person</h3>
                    <p className="text-sm text-gray-600">{member.contact_person}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <h3 className="font-medium text-gray-900">Email</h3>
                    <p className="text-sm text-gray-600">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <h3 className="font-medium text-gray-900">Mobile</h3>
                    <p className="text-sm text-gray-600">{member.mobile}</p>
                    {member.alternate_phone && (
                      <p className="text-sm text-gray-500">Alt: {member.alternate_phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address Info */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Address</h3>
                    <p className="text-sm text-gray-600">{member.address}</p>
                    <p className="text-sm text-gray-600">
                      {member.city}, {member.taluk}, {member.district} - {member.pin_code}
                    </p>
                    <p className="text-sm text-gray-500">{member.state}</p>
                  </div>
                </div>
              </div>

              {/* Business Info */}
              <div className="space-y-4">
                {member.gstin && (
                  <div className="flex items-center space-x-3">
                    <div className="h-5 w-5 text-gray-400">GST</div>
                    <div>
                      <h3 className="font-medium text-gray-900">GSTIN</h3>
                      <p className="text-sm text-gray-600">{member.gstin}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <div className="h-5 w-5 text-gray-400">CAT</div>
                  <div>
                    <h3 className="font-medium text-gray-900">Category</h3>
                    <p className="text-sm text-gray-600">{member.category}</p>
                  </div>
                </div>

                {member.membership_id && (
                  <div className="flex items-center space-x-3">
                    <div className="h-5 w-5 text-gray-400">ID</div>
                    <div>
                      <h3 className="font-medium text-gray-900">Membership ID</h3>
                      <p className="text-sm text-gray-600 font-mono">{member.membership_id}</p>
                    </div>
                  </div>
                )}

                {member.expiry_date && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <h3 className="font-medium text-gray-900">Expiry Date</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(member.expiry_date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Documents */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-gray-400" />
                Documents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {member.drug_license_url && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Drug License</h4>
                    <a
                      href={member.drug_license_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-700 text-sm"
                    >
                      View Document
                    </a>
                  </div>
                )}
                {member.id_proof_url && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">ID Proof</h4>
                    <a
                      href={member.id_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-700 text-sm"
                    >
                      View Document
                    </a>
                  </div>
                )}
                {member.status === 'approved' && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Membership Certificate</h4>
                    <button
                      onClick={generateCertificate}
                      disabled={processing}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-medium disabled:opacity-50"
                    >
                      {processing ? 'Generating...' : 'View/Generate Certificate'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Status and Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    displayStatus === 'approved' ? 'bg-green-100' :
                    displayStatus === 'pending' ? 'bg-yellow-100' :
                    displayStatus === 'rejected' ? 'bg-red-100' :
                    'bg-orange-100'
                  }`}>
                    {displayStatus === 'approved' && <CheckCircle className="h-5 w-5 text-green-600" />}
                    {displayStatus === 'pending' && <Clock className="h-5 w-5 text-yellow-600" />}
                    {displayStatus === 'rejected' && <XCircle className="h-5 w-5 text-red-600" />}
                    {displayStatus === 'expired' && <AlertTriangle className="h-5 w-5 text-orange-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{displayStatus}</p>
                    {member.approved_at && (
                      <p className="text-sm text-gray-500">
                        Approved on {new Date(member.approved_at).toLocaleDateString('en-IN')}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      Registered on {new Date(member.created_at).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center space-x-3">
                  {member.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateMemberStatus('approved')}
                        disabled={processing}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processing ? (
                          <>
                            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="-ml-1 mr-2 h-4 w-4" />
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => updateMemberStatus('rejected')}
                        disabled={processing}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processing ? (
                          <>
                            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <XCircle className="-ml-1 mr-2 h-4 w-4" />
                            Reject
                          </>
                        )}
                      </button>
                    </>
                  )}
                  {(member.status === 'approved' || isExpired) && (
                    <>
                      {member.membership_id && (
                        <button
                          onClick={generateCertificate}
                          disabled={processing}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processing ? (
                            <>
                              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <FileTextIcon className="-ml-1 mr-2 h-4 w-4" />
                              Generate Certificate
                            </>
                          )}
                        </button>
                      )}
                      {isExpired && (
                        <Link
                          to={`/member/renew?memberId=${id}`}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                        >
                          Renew Membership
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMemberDetails;