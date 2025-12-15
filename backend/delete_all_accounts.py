"""
Script för att ta bort alla användarkonton och relaterad data
"""
import sys

# Lägg till backend-mappen i path
sys.path.insert(0, '/Users/aliceryden/dev/portalen/backend')

from app.core.database import SessionLocal
from app.models.booking import Booking
from app.models.review import Review
from app.models.horse import Horse
from app.models.farrier import Farrier, FarrierService, FarrierSchedule, FarrierArea
from app.models.user import User

def delete_all_accounts():
    """Ta bort alla användarkonton och relaterad data"""
    db = SessionLocal()
    
    try:
        # Räkna innan borttagning
        users_count = db.query(User).count()
        bookings_count = db.query(Booking).count()
        reviews_count = db.query(Review).count()
        horses_count = db.query(Horse).count()
        farriers_count = db.query(Farrier).count()
        
        print(f"📊 Innan borttagning:")
        print(f"  - Användare: {users_count}")
        print(f"  - Bokningar: {bookings_count}")
        print(f"  - Recensioner: {reviews_count}")
        print(f"  - Hästar: {horses_count}")
        print(f"  - Hovslagare: {farriers_count}")
        print()
        
        # Ta bort i rätt ordning (på grund av foreign key constraints)
        
        # 1. Ta bort recensioner (beroende på bokningar)
        print("🗑️  Tar bort recensioner...")
        deleted_reviews = db.query(Review).delete()
        print(f"   ✅ Tog bort {deleted_reviews} recensioner")
        
        # 2. Ta bort bokningar (beroende på users, farriers, horses)
        print("🗑️  Tar bort bokningar...")
        deleted_bookings = db.query(Booking).delete()
        print(f"   ✅ Tog bort {deleted_bookings} bokningar")
        
        # 3. Ta bort hästar (cascade delete från users, men tar bort explicit)
        print("🗑️  Tar bort hästar...")
        deleted_horses = db.query(Horse).delete()
        print(f"   ✅ Tog bort {deleted_horses} hästar")
        
        # 4. Ta bort farrier-relaterade data
        print("🗑️  Tar bort hovslagartjänster...")
        deleted_services = db.query(FarrierService).delete()
        print(f"   ✅ Tog bort {deleted_services} tjänster")
        
        print("🗑️  Tar bort hovslagarscheman...")
        deleted_schedules = db.query(FarrierSchedule).delete()
        print(f"   ✅ Tog bort {deleted_schedules} scheman")
        
        print("🗑️  Tar bort hovslagarsområden...")
        deleted_areas = db.query(FarrierArea).delete()
        print(f"   ✅ Tog bort {deleted_areas} områden")
        
        # 5. Ta bort hovslagare (cascade delete från users, men tar bort explicit)
        print("🗑️  Tar bort hovslagare...")
        deleted_farriers = db.query(Farrier).delete()
        print(f"   ✅ Tog bort {deleted_farriers} hovslagare")
        
        # 6. Ta bort alla användare
        print("🗑️  Tar bort användare...")
        deleted_users = db.query(User).delete()
        print(f"   ✅ Tog bort {deleted_users} användare")
        
        db.commit()
        
        print()
        print("✅ Alla konton och relaterad data har tagits bort!")
        
        # Verifiera att allt är borta
        remaining_users = db.query(User).count()
        remaining_bookings = db.query(Booking).count()
        remaining_reviews = db.query(Review).count()
        remaining_horses = db.query(Horse).count()
        remaining_farriers = db.query(Farrier).count()
        
        print()
        print(f"📊 Efter borttagning:")
        print(f"  - Användare: {remaining_users}")
        print(f"  - Bokningar: {remaining_bookings}")
        print(f"  - Recensioner: {remaining_reviews}")
        print(f"  - Hästar: {remaining_horses}")
        print(f"  - Hovslagare: {remaining_farriers}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Fel vid borttagning: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    print("⚠️  VARNING: Detta kommer att ta bort ALLA användarkonton och all relaterad data!")
    print("   Tryck Ctrl+C för att avbryta...")
    print()
    
    import time
    time.sleep(2)
    
    delete_all_accounts()

