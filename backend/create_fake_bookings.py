"""
Script för att skapa fiktiva bokningar för hovslagare
"""
import sys
from datetime import datetime, timedelta
from random import choice, randint, uniform
import random

# Lägg till backend-mappen i path
sys.path.insert(0, '/Users/aliceryden/dev/portalen/backend')

from app.core.database import SessionLocal
from app.models.booking import Booking, BookingStatus
from app.models.farrier import Farrier
from app.models.horse import Horse
from app.models.user import User

# Fiktiva tjänsttyper
SERVICE_TYPES = [
    "Verkning",
    "Skoning",
    "Akut hovvård",
    "Hovbeslag",
    "Hovvård och trimning"
]

# Fiktiva meddelanden från ägare
OWNER_NOTES = [
    "Hästen är lugn och lättarbetad.",
    "Vänligen ring när ni är på väg.",
    "Hästen kan vara lite nervös första gången.",
    "Inga särskilda önskemål.",
    "Hästen behöver extra omsorg med framhovarna.",
    None,  # Vissa bokningar har inga meddelanden
    None,
]

# Fiktiva meddelanden från hovslagare
FARRIER_NOTES = [
    "Bekräftad, ser fram emot att träffa er!",
    "Kommer att ringa dagen innan för bekräftelse.",
    None,
    None,
    None,
]

def create_fake_bookings():
    """Skapa fiktiva bokningar"""
    db = SessionLocal()
    
    try:
        # Hämta alla hovslagare
        farriers = db.query(Farrier).filter(Farrier.is_available == True).all()
        if not farriers:
            print("Inga hovslagare hittades i databasen!")
            return
        
        # Hämta alla hästägare med hästar
        horse_owners = db.query(User).filter(User.role == "horse_owner").all()
        if not horse_owners:
            print("Inga hästägare hittades i databasen!")
            return
        
        # Hämta alla hästar
        horses = db.query(Horse).all()
        if not horses:
            print("Inga hästar hittades i databasen!")
            return
        
        print(f"Hittade {len(farriers)} hovslagare, {len(horse_owners)} hästägare och {len(horses)} hästar")
        
        # Skapa bokningar
        bookings_created = 0
        statuses = [
            BookingStatus.PENDING,
            BookingStatus.CONFIRMED,
            BookingStatus.IN_PROGRESS,
            BookingStatus.COMPLETED,
            BookingStatus.COMPLETED,  # Fler completed för att ha historik
            BookingStatus.COMPLETED,
            BookingStatus.CANCELLED,
        ]
        
        # Skapa bokningar för varje hovslagare
        for farrier in farriers:
            # Varje hovslagare får 3-8 bokningar
            num_bookings = randint(3, 8)
            
            for i in range(num_bookings):
                # Välj slumpmässig hästägare och häst
                owner = choice(horse_owners)
                owner_horses = [h for h in horses if h.owner_id == owner.id]
                
                if not owner_horses:
                    continue
                
                horse = choice(owner_horses)
                status = choice(statuses)
                
                # Skapa datum - några i framtiden, några i det förflutna
                if status in [BookingStatus.COMPLETED, BookingStatus.CANCELLED]:
                    # Slutförda/avbokade bokningar är i det förflutna
                    days_ago = randint(1, 90)
                    scheduled_date = datetime.now() - timedelta(days=days_ago)
                elif status == BookingStatus.IN_PROGRESS:
                    # Pågående bokningar är idag eller imorgon
                    scheduled_date = datetime.now() + timedelta(days=randint(0, 1))
                elif status == BookingStatus.CONFIRMED:
                    # Bekräftade bokningar är i nära framtiden
                    scheduled_date = datetime.now() + timedelta(days=randint(2, 14))
                else:  # PENDING
                    # Väntande bokningar kan vara både i framtiden och nära framtiden
                    scheduled_date = datetime.now() + timedelta(days=randint(1, 30))
                
                # Sätt completed_at för slutförda bokningar
                completed_at = None
                if status == BookingStatus.COMPLETED:
                    completed_at = scheduled_date + timedelta(hours=randint(1, 3))
                
                # Priser
                service_price = round(uniform(400, 1200), 2)
                travel_fee = round(uniform(0, 300), 2) if randint(0, 1) else 0
                total_price = service_price + travel_fee
                
                # Använd hästens stallplats om tillgänglig
                location_city = horse.stable_city
                location_address = horse.stable_address
                location_latitude = horse.stable_latitude
                location_longitude = horse.stable_longitude
                
                # Skapa bokning
                booking = Booking(
                    horse_owner_id=owner.id,
                    farrier_id=farrier.id,
                    horse_id=horse.id,
                    service_type=choice(SERVICE_TYPES),
                    scheduled_date=scheduled_date,
                    duration_minutes=choice([60, 90, 120]),
                    location_address=location_address,
                    location_city=location_city,
                    location_latitude=location_latitude,
                    location_longitude=location_longitude,
                    service_price=service_price,
                    travel_fee=travel_fee,
                    total_price=total_price,
                    status=status.value,
                    notes_from_owner=choice(OWNER_NOTES),
                    notes_from_farrier=choice(FARRIER_NOTES) if status in [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] else None,
                    completed_at=completed_at,
                    created_at=scheduled_date - timedelta(days=randint(1, 14)),  # Bokningen skapades tidigare
                )
                
                db.add(booking)
                bookings_created += 1
        
        db.commit()
        print(f"✅ Skapade {bookings_created} fiktiva bokningar!")
        
        # Visa statistik
        pending = db.query(Booking).filter(Booking.status == BookingStatus.PENDING.value).count()
        confirmed = db.query(Booking).filter(Booking.status == BookingStatus.CONFIRMED.value).count()
        in_progress = db.query(Booking).filter(Booking.status == BookingStatus.IN_PROGRESS.value).count()
        completed = db.query(Booking).filter(Booking.status == BookingStatus.COMPLETED.value).count()
        cancelled = db.query(Booking).filter(Booking.status == BookingStatus.CANCELLED.value).count()
        
        print(f"\n📊 Statistik:")
        print(f"  - Väntande: {pending}")
        print(f"  - Bekräftade: {confirmed}")
        print(f"  - Pågående: {in_progress}")
        print(f"  - Slutförda: {completed}")
        print(f"  - Avbokade: {cancelled}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Fel vid skapande av bokningar: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    create_fake_bookings()

