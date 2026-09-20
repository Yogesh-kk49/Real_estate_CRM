import React from 'react';
import { LeadPriority, LeadStage, UnitAvailability } from '../../types';

interface StageBadgeProps {
  stage: LeadStage | string;
  size?: 'sm' | 'md';
}

export const StageBadge: React.FC<StageBadgeProps> = ({ stage, size = 'sm' }) => {
  const styles: Record<string, string> = {
    New: 'bg-sky-50 text-sky-700 border-sky-200',
    Contacted: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Site Visit': 'bg-amber-50 text-amber-700 border-amber-300 font-semibold',
    Interested: 'bg-teal-50 text-teal-700 border-teal-200',
    Negotiation: 'bg-orange-50 text-orange-700 border-orange-200 font-semibold',
    Booked: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold',
    Lost: 'bg-slate-100 text-slate-600 border-slate-300',
  };

  const style = styles[stage] || 'bg-slate-100 text-slate-700 border-slate-200';
  const sizeStyle = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${sizeStyle} ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75"></span>
      {stage}
    </span>
  );
};

interface AvailabilityBadgeProps {
  status: UnitAvailability | string;
  size?: 'sm' | 'md';
}

export const AvailabilityBadge: React.FC<AvailabilityBadgeProps> = ({ status, size = 'sm' }) => {
  const styles: Record<string, { badge: string; dot: string }> = {
    Available: {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    Reserved: {
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
    },
    Booked: {
      badge: 'bg-slate-100 text-slate-600 border-slate-200 line-through decoration-slate-400',
      dot: 'bg-slate-400',
    },
  };

  const conf = styles[status] || styles['Available'];
  const sizeStyle = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center rounded-md border font-medium uppercase tracking-wider ${sizeStyle} ${conf.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${conf.dot}`}></span>
      {status}
    </span>
  );
};

interface PriorityBadgeProps {
  priority: LeadPriority | string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const styles: Record<string, string> = {
    Low: 'text-slate-500 bg-slate-50 border-slate-200',
    Medium: 'text-blue-700 bg-blue-50 border-blue-200',
    High: 'text-amber-700 bg-amber-50 border-amber-200 font-semibold',
    Urgent: 'text-red-700 bg-red-50 border-red-200 font-bold',
  };

  return (
    <span className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded border ${styles[priority] || styles['Medium']}`}>
      {priority}
    </span>
  );
};
