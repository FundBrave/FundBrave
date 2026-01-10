"""
Web Search Integration Service for FundBrave AI.

Provides real-time web search capabilities to enhance AI responses
with up-to-date information from the internet.
"""

import asyncio
from dataclasses import dataclass
from datetime import datetime
from typing import Any

import httpx
from loguru import logger

from app.config import settings


@dataclass
class SearchResult:
    """A single search result."""

    title: str
    url: str
    snippet: str
    source: str
    position: int
    date: str | None = None


@dataclass
class SearchResponse:
    """Response from a web search."""

    query: str
    results: list[SearchResult]
    total_results: int
    search_time_ms: float
    source: str  # 'serpapi', 'duckduckgo', 'mock'


class WebSearchService:
    """
    Web search service with multiple provider support.

    Supports:
    - SerpAPI (Google Search)
    - DuckDuckGo (free, no API key required)
    - Fallback mock responses for testing
    """

    def __init__(self):
        """Initialize the web search service."""
        self.enabled = settings.enable_web_search
        self.serpapi_key = settings.serpapi_key
        self.results_limit = settings.search_results_limit

        self._http_client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._http_client is None or self._http_client.is_closed:
            self._http_client = httpx.AsyncClient(
                timeout=30.0,
                headers={"User-Agent": "FundBrave-AI/1.0"},
            )
        return self._http_client

    async def close(self) -> None:
        """Close HTTP client."""
        if self._http_client and not self._http_client.is_closed:
            await self._http_client.aclose()
            self._http_client = None

    async def search(
        self,
        query: str,
        num_results: int | None = None,
        search_type: str = "web",
    ) -> SearchResponse:
        """
        Perform a web search.

        Args:
            query: Search query
            num_results: Number of results to return
            search_type: Type of search ('web', 'news', 'images')

        Returns:
            SearchResponse with results
        """
        if not self.enabled:
            logger.debug("Web search disabled, returning mock results")
            return await self._mock_search(query)

        num_results = num_results or self.results_limit

        # Try SerpAPI first if configured
        if self.serpapi_key:
            try:
                return await self._serpapi_search(query, num_results, search_type)
            except Exception as e:
                logger.warning(f"SerpAPI search failed: {e}, falling back to DuckDuckGo")

        # Fall back to DuckDuckGo
        try:
            return await self._duckduckgo_search(query, num_results)
        except Exception as e:
            logger.error(f"DuckDuckGo search failed: {e}")
            return await self._mock_search(query)

    async def _serpapi_search(
        self,
        query: str,
        num_results: int,
        search_type: str,
    ) -> SearchResponse:
        """Search using SerpAPI."""
        start_time = datetime.utcnow()

        client = await self._get_client()

        params = {
            "q": query,
            "api_key": self.serpapi_key,
            "num": num_results,
            "engine": "google",
        }

        if search_type == "news":
            params["tbm"] = "nws"
        elif search_type == "images":
            params["tbm"] = "isch"

        response = await client.get(
            "https://serpapi.com/search",
            params=params,
        )
        response.raise_for_status()
        data = response.json()

        results = []
        organic_results = data.get("organic_results", [])

        for i, item in enumerate(organic_results[:num_results]):
            results.append(
                SearchResult(
                    title=item.get("title", ""),
                    url=item.get("link", ""),
                    snippet=item.get("snippet", ""),
                    source=item.get("source", ""),
                    position=i + 1,
                    date=item.get("date"),
                )
            )

        elapsed = (datetime.utcnow() - start_time).total_seconds() * 1000

        return SearchResponse(
            query=query,
            results=results,
            total_results=data.get("search_information", {}).get("total_results", len(results)),
            search_time_ms=elapsed,
            source="serpapi",
        )

    async def _duckduckgo_search(
        self,
        query: str,
        num_results: int,
    ) -> SearchResponse:
        """Search using DuckDuckGo."""
        start_time = datetime.utcnow()

        try:
            from duckduckgo_search import DDGS

            # Run in executor since DDGS is synchronous
            loop = asyncio.get_event_loop()

            def _search():
                with DDGS() as ddgs:
                    return list(ddgs.text(query, max_results=num_results))

            results_data = await loop.run_in_executor(None, _search)

            results = []
            for i, item in enumerate(results_data):
                results.append(
                    SearchResult(
                        title=item.get("title", ""),
                        url=item.get("href", ""),
                        snippet=item.get("body", ""),
                        source=self._extract_domain(item.get("href", "")),
                        position=i + 1,
                    )
                )

            elapsed = (datetime.utcnow() - start_time).total_seconds() * 1000

            return SearchResponse(
                query=query,
                results=results,
                total_results=len(results),
                search_time_ms=elapsed,
                source="duckduckgo",
            )

        except ImportError:
            logger.warning("duckduckgo-search not installed")
            raise
        except Exception as e:
            logger.error(f"DuckDuckGo search error: {e}")
            raise

    async def _mock_search(self, query: str) -> SearchResponse:
        """Generate mock search results for testing."""
        # Create relevant mock results based on query
        query_lower = query.lower()

        if "fundraising" in query_lower or "crowdfunding" in query_lower:
            results = [
                SearchResult(
                    title="Best Practices for Crowdfunding Campaigns",
                    url="https://example.com/crowdfunding-tips",
                    snippet="Learn the top strategies for successful crowdfunding campaigns, including storytelling, marketing, and engagement techniques.",
                    source="example.com",
                    position=1,
                ),
                SearchResult(
                    title="Blockchain-Based Fundraising: A Complete Guide",
                    url="https://example.com/blockchain-fundraising",
                    snippet="Discover how blockchain technology is revolutionizing charitable giving and crowdfunding with transparency and security.",
                    source="example.com",
                    position=2,
                ),
            ]
        elif "blockchain" in query_lower or "crypto" in query_lower:
            results = [
                SearchResult(
                    title="Introduction to Blockchain Technology",
                    url="https://example.com/blockchain-intro",
                    snippet="A comprehensive guide to understanding blockchain technology, smart contracts, and decentralized applications.",
                    source="example.com",
                    position=1,
                ),
                SearchResult(
                    title="Ethereum Smart Contracts Explained",
                    url="https://example.com/smart-contracts",
                    snippet="Learn how smart contracts work on Ethereum and how they enable trustless, automated transactions.",
                    source="example.com",
                    position=2,
                ),
            ]
        else:
            results = [
                SearchResult(
                    title=f"Search results for: {query}",
                    url="https://example.com/search",
                    snippet=f"Mock search results for query '{query}'. In production, this would return real web search results.",
                    source="example.com",
                    position=1,
                ),
            ]

        return SearchResponse(
            query=query,
            results=results,
            total_results=len(results),
            search_time_ms=50.0,
            source="mock",
        )

    def _extract_domain(self, url: str) -> str:
        """Extract domain from URL."""
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            return parsed.netloc.replace("www.", "")
        except Exception:
            return ""

    async def search_and_summarize(
        self,
        query: str,
        context: str | None = None,
    ) -> dict[str, Any]:
        """
        Search the web and generate a summary with the AI model.

        Args:
            query: Search query
            context: Optional context to guide the summary

        Returns:
            Dictionary with search results and AI summary
        """
        # Perform search
        search_response = await self.search(query)

        if not search_response.results:
            return {
                "query": query,
                "results": [],
                "summary": "No relevant search results found.",
                "sources": [],
            }

        # Build context from search results
        search_context = "\n\n".join([
            f"Source: {r.title} ({r.source})\n{r.snippet}"
            for r in search_response.results
        ])

        # Generate summary using conversational model
        from app.models.conversational import get_conversational_model

        model = get_conversational_model()

        prompt = (
            f"Based on the following search results, provide a concise summary "
            f"answering the query: '{query}'\n\n"
            f"Search Results:\n{search_context}\n\n"
        )

        if context:
            prompt += f"Additional context: {context}\n\n"

        prompt += "Provide a helpful, accurate summary. Cite sources when possible."

        response = await model.generate_response(message=prompt)

        return {
            "query": query,
            "results": [
                {
                    "title": r.title,
                    "url": r.url,
                    "snippet": r.snippet,
                    "source": r.source,
                }
                for r in search_response.results
            ],
            "summary": response.response,
            "sources": [r.url for r in search_response.results],
            "search_source": search_response.source,
            "search_time_ms": search_response.search_time_ms,
        }

    async def search_news(
        self,
        query: str,
        num_results: int | None = None,
    ) -> SearchResponse:
        """Search for recent news articles."""
        return await self.search(query, num_results, search_type="news")

    async def is_available(self) -> dict[str, Any]:
        """Check if web search is available and configured."""
        return {
            "enabled": self.enabled,
            "serpapi_configured": bool(self.serpapi_key),
            "duckduckgo_available": await self._check_duckduckgo(),
            "results_limit": self.results_limit,
        }

    async def _check_duckduckgo(self) -> bool:
        """Check if DuckDuckGo search is available."""
        try:
            from duckduckgo_search import DDGS
            return True
        except ImportError:
            return False


# Singleton instance
_web_search_service: WebSearchService | None = None


async def get_web_search_service() -> WebSearchService:
    """Get the singleton web search service instance."""
    global _web_search_service
    if _web_search_service is None:
        _web_search_service = WebSearchService()
    return _web_search_service
