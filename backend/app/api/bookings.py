from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.booking import Booking, BookingStatus
from app.models.farrier import Farrier
from app.models.horse import Horse
from app.schemas.booking import BookingCreate, BookingUpdate, BookingResponse, BookingStatusUpdate

router = APIRouter()


def booking_to_response(booking: Booking) -> dict:
    """Konvertera booking till response med extra info"""
    return {
        "id": booking.id,
        "horse_owner_id": booking.horse_owner_id,
        "farrier_id": booking.farrier_id,
        "horse_id": booking.horse_id,
        "service_type": booking.service_type,
        "scheduled_date": booking.scheduled_date,
        "duration_minutes": booking.duration_minutes,
        "location_address": booking.location_address,
        "location_city": booking.location_city,
        "location_latitude": booking.location_latitude,
        "location_longitude": booking.location_longitude,
        "service_price": booking.service_price,
        "travel_fee": booking.travel_fee,
        "total_price": booking.total_price,
        "status": booking.status,
        "notes_from_owner": booking.notes_from_owner,
        "notes_from_farrier": booking.notes_from_farrier,
        "cancelled_by": booking.cancelled_by,
        "cancellation_reason": booking.cancellation_reason,
        "cancelled_at": booking.cancelled_at,
        "created_at": booking.created_at,
        "updated_at": booking.updated_at,
        "completed_at": booking.completed_at,
        "horse_name": booking.horse.name if booking.horse else None,
        "farrier_name": f"{booking.farrier.user.first_name} {booking.farrier.user.last_name}" if booking.farrier and booking.farrier.user else None,
        "owner_name": f"{booking.horse_owner.first_name} {booking.horse_owner.last_name}" if booking.horse_owner else None,
        "has_review": booking.review is not None
    }


@router.get("/", response_model=List[BookingResponse])
async def list_bookings(
    status_filter: Optional[str] = Query(None, description="Filtrera på status"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Lista bokningar (egna som ägare eller hovslagare)"""
    query = db.query(Booking).options(
        joinedload(Booking.horse),
        joinedload(Booking.farrier).joinedload(Farrier.user),
        joinedload(Booking.horse_owner),
        joinedload(Booking.review)
    )
    
    if current_user.role == "farrier":
        farrier = db.query(Farrier).filter(Farrier.user_id == current_user.id).first()
        if farrier:
            query = query.filter(Booking.farrier_id == farrier.id)
    else:
        query = query.filter(Booking.horse_owner_id == current_user.id)
    
    if status_filter:
        query = query.filter(Booking.status == status_filter)
    
    bookings = query.order_by(Booking.scheduled_date.desc()).all()
    return [booking_to_response(b) for b in bookings]


@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking_data: BookingCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Skapa en ny bokning"""
    # Verifiera att hästen tillhör användaren
    horse = db.query(Horse).filter(
        Horse.id == booking_data.horse_id,
        Horse.owner_id == current_user.id
    ).first()
    
    if not horse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Häst hittades inte eller tillhör inte dig"
        )
    
    # Verifiera att hovslagaren finns och är tillgänglig
    farrier = db.query(Farrier).filter(
        Farrier.id == booking_data.farrier_id,
        Farrier.is_available == True
    ).first()
    
    if not farrier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hovslagare hittades inte eller är ej tillgänglig"
        )
    
    # Beräkna totalpris
    total_price = booking_data.service_price + booking_data.travel_fee
    
    # Skapa bokning
    booking = Booking(
        horse_owner_id=current_user.id,
        total_price=total_price,
        **booking_data.model_dump()
    )
    
    db.add(booking)
    db.commit()
    db.refresh(booking)
    
    # Ladda relationer för response
    booking = db.query(Booking).options(
        joinedload(Booking.horse),
        joinedload(Booking.farrier).joinedload(Farrier.user),
        joinedload(Booking.horse_owner),
        joinedload(Booking.review)
    ).filter(Booking.id == booking.id).first()
    
    return booking_to_response(booking)


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Hämta en specifik bokning"""
    booking = db.query(Booking).options(
        joinedload(Booking.horse),
        joinedload(Booking.farrier).joinedload(Farrier.user),
        joinedload(Booking.horse_owner),
        joinedload(Booking.review)
    ).filter(Booking.id == booking_id).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bokning hittades inte"
        )
    
    # Kontrollera behörighet
    farrier = db.query(Farrier).filter(Farrier.user_id == current_user.id).first()
    is_owner = booking.horse_owner_id == current_user.id
    is_farrier = farrier and booking.farrier_id == farrier.id
    is_admin = current_user.role == "admin"
    
    if not (is_owner or is_farrier or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Du har inte behörighet att se denna bokning"
        )
    
    return booking_to_response(booking)


@router.put("/{booking_id}/status", response_model=BookingResponse)
async def update_booking_status(
    booking_id: int,
    status_update: BookingStatusUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Uppdatera bokningsstatus (för hovslagare)"""
    farrier = db.query(Farrier).filter(Farrier.user_id == current_user.id).first()
    
    if not farrier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Endast hovslagare kan uppdatera bokningsstatus"
        )
    
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.farrier_id == farrier.id
    ).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bokning hittades inte"
        )
    
    booking.status = status_update.status
    if status_update.notes_from_farrier:
        booking.notes_from_farrier = status_update.notes_from_farrier
    
    if status_update.status == BookingStatus.COMPLETED.value:
        booking.completed_at = datetime.utcnow()
        # Uppdatera hästens senaste hovbesök
        if booking.horse:
            booking.horse.last_farrier_visit = datetime.utcnow().date()
    
    db.commit()
    
    booking = db.query(Booking).options(
        joinedload(Booking.horse),
        joinedload(Booking.farrier).joinedload(Farrier.user),
        joinedload(Booking.horse_owner),
        joinedload(Booking.review)
    ).filter(Booking.id == booking.id).first()
    
    return booking_to_response(booking)


@router.put("/{booking_id}/cancel", response_model=BookingResponse)
async def cancel_booking(
    booking_id: int,
    cancellation_reason: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Avboka en bokning"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bokning hittades inte"
        )
    
    # Kontrollera behörighet
    farrier = db.query(Farrier).filter(Farrier.user_id == current_user.id).first()
    is_owner = booking.horse_owner_id == current_user.id
    is_farrier = farrier and booking.farrier_id == farrier.id
    
    if not (is_owner or is_farrier):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Du har inte behörighet att avboka"
        )
    
    if booking.status in [BookingStatus.COMPLETED.value, BookingStatus.CANCELLED.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bokningen kan inte avbokas"
        )
    
    booking.status = BookingStatus.CANCELLED.value
    booking.cancelled_by = "farrier" if is_farrier else "owner"
    booking.cancellation_reason = cancellation_reason
    booking.cancelled_at = datetime.utcnow()
    
    db.commit()
    
    booking = db.query(Booking).options(
        joinedload(Booking.horse),
        joinedload(Booking.farrier).joinedload(Farrier.user),
        joinedload(Booking.horse_owner),
        joinedload(Booking.review)
    ).filter(Booking.id == booking.id).first()
    
    return booking_to_response(booking)

