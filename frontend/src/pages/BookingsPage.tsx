import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookmarkCheck, Plus, Search, Building2, User,
  Calendar, FileText, CheckCircle2, DollarSign
} from 'lucide-react';
import { Booking } from '../types';
import { bookingsApi } from '../api/bookings';
import { formatIndianCurrency, formatFullINR } from '../utils/currency';
import { formatDate, formatDateTime } from '../utils/date';
import { Button } from '../components/ui/Button';
import { TableSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { BookingModal } from '../components/bookings/BookingModal';
import { useAuth } from '../contexts/AuthContext';

export const BookingsPage: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const data = await bookingsApi.getBookings();
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const filteredBookings = bookings.filter((b) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      b.lead_name.toLowerCase().includes(term) ||
      b.unit_number.toLowerCase().includes(term) ||
      b.building_name.toLowerCase().includes(term) ||
      b.project_name.toLowerCase().includes(term) ||
      (b.payment_reference && b.payment_reference.toLowerCase().includes(term))
    );
  });

  const totalValue = filteredBookings.reduce((sum, b) => sum + b.agreement_value, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Confirmed Property Bookings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official sales agreements, advance receipts, and customer-unit allocations.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsBookingModalOpen(true)}
        >
          Create Booking
        </Button>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-estate-border shadow-xs">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">Total Bookings</span>
          <p className="text-xl font-extrabold text-slate-900 font-mono mt-1">{filteredBookings.length} Units</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-estate-border shadow-xs">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">Total Agreement Value</span>
          <p className="text-xl font-extrabold text-emerald-700 font-mono mt-1">{formatIndianCurrency(totalValue)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-estate-border shadow-xs">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">Role View</span>
          <p className="text-sm font-bold text-slate-900 mt-1">
            {isAdmin ? 'All Organization Bookings' : `Consultant View (${user?.full_name})`}
          </p>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-xl border border-estate-border shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search booking by customer, unit number, project, or reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-brand-500 text-slate-900 font-medium"
          />
        </div>
      </div>

      {/* Ledger Table */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          icon={BookmarkCheck}
          title="No bookings recorded"
          description="There are no confirmed bookings matching your search or assigned territory."
          actionLabel="Create First Booking"
          onAction={() => setIsBookingModalOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-xl border border-estate-border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-300 text-slate-700 font-extrabold uppercase tracking-wider">
                  <th className="py-3.5 px-5">Booking Ref</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Allocated Unit</th>
                  <th className="py-3.5 px-4">Project & Building</th>
                  <th className="py-3.5 px-4">Agreement Value</th>
                  <th className="py-3.5 px-4">Token Paid</th>
                  <th className="py-3.5 px-4">Consultant</th>
                  <th className="py-3.5 px-4 text-right">Booking Date</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Booking ID & Status */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-mono font-bold text-slate-900">BK-{b.id.toString().padStart(4, '0')}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        {b.payment_reference || 'Ref: Direct'}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/leads/${b.lead_id}`}
                        className="font-bold text-slate-900 hover:text-brand-600 hover:underline block"
                      >
                        {b.lead_name}
                      </Link>
                      <span className="text-[11px] font-mono text-slate-500">{b.lead_phone}</span>
                    </td>

                    {/* Unit */}
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Unit {b.unit_number}
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">{b.unit_type}</span>
                    </td>

                    {/* Project & Building */}
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{b.project_name}</p>
                      <p className="text-[11px] text-slate-500">{b.building_name}</p>
                    </td>

                    {/* Agreement Value */}
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 text-sm">
                      {formatIndianCurrency(b.agreement_value)}
                    </td>

                    {/* Token Paid */}
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {formatIndianCurrency(b.booking_amount)}
                    </td>

                    {/* Consultant */}
                    <td className="py-3.5 px-4 text-slate-700">
                      {b.booked_by_name}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                      {formatDate(b.booking_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={fetchBookings}
      />
    </div>
  );
};
