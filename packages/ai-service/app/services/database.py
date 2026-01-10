"""
Database service for FundBrave AI Service.

Provides access to backend data via HTTP API calls.
This approach keeps the AI service decoupled from the database
and leverages existing backend API endpoints.
"""

from typing import Any

import httpx
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings


class DatabaseService:
    """
    Service for fetching data from the backend API.

    Uses httpx for async HTTP requests with retry logic.
    Communicates with the NestJS backend to fetch campaign
    and user data for context-aware AI responses.
    """

    def __init__(self, backend_url: str | None = None):
        """
        Initialize the database service.

        Args:
            backend_url: Backend API URL (default from settings)
        """
        self.backend_url = backend_url or settings.backend_url
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create the HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.backend_url,
                timeout=30.0,
                headers={
                    "Content-Type": "application/json",
                    "User-Agent": "FundBrave-AI-Service/0.1.0",
                },
            )
        return self._client

    async def close(self) -> None:
        """Close the HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        reraise=True,
    )
    async def _make_request(
        self,
        method: str,
        endpoint: str,
        params: dict | None = None,
        json: dict | None = None,
    ) -> dict | None:
        """
        Make an HTTP request to the backend with retry logic.

        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint
            params: Query parameters
            json: JSON body

        Returns:
            Response JSON or None if not found
        """
        client = await self._get_client()

        try:
            response = await client.request(
                method=method,
                url=endpoint,
                params=params,
                json=json,
            )

            if response.status_code == 404:
                return None

            response.raise_for_status()
            return response.json()

        except httpx.HTTPStatusError as e:
            logger.error(f"Backend API error: {e.response.status_code} - {endpoint}")
            raise
        except httpx.RequestError as e:
            logger.error(f"Backend request failed: {e}")
            raise

    async def get_campaign_data(self, campaign_id: str) -> dict | None:
        """
        Fetch campaign data for AI context.

        Args:
            campaign_id: UUID of the campaign

        Returns:
            Campaign data dictionary or None if not found
        """
        try:
            # Try to fetch from GraphQL endpoint
            # This is a simplified approach - in production you'd use proper GraphQL
            data = await self._make_request(
                "GET",
                f"/api/fundraisers/{campaign_id}",
            )

            if data is None:
                logger.warning(f"Campaign not found: {campaign_id}")
                return None

            # Extract relevant fields for AI context
            return {
                "id": data.get("id"),
                "name": data.get("name"),
                "description": data.get("description", "")[:500],  # Truncate for context
                "goal_amount": data.get("goalAmount"),
                "raised_amount": data.get("raisedAmount"),
                "is_active": data.get("isActive", True),
                "categories": data.get("categories", []),
                "donors_count": data.get("donorsCount", 0),
                "creator": data.get("creator", {}).get("displayName", "Unknown"),
            }

        except Exception as e:
            logger.error(f"Failed to fetch campaign {campaign_id}: {e}")
            # Return None instead of raising - AI can still respond without context
            return None

    async def get_user_data(self, user_id: str) -> dict | None:
        """
        Fetch user data for AI context.

        Args:
            user_id: UUID of the user

        Returns:
            User data dictionary or None if not found
        """
        try:
            data = await self._make_request(
                "GET",
                f"/api/users/{user_id}",
            )

            if data is None:
                return None

            # Extract relevant fields
            return {
                "id": data.get("id"),
                "display_name": data.get("displayName"),
                "username": data.get("username"),
                "is_verified": data.get("isVerifiedCreator", False),
                "fundraisers_count": data.get("fundraisersCount", 0),
                "donations_count": data.get("donationsCount", 0),
            }

        except Exception as e:
            logger.error(f"Failed to fetch user {user_id}: {e}")
            return None

    async def search_campaigns(
        self,
        query: str,
        limit: int = 5,
    ) -> list[dict]:
        """
        Search for campaigns by query.

        Useful for AI to find relevant campaigns when users ask questions.

        Args:
            query: Search query
            limit: Maximum results to return

        Returns:
            List of campaign summaries
        """
        try:
            data = await self._make_request(
                "GET",
                "/api/fundraisers",
                params={"search": query, "limit": limit},
            )

            if data is None or "items" not in data:
                return []

            return [
                {
                    "id": item.get("id"),
                    "name": item.get("name"),
                    "description": item.get("description", "")[:200],
                    "goal_amount": item.get("goalAmount"),
                    "raised_amount": item.get("raisedAmount"),
                }
                for item in data.get("items", [])[:limit]
            ]

        except Exception as e:
            logger.error(f"Campaign search failed: {e}")
            return []

    async def get_platform_stats(self) -> dict:
        """
        Get overall platform statistics.

        Useful for AI responses about the platform.

        Returns:
            Platform statistics dictionary
        """
        try:
            data = await self._make_request("GET", "/api/stats")

            if data is None:
                return self._get_mock_stats()

            return {
                "total_campaigns": data.get("totalCampaigns", 0),
                "total_raised": data.get("totalRaised", "0"),
                "total_donors": data.get("totalDonors", 0),
                "active_campaigns": data.get("activeCampaigns", 0),
            }

        except Exception as e:
            logger.error(f"Failed to fetch platform stats: {e}")
            return self._get_mock_stats()

    def _get_mock_stats(self) -> dict:
        """Return mock stats when backend is unavailable."""
        return {
            "total_campaigns": 100,
            "total_raised": "1000000",
            "total_donors": 5000,
            "active_campaigns": 75,
        }


# Singleton instance
_database_service: DatabaseService | None = None


def get_database_service() -> DatabaseService:
    """
    Get the singleton database service instance.

    Returns:
        DatabaseService instance
    """
    global _database_service
    if _database_service is None:
        _database_service = DatabaseService()
    return _database_service
