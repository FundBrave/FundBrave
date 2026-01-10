"""
Tests for media verification API endpoints.
"""

import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image


class TestMediaVerificationEndpoints:
    """Tests for media verification API endpoints."""

    def test_verify_media_success(
        self, client: TestClient, sample_image_bytes: bytes
    ):
        """Test successful media verification."""
        response = client.post(
            "/api/verify-media",
            files={"file": ("test.png", sample_image_bytes, "image/png")},
        )

        assert response.status_code == 200
        data = response.json()

        assert "is_authentic" in data
        assert "confidence" in data
        assert "requires_review" in data
        assert "analysis" in data
        assert "details" in data

        assert data["confidence"] >= 0 and data["confidence"] <= 1
        assert isinstance(data["is_authentic"], bool)
        assert isinstance(data["requires_review"], bool)

    def test_verify_media_with_campaign_id(
        self, client: TestClient, sample_image_bytes: bytes, auth_headers: dict
    ):
        """Test media verification with campaign context."""
        response = client.post(
            "/api/verify-media",
            files={"file": ("test.png", sample_image_bytes, "image/png")},
            data={"campaign_id": "test-campaign-id"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "is_authentic" in data

    def test_verify_media_invalid_file_type(self, client: TestClient):
        """Test that non-image files are rejected."""
        response = client.post(
            "/api/verify-media",
            files={"file": ("test.txt", b"not an image", "text/plain")},
        )

        assert response.status_code == 400
        assert "Invalid file type" in response.json()["detail"]

    def test_verify_media_jpeg(self, client: TestClient):
        """Test verification works with JPEG images."""
        img = Image.new("RGB", (224, 224), color="blue")
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG")
        buffer.seek(0)

        response = client.post(
            "/api/verify-media",
            files={"file": ("test.jpg", buffer.getvalue(), "image/jpeg")},
        )

        assert response.status_code == 200

    def test_batch_verification(
        self, client: TestClient, sample_image_bytes: bytes, auth_headers: dict
    ):
        """Test batch verification of multiple images."""
        files = [
            ("files", ("test1.png", sample_image_bytes, "image/png")),
            ("files", ("test2.png", sample_image_bytes, "image/png")),
        ]

        response = client.post(
            "/api/verify-media/batch",
            files=files,
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()

        assert data["total"] == 2
        assert "authentic_count" in data
        assert "suspicious_count" in data
        assert "results" in data
        assert len(data["results"]) == 2

    def test_batch_verification_too_many_files(
        self, client: TestClient, sample_image_bytes: bytes, auth_headers: dict
    ):
        """Test that batch is limited to 10 files."""
        files = [
            ("files", (f"test{i}.png", sample_image_bytes, "image/png"))
            for i in range(11)
        ]

        response = client.post(
            "/api/verify-media/batch",
            files=files,
            headers=auth_headers,
        )

        assert response.status_code == 400
        assert "Maximum 10" in response.json()["detail"]

    def test_batch_verification_requires_auth(
        self, client: TestClient, sample_image_bytes: bytes
    ):
        """Test that batch verification requires authentication."""
        files = [
            ("files", ("test1.png", sample_image_bytes, "image/png")),
        ]

        response = client.post(
            "/api/verify-media/batch",
            files=files,
        )

        assert response.status_code == 401

    def test_analyze_image(
        self, client: TestClient, sample_image_bytes: bytes
    ):
        """Test campaign image analysis."""
        response = client.post(
            "/api/verify-media/analyze",
            files={"file": ("test.png", sample_image_bytes, "image/png")},
            data={
                "campaign_name": "Test Campaign",
                "campaign_description": "A test campaign for charity",
            },
        )

        assert response.status_code == 200
        data = response.json()

        assert "description" in data
        assert "is_appropriate" in data
        assert "confidence" in data
        assert "tags" in data

    def test_coherence_check(
        self, client: TestClient, sample_image_bytes: bytes
    ):
        """Test image-text coherence verification."""
        response = client.post(
            "/api/verify-media/coherence",
            files={"file": ("test.png", sample_image_bytes, "image/png")},
            data={"description": "A red colored image for testing purposes"},
        )

        assert response.status_code == 200
        data = response.json()

        assert "is_coherent" in data
        assert "confidence" in data
        assert "match_score" in data
        assert "analysis" in data

    def test_coherence_check_short_description(
        self, client: TestClient, sample_image_bytes: bytes
    ):
        """Test that short descriptions are rejected."""
        response = client.post(
            "/api/verify-media/coherence",
            files={"file": ("test.png", sample_image_bytes, "image/png")},
            data={"description": "short"},
        )

        assert response.status_code == 400
        assert "at least 10 characters" in response.json()["detail"]
