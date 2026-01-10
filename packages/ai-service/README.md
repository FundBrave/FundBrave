# FundBrave AI Service

AI-powered microservice for the FundBrave decentralized fundraising platform. Provides conversational AI, media verification, RAG-enhanced responses, campaign recommendations, fraud detection, content moderation, and comprehensive analytics.

## Features

### Core Features
- **Conversational AI**: Powered by Qwen2.5-7B-Instruct for user assistance and platform questions
- **Media Verification**: Deep-Fake-Detector-v2 for detecting manipulated/deepfake images (92%+ accuracy)
- **Multimodal Analysis**: Qwen2-VL-7B-Instruct for understanding images with text context
- **Rate Limiting**: Per-user rate limits to prevent abuse
- **Caching**: Redis-based conversation and response caching
- **Mock Mode**: Development without GPU/models loaded

### Phase 1 Features (Infrastructure)
- **LoRA Fine-tuning**: Custom model training for FundBrave-specific responses
- **Training Pipeline**: Complete training workflow with progress tracking
- **Cost Monitoring**: Token usage tracking and budget management
- **Optimization Reports**: Recommendations for cost reduction

### Phase 2 Features (Advanced)
- **RAG System**: ChromaDB-powered retrieval augmented generation
- **Web Search**: Real-time information via DuckDuckGo/SerpAPI
- **Recommendations**: Personalized campaign recommendations using embeddings
- **Multi-language**: Support for 100+ languages via Qwen's multilingual capabilities
- **Conversation Memory**: PostgreSQL-backed persistent conversations
- **Fraud Detection**: AI-powered campaign fraud analysis
- **Content Moderation**: Toxicity detection and content policy enforcement
- **Analytics**: Campaign insights and platform-wide analytics

### Phase 3 Features (Optimization)
- **A/B Testing**: Statistical experiment framework for AI features
- **Safety Filters**: Prompt injection and jailbreak prevention
- **Model Routing**: Intelligent query routing for cost optimization
- **Advanced Quantization**: 4-bit/8-bit model compression

## Tech Stack

- **Framework**: FastAPI 0.109+
- **ML**: PyTorch, HuggingFace Transformers, PEFT/LoRA, BitsAndBytes
- **Vector DB**: ChromaDB for RAG
- **Cache**: Redis
- **Database**: PostgreSQL (for conversation memory)
- **Auth**: JWT (compatible with NestJS backend)

## Quick Start

### Prerequisites

- Python 3.10+
- Redis (optional, falls back to in-memory cache)
- PostgreSQL (optional, for conversation memory)
- NVIDIA GPU with 16GB+ VRAM (optional, for model inference)

### Installation

```bash
# Navigate to ai-service directory
cd packages/ai-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment configuration
cp .env.example .env
```

### Configuration

Edit `.env` file with your settings:

```env
# Development mode (no GPU required)
LOAD_MODELS=false
ENVIRONMENT=development

# Production mode (requires GPU)
LOAD_MODELS=true
USE_4BIT_QUANTIZATION=true
DEVICE=cuda

# Backend integration
BACKEND_URL=http://localhost:4000
JWT_SECRET=your-backend-jwt-secret

# Redis (optional)
REDIS_URL=redis://localhost:6379

# PostgreSQL (for conversation memory)
DATABASE_URL=postgresql://user:password@localhost:5432/fundbrave

# Feature flags
SAFETY_ENABLED=true
AB_TESTING_ENABLED=true
MODEL_ROUTING_ENABLED=true
RAG_ENABLED=true
```

### Running the Service

#### Development Mode (Mock Models)

```bash
# Without models - uses mock responses
LOAD_MODELS=false uvicorn app.main:app --reload --port 8001
```

#### Production Mode (Real Models)

```bash
# Download models first
python scripts/download_models.py

# Run with models
LOAD_MODELS=true uvicorn app.main:app --port 8001
```

#### Docker

```bash
# CPU mode (mock)
docker-compose up ai-service

# GPU mode (requires nvidia-docker)
docker-compose --profile gpu up ai-service-gpu
```

## API Endpoints

### Health Check

```bash
# Basic health
GET /api/health

# Detailed readiness (includes model status)
GET /api/health/ready

# System metrics
GET /api/health/metrics
```

### Chat

```bash
# Send a message
POST /api/chat
Content-Type: application/json
Authorization: Bearer <jwt_token>  # Optional

{
  "message": "How do I create a fundraiser?",
  "campaign_id": "uuid",           // Optional: for context
  "conversation_id": "uuid",        // Optional: continue conversation
  "stream": false                   // Optional: enable streaming
}

# Response
{
  "response": "To create a fundraiser on FundBrave...",
  "confidence": 0.95,
  "sources": [],
  "conversation_id": "uuid",
  "tokens_used": 150
}
```

### Media Verification

```bash
# Verify single image
POST /api/verify-media
Content-Type: multipart/form-data

file: <image_file>
campaign_id: uuid  # Optional

# Response
{
  "is_authentic": true,
  "confidence": 0.94,
  "requires_review": false,
  "analysis": "Image appears authentic. No deepfake markers detected.",
  "details": {
    "model_version": "v2",
    "processing_time": 0.5,
    "real_probability": 0.94,
    "fake_probability": 0.06
  }
}
```

### RAG (Retrieval Augmented Generation)

```bash
# Query with RAG enhancement
POST /api/advanced/rag/query
Content-Type: application/json

{
  "query": "What are the campaign guidelines?",
  "top_k": 5
}

# Response
{
  "query": "What are the campaign guidelines?",
  "response": "According to FundBrave's guidelines...",
  "sources": [
    {"document_id": "doc_001", "content": "...", "score": 0.95}
  ],
  "confidence": 0.88
}

# Index documents
POST /api/advanced/rag/index
{
  "documents": [
    {"id": "doc_001", "content": "...", "metadata": {}}
  ]
}
```

### Recommendations

```bash
# Get personalized recommendations
POST /api/advanced/recommendations
{
  "user_id": "user123",
  "campaigns": [...],
  "limit": 10
}

# Get similar campaigns
POST /api/advanced/recommendations/similar
{
  "campaign_id": "camp_001",
  "all_campaigns": [...],
  "limit": 5
}

# Get trending campaigns
POST /api/advanced/recommendations/trending
{
  "campaigns": [...],
  "limit": 10
}
```

### Fraud Detection

```bash
# Analyze campaign for fraud
POST /api/advanced/fraud/analyze
{
  "campaign_id": "camp_001",
  "name": "Test Campaign",
  "description": "...",
  "creator_id": "user123",
  "goal_amount": 10000.0,
  "category": "education"
}

# Response
{
  "campaign_id": "camp_001",
  "is_suspicious": false,
  "risk_score": 0.15,
  "indicators": [],
  "recommendations": []
}
```

### Content Moderation

```bash
# Moderate content
POST /api/advanced/moderate
{
  "content": "Comment text...",
  "content_type": "comment",
  "content_id": "comment_001"
}

# Moderate entire campaign
POST /api/advanced/moderate/campaign
{
  "campaign_id": "camp_001",
  "name": "Campaign Name",
  "description": "Campaign description..."
}
```

### Safety Checks

```bash
# Check input/output safety
POST /api/advanced/safety/check
{
  "content": "User message...",
  "check_type": "input"  // or "output"
}

# Response
{
  "is_safe": true,
  "action": "allow",
  "violations": [],
  "overall_risk_score": 0.05
}
```

### A/B Testing

```bash
# Create experiment
POST /api/experiments/create
{
  "experiment_id": "response_length_test",
  "name": "Response Length A/B Test",
  "description": "Test if shorter responses improve engagement",
  "variants": [
    {"name": "control", "weight": 0.5, "config": {"max_tokens": 256}},
    {"name": "longer", "weight": 0.5, "config": {"max_tokens": 512}}
  ],
  "target_sample_size": 1000
}

# Get variant for user
POST /api/experiments/variant
{
  "experiment_id": "response_length_test",
  "user_id": "user123"
}

# Record conversion
POST /api/experiments/conversion
{
  "experiment_id": "response_length_test",
  "user_id": "user123",
  "value": 1.0
}

# Get results
GET /api/experiments/response_length_test/results
```

### Training (LoRA Fine-tuning)

```bash
# Start training job
POST /api/training/start
{
  "dataset_path": "/path/to/dataset.jsonl",
  "config": {
    "num_epochs": 3,
    "learning_rate": 0.0002,
    "batch_size": 4
  }
}

# Check training status
GET /api/training/status/{job_id}

# List adapters
GET /api/training/adapters

# Activate adapter
POST /api/training/adapters/{adapter_name}/activate
```

### Analytics

```bash
# Campaign analytics
GET /api/advanced/analytics/campaign/{campaign_id}

# Platform analytics
GET /api/advanced/analytics/platform

# Usage summary
GET /api/advanced/usage/summary

# Optimization recommendations
GET /api/advanced/usage/optimization
```

### Translation

```bash
# Translate text
POST /api/advanced/translate
{
  "text": "Hello, welcome to FundBrave!",
  "target_language": "es"
}

# Get supported languages
GET /api/advanced/languages
```

## Models

| Model | Use Case | Size | Quantization |
|-------|----------|------|--------------|
| Qwen/Qwen2.5-7B-Instruct | Conversational AI | ~14GB | 4-bit |
| Qwen/Qwen2.5-1.5B-Instruct | Simple queries | ~3GB | 4-bit |
| Qwen/Qwen2.5-14B-Instruct | Complex queries | ~28GB | 4-bit |
| prithivMLmods/Deep-Fake-Detector-v2-Model | Deepfake Detection | ~1GB | None |
| Qwen/Qwen2-VL-7B-Instruct | Multimodal Vision | ~16GB | 4-bit |
| sentence-transformers/all-MiniLM-L6-v2 | Embeddings (RAG) | ~90MB | None |

### Downloading Models

```bash
# Download all models
python scripts/download_models.py

# Download specific model
python scripts/download_models.py --models conversational

# List available models
python scripts/download_models.py --list
```

## Development

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_chat.py -v

# Run async tests
pytest tests/test_ab_testing.py -v

# Run API tests
pytest tests/test_api_advanced.py -v
```

### Code Structure

```
packages/ai-service/
├── app/
│   ├── api/              # FastAPI routers
│   │   ├── chat.py       # Chat endpoints
│   │   ├── media.py      # Media verification
│   │   ├── health.py     # Health checks
│   │   ├── advanced.py   # RAG, recommendations, analytics
│   │   ├── training.py   # LoRA training endpoints
│   │   └── experiments.py # A/B testing endpoints
│   ├── models/           # ML model wrappers
│   │   ├── base.py       # Base model class
│   │   ├── conversational.py
│   │   ├── media_verifier.py
│   │   └── multimodal.py
│   ├── services/         # Business logic
│   │   ├── database.py   # Backend API client
│   │   ├── cache.py      # Redis caching
│   │   ├── training.py   # LoRA training
│   │   ├── cost_monitor.py # Usage tracking
│   │   ├── rag.py        # RAG service
│   │   ├── web_search.py # Web search
│   │   ├── recommendations.py # Campaign recommendations
│   │   ├── language.py   # Multi-language support
│   │   ├── memory.py     # Conversation memory
│   │   ├── fraud_detection.py # Fraud detection
│   │   ├── moderation.py # Content moderation
│   │   ├── analytics.py  # Analytics service
│   │   ├── ab_testing.py # A/B testing framework
│   │   ├── safety.py     # Safety filters
│   │   └── model_router.py # Multi-model routing
│   ├── utils/            # Utilities
│   │   ├── auth.py       # JWT verification
│   │   ├── rate_limit.py # Rate limiting
│   │   └── logging.py    # Logging config
│   ├── config.py         # Settings
│   └── main.py           # FastAPI app
├── scripts/
│   ├── download_models.py
│   └── test_models.py
├── tests/
│   ├── test_training.py
│   ├── test_cost_monitor.py
│   ├── test_rag.py
│   ├── test_recommendations.py
│   ├── test_moderation.py
│   ├── test_safety.py
│   ├── test_ab_testing.py
│   ├── test_model_router.py
│   └── test_api_advanced.py
├── data/                 # Data files (gitignored)
│   └── chroma/          # ChromaDB persistence
├── models/               # Downloaded models (gitignored)
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_HOST` | API host | 0.0.0.0 |
| `API_PORT` | API port | 8001 |
| `ENVIRONMENT` | development/staging/production | development |
| `LOAD_MODELS` | Load actual models | false |
| `USE_4BIT_QUANTIZATION` | Use 4-bit quantization | true |
| `DEVICE` | auto/cuda/cpu/mps | auto |
| `BACKEND_URL` | NestJS backend URL | http://localhost:4000 |
| `JWT_SECRET` | JWT secret (match backend) | - |
| `REDIS_URL` | Redis connection URL | redis://localhost:6379 |
| `DATABASE_URL` | PostgreSQL URL | - |
| `HF_TOKEN` | HuggingFace token | - |
| `SAFETY_ENABLED` | Enable safety filters | true |
| `AB_TESTING_ENABLED` | Enable A/B testing | false |
| `MODEL_ROUTING_ENABLED` | Enable model routing | false |
| `RAG_ENABLED` | Enable RAG | true |
| `DAILY_BUDGET` | Daily cost budget (USD) | 10.0 |
| `RATE_LIMIT_CHAT` | Chat rate limit | 10/minute |
| `RATE_LIMIT_MEDIA` | Media verification limit | 5/minute |

## Rate Limits

- Chat: 10 requests/minute per user
- Media Verification: 5 requests/minute per user
- Batch Verification: 2 requests/minute per user
- Training: 2 jobs/hour
- A/B Testing: 1000 variant requests/minute

## Integration with Frontend

The AI service integrates with the Next.js frontend:

```typescript
// Example: Chat with AI
const response = await fetch('http://localhost:8001/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    message: 'How do I create a campaign?',
    campaign_id: campaignId,
  }),
});

const data = await response.json();
console.log(data.response);

// Example: Get recommendations
const recommendations = await fetch('http://localhost:8001/api/advanced/recommendations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    user_id: userId,
    campaigns: campaigns,
    limit: 10,
  }),
});
```

## Integration with Backend

The AI service connects to the NestJS backend at `BACKEND_URL`:

```python
# Campaign data is fetched from backend
async def get_campaign(campaign_id: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.backend_url}/api/campaigns/{campaign_id}",
            headers={"Authorization": f"Bearer {internal_token}"}
        )
        return response.json()
```

## License

MIT License - see LICENSE file for details.
