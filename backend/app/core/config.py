from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    # Databas - använd SQLite för utveckling (enklare start)
    DATABASE_URL: str = "sqlite:///./portalen.db"
    
    # JWT
    SECRET_KEY: str = "super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 timmar

    # Password reset (internal test use). If set, enables /auth/reset-password guarded by this code.
    PASSWORD_RESET_CODE: Optional[str] = None
    
    # App
    DEBUG: bool = True
    
    # CORS - frontend URLs (kommaseparerade i produktion)
    FRONTEND_URL: str = "http://localhost:5174"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://localhost:3000"
    
    @property
    def cors_origins(self) -> List[str]:
        """Parse comma-separated origins into list"""
        origins = self.ALLOWED_ORIGINS.split(",")
        if self.FRONTEND_URL and self.FRONTEND_URL not in origins:
            origins.append(self.FRONTEND_URL)
        return [o.strip() for o in origins if o.strip()]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

