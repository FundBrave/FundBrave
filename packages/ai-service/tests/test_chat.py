"""
Tests for chat API endpoints.
"""

import pytest
from fastapi.testclient import TestClient


class TestChatEndpoints:
    """Tests for chat API endpoints."""

    def test_chat_without_auth(self, client: TestClient):
        """Test chat works without authentication (optional auth)."""
        response = client.post(
            "/api/chat",
            json={"message": "How do I create a campaign?"},
        )

        assert response.status_code == 200
        data = response.json()

        assert "response" in data
        assert "confidence" in data
        assert "conversation_id" in data
        assert data["confidence"] >= 0 and data["confidence"] <= 1

    def test_chat_with_auth(self, client: TestClient, auth_headers: dict):
        """Test chat with authentication."""
        response = client.post(
            "/api/chat",
            json={"message": "How do I donate?"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()

        assert "response" in data
        assert len(data["response"]) > 0

    def test_chat_with_campaign_context(self, client: TestClient, auth_headers: dict):
        """Test chat with campaign ID context."""
        response = client.post(
            "/api/chat",
            json={
                "message": "Tell me about this campaign",
                "campaign_id": "test-campaign-id",
            },
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "response" in data

    def test_chat_conversation_continuity(self, client: TestClient, auth_headers: dict):
        """Test that conversation ID enables continuity."""
        # First message
        response1 = client.post(
            "/api/chat",
            json={"message": "My name is Test User"},
            headers=auth_headers,
        )

        assert response1.status_code == 200
        conversation_id = response1.json()["conversation_id"]

        # Second message with same conversation ID
        response2 = client.post(
            "/api/chat",
            json={
                "message": "What is my name?",
                "conversation_id": conversation_id,
            },
            headers=auth_headers,
        )

        assert response2.status_code == 200
        assert response2.json()["conversation_id"] == conversation_id

    def test_chat_empty_message(self, client: TestClient):
        """Test that empty messages are rejected."""
        response = client.post(
            "/api/chat",
            json={"message": ""},
        )

        assert response.status_code == 422  # Validation error

    def test_chat_message_too_long(self, client: TestClient):
        """Test that very long messages are rejected."""
        response = client.post(
            "/api/chat",
            json={"message": "x" * 5000},
        )

        assert response.status_code == 422  # Validation error

    def test_comment_mention_endpoint(self, client: TestClient):
        """Test the comment mention endpoint."""
        response = client.post(
            "/api/chat/comment-mention",
            json={
                "message": "@FundBraveAI how does this campaign work?",
                "campaign_id": "test-campaign-id",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "response" in data

    def test_get_conversation_history_not_found(
        self, client: TestClient, auth_headers: dict
    ):
        """Test getting non-existent conversation history."""
        response = client.get(
            "/api/chat/history/nonexistent-id",
            headers=auth_headers,
        )

        assert response.status_code == 404

    def test_delete_conversation_history(self, client: TestClient, auth_headers: dict):
        """Test deleting conversation history."""
        # First create a conversation
        chat_response = client.post(
            "/api/chat",
            json={"message": "Hello"},
            headers=auth_headers,
        )
        conversation_id = chat_response.json()["conversation_id"]

        # Delete it
        response = client.delete(
            f"/api/chat/history/{conversation_id}",
            headers=auth_headers,
        )

        assert response.status_code == 204
