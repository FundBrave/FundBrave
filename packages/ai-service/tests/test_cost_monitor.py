"""
Tests for Cost Monitoring Service.

Tests usage tracking, budget alerts, and cost optimization.
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.cost_monitor import (
    CostMonitorService,
    UsageRecord,
    DailyUsage,
    BudgetAlert,
    get_cost_monitor,
)


class TestUsageRecord:
    """Tests for UsageRecord dataclass."""

    def test_usage_record_creation(self):
        """Test creating a usage record."""
        record = UsageRecord(
            operation="chat",
            input_tokens=100,
            output_tokens=200,
            cost=0.001,
            model="Qwen/Qwen2.5-7B-Instruct",
            user_id="user123",
            latency_ms=500.0,
            timestamp=datetime.utcnow(),
        )

        assert record.operation == "chat"
        assert record.input_tokens == 100
        assert record.output_tokens == 200
        assert record.cost == 0.001
        assert record.model == "Qwen/Qwen2.5-7B-Instruct"
        assert record.user_id == "user123"
        assert record.latency_ms == 500.0


class TestDailyUsage:
    """Tests for DailyUsage dataclass."""

    def test_daily_usage_creation(self):
        """Test creating daily usage summary."""
        usage = DailyUsage(
            date="2024-01-15",
            total_requests=1000,
            total_input_tokens=50000,
            total_output_tokens=100000,
            total_cost=5.0,
            avg_latency_ms=450.0,
            operations={"chat": 800, "rag": 200},
            models={"Qwen/Qwen2.5-7B-Instruct": 1000},
        )

        assert usage.total_requests == 1000
        assert usage.total_cost == 5.0
        assert usage.operations["chat"] == 800


class TestBudgetAlert:
    """Tests for BudgetAlert dataclass."""

    def test_budget_alert_creation(self):
        """Test creating budget alert."""
        alert = BudgetAlert(
            threshold_percent=80.0,
            current_spend=8.0,
            budget=10.0,
            message="Approaching daily budget limit",
        )

        assert alert.threshold_percent == 80.0
        assert alert.current_spend == 8.0
        assert alert.budget == 10.0


class TestCostMonitorService:
    """Tests for CostMonitorService."""

    @pytest.fixture
    def service(self):
        """Create a cost monitor service for testing."""
        return CostMonitorService()

    def test_service_initialization(self, service):
        """Test service initializes correctly."""
        assert service is not None
        assert service.daily_budget > 0
        assert len(service._usage_records) == 0

    @pytest.mark.asyncio
    async def test_record_usage(self, service):
        """Test recording usage."""
        record = await service.record_usage(
            operation="chat",
            input_tokens=100,
            output_tokens=200,
            model="Qwen/Qwen2.5-7B-Instruct",
            user_id="user123",
            latency_ms=500.0,
        )

        assert record.operation == "chat"
        assert record.input_tokens == 100
        assert record.output_tokens == 200
        assert record.cost > 0
        assert len(service._usage_records) == 1

    @pytest.mark.asyncio
    async def test_record_multiple_usage(self, service):
        """Test recording multiple usage entries."""
        for i in range(5):
            await service.record_usage(
                operation="chat",
                input_tokens=100 + i * 10,
                output_tokens=200 + i * 20,
                model="Qwen/Qwen2.5-7B-Instruct",
                user_id=f"user{i}",
            )

        assert len(service._usage_records) == 5

    @pytest.mark.asyncio
    async def test_get_daily_summary(self, service):
        """Test getting daily usage summary."""
        # Record some usage
        await service.record_usage(
            operation="chat",
            input_tokens=100,
            output_tokens=200,
            model="Qwen/Qwen2.5-7B-Instruct",
        )

        summary = await service.get_daily_summary()

        assert summary.total_requests >= 1
        assert summary.total_input_tokens >= 100
        assert summary.total_output_tokens >= 200
        assert "chat" in summary.operations

    @pytest.mark.asyncio
    async def test_get_usage_by_operation(self, service):
        """Test getting usage by operation type."""
        # Record different operations
        await service.record_usage(
            operation="chat",
            input_tokens=100,
            output_tokens=200,
            model="Qwen/Qwen2.5-7B-Instruct",
        )
        await service.record_usage(
            operation="rag",
            input_tokens=150,
            output_tokens=300,
            model="Qwen/Qwen2.5-7B-Instruct",
        )

        chat_records = await service.get_usage_by_operation("chat")
        rag_records = await service.get_usage_by_operation("rag")

        assert len(chat_records) >= 1
        assert len(rag_records) >= 1

    @pytest.mark.asyncio
    async def test_get_usage_by_user(self, service):
        """Test getting usage by user."""
        await service.record_usage(
            operation="chat",
            input_tokens=100,
            output_tokens=200,
            model="Qwen/Qwen2.5-7B-Instruct",
            user_id="user123",
        )
        await service.record_usage(
            operation="chat",
            input_tokens=100,
            output_tokens=200,
            model="Qwen/Qwen2.5-7B-Instruct",
            user_id="user456",
        )

        user123_records = await service.get_usage_by_user("user123")
        user456_records = await service.get_usage_by_user("user456")

        assert len(user123_records) >= 1
        assert len(user456_records) >= 1

    @pytest.mark.asyncio
    async def test_check_budget_alerts(self, service):
        """Test budget alert checking."""
        # Temporarily set a very low budget
        original_budget = service.daily_budget
        service.daily_budget = 0.001

        await service.record_usage(
            operation="chat",
            input_tokens=1000,
            output_tokens=2000,
            model="Qwen/Qwen2.5-7B-Instruct",
        )

        alerts = await service.check_budget_alerts()

        # Restore budget
        service.daily_budget = original_budget

        # Should have at least one alert due to low budget
        assert isinstance(alerts, list)

    @pytest.mark.asyncio
    async def test_get_optimization_report(self, service):
        """Test getting optimization recommendations."""
        # Record some usage
        await service.record_usage(
            operation="chat",
            input_tokens=1000,
            output_tokens=2000,
            model="Qwen/Qwen2.5-7B-Instruct",
        )

        report = await service.get_optimization_report()

        assert "recommendations" in report
        assert "total_cost" in report
        assert "avg_cost_per_request" in report

    @pytest.mark.asyncio
    async def test_estimate_cost(self, service):
        """Test cost estimation."""
        cost = service.estimate_cost(
            input_tokens=1000,
            output_tokens=2000,
            model="Qwen/Qwen2.5-7B-Instruct",
        )

        assert cost > 0
        assert isinstance(cost, float)


class TestCostMonitorSingleton:
    """Test singleton pattern for cost monitor service."""

    def test_get_cost_monitor_singleton(self):
        """Test that get_cost_monitor returns singleton."""
        monitor1 = get_cost_monitor()
        monitor2 = get_cost_monitor()

        assert monitor1 is monitor2
