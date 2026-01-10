"""
Cost Monitoring Service for FundBrave AI.

Tracks token usage, inference costs, and provides budget alerts.
Helps optimize AI service costs and prevent budget overruns.
"""

import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any

from loguru import logger

from app.config import settings


@dataclass
class UsageRecord:
    """A single usage record."""

    timestamp: datetime
    operation: str  # 'chat', 'media_verify', 'rag_query', etc.
    input_tokens: int
    output_tokens: int
    model: str
    user_id: str | None = None
    campaign_id: str | None = None
    latency_ms: float = 0.0
    cached: bool = False

    @property
    def total_tokens(self) -> int:
        """Total tokens used."""
        return self.input_tokens + self.output_tokens

    @property
    def estimated_cost(self) -> float:
        """
        Estimate cost based on token usage.

        Using approximate self-hosted costs:
        - Input: $0.001 per 1K tokens (GPU time)
        - Output: $0.002 per 1K tokens (more compute)
        """
        input_cost = (self.input_tokens / 1000) * 0.001
        output_cost = (self.output_tokens / 1000) * 0.002
        return input_cost + output_cost


@dataclass
class DailyUsage:
    """Aggregated daily usage statistics."""

    date: str  # YYYY-MM-DD format
    total_requests: int = 0
    total_input_tokens: int = 0
    total_output_tokens: int = 0
    total_cached_responses: int = 0
    operations: dict[str, int] = field(default_factory=dict)
    models: dict[str, int] = field(default_factory=dict)
    average_latency_ms: float = 0.0
    peak_hour: int = 0
    hourly_distribution: list[int] = field(default_factory=lambda: [0] * 24)

    @property
    def total_tokens(self) -> int:
        """Total tokens used."""
        return self.total_input_tokens + self.total_output_tokens

    @property
    def cache_hit_rate(self) -> float:
        """Cache hit rate percentage."""
        if self.total_requests == 0:
            return 0.0
        return (self.total_cached_responses / self.total_requests) * 100

    @property
    def estimated_cost(self) -> float:
        """Estimate daily cost."""
        input_cost = (self.total_input_tokens / 1000) * 0.001
        output_cost = (self.total_output_tokens / 1000) * 0.002
        return input_cost + output_cost


@dataclass
class BudgetAlert:
    """Budget alert notification."""

    alert_type: str  # 'warning', 'critical', 'exceeded'
    message: str
    current_usage: int
    budget: int
    percentage: float
    timestamp: datetime
    recommendations: list[str]


class CostMonitorService:
    """
    Service for monitoring and optimizing AI service costs.

    Features:
    - Real-time token usage tracking
    - Daily/weekly/monthly usage aggregation
    - Budget alerts and notifications
    - Cost optimization recommendations
    - Usage analytics
    """

    def __init__(self):
        """Initialize the cost monitor service."""
        self.enabled = settings.cost_monitoring_enabled
        self.daily_budget = settings.daily_token_budget
        self.alert_threshold = settings.alert_threshold_percentage

        # In-memory storage (production would use Redis/DB)
        self._usage_records: list[UsageRecord] = []
        self._daily_usage: dict[str, DailyUsage] = {}
        self._alerts: list[BudgetAlert] = []

        # Track current day
        self._current_day = datetime.utcnow().strftime("%Y-%m-%d")
        self._today_tokens = 0

        logger.info(
            f"Cost monitor initialized: enabled={self.enabled}, "
            f"daily_budget={self.daily_budget}"
        )

    async def record_usage(
        self,
        operation: str,
        input_tokens: int,
        output_tokens: int,
        model: str,
        user_id: str | None = None,
        campaign_id: str | None = None,
        latency_ms: float = 0.0,
        cached: bool = False,
    ) -> UsageRecord:
        """
        Record a usage event.

        Args:
            operation: Type of operation
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens
            model: Model identifier used
            user_id: Optional user ID
            campaign_id: Optional campaign ID
            latency_ms: Request latency
            cached: Whether response was cached

        Returns:
            The created usage record
        """
        if not self.enabled:
            return UsageRecord(
                timestamp=datetime.utcnow(),
                operation=operation,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                model=model,
            )

        record = UsageRecord(
            timestamp=datetime.utcnow(),
            operation=operation,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            model=model,
            user_id=user_id,
            campaign_id=campaign_id,
            latency_ms=latency_ms,
            cached=cached,
        )

        self._usage_records.append(record)

        # Update daily aggregation
        await self._update_daily_usage(record)

        # Check budget
        await self._check_budget()

        # Prune old records (keep 7 days in memory)
        await self._prune_old_records()

        return record

    async def _update_daily_usage(self, record: UsageRecord) -> None:
        """Update daily usage statistics."""
        date_str = record.timestamp.strftime("%Y-%m-%d")
        hour = record.timestamp.hour

        if date_str not in self._daily_usage:
            self._daily_usage[date_str] = DailyUsage(date=date_str)

        daily = self._daily_usage[date_str]
        daily.total_requests += 1
        daily.total_input_tokens += record.input_tokens
        daily.total_output_tokens += record.output_tokens

        if record.cached:
            daily.total_cached_responses += 1

        # Update operation counts
        daily.operations[record.operation] = (
            daily.operations.get(record.operation, 0) + 1
        )

        # Update model counts
        daily.models[record.model] = daily.models.get(record.model, 0) + 1

        # Update latency average
        if record.latency_ms > 0:
            total_latency = daily.average_latency_ms * (daily.total_requests - 1)
            daily.average_latency_ms = (
                total_latency + record.latency_ms
            ) / daily.total_requests

        # Update hourly distribution
        daily.hourly_distribution[hour] += 1
        daily.peak_hour = daily.hourly_distribution.index(
            max(daily.hourly_distribution)
        )

        # Update today's token count
        if date_str == self._current_day:
            self._today_tokens += record.total_tokens
        else:
            self._current_day = date_str
            self._today_tokens = record.total_tokens

    async def _check_budget(self) -> None:
        """Check if budget thresholds are exceeded."""
        if not self.enabled:
            return

        percentage = self._today_tokens / self.daily_budget

        if percentage >= 1.0:
            await self._create_alert(
                alert_type="exceeded",
                message=f"Daily token budget exceeded! Used {self._today_tokens:,} of {self.daily_budget:,}",
                percentage=percentage,
            )
        elif percentage >= self.alert_threshold:
            await self._create_alert(
                alert_type="warning",
                message=f"Approaching daily budget: {percentage:.1%} used",
                percentage=percentage,
            )
        elif percentage >= 0.9:
            await self._create_alert(
                alert_type="critical",
                message=f"Critical: {percentage:.1%} of daily budget used",
                percentage=percentage,
            )

    async def _create_alert(
        self, alert_type: str, message: str, percentage: float
    ) -> None:
        """Create a budget alert."""
        # Avoid duplicate alerts
        recent_alerts = [
            a
            for a in self._alerts
            if a.timestamp > datetime.utcnow() - timedelta(hours=1)
            and a.alert_type == alert_type
        ]
        if recent_alerts:
            return

        recommendations = self._get_recommendations(alert_type, percentage)

        alert = BudgetAlert(
            alert_type=alert_type,
            message=message,
            current_usage=self._today_tokens,
            budget=self.daily_budget,
            percentage=percentage,
            timestamp=datetime.utcnow(),
            recommendations=recommendations,
        )

        self._alerts.append(alert)
        logger.warning(f"Budget alert: {message}")

    def _get_recommendations(
        self, alert_type: str, percentage: float
    ) -> list[str]:
        """Get cost optimization recommendations."""
        recommendations = []

        if percentage >= 1.0:
            recommendations.extend([
                "Consider increasing daily budget",
                "Enable aggressive response caching",
                "Route simple queries to smaller models",
                "Implement rate limiting per user",
            ])
        elif percentage >= 0.9:
            recommendations.extend([
                "Enable response caching if not active",
                "Consider using smaller models for simple queries",
                "Review high-usage operations",
            ])
        elif percentage >= self.alert_threshold:
            recommendations.extend([
                "Monitor usage patterns",
                "Optimize prompt lengths",
                "Enable caching for common queries",
            ])

        return recommendations

    async def _prune_old_records(self) -> None:
        """Remove records older than 7 days."""
        cutoff = datetime.utcnow() - timedelta(days=7)
        self._usage_records = [
            r for r in self._usage_records if r.timestamp > cutoff
        ]

        # Keep daily summaries for 30 days
        cutoff_date = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")
        self._daily_usage = {
            k: v for k, v in self._daily_usage.items() if k >= cutoff_date
        }

    async def get_usage_summary(
        self, start_date: str | None = None, end_date: str | None = None
    ) -> dict[str, Any]:
        """
        Get usage summary for a date range.

        Args:
            start_date: Start date (YYYY-MM-DD), default: today
            end_date: End date (YYYY-MM-DD), default: today

        Returns:
            Usage summary dictionary
        """
        if not start_date:
            start_date = datetime.utcnow().strftime("%Y-%m-%d")
        if not end_date:
            end_date = start_date

        # Aggregate daily usage for date range
        total_requests = 0
        total_input_tokens = 0
        total_output_tokens = 0
        total_cached = 0
        operations: dict[str, int] = {}
        models: dict[str, int] = {}
        total_cost = 0.0

        for date_str, daily in self._daily_usage.items():
            if start_date <= date_str <= end_date:
                total_requests += daily.total_requests
                total_input_tokens += daily.total_input_tokens
                total_output_tokens += daily.total_output_tokens
                total_cached += daily.total_cached_responses
                total_cost += daily.estimated_cost

                for op, count in daily.operations.items():
                    operations[op] = operations.get(op, 0) + count
                for model, count in daily.models.items():
                    models[model] = models.get(model, 0) + count

        return {
            "date_range": {"start": start_date, "end": end_date},
            "total_requests": total_requests,
            "total_tokens": total_input_tokens + total_output_tokens,
            "input_tokens": total_input_tokens,
            "output_tokens": total_output_tokens,
            "cached_responses": total_cached,
            "cache_hit_rate": (
                (total_cached / total_requests * 100) if total_requests > 0 else 0
            ),
            "estimated_cost_usd": round(total_cost, 4),
            "operations": operations,
            "models": models,
            "budget": {
                "daily_budget": self.daily_budget,
                "today_usage": self._today_tokens,
                "today_percentage": round(
                    self._today_tokens / self.daily_budget * 100, 2
                ),
                "remaining": max(0, self.daily_budget - self._today_tokens),
            },
        }

    async def get_daily_breakdown(self, date: str | None = None) -> DailyUsage | None:
        """Get detailed breakdown for a specific day."""
        if not date:
            date = datetime.utcnow().strftime("%Y-%m-%d")
        return self._daily_usage.get(date)

    async def get_active_alerts(self) -> list[dict]:
        """Get all active budget alerts."""
        # Return alerts from last 24 hours
        cutoff = datetime.utcnow() - timedelta(hours=24)
        return [
            {
                "type": a.alert_type,
                "message": a.message,
                "current_usage": a.current_usage,
                "budget": a.budget,
                "percentage": round(a.percentage * 100, 2),
                "timestamp": a.timestamp.isoformat(),
                "recommendations": a.recommendations,
            }
            for a in self._alerts
            if a.timestamp > cutoff
        ]

    async def get_optimization_report(self) -> dict[str, Any]:
        """
        Generate a cost optimization report.

        Returns:
            Report with analysis and recommendations
        """
        # Get last 7 days of data
        end_date = datetime.utcnow().strftime("%Y-%m-%d")
        start_date = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")

        summary = await self.get_usage_summary(start_date, end_date)

        # Analyze patterns
        recommendations = []
        insights = []

        # Cache analysis
        if summary["cache_hit_rate"] < 20:
            recommendations.append({
                "priority": "high",
                "area": "caching",
                "suggestion": "Enable aggressive caching - current hit rate is low",
                "potential_savings": "Up to 30% token reduction",
            })
            insights.append("Low cache utilization detected")

        # Model usage analysis
        if "conversational" in str(summary.get("models", {})):
            recommendations.append({
                "priority": "medium",
                "area": "model_routing",
                "suggestion": "Consider routing simple queries to smaller models",
                "potential_savings": "Up to 50% cost reduction for simple queries",
            })

        # Peak hour analysis
        today_usage = await self.get_daily_breakdown()
        if today_usage and today_usage.peak_hour:
            insights.append(
                f"Peak usage hour: {today_usage.peak_hour}:00 UTC"
            )

        # Token efficiency
        if summary["total_requests"] > 0:
            avg_tokens_per_request = summary["total_tokens"] / summary["total_requests"]
            if avg_tokens_per_request > 500:
                recommendations.append({
                    "priority": "medium",
                    "area": "prompts",
                    "suggestion": "Optimize prompt lengths - average tokens per request is high",
                    "potential_savings": "10-20% token reduction",
                })
                insights.append(
                    f"Average tokens per request: {avg_tokens_per_request:.0f}"
                )

        return {
            "period": {"start": start_date, "end": end_date},
            "summary": {
                "total_requests": summary["total_requests"],
                "total_tokens": summary["total_tokens"],
                "estimated_cost_usd": summary["estimated_cost_usd"],
                "cache_hit_rate": summary["cache_hit_rate"],
            },
            "insights": insights,
            "recommendations": recommendations,
            "budget_status": summary["budget"],
        }

    async def reset_daily_usage(self) -> None:
        """Reset daily usage counters (for testing or manual reset)."""
        self._current_day = datetime.utcnow().strftime("%Y-%m-%d")
        self._today_tokens = 0
        self._alerts = [
            a
            for a in self._alerts
            if a.timestamp > datetime.utcnow() - timedelta(hours=1)
        ]
        logger.info("Daily usage counters reset")


# Singleton instance
_cost_monitor: CostMonitorService | None = None


def get_cost_monitor() -> CostMonitorService:
    """Get the singleton cost monitor service instance."""
    global _cost_monitor
    if _cost_monitor is None:
        _cost_monitor = CostMonitorService()
    return _cost_monitor
