import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Lead, LeadPriority, LeadStage, Project, User } from '../../types';
import { leadsApi } from '../../api/leads';
import { propertiesApi } from '../../api/properties';
import { usersApi } from '../../api/users';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead | null;
  onSuccess: () => void;
}

export const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  onClose,
  lead,
  onSuccess,
}) => {
  const { isAdmin, user } = useAuth();
  const { success, error: showError } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [stage, setStage] = useState<string>('New');
  const [priority, setPriority] = useState<string>('Medium');
  const [source, setSource] = useState('Website');
  const [budgetMin, setBudgetMin] = useState<string>('');
  const [budgetMax, setBudgetMax] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [assignedUserId, setAssignedUserId] = useState<string>('');
  const [followupDate, setFollowupDate] = useState<string>('');
  const [initialNote, setInitialNote] = useState('');

  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      propertiesApi.getProjects().then(setProjects).catch(console.error);
      if (isAdmin) {
        usersApi.getSalesEmployees().then(setEmployees).catch(console.error);
      }
    }
  }, [isOpen, isAdmin]);

  useEffect(() => {
    if (lead) {
      setName(lead.name);
      setEmail(lead.email);
      setPhone(lead.phone);
      setStage(lead.stage);
      setPriority(lead.priority);
      setSource(lead.source);
      setBudgetMin(lead.budget_min ? String(lead.budget_min) : '');
      setBudgetMax(lead.budget_max ? String(lead.budget_max) : '');
      setProjectId(lead.interested_project_id ? String(lead.interested_project_id) : '');
      setAssignedUserId(lead.assigned_user_id ? String(lead.assigned_user_id) : '');
      setFollowupDate(lead.next_followup_date || '');
      setInitialNote('');
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setStage('New');
      setPriority('Medium');
      setSource('Website');
      setBudgetMin('');
      setBudgetMax('');
      setProjectId('');
      setAssignedUserId(user?.id ? String(user.id) : '');
      setFollowupDate('');
      setInitialNote('');
    }
    setErrors({});
  }, [lead, isOpen, user]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) {
      errs.name = 'Please enter a valid lead name (at least 2 characters).';
    }

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      errs.email = 'Please provide a valid email address.';
    }

    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    if (!cleanPhone || cleanPhone.length < 10 || !/^\d+$/.test(cleanPhone)) {
      errs.phone = 'Please provide a valid phone number with at least 10 digits.';
    }

    if (followupDate) {
      const today = new Date().toISOString().split('T')[0];
      if (followupDate < today) {
        errs.followupDate = 'Follow-up date cannot be earlier than today.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (lead) {
        await leadsApi.updateLead(lead.id, {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          stage,
          priority,
          source,
          budget_min: budgetMin ? parseFloat(budgetMin) : undefined,
          budget_max: budgetMax ? parseFloat(budgetMax) : undefined,
          interested_project_id: projectId ? parseInt(projectId) : undefined,
          assigned_user_id: isAdmin && assignedUserId ? parseInt(assignedUserId) : undefined,
          next_followup_date: followupDate || undefined,
        });
        success('Lead updated', `Lead "${name}" details have been saved.`);
      } else {
        await leadsApi.createLead({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          stage,
          priority,
          source,
          budget_min: budgetMin ? parseFloat(budgetMin) : undefined,
          budget_max: budgetMax ? parseFloat(budgetMax) : undefined,
          interested_project_id: projectId ? parseInt(projectId) : undefined,
          assigned_user_id: isAdmin && assignedUserId ? parseInt(assignedUserId) : (user?.id || undefined),
          next_followup_date: followupDate || undefined,
          initial_note: initialNote.trim() || undefined,
        });
        success('Lead created', `New lead "${name}" added to pipeline.`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      showError('Failed to save lead', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stageOptions = [
    { value: 'New', label: 'New Inquiry' },
    { value: 'Contacted', label: 'Contacted' },
    { value: 'Site Visit', label: 'Site Visit Scheduled' },
    { value: 'Interested', label: 'Interested / Evaluating' },
    { value: 'Negotiation', label: 'In Negotiation' },
    { value: 'Booked', label: 'Booked' },
    { value: 'Lost', label: 'Lost Lead' },
  ];

  const priorityOptions = [
    { value: 'Low', label: 'Low Priority' },
    { value: 'Medium', label: 'Medium Priority' },
    { value: 'High', label: 'High Priority' },
    { value: 'Urgent', label: 'Urgent Priority' },
  ];

  const sourceOptions = [
    { value: 'Website', label: 'Official Website' },
    { value: 'Property Portal', label: '99acres / MagicBricks Portal' },
    { value: 'Referral', label: 'Client / Executive Referral' },
    { value: 'Walk-In', label: 'Site Gallery Walk-In' },
    { value: 'Direct Inquiry', label: 'Direct Phone / WhatsApp' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lead ? 'Edit Lead Details' : 'Create New Lead'}
      subtitle={lead ? `Update pipeline status & contact info for ${lead.name}` : 'Register a new customer inquiry'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Name & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            placeholder="e.g. Arunachalam Sundaram"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            required
          />
          <Input
            label="Phone Number"
            placeholder="e.g. +91 98401 23456"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
            required
          />
        </div>

        {/* Row 2: Email & Source */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. arun@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            required
          />
          <Select
            label="Lead Source"
            options={sourceOptions}
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </div>

        {/* Row 3: Stage & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Pipeline Stage"
            options={stageOptions}
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          />
          <Select
            label="Priority Level"
            options={priorityOptions}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          />
        </div>

        {/* Row 4: Interested Project & Follow-up Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Interested Project"
            options={[
              { value: '', label: 'Select Project (Optional)' },
              ...projects.map((p) => ({ value: p.id, label: `${p.name} (${p.location.split(',')[0]})` })),
            ]}
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          />
          <Input
            label="Next Follow-up Date"
            type="date"
            value={followupDate}
            onChange={(e) => setFollowupDate(e.target.value)}
            error={errors.followupDate}
          />
        </div>

        {/* Row 5: Budget Range (Min & Max) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Budget Min (₹)"
            type="number"
            placeholder="e.g. 25000000 (2.5 Cr)"
            value={budgetMin}
            onChange={(e) => setBudgetMin(e.target.value)}
          />
          <Input
            label="Budget Max (₹)"
            type="number"
            placeholder="e.g. 35000000 (3.5 Cr)"
            value={budgetMax}
            onChange={(e) => setBudgetMax(e.target.value)}
          />
        </div>

        {/* Admin assignment field */}
        {isAdmin && (
          <div>
            <Select
              label="Assigned Sales Consultant"
              options={[
                { value: '', label: 'Select Consultant' },
                ...employees.map((emp) => ({ value: emp.id, label: `${emp.full_name} (${emp.email})` })),
              ]}
              value={assignedUserId}
              onChange={(e) => setAssignedUserId(e.target.value)}
            />
          </div>
        )}

        {/* Initial note if creating */}
        {!lead && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Initial Note / Requirement Details
            </label>
            <textarea
              className="w-full rounded-md border border-slate-300 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              rows={3}
              placeholder="e.g. Customer looking for 3BHK East-facing unit near IT corridor..."
              value={initialNote}
              onChange={(e) => setInitialNote(e.target.value)}
            />
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" size="md" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" isLoading={isSubmitting}>
            {lead ? 'Save Changes' : 'Create Lead'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
