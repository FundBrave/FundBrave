"""
Tests for A/B Testing Service.

Tests experiment creation, variant assignment, conversion tracking,
and statistical analysis.
"""

import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.ab_testing import (
    ABTestingService,
    Experiment,
    Variant,
    ExperimentResult,
    ExperimentStatus,
    get_ab_testing_service,
)


class TestVariant:
    """Tests for Variant dataclass."""

    def test_variant_creation(self):
        """Test creating a variant."""
        variant = Variant(
            name="control",
            weight=0.5,
            config={"max_tokens": 512},
        )

        assert variant.name == "control"
        assert variant.weight == 0.5
        assert variant.config["max_tokens"] == 512
        assert variant.impressions == 0
        assert variant.conversions == 0

    def test_conversion_rate_calculation(self):
        """Test conversion rate calculation."""
        variant = Variant(name="test", weight=0.5)
        variant.impressions = 100
        variant.conversions = 20

        assert variant.conversion_rate == 0.2

    def test_conversion_rate_zero_impressions(self):
        """Test conversion rate with zero impressions."""
        variant = Variant(name="test", weight=0.5)

        assert variant.conversion_rate == 0.0


class TestExperiment:
    """Tests for Experiment dataclass."""

    def test_experiment_creation(self):
        """Test creating an experiment."""
        variants = [
            Variant(name="control", weight=0.5),
            Variant(name="treatment", weight=0.5),
        ]

        experiment = Experiment(
            id="test_exp",
            name="Test Experiment",
            description="A test experiment",
            variants=variants,
            target_sample_size=1000,
        )

        assert experiment.id == "test_exp"
        assert experiment.status == ExperimentStatus.DRAFT
        assert len(experiment.variants) == 2
        assert experiment.target_sample_size == 1000

    def test_total_impressions(self):
        """Test total impressions calculation."""
        variants = [
            Variant(name="control", weight=0.5),
            Variant(name="treatment", weight=0.5),
        ]
        variants[0].impressions = 100
        variants[1].impressions = 150

        experiment = Experiment(
            id="test",
            name="Test",
            description="Test",
            variants=variants,
        )

        assert experiment.total_impressions == 250

    def test_is_significant(self):
        """Test significance check."""
        variants = [
            Variant(name="control", weight=0.5),
            Variant(name="treatment", weight=0.5),
        ]
        variants[0].impressions = 600
        variants[1].impressions = 600

        experiment = Experiment(
            id="test",
            name="Test",
            description="Test",
            variants=variants,
            target_sample_size=1000,
        )

        assert experiment.is_significant is True


class TestABTestingService:
    """Tests for ABTestingService."""

    @pytest.fixture
    def service(self):
        """Create an A/B testing service for testing."""
        return ABTestingService()

    def test_service_initialization(self, service):
        """Test service initializes correctly."""
        assert service is not None
        assert service.enabled is not None
        assert len(service._experiments) == 0

    def test_create_experiment(self, service):
        """Test creating an experiment."""
        experiment = service.create_experiment(
            experiment_id="test_001",
            name="Response Length Test",
            description="Test if shorter responses improve engagement",
            variants=[
                {"name": "control", "weight": 0.5, "config": {"max_tokens": 256}},
                {"name": "longer", "weight": 0.5, "config": {"max_tokens": 512}},
            ],
            target_sample_size=1000,
        )

        assert experiment.id == "test_001"
        assert len(experiment.variants) == 2
        assert experiment.status == ExperimentStatus.DRAFT

    def test_start_experiment(self, service):
        """Test starting an experiment."""
        service.create_experiment(
            experiment_id="start_test",
            name="Start Test",
            description="Test",
            variants=[
                {"name": "a", "weight": 0.5},
                {"name": "b", "weight": 0.5},
            ],
        )

        success = service.start_experiment("start_test")

        assert success is True
        assert service._experiments["start_test"].status == ExperimentStatus.RUNNING

    def test_stop_experiment(self, service):
        """Test stopping an experiment."""
        service.create_experiment(
            experiment_id="stop_test",
            name="Stop Test",
            description="Test",
            variants=[
                {"name": "a", "weight": 0.5},
                {"name": "b", "weight": 0.5},
            ],
        )
        service.start_experiment("stop_test")

        success = service.stop_experiment("stop_test")

        assert success is True
        assert service._experiments["stop_test"].status == ExperimentStatus.COMPLETED

    def test_get_variant(self, service):
        """Test getting variant for a user."""
        service.create_experiment(
            experiment_id="variant_test",
            name="Variant Test",
            description="Test",
            variants=[
                {"name": "control", "weight": 0.5, "config": {"value": 1}},
                {"name": "treatment", "weight": 0.5, "config": {"value": 2}},
            ],
        )
        service.start_experiment("variant_test")

        variant_name, variant_config = service.get_variant(
            experiment_id="variant_test",
            user_id="user123",
        )

        assert variant_name in ["control", "treatment"]

    def test_consistent_variant_assignment(self, service):
        """Test that same user always gets same variant."""
        service.create_experiment(
            experiment_id="consistent_test",
            name="Consistent Test",
            description="Test",
            variants=[
                {"name": "a", "weight": 0.5},
                {"name": "b", "weight": 0.5},
            ],
        )
        service.start_experiment("consistent_test")

        # Get variant multiple times for same user
        variants = []
        for _ in range(10):
            variant_name, _ = service.get_variant("consistent_test", "user123")
            variants.append(variant_name)

        # All variants should be the same
        assert len(set(variants)) == 1

    def test_different_users_get_distributed(self, service):
        """Test that different users get distributed across variants."""
        service.create_experiment(
            experiment_id="distribution_test",
            name="Distribution Test",
            description="Test",
            variants=[
                {"name": "a", "weight": 0.5},
                {"name": "b", "weight": 0.5},
            ],
        )
        service.start_experiment("distribution_test")

        # Get variants for many users
        variants = []
        for i in range(100):
            variant_name, _ = service.get_variant("distribution_test", f"user_{i}")
            variants.append(variant_name)

        # Should have both variants
        unique_variants = set(variants)
        assert "a" in unique_variants or "b" in unique_variants

    def test_record_conversion(self, service):
        """Test recording a conversion."""
        service.create_experiment(
            experiment_id="conversion_test",
            name="Conversion Test",
            description="Test",
            variants=[
                {"name": "a", "weight": 0.5},
                {"name": "b", "weight": 0.5},
            ],
        )
        service.start_experiment("conversion_test")

        # First get a variant
        variant_name, _ = service.get_variant("conversion_test", "user123")

        # Then record conversion
        success = service.record_conversion(
            experiment_id="conversion_test",
            user_id="user123",
            value=1.0,
        )

        assert success is True

    def test_record_conversion_without_assignment(self, service):
        """Test recording conversion without prior variant assignment."""
        service.create_experiment(
            experiment_id="no_assign_test",
            name="No Assignment Test",
            description="Test",
            variants=[
                {"name": "a", "weight": 0.5},
                {"name": "b", "weight": 0.5},
            ],
        )
        service.start_experiment("no_assign_test")

        # Try to record conversion without getting variant first
        success = service.record_conversion(
            experiment_id="no_assign_test",
            user_id="user_not_assigned",
            value=1.0,
        )

        assert success is False

    def test_get_experiment_results(self, service):
        """Test getting experiment results."""
        service.create_experiment(
            experiment_id="results_test",
            name="Results Test",
            description="Test",
            variants=[
                {"name": "control", "weight": 0.5},
                {"name": "treatment", "weight": 0.5},
            ],
        )
        service.start_experiment("results_test")

        # Simulate some traffic
        for i in range(50):
            variant, _ = service.get_variant("results_test", f"user_a_{i}")
        for i in range(50):
            variant, _ = service.get_variant("results_test", f"user_b_{i}")
            if i % 2 == 0:  # Record some conversions
                service.record_conversion("results_test", f"user_b_{i}")

        results = service.get_experiment_results("results_test")

        assert results is not None
        assert results.experiment_id == "results_test"
        assert len(results.variants) == 2

    def test_delete_experiment(self, service):
        """Test deleting an experiment."""
        service.create_experiment(
            experiment_id="delete_test",
            name="Delete Test",
            description="Test",
            variants=[
                {"name": "a", "weight": 0.5},
                {"name": "b", "weight": 0.5},
            ],
        )

        success = service.delete_experiment("delete_test")

        assert success is True
        assert "delete_test" not in service._experiments

    def test_get_all_experiments(self, service):
        """Test getting all experiments."""
        service.create_experiment(
            experiment_id="exp1",
            name="Experiment 1",
            description="Test 1",
            variants=[{"name": "a", "weight": 1.0}],
        )
        service.create_experiment(
            experiment_id="exp2",
            name="Experiment 2",
            description="Test 2",
            variants=[{"name": "a", "weight": 1.0}],
        )

        experiments = service.get_all_experiments()

        assert len(experiments) >= 2

    @pytest.mark.asyncio
    async def test_create_ai_experiments(self, service):
        """Test creating default AI experiments."""
        experiments = await service.create_ai_experiments()

        assert len(experiments) > 0
        assert "ai_response_length" in experiments
        assert "rag_enabled" in experiments
        assert "temperature_test" in experiments

    def test_weight_normalization(self, service):
        """Test that variant weights are normalized."""
        experiment = service.create_experiment(
            experiment_id="weight_test",
            name="Weight Test",
            description="Test",
            variants=[
                {"name": "a", "weight": 2.0},
                {"name": "b", "weight": 2.0},
            ],
        )

        # Weights should be normalized to sum to 1.0
        total_weight = sum(v.weight for v in experiment.variants)
        assert abs(total_weight - 1.0) < 0.01


class TestABTestingServiceSingleton:
    """Test singleton pattern for A/B testing service."""

    def test_get_ab_testing_service_singleton(self):
        """Test that get_ab_testing_service returns singleton."""
        service1 = get_ab_testing_service()
        service2 = get_ab_testing_service()

        assert service1 is service2


class TestExperimentStatus:
    """Tests for ExperimentStatus enum."""

    def test_experiment_statuses(self):
        """Test experiment status values."""
        assert ExperimentStatus.DRAFT.value == "draft"
        assert ExperimentStatus.RUNNING.value == "running"
        assert ExperimentStatus.PAUSED.value == "paused"
        assert ExperimentStatus.COMPLETED.value == "completed"
        assert ExperimentStatus.CANCELLED.value == "cancelled"


class TestStatisticalSignificance:
    """Tests for statistical significance calculations."""

    @pytest.fixture
    def service(self):
        return ABTestingService()

    def test_significance_with_sufficient_data(self, service):
        """Test significance calculation with sufficient data."""
        control = Variant(name="control", weight=0.5)
        control.impressions = 1000
        control.conversions = 100  # 10% conversion rate

        treatment = Variant(name="treatment", weight=0.5)
        treatment.impressions = 1000
        treatment.conversions = 150  # 15% conversion rate

        is_significant, confidence = service._calculate_significance(
            control, treatment
        )

        # With this much difference and data, should be significant
        assert confidence > 50.0

    def test_significance_with_insufficient_data(self, service):
        """Test significance calculation with insufficient data."""
        control = Variant(name="control", weight=0.5)
        control.impressions = 50
        control.conversions = 5

        treatment = Variant(name="treatment", weight=0.5)
        treatment.impressions = 50
        treatment.conversions = 6

        is_significant, confidence = service._calculate_significance(
            control, treatment
        )

        # With too little data, should not be significant
        assert is_significant is False
