"""
API routes for FundBrave AI Service.

Provides REST endpoints for:
- Chat: Conversational AI interactions
- Media: Image/video verification
- Health: Service health checks
- Advanced: RAG, recommendations, analytics, moderation, etc.
- Training: LoRA fine-tuning management
- Experiments: A/B testing management
"""

from fastapi import APIRouter

from app.api.chat import router as chat_router
from app.api.media import router as media_router
from app.api.health import router as health_router
from app.api.advanced import router as advanced_router
from app.api.training import router as training_router
from app.api.experiments import router as experiments_router

# Main API router that combines all sub-routers
api_router = APIRouter()

# Include sub-routers with appropriate prefixes
api_router.include_router(
    health_router,
    prefix="/health",
    tags=["Health"],
)

api_router.include_router(
    chat_router,
    prefix="/chat",
    tags=["Chat"],
)

api_router.include_router(
    media_router,
    prefix="/verify-media",
    tags=["Media Verification"],
)

api_router.include_router(
    advanced_router,
    prefix="/advanced",
    tags=["Advanced Features"],
)

api_router.include_router(
    training_router,
    prefix="/training",
    tags=["Training"],
)

api_router.include_router(
    experiments_router,
    prefix="/experiments",
    tags=["A/B Testing"],
)

__all__ = ["api_router"]
