import { apiClient } from './client';
import { Booking } from '../types';

export interface BookingCreateData {
  lead_id: number;
  unit_id: number;
  agreement_value?: number;
  booking_amount: number;
  payment_reference?: string;
  notes?: string;
}

export const bookingsApi = {
  getBookings: async (): Promise<Booking[]> => {
    const res = await apiClient.get<Booking[]>('/bookings');
    return res.data;
  },

  createBooking: async (data: BookingCreateData): Promise<Booking> => {
    const res = await apiClient.post<Booking>('/bookings', data);
    return res.data;
  },

  getBookingById: async (id: number): Promise<Booking> => {
    const res = await apiClient.get<Booking>(`/bookings/${id}`);
    return res.data;
  },
};
