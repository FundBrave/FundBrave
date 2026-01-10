"""
Tests for Campaign Recommendation Engine.

Tests personalized recommendations, similar campaigns, and trending analysis.
"""

import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.recommendations import (
    RecommendationEngine,
    Campaign,
    UserProfile,
    Recommendation,
    get_recommendation_engine,
)


class TestCampaign:
    """Tests for Campaign dataclass."""

    def test_campaign_creation(self):
        """Test creating a campaign."""
        campaign = Campaign(
            id="camp_001",
            name="Save the Forest",
            description="Help us protect endangered forests.",
            category="environment",
            goal_amount=10000.0,
            current_amount=5000.0,
            creator_id="user123",
        )

        assert campaign.id == "camp_001"
        assert campaign.name == "Save the Forest"
        assert campaign.category == "environment"
        assert campaign.goal_amount == 10000.0
        assert campaign.current_amount == 5000.0

    def test_campaign_with_metrics(self):
        """Test campaign with engagement metrics."""
        campaign = Campaign(
            id="camp_002",
            name="Tech Education",
            description="Providing coding education to underprivileged youth.",
            category="education",
            goal_amount=5000.0,
            current_amount=2500.0,
            creator_id="user456",
            donor_count=50,
            view_count=1000,
            share_count=100,
        )

        assert campaign.donor_count == 50
        assert campaign.view_count == 1000
        assert campaign.share_count == 100


class TestUserProfile:
    """Tests for UserProfile dataclass."""

    def test_user_profile_creation(self):
        """Test creating a user profile."""
        profile = UserProfile(
            user_id="user123",
            interests=["environment", "education"],
            donated_campaigns=["camp_001", "camp_002"],
            viewed_campaigns=["camp_001", "camp_002", "camp_003"],
            preferred_categories=["environment"],
        )

        assert profile.user_id == "user123"
        assert "environment" in profile.interests
        assert len(profile.donated_campaigns) == 2


class TestRecommendation:
    """Tests for Recommendation dataclass."""

    def test_recommendation_creation(self):
        """Test creating a recommendation."""
        rec = Recommendation(
            campaign_id="camp_001",
            score=0.95,
            reason="Matches your interest in environmental causes",
            recommendation_type="personalized",
        )

        assert rec.campaign_id == "camp_001"
        assert rec.score == 0.95
        assert rec.recommendation_type == "personalized"


class TestRecommendationEngine:
    """Tests for RecommendationEngine."""

    @pytest.fixture
    def engine(self):
        """Create a recommendation engine for testing."""
        return RecommendationEngine()

    @pytest.fixture
    def sample_campaigns(self):
        """Create sample campaigns for testing."""
        return [
            Campaign(
                id="camp_env_001",
                name="Ocean Cleanup",
                description="Help us clean plastic from the oceans.",
                category="environment",
                goal_amount=50000.0,
                current_amount=25000.0,
                creator_id="creator1",
                donor_count=200,
                view_count=5000,
            ),
            Campaign(
                id="camp_edu_001",
                name="Books for Kids",
                description="Providing books to schools in need.",
                category="education",
                goal_amount=10000.0,
                current_amount=8000.0,
                creator_id="creator2",
                donor_count=100,
                view_count=3000,
            ),
            Campaign(
                id="camp_health_001",
                name="Medical Supplies",
                description="Medical supplies for rural clinics.",
                category="health",
                goal_amount=20000.0,
                current_amount=5000.0,
                creator_id="creator3",
                donor_count=50,
                view_count=1500,
            ),
        ]

    @pytest.fixture
    def sample_user_profile(self):
        """Create a sample user profile."""
        return UserProfile(
            user_id="user123",
            interests=["environment", "education"],
            donated_campaigns=["camp_other_001"],
            viewed_campaigns=["camp_env_001"],
            preferred_categories=["environment"],
        )

    def test_engine_initialization(self, engine):
        """Test engine initializes correctly."""
        assert engine is not None
        assert engine.enabled is not None

    @pytest.mark.asyncio
    async def test_get_personalized_recommendations(
        self, engine, sample_campaigns, sample_user_profile
    ):
        """Test getting personalized recommendations."""
        recommendations = await engine.get_personalized_recommendations(
            user_id=sample_user_profile.user_id,
            campaigns=sample_campaigns,
            user_profile=sample_user_profile,
            limit=10,
        )

        assert isinstance(recommendations, list)
        for rec in recommendations:
            assert isinstance(rec, Recommendation)
            assert rec.score >= 0.0 and rec.score <= 1.0

    @pytest.mark.asyncio
    async def test_get_similar_campaigns(self, engine, sample_campaigns):
        """Test getting similar campaigns."""
        similar = await engine.get_similar_campaigns(
            campaign_id="camp_env_001",
            all_campaigns=sample_campaigns,
            limit=5,
        )

        assert isinstance(similar, list)
        # Should not include the source campaign
        assert all(rec.campaign_id != "camp_env_001" for rec in similar)

    @pytest.mark.asyncio
    async def test_get_trending_campaigns(self, engine, sample_campaigns):
        """Test getting trending campaigns."""
        trending = await engine.get_trending_campaigns(
            campaigns=sample_campaigns,
            limit=5,
        )

        assert isinstance(trending, list)
        for rec in trending:
            assert rec.recommendation_type == "trending"

    @pytest.mark.asyncio
    async def test_get_category_recommendations(self, engine, sample_campaigns):
        """Test getting category-based recommendations."""
        recommendations = await engine.get_category_recommendations(
            category="environment",
            campaigns=sample_campaigns,
            limit=5,
        )

        assert isinstance(recommendations, list)
        # Should only include environment campaigns
        for rec in recommendations:
            campaign = next(
                (c for c in sample_campaigns if c.id == rec.campaign_id), None
            )
            if campaign:
                assert campaign.category == "environment"

    @pytest.mark.asyncio
    async def test_get_ai_suggestions(self, engine, sample_campaigns):
        """Test getting AI-powered suggestions for a campaign."""
        campaign = sample_campaigns[0]
        suggestions = await engine.get_ai_suggestions(campaign)

        assert isinstance(suggestions, dict)
        # Should have some suggestions
        assert len(suggestions) > 0

    @pytest.mark.asyncio
    async def test_empty_campaigns_list(self, engine, sample_user_profile):
        """Test handling empty campaigns list."""
        recommendations = await engine.get_personalized_recommendations(
            user_id=sample_user_profile.user_id,
            campaigns=[],
            limit=10,
        )

        assert recommendations == []

    @pytest.mark.asyncio
    async def test_recommendations_without_user_profile(
        self, engine, sample_campaigns
    ):
        """Test recommendations without user profile."""
        recommendations = await engine.get_personalized_recommendations(
            user_id="new_user",
            campaigns=sample_campaigns,
            user_profile=None,
            limit=10,
        )

        assert isinstance(recommendations, list)
        # Should still return some recommendations (based on popularity/recency)


class TestRecommendationEngineSingleton:
    """Test singleton pattern for recommendation engine."""

    def test_get_recommendation_engine_singleton(self):
        """Test that get_recommendation_engine returns singleton."""
        engine1 = get_recommendation_engine()
        engine2 = get_recommendation_engine()

        assert engine1 is engine2
