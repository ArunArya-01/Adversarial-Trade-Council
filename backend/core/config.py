"""
core/config.py — TradeMind AI Global Configuration
====================================================
Single source of truth for all environment variables.
Uses Pydantic Settings so values are type-validated at startup.
"""
from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    All settings are loaded from the .env file (or real environment variables).
    Pydantic will raise a ValidationError at startup if required values are missing.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── LLM ──────────────────────────────────────────────────────────────────
    gemini_api_key: str = Field(default="", description="Google Gemini API key")

    # ── Alpaca Paper Trading ──────────────────────────────────────────────────
    alpaca_api_key: str = Field(default="", description="Alpaca API key")
    alpaca_secret_key: str = Field(default="", description="Alpaca secret key")
    alpaca_base_url: str = Field(
        default="https://paper-api.alpaca.markets",
        description="Alpaca REST base URL",
    )

    # ── Safety Guardrails ─────────────────────────────────────────────────────
    strict_mode: bool = Field(
        default=True,
        description="When True, all file writes require explicit approval",
    )
    max_daily_drawdown: float = Field(
        default=0.02,
        ge=0.0,
        le=1.0,
        description="Hard kill-switch trigger level (fraction of peak capital)",
    )
    max_position_size: float = Field(
        default=0.05,
        ge=0.0,
        le=1.0,
        description="Maximum single-position size (fraction of total capital)",
    )
    max_vix_threshold: float = Field(
        default=30.0,
        ge=0.0,
        description="VIX proxy ceiling — trades blocked above this level",
    )

    # ── Admin ─────────────────────────────────────────────────────────────────
    admin_secret_token: str = Field(
        default="change_me",
        description="Bearer token required to reset the kill-switch",
    )

    # ── Server / CORS ─────────────────────────────────────────────────────────
    cors_origins: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173",
        description="Comma-separated list of allowed CORS origins",
    )

    # ── RL Model ──────────────────────────────────────────────────────────────
    ppo_checkpoint_path: str = Field(
        default="",
        description="Optional path to a pre-trained PPO .zip checkpoint",
    )

    # ── Derived helpers ───────────────────────────────────────────────────────
    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def gemini_configured(self) -> bool:
        return bool(self.gemini_api_key and self.gemini_api_key != "your_gemini_api_key_here")

    @property
    def alpaca_configured(self) -> bool:
        return bool(self.alpaca_api_key and self.alpaca_api_key != "your_alpaca_api_key_here")

    @field_validator("max_daily_drawdown", "max_position_size", mode="before")
    @classmethod
    def validate_fraction(cls, v: float) -> float:
        return float(v)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Returns a cached singleton Settings instance.
    All modules should call `get_settings()` rather than instantiating directly.
    """
    return Settings()
