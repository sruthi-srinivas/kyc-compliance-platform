import React, { useEffect, useState } from 'react';
import { PieChart, Building2, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { BeneficialOwner } from '../types';
import { Badge } from '../components/Badge';

export const BeneficialOwnersPage: React.FC = () => {
  const [owners, setOwners] = useState<BeneficialOwner[]>([]);
  const [reconciliation, setReconciliation] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [businessFilter, setBusinessFilter] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [businessFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [u, r] = await Promise.all([
        api.getBeneficialOwners({ business_id: businessFilter.trim() || undefined, limit: 100 }),
        api.getUBOReconciliation(),
      ]);
      setOwners(u);
      setReconciliation(r);
    } catch (err) {
      console.error('Error fetching UBO data:', err);
    } finally {
      setLoading(false);
    }
  };

  const excessCount = reconciliation.filter((r) => !r.is_valid).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <PieChart className="w-6 h-6 text-emerald-400" />
              Ultimate Beneficial Ownership (UBO) Governance
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Tracks natural persons holding &ge; 25% equity or voting control in corporate entities. Automated reconciliation checks enforce the arithmetic constraint that declared ownership percentages must not exceed 100.0%.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={excessCount > 0 ? 'danger' : 'success'}>
              {excessCount > 0 ? `${excessCount} Reconciliation Failures (>100%)` : 'All Corporate Cap Tables Balanced'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Reconciliation Alert Widget (Scenario 3 Anomaly Callout) */}
      {excessCount > 0 && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-rose-300">Mandatory Scenario 3 Detected: Ownership Percentage Reconciliation Failure</h4>
            <p className="text-rose-200/80">
              The detection engine identified {excessCount} corporate customer accounts where cumulative beneficial ownership percentages exceed 100.0%.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {reconciliation.filter((r) => !r.is_valid).map((fail) => (
                <span key={fail.business_customer_id} className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/40 font-mono text-[11px] text-rose-300">
                  {fail.business_customer_id}: Total {fail.total_ownership_pct}% across {fail.owner_count} owners
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* UBO Table */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-bold text-white">Declared Beneficial Owners Register</h3>
          <button
            onClick={loadData}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Owner ID</th>
                <th className="py-3 px-4">Business Entity ID</th>
                <th className="py-3 px-4">Full Legal Name</th>
                <th className="py-3 px-4">Nationality</th>
                <th className="py-3 px-4">Ownership %</th>
                <th className="py-3 px-4">Controlling Status</th>
                <th className="py-3 px-4">Passport / ID Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {owners.map((o) => (
                <tr key={o.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-semibold text-emerald-400">{o.id}</td>
                  <td className="py-3 px-4 font-mono text-slate-200">{o.business_customer_id}</td>
                  <td className="py-3 px-4 font-medium text-slate-100">{o.owner_name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-300">
                      {o.nationality}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400">{o.ownership_percentage}%</td>
                  <td className="py-3 px-4">
                    <Badge variant={o.is_controlling_person ? 'success' : 'neutral'}>
                      {o.is_controlling_person ? 'Controlling Person' : 'Shareholder'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">{o.id_document_number || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
