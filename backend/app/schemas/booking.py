from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BookingBase(BaseModel):
    farrier_id: int
    horse_id: int
    service_type: str
    scheduled_date: datetime
    duration_minutes: int = 60
    location_address: Optional[str] = None
    location_city: Optional[str] = None
    location_latitude: Optional[str] = None
    location_longitude: Optional[str] = None
    service_price: float
    travel_fee: float = 0.0
    notes_from_owner: Optional[str] = None


class BookingCreate(BookingBase):
    pass


class BookingUpdate(BaseModel):
    scheduled_date: Optional[datetime] = None
    status: Optional[str] = None
    notes_from_owner: Optional[str] = None
    notes_from_farrier: Optional[str] = None
    cancellation_reason: Optional[str] = None


class BookingResponse(BaseModel):
    id: int
    horse_owner_id: int
    farrier_id: int
    horse_id: int
    service_type: str
    scheduled_date: datetime
    duration_minutes: int
    location_address: Optional[str] = None
    location_city: Optional[str] = None
    location_latitude: Optional[str] = None
    location_longitude: Optional[str] = None
    service_price: float
    travel_fee: float
    total_price: float
    status: str
    notes_from_owner: Optional[str] = None
    notes_from_farrier: Optional[str] = None
    cancelled_by: Optional[str] = None
    cancellation_reason: Optional[str] = None
    cancelled_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    
    # Extra info
    horse_name: Optional[str] = None
    farrier_name: Optional[str] = None
    owner_name: Optional[str] = None
    has_review: bool = False

    class Config:
        from_attributes = True


class BookingStatusUpdate(BaseModel):
    status: str
    notes_from_farrier: Optional[str] = None

