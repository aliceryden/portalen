from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class BookingStatus(str, enum.Enum):
    PENDING = "pending"          # Väntar på bekräftelse
    CONFIRMED = "confirmed"      # Bekräftad
    IN_PROGRESS = "in_progress"  # Pågående
    COMPLETED = "completed"      # Slutförd
    CANCELLED = "cancelled"      # Avbokad


class Booking(Base):
    """Bokningar mellan hästägare och hovslagare"""
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    
    # Relationer till användare
    horse_owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    farrier_id = Column(Integer, ForeignKey("farriers.id"), nullable=False)
    horse_id = Column(Integer, ForeignKey("horses.id"), nullable=False)
    
    # Bokningsdetaljer
    service_type = Column(String(200), nullable=False)  # Typ av tjänst
    scheduled_date = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=60)
    
    # Plats
    location_address = Column(String(255))
    location_city = Column(String(100))
    location_latitude = Column(String(20))
    location_longitude = Column(String(20))
    
    # Pris
    service_price = Column(Float, nullable=False)
    travel_fee = Column(Float, default=0.0)
    total_price = Column(Float, nullable=False)
    
    # Status
    status = Column(String(20), default=BookingStatus.PENDING.value)
    
    # Meddelanden
    notes_from_owner = Column(Text)  # Meddelande från hästägare
    notes_from_farrier = Column(Text)  # Meddelande från hovslagare
    
    # Avbokning
    cancelled_by = Column(String(20))  # "owner" eller "farrier"
    cancellation_reason = Column(Text)
    cancelled_at = Column(DateTime)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime)
    
    # Relationer
    horse_owner = relationship("User", back_populates="bookings_as_owner", foreign_keys=[horse_owner_id])
    farrier = relationship("Farrier", back_populates="bookings")
    horse = relationship("Horse", back_populates="bookings")
    review = relationship("Review", back_populates="booking", uselist=False)

