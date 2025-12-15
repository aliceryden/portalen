from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    HORSE_OWNER = "horse_owner"
    FARRIER = "farrier"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20))
    role = Column(String(20), default=UserRole.HORSE_OWNER.value)
    
    # Adress
    address = Column(String(255))
    city = Column(String(100))
    postal_code = Column(String(10))
    latitude = Column(String(20))
    longitude = Column(String(20))
    
    # Status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Profilbild
    profile_image = Column(String(500))
    
    # Relationer
    horses = relationship("Horse", back_populates="owner", cascade="all, delete-orphan")
    bookings_as_owner = relationship("Booking", back_populates="horse_owner", foreign_keys="Booking.horse_owner_id")
    reviews_written = relationship("Review", back_populates="author", foreign_keys="Review.author_id")
    farrier_profile = relationship("Farrier", back_populates="user", uselist=False, cascade="all, delete-orphan")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

