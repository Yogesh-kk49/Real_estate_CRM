import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Lead, User } from '../../types';
import { leadsApi } from '../../api/leads';
import { usersApi } from '../../api/users';
import { useToast } from '../../contexts/ToastContext';

interface LeadAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onSuccess: () => void;
}

export const LeadAssignModal: React.FC<LeadAssignModalProps> = ({
  isOpen,
  onClose,
  lead,
  onSuccess,
}) => {
  const { success, error: showError } = useToast();
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      usersApi.getSalesEmployees().then(setEmployees).catch(console.error);
      if (lead?.assigned_user_id) {
        setSelectedUserId(String(lead.assigned_user_id));
      }
    }
  }, [isOpen, lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !selectedUserId) return;

    setIsSubmitting(true);
    try {
      await leadsApi.assignLead(lead.id, parseInt(selectedUserId));
      const emp = employees.find((e) => e.id === parseInt(selectedUserId));
      success('Lead Reassigned', `Lead "${lead.name}" reassigned to ${emp?.full_name || 'employee'}.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      showError('Reassignment failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reassign Lead Ownership"
      subtitle={`Transfer responsibility for ${lead?.name} to another sales team member.`}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Assign to Sales Consultant"
          options={[
            { value: '', label: 'Select Consultant' },
            ...employees.map((emp) => ({
              value: emp.id,
              label: `${emp.full_name} (${emp.email})`,
            })),
          ]}
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          required
        />

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button variant="outline" size="md" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" isLoading={isSubmitting} disabled={!selectedUserId}>
            Confirm Reassignment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
