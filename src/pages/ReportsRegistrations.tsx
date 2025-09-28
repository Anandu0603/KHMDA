import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Calendar, Download, ArrowLeft, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Member } from '../types/database';

const ReportsRegistrations: React.FC = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchMembers();
    }
  }, [authLoading, isAdmin, dateRange.startDate, dateRange.endDate]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate + 'T23:59:59');
      if (error) throw error;
      setMembers(data || []);
    } catch (e) {
      addToast('Failed to load registrations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportToCsv = () => {
    const filename = 'KMDA_Registrations_Report.csv';
    const headers = ['Company Name', 'Email', 'Mobile', 'District', 'Status', 'Membership ID', 'Registration Date'];
    const rows = members.map(m => [
      m.company_name,
      m.email,
      m.mobile,
      m.district,
      m.status,
      m.membership_id || '',
      new Date(m.created_at).toLocaleDateString('en-IN')
    ]);

    const csvRows = [
      ['KMDA Registrations Report'],
      ['Generated on:', new Date().toLocaleDateString('en-IN')],
      ['Date Range:', `${dateRange.startDate} to ${dateRange.endDate}`],
      [''],
      headers,
      ...rows
    ];

    const csvContent = csvRows.map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Registrations report exported successfully', 'success');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/admin/reports" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 text-sm font-medium">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Reports
          </Link>
          <button onClick={exportToCsv} disabled={loading || members.length === 0} className="bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center text-sm">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="h-4 w-4 inline mr-1" /> Date Range
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input type="date" value={dateRange.startDate} onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                <span className="py-2 text-gray-500 text-center sm:text-left">to</span>
                <input type="date" value={dateRange.endDate} onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
            </div>
            <div className="text-sm text-gray-600 flex items-center">
              <Users className="h-4 w-4 mr-2" /> Total: {members.length}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Registrations</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-600">Loading...</div>
            ) : members.length === 0 ? (
              <div className="p-8 text-center text-gray-600">No registrations found for the selected period.</div>
            ) : (
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Company Name', 'Email', 'Mobile', 'District', 'Status', 'Membership ID', 'Registration Date'].map(h => (
                      <th key={h} className="px-2 sm:px-4 py-2 text-left font-medium text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {members.map(m => (
                    <tr key={m.id}>
                      <td className="px-2 sm:px-4 py-2 text-gray-700"><Link to={`/admin/member/${m.id}`} className="text-emerald-700 hover:text-emerald-800 hover:underline">{m.company_name}</Link></td>
                      <td className="px-2 sm:px-4 py-2 text-gray-700">{m.email}</td>
                      <td className="px-2 sm:px-4 py-2 text-gray-700">{m.mobile}</td>
                      <td className="px-2 sm:px-4 py-2 text-gray-700">{m.district}</td>
                      <td className="px-2 sm:px-4 py-2"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${m.status === 'approved' ? 'bg-green-100 text-green-800' : m.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : m.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{m.status}</span></td>
                      <td className="px-2 sm:px-4 py-2 text-gray-700 font-mono">{m.membership_id || '-'}</td>
                      <td className="px-2 sm:px-4 py-2 text-gray-700">{new Date(m.created_at).toLocaleDateString('en-IN')}</td>
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
};

export default ReportsRegistrations;