from datetime import date, datetime
from typing import Dict, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.booking import Booking, BookingStatus
from app.models.lead import Lead, LeadNote, LeadStage
from app.models.property import Unit, UnitAvailability
from app.models.user import User, UserRole
from app.schemas.dashboard import (
    DashboardStatsResponse, FollowupItem, InventoryStats,
    PipelineStageCount, RecentActivityItem
)
from app.api.bookings import _format_booking

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    is_admin = current_user.role == UserRole.ADMIN.value
    today = date.today()

    # 1. Lead Query Scoping
    lead_query = db.query(Lead)
    if not is_admin:
        lead_query = lead_query.filter(Lead.assigned_user_id == current_user.id)
    
    all_leads = lead_query.all()
    total_leads = len(all_leads)

    # 2. Pipeline breakdown
    stage_names = [
        LeadStage.NEW.value,
        LeadStage.CONTACTED.value,
        LeadStage.SITE_VISIT.value,
        LeadStage.INTERESTED.value,
        LeadStage.NEGOTIATION.value,
        LeadStage.BOOKED.value,
        LeadStage.LOST.value,
    ]
    pipeline_counts: Dict[str, int] = {s: 0 for s in stage_names}
    for lead in all_leads:
        if lead.stage in pipeline_counts:
            pipeline_counts[lead.stage] += 1
        else:
            pipeline_counts[lead.stage] = 1

    pipeline_stages: List[PipelineStageCount] = []
    for s in stage_names:
        cnt = pipeline_counts.get(s, 0)
        pct = (cnt / total_leads * 100) if total_leads > 0 else 0.0
        pipeline_stages.append(PipelineStageCount(stage=s, count=cnt, percentage=round(pct, 1)))

    # 3. Follow-up analysis
    followups_due_today = 0
    followups_overdue = 0
    upcoming_followups: List[FollowupItem] = []

    leads_with_followup = [l for l in all_leads if l.next_followup_date and l.stage not in [LeadStage.BOOKED.value, LeadStage.LOST.value]]
    # Sort by date
    leads_with_followup.sort(key=lambda x: x.next_followup_date)

    for l in leads_with_followup:
        is_today = l.next_followup_date == today
        is_past = l.next_followup_date < today
        if is_today:
            followups_due_today += 1
        elif is_past:
            followups_overdue += 1

        upcoming_followups.append(
            FollowupItem(
                lead_id=l.id,
                lead_name=l.name,
                lead_phone=l.phone,
                stage=l.stage,
                next_followup_date=l.next_followup_date,
                is_overdue=is_past,
                is_today=is_today,
                assigned_user_name=l.assigned_user.full_name if l.assigned_user else "Unassigned",
            )
        )

    # Limit upcoming followups to top 6
    upcoming_followups = upcoming_followups[:6]

    # 4. Inventory Stats
    all_units = db.query(Unit).all()
    total_units_count = len(all_units)
    avail_count = sum(1 for u in all_units if u.availability == UnitAvailability.AVAILABLE.value)
    reserved_count = sum(1 for u in all_units if u.availability == UnitAvailability.RESERVED.value)
    booked_count = sum(1 for u in all_units if u.availability == UnitAvailability.BOOKED.value)
    total_inv_val = sum(u.price for u in all_units)
    booked_inv_val = sum(u.price for u in all_units if u.availability == UnitAvailability.BOOKED.value)
    occupancy_rate = (booked_count / total_units_count * 100) if total_units_count > 0 else 0.0

    inventory = InventoryStats(
        total_units=total_units_count,
        available_units=avail_count,
        reserved_units=reserved_count,
        booked_units=booked_count,
        occupancy_rate=round(occupancy_rate, 1),
        total_inventory_value=total_inv_val,
        booked_inventory_value=booked_inv_val,
    )

    # 5. Bookings
    booking_query = db.query(Booking).filter(Booking.status == BookingStatus.CONFIRMED.value)
    if not is_admin:
        booking_query = booking_query.filter(Booking.booked_by_user_id == current_user.id)
    
    user_bookings = booking_query.order_by(Booking.booking_date.desc()).all()
    total_booking_val = sum(b.agreement_value for b in user_bookings)
    recent_bookings = [_format_booking(b) for b in user_bookings[:5]]

    # 6. Recent Activity Feed
    activity_query = db.query(LeadNote).join(Lead)
    if not is_admin:
        activity_query = activity_query.filter(Lead.assigned_user_id == current_user.id)
    
    recent_notes = activity_query.order_by(LeadNote.created_at.desc()).limit(8).all()
    recent_activities = [
        RecentActivityItem(
            id=n.id,
            lead_id=n.lead_id,
            lead_name=n.lead.name if n.lead else "Unknown",
            author_name=n.author.full_name if n.author else "System",
            note_type=n.note_type,
            content=n.content,
            created_at=n.created_at,
        )
        for n in recent_notes
    ]

    return DashboardStatsResponse(
        total_leads=total_leads,
        pipeline_counts=pipeline_counts,
        pipeline_stages=pipeline_stages,
        followups_due_today=followups_due_today,
        followups_overdue=followups_overdue,
        upcoming_followups=upcoming_followups,
        inventory=inventory,
        total_bookings_count=len(user_bookings),
        total_booking_value=total_booking_val,
        recent_bookings=recent_bookings,
        recent_activities=recent_activities,
    )
