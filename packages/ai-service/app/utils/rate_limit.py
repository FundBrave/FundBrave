"""
Rate limiting utilities for FundBrave AI Service.

Uses SlowAPI for rate limiting with Redis backend support.
Provides per-user and per-endpoint rate limits to prevent abuse.
"""

from typing import Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from loguru import logger

from app.config import settings


def get_user_identifier(request: Request) -> str:
    """
    Get a unique identifier for rate limiting.

    Tries to extract user ID from JWT token, falls back to IP address.

    Args:
        request: FastAPI request object

    Returns:
        User identifier string
    """
    # Try to get user ID from authorization header
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        try:
            from jose import jwt
            token = auth_header[7:]
            # Decode without verification just to get the user ID
            # (verification happens in the auth dependency)
            payload = jwt.decode(
                token,
                settings.jwt_secret,
                algorithms=[settings.jwt_algorithm],
                options={"verify_exp": False},
            )
            user_id = payload.get("sub")
            if user_id:
                return f"user:{user_id}"
        except Exception:
            pass

    # Fall back to IP address
    return f"ip:{get_remote_address(request)}"


def get_limiter() -> Limiter:
    """
    Create and configure the rate limiter.

    Uses Redis as the storage backend if available, otherwise memory.

    Returns:
        Configured Limiter instance
    """
    # Determine storage backend
    storage_uri = None
    if settings.redis_url and settings.rate_limit_enabled:
        storage_uri = settings.redis_url

    limiter = Limiter(
        key_func=get_user_identifier,
        default_limits=["100/minute"],
        storage_uri=storage_uri,
        enabled=settings.rate_limit_enabled,
    )

    return limiter


async def rate_limit_exceeded_handler(
    request: Request,
    exc: RateLimitExceeded,
) -> Response:
    """
    Handler for rate limit exceeded errors.

    Returns a JSON response with appropriate headers and message.

    Args:
        request: FastAPI request object
        exc: Rate limit exceeded exception

    Returns:
        JSON response with 429 status code
    """
    logger.warning(
        f"Rate limit exceeded for {get_user_identifier(request)}: "
        f"{request.method} {request.url.path}"
    )

    # Parse the limit string to get retry information
    retry_after = "60"  # Default to 60 seconds
    if hasattr(exc, "detail") and isinstance(exc.detail, str):
        # Try to extract the time from the error message
        import re
        match = re.search(r"(\d+)\s*(second|minute|hour)", exc.detail.lower())
        if match:
            value = int(match.group(1))
            unit = match.group(2)
            if unit == "minute":
                retry_after = str(value * 60)
            elif unit == "hour":
                retry_after = str(value * 3600)
            else:
                retry_after = str(value)

    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "message": "Too many requests. Please try again later.",
            "detail": str(exc.detail) if hasattr(exc, "detail") else "Rate limit exceeded",
        },
        headers={
            "Retry-After": retry_after,
            "X-RateLimit-Limit": str(exc.detail) if hasattr(exc, "detail") else "unknown",
        },
    )


# Pre-configured rate limit decorators
def chat_rate_limit() -> str:
    """Get the rate limit string for chat endpoint."""
    return settings.rate_limit_chat


def media_rate_limit() -> str:
    """Get the rate limit string for media verification endpoint."""
    return settings.rate_limit_media


# Create global limiter instance
limiter = get_limiter()
