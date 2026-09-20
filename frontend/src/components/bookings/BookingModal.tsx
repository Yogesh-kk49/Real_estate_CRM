import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Lead, Unit } from '../../types';
import { bookingsApi } from '../../api/bookings';
import { propertiesApi } from '../../api/properties';
import { leadsApi } from '../../api/leads';
import { formatIndianCurrency, formatFullINR } from '../../utils/currency';
import { useToast } from '../../contexts/ToastContext';
import { AlertCircle, Building2, CheckCircle, ShieldAlert } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedLead?: Lead | null;
  preselectedUnit?: Unit | null;
  onSuccess: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  preselectedLead,
  preselectedUnit,
  onSuccess,
}) => {
  const { success, error: showError } = useToast();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [agreementValue, setAgreementValue] = useState<string>('');
  const [bookingAmount, setBookingAmount] = useState<string>('');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [conflictError, setConflictError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setConflictError(null);
      setErrors({});

      // Fetch available units
      propertiesApi.getUnits({ availability: 'Available' }).then(setUnits).catch(console.error);

      // Fetch leads that don't have a booking yet
      leadsApi.getLeads().then((allLeads) => {
        setLeads(allLeads.filter((l) => !l.has_booking && l.stage !== 'Lost'));
      }).catch(console.error);

      if (preselectedLead) {
        setSelectedLeadId(String(preselectedLead.id));
      }
      if (preselectedUnit) {
        setSelectedUnitId(String(preselectedUnit.id));
        setAgreementValue(String(preselectedUnit.price));
        // Default 10% token
        setBookingAmount(String(Math.round(preselectedUnit.price * 0.1)));
      }
    }
  }, [isOpen, preselectedLead, preselectedUnit]);

  // When selected unit changes, update agreement value
  const handleUnitChange = (unitIdStr: string) => {
    setSelectedUnitId(unitIdStr);
    const unit = units.find((u) => u.id === parseInt(unitIdStr));
    if (unit) {
      setAgreementValue(String(unit.price));
      setBookingAmount(String(Math.round(unit.price * 0.1)));
    }
  };

  const selectedUnitObj = units.find((u) => u.id === parseInt(selectedUnitId)) || preselectedUnit;
  const selectedLeadObj = leads.find((l) => l.id === parseInt(selectedLeadId)) || preselectedLead;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!selectedLeadId) errs.lead = 'Please select a customer/lead.';
    if (!selectedUnitId) errs.unit = 'Please select an available property unit.';
    if (!agreementValue || parseFloat(agreementValue) <= 0) {
      errs.agreementValue = 'Please enter a valid agreement value.';
    }
    if (!bookingAmount || parseFloat(bookingAmount) <= 0) {
      errs.bookingAmount = 'Please enter a valid token booking amount.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setConflictError(null);

    try {
      const booking = await bookingsApi.createBooking({
        lead_id: parseInt(selectedLeadId),
        unit_id: parseInt(selectedUnitId),
        agreement_value: parseFloat(agreementValue),
        booking_amount: parseFloat(bookingAmount),
        payment_reference: paymentRef.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      success(
        'Booking Confirmed! 🎉',
        `Unit ${booking.unit_number} booked for ${booking.lead_name} (${formatIndianCurrency(booking.agreement_value)}).`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      // Check if error is a 409 conflict
      const msg = err.message || '';
      if (msg.includes('booked by another user') || msg.includes('conflict') || msg.includes('no longer available')) {
        setConflictError(msg);
        // Refresh available units list to remove the conflicting unit
        propertiesApi.getUnits({ availability: 'Available' }).then(setUnits).catch(console.error);
      } else {
        showError('Booking Failed', msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Property Booking"
      subtitle="Connect customer lead to property unit and issue booking receipt"
      maxWidth="lg"
    >
      {/* 409 Conflict Banner */}
      {conflictError && (
        <div className="mb-5 p-4 rounded-lg bg-red-50 border border-red-300 flex items-start gap-3 text-red-900 animate-in fade-in">
          <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold text-red-950">Concurrency Conflict Detected</p>
            <p className="mt-0.5 font-medium">{conflictError}</p>
            <p className="mt-1 text-[11px] text-red-700">
              The unit list has been refreshed with current real-time inventory.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Lead Selection */}
        <div>
          {preselectedLead ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Customer / Lead</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{preselectedLead.name}</p>
              <p className="text-xs text-slate-500">{preselectedLead.phone} • {preselectedLead.email}</p>
            </div>
          ) : (
            <Select
              label="Select Customer Lead"
              options={[
                { value: '', label: 'Choose a customer from pipeline...' },
                ...leads.map((l) => ({
                  value: l.id,
                  label: `${l.name} (${l.phone}) - ${l.stage}`,
                })),
              ]}
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              error={errors.lead}
              required
            />
          )}
        </div>

        {/* Unit Selection */}
        <div>
          {preselectedUnit ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Selected Property Unit</span>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-sm font-bold text-slate-900">
                  Unit {preselectedUnit.unit_number} ({preselectedUnit.unit_type})
                </p>
                <span className="text-xs font-mono font-bold text-brand-600">
                  {formatIndianCurrency(preselectedUnit.price)}
                </span>
              </div>
              <p className="text-xs text-slate-500">{preselectedUnit.building_name} • Floor {preselectedUnit.floor} • {preselectedUnit.super_builtup_sqft} sq.ft</p>
            </div>
          ) : (
            <Select
              label="Select Available Unit"
              options={[
                { value: '', label: 'Choose an available unit...' },
                ...units.map((u) => ({
                  value: u.id,
                  label: `Unit ${u.unit_number} (${u.unit_type}, ${u.building_name}) - ${formatIndianCurrency(u.price)}`,
                })),
              ]}
              value={selectedUnitId}
              onChange={(e) => handleUnitChange(e.target.value)}
              error={errors.unit}
              required
            />
          )}
        </div>

        {/* Financials: Agreement Value & Token Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              label="Agreed Sale Value (₹)"
              type="number"
              placeholder="e.g. 34000000"
              value={agreementValue}
              onChange={(e) => setAgreementValue(e.target.value)}
              error={errors.agreementValue}
              helperText={agreementValue ? formatIndianCurrency(parseFloat(agreementValue)) : undefined}
              required
            />
          </div>
          <div>
            <Input
              label="Booking Advance / Token (₹)"
              type="number"
              placeholder="e.g. 2500000"
              value={bookingAmount}
              onChange={(e) => setBookingAmount(e.target.value)}
              error={errors.bookingAmount}
              helperText={bookingAmount ? formatIndianCurrency(parseFloat(bookingAmount)) : undefined}
              required
            />
          </div>
        </div>

        {/* Payment Reference */}
        <Input
          label="Payment Reference / Instrument"
          placeholder="e.g. HDFC-RTGS-891024 / Cheque #550912"
          value={paymentRef}
          onChange={(e) => setPaymentRef(e.target.value)}
        />

        {/* Booking Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Booking Terms & Agreement Notes
          </label>
          <textarea
            className="w-full rounded-md border border-slate-300 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            rows={2}
            placeholder="e.g. Includes 2 covered car parks. Balance payment linked to 5 construction milestones."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Concurrency Guarantee Notice */}
        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-md flex items-start gap-2 text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>Atomic Reservation Guard:</strong> The unit status will be atomically locked in the database upon submission. If another agent confirms a booking on this unit simultaneously, the system will prevent duplicate booking and alert you.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button variant="outline" size="md" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            type="submit"
            isLoading={isSubmitting}
            disabled={!selectedLeadId || !selectedUnitId}
          >
            Confirm & Issue Booking
          </Button>
        </div>
      </form>
    </Modal>
  );
};
