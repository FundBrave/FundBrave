"""
RAG (Retrieval Augmented Generation) Service for FundBrave AI.

Uses ChromaDB for vector storage and semantic search to enhance
AI responses with relevant knowledge from the platform's documentation,
FAQs, and campaign data.
"""

import asyncio
import hashlib
import json
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

from loguru import logger

from app.config import settings


@dataclass
class Document:
    """A document for indexing in the vector store."""

    content: str
    metadata: dict[str, Any]
    doc_id: str | None = None

    def __post_init__(self):
        if self.doc_id is None:
            self.doc_id = hashlib.md5(self.content.encode()).hexdigest()[:16]


@dataclass
class RetrievalResult:
    """Result from a retrieval query."""

    content: str
    metadata: dict[str, Any]
    similarity_score: float
    doc_id: str


@dataclass
class RAGResponse:
    """Response from RAG-enhanced generation."""

    answer: str
    sources: list[RetrievalResult]
    confidence: float
    context_used: bool


class RAGService:
    """
    Retrieval Augmented Generation service using ChromaDB.

    Features:
    - Vector storage with ChromaDB
    - Semantic search for relevant documents
    - Document indexing and management
    - Integration with conversational model
    """

    def __init__(self):
        """Initialize the RAG service."""
        self.persist_dir = settings.chroma_persist_dir
        self.collection_name = settings.chroma_collection_name
        self.chunk_size = settings.rag_chunk_size
        self.chunk_overlap = settings.rag_chunk_overlap
        self.top_k = settings.rag_top_k
        self.similarity_threshold = settings.rag_similarity_threshold

        self._client = None
        self._collection = None
        self._embedder = None
        self._initialized = False

    async def initialize(self) -> None:
        """Initialize ChromaDB client and collection."""
        if self._initialized:
            return

        try:
            import chromadb
            from chromadb.config import Settings as ChromaSettings

            # Ensure persist directory exists
            self.persist_dir.mkdir(parents=True, exist_ok=True)

            # Initialize ChromaDB client
            self._client = chromadb.Client(
                ChromaSettings(
                    chroma_db_impl="duckdb+parquet",
                    persist_directory=str(self.persist_dir),
                    anonymized_telemetry=False,
                )
            )

            # Get or create collection
            self._collection = self._client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"},
            )

            self._initialized = True
            logger.info(
                f"RAG service initialized with collection '{self.collection_name}'"
            )

        except ImportError:
            logger.warning("ChromaDB not installed, RAG service in mock mode")
            self._initialized = True
        except Exception as e:
            logger.error(f"Failed to initialize RAG service: {e}")
            raise

    async def _get_embeddings(self, texts: list[str]) -> list[list[float]]:
        """
        Get embeddings for texts using sentence-transformers.

        Args:
            texts: List of texts to embed

        Returns:
            List of embedding vectors
        """
        if self._embedder is None:
            try:
                from sentence_transformers import SentenceTransformer

                self._embedder = SentenceTransformer(settings.embedding_model)
                logger.info(f"Loaded embedding model: {settings.embedding_model}")
            except ImportError:
                logger.warning("sentence-transformers not installed, using mock embeddings")
                # Return mock embeddings
                import random
                return [[random.random() for _ in range(384)] for _ in texts]

        # Run embedding in executor to avoid blocking
        loop = asyncio.get_event_loop()
        embeddings = await loop.run_in_executor(
            None, lambda: self._embedder.encode(texts).tolist()
        )
        return embeddings

    def _chunk_text(self, text: str) -> list[str]:
        """
        Split text into chunks for indexing.

        Args:
            text: Text to chunk

        Returns:
            List of text chunks
        """
        if len(text) <= self.chunk_size:
            return [text]

        chunks = []
        start = 0

        while start < len(text):
            end = start + self.chunk_size

            # Try to break at sentence boundary
            if end < len(text):
                # Look for sentence endings
                for sep in [". ", "! ", "? ", "\n\n", "\n"]:
                    last_sep = text[start:end].rfind(sep)
                    if last_sep > self.chunk_size // 2:
                        end = start + last_sep + len(sep)
                        break

            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)

            start = end - self.chunk_overlap

        return chunks

    async def add_documents(
        self,
        documents: list[Document],
        batch_size: int = 100,
    ) -> int:
        """
        Add documents to the vector store.

        Args:
            documents: List of documents to add
            batch_size: Batch size for processing

        Returns:
            Number of chunks added
        """
        await self.initialize()

        if self._collection is None:
            logger.warning("Collection not available, skipping document addition")
            return 0

        all_chunks = []
        all_ids = []
        all_metadatas = []

        for doc in documents:
            chunks = self._chunk_text(doc.content)

            for i, chunk in enumerate(chunks):
                chunk_id = f"{doc.doc_id}_{i}"
                all_chunks.append(chunk)
                all_ids.append(chunk_id)
                all_metadatas.append({
                    **doc.metadata,
                    "doc_id": doc.doc_id,
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                })

        if not all_chunks:
            return 0

        # Process in batches
        total_added = 0
        for i in range(0, len(all_chunks), batch_size):
            batch_chunks = all_chunks[i:i + batch_size]
            batch_ids = all_ids[i:i + batch_size]
            batch_metadatas = all_metadatas[i:i + batch_size]

            # Get embeddings
            embeddings = await self._get_embeddings(batch_chunks)

            # Add to collection
            self._collection.add(
                documents=batch_chunks,
                embeddings=embeddings,
                ids=batch_ids,
                metadatas=batch_metadatas,
            )
            total_added += len(batch_chunks)

        logger.info(f"Added {total_added} chunks from {len(documents)} documents")
        return total_added

    async def query(
        self,
        query: str,
        n_results: int | None = None,
        filter_metadata: dict | None = None,
    ) -> list[RetrievalResult]:
        """
        Query the vector store for relevant documents.

        Args:
            query: Search query
            n_results: Number of results to return
            filter_metadata: Optional metadata filter

        Returns:
            List of retrieval results
        """
        await self.initialize()

        if self._collection is None:
            logger.warning("Collection not available, returning empty results")
            return []

        n_results = n_results or self.top_k

        # Get query embedding
        query_embedding = await self._get_embeddings([query])

        # Query collection
        try:
            results = self._collection.query(
                query_embeddings=query_embedding,
                n_results=n_results,
                where=filter_metadata,
                include=["documents", "metadatas", "distances"],
            )
        except Exception as e:
            logger.error(f"Query failed: {e}")
            return []

        # Process results
        retrieval_results = []
        if results and results["documents"]:
            for i, (doc, metadata, distance) in enumerate(
                zip(
                    results["documents"][0],
                    results["metadatas"][0],
                    results["distances"][0],
                )
            ):
                # Convert distance to similarity score
                # ChromaDB returns L2 distance, convert to similarity
                similarity = 1 - (distance / 2)  # Approximate conversion

                if similarity >= self.similarity_threshold:
                    retrieval_results.append(
                        RetrievalResult(
                            content=doc,
                            metadata=metadata,
                            similarity_score=similarity,
                            doc_id=metadata.get("doc_id", f"doc_{i}"),
                        )
                    )

        return retrieval_results

    async def generate_with_rag(
        self,
        query: str,
        filter_metadata: dict | None = None,
    ) -> RAGResponse:
        """
        Generate a response using RAG-enhanced context.

        Args:
            query: User query
            filter_metadata: Optional metadata filter for retrieval

        Returns:
            RAG response with answer and sources
        """
        # Retrieve relevant context
        results = await self.query(query, filter_metadata=filter_metadata)

        if not results:
            return RAGResponse(
                answer="",
                sources=[],
                confidence=0.0,
                context_used=False,
            )

        # Build context from results
        context_parts = []
        for i, result in enumerate(results, 1):
            context_parts.append(
                f"[{i}] {result.content}"
            )

        context = "\n\n".join(context_parts)

        # Generate response using conversational model
        from app.models.conversational import get_conversational_model

        model = get_conversational_model()

        # Enhanced prompt with RAG context
        enhanced_message = (
            f"Based on the following context, answer the user's question.\n\n"
            f"Context:\n{context}\n\n"
            f"Question: {query}\n\n"
            f"Provide a helpful, accurate answer based on the context. "
            f"If the context doesn't contain relevant information, say so."
        )

        response = await model.generate_response(message=enhanced_message)

        # Calculate confidence based on retrieval scores
        avg_similarity = sum(r.similarity_score for r in results) / len(results)
        confidence = min(0.95, avg_similarity * response.confidence)

        return RAGResponse(
            answer=response.response,
            sources=results,
            confidence=confidence,
            context_used=True,
        )

    async def delete_documents(self, doc_ids: list[str]) -> int:
        """
        Delete documents from the vector store.

        Args:
            doc_ids: List of document IDs to delete

        Returns:
            Number of documents deleted
        """
        await self.initialize()

        if self._collection is None:
            return 0

        # Delete all chunks for each document
        deleted = 0
        for doc_id in doc_ids:
            try:
                # Find all chunks for this document
                results = self._collection.get(
                    where={"doc_id": doc_id},
                    include=[],
                )
                if results and results["ids"]:
                    self._collection.delete(ids=results["ids"])
                    deleted += 1
            except Exception as e:
                logger.error(f"Failed to delete document {doc_id}: {e}")

        return deleted

    async def get_collection_stats(self) -> dict[str, Any]:
        """Get statistics about the vector collection."""
        await self.initialize()

        if self._collection is None:
            return {"status": "unavailable"}

        try:
            count = self._collection.count()
            return {
                "status": "active",
                "collection_name": self.collection_name,
                "document_count": count,
                "persist_directory": str(self.persist_dir),
                "embedding_model": settings.embedding_model,
                "chunk_size": self.chunk_size,
                "chunk_overlap": self.chunk_overlap,
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

    async def index_fundbrave_knowledge(self) -> int:
        """
        Index default FundBrave knowledge base.

        Returns:
            Number of chunks indexed
        """
        # Create knowledge base documents
        documents = [
            Document(
                content=(
                    "FundBrave Platform Overview\n\n"
                    "FundBrave is a decentralized fundraising platform built on blockchain technology. "
                    "It enables transparent, secure crowdfunding where all donations and fund "
                    "distributions are recorded on-chain. The platform uses smart contracts to "
                    "manage campaign funds, ensuring trustless operation and full transparency.\n\n"
                    "Key Features:\n"
                    "- Smart contract-based fund management\n"
                    "- AI-powered image verification for campaign authenticity\n"
                    "- Multi-cryptocurrency support (ETH, USDC, USDT)\n"
                    "- Low platform fees (2.5%)\n"
                    "- Global accessibility without geographic restrictions\n"
                    "- Real-time donation tracking\n"
                    "- Creator verification system"
                ),
                metadata={
                    "category": "platform",
                    "type": "overview",
                    "importance": "high",
                },
            ),
            Document(
                content=(
                    "Creating a Campaign on FundBrave\n\n"
                    "Step-by-step guide to creating a successful fundraising campaign:\n\n"
                    "1. Connect Your Wallet: Click 'Connect Wallet' and choose your preferred "
                    "Web3 wallet (MetaMask, WalletConnect, Coinbase Wallet).\n\n"
                    "2. Navigate to Create Campaign: Click 'Create Campaign' in the navigation menu.\n\n"
                    "3. Fill Campaign Details:\n"
                    "   - Title: Clear, compelling headline (60 characters max)\n"
                    "   - Description: Detailed explanation of your cause\n"
                    "   - Category: Select the most relevant category\n"
                    "   - Funding Goal: Set a realistic target amount\n"
                    "   - Duration: Choose campaign end date\n\n"
                    "4. Upload Media:\n"
                    "   - Add high-quality images (verified by AI)\n"
                    "   - Optional: Include video content\n"
                    "   - Images should be authentic and relevant\n\n"
                    "5. Review and Submit:\n"
                    "   - Verify all information\n"
                    "   - Confirm smart contract deployment\n"
                    "   - Pay gas fee for transaction\n\n"
                    "Your campaign goes live immediately after blockchain confirmation."
                ),
                metadata={
                    "category": "guide",
                    "type": "create_campaign",
                    "importance": "high",
                },
            ),
            Document(
                content=(
                    "Making Donations on FundBrave\n\n"
                    "How to donate to campaigns:\n\n"
                    "1. Browse Campaigns: Explore campaigns by category or search.\n\n"
                    "2. Select a Campaign: Click on a campaign to view details.\n\n"
                    "3. Click Donate: Choose the 'Donate' button.\n\n"
                    "4. Enter Amount: Specify your donation amount.\n\n"
                    "5. Select Currency:\n"
                    "   - ETH (Ethereum)\n"
                    "   - USDC (USD Coin)\n"
                    "   - USDT (Tether)\n"
                    "   - DAI\n\n"
                    "6. Confirm Transaction: Approve in your wallet.\n\n"
                    "Benefits of blockchain donations:\n"
                    "- Instant global transfers\n"
                    "- Full transparency\n"
                    "- Lower fees than traditional platforms\n"
                    "- Permanent, verifiable records\n"
                    "- No chargebacks or reversals"
                ),
                metadata={
                    "category": "guide",
                    "type": "donations",
                    "importance": "high",
                },
            ),
            Document(
                content=(
                    "FundBrave AI Features\n\n"
                    "FundBrave uses AI to enhance the platform:\n\n"
                    "1. Deepfake Detection:\n"
                    "   - All campaign images are verified by AI\n"
                    "   - 92%+ accuracy in detecting manipulated images\n"
                    "   - Prevents fraudulent campaigns with fake imagery\n\n"
                    "2. FundBrave AI Assistant:\n"
                    "   - Available 24/7 to help users\n"
                    "   - Answers questions about the platform\n"
                    "   - Provides campaign creation guidance\n"
                    "   - Can be mentioned in comments with @FundBraveAI\n\n"
                    "3. Campaign Analysis:\n"
                    "   - Fraud pattern detection\n"
                    "   - Similar campaign identification\n"
                    "   - Improvement suggestions for campaigns\n\n"
                    "4. Content Moderation:\n"
                    "   - Automatic inappropriate content detection\n"
                    "   - Toxicity filtering in comments\n"
                    "   - Platform guideline enforcement"
                ),
                metadata={
                    "category": "features",
                    "type": "ai",
                    "importance": "medium",
                },
            ),
            Document(
                content=(
                    "Platform Fees and Costs\n\n"
                    "FundBrave has transparent, minimal fees:\n\n"
                    "Platform Fee: 2.5% of funds raised\n"
                    "- Charged only when funds are withdrawn\n"
                    "- Covers platform maintenance and AI services\n\n"
                    "Payment Processing: 0% additional fee\n"
                    "- Blockchain native, no credit card fees\n\n"
                    "Gas Fees:\n"
                    "- Standard Ethereum network gas fees apply\n"
                    "- Paid by the user initiating the transaction\n"
                    "- Layer 2 options available for lower fees\n\n"
                    "Comparison with traditional platforms:\n"
                    "- GoFundMe: 2.9% + $0.30 per transaction\n"
                    "- Kickstarter: 5% + payment processing fees\n"
                    "- FundBrave: 2.5% only, no per-transaction fees"
                ),
                metadata={
                    "category": "fees",
                    "type": "pricing",
                    "importance": "high",
                },
            ),
            Document(
                content=(
                    "Security and Verification\n\n"
                    "FundBrave prioritizes security and trust:\n\n"
                    "Smart Contract Security:\n"
                    "- All contracts are audited\n"
                    "- Open source and verifiable\n"
                    "- Non-custodial (FundBrave never holds your funds)\n\n"
                    "Campaign Verification:\n"
                    "- AI image verification for all uploads\n"
                    "- Optional creator identity verification\n"
                    "- Community reporting system\n"
                    "- 24-hour review for flagged campaigns\n\n"
                    "Wallet Security:\n"
                    "- Never share your seed phrase\n"
                    "- FundBrave only requests transaction signatures\n"
                    "- No funds are transferred during wallet connection\n\n"
                    "Reporting Issues:\n"
                    "- Use the 'Report' button on any campaign\n"
                    "- Contact support for urgent concerns\n"
                    "- All reports are reviewed within 24 hours"
                ),
                metadata={
                    "category": "security",
                    "type": "trust",
                    "importance": "high",
                },
            ),
        ]

        return await self.add_documents(documents)


# Singleton instance
_rag_service: RAGService | None = None


async def get_rag_service() -> RAGService:
    """Get the singleton RAG service instance."""
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
        await _rag_service.initialize()
    return _rag_service
