"""
Pytest configuration and fixtures for FundBrave AI Service tests.
"""

import os
import pytest
from typing import AsyncGenerator
from pathlib import Path

# Set test environment before imports
os.environ["ENVIRONMENT"] = "development"
os.environ["LOAD_MODELS"] = "false"
os.environ["JWT_SECRET"] = "test-secret-key"
os.environ["REDIS_URL"] = "redis://localhost:6379"
os.environ["SAFETY_ENABLED"] = "true"
os.environ["AB_TESTING_ENABLED"] = "true"
os.environ["MODEL_ROUTING_ENABLED"] = "true"

from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.config import Settings, get_settings


@pytest.fixture(scope="session")
def test_settings() -> Settings:
    """Get test settings."""
    return get_settings()


@pytest.fixture
def client() -> TestClient:
    """Create a synchronous test client."""
    return TestClient(app)


@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def auth_headers() -> dict:
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


@pytest.fixture
def sample_image_bytes() -> bytes:
    """Create a sample image for testing."""
    from PIL import Image
    import io

    img = Image.new("RGB", (224, 224), color="red")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer.getvalue()


@pytest.fixture
def sample_campaign() -> dict:
    """Create a sample campaign for testing."""
    return {
        "id": "camp_test_001",
        "name": "Test Campaign",
        "description": "A test campaign for unit testing.",
        "category": "education",
        "goal_amount": 10000.0,
        "current_amount": 5000.0,
        "creator_id": "creator_001",
        "donor_count": 50,
        "view_count": 1000,
    }


@pytest.fixture
def sample_user_profile() -> dict:
    """Create a sample user profile for testing."""
    return {
        "user_id": "test-user-id",
        "interests": ["education", "environment"],
        "donated_campaigns": ["camp_001", "camp_002"],
        "viewed_campaigns": ["camp_001", "camp_002", "camp_003"],
        "preferred_categories": ["education"],
    }


@pytest.fixture
def sample_training_examples() -> list:
    """Create sample training examples for testing."""
    return [
        {
            "instruction": "What is FundBrave?",
            "input_text": "",
            "output": "FundBrave is a decentralized fundraising platform.",
        },
        {
            "instruction": "How do I create a campaign?",
            "input_text": "",
            "output": "To create a campaign, click the 'Create Campaign' button and fill in the details.",
        },
    ]


@pytest.fixture
def temp_data_dir(tmp_path) -> Path:
    """Create a temporary data directory for tests."""
    data_dir = tmp_path / "data"
    data_dir.mkdir(exist_ok=True)
    return data_dir


# Cleanup singleton instances between tests to ensure isolation
@pytest.fixture(autouse=True)
def reset_singletons():
    """Reset singleton instances before each test."""
    yield
    # Clean up after test
    # Note: This is optional and depends on whether you want isolated tests
