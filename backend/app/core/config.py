from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "SalonFlow AI"
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    mongo_url: str = "mongodb://127.0.0.1:27017"
    mongo_db_name: str = "salonflowai"

    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    frontend_web_origin: str = "http://localhost:8081"
    frontend_localhost_origin: str = "http://127.0.0.1:8081"
    frontend_lan_origin: str = "http://192.168.10.17:8081"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        origins = [
            self.frontend_web_origin,
            self.frontend_localhost_origin,
            self.frontend_lan_origin,
        ]
        cleaned: list[str] = []
        for origin in origins:
            value = origin.strip()
            if value and value not in cleaned:
                cleaned.append(value)
        return cleaned


settings = Settings()
