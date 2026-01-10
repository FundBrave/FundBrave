"""
Training API Routes for FundBrave AI Service.

Provides endpoints for LoRA fine-tuning management:
- Start training jobs
- Monitor training progress
- Manage trained adapters
- Create training datasets
"""

import uuid
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from loguru import logger

from app.config import settings
from app.services.training import (
    get_training_service,
    TrainingConfig,
    TrainingExample,
    TrainingProgress,
    TrainingResult,
)
from app.utils.rate_limit import limiter


router = APIRouter(prefix="/training", tags=["Training"])


# ===========================================
# Request/Response Models
# ===========================================


class TrainingConfigRequest(BaseModel):
    """Training configuration request."""

    num_epochs: int = Field(default=3, ge=1, le=100)
    learning_rate: float = Field(default=2e-4, ge=1e-6, le=1e-2)
    batch_size: int = Field(default=4, ge=1, le=64)
    max_seq_length: int = Field(default=2048, ge=256, le=8192)
    lora_r: int = Field(default=16, ge=4, le=128)
    lora_alpha: int = Field(default=32, ge=8, le=256)
    lora_dropout: float = Field(default=0.05, ge=0.0, le=0.5)
    warmup_ratio: float = Field(default=0.1, ge=0.0, le=0.5)
    save_steps: int = Field(default=100, ge=10, le=1000)
    use_4bit: bool = True
    gradient_accumulation_steps: int = Field(default=4, ge=1, le=32)


class StartTrainingRequest(BaseModel):
    """Request to start a training job."""

    dataset_path: str = Field(..., description="Path to training dataset JSONL file")
    config: TrainingConfigRequest | None = None
    base_adapter_path: str | None = Field(
        default=None, description="Path to existing adapter for continued training"
    )


class TrainingExampleRequest(BaseModel):
    """A single training example."""

    instruction: str = Field(..., min_length=1)
    input_text: str = Field(default="")
    output: str = Field(..., min_length=1)
    system_prompt: str | None = None


class CreateDatasetRequest(BaseModel):
    """Request to create a training dataset."""

    examples: list[TrainingExampleRequest] = Field(..., min_length=1)
    output_filename: str = Field(default="custom_training_data.jsonl")
    include_fundbrave_data: bool = Field(
        default=True, description="Include FundBrave-specific training data"
    )


class TrainingJobResponse(BaseModel):
    """Response for training job operations."""

    job_id: str
    status: str
    message: str
    adapter_path: str | None = None


class TrainingProgressResponse(BaseModel):
    """Response for training progress."""

    job_id: str
    status: str
    current_step: int
    total_steps: int
    current_epoch: int
    total_epochs: int
    loss: float | None
    learning_rate: float | None
    progress_percent: float
    eta_seconds: float | None
    message: str


class AdapterInfoResponse(BaseModel):
    """Information about a trained adapter."""

    adapter_path: str
    exists: bool
    size_mb: float | None
    created_at: str | None
    config: dict[str, Any] | None


# ===========================================
# Training Job Storage (In-memory for simplicity)
# ===========================================


_training_jobs: dict[str, dict[str, Any]] = {}


# ===========================================
# Endpoints
# ===========================================


@router.post("/start", response_model=TrainingJobResponse)
@limiter.limit("2/hour")
async def start_training(
    request: StartTrainingRequest,
    background_tasks: BackgroundTasks,
):
    """
    Start a new LoRA fine-tuning job.

    This endpoint starts training in the background and returns immediately
    with a job ID that can be used to monitor progress.
    """
    service = get_training_service()

    # Validate dataset path
    dataset_path = Path(request.dataset_path)
    if not dataset_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset file not found: {request.dataset_path}",
        )

    # Generate job ID
    job_id = f"train_{uuid.uuid4().hex[:12]}"

    # Convert config
    config = None
    if request.config:
        config = TrainingConfig(
            num_epochs=request.config.num_epochs,
            learning_rate=request.config.learning_rate,
            batch_size=request.config.batch_size,
            max_seq_length=request.config.max_seq_length,
            lora_r=request.config.lora_r,
            lora_alpha=request.config.lora_alpha,
            lora_dropout=request.config.lora_dropout,
            warmup_ratio=request.config.warmup_ratio,
            save_steps=request.config.save_steps,
            use_4bit=request.config.use_4bit,
            gradient_accumulation_steps=request.config.gradient_accumulation_steps,
        )

    # Base adapter path
    base_adapter = Path(request.base_adapter_path) if request.base_adapter_path else None

    # Initialize job tracking
    _training_jobs[job_id] = {
        "status": "starting",
        "progress": None,
        "result": None,
        "error": None,
    }

    # Start training in background
    async def run_training():
        try:
            _training_jobs[job_id]["status"] = "running"
            async for progress in service.start_training(
                job_id=job_id,
                dataset_path=dataset_path,
                config=config,
                base_adapter_path=base_adapter,
            ):
                _training_jobs[job_id]["progress"] = progress
                if progress.status == "completed":
                    _training_jobs[job_id]["status"] = "completed"
                    _training_jobs[job_id]["result"] = {
                        "adapter_path": str(progress.adapter_path),
                        "final_loss": progress.loss,
                    }
                elif progress.status == "failed":
                    _training_jobs[job_id]["status"] = "failed"
                    _training_jobs[job_id]["error"] = progress.message
        except Exception as e:
            logger.error(f"Training job {job_id} failed: {e}")
            _training_jobs[job_id]["status"] = "failed"
            _training_jobs[job_id]["error"] = str(e)

    background_tasks.add_task(run_training)

    return TrainingJobResponse(
        job_id=job_id,
        status="started",
        message="Training job started. Use GET /training/status/{job_id} to monitor progress.",
    )


@router.get("/status/{job_id}", response_model=TrainingProgressResponse)
async def get_training_status(job_id: str):
    """Get the status and progress of a training job."""
    if job_id not in _training_jobs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Training job not found: {job_id}",
        )

    job = _training_jobs[job_id]
    progress = job.get("progress")

    if progress is None:
        return TrainingProgressResponse(
            job_id=job_id,
            status=job["status"],
            current_step=0,
            total_steps=0,
            current_epoch=0,
            total_epochs=0,
            loss=None,
            learning_rate=None,
            progress_percent=0.0,
            eta_seconds=None,
            message=job.get("error") or "Initializing...",
        )

    return TrainingProgressResponse(
        job_id=job_id,
        status=progress.status,
        current_step=progress.current_step,
        total_steps=progress.total_steps,
        current_epoch=progress.current_epoch,
        total_epochs=progress.total_epochs,
        loss=progress.loss,
        learning_rate=progress.learning_rate,
        progress_percent=progress.progress_percent,
        eta_seconds=progress.eta_seconds,
        message=progress.message,
    )


@router.get("/jobs", response_model=list[dict[str, Any]])
async def list_training_jobs():
    """List all training jobs."""
    jobs = []
    for job_id, job_data in _training_jobs.items():
        progress = job_data.get("progress")
        jobs.append({
            "job_id": job_id,
            "status": job_data["status"],
            "progress_percent": progress.progress_percent if progress else 0.0,
            "error": job_data.get("error"),
        })
    return jobs


@router.delete("/jobs/{job_id}")
async def cancel_training_job(job_id: str):
    """Cancel a training job."""
    if job_id not in _training_jobs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Training job not found: {job_id}",
        )

    job = _training_jobs[job_id]
    if job["status"] == "running":
        # Note: Actually cancelling requires more complex logic
        # This is a simplified version
        job["status"] = "cancelled"
        return {"message": f"Training job {job_id} cancelled"}
    else:
        return {"message": f"Training job {job_id} is not running (status: {job['status']})"}


@router.post("/dataset/create", response_model=dict[str, Any])
@limiter.limit("10/hour")
async def create_training_dataset(request: CreateDatasetRequest):
    """
    Create a training dataset file from examples.

    Optionally includes FundBrave-specific training data.
    """
    service = get_training_service()

    # Convert examples
    examples = [
        TrainingExample(
            instruction=ex.instruction,
            input_text=ex.input_text,
            output=ex.output,
            system_prompt=ex.system_prompt,
        )
        for ex in request.examples
    ]

    # Add FundBrave data if requested
    if request.include_fundbrave_data:
        fundbrave_examples = service.create_fundbrave_training_data()
        examples.extend(fundbrave_examples)

    # Create dataset
    output_path = settings.training_data_dir / request.output_filename
    count = await service.create_training_dataset(examples, output_path)

    return {
        "success": True,
        "output_path": str(output_path),
        "total_examples": count,
        "custom_examples": len(request.examples),
        "fundbrave_examples": count - len(request.examples) if request.include_fundbrave_data else 0,
    }


@router.get("/dataset/fundbrave", response_model=dict[str, Any])
async def get_fundbrave_training_data():
    """Get the default FundBrave training data."""
    service = get_training_service()
    examples = service.create_fundbrave_training_data()

    return {
        "count": len(examples),
        "examples": [
            {
                "instruction": ex.instruction[:100] + "..." if len(ex.instruction) > 100 else ex.instruction,
                "output_preview": ex.output[:100] + "..." if len(ex.output) > 100 else ex.output,
            }
            for ex in examples[:10]  # Return first 10 as preview
        ],
    }


@router.get("/adapters", response_model=list[AdapterInfoResponse])
async def list_adapters():
    """List all trained LoRA adapters."""
    adapters_dir = settings.lora_adapter_dir
    adapters = []

    if adapters_dir.exists():
        for adapter_path in adapters_dir.iterdir():
            if adapter_path.is_dir():
                # Check for adapter files
                adapter_config = adapter_path / "adapter_config.json"
                if adapter_config.exists():
                    import json
                    import os
                    from datetime import datetime

                    # Get size
                    total_size = sum(
                        f.stat().st_size
                        for f in adapter_path.rglob("*")
                        if f.is_file()
                    )

                    # Get creation time
                    created_at = datetime.fromtimestamp(
                        adapter_path.stat().st_ctime
                    ).isoformat()

                    # Read config
                    try:
                        with open(adapter_config) as f:
                            config = json.load(f)
                    except Exception:
                        config = None

                    adapters.append(
                        AdapterInfoResponse(
                            adapter_path=str(adapter_path),
                            exists=True,
                            size_mb=total_size / (1024 * 1024),
                            created_at=created_at,
                            config=config,
                        )
                    )

    return adapters


@router.get("/adapters/{adapter_name}", response_model=AdapterInfoResponse)
async def get_adapter_info(adapter_name: str):
    """Get information about a specific adapter."""
    adapter_path = settings.lora_adapter_dir / adapter_name

    if not adapter_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Adapter not found: {adapter_name}",
        )

    adapter_config = adapter_path / "adapter_config.json"

    if not adapter_config.exists():
        return AdapterInfoResponse(
            adapter_path=str(adapter_path),
            exists=True,
            size_mb=None,
            created_at=None,
            config=None,
        )

    import json
    from datetime import datetime

    # Get size
    total_size = sum(
        f.stat().st_size for f in adapter_path.rglob("*") if f.is_file()
    )

    # Get creation time
    created_at = datetime.fromtimestamp(adapter_path.stat().st_ctime).isoformat()

    # Read config
    try:
        with open(adapter_config) as f:
            config = json.load(f)
    except Exception:
        config = None

    return AdapterInfoResponse(
        adapter_path=str(adapter_path),
        exists=True,
        size_mb=total_size / (1024 * 1024),
        created_at=created_at,
        config=config,
    )


@router.delete("/adapters/{adapter_name}")
async def delete_adapter(adapter_name: str):
    """Delete a trained adapter."""
    adapter_path = settings.lora_adapter_dir / adapter_name

    if not adapter_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Adapter not found: {adapter_name}",
        )

    import shutil

    try:
        shutil.rmtree(adapter_path)
        return {"message": f"Adapter {adapter_name} deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete adapter: {e}",
        )


@router.post("/adapters/{adapter_name}/activate")
async def activate_adapter(adapter_name: str):
    """
    Activate a trained adapter for inference.

    This loads the adapter into the model for use in chat responses.
    """
    service = get_training_service()
    adapter_path = settings.lora_adapter_dir / adapter_name

    if not adapter_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Adapter not found: {adapter_name}",
        )

    try:
        success = await service.load_adapter(adapter_path)
        if success:
            return {"message": f"Adapter {adapter_name} activated successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to activate adapter",
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to activate adapter: {e}",
        )


@router.post("/adapters/deactivate")
async def deactivate_adapter():
    """
    Deactivate the current adapter and return to base model.
    """
    service = get_training_service()

    try:
        success = await service.unload_adapter()
        if success:
            return {"message": "Adapter deactivated, using base model"}
        else:
            return {"message": "No adapter was active"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to deactivate adapter: {e}",
        )
