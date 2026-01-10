"""
A/B Testing Framework for FundBrave AI.

Provides experiment management, variant assignment, and statistical
analysis for testing AI features and their impact on conversions.
"""

import hashlib
import random
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any

from loguru import logger

from app.config import settings


class ExperimentStatus(Enum):
    """Status of an experiment."""

    DRAFT = "draft"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


@dataclass
class Variant:
    """A variant in an A/B test."""

    name: str
    weight: float  # 0.0 to 1.0
    config: dict[str, Any] = field(default_factory=dict)
    impressions: int = 0
    conversions: int = 0

    @property
    def conversion_rate(self) -> float:
        """Calculate conversion rate."""
        if self.impressions == 0:
            return 0.0
        return self.conversions / self.impressions


@dataclass
class Experiment:
    """An A/B test experiment."""

    id: str
    name: str
    description: str
    variants: list[Variant]
    status: ExperimentStatus = ExperimentStatus.DRAFT
    created_at: datetime = field(default_factory=datetime.utcnow)
    started_at: datetime | None = None
    ended_at: datetime | None = None
    target_sample_size: int = 1000
    target_feature: str = "default"
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def total_impressions(self) -> int:
        """Total impressions across all variants."""
        return sum(v.impressions for v in self.variants)

    @property
    def is_significant(self) -> bool:
        """Check if experiment has enough data."""
        return self.total_impressions >= self.target_sample_size


@dataclass
class ExperimentResult:
    """Statistical results of an experiment."""

    experiment_id: str
    winner: str | None
    confidence: float
    lift: float  # Percentage improvement
    variants: list[dict[str, Any]]
    is_significant: bool
    recommendation: str


class ABTestingService:
    """
    A/B testing framework service.

    Features:
    - Experiment creation and management
    - Consistent user variant assignment
    - Conversion tracking
    - Statistical significance testing
    - Multi-armed bandit optimization
    """

    def __init__(self):
        """Initialize the A/B testing service."""
        self.enabled = settings.ab_testing_enabled
        self.default_variant = settings.ab_test_default_variant
        self.sample_rate = settings.ab_test_sample_rate

        self._experiments: dict[str, Experiment] = {}
        self._user_assignments: dict[str, dict[str, str]] = {}

    def create_experiment(
        self,
        experiment_id: str,
        name: str,
        description: str,
        variants: list[dict[str, Any]],
        target_sample_size: int = 1000,
        target_feature: str = "default",
    ) -> Experiment:
        """
        Create a new A/B test experiment.

        Args:
            experiment_id: Unique experiment identifier
            name: Human-readable name
            description: Experiment description
            variants: List of variant configurations
            target_sample_size: Target sample size for significance
            target_feature: Feature being tested

        Returns:
            Created Experiment object
        """
        # Normalize weights
        total_weight = sum(v.get("weight", 1.0) for v in variants)

        variant_objects = []
        for v in variants:
            variant_objects.append(
                Variant(
                    name=v["name"],
                    weight=v.get("weight", 1.0) / total_weight,
                    config=v.get("config", {}),
                )
            )

        experiment = Experiment(
            id=experiment_id,
            name=name,
            description=description,
            variants=variant_objects,
            target_sample_size=target_sample_size,
            target_feature=target_feature,
        )

        self._experiments[experiment_id] = experiment
        logger.info(f"Created experiment: {experiment_id} with {len(variants)} variants")

        return experiment

    def start_experiment(self, experiment_id: str) -> bool:
        """Start an experiment."""
        if experiment_id not in self._experiments:
            return False

        experiment = self._experiments[experiment_id]
        experiment.status = ExperimentStatus.RUNNING
        experiment.started_at = datetime.utcnow()

        logger.info(f"Started experiment: {experiment_id}")
        return True

    def stop_experiment(self, experiment_id: str) -> bool:
        """Stop an experiment."""
        if experiment_id not in self._experiments:
            return False

        experiment = self._experiments[experiment_id]
        experiment.status = ExperimentStatus.COMPLETED
        experiment.ended_at = datetime.utcnow()

        logger.info(f"Stopped experiment: {experiment_id}")
        return True

    def get_variant(
        self,
        experiment_id: str,
        user_id: str,
    ) -> tuple[str, dict[str, Any]]:
        """
        Get the variant for a user in an experiment.

        Uses consistent hashing to ensure same user always gets same variant.

        Args:
            experiment_id: Experiment identifier
            user_id: User identifier

        Returns:
            Tuple of (variant_name, variant_config)
        """
        if not self.enabled:
            return self.default_variant, {}

        # Check if experiment exists and is running
        if experiment_id not in self._experiments:
            return self.default_variant, {}

        experiment = self._experiments[experiment_id]
        if experiment.status != ExperimentStatus.RUNNING:
            return self.default_variant, {}

        # Check for existing assignment
        if user_id in self._user_assignments:
            if experiment_id in self._user_assignments[user_id]:
                variant_name = self._user_assignments[user_id][experiment_id]
                for v in experiment.variants:
                    if v.name == variant_name:
                        return v.name, v.config

        # Check sample rate
        if random.random() > self.sample_rate:
            return self.default_variant, {}

        # Assign variant using consistent hashing
        variant = self._assign_variant(experiment, user_id)

        # Store assignment
        if user_id not in self._user_assignments:
            self._user_assignments[user_id] = {}
        self._user_assignments[user_id][experiment_id] = variant.name

        # Record impression
        variant.impressions += 1

        return variant.name, variant.config

    def _assign_variant(self, experiment: Experiment, user_id: str) -> Variant:
        """Assign variant using consistent hashing."""
        # Create hash from user_id + experiment_id
        hash_input = f"{user_id}:{experiment.id}"
        hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)

        # Normalize to 0-1 range
        normalized = (hash_value % 10000) / 10000.0

        # Select variant based on weights
        cumulative = 0.0
        for variant in experiment.variants:
            cumulative += variant.weight
            if normalized <= cumulative:
                return variant

        # Fallback to last variant
        return experiment.variants[-1]

    def record_conversion(
        self,
        experiment_id: str,
        user_id: str,
        value: float = 1.0,
        metadata: dict | None = None,
    ) -> bool:
        """
        Record a conversion for a user in an experiment.

        Args:
            experiment_id: Experiment identifier
            user_id: User identifier
            value: Conversion value
            metadata: Optional conversion metadata

        Returns:
            True if conversion was recorded
        """
        if experiment_id not in self._experiments:
            return False

        experiment = self._experiments[experiment_id]

        # Get user's assigned variant
        if user_id not in self._user_assignments:
            return False

        if experiment_id not in self._user_assignments[user_id]:
            return False

        variant_name = self._user_assignments[user_id][experiment_id]

        # Find and update variant
        for variant in experiment.variants:
            if variant.name == variant_name:
                variant.conversions += 1
                return True

        return False

    def get_experiment_results(
        self, experiment_id: str
    ) -> ExperimentResult | None:
        """
        Get statistical results for an experiment.

        Args:
            experiment_id: Experiment identifier

        Returns:
            ExperimentResult with statistical analysis
        """
        if experiment_id not in self._experiments:
            return None

        experiment = self._experiments[experiment_id]

        # Find control variant (first one)
        control = experiment.variants[0]
        best_variant = control
        best_lift = 0.0

        variant_results = []
        for variant in experiment.variants:
            result = {
                "name": variant.name,
                "impressions": variant.impressions,
                "conversions": variant.conversions,
                "conversion_rate": variant.conversion_rate,
            }

            # Calculate lift vs control
            if control.conversion_rate > 0:
                lift = (
                    (variant.conversion_rate - control.conversion_rate)
                    / control.conversion_rate
                    * 100
                )
                result["lift"] = lift

                if lift > best_lift and variant != control:
                    best_lift = lift
                    best_variant = variant
            else:
                result["lift"] = 0

            variant_results.append(result)

        # Calculate statistical significance
        is_significant, confidence = self._calculate_significance(
            control, best_variant
        )

        # Determine winner
        winner = None
        recommendation = "Continue collecting data"

        if is_significant and best_lift > 5:  # 5% minimum lift
            winner = best_variant.name
            recommendation = f"Implement {winner} variant - {best_lift:.1f}% lift with {confidence:.1f}% confidence"
        elif experiment.is_significant and best_lift <= 0:
            winner = control.name
            recommendation = "Keep control variant - no improvement detected"
        elif not experiment.is_significant:
            recommendation = f"Need {experiment.target_sample_size - experiment.total_impressions} more impressions"

        return ExperimentResult(
            experiment_id=experiment_id,
            winner=winner,
            confidence=confidence,
            lift=best_lift,
            variants=variant_results,
            is_significant=is_significant,
            recommendation=recommendation,
        )

    def _calculate_significance(
        self, control: Variant, treatment: Variant
    ) -> tuple[bool, float]:
        """
        Calculate statistical significance using z-test.

        Args:
            control: Control variant
            treatment: Treatment variant

        Returns:
            Tuple of (is_significant, confidence_percentage)
        """
        import math

        n1 = control.impressions
        n2 = treatment.impressions

        if n1 < 100 or n2 < 100:
            return False, 0.0

        p1 = control.conversion_rate
        p2 = treatment.conversion_rate

        # Pooled proportion
        p_pool = (control.conversions + treatment.conversions) / (n1 + n2)

        if p_pool == 0 or p_pool == 1:
            return False, 0.0

        # Standard error
        se = math.sqrt(p_pool * (1 - p_pool) * (1 / n1 + 1 / n2))

        if se == 0:
            return False, 0.0

        # Z-score
        z = abs(p2 - p1) / se

        # Convert to confidence (approximate)
        # Z = 1.96 -> 95% confidence
        # Z = 2.58 -> 99% confidence
        confidence = min(99.9, 50 + z * 25)

        is_significant = z >= 1.96  # 95% confidence threshold

        return is_significant, confidence

    def get_all_experiments(self) -> list[dict[str, Any]]:
        """Get summary of all experiments."""
        return [
            {
                "id": exp.id,
                "name": exp.name,
                "status": exp.status.value,
                "total_impressions": exp.total_impressions,
                "variants_count": len(exp.variants),
                "is_significant": exp.is_significant,
                "created_at": exp.created_at.isoformat(),
            }
            for exp in self._experiments.values()
        ]

    def delete_experiment(self, experiment_id: str) -> bool:
        """Delete an experiment."""
        if experiment_id in self._experiments:
            del self._experiments[experiment_id]

            # Clean up user assignments
            for user_assignments in self._user_assignments.values():
                user_assignments.pop(experiment_id, None)

            return True
        return False

    # Pre-configured AI experiments
    async def create_ai_experiments(self) -> list[str]:
        """Create default AI-related experiments."""
        experiments = []

        # Response length experiment
        self.create_experiment(
            experiment_id="ai_response_length",
            name="AI Response Length Test",
            description="Test if shorter or longer AI responses improve engagement",
            variants=[
                {"name": "control", "weight": 0.5, "config": {"max_tokens": 512}},
                {"name": "longer", "weight": 0.5, "config": {"max_tokens": 1024}},
            ],
            target_feature="chat_response",
        )
        experiments.append("ai_response_length")

        # RAG vs no-RAG experiment
        self.create_experiment(
            experiment_id="rag_enabled",
            name="RAG Enhancement Test",
            description="Test if RAG-enhanced responses improve satisfaction",
            variants=[
                {"name": "control", "weight": 0.5, "config": {"use_rag": False}},
                {"name": "rag_enabled", "weight": 0.5, "config": {"use_rag": True}},
            ],
            target_feature="chat_response",
        )
        experiments.append("rag_enabled")

        # Temperature experiment
        self.create_experiment(
            experiment_id="temperature_test",
            name="Temperature Test",
            description="Test different temperature settings for AI responses",
            variants=[
                {"name": "conservative", "weight": 0.33, "config": {"temperature": 0.3}},
                {"name": "balanced", "weight": 0.34, "config": {"temperature": 0.7}},
                {"name": "creative", "weight": 0.33, "config": {"temperature": 1.0}},
            ],
            target_feature="chat_response",
        )
        experiments.append("temperature_test")

        logger.info(f"Created {len(experiments)} default AI experiments")
        return experiments


# Singleton instance
_ab_service: ABTestingService | None = None


def get_ab_testing_service() -> ABTestingService:
    """Get the singleton A/B testing service instance."""
    global _ab_service
    if _ab_service is None:
        _ab_service = ABTestingService()
    return _ab_service
