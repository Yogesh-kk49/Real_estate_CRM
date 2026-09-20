import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { leadsApi } from '../../api/leads';
import { useToast } from '../../contexts/ToastContext';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: number;
  leadName: string;
  onSuccess: () => void;
}

export const AddNoteModal: React.FC<AddNoteModalProps> = ({
  isOpen,
  onClose,
  leadId,
  leadName,
  onSuccess,
}) => {
  const { success, error: showError } = useToast();
  const [noteType, setNoteType] = useState('Call');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await leadsApi.addNote(leadId, noteType, content.trim());
      success('Note Added', `Interaction logged for ${leadName}.`);
      setContent('');
      onSuccess();
      onClose();
    } catch (err: any) {
      showError('Failed to add note', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const noteTypeOptions = [
    { value: 'Call', label: '📞 Phone Call Log' },
    { value: 'Meeting', label: '🤝 In-Person / Gallery Meeting' },
    { value: 'WhatsApp', label: '💬 WhatsApp Interaction' },
    { value: 'Site Visit', label: '🏗️ Site Visit Record' },
    { value: 'General', label: '📝 General Internal Note' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Interaction / Add Note"
      subtitle={`Record a touchpoint for ${leadName}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Interaction Type"
          options={noteTypeOptions}
          value={noteType}
          onChange={(e) => setNoteType(e.target.value)}
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Interaction Summary & Next Steps *
          </label>
          <textarea
            className="w-full rounded-md border border-slate-300 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            rows={4}
            placeholder="e.g. Client inquired about loan approval timelines. Informed about SBI & HDFC tie-ups..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button variant="outline" size="md" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" isLoading={isSubmitting} disabled={!content.trim()}>
            Save Interaction
          </Button>
        </div>
      </form>
    </Modal>
  );
};
