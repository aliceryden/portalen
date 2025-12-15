from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.horse import Horse
from app.schemas.horse import HorseCreate, HorseUpdate, HorseResponse

router = APIRouter()


@router.get("/", response_model=List[HorseResponse])
async def list_horses(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Lista alla egna hästar"""
    horses = db.query(Horse).filter(Horse.owner_id == current_user.id).all()
    return horses


@router.post("/", response_model=HorseResponse, status_code=status.HTTP_201_CREATED)
async def create_horse(
    horse_data: HorseCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Registrera en ny häst"""
    horse = Horse(owner_id=current_user.id, **horse_data.model_dump())
    db.add(horse)
    db.commit()
    db.refresh(horse)
    return horse


@router.get("/{horse_id}", response_model=HorseResponse)
async def get_horse(
    horse_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Hämta en specifik häst"""
    horse = db.query(Horse).filter(
        Horse.id == horse_id,
        Horse.owner_id == current_user.id
    ).first()
    
    if not horse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Häst hittades inte"
        )
    return horse


@router.put("/{horse_id}", response_model=HorseResponse)
async def update_horse(
    horse_id: int,
    horse_data: HorseUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Uppdatera häst"""
    horse = db.query(Horse).filter(
        Horse.id == horse_id,
        Horse.owner_id == current_user.id
    ).first()
    
    if not horse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Häst hittades inte"
        )
    
    update_data = horse_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(horse, field, value)
    
    db.commit()
    db.refresh(horse)
    return horse


@router.delete("/{horse_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_horse(
    horse_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Ta bort häst"""
    horse = db.query(Horse).filter(
        Horse.id == horse_id,
        Horse.owner_id == current_user.id
    ).first()
    
    if not horse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Häst hittades inte"
        )
    
    db.delete(horse)
    db.commit()

