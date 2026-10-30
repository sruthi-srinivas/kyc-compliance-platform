import React, { useEffect, useState } from 'react';
import { FileCheck2, ShieldCheck, CheckCircle, Info } from 'lucide-react';
import { api } from '../services/api';
import { KYCRequirement, CustomerType } from '../types';
import { Badge } from '../components/Badge';

export const KYCCompletenessPage: React.FC = () => {
  const [requirements, setRequirements] = useState<KYCRequirement[]>([]);
  const [customerTypes, setCustomerTypes] = useState<CustomerType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqs, types] = await Promise.all([
        api.getKYCRequirements(),
        api.getCustomerTypes(),
      ]);
      setRequirements(reqs);
      setCustomerTypes(types);
    } catch (err) {
      console.error('Error fetching KYC requirements:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileCheck2 className="w-6 h-6 text-emerald-400" />
          Regulatory KYC Completeness Engine
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Customer completeness is deterministically derived from submitted documents. A customer achieves 100% completeness only when all applicable mandatory requirements for their classification and risk level possess valid, verified evidence.
        </p>
        <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <Info className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div className="text-xs text-slate-300 font-mono">
            Completeness Score = (Count of Valid &amp; Verified Mandatory Requirements Satisfied &divide; Total Applicable Mandatory Requirements) &times; 100
          </div>
        </div>
      </div>

      {/* Customer Classifications */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {customerTypes.map((ct) => (
          <div key={ct.code} className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-mono text-xs font-bold text-emerald-400">{ct.code}</span>
              <Badge variant={ct.requires_ubo ? 'warning' : 'neutral'}>
                {ct.requires_ubo ? 'Mandates UBO' : 'No UBO'}
              </Badge>
            </div>
            <h4 className="text-sm font-bold text-white">{ct.name}</h4>
            <p className="text-xs text-slate-400">{ct.description || 'Standard regulatory profile'}</p>
          </div>
        ))}
      </div>

      {/* Requirements Table */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800">
        <h3 className="text-sm font-bold text-white mb-1">Mandatory &amp; Enhanced KYC Requirement Matrix</h3>
        <p className="text-xs text-slate-400 mb-4">Evidence types enforced across risk tiers and corporate structures</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Rule ID</th>
                <th className="py-2.5 px-3">Customer Classification</th>
                <th className="py-2.5 px-3">Risk Tier</th>
                <th className="py-2.5 px-3">Required Document Type</th>
                <th className="py-2.5 px-3">Mandatory Enforcement</th>
                <th className="py-2.5 px-3">Validity Window</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {requirements.map((req) => (
                <tr key={req.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono text-emerald-400">{req.id}</td>
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-200">{req.customer_type_code}</td>
                  <td className="py-2.5 px-3">
                    <Badge variant={req.risk_level === 'HIGH' ? 'danger' : req.risk_level === 'LOW' ? 'success' : 'info'}>
                      {req.risk_level}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-100">{req.document_type}</td>
                  <td className="py-2.5 px-3">
                    <Badge variant={req.is_mandatory ? 'danger' : 'neutral'}>
                      {req.is_mandatory ? 'Mandatory' : 'Optional / Enhanced'}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 font-mono">{req.validity_period_days} Days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
