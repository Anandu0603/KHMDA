import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Navigate } from 'react-router-dom';
import { BarChart3, Download, Calendar, IndianRupee } from 'lucide-react';

interface ReportData {
  totalMembers: number;
  expiredMembers: number;
  totalPayments: number;
  totalDonations: number;
  registrationsThisMonth: number;
  districtDistribution: { [key: string]: number };
  members: any[];
  payments: any[];
}

export default function ReportsPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const { addToast } = useToast();

  useEffect(() => {
    if (!authLoading && isAdmin) {
      generateReports();
    }
  }, [authLoading, isAdmin, dateRange]);

  const generateReports = async () => {
    setLoading(true);
    try {
      // Fetch members
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('*')
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate + 'T23:59:59');

      if (membersError) throw membersError;

      // Fetch payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'completed')
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate + 'T23:59:59');

      if (paymentsError) throw paymentsError;

      // Calculate stats
      const totalPayments = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
      const totalDonations = payments?.reduce((sum, payment) => sum + (payment.donation_amount || 0), 0) || 0;
      
      const { data: allMembers, error: allMembersError } = await supabase
        .from('members')
        .select('*');

      if (allMembersError) throw allMembersError;

      const expiredMembers = allMembers?.filter(member => 
        member.expires_at && new Date(member.expires_at) < new Date()
      ).length || 0;

      const thisMonth = new Date();
      const startOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
      const registrationsThisMonth = allMembers?.filter(member =>
        new Date(member.created_at) >= startOfMonth
      ).length || 0;

      // Calculate district distribution
      const districtDistribution: { [key: string]: number } = {};
      allMembers?.forEach(member => {
        const district = member.district || 'Unknown';
        districtDistribution[district] = (districtDistribution[district] || 0) + 1;
      });
      setReportData({
        totalMembers: allMembers?.length || 0,
        expiredMembers,
        totalPayments,
        totalDonations,
        registrationsThisMonth,
        districtDistribution,
        members: members || [],
        payments: payments || []
      });

    } catch (error) {
      addToast('Failed to generate reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportMembersToExcel = () => {
    if (!reportData) return;

    const csvData = [
      ['KMDA Members Report'],
      ['Generated on:', new Date().toLocaleDateString('en-IN')],
      ['Date Range:', `${dateRange.startDate} to ${dateRange.endDate}`],
      [''],
      ['Company Name', 'Email', 'Mobile', 'District', 'Status', 'Member ID', 'Registration Date']
    ];

    reportData.members.forEach(member => {
      csvData.push([
        member.company_name,
        member.email,
        member.mobile,
        member.district,
        member.status,
        member.member_id || '',
        new Date(member.created_at).toLocaleDateString('en-IN')
      ]);
    });

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KMDA_Members_Report_${dateRange.startDate}_to_${dateRange.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    addToast('Report exported successfully', 'success');
  };

  const exportPaymentsToExcel = () => {
    if (!reportData) return;

    const csvData = [
      ['KMDA Payments Report'],
      ['Generated on:', new Date().toLocaleDateString('en-IN')],
      ['Date Range:', `${dateRange.startDate} to ${dateRange.endDate}`],
      [''],
      ['Member ID', 'Amount', 'Membership Fee', 'Gateway Charges', 'Donation Amount', 'Payment Type', 'Status', 'Payment Date']
    ];

    reportData.payments.forEach(payment => {
      csvData.push([
        payment.member_id,
        payment.amount,
        payment.membership_fee,
        payment.gateway_charges,
        payment.donation_amount || 0,
        payment.payment_type,
        payment.status,
        new Date(payment.created_at).toLocaleDateString('en-IN')
      ]);
    });

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KMDA_Payments_Report_${dateRange.startDate}_to_${dateRange.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    addToast('Payments report exported successfully', 'success');
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reports & Analytics
          </h1>
          <p className="text-gray-600">
            Comprehensive insights into KMDA membership and payments
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date Range
              </label>
              <div className="flex gap-3">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <span className="py-2 text-gray-500">to</span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            <button
              onClick={exportMembersToExcel}
              disabled={!reportData || loading}
              className="bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Members
            </button>
            <button
              onClick={exportPaymentsToExcel}
              disabled={!reportData || loading}
              className="bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Payments
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700 mx-auto"></div>
            <p className="text-gray-600 mt-2">Generating reports...</p>
          </div>
        ) : reportData ? (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Members</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.totalMembers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <IndianRupee className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Payments</p>
                    <p className="text-2xl font-bold text-gray-900">₹{reportData.totalPayments.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <IndianRupee className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Donations</p>
                    <p className="text-2xl font-bold text-gray-900">₹{reportData.totalDonations.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Expired Members</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.expiredMembers}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* District Distribution */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Member Distribution by District
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(reportData.districtDistribution).map(([district, count]) => (
                    <div key={district} className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-gray-900">{district}</div>
                      <div className="text-lg font-bold text-emerald-700">{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            {/* Payments Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Payments in Selected Period ({reportData.payments.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Member ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Membership Fee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Donation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.payments.map(payment => (
                      <tr key={payment.id}>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {payment.member_id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          ₹{payment.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          ₹{payment.membership_fee.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          ₹{(payment.donation_amount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {payment.payment_type}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(payment.created_at).toLocaleDateString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            </div>
            {/* Recent Registrations */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Registrations in Selected Period ({reportData.members.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        District
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Registration Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.members.map(member => (
                      <tr key={member.id}>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {member.company_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {member.district}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            member.status === 'approved' ? 'bg-green-100 text-green-800' :
                            member.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {member.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(member.created_at).toLocaleDateString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600">No data available for the selected period</p>
          </div>
        )}
      </div>
    </div>
  );
}