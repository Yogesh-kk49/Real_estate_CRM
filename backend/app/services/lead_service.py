from datetime import date, datetime
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.models.booking import Booking, BookingStatus
from app.models.lead import Lead, LeadNote, LeadStage
from app.models.user import User, UserRole
from app.schemas.lead import LeadCreate, LeadNoteCreate, LeadUpdate


def get_leads_for_user(
    db: Session,
    user: User,
    stage: Optional[str] = None,
    search: Optional[str] = None,
    project_id: Optional[int] = None,
    priority: Optional[str] = None,
    assigned_user_id: Optional[int] = None,
) -> List[Lead]:
    query = db.query(Lead)

    # RBAC: Sales employees can only access their assigned leads
    if user.role == UserRole.SALES_EMPLOYEE.value:
        query = query.filter(Lead.assigned_user_id == user.id)
    elif assigned_user_id:
        query = query.filter(Lead.assigned_user_id == assigned_user_id)

    # Filtering
    if stage and stage != "All":
        query = query.filter(Lead.stage == stage)
    if project_id:
        query = query.filter(Lead.interested_project_id == project_id)
    if priority and priority != "All":
        query = query.filter(Lead.priority == priority)

    # Search
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Lead.name.ilike(search_pattern),
                Lead.email.ilike(search_pattern),
                Lead.phone.ilike(search_pattern),
            )
        )

    return query.order_by(Lead.updated_at.desc()).all()


def get_lead_by_id_with_perm_check(db: Session, lead_id: int, user: User) -> Lead:
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The requested lead was not found."
        )

    if user.role == UserRole.SALES_EMPLOYEE.value and lead.assigned_user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this lead."
        )

    return lead


def create_lead(db: Session, lead_in: LeadCreate, current_user: User) -> Lead:
    # 1. Prevent duplicate leads with same email or phone
    existing_lead = db.query(Lead).filter(
        or_(Lead.email == lead_in.email.strip().lower(), Lead.phone == lead_in.phone.strip())
    ).first()
    if existing_lead:
        field = "email address" if existing_lead.email.lower() == lead_in.email.strip().lower() else "phone number"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A lead with this {field} already exists ({existing_lead.name})."
        )

    # 2. Block initial creation with 'Booked' stage without a booking
    if lead_in.stage == LeadStage.BOOKED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot set lead stage to 'Booked' on creation. Create the lead first, then execute a property booking."
        )

    # Assign employee logic
    assigned_id = lead_in.assigned_user_id
    if current_user.role == UserRole.SALES_EMPLOYEE.value:
        # Sales employees always have new leads assigned to themselves
        assigned_id = current_user.id
    elif not assigned_id:
        assigned_id = current_user.id

    now = datetime.utcnow()
    lead = Lead(
        name=lead_in.name,
        email=lead_in.email.strip().lower(),
        phone=lead_in.phone.strip(),
        stage=lead_in.stage or LeadStage.NEW.value,
        priority=lead_in.priority,
        source=lead_in.source,
        budget_min=lead_in.budget_min,
        budget_max=lead_in.budget_max,
        interested_project_id=lead_in.interested_project_id,
        assigned_user_id=assigned_id,
        next_followup_date=lead_in.next_followup_date,
        created_at=now,
        updated_at=now,
    )
    db.add(lead)
    db.flush()

    # Add initial note if provided
    initial_text = lead_in.initial_note or "Lead created in system."
    note = LeadNote(
        lead_id=lead.id,
        author_id=current_user.id,
        note_type="General",
        content=initial_text,
        created_at=now,
    )
    db.add(note)

    db.commit()
    db.refresh(lead)
    return lead


def update_lead(db: Session, lead_id: int, lead_in: LeadUpdate, current_user: User) -> Lead:
    lead = get_lead_by_id_with_perm_check(db, lead_id, current_user)
    
    update_data = lead_in.model_dump(exclude_unset=True)
    
    # Check if attempting to reassign
    if "assigned_user_id" in update_data and update_data["assigned_user_id"] != lead.assigned_user_id:
        if current_user.role != UserRole.ADMIN.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can reassign leads."
            )

    # Check budget range consistency with existing values
    new_min = update_data.get("budget_min", lead.budget_min)
    new_max = update_data.get("budget_max", lead.budget_max)
    if new_min is not None and new_max is not None and new_min > new_max:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum budget cannot be greater than maximum budget."
        )

    # Check if duplicate email/phone when updating contact info
    if "email" in update_data or "phone" in update_data:
        new_email = update_data.get("email", lead.email)
        new_phone = update_data.get("phone", lead.phone)
        dup = db.query(Lead).filter(
            Lead.id != lead.id,
            or_(Lead.email == new_email, Lead.phone == new_phone)
        ).first()
        if dup:
            field = "email address" if dup.email == new_email else "phone number"
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Another lead with this {field} already exists ({dup.name})."
            )

    stage_changed = False
    old_stage = lead.stage

    for field, value in update_data.items():
        if field == "stage" and value != old_stage:
            # Enforce: Cannot transition to Booked without an active confirmed booking
            if value == LeadStage.BOOKED.value:
                active_booking = db.query(Booking).filter(
                    Booking.lead_id == lead.id,
                    Booking.status == BookingStatus.CONFIRMED.value
                ).first()
                if not active_booking:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Cannot update lead stage to 'Booked' without an active confirmed property booking. Please create a booking first."
                    )
            stage_changed = True
        setattr(lead, field, value)

    lead.updated_at = datetime.utcnow()

    # If stage changed, append an audit note
    if stage_changed:
        audit_note = LeadNote(
            lead_id=lead.id,
            author_id=current_user.id,
            note_type="Stage Change",
            content=f"Stage transitioned from '{old_stage}' to '{lead.stage}' by {current_user.full_name}.",
            created_at=datetime.utcnow(),
        )
        db.add(audit_note)

    db.commit()
    db.refresh(lead)
    return lead


def add_note_to_lead(db: Session, lead_id: int, note_in: LeadNoteCreate, current_user: User) -> LeadNote:
    lead = get_lead_by_id_with_perm_check(db, lead_id, current_user)

    note = LeadNote(
        lead_id=lead.id,
        author_id=current_user.id,
        note_type=note_in.note_type,
        content=note_in.content,
        created_at=datetime.utcnow(),
    )
    db.add(note)
    lead.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(note)
    return note
