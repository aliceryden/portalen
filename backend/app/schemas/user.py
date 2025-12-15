from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None


class UserCreate(UserBase):
    password: str
    role: str = "horse_owner"  # horse_owner, farrier


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    profile_image: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    role: str
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    is_active: bool
    is_verified: bool
    profile_image: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserWithStats(UserResponse):
    total_horses: int = 0
    total_bookings: int = 0

