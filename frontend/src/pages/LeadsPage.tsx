import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Plus, Search, Filter, Phone, Mail, Calendar,
  MoreVertical, UserCheck, BookmarkCheck, ArrowUpDown, Trash2, Edit3
} from 'lucide-react';
import { Lead, Project, User } from '../types';
import { leadsApi } from '../api/leads';
import { propertiesApi } from '../api/properties';
import { usersApi } from '../api/users';
import { StageBadge, PriorityBadge } from '../components/ui/StatusBadge';
import { getFollowupStatus } from '../utils/date';
import { formatIndianCurrency } from '../utils/currency';
import { Button } from '../components/ui/Button';
import { TableSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { LeadModal } from '../components/leads/LeadModal';
import { LeadAssignModal } from '../components/leads/LeadAssignModal';
import { BookingModal } from '../components/bookings/BookingModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export const LeadsPage: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const { success, error: showError } = useToast();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  // Modals state
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningLead, setAssigningLead] = useState<Lead | null>(null);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingLead, setBookingLead] = useState<Lead | null>(null);

  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const data = await leadsApi.getLeads({
        search: search.trim() || undefined,
        stage: selectedStage !== 'All' ? selectedStage : undefined,
        priority: selectedPriority !== 'All' ? selectedPriority : undefined,
        project_id: selectedProjectId ? parseInt(selectedProjectId) : undefined,
        assigned_user_id: selectedEmployeeId ? parseInt(selectedEmployeeId) : undefined,
      });
      setLeads(data);
    } catch (err: any) {
      showError('Failed to load leads', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [selectedStage, selectedPriority, selectedProjectId, selectedEmployeeId, user]);

  useEffect(() => {
    propertiesApi.getProjects().then(setProjects).catch(console.error);
    if (isAdmin) {
      usersApi.getSalesEmployees().then(setEmployees).catch(console.error);
    }
  }, [isAdmin]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads();
  };

  const handleDeleteLead = async () => {
    if (!deletingLead) return;
    setIsDeleting(true);
    try {
      await leadsApi.deleteLead(deletingLead.id);
      success('Lead Deleted', `Lead "${deletingLead.name}" has been removed.`);
      setDeletingLead(null);
      fetchLeads();
    } catch (err: any) {
      showError('Delete Failed', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Lead Management & Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track prospective buyers, manage consultation stages, and convert leads into property bookings.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setEditingLead(null);
            setIsLeadModalOpen(true);
          }}
        >
          Create New Lead
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-estate-border shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search lead by name, email, or phone number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <Button type="submit" variant="secondary" size="md">
              Search
            </Button>
          </form>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Stage Filter */}
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="text-xs border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-brand-500"
            >
              <option value="All">All Stages</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Site Visit">Site Visit</option>
              <option value="Interested">Interested</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Booked">Booked</option>
              <option value="Lost">Lost</option>
            </select>

            {/* Project Filter */}
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-xs border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-brand-500"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Admin: Employee Filter */}
            {isAdmin && (
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="text-xs border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-brand-500"
              >
                <option value="">All Consultants</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Leads Content: Table on Desktop / Stacked Cards on Mobile */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : leads.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No leads match your current filters"
          description="Try broadening your search query or clear your active stage filters."
          actionLabel="Register New Lead"
          onAction={() => {
            setEditingLead(null);
            setIsLeadModalOpen(true);
          }}
        />
      ) : (
        <div className="bg-white rounded-xl border border-estate-border shadow-xs overflow-hidden">
          {/* Desktop Table (hidden on mobile) */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-300 text-slate-700 font-extrabold uppercase tracking-wider">
                  <th className="py-3.5 px-5">Lead / Buyer</th>
                  <th className="py-3.5 px-4">Stage</th>
                  <th className="py-3.5 px-4">Follow-up</th>
                  <th className="py-3.5 px-4">Preferred Project</th>
                  <th className="py-3.5 px-4">Consultant</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => {
                  const followupStatus = getFollowupStatus(lead.next_followup_date);
                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Contact */}
                      <td className="py-3.5 px-5">
                        <Link
                          to={`/leads/${lead.id}`}
                          className="font-bold text-slate-900 text-sm hover:text-brand-600 hover:underline block"
                        >
                          {lead.name}
                        </Link>
                        <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px] mt-0.5">
                          <span>{lead.phone}</span>
                          <span>•</span>
                          <span>{lead.email}</span>
                        </div>
                      </td>

                      {/* Stage & Priority */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <StageBadge stage={lead.stage} />
                          <PriorityBadge priority={lead.priority} />
                        </div>
                      </td>

                      {/* Next Followup */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded border ${followupStatus.badgeClass}`}>
                          {followupStatus.label}
                        </span>
                      </td>

                      {/* Project & Budget */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{lead.interested_project_name || '—'}</p>
                        {(lead.budget_min || lead.budget_max) && (
                          <p className="text-[11px] font-mono text-slate-500">
                            {formatIndianCurrency(lead.budget_min)} - {formatIndianCurrency(lead.budget_max)}
                          </p>
                        )}
                      </td>

                      {/* Consultant */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-700">{lead.assigned_user_name || 'Unassigned'}</span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Direct Book Unit button */}
                          {!lead.has_booking && lead.stage !== 'Lost' && (
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />}
                              onClick={() => {
                                setBookingLead(lead);
                                setIsBookingModalOpen(true);
                              }}
                              className="text-emerald-700 hover:bg-emerald-50 border-emerald-300"
                            >
                              Book Unit
                            </Button>
                          )}

                          {lead.has_booking && (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                              Unit {lead.booked_unit_number} Booked
                            </span>
                          )}

                          <Link to={`/leads/${lead.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>

                          <button
                            onClick={() => {
                              setEditingLead(lead);
                              setIsLeadModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                            title="Edit Lead"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {isAdmin && (
                            <>
                              <button
                                onClick={() => {
                                  setAssigningLead(lead);
                                  setIsAssignModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-brand-600 rounded hover:bg-slate-100"
                                title="Reassign Lead"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                              </button>

                              {!lead.has_booking && (
                                <button
                                  onClick={() => setDeletingLead(lead)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                                  title="Delete Lead"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards (visible on < lg) */}
          <div className="lg:hidden divide-y divide-slate-100">
            {leads.map((lead) => {
              const followupStatus = getFollowupStatus(lead.next_followup_date);
              return (
                <div key={lead.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        to={`/leads/${lead.id}`}
                        className="font-bold text-slate-900 text-sm hover:text-brand-600"
                      >
                        {lead.name}
                      </Link>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{lead.phone}</p>
                    </div>
                    <StageBadge stage={lead.stage} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-[11px] text-slate-700 uppercase font-bold block">Follow-up</span>
                      <span className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded border mt-0.5 ${followupStatus.badgeClass}`}>
                        {followupStatus.label}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-700 uppercase font-bold block">Consultant</span>
                      <span className="font-bold text-slate-800 mt-0.5 block truncate">
                        {lead.assigned_user_name || 'Unassigned'}
                      </span>
                    </div>
                  </div>


                  <div className="flex items-center justify-between pt-1">
                    <Link to={`/leads/${lead.id}`} className="text-xs font-semibold text-brand-600">
                      View 360° Profile →
                    </Link>
                    {!lead.has_booking && lead.stage !== 'Lost' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBookingLead(lead);
                          setIsBookingModalOpen(true);
                        }}
                      >
                        Book Unit
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lead Create / Edit Modal */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => {
          setIsLeadModalOpen(false);
          setEditingLead(null);
        }}
        lead={editingLead}
        onSuccess={fetchLeads}
      />

      {/* Lead Reassignment Modal (Admin Only) */}
      <LeadAssignModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setAssigningLead(null);
        }}
        lead={assigningLead}
        onSuccess={fetchLeads}
      />

      {/* Direct Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setBookingLead(null);
        }}
        preselectedLead={bookingLead}
        onSuccess={fetchLeads}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingLead)}
        onClose={() => setDeletingLead(null)}
        onConfirm={handleDeleteLead}
        title="Delete Customer Lead"
        message={`Are you sure you want to permanently delete lead "${deletingLead?.name}"? All associated activity notes will be removed.`}
        confirmText="Delete Lead"
        isDangerous={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
