import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, Calendar, UserCheck, Plus, BookmarkCheck,
  Building2, MessageSquare, Clock, ShieldCheck, CheckCircle2, ChevronRight, Edit3
} from 'lucide-react';
import { LeadDetail, LeadStage, Project, Unit } from '../types';
import { leadsApi } from '../api/leads';
import { propertiesApi } from '../api/properties';
import { StageBadge, PriorityBadge } from '../components/ui/StatusBadge';
import { formatDate, formatDateTime, getFollowupStatus } from '../utils/date';
import { formatIndianCurrency } from '../utils/currency';
import { Button } from '../components/ui/Button';
import { AddNoteModal } from '../components/leads/AddNoteModal';
import { LeadModal } from '../components/leads/LeadModal';
import { LeadAssignModal } from '../components/leads/LeadAssignModal';
import { BookingModal } from '../components/bookings/BookingModal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const { success, error: showError } = useToast();

  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const stages: LeadStage[] = [
    'New',
    'Contacted',
    'Site Visit',
    'Interested',
    'Negotiation',
    'Booked',
  ];

  const fetchLeadDetails = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await leadsApi.getLeadById(parseInt(id));
      setLead(data);
    } catch (err: any) {
      showError('Unable to load lead', err.message);
      navigate('/leads');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadDetails();
  }, [id, user]);

  const handleStageClick = async (newStage: LeadStage) => {
    if (!lead || lead.stage === newStage) return;
    try {
      await leadsApi.updateLead(lead.id, { stage: newStage });
      success('Stage Updated', `Lead moved to ${newStage}.`);
      fetchLeadDetails();
    } catch (err: any) {
      showError('Failed to update stage', err.message);
    }
  };

  if (isLoading || !lead) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 rounded" />
        <div className="h-28 bg-white rounded-2xl border border-estate-border" />
        <div className="h-64 bg-white rounded-2xl border border-estate-border" />
      </div>
    );
  }

  const followup = getFollowupStatus(lead.next_followup_date);
  const currentStageIndex = stages.indexOf(lead.stage as LeadStage);

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/leads"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Pipeline
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Edit3 className="w-3.5 h-3.5" />}
            onClick={() => setIsEditModalOpen(true)}
          >
            Edit Profile
          </Button>

          {!lead.has_booking && lead.stage !== 'Lost' && (
            <Button
              variant="primary"
              size="sm"
              icon={<BookmarkCheck className="w-3.5 h-3.5" />}
              onClick={() => setIsBookingModalOpen(true)}
            >
              Book Property Unit
            </Button>
          )}
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-estate-border shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">{lead.name}</h1>
              <StageBadge stage={lead.stage} size="md" />
              <PriorityBadge priority={lead.priority} />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-2 font-mono">
              <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 hover:text-brand-600">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {lead.phone}
              </a>
              <span>•</span>
              <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 hover:text-brand-600">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {lead.email}
              </a>
              <span>•</span>
              <span className="text-slate-500 font-sans">Source: {lead.source}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsNoteModalOpen(true)}
            >
              Log Touchpoint
            </Button>
          </div>
        </div>

        {/* Visual Lifecycle Pipeline Stepper */}
        <div className="pt-6">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block mb-3">
            Lifecycle Conversion Stepper (Click to advance)
          </span>


          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {stages.map((st, index) => {
              const isCurrent = lead.stage === st;
              const isPast = currentStageIndex > index && lead.stage !== 'Lost';
              return (
                <button
                  key={st}
                  onClick={() => handleStageClick(st)}
                  className={`p-2.5 rounded-xl border text-xs text-left transition-all ${
                    isCurrent
                      ? 'bg-brand-500 text-white border-brand-600 font-bold shadow-sm shadow-brand-500/20'
                      : isPast
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] opacity-75 mb-1">
                    <span>Step 0{index + 1}</span>
                    {isPast && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                  <p className="truncate">{st}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid: Details + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Activity Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Confirmed Booking Banner if booked */}
          {lead.has_booking && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 shadow-xs flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                <BookmarkCheck className="w-6 h-6" />
              </div>
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                    Confirmed Sale
                  </span>
                  <Link to="/bookings" className="font-bold text-emerald-700 hover:underline">
                    View Ledger →
                  </Link>
                </div>
                <p className="text-base font-extrabold text-emerald-950 mt-0.5">
                  Unit {lead.booked_unit_number} Successfully Reserved
                </p>
                <p className="text-emerald-800 mt-1">
                  Agreement generated. Customer is locked to this unit; no other sales agent can double-book this inventory.
                </p>
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          <div className="bg-white p-6 rounded-2xl border border-estate-border shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Interaction & Activity History</h2>
                <p className="text-xs text-slate-500">Chronological touchpoints, notes, and status changes</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsNoteModalOpen(true)}
              >
                Add Note
              </Button>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {lead.notes.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No interactions recorded yet.</p>
              ) : (
                lead.notes.map((note) => (
                  <div key={note.id} className="relative group text-xs">
                    {/* Dot on timeline */}
                    <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-brand-500 flex items-center justify-center shadow-xs" />

                    <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 shadow-2xs">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{note.author_name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-white border border-slate-200 text-slate-700">
                            {note.note_type}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{formatDateTime(note.created_at)}</span>
                      </div>
                      <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">{note.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Profile & Assignment Sidebar */}
        <div className="space-y-6">
          {/* Follow-up Status Card */}
          <div className="bg-white p-5 rounded-2xl border border-estate-border shadow-xs">
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-2">
              Next Scheduled Follow-up
            </span>

            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-bold text-slate-900">
                  {lead.next_followup_date ? formatDate(lead.next_followup_date) : 'None Scheduled'}
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${followup.badgeClass}`}>
                {followup.label}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3 font-semibold"
              onClick={() => setIsEditModalOpen(true)}
            >
              Update Follow-up Date
            </Button>
          </div>

          {/* Assigned Consultant Card */}
          <div className="bg-white p-5 rounded-2xl border border-estate-border shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Assigned Consultant
              </span>
              {isAdmin && (
                <button
                  onClick={() => setIsAssignModalOpen(true)}
                  className="text-xs font-bold text-brand-700 hover:underline flex items-center gap-1"
                >
                  <UserCheck className="w-3.5 h-3.5" /> Reassign
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                {lead.assigned_user_name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{lead.assigned_user_name || 'Unassigned'}</p>
                <p className="text-xs text-slate-600 font-medium">Relationship Manager</p>
              </div>
            </div>
          </div>

          {/* Buyer Preferences & Budget */}
          <div className="bg-white p-5 rounded-2xl border border-estate-border shadow-xs space-y-3">
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
              Investment Profile
            </span>


            <div className="space-y-2 text-xs divide-y divide-slate-100">
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Interested Project:</span>
                <span className="font-bold text-slate-900">{lead.interested_project_name || 'Open Portfolio'}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Budget Range:</span>
                <span className="font-mono font-bold text-slate-900">
                  {lead.budget_min || lead.budget_max
                    ? `${formatIndianCurrency(lead.budget_min)} - ${formatIndianCurrency(lead.budget_max)}`
                    : 'Not specified'}
                </span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Registered On:</span>
                <span className="text-slate-700">{formatDate(lead.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Note Modal */}
      <AddNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        leadId={lead.id}
        leadName={lead.name}
        onSuccess={fetchLeadDetails}
      />

      {/* Edit Modal */}
      <LeadModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        lead={lead}
        onSuccess={fetchLeadDetails}
      />

      {/* Reassignment Modal */}
      <LeadAssignModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        lead={lead}
        onSuccess={fetchLeadDetails}
      />

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        preselectedLead={lead}
        onSuccess={fetchLeadDetails}
      />
    </div>
  );
};
