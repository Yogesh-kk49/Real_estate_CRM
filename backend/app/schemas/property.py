from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
from app.models.property import UnitType, UnitAvailability


VALID_UNIT_TYPES = {t.value for t in UnitType}
VALID_AVAILABILITIES = {a.value for a in UnitAvailability}


class UnitBase(BaseModel):
    unit_number: str = Field(..., min_length=1)
    unit_type: str = Field(..., description="1BHK, 2BHK, 3BHK, 4BHK, Penthouse, Villa")
    floor: int
    super_builtup_sqft: float = Field(..., gt=0)
    carpet_sqft: Optional[float] = None
    facing: Optional[str] = "East"
    price: float = Field(..., gt=0)
    availability: str = Field(default=UnitAvailability.AVAILABLE.value)

    @field_validator("unit_type")
    @classmethod
    def validate_unit_type(cls, v: str) -> str:
        if v not in VALID_UNIT_TYPES:
            valid_list = ", ".join(sorted(VALID_UNIT_TYPES))
            raise ValueError(f"Invalid unit type '{v}'. Must be one of: {valid_list}")
        return v

    @field_validator("availability")
    @classmethod
    def validate_availability(cls, v: str) -> str:
        if v not in VALID_AVAILABILITIES:
            valid_list = ", ".join(sorted(VALID_AVAILABILITIES))
            raise ValueError(f"Invalid availability '{v}'. Must be one of: {valid_list}")
        return v


class UnitCreate(UnitBase):
    building_id: int


class UnitUpdate(BaseModel):
    unit_number: Optional[str] = None
    unit_type: Optional[str] = None
    floor: Optional[int] = None
    super_builtup_sqft: Optional[float] = None
    carpet_sqft: Optional[float] = None
    facing: Optional[str] = None
    price: Optional[float] = None
    availability: Optional[str] = None

    @field_validator("unit_type")
    @classmethod
    def validate_unit_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_UNIT_TYPES:
            valid_list = ", ".join(sorted(VALID_UNIT_TYPES))
            raise ValueError(f"Invalid unit type '{v}'. Must be one of: {valid_list}")
        return v

    @field_validator("availability")
    @classmethod
    def validate_availability(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_AVAILABILITIES:
            valid_list = ", ".join(sorted(VALID_AVAILABILITIES))
            raise ValueError(f"Invalid availability '{v}'. Must be one of: {valid_list}")
        return v


class UnitResponse(UnitBase):
    id: int
    building_id: int
    building_name: Optional[str] = None
    project_id: Optional[int] = None
    project_name: Optional[str] = None
    project_location: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True


class BuildingBase(BaseModel):
    name: str = Field(..., min_length=1)
    total_floors: int = Field(default=10, gt=0)


class BuildingCreate(BuildingBase):
    project_id: int


class BuildingResponse(BuildingBase):
    id: int
    project_id: int
    units_count: Optional[int] = 0
    available_units_count: Optional[int] = 0
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=2)
    location: str = Field(..., min_length=2)
    description: Optional[str] = None
    status: str = Field(default="Under Construction")
    completion_year: Optional[int] = None
    hero_image: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectResponse(ProjectBase):
    id: int
    buildings_count: Optional[int] = 0
    total_units_count: Optional[int] = 0
    available_units_count: Optional[int] = 0
    booked_units_count: Optional[int] = 0
    created_at: datetime

    class Config:
        from_attributes = True
