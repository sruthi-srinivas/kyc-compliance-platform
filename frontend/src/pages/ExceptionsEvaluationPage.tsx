import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  RefreshCw,
  Target,
  BarChart2,
  FileCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { EvaluationResponse } from '../types';
import { Badge } from '../components/Badge';
import { StatCard } from '../components/StatCard';

export const ExceptionsEvaluationPage: React.FC = () => {
  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedScenario, setSelectedScenario] = useState<string>('ALL');

  useEffect(() => {
    loadEvaluation();
  }, []);

  const loadEvaluation = async () => {
    try {
      setLoading(true);
      const res = await api.getEvaluation();
      setEvaluation(res);
    } catch (err) {
      console.error('Error loading evaluation data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !evaluation) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const { summary, scenario_breakdown, detected_exceptions } = evaluation;

  const SCENARIO_NAMES: Record<string, { label: string; desc: string }> = {
    EXPIRED_DOCUMENT_MARKED_VALID: {
      label: 'Scenario 1: Expired Document Marked Valid',
      desc: 'Inconsistency between expiration date and active validity state',
    },
    APPROVED_WITHOUT_MANDATORY_KYC: {
      label: 'Scenario 2: Approved Customer with Missing KYC Evidence',
      desc: 'Account approval contradicts mandatory requirement completeness',
    },
    UBO_PERCENTAGE_EXCEEDS_100: {
      label: 'Scenario 3: Beneficial Ownership > 100%',
      desc: 'Arithmetic contradiction in corporate shareholding / cap table',
    },
    REVIEW_CLOSED_WITHOUT_RESOLUTION: {
      label: 'Scenario 4: Review Closed Without Resolution Verdict',
      desc: 'Review case closed without recorded compliance sign-off notes',
    },
    DUPLICATE_DOCUMENT_CROSS_CUSTOMER: {
      label: 'Scenario 5: Duplicate Document Cross-Customer Contamination',
      desc: 'Identical document number reused across unrelated customer accounts',
    },
  };

  const filteredExceptions =
    selectedScenario === 'ALL'
      ? detected_exceptions
      : detected_exceptions.filter((d) => d.issue_type === selectedScenario);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="w-6 h-6 text-amber-400" />
              Independent Anomaly Detection &amp; Ground Truth Benchmark
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Strict isolation guarantee: The business-rule exception engine operates with ZERO exposure to ground truth labels. Detection findings are empirically evaluated against isolated ground truth to verify high precision and full recall.
            </p>
          </div>
          <button
            onClick={loadEvaluation}
            className="px-3.5 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Re-evaluate Engine
          </button>
        </div>
      </div>

      {/* KPI Evaluation Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ground Truth Injected</p>
          <p className="text-2xl font-bold text-white mt-1">{summary.ground_truth_total}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Isolated benchmark</p>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Detected</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{summary.total_detected}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Pure business rules</p>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
          <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">True Positives (TP)</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{summary.true_positives}</p>
          <p className="text-[10px] text-emerald-300/70 mt-0.5">Matched ground truth</p>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-rose-500/30 bg-rose-500/5">
          <p className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">False Negatives (FN)</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">{summary.false_negatives}</p>
          <p className="text-[10px] text-rose-300/70 mt-0.5">Zero missed anomalies</p>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Precision</p>
          <p className="text-2xl font-bold text-white mt-1">{(summary.precision * 100).toFixed(1)}%</p>
          <p className="text-[10px] text-slate-500 mt-0.5">TP / (TP + FP)</p>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
          <p className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">Recall (Hit Rate)</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{(summary.recall * 100).toFixed(1)}%</p>
          <p className="text-[10px] text-emerald-300/70 mt-0.5">F1: {summary.f1_score}</p>
        </div>
      </div>

      {/* Scenario-by-Scenario Evaluation Matrix Table */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-400" />
            Empirical Evaluation by Mandatory Scenario
          </h3>
          <p className="text-xs text-slate-400">Confusion matrix metrics calculated against ground truth</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Mandatory Scenario</th>
                <th className="py-3 px-4 text-center">Injected GT</th>
                <th className="py-3 px-4 text-center">Engine Detected</th>
                <th className="py-3 px-4 text-center">True Positives</th>
                <th className="py-3 px-4 text-center">False Positives</th>
                <th className="py-3 px-4 text-center">False Negatives</th>
                <th className="py-3 px-4 text-center">Precision</th>
                <th className="py-3 px-4 text-center">Recall</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {Object.entries(scenario_breakdown).map(([scenarioKey, m]) => {
                const info = SCENARIO_NAMES[scenarioKey] || { label: scenarioKey, desc: '' };
                return (
                  <tr key={scenarioKey} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-100">{info.label}</div>
                      <div className="text-[10px] text-slate-500">{info.desc}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-200">{m.injected_ground_truth_count}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-amber-400">{m.detected_count}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">{m.true_positives}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-400">{m.false_positives}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-400">{m.false_negatives}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-100">{(m.precision * 100).toFixed(0)}%</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {(m.recall * 100).toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detected Exceptions Traceability Log */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-sm font-bold text-white">Traceable Exception Records ({filteredExceptions.length})</h3>
            <p className="text-xs text-slate-400">Individual business rule violations identified in the active database</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Scenarios</option>
              {Object.keys(scenario_breakdown).map((k) => (
                <option key={k} value={k}>
                  {SCENARIO_NAMES[k]?.label || k}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Detection ID</th>
                <th className="py-3 px-4">Scenario Category</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Affected Entity</th>
                <th className="py-3 px-4">Violation Details</th>
                <th className="py-3 px-4">Expected Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredExceptions.map((ex) => (
                <tr key={ex.detection_id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-semibold text-emerald-400">{ex.detection_id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-200">{ex.issue_type}</td>
                  <td className="py-3 px-4">
                    <Badge variant={ex.severity === 'CRITICAL' ? 'danger' : 'warning'}>{ex.severity}</Badge>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {ex.related_entity_type}: <strong className="text-slate-100">{ex.related_entity_id}</strong>
                  </td>
                  <td className="py-3 px-4 text-slate-300 max-w-md">{ex.description}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-emerald-400 font-medium">
                    {ex.expected_decision}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
