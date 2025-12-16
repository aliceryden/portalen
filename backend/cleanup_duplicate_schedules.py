#!/usr/bin/env python3
"""
Rensa dubbla scheman för samma dag och tider
"""
import sys
sys.path.insert(0, '/app')

from app.core.database import SessionLocal
from app.models.farrier import FarrierSchedule

def cleanup_duplicate_schedules():
    db = SessionLocal()
    
    try:
        # Hämta alla scheman
        all_schedules = db.query(FarrierSchedule).all()
        
        # Gruppera scheman per hovslagare, dag och tider
        seen = {}
        duplicates = []
        
        for schedule in all_schedules:
            key = (
                schedule.farrier_id,
                schedule.day_of_week,
                schedule.start_time,
                schedule.end_time,
                schedule.is_available
            )
            
            if key in seen:
                # Detta är en dubblett - behåll det första, markera detta för borttagning
                duplicates.append(schedule.id)
            else:
                seen[key] = schedule.id
        
        if duplicates:
            print(f"✅ Hittade {len(duplicates)} dubbla scheman")
            
            # Ta bort dubblerna
            for dup_id in duplicates:
                schedule = db.query(FarrierSchedule).filter(FarrierSchedule.id == dup_id).first()
                if schedule:
                    db.delete(schedule)
            
            db.commit()
            print(f"✅ Tog bort {len(duplicates)} dubbla scheman")
        else:
            print("✅ Inga dubbla scheman hittades")
            
    except Exception as e:
        db.rollback()
        print(f"❌ Fel: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_duplicate_schedules()

