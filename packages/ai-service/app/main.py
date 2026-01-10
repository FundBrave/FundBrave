"""
FundBrave AI Service - Main Application

FastAPI application entry point for the AI microservice.
Provides conversational AI, media verification, and
multimodal analysis capabilities.
"""

import time
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
from slowapi.errors import RateLimitExceeded

from app import __version__
from app.api import api_router
from app.config import settings
from app.models import (
    get_conversational_model,
    get_media_verifier_model,
    get_multimodal_model,
)
from app.services.cache import get_cache_service
from app.services.database import get_database_service
from app.utils.logging import setup_logging, RequestLogger
from app.utils.rate_limit import limiter, rate_limit_exceeded_handler


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """
    Application lifespan manager.

    Handles startup and shutdown events:
    - Startup: Initialize logging, cache, and optionally load models
    - Shutdown: Cleanup resources and unload models
    """
    # ===========================================
    # Startup
    # ===========================================
    setup_logging()
    logger.info(f"Starting FundBrave AI Service v{__version__}")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Load models: {settings.load_models}")

    # Initialize cache
    try:
        cache = await get_cache_service()
        cache_health = await cache.health_check()
        logger.info(f"Cache initialized: {cache_health}")
    except Exception as e:
        logger.warning(f"Cache initialization failed: {e}")

    # Load models if enabled
    if settings.load_models:
        logger.info("Loading AI models...")

        try:
            # Load conversational model
            conv_model = get_conversational_model()
            await conv_model.load()
            logger.info("Conversational model loaded")
        except Exception as e:
            logger.error(f"Failed to load conversational model: {e}")

        try:
            # Load media verifier model
            media_model = get_media_verifier_model()
            await media_model.load()
            logger.info("Media verifier model loaded")
        except Exception as e:
            logger.error(f"Failed to load media verifier model: {e}")

        try:
            # Load multimodal model
            mm_model = get_multimodal_model()
            await mm_model.load()
            logger.info("Multimodal model loaded")
        except Exception as e:
            logger.error(f"Failed to load multimodal model: {e}")

        logger.info("Model loading complete")
    else:
        logger.info("Running in mock mode (LOAD_MODELS=false)")

    logger.info("FundBrave AI Service started successfully")

    yield

    # ===========================================
    # Shutdown
    # ===========================================
    logger.info("Shutting down FundBrave AI Service...")

    # Unload models
    if settings.load_models:
        try:
            conv_model = get_conversational_model()
            await conv_model.unload()
        except Exception as e:
            logger.error(f"Error unloading conversational model: {e}")

        try:
            media_model = get_media_verifier_model()
            await media_model.unload()
        except Exception as e:
            logger.error(f"Error unloading media verifier model: {e}")

        try:
            mm_model = get_multimodal_model()
            await mm_model.unload()
        except Exception as e:
            logger.error(f"Error unloading multimodal model: {e}")

    # Close database connection
    try:
        db = get_database_service()
        await db.close()
    except Exception as e:
        logger.error(f"Error closing database service: {e}")

    # Disconnect cache
    try:
        cache = await get_cache_service()
        await cache.disconnect()
    except Exception as e:
        logger.error(f"Error disconnecting cache: {e}")

    logger.info("FundBrave AI Service shutdown complete")


# ===========================================
# Create FastAPI Application
# ===========================================

app = FastAPI(
    title="FundBrave AI Service",
    description=(
        "AI-powered microservice for FundBrave decentralized fundraising platform. "
        "Provides conversational AI, media verification (deepfake detection), "
        "and multimodal image analysis capabilities."
    ),
    version=__version__,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    openapi_url="/openapi.json" if settings.debug else None,
    lifespan=lifespan,
)

# ===========================================
# Middleware
# ===========================================

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)


@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """Log all HTTP requests with timing."""
    start_time = time.time()

    # Get user ID from auth header if present
    user_id = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        try:
            from jose import jwt

            token = auth_header[7:]
            payload = jwt.decode(
                token,
                settings.jwt_secret,
                algorithms=[settings.jwt_algorithm],
                options={"verify_exp": False},
            )
            user_id = payload.get("sub")
        except Exception:
            pass

    response = await call_next(request)

    duration_ms = (time.time() - start_time) * 1000
    RequestLogger.log_request(
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        duration_ms=duration_ms,
        user_id=user_id,
    )

    return response


# ===========================================
# Exception Handlers
# ===========================================


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle unhandled exceptions."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "internal_server_error",
            "message": "An unexpected error occurred",
            "detail": str(exc) if settings.debug else None,
        },
    )


# ===========================================
# Routes
# ===========================================

# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with service information."""
    return {
        "service": "FundBrave AI Service",
        "version": __version__,
        "status": "running",
        "environment": settings.environment,
        "docs": "/docs" if settings.debug else "disabled",
    }


# Include API router
app.include_router(api_router, prefix="/api")


# ===========================================
# Development Server
# ===========================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    )
