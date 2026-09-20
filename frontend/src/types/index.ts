export type UserRole = 'ADMIN' | 'SALES_EMPLOYEE';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  is_active: boolean;
  created_at: string;
  leads_count?: number;
}

export interface UserCreate {
  email: string;
  full_name: string;
  password: string;
  phone: string;
  role: UserRole;
}

export type LeadStage =
  | 'New'
  | 'Contacted'
  | 'Site Visit'
  | 'Interested'
  | 'Negotiation'
  | 'Booked'
  | 'Lost';

export type LeadPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface LeadNote {
  id: number;
  lead_id: number;
  author_id?: number;
  author_name: string;
  note_type: 'Call' | 'Meeting' | 'WhatsApp' | 'Site Visit' | 'Stage Change' | 'Reassignment' | 'Booking' | 'General';
  content: string;
  created_at: string;
}

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  stage: LeadStage;
  priority: LeadPriority;
  source: string;
  budget_min?: number;
  budget_max?: number;
  interested_project_id?: number;
  interested_project_name?: string;
  assigned_user_id?: number;
  assigned_user_name?: string;
  next_followup_date?: string;
  created_at: string;
  updated_at: string;
  notes_count: number;
  has_booking: boolean;
  booked_unit_number?: string;
}

export interface LeadDetail extends Lead {
  notes: LeadNote[];
}

export type UnitAvailability = 'Available' | 'Reserved' | 'Booked';

export type UnitType = '1BHK' | '2BHK' | '3BHK' | '4BHK' | 'Penthouse' | 'Villa';

export interface Unit {
  id: number;
  building_id: number;
  building_name?: string;
  project_id?: number;
  project_name?: string;
  project_location?: string;
  unit_number: string;
  unit_type: UnitType;
  floor: number;
  super_builtup_sqft: number;
  carpet_sqft?: number;
  facing?: string;
  price: number;
  availability: UnitAvailability;
  updated_at: string;
}

export interface Building {
  id: number;
  project_id: number;
  name: string;
  total_floors: number;
  units_count: number;
  available_units_count: number;
  created_at: string;
}

export interface Project {
  id: number;
  name: string;
  location: string;
  description?: string;
  status: string;
  completion_year?: number;
  hero_image?: string;
  buildings_count: number;
  total_units_count: number;
  available_units_count: number;
  booked_units_count: number;
  created_at: string;
}

export interface Booking {
  id: number;
  lead_id: number;
  lead_name: string;
  lead_email?: string;
  lead_phone?: string;
  unit_id: number;
  unit_number: string;
  unit_type: string;
  building_name: string;
  project_name: string;
  booked_by_user_id: number;
  booked_by_name: string;
  agreement_value: number;
  booking_amount: number;
  status: string;
  payment_reference?: string;
  notes?: string;
  booking_date: string;
}

export interface PipelineStageCount {
  stage: LeadStage;
  count: number;
  percentage: number;
}

export interface FollowupItem {
  lead_id: number;
  lead_name: string;
  lead_phone: string;
  stage: LeadStage;
  next_followup_date: string;
  is_overdue: boolean;
  is_today: boolean;
  assigned_user_name?: string;
}

export interface RecentActivityItem {
  id: number;
  lead_id: number;
  lead_name: string;
  author_name: string;
  note_type: string;
  content: string;
  created_at: string;
}

export interface InventoryStats {
  total_units: number;
  available_units: number;
  reserved_units: number;
  booked_units: number;
  occupancy_rate: number;
  total_inventory_value: number;
  booked_inventory_value: number;
}

export interface DashboardStats {
  total_leads: number;
  pipeline_counts: Record<string, number>;
  pipeline_stages: PipelineStageCount[];
  followups_due_today: number;
  followups_overdue: number;
  upcoming_followups: FollowupItem[];
  inventory: InventoryStats;
  total_bookings_count: number;
  total_booking_value: number;
  recent_bookings: Booking[];
  recent_activities: RecentActivityItem[];
}
