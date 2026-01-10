"""
Analytics Service for FundBrave AI.

Provides AI-powered insights and analytics for campaigns,
user engagement, and platform metrics.
"""

import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any

from loguru import logger

from app.config import settings


@dataclass
class CampaignMetrics:
    """Metrics for a campaign."""

    campaign_id: str
    views: int = 0
    unique_visitors: int = 0
    donations_count: int = 0
    total_raised: float = 0.0
    avg_donation: float = 0.0
    conversion_rate: float = 0.0
    share_count: int = 0
    comment_count: int = 0
    ai_interactions: int = 0
    period_start: datetime | None = None
    period_end: datetime | None = None


@dataclass
class AIInsight:
    """An AI-generated insight."""

    insight_type: str
    title: str
    description: str
    importance: str  # 'low', 'medium', 'high'
    actionable: bool
    recommendations: list[str]
    data_points: dict[str, Any] = field(default_factory=dict)


@dataclass
class AnalyticsReport:
    """Complete analytics report."""

    report_id: str
    report_type: str
    period: dict[str, str]
    summary: dict[str, Any]
    insights: list[AIInsight]
    metrics: dict[str, Any]
    generated_at: datetime = field(default_factory=datetime.utcnow)


class AnalyticsService:
    """
    AI-powered analytics service.

    Features:
    - Campaign performance analysis
    - User engagement metrics
    - AI-generated insights
    - Trend detection
    - Predictive analytics
    """

    def __init__(self):
        """Initialize the analytics service."""
        self.enabled = settings.analytics_enabled
        self.retention_days = settings.metrics_retention_days

        # In-memory storage (production would use database)
        self._campaign_metrics: dict[str, list[CampaignMetrics]] = {}
        self._ai_usage_metrics: dict[str, int] = {}
        self._event_log: list[dict] = []

    async def record_event(
        self,
        event_type: str,
        entity_id: str,
        entity_type: str,
        user_id: str | None = None,
        metadata: dict | None = None,
    ) -> None:
        """
        Record an analytics event.

        Args:
            event_type: Type of event (view, donate, share, etc.)
            entity_id: ID of the entity
            entity_type: Type of entity (campaign, user, etc.)
            user_id: Optional user ID
            metadata: Optional event metadata
        """
        if not self.enabled:
            return

        event = {
            "event_type": event_type,
            "entity_id": entity_id,
            "entity_type": entity_type,
            "user_id": user_id,
            "metadata": metadata or {},
            "timestamp": datetime.utcnow().isoformat(),
        }

        self._event_log.append(event)

        # Prune old events
        if len(self._event_log) > 10000:
            cutoff = datetime.utcnow() - timedelta(days=7)
            self._event_log = [
                e for e in self._event_log
                if datetime.fromisoformat(e["timestamp"]) > cutoff
            ]

    async def get_campaign_analytics(
        self,
        campaign_id: str,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> CampaignMetrics:
        """
        Get analytics for a specific campaign.

        Args:
            campaign_id: Campaign ID
            start_date: Start of analysis period
            end_date: End of analysis period

        Returns:
            CampaignMetrics with aggregated data
        """
        start_date = start_date or datetime.utcnow() - timedelta(days=30)
        end_date = end_date or datetime.utcnow()

        # Filter events for this campaign
        campaign_events = [
            e for e in self._event_log
            if e["entity_id"] == campaign_id
            and start_date <= datetime.fromisoformat(e["timestamp"]) <= end_date
        ]

        # Aggregate metrics
        views = len([e for e in campaign_events if e["event_type"] == "view"])
        unique_visitors = len(set(
            e.get("user_id", e.get("metadata", {}).get("session_id", ""))
            for e in campaign_events if e["event_type"] == "view"
        ))
        donations = [e for e in campaign_events if e["event_type"] == "donate"]
        donations_count = len(donations)
        total_raised = sum(
            e.get("metadata", {}).get("amount", 0) for e in donations
        )
        avg_donation = total_raised / donations_count if donations_count > 0 else 0
        conversion_rate = donations_count / views if views > 0 else 0

        share_count = len([e for e in campaign_events if e["event_type"] == "share"])
        comment_count = len([e for e in campaign_events if e["event_type"] == "comment"])
        ai_interactions = len([e for e in campaign_events if e["event_type"] == "ai_chat"])

        return CampaignMetrics(
            campaign_id=campaign_id,
            views=views,
            unique_visitors=unique_visitors,
            donations_count=donations_count,
            total_raised=total_raised,
            avg_donation=avg_donation,
            conversion_rate=conversion_rate,
            share_count=share_count,
            comment_count=comment_count,
            ai_interactions=ai_interactions,
            period_start=start_date,
            period_end=end_date,
        )

    async def generate_campaign_insights(
        self,
        campaign_id: str,
        metrics: CampaignMetrics | None = None,
    ) -> list[AIInsight]:
        """
        Generate AI-powered insights for a campaign.

        Args:
            campaign_id: Campaign ID
            metrics: Optional pre-computed metrics

        Returns:
            List of AI insights
        """
        if metrics is None:
            metrics = await self.get_campaign_analytics(campaign_id)

        insights = []

        # Conversion rate insight
        if metrics.views > 100:
            if metrics.conversion_rate < 0.01:
                insights.append(
                    AIInsight(
                        insight_type="conversion",
                        title="Low Conversion Rate",
                        description=f"Only {metrics.conversion_rate:.2%} of visitors donate",
                        importance="high",
                        actionable=True,
                        recommendations=[
                            "Add a compelling call-to-action",
                            "Share a personal story in the description",
                            "Add campaign updates to build trust",
                        ],
                    )
                )
            elif metrics.conversion_rate > 0.05:
                insights.append(
                    AIInsight(
                        insight_type="conversion",
                        title="Excellent Conversion Rate",
                        description=f"Your {metrics.conversion_rate:.2%} conversion rate is above average",
                        importance="medium",
                        actionable=False,
                        recommendations=[
                            "Continue engaging with your audience",
                            "Share your success story with other campaigners",
                        ],
                    )
                )

        # Donation size insight
        if metrics.donations_count > 10:
            if metrics.avg_donation < 20:
                insights.append(
                    AIInsight(
                        insight_type="donation_size",
                        title="Small Average Donation",
                        description=f"Average donation is ${metrics.avg_donation:.2f}",
                        importance="medium",
                        actionable=True,
                        recommendations=[
                            "Suggest specific donation amounts ($25, $50, $100)",
                            "Explain what each donation amount achieves",
                            "Consider adding donation tiers with perks",
                        ],
                    )
                )

        # Engagement insight
        engagement_score = (
            metrics.comment_count * 2 +
            metrics.share_count * 3 +
            metrics.ai_interactions
        ) / max(1, metrics.views) * 100

        if engagement_score < 1 and metrics.views > 50:
            insights.append(
                AIInsight(
                    insight_type="engagement",
                    title="Low Engagement",
                    description="Visitors aren't engaging with your campaign",
                    importance="high",
                    actionable=True,
                    recommendations=[
                        "Post regular updates to keep followers engaged",
                        "Respond to comments promptly",
                        "Share your campaign on social media",
                        "Add images or videos to your story",
                    ],
                )
            )

        # AI-generated detailed insight
        ai_insight = await self._generate_ai_insight(campaign_id, metrics)
        if ai_insight:
            insights.append(ai_insight)

        return insights

    async def _generate_ai_insight(
        self,
        campaign_id: str,
        metrics: CampaignMetrics,
    ) -> AIInsight | None:
        """Generate a detailed AI insight."""
        from app.models.conversational import get_conversational_model

        model = get_conversational_model()

        prompt = (
            f"Analyze these campaign metrics and provide one key insight:\n\n"
            f"Views: {metrics.views}\n"
            f"Unique Visitors: {metrics.unique_visitors}\n"
            f"Donations: {metrics.donations_count}\n"
            f"Total Raised: ${metrics.total_raised:.2f}\n"
            f"Average Donation: ${metrics.avg_donation:.2f}\n"
            f"Conversion Rate: {metrics.conversion_rate:.2%}\n"
            f"Shares: {metrics.share_count}\n"
            f"Comments: {metrics.comment_count}\n\n"
            f"Provide: 1) A title, 2) A brief insight, 3) One actionable recommendation"
        )

        response = await model.generate_response(message=prompt)

        # Parse the response into an insight
        return AIInsight(
            insight_type="ai_analysis",
            title="AI Performance Analysis",
            description=response.response,
            importance="medium",
            actionable=True,
            recommendations=["Follow the AI-generated recommendations above"],
            data_points={
                "views": metrics.views,
                "donations": metrics.donations_count,
                "conversion": metrics.conversion_rate,
            },
        )

    async def generate_platform_report(
        self,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> AnalyticsReport:
        """
        Generate platform-wide analytics report.

        Args:
            start_date: Report start date
            end_date: Report end date

        Returns:
            AnalyticsReport with platform metrics
        """
        start_date = start_date or datetime.utcnow() - timedelta(days=30)
        end_date = end_date or datetime.utcnow()

        # Filter events in period
        period_events = [
            e for e in self._event_log
            if start_date <= datetime.fromisoformat(e["timestamp"]) <= end_date
        ]

        # Aggregate metrics
        total_views = len([e for e in period_events if e["event_type"] == "view"])
        total_donations = len([e for e in period_events if e["event_type"] == "donate"])
        total_raised = sum(
            e.get("metadata", {}).get("amount", 0)
            for e in period_events if e["event_type"] == "donate"
        )
        unique_users = len(set(
            e.get("user_id") for e in period_events if e.get("user_id")
        ))
        ai_interactions = len([e for e in period_events if e["event_type"] == "ai_chat"])

        # Calculate daily averages
        days_in_period = max(1, (end_date - start_date).days)
        daily_avg_donations = total_donations / days_in_period
        daily_avg_raised = total_raised / days_in_period

        # Event type distribution
        event_distribution = {}
        for e in period_events:
            event_type = e["event_type"]
            event_distribution[event_type] = event_distribution.get(event_type, 0) + 1

        insights = []

        # Growth insight
        if total_donations > 0:
            insights.append(
                AIInsight(
                    insight_type="growth",
                    title="Platform Activity Summary",
                    description=(
                        f"The platform processed {total_donations} donations "
                        f"totaling ${total_raised:,.2f} from {unique_users} users."
                    ),
                    importance="high",
                    actionable=False,
                    recommendations=[],
                )
            )

        # AI usage insight
        if ai_interactions > 0:
            ai_per_donation = ai_interactions / max(1, total_donations)
            insights.append(
                AIInsight(
                    insight_type="ai_impact",
                    title="AI Assistant Impact",
                    description=(
                        f"{ai_interactions} AI interactions recorded. "
                        f"Ratio of {ai_per_donation:.1f} AI chats per donation."
                    ),
                    importance="medium",
                    actionable=True,
                    recommendations=[
                        "Promote AI assistant in campaign pages",
                        "Add AI suggestions in donation flow",
                    ],
                )
            )

        return AnalyticsReport(
            report_id=f"platform_{start_date.strftime('%Y%m%d')}",
            report_type="platform",
            period={
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
            },
            summary={
                "total_views": total_views,
                "total_donations": total_donations,
                "total_raised": total_raised,
                "unique_users": unique_users,
                "ai_interactions": ai_interactions,
                "daily_avg_donations": daily_avg_donations,
                "daily_avg_raised": daily_avg_raised,
            },
            insights=insights,
            metrics={
                "event_distribution": event_distribution,
                "days_in_period": days_in_period,
            },
        )

    async def get_ai_usage_stats(self) -> dict[str, Any]:
        """Get AI service usage statistics."""
        from app.services.cost_monitor import get_cost_monitor

        cost_monitor = get_cost_monitor()
        usage_summary = await cost_monitor.get_usage_summary()

        return {
            "total_ai_requests": usage_summary.get("total_requests", 0),
            "total_tokens": usage_summary.get("total_tokens", 0),
            "estimated_cost": usage_summary.get("estimated_cost_usd", 0),
            "cache_hit_rate": usage_summary.get("cache_hit_rate", 0),
            "operations": usage_summary.get("operations", {}),
        }

    async def predict_campaign_success(
        self,
        campaign_id: str,
        current_metrics: CampaignMetrics | None = None,
        goal_amount: float = 0,
        days_remaining: int = 30,
    ) -> dict[str, Any]:
        """
        Predict campaign success probability.

        Args:
            campaign_id: Campaign ID
            current_metrics: Current campaign metrics
            goal_amount: Campaign funding goal
            days_remaining: Days until campaign ends

        Returns:
            Prediction with probability and factors
        """
        if current_metrics is None:
            current_metrics = await self.get_campaign_analytics(campaign_id)

        # Simple prediction model
        factors = {
            "current_progress": 0.0,
            "daily_velocity": 0.0,
            "engagement_score": 0.0,
            "conversion_quality": 0.0,
        }

        # Progress factor
        if goal_amount > 0:
            factors["current_progress"] = min(1.0, current_metrics.total_raised / goal_amount)

        # Velocity factor (can we reach goal at current pace?)
        if days_remaining > 0 and current_metrics.period_start:
            days_elapsed = max(1, (datetime.utcnow() - current_metrics.period_start).days)
            daily_rate = current_metrics.total_raised / days_elapsed
            projected_total = current_metrics.total_raised + (daily_rate * days_remaining)
            factors["daily_velocity"] = min(1.0, projected_total / max(1, goal_amount))

        # Engagement factor
        if current_metrics.views > 0:
            engagement = (
                current_metrics.comment_count * 2 +
                current_metrics.share_count * 3
            ) / current_metrics.views
            factors["engagement_score"] = min(1.0, engagement * 10)

        # Conversion quality
        factors["conversion_quality"] = min(1.0, current_metrics.conversion_rate * 10)

        # Weighted prediction
        weights = {
            "current_progress": 0.4,
            "daily_velocity": 0.3,
            "engagement_score": 0.15,
            "conversion_quality": 0.15,
        }

        success_probability = sum(
            factors[f] * weights[f] for f in factors
        )

        # Determine prediction
        if success_probability >= 0.7:
            prediction = "likely_success"
            message = "Campaign is on track to reach its goal"
        elif success_probability >= 0.4:
            prediction = "possible_success"
            message = "Campaign has potential but needs more momentum"
        else:
            prediction = "needs_attention"
            message = "Campaign needs significant boost to reach goal"

        return {
            "campaign_id": campaign_id,
            "success_probability": round(success_probability, 2),
            "prediction": prediction,
            "message": message,
            "factors": factors,
            "projected_total": (
                current_metrics.total_raised +
                (factors["daily_velocity"] * goal_amount * 0.5)
            ),
            "days_remaining": days_remaining,
        }


# Singleton instance
_analytics_service: AnalyticsService | None = None


def get_analytics_service() -> AnalyticsService:
    """Get the singleton analytics service instance."""
    global _analytics_service
    if _analytics_service is None:
        _analytics_service = AnalyticsService()
    return _analytics_service
