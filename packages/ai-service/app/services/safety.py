"""
Advanced Safety Filters Service for FundBrave AI.

Provides content safety analysis, harmful content detection,
and AI output filtering to ensure safe platform interactions.
"""

import re
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any

from loguru import logger

from app.config import settings


class SafetyCategory(Enum):
    """Safety violation categories."""

    HARMFUL_CONTENT = "harmful_content"
    HATE_SPEECH = "hate_speech"
    VIOLENCE = "violence"
    SELF_HARM = "self_harm"
    SEXUAL_CONTENT = "sexual_content"
    MISINFORMATION = "misinformation"
    SCAM = "scam"
    PII_EXPOSURE = "pii_exposure"
    PROMPT_INJECTION = "prompt_injection"
    JAILBREAK_ATTEMPT = "jailbreak_attempt"


class SafetyAction(Enum):
    """Actions to take based on safety analysis."""

    ALLOW = "allow"
    WARN = "warn"
    MODIFY = "modify"
    BLOCK = "block"
    REPORT = "report"


@dataclass
class SafetyViolation:
    """A detected safety violation."""

    category: SafetyCategory
    severity: float  # 0.0 to 1.0
    description: str
    evidence: str
    position: tuple[int, int] | None = None  # Start, end position in text


@dataclass
class SafetyCheckResult:
    """Result of a safety check."""

    is_safe: bool
    action: SafetyAction
    violations: list[SafetyViolation]
    overall_risk_score: float
    modified_content: str | None = None
    recommendations: list[str] = field(default_factory=list)
    check_timestamp: datetime = field(default_factory=datetime.utcnow)


class SafetyService:
    """
    Advanced safety filters service.

    Features:
    - Input content validation
    - AI output filtering
    - Prompt injection detection
    - PII detection and redaction
    - Harmful content detection
    - Jailbreak attempt detection
    """

    def __init__(self):
        """Initialize the safety service."""
        self.enabled = settings.safety_enabled
        self.block_harmful = settings.block_harmful_content
        self.review_threshold = settings.safety_review_threshold

        # Prompt injection patterns
        self.injection_patterns = [
            r"ignore\s+(all\s+)?(previous\s+)?instructions",
            r"disregard\s+(all\s+)?(previous\s+)?instructions",
            r"forget\s+(all\s+)?(previous\s+)?instructions",
            r"you\s+are\s+now\s+[a-z]+",
            r"pretend\s+you\s+are",
            r"act\s+as\s+if\s+you\s+(are|were)",
            r"roleplay\s+as",
            r"your\s+new\s+(name|identity|role)\s+is",
            r"system\s*:\s*",
            r"<\s*system\s*>",
            r"\[system\]",
            r"jailbreak",
            r"DAN\s+mode",
            r"developer\s+mode",
        ]

        # PII patterns
        self.pii_patterns = {
            "email": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
            "phone": r"\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b",
            "ssn": r"\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b",
            "credit_card": r"\b(?:\d{4}[-.\s]?){3}\d{4}\b",
            "wallet_address": r"\b0x[a-fA-F0-9]{40}\b",
        }

        # Harmful content keywords (for basic detection)
        self.harmful_keywords = {
            SafetyCategory.VIOLENCE: [
                "kill", "murder", "attack", "bomb", "weapon",
                "shoot", "stab", "assault"
            ],
            SafetyCategory.SELF_HARM: [
                "suicide", "self-harm", "hurt myself", "end my life"
            ],
            SafetyCategory.SCAM: [
                "wire money", "send bitcoin", "gift card", "urgent transfer",
                "bank details", "password", "verification code"
            ],
        }

        # Jailbreak phrases
        self.jailbreak_phrases = [
            "bypass safety",
            "ignore safety",
            "disable filter",
            "unrestricted mode",
            "no limits mode",
            "anything goes",
            "no rules",
            "unfiltered response",
        ]

    async def check_input(self, content: str) -> SafetyCheckResult:
        """
        Check user input for safety violations.

        Args:
            content: User input to check

        Returns:
            SafetyCheckResult with violations and action
        """
        if not self.enabled:
            return SafetyCheckResult(
                is_safe=True,
                action=SafetyAction.ALLOW,
                violations=[],
                overall_risk_score=0.0,
            )

        violations = []

        # Check for prompt injection
        injection_violations = self._check_prompt_injection(content)
        violations.extend(injection_violations)

        # Check for jailbreak attempts
        jailbreak_violations = self._check_jailbreak(content)
        violations.extend(jailbreak_violations)

        # Check for harmful content
        harmful_violations = await self._check_harmful_content(content)
        violations.extend(harmful_violations)

        # Check for PII
        pii_violations = self._check_pii(content)
        violations.extend(pii_violations)

        # Calculate overall risk
        risk_score = self._calculate_risk_score(violations)

        # Determine action
        action = self._determine_action(violations, risk_score)

        # Generate recommendations
        recommendations = self._generate_recommendations(violations, action)

        return SafetyCheckResult(
            is_safe=action == SafetyAction.ALLOW,
            action=action,
            violations=violations,
            overall_risk_score=risk_score,
            recommendations=recommendations,
        )

    async def check_output(
        self, content: str, context: str | None = None
    ) -> SafetyCheckResult:
        """
        Check AI output for safety before sending to user.

        Args:
            content: AI-generated content
            context: Optional context for the check

        Returns:
            SafetyCheckResult with violations and action
        """
        if not self.enabled:
            return SafetyCheckResult(
                is_safe=True,
                action=SafetyAction.ALLOW,
                violations=[],
                overall_risk_score=0.0,
            )

        violations = []

        # Check for harmful content in output
        harmful_violations = await self._check_harmful_content(content)
        violations.extend(harmful_violations)

        # Check for PII leakage
        pii_violations = self._check_pii(content)
        if pii_violations:
            # For outputs, PII is more concerning
            for v in pii_violations:
                v.severity = min(1.0, v.severity + 0.2)
            violations.extend(pii_violations)

        # Check for inappropriate instructions
        instruction_violations = self._check_inappropriate_instructions(content)
        violations.extend(instruction_violations)

        # Calculate risk and action
        risk_score = self._calculate_risk_score(violations)
        action = self._determine_action(violations, risk_score)

        # Optionally modify content
        modified_content = None
        if action == SafetyAction.MODIFY and pii_violations:
            modified_content = self._redact_pii(content)

        return SafetyCheckResult(
            is_safe=action in [SafetyAction.ALLOW, SafetyAction.MODIFY],
            action=action,
            violations=violations,
            overall_risk_score=risk_score,
            modified_content=modified_content,
            recommendations=self._generate_recommendations(violations, action),
        )

    def _check_prompt_injection(self, content: str) -> list[SafetyViolation]:
        """Check for prompt injection attempts."""
        violations = []
        content_lower = content.lower()

        for pattern in self.injection_patterns:
            matches = re.finditer(pattern, content_lower, re.IGNORECASE)
            for match in matches:
                violations.append(
                    SafetyViolation(
                        category=SafetyCategory.PROMPT_INJECTION,
                        severity=0.9,
                        description="Potential prompt injection detected",
                        evidence=match.group(),
                        position=(match.start(), match.end()),
                    )
                )

        return violations

    def _check_jailbreak(self, content: str) -> list[SafetyViolation]:
        """Check for jailbreak attempts."""
        violations = []
        content_lower = content.lower()

        for phrase in self.jailbreak_phrases:
            if phrase in content_lower:
                violations.append(
                    SafetyViolation(
                        category=SafetyCategory.JAILBREAK_ATTEMPT,
                        severity=0.95,
                        description="Jailbreak attempt detected",
                        evidence=phrase,
                    )
                )

        return violations

    async def _check_harmful_content(self, content: str) -> list[SafetyViolation]:
        """Check for harmful content."""
        violations = []
        content_lower = content.lower()

        for category, keywords in self.harmful_keywords.items():
            for keyword in keywords:
                if keyword in content_lower:
                    severity = 0.7 if category != SafetyCategory.SELF_HARM else 0.9
                    violations.append(
                        SafetyViolation(
                            category=category,
                            severity=severity,
                            description=f"Potentially harmful content ({category.value})",
                            evidence=keyword,
                        )
                    )

        # AI-based check for longer content
        if len(content) > 100:
            ai_violations = await self._ai_safety_check(content)
            violations.extend(ai_violations)

        return violations

    async def _ai_safety_check(self, content: str) -> list[SafetyViolation]:
        """Use AI for advanced safety checking."""
        try:
            from app.models.conversational import get_conversational_model

            model = get_conversational_model()

            prompt = (
                f"Analyze this content for safety issues. Rate each category 0-10:\n\n"
                f"Content: {content[:500]}\n\n"
                f"Categories:\n"
                f"1. HARMFUL (violence, dangerous activities)\n"
                f"2. HATE (discrimination, slurs)\n"
                f"3. SCAM (financial fraud indicators)\n"
                f"4. MISINFORMATION (false claims)\n\n"
                f"Format: HARMFUL:[0-10] HATE:[0-10] SCAM:[0-10] MISINFO:[0-10]"
            )

            response = await model.generate_response(message=prompt)

            violations = []
            response_upper = response.response.upper()

            category_map = {
                "HARMFUL": SafetyCategory.HARMFUL_CONTENT,
                "HATE": SafetyCategory.HATE_SPEECH,
                "SCAM": SafetyCategory.SCAM,
                "MISINFO": SafetyCategory.MISINFORMATION,
            }

            for name, category in category_map.items():
                if f"{name}:" in response_upper:
                    try:
                        score_part = response_upper.split(f"{name}:")[1][:5]
                        score = float("".join(c for c in score_part if c.isdigit() or c == "."))
                        score = min(10, max(0, score))

                        if score >= 5:
                            violations.append(
                                SafetyViolation(
                                    category=category,
                                    severity=score / 10,
                                    description=f"AI detected {category.value}",
                                    evidence="AI analysis",
                                )
                            )
                    except (ValueError, IndexError):
                        pass

            return violations

        except Exception as e:
            logger.error(f"AI safety check failed: {e}")
            return []

    def _check_pii(self, content: str) -> list[SafetyViolation]:
        """Check for personally identifiable information."""
        violations = []

        for pii_type, pattern in self.pii_patterns.items():
            matches = re.finditer(pattern, content)
            for match in matches:
                # Don't flag wallet addresses as PII in a crypto platform context
                if pii_type == "wallet_address":
                    continue

                violations.append(
                    SafetyViolation(
                        category=SafetyCategory.PII_EXPOSURE,
                        severity=0.6 if pii_type in ["email", "phone"] else 0.9,
                        description=f"Potential {pii_type.upper()} detected",
                        evidence=f"[{pii_type}]",
                        position=(match.start(), match.end()),
                    )
                )

        return violations

    def _check_inappropriate_instructions(self, content: str) -> list[SafetyViolation]:
        """Check for inappropriate instructions in AI output."""
        violations = []
        content_lower = content.lower()

        inappropriate_patterns = [
            ("illegal activity", ["how to hack", "bypass security", "steal", "illegal"]),
            ("financial fraud", ["send money to", "wire transfer to", "payment to"]),
        ]

        for description, patterns in inappropriate_patterns:
            for pattern in patterns:
                if pattern in content_lower:
                    violations.append(
                        SafetyViolation(
                            category=SafetyCategory.HARMFUL_CONTENT,
                            severity=0.8,
                            description=f"Inappropriate instruction ({description})",
                            evidence=pattern,
                        )
                    )

        return violations

    def _redact_pii(self, content: str) -> str:
        """Redact PII from content."""
        redacted = content

        for pii_type, pattern in self.pii_patterns.items():
            if pii_type == "wallet_address":
                continue  # Don't redact wallet addresses

            redaction = f"[{pii_type.upper()}_REDACTED]"
            redacted = re.sub(pattern, redaction, redacted)

        return redacted

    def _calculate_risk_score(self, violations: list[SafetyViolation]) -> float:
        """Calculate overall risk score from violations."""
        if not violations:
            return 0.0

        # Weight by severity and category importance
        category_weights = {
            SafetyCategory.PROMPT_INJECTION: 1.5,
            SafetyCategory.JAILBREAK_ATTEMPT: 1.5,
            SafetyCategory.SELF_HARM: 1.3,
            SafetyCategory.VIOLENCE: 1.2,
            SafetyCategory.SCAM: 1.2,
            SafetyCategory.HATE_SPEECH: 1.1,
            SafetyCategory.HARMFUL_CONTENT: 1.0,
            SafetyCategory.MISINFORMATION: 0.9,
            SafetyCategory.PII_EXPOSURE: 0.8,
            SafetyCategory.SEXUAL_CONTENT: 0.8,
        }

        weighted_sum = 0.0
        weight_total = 0.0

        for v in violations:
            weight = category_weights.get(v.category, 1.0)
            weighted_sum += v.severity * weight
            weight_total += weight

        return min(1.0, weighted_sum / weight_total if weight_total > 0 else 0.0)

    def _determine_action(
        self, violations: list[SafetyViolation], risk_score: float
    ) -> SafetyAction:
        """Determine action based on violations."""
        if not violations:
            return SafetyAction.ALLOW

        # Check for critical violations
        critical_categories = [
            SafetyCategory.PROMPT_INJECTION,
            SafetyCategory.JAILBREAK_ATTEMPT,
            SafetyCategory.SELF_HARM,
        ]

        for v in violations:
            if v.category in critical_categories and v.severity >= 0.8:
                return SafetyAction.BLOCK if self.block_harmful else SafetyAction.REPORT

        # Risk score based decision
        if risk_score >= 0.8:
            return SafetyAction.BLOCK if self.block_harmful else SafetyAction.REPORT
        elif risk_score >= 0.5:
            return SafetyAction.WARN
        elif risk_score >= 0.3:
            # Check if just PII that can be redacted
            pii_only = all(v.category == SafetyCategory.PII_EXPOSURE for v in violations)
            return SafetyAction.MODIFY if pii_only else SafetyAction.WARN
        else:
            return SafetyAction.ALLOW

    def _generate_recommendations(
        self, violations: list[SafetyViolation], action: SafetyAction
    ) -> list[str]:
        """Generate recommendations based on violations."""
        recommendations = []

        if action == SafetyAction.BLOCK:
            recommendations.append("Content has been blocked due to safety concerns")
            recommendations.append("Please rephrase your request")

        for v in violations:
            if v.category == SafetyCategory.PROMPT_INJECTION:
                recommendations.append("Avoid instructions that attempt to modify AI behavior")
            elif v.category == SafetyCategory.PII_EXPOSURE:
                recommendations.append("Avoid sharing personal information in messages")
            elif v.category == SafetyCategory.SCAM:
                recommendations.append("Be cautious of requests for money or personal information")

        return list(set(recommendations))


# Singleton instance
_safety_service: SafetyService | None = None


def get_safety_service() -> SafetyService:
    """Get the singleton safety service instance."""
    global _safety_service
    if _safety_service is None:
        _safety_service = SafetyService()
    return _safety_service
