"""
Media verification API endpoints for FundBrave AI Service.

Provides deepfake detection and image verification capabilities:
- Single image verification
- Batch verification
- Campaign image analysis
"""

import time
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from pydantic import BaseModel, Field
from loguru import logger

from app.config import settings
from app.models.media_verifier import get_media_verifier_model, VerificationResult
from app.models.multimodal import get_multimodal_model, ImageAnalysisResult
from app.utils.auth import JWTPayload, get_current_user, get_optional_user
from app.utils.rate_limit import limiter, media_rate_limit

router = APIRouter()


# ===========================================
# Request/Response Models
# ===========================================


class MediaVerificationResponse(BaseModel):
    """Response schema for media verification."""

    is_authentic: bool = Field(
        ...,
        description="Whether the image appears authentic",
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score of the verification",
    )
    requires_review: bool = Field(
        ...,
        description="Whether manual review is recommended",
    )
    analysis: str = Field(
        ...,
        description="Human-readable analysis of the verification",
    )
    details: dict = Field(
        default_factory=dict,
        description="Additional details about the verification",
    )


class BatchVerificationRequest(BaseModel):
    """Request schema for batch verification."""

    campaign_id: str | None = Field(
        default=None,
        description="Optional campaign ID for context",
    )


class BatchVerificationResponse(BaseModel):
    """Response schema for batch verification."""

    total: int = Field(..., description="Total images processed")
    authentic_count: int = Field(..., description="Number of authentic images")
    suspicious_count: int = Field(..., description="Number of suspicious images")
    review_required: int = Field(..., description="Number requiring manual review")
    results: list[MediaVerificationResponse] = Field(
        ...,
        description="Individual verification results",
    )
    processing_time_seconds: float = Field(
        ...,
        description="Total processing time",
    )


class ImageAnalysisResponse(BaseModel):
    """Response schema for image analysis."""

    description: str = Field(..., description="Description of the image content")
    is_appropriate: bool = Field(
        ...,
        description="Whether the image is appropriate for the platform",
    )
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    tags: list[str] = Field(default_factory=list, description="Content tags")
    details: dict = Field(default_factory=dict, description="Additional details")


class CoherenceCheckResponse(BaseModel):
    """Response for image-text coherence verification."""

    is_coherent: bool = Field(
        ...,
        description="Whether the image matches the description",
    )
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    match_score: int = Field(..., ge=0, le=100, description="Match score 0-100")
    analysis: str = Field(..., description="Analysis of the coherence")


# ===========================================
# Allowed file types and size limits
# ===========================================


ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def validate_image_file(file: UploadFile) -> None:
    """
    Validate an uploaded image file.

    Args:
        file: Uploaded file to validate

    Raises:
        HTTPException: If file is invalid
    """
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type: {file.content_type}. "
            f"Allowed types: {', '.join(ALLOWED_IMAGE_TYPES)}",
        )


# ===========================================
# Endpoints
# ===========================================


@router.post(
    "",
    response_model=MediaVerificationResponse,
    summary="Verify media authenticity",
    description="Upload an image to check for deepfakes or manipulation.",
    responses={
        200: {"description": "Verification completed"},
        400: {"description": "Invalid file type or size"},
        401: {"description": "Authentication required"},
        429: {"description": "Rate limit exceeded"},
        500: {"description": "Verification failed"},
    },
)
@limiter.limit(media_rate_limit)
async def verify_media(
    request: Request,
    file: Annotated[UploadFile, File(description="Image file to verify")],
    campaign_id: Annotated[str | None, Form(description="Optional campaign ID")] = None,
    user: Annotated[JWTPayload | None, Depends(get_optional_user)] = None,
) -> MediaVerificationResponse:
    """
    Verify the authenticity of an uploaded image.

    Uses deep learning to detect potential deepfakes or manipulated images.
    Returns a confidence score and detailed analysis.
    """
    start_time = time.time()

    # Validate file
    validate_image_file(file)

    # Read file content
    try:
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE / (1024 * 1024):.1f} MB",
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read file: {str(e)}",
        ) from e

    try:
        # Get the media verifier model
        model = get_media_verifier_model()

        # Verify the image
        result: VerificationResult = await model.verify_image(content)

        processing_time = time.time() - start_time

        user_id = user.user_id if user else "anonymous"
        logger.info(
            f"Media verification completed: authentic={result.is_authentic}, "
            f"confidence={result.confidence:.2%}, user={user_id}, "
            f"campaign={campaign_id}, time={processing_time:.2f}s"
        )

        # Add processing time to details
        result.details["processing_time"] = round(processing_time, 3)
        result.details["file_name"] = file.filename
        result.details["file_size_bytes"] = len(content)

        return MediaVerificationResponse(
            is_authentic=result.is_authentic,
            confidence=result.confidence,
            requires_review=result.requires_review,
            analysis=result.analysis,
            details=result.details,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Media verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Verification failed: {str(e)}",
        ) from e


@router.post(
    "/batch",
    response_model=BatchVerificationResponse,
    summary="Verify multiple images",
    description="Upload multiple images for batch verification.",
)
@limiter.limit("2/minute")  # More restrictive limit for batch
async def verify_batch(
    request: Request,
    files: Annotated[list[UploadFile], File(description="Image files to verify")],
    campaign_id: Annotated[str | None, Form()] = None,
    user: Annotated[JWTPayload, Depends(get_current_user)] = None,
) -> BatchVerificationResponse:
    """
    Verify multiple images in a single request.

    Useful for verifying all images in a campaign at once.
    Limited to 10 images per request.
    """
    start_time = time.time()

    # Limit batch size
    if len(files) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 10 images per batch",
        )

    if len(files) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files provided",
        )

    # Validate all files first
    for file in files:
        validate_image_file(file)

    try:
        model = get_media_verifier_model()
        results = []

        for file in files:
            content = await file.read()

            if len(content) > MAX_FILE_SIZE:
                # Add error result for oversized file
                results.append(
                    MediaVerificationResponse(
                        is_authentic=False,
                        confidence=0.0,
                        requires_review=True,
                        analysis=f"File too large: {file.filename}",
                        details={"error": "file_too_large"},
                    )
                )
                continue

            result = await model.verify_image(content)
            results.append(
                MediaVerificationResponse(
                    is_authentic=result.is_authentic,
                    confidence=result.confidence,
                    requires_review=result.requires_review,
                    analysis=result.analysis,
                    details={**result.details, "file_name": file.filename},
                )
            )

        processing_time = time.time() - start_time

        authentic_count = sum(1 for r in results if r.is_authentic)
        suspicious_count = sum(1 for r in results if not r.is_authentic)
        review_required = sum(1 for r in results if r.requires_review)

        logger.info(
            f"Batch verification completed: {len(results)} images, "
            f"authentic={authentic_count}, suspicious={suspicious_count}, "
            f"user={user.user_id}, time={processing_time:.2f}s"
        )

        return BatchVerificationResponse(
            total=len(results),
            authentic_count=authentic_count,
            suspicious_count=suspicious_count,
            review_required=review_required,
            results=results,
            processing_time_seconds=round(processing_time, 2),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch verification failed: {str(e)}",
        ) from e


@router.post(
    "/analyze",
    response_model=ImageAnalysisResponse,
    summary="Analyze campaign image",
    description="Analyze an image for content and appropriateness.",
)
@limiter.limit(media_rate_limit)
async def analyze_image(
    request: Request,
    file: Annotated[UploadFile, File(description="Image file to analyze")],
    campaign_name: Annotated[str | None, Form()] = None,
    campaign_description: Annotated[str | None, Form()] = None,
    user: Annotated[JWTPayload | None, Depends(get_optional_user)] = None,
) -> ImageAnalysisResponse:
    """
    Analyze a campaign image for content and appropriateness.

    Uses multimodal AI to understand the image content and determine
    if it's appropriate for the fundraising platform.
    """
    validate_image_file(file)

    try:
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File too large",
            )

        model = get_multimodal_model()
        result: ImageAnalysisResult = await model.analyze_campaign_image(
            image=content,
            campaign_name=campaign_name,
            campaign_description=campaign_description,
        )

        return ImageAnalysisResponse(
            description=result.description,
            is_appropriate=result.is_appropriate,
            confidence=result.confidence,
            tags=result.tags,
            details=result.details,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image analysis error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}",
        ) from e


@router.post(
    "/coherence",
    response_model=CoherenceCheckResponse,
    summary="Check image-text coherence",
    description="Verify if an image matches its claimed description.",
)
@limiter.limit(media_rate_limit)
async def check_coherence(
    request: Request,
    file: Annotated[UploadFile, File(description="Image file")],
    description: Annotated[str, Form(description="Claimed description of the image")],
    user: Annotated[JWTPayload | None, Depends(get_optional_user)] = None,
) -> CoherenceCheckResponse:
    """
    Verify if an image matches its claimed description.

    Useful for detecting misrepresentation in campaigns where
    images don't match what they claim to show.
    """
    validate_image_file(file)

    if not description or len(description.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Description must be at least 10 characters",
        )

    try:
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File too large",
            )

        model = get_multimodal_model()
        result = await model.verify_image_text_coherence(
            image=content,
            claimed_description=description,
        )

        return CoherenceCheckResponse(
            is_coherent=result["is_coherent"],
            confidence=result["confidence"],
            match_score=result.get("match_score", int(result["confidence"] * 100)),
            analysis=result["analysis"],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Coherence check error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Coherence check failed: {str(e)}",
        ) from e
