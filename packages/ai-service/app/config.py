"""
Configuration settings for the FundBrave AI Service.

Uses Pydantic Settings for environment variable management with validation.
All settings are loaded from environment variables with sensible defaults.
"""

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.

    Attributes are grouped by functionality for clarity.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ===========================================
    # API Configuration
    # ===========================================
    api_host: str = Field(default="0.0.0.0", description="API host address")
    api_port: int = Field(default=8001, ge=1, le=65535, description="API port")
    environment: Literal["development", "staging", "production"] = Field(
        default="development",
        description="Deployment environment"
    )
    debug: bool = Field(default=True, description="Enable debug mode")

    # ===========================================
    # Model Configuration
    # ===========================================
    conversational_model: str = Field(
        default="Qwen/Qwen2.5-7B-Instruct",
        description="HuggingFace model ID for conversational AI"
    )
    media_verifier_model: str = Field(
        default="prithivMLmods/Deep-Fake-Detector-v2-Model",
        description="HuggingFace model ID for deepfake detection"
    )
    multimodal_model: str = Field(
        default="Qwen/Qwen2-VL-7B-Instruct",
        description="HuggingFace model ID for multimodal vision-language"
    )
    embedding_model: str = Field(
        default="sentence-transformers/all-MiniLM-L6-v2",
        description="HuggingFace model ID for embeddings (RAG)"
    )
    safety_model: str = Field(
        default="unitary/toxic-bert",
        description="Model for content safety classification"
    )
    models_dir: Path = Field(
        default=Path("./models"),
        description="Directory for downloaded models"
    )

    # Model Loading Options
    load_models: bool = Field(
        default=False,
        description="Whether to load actual models (false for mock mode)"
    )
    use_4bit_quantization: bool = Field(
        default=True,
        description="Use 4-bit quantization for reduced memory"
    )
    use_8bit_quantization: bool = Field(
        default=False,
        description="Use 8-bit quantization (alternative to 4-bit)"
    )
    use_flash_attention: bool = Field(
        default=True,
        description="Use Flash Attention 2 if available"
    )
    max_model_length: int = Field(
        default=4096,
        ge=512,
        le=32768,
        description="Maximum context length for models"
    )

    # Device Configuration
    device: Literal["auto", "cuda", "cpu", "mps"] = Field(
        default="auto",
        description="Device for model inference"
    )
    torch_dtype: Literal["float16", "bfloat16", "float32", "auto"] = Field(
        default="float16",
        description="PyTorch dtype for model weights"
    )
    gpu_memory_fraction: float = Field(
        default=0.9,
        ge=0.1,
        le=1.0,
        description="Fraction of GPU memory to use"
    )
    offload_to_cpu: bool = Field(
        default=False,
        description="Offload model layers to CPU when GPU memory is limited"
    )

    # ===========================================
    # LoRA Fine-tuning Configuration (PHASE 1)
    # ===========================================
    lora_r: int = Field(
        default=16,
        ge=4,
        le=128,
        description="LoRA attention dimension (rank)"
    )
    lora_alpha: int = Field(
        default=32,
        ge=8,
        le=256,
        description="LoRA alpha parameter"
    )
    lora_dropout: float = Field(
        default=0.05,
        ge=0.0,
        le=0.5,
        description="LoRA dropout probability"
    )
    training_batch_size: int = Field(
        default=4,
        ge=1,
        le=64,
        description="Training batch size"
    )
    training_epochs: int = Field(
        default=3,
        ge=1,
        le=100,
        description="Number of training epochs"
    )
    training_learning_rate: float = Field(
        default=2e-4,
        ge=1e-6,
        le=1e-2,
        description="Learning rate for training"
    )
    lora_adapters_dir: Path = Field(
        default=Path("./lora_adapters"),
        description="Directory for LoRA adapter checkpoints"
    )

    # ===========================================
    # Backend Integration
    # ===========================================
    backend_url: str = Field(
        default="http://localhost:4000",
        description="URL of the NestJS backend API"
    )
    backend_api_key: str | None = Field(
        default=None,
        description="API key for backend authentication (internal service)"
    )

    # ===========================================
    # JWT Configuration
    # ===========================================
    jwt_secret: str = Field(
        default="your-jwt-secret-here",
        description="JWT secret key (must match backend)"
    )
    jwt_algorithm: str = Field(
        default="HS256",
        description="JWT signing algorithm"
    )

    # ===========================================
    # Database Configuration (PHASE 2)
    # ===========================================
    database_url: str | None = Field(
        default=None,
        description="PostgreSQL connection URL"
    )
    database_pool_size: int = Field(
        default=5,
        ge=1,
        le=50,
        description="Database connection pool size"
    )
    database_max_overflow: int = Field(
        default=10,
        ge=0,
        le=50,
        description="Max overflow connections"
    )

    # ===========================================
    # Redis Configuration
    # ===========================================
    redis_url: str = Field(
        default="redis://localhost:6379",
        description="Redis connection URL"
    )
    redis_prefix: str = Field(
        default="fundbrave_ai:",
        description="Prefix for Redis keys"
    )
    cache_ttl_seconds: int = Field(
        default=3600,
        ge=60,
        description="Default cache TTL in seconds"
    )
    response_cache_ttl: int = Field(
        default=1800,
        ge=60,
        description="Cache TTL for AI responses"
    )

    # ===========================================
    # Rate Limiting
    # ===========================================
    rate_limit_enabled: bool = Field(
        default=True,
        description="Enable rate limiting"
    )
    rate_limit_chat: str = Field(
        default="10/minute",
        description="Rate limit for chat endpoint"
    )
    rate_limit_media: str = Field(
        default="5/minute",
        description="Rate limit for media verification endpoint"
    )
    rate_limit_training: str = Field(
        default="1/hour",
        description="Rate limit for training endpoint"
    )

    # ===========================================
    # HuggingFace Configuration
    # ===========================================
    hf_token: str | None = Field(
        default=None,
        description="HuggingFace API token for gated models"
    )

    # ===========================================
    # RAG Configuration (PHASE 2)
    # ===========================================
    chroma_persist_dir: Path = Field(
        default=Path("./data/chroma"),
        description="ChromaDB persistence directory"
    )
    chroma_collection_name: str = Field(
        default="fundbrave_knowledge",
        description="ChromaDB collection name"
    )
    rag_chunk_size: int = Field(
        default=512,
        ge=128,
        le=2048,
        description="Text chunk size for RAG indexing"
    )
    rag_chunk_overlap: int = Field(
        default=50,
        ge=0,
        le=256,
        description="Overlap between chunks"
    )
    rag_top_k: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Number of chunks to retrieve"
    )
    rag_similarity_threshold: float = Field(
        default=0.7,
        ge=0.0,
        le=1.0,
        description="Minimum similarity score for retrieval"
    )

    # ===========================================
    # Web Search Configuration (PHASE 2)
    # ===========================================
    serpapi_key: str | None = Field(
        default=None,
        description="SerpAPI key for web search"
    )
    search_results_limit: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Maximum search results to return"
    )
    enable_web_search: bool = Field(
        default=False,
        description="Enable web search integration"
    )

    # ===========================================
    # Multi-language Configuration (PHASE 2)
    # ===========================================
    default_language: str = Field(
        default="en",
        description="Default language code"
    )
    supported_languages: list[str] = Field(
        default=["en", "es", "fr", "de", "zh", "ja", "ko", "ar", "hi", "pt"],
        description="Supported language codes"
    )
    auto_detect_language: bool = Field(
        default=True,
        description="Auto-detect input language"
    )

    # ===========================================
    # Conversation Memory (PHASE 2)
    # ===========================================
    max_conversation_history: int = Field(
        default=10,
        ge=1,
        le=50,
        description="Maximum messages to keep in conversation history"
    )
    conversation_ttl_hours: int = Field(
        default=24,
        ge=1,
        le=168,
        description="Conversation TTL in hours"
    )
    persist_conversations: bool = Field(
        default=True,
        description="Persist conversations to database"
    )

    # ===========================================
    # Fraud Detection Configuration (PHASE 2)
    # ===========================================
    fraud_detection_enabled: bool = Field(
        default=True,
        description="Enable fraud detection"
    )
    fraud_similarity_threshold: float = Field(
        default=0.85,
        ge=0.5,
        le=1.0,
        description="Similarity threshold for duplicate detection"
    )
    fraud_min_campaigns_for_pattern: int = Field(
        default=3,
        ge=2,
        le=10,
        description="Minimum campaigns to establish a pattern"
    )

    # ===========================================
    # Content Moderation (PHASE 2)
    # ===========================================
    moderation_enabled: bool = Field(
        default=True,
        description="Enable auto-moderation"
    )
    toxicity_threshold: float = Field(
        default=0.7,
        ge=0.0,
        le=1.0,
        description="Toxicity score threshold for flagging"
    )
    profanity_filter_enabled: bool = Field(
        default=True,
        description="Enable profanity filtering"
    )

    # ===========================================
    # A/B Testing Configuration (PHASE 3)
    # ===========================================
    ab_testing_enabled: bool = Field(
        default=False,
        description="Enable A/B testing framework"
    )
    ab_test_default_variant: str = Field(
        default="control",
        description="Default A/B test variant"
    )
    ab_test_sample_rate: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="Percentage of traffic to include in tests"
    )

    # ===========================================
    # Safety Filters (PHASE 3)
    # ===========================================
    safety_enabled: bool = Field(
        default=True,
        description="Enable safety filters"
    )
    block_harmful_content: bool = Field(
        default=True,
        description="Block potentially harmful content"
    )
    safety_review_threshold: float = Field(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="Threshold for flagging content for review"
    )

    # ===========================================
    # Multi-Model Routing (PHASE 3)
    # ===========================================
    model_routing_enabled: bool = Field(
        default=False,
        description="Enable multi-model routing"
    )
    simple_query_model: str = Field(
        default="Qwen/Qwen2.5-1.5B-Instruct",
        description="Smaller model for simple queries"
    )
    complex_query_threshold: int = Field(
        default=50,
        ge=10,
        le=500,
        description="Token threshold for routing to larger model"
    )

    # ===========================================
    # Cost Monitoring (PHASE 1)
    # ===========================================
    cost_monitoring_enabled: bool = Field(
        default=True,
        description="Enable cost monitoring"
    )
    daily_token_budget: int = Field(
        default=1000000,
        ge=1000,
        description="Daily token budget"
    )
    alert_threshold_percentage: float = Field(
        default=0.8,
        ge=0.1,
        le=1.0,
        description="Alert when usage exceeds this percentage of budget"
    )

    # ===========================================
    # Analytics (PHASE 2)
    # ===========================================
    analytics_enabled: bool = Field(
        default=True,
        description="Enable analytics collection"
    )
    metrics_retention_days: int = Field(
        default=30,
        ge=1,
        le=365,
        description="Days to retain metrics data"
    )

    # ===========================================
    # Logging Configuration
    # ===========================================
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = Field(
        default="INFO",
        description="Logging level"
    )
    log_format: Literal["json", "text"] = Field(
        default="json",
        description="Log output format"
    )

    # ===========================================
    # CORS Configuration
    # ===========================================
    cors_origins: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:4000"],
        description="Allowed CORS origins"
    )
    cors_allow_credentials: bool = Field(
        default=True,
        description="Allow credentials in CORS requests"
    )

    # ===========================================
    # System Prompts
    # ===========================================
    default_system_prompt: str = Field(
        default=(
            "You are FundBrave AI, a helpful assistant for a decentralized "
            "fundraising platform. You help users create campaigns, donate to "
            "causes, understand blockchain transactions, and navigate the platform. "
            "Be friendly, clear, and helpful. When discussing donations or financial "
            "matters, encourage transparency and due diligence."
        ),
        description="Default system prompt for conversations"
    )
    campaign_suggestion_prompt: str = Field(
        default=(
            "Analyze this campaign and provide specific, actionable suggestions "
            "to improve its effectiveness. Consider: title, description, images, "
            "goal amount, and presentation."
        ),
        description="System prompt for campaign suggestions"
    )

    # ===========================================
    # Validators
    # ===========================================
    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | list[str]) -> list[str]:
        """Parse CORS origins from comma-separated string or list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @field_validator("supported_languages", mode="before")
    @classmethod
    def parse_supported_languages(cls, v: str | list[str]) -> list[str]:
        """Parse supported languages from comma-separated string or list."""
        if isinstance(v, str):
            return [lang.strip() for lang in v.split(",") if lang.strip()]
        return v

    @field_validator("models_dir", "lora_adapters_dir", "chroma_persist_dir", mode="before")
    @classmethod
    def parse_path(cls, v: str | Path) -> Path:
        """Convert string to Path and ensure it's a valid path."""
        return Path(v) if isinstance(v, str) else v

    # ===========================================
    # Properties
    # ===========================================
    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.environment == "development"

    def get_model_path(self, model_name: str) -> Path:
        """
        Get the local path for a model.

        Args:
            model_name: The model identifier (e.g., 'conversational', 'media_verifier')

        Returns:
            Path to the model directory
        """
        model_id_map = {
            "conversational": self.conversational_model,
            "media_verifier": self.media_verifier_model,
            "multimodal": self.multimodal_model,
            "embedding": self.embedding_model,
            "safety": self.safety_model,
            "simple": self.simple_query_model,
        }

        model_id = model_id_map.get(model_name, model_name)
        # Convert HuggingFace ID to filesystem-safe name
        safe_name = model_id.replace("/", "--")
        return self.models_dir / safe_name


@lru_cache
def get_settings() -> Settings:
    """
    Get cached application settings.

    Uses lru_cache to ensure settings are only loaded once.

    Returns:
        Settings instance with all configuration
    """
    return Settings()


# Convenience export
settings = get_settings()
