from datetime import date, datetime
import re
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


class LeadNoteCreate(BaseModel):
    note_type: str = Field(default="Call", description="Call, Meeting, WhatsApp, Site Visit, Note")
    content: str = Field(..., min_length=1, description="Note content")


class LeadNoteResponse(BaseModel):
    id: int
    lead_id: int
    author_id: Optional[int] = None
    author_name: Optional[str] = "System"
    note_type: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class LeadBase(BaseModel):
    name: str = Field(..., description="Lead full name")
    email: EmailStr = Field(..., description="Lead email address")
    phone: str = Field(..., description="Lead contact number")
    stage: str = Field(default="New", description="Lead lifecycle stage")
    priority: str = Field(default="Medium", description="Low, Medium, High, Urgent")
    source: str = Field(default="Direct Inquiry")
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    interested_project_id: Optional[int] = None
    next_followup_date: Optional[date] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        trimmed = v.strip()
        if len(trimmed) < 2:
            raise ValueError("Please enter a valid lead name (at least 2 characters).")
        return trimmed

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        clean_phone = re.sub(r"[\s\-\(\)\+]", "", v)
        if len(clean_phone) < 10 or not clean_phone.isdigit():
            raise ValueError("Please provide a valid phone number with at least 10 digits.")
        return v.strip()


class LeadCreate(LeadBase):
    assigned_user_id: Optional[int] = None
    initial_note: Optional[str] = None

    @field_validator("next_followup_date")
    @classmethod
    def validate_followup_date(cls, v: Optional[date]) -> Optional[date]:
        if v and v < date.today():
            raise ValueError("Follow-up date cannot be earlier than today.")
        return v


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    stage: Optional[str] = None
    priority: Optional[str] = None
    source: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    interested_project_id: Optional[int] = None
    assigned_user_id: Optional[int] = None
    next_followup_date: Optional[date] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            trimmed = v.strip()
            if len(trimmed) < 2:
                raise ValueError("Please enter a valid lead name.")
            return trimmed
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            clean_phone = re.sub(r"[\s\-\(\)\+]", "", v)
            if len(clean_phone) < 10 or not clean_phone.isdigit():
                raise ValueError("Please provide a valid phone number.")
            return v.strip()
        return v

    @field_validator("next_followup_date")
    @classmethod
    def validate_followup_date(cls, v: Optional[date]) -> Optional[date]:
        if v and v < date.today():
            raise ValueError("Follow-up date cannot be earlier than today.")
        return v


class LeadAssignRequest(BaseModel):
    assigned_user_id: int = Field(..., description="ID of sales employee to assign lead to")


class LeadResponse(LeadBase):
    id: int
    assigned_user_id: Optional[int] = None
    assigned_user_name: Optional[str] = None
    interested_project_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    notes_count: Optional[int] = 0
    has_booking: Optional[bool] = False
    booked_unit_number: Optional[str] = None

    class Config:
        from_attributes = True


class LeadDetailResponse(LeadResponse):
    notes: List[LeadNoteResponse] = []
