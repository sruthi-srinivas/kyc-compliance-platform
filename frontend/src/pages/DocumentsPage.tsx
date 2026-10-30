import React, { useEffect, useState } from 'react';
import { FileText, Search, RefreshCw, Calendar, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { DocumentItem } from '../types';
import { Badge } from '../components/Badge';

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [docType, setDocType] = useState<string>('');
  const [lifecycleState, setLifecycleState] = useState<string>('');
  const [customerIdFilter, setCustomerIdFilter] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const limit = 25;

  useEffect(() => {
    loadDocuments();
  }, [docType, lifecycleState, page]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await api.getDocuments({
        customer_id: customerIdFilter.trim() || undefined,
        document_type: docType || undefined,
        lifecycle_state: lifecycleState || undefined,
        skip: page * limit,
        limit,
      });
      setDocuments(data);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadDocuments();
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              Document Evidence Register
            </h2>
            <p className="text-xs text-slate-400">Physical and digital credentials supporting KYC onboarding</p>
          </div>
          <button
            onClick={() => { setPage(0); loadDocuments(); }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
          <form onSubmit={handleFilterSubmit} className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={customerIdFilter}
              onChange={(e) => setCustomerIdFilter(e.target.value)}
              placeholder="Filter by Customer ID (e.g. CUS-000001)..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </form>

          <select
            value={docType}
            onChange={(e) => { setDocType(e.target.value); setPage(0); }}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Document Types</option>
            <option value="GOVERNMENT_ID">Government ID</option>
            <option value="PROOF_OF_ADDRESS">Proof of Address</option>
            <option value="CERT_INCORPORATION">Cert of Incorporation</option>
            <option value="ARTICLES_OF_ASSOC">Articles of Association</option>
            <option value="UBO_DECLARATION">UBO Declaration</option>
            <option value="DIRECTORS_REGISTER">Directors Register</option>
            <option value="PROOF_OF_WEALTH">Proof of Wealth</option>
          </select>

          <select
            value={lifecycleState}
            onChange={(e) => { setLifecycleState(e.target.value); setPage(0); }}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Lifecycle States</option>
            <option value="VALID">Valid</option>
            <option value="EXPIRED">Expired</option>
            <option value="SUPERSEDED">Superseded</option>
            <option value="REVOKED">Revoked</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Document ID</th>
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Document Type</th>
                <th className="py-3 px-4">Document Number</th>
                <th className="py-3 px-4">Issuing Authority</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Lifecycle State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading document evidence...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No documents found matching the filter.
                  </td>
                </tr>
              ) : (
                documents.map((d) => {
                  const isExpired = d.expiry_date && d.expiry_date < '2026-10-22';
                  return (
                    <tr key={d.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-semibold text-emerald-400">{d.id}</td>
                      <td className="py-3 px-4 font-mono text-slate-200">{d.customer_id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-100">{d.document_type}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{d.document_number}</td>
                      <td className="py-3 px-4">{d.issuing_authority || d.issuing_country}</td>
                      <td className="py-3 px-4">{d.issue_date}</td>
                      <td className="py-3 px-4">
                        {d.expiry_date ? (
                          <span className={isExpired ? 'text-rose-400 font-bold' : ''}>
                            {d.expiry_date}
                          </span>
                        ) : (
                          <span className="text-slate-500">Perpetual</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={d.lifecycle_state === 'VALID' ? 'success' : 'danger'}>
                          {d.lifecycle_state}
                        </Badge>
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
              disabled={documents.length < limit}
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
