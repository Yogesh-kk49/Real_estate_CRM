from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class UnitBase(BaseModel):
    unit_number: str = Field(..., min_length=1)
    unit_type: str = Field(..., description="1BHK, 2BHK, 3BHK, 4BHK, Penthouse, Villa")
    floor: int
    super_builtup_sqft: float = Field(..., gt=0)
    carpet_sqft: Optional[float] = None
    facing: Optional[str] = "East"
    price: float = Field(..., gt=0)
    availability: str = Field(default="Available")


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
