/**
 * Date utility functions for lead follow-ups and timeline displays.
 */

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export function getFollowupStatus(followupDateString?: string | null): {
  label: string;
  badgeClass: string;
  isOverdue: boolean;
  isToday: boolean;
} {
  if (!followupDateString) {
    return {
      label: 'Not Scheduled',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
      isOverdue: false,
      isToday: false,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = followupDateString.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  targetDate.setHours(0, 0, 0, 0);

  const diffDays = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `${Math.abs(diffDays)}d Overdue`,
      badgeClass: 'bg-red-50 text-red-700 border-red-200 font-semibold',
      isOverdue: true,
      isToday: false,
    };
  } else if (diffDays === 0) {
    return {
      label: 'Due Today',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-300 font-semibold animate-pulse',
      isOverdue: false,
      isToday: true,
    };
  } else if (diffDays === 1) {
    return {
      label: 'Tomorrow',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      isOverdue: false,
      isToday: false,
    };
  } else {
    return {
      label: formatDate(followupDateString),
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      isOverdue: false,
      isToday: false,
    };
  }
}
