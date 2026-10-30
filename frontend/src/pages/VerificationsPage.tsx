import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Clock, RefreshCw, MessageSquare } from 'lucide-react';
import { api } from '../services/api';
import { Verification } from '../types';
import { Badge } from '../components/Badge';

export const VerificationsPage: React.FC = () => {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const limit = 20;

  useEffect(() => {
    loadVerifications();
  }, [statusFilter, page]);

  const loadVerifications = async () => {
    try {
      setLoading(true);
      const data = await api.getVerifications({
        status: statusFilter || undefined,
        skip: page * limit,
        limit,
      });
      setVerifications(data);
    } catch (err) {
      console.error('Error fetching verifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusUpdate = async (docId: string, newStatus: string) => {
    try {
      setActionLoading(true);
      await api.verifyDocument(docId, {
        status: newStatus,
        actor: 'OPERATIONS_ANALYST',
        analyst_notes: `Status changed to ${newStatus} via Operations Analyst console.`,
      });
      await loadVerifications();
    } catch (err) {
      console.error('Error updating verification status:', err);
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
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Operations Analyst Verification Console
            </h2>
            <p className="text-xs text-slate-400">Review onboarding evidence and validate identity legitimacy</p>
          </div>
          <button
            onClick={() => { setPage(0); loadVerifications(); }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Verification Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Verification ID</th>
                <th className="py-3 px-4">Document ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Reviewing Actor</th>
                <th className="py-3 px-4">Verified Timestamp</th>
                <th className="py-3 px-4">Analyst Notes</th>
                <th className="py-3 px-4 text-right">Quick Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading verification checks...
                  </td>
                </tr>
              ) : verifications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No verification records found.
                  </td>
                </tr>
              ) : (
                verifications.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-400">{v.id}</td>
                    <td className="py-3 px-4 font-mono text-slate-200">{v.document_id}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          v.status === 'VERIFIED'
                            ? 'success'
                            : v.status === 'PENDING_REVIEW'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {v.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">{v.verified_by_actor}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {v.verified_at ? new Date(v.verified_at).toLocaleString() : 'Pending'}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate">{v.analyst_notes || '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleQuickStatusUpdate(v.document_id, 'VERIFIED')}
                          disabled={actionLoading || v.status === 'VERIFIED'}
                          className="px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs flex items-center gap-1 transition disabled:opacity-30"
                          title="Approve Evidence"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleQuickStatusUpdate(v.document_id, 'REJECTED')}
                          disabled={actionLoading || v.status === 'REJECTED'}
                          className="px-2 py-1 rounded bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs flex items-center gap-1 transition disabled:opacity-30"
                          title="Reject Evidence"
                        >
                          <XCircle className="w-3 h-3" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
              disabled={verifications.length < limit}
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
