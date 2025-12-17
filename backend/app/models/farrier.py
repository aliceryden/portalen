from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Time
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class Farrier(Base):
    """Hovslagarens profil och information"""
    __tablename__ = "farriers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Profil
    business_name = Column(String(200))
    description = Column(Text)
    experience_years = Column(Integer, default=0)
    certifications = Column(Text)  # JSON-lista med certifieringar
    
    # Betyg (beräknas från reviews)
    average_rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    
    # Arbetsområde (radie i km från bas)
    travel_radius_km = Column(Integer, default=50)
    base_latitude = Column(Float)
    base_longitude = Column(Float)
    
    # Status
    is_available = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationer
    user = relationship("User", back_populates="farrier_profile")
    services = relationship("FarrierService", back_populates="farrier", cascade="all, delete-orphan")
    schedules = relationship("FarrierSchedule", back_populates="farrier", cascade="all, delete-orphan")
    areas = relationship("FarrierArea", back_populates="farrier", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="farrier")
    reviews = relationship("Review", back_populates="farrier")


class FarrierService(Base):
    """Tjänster som hovslagaren erbjuder"""
    __tablename__ = "farrier_services"

    id = Column(Integer, primary_key=True, index=True)
    farrier_id = Column(Integer, ForeignKey("farriers.id"), nullable=False)
    
    name = Column(String(200), nullable=False)  # T.ex. "Verkning", "Skoning", "Akut hovvård"
    description = Column(Text)
    price = Column(Float, nullable=False)
    duration_minutes = Column(Integer, default=60)  # Uppskattad tid
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationer
    farrier = relationship("Farrier", back_populates="services")


class FarrierSchedule(Base):
    """Schema för hovslagarens tillgänglighet"""
    __tablename__ = "farrier_schedules"

    id = Column(Integer, primary_key=True, index=True)
    farrier_id = Column(Integer, ForeignKey("farriers.id"), nullable=False)
    
    day_of_week = Column(Integer, nullable=False)  # 0=Måndag, 6=Söndag
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_available = Column(Boolean, default=True)
    
    # Relationer
    farrier = relationship("Farrier", back_populates="schedules")


class FarrierArea(Base):
    """Geografiska områden där hovslagaren arbetar"""
    __tablename__ = "farrier_areas"

    id = Column(Integer, primary_key=True, index=True)
    farrier_id = Column(Integer, ForeignKey("farriers.id"), nullable=False)
    
    # Kommun/Stad
    city = Column(String(100), nullable=False)
    postal_code_prefix = Column(String(10))  # T.ex. "184 32" för postnummer
    
    # Extra kostnad för resor till detta område
    travel_fee = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationer
    farrier = relationship("Farrier", back_populates="areas")

