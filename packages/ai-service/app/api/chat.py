"""
Chat API endpoints for FundBrave AI Service.

Provides conversational AI capabilities for:
- User assistance and platform questions
- Campaign-specific context-aware responses
- Streaming responses for real-time interaction
"""

import uuid
from typing import Annotated, AsyncIterator

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from loguru import logger

from app.config import settings
from app.models.conversational import (
    ConversationContext,
    GenerationResult,
    get_conversational_model,
)
from app.services.database import DatabaseService, get_database_service
from app.services.cache import CacheService, get_cache_service
from app.utils.auth import JWTPayload, get_current_user, get_optional_user
from app.utils.rate_limit import limiter, chat_rate_limit

router = APIRouter()


# ===========================================
# Request/Response Models
# ===========================================


class ChatRequest(BaseModel):
    """Request schema for chat endpoint."""

    message: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="User's message",
        examples=["How do I create a fundraising campaign?"],
    )
    user_id: str | None = Field(
        default=None,
        description="User ID (extracted from JWT if not provided)",
    )
    campaign_id: str | None = Field(
        default=None,
        description="Optional campaign ID for context-aware responses",
    )
    conversation_id: str | None = Field(
        default=None,
        description="Optional conversation ID to continue a conversation",
    )
    stream: bool = Field(
        default=False,
        description="Enable streaming response",
    )


class ChatResponse(BaseModel):
    """Response schema for chat endpoint."""

    response: str = Field(
        ...,
        description="AI-generated response",
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score of the response",
    )
    sources: list[str] = Field(
        default_factory=list,
        description="Sources used to generate the response",
    )
    conversation_id: str = Field(
        ...,
        description="Conversation ID for continuing the conversation",
    )
    tokens_used: int = Field(
        default=0,
        description="Number of tokens used in generation",
    )


class ConversationMessage(BaseModel):
    """A message in conversation history."""

    role: str
    content: str


class ConversationHistoryResponse(BaseModel):
    """Response schema for conversation history."""

    conversation_id: str
    messages: list[ConversationMessage]
    created_at: str
    last_updated: str


# ===========================================
# Endpoints
# ===========================================


@router.post(
    "",
    response_model=ChatResponse,
    summary="Chat with FundBrave AI",
    description="Send a message to the AI assistant and receive a response.",
    responses={
        200: {"description": "Successful response"},
        401: {"description": "Authentication required"},
        429: {"description": "Rate limit exceeded"},
        500: {"description": "Internal server error"},
    },
)
@limiter.limit(chat_rate_limit)
async def chat(
    request: Request,
    body: ChatRequest,
    user: Annotated[JWTPayload | None, Depends(get_optional_user)],
    db: Annotated[DatabaseService, Depends(get_database_service)],
    cache: Annotated[CacheService, Depends(get_cache_service)],
) -> ChatResponse | StreamingResponse:
    """
    Chat endpoint for interacting with FundBrave AI.

    Supports both regular and streaming responses.
    Optionally fetches campaign context for more relevant answers.
    """
    # Use user ID from JWT if available
    user_id = user.user_id if user else body.user_id

    # Generate or use provided conversation ID
    conversation_id = body.conversation_id or str(uuid.uuid4())

    try:
        # Get the conversational model
        model = get_conversational_model()

        # Load conversation history from cache if continuing
        context = None
        if body.conversation_id:
            cached_history = await cache.get_conversation(body.conversation_id)
            if cached_history:
                context = ConversationContext(
                    messages=cached_history,
                    user_id=user_id,
                    campaign_id=body.campaign_id,
                    conversation_id=body.conversation_id,
                )

        if context is None:
            context = ConversationContext(
                user_id=user_id,
                campaign_id=body.campaign_id,
                conversation_id=conversation_id,
            )

        # Fetch campaign context if provided
        campaign_context = None
        if body.campaign_id:
            campaign_context = await db.get_campaign_data(body.campaign_id)

        # Handle streaming response
        if body.stream:
            return StreamingResponse(
                stream_response(
                    model,
                    body.message,
                    context,
                    campaign_context,
                    conversation_id,
                    cache,
                ),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Conversation-ID": conversation_id,
                },
            )

        # Generate response
        result: GenerationResult = await model.generate_response(
            message=body.message,
            context=context,
            campaign_context=campaign_context,
        )

        # Update conversation history in cache
        context.add_message("user", body.message)
        context.add_message("assistant", result.response)
        context.trim_history(settings.max_conversation_history)
        await cache.save_conversation(
            conversation_id,
            context.messages,
            ttl=3600,  # 1 hour
        )

        logger.info(
            f"Chat response generated for user={user_id}, "
            f"conversation={conversation_id}, tokens={result.tokens_used}"
        )

        return ChatResponse(
            response=result.response,
            confidence=result.confidence,
            sources=[],  # Could be populated from RAG in future
            conversation_id=conversation_id,
            tokens_used=result.tokens_used,
        )

    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate response: {str(e)}",
        ) from e


async def stream_response(
    model,
    message: str,
    context: ConversationContext,
    campaign_context: dict | None,
    conversation_id: str,
    cache: CacheService,
) -> AsyncIterator[str]:
    """
    Stream the chat response using Server-Sent Events format.

    Args:
        model: Conversational model instance
        message: User's message
        context: Conversation context
        campaign_context: Optional campaign data
        conversation_id: Conversation ID
        cache: Cache service for saving history

    Yields:
        SSE formatted response chunks
    """
    full_response = ""

    try:
        async for chunk in model.generate_stream(
            message=message,
            context=context,
            campaign_context=campaign_context,
        ):
            full_response += chunk
            # SSE format
            yield f"data: {chunk}\n\n"

        # Send completion event
        yield f"event: done\ndata: {conversation_id}\n\n"

        # Save conversation history
        context.add_message("user", message)
        context.add_message("assistant", full_response)
        context.trim_history(settings.max_conversation_history)
        await cache.save_conversation(conversation_id, context.messages, ttl=3600)

    except Exception as e:
        logger.error(f"Streaming error: {e}")
        yield f"event: error\ndata: {str(e)}\n\n"


@router.get(
    "/history/{conversation_id}",
    response_model=ConversationHistoryResponse,
    summary="Get conversation history",
    description="Retrieve the message history for a conversation.",
)
async def get_conversation_history(
    conversation_id: str,
    user: Annotated[JWTPayload, Depends(get_current_user)],
    cache: Annotated[CacheService, Depends(get_cache_service)],
) -> ConversationHistoryResponse:
    """
    Get the history of a conversation.

    Requires authentication. Only returns history for conversations
    belonging to the authenticated user.
    """
    history = await cache.get_conversation(conversation_id)

    if history is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or expired",
        )

    # Convert to response format
    messages = [
        ConversationMessage(role=m.role, content=m.content) for m in history
    ]

    from datetime import datetime

    return ConversationHistoryResponse(
        conversation_id=conversation_id,
        messages=messages,
        created_at=datetime.utcnow().isoformat(),
        last_updated=datetime.utcnow().isoformat(),
    )


@router.delete(
    "/history/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete conversation history",
    description="Delete a conversation's history from cache.",
)
async def delete_conversation_history(
    conversation_id: str,
    user: Annotated[JWTPayload, Depends(get_current_user)],
    cache: Annotated[CacheService, Depends(get_cache_service)],
) -> None:
    """
    Delete a conversation's history.

    Requires authentication.
    """
    await cache.delete_conversation(conversation_id)
    logger.info(f"Deleted conversation {conversation_id} for user {user.user_id}")


@router.post(
    "/comment-mention",
    response_model=ChatResponse,
    summary="Respond to @FundBraveAI mention",
    description="Handle mentions of @FundBraveAI in comments.",
)
@limiter.limit(chat_rate_limit)
async def handle_comment_mention(
    request: Request,
    body: ChatRequest,
    user: Annotated[JWTPayload | None, Depends(get_optional_user)],
    db: Annotated[DatabaseService, Depends(get_database_service)],
) -> ChatResponse:
    """
    Handle @FundBraveAI mentions in comments.

    This endpoint is designed to be called when users tag the AI
    in campaign comments. It provides context-aware responses.
    """
    # Clean the mention from the message
    message = body.message.replace("@FundBraveAI", "").replace("@fundbrave", "").strip()

    if not message:
        message = "How can I help with this campaign?"

    user_id = user.user_id if user else body.user_id

    try:
        model = get_conversational_model()

        # Always fetch campaign context for comment mentions
        campaign_context = None
        if body.campaign_id:
            campaign_context = await db.get_campaign_data(body.campaign_id)

        result: GenerationResult = await model.generate_response(
            message=message,
            campaign_context=campaign_context,
        )

        logger.info(
            f"Comment mention response for campaign={body.campaign_id}, "
            f"user={user_id}"
        )

        return ChatResponse(
            response=result.response,
            confidence=result.confidence,
            sources=[],
            conversation_id=str(uuid.uuid4()),  # Comments don't continue conversations
            tokens_used=result.tokens_used,
        )

    except Exception as e:
        logger.error(f"Comment mention error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate response: {str(e)}",
        ) from e
