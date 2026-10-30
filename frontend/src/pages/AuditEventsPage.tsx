import React, { useEffect, useState } from 'react';
import { History, Search, RefreshCw, Filter, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { AuditEvent } from '../types';
import { Badge } from '../components/Badge';

export const AuditEventsPage: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [entityType, setEntityType] = useState<string>('');
  const [actorFilter, setActorFilter] = useState<string>('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const limit = 25;

  useEffect(() => {
    loadEvents();
  }, [entityType, actorFilter, eventTypeFilter, page]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditEvents({
        entity_type: entityType || undefined,
        actor: actorFilter || undefined,
        event_type: eventTypeFilter || undefined,
        skip: page * limit,
        limit,
      });
      setEvents(data);
    } catch (err) {
      console.error('Error fetching audit events:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-400" />
              Immutable Audit Trail &amp; Event Ledger
            </h2>
            <p className="text-xs text-slate-400">Complete tamper-evident chronological event history tracking state transitions</p>
          </div>
          <button
            onClick={() => { setPage(0); loadEvents(); }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={entityType}
            onChange={(e) => { setEntityType(e.target.value); setPage(0); }}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Entity Classes</option>
            <option value="Customer">Customer</option>
            <option value="Document">Document</option>
            <option value="Verification">Verification</option>
            <option value="ReviewCase">ReviewCase</option>
            <option value="Alert">Alert</option>
            <option value="RiskRating">RiskRating</option>
          </select>

          <select
            value={actorFilter}
            onChange={(e) => { setActorFilter(e.target.value); setPage(0); }}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Actors</option>
            <option value="OPERATIONS_ANALYST">Operations Analyst</option>
            <option value="RISK_REVIEWER">Risk Reviewer</option>
            <option value="SYSTEM_AUTOMATION">System Automation</option>
            <option value="CUSTOMER_ONBOARDING_PORTAL">Customer Portal</option>
          </select>

          <input
            type="text"
            value={eventTypeFilter}
            onChange={(e) => { setEventTypeFilter(e.target.value); setPage(0); }}
            placeholder="Filter Event Type (e.g. DOCUMENT_VERIFIED)..."
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Event Category</th>
                <th className="py-3 px-4">Related Entity</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">State Transition</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Loading audit history...</td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No audit events match filters.</td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-400">{ev.id}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {new Date(ev.timestamp).toISOString().replace('T', ' ').substring(0, 19)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-100">{ev.event_type}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {ev.related_entity_type}: <strong className="text-slate-100">{ev.related_entity_id}</strong>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono">
                        {ev.actor}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <span className="text-slate-500">{ev.previous_state || 'null'}</span>
                        <span className="text-slate-400">&rarr;</span>
                        <span className="text-emerald-400 font-semibold">{ev.new_state}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-sm truncate">{ev.event_details || '—'}</td>
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
              disabled={events.length < limit}
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
