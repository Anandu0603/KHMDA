import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Navigate } from 'react-router-dom';
import { BarChart3, Download, Calendar, IndianRupee, Users, AlertTriangle, Loader2 } from 'lucide-react';
import ReactECharts from 'echarts-for-react';

interface ReportData {
  totalMembers: number;
  expiredMembers: number;
  totalPayments: number;
  totalDonations: number;
  registrationsThisMonth: number;
  districtDistribution: { [key: string]: number };
  donationDistribution: { [key: string]: number };
  topDonors: any[];
  members: any[];
  payments: any[];
}

const StatCard: React.FC<{ icon: React.ElementType, title: string, value: string | number, color: string }> = ({ icon: Icon, title, value, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <div className="flex items-center">
      <div className={`p-3 rounded-lg bg-${color}-100`}>
        <Icon className={`h-6 w-6 text-${color}-600`} />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

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
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('*')
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate + 'T23:59:59');
      if (membersError) throw membersError;

      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'completed')
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate + 'T23:59:59');
      if (paymentsError) throw paymentsError;

      const totalPayments = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
      const totalDonations = payments?.reduce((sum, payment) => sum + (payment.donation_amount || 0), 0) || 0;
      
      const { data: allMembers, error: allMembersError } = await supabase.from('members').select('*');
      if (allMembersError) throw allMembersError;

      const expiredMembers = allMembers?.filter(member => member.expiry_date && new Date(member.expiry_date) < new Date()).length || 0;

      const thisMonth = new Date();
      const startOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
      const registrationsThisMonth = allMembers?.filter(member => new Date(member.created_at) >= startOfMonth).length || 0;

      const districtDistribution: { [key: string]: number } = {};
      allMembers?.forEach(member => {
        const district = member.district || 'Unknown';
        districtDistribution[district] = (districtDistribution[district] || 0) + 1;
      });

      // Donation analysis
      const donationDistribution: { [key: string]: number } = {};
      const donorMap = new Map();
      
      payments?.forEach(payment => {
        if (payment.donation_amount && payment.donation_amount > 0) {
          const month = new Date(payment.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' });
          donationDistribution[month] = (donationDistribution[month] || 0) + payment.donation_amount;
          
          // Track individual donors
          const member = allMembers?.find(m => m.id === payment.member_id);
          if (member) {
            const existing = donorMap.get(member.id) || { member, totalDonated: 0, donationCount: 0 };
            existing.totalDonated += payment.donation_amount;
            existing.donationCount += 1;
            donorMap.set(member.id, existing);
          }
        }
      });

      const topDonors = Array.from(donorMap.values())
        .sort((a, b) => b.totalDonated - a.totalDonated)
        .slice(0, 10);

      setReportData({
        totalMembers: allMembers?.length || 0,
        expiredMembers,
        totalPayments,
        totalDonations,
        registrationsThisMonth,
        districtDistribution,
        donationDistribution,
        topDonors,
        members: members || [],
        payments: payments || []
      });
    } catch (error) {
      addToast('Failed to generate reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getChartOptions = () => {
    if (!reportData?.districtDistribution) return {};
    const sortedDistricts = Object.entries(reportData.districtDistribution).sort(([, a], [, b]) => b - a);
    const districtNames = sortedDistricts.map(([name]) => name);
    const memberCounts = sortedDistricts.map(([, count]) => count);

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: districtNames, axisLabel: { interval: 0, rotate: 45 } },
      yAxis: { type: 'value' },
      series: [{
        name: 'Members',
        type: 'bar',
        data: memberCounts,
        itemStyle: { color: '#059669' }
      }]
    };
  };

  const getDonationChartOptions = () => {
    if (!reportData?.donationDistribution) return {};
    const sortedDonations = Object.entries(reportData.donationDistribution).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());
    const months = sortedDonations.map(([month]) => month);
    const amounts = sortedDonations.map(([, amount]) => amount);

    return {
      tooltip: { 
        trigger: 'axis', 
        formatter: (params: any) => {
          const data = params[0];
          return `${data.axisValue}<br/>₹${data.value.toLocaleString()}`;
        }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: months },
      yAxis: { 
        type: 'value',
        axisLabel: {
          formatter: (value: number) => `₹${value.toLocaleString()}`
        }
      },
      series: [{
        name: 'Donations',
        type: 'line',
        data: amounts,
        smooth: true,
        itemStyle: { color: '#f59e0b' },
        areaStyle: { color: 'rgba(245, 158, 11, 0.1)' }
      }]
    };
  };

  const exportToCsv = (filename: string, headers: string[], data: any[], rowMapper: (item: any) => string[]) => {
    const csvRows = [
      [`${filename.replace('.csv', '')}`],
      ['Generated on:', new Date().toLocaleDateString('en-IN')],
      ['Date Range:', `${dateRange.startDate} to ${dateRange.endDate}`],
      [''],
      headers
    ];

    data.forEach(item => {
      csvRows.push(rowMapper(item));
    });

    const csvContent = csvRows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Report exported successfully', 'success');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 text-emerald-700 animate-spin" />
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive insights into KMDA membership and payments</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1"><Calendar className="h-4 w-4 inline mr-1" />Date Range</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input type="date" value={dateRange.startDate} onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                <span className="py-2 text-gray-500 text-center sm:text-left">to</span>
                <input type="date" value={dateRange.endDate} onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button onClick={() => exportToCsv('KMDA_Members_Report.csv', ['Company Name', 'Email', 'Mobile', 'District', 'Status', 'Member ID', 'Registration Date'], reportData?.members || [], m => [m.company_name, m.email, m.mobile, m.district, m.status, m.member_id || '', new Date(m.created_at).toLocaleDateString('en-IN')])} disabled={!reportData || loading} className="bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center text-sm"><Download className="h-4 w-4 mr-2" />Export Members</button>
              <button onClick={() => exportToCsv('KMDA_Payments_Report.csv', ['Member ID', 'Amount', 'Membership Fee', 'Gateway Charges', 'Donation Amount', 'Payment Type', 'Status', 'Payment Date'], reportData?.payments || [], p => [p.member_id, p.amount, p.membership_fee, p.gateway_charges, p.donation_amount || 0, p.payment_type, p.status, new Date(p.created_at).toLocaleDateString('en-IN')])} disabled={!reportData || loading} className="bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center text-sm"><Download className="h-4 w-4 mr-2" />Export Payments</button>
              <button onClick={() => exportToCsv('KMDA_Donations_Report.csv', ['Company Name', 'Contact Person', 'Email', 'Total Donated', 'Donation Count', 'Last Donation Date'], reportData?.topDonors || [], d => [d.member.company_name, d.member.contact_person, d.member.email, d.totalDonated, d.donationCount, new Date().toLocaleDateString('en-IN')])} disabled={!reportData || loading} className="bg-amber-700 hover:bg-amber-800 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center text-sm"><Download className="h-4 w-4 mr-2" />Export Donations</button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center"><Loader2 className="h-8 w-8 text-emerald-700 animate-spin mx-auto" /><p className="mt-2 text-gray-600">Generating reports...</p></div>
        ) : reportData ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <StatCard icon={Users} title="Total Members" value={reportData.totalMembers} color="blue" />
              <StatCard icon={IndianRupee} title="Total Payments" value={`₹${reportData.totalPayments.toLocaleString()}`} color="green" />
              <StatCard icon={IndianRupee} title="Total Donations" value={`₹${reportData.totalDonations.toLocaleString()}`} color="amber" />
              <StatCard icon={AlertTriangle} title="Expired Members" value={reportData.expiredMembers} color="red" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200"><h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center"><BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />Member Distribution by District</h2></div>
                <div className="p-4 sm:p-6">
                  <ReactECharts option={getChartOptions()} style={{ height: 300, width: '100%' }} />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200"><h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center"><IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />Donation Trends Over Time</h2></div>
                <div className="p-4 sm:p-6">
                  <ReactECharts option={getDonationChartOptions()} style={{ height: 300, width: '100%' }} />
                </div>
              </div>
            </div>

            {reportData.topDonors.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 sm:mb-8">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200"><h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center"><Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />Top Donors</h2></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Rank', 'Company', 'Contact Person', 'Total Donated', 'Count'].map(h => 
                          <th key={h} className="px-2 sm:px-4 py-2 text-left font-medium text-gray-500 uppercase">{h}</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reportData.topDonors.map((donor, index) => (
                        <tr key={donor.member.id}>
                          <td className="px-2 sm:px-4 py-2 text-gray-700 font-medium">#{index + 1}</td>
                          <td className="px-2 sm:px-4 py-2 text-gray-700">{donor.member.company_name}</td>
                          <td className="px-2 sm:px-4 py-2 text-gray-700">{donor.member.contact_person}</td>
                          <td className="px-2 sm:px-4 py-2 text-gray-700 font-semibold">₹{donor.totalDonated.toLocaleString()}</td>
                          <td className="px-2 sm:px-4 py-2 text-gray-700">{donor.donationCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-900">Payments ({reportData.payments.length})</h2></div>
                <div className="overflow-x-auto"><table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr>
                    {['Member ID', 'Amount', 'Type', 'Date'].map(h => <th key={h} className="px-4 py-2 text-left font-medium text-gray-500 uppercase">{h}</th>)}
                  </tr></thead>
                  <tbody className="divide-y divide-gray-200">{reportData.payments.map(p => <tr key={p.id}>
                    <td className="px-4 py-2 text-gray-700 truncate" title={p.member_id}>{p.member_id.substring(0, 8)}...</td>
                    <td className="px-4 py-2 text-gray-700">₹{p.amount.toLocaleString()}</td>
                    <td className="px-4 py-2"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${p.payment_type === 'renewal' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{p.payment_type}</span></td>
                    <td className="px-4 py-2 text-gray-700">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>)}</tbody>
                </table></div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-900">Registrations ({reportData.members.length})</h2></div>
                <div className="overflow-x-auto"><table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr>
                    {['Company', 'District', 'Status', 'Date'].map(h => <th key={h} className="px-4 py-2 text-left font-medium text-gray-500 uppercase">{h}</th>)}
                  </tr></thead>
                  <tbody className="divide-y divide-gray-200">{reportData.members.map(m => <tr key={m.id}>
                    <td className="px-4 py-2 text-gray-700 truncate">{m.company_name}</td>
                    <td className="px-4 py-2 text-gray-700">{m.district}</td>
                    <td className="px-4 py-2"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${m.status === 'approved' ? 'bg-green-100 text-green-800' : m.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{m.status}</span></td>
                    <td className="px-4 py-2 text-gray-700">{new Date(m.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>)}</tbody>
                </table></div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center"><p className="text-gray-600">No data available for the selected period.</p></div>
        )}
      </div>
    </div>
  );
}
