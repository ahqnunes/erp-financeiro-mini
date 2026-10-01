from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Mini-ERP Financeiro API"
    environment: str = "development"
    frontend_dir: str | None = None
    database_url: str = (
        "postgresql+psycopg://postgres:postgrespassword@localhost:5432/minierp"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="MINIERP_",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
