import React, { useEffect, useState } from 'react';
import { BellRing, ShieldAlert, CheckCircle, RefreshCw, Play } from 'lucide-react';
import { api } from '../services/api';
import { AlertItem } from '../types';
import { Badge } from '../components/Badge';

export const ExpiryAlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('OPEN');
  const [page, setPage] = useState<number>(0);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const limit = 20;

  useEffect(() => {
    loadAlerts();
  }, [severityFilter, statusFilter, page]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await api.getAlerts({
        severity: severityFilter || undefined,
        status: statusFilter || undefined,
        skip: page * limit,
        limit,
      });
      setAlerts(data);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (alertId: string, newStatus: string) => {
    try {
      await api.updateAlertStatus(alertId, newStatus);
      await loadAlerts();
    } catch (err) {
      console.error('Error updating alert status:', err);
    }
  };

  const handleTriggerScan = async () => {
    try {
      setScanMessage('Scanning all documents against evaluation date...');
      const res = await api.scanExpirations();
      setScanMessage(res.message);
      await loadAlerts();
      setTimeout(() => setScanMessage(null), 5000);
    } catch (err) {
      console.error('Error triggering scan:', err);
      setScanMessage('Scan failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BellRing className="w-5 h-5 text-rose-400" />
              Document Expiry &amp; Compliance Exception Monitoring
            </h2>
            <p className="text-xs text-slate-400">Automated lead time alerts for expired credentials and approaching deadlines</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleTriggerScan}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Play className="w-3.5 h-3.5" />
              Trigger Expiry Scan
            </button>
            <button
              onClick={() => { setPage(0); loadAlerts(); }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>

        {scanMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300">
            {scanMessage}
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
            <option value="DISMISSED">Dismissed</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => { setSeverityFilter(e.target.value); setPage(0); }}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Alert ID</th>
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Alert Type</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">Loading alerts...</td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">No active alerts match filter.</td>
                </tr>
              ) : (
                alerts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-400">{a.id}</td>
                    <td className="py-3 px-4 font-mono text-slate-200">{a.customer_id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-200">{a.alert_type}</td>
                    <td className="py-3 px-4">
                      <Badge variant={a.severity === 'CRITICAL' || a.severity === 'HIGH' ? 'danger' : 'warning'}>
                        {a.severity}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-sm">{a.description}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {a.related_entity_type}: {a.related_entity_id}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={a.status === 'OPEN' ? 'danger' : a.status === 'ACKNOWLEDGED' ? 'warning' : 'success'}>
                        {a.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {a.status === 'OPEN' ? (
                        <button
                          onClick={() => handleStatusUpdate(a.id, 'ACKNOWLEDGED')}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition"
                        >
                          Acknowledge
                        </button>
                      ) : a.status === 'ACKNOWLEDGED' ? (
                        <button
                          onClick={() => handleStatusUpdate(a.id, 'RESOLVED')}
                          className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs transition"
                        >
                          Resolve
                        </button>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Closed</span>
                      )}
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
              disabled={alerts.length < limit}
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
