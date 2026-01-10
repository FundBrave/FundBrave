"""
Multi-Language Support Service for FundBrave AI.

Provides language detection, translation, and multi-lingual response
generation leveraging Qwen's 119 language capabilities.
"""

import asyncio
from dataclasses import dataclass
from typing import Any

from loguru import logger

from app.config import settings


# Language code to name mapping
LANGUAGE_NAMES = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "zh": "Chinese",
    "ja": "Japanese",
    "ko": "Korean",
    "ar": "Arabic",
    "hi": "Hindi",
    "pt": "Portuguese",
    "ru": "Russian",
    "it": "Italian",
    "nl": "Dutch",
    "tr": "Turkish",
    "pl": "Polish",
    "vi": "Vietnamese",
    "th": "Thai",
    "id": "Indonesian",
    "ms": "Malay",
    "fil": "Filipino",
}


@dataclass
class LanguageDetectionResult:
    """Result of language detection."""

    detected_language: str
    confidence: float
    language_name: str
    alternatives: list[dict[str, Any]]


@dataclass
class TranslationResult:
    """Result of translation."""

    original_text: str
    translated_text: str
    source_language: str
    target_language: str
    confidence: float


class LanguageService:
    """
    Multi-language support service.

    Features:
    - Automatic language detection
    - Text translation
    - Multi-lingual response generation
    - Language preference management
    """

    def __init__(self):
        """Initialize the language service."""
        self.supported_languages = settings.supported_languages
        self.default_language = settings.default_language
        self.auto_detect = settings.auto_detect_language

        self._detector = None
        self._translator = None

    async def _get_detector(self):
        """Get or initialize language detector."""
        if self._detector is None:
            try:
                from langdetect import detect_langs

                self._detector = detect_langs
                logger.info("Language detector initialized")
            except ImportError:
                logger.warning("langdetect not available")
                self._detector = None

        return self._detector

    async def _get_translator(self):
        """Get or initialize translator."""
        if self._translator is None:
            try:
                from deep_translator import GoogleTranslator

                self._translator = GoogleTranslator
                logger.info("Translator initialized")
            except ImportError:
                logger.warning("deep-translator not available")
                self._translator = None

        return self._translator

    async def detect_language(self, text: str) -> LanguageDetectionResult:
        """
        Detect the language of input text.

        Args:
            text: Text to analyze

        Returns:
            LanguageDetectionResult with detected language and confidence
        """
        if not text or len(text.strip()) < 3:
            return LanguageDetectionResult(
                detected_language=self.default_language,
                confidence=0.0,
                language_name=LANGUAGE_NAMES.get(self.default_language, "Unknown"),
                alternatives=[],
            )

        detector = await self._get_detector()

        if detector is None:
            # Fallback: assume English
            return LanguageDetectionResult(
                detected_language="en",
                confidence=0.5,
                language_name="English",
                alternatives=[],
            )

        try:
            # Run detection in executor
            loop = asyncio.get_event_loop()
            results = await loop.run_in_executor(None, lambda: detector(text))

            if not results:
                return LanguageDetectionResult(
                    detected_language=self.default_language,
                    confidence=0.0,
                    language_name=LANGUAGE_NAMES.get(self.default_language, "Unknown"),
                    alternatives=[],
                )

            # Get primary detection
            primary = results[0]
            detected_lang = primary.lang

            # Map to supported language if possible
            if detected_lang not in self.supported_languages:
                # Try to find closest supported language
                detected_lang = self._find_closest_language(detected_lang)

            return LanguageDetectionResult(
                detected_language=detected_lang,
                confidence=primary.prob,
                language_name=LANGUAGE_NAMES.get(detected_lang, detected_lang),
                alternatives=[
                    {
                        "language": r.lang,
                        "confidence": r.prob,
                        "name": LANGUAGE_NAMES.get(r.lang, r.lang),
                    }
                    for r in results[1:4]  # Top 3 alternatives
                ],
            )

        except Exception as e:
            logger.error(f"Language detection failed: {e}")
            return LanguageDetectionResult(
                detected_language=self.default_language,
                confidence=0.0,
                language_name=LANGUAGE_NAMES.get(self.default_language, "Unknown"),
                alternatives=[],
            )

    def _find_closest_language(self, lang_code: str) -> str:
        """Find the closest supported language."""
        # Language family mappings
        families = {
            "zh-cn": "zh",
            "zh-tw": "zh",
            "pt-br": "pt",
            "pt-pt": "pt",
            "es-mx": "es",
            "es-es": "es",
        }

        if lang_code.lower() in families:
            mapped = families[lang_code.lower()]
            if mapped in self.supported_languages:
                return mapped

        # Default to English
        return self.default_language

    async def translate(
        self,
        text: str,
        target_language: str,
        source_language: str | None = None,
    ) -> TranslationResult:
        """
        Translate text to target language.

        Args:
            text: Text to translate
            target_language: Target language code
            source_language: Source language code (auto-detect if not provided)

        Returns:
            TranslationResult with translated text
        """
        # Auto-detect source language if not provided
        if source_language is None:
            detection = await self.detect_language(text)
            source_language = detection.detected_language

        # No translation needed if same language
        if source_language == target_language:
            return TranslationResult(
                original_text=text,
                translated_text=text,
                source_language=source_language,
                target_language=target_language,
                confidence=1.0,
            )

        translator_class = await self._get_translator()

        if translator_class is None:
            # Fallback: Use AI model for translation
            return await self._ai_translate(text, source_language, target_language)

        try:
            loop = asyncio.get_event_loop()

            def _translate():
                translator = translator_class(
                    source=source_language,
                    target=target_language,
                )
                return translator.translate(text)

            translated_text = await loop.run_in_executor(None, _translate)

            return TranslationResult(
                original_text=text,
                translated_text=translated_text,
                source_language=source_language,
                target_language=target_language,
                confidence=0.9,
            )

        except Exception as e:
            logger.error(f"Translation failed: {e}")
            return await self._ai_translate(text, source_language, target_language)

    async def _ai_translate(
        self,
        text: str,
        source_language: str,
        target_language: str,
    ) -> TranslationResult:
        """Translate using the AI model."""
        from app.models.conversational import get_conversational_model

        model = get_conversational_model()

        source_name = LANGUAGE_NAMES.get(source_language, source_language)
        target_name = LANGUAGE_NAMES.get(target_language, target_language)

        prompt = (
            f"Translate the following text from {source_name} to {target_name}. "
            f"Provide only the translation, no explanations.\n\n"
            f"Text: {text}"
        )

        response = await model.generate_response(message=prompt)

        return TranslationResult(
            original_text=text,
            translated_text=response.response,
            source_language=source_language,
            target_language=target_language,
            confidence=response.confidence * 0.8,  # Slightly lower confidence for AI translation
        )

    async def generate_multilingual_response(
        self,
        message: str,
        target_language: str,
        context: Any | None = None,
    ) -> dict[str, Any]:
        """
        Generate a response in the specified language.

        Args:
            message: User message
            target_language: Language for the response
            context: Optional conversation context

        Returns:
            Dictionary with response and language info
        """
        from app.models.conversational import get_conversational_model

        model = get_conversational_model()

        # Detect input language
        detection = await self.detect_language(message)
        input_language = detection.detected_language

        # Build prompt with language instruction
        target_name = LANGUAGE_NAMES.get(target_language, target_language)

        if target_language != "en":
            language_instruction = f"\n\nIMPORTANT: Respond in {target_name}."
        else:
            language_instruction = ""

        # Generate response
        response = await model.generate_response(
            message=message + language_instruction,
            context=context,
        )

        return {
            "response": response.response,
            "input_language": input_language,
            "output_language": target_language,
            "input_language_name": LANGUAGE_NAMES.get(input_language, input_language),
            "output_language_name": target_name,
            "confidence": response.confidence,
            "tokens_used": response.tokens_used,
        }

    async def get_supported_languages(self) -> list[dict[str, str]]:
        """Get list of supported languages."""
        return [
            {"code": code, "name": LANGUAGE_NAMES.get(code, code)}
            for code in self.supported_languages
        ]

    async def localize_content(
        self,
        content: dict[str, str],
        target_language: str,
    ) -> dict[str, str]:
        """
        Localize multiple content fields.

        Args:
            content: Dictionary of field name to text content
            target_language: Target language code

        Returns:
            Dictionary with translated content
        """
        localized = {}

        for field, text in content.items():
            if not text:
                localized[field] = text
                continue

            result = await self.translate(text, target_language)
            localized[field] = result.translated_text

        return localized


# Singleton instance
_language_service: LanguageService | None = None


def get_language_service() -> LanguageService:
    """Get the singleton language service instance."""
    global _language_service
    if _language_service is None:
        _language_service = LanguageService()
    return _language_service
