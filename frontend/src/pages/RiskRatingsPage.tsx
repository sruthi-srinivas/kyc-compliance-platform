import React, { useEffect, useState } from 'react';
import { ShieldAlert, RefreshCw, Layers, Sliders } from 'lucide-react';
import { api } from '../services/api';
import { RiskRating } from '../types';
import { Badge } from '../components/Badge';

export const RiskRatingsPage: React.FC = () => {
  const [ratings, setRatings] = useState<RiskRating[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [riskFilter, setRiskFilter] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const limit = 20;

  useEffect(() => {
    loadRatings();
  }, [riskFilter, page]);

  const loadRatings = async () => {
    try {
      setLoading(true);
      const data = await api.getRiskRatings({
        risk_level: riskFilter || undefined,
        skip: page * limit,
        limit,
      });
      setRatings(data);
    } catch (err) {
      console.error('Error fetching risk ratings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-amber-400" />
          Customer Risk Governance &amp; Scoring Engine
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Deterministic quantitative risk rating ($0.0 - 100.0$) evaluated through weighted components: customer classification (20%), jurisdiction risk rating (30%), industry sector exposure (35%), and negative screening alert history (15%).
        </p>

        {/* Scoring Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/30">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-emerald-400">Low Risk Tier</span>
              <span className="font-mono text-xs text-slate-300">0.0 &le; Score &lt; 40.0</span>
            </div>
            <p className="text-xs text-slate-400">Periodic Review Cycle: <strong className="text-slate-200">36 Months (3 Years)</strong></p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/30">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-amber-400">Medium Risk Tier</span>
              <span className="font-mono text-xs text-slate-300">40.0 &le; Score &lt; 70.0</span>
            </div>
            <p className="text-xs text-slate-400">Periodic Review Cycle: <strong className="text-slate-200">12 Months (1 Year)</strong></p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900 border border-rose-500/30">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-rose-400">High Risk Tier</span>
              <span className="font-mono text-xs text-slate-300">70.0 &le; Score &le; 100.0</span>
            </div>
            <p className="text-xs text-slate-400">Periodic Review Cycle: <strong className="text-slate-200">6 Months</strong></p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <select
            value={riskFilter}
            onChange={(e) => { setRiskFilter(e.target.value); setPage(0); }}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Risk Tiers</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>
        </div>
        <button
          onClick={() => { setPage(0); loadRatings(); }}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Rating ID</th>
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Derived Score</th>
                <th className="py-3 px-4">Risk Tier</th>
                <th className="py-3 px-4">Review SLA Interval</th>
                <th className="py-3 px-4">Assessed By</th>
                <th className="py-3 px-4">Factor Breakdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {ratings.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-semibold text-emerald-400">{r.id}</td>
                  <td className="py-3 px-4 font-mono text-slate-200">{r.customer_id}</td>
                  <td className="py-3 px-4 font-mono font-bold text-white text-sm">{r.risk_score}</td>
                  <td className="py-3 px-4">
                    <Badge variant={r.risk_level === 'LOW' ? 'success' : r.risk_level === 'MEDIUM' ? 'warning' : 'danger'}>
                      {r.risk_level}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-200">{r.review_interval_months} Months</td>
                  <td className="py-3 px-4 text-slate-400 font-mono">{r.assessed_by}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400 max-w-xs truncate">
                    {r.score_breakdown || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center text-xs text-slate-400">
          <span>Page {page + 1} (Showing up to {limit} records)</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={ratings.length < limit}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
