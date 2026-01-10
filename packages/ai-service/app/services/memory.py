"""
Conversation Memory Service for FundBrave AI.

Provides persistent conversation storage and retrieval with PostgreSQL,
enabling long-term context awareness across user sessions.
"""

import asyncio
import json
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any
from uuid import uuid4

from loguru import logger

from app.config import settings


@dataclass
class ConversationMessage:
    """A single message in a conversation."""

    id: str
    role: str  # 'user', 'assistant', 'system'
    content: str
    timestamp: datetime
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "role": self.role,
            "content": self.content,
            "timestamp": self.timestamp.isoformat(),
            "metadata": self.metadata,
        }


@dataclass
class Conversation:
    """A conversation with history and metadata."""

    id: str
    user_id: str
    messages: list[ConversationMessage] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    metadata: dict[str, Any] = field(default_factory=dict)
    campaign_id: str | None = None
    title: str | None = None
    summary: str | None = None

    def add_message(
        self,
        role: str,
        content: str,
        metadata: dict | None = None,
    ) -> ConversationMessage:
        """Add a message to the conversation."""
        message = ConversationMessage(
            id=str(uuid4()),
            role=role,
            content=content,
            timestamp=datetime.utcnow(),
            metadata=metadata or {},
        )
        self.messages.append(message)
        self.updated_at = datetime.utcnow()
        return message

    def get_recent_messages(self, limit: int = 10) -> list[ConversationMessage]:
        """Get the most recent messages."""
        return self.messages[-limit:]

    def to_context_format(self) -> list[dict[str, str]]:
        """Convert to format suitable for model context."""
        return [{"role": m.role, "content": m.content} for m in self.messages]


class ConversationMemoryService:
    """
    Persistent conversation memory service.

    Features:
    - PostgreSQL storage for conversations
    - Redis caching for active conversations
    - Conversation summarization for long contexts
    - User context aggregation
    - Intelligent context retrieval
    """

    def __init__(self):
        """Initialize the memory service."""
        self.persist_enabled = settings.persist_conversations
        self.max_history = settings.max_conversation_history
        self.ttl_hours = settings.conversation_ttl_hours

        # In-memory cache (production would use Redis)
        self._conversations: dict[str, Conversation] = {}
        self._user_conversations: dict[str, list[str]] = {}

        # Database connection (lazy loaded)
        self._db_pool = None

    async def _get_db_pool(self):
        """Get or create database connection pool."""
        if not settings.database_url or not self.persist_enabled:
            return None

        if self._db_pool is None:
            try:
                import asyncpg

                self._db_pool = await asyncpg.create_pool(
                    settings.database_url,
                    min_size=2,
                    max_size=settings.database_pool_size,
                )
                await self._ensure_tables()
                logger.info("Database connection pool created")
            except Exception as e:
                logger.error(f"Failed to create database pool: {e}")
                return None

        return self._db_pool

    async def _ensure_tables(self):
        """Ensure required database tables exist."""
        pool = self._db_pool
        if pool is None:
            return

        async with pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS ai_conversations (
                    id UUID PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,
                    campaign_id VARCHAR(255),
                    title TEXT,
                    summary TEXT,
                    messages JSONB NOT NULL DEFAULT '[]',
                    metadata JSONB NOT NULL DEFAULT '{}',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );

                CREATE INDEX IF NOT EXISTS idx_conversations_user_id
                ON ai_conversations(user_id);

                CREATE INDEX IF NOT EXISTS idx_conversations_updated
                ON ai_conversations(updated_at DESC);

                CREATE INDEX IF NOT EXISTS idx_conversations_campaign
                ON ai_conversations(campaign_id)
                WHERE campaign_id IS NOT NULL;
            """)

    async def create_conversation(
        self,
        user_id: str,
        campaign_id: str | None = None,
        metadata: dict | None = None,
    ) -> Conversation:
        """
        Create a new conversation.

        Args:
            user_id: User ID
            campaign_id: Optional related campaign ID
            metadata: Optional metadata

        Returns:
            New Conversation object
        """
        conversation = Conversation(
            id=str(uuid4()),
            user_id=user_id,
            campaign_id=campaign_id,
            metadata=metadata or {},
        )

        # Cache in memory
        self._conversations[conversation.id] = conversation

        if user_id not in self._user_conversations:
            self._user_conversations[user_id] = []
        self._user_conversations[user_id].append(conversation.id)

        # Persist to database
        await self._persist_conversation(conversation)

        logger.debug(f"Created conversation {conversation.id} for user {user_id}")
        return conversation

    async def get_conversation(self, conversation_id: str) -> Conversation | None:
        """
        Get a conversation by ID.

        Args:
            conversation_id: Conversation UUID

        Returns:
            Conversation or None if not found
        """
        # Check cache first
        if conversation_id in self._conversations:
            return self._conversations[conversation_id]

        # Try database
        pool = await self._get_db_pool()
        if pool is None:
            return None

        try:
            async with pool.acquire() as conn:
                row = await conn.fetchrow(
                    "SELECT * FROM ai_conversations WHERE id = $1",
                    conversation_id,
                )

                if row is None:
                    return None

                conversation = self._row_to_conversation(row)

                # Cache it
                self._conversations[conversation.id] = conversation

                return conversation

        except Exception as e:
            logger.error(f"Failed to get conversation {conversation_id}: {e}")
            return None

    async def add_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        metadata: dict | None = None,
    ) -> ConversationMessage | None:
        """
        Add a message to a conversation.

        Args:
            conversation_id: Conversation UUID
            role: Message role
            content: Message content
            metadata: Optional metadata

        Returns:
            The created message or None if conversation not found
        """
        conversation = await self.get_conversation(conversation_id)
        if conversation is None:
            return None

        message = conversation.add_message(role, content, metadata)

        # Trim history if needed
        if len(conversation.messages) > self.max_history * 2:
            # Keep system messages and recent history
            system_messages = [m for m in conversation.messages if m.role == "system"]
            other_messages = [m for m in conversation.messages if m.role != "system"]
            conversation.messages = system_messages + other_messages[-self.max_history:]

        # Persist
        await self._persist_conversation(conversation)

        return message

    async def get_user_conversations(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0,
    ) -> list[Conversation]:
        """
        Get conversations for a user.

        Args:
            user_id: User ID
            limit: Maximum conversations to return
            offset: Pagination offset

        Returns:
            List of conversations
        """
        pool = await self._get_db_pool()
        if pool is None:
            # Return from cache
            conv_ids = self._user_conversations.get(user_id, [])
            return [
                self._conversations[cid]
                for cid in conv_ids[offset:offset + limit]
                if cid in self._conversations
            ]

        try:
            async with pool.acquire() as conn:
                rows = await conn.fetch(
                    """
                    SELECT * FROM ai_conversations
                    WHERE user_id = $1
                    ORDER BY updated_at DESC
                    LIMIT $2 OFFSET $3
                    """,
                    user_id,
                    limit,
                    offset,
                )

                return [self._row_to_conversation(row) for row in rows]

        except Exception as e:
            logger.error(f"Failed to get user conversations: {e}")
            return []

    async def search_conversations(
        self,
        user_id: str,
        query: str,
        limit: int = 10,
    ) -> list[Conversation]:
        """
        Search conversations by content.

        Args:
            user_id: User ID
            query: Search query
            limit: Maximum results

        Returns:
            List of matching conversations
        """
        pool = await self._get_db_pool()
        if pool is None:
            return []

        try:
            async with pool.acquire() as conn:
                rows = await conn.fetch(
                    """
                    SELECT * FROM ai_conversations
                    WHERE user_id = $1
                    AND (
                        messages::text ILIKE $2
                        OR title ILIKE $2
                        OR summary ILIKE $2
                    )
                    ORDER BY updated_at DESC
                    LIMIT $3
                    """,
                    user_id,
                    f"%{query}%",
                    limit,
                )

                return [self._row_to_conversation(row) for row in rows]

        except Exception as e:
            logger.error(f"Failed to search conversations: {e}")
            return []

    async def get_user_context(self, user_id: str) -> dict[str, Any]:
        """
        Get aggregated context about a user's conversation history.

        Args:
            user_id: User ID

        Returns:
            Dictionary with user context information
        """
        conversations = await self.get_user_conversations(user_id, limit=50)

        if not conversations:
            return {
                "user_id": user_id,
                "total_conversations": 0,
                "topics": [],
                "recent_campaigns": [],
                "summary": "No conversation history.",
            }

        # Extract topics and campaigns
        topics = []
        campaigns = set()

        for conv in conversations:
            if conv.campaign_id:
                campaigns.add(conv.campaign_id)

            # Simple topic extraction from messages
            for msg in conv.messages[:5]:  # First few messages
                if msg.role == "user" and len(msg.content) > 10:
                    # Extract key phrases (simplified)
                    words = msg.content.lower().split()
                    for keyword in ["campaign", "donate", "create", "help", "how"]:
                        if keyword in words:
                            topics.append(keyword)

        return {
            "user_id": user_id,
            "total_conversations": len(conversations),
            "topics": list(set(topics))[:10],
            "recent_campaigns": list(campaigns)[:5],
            "last_interaction": (
                conversations[0].updated_at.isoformat() if conversations else None
            ),
            "summary": f"User has {len(conversations)} conversations about {', '.join(topics[:3]) or 'various topics'}.",
        }

    async def summarize_conversation(self, conversation_id: str) -> str | None:
        """
        Generate a summary for a conversation.

        Args:
            conversation_id: Conversation UUID

        Returns:
            Summary string or None if failed
        """
        conversation = await self.get_conversation(conversation_id)
        if conversation is None or len(conversation.messages) < 2:
            return None

        from app.models.conversational import get_conversational_model

        model = get_conversational_model()

        # Build conversation text
        conv_text = "\n".join([
            f"{m.role}: {m.content[:200]}"
            for m in conversation.messages[-10:]
        ])

        prompt = (
            f"Summarize this conversation in 1-2 sentences:\n\n"
            f"{conv_text}\n\n"
            f"Summary:"
        )

        response = await model.generate_response(message=prompt)

        # Update conversation with summary
        conversation.summary = response.response
        await self._persist_conversation(conversation)

        return response.response

    async def delete_conversation(self, conversation_id: str) -> bool:
        """
        Delete a conversation.

        Args:
            conversation_id: Conversation UUID

        Returns:
            True if deleted
        """
        # Remove from cache
        if conversation_id in self._conversations:
            conv = self._conversations.pop(conversation_id)
            if conv.user_id in self._user_conversations:
                self._user_conversations[conv.user_id] = [
                    cid
                    for cid in self._user_conversations[conv.user_id]
                    if cid != conversation_id
                ]

        # Remove from database
        pool = await self._get_db_pool()
        if pool:
            try:
                async with pool.acquire() as conn:
                    await conn.execute(
                        "DELETE FROM ai_conversations WHERE id = $1",
                        conversation_id,
                    )
            except Exception as e:
                logger.error(f"Failed to delete conversation: {e}")
                return False

        return True

    async def cleanup_old_conversations(self) -> int:
        """
        Remove conversations older than TTL.

        Returns:
            Number of conversations deleted
        """
        cutoff = datetime.utcnow() - timedelta(hours=self.ttl_hours)
        deleted = 0

        # Clean cache
        for conv_id, conv in list(self._conversations.items()):
            if conv.updated_at < cutoff:
                del self._conversations[conv_id]
                deleted += 1

        # Clean database
        pool = await self._get_db_pool()
        if pool:
            try:
                async with pool.acquire() as conn:
                    result = await conn.execute(
                        "DELETE FROM ai_conversations WHERE updated_at < $1",
                        cutoff,
                    )
                    deleted += int(result.split()[-1])
            except Exception as e:
                logger.error(f"Failed to cleanup old conversations: {e}")

        logger.info(f"Cleaned up {deleted} old conversations")
        return deleted

    async def _persist_conversation(self, conversation: Conversation) -> None:
        """Persist conversation to database."""
        pool = await self._get_db_pool()
        if pool is None:
            return

        try:
            messages_json = json.dumps([m.to_dict() for m in conversation.messages])

            async with pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO ai_conversations (
                        id, user_id, campaign_id, title, summary,
                        messages, metadata, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    ON CONFLICT (id) DO UPDATE SET
                        messages = $6,
                        metadata = $7,
                        title = $4,
                        summary = $5,
                        updated_at = $9
                    """,
                    conversation.id,
                    conversation.user_id,
                    conversation.campaign_id,
                    conversation.title,
                    conversation.summary,
                    messages_json,
                    json.dumps(conversation.metadata),
                    conversation.created_at,
                    conversation.updated_at,
                )
        except Exception as e:
            logger.error(f"Failed to persist conversation: {e}")

    def _row_to_conversation(self, row) -> Conversation:
        """Convert database row to Conversation object."""
        messages_data = json.loads(row["messages"]) if isinstance(row["messages"], str) else row["messages"]

        messages = [
            ConversationMessage(
                id=m["id"],
                role=m["role"],
                content=m["content"],
                timestamp=datetime.fromisoformat(m["timestamp"]),
                metadata=m.get("metadata", {}),
            )
            for m in messages_data
        ]

        metadata = json.loads(row["metadata"]) if isinstance(row["metadata"], str) else row["metadata"]

        return Conversation(
            id=str(row["id"]),
            user_id=row["user_id"],
            messages=messages,
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            metadata=metadata,
            campaign_id=row["campaign_id"],
            title=row["title"],
            summary=row["summary"],
        )

    async def close(self) -> None:
        """Close database connections."""
        if self._db_pool:
            await self._db_pool.close()
            self._db_pool = None


# Singleton instance
_memory_service: ConversationMemoryService | None = None


async def get_memory_service() -> ConversationMemoryService:
    """Get the singleton memory service instance."""
    global _memory_service
    if _memory_service is None:
        _memory_service = ConversationMemoryService()
    return _memory_service
