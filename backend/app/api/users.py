from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.core.security import get_password_hash
from app.models.lead import Lead
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


def _enrich(user: User, db: Session) -> dict:
    """Attach leads_count to a user dict for the response."""
    leads_count = db.query(Lead).filter(Lead.assigned_user_id == user.id).count()
    data = {c.name: getattr(user, c.name) for c in user.__table__.columns}
    data["leads_count"] = leads_count
    return data


@router.get("/employees", response_model=List[UserResponse])
def get_sales_employees(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns list of all active users for lead-assignment dropdowns."""
    users = db.query(User).filter(User.is_active == True).order_by(User.full_name.asc()).all()
    return [_enrich(u, db) for u in users]


@router.get("", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Admin-only: list all system users with their lead counts."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [_enrich(u, db) for u in users]


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Admin-only: recruit a new sales consultant (staff member)."""
    # Duplicate email guard
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An account with email '{payload.email}' already exists.",
        )

    new_user = User(
        email=payload.email,
        full_name=payload.full_name.strip(),
        hashed_password=get_password_hash(payload.password),
        phone=payload.phone,
        role=UserRole.SALES_EMPLOYEE.value,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return _enrich(new_user, db)



@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Admin-only: update name/phone or deactivate/reactivate an account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Prevent admin from deactivating themselves
    if payload.is_active is False and user.id == admin_user.id:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account.")

    if payload.full_name is not None:
        user.full_name = payload.full_name.strip()
    if payload.phone is not None:
        user.phone = payload.phone
    if payload.is_active is not None:
        user.is_active = payload.is_active

    db.commit()
    db.refresh(user)
    return _enrich(user, db)

