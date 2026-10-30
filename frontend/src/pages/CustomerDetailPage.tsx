import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  ShieldAlert,
  FileCheck2,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  Building2,
  FileText,
} from 'lucide-react';
import { api } from '../services/api';
import { Customer, DocumentItem, RiskRating, ReviewCase, BeneficialOwner } from '../types';
import { Badge } from '../components/Badge';

interface CustomerDetailPageProps {
  customerId: string;
  onBack: () => void;
}

export const CustomerDetailPage: React.FC<CustomerDetailPageProps> = ({ customerId, onBack }) => {
  const [data, setData] = useState<{
    customer: Customer;
    documents: DocumentItem[];
    risk_ratings: RiskRating[];
    review_cases: ReviewCase[];
    beneficial_owners: BeneficialOwner[];
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [verifyModalDoc, setVerifyModalDoc] = useState<DocumentItem | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<string>('VERIFIED');
  const [analystNotes, setAnalystNotes] = useState<string>('');

  useEffect(() => {
    loadDetails();
  }, [customerId]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomerDetails(customerId);
      setData(res);
    } catch (err) {
      console.error('Error loading customer details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateCompleteness = async () => {
    try {
      setActionLoading(true);
      await api.recalculateCompleteness(customerId);
      await loadDetails();
    } catch (err) {
      console.error('Error recalculating completeness:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReassessRisk = async () => {
    try {
      setActionLoading(true);
      await api.assessRisk(customerId, 'RISK_REVIEWER');
      await loadDetails();
    } catch (err) {
      console.error('Error assessing risk:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyModalDoc) return;
    try {
      setActionLoading(true);
      await api.verifyDocument(verifyModalDoc.id, {
        status: verifyStatus,
        actor: 'OPERATIONS_ANALYST',
        analyst_notes: analystNotes || undefined,
      });
      setVerifyModalDoc(null);
      setAnalystNotes('');
      await loadDetails();
    } catch (err) {
      console.error('Error verifying document:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const { customer, documents, risk_ratings, review_cases, beneficial_owners } = data;
  const currentRisk = risk_ratings.find((r) => r.is_current) || risk_ratings[0];

  return (
    <div className="space-y-6">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleRecalculateCompleteness}
            disabled={actionLoading}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
            Recalculate Completeness
          </button>
          <button
            onClick={handleReassessRisk}
            disabled={actionLoading}
            className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Re-assess Risk Score
          </button>
        </div>
      </div>

      {/* Customer Header Dossier Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm px-2.5 py-1 rounded bg-slate-800 text-emerald-400 font-bold border border-slate-700">
                {customer.id}
              </span>
              <h1 className="text-2xl font-bold text-white">{customer.full_name}</h1>
              <Badge variant={customer.onboarding_status === 'APPROVED' ? 'success' : 'info'}>
                {customer.onboarding_status}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-slate-400 mt-2.5">
              <span>Type: <strong className="text-slate-200">{customer.customer_type_code}</strong></span>
              <span>Jurisdiction: <strong className="text-slate-200">{customer.jurisdiction}</strong></span>
              <span>Reg / Tax ID: <strong className="text-slate-200 font-mono">{customer.registration_number || 'N/A'}</strong></span>
              <span>Sector: <strong className="text-slate-200">{customer.industry_sector || 'General'}</strong></span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">KYC Completeness</p>
              <p className="text-xl font-bold text-emerald-400">{customer.kyc_completeness}%</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Active Risk Tier</p>
              <Badge variant={customer.current_risk_level === 'LOW' ? 'success' : customer.current_risk_level === 'MEDIUM' ? 'warning' : 'danger'}>
                {customer.current_risk_level}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Submitted Evidence Documents */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Identity & Onboarding Evidence Documents
            </h3>
            <p className="text-xs text-slate-400">Verifiable items supporting mandatory KYC completeness</p>
          </div>
          <span className="text-xs text-slate-400">{documents.length} Submitted Items</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Document ID</th>
                <th className="py-2.5 px-3">Document Type</th>
                <th className="py-2.5 px-3">Document Number</th>
                <th className="py-2.5 px-3">Issuing Authority</th>
                <th className="py-2.5 px-3">Issue Date</th>
                <th className="py-2.5 px-3">Expiry Date</th>
                <th className="py-2.5 px-3">Lifecycle State</th>
                <th className="py-2.5 px-3 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">
                    No documents uploaded yet for this customer.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-mono text-emerald-400">{doc.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{doc.document_type}</td>
                    <td className="py-2.5 px-3 font-mono">{doc.document_number}</td>
                    <td className="py-2.5 px-3">{doc.issuing_authority || doc.issuing_country}</td>
                    <td className="py-2.5 px-3">{doc.issue_date}</td>
                    <td className="py-2.5 px-3">
                      {doc.expiry_date ? (
                        <span className={doc.expiry_date < '2026-10-22' ? 'text-rose-400 font-semibold' : ''}>
                          {doc.expiry_date}
                        </span>
                      ) : (
                        <span className="text-slate-500">Perpetual</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant={doc.lifecycle_state === 'VALID' ? 'success' : 'danger'}>
                        {doc.lifecycle_state}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setVerifyModalDoc(doc)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 inline-flex items-center gap-1 transition"
                      >
                        Verify / Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Beneficial Owners & Risk History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Beneficial Owners Table (Business Customers) */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                Beneficial Ownership (UBO) Cap Table
              </h3>
              <p className="text-xs text-slate-400">Shareholders and controlling individuals (&ge; 25%)</p>
            </div>
            {beneficial_owners.length > 0 && (
              <span className="text-xs font-mono font-bold text-emerald-400">
                Sum: {beneficial_owners.reduce((acc, curr) => acc + curr.ownership_percentage, 0).toFixed(1)}%
              </span>
            )}
          </div>
          {beneficial_owners.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Not applicable for natural person individual customers.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 uppercase text-[10px] text-slate-400">
                  <tr>
                    <th className="py-2 px-3">Owner Name</th>
                    <th className="py-2 px-3">Nationality</th>
                    <th className="py-2 px-3">Equity / Voting %</th>
                    <th className="py-2 px-3">Controlling</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {beneficial_owners.map((ubo) => (
                    <tr key={ubo.id} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-medium text-slate-200">{ubo.owner_name}</td>
                      <td className="py-2 px-3 font-mono">{ubo.nationality}</td>
                      <td className="py-2 px-3 font-mono font-semibold text-emerald-400">
                        {ubo.ownership_percentage}%
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant={ubo.is_controlling_person ? 'success' : 'neutral'}>
                          {ubo.is_controlling_person ? 'Yes' : 'No'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Risk Rating Assessment Breakdown */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Active Risk Rating Factors
              </h3>
              <p className="text-xs text-slate-400">Multi-factor rule engine quantitative scoring</p>
            </div>
            {currentRisk && (
              <span className="text-xs font-bold text-slate-200">
                Score: <strong className="text-emerald-400">{currentRisk.risk_score}</strong> / 100
              </span>
            )}
          </div>
          {currentRisk ? (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Risk Tier:</span>
                  <Badge variant={currentRisk.risk_level === 'LOW' ? 'success' : currentRisk.risk_level === 'MEDIUM' ? 'warning' : 'danger'}>
                    {currentRisk.risk_level}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Periodic Review Interval:</span>
                  <span className="font-semibold text-slate-200">{currentRisk.review_interval_months} Months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Effective Evaluation Date:</span>
                  <span className="font-mono text-slate-300">{currentRisk.effective_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Assessed By:</span>
                  <span className="text-slate-300">{currentRisk.assessed_by}</span>
                </div>
              </div>
              {currentRisk.score_breakdown && (
                <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800 text-[11px] text-slate-400 font-mono">
                  {currentRisk.score_breakdown}
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">No risk assessment records.</div>
          )}
        </div>
      </div>

      {/* Verify Modal */}
      {verifyModalDoc && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700 w-full max-w-md bg-slate-900">
            <h3 className="text-base font-bold text-white mb-2">
              Verify Evidence: {verifyModalDoc.document_type}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Document ID: <strong className="text-emerald-400 font-mono">{verifyModalDoc.id}</strong>
            </p>
            <form onSubmit={handleVerifySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Verification Status</label>
                <select
                  value={verifyStatus}
                  onChange={(e) => setVerifyStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="VERIFIED">VERIFIED (Approves Requirement)</option>
                  <option value="REJECTED">REJECTED (Discrepancy / Illegible)</option>
                  <option value="PENDING_REVIEW">PENDING_REVIEW (Escalate)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Analyst Notes</label>
                <textarea
                  value={analystNotes}
                  onChange={(e) => setAnalystNotes(e.target.value)}
                  placeholder="Document registry checks, match with issuer, or rejection reason..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 h-20"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVerifyModalDoc(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition"
                >
                  Save Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
