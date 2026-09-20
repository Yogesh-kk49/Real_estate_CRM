from datetime import datetime
import enum
from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    SALES_EMPLOYEE = "SALES_EMPLOYEE"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.SALES_EMPLOYEE.value, nullable=False)
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    assigned_leads = relationship("Lead", back_populates="assigned_user", foreign_keys="Lead.assigned_user_id")
    notes = relationship("LeadNote", back_populates="author")
    bookings = relationship("Booking", back_populates="booked_by")
