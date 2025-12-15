from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime


class ReviewBase(BaseModel):
    rating: int  # 1-5
    quality_rating: Optional[int] = None
    punctuality_rating: Optional[int] = None
    communication_rating: Optional[int] = None
    price_rating: Optional[int] = None
    title: Optional[str] = None
    comment: Optional[str] = None
    
    @validator('rating', 'quality_rating', 'punctuality_rating', 'communication_rating', 'price_rating')
    def validate_rating(cls, v):
        if v is not None and (v < 1 or v > 5):
            raise ValueError('Betyg måste vara mellan 1 och 5')
        return v


class ReviewCreate(ReviewBase):
    booking_id: int


class ReviewUpdate(BaseModel):
    rating: Optional[int] = None
    quality_rating: Optional[int] = None
    punctuality_rating: Optional[int] = None
    communication_rating: Optional[int] = None
    price_rating: Optional[int] = None
    title: Optional[str] = None
    comment: Optional[str] = None


class ReviewResponse(ReviewBase):
    id: int
    booking_id: int
    author_id: int
    farrier_id: int
    is_visible: bool
    is_verified: bool
    farrier_response: Optional[str] = None
    farrier_responded_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Extra info
    author_name: Optional[str] = None
    author_image: Optional[str] = None

    class Config:
        from_attributes = True


class FarrierResponseToReview(BaseModel):
    response: str

