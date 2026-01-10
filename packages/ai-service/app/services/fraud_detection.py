"""
Campaign Fraud Detection Service for FundBrave AI.

Provides pattern analysis, duplicate detection, and risk assessment
for campaigns to identify potentially fraudulent activity.
"""

import asyncio
import hashlib
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any

from loguru import logger

from app.config import settings


@dataclass
class FraudIndicator:
    """A single fraud indicator."""

    indicator_type: str
    severity: str  # 'low', 'medium', 'high', 'critical'
    description: str
    score: float  # 0.0 to 1.0
    evidence: dict[str, Any] = field(default_factory=dict)


@dataclass
class FraudAnalysisResult:
    """Result of fraud analysis."""

    campaign_id: str
    risk_score: float  # 0.0 to 1.0 (higher = more suspicious)
    risk_level: str  # 'low', 'medium', 'high', 'critical'
    indicators: list[FraudIndicator]
    requires_review: bool
    recommendations: list[str]
    similar_campaigns: list[dict]
    analysis_timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class CampaignFingerprint:
    """Fingerprint for campaign similarity detection."""

    campaign_id: str
    creator_id: str
    text_hash: str
    image_hashes: list[str]
    embedding: list[float] | None = None
    created_at: datetime = field(default_factory=datetime.utcnow)


class FraudDetectionService:
    """
    Fraud detection service for campaign verification.

    Features:
    - Duplicate campaign detection
    - Creator behavior analysis
    - Text pattern matching for scam indicators
    - Image similarity detection
    - Risk scoring
    """

    def __init__(self):
        """Initialize the fraud detection service."""
        self.enabled = settings.fraud_detection_enabled
        self.similarity_threshold = settings.fraud_similarity_threshold
        self.min_campaigns_for_pattern = settings.fraud_min_campaigns_for_pattern

        # Known fraud patterns
        self.scam_keywords = [
            "guaranteed returns",
            "get rich quick",
            "limited time only",
            "act now",
            "wire transfer",
            "western union",
            "cryptocurrency investment",
            "double your money",
            "risk-free",
            "secret method",
            "exclusive opportunity",
        ]

        self.urgent_language = [
            "urgent",
            "emergency",
            "desperate",
            "last chance",
            "final hours",
            "closing soon",
        ]

        # Storage for fingerprints and analysis
        self._fingerprints: dict[str, CampaignFingerprint] = {}
        self._creator_history: dict[str, list[str]] = {}

        self._embedder = None

    async def _get_embeddings(self, texts: list[str]) -> list[list[float]]:
        """Get text embeddings."""
        if self._embedder is None:
            try:
                from sentence_transformers import SentenceTransformer

                self._embedder = SentenceTransformer(settings.embedding_model)
            except ImportError:
                import random
                return [[random.random() for _ in range(384)] for _ in texts]

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, lambda: self._embedder.encode(texts).tolist()
        )

    def _cosine_similarity(self, vec1: list[float], vec2: list[float]) -> float:
        """Calculate cosine similarity."""
        import math

        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        norm1 = math.sqrt(sum(a * a for a in vec1))
        norm2 = math.sqrt(sum(b * b for b in vec2))

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return dot_product / (norm1 * norm2)

    async def analyze_campaign(
        self,
        campaign_id: str,
        name: str,
        description: str,
        creator_id: str,
        goal_amount: float,
        category: str,
        image_urls: list[str] | None = None,
    ) -> FraudAnalysisResult:
        """
        Analyze a campaign for potential fraud.

        Args:
            campaign_id: Campaign ID
            name: Campaign name
            description: Campaign description
            creator_id: Creator's user ID
            goal_amount: Funding goal
            category: Campaign category
            image_urls: List of campaign image URLs

        Returns:
            FraudAnalysisResult with risk assessment
        """
        if not self.enabled:
            return FraudAnalysisResult(
                campaign_id=campaign_id,
                risk_score=0.0,
                risk_level="low",
                indicators=[],
                requires_review=False,
                recommendations=[],
                similar_campaigns=[],
            )

        indicators = []

        # 1. Text pattern analysis
        text_indicators = await self._analyze_text_patterns(name, description)
        indicators.extend(text_indicators)

        # 2. Check for similar campaigns
        similar = await self._find_similar_campaigns(
            campaign_id, name, description, creator_id
        )

        if similar:
            severity = "high" if len(similar) > 1 else "medium"
            indicators.append(
                FraudIndicator(
                    indicator_type="duplicate_content",
                    severity=severity,
                    description=f"Found {len(similar)} similar campaign(s)",
                    score=0.7 if severity == "high" else 0.4,
                    evidence={"similar_campaign_ids": [s["id"] for s in similar]},
                )
            )

        # 3. Creator behavior analysis
        creator_indicators = await self._analyze_creator_behavior(creator_id, goal_amount)
        indicators.extend(creator_indicators)

        # 4. Goal amount analysis
        amount_indicators = self._analyze_goal_amount(goal_amount, category)
        indicators.extend(amount_indicators)

        # Calculate overall risk score
        risk_score = self._calculate_risk_score(indicators)
        risk_level = self._get_risk_level(risk_score)

        # Generate recommendations
        recommendations = self._generate_recommendations(indicators, risk_level)

        # Create fingerprint for future detection
        await self._create_fingerprint(
            campaign_id, creator_id, name, description, image_urls
        )

        return FraudAnalysisResult(
            campaign_id=campaign_id,
            risk_score=risk_score,
            risk_level=risk_level,
            indicators=indicators,
            requires_review=risk_score >= 0.5,
            recommendations=recommendations,
            similar_campaigns=similar,
        )

    async def _analyze_text_patterns(
        self, name: str, description: str
    ) -> list[FraudIndicator]:
        """Analyze text for fraud patterns."""
        indicators = []
        full_text = f"{name} {description}".lower()

        # Check for scam keywords
        found_scam_words = [
            word for word in self.scam_keywords if word in full_text
        ]
        if found_scam_words:
            indicators.append(
                FraudIndicator(
                    indicator_type="scam_keywords",
                    severity="high",
                    description=f"Contains suspicious keywords: {', '.join(found_scam_words[:3])}",
                    score=0.6,
                    evidence={"keywords": found_scam_words},
                )
            )

        # Check for urgent language
        found_urgent = [
            word for word in self.urgent_language if word in full_text
        ]
        if len(found_urgent) >= 2:
            indicators.append(
                FraudIndicator(
                    indicator_type="urgency_manipulation",
                    severity="medium",
                    description="Uses excessive urgency language",
                    score=0.3,
                    evidence={"keywords": found_urgent},
                )
            )

        # Check description length
        if len(description) < 100:
            indicators.append(
                FraudIndicator(
                    indicator_type="low_effort",
                    severity="low",
                    description="Campaign description is very short",
                    score=0.2,
                    evidence={"description_length": len(description)},
                )
            )

        # Check for ALL CAPS
        caps_ratio = sum(1 for c in name if c.isupper()) / max(1, len(name))
        if caps_ratio > 0.7:
            indicators.append(
                FraudIndicator(
                    indicator_type="excessive_caps",
                    severity="low",
                    description="Campaign name uses excessive capitalization",
                    score=0.1,
                    evidence={"caps_ratio": caps_ratio},
                )
            )

        # AI-based content analysis
        ai_indicators = await self._ai_content_analysis(name, description)
        indicators.extend(ai_indicators)

        return indicators

    async def _ai_content_analysis(
        self, name: str, description: str
    ) -> list[FraudIndicator]:
        """Use AI to analyze content for fraud signals."""
        from app.models.conversational import get_conversational_model

        model = get_conversational_model()

        prompt = (
            f"Analyze this fundraising campaign for potential fraud indicators. "
            f"Rate the likelihood of fraud on a scale of 0-10 and explain why.\n\n"
            f"Campaign Name: {name}\n"
            f"Description: {description[:500]}\n\n"
            f"Provide your analysis in format:\n"
            f"SCORE: [0-10]\n"
            f"REASONS: [comma-separated list of concerns, or 'none']"
        )

        response = await model.generate_response(message=prompt)

        indicators = []

        # Parse AI response
        response_text = response.response.lower()
        try:
            if "score:" in response_text:
                score_line = response_text.split("score:")[1].split("\n")[0]
                score = float("".join(c for c in score_line if c.isdigit() or c == "."))
                score = min(10, max(0, score))

                if score >= 7:
                    indicators.append(
                        FraudIndicator(
                            indicator_type="ai_analysis",
                            severity="high",
                            description="AI detected high fraud likelihood",
                            score=score / 10,
                            evidence={"ai_response": response.response[:200]},
                        )
                    )
                elif score >= 5:
                    indicators.append(
                        FraudIndicator(
                            indicator_type="ai_analysis",
                            severity="medium",
                            description="AI detected moderate fraud signals",
                            score=score / 10,
                            evidence={"ai_response": response.response[:200]},
                        )
                    )
        except (ValueError, IndexError):
            pass  # Could not parse AI response

        return indicators

    async def _find_similar_campaigns(
        self,
        campaign_id: str,
        name: str,
        description: str,
        creator_id: str,
    ) -> list[dict]:
        """Find similar existing campaigns."""
        similar = []

        # Compute embedding for this campaign
        text = f"{name} {description}"
        embeddings = await self._get_embeddings([text])
        current_embedding = embeddings[0]

        for fp_id, fingerprint in self._fingerprints.items():
            if fp_id == campaign_id:
                continue

            if fingerprint.embedding is None:
                continue

            similarity = self._cosine_similarity(current_embedding, fingerprint.embedding)

            if similarity >= self.similarity_threshold:
                similar.append({
                    "id": fp_id,
                    "similarity": similarity,
                    "same_creator": fingerprint.creator_id == creator_id,
                })

        return similar

    async def _analyze_creator_behavior(
        self, creator_id: str, goal_amount: float
    ) -> list[FraudIndicator]:
        """Analyze creator's campaign history."""
        indicators = []

        # Get creator's campaign history
        creator_campaigns = self._creator_history.get(creator_id, [])

        # Check for rapid campaign creation
        if len(creator_campaigns) >= 3:
            # Check if created within short time window
            recent_campaigns = [
                cid for cid in creator_campaigns
                if cid in self._fingerprints
                and (datetime.utcnow() - self._fingerprints[cid].created_at).days < 7
            ]

            if len(recent_campaigns) >= 3:
                indicators.append(
                    FraudIndicator(
                        indicator_type="rapid_creation",
                        severity="high",
                        description="Creator has many campaigns in short period",
                        score=0.5,
                        evidence={
                            "recent_campaigns": len(recent_campaigns),
                            "total_campaigns": len(creator_campaigns),
                        },
                    )
                )

        # Track this campaign
        if creator_id not in self._creator_history:
            self._creator_history[creator_id] = []
        self._creator_history[creator_id].append(f"campaign_{len(self._fingerprints)}")

        return indicators

    def _analyze_goal_amount(
        self, goal_amount: float, category: str
    ) -> list[FraudIndicator]:
        """Analyze goal amount for anomalies."""
        indicators = []

        # Category-specific thresholds (in USD equivalent)
        category_thresholds = {
            "personal": 50000,
            "medical": 100000,
            "education": 75000,
            "disaster": 500000,
            "nonprofit": 1000000,
            "default": 100000,
        }

        threshold = category_thresholds.get(
            category.lower(), category_thresholds["default"]
        )

        if goal_amount > threshold:
            indicators.append(
                FraudIndicator(
                    indicator_type="unusual_goal",
                    severity="medium",
                    description=f"Goal amount ${goal_amount:,.0f} is unusually high for {category}",
                    score=0.3,
                    evidence={
                        "goal_amount": goal_amount,
                        "category_threshold": threshold,
                    },
                )
            )

        # Very low goals might also be suspicious (testing accounts)
        if goal_amount < 10:
            indicators.append(
                FraudIndicator(
                    indicator_type="suspicious_low_goal",
                    severity="low",
                    description="Goal amount is suspiciously low",
                    score=0.2,
                    evidence={"goal_amount": goal_amount},
                )
            )

        return indicators

    def _calculate_risk_score(self, indicators: list[FraudIndicator]) -> float:
        """Calculate overall risk score from indicators."""
        if not indicators:
            return 0.0

        # Weighted average based on severity
        severity_weights = {
            "critical": 1.5,
            "high": 1.0,
            "medium": 0.6,
            "low": 0.3,
        }

        total_score = 0.0
        total_weight = 0.0

        for indicator in indicators:
            weight = severity_weights.get(indicator.severity, 0.5)
            total_score += indicator.score * weight
            total_weight += weight

        if total_weight == 0:
            return 0.0

        return min(1.0, total_score / total_weight)

    def _get_risk_level(self, risk_score: float) -> str:
        """Get risk level from score."""
        if risk_score >= 0.8:
            return "critical"
        elif risk_score >= 0.6:
            return "high"
        elif risk_score >= 0.4:
            return "medium"
        else:
            return "low"

    def _generate_recommendations(
        self, indicators: list[FraudIndicator], risk_level: str
    ) -> list[str]:
        """Generate recommendations based on analysis."""
        recommendations = []

        if risk_level in ["critical", "high"]:
            recommendations.append("Campaign should be reviewed by moderation team")
            recommendations.append("Request additional verification from creator")

        for indicator in indicators:
            if indicator.indicator_type == "duplicate_content":
                recommendations.append("Verify campaign is not a duplicate")
            elif indicator.indicator_type == "scam_keywords":
                recommendations.append("Review campaign for potential scam content")
            elif indicator.indicator_type == "rapid_creation":
                recommendations.append("Verify creator identity and intentions")

        if not recommendations:
            recommendations.append("No immediate action required")

        return recommendations

    async def _create_fingerprint(
        self,
        campaign_id: str,
        creator_id: str,
        name: str,
        description: str,
        image_urls: list[str] | None = None,
    ) -> None:
        """Create fingerprint for campaign."""
        text = f"{name} {description}"
        text_hash = hashlib.md5(text.encode()).hexdigest()

        embeddings = await self._get_embeddings([text])

        fingerprint = CampaignFingerprint(
            campaign_id=campaign_id,
            creator_id=creator_id,
            text_hash=text_hash,
            image_hashes=[],  # Would hash actual images
            embedding=embeddings[0],
        )

        self._fingerprints[campaign_id] = fingerprint


# Singleton instance
_fraud_service: FraudDetectionService | None = None


def get_fraud_detection_service() -> FraudDetectionService:
    """Get the singleton fraud detection service instance."""
    global _fraud_service
    if _fraud_service is None:
        _fraud_service = FraudDetectionService()
    return _fraud_service
