"""
Tests for Model Router Service.

Tests query classification, intelligent routing, load balancing,
and cost optimization.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.model_router import (
    ModelRouterService,
    RoutingDecision,
    QueryClassification,
    ModelTier,
    ModelConfig,
    get_model_router_service,
)


class TestModelTier:
    """Tests for ModelTier enum."""

    def test_model_tiers(self):
        """Test model tier values."""
        assert ModelTier.SIMPLE.value == "simple"
        assert ModelTier.STANDARD.value == "standard"
        assert ModelTier.ADVANCED.value == "advanced"
        assert ModelTier.SPECIALIZED.value == "specialized"


class TestModelConfig:
    """Tests for ModelConfig dataclass."""

    def test_model_config_creation(self):
        """Test creating a model config."""
        config = ModelConfig(
            model_id="Qwen/Qwen2.5-7B-Instruct",
            tier=ModelTier.STANDARD,
            max_tokens=4096,
            cost_per_1k_tokens=0.001,
            avg_latency_ms=500.0,
            capabilities=["conversation", "reasoning"],
        )

        assert config.model_id == "Qwen/Qwen2.5-7B-Instruct"
        assert config.tier == ModelTier.STANDARD
        assert config.max_tokens == 4096
        assert config.is_available is True
        assert config.current_load == 0.0


class TestQueryClassification:
    """Tests for QueryClassification dataclass."""

    def test_classification_creation(self):
        """Test creating a query classification."""
        classification = QueryClassification(
            query="What is FundBrave?",
            estimated_complexity=0.3,
            estimated_tokens=50,
            suggested_tier=ModelTier.SIMPLE,
            reasoning="Short query; Contains simple pattern",
            requires_rag=False,
            requires_web_search=False,
        )

        assert classification.query == "What is FundBrave?"
        assert classification.estimated_complexity == 0.3
        assert classification.suggested_tier == ModelTier.SIMPLE


class TestRoutingDecision:
    """Tests for RoutingDecision dataclass."""

    def test_routing_decision_creation(self):
        """Test creating a routing decision."""
        decision = RoutingDecision(
            model_id="Qwen/Qwen2.5-7B-Instruct",
            tier=ModelTier.STANDARD,
            confidence=0.9,
            reasoning="Standard conversational query",
            estimated_cost=0.001,
            estimated_latency_ms=500.0,
            fallback_model="Qwen/Qwen2.5-1.5B-Instruct",
        )

        assert decision.model_id == "Qwen/Qwen2.5-7B-Instruct"
        assert decision.tier == ModelTier.STANDARD
        assert decision.confidence == 0.9
        assert decision.fallback_model is not None


class TestModelRouterService:
    """Tests for ModelRouterService."""

    @pytest.fixture
    def service(self):
        """Create a model router service for testing."""
        return ModelRouterService()

    def test_service_initialization(self, service):
        """Test service initializes correctly."""
        assert service is not None
        assert service.enabled is not None
        assert len(service._models) > 0

    @pytest.mark.asyncio
    async def test_classify_simple_query(self, service):
        """Test classifying a simple query."""
        classification = await service.classify_query("Hello!")

        assert isinstance(classification, QueryClassification)
        assert classification.estimated_complexity < 0.5

    @pytest.mark.asyncio
    async def test_classify_complex_query(self, service):
        """Test classifying a complex query."""
        classification = await service.classify_query(
            "Can you explain in detail how the smart contract architecture "
            "works and analyze the technical implementation comparing it "
            "to other blockchain fundraising platforms?"
        )

        assert isinstance(classification, QueryClassification)
        assert classification.estimated_complexity > 0.3

    @pytest.mark.asyncio
    async def test_classify_query_requiring_rag(self, service):
        """Test classifying query that needs RAG."""
        classification = await service.classify_query(
            "According to the documentation, what are the platform guidelines?"
        )

        assert isinstance(classification, QueryClassification)
        assert classification.requires_rag is True

    @pytest.mark.asyncio
    async def test_classify_query_requiring_search(self, service):
        """Test classifying query that needs web search."""
        classification = await service.classify_query(
            "What are the latest news about cryptocurrency regulations?"
        )

        assert isinstance(classification, QueryClassification)
        assert classification.requires_web_search is True

    @pytest.mark.asyncio
    async def test_route_simple_query(self, service):
        """Test routing a simple query."""
        decision = await service.route_query("Hi there!")

        assert isinstance(decision, RoutingDecision)
        assert decision.model_id is not None
        assert decision.confidence > 0.0

    @pytest.mark.asyncio
    async def test_route_complex_query(self, service):
        """Test routing a complex query."""
        decision = await service.route_query(
            "Explain the comprehensive technical architecture of the platform "
            "including smart contracts, backend systems, and AI integration."
        )

        assert isinstance(decision, RoutingDecision)
        assert decision.tier in [ModelTier.STANDARD, ModelTier.ADVANCED]

    @pytest.mark.asyncio
    async def test_route_with_force_tier(self, service):
        """Test routing with forced tier."""
        decision = await service.route_query(
            "Simple question",
            force_tier=ModelTier.ADVANCED,
        )

        assert decision.tier == ModelTier.ADVANCED

    @pytest.mark.asyncio
    async def test_route_with_user_preferences_speed(self, service):
        """Test routing with speed preference."""
        decision = await service.route_query(
            "Complex question about technical implementation",
            user_preferences={"prefer_speed": True},
        )

        assert isinstance(decision, RoutingDecision)
        # Speed preference should favor faster models

    @pytest.mark.asyncio
    async def test_route_with_user_preferences_quality(self, service):
        """Test routing with quality preference."""
        decision = await service.route_query(
            "Simple greeting hello",
            user_preferences={"prefer_quality": True},
        )

        assert isinstance(decision, RoutingDecision)
        # Quality preference should favor more capable models

    @pytest.mark.asyncio
    async def test_record_latency(self, service):
        """Test recording model latency."""
        model_id = list(service._models.values())[0].model_id

        await service.record_latency(model_id, 450.0)
        await service.record_latency(model_id, 550.0)

        assert model_id in service._latency_history
        assert len(service._latency_history[model_id]) == 2

    def test_update_model_availability(self, service):
        """Test updating model availability."""
        model_name = "standard"
        model_id = service._models[model_name].model_id

        service.update_model_availability(model_id, False)
        assert service._models[model_name].is_available is False

        service.update_model_availability(model_id, True)
        assert service._models[model_name].is_available is True

    def test_update_model_load(self, service):
        """Test updating model load."""
        model_name = "standard"
        model_id = service._models[model_name].model_id

        service.update_model_load(model_id, 0.5)
        assert service._models[model_name].current_load == 0.5

        # Test clamping
        service.update_model_load(model_id, 1.5)
        assert service._models[model_name].current_load == 1.0

        service.update_model_load(model_id, -0.5)
        assert service._models[model_name].current_load == 0.0

    @pytest.mark.asyncio
    async def test_get_routing_stats(self, service):
        """Test getting routing statistics."""
        # Make some routing decisions
        await service.route_query("Hello")
        await service.route_query("Complex technical question about blockchain")

        stats = await service.get_routing_stats()

        assert "enabled" in stats
        assert "total_routed" in stats
        assert "by_model" in stats
        assert "models" in stats

    @pytest.mark.asyncio
    async def test_optimize_cost(self, service):
        """Test cost optimization recommendations."""
        # Make some routing decisions to have data
        for i in range(10):
            await service.route_query(f"Query {i}")

        recommendations = await service.optimize_cost(
            daily_budget=10.0,
            expected_queries=1000,
        )

        assert "projected_daily_cost" in recommendations
        assert "daily_budget" in recommendations
        assert "within_budget" in recommendations
        assert "recommendations" in recommendations

    @pytest.mark.asyncio
    async def test_routing_disabled(self, service):
        """Test behavior when routing is disabled."""
        service.enabled = False

        decision = await service.route_query("Any query")

        assert decision.tier == ModelTier.STANDARD
        assert decision.reasoning == "Routing disabled, using standard model"

    def test_model_selection_by_load(self, service):
        """Test model selection based on load."""
        # Create a scenario with multiple models in same tier
        # The service should prefer less loaded models
        standard_model = service._models["standard"]
        standard_model.current_load = 0.8

        classification = QueryClassification(
            query="test",
            estimated_complexity=0.5,
            estimated_tokens=100,
            suggested_tier=ModelTier.STANDARD,
            reasoning="test",
        )

        selected = service._select_model(ModelTier.STANDARD, classification)

        assert selected is not None


class TestModelRouterServiceSingleton:
    """Test singleton pattern for model router service."""

    def test_get_model_router_service_singleton(self):
        """Test that get_model_router_service returns singleton."""
        service1 = get_model_router_service()
        service2 = get_model_router_service()

        assert service1 is service2


class TestQueryComplexityAnalysis:
    """Tests for query complexity analysis."""

    @pytest.fixture
    def service(self):
        return ModelRouterService()

    @pytest.mark.asyncio
    async def test_short_query_low_complexity(self, service):
        """Test that short queries have low complexity."""
        classification = await service.classify_query("Hi")

        assert classification.estimated_complexity < 0.5

    @pytest.mark.asyncio
    async def test_long_query_higher_complexity(self, service):
        """Test that longer queries have higher complexity."""
        classification = await service.classify_query(
            "I would like to understand the complete process of creating "
            "a campaign on FundBrave, including all the steps involved, "
            "the verification process, and how donations are processed."
        )

        assert classification.estimated_complexity > 0.3

    @pytest.mark.asyncio
    async def test_technical_terms_increase_complexity(self, service):
        """Test that technical terms increase complexity."""
        simple = await service.classify_query("How do I donate?")
        complex = await service.classify_query(
            "Explain the smart contract technical implementation"
        )

        assert complex.estimated_complexity >= simple.estimated_complexity

    @pytest.mark.asyncio
    async def test_greeting_pattern_reduces_complexity(self, service):
        """Test that greeting patterns reduce complexity."""
        classification = await service.classify_query("Hello, how are you?")

        assert classification.estimated_complexity < 0.4

    @pytest.mark.asyncio
    async def test_multiple_question_types(self, service):
        """Test queries with multiple question types."""
        classification = await service.classify_query(
            "What is the platform, why should I use it, and how does it work?"
        )

        # Multiple question types should increase complexity
        assert classification.estimated_complexity > 0.3
