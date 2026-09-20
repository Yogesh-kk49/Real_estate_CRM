from datetime import date, datetime
from typing import Dict, List, Optional
from pydantic import BaseModel
from app.schemas.booking import BookingResponse


class PipelineStageCount(BaseModel):
    stage: str
    count: int
    percentage: float


class FollowupItem(BaseModel):
    lead_id: int
    lead_name: str
    lead_phone: str
    stage: str
    next_followup_date: date
    is_overdue: bool
    is_today: bool
    assigned_user_name: Optional[str] = None


class RecentActivityItem(BaseModel):
    id: int
    lead_id: int
    lead_name: str
    author_name: str
    note_type: str
    content: str
    created_at: datetime


class InventoryStats(BaseModel):
    total_units: int
    available_units: int
    reserved_units: int
    booked_units: int
    occupancy_rate: float
    total_inventory_value: float
    booked_inventory_value: float


class DashboardStatsResponse(BaseModel):
    total_leads: int
    pipeline_counts: Dict[str, int]
    pipeline_stages: List[PipelineStageCount]
    followups_due_today: int
    followups_overdue: int
    upcoming_followups: List[FollowupItem]
    inventory: InventoryStats
    total_bookings_count: int
    total_booking_value: float
    recent_bookings: List[BookingResponse]
    recent_activities: List[RecentActivityItem]
