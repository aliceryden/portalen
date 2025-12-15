from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from math import radians, cos, sin, asin, sqrt

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.farrier import Farrier, FarrierService, FarrierSchedule, FarrierArea
from app.schemas.farrier import (
    FarrierCreate, FarrierUpdate, FarrierResponse, FarrierListResponse,
    FarrierServiceCreate, FarrierServiceResponse,
    FarrierScheduleCreate, FarrierScheduleUpdate, FarrierScheduleResponse,
    FarrierAreaCreate, FarrierAreaResponse,
    FarrierSearchFilters
)

router = APIRouter()


def haversine(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    """Beräkna avstånd i km mellan två koordinater"""
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    km = 6371 * c
    return km


def farrier_to_response(farrier: Farrier) -> dict:
    """Konvertera farrier-modell till response med användarinfo"""
    return {
        "id": farrier.id,
        "user_id": farrier.user_id,
        "business_name": farrier.business_name,
        "description": farrier.description,
        "experience_years": farrier.experience_years,
        "certifications": farrier.certifications,
        "travel_radius_km": farrier.travel_radius_km,
        "base_latitude": farrier.base_latitude,
        "base_longitude": farrier.base_longitude,
        "average_rating": farrier.average_rating,
        "total_reviews": farrier.total_reviews,
        "is_available": farrier.is_available,
        "is_verified": farrier.is_verified,
        "created_at": farrier.created_at,
        "updated_at": farrier.updated_at,
        "user_first_name": farrier.user.first_name if farrier.user else None,
        "user_last_name": farrier.user.last_name if farrier.user else None,
        "user_email": farrier.user.email if farrier.user else None,
        "user_phone": farrier.user.phone if farrier.user else None,
        "user_profile_image": farrier.user.profile_image if farrier.user else None,
        "user_city": farrier.user.city if farrier.user else None,
        "services": farrier.services,
        "schedules": farrier.schedules,
        "areas": farrier.areas
    }


@router.get("/", response_model=List[FarrierListResponse])
async def list_farriers(
    latitude: Optional[float] = Query(None, description="Din latitud"),
    longitude: Optional[float] = Query(None, description="Din longitud"),
    radius_km: int = Query(50, description="Sökradie i km"),
    city: Optional[str] = Query(None, description="Stad/kommun"),
    min_rating: Optional[float] = Query(None, description="Lägsta betyg"),
    max_price: Optional[float] = Query(None, description="Max pris"),
    service_type: Optional[str] = Query(None, description="Typ av tjänst"),
    db: Session = Depends(get_db)
):
    """Sök och lista hovslagare med filter"""
    query = db.query(Farrier).options(
        joinedload(Farrier.user),
        joinedload(Farrier.services),
        joinedload(Farrier.areas)
    ).filter(Farrier.is_available == True)
    
    # Filter på stad
    if city:
        query = query.join(User).filter(User.city.ilike(f"%{city}%"))
    
    # Filter på betyg
    if min_rating:
        query = query.filter(Farrier.average_rating >= min_rating)
    
    farriers = query.all()
    results = []
    
    for farrier in farriers:
        # Beräkna distans om koordinater angivna
        distance = None
        if latitude and longitude and farrier.base_latitude and farrier.base_longitude:
            distance = haversine(longitude, latitude, farrier.base_longitude, farrier.base_latitude)
            if distance > radius_km:
                continue
        
        # Filter på pris
        prices = [s.price for s in farrier.services if s.is_active]
        min_price = min(prices) if prices else None
        max_service_price = max(prices) if prices else None
        
        if max_price and min_price and min_price > max_price:
            continue
        
        # Filter på tjänsttyp
        if service_type:
            service_names = [s.name.lower() for s in farrier.services if s.is_active]
            if not any(service_type.lower() in name for name in service_names):
                continue
        
        results.append({
            "id": farrier.id,
            "user_id": farrier.user_id,
            "business_name": farrier.business_name,
            "description": farrier.description,
            "experience_years": farrier.experience_years,
            "average_rating": farrier.average_rating,
            "total_reviews": farrier.total_reviews,
            "travel_radius_km": farrier.travel_radius_km,
            "base_latitude": farrier.base_latitude,
            "base_longitude": farrier.base_longitude,
            "is_available": farrier.is_available,
            "is_verified": farrier.is_verified,
            "user_first_name": farrier.user.first_name if farrier.user else None,
            "user_last_name": farrier.user.last_name if farrier.user else None,
            "user_city": farrier.user.city if farrier.user else None,
            "user_profile_image": farrier.user.profile_image if farrier.user else None,
            "min_price": min_price,
            "max_price": max_service_price,
            "distance_km": round(distance, 1) if distance else None
        })
    
    # Sortera på distans om tillgängligt
    if latitude and longitude:
        results.sort(key=lambda x: x["distance_km"] if x["distance_km"] else float('inf'))
    else:
        results.sort(key=lambda x: x["average_rating"], reverse=True)
    
    return results


@router.get("/{farrier_id}", response_model=FarrierResponse)
async def get_farrier(farrier_id: int, db: Session = Depends(get_db)):
    """Hämta specifik hovslagares profil"""
    farrier = db.query(Farrier).options(
        joinedload(Farrier.user),
        joinedload(Farrier.services),
        joinedload(Farrier.schedules),
        joinedload(Farrier.areas)
    ).filter(Farrier.id == farrier_id).first()
    
    if not farrier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hovslagare hittades inte"
        )
    
    return farrier_to_response(farrier)


@router.put("/profile", response_model=FarrierResponse)
async def update_farrier_profile(
    farrier_data: FarrierUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Uppdatera sin hovslagarprofil"""
    if current_user.role != "farrier":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Endast hovslagare kan uppdatera hovslagarprofil"
        )
    
    farrier = db.query(Farrier).filter(Farrier.user_id == current_user.id).first()
    if not farrier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hovslagarprofil hittades inte"
        )
    
    update_data = farrier_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(farrier, field, value)
    
    db.commit()
    db.refresh(farrier)
    
    return farrier_to_response(farrier)


# === Services ===
@router.post("/services", response_model=FarrierServiceResponse, status_code=status.HTTP_201_CREATED)
async def add_service(
    service_data: FarrierServiceCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Lägg till en tjänst"""
    if current_user.role != "farrier":
        raise HTTPException(status_code=403, detail="Endast hovslagare")
    
    farrier = db.query(Farrier).filter(Farrier.user_id == current_user.id).first()
    if not farrier:
        raise HTTPException(status_code=404, detail="Hovslagarprofil saknas")
    
    service = FarrierService(farrier_id=farrier.id, **service_data.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@router.put("/services/{service_id}", response_model=FarrierServiceResponse)
async def update_service(
    service_id: int,
    service_data: FarrierServiceCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Uppdatera en tjänst"""
    farrier = db.query(Farrier).filter(Farrier.user_id == current_user.id).first()
    service = db.query(FarrierService).filter(
        FarrierService.id == service_id,
        FarrierService.farrier_id == farrier.id
    ).first()
    
    if not service:
        raise HTTPException(status_code=404, detail="Tjänst hittades inte")
    
    for field, value in service_data.model_dump().items():
        setattr(service, field, value)
    
    db.commit()
    db.refresh(service)
    return service


@router.delete("/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(
    service_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Ta bort en tjänst"""
    farrier = db.query(Farrier).filter(Farrier.user_id == current_user.id).first()
    service = db.query(FarrierService).filter(
        FarrierService.id == service_id,
        FarrierService.farrier_id == farrier.id
    ).first()
    
    if not service:
        raise HTTPException(status_code=404, detail="Tjänst hittades inte")
    
    db.delete(service)
    db.commit()


# === Schedule ===
@router.post("/schedules", response_model=FarrierScheduleResponse, status_code=status.HTTP_201_CREATED)
async def add_schedule(
    schedule_data: FarrierScheduleCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Lägg till schema"""
    if current_user.role != "farrier":
        raise HTTPException(status_code=403, detail="Endast hovslagare")
    
    farrier = db.query(Farrier).filter(Farrier.user_id == current_user.id).first()
    schedule = FarrierSchedule(farrier_id=farrier.id, **schedule_data.model_dump())
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.put("/schedules/{schedule_id}", response_model=FarrierScheduleResponse)
async def update_schedule(
    schedule_id: int,
    schedule_data: FarrierScheduleUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Uppdatera schema"""
    if current_user.role != "farrier":
        raise HTTPException(status_code=403, detail="Endast hovslagare")
    
    farrier = db.query(Farrier).filter(Farrier.user_id == current_user.id).first()
    schedule = db.query(FarrierSchedule).filter(
        FarrierSchedule.id == schedule_id,
        FarrierSchedule.farrier_id == farrier.id
    ).first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schema hittades inte")
    
    # Uppdatera endast de fält som skickats med
    update_data = schedule_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(schedule, field, value)
    
    db.commit()
    db.refresh(schedule)
    return schedule


@router.delete("/schedules/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule(
    schedule_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Ta bort schema"""
    farrier = db.query(Farrier).filter(Farrier.user_id == current_user.id).first()
    schedule = db.query(FarrierSchedule).filter(
        FarrierSchedule.id == schedule_id,
        FarrierSchedule.farrier_id == farrier.id
    ).first()
    
    if not schedule:
        raise HTTPException(status_code=404)
    
    db.delete(schedule)
    db.commit()


# === Areas ===
@router.post("/areas", response_model=FarrierAreaResponse, status_code=status.HTTP_201_CREATED)
async def add_area(
    area_data: FarrierAreaCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Lägg till arbetsområde"""
    if current_user.role != "farrier":
        raise HTTPException(status_code=403, detail="Endast hovslagare")
    
    farrier = db.query(Farrier).filter(Farrier.user_id == current_user.id).first()
    area = FarrierArea(farrier_id=farrier.id, **area_data.model_dump())
    db.add(area)
    db.commit()
    db.refresh(area)
    return area


@router.delete("/areas/{area_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_area(
    area_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Ta bort arbetsområde"""
    farrier = db.query(Farrier).filter(Farrier.user_id == current_user.id).first()
    area = db.query(FarrierArea).filter(
        FarrierArea.id == area_id,
        FarrierArea.farrier_id == farrier.id
    ).first()
    
    if not area:
        raise HTTPException(status_code=404)
    
    db.delete(area)
    db.commit()


@router.get("/stats/average-rating")
async def get_average_rating(db: Session = Depends(get_db)):
    """Hämta genomsnittligt betyg för alla hovslagare (publik endpoint)"""
    result = db.query(func.avg(Farrier.average_rating)).filter(
        Farrier.total_reviews > 0
    ).scalar()
    
    avg_rating = round(result, 1) if result else 0.0
    
    return {
        "average_rating": avg_rating
    }

