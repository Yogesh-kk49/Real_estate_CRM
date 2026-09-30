from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.models.booking import Booking, BookingStatus
from app.models.lead import Lead, LeadNote, LeadStage
from app.models.property import Unit, UnitAvailability
from app.models.user import User, UserRole
from app.schemas.booking import BookingCreate


def create_booking_with_concurrency_lock(
    db: Session,
    booking_in: BookingCreate,
    current_user: User
) -> Booking:
    """
    Creates a property booking with atomic double-booking prevention.
    
    Guarantees that two concurrent booking requests for the same unit cannot both succeed.
    Uses atomic conditional state transition + DB unique constraint.
    """
    # 1. Validate Lead existence and permissions
    lead = db.query(Lead).filter(Lead.id == booking_in.lead_id).first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The requested lead does not exist."
        )

    # Sales employees can only book for leads assigned to them
    if current_user.role == UserRole.SALES_EMPLOYEE.value and lead.assigned_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create bookings for leads assigned to you."
        )

    # Check if lead already has an active confirmed booking
    existing_lead_booking = db.query(Booking).filter(
        Booking.lead_id == lead.id,
        Booking.status == BookingStatus.CONFIRMED.value
    ).first()
    if existing_lead_booking:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This lead already has an active booking (Unit {existing_lead_booking.unit.unit_number})."
        )

    # 2. Check Unit existence
    target_unit = db.query(Unit).filter(Unit.id == booking_in.unit_id).first()
    if not target_unit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The requested property unit does not exist."
        )

    # If the unit is already known not to be available, reject immediately
    if target_unit.availability != UnitAvailability.AVAILABLE.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Unit {target_unit.unit_number} was just booked by another user. Please select another available unit."
        )

    # 3. ATOMIC CONDITIONAL UPDATE
    # In PostgreSQL & SQL, an atomic UPDATE statement locks the row and updates it only if
    # availability is still 'Available'. If another concurrent thread updated it a millisecond
    # earlier, rowcount will be 0.
    now = datetime.utcnow()
    stmt = (
        update(Unit)
        .where(
            Unit.id == booking_in.unit_id,
            Unit.availability == UnitAvailability.AVAILABLE.value
        )
        .values(
            availability=UnitAvailability.BOOKED.value,
            updated_at=now
        )
    )

    try:
        res = db.execute(stmt)
        if res.rowcount == 0:
            # Another transaction booked the unit concurrently
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Unit {target_unit.unit_number} was just booked by another user. Please select another available unit."
            )

        # 4. Insert confirmed booking record
        final_price = booking_in.agreement_value if booking_in.agreement_value is not None else target_unit.price
        
        booking = Booking(
            lead_id=lead.id,
            unit_id=target_unit.id,
            booked_by_user_id=current_user.id,
            agreement_value=final_price,
            booking_amount=booking_in.booking_amount,
            status=BookingStatus.CONFIRMED.value,
            payment_reference=booking_in.payment_reference,
            notes=booking_in.notes,
            booking_date=now,
            created_at=now,
        )
        db.add(booking)

        # 5. Automatically transition lead stage to 'Booked'
        lead.stage = LeadStage.BOOKED.value
        lead.updated_at = now

        # 6. Append audit note to lead timeline
        audit_note = LeadNote(
            lead_id=lead.id,
            author_id=current_user.id,
            note_type="Booking",
            content=f"Unit {target_unit.unit_number} ({target_unit.building.name}, {target_unit.building.project.name}) booked by {current_user.full_name}. Agreement: ₹{final_price:,.2f}, Advance: ₹{booking_in.booking_amount:,.2f}.",
            created_at=now,
        )
        db.add(audit_note)

        db.commit()
        db.refresh(booking)
        return booking

    except IntegrityError as ie:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Unit {target_unit.unit_number} was just booked by another user. Please select another available unit."
        )
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while processing the booking: {str(e)}"
        )


def cancel_booking(db: Session, booking_id: int, current_user: User) -> Booking:
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The requested booking does not exist."
        )

    # Permission check: Admin or the consultant who executed the booking
    if current_user.role != UserRole.ADMIN.value and booking.booked_by_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to cancel this booking."
        )

    if booking.status == BookingStatus.CANCELLED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This booking has already been cancelled."
        )

    now = datetime.utcnow()
    booking.status = BookingStatus.CANCELLED.value

    # Free the unit back to Available
    unit = db.query(Unit).filter(Unit.id == booking.unit_id).first()
    unit_number = "Unknown"
    if unit:
        unit.availability = UnitAvailability.AVAILABLE.value
        unit.updated_at = now
        unit_number = unit.unit_number

    # Revert lead stage from Booked back to Negotiation
    lead = db.query(Lead).filter(Lead.id == booking.lead_id).first()
    if lead:
        if lead.stage == LeadStage.BOOKED.value:
            lead.stage = LeadStage.NEGOTIATION.value
            lead.updated_at = now

        # Append cancellation audit note to lead timeline
        audit_note = LeadNote(
            lead_id=lead.id,
            author_id=current_user.id,
            note_type="Booking Cancellation",
            content=f"Booking #{booking.id} for Unit {unit_number} was cancelled by {current_user.full_name}. Unit has been returned to Available inventory.",
            created_at=now,
        )
        db.add(audit_note)

    db.commit()
    db.refresh(booking)
    return booking

