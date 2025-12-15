from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Databas - använd SQLite för utveckling (enklare start)
    DATABASE_URL: str = "sqlite:///./portalen.db"
    
    # JWT
    SECRET_KEY: str = "super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 timmar
    
    # App
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

