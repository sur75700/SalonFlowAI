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

    resend_api_key: str = ""
    resend_from_email: str = "SalonFlow AI <onboarding@resend.dev>"
    resend_enabled: bool = False
    public_app_url: str = "http://localhost:8081"
    google_client_ids: str = ""

    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_pro: str = ""
    stripe_price_business: str = ""
    stripe_price_enterprise: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def google_oauth_client_ids(self) -> list[str]:
        return [
            value.strip()
            for value in self.google_client_ids.split(",")
            if value.strip()
        ]

    @property
    def stripe_price_map(self) -> dict[str, str]:
        return {
            "pro": self.stripe_price_pro.strip(),
            "business": self.stripe_price_business.strip(),
            "enterprise": self.stripe_price_enterprise.strip(),
        }

    @property
    def stripe_ready(self) -> bool:
        return bool(
            self.stripe_secret_key.strip()
            and self.stripe_price_pro.strip()
            and self.stripe_price_business.strip()
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

# PHASE_62C4B_METRICS_CONFIG
import os as _observability_os

_INTELLIGENCE_METRICS_TRUE_VALUES = frozenset(
    {"1", "true", "yes", "on"}
)
_INTELLIGENCE_METRICS_EXPORTERS = frozenset(
    {"none", "structured_log"}
)


def intelligence_metrics_enabled() -> bool:
    raw = _observability_os.getenv(
        "INTELLIGENCE_METRICS_ENABLED",
        "false",
    )
    return raw.strip().lower() in _INTELLIGENCE_METRICS_TRUE_VALUES


def intelligence_metrics_exporter() -> str:
    raw = _observability_os.getenv(
        "INTELLIGENCE_METRICS_EXPORTER",
        "none",
    )
    normalized = raw.strip().lower()
    if normalized not in _INTELLIGENCE_METRICS_EXPORTERS:
        return "none"
    return normalized
