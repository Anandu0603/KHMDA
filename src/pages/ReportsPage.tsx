import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Navigate, Link } from 'react-router-dom';
import { BarChart3, Calendar, Users, AlertTriangle, Loader2, FileSpreadsheet } from 'lucide-react';
import ReactECharts from 'echarts-for-react';

interface ReportData {
  totalRegistrations: number;
  expiredMembers: number;
  registrationsThisMonth: number;
  districtDistribution: { [key: string]: number };
  members: any[];
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

      setReportData({
        totalRegistrations: allMembers?.length || 0,
        expiredMembers,
        registrationsThisMonth,
        districtDistribution,
        members: members || []
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
    const registrationCounts = sortedDistricts.map(([, count]) => count);

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: districtNames, axisLabel: { interval: 0, rotate: 45 } },
      yAxis: { type: 'value' },
      series: [{
        name: 'Registrations',
        type: 'bar',
        data: registrationCounts,
        itemStyle: { color: '#059669' }
      }]
    };
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
          <p className="text-gray-600">Comprehensive insights into KMDA membership</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link to="/admin/reports/registrations" className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center text-sm">
                <FileSpreadsheet className="h-4 w-4 mr-2" /> Registrations
              </Link>
              <Link to="/admin/reports/payments" className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center text-sm">
                <FileSpreadsheet className="h-4 w-4 mr-2" /> Payments
              </Link>
              <Link to="/admin/reports/donations" className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center text-sm">
                <FileSpreadsheet className="h-4 w-4 mr-2" /> Donations
              </Link>
            </div>
            <p className="text-sm text-gray-600">Select a report to view data with date range filters and export as CSV.</p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center"><Loader2 className="h-8 w-8 text-emerald-700 animate-spin mx-auto" /><p className="mt-2 text-gray-600">Generating reports...</p></div>
        ) : reportData ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <StatCard icon={Users} title="Total Registrations" value={reportData.totalRegistrations} color="blue" />
              <StatCard icon={AlertTriangle} title="Expired Members" value={reportData.expiredMembers} color="red" />
            </div>

            <div className="mb-6 sm:mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200"><h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center"><BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />Registrations Distribution by District</h2></div>
                <div className="p-4 sm:p-6">
                  <ReactECharts option={getChartOptions()} style={{ height: 300, width: '100%' }} />
                </div>
              </div>
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
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center"><p className="text-gray-600">No data available for the selected period.</p></div>
        )}
      </div>
    </div>
  );
}