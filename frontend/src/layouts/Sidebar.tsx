import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  CheckCircle,
  FileCheck2,
  ShieldAlert,
  PieChart,
  CalendarCheck2,
  BellRing,
  AlertTriangle,
  History,
  CheckSquare2,
  DatabaseZap,
  SlidersHorizontal,
} from 'lucide-react';

export type ScreenId =
  | 'dashboard'
  | 'customers'
  | 'customer_detail'
  | 'documents'
  | 'verifications'
  | 'completeness'
  | 'risk_ratings'
  | 'beneficial_owners'
  | 'review_cases'
  | 'alerts'
  | 'exceptions'
  | 'audit'
  | 'validation';

interface SidebarProps {
  currentScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  activeCustomerId?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentScreen, onSelectScreen, activeCustomerId }) => {
  const navSections = [
    {
      title: 'Analytics & Overview',
      items: [
        { id: 'dashboard' as ScreenId, label: 'Dashboard Overview', icon: LayoutDashboard },
        { id: 'exceptions' as ScreenId, label: 'Exceptions & Evaluation', icon: AlertTriangle, badge: '5 Scenarios' },
        { id: 'validation' as ScreenId, label: 'Data Validation & Repro', icon: CheckSquare2 },
      ],
    },
    {
      title: 'Customer Onboarding',
      items: [
        { id: 'customers' as ScreenId, label: 'Customer Directory', icon: Users },
        ...(activeCustomerId
          ? [{ id: 'customer_detail' as ScreenId, label: `Profile: ${activeCustomerId}`, icon: SlidersHorizontal }]
          : []),
        { id: 'completeness' as ScreenId, label: 'KYC Completeness', icon: FileCheck2 },
        { id: 'beneficial_owners' as ScreenId, label: 'Beneficial Ownership', icon: PieChart },
      ],
    },
    {
      title: 'Evidence & Verification',
      items: [
        { id: 'documents' as ScreenId, label: 'Document Registry', icon: FileText },
        { id: 'verifications' as ScreenId, label: 'Analyst Verification', icon: CheckCircle },
        { id: 'alerts' as ScreenId, label: 'Expiry Monitoring', icon: BellRing },
      ],
    },
    {
      title: 'Governance & Audit',
      items: [
        { id: 'risk_ratings' as ScreenId, label: 'Risk Ratings', icon: ShieldAlert },
        { id: 'review_cases' as ScreenId, label: 'Periodic Reviews', icon: CalendarCheck2 },
        { id: 'audit' as ScreenId, label: 'Audit Event History', icon: History },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <DatabaseZap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-heading font-bold text-base text-white tracking-wide leading-none">YottaFlex KYC</h1>
          <p className="text-[10px] text-emerald-400 font-medium tracking-wider uppercase mt-1">Compliance Platform</p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {navSections.map((sec, idx) => (
          <div key={idx}>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">{sec.title}</p>
            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentScreen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectScreen(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] space-y-1 text-slate-400">
        <div className="flex justify-between items-center">
          <span>Random Seed:</span>
          <span className="font-mono text-emerald-400 font-semibold">20261022</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Eval Date:</span>
          <span className="font-mono text-slate-300">2026-10-22</span>
        </div>
      </div>
    </aside>
  );
};
