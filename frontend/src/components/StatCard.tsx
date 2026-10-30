import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'emerald' | 'amber' | 'rose' | 'sky' | 'indigo';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'emerald',
}) => {
  const colorMap = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    sky: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  };

  return (
    <div className="glass-panel p-5 rounded-xl transition-all duration-200 glass-panel-hover flex items-start justify-between">
      <div>
        <p className="text-xs uppercase font-medium tracking-wider text-slate-400">{title}</p>
        <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-lg border ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
};
