from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import os
import uuid
from pathlib import Path

from app.core.security import get_current_active_user
from app.models.user import User

router = APIRouter()

# Skapa uploads-mapp om den inte finns
UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
(UPLOAD_DIR / "profiles").mkdir(exist_ok=True)
(UPLOAD_DIR / "horses").mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("/profile-image")
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """Ladda upp profilbild"""
    # Validera filtyp
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Ogiltig filtyp. Tillåtna: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Läs filinnehåll
    contents = await file.read()
    
    # Validera filstorlek
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Filen är för stor. Max 5MB"
        )
    
    # Generera unikt filnamn
    filename = f"{current_user.id}_{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / "profiles" / filename
    
    # Spara fil
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Returnera URL
    image_url = f"/api/upload/images/profiles/{filename}"
    
    return {"url": image_url, "filename": filename}


@router.post("/horse-image")
async def upload_horse_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """Ladda upp hästbild"""
    # Validera filtyp
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Ogiltig filtyp. Tillåtna: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Läs filinnehåll
    contents = await file.read()
    
    # Validera filstorlek
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Filen är för stor. Max 5MB"
        )
    
    # Generera unikt filnamn
    filename = f"{current_user.id}_{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / "horses" / filename
    
    # Spara fil
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Returnera URL
    image_url = f"/api/upload/images/horses/{filename}"
    
    return {"url": image_url, "filename": filename}


@router.get("/images/profiles/{filename}")
async def get_profile_image(filename: str):
    """Hämta profilbild"""
    file_path = UPLOAD_DIR / "profiles" / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Bild hittades inte")
    return FileResponse(file_path)


@router.get("/images/horses/{filename}")
async def get_horse_image(filename: str):
    """Hämta hästbild"""
    file_path = UPLOAD_DIR / "horses" / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Bild hittades inte")
    return FileResponse(file_path)

