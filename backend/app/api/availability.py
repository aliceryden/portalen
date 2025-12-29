from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime, date, timedelta

from app.core.database import get_db
from app.models.booking import Booking
from app.models.farrier import Farrier, FarrierSchedule
from app.models.user import User

router = APIRouter()

# Stockholmsområdets kommuner med närliggande
AREA_CONNECTIONS = {
    "Åkersberga": ["Täby", "Vaxholm", "Österåker", "Norrtälje"],
    "Täby": ["Åkersberga", "Danderyd", "Vallentuna", "Sollentuna"],
    "Danderyd": ["Täby", "Stockholm", "Solna", "Lidingö"],
    "Solna": ["Stockholm", "Danderyd", "Sundbyberg", "Sollentuna"],
    "Lidingö": ["Stockholm", "Danderyd", "Nacka"],
    "Nacka": ["Stockholm", "Lidingö", "Värmdö", "Tyresö"],
    "Värmdö": ["Nacka", "Gustavsberg"],
    "Huddinge": ["Stockholm", "Botkyrka", "Haninge", "Tyresö"],
    "Botkyrka": ["Huddinge", "Salem", "Södertälje"],
    "Södertälje": ["Botkyrka", "Salem", "Nykvarn"],
    "Vallentuna": ["Täby", "Upplands Väsby", "Österåker", "Sigtuna"],
    "Upplands Väsby": ["Vallentuna", "Sigtuna", "Sollentuna"],
    "Sigtuna": ["Upplands Väsby", "Märsta", "Knivsta"],
    "Norrtälje": ["Åkersberga", "Rimbo", "Österåker"],
    "Stockholm": ["Solna", "Danderyd", "Lidingö", "Nacka", "Huddinge"],
    "Uppsala": ["Knivsta", "Sigtuna", "Enköping"],
}

# Koordinater för områden
AREA_COORDINATES = {
    "Åkersberga": {"lat": 59.4786, "lng": 18.3002},
    "Täby": {"lat": 59.4439, "lng": 18.0687},
    "Danderyd": {"lat": 59.3994, "lng": 18.0270},
    "Solna": {"lat": 59.3600, "lng": 18.0000},
    "Lidingö": {"lat": 59.3667, "lng": 18.1333},
    "Nacka": {"lat": 59.3108, "lng": 18.1636},
    "Värmdö": {"lat": 59.3167, "lng": 18.3833},
    "Huddinge": {"lat": 59.2333, "lng": 17.9833},
    "Botkyrka": {"lat": 59.2000, "lng": 17.8333},
    "Södertälje": {"lat": 59.1958, "lng": 17.6281},
    "Vallentuna": {"lat": 59.5333, "lng": 18.0833},
    "Upplands Väsby": {"lat": 59.5167, "lng": 17.9167},
    "Sigtuna": {"lat": 59.6167, "lng": 17.7167},
    "Norrtälje": {"lat": 59.7583, "lng": 18.7000},
    "Stockholm": {"lat": 59.3293, "lng": 18.0686},
    "Uppsala": {"lat": 59.8586, "lng": 17.6389},
}


def get_nearby_areas(area: str) -> List[str]:
    """Hämta närliggande områden för ett givet område"""
    nearby = AREA_CONNECTIONS.get(area, [])
    return [area] + nearby


def get_available_times(schedule_start, schedule_end, booked_times: List[dict], duration: int = 60) -> List[str]:
    """Beräkna lediga tider baserat på schema och bokningar"""
    available = []
    
    # Hantera både string och time-objekt
    if hasattr(schedule_start, 'hour'):
        start_hour = schedule_start.hour
    else:
        start_hour = int(str(schedule_start).split(':')[0])
    
    if hasattr(schedule_end, 'hour'):
        end_hour = schedule_end.hour
    else:
        end_hour = int(str(schedule_end).split(':')[0])
    
    # Skapa lista med alla möjliga tider (varje timme)
    current_hour = start_hour
    while current_hour < end_hour:
        time_str = f"{current_hour:02d}:00"
        
        # Kolla om tiden är bokad
        is_booked = False
        for booking in booked_times:
            booking_hour = int(booking["time"].split(':')[0])
            booking_duration = booking.get("duration", 60)
            # Om bokningen överlappar denna tid
            if booking_hour <= current_hour < booking_hour + (booking_duration // 60):
                is_booked = True
                break
        
        if not is_booked:
            available.append(time_str)
        
        current_hour += 1
    
    return available


@router.get("/farrier-locations")
async def get_farrier_daily_locations(
    date_str: Optional[str] = Query(None, description="Datum (YYYY-MM-DD), default idag"),
    db: Session = Depends(get_db)
):
    """
    Hämta var hovslagare befinner sig en viss dag baserat på deras bokningar.
    Returnerar områden där de är "låsta" pga bokningar + närliggande områden.
    """
    if date_str:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    else:
        target_date = date.today()
    
    # Vilken veckodag (0 = måndag)
    day_of_week = target_date.weekday()
    
    # Hämta alla bokningar för datumet (inkl pending så tider låses direkt)
    start_of_day = datetime.combine(target_date, datetime.min.time())
    end_of_day = datetime.combine(target_date, datetime.max.time())
    
    bookings = db.query(Booking).options(
        joinedload(Booking.farrier).joinedload(Farrier.user)
    ).filter(
        Booking.scheduled_date >= start_of_day,
        Booking.scheduled_date <= end_of_day,
        Booking.status.in_(["pending", "confirmed", "in_progress"])
    ).all()
    
    # Gruppera per hovslagare
    farrier_locations = {}
    
    for booking in bookings:
        farrier_id = booking.farrier_id
        if farrier_id not in farrier_locations:
            farrier = booking.farrier
            
            # Hämta hovslagarens schema för denna veckodag
            schedule = db.query(FarrierSchedule).filter(
                FarrierSchedule.farrier_id == farrier_id,
                FarrierSchedule.day_of_week == day_of_week,
                FarrierSchedule.is_available == True
            ).first()
            
            farrier_locations[farrier_id] = {
                "farrier_id": farrier_id,
                "farrier_name": f"{farrier.user.first_name} {farrier.user.last_name}",
                "business_name": farrier.business_name,
                "phone": farrier.user.phone,
                "profile_image": farrier.user.profile_image,
                "booked_areas": set(),
                "available_areas": set(),
                "bookings": [],
                "primary_location": None,
                "primary_coordinates": None,
                "schedule_start": schedule.start_time if schedule else "08:00",
                "schedule_end": schedule.end_time if schedule else "17:00",
                "available_times": [],
            }
        
        area = booking.location_city
        if area:
            farrier_locations[farrier_id]["booked_areas"].add(area)
            # Lägg till närliggande områden som tillgängliga
            for nearby in get_nearby_areas(area):
                farrier_locations[farrier_id]["available_areas"].add(nearby)
        
        farrier_locations[farrier_id]["bookings"].append({
            "id": booking.id,
            "time": booking.scheduled_date.strftime("%H:%M"),
            "duration": booking.duration_minutes,
            "service": booking.service_type,
            "location": area,
            "latitude": booking.location_latitude,
            "longitude": booking.location_longitude,
        })
    
    # Konvertera till lista och beräkna primär plats + lediga tider
    result = []
    for farrier_id, data in farrier_locations.items():
        # Hitta den mest frekventa platsen (primär)
        booked_list = list(data["booked_areas"])
        if booked_list:
            primary = booked_list[0]  # Första bokade området
            data["primary_location"] = primary
            if primary in AREA_COORDINATES:
                data["primary_coordinates"] = AREA_COORDINATES[primary]
        
        # Beräkna lediga tider
        data["available_times"] = get_available_times(
            data["schedule_start"],
            data["schedule_end"],
            data["bookings"]
        )
        
        # Ta bort interna fält som inte ska skickas
        del data["schedule_start"]
        del data["schedule_end"]
        
        data["booked_areas"] = list(data["booked_areas"])
        data["available_areas"] = list(data["available_areas"])
        result.append(data)
    
    return {
        "date": target_date.isoformat(),
        "farriers": result,
        "area_coordinates": AREA_COORDINATES
    }


@router.get("/available-farriers")
async def get_available_farriers_in_area(
    area: str = Query(..., description="Område att söka i"),
    date_str: Optional[str] = Query(None, description="Datum (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Hitta hovslagare som är tillgängliga i ett specifikt område en viss dag.
    En hovslagare är "tillgänglig" om de har bokningar i området eller närliggande.
    """
    if date_str:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    else:
        target_date = date.today()
    
    # Hämta daglig översikt
    start_of_day = datetime.combine(target_date, datetime.min.time())
    end_of_day = datetime.combine(target_date, datetime.max.time())
    
    # Områden som räknas som "nära"
    search_areas = get_nearby_areas(area)
    
    # Hitta hovslagare med bokningar i dessa områden
    bookings = db.query(Booking).options(
        joinedload(Booking.farrier).joinedload(Farrier.user),
        joinedload(Booking.farrier).joinedload(Farrier.services)
    ).filter(
        Booking.scheduled_date >= start_of_day,
        Booking.scheduled_date <= end_of_day,
        Booking.status.in_(["pending", "confirmed", "in_progress"]),
        Booking.location_city.in_(search_areas)
    ).all()
    
    # Unika hovslagare
    farriers_in_area = {}
    for booking in bookings:
        fid = booking.farrier_id
        if fid not in farriers_in_area:
            f = booking.farrier
            farriers_in_area[fid] = {
                "id": f.id,
                "user_id": f.user_id,
                "name": f"{f.user.first_name} {f.user.last_name}",
                "business_name": f.business_name,
                "phone": f.user.phone,
                "average_rating": f.average_rating,
                "total_reviews": f.total_reviews,
                "booked_in": booking.location_city,
                "available_for_area": area,
                "reason": f"Har bokning i {booking.location_city} denna dag",
                "services": [{"name": s.name, "price": s.price} for s in f.services if s.is_active],
            }
    
    return {
        "area": area,
        "date": target_date.isoformat(),
        "nearby_areas": search_areas,
        "farriers": list(farriers_in_area.values())
    }


@router.get("/weekly-schedule/{farrier_id}")
async def get_farrier_weekly_schedule(
    farrier_id: int,
    db: Session = Depends(get_db)
):
    """Hämta hovslagarens veckoschema med bokade områden"""
    today = date.today()
    week_start = today
    week_end = today + timedelta(days=7)
    
    bookings = db.query(Booking).filter(
        Booking.farrier_id == farrier_id,
        Booking.scheduled_date >= datetime.combine(week_start, datetime.min.time()),
        Booking.scheduled_date <= datetime.combine(week_end, datetime.max.time()),
        Booking.status.in_(["confirmed", "in_progress", "pending"])
    ).order_by(Booking.scheduled_date).all()
    
    # Gruppera per dag
    daily_schedule = {}
    for i in range(7):
        day = today + timedelta(days=i)
        daily_schedule[day.isoformat()] = {
            "date": day.isoformat(),
            "weekday": ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"][day.weekday()],
            "areas": set(),
            "available_nearby": set(),
            "bookings_count": 0,
        }
    
    for booking in bookings:
        day_key = booking.scheduled_date.date().isoformat()
        if day_key in daily_schedule:
            area = booking.location_city
            if area:
                daily_schedule[day_key]["areas"].add(area)
                for nearby in get_nearby_areas(area):
                    daily_schedule[day_key]["available_nearby"].add(nearby)
            daily_schedule[day_key]["bookings_count"] += 1
    
    # Konvertera sets till listor
    for day in daily_schedule.values():
        day["areas"] = list(day["areas"])
        day["available_nearby"] = list(day["available_nearby"])
    
    return {
        "farrier_id": farrier_id,
        "schedule": list(daily_schedule.values())
    }

