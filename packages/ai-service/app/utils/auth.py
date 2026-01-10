"""
Authentication utilities for FundBrave AI Service.

Provides JWT token verification compatible with the NestJS backend.
Implements FastAPI dependency injection for protected endpoints.
"""

from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from loguru import logger

from app.config import settings


# Security scheme for Swagger UI
security = HTTPBearer(auto_error=False)


@dataclass
class JWTPayload:
    """Decoded JWT payload matching the backend's structure."""

    sub: str  # User ID
    wallet_address: str
    iat: int | None = None
    exp: int | None = None

    @property
    def user_id(self) -> str:
        """Alias for sub (user ID)."""
        return self.sub


def verify_token(token: str) -> JWTPayload:
    """
    Verify and decode a JWT token.

    Args:
        token: JWT token string

    Returns:
        Decoded JWTPayload

    Raises:
        HTTPException: If token is invalid or expired
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )

        user_id: str | None = payload.get("sub")
        wallet_address: str | None = payload.get("walletAddress")

        if user_id is None:
            logger.warning("Token missing 'sub' claim")
            raise credentials_exception

        return JWTPayload(
            sub=user_id,
            wallet_address=wallet_address or "",
            iat=payload.get("iat"),
            exp=payload.get("exp"),
        )

    except JWTError as e:
        logger.warning(f"JWT verification failed: {e}")
        raise credentials_exception from e


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)]
) -> JWTPayload:
    """
    FastAPI dependency to get the current authenticated user.

    Usage:
        @router.get("/protected")
        async def protected_endpoint(user: JWTPayload = Depends(get_current_user)):
            return {"user_id": user.user_id}

    Args:
        credentials: HTTP Authorization credentials from request

    Returns:
        Decoded JWTPayload with user information

    Raises:
        HTTPException: If no credentials provided or token invalid
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return verify_token(credentials.credentials)


async def get_optional_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)]
) -> JWTPayload | None:
    """
    FastAPI dependency to optionally get the current user.

    Returns None if no credentials provided, but validates token if present.

    Usage:
        @router.get("/endpoint")
        async def endpoint(user: JWTPayload | None = Depends(get_optional_user)):
            if user:
                return {"user_id": user.user_id}
            return {"message": "Anonymous access"}

    Args:
        credentials: HTTP Authorization credentials from request

    Returns:
        Decoded JWTPayload or None if not authenticated
    """
    if credentials is None:
        return None

    try:
        return verify_token(credentials.credentials)
    except HTTPException:
        return None


class APIKeyAuth:
    """
    API Key authentication for service-to-service communication.

    Used for internal calls from the backend service.
    """

    def __init__(self, api_key_header: str = "X-API-Key"):
        self.api_key_header = api_key_header

    async def __call__(
        self,
        credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)]
    ) -> bool:
        """Verify API key from header."""
        if not settings.backend_api_key:
            # If no API key configured, fall back to JWT auth
            if credentials:
                verify_token(credentials.credentials)
                return True
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required",
            )

        # Check for API key (implementation depends on how you want to pass it)
        # This is a placeholder - in production you'd check the actual header
        if credentials and credentials.credentials == settings.backend_api_key:
            return True

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )
