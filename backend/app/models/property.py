from datetime import datetime
import enum
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base


class UnitAvailability(str, enum.Enum):
    AVAILABLE = "Available"
    RESERVED = "Reserved"
    BOOKED = "Booked"


class UnitType(str, enum.Enum):
    ONE_BHK = "1BHK"
    TWO_BHK = "2BHK"
    THREE_BHK = "3BHK"
    FOUR_BHK = "4BHK"
    PENTHOUSE = "Penthouse"
    VILLA = "Villa"


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    location = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)
    status = Column(String(50), default="Under Construction", nullable=False)
    completion_year = Column(Integer, nullable=True)
    hero_image = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    buildings = relationship("Building", back_populates="project", cascade="all, delete-orphan")
    leads = relationship("Lead", back_populates="interested_project")


class Building(Base):
    __tablename__ = "buildings"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    total_floors = Column(Integer, default=10, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    project = relationship("Project", back_populates="buildings")
    units = relationship("Unit", back_populates="building", cascade="all, delete-orphan")


class Unit(Base):
    __tablename__ = "units"

    id = Column(Integer, primary_key=True, index=True)
    building_id = Column(Integer, ForeignKey("buildings.id", ondelete="CASCADE"), nullable=False)
    unit_number = Column(String(100), nullable=False, index=True)
    unit_type = Column(String(50), nullable=False)
    floor = Column(Integer, nullable=False)
    super_builtup_sqft = Column(Float, nullable=False)
    carpet_sqft = Column(Float, nullable=True)
    facing = Column(String(50), default="East", nullable=True)
    price = Column(Float, nullable=False)  # in INR
    availability = Column(String(50), default=UnitAvailability.AVAILABLE.value, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    building = relationship("Building", back_populates="units")
    booking = relationship("Booking", back_populates="unit", uselist=False)
