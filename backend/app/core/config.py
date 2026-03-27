import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "KMRL Document Intelligence"
    API_V1_STR: str = "/api/v1"
    
    # Storage
    STORAGE_DIR: str = os.path.join(os.getcwd(), "backend", "storage")
    ACTIVE_STORAGE_DIR: str = os.path.join(STORAGE_DIR, "active")
    TEMP_STORAGE_DIR: str = os.path.join(STORAGE_DIR, "temp")
    
    # Database
    # Defaulting to sqlite for local dev ease, but code structure ready for PG
    DATABASE_URL: str = "sqlite:///./kmrl_docs.db"
    # DATABASE_URL: str = "postgresql://user:password@localhost/kmrl_db"
    
    # Security
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_HERE_FOR_DEV"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Firebase
    FIREBASE_STORAGE_BUCKET: str = "kmrl-document-intelligence.appspot.com" # TODO: Update with actual bucket name
    
    class Config:
        case_sensitive = True

settings = Settings()
