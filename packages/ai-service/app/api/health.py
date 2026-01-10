"""
Health check endpoints for FundBrave AI Service.

Provides endpoints for:
- Basic liveness probe
- Detailed readiness probe with model status
- System metrics
"""

from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.config import settings
from app.models import (
    get_conversational_model,
    get_media_verifier_model,
    get_multimodal_model,
)

router = APIRouter()


class HealthResponse(BaseModel):
    """Health check response schema."""

    status: str
    timestamp: str
    version: str
    environment: str


class ModelStatus(BaseModel):
    """Individual model status."""

    name: str
    is_ready: bool
    model_id: str
    device: str


class DetailedHealthResponse(BaseModel):
    """Detailed health check response with model status."""

    status: str
    timestamp: str
    version: str
    environment: str
    load_models_enabled: bool
    models: list[ModelStatus]
    gpu_available: bool
    gpu_memory: dict[str, Any] | None


class SystemMetrics(BaseModel):
    """System metrics response."""

    cpu_percent: float | None
    memory_used_gb: float | None
    memory_total_gb: float | None
    gpu_memory: dict[str, Any] | None


@router.get(
    "",
    response_model=HealthResponse,
    summary="Basic health check",
    description="Simple liveness probe that returns OK if the service is running.",
)
async def health_check() -> HealthResponse:
    """
    Basic health check endpoint.

    Returns a simple status indicating the service is alive.
    Use this for Kubernetes liveness probes.
    """
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        version="0.1.0",
        environment=settings.environment,
    )


@router.get(
    "/ready",
    response_model=DetailedHealthResponse,
    summary="Readiness check",
    description="Detailed health check including model status. Use for readiness probes.",
)
async def readiness_check() -> DetailedHealthResponse:
    """
    Detailed readiness check endpoint.

    Returns status of all AI models and GPU availability.
    Use this for Kubernetes readiness probes.
    """
    import torch

    # Get model instances (lazy loaded)
    conversational = get_conversational_model()
    media_verifier = get_media_verifier_model()
    multimodal = get_multimodal_model()

    models = [
        ModelStatus(
            name="conversational",
            is_ready=conversational.is_ready,
            model_id=conversational.model_id,
            device=conversational.device,
        ),
        ModelStatus(
            name="media_verifier",
            is_ready=media_verifier.is_ready,
            model_id=media_verifier.model_id,
            device=media_verifier.device,
        ),
        ModelStatus(
            name="multimodal",
            is_ready=multimodal.is_ready,
            model_id=multimodal.model_id,
            device=multimodal.device,
        ),
    ]

    # Check GPU availability and memory
    gpu_available = torch.cuda.is_available()
    gpu_memory = None
    if gpu_available:
        gpu_memory = {
            "allocated_gb": round(torch.cuda.memory_allocated() / (1024**3), 2),
            "reserved_gb": round(torch.cuda.memory_reserved() / (1024**3), 2),
            "total_gb": round(
                torch.cuda.get_device_properties(0).total_memory / (1024**3), 2
            ),
        }

    # Determine overall status
    if settings.load_models:
        all_ready = all(m.is_ready for m in models)
        status = "healthy" if all_ready else "degraded"
    else:
        # In mock mode, we're always healthy
        status = "healthy (mock mode)"

    return DetailedHealthResponse(
        status=status,
        timestamp=datetime.utcnow().isoformat(),
        version="0.1.0",
        environment=settings.environment,
        load_models_enabled=settings.load_models,
        models=models,
        gpu_available=gpu_available,
        gpu_memory=gpu_memory,
    )


@router.get(
    "/metrics",
    response_model=SystemMetrics,
    summary="System metrics",
    description="Returns system resource usage metrics.",
)
async def system_metrics() -> SystemMetrics:
    """
    Get system metrics including CPU, memory, and GPU usage.

    Useful for monitoring and debugging.
    """
    import torch

    cpu_percent = None
    memory_used_gb = None
    memory_total_gb = None

    try:
        import psutil

        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        memory_used_gb = round(memory.used / (1024**3), 2)
        memory_total_gb = round(memory.total / (1024**3), 2)
    except ImportError:
        pass  # psutil not available

    gpu_memory = None
    if torch.cuda.is_available():
        gpu_memory = {
            "allocated_gb": round(torch.cuda.memory_allocated() / (1024**3), 2),
            "reserved_gb": round(torch.cuda.memory_reserved() / (1024**3), 2),
            "total_gb": round(
                torch.cuda.get_device_properties(0).total_memory / (1024**3), 2
            ),
            "device_name": torch.cuda.get_device_name(0),
        }

    return SystemMetrics(
        cpu_percent=cpu_percent,
        memory_used_gb=memory_used_gb,
        memory_total_gb=memory_total_gb,
        gpu_memory=gpu_memory,
    )
