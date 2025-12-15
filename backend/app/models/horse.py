from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Date
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class Horse(Base):
    """Hästägares registrerade hästar"""
    __tablename__ = "horses"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Grundläggande info
    name = Column(String(100), nullable=False)
    breed = Column(String(100))  # Ras
    birth_date = Column(Date)
    gender = Column(String(20))  # Hingst, Sto, Valack
    height_cm = Column(Integer)  # Mankhöjd i cm
    
    # Identifiering (valfritt)
    passport_number = Column(String(50))
    chip_number = Column(String(50))
    
    # Hovvårdsinfo
    shoe_size = Column(String(20))
    special_needs = Column(Text)  # Särskilda behov eller problem
    last_farrier_visit = Column(Date)
    
    # Plats (kan skilja sig från ägarens)
    stable_name = Column(String(200))
    stable_address = Column(String(255))
    stable_city = Column(String(100))
    stable_latitude = Column(String(20))
    stable_longitude = Column(String(20))
    
    # Bild
    image_url = Column(String(500))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationer
    owner = relationship("User", back_populates="horses")
    bookings = relationship("Booking", back_populates="horse", cascade="all, delete-orphan")

