from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, users, farriers, horses, bookings, reviews, admin, availability, upload
from app.core.config import settings
from app.core.database import engine, Base

# Skapa databastabeller
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Portalen API",
    description="Bokningsplattform för hovslagare och hästägare",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS-konfiguration (använder miljövariabler i produktion)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inkludera API routes
app.include_router(auth.router, prefix="/api/auth", tags=["Autentisering"])
app.include_router(users.router, prefix="/api/users", tags=["Användare"])
app.include_router(farriers.router, prefix="/api/farriers", tags=["Hovslagare"])
app.include_router(horses.router, prefix="/api/horses", tags=["Hästar"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["Bokningar"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["Omdömen"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(availability.router, prefix="/api/availability", tags=["Tillgänglighet"])
app.include_router(upload.router, prefix="/api/upload", tags=["Uppladdning"])


@app.get("/")
async def root():
    return {
        "message": "Välkommen till Portalen API",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

