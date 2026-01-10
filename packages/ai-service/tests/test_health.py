"""
Tests for health check endpoints.
"""

import pytest
from fastapi.testclient import TestClient


class TestHealthEndpoints:
    """Tests for health check endpoints."""

    def test_root_endpoint(self, client: TestClient):
        """Test the root endpoint returns service info."""
        response = client.get("/")

        assert response.status_code == 200
        data = response.json()

        assert data["service"] == "FundBrave AI Service"
        assert "version" in data
        assert data["status"] == "running"
        assert "environment" in data

    def test_health_check(self, client: TestClient):
        """Test the basic health check endpoint."""
        response = client.get("/api/health")

        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "version" in data
        assert "environment" in data

    def test_readiness_check(self, client: TestClient):
        """Test the readiness check endpoint."""
        response = client.get("/api/health/ready")

        assert response.status_code == 200
        data = response.json()

        assert "status" in data
        assert "models" in data
        assert "gpu_available" in data
        assert "load_models_enabled" in data

        # In mock mode, status should indicate mock
        assert "mock" in data["status"].lower() or data["status"] == "healthy"

    def test_metrics_endpoint(self, client: TestClient):
        """Test the system metrics endpoint."""
        response = client.get("/api/health/metrics")

        assert response.status_code == 200
        data = response.json()

        # These may be None if psutil not available
        assert "cpu_percent" in data
        assert "memory_used_gb" in data
        assert "memory_total_gb" in data
        assert "gpu_memory" in data
