"""
Service layer for FundBrave AI Service.

Provides abstraction for:
- Database operations (via backend API)
- Cache management (Redis)
- LoRA fine-tuning (training)
- Cost monitoring and optimization
- RAG (Retrieval Augmented Generation)
- Web search integration
- Campaign recommendations
- Multi-language support
- Conversation memory
- Fraud detection
- Content moderation
- Analytics
- A/B testing
- Safety filters
- Model routing
"""

# Core services
from app.services.database import DatabaseService, get_database_service
from app.services.cache import CacheService, get_cache_service

# Phase 1 services
from app.services.training import (
    LoRATrainingService,
    TrainingConfig,
    TrainingExample,
    TrainingProgress,
    TrainingResult,
    get_training_service,
)
from app.services.cost_monitor import (
    CostMonitorService,
    UsageRecord,
    DailyUsage,
    BudgetAlert,
    get_cost_monitor,
)

# Phase 2 services
from app.services.rag import (
    RAGService,
    Document,
    RetrievalResult,
    RAGResponse,
    get_rag_service,
)
from app.services.web_search import (
    WebSearchService,
    SearchResult,
    SearchResponse,
    get_web_search_service,
)
from app.services.recommendations import (
    RecommendationEngine,
    Campaign,
    UserProfile,
    Recommendation,
    get_recommendation_engine,
)
from app.services.language import (
    LanguageService,
    LanguageDetectionResult,
    TranslationResult,
    get_language_service,
)
from app.services.memory import (
    ConversationMemoryService,
    Conversation,
    ConversationMessage,
    get_memory_service,
)
from app.services.fraud_detection import (
    FraudDetectionService,
    FraudAnalysisResult,
    FraudIndicator,
    get_fraud_detection_service,
)
from app.services.moderation import (
    ModerationService,
    ModerationResult,
    ModerationAction,
    ContentType,
    get_moderation_service,
)
from app.services.analytics import (
    AnalyticsService,
    CampaignMetrics,
    AIInsight,
    AnalyticsReport,
    get_analytics_service,
)

# Phase 3 services
from app.services.ab_testing import (
    ABTestingService,
    Experiment,
    Variant,
    ExperimentResult,
    ExperimentStatus,
    get_ab_testing_service,
)
from app.services.safety import (
    SafetyService,
    SafetyCheckResult,
    SafetyViolation,
    SafetyCategory,
    SafetyAction,
    get_safety_service,
)
from app.services.model_router import (
    ModelRouterService,
    RoutingDecision,
    QueryClassification,
    ModelTier,
    get_model_router_service,
)

__all__ = [
    # Core
    "DatabaseService",
    "get_database_service",
    "CacheService",
    "get_cache_service",
    # Phase 1
    "LoRATrainingService",
    "TrainingConfig",
    "TrainingExample",
    "TrainingProgress",
    "TrainingResult",
    "get_training_service",
    "CostMonitorService",
    "UsageRecord",
    "DailyUsage",
    "BudgetAlert",
    "get_cost_monitor",
    # Phase 2
    "RAGService",
    "Document",
    "RetrievalResult",
    "RAGResponse",
    "get_rag_service",
    "WebSearchService",
    "SearchResult",
    "SearchResponse",
    "get_web_search_service",
    "RecommendationEngine",
    "Campaign",
    "UserProfile",
    "Recommendation",
    "get_recommendation_engine",
    "LanguageService",
    "LanguageDetectionResult",
    "TranslationResult",
    "get_language_service",
    "ConversationMemoryService",
    "Conversation",
    "ConversationMessage",
    "get_memory_service",
    "FraudDetectionService",
    "FraudAnalysisResult",
    "FraudIndicator",
    "get_fraud_detection_service",
    "ModerationService",
    "ModerationResult",
    "ModerationAction",
    "ContentType",
    "get_moderation_service",
    "AnalyticsService",
    "CampaignMetrics",
    "AIInsight",
    "AnalyticsReport",
    "get_analytics_service",
    # Phase 3
    "ABTestingService",
    "Experiment",
    "Variant",
    "ExperimentResult",
    "ExperimentStatus",
    "get_ab_testing_service",
    "SafetyService",
    "SafetyCheckResult",
    "SafetyViolation",
    "SafetyCategory",
    "SafetyAction",
    "get_safety_service",
    "ModelRouterService",
    "RoutingDecision",
    "QueryClassification",
    "ModelTier",
    "get_model_router_service",
]
