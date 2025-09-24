import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Calendar, Download, ArrowLeft, Heart, HeartHandshake } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Donation } from '../types/database';

const ReportsDonations: React.FC = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchDonations();
    }
  }, [authLoading, isAdmin, dateRange.startDate, dateRange.endDate]);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .eq('status', 'completed')
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate + 'T23:59:59')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setDonations(data || []);
    } catch (e) {
      addToast('Failed to load donations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportToCsv = () => {
    const filename = 'KMDA_Donations_Report.csv';
    const headers = ['Donor Name', 'Email', 'Phone', 'Amount', 'Remarks', 'Payment Date'];
    const rows = donations.map(d => [
      d.donor_name || '',
      d.email || '',
      d.phone || '',
      d.amount,
      d.remarks || '',
      new Date(d.created_at).toLocaleDateString('en-IN')
    ]);

    const csvRows = [
      ['KMDA Donations Report'],
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
    addToast('Donations report exported successfully', 'success');
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
          <button onClick={exportToCsv} disabled={loading || donations.length === 0} className="bg-amber-700 hover:bg-amber-800 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center text-sm">
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
              <HeartHandshake className="h-4 w-4 mr-2" /> Total: ₹{donations.reduce((s, d) => s + (d.amount || 0), 0).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Donations</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-600">Loading...</div>
            ) : donations.length === 0 ? (
              <div className="p-8 text-center text-gray-600">No donations found for the selected period.</div>
            ) : (
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Donor Name', 'Email', 'Phone', 'Amount', 'Remarks', 'Payment Date'].map(h => (
                      <th key={h} className="px-2 sm:px-4 py-2 text-left font-medium text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {donations.map(d => (
                    <tr key={d.id}>
                      <td className="px-2 sm:px-4 py-2 text-gray-700">{d.donor_name || '-'}</td>
                      <td className="px-2 sm:px-4 py-2 text-gray-700">{d.email || '-'}</td>
                      <td className="px-2 sm:px-4 py-2 text-gray-700">{d.phone || '-'}</td>
                      <td className="px-2 sm:px-4 py-2 text-gray-700">₹{(d.amount || 0).toLocaleString()}</td>
                      <td className="px-2 sm:px-4 py-2 text-gray-700">{d.remarks || '-'}</td>
                      <td className="px-2 sm:px-4 py-2 text-gray-700">{new Date(d.created_at).toLocaleDateString('en-IN')}</td>
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

export default ReportsDonations;