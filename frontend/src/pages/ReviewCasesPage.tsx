import React, { useEffect, useState } from 'react';
import { CalendarCheck2, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { ReviewCase } from '../types';
import { Badge } from '../components/Badge';

export const ReviewCasesPage: React.FC = () => {
  const [cases, setCases] = useState<ReviewCase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [overdueOnly, setOverdueOnly] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [resolveModalCase, setResolveModalCase] = useState<ReviewCase | null>(null);
  const [resolutionDecision, setResolutionDecision] = useState<string>('MAINTAIN_RATING');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const limit = 20;

  useEffect(() => {
    loadCases();
  }, [statusFilter, overdueOnly, page]);

  const loadCases = async () => {
    try {
      setLoading(true);
      const data = await api.getReviewCases({
        status: statusFilter || undefined,
        is_overdue: overdueOnly ? true : undefined,
        skip: page * limit,
        limit,
      });
      setCases(data);
    } catch (err) {
      console.error('Error fetching review cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveModalCase) return;
    try {
      setActionLoading(true);
      await api.updateReviewCase(
        resolveModalCase.id,
        {
          status: 'RESOLVED',
          resolution_decision: resolutionDecision,
          resolution_notes: resolutionNotes || 'Periodic review concluded and documented.',
        },
        'RISK_REVIEWER'
      );
      setResolveModalCase(null);
      setResolutionNotes('');
      await loadCases();
    } catch (err) {
      console.error('Error resolving review case:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CalendarCheck2 className="w-5 h-5 text-emerald-400" />
              Periodic &amp; Event-Driven Compliance Reviews
            </h2>
            <p className="text-xs text-slate-400">Scheduled compliance reviews driven by customer risk tiers and SLA deadlines</p>
          </div>
          <button
            onClick={() => { setPage(0); loadCases(); }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Review Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-900 px-3 py-2 rounded-lg border border-slate-700">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => { setOverdueOnly(e.target.checked); setPage(0); }}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
            />
            <span>Show Overdue Only</span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Review Case ID</th>
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Review Type</th>
                <th className="py-3 px-4">Scheduled Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Overdue Flag</th>
                <th className="py-3 px-4">Resolution Decision</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading review cases...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No review cases match filter.
                  </td>
                </tr>
              ) : (
                cases.map((c) => {
                  const isInvalidClosure = c.status === 'CLOSED' && !c.resolution_decision;
                  return (
                    <tr key={c.id} className={`hover:bg-slate-800/40 transition ${isInvalidClosure ? 'bg-rose-950/20' : ''}`}>
                      <td className="py-3 px-4 font-mono font-semibold text-emerald-400">{c.id}</td>
                      <td className="py-3 px-4 font-mono text-slate-200">{c.customer_id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-300">{c.review_type}</td>
                      <td className="py-3 px-4 font-mono text-slate-200">{c.scheduled_due_date}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            c.status === 'RESOLVED'
                              ? 'success'
                              : c.status === 'CLOSED'
                              ? 'neutral'
                              : 'warning'
                          }
                        >
                          {c.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {c.is_overdue ? (
                          <Badge variant="danger">Overdue SLA</Badge>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">On Schedule</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isInvalidClosure ? (
                          <span className="text-rose-400 font-bold text-[11px] flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Unresolved Closure (Scenario 4)
                          </span>
                        ) : (
                          <span className="font-mono text-slate-300 text-[11px]">
                            {c.resolution_decision || 'Pending Decision'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setResolveModalCase(c)}
                          disabled={c.status === 'RESOLVED'}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition disabled:opacity-40"
                        >
                          Resolve
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
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
              disabled={cases.length < limit}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Resolve Review Modal */}
      {resolveModalCase && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700 w-full max-w-md bg-slate-900">
            <h3 className="text-base font-bold text-white mb-2">
              Record Review Case Resolution
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Case ID: <strong className="text-emerald-400 font-mono">{resolveModalCase.id}</strong> (Customer: {resolveModalCase.customer_id})
            </p>
            <form onSubmit={handleResolveSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Compliance Decision</label>
                <select
                  value={resolutionDecision}
                  onChange={(e) => setResolutionDecision(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="MAINTAIN_RATING">Maintain Current Rating</option>
                  <option value="UPGRADE_RISK">Upgrade Risk Tier (Increased Exposure)</option>
                  <option value="DOWNGRADE_RISK">Downgrade Risk Tier (Reduced Risk)</option>
                  <option value="OFFBOARD">Offboard / Terminate Account</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Compliance Resolution Notes</label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Document source of wealth verification, adverse media check results, and sign-off justification..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 h-20"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolveModalCase(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition"
                >
                  Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
