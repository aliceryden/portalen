from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class Review(Base):
    """Omdömen och betyg från hästägare till hovslagare"""
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    
    # Koppling till bokning (1 review per bokning)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True, nullable=False)
    
    # Relationer
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    farrier_id = Column(Integer, ForeignKey("farriers.id"), nullable=False)
    
    # Betyg (1-5 stjärnor)
    rating = Column(Integer, nullable=False)  # 1-5
    
    # Detaljerade betyg
    quality_rating = Column(Integer)  # Kvalitet på arbetet
    punctuality_rating = Column(Integer)  # Punktlighet
    communication_rating = Column(Integer)  # Kommunikation
    price_rating = Column(Integer)  # Prisvärdhet
    
    # Textrecension
    title = Column(String(200))
    comment = Column(Text)
    
    # Synlighet
    is_visible = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=True)  # Verifierad bokning
    
    # Svar från hovslagare
    farrier_response = Column(Text)
    farrier_responded_at = Column(DateTime)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationer
    booking = relationship("Booking", back_populates="review")
    author = relationship("User", back_populates="reviews_written", foreign_keys=[author_id])
    farrier = relationship("Farrier", back_populates="reviews")

