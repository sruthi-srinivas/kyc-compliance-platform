import React from 'react';
import { UserCheck, RefreshCw, Sparkles, Activity } from 'lucide-react';

interface NavbarProps {
  currentRole: string;
  onRoleChange: (role: string) => void;
  onRefresh: () => void;
  onTriggerGenerate: (preset: 'starter' | 'full') => void;
  isGenerating: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  onRefresh,
  onTriggerGenerate,
  isGenerating,
}) => {
  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 fixed top-0 right-0 left-64 z-20 px-6 flex items-center justify-between">
      {/* Platform Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span>Operational Live Feed</span>
        </div>
        <span className="text-xs text-slate-400 hidden md:inline">
          Anchor Date: <strong className="text-slate-200">2026-10-22</strong>
        </span>
      </div>

      {/* Right Controls: Role Selector + Data Presets + Refresh */}
      <div className="flex items-center gap-3">
        {/* Role Switcher */}
        <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
          <UserCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">Role:</span>
          <select
            value={currentRole}
            onChange={(e) => onRoleChange(e.target.value)}
            className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
          >
            <option value="Operations Analyst" className="bg-slate-900">Operations Analyst</option>
            <option value="Risk / Compliance Reviewer" className="bg-slate-900">Risk Reviewer</option>
            <option value="System Administrator" className="bg-slate-900">System Administrator</option>
            <option value="Customer / Account Holder" className="bg-slate-900">Customer</option>
          </select>
        </div>

        {/* Dataset Generator Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-800/60 p-1 rounded-lg border border-slate-700/60">
          <button
            onClick={() => onTriggerGenerate('starter')}
            disabled={isGenerating}
            className="text-[11px] px-2.5 py-1 rounded font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition flex items-center gap-1 disabled:opacity-50"
            title="Generate Starter Scale (200 Customers)"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Starter (200)
          </button>
          <button
            onClick={() => onTriggerGenerate('full')}
            disabled={isGenerating}
            className="text-[11px] px-2.5 py-1 rounded font-medium text-amber-300 hover:text-amber-200 hover:bg-amber-500/20 transition flex items-center gap-1 disabled:opacity-50"
            title="Generate Full Scale (8,000 Customers, 20,000 Documents)"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            Full (8k)
          </button>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition"
          title="Refresh All Records"
        >
          <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>
    </header>
  );
};
