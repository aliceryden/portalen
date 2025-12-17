#!/usr/bin/env python3
"""
Skapa 10 testbokningar för jacob@hovis.se till imorgon
"""
import sys
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

# Add parent directory to path
sys.path.insert(0, '/app')

from app.core.database import SessionLocal
from app.models.user import User
from app.models.farrier import Farrier
from app.models.horse import Horse
from app.models.booking import Booking, BookingStatus

def create_10_bookings_tomorrow():
    db: Session = SessionLocal()
    
    try:
        # Hitta jacob@hovis.se
        jacob = db.query(User).filter(User.email == 'jacob@hovis.se').first()
        if not jacob:
            print("❌ Hittade inte jacob@hovis.se")
            return
        
        # Hitta hovslagaren
        farrier = db.query(Farrier).filter(Farrier.user_id == jacob.id).first()
        if not farrier:
            print("❌ Hittade inte hovslagare för jacob@hovis.se")
            return
        
        print(f"✅ Hittade hovslagare: {farrier.id} ({jacob.email})")
        
        # Hitta hästar att boka för
        horses = db.query(Horse).limit(10).all()
        if not horses:
            print("❌ Hittade inga hästar i systemet")
            return
        
        print(f"✅ Hittade {len(horses)} hästar")
        
        # Imorgon
        tomorrow = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
        
        # Olika städer för variation
        cities = ["Stockholm", "Vallentuna", "Täby", "Sollentuna", "Upplands Väsby", 
                  "Sigtuna", "Norrtälje", "Österåker", "Nacka", "Huddinge"]
        addresses = [
            "Stallvägen 12",
            "Hästgatan 45",
            "Ridvägen 8",
            "Stallbacken 23",
            "Hästhagen 15",
            "Ridstigen 7",
            "Hovvägen 19",
            "Ridstigsvägen 33",
            "Paddocken 5",
            "Hästängen 11"
        ]
        
        # Tjänsttyper
        service_types = ["Helskoning", "Verkning", "Hovbeslag", "Hovvård", "Akut reparation",
                         "Helskoning", "Verkning", "Hovbeslag", "Hovvård", "Kontroll"]
        
        # Tider för imorgon (08:00 - 17:00)
        times = [
            (8, 0), (9, 0), (10, 0), (11, 0), (12, 30),
            (13, 30), (14, 30), (15, 30), (16, 0), (17, 0)
        ]
        
        bookings_created = 0
        
        for i in range(10):
            hour, minute = times[i]
            booking_datetime = tomorrow.replace(hour=hour, minute=minute)
            
            # Välj häst (återanvänd om det finns färre än 10)
            horse = horses[i % len(horses)]
            
            # Välj stad och adress
            city = cities[i]
            address = addresses[i]
            
            # Välj tjänsttyp
            service_type = service_types[i]
            
            # Status - blanda confirmed och pending
            status = BookingStatus.CONFIRMED if i % 2 == 0 else BookingStatus.PENDING
            
            # Beräkna pris
            base_price = 500 if "Helskoning" in service_type else 300
            travel_fee = 50 if city != "Stockholm" else 0
            total_price = base_price + travel_fee
            
            # Skapa bokning
            booking = Booking(
                horse_owner_id=horse.owner_id,
                farrier_id=farrier.id,
                horse_id=horse.id,
                service_type=service_type,
                scheduled_date=booking_datetime,
                duration_minutes=60 if "Helskoning" in service_type else 45,
                location_address=address,
                location_city=city,
                location_latitude="59.3293",
                location_longitude="18.0686",
                service_price=base_price,
                travel_fee=travel_fee,
                total_price=total_price,
                status=status.value,
                notes_from_owner=f"Bokning för {horse.name}" if i % 3 == 0 else None
            )
            
            db.add(booking)
            bookings_created += 1
            print(f"  📅 {booking_datetime.strftime('%Y-%m-%d %H:%M')} - {service_type} i {city} ({status.value})")
        
        db.commit()
        print(f"\n✅ Skapade {bookings_created} bokningar för jacob@hovis.se till {tomorrow.strftime('%Y-%m-%d')}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Fel: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    create_10_bookings_tomorrow()
