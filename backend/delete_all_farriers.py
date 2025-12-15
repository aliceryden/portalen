#!/usr/bin/env python3
"""
Skript för att ta bort alla hovslagare från databasen.
Tar bort i rätt ordning för att respektera foreign key constraints.
"""

import sys
import os

# Lägg till backend-mappen i Python-sökvägen
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.farrier import Farrier
from app.models.booking import Booking
from app.models.review import Review

def delete_all_farriers():
    """Ta bort alla hovslagare och relaterad data"""
    db = SessionLocal()
    
    try:
        # Hämta alla hovslagare
        farriers = db.query(Farrier).all()
        farrier_count = len(farriers)
        
        if farrier_count == 0:
            print("Inga hovslagare hittades i databasen.")
            return
        
        print(f"Hittade {farrier_count} hovslagare att ta bort...")
        
        # 1. Ta bort alla reviews för hovslagare
        reviews = db.query(Review).join(Farrier).all()
        review_count = len(reviews)
        if review_count > 0:
            print(f"Tar bort {review_count} recensioner...")
            for review in reviews:
                db.delete(review)
            db.commit()
        
        # 2. Ta bort alla bokningar för hovslagare
        bookings = db.query(Booking).join(Farrier).all()
        booking_count = len(bookings)
        if booking_count > 0:
            print(f"Tar bort {booking_count} bokningar...")
            for booking in bookings:
                db.delete(booking)
            db.commit()
        
        # 3. Ta bort alla hovslagare (services, schedules, areas tas bort automatiskt via cascade)
        print(f"Tar bort {farrier_count} hovslagare...")
        for farrier in farriers:
            db.delete(farrier)
        db.commit()
        
        # 4. Ta bort alla användare med role="farrier"
        farrier_users = db.query(User).filter(User.role == UserRole.FARRIER.value).all()
        user_count = len(farrier_users)
        if user_count > 0:
            print(f"Tar bort {user_count} användarkonton (hovslagare)...")
            for user in farrier_users:
                db.delete(user)
            db.commit()
        
        print(f"\n✅ Klart! Tog bort:")
        print(f"   - {review_count} recensioner")
        print(f"   - {booking_count} bokningar")
        print(f"   - {farrier_count} hovslagare")
        print(f"   - {user_count} användarkonton")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Fel uppstod: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("⚠️  Tar bort ALLA hovslagare från databasen...")
    delete_all_farriers()

