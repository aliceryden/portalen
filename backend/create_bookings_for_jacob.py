#!/usr/bin/env python3
"""
Skapa testbokningar för jacob@hovi.se
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

def create_bookings_for_jacob():
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
            print("❌ Hittade inte hovslagare för jacob@hovi.se")
            return
        
        print(f"✅ Hittade hovslagare: {farrier.id}")
        
        # Hitta några hästar att boka för
        horses = db.query(Horse).limit(10).all()
        if not horses:
            print("❌ Hittade inga hästar i systemet")
            return
        
        print(f"✅ Hittade {len(horses)} hästar")
        
        # Olika städer för variation
        cities = ["Stockholm", "Vallentuna", "Täby", "Sollentuna", "Upplands Väsby", "Sigtuna"]
        addresses = [
            "Stallvägen 12",
            "Hästgatan 45",
            "Ridvägen 8",
            "Stallbacken 23",
            "Hästhagen 15",
            "Ridstigen 7"
        ]
        
        # Tjänsttyper
        service_types = ["Helskoning", "Verkning", "Hovbeslag", "Hovvård", "Akut reparation"]
        
        # Skapa bokningar för kommande veckor
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        bookings_created = 0
        
        # Skapa bokningar för de kommande 3 veckorna
        for week_offset in range(3):
            week_start = today + timedelta(weeks=week_offset)
            
            # Skapa 2-4 bokningar per vecka
            num_bookings = 3 if week_offset == 0 else 2
            
            for i in range(num_bookings):
                # Välj en dag i veckan (måndag-fredag)
                day_offset = (i * 2) % 5  # 0-4 för måndag-fredag
                booking_date = week_start + timedelta(days=day_offset)
                
                # Välj tid (mellan 08:00 och 16:00)
                hour = 8 + (i * 2) % 8
                minute = 0 if i % 2 == 0 else 30
                booking_datetime = booking_date.replace(hour=hour, minute=minute)
                
                # Välj slumpmässig häst
                horse = horses[i % len(horses)]
                
                # Välj stad och adress
                city = cities[i % len(cities)]
                address = addresses[i % len(addresses)]
                
                # Välj tjänsttyp
                service_type = service_types[i % len(service_types)]
                
                # Bestäm status baserat på datum
                if booking_datetime < today:
                    status = BookingStatus.COMPLETED
                elif booking_datetime < today + timedelta(days=2):
                    status = BookingStatus.CONFIRMED
                else:
                    status = BookingStatus.PENDING if i % 2 == 0 else BookingStatus.CONFIRMED
                
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
        
        db.commit()
        print(f"✅ Skapade {bookings_created} bokningar för jacob@hovis.se")
        print(f"   - Bokningar spridda över 3 veckor")
        print(f"   - Olika städer: {', '.join(set(cities[:bookings_created]))}")
        print(f"   - Olika statusar: Pending, Confirmed, Completed")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Fel: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    create_bookings_for_jacob()

