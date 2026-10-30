import React, { useEffect, useState } from 'react';
import { Search, Eye, RefreshCw, Filter } from 'lucide-react';
import { api } from '../services/api';
import { Customer } from '../types';
import { Badge } from '../components/Badge';

interface CustomersPageProps {
  onSelectCustomer: (customerId: string) => void;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({ onSelectCustomer }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [customerType, setCustomerType] = useState<string>('');
  const [riskLevel, setRiskLevel] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const limit = 20;

  useEffect(() => {
    loadCustomers();
  }, [customerType, riskLevel, status, page]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.getCustomers({
        search: search.trim() || undefined,
        customer_type: customerType || undefined,
        risk_level: riskLevel || undefined,
        status: status || undefined,
        skip: page * limit,
        limit,
      });
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadCustomers();
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Customer Master Directory</h2>
            <p className="text-xs text-slate-400">Natural persons and business entities registered for KYC compliance</p>
          </div>
          <button
            onClick={() => { setPage(0); loadCustomers(); }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, ID (CUS-000001), or Reg No..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </form>

          {/* Type Filter */}
          <select
            value={customerType}
            onChange={(e) => { setCustomerType(e.target.value); setPage(0); }}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Customer Types</option>
            <option value="INDIVIDUAL">Individual</option>
            <option value="BUSINESS_SME">Business SME</option>
            <option value="BUSINESS_CORPORATE">Business Corporate</option>
          </select>

          {/* Risk Level Filter */}
          <select
            value={riskLevel}
            onChange={(e) => { setRiskLevel(e.target.value); setPage(0); }}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Risk Tiers</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Legal Name</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Jurisdiction</th>
                <th className="py-3 px-4">Completeness</th>
                <th className="py-3 px-4">Risk Tier</th>
                <th className="py-3 px-4">Onboarding Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading customer directory...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No customers match the active filters.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-400">{c.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-100">{c.full_name}</div>
                      <div className="text-[10px] text-slate-500">{c.registration_number || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-300">{c.customer_type_code}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-200">
                        {c.jurisdiction}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-28">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>{c.kyc_completeness}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              c.kyc_completeness === 100
                                ? 'bg-emerald-500'
                                : c.kyc_completeness >= 50
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${c.kyc_completeness}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          c.current_risk_level === 'LOW'
                            ? 'success'
                            : c.current_risk_level === 'MEDIUM'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {c.current_risk_level}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          c.onboarding_status === 'APPROVED'
                            ? 'success'
                            : c.onboarding_status === 'UNDER_REVIEW'
                            ? 'info'
                            : 'neutral'
                        }
                      >
                        {c.onboarding_status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectCustomer(c.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40 text-slate-300 border border-slate-700 text-xs inline-flex items-center gap-1 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </button>
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
              disabled={customers.length < limit}
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
