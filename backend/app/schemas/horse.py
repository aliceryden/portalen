from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date


class HorseBase(BaseModel):
    name: str
    breed: Optional[str] = None
    birth_date: Optional[date] = None
    gender: Optional[str] = None
    height_cm: Optional[int] = None  # Mankhöjd i cm
    passport_number: Optional[str] = None  # Valfritt
    chip_number: Optional[str] = None  # Valfritt
    shoe_size: Optional[str] = None
    special_needs: Optional[str] = None
    stable_name: Optional[str] = None
    stable_address: Optional[str] = None
    stable_city: Optional[str] = None
    stable_latitude: Optional[str] = None
    stable_longitude: Optional[str] = None
    image_url: Optional[str] = None


class HorseCreate(HorseBase):
    pass


class HorseUpdate(BaseModel):
    name: Optional[str] = None
    breed: Optional[str] = None
    birth_date: Optional[date] = None
    gender: Optional[str] = None
    height_cm: Optional[int] = None  # Mankhöjd i cm
    passport_number: Optional[str] = None
    chip_number: Optional[str] = None
    shoe_size: Optional[str] = None
    special_needs: Optional[str] = None
    last_farrier_visit: Optional[date] = None
    stable_name: Optional[str] = None
    stable_address: Optional[str] = None
    stable_city: Optional[str] = None
    stable_latitude: Optional[str] = None
    stable_longitude: Optional[str] = None
    image_url: Optional[str] = None


class HorseResponse(HorseBase):
    id: int
    owner_id: int
    last_farrier_visit: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

