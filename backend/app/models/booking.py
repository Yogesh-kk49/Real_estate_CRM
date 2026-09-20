from datetime import datetime
import enum
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


class BookingStatus(str, enum.Enum):
    CONFIRMED = "Confirmed"
    CANCELLED = "Cancelled"


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="RESTRICT"), nullable=False, index=True)
    unit_id = Column(Integer, ForeignKey("units.id", ondelete="RESTRICT"), nullable=False, unique=True, index=True)
    booked_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    agreement_value = Column(Float, nullable=False)
    booking_amount = Column(Float, nullable=False)
    status = Column(String(50), default=BookingStatus.CONFIRMED.value, nullable=False, index=True)
    payment_reference = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    
    booking_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    lead = relationship("Lead", back_populates="booking")
    unit = relationship("Unit", back_populates="booking")
    booked_by = relationship("User", back_populates="bookings")
