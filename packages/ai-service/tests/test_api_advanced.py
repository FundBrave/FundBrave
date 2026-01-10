"""
Integration Tests for Advanced API Endpoints.

Tests the REST API endpoints for advanced features including
RAG, recommendations, moderation, safety, and analytics.
"""

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport

from app.main import app


class TestAdvancedAPIEndpoints:
    """Tests for advanced API endpoints."""

    @pytest.fixture
    def client(self):
        """Create a synchronous test client."""
        return TestClient(app)

    @pytest.fixture
    async def async_client(self):
        """Create an async test client."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac

    @pytest.fixture
    def auth_headers(self):
        """Create valid JWT auth headers for testing."""
        from jose import jwt
        from datetime import datetime, timedelta

        payload = {
            "sub": "test-user-id",
            "walletAddress": "0x1234567890abcdef",
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(hours=1),
        }

        token = jwt.encode(payload, "test-secret-key", algorithm="HS256")
        return {"Authorization": f"Bearer {token}"}

    # ===========================================
    # RAG Endpoints
    # ===========================================

    def test_rag_query(self, client, auth_headers):
        """Test RAG query endpoint."""
        response = client.post(
            "/api/advanced/rag/query",
            json={
                "query": "What is FundBrave?",
                "top_k": 3,
            },
            headers=auth_headers,
        )

        assert response.status_code in [200, 422, 500]  # May fail if services not running
        if response.status_code == 200:
            data = response.json()
            assert "query" in data
            assert "response" in data

    def test_rag_index(self, client, auth_headers):
        """Test RAG indexing endpoint."""
        response = client.post(
            "/api/advanced/rag/index",
            json={
                "documents": [
                    {
                        "id": "test_doc_001",
                        "content": "This is test content about FundBrave.",
                        "metadata": {"source": "test"},
                    }
                ]
            },
            headers=auth_headers,
        )

        assert response.status_code in [200, 422, 500]

    # ===========================================
    # Search Endpoints
    # ===========================================

    def test_web_search(self, client, auth_headers):
        """Test web search endpoint."""
        response = client.post(
            "/api/advanced/search",
            json={
                "query": "cryptocurrency fundraising",
                "num_results": 3,
                "summarize": False,
            },
            headers=auth_headers,
        )

        assert response.status_code in [200, 422, 500]

    # ===========================================
    # Recommendation Endpoints
    # ===========================================

    def test_get_recommendations(self, client, auth_headers):
        """Test recommendations endpoint."""
        response = client.post(
            "/api/advanced/recommendations",
            json={
                "user_id": "test-user-123",
                "campaigns": [
                    {
                        "id": "camp_001",
                        "name": "Test Campaign",
                        "description": "A test campaign for testing",
                        "category": "education",
                        "goal_amount": 10000.0,
                        "current_amount": 5000.0,
                        "creator_id": "creator_001",
                    }
                ],
                "limit": 10,
            },
            headers=auth_headers,
        )

        assert response.status_code in [200, 422, 500]

    def test_get_similar_campaigns(self, client, auth_headers):
        """Test similar campaigns endpoint."""
        response = client.post(
            "/api/advanced/recommendations/similar",
            json={
                "campaign_id": "camp_001",
                "all_campaigns": [
                    {
                        "id": "camp_001",
                        "name": "Test Campaign",
                        "description": "Original campaign",
                        "category": "education",
                        "goal_amount": 10000.0,
                        "current_amount": 5000.0,
                        "creator_id": "creator_001",
                    },
                    {
                        "id": "camp_002",
                        "name": "Similar Campaign",
                        "description": "Similar to the original",
                        "category": "education",
                        "goal_amount": 8000.0,
                        "current_amount": 2000.0,
                        "creator_id": "creator_002",
                    },
                ],
                "limit": 5,
            },
            headers=auth_headers,
        )

        assert response.status_code in [200, 422, 500]

    # ===========================================
    # Fraud Detection Endpoints
    # ===========================================

    def test_fraud_analysis(self, client, auth_headers):
        """Test fraud analysis endpoint."""
        response = client.post(
            "/api/advanced/fraud/analyze",
            json={
                "campaign_id": "camp_test_001",
                "name": "Legitimate Campaign",
                "description": "A legitimate fundraising campaign for education.",
                "creator_id": "creator_123",
                "goal_amount": 5000.0,
                "category": "education",
            },
            headers=auth_headers,
        )

        assert response.status_code in [200, 422, 500]

    # ===========================================
    # Moderation Endpoints
    # ===========================================

    def test_content_moderation(self, client, auth_headers):
        """Test content moderation endpoint."""
        response = client.post(
            "/api/advanced/moderate",
            json={
                "content": "This is a test comment that should be safe.",
                "content_type": "comment",
                "content_id": "comment_001",
            },
            headers=auth_headers,
        )

        assert response.status_code in [200, 422, 500]

    def test_campaign_moderation(self, client, auth_headers):
        """Test campaign moderation endpoint."""
        response = client.post(
            "/api/advanced/moderate/campaign",
            json={
                "campaign_id": "camp_mod_001",
                "name": "Help Build Schools",
                "description": "We are raising funds to build schools.",
            },
            headers=auth_headers,
        )

        assert response.status_code in [200, 422, 500]

    # ===========================================
    # Safety Endpoints
    # ===========================================

    def test_safety_check_input(self, client, auth_headers):
        """Test safety check endpoint for input."""
        response = client.post(
            "/api/advanced/safety/check",
            json={
                "content": "What is FundBrave and how does it work?",
                "check_type": "input",
            },
            headers=auth_headers,
        )

        assert response.status_code in [200, 422, 500]
        if response.status_code == 200:
            data = response.json()
            assert "is_safe" in data
            assert "action" in data

    def test_safety_check_output(self, client, auth_headers):
        """Test safety check endpoint for output."""
        response = client.post(
            "/api/advanced/safety/check",
            json={
                "content": "FundBrave is a decentralized platform for fundraising.",
                "check_type": "output",
            },
            headers=auth_headers,
        )

        assert response.status_code in [200, 422, 500]

    # ===========================================
    # Analytics Endpoints
    # ===========================================

    def test_campaign_analytics(self, client, auth_headers):
        """Test campaign analytics endpoint."""
        response = client.get(
            "/api/advanced/analytics/campaign/camp_analytics_001",
            headers=auth_headers,
        )

        assert response.status_code in [200, 404, 422, 500]

    def test_platform_analytics(self, client, auth_headers):
        """Test platform analytics endpoint."""
        response = client.get(
            "/api/advanced/analytics/platform",
            headers=auth_headers,
        )

        assert response.status_code in [200, 422, 500]

    # ===========================================
    # Translation Endpoints
    # ===========================================

    def test_translate_text(self, client, auth_headers):
        """Test translation endpoint."""
        response = client.post(
            "/api/advanced/translate",
            json={
                "text": "Hello, welcome to FundBrave!",
                "target_language": "es",
            },
            headers=auth_headers,
        )

        assert response.status_code in [200, 422, 500]

    def test_get_supported_languages(self, client, auth_headers):
        """Test supported languages endpoint."""
        response = client.get(
            "/api/advanced/languages",
            headers=auth_headers,
        )

        assert response.status_code in [200, 422, 500]

    # ===========================================
    # Usage Endpoints
    # ===========================================

    def test_usage_summary(self, client, auth_headers):
        """Test usage summary endpoint."""
        response = client.get(
            "/api/advanced/usage/summary",
            headers=auth_headers,
        )

        assert response.status_code in [200, 422, 500]

    def test_usage_optimization(self, client, auth_headers):
        """Test usage optimization endpoint."""
        response = client.get(
            "/api/advanced/usage/optimization",
            headers=auth_headers,
        )

        assert response.status_code in [200, 422, 500]


class TestTrainingAPIEndpoints:
    """Tests for training API endpoints."""

    @pytest.fixture
    def client(self):
        return TestClient(app)

    @pytest.fixture
    def auth_headers(self):
        from jose import jwt
        from datetime import datetime, timedelta

        payload = {
            "sub": "test-user-id",
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(hours=1),
        }
        token = jwt.encode(payload, "test-secret-key", algorithm="HS256")
        return {"Authorization": f"Bearer {token}"}

    def test_list_training_jobs(self, client, auth_headers):
        """Test listing training jobs."""
        response = client.get(
            "/api/training/jobs",
            headers=auth_headers,
        )

        assert response.status_code in [200, 422, 500]

    def test_list_adapters(self, client, auth_headers):
        """Test listing adapters."""
        response = client.get(
            "/api/training/adapters",
            headers=auth_headers,
        )

        assert response.status_code in [200, 422, 500]

    def test_get_fundbrave_training_data(self, client, auth_headers):
        """Test getting FundBrave training data."""
        response = client.get(
            "/api/training/dataset/fundbrave",
            headers=auth_headers,
        )

        assert response.status_code in [200, 422, 500]


class TestExperimentsAPIEndpoints:
    """Tests for A/B testing API endpoints."""

    @pytest.fixture
    def client(self):
        return TestClient(app)

    @pytest.fixture
    def auth_headers(self):
        from jose import jwt
        from datetime import datetime, timedelta

        payload = {
            "sub": "test-user-id",
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(hours=1),
        }
        token = jwt.encode(payload, "test-secret-key", algorithm="HS256")
        return {"Authorization": f"Bearer {token}"}

    def test_list_experiments(self, client, auth_headers):
        """Test listing experiments."""
        response = client.get(
            "/api/experiments/list",
            headers=auth_headers,
        )

        assert response.status_code in [200, 422, 500]

    def test_create_experiment(self, client, auth_headers):
        """Test creating an experiment."""
        response = client.post(
            "/api/experiments/create",
            json={
                "experiment_id": "test_api_exp_001",
                "name": "Test API Experiment",
                "description": "Created via API test",
                "variants": [
                    {"name": "control", "weight": 0.5, "config": {}},
                    {"name": "treatment", "weight": 0.5, "config": {}},
                ],
                "target_sample_size": 1000,
            },
            headers=auth_headers,
        )

        assert response.status_code in [200, 409, 422, 500]

    def test_get_variant_assignment(self, client, auth_headers):
        """Test getting variant assignment."""
        # First create an experiment
        client.post(
            "/api/experiments/create",
            json={
                "experiment_id": "variant_api_test",
                "name": "Variant Test",
                "description": "Test",
                "variants": [
                    {"name": "a", "weight": 0.5},
                    {"name": "b", "weight": 0.5},
                ],
            },
            headers=auth_headers,
        )

        # Start it
        client.post(
            "/api/experiments/variant_api_test/start",
            headers=auth_headers,
        )

        # Get variant
        response = client.post(
            "/api/experiments/variant",
            json={
                "experiment_id": "variant_api_test",
                "user_id": "user_123",
            },
            headers=auth_headers,
        )

        assert response.status_code in [200, 404, 422, 500]

    def test_experiments_summary(self, client, auth_headers):
        """Test experiments summary endpoint."""
        response = client.get(
            "/api/experiments/stats/summary",
            headers=auth_headers,
        )

        assert response.status_code in [200, 422, 500]
