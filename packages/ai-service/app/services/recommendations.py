"""
Campaign Recommendation Engine for FundBrave AI.

Provides personalized campaign recommendations based on user behavior,
preferences, and content similarity.
"""

import asyncio
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from loguru import logger

from app.config import settings


@dataclass
class Campaign:
    """Campaign data for recommendations."""

    id: str
    name: str
    description: str
    category: str
    goal_amount: float
    raised_amount: float
    creator_id: str
    created_at: datetime
    tags: list[str] = field(default_factory=list)
    image_urls: list[str] = field(default_factory=list)
    embedding: list[float] | None = None

    @property
    def funding_percentage(self) -> float:
        """Calculate funding percentage."""
        if self.goal_amount <= 0:
            return 0.0
        return min(100.0, (self.raised_amount / self.goal_amount) * 100)


@dataclass
class UserProfile:
    """User profile for personalized recommendations."""

    user_id: str
    viewed_campaigns: list[str] = field(default_factory=list)
    donated_campaigns: list[str] = field(default_factory=list)
    favorite_categories: list[str] = field(default_factory=list)
    interaction_history: list[dict] = field(default_factory=list)
    embedding: list[float] | None = None


@dataclass
class Recommendation:
    """A campaign recommendation."""

    campaign: Campaign
    score: float
    reason: str
    recommendation_type: str  # 'similar', 'trending', 'personalized', 'category'


class RecommendationEngine:
    """
    Campaign recommendation engine.

    Features:
    - Content-based filtering (similar campaigns)
    - Collaborative filtering (user behavior patterns)
    - Trending campaigns detection
    - Category-based recommendations
    - Personalized recommendations
    """

    def __init__(self):
        """Initialize the recommendation engine."""
        self._embedder = None
        self._campaign_cache: dict[str, Campaign] = {}
        self._user_profiles: dict[str, UserProfile] = {}

    async def _get_embeddings(self, texts: list[str]) -> list[list[float]]:
        """Get text embeddings for similarity computation."""
        if self._embedder is None:
            try:
                from sentence_transformers import SentenceTransformer

                self._embedder = SentenceTransformer(settings.embedding_model)
                logger.info(f"Loaded embedding model: {settings.embedding_model}")
            except ImportError:
                logger.warning("sentence-transformers not available, using mock embeddings")
                import random
                return [[random.random() for _ in range(384)] for _ in texts]

        loop = asyncio.get_event_loop()
        embeddings = await loop.run_in_executor(
            None, lambda: self._embedder.encode(texts).tolist()
        )
        return embeddings

    def _cosine_similarity(self, vec1: list[float], vec2: list[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        import math

        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        norm1 = math.sqrt(sum(a * a for a in vec1))
        norm2 = math.sqrt(sum(b * b for b in vec2))

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return dot_product / (norm1 * norm2)

    async def _compute_campaign_embedding(self, campaign: Campaign) -> list[float]:
        """Compute embedding for a campaign."""
        text = f"{campaign.name}. {campaign.description}. Category: {campaign.category}. Tags: {', '.join(campaign.tags)}"
        embeddings = await self._get_embeddings([text])
        return embeddings[0]

    async def _compute_user_embedding(self, profile: UserProfile) -> list[float]:
        """Compute embedding for user interests based on their history."""
        if not profile.donated_campaigns and not profile.viewed_campaigns:
            return []

        # Combine user interests
        interest_campaigns = list(set(profile.donated_campaigns + profile.viewed_campaigns[:5]))
        campaign_embeddings = []

        for campaign_id in interest_campaigns:
            if campaign_id in self._campaign_cache:
                campaign = self._campaign_cache[campaign_id]
                if campaign.embedding:
                    campaign_embeddings.append(campaign.embedding)

        if not campaign_embeddings:
            return []

        # Average embeddings
        num_dims = len(campaign_embeddings[0])
        avg_embedding = [
            sum(emb[i] for emb in campaign_embeddings) / len(campaign_embeddings)
            for i in range(num_dims)
        ]

        return avg_embedding

    async def get_similar_campaigns(
        self,
        campaign_id: str,
        campaigns: list[Campaign],
        limit: int = 5,
    ) -> list[Recommendation]:
        """
        Get campaigns similar to a given campaign.

        Args:
            campaign_id: ID of the source campaign
            campaigns: List of candidate campaigns
            limit: Maximum recommendations to return

        Returns:
            List of similar campaign recommendations
        """
        # Find source campaign
        source_campaign = None
        for c in campaigns:
            if c.id == campaign_id:
                source_campaign = c
                break

        if source_campaign is None:
            logger.warning(f"Campaign {campaign_id} not found")
            return []

        # Compute embedding for source
        if source_campaign.embedding is None:
            source_campaign.embedding = await self._compute_campaign_embedding(source_campaign)

        # Compute similarities
        recommendations = []
        for campaign in campaigns:
            if campaign.id == campaign_id:
                continue

            if campaign.embedding is None:
                campaign.embedding = await self._compute_campaign_embedding(campaign)

            similarity = self._cosine_similarity(
                source_campaign.embedding, campaign.embedding
            )

            # Category boost
            if campaign.category == source_campaign.category:
                similarity *= 1.2

            # Tag overlap boost
            common_tags = set(campaign.tags) & set(source_campaign.tags)
            if common_tags:
                similarity *= (1 + 0.1 * len(common_tags))

            recommendations.append(
                Recommendation(
                    campaign=campaign,
                    score=min(1.0, similarity),
                    reason=f"Similar to campaigns you've viewed",
                    recommendation_type="similar",
                )
            )

        # Sort by score and return top results
        recommendations.sort(key=lambda r: r.score, reverse=True)
        return recommendations[:limit]

    async def get_personalized_recommendations(
        self,
        user_id: str,
        campaigns: list[Campaign],
        limit: int = 10,
    ) -> list[Recommendation]:
        """
        Get personalized campaign recommendations for a user.

        Args:
            user_id: User ID
            campaigns: List of candidate campaigns
            limit: Maximum recommendations to return

        Returns:
            List of personalized recommendations
        """
        profile = self._user_profiles.get(user_id)

        if profile is None:
            # Return trending campaigns for new users
            return await self.get_trending_campaigns(campaigns, limit)

        # Compute user embedding
        user_embedding = await self._compute_user_embedding(profile)

        if not user_embedding:
            return await self.get_trending_campaigns(campaigns, limit)

        recommendations = []

        for campaign in campaigns:
            # Skip already donated or heavily viewed campaigns
            if campaign.id in profile.donated_campaigns:
                continue

            if campaign.embedding is None:
                campaign.embedding = await self._compute_campaign_embedding(campaign)

            # Calculate personalization score
            similarity = self._cosine_similarity(user_embedding, campaign.embedding)

            # Category preference boost
            if campaign.category in profile.favorite_categories:
                similarity *= 1.3

            # Recency boost (newer campaigns get slight boost)
            days_old = (datetime.utcnow() - campaign.created_at).days
            recency_factor = max(0.5, 1.0 - (days_old / 60) * 0.5)
            similarity *= recency_factor

            # Funding progress factor (prefer campaigns that need help)
            if 20 < campaign.funding_percentage < 80:
                similarity *= 1.1

            recommendations.append(
                Recommendation(
                    campaign=campaign,
                    score=min(1.0, similarity),
                    reason=self._generate_reason(campaign, profile),
                    recommendation_type="personalized",
                )
            )

        recommendations.sort(key=lambda r: r.score, reverse=True)
        return recommendations[:limit]

    async def get_trending_campaigns(
        self,
        campaigns: list[Campaign],
        limit: int = 10,
    ) -> list[Recommendation]:
        """
        Get trending campaigns based on engagement metrics.

        Args:
            campaigns: List of candidate campaigns
            limit: Maximum recommendations to return

        Returns:
            List of trending campaign recommendations
        """
        recommendations = []

        for campaign in campaigns:
            # Calculate trending score
            score = 0.0

            # Funding velocity (raised amount relative to time)
            days_old = max(1, (datetime.utcnow() - campaign.created_at).days)
            velocity = campaign.raised_amount / days_old
            score += min(1.0, velocity / 10000) * 0.4

            # Funding progress (mid-range campaigns are hot)
            progress = campaign.funding_percentage
            if 30 <= progress <= 70:
                score += 0.3
            elif progress > 70:
                score += 0.2

            # Recency bonus
            if days_old <= 7:
                score += 0.3
            elif days_old <= 14:
                score += 0.2
            elif days_old <= 30:
                score += 0.1

            recommendations.append(
                Recommendation(
                    campaign=campaign,
                    score=min(1.0, score),
                    reason="Trending on FundBrave",
                    recommendation_type="trending",
                )
            )

        recommendations.sort(key=lambda r: r.score, reverse=True)
        return recommendations[:limit]

    async def get_category_recommendations(
        self,
        category: str,
        campaigns: list[Campaign],
        limit: int = 10,
    ) -> list[Recommendation]:
        """
        Get recommendations for a specific category.

        Args:
            category: Category name
            campaigns: List of candidate campaigns
            limit: Maximum recommendations to return

        Returns:
            List of category-based recommendations
        """
        # Filter by category
        category_campaigns = [c for c in campaigns if c.category.lower() == category.lower()]

        if not category_campaigns:
            return []

        recommendations = []
        for campaign in category_campaigns:
            # Score based on engagement and funding progress
            score = 0.5  # Base score for being in category

            # Funding progress
            progress = campaign.funding_percentage
            if 20 <= progress <= 80:
                score += 0.2

            # Recency
            days_old = (datetime.utcnow() - campaign.created_at).days
            if days_old <= 14:
                score += 0.2
            elif days_old <= 30:
                score += 0.1

            # Amount raised (social proof)
            if campaign.raised_amount > 1000:
                score += 0.1

            recommendations.append(
                Recommendation(
                    campaign=campaign,
                    score=min(1.0, score),
                    reason=f"Popular in {category}",
                    recommendation_type="category",
                )
            )

        recommendations.sort(key=lambda r: r.score, reverse=True)
        return recommendations[:limit]

    def _generate_reason(self, campaign: Campaign, profile: UserProfile) -> str:
        """Generate a personalized reason for the recommendation."""
        reasons = []

        if campaign.category in profile.favorite_categories:
            reasons.append(f"You like {campaign.category} campaigns")

        if campaign.funding_percentage < 50:
            reasons.append("Needs support to reach goal")

        if not reasons:
            reasons.append("Based on your interests")

        return ". ".join(reasons)

    async def update_user_profile(
        self,
        user_id: str,
        action: str,
        campaign_id: str,
        metadata: dict | None = None,
    ) -> None:
        """
        Update user profile based on an action.

        Args:
            user_id: User ID
            action: Action type ('view', 'donate', 'share', 'favorite')
            campaign_id: Campaign ID
            metadata: Additional action metadata
        """
        if user_id not in self._user_profiles:
            self._user_profiles[user_id] = UserProfile(user_id=user_id)

        profile = self._user_profiles[user_id]

        # Record interaction
        profile.interaction_history.append({
            "action": action,
            "campaign_id": campaign_id,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata or {},
        })

        # Update specific lists
        if action == "view":
            if campaign_id not in profile.viewed_campaigns:
                profile.viewed_campaigns.append(campaign_id)
                # Keep last 50 views
                profile.viewed_campaigns = profile.viewed_campaigns[-50:]

        elif action == "donate":
            if campaign_id not in profile.donated_campaigns:
                profile.donated_campaigns.append(campaign_id)

        # Update category preferences
        if campaign_id in self._campaign_cache:
            campaign = self._campaign_cache[campaign_id]
            category = campaign.category

            if action in ["donate", "favorite"]:
                if category not in profile.favorite_categories:
                    profile.favorite_categories.append(category)

        # Recompute user embedding
        profile.embedding = await self._compute_user_embedding(profile)

    async def cache_campaign(self, campaign: Campaign) -> None:
        """Cache a campaign for recommendation processing."""
        self._campaign_cache[campaign.id] = campaign

        # Compute embedding
        if campaign.embedding is None:
            campaign.embedding = await self._compute_campaign_embedding(campaign)

    async def get_ai_suggestions(
        self,
        campaign: Campaign,
    ) -> dict[str, Any]:
        """
        Get AI-powered suggestions to improve a campaign.

        Args:
            campaign: Campaign to analyze

        Returns:
            Dictionary with improvement suggestions
        """
        from app.models.conversational import get_conversational_model

        model = get_conversational_model()

        prompt = (
            f"Analyze this fundraising campaign and provide specific suggestions to improve it.\n\n"
            f"Campaign Title: {campaign.name}\n"
            f"Category: {campaign.category}\n"
            f"Description: {campaign.description[:500]}...\n"
            f"Goal: ${campaign.goal_amount:,.2f}\n"
            f"Raised: ${campaign.raised_amount:,.2f} ({campaign.funding_percentage:.1f}%)\n"
            f"Tags: {', '.join(campaign.tags)}\n\n"
            f"Provide 3-5 specific, actionable suggestions to improve this campaign's effectiveness. "
            f"Consider: title appeal, description clarity, goal reasonableness, and presentation."
        )

        response = await model.generate_response(message=prompt)

        return {
            "campaign_id": campaign.id,
            "suggestions": response.response,
            "confidence": response.confidence,
            "areas_analyzed": ["title", "description", "goal", "presentation"],
        }


# Singleton instance
_recommendation_engine: RecommendationEngine | None = None


def get_recommendation_engine() -> RecommendationEngine:
    """Get the singleton recommendation engine instance."""
    global _recommendation_engine
    if _recommendation_engine is None:
        _recommendation_engine = RecommendationEngine()
    return _recommendation_engine
