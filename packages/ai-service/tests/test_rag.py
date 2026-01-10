"""
Tests for RAG (Retrieval Augmented Generation) Service.

Tests document indexing, retrieval, and RAG-enhanced generation.
"""

import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.rag import (
    RAGService,
    Document,
    RetrievalResult,
    RAGResponse,
    get_rag_service,
)


class TestDocument:
    """Tests for Document dataclass."""

    def test_document_creation(self):
        """Test creating a document."""
        doc = Document(
            id="doc_001",
            content="This is test content about FundBrave.",
            metadata={"source": "test", "category": "platform"},
        )

        assert doc.id == "doc_001"
        assert doc.content == "This is test content about FundBrave."
        assert doc.metadata["source"] == "test"
        assert doc.embedding is None

    def test_document_with_embedding(self):
        """Test document with embedding."""
        doc = Document(
            id="doc_002",
            content="Content with embedding",
            metadata={},
            embedding=[0.1, 0.2, 0.3],
        )

        assert doc.embedding == [0.1, 0.2, 0.3]


class TestRetrievalResult:
    """Tests for RetrievalResult dataclass."""

    def test_retrieval_result_creation(self):
        """Test creating a retrieval result."""
        result = RetrievalResult(
            document_id="doc_001",
            content="Retrieved content",
            score=0.95,
            metadata={"source": "knowledge_base"},
        )

        assert result.document_id == "doc_001"
        assert result.content == "Retrieved content"
        assert result.score == 0.95
        assert result.metadata["source"] == "knowledge_base"


class TestRAGResponse:
    """Tests for RAGResponse dataclass."""

    def test_rag_response_creation(self):
        """Test creating a RAG response."""
        response = RAGResponse(
            query="What is FundBrave?",
            response="FundBrave is a decentralized fundraising platform.",
            sources=[
                RetrievalResult(
                    document_id="doc_001",
                    content="FundBrave overview",
                    score=0.9,
                    metadata={},
                )
            ],
            confidence=0.85,
        )

        assert response.query == "What is FundBrave?"
        assert len(response.sources) == 1
        assert response.confidence == 0.85


class TestRAGService:
    """Tests for RAGService."""

    @pytest.fixture
    def service(self):
        """Create a RAG service for testing."""
        return RAGService()

    def test_service_initialization(self, service):
        """Test service initializes correctly."""
        assert service is not None
        assert service.enabled is not None
        assert service.collection_name is not None

    @pytest.mark.asyncio
    async def test_index_document(self, service):
        """Test indexing a single document."""
        doc = Document(
            id="test_doc_001",
            content="This is a test document about blockchain fundraising.",
            metadata={"source": "test"},
        )

        success = await service.index_document(doc)
        assert success is True

    @pytest.mark.asyncio
    async def test_index_documents_batch(self, service):
        """Test indexing multiple documents."""
        docs = [
            Document(
                id=f"batch_doc_{i}",
                content=f"Test document {i} content",
                metadata={"batch": True, "index": i},
            )
            for i in range(5)
        ]

        count = await service.index_documents(docs)
        assert count == 5

    @pytest.mark.asyncio
    async def test_retrieve_documents(self, service):
        """Test document retrieval."""
        # First index some documents
        docs = [
            Document(
                id="fundbrave_doc",
                content="FundBrave is a decentralized fundraising platform using blockchain.",
                metadata={"topic": "platform"},
            ),
            Document(
                id="campaign_doc",
                content="Campaigns on FundBrave can raise funds for various causes.",
                metadata={"topic": "campaigns"},
            ),
        ]
        await service.index_documents(docs)

        # Now retrieve
        results = await service.retrieve("What is FundBrave?", top_k=2)

        assert isinstance(results, list)
        # In mock mode, might return empty or mock results
        # Just verify the structure

    @pytest.mark.asyncio
    async def test_generate_with_rag(self, service):
        """Test RAG-enhanced generation."""
        # Index some context
        doc = Document(
            id="context_doc",
            content="FundBrave allows users to create campaigns and receive donations in cryptocurrency.",
            metadata={"source": "docs"},
        )
        await service.index_document(doc)

        # Generate with RAG
        response = await service.generate_with_rag(
            query="How can I receive donations on FundBrave?"
        )

        assert isinstance(response, RAGResponse)
        assert response.query == "How can I receive donations on FundBrave?"
        assert response.response is not None

    @pytest.mark.asyncio
    async def test_index_fundbrave_knowledge(self, service):
        """Test indexing default FundBrave knowledge base."""
        count = await service.index_fundbrave_knowledge()

        # Should have indexed multiple documents
        assert count > 0

    @pytest.mark.asyncio
    async def test_retrieve_with_filter(self, service):
        """Test filtered retrieval."""
        # Index documents with different metadata
        docs = [
            Document(
                id="tech_doc",
                content="Technical documentation about smart contracts.",
                metadata={"category": "technical"},
            ),
            Document(
                id="faq_doc",
                content="Frequently asked questions about the platform.",
                metadata={"category": "faq"},
            ),
        ]
        await service.index_documents(docs)

        # Retrieve with filter
        results = await service.retrieve(
            query="smart contracts",
            top_k=5,
            filter_metadata={"category": "technical"},
        )

        assert isinstance(results, list)

    @pytest.mark.asyncio
    async def test_delete_document(self, service):
        """Test document deletion."""
        doc = Document(
            id="to_delete",
            content="This document will be deleted.",
            metadata={},
        )
        await service.index_document(doc)

        success = await service.delete_document("to_delete")
        assert success is True

    @pytest.mark.asyncio
    async def test_get_document_count(self, service):
        """Test getting document count."""
        count = await service.get_document_count()
        assert isinstance(count, int)
        assert count >= 0


class TestRAGServiceSingleton:
    """Test singleton pattern for RAG service."""

    def test_get_rag_service_singleton(self):
        """Test that get_rag_service returns singleton."""
        service1 = get_rag_service()
        service2 = get_rag_service()

        assert service1 is service2
