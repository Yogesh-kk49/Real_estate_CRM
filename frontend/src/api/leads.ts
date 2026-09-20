import { apiClient } from './client';
import { Lead, LeadDetail, LeadNote } from '../types';

export interface LeadFilterParams {
  stage?: string;
  search?: string;
  project_id?: number;
  priority?: string;
  assigned_user_id?: number;
}

export interface LeadCreateData {
  name: string;
  email: string;
  phone: string;
  stage?: string;
  priority?: string;
  source?: string;
  budget_min?: number;
  budget_max?: number;
  interested_project_id?: number;
  assigned_user_id?: number;
  next_followup_date?: string;
  initial_note?: string;
}

export const leadsApi = {
  getLeads: async (params?: LeadFilterParams): Promise<Lead[]> => {
    const res = await apiClient.get<Lead[]>('/leads', { params });
    return res.data;
  },

  getLeadById: async (id: number): Promise<LeadDetail> => {
    const res = await apiClient.get<LeadDetail>(`/leads/${id}`);
    return res.data;
  },

  createLead: async (data: LeadCreateData): Promise<Lead> => {
    const res = await apiClient.post<Lead>('/leads', data);
    return res.data;
  },

  updateLead: async (id: number, data: Partial<LeadCreateData>): Promise<Lead> => {
    const res = await apiClient.put<Lead>(`/leads/${id}`, data);
    return res.data;
  },

  assignLead: async (id: number, assigned_user_id: number): Promise<Lead> => {
    const res = await apiClient.patch<Lead>(`/leads/${id}/assign`, { assigned_user_id });
    return res.data;
  },

  addNote: async (leadId: number, note_type: string, content: string): Promise<LeadNote> => {
    const res = await apiClient.post<LeadNote>(`/leads/${leadId}/notes`, { note_type, content });
    return res.data;
  },

  deleteLead: async (id: number): Promise<void> => {
    await apiClient.delete(`/leads/${id}`);
  },
};
