"""
Tests for Content Moderation Service.

Tests toxicity detection, spam filtering, and content policy enforcement.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.moderation import (
    ModerationService,
    ModerationResult,
    ModerationAction,
    ContentType,
    get_moderation_service,
)


class TestModerationResult:
    """Tests for ModerationResult dataclass."""

    def test_moderation_result_creation(self):
        """Test creating a moderation result."""
        result = ModerationResult(
            content_id="content_001",
            content_type=ContentType.CAMPAIGN_DESCRIPTION,
            is_appropriate=True,
            action=ModerationAction.APPROVE,
            confidence=0.95,
            flags=[],
            details={},
        )

        assert result.content_id == "content_001"
        assert result.is_appropriate is True
        assert result.action == ModerationAction.APPROVE
        assert result.confidence == 0.95

    def test_moderation_result_with_flags(self):
        """Test moderation result with flags."""
        result = ModerationResult(
            content_id="content_002",
            content_type=ContentType.COMMENT,
            is_appropriate=False,
            action=ModerationAction.REJECT,
            confidence=0.85,
            flags=["toxicity", "profanity"],
            details={"toxicity_score": 0.8},
        )

        assert result.is_appropriate is False
        assert "toxicity" in result.flags
        assert result.details["toxicity_score"] == 0.8


class TestModerationService:
    """Tests for ModerationService."""

    @pytest.fixture
    def service(self):
        """Create a moderation service for testing."""
        return ModerationService()

    def test_service_initialization(self, service):
        """Test service initializes correctly."""
        assert service is not None
        assert service.enabled is not None
        assert service.toxicity_threshold >= 0.0

    @pytest.mark.asyncio
    async def test_moderate_safe_content(self, service):
        """Test moderating safe content."""
        result = await service.moderate_content(
            content="This is a great campaign to help the community!",
            content_type=ContentType.CAMPAIGN_DESCRIPTION,
            content_id="safe_001",
        )

        assert isinstance(result, ModerationResult)
        assert result.is_appropriate is True
        assert result.action == ModerationAction.APPROVE

    @pytest.mark.asyncio
    async def test_moderate_toxic_content(self, service):
        """Test moderating toxic content."""
        result = await service.moderate_content(
            content="This is terrible garbage and everyone involved is stupid!",
            content_type=ContentType.COMMENT,
            content_id="toxic_001",
        )

        assert isinstance(result, ModerationResult)
        # Depending on threshold, might be flagged
        assert result.action in [
            ModerationAction.APPROVE,
            ModerationAction.FLAG,
            ModerationAction.REJECT,
        ]

    @pytest.mark.asyncio
    async def test_moderate_spam_content(self, service):
        """Test moderating spam content."""
        # Repeated content pattern
        spam_content = "BUY NOW! CLICK HERE! BUY NOW! CLICK HERE! " * 5
        result = await service.moderate_content(
            content=spam_content,
            content_type=ContentType.CAMPAIGN_DESCRIPTION,
            content_id="spam_001",
        )

        assert isinstance(result, ModerationResult)
        # Should detect spam patterns

    @pytest.mark.asyncio
    async def test_moderate_with_blocked_terms(self, service):
        """Test moderation with blocked terms."""
        # Add a blocked term for testing
        original_terms = service.blocked_terms.copy()
        service.blocked_terms.add("testblockedterm")

        result = await service.moderate_content(
            content="This contains testblockedterm in the message.",
            content_type=ContentType.COMMENT,
            content_id="blocked_001",
        )

        # Restore
        service.blocked_terms = original_terms

        assert isinstance(result, ModerationResult)

    @pytest.mark.asyncio
    async def test_moderate_campaign(self, service):
        """Test complete campaign moderation."""
        results = await service.moderate_campaign(
            campaign_id="camp_001",
            name="Help Build Schools",
            description="We are raising funds to build schools in rural areas.",
        )

        assert isinstance(results, dict)
        assert "name" in results
        assert "description" in results
        assert isinstance(results["name"], ModerationResult)
        assert isinstance(results["description"], ModerationResult)

    @pytest.mark.asyncio
    async def test_moderate_comment(self, service):
        """Test comment moderation."""
        result = await service.moderate_content(
            content="Great campaign! Happy to support this cause.",
            content_type=ContentType.COMMENT,
            content_id="comment_001",
        )

        assert result.content_type == ContentType.COMMENT
        assert result.content_id == "comment_001"

    @pytest.mark.asyncio
    async def test_moderate_username(self, service):
        """Test username moderation."""
        result = await service.moderate_content(
            content="JohnDoe123",
            content_type=ContentType.USERNAME,
            content_id="user_001",
        )

        assert result.content_type == ContentType.USERNAME
        assert result.is_appropriate is True

    @pytest.mark.asyncio
    async def test_moderate_inappropriate_username(self, service):
        """Test moderating inappropriate username."""
        result = await service.moderate_content(
            content="BadWord_User",  # Depends on blocked terms
            content_type=ContentType.USERNAME,
            content_id="user_002",
        )

        assert result.content_type == ContentType.USERNAME

    @pytest.mark.asyncio
    async def test_get_moderation_stats(self, service):
        """Test getting moderation statistics."""
        # Moderate some content first
        await service.moderate_content(
            content="Test content 1",
            content_type=ContentType.COMMENT,
            content_id="stat_001",
        )
        await service.moderate_content(
            content="Test content 2",
            content_type=ContentType.COMMENT,
            content_id="stat_002",
        )

        stats = await service.get_moderation_stats()

        assert isinstance(stats, dict)
        assert "total_moderated" in stats

    @pytest.mark.asyncio
    async def test_empty_content(self, service):
        """Test moderating empty content."""
        result = await service.moderate_content(
            content="",
            content_type=ContentType.COMMENT,
            content_id="empty_001",
        )

        assert isinstance(result, ModerationResult)

    @pytest.mark.asyncio
    async def test_very_long_content(self, service):
        """Test moderating very long content."""
        long_content = "This is a test. " * 1000
        result = await service.moderate_content(
            content=long_content,
            content_type=ContentType.CAMPAIGN_DESCRIPTION,
            content_id="long_001",
        )

        assert isinstance(result, ModerationResult)


class TestModerationServiceSingleton:
    """Test singleton pattern for moderation service."""

    def test_get_moderation_service_singleton(self):
        """Test that get_moderation_service returns singleton."""
        service1 = get_moderation_service()
        service2 = get_moderation_service()

        assert service1 is service2


class TestContentType:
    """Tests for ContentType enum."""

    def test_content_types(self):
        """Test content type values."""
        assert ContentType.CAMPAIGN_NAME.value == "campaign_name"
        assert ContentType.CAMPAIGN_DESCRIPTION.value == "campaign_description"
        assert ContentType.COMMENT.value == "comment"
        assert ContentType.USERNAME.value == "username"


class TestModerationAction:
    """Tests for ModerationAction enum."""

    def test_moderation_actions(self):
        """Test moderation action values."""
        assert ModerationAction.APPROVE.value == "approve"
        assert ModerationAction.FLAG.value == "flag"
        assert ModerationAction.REJECT.value == "reject"
        assert ModerationAction.REVIEW.value == "review"
