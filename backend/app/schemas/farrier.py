from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, time


# === Service Schemas ===
class FarrierServiceBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    duration_minutes: int = 60
    is_active: bool = True


class FarrierServiceCreate(FarrierServiceBase):
    pass


class FarrierServiceResponse(FarrierServiceBase):
    id: int
    farrier_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# === Schedule Schemas ===
class FarrierScheduleBase(BaseModel):
    day_of_week: int  # 0=Måndag, 6=Söndag
    start_time: time
    end_time: time
    is_available: bool = True


class FarrierScheduleCreate(FarrierScheduleBase):
    pass


class FarrierScheduleResponse(FarrierScheduleBase):
    id: int
    farrier_id: int

    class Config:
        from_attributes = True


# === Area Schemas ===
class FarrierAreaBase(BaseModel):
    city: str
    postal_code_prefix: Optional[str] = None
    travel_fee: float = 0.0


class FarrierAreaCreate(FarrierAreaBase):
    pass


class FarrierAreaResponse(FarrierAreaBase):
    id: int
    farrier_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# === Farrier Profile Schemas ===
class FarrierBase(BaseModel):
    business_name: Optional[str] = None
    description: Optional[str] = None
    experience_years: int = 0
    certifications: Optional[str] = None
    travel_radius_km: int = 50
    base_latitude: Optional[float] = None
    base_longitude: Optional[float] = None


class FarrierCreate(FarrierBase):
    pass


class FarrierUpdate(BaseModel):
    business_name: Optional[str] = None
    description: Optional[str] = None
    experience_years: Optional[int] = None
    certifications: Optional[str] = None
    travel_radius_km: Optional[int] = None
    base_latitude: Optional[float] = None
    base_longitude: Optional[float] = None
    is_available: Optional[bool] = None


class FarrierResponse(FarrierBase):
    id: int
    user_id: int
    average_rating: float
    total_reviews: int
    is_available: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    
    # Inkludera användarinfo
    user_first_name: Optional[str] = None
    user_last_name: Optional[str] = None
    user_email: Optional[str] = None
    user_phone: Optional[str] = None
    user_profile_image: Optional[str] = None
    user_city: Optional[str] = None
    
    # Relationer
    services: List[FarrierServiceResponse] = []
    schedules: List[FarrierScheduleResponse] = []
    areas: List[FarrierAreaResponse] = []

    class Config:
        from_attributes = True


class FarrierListResponse(BaseModel):
    id: int
    user_id: int
    business_name: Optional[str] = None
    description: Optional[str] = None
    experience_years: int
    average_rating: float
    total_reviews: int
    travel_radius_km: int
    base_latitude: Optional[float] = None
    base_longitude: Optional[float] = None
    is_available: bool
    is_verified: bool
    
    # Användarinfo
    user_first_name: Optional[str] = None
    user_last_name: Optional[str] = None
    user_city: Optional[str] = None
    user_profile_image: Optional[str] = None
    
    # Pris-range
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    
    # Distans (beräknas vid sökning)
    distance_km: Optional[float] = None

    class Config:
        from_attributes = True


class FarrierSearchFilters(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_km: Optional[int] = 50
    city: Optional[str] = None
    date: Optional[datetime] = None
    min_rating: Optional[float] = None
    max_price: Optional[float] = None
    service_type: Optional[str] = None

