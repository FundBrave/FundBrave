"""
Logging configuration for FundBrave AI Service.

Uses Loguru for structured logging with support for both
JSON and human-readable formats.
"""

import sys
from pathlib import Path
from typing import Any

from loguru import logger

from app.config import settings


def setup_logging() -> None:
    """
    Configure logging for the application.

    Sets up Loguru with:
    - Console output (colored for development, JSON for production)
    - File rotation for persistent logs
    - Appropriate log levels based on environment
    """
    # Remove default handler
    logger.remove()

    # Determine format based on settings
    if settings.log_format == "json":
        log_format = (
            "{{"
            '"timestamp": "{time:YYYY-MM-DDTHH:mm:ss.SSS}", '
            '"level": "{level}", '
            '"message": "{message}", '
            '"module": "{module}", '
            '"function": "{function}", '
            '"line": {line}'
            "}}"
        )
        colorize = False
    else:
        log_format = (
            "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
            "<level>{message}</level>"
        )
        colorize = True

    # Add console handler
    logger.add(
        sys.stdout,
        format=log_format,
        level=settings.log_level,
        colorize=colorize,
        backtrace=settings.debug,
        diagnose=settings.debug,
    )

    # Add file handler for production
    if settings.is_production:
        log_path = Path("logs")
        log_path.mkdir(exist_ok=True)

        logger.add(
            log_path / "ai-service_{time:YYYY-MM-DD}.log",
            rotation="00:00",  # New file at midnight
            retention="30 days",
            compression="gz",
            format=log_format,
            level="INFO",
        )

        # Separate error log
        logger.add(
            log_path / "ai-service_errors_{time:YYYY-MM-DD}.log",
            rotation="00:00",
            retention="60 days",
            compression="gz",
            format=log_format,
            level="ERROR",
        )

    logger.info(
        f"Logging configured: level={settings.log_level}, "
        f"format={settings.log_format}, env={settings.environment}"
    )


def get_logger(name: str | None = None) -> Any:
    """
    Get a logger instance.

    Args:
        name: Optional name for the logger (for context)

    Returns:
        Logger instance (Loguru)
    """
    if name:
        return logger.bind(name=name)
    return logger


# Request logging middleware helper
class RequestLogger:
    """Helper class for logging HTTP requests."""

    @staticmethod
    def log_request(
        method: str,
        path: str,
        status_code: int,
        duration_ms: float,
        user_id: str | None = None,
    ) -> None:
        """Log an HTTP request."""
        log_data = {
            "method": method,
            "path": path,
            "status_code": status_code,
            "duration_ms": round(duration_ms, 2),
        }
        if user_id:
            log_data["user_id"] = user_id

        if status_code >= 500:
            logger.error(f"Request completed: {log_data}")
        elif status_code >= 400:
            logger.warning(f"Request completed: {log_data}")
        else:
            logger.info(f"Request completed: {log_data}")
