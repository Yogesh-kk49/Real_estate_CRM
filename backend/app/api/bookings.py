from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.booking import Booking
from app.models.user import User, UserRole
from app.schemas.booking import BookingCreate, BookingResponse
from app.services.booking_service import create_booking_with_concurrency_lock

router = APIRouter(prefix="/bookings", tags=["Bookings"])


def _format_booking(b: Booking) -> dict:
    return {
        "id": b.id,
        "lead_id": b.lead_id,
        "lead_name": b.lead.name if b.lead else "Unknown",
        "lead_email": b.lead.email if b.lead else None,
        "lead_phone": b.lead.phone if b.lead else None,
        "unit_id": b.unit_id,
        "unit_number": b.unit.unit_number if b.unit else "Unknown",
        "unit_type": b.unit.unit_type if b.unit else "Unknown",
        "building_name": b.unit.building.name if b.unit and b.unit.building else "",
        "project_name": b.unit.building.project.name if b.unit and b.unit.building and b.unit.building.project else "",
        "booked_by_user_id": b.booked_by_user_id,
        "booked_by_name": b.booked_by.full_name if b.booked_by else "System",
        "agreement_value": b.agreement_value,
        "booking_amount": b.booking_amount,
        "status": b.status,
        "payment_reference": b.payment_reference,
        "notes": b.notes,
        "booking_date": b.booking_date,
    }


@router.get("", response_model=List[BookingResponse])
def list_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Booking)
    # RBAC: Sales employees only see their own created bookings
    if current_user.role == UserRole.SALES_EMPLOYEE.value:
        query = query.filter(Booking.booked_by_user_id == current_user.id)

    bookings = query.order_by(Booking.booking_date.desc()).all()
    return [_format_booking(b) for b in bookings]


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_in: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = create_booking_with_concurrency_lock(
        db=db,
        booking_in=booking_in,
        current_user=current_user
    )
    return _format_booking(booking)


@router.get("/{id}", response_model=BookingResponse)
def get_booking(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = db.query(Booking).filter(Booking.id == id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")

    if current_user.role == UserRole.SALES_EMPLOYEE.value and booking.booked_by_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    return _format_booking(booking)
