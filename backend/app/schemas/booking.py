from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class BookingCreate(BaseModel):
    lead_id: int = Field(..., description="Lead ID to attach booking to")
    unit_id: int = Field(..., description="Target property unit ID to book")
    agreement_value: Optional[float] = Field(None, gt=0, description="Agreed property value in INR")
    booking_amount: float = Field(..., gt=0, description="Token/Advance booking amount in INR")
    payment_reference: Optional[str] = Field(None, description="Cheque / RTGS / UTR reference number")
    notes: Optional[str] = None


class BookingResponse(BaseModel):
    id: int
    lead_id: int
    lead_name: str
    lead_email: Optional[str] = None
    lead_phone: Optional[str] = None
    
    unit_id: int
    unit_number: str
    unit_type: str
    building_name: str
    project_name: str
    
    booked_by_user_id: int
    booked_by_name: str
    
    agreement_value: float
    booking_amount: float
    status: str
    payment_reference: Optional[str] = None
    notes: Optional[str] = None
    booking_date: datetime

    class Config:
        from_attributes = True
