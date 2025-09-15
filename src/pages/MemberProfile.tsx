import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Navigate, Link, useParams } from 'react-router-dom';
import { Building2, Mail, Phone, MapPin, Calendar, Award, Download, User, FileText, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';

const InfoItem: React.FC<{ icon: React.ElementType, label: string, value: string | null | undefined }> = ({ icon: Icon, label, value }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500">{label}</label>
    <p className="text-base text-gray-800 flex items-center mt-1">
      <Icon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
      {value || <span className="text-gray-400">Not provided</span>}
    </p>
  </div>
);

const StatusBadge: React.FC<{ status: string, expiryDate?: string | null }> = ({ status, expiryDate }) => {
  let effectiveStatus = status;
  if (status === 'approved' && expiryDate && new Date(expiryDate) < new Date()) {
    effectiveStatus = 'expired';
  }

  const config = {
    approved: { icon: CheckCircle, text: 'Approved', color: 'text-green-700', bg: 'bg-green-100' },
    pending: { icon: Clock, text: 'Pending Approval', color: 'text-yellow-700', bg: 'bg-yellow-100' },
    rejected: { icon: XCircle, text: 'Rejected', color: 'text-red-700', bg: 'bg-red-100' },
    expired: { icon: AlertTriangle, text: 'Expired', color: 'text-orange-700', bg: 'bg-orange-100' },
  }[effectiveStatus] || { icon: AlertTriangle, text: 'Unknown', color: 'text-gray-700', bg: 'bg-gray-100' };

  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.color}`}>
      <Icon className="h-4 w-4 mr-1.5" />
      {config.text}
    </div>
  );
};

export default function MemberProfile() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { id } = useParams(); // For admin viewing
  const [member, setMember] = useState<any>(null);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
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
      
      if (id && isAdmin) {
        query = query.eq('id', id);
      } else if (user) {
        query = query.eq('email', user.email);
      } else {
        throw new Error("Not authorized to view profile.");
      }
      
      const { data, error } = await query.single();

      if (error) throw error;
      setMember(data);

      if (data) {
        const { data: certData, error: certError } = await supabase
          .from('certificates')
          .select('pdf_url')
          .eq('member_id', data.id)
          .order('generated_at', { ascending: false })
          .limit(1)
          .single();

        if (certError && certError.code !== 'PGRST116') { // Ignore "no rows" error
          throw certError;
        }

        if (certData) {
          setCertificateUrl(certData.pdf_url);
        }
      }
    } catch (error: any) {
      addToast(`Failed to load profile: ${error.message}`, 'error');
      setMember(null);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  if (!member) {
    return <Navigate to={isAdmin ? "/admin/dashboard" : "/"} replace />;
  }

  const isExpiringSoon = member.expiry_date && new Date(member.expiry_date) > new Date() &&
    new Date(member.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate flex items-center">
                  <Building2 className="h-8 w-8 mr-3 text-emerald-600" />
                  {member.company_name}
                </h1>
                <p className="mt-1 text-sm text-gray-500">Member since {new Date(member.created_at).toLocaleDateString('en-IN')}</p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <StatusBadge status={member.status} expiryDate={member.expiry_date} />
              </div>
            </div>
          </div>
        </div>

        {/* Renewal Banner */}
        {isExpiringSoon && !isAdmin && (
          <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 rounded-r-lg mb-8" role="alert">
            <p className="font-bold">Membership Expiring Soon!</p>
            <p>Your membership will expire on {new Date(member.expiry_date).toLocaleDateString('en-IN')}. Renew now to maintain your benefits.</p>
            <Link
              to="/member/renew"
              className="mt-2 inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded"
            >
              Renew Now
            </Link>
          </div>
        )}

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Contact Info */}
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Contact & Address</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InfoItem icon={User} label="Contact Person" value={member.contact_person} />
                <InfoItem icon={Mail} label="Email Address" value={member.email} />
                <InfoItem icon={Phone} label="Mobile Number" value={member.mobile} />
                <InfoItem icon={Phone} label="Alternate Phone" value={member.alternate_phone} />
                <div className="sm:col-span-2">
                   <InfoItem icon={MapPin} label="Office Address" value={`${member.address}, ${member.city}, ${member.taluk}, ${member.district}, ${member.state} - ${member.pin_code}`} />
                </div>
              </div>
            </div>

            {/* Uploaded Documents (Admin Only) */}
            {isAdmin && (
              <div className="bg-white p-8 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Uploaded Documents</h2>
                <div className="space-y-4">
                  {member.drug_license_url ? (
                    <a href={member.drug_license_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <span className="font-medium text-blue-600 flex items-center"><FileText className="h-5 w-5 mr-2" /> Drug License</span>
                      <Download className="h-5 w-5 text-gray-400" />
                    </a>
                  ) : <p className="text-gray-500">No Drug License uploaded.</p>}
                  
                  {member.id_proof_url ? (
                    <a href={member.id_proof_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <span className="font-medium text-blue-600 flex items-center"><FileText className="h-5 w-5 mr-2" /> ID Proof</span>
                      <Download className="h-5 w-5 text-gray-400" />
                    </a>
                  ) : <p className="text-gray-500">No ID Proof uploaded.</p>}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Membership Details */}
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Membership Details</h2>
              <div className="space-y-6">
                <InfoItem icon={Building2} label="Business Category" value={member.category} />
                <InfoItem icon={Calendar} label="GSTIN" value={member.gstin} />
                {member.status === 'approved' && (
                  <>
                    <InfoItem icon={Award} label="Member ID" value={member.membership_id} />
                    <InfoItem icon={Calendar} label="Expires On" value={member.expiry_date ? new Date(member.expiry_date).toLocaleDateString('en-IN') : 'N/A'} />
                  </>
                )}
              </div>
            </div>

            {/* Certificate */}
            {certificateUrl && (
              <div className="bg-white p-8 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Certificate</h2>
                <a
                  href={certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Download Certificate
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
