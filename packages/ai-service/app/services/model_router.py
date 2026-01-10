"""
Multi-Model Routing Service for FundBrave AI.

Provides intelligent routing of queries to appropriate models based on
complexity, cost optimization, and performance requirements.
"""

import asyncio
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any

from loguru import logger

from app.config import settings


class ModelTier(Enum):
    """Model complexity tiers."""

    SIMPLE = "simple"      # Small, fast model for simple queries
    STANDARD = "standard"  # Default conversational model
    ADVANCED = "advanced"  # Larger model for complex queries
    SPECIALIZED = "specialized"  # Domain-specific models


@dataclass
class ModelConfig:
    """Configuration for a model in the routing pool."""

    model_id: str
    tier: ModelTier
    max_tokens: int
    cost_per_1k_tokens: float
    avg_latency_ms: float
    capabilities: list[str] = field(default_factory=list)
    is_available: bool = True
    current_load: float = 0.0  # 0.0 to 1.0


@dataclass
class QueryClassification:
    """Classification of a query for routing."""

    query: str
    estimated_complexity: float  # 0.0 to 1.0
    estimated_tokens: int
    suggested_tier: ModelTier
    reasoning: str
    requires_rag: bool = False
    requires_web_search: bool = False
    language: str = "en"


@dataclass
class RoutingDecision:
    """Decision about which model to use."""

    model_id: str
    tier: ModelTier
    confidence: float
    reasoning: str
    estimated_cost: float
    estimated_latency_ms: float
    fallback_model: str | None = None


class ModelRouterService:
    """
    Intelligent model routing service.

    Features:
    - Query complexity analysis
    - Cost-optimized routing
    - Load balancing across models
    - Fallback handling
    - Performance monitoring
    """

    def __init__(self):
        """Initialize the model router service."""
        self.enabled = settings.model_routing_enabled
        self.complexity_threshold = settings.complex_query_threshold

        # Model pool configuration
        self._models: dict[str, ModelConfig] = {
            "simple": ModelConfig(
                model_id=settings.simple_query_model,
                tier=ModelTier.SIMPLE,
                max_tokens=1024,
                cost_per_1k_tokens=0.0005,
                avg_latency_ms=200,
                capabilities=["faq", "simple_qa", "greeting"],
            ),
            "standard": ModelConfig(
                model_id=settings.conversational_model,
                tier=ModelTier.STANDARD,
                max_tokens=4096,
                cost_per_1k_tokens=0.001,
                avg_latency_ms=500,
                capabilities=["conversation", "reasoning", "explanation", "multi_turn"],
            ),
            "advanced": ModelConfig(
                model_id="Qwen/Qwen2.5-14B-Instruct",  # Larger model
                tier=ModelTier.ADVANCED,
                max_tokens=8192,
                cost_per_1k_tokens=0.002,
                avg_latency_ms=1000,
                capabilities=["complex_reasoning", "analysis", "code", "creative"],
            ),
        }

        # Routing statistics
        self._routing_stats: dict[str, int] = {}
        self._latency_history: dict[str, list[float]] = {}

        # Query patterns for classification
        self.simple_patterns = [
            "hello", "hi", "hey", "thanks", "thank you", "bye",
            "what is fundbrave", "how do i", "what's the",
        ]

        self.complex_indicators = [
            "explain", "analyze", "compare", "why", "complex",
            "detailed", "in-depth", "comprehensive", "multiple",
            "code", "smart contract", "technical",
        ]

    async def classify_query(self, query: str) -> QueryClassification:
        """
        Classify a query for routing.

        Args:
            query: User query

        Returns:
            QueryClassification with complexity analysis
        """
        query_lower = query.lower()
        words = query_lower.split()
        word_count = len(words)

        # Estimate complexity
        complexity = 0.0
        reasoning_parts = []

        # Length-based complexity
        if word_count <= 5:
            complexity += 0.1
            reasoning_parts.append("Short query")
        elif word_count <= 20:
            complexity += 0.3
            reasoning_parts.append("Medium length")
        else:
            complexity += 0.5
            reasoning_parts.append("Long query")

        # Pattern matching
        for pattern in self.simple_patterns:
            if pattern in query_lower:
                complexity -= 0.2
                reasoning_parts.append("Contains simple pattern")
                break

        for indicator in self.complex_indicators:
            if indicator in query_lower:
                complexity += 0.2
                reasoning_parts.append(f"Contains '{indicator}'")

        # Check for question complexity
        question_words = sum(1 for w in ["what", "why", "how", "when", "where", "which"] if w in words)
        if question_words > 1:
            complexity += 0.2
            reasoning_parts.append("Multiple question types")

        # Normalize complexity
        complexity = min(1.0, max(0.0, complexity))

        # Estimate tokens
        estimated_tokens = word_count * 1.5 + 100  # Base + expansion

        # Determine tier
        if complexity <= 0.3:
            tier = ModelTier.SIMPLE
        elif complexity <= 0.6:
            tier = ModelTier.STANDARD
        else:
            tier = ModelTier.ADVANCED

        # Check for RAG/search needs
        requires_rag = any(
            phrase in query_lower
            for phrase in ["according to", "based on", "documentation", "guidelines", "policy"]
        )

        requires_web_search = any(
            phrase in query_lower
            for phrase in ["latest", "news", "recent", "today", "current"]
        )

        return QueryClassification(
            query=query,
            estimated_complexity=complexity,
            estimated_tokens=int(estimated_tokens),
            suggested_tier=tier,
            reasoning="; ".join(reasoning_parts),
            requires_rag=requires_rag,
            requires_web_search=requires_web_search,
        )

    async def route_query(
        self,
        query: str,
        user_preferences: dict | None = None,
        force_tier: ModelTier | None = None,
    ) -> RoutingDecision:
        """
        Route a query to the appropriate model.

        Args:
            query: User query
            user_preferences: Optional user preferences (e.g., prefer speed/quality)
            force_tier: Force a specific tier (for testing)

        Returns:
            RoutingDecision with selected model
        """
        if not self.enabled:
            # Return standard model when routing is disabled
            return RoutingDecision(
                model_id=settings.conversational_model,
                tier=ModelTier.STANDARD,
                confidence=1.0,
                reasoning="Routing disabled, using standard model",
                estimated_cost=0.001,
                estimated_latency_ms=500,
            )

        # Classify the query
        classification = await self.classify_query(query)

        # Determine tier
        tier = force_tier or classification.suggested_tier

        # Apply user preferences
        if user_preferences:
            if user_preferences.get("prefer_speed"):
                tier = min(tier, ModelTier.STANDARD, key=lambda t: t.value)
            elif user_preferences.get("prefer_quality"):
                tier = max(tier, ModelTier.STANDARD, key=lambda t: t.value)

        # Select model from tier
        model = self._select_model(tier, classification)

        if model is None:
            # Fallback to standard
            model = self._models["standard"]
            tier = ModelTier.STANDARD

        # Calculate estimates
        estimated_cost = (classification.estimated_tokens / 1000) * model.cost_per_1k_tokens
        estimated_latency = model.avg_latency_ms

        # Select fallback
        fallback = None
        if tier == ModelTier.ADVANCED:
            fallback = self._models["standard"].model_id
        elif tier == ModelTier.STANDARD:
            fallback = self._models["simple"].model_id

        # Record routing
        self._routing_stats[model.model_id] = (
            self._routing_stats.get(model.model_id, 0) + 1
        )

        return RoutingDecision(
            model_id=model.model_id,
            tier=tier,
            confidence=0.8 if force_tier else 0.9,
            reasoning=f"{classification.reasoning}; Selected {tier.value} tier",
            estimated_cost=estimated_cost,
            estimated_latency_ms=estimated_latency,
            fallback_model=fallback,
        )

    def _select_model(
        self, tier: ModelTier, classification: QueryClassification
    ) -> ModelConfig | None:
        """Select the best model for the tier."""
        # Get models for tier
        tier_models = [m for m in self._models.values() if m.tier == tier and m.is_available]

        if not tier_models:
            return None

        # If multiple models, select based on load
        if len(tier_models) == 1:
            return tier_models[0]

        # Load balancing - select least loaded
        return min(tier_models, key=lambda m: m.current_load)

    async def record_latency(self, model_id: str, latency_ms: float) -> None:
        """Record actual latency for a model."""
        if model_id not in self._latency_history:
            self._latency_history[model_id] = []

        self._latency_history[model_id].append(latency_ms)

        # Keep last 100 measurements
        if len(self._latency_history[model_id]) > 100:
            self._latency_history[model_id] = self._latency_history[model_id][-100:]

        # Update average
        if model_id in self._models:
            self._models[model_id].avg_latency_ms = (
                sum(self._latency_history[model_id])
                / len(self._latency_history[model_id])
            )

    def update_model_availability(self, model_id: str, available: bool) -> None:
        """Update model availability status."""
        for model in self._models.values():
            if model.model_id == model_id:
                model.is_available = available
                logger.info(f"Model {model_id} availability: {available}")
                break

    def update_model_load(self, model_id: str, load: float) -> None:
        """Update model load (0.0 to 1.0)."""
        for model in self._models.values():
            if model.model_id == model_id:
                model.current_load = min(1.0, max(0.0, load))
                break

    async def get_routing_stats(self) -> dict[str, Any]:
        """Get routing statistics."""
        total_requests = sum(self._routing_stats.values())

        return {
            "enabled": self.enabled,
            "total_routed": total_requests,
            "by_model": self._routing_stats,
            "models": {
                name: {
                    "model_id": m.model_id,
                    "tier": m.tier.value,
                    "is_available": m.is_available,
                    "current_load": m.current_load,
                    "avg_latency_ms": m.avg_latency_ms,
                }
                for name, m in self._models.items()
            },
        }

    async def optimize_cost(
        self, daily_budget: float, expected_queries: int
    ) -> dict[str, Any]:
        """
        Get recommendations for cost optimization.

        Args:
            daily_budget: Daily budget in USD
            expected_queries: Expected daily queries

        Returns:
            Optimization recommendations
        """
        # Calculate current cost distribution
        total_requests = sum(self._routing_stats.values()) or 1

        current_cost = 0.0
        tier_distribution = {}

        for name, model in self._models.items():
            requests = self._routing_stats.get(model.model_id, 0)
            tier_distribution[model.tier.value] = requests / total_requests
            # Estimate cost (assuming 500 tokens per request)
            current_cost += (requests * 500 / 1000) * model.cost_per_1k_tokens

        # Project daily cost
        projected_daily_cost = current_cost * (expected_queries / total_requests)

        recommendations = []

        if projected_daily_cost > daily_budget:
            overage = projected_daily_cost - daily_budget
            recommendations.append(
                f"Projected to exceed budget by ${overage:.2f}/day"
            )
            recommendations.append(
                "Consider routing more queries to simple tier"
            )
            recommendations.append(
                "Enable response caching to reduce model calls"
            )
        else:
            headroom = daily_budget - projected_daily_cost
            recommendations.append(
                f"Within budget with ${headroom:.2f}/day headroom"
            )
            if headroom > daily_budget * 0.3:
                recommendations.append(
                    "Consider routing more queries to advanced tier for better quality"
                )

        return {
            "current_distribution": tier_distribution,
            "projected_daily_cost": projected_daily_cost,
            "daily_budget": daily_budget,
            "within_budget": projected_daily_cost <= daily_budget,
            "recommendations": recommendations,
        }


# Singleton instance
_router_service: ModelRouterService | None = None


def get_model_router_service() -> ModelRouterService:
    """Get the singleton model router service instance."""
    global _router_service
    if _router_service is None:
        _router_service = ModelRouterService()
    return _router_service
