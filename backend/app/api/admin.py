from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.security import get_admin_user
from app.models.user import User
from app.models.farrier import Farrier
from app.models.booking import Booking, BookingStatus
from app.models.review import Review
from app.models.horse import Horse
from app.schemas.user import UserResponse

router = APIRouter()


@router.get("/stats")
async def get_statistics(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Hämta statistik för admin-dashboard"""
    # Totala antal
    total_users = db.query(func.count(User.id)).scalar()
    total_horse_owners = db.query(func.count(User.id)).filter(User.role == "horse_owner").scalar()
    total_farriers = db.query(func.count(User.id)).filter(User.role == "farrier").scalar()
    total_horses = db.query(func.count(Horse.id)).scalar()
    total_bookings = db.query(func.count(Booking.id)).scalar()
    total_reviews = db.query(func.count(Review.id)).scalar()
    
    # Bokningar per status
    booking_stats = db.query(
        Booking.status,
        func.count(Booking.id)
    ).group_by(Booking.status).all()
    
    bookings_by_status = {status: count for status, count in booking_stats}
    
    # Bokningar senaste 30 dagarna
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_bookings = db.query(func.count(Booking.id)).filter(
        Booking.created_at >= thirty_days_ago
    ).scalar()
    
    # Nya användare senaste 30 dagarna
    new_users = db.query(func.count(User.id)).filter(
        User.created_at >= thirty_days_ago
    ).scalar()
    
    # Genomsnittligt betyg
    avg_rating = db.query(func.avg(Review.rating)).scalar()
    
    # Intäkter (summa av slutförda bokningar)
    total_revenue = db.query(func.sum(Booking.total_price)).filter(
        Booking.status == BookingStatus.COMPLETED.value
    ).scalar() or 0
    
    return {
        "total_users": total_users,
        "total_horse_owners": total_horse_owners,
        "total_farriers": total_farriers,
        "total_horses": total_horses,
        "total_bookings": total_bookings,
        "total_reviews": total_reviews,
        "bookings_by_status": bookings_by_status,
        "recent_bookings": recent_bookings,
        "new_users_last_30_days": new_users,
        "average_rating": round(avg_rating, 2) if avg_rating else 0,
        "total_revenue": total_revenue
    }


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Lista alla användare (admin)"""
    query = db.query(User)
    
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.email.ilike(search_term)) |
            (User.first_name.ilike(search_term)) |
            (User.last_name.ilike(search_term))
        )
    
    users = query.offset(skip).limit(limit).all()
    return users


@router.put("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Aktivera/inaktivera användare"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Användare hittades inte")
    
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Du kan inte inaktivera dig själv")
    
    user.is_active = not user.is_active
    db.commit()
    
    return {"message": f"Användare {'aktiverad' if user.is_active else 'inaktiverad'}"}


@router.put("/users/{user_id}/verify")
async def verify_user(
    user_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Verifiera användare"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Användare hittades inte")
    
    user.is_verified = True
    
    # Om hovslagare, verifiera också profilen
    if user.role == "farrier":
        farrier = db.query(Farrier).filter(Farrier.user_id == user.id).first()
        if farrier:
            farrier.is_verified = True
    
    db.commit()
    
    return {"message": "Användare verifierad"}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Ta bort användare"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Användare hittades inte")
    
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Du kan inte ta bort dig själv")
    
    db.delete(user)
    db.commit()
    
    return {"message": "Användare borttagen"}


@router.get("/bookings")
async def list_all_bookings(
    status_filter: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Lista alla bokningar (admin)"""
    query = db.query(Booking).options(
        joinedload(Booking.horse),
        joinedload(Booking.farrier).joinedload(Farrier.user),
        joinedload(Booking.horse_owner)
    )
    
    if status_filter:
        query = query.filter(Booking.status == status_filter)
    
    bookings = query.order_by(Booking.created_at.desc()).offset(skip).limit(limit).all()
    
    return [{
        "id": b.id,
        "horse_owner": f"{b.horse_owner.first_name} {b.horse_owner.last_name}" if b.horse_owner else None,
        "farrier": f"{b.farrier.user.first_name} {b.farrier.user.last_name}" if b.farrier and b.farrier.user else None,
        "horse": b.horse.name if b.horse else None,
        "service_type": b.service_type,
        "scheduled_date": b.scheduled_date,
        "status": b.status,
        "total_price": b.total_price,
        "created_at": b.created_at
    } for b in bookings]


@router.get("/farriers/pending-verification")
async def list_pending_farriers(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Lista hovslagare som väntar på verifiering"""
    farriers = db.query(Farrier).options(
        joinedload(Farrier.user)
    ).filter(Farrier.is_verified == False).all()
    
    return [{
        "id": f.id,
        "user_id": f.user_id,
        "name": f"{f.user.first_name} {f.user.last_name}" if f.user else None,
        "email": f.user.email if f.user else None,
        "business_name": f.business_name,
        "experience_years": f.experience_years,
        "created_at": f.created_at
    } for f in farriers]

