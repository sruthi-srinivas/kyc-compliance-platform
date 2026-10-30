import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    
    # Database connection string - Defaults to SQLite for immediate local execution, or PostgreSQL if configured
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./kyc_compliance.db")
    
    # Synthetic generator configuration
    RANDOM_SEED: int = 20261022
    DATASET_PRESET: str = os.getenv("DATASET_PRESET", "starter")  # 'starter' or 'full'
    
    # Evaluation Anchor Date
    EVALUATION_DATE: str = "2026-10-22"
    
    # Project paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    GENERATED_DIR: Path = BASE_DIR / "data" / "generated"
    GROUND_TRUTH_DIR: Path = BASE_DIR / "data" / "ground_truth"
    STARTER_DIR: Path = BASE_DIR / "data" / "starter"
    DOCS_DIR: Path = BASE_DIR / "docs"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
