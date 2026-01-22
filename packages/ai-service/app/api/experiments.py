"""
A/B Testing (Experiments) API Routes for FundBrave AI Service.

Provides endpoints for experiment management:
- Create and manage experiments
- Get variant assignments for users
- Record conversions
- View experiment results and statistics
"""

from typing import Any

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, Field
from loguru import logger

from app.services.ab_testing import (
    get_ab_testing_service,
    ExperimentStatus,
)
from app.utils.rate_limit import limiter


router = APIRouter(prefix="/experiments", tags=["A/B Testing"])


# ===========================================
# Request/Response Models
# ===========================================


class VariantConfig(BaseModel):
    """Configuration for an experiment variant."""

    name: str = Field(..., min_length=1, max_length=50)
    weight: float = Field(default=1.0, ge=0.0, le=1.0)
    config: dict[str, Any] = Field(default_factory=dict)


class CreateExperimentRequest(BaseModel):
    """Request to create a new experiment."""

    experiment_id: str = Field(..., min_length=1, max_length=100, pattern=r"^[a-z0-9_]+$")
    name: str = Field(..., min_length=1, max_length=200)
    description: str = Field(default="")
    variants: list[VariantConfig] = Field(..., min_length=2)
    target_sample_size: int = Field(default=1000, ge=100, le=1000000)
    target_feature: str = Field(default="default")


class GetVariantRequest(BaseModel):
    """Request to get variant assignment for a user."""

    experiment_id: str
    user_id: str


class RecordConversionRequest(BaseModel):
    """Request to record a conversion."""

    experiment_id: str
    user_id: str
    value: float = Field(default=1.0, ge=0.0)
    metadata: dict[str, Any] | None = None


class ExperimentResponse(BaseModel):
    """Response with experiment information."""

    id: str
    name: str
    description: str
    status: str
    variants: list[dict[str, Any]]
    total_impressions: int
    target_sample_size: int
    target_feature: str
    is_significant: bool
    created_at: str
    started_at: str | None
    ended_at: str | None


class VariantAssignmentResponse(BaseModel):
    """Response with variant assignment."""

    experiment_id: str
    user_id: str
    variant_name: str
    variant_config: dict[str, Any]


class ExperimentResultResponse(BaseModel):
    """Response with experiment results."""

    experiment_id: str
    winner: str | None
    confidence: float
    lift: float
    variants: list[dict[str, Any]]
    is_significant: bool
    recommendation: str


# ===========================================
# Endpoints
# ===========================================


@router.post("/create", response_model=ExperimentResponse)
@limiter.limit("20/hour")
async def create_experiment(request: Request, body: CreateExperimentRequest):
    """
    Create a new A/B test experiment.

    Experiments must have at least 2 variants. The first variant is
    typically the control group.
    """
    service = get_ab_testing_service()

    # Check if experiment already exists
    existing = service._experiments.get(body.experiment_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Experiment with ID '{body.experiment_id}' already exists",
        )

    # Create experiment
    variants = [
        {"name": v.name, "weight": v.weight, "config": v.config}
        for v in body.variants
    ]

    experiment = service.create_experiment(
        experiment_id=body.experiment_id,
        name=body.name,
        description=body.description,
        variants=variants,
        target_sample_size=body.target_sample_size,
        target_feature=body.target_feature,
    )

    return ExperimentResponse(
        id=experiment.id,
        name=experiment.name,
        description=experiment.description,
        status=experiment.status.value,
        variants=[
            {
                "name": v.name,
                "weight": v.weight,
                "config": v.config,
                "impressions": v.impressions,
                "conversions": v.conversions,
                "conversion_rate": v.conversion_rate,
            }
            for v in experiment.variants
        ],
        total_impressions=experiment.total_impressions,
        target_sample_size=experiment.target_sample_size,
        target_feature=experiment.target_feature,
        is_significant=experiment.is_significant,
        created_at=experiment.created_at.isoformat(),
        started_at=experiment.started_at.isoformat() if experiment.started_at else None,
        ended_at=experiment.ended_at.isoformat() if experiment.ended_at else None,
    )


@router.get("/list", response_model=list[dict[str, Any]])
async def list_experiments():
    """List all experiments."""
    service = get_ab_testing_service()
    return service.get_all_experiments()


@router.get("/{experiment_id}", response_model=ExperimentResponse)
async def get_experiment(experiment_id: str):
    """Get details of a specific experiment."""
    service = get_ab_testing_service()

    if experiment_id not in service._experiments:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment not found: {experiment_id}",
        )

    experiment = service._experiments[experiment_id]

    return ExperimentResponse(
        id=experiment.id,
        name=experiment.name,
        description=experiment.description,
        status=experiment.status.value,
        variants=[
            {
                "name": v.name,
                "weight": v.weight,
                "config": v.config,
                "impressions": v.impressions,
                "conversions": v.conversions,
                "conversion_rate": v.conversion_rate,
            }
            for v in experiment.variants
        ],
        total_impressions=experiment.total_impressions,
        target_sample_size=experiment.target_sample_size,
        target_feature=experiment.target_feature,
        is_significant=experiment.is_significant,
        created_at=experiment.created_at.isoformat(),
        started_at=experiment.started_at.isoformat() if experiment.started_at else None,
        ended_at=experiment.ended_at.isoformat() if experiment.ended_at else None,
    )


@router.post("/{experiment_id}/start")
async def start_experiment(experiment_id: str):
    """Start an experiment (begin collecting data)."""
    service = get_ab_testing_service()

    if experiment_id not in service._experiments:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment not found: {experiment_id}",
        )

    experiment = service._experiments[experiment_id]
    if experiment.status == ExperimentStatus.RUNNING:
        return {"message": f"Experiment {experiment_id} is already running"}

    success = service.start_experiment(experiment_id)
    if success:
        return {"message": f"Experiment {experiment_id} started successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start experiment",
        )


@router.post("/{experiment_id}/stop")
async def stop_experiment(experiment_id: str):
    """Stop an experiment (mark as completed)."""
    service = get_ab_testing_service()

    if experiment_id not in service._experiments:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment not found: {experiment_id}",
        )

    success = service.stop_experiment(experiment_id)
    if success:
        return {"message": f"Experiment {experiment_id} stopped successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to stop experiment",
        )


@router.delete("/{experiment_id}")
async def delete_experiment(experiment_id: str):
    """Delete an experiment."""
    service = get_ab_testing_service()

    if experiment_id not in service._experiments:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment not found: {experiment_id}",
        )

    success = service.delete_experiment(experiment_id)
    if success:
        return {"message": f"Experiment {experiment_id} deleted successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete experiment",
        )


@router.post("/variant", response_model=VariantAssignmentResponse)
@limiter.limit("1000/minute")
async def get_variant(request: Request, body: GetVariantRequest):
    """
    Get the variant assignment for a user in an experiment.

    This endpoint uses consistent hashing to ensure the same user
    always gets the same variant. It also records an impression.
    """
    service = get_ab_testing_service()

    if body.experiment_id not in service._experiments:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment not found: {body.experiment_id}",
        )

    variant_name, variant_config = service.get_variant(
        experiment_id=body.experiment_id,
        user_id=body.user_id,
    )

    return VariantAssignmentResponse(
        experiment_id=body.experiment_id,
        user_id=body.user_id,
        variant_name=variant_name,
        variant_config=variant_config,
    )


@router.post("/conversion")
@limiter.limit("1000/minute")
async def record_conversion(request: Request, body: RecordConversionRequest):
    """
    Record a conversion for a user in an experiment.

    The user must have been assigned a variant before recording a conversion.
    """
    service = get_ab_testing_service()

    if body.experiment_id not in service._experiments:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment not found: {body.experiment_id}",
        )

    success = service.record_conversion(
        experiment_id=body.experiment_id,
        user_id=body.user_id,
        value=body.value,
        metadata=body.metadata,
    )

    if success:
        return {"message": "Conversion recorded successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User has not been assigned a variant in this experiment",
        )


@router.get("/{experiment_id}/results", response_model=ExperimentResultResponse)
async def get_experiment_results(experiment_id: str):
    """
    Get statistical results for an experiment.

    Returns winner (if determined), confidence level, lift percentage,
    and recommendations based on the data collected.
    """
    service = get_ab_testing_service()

    if experiment_id not in service._experiments:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment not found: {experiment_id}",
        )

    result = service.get_experiment_results(experiment_id)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to calculate experiment results",
        )

    return ExperimentResultResponse(
        experiment_id=result.experiment_id,
        winner=result.winner,
        confidence=result.confidence,
        lift=result.lift,
        variants=result.variants,
        is_significant=result.is_significant,
        recommendation=result.recommendation,
    )


@router.post("/ai/create-defaults")
@limiter.limit("5/hour")
async def create_default_ai_experiments(request: Request):
    """
    Create default AI-related experiments.

    Creates pre-configured experiments for testing:
    - Response length (short vs long)
    - RAG enhancement (with vs without)
    - Temperature settings (conservative vs balanced vs creative)
    """
    service = get_ab_testing_service()

    try:
        experiments = await service.create_ai_experiments()
        return {
            "message": f"Created {len(experiments)} default AI experiments",
            "experiments": experiments,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create default experiments: {e}",
        )


@router.get("/ai/experiments", response_model=list[dict[str, Any]])
async def list_ai_experiments():
    """
    List AI-specific experiments.

    Returns only experiments that target AI features.
    """
    service = get_ab_testing_service()

    ai_experiments = []
    for exp in service._experiments.values():
        if exp.target_feature in ["chat_response", "rag", "model_selection"]:
            ai_experiments.append({
                "id": exp.id,
                "name": exp.name,
                "status": exp.status.value,
                "total_impressions": exp.total_impressions,
                "is_significant": exp.is_significant,
                "target_feature": exp.target_feature,
            })

    return ai_experiments


@router.get("/user/{user_id}/assignments", response_model=dict[str, str])
async def get_user_assignments(user_id: str):
    """
    Get all experiment variant assignments for a user.

    Returns a mapping of experiment_id to variant_name.
    """
    service = get_ab_testing_service()

    assignments = service._user_assignments.get(user_id, {})

    return assignments


@router.post("/bulk-variant")
@limiter.limit("100/minute")
async def get_bulk_variants(request: Request, body: list[GetVariantRequest]):
    """
    Get variant assignments for multiple experiment/user combinations.

    More efficient than multiple single calls.
    """
    service = get_ab_testing_service()

    results = []
    for req in body:
        if req.experiment_id not in service._experiments:
            results.append({
                "experiment_id": req.experiment_id,
                "user_id": req.user_id,
                "error": "Experiment not found",
            })
            continue

        variant_name, variant_config = service.get_variant(
            experiment_id=req.experiment_id,
            user_id=req.user_id,
        )

        results.append({
            "experiment_id": req.experiment_id,
            "user_id": req.user_id,
            "variant_name": variant_name,
            "variant_config": variant_config,
        })

    return results


@router.get("/stats/summary")
async def get_experiments_summary():
    """Get a summary of all experiments and their status."""
    service = get_ab_testing_service()

    summary = {
        "total_experiments": len(service._experiments),
        "by_status": {},
        "total_impressions": 0,
        "total_conversions": 0,
        "significant_experiments": 0,
    }

    for exp in service._experiments.values():
        status_value = exp.status.value
        summary["by_status"][status_value] = summary["by_status"].get(status_value, 0) + 1
        summary["total_impressions"] += exp.total_impressions

        for v in exp.variants:
            summary["total_conversions"] += v.conversions

        if exp.is_significant:
            summary["significant_experiments"] += 1

    return summary
