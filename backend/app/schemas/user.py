from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
import re


class UserLogin(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=1, description="Account password")


class UserCreate(BaseModel):
    email: EmailStr = Field(..., description="Work email address")
    full_name: str = Field(..., min_length=3, max_length=100, description="Full name")
    password: str = Field(..., min_length=8, description="Password (min 8 characters)")
    phone: str = Field(..., description="Mobile number")
    role: str = Field(default="SALES_EMPLOYEE", description="User role")

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Full name must be at least 3 characters.")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        digits = re.sub(r"[\s\-\(\)\+]", "", v)
        if not digits.isdigit() or len(digits) < 10:
            raise ValueError("Enter a valid mobile number (at least 10 digits).")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v != "SALES_EMPLOYEE":
            raise ValueError("Administrators can recruit sales staff members only (SALES_EMPLOYEE).")
        return v



class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=3)
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime
    leads_count: Optional[int] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

