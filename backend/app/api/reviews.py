from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.review import Review
from app.models.booking import Booking, BookingStatus
from app.models.farrier import Farrier
from app.schemas.review import ReviewCreate, ReviewUpdate, ReviewResponse, FarrierResponseToReview
from datetime import datetime

router = APIRouter()


def review_to_response(review: Review) -> dict:
    """Konvertera review till response"""
    return {
        "id": review.id,
        "booking_id": review.booking_id,
        "author_id": review.author_id,
        "farrier_id": review.farrier_id,
        "rating": review.rating,
        "quality_rating": review.quality_rating,
        "punctuality_rating": review.punctuality_rating,
        "communication_rating": review.communication_rating,
        "price_rating": review.price_rating,
        "title": review.title,
        "comment": review.comment,
        "is_visible": review.is_visible,
        "is_verified": review.is_verified,
        "farrier_response": review.farrier_response,
        "farrier_responded_at": review.farrier_responded_at,
        "created_at": review.created_at,
        "updated_at": review.updated_at,
        "author_name": f"{review.author.first_name} {review.author.last_name}" if review.author else None,
        "author_image": review.author.profile_image if review.author else None
    }


def update_farrier_rating(farrier_id: int, db: Session):
    """Uppdatera hovslagarens genomsnittsbetyg"""
    result = db.query(
        func.avg(Review.rating),
        func.count(Review.id)
    ).filter(
        Review.farrier_id == farrier_id,
        Review.is_visible == True
    ).first()
    
    avg_rating, total_reviews = result
    
    farrier = db.query(Farrier).filter(Farrier.id == farrier_id).first()
    if farrier:
        farrier.average_rating = round(avg_rating, 2) if avg_rating else 0
        farrier.total_reviews = total_reviews or 0
        db.commit()


@router.get("/farrier/{farrier_id}", response_model=List[ReviewResponse])
async def list_farrier_reviews(
    farrier_id: int,
    db: Session = Depends(get_db)
):
    """Lista omdömen för en hovslagare"""
    reviews = db.query(Review).options(
        joinedload(Review.author)
    ).filter(
        Review.farrier_id == farrier_id,
        Review.is_visible == True
    ).order_by(Review.created_at.desc()).all()
    
    return [review_to_response(r) for r in reviews]


@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Skapa omdöme för en slutförd bokning"""
    # Hämta bokningen
    booking = db.query(Booking).filter(
        Booking.id == review_data.booking_id,
        Booking.horse_owner_id == current_user.id
    ).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bokning hittades inte"
        )
    
    if booking.status != BookingStatus.COMPLETED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Du kan endast lämna omdöme för slutförda bokningar"
        )
    
    # Kolla om omdöme redan finns
    existing_review = db.query(Review).filter(Review.booking_id == booking.id).first()
    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Du har redan lämnat ett omdöme för denna bokning"
        )
    
    review = Review(
        author_id=current_user.id,
        farrier_id=booking.farrier_id,
        **review_data.model_dump()
    )
    
    db.add(review)
    db.commit()
    db.refresh(review)
    
    # Uppdatera hovslagarens betyg
    update_farrier_rating(booking.farrier_id, db)
    
    review = db.query(Review).options(
        joinedload(Review.author)
    ).filter(Review.id == review.id).first()
    
    return review_to_response(review)


@router.put("/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: int,
    review_data: ReviewUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Uppdatera eget omdöme"""
    review = db.query(Review).filter(
        Review.id == review_id,
        Review.author_id == current_user.id
    ).first()
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Omdöme hittades inte"
        )
    
    update_data = review_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(review, field, value)
    
    db.commit()
    db.refresh(review)
    
    # Uppdatera hovslagarens betyg
    update_farrier_rating(review.farrier_id, db)
    
    review = db.query(Review).options(
        joinedload(Review.author)
    ).filter(Review.id == review.id).first()
    
    return review_to_response(review)


@router.post("/{review_id}/respond", response_model=ReviewResponse)
async def respond_to_review(
    review_id: int,
    response_data: FarrierResponseToReview,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Hovslagare svarar på ett omdöme"""
    farrier = db.query(Farrier).filter(Farrier.user_id == current_user.id).first()
    
    if not farrier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Endast hovslagare kan svara på omdömen"
        )
    
    review = db.query(Review).filter(
        Review.id == review_id,
        Review.farrier_id == farrier.id
    ).first()
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Omdöme hittades inte"
        )
    
    review.farrier_response = response_data.response
    review.farrier_responded_at = datetime.utcnow()
    
    db.commit()
    
    review = db.query(Review).options(
        joinedload(Review.author)
    ).filter(Review.id == review.id).first()
    
    return review_to_response(review)


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Ta bort eget omdöme"""
    review = db.query(Review).filter(
        Review.id == review_id,
        Review.author_id == current_user.id
    ).first()
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Omdöme hittades inte"
        )
    
    farrier_id = review.farrier_id
    db.delete(review)
    db.commit()
    
    # Uppdatera hovslagarens betyg
    update_farrier_rating(farrier_id, db)

