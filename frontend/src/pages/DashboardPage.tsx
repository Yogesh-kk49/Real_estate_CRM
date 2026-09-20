import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Building2, BookmarkCheck, Calendar, ArrowRight,
  PhoneCall, CheckCircle2, TrendingUp, Clock, AlertTriangle
} from 'lucide-react';
import { DashboardStats } from '../types';
import { dashboardApi } from '../api/dashboard';
import { formatIndianCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';
import { StageBadge } from '../components/ui/StatusBadge';
import { CardSkeleton } from '../components/ui/LoadingSkeleton';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [user]);

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <CardSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-estate-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Welcome, {user?.full_name}
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-200">
              {isAdmin ? 'Organization Overview' : 'Assigned Territory'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time pipeline progression, inventory allocation, and scheduled customer touchpoints.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/leads">
            <Button variant="primary" size="md" icon={<Users className="w-4 h-4" />}>
              Manage Leads
            </Button>
          </Link>
          <Link to="/properties">
            <Button variant="outline" size="md" icon={<Building2 className="w-4 h-4" />}>
              View Inventory
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div className="bg-white p-5 rounded-xl border border-estate-border shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Active Leads</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-mono mt-2">{stats.total_leads}</p>
          <p className="text-xs text-slate-700 font-medium mt-1">
            {isAdmin ? 'Across entire sales organization' : 'Assigned to your portfolio'}
          </p>
        </div>

        {/* Follow-ups Due Today */}
        <div className={`p-5 rounded-xl border shadow-xs transition-all ${
          stats.followups_due_today > 0 ? 'bg-amber-50/50 border-amber-300' : 'bg-white border-estate-border'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Follow-ups Today</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-extrabold text-slate-900 font-mono">{stats.followups_due_today}</p>
            {stats.followups_overdue > 0 && (
              <span className="text-xs font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                +{stats.followups_overdue} Overdue
              </span>
            )}
          </div>
          <p className="text-xs text-slate-700 font-medium mt-1">Scheduled buyer consultations</p>
        </div>

        {/* Confirmed Sales Value */}
        <div className="bg-white p-5 rounded-xl border border-estate-border shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Total Booked Value</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 font-mono mt-2">
            {formatIndianCurrency(stats.total_booking_value)}
          </p>
          <p className="text-xs text-slate-700 font-medium mt-1">
            {stats.total_bookings_count} Confirmed Unit {stats.total_bookings_count === 1 ? 'Booking' : 'Bookings'}
          </p>
        </div>

        {/* Available Inventory */}
        <div className="bg-white p-5 rounded-xl border border-estate-border shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Available Units</span>
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-extrabold text-slate-900 font-mono">{stats.inventory.available_units}</p>
            <span className="text-xs text-slate-700 font-bold font-mono">/ {stats.inventory.total_units} total</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full"
              style={{ width: `${stats.inventory.occupancy_rate}%` }}
            />
          </div>
        </div>

      </div>

      {/* Main Grid: Pipeline Funnel + Upcoming Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pipeline Stepper / Funnel */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-estate-border shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Lead Pipeline Breakdown</h2>
              <p className="text-xs text-slate-700 font-medium">Distribution of leads across conversion milestones</p>
            </div>
            <Link to="/leads" className="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {stats.pipeline_stages.map((st) => (
              <div key={st.stage} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <StageBadge stage={st.stage} />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-extrabold text-slate-900">{st.count} leads</span>
                    <span className="text-slate-700 font-mono text-xs w-10 text-right font-bold">{st.percentage}%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      st.stage === 'Booked'
                        ? 'bg-emerald-500'
                        : st.stage === 'Lost'
                        ? 'bg-slate-400'
                        : st.stage === 'Negotiation' || st.stage === 'Site Visit'
                        ? 'bg-amber-500'
                        : 'bg-brand-500'
                    }`}
                    style={{ width: `${Math.max(st.percentage, st.count > 0 ? 3 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Urgent & Upcoming Follow-ups */}
        <div className="bg-white p-6 rounded-2xl border border-estate-border shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Follow-up Schedule</h2>
              <p className="text-xs text-slate-700 font-medium">Touchpoints requiring client calls</p>
            </div>
            <Clock className="w-4 h-4 text-slate-700" />
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-96 pr-1">
            {stats.upcoming_followups.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-700">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                <p className="text-xs font-bold text-slate-800">All caught up!</p>
                <p className="text-xs text-slate-700 font-medium">No overdue or pending follow-ups</p>
              </div>
            ) : (
              stats.upcoming_followups.map((item) => (
                <div
                  key={item.lead_id}
                  className={`p-3 rounded-xl border text-xs transition-all ${
                    item.is_overdue
                      ? 'bg-red-50/50 border-red-200'
                      : item.is_today
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={`/leads/${item.lead_id}`}
                      className="font-bold text-slate-900 hover:text-brand-600 hover:underline"
                    >
                      {item.lead_name}
                    </Link>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                        item.is_overdue
                          ? 'bg-red-100 text-red-800'
                          : item.is_today
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {item.is_overdue ? 'Overdue' : item.is_today ? 'Due Today' : formatDate(item.next_followup_date)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 text-xs text-slate-700 font-medium">
                    <span className="flex items-center gap-1 font-mono font-bold text-slate-800">
                      <PhoneCall className="w-3.5 h-3.5 text-slate-600" /> {item.lead_phone}
                    </span>
                    <Link
                      to={`/leads/${item.lead_id}`}
                      className="font-bold text-brand-700 hover:text-brand-800 underline"
                    >
                      Call / Log →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Bookings & Audit Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Confirmed Bookings */}
        <div className="bg-white p-6 rounded-2xl border border-estate-border shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Property Bookings</h2>
              <p className="text-xs text-slate-700 font-medium">Latest executed sales agreements</p>
            </div>
            <Link to="/bookings" className="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {stats.recent_bookings.length === 0 ? (
              <p className="text-xs text-slate-700 font-medium py-6 text-center">No bookings recorded yet.</p>
            ) : (
              stats.recent_bookings.map((b) => (
                <div key={b.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{b.lead_name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-extrabold">
                        Unit {b.unit_number}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium mt-0.5">
                      {b.building_name}, {b.project_name} • Booked by <span className="font-bold text-slate-900">{b.booked_by_name}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-extrabold font-mono text-emerald-700">
                      {formatIndianCurrency(b.agreement_value)}
                    </p>
                    <p className="text-xs font-semibold text-slate-700">{formatDate(b.booking_date)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity Audit Feed */}
        <div className="bg-white p-6 rounded-2xl border border-estate-border shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Live Activity Feed</h2>
              <p className="text-xs text-slate-700 font-medium">Real-time team notes and customer interactions</p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {stats.recent_activities.length === 0 ? (
              <p className="text-xs text-slate-700 font-medium py-6 text-center">No activity recorded yet.</p>
            ) : (
              stats.recent_activities.map((act) => (
                <div key={act.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-slate-900">{act.author_name}</span>
                      <span className="text-xs text-slate-600 font-semibold">• on</span>
                      <Link to={`/leads/${act.lead_id}`} className="font-bold text-brand-700 hover:underline">
                        {act.lead_name}
                      </Link>
                    </div>
                    <span className="text-xs text-slate-700 font-mono font-bold">{formatDate(act.created_at)}</span>
                  </div>
                  <p className="text-slate-800 text-xs leading-relaxed line-clamp-2 font-medium">{act.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

