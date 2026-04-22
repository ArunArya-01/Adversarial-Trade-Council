"""
core/logger.py — TradeMind AI Structured XAI Logger
=====================================================
Emits JSON-structured thought logs compatible with the frontend ThoughtLog
component. Each log entry has: timestamp, agent, severity, and reasoning text.
"""
from __future__ import annotations

import logging
import sys
from datetime import datetime, timezone
from typing import Literal

AgentName = Literal[
    "system",
    "rl_brain",
    "macro_agent",
    "technical_agent",
    "devils_advocate",
    "safety_stack",
    "council",
]

Severity = Literal["INFO", "WARNING", "CRITICAL", "DEBUG"]


class ThoughtLogFormatter(logging.Formatter):
    """
    Formats log records as compact JSON strings so they can be streamed
    directly to the frontend WebSocket without further transformation.
    """

    def format(self, record: logging.LogRecord) -> str:
        import json

        agent = getattr(record, "agent", "system")
        severity = getattr(record, "severity", record.levelname)

        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "agent": agent,
            "severity": severity,
            "message": record.getMessage(),
        }
        return json.dumps(payload)


def _build_logger() -> logging.Logger:
    logger = logging.getLogger("trademind")
    logger.setLevel(logging.DEBUG)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(ThoughtLogFormatter())
        logger.addHandler(handler)

    return logger


_logger = _build_logger()


# ── Public helpers ────────────────────────────────────────────────────────────

def thought(
    message: str,
    agent: AgentName = "system",
    severity: Severity = "INFO",
) -> dict:
    """
    Emit a structured thought log and return it as a dict so callers can
    include it in API responses / WebSocket payloads.
    """
    extra = {"agent": agent, "severity": severity}
    level_map: dict[Severity, int] = {
        "DEBUG": logging.DEBUG,
        "INFO": logging.INFO,
        "WARNING": logging.WARNING,
        "CRITICAL": logging.CRITICAL,
    }
    _logger.log(level_map.get(severity, logging.INFO), message, extra=extra)

    from datetime import datetime, timezone

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "agent": agent,
        "severity": severity,
        "message": message,
    }


def info(message: str, agent: AgentName = "system") -> dict:
    return thought(message, agent=agent, severity="INFO")


def warn(message: str, agent: AgentName = "system") -> dict:
    return thought(message, agent=agent, severity="WARNING")


def critical(message: str, agent: AgentName = "system") -> dict:
    return thought(message, agent=agent, severity="CRITICAL")
