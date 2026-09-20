from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin, require_sales_or_admin
from app.models.lead import Lead, LeadNote
from app.models.user import User, UserRole
from app.schemas.lead import (
    LeadAssignRequest, LeadCreate, LeadDetailResponse,
    LeadNoteCreate, LeadNoteResponse, LeadResponse, LeadUpdate
)
from app.services.lead_service import (
    add_note_to_lead, create_lead, get_lead_by_id_with_perm_check,
    get_leads_for_user, update_lead
)

router = APIRouter(prefix="/leads", tags=["Leads"])


def _format_lead_response(lead: Lead) -> dict:
    return {
        "id": lead.id,
        "name": lead.name,
        "email": lead.email,
        "phone": lead.phone,
        "stage": lead.stage,
        "priority": lead.priority,
        "source": lead.source,
        "budget_min": lead.budget_min,
        "budget_max": lead.budget_max,
        "interested_project_id": lead.interested_project_id,
        "interested_project_name": lead.interested_project.name if lead.interested_project else None,
        "assigned_user_id": lead.assigned_user_id,
        "assigned_user_name": lead.assigned_user.full_name if lead.assigned_user else "Unassigned",
        "next_followup_date": lead.next_followup_date,
        "created_at": lead.created_at,
        "updated_at": lead.updated_at,
        "notes_count": len(lead.notes),
        "has_booking": lead.booking is not None,
        "booked_unit_number": lead.booking.unit.unit_number if lead.booking and lead.booking.unit else None,
    }


def _format_lead_detail_response(lead: Lead) -> dict:
    base = _format_lead_response(lead)
    notes_list = [
        {
            "id": n.id,
            "lead_id": n.lead_id,
            "author_id": n.author_id,
            "author_name": n.author.full_name if n.author else "System",
            "note_type": n.note_type,
            "content": n.content,
            "created_at": n.created_at,
        }
        for n in lead.notes
    ]
    base["notes"] = notes_list
    return base


@router.get("", response_model=List[LeadResponse])
def list_leads(
    stage: Optional[str] = Query(None, description="Filter by stage"),
    search: Optional[str] = Query(None, description="Search name, email, phone"),
    project_id: Optional[int] = Query(None, description="Filter by project"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    assigned_user_id: Optional[int] = Query(None, description="Filter by assigned employee"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    leads = get_leads_for_user(
        db=db,
        user=current_user,
        stage=stage,
        search=search,
        project_id=project_id,
        priority=priority,
        assigned_user_id=assigned_user_id,
    )
    return [_format_lead_response(l) for l in leads]


@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_new_lead(
    lead_in: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = create_lead(db, lead_in, current_user)
    return _format_lead_response(lead)


@router.get("/{id}", response_model=LeadDetailResponse)
def get_lead(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = get_lead_by_id_with_perm_check(db, id, current_user)
    return _format_lead_detail_response(lead)


@router.put("/{id}", response_model=LeadResponse)
def update_existing_lead(
    id: int,
    lead_in: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = update_lead(db, id, lead_in, current_user)
    return _format_lead_response(lead)


@router.patch("/{id}/assign", response_model=LeadResponse)
def assign_lead(
    id: int,
    assign_req: LeadAssignRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    lead = db.query(Lead).filter(Lead.id == id).first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The requested lead does not exist."
        )

    target_user = db.query(User).filter(User.id == assign_req.assigned_user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The assigned employee does not exist."
        )

    old_assignee = lead.assigned_user.full_name if lead.assigned_user else "Unassigned"
    lead.assigned_user_id = target_user.id
    
    # Add audit note
    note = LeadNote(
        lead_id=lead.id,
        author_id=admin_user.id,
        note_type="Reassignment",
        content=f"Reassigned from {old_assignee} to {target_user.full_name} by Administrator.",
    )
    db.add(note)
    db.commit()
    db.refresh(lead)
    return _format_lead_response(lead)


@router.post("/{id}/notes", response_model=LeadNoteResponse, status_code=status.HTTP_201_CREATED)
def add_note(
    id: int,
    note_in: LeadNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = add_note_to_lead(db, id, note_in, current_user)
    return {
        "id": note.id,
        "lead_id": note.lead_id,
        "author_id": note.author_id,
        "author_name": current_user.full_name,
        "note_type": note.note_type,
        "content": note.content,
        "created_at": note.created_at,
    }


@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_lead(
    id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    lead = db.query(Lead).filter(Lead.id == id).first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The requested lead does not exist."
        )

    if lead.booking:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete lead with an active property booking. Please cancel the booking first."
        )

    db.delete(lead)
    db.commit()
    return {"message": "Lead deleted successfully."}
