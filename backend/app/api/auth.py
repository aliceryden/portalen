from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.database import get_db
from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_active_user
)
from app.models.user import User
from app.models.farrier import Farrier
from app.schemas.user import UserCreate, UserResponse
from app.schemas.auth import Token, PasswordReset

router = APIRouter()

def _normalize_email(email: str) -> str:
    return (email or "").strip().lower()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Registrera ny användare (hästägare eller hovslagare)"""
    email = _normalize_email(user_data.email)
    # Kolla om email redan finns
    existing_user = db.query(User).filter(func.lower(User.email) == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E-postadressen är redan registrerad"
        )
    
    # Skapa användare
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=email,
        hashed_password=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone,
        role=user_data.role,
        address=user_data.address,
        city=user_data.city,
        postal_code=user_data.postal_code
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Om det är en hovslagare, skapa också en farrier-profil
    if user_data.role == "farrier":
        farrier_profile = Farrier(user_id=db_user.id)
        db.add(farrier_profile)
        db.commit()
    
    return db_user


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Logga in och få JWT token"""
    email = _normalize_email(form_data.username)
    user = db.query(User).filter(func.lower(User.email) == email).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Felaktig e-post eller lösenord",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kontot är inaktiverat"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/reset-password")
async def reset_password(payload: PasswordReset, db: Session = Depends(get_db)):
    """Återställ lösenord (endast intern testmiljö).

    Skyddas av `PASSWORD_RESET_CODE` som måste vara satt som env-var i backend.
    """
    if not settings.PASSWORD_RESET_CODE:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Password reset är inte aktiverat i denna miljö"
        )
    if payload.reset_code != settings.PASSWORD_RESET_CODE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ogiltig reset-kod")

    email = _normalize_email(payload.email)
    user = db.query(User).filter(func.lower(User.email) == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Användaren finns inte")

    user.hashed_password = get_password_hash(payload.new_password)
    db.add(user)
    db.commit()
    return {"message": "Lösenord uppdaterat"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Hämta info om inloggad användare"""
    return current_user


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_active_user)):
    """Logga ut (klienten ska ta bort token)"""
    return {"message": "Utloggad"}

