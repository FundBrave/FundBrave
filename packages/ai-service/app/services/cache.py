"""
Cache service for FundBrave AI Service.

Provides Redis-based caching for:
- Conversation history
- Model responses
- Rate limiting data
"""

import json
from typing import Any

from loguru import logger

from app.config import settings
from app.models.conversational import Message


class CacheService:
    """
    Redis-based cache service.

    Handles caching for conversation history and other
    frequently accessed data. Falls back to in-memory
    cache if Redis is unavailable.
    """

    def __init__(self, redis_url: str | None = None):
        """
        Initialize the cache service.

        Args:
            redis_url: Redis connection URL (default from settings)
        """
        self.redis_url = redis_url or settings.redis_url
        self.prefix = settings.redis_prefix
        self._redis = None
        self._memory_cache: dict[str, Any] = {}
        self._use_memory = False

    async def connect(self) -> None:
        """Connect to Redis server."""
        try:
            import redis.asyncio as aioredis

            self._redis = aioredis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
            )
            # Test connection
            await self._redis.ping()
            logger.info(f"Connected to Redis at {self.redis_url}")
        except Exception as e:
            logger.warning(f"Redis connection failed, using in-memory cache: {e}")
            self._use_memory = True
            self._redis = None

    async def disconnect(self) -> None:
        """Disconnect from Redis."""
        if self._redis:
            await self._redis.close()
            self._redis = None
        self._memory_cache.clear()

    def _make_key(self, key: str) -> str:
        """Create a prefixed cache key."""
        return f"{self.prefix}{key}"

    async def get(self, key: str) -> str | None:
        """
        Get a value from cache.

        Args:
            key: Cache key

        Returns:
            Cached value or None
        """
        full_key = self._make_key(key)

        if self._use_memory:
            return self._memory_cache.get(full_key)

        try:
            if self._redis:
                return await self._redis.get(full_key)
        except Exception as e:
            logger.error(f"Cache get error: {e}")

        return None

    async def set(
        self,
        key: str,
        value: str,
        ttl: int | None = None,
    ) -> None:
        """
        Set a value in cache.

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time-to-live in seconds (optional)
        """
        full_key = self._make_key(key)
        ttl = ttl or settings.cache_ttl_seconds

        if self._use_memory:
            self._memory_cache[full_key] = value
            return

        try:
            if self._redis:
                await self._redis.set(full_key, value, ex=ttl)
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            # Fall back to memory cache
            self._memory_cache[full_key] = value

    async def delete(self, key: str) -> None:
        """
        Delete a value from cache.

        Args:
            key: Cache key
        """
        full_key = self._make_key(key)

        if self._use_memory:
            self._memory_cache.pop(full_key, None)
            return

        try:
            if self._redis:
                await self._redis.delete(full_key)
        except Exception as e:
            logger.error(f"Cache delete error: {e}")

    async def get_json(self, key: str) -> dict | list | None:
        """
        Get a JSON value from cache.

        Args:
            key: Cache key

        Returns:
            Parsed JSON or None
        """
        value = await self.get(key)
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                logger.error(f"Failed to parse cached JSON for key: {key}")
        return None

    async def set_json(
        self,
        key: str,
        value: dict | list,
        ttl: int | None = None,
    ) -> None:
        """
        Set a JSON value in cache.

        Args:
            key: Cache key
            value: Value to cache (will be JSON serialized)
            ttl: Time-to-live in seconds
        """
        await self.set(key, json.dumps(value), ttl)

    # ===========================================
    # Conversation-specific methods
    # ===========================================

    async def get_conversation(self, conversation_id: str) -> list[Message] | None:
        """
        Get conversation history from cache.

        Args:
            conversation_id: Conversation UUID

        Returns:
            List of Message objects or None
        """
        key = f"conversation:{conversation_id}"
        data = await self.get_json(key)

        if data is None:
            return None

        return [Message(role=m["role"], content=m["content"]) for m in data]

    async def save_conversation(
        self,
        conversation_id: str,
        messages: list[Message],
        ttl: int = 3600,
    ) -> None:
        """
        Save conversation history to cache.

        Args:
            conversation_id: Conversation UUID
            messages: List of Message objects
            ttl: Time-to-live in seconds (default 1 hour)
        """
        key = f"conversation:{conversation_id}"
        data = [{"role": m.role, "content": m.content} for m in messages]
        await self.set_json(key, data, ttl)

    async def delete_conversation(self, conversation_id: str) -> None:
        """
        Delete conversation history from cache.

        Args:
            conversation_id: Conversation UUID
        """
        key = f"conversation:{conversation_id}"
        await self.delete(key)

    # ===========================================
    # Response caching methods
    # ===========================================

    async def get_cached_response(
        self,
        message_hash: str,
        campaign_id: str | None = None,
    ) -> str | None:
        """
        Get a cached response for a message.

        Args:
            message_hash: Hash of the user message
            campaign_id: Optional campaign context ID

        Returns:
            Cached response or None
        """
        key = f"response:{message_hash}"
        if campaign_id:
            key = f"response:{message_hash}:{campaign_id}"

        return await self.get(key)

    async def cache_response(
        self,
        message_hash: str,
        response: str,
        campaign_id: str | None = None,
        ttl: int = 1800,  # 30 minutes
    ) -> None:
        """
        Cache a response for a message.

        Args:
            message_hash: Hash of the user message
            response: AI response to cache
            campaign_id: Optional campaign context ID
            ttl: Time-to-live in seconds
        """
        key = f"response:{message_hash}"
        if campaign_id:
            key = f"response:{message_hash}:{campaign_id}"

        await self.set(key, response, ttl)

    # ===========================================
    # Utility methods
    # ===========================================

    async def health_check(self) -> dict:
        """
        Check cache health status.

        Returns:
            Health status dictionary
        """
        if self._use_memory:
            return {
                "status": "healthy",
                "backend": "memory",
                "keys_count": len(self._memory_cache),
            }

        try:
            if self._redis:
                await self._redis.ping()
                info = await self._redis.info("memory")
                return {
                    "status": "healthy",
                    "backend": "redis",
                    "used_memory": info.get("used_memory_human", "unknown"),
                }
        except Exception as e:
            return {
                "status": "unhealthy",
                "backend": "redis",
                "error": str(e),
            }

        return {
            "status": "unhealthy",
            "backend": "none",
        }


# Singleton instance
_cache_service: CacheService | None = None


async def get_cache_service() -> CacheService:
    """
    Get the singleton cache service instance.

    Ensures connection is established on first access.

    Returns:
        CacheService instance
    """
    global _cache_service
    if _cache_service is None:
        _cache_service = CacheService()
        await _cache_service.connect()
    return _cache_service
