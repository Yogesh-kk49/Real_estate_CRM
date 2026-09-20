from datetime import datetime, date
import enum
from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class LeadStage(str, enum.Enum):
    NEW = "New"
    CONTACTED = "Contacted"
    SITE_VISIT = "Site Visit"
    INTERESTED = "Interested"
    NEGOTIATION = "Negotiation"
    BOOKED = "Booked"
    LOST = "Lost"


class LeadPriority(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    URGENT = "Urgent"


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=False, index=True)
    stage = Column(String(50), default=LeadStage.NEW.value, nullable=False, index=True)
    priority = Column(String(50), default=LeadPriority.MEDIUM.value, nullable=False)
    source = Column(String(100), default="Direct Inquiry", nullable=False)
    budget_min = Column(Float, nullable=True)
    budget_max = Column(Float, nullable=True)
    next_followup_date = Column(Date, nullable=True, index=True)
    
    assigned_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    interested_project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    assigned_user = relationship("User", back_populates="assigned_leads", foreign_keys=[assigned_user_id])
    interested_project = relationship("Project", back_populates="leads")
    notes = relationship("LeadNote", back_populates="lead", cascade="all, delete-orphan", order_by="desc(LeadNote.created_at)")
    booking = relationship("Booking", back_populates="lead", uselist=False)


class LeadNote(Base):
    __tablename__ = "lead_notes"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    note_type = Column(String(50), default="Call", nullable=False)  # Call, Meeting, WhatsApp, Site Visit, Note, Booking
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    lead = relationship("Lead", back_populates="notes")
    author = relationship("User", back_populates="notes")
