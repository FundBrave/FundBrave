"""
Auto-Moderation Service for FundBrave AI.

Provides content moderation for campaigns, comments, and user-generated
content to ensure platform guidelines are followed.
"""

import asyncio
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any

from loguru import logger

from app.config import settings


class ModerationAction(Enum):
    """Actions that can be taken by moderation."""

    APPROVE = "approve"
    FLAG = "flag"
    REJECT = "reject"
    QUARANTINE = "quarantine"


class ContentType(Enum):
    """Types of content that can be moderated."""

    CAMPAIGN_TITLE = "campaign_title"
    CAMPAIGN_DESCRIPTION = "campaign_description"
    COMMENT = "comment"
    USER_MESSAGE = "user_message"
    IMAGE = "image"
    UPDATE = "update"


@dataclass
class ModerationCategory:
    """A moderation category with score."""

    category: str
    score: float
    threshold: float
    triggered: bool


@dataclass
class ModerationResult:
    """Result of content moderation."""

    content_id: str
    content_type: ContentType
    action: ModerationAction
    categories: list[ModerationCategory]
    overall_score: float
    is_safe: bool
    requires_review: bool
    reasons: list[str]
    suggestions: list[str]
    processed_at: datetime = field(default_factory=datetime.utcnow)


class ModerationService:
    """
    Content moderation service.

    Features:
    - Toxicity detection
    - Profanity filtering
    - Spam detection
    - Policy violation detection
    - AI-based content analysis
    """

    def __init__(self):
        """Initialize the moderation service."""
        self.enabled = settings.moderation_enabled
        self.toxicity_threshold = settings.toxicity_threshold
        self.profanity_enabled = settings.profanity_filter_enabled

        self._toxicity_model = None
        self._profanity_checker = None

        # Platform-specific blocked terms
        self.blocked_terms = [
            # Financial scams
            "guaranteed profit",
            "risk-free investment",
            "wire money",
            "send bitcoin",
            "double your crypto",
            # Inappropriate content
            "adult content",
            "explicit material",
            # Spam patterns
            "click here now",
            "limited time offer",
            "act immediately",
        ]

        # Allowed promotional terms (context-dependent)
        self.allowed_promotions = [
            "matching donation",
            "double your impact",
            "employer match",
        ]

    async def _get_toxicity_model(self):
        """Get or initialize toxicity detection model."""
        if self._toxicity_model is None:
            try:
                from detoxify import Detoxify

                self._toxicity_model = Detoxify("original")
                logger.info("Toxicity model loaded")
            except ImportError:
                logger.warning("Detoxify not available, using mock toxicity detection")

        return self._toxicity_model

    async def _get_profanity_checker(self):
        """Get or initialize profanity checker."""
        if self._profanity_checker is None:
            try:
                from profanity_check import predict_prob

                self._profanity_checker = predict_prob
                logger.info("Profanity checker loaded")
            except ImportError:
                logger.warning("Profanity-check not available")

        return self._profanity_checker

    async def moderate_content(
        self,
        content: str,
        content_type: ContentType,
        content_id: str | None = None,
        metadata: dict | None = None,
    ) -> ModerationResult:
        """
        Moderate a piece of content.

        Args:
            content: Text content to moderate
            content_type: Type of content
            content_id: Optional content identifier
            metadata: Optional metadata

        Returns:
            ModerationResult with action and analysis
        """
        if not self.enabled:
            return ModerationResult(
                content_id=content_id or "unknown",
                content_type=content_type,
                action=ModerationAction.APPROVE,
                categories=[],
                overall_score=0.0,
                is_safe=True,
                requires_review=False,
                reasons=[],
                suggestions=[],
            )

        categories = []
        reasons = []
        suggestions = []

        # 1. Toxicity detection
        toxicity_result = await self._check_toxicity(content)
        categories.extend(toxicity_result)

        # 2. Profanity check
        profanity_result = await self._check_profanity(content)
        if profanity_result:
            categories.append(profanity_result)

        # 3. Blocked terms check
        blocked_result = self._check_blocked_terms(content)
        if blocked_result:
            categories.append(blocked_result)
            reasons.append("Content contains blocked terms")

        # 4. Spam detection
        spam_result = await self._check_spam(content)
        if spam_result:
            categories.append(spam_result)

        # 5. AI-based policy check (for longer content)
        if len(content) > 50:
            policy_result = await self._check_policy_violations(content, content_type)
            if policy_result:
                categories.extend(policy_result)

        # Calculate overall score
        overall_score = self._calculate_overall_score(categories)

        # Determine action
        action, requires_review = self._determine_action(
            overall_score, categories, content_type
        )

        # Generate reasons and suggestions
        for cat in categories:
            if cat.triggered:
                reasons.append(f"High {cat.category} score ({cat.score:.2f})")

        if action == ModerationAction.REJECT:
            suggestions.append("Please revise content to meet community guidelines")
        elif action == ModerationAction.FLAG:
            suggestions.append("Content will be reviewed by moderators")

        return ModerationResult(
            content_id=content_id or "unknown",
            content_type=content_type,
            action=action,
            categories=categories,
            overall_score=overall_score,
            is_safe=action == ModerationAction.APPROVE,
            requires_review=requires_review,
            reasons=reasons,
            suggestions=suggestions,
        )

    async def _check_toxicity(self, content: str) -> list[ModerationCategory]:
        """Check content for toxicity using Detoxify."""
        model = await self._get_toxicity_model()

        if model is None:
            # Mock toxicity check
            return [
                ModerationCategory(
                    category="toxicity",
                    score=0.1,
                    threshold=self.toxicity_threshold,
                    triggered=False,
                )
            ]

        try:
            loop = asyncio.get_event_loop()
            results = await loop.run_in_executor(None, lambda: model.predict(content))

            categories = []
            for category, score in results.items():
                threshold = self.toxicity_threshold
                if category in ["severe_toxicity", "threat"]:
                    threshold = 0.5  # Lower threshold for severe content

                categories.append(
                    ModerationCategory(
                        category=category,
                        score=float(score),
                        threshold=threshold,
                        triggered=float(score) >= threshold,
                    )
                )

            return categories

        except Exception as e:
            logger.error(f"Toxicity check failed: {e}")
            return []

    async def _check_profanity(self, content: str) -> ModerationCategory | None:
        """Check content for profanity."""
        if not self.profanity_enabled:
            return None

        checker = await self._get_profanity_checker()

        if checker is None:
            return None

        try:
            loop = asyncio.get_event_loop()
            score = await loop.run_in_executor(
                None, lambda: float(checker([content])[0])
            )

            return ModerationCategory(
                category="profanity",
                score=score,
                threshold=0.8,
                triggered=score >= 0.8,
            )

        except Exception as e:
            logger.error(f"Profanity check failed: {e}")
            return None

    def _check_blocked_terms(self, content: str) -> ModerationCategory | None:
        """Check for blocked terms."""
        content_lower = content.lower()

        # Check for allowed promotional terms first
        for allowed in self.allowed_promotions:
            if allowed in content_lower:
                # Context suggests legitimate use
                return None

        found_terms = []
        for term in self.blocked_terms:
            if term in content_lower:
                found_terms.append(term)

        if found_terms:
            return ModerationCategory(
                category="blocked_terms",
                score=min(1.0, len(found_terms) * 0.5),
                threshold=0.5,
                triggered=True,
            )

        return None

    async def _check_spam(self, content: str) -> ModerationCategory | None:
        """Check for spam patterns."""
        spam_score = 0.0

        content_lower = content.lower()

        # Check for excessive caps
        if len(content) > 10:
            caps_ratio = sum(1 for c in content if c.isupper()) / len(content)
            if caps_ratio > 0.5:
                spam_score += 0.3

        # Check for excessive punctuation
        punct_ratio = sum(1 for c in content if c in "!?*#@") / max(1, len(content))
        if punct_ratio > 0.1:
            spam_score += 0.2

        # Check for repeated words
        words = content_lower.split()
        if len(words) > 5:
            unique_ratio = len(set(words)) / len(words)
            if unique_ratio < 0.4:
                spam_score += 0.3

        # Check for URLs
        url_indicators = ["http://", "https://", "www.", ".com/", "bit.ly"]
        url_count = sum(1 for ind in url_indicators if ind in content_lower)
        if url_count > 2:
            spam_score += 0.2

        if spam_score > 0:
            return ModerationCategory(
                category="spam",
                score=min(1.0, spam_score),
                threshold=0.6,
                triggered=spam_score >= 0.6,
            )

        return None

    async def _check_policy_violations(
        self, content: str, content_type: ContentType
    ) -> list[ModerationCategory]:
        """Use AI to check for policy violations."""
        from app.models.conversational import get_conversational_model

        model = get_conversational_model()

        content_type_name = content_type.value.replace("_", " ")

        prompt = (
            f"Analyze this {content_type_name} for policy violations.\n\n"
            f"Content: {content[:500]}\n\n"
            f"Check for:\n"
            f"1. Misleading claims (score 0-10)\n"
            f"2. Inappropriate content (score 0-10)\n"
            f"3. Policy violations (score 0-10)\n\n"
            f"Format: MISLEADING:[score] INAPPROPRIATE:[score] POLICY:[score]"
        )

        response = await model.generate_response(message=prompt)

        categories = []

        # Parse response
        response_text = response.response.upper()

        for category_name in ["MISLEADING", "INAPPROPRIATE", "POLICY"]:
            if f"{category_name}:" in response_text:
                try:
                    score_part = response_text.split(f"{category_name}:")[1][:5]
                    score = float("".join(c for c in score_part if c.isdigit() or c == "."))
                    score = min(10, max(0, score)) / 10  # Normalize to 0-1

                    categories.append(
                        ModerationCategory(
                            category=category_name.lower(),
                            score=score,
                            threshold=0.7,
                            triggered=score >= 0.7,
                        )
                    )
                except (ValueError, IndexError):
                    pass

        return categories

    def _calculate_overall_score(self, categories: list[ModerationCategory]) -> float:
        """Calculate overall moderation score."""
        if not categories:
            return 0.0

        # Weight severe categories more heavily
        weights = {
            "severe_toxicity": 2.0,
            "threat": 2.0,
            "toxicity": 1.5,
            "blocked_terms": 1.5,
            "profanity": 1.0,
            "spam": 0.8,
            "misleading": 1.2,
            "inappropriate": 1.0,
            "policy": 1.0,
        }

        total_score = 0.0
        total_weight = 0.0

        for cat in categories:
            weight = weights.get(cat.category, 1.0)
            total_score += cat.score * weight
            total_weight += weight

        return total_score / max(1, total_weight)

    def _determine_action(
        self,
        overall_score: float,
        categories: list[ModerationCategory],
        content_type: ContentType,
    ) -> tuple[ModerationAction, bool]:
        """Determine moderation action."""
        # Check for any critical triggers
        critical_categories = ["severe_toxicity", "threat", "blocked_terms"]
        for cat in categories:
            if cat.category in critical_categories and cat.triggered:
                return ModerationAction.REJECT, True

        # Score-based decision
        if overall_score >= 0.8:
            return ModerationAction.REJECT, True
        elif overall_score >= 0.5:
            return ModerationAction.FLAG, True
        elif overall_score >= 0.3:
            return ModerationAction.QUARANTINE, False
        else:
            return ModerationAction.APPROVE, False

    async def moderate_campaign(
        self,
        campaign_id: str,
        name: str,
        description: str,
        images: list[bytes] | None = None,
    ) -> dict[str, ModerationResult]:
        """
        Moderate a complete campaign.

        Args:
            campaign_id: Campaign ID
            name: Campaign name
            description: Campaign description
            images: Optional list of image bytes

        Returns:
            Dictionary of moderation results by content type
        """
        results = {}

        # Moderate title
        results["title"] = await self.moderate_content(
            name,
            ContentType.CAMPAIGN_TITLE,
            f"{campaign_id}_title",
        )

        # Moderate description
        results["description"] = await self.moderate_content(
            description,
            ContentType.CAMPAIGN_DESCRIPTION,
            f"{campaign_id}_description",
        )

        # Overall campaign decision
        all_safe = all(r.is_safe for r in results.values())
        any_review = any(r.requires_review for r in results.values())

        results["overall"] = ModerationResult(
            content_id=campaign_id,
            content_type=ContentType.CAMPAIGN_DESCRIPTION,
            action=(
                ModerationAction.APPROVE
                if all_safe
                else ModerationAction.FLAG
            ),
            categories=[],
            overall_score=max(r.overall_score for r in results.values()),
            is_safe=all_safe,
            requires_review=any_review,
            reasons=[r for result in results.values() for r in result.reasons],
            suggestions=[s for result in results.values() for s in result.suggestions],
        )

        return results

    async def get_moderation_stats(self) -> dict[str, Any]:
        """Get moderation service statistics."""
        return {
            "enabled": self.enabled,
            "toxicity_threshold": self.toxicity_threshold,
            "profanity_enabled": self.profanity_enabled,
            "blocked_terms_count": len(self.blocked_terms),
        }


# Singleton instance
_moderation_service: ModerationService | None = None


def get_moderation_service() -> ModerationService:
    """Get the singleton moderation service instance."""
    global _moderation_service
    if _moderation_service is None:
        _moderation_service = ModerationService()
    return _moderation_service
