import React, { useEffect, useState } from 'react';
import {
  Users,
  FileCheck2,
  AlertOctagon,
  CalendarCheck,
  BellRing,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { api } from '../services/api';
import { DashboardMetrics, AlertItem } from '../types';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [m, a] = await Promise.all([
        api.getDashboardMetrics(),
        api.getAlerts({ limit: 5 }),
      ]);
      setMetrics(m);
      setRecentAlerts(a);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Prepare chart data
  const riskChartData = Object.entries(metrics.risk_distribution).map(([key, val]) => ({
    name: key,
    value: val,
  }));
  const RISK_COLORS: Record<string, string> = {
    LOW: '#10b981',
    MEDIUM: '#f59e0b',
    HIGH: '#ef4444',
  };

  const completenessChartData = Object.entries(metrics.completeness_distribution).map(([key, val]) => ({
    tier: key,
    count: val,
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-emerald-500/20 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            Compliance & KYC Intelligence Monitor
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Live compliance monitoring engine across customer onboarding evidence, automated document expiration alerts, periodic review SLA deadlines, and rule-based anomaly detection.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
          <TrendingUp className="w-4 h-4" />
          <span>Real-Time Engine Sync</span>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Customers"
          value={metrics.total_customers.toLocaleString()}
          subtitle={`${metrics.individual_customers} Ind. / ${metrics.business_customers} Biz`}
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Verified Documents"
          value={metrics.verified_documents.toLocaleString()}
          subtitle={`${metrics.pending_documents} pending review`}
          icon={FileCheck2}
          color="emerald"
        />
        <StatCard
          title="Expired Documents"
          value={metrics.expired_documents}
          subtitle={`${metrics.expiring_soon_documents} expiring soon`}
          icon={AlertOctagon}
          color="rose"
        />
        <StatCard
          title="Overdue Reviews"
          value={metrics.overdue_reviews}
          subtitle={`${metrics.pending_reviews} pending SLA`}
          icon={CalendarCheck}
          color="amber"
        />
        <StatCard
          title="Active Alerts"
          value={metrics.active_alerts}
          subtitle="Open compliance items"
          icon={BellRing}
          color="rose"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Chart */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Risk Tier Distribution</h3>
              <p className="text-xs text-slate-400">Customer portfolio segmented by multi-factor score</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {metrics.total_customers} Total
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {riskChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name] || '#38bdf8'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KYC Completeness Distribution Chart */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">KYC Completeness Tiers</h3>
              <p className="text-xs text-slate-400">Derived from verified mandatory requirement evidence</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              Deterministic Derived
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completenessChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="tier" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Alerts Feed */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Critical & High Severity Alerts</h3>
            <p className="text-xs text-slate-400">Expirations and compliance flags requiring operations attention</p>
          </div>
          <Badge variant="warning">{metrics.active_alerts} Total Open</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 uppercase text-[10px] tracking-wider text-slate-400">
              <tr>
                <th className="py-2.5 px-3">Alert ID</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Alert Type</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {recentAlerts.map((alt) => (
                <tr key={alt.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-3 font-mono text-emerald-400">{alt.id}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-200">{alt.customer_id}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-200">{alt.alert_type}</td>
                  <td className="py-2.5 px-3">
                    <Badge variant={alt.severity === 'HIGH' || alt.severity === 'CRITICAL' ? 'danger' : 'warning'}>
                      {alt.severity}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 max-w-md truncate">{alt.description}</td>
                  <td className="py-2.5 px-3">
                    <Badge variant={alt.status === 'OPEN' ? 'danger' : 'success'}>
                      {alt.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
