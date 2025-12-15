"""
Script för att skapa mockdata med 5 hovslagare
"""
from sqlalchemy.orm import Session
from datetime import time
import json

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.farrier import Farrier, FarrierService, FarrierSchedule, FarrierArea


def create_farriers():
    """Skapa 5 hovslagare med mockdata"""
    db: Session = SessionLocal()
    
    try:
        # Hovslagare 1: Stockholm
        user1 = User(
            email="erik.svensson@hovslagare.se",
            hashed_password=get_password_hash("password123"),
            first_name="Erik",
            last_name="Svensson",
            phone="070-123 45 67",
            role="farrier",
            address="Hästgatan 12",
            city="Stockholm",
            postal_code="111 22",
            latitude="59.3293",
            longitude="18.0686",
            is_active=True
        )
        db.add(user1)
        db.flush()
        
        farrier1 = Farrier(
            user_id=user1.id,
            business_name="Eriks Hovslagarservice",
            description="Erfaren hovslagare med över 15 års erfarenhet. Specialiserad på verkning och skoning. Arbetar i Stockholmsområdet.",
            experience_years=15,
            certifications=json.dumps(["Certifierad hovslagare", "Hästvårdsexpert"]),
            travel_radius_km=50,
            base_latitude=59.3293,
            base_longitude=18.0686,
            is_available=True,
            is_verified=True
        )
        db.add(farrier1)
        db.flush()
        
        # Services för hovslagare 1
        db.add(FarrierService(farrier_id=farrier1.id, name="Verkning", description="Fullständig verkning", price=1200.0, duration_minutes=90))
        db.add(FarrierService(farrier_id=farrier1.id, name="Skoning", description="Skoning av alla fyra hovar", price=800.0, duration_minutes=60))
        db.add(FarrierService(farrier_id=farrier1.id, name="Akut hovvård", description="Akut insats vid hovproblem", price=1500.0, duration_minutes=120))
        
        # Schema för hovslagare 1 (Måndag-Fredag 08:00-17:00)
        for day in range(5):  # 0-4 = Måndag-Fredag
            db.add(FarrierSchedule(farrier_id=farrier1.id, day_of_week=day, start_time=time(8, 0), end_time=time(17, 0)))
        
        # Områden för hovslagare 1
        db.add(FarrierArea(farrier_id=farrier1.id, city="Stockholm", postal_code_prefix="111"))
        db.add(FarrierArea(farrier_id=farrier1.id, city="Solna", postal_code_prefix="169"))
        db.add(FarrierArea(farrier_id=farrier1.id, city="Sundbyberg", postal_code_prefix="172"))
        
        # Hovslagare 2: Uppsala
        user2 = User(
            email="anna.andersson@hovslagare.se",
            hashed_password=get_password_hash("password123"),
            first_name="Anna",
            last_name="Andersson",
            phone="070-234 56 78",
            role="farrier",
            address="Hovvägen 5",
            city="Uppsala",
            postal_code="751 20",
            latitude="59.8586",
            longitude="17.6389",
            is_active=True
        )
        db.add(user2)
        db.flush()
        
        farrier2 = Farrier(
            user_id=user2.id,
            business_name="Annas Hovvård",
            description="Passionerad hovslagare med fokus på hästens välmående. Erbjuder både verkning och konsultation.",
            experience_years=10,
            certifications=json.dumps(["Certifierad hovslagare", "Hovvårdsspecialist"]),
            travel_radius_km=60,
            base_latitude=59.8586,
            base_longitude=17.6389,
            is_available=True,
            is_verified=True
        )
        db.add(farrier2)
        db.flush()
        
        db.add(FarrierService(farrier_id=farrier2.id, name="Verkning", description="Fullständig verkning", price=1100.0, duration_minutes=90))
        db.add(FarrierService(farrier_id=farrier2.id, name="Skoning", description="Skoning av alla fyra hovar", price=750.0, duration_minutes=60))
        db.add(FarrierService(farrier_id=farrier2.id, name="Hovkonsultation", description="Bedömning och rådgivning", price=600.0, duration_minutes=45))
        
        for day in range(5):
            db.add(FarrierSchedule(farrier_id=farrier2.id, day_of_week=day, start_time=time(7, 30), end_time=time(16, 30)))
        
        db.add(FarrierArea(farrier_id=farrier2.id, city="Uppsala", postal_code_prefix="751"))
        db.add(FarrierArea(farrier_id=farrier2.id, city="Enköping", postal_code_prefix="745"))
        db.add(FarrierArea(farrier_id=farrier2.id, city="Knivsta", postal_code_prefix="741"))
        
        # Hovslagare 3: Göteborg
        user3 = User(
            email="mikael.johansson@hovslagare.se",
            hashed_password=get_password_hash("password123"),
            first_name="Mikael",
            last_name="Johansson",
            phone="070-345 67 89",
            role="farrier",
            address="Hästbacken 8",
            city="Göteborg",
            postal_code="411 10",
            latitude="57.7089",
            longitude="11.9746",
            is_active=True
        )
        db.add(user3)
        db.flush()
        
        farrier3 = Farrier(
            user_id=user3.id,
            business_name="Mikaels Hovslagarservice",
            description="Erfaren hovslagare med bred kompetens. Arbetar med alla typer av hästar och hovproblem.",
            experience_years=20,
            certifications=json.dumps(["Certifierad hovslagare", "Mästare i hovvård", "Specialist i hovsjukdomar"]),
            travel_radius_km=70,
            base_latitude=57.7089,
            base_longitude=11.9746,
            is_available=True,
            is_verified=True
        )
        db.add(farrier3)
        db.flush()
        
        db.add(FarrierService(farrier_id=farrier3.id, name="Verkning", description="Fullständig verkning", price=1300.0, duration_minutes=90))
        db.add(FarrierService(farrier_id=farrier3.id, name="Skoning", description="Skoning av alla fyra hovar", price=850.0, duration_minutes=60))
        db.add(FarrierService(farrier_id=farrier3.id, name="Hovreparation", description="Reparation av skadade hovar", price=1800.0, duration_minutes=120))
        db.add(FarrierService(farrier_id=farrier3.id, name="Akut hovvård", description="Akut insats", price=1600.0, duration_minutes=120))
        
        for day in range(6):  # Måndag-Lördag
            db.add(FarrierSchedule(farrier_id=farrier3.id, day_of_week=day, start_time=time(8, 0), end_time=time(18, 0)))
        
        db.add(FarrierArea(farrier_id=farrier3.id, city="Göteborg", postal_code_prefix="411"))
        db.add(FarrierArea(farrier_id=farrier3.id, city="Mölndal", postal_code_prefix="431"))
        db.add(FarrierArea(farrier_id=farrier3.id, city="Partille", postal_code_prefix="433"))
        
        # Hovslagare 4: Malmö
        user4 = User(
            email="lisa.nilsson@hovslagare.se",
            hashed_password=get_password_hash("password123"),
            first_name="Lisa",
            last_name="Nilsson",
            phone="070-456 78 90",
            role="farrier",
            address="Ridgatan 15",
            city="Malmö",
            postal_code="211 15",
            latitude="55.6059",
            longitude="13.0007",
            is_active=True
        )
        db.add(user4)
        db.flush()
        
        farrier4 = Farrier(
            user_id=user4.id,
            business_name="Lisas Hovvård & Konsultation",
            description="Modern hovslagare med fokus på preventiv hovvård. Erbjuder regelbundna besök och hovvårdsplaner.",
            experience_years=8,
            certifications=json.dumps(["Certifierad hovslagare", "Hovvårdspedagog"]),
            travel_radius_km=55,
            base_latitude=55.6059,
            base_longitude=13.0007,
            is_available=True,
            is_verified=True
        )
        db.add(farrier4)
        db.flush()
        
        db.add(FarrierService(farrier_id=farrier4.id, name="Verkning", description="Fullständig verkning", price=1150.0, duration_minutes=90))
        db.add(FarrierService(farrier_id=farrier4.id, name="Skoning", description="Skoning av alla fyra hovar", price=780.0, duration_minutes=60))
        db.add(FarrierService(farrier_id=farrier4.id, name="Hovvårdsplan", description="Regelbunden hovvård med plan", price=1000.0, duration_minutes=90))
        
        for day in range(5):
            db.add(FarrierSchedule(farrier_id=farrier4.id, day_of_week=day, start_time=time(9, 0), end_time=time(17, 0)))
        
        db.add(FarrierArea(farrier_id=farrier4.id, city="Malmö", postal_code_prefix="211"))
        db.add(FarrierArea(farrier_id=farrier4.id, city="Lund", postal_code_prefix="221"))
        db.add(FarrierArea(farrier_id=farrier4.id, city="Helsingborg", postal_code_prefix="251"))
        
        # Hovslagare 5: Örebro
        user5 = User(
            email="anders.larsson@hovslagare.se",
            hashed_password=get_password_hash("password123"),
            first_name="Anders",
            last_name="Larsson",
            phone="070-567 89 01",
            role="farrier",
            address="Hovslagarstigen 3",
            city="Örebro",
            postal_code="702 10",
            latitude="59.2741",
            longitude="15.2066",
            is_active=True
        )
        db.add(user5)
        db.flush()
        
        farrier5 = Farrier(
            user_id=user5.id,
            business_name="Anders Hovslagarservice",
            description="Traditionell hovslagare med modern teknik. Erfarenhet med både tävlingshästar och ridhästar.",
            experience_years=12,
            certifications=json.dumps(["Certifierad hovslagare", "Specialist tävlingshästar"]),
            travel_radius_km=65,
            base_latitude=59.2741,
            base_longitude=15.2066,
            is_available=True,
            is_verified=True
        )
        db.add(farrier5)
        db.flush()
        
        db.add(FarrierService(farrier_id=farrier5.id, name="Verkning", description="Fullständig verkning", price=1250.0, duration_minutes=90))
        db.add(FarrierService(farrier_id=farrier5.id, name="Skoning", description="Skoning av alla fyra hovar", price=820.0, duration_minutes=60))
        db.add(FarrierService(farrier_id=farrier5.id, name="Tävlingsförberedelse", description="Specialförberedelse för tävling", price=1400.0, duration_minutes=90))
        
        for day in range(5):
            db.add(FarrierSchedule(farrier_id=farrier5.id, day_of_week=day, start_time=time(7, 0), end_time=time(16, 0)))
        
        db.add(FarrierArea(farrier_id=farrier5.id, city="Örebro", postal_code_prefix="702"))
        db.add(FarrierArea(farrier_id=farrier5.id, city="Kumla", postal_code_prefix="692"))
        db.add(FarrierArea(farrier_id=farrier5.id, city="Karlskoga", postal_code_prefix="691"))
        
        db.commit()
        print("✅ 5 hovslagare skapade framgångsrikt!")
        print("\nHovslagare:")
        print("1. Erik Svensson - Stockholm (erik.svensson@hovslagare.se)")
        print("2. Anna Andersson - Uppsala (anna.andersson@hovslagare.se)")
        print("3. Mikael Johansson - Göteborg (mikael.johansson@hovslagare.se)")
        print("4. Lisa Nilsson - Malmö (lisa.nilsson@hovslagare.se)")
        print("5. Anders Larsson - Örebro (anders.larsson@hovslagare.se)")
        print("\nAlla har lösenord: password123")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Fel vid skapande av hovslagare: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_farriers()

