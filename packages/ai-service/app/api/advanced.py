"""
Advanced API endpoints for FundBrave AI Service.

Provides endpoints for:
- RAG queries
- Web search
- Campaign recommendations
- Fraud detection
- Moderation
- Analytics
- A/B testing
- Safety checks
"""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from loguru import logger

from app.utils.auth import JWTPayload, get_current_user, get_optional_user
from app.utils.rate_limit import limiter

router = APIRouter()


# ===========================================
# Request/Response Models
# ===========================================


class RAGQueryRequest(BaseModel):
    """Request for RAG query."""

    query: str = Field(..., min_length=3, max_length=2000)
    filter_category: str | None = None
    top_k: int = Field(default=5, ge=1, le=20)


class RAGQueryResponse(BaseModel):
    """Response from RAG query."""

    answer: str
    sources: list[dict]
    confidence: float
    context_used: bool


class SearchRequest(BaseModel):
    """Request for web search."""

    query: str = Field(..., min_length=3, max_length=500)
    num_results: int = Field(default=5, ge=1, le=10)
    include_summary: bool = False


class SearchResponse(BaseModel):
    """Response from web search."""

    query: str
    results: list[dict]
    summary: str | None = None
    search_source: str


class RecommendationRequest(BaseModel):
    """Request for campaign recommendations."""

    user_id: str | None = None
    campaign_id: str | None = None
    category: str | None = None
    limit: int = Field(default=10, ge=1, le=50)
    recommendation_type: str = Field(
        default="personalized",
        pattern="^(personalized|similar|trending|category)$"
    )


class RecommendationResponse(BaseModel):
    """Response with campaign recommendations."""

    recommendations: list[dict]
    recommendation_type: str
    total: int


class FraudCheckRequest(BaseModel):
    """Request for fraud analysis."""

    campaign_id: str
    name: str
    description: str
    creator_id: str
    goal_amount: float
    category: str


class FraudCheckResponse(BaseModel):
    """Response from fraud analysis."""

    campaign_id: str
    risk_score: float
    risk_level: str
    requires_review: bool
    indicators: list[dict]
    recommendations: list[str]


class ModerationRequest(BaseModel):
    """Request for content moderation."""

    content: str = Field(..., min_length=1, max_length=10000)
    content_type: str = Field(
        default="user_message",
        pattern="^(campaign_title|campaign_description|comment|user_message|update)$"
    )
    content_id: str | None = None


class ModerationResponse(BaseModel):
    """Response from content moderation."""

    content_id: str
    is_safe: bool
    action: str
    overall_score: float
    categories: list[dict]
    reasons: list[str]
    suggestions: list[str]


class SafetyCheckRequest(BaseModel):
    """Request for safety check."""

    content: str = Field(..., min_length=1, max_length=10000)
    check_type: str = Field(default="input", pattern="^(input|output)$")


class SafetyCheckResponse(BaseModel):
    """Response from safety check."""

    is_safe: bool
    action: str
    risk_score: float
    violations: list[dict]
    recommendations: list[str]
    modified_content: str | None = None


class AnalyticsRequest(BaseModel):
    """Request for analytics."""

    campaign_id: str | None = None
    start_date: str | None = None
    end_date: str | None = None


class TranslationRequest(BaseModel):
    """Request for translation."""

    text: str = Field(..., min_length=1, max_length=5000)
    target_language: str = Field(..., min_length=2, max_length=10)
    source_language: str | None = None


class TranslationResponse(BaseModel):
    """Response from translation."""

    original_text: str
    translated_text: str
    source_language: str
    target_language: str
    confidence: float


# ===========================================
# RAG Endpoints
# ===========================================


@router.post(
    "/rag/query",
    response_model=RAGQueryResponse,
    summary="Query with RAG enhancement",
    description="Query the knowledge base using RAG for enhanced responses.",
)
@limiter.limit("20/minute")
async def rag_query(
    request: Request,
    body: RAGQueryRequest,
    user: Annotated[JWTPayload | None, Depends(get_optional_user)],
) -> RAGQueryResponse:
    """Query with RAG enhancement."""
    from app.services.rag import get_rag_service

    try:
        rag = await get_rag_service()

        filter_metadata = None
        if body.filter_category:
            filter_metadata = {"category": body.filter_category}

        result = await rag.generate_with_rag(
            body.query,
            filter_metadata=filter_metadata,
        )

        return RAGQueryResponse(
            answer=result.answer,
            sources=[
                {
                    "content": s.content[:200],
                    "metadata": s.metadata,
                    "similarity": s.similarity_score,
                }
                for s in result.sources
            ],
            confidence=result.confidence,
            context_used=result.context_used,
        )

    except Exception as e:
        logger.error(f"RAG query error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"RAG query failed: {str(e)}",
        )


@router.post(
    "/rag/index",
    summary="Index knowledge documents",
    description="Index documents into the RAG knowledge base.",
)
@limiter.limit("5/minute")
async def rag_index(
    request: Request,
    user: Annotated[JWTPayload, Depends(get_current_user)],
) -> dict:
    """Index FundBrave knowledge base."""
    from app.services.rag import get_rag_service

    try:
        rag = await get_rag_service()
        chunks_added = await rag.index_fundbrave_knowledge()

        return {
            "status": "success",
            "chunks_indexed": chunks_added,
        }

    except Exception as e:
        logger.error(f"RAG indexing error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Indexing failed: {str(e)}",
        )


# ===========================================
# Web Search Endpoints
# ===========================================


@router.post(
    "/search",
    response_model=SearchResponse,
    summary="Web search",
    description="Search the web for relevant information.",
)
@limiter.limit("10/minute")
async def web_search(
    request: Request,
    body: SearchRequest,
    user: Annotated[JWTPayload | None, Depends(get_optional_user)],
) -> SearchResponse:
    """Perform web search."""
    from app.services.web_search import get_web_search_service

    try:
        search = await get_web_search_service()

        if body.include_summary:
            result = await search.search_and_summarize(body.query)
            return SearchResponse(
                query=body.query,
                results=result["results"],
                summary=result["summary"],
                search_source=result["search_source"],
            )
        else:
            result = await search.search(body.query, body.num_results)
            return SearchResponse(
                query=body.query,
                results=[
                    {
                        "title": r.title,
                        "url": r.url,
                        "snippet": r.snippet,
                        "source": r.source,
                    }
                    for r in result.results
                ],
                summary=None,
                search_source=result.source,
            )

    except Exception as e:
        logger.error(f"Web search error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}",
        )


# ===========================================
# Recommendation Endpoints
# ===========================================


@router.post(
    "/recommendations",
    response_model=RecommendationResponse,
    summary="Get campaign recommendations",
    description="Get personalized campaign recommendations.",
)
@limiter.limit("30/minute")
async def get_recommendations(
    request: Request,
    body: RecommendationRequest,
    user: Annotated[JWTPayload | None, Depends(get_optional_user)],
) -> RecommendationResponse:
    """Get campaign recommendations."""
    from app.services.recommendations import get_recommendation_engine
    from app.services.database import get_database_service

    try:
        engine = get_recommendation_engine()
        db = get_database_service()

        # Get campaigns from database
        campaigns_data = await db.search_campaigns("", limit=100)

        # Convert to Campaign objects
        from app.services.recommendations import Campaign
        from datetime import datetime

        campaigns = [
            Campaign(
                id=c["id"],
                name=c["name"],
                description=c.get("description", ""),
                category="general",
                goal_amount=c.get("goal_amount", 0),
                raised_amount=c.get("raised_amount", 0),
                creator_id="unknown",
                created_at=datetime.utcnow(),
            )
            for c in campaigns_data
        ]

        user_id = user.user_id if user else body.user_id

        # Get recommendations based on type
        if body.recommendation_type == "similar" and body.campaign_id:
            recs = await engine.get_similar_campaigns(body.campaign_id, campaigns, body.limit)
        elif body.recommendation_type == "trending":
            recs = await engine.get_trending_campaigns(campaigns, body.limit)
        elif body.recommendation_type == "category" and body.category:
            recs = await engine.get_category_recommendations(body.category, campaigns, body.limit)
        else:
            recs = await engine.get_personalized_recommendations(
                user_id or "anonymous", campaigns, body.limit
            )

        return RecommendationResponse(
            recommendations=[
                {
                    "campaign_id": r.campaign.id,
                    "campaign_name": r.campaign.name,
                    "score": r.score,
                    "reason": r.reason,
                    "type": r.recommendation_type,
                }
                for r in recs
            ],
            recommendation_type=body.recommendation_type,
            total=len(recs),
        )

    except Exception as e:
        logger.error(f"Recommendation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recommendations failed: {str(e)}",
        )


# ===========================================
# Fraud Detection Endpoints
# ===========================================


@router.post(
    "/fraud/analyze",
    response_model=FraudCheckResponse,
    summary="Analyze campaign for fraud",
    description="Analyze a campaign for potential fraud indicators.",
)
@limiter.limit("10/minute")
async def analyze_fraud(
    request: Request,
    body: FraudCheckRequest,
    user: Annotated[JWTPayload, Depends(get_current_user)],
) -> FraudCheckResponse:
    """Analyze campaign for fraud."""
    from app.services.fraud_detection import get_fraud_detection_service

    try:
        fraud_service = get_fraud_detection_service()

        result = await fraud_service.analyze_campaign(
            campaign_id=body.campaign_id,
            name=body.name,
            description=body.description,
            creator_id=body.creator_id,
            goal_amount=body.goal_amount,
            category=body.category,
        )

        return FraudCheckResponse(
            campaign_id=result.campaign_id,
            risk_score=result.risk_score,
            risk_level=result.risk_level,
            requires_review=result.requires_review,
            indicators=[
                {
                    "type": i.indicator_type,
                    "severity": i.severity,
                    "description": i.description,
                    "score": i.score,
                }
                for i in result.indicators
            ],
            recommendations=result.recommendations,
        )

    except Exception as e:
        logger.error(f"Fraud analysis error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fraud analysis failed: {str(e)}",
        )


# ===========================================
# Moderation Endpoints
# ===========================================


@router.post(
    "/moderate",
    response_model=ModerationResponse,
    summary="Moderate content",
    description="Check content for policy violations.",
)
@limiter.limit("30/minute")
async def moderate_content(
    request: Request,
    body: ModerationRequest,
    user: Annotated[JWTPayload | None, Depends(get_optional_user)],
) -> ModerationResponse:
    """Moderate content."""
    from app.services.moderation import get_moderation_service, ContentType

    try:
        mod_service = get_moderation_service()

        content_type = ContentType(body.content_type)

        result = await mod_service.moderate_content(
            content=body.content,
            content_type=content_type,
            content_id=body.content_id,
        )

        return ModerationResponse(
            content_id=result.content_id,
            is_safe=result.is_safe,
            action=result.action.value,
            overall_score=result.overall_score,
            categories=[
                {
                    "category": c.category,
                    "score": c.score,
                    "threshold": c.threshold,
                    "triggered": c.triggered,
                }
                for c in result.categories
            ],
            reasons=result.reasons,
            suggestions=result.suggestions,
        )

    except Exception as e:
        logger.error(f"Moderation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Moderation failed: {str(e)}",
        )


# ===========================================
# Safety Endpoints
# ===========================================


@router.post(
    "/safety/check",
    response_model=SafetyCheckResponse,
    summary="Safety check",
    description="Check content for safety violations.",
)
@limiter.limit("50/minute")
async def safety_check(
    request: Request,
    body: SafetyCheckRequest,
    user: Annotated[JWTPayload | None, Depends(get_optional_user)],
) -> SafetyCheckResponse:
    """Check content safety."""
    from app.services.safety import get_safety_service

    try:
        safety = get_safety_service()

        if body.check_type == "input":
            result = await safety.check_input(body.content)
        else:
            result = await safety.check_output(body.content)

        return SafetyCheckResponse(
            is_safe=result.is_safe,
            action=result.action.value,
            risk_score=result.overall_risk_score,
            violations=[
                {
                    "category": v.category.value,
                    "severity": v.severity,
                    "description": v.description,
                }
                for v in result.violations
            ],
            recommendations=result.recommendations,
            modified_content=result.modified_content,
        )

    except Exception as e:
        logger.error(f"Safety check error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Safety check failed: {str(e)}",
        )


# ===========================================
# Analytics Endpoints
# ===========================================


@router.get(
    "/analytics/campaign/{campaign_id}",
    summary="Get campaign analytics",
    description="Get analytics for a specific campaign.",
)
@limiter.limit("20/minute")
async def get_campaign_analytics(
    request: Request,
    campaign_id: str,
    user: Annotated[JWTPayload, Depends(get_current_user)],
) -> dict:
    """Get campaign analytics."""
    from app.services.analytics import get_analytics_service

    try:
        analytics = get_analytics_service()

        metrics = await analytics.get_campaign_analytics(campaign_id)
        insights = await analytics.generate_campaign_insights(campaign_id, metrics)

        return {
            "campaign_id": campaign_id,
            "metrics": {
                "views": metrics.views,
                "unique_visitors": metrics.unique_visitors,
                "donations_count": metrics.donations_count,
                "total_raised": metrics.total_raised,
                "conversion_rate": metrics.conversion_rate,
                "share_count": metrics.share_count,
                "comment_count": metrics.comment_count,
            },
            "insights": [
                {
                    "type": i.insight_type,
                    "title": i.title,
                    "description": i.description,
                    "importance": i.importance,
                    "recommendations": i.recommendations,
                }
                for i in insights
            ],
        }

    except Exception as e:
        logger.error(f"Analytics error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analytics failed: {str(e)}",
        )


@router.get(
    "/analytics/platform",
    summary="Get platform analytics",
    description="Get platform-wide analytics report.",
)
@limiter.limit("5/minute")
async def get_platform_analytics(
    request: Request,
    user: Annotated[JWTPayload, Depends(get_current_user)],
) -> dict:
    """Get platform analytics."""
    from app.services.analytics import get_analytics_service

    try:
        analytics = get_analytics_service()
        report = await analytics.generate_platform_report()

        return {
            "report_id": report.report_id,
            "period": report.period,
            "summary": report.summary,
            "insights": [
                {
                    "type": i.insight_type,
                    "title": i.title,
                    "description": i.description,
                }
                for i in report.insights
            ],
        }

    except Exception as e:
        logger.error(f"Platform analytics error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analytics failed: {str(e)}",
        )


# ===========================================
# Translation Endpoints
# ===========================================


@router.post(
    "/translate",
    response_model=TranslationResponse,
    summary="Translate text",
    description="Translate text to target language.",
)
@limiter.limit("20/minute")
async def translate_text(
    request: Request,
    body: TranslationRequest,
    user: Annotated[JWTPayload | None, Depends(get_optional_user)],
) -> TranslationResponse:
    """Translate text."""
    from app.services.language import get_language_service

    try:
        lang_service = get_language_service()

        result = await lang_service.translate(
            text=body.text,
            target_language=body.target_language,
            source_language=body.source_language,
        )

        return TranslationResponse(
            original_text=result.original_text,
            translated_text=result.translated_text,
            source_language=result.source_language,
            target_language=result.target_language,
            confidence=result.confidence,
        )

    except Exception as e:
        logger.error(f"Translation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Translation failed: {str(e)}",
        )


@router.get(
    "/languages",
    summary="Get supported languages",
    description="Get list of supported languages.",
)
async def get_languages() -> dict:
    """Get supported languages."""
    from app.services.language import get_language_service

    lang_service = get_language_service()
    languages = await lang_service.get_supported_languages()

    return {"languages": languages}


# ===========================================
# Cost & Usage Endpoints
# ===========================================


@router.get(
    "/usage/summary",
    summary="Get usage summary",
    description="Get AI service usage summary.",
)
@limiter.limit("10/minute")
async def get_usage_summary(
    request: Request,
    user: Annotated[JWTPayload, Depends(get_current_user)],
) -> dict:
    """Get usage summary."""
    from app.services.cost_monitor import get_cost_monitor

    try:
        cost_monitor = get_cost_monitor()
        summary = await cost_monitor.get_usage_summary()

        return summary

    except Exception as e:
        logger.error(f"Usage summary error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get usage: {str(e)}",
        )


@router.get(
    "/usage/optimization",
    summary="Get optimization report",
    description="Get cost optimization recommendations.",
)
@limiter.limit("5/minute")
async def get_optimization_report(
    request: Request,
    user: Annotated[JWTPayload, Depends(get_current_user)],
) -> dict:
    """Get optimization report."""
    from app.services.cost_monitor import get_cost_monitor

    try:
        cost_monitor = get_cost_monitor()
        report = await cost_monitor.get_optimization_report()

        return report

    except Exception as e:
        logger.error(f"Optimization report error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get report: {str(e)}",
        )
