# FundBrave AI Service - Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will help you quickly set up and test the AI service.

---

## Prerequisites

- Python 3.10+ (recommended: 3.10 or 3.11, not 3.13 due to some package limitations)
- Redis (optional for caching, will work without it)
- PostgreSQL (optional, connects via backend)

---

## Step 1: Install Dependencies

```bash
cd packages/ai-service

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Note**: Installation may take 10-15 minutes due to large ML packages (PyTorch, Transformers).

---

## Step 2: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env file with your settings
# For testing, you can use the defaults
```

**Key settings for testing:**
```env
# Development mode (no GPU required)
LOAD_MODELS=false
ENVIRONMENT=development
DEBUG=true

# Backend connection (update if needed)
BACKEND_URL=http://localhost:4000
JWT_SECRET=your-jwt-secret-here

# Redis (optional - will use in-memory cache if not available)
REDIS_URL=redis://localhost:6379
```

---

## Step 3: Run Quick Test

```bash
# Test that everything is set up correctly
python scripts/quick_test.py
```

This will verify:
- ✅ Configuration loading
- ✅ Services initialization
- ✅ FastAPI app creation

---

## Step 4: Start the Service

```bash
# Start in development mode (mock models, no GPU required)
LOAD_MODELS=false uvicorn app.main:app --reload --port 8001
```

The service will be available at:
- **API**: http://localhost:8001
- **Docs**: http://localhost:8001/docs (Swagger UI)
- **ReDoc**: http://localhost:8001/redoc

---

## Step 5: Test the API

### Health Check
```bash
curl http://localhost:8001/api/health
```

### Chat (Mock Mode)
```bash
curl -X POST http://localhost:8001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I create a fundraiser?",
    "stream": false
  }'
```

### Verify Media (Mock Mode)
```bash
curl -X POST http://localhost:8001/api/verify-media \
  -F "file=@test_image.jpg"
```

### Get Recommendations
```bash
curl -X POST http://localhost:8001/api/advanced/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "recommendation_type": "trending",
    "limit": 5
  }'
```

---

## Running with Real Models (Production)

### Prerequisites for Real Models
- **GPU**: NVIDIA GPU with 16GB+ VRAM
- **CUDA**: CUDA 11.8+ installed
- **Storage**: 50GB+ free space for models

### Download Models
```bash
# Download all required models (will take time and ~30GB storage)
python scripts/download_models.py

# Or download specific model
python scripts/download_models.py --models conversational
```

### Start with Models
```bash
LOAD_MODELS=true uvicorn app.main:app --port 8001
```

**Note**: First startup with models will take 2-3 minutes to load into GPU memory.

---

## Running Tests

### Unit Tests
```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html

# Run specific test file
pytest tests/test_chat.py -v
```

### Integration Tests
```bash
# Test with real backend (requires backend running on port 4000)
pytest tests/test_api_advanced.py -v
```

---

## Docker Deployment

### Development Mode
```bash
# Build and run with Docker Compose
docker-compose up ai-service
```

### Production Mode (GPU)
```bash
# Requires nvidia-docker
docker-compose --profile gpu up ai-service-gpu
```

### With Full Stack
```bash
# Start AI service + Redis + PostgreSQL
docker-compose up ai-service redis postgres
```

---

## Common Use Cases

### 1. Chat with Campaign Context

```python
import requests

response = requests.post(
    "http://localhost:8001/api/chat",
    json={
        "message": "Tell me about this campaign",
        "campaign_id": "uuid-here",
        "conversation_id": None,  # Will create new conversation
    },
    headers={"Authorization": f"Bearer {jwt_token}"}
)

data = response.json()
print(data["response"])
print(f"Conversation ID: {data['conversation_id']}")
```

### 2. Verify Media for Deepfakes

```python
import requests

with open("campaign_image.jpg", "rb") as f:
    response = requests.post(
        "http://localhost:8001/api/verify-media",
        files={"file": f},
        data={"campaign_id": "uuid-here"}
    )

data = response.json()
print(f"Authentic: {data['is_authentic']}")
print(f"Confidence: {data['confidence']}")
```

### 3. Get Personalized Recommendations

```python
import requests

response = requests.post(
    "http://localhost:8001/api/advanced/recommendations",
    json={
        "user_id": "uuid-here",
        "recommendation_type": "personalized",
        "limit": 10
    },
    headers={"Authorization": f"Bearer {jwt_token}"}
)

data = response.json()
for rec in data["recommendations"]:
    print(f"- {rec['name']}: {rec['score']}")
```

### 4. Check Campaign for Fraud

```python
import requests

response = requests.post(
    "http://localhost:8001/api/advanced/fraud-check",
    json={
        "campaign_id": "uuid-here",
        "name": "Save the Rainforest",
        "description": "Help us protect...",
        "creator_id": "user-uuid",
        "goal_amount": 10000,
        "category": "environment"
    },
    headers={"Authorization": f"Bearer {jwt_token}"}
)

data = response.json()
print(f"Risk Score: {data['risk_score']}")
print(f"Is Suspicious: {data['is_suspicious']}")
```

### 5. RAG Query (Knowledge Base)

```python
import requests

response = requests.post(
    "http://localhost:8001/api/advanced/rag",
    json={
        "query": "How does staking work on FundBrave?",
        "top_k": 5
    }
)

data = response.json()
print(data["answer"])
print("\nSources:")
for source in data["sources"]:
    print(f"- {source['metadata'].get('title', 'Document')}")
```

---

## Troubleshooting

### Issue: Dependencies Won't Install
**Solution**:
```bash
# Use Python 3.10 or 3.11 (not 3.13)
python --version

# Try installing with --no-cache-dir
pip install -r requirements.txt --no-cache-dir
```

### Issue: "No module named 'fastapi'"
**Solution**: Dependencies not installed. Run `pip install -r requirements.txt`

### Issue: Redis Connection Failed
**Solution**: Redis is optional. Service will work with in-memory cache.
```bash
# To disable Redis errors, comment out REDIS_URL in .env
# or install Redis: https://redis.io/docs/getting-started/
```

### Issue: Backend Connection Failed
**Solution**: Update BACKEND_URL in .env or start NestJS backend:
```bash
# In backend directory
npm run start:dev
```

### Issue: Models Won't Load
**Solution**:
```bash
# Ensure you have enough GPU memory
nvidia-smi

# Try 8-bit quantization instead of 4-bit
USE_8BIT_QUANTIZATION=true USE_4BIT_QUANTIZATION=false

# Or use CPU (very slow)
DEVICE=cpu
```

---

## Configuration Tips

### For Development
```env
LOAD_MODELS=false          # Fast startup, mock responses
DEBUG=true                  # Detailed logs, API docs enabled
ENVIRONMENT=development     # Development settings
```

### For Testing
```env
LOAD_MODELS=false
RAG_ENABLED=true
WEB_SEARCH_ENABLED=false   # Avoid external API calls
MODERATION_ENABLED=true
```

### For Production
```env
LOAD_MODELS=true
USE_4BIT_QUANTIZATION=true # Memory optimization
DEBUG=false                # Hide API docs
ENVIRONMENT=production
RATE_LIMIT_ENABLED=true    # Enable rate limiting
SAFETY_ENABLED=true        # Enable safety filters
```

---

## Performance Tips

1. **Use 4-bit Quantization**: Reduces memory by 50-70%
   ```env
   USE_4BIT_QUANTIZATION=true
   ```

2. **Enable Flash Attention**: 2-3x faster inference
   ```env
   USE_FLASH_ATTENTION=true
   ```

3. **Enable Redis Caching**: 80-90% cache hit rate
   ```env
   REDIS_URL=redis://localhost:6379
   ```

4. **Model Routing**: Use smaller models for simple queries
   ```env
   MODEL_ROUTING_ENABLED=true
   COMPLEX_QUERY_THRESHOLD=0.6
   ```

5. **Batch Processing**: For media verification
   ```bash
   # Use /api/verify-media/batch endpoint
   ```

---

## Next Steps

1. **Explore API Docs**: http://localhost:8001/docs
2. **Run Full Test Suite**: `pytest tests/ -v`
3. **Connect Frontend**: Update frontend to call AI service
4. **Fine-tune Model**: Use `/api/training/start` endpoint
5. **Monitor Costs**: Check `/api/health/metrics` endpoint
6. **Set up A/B Tests**: Use `/api/experiments` endpoints

---

## Resources

- **Full Documentation**: See `README.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **Configuration**: See `.env.example`
- **API Reference**: http://localhost:8001/docs (when running)

---

## Support

For issues or questions:
1. Check `IMPLEMENTATION_SUMMARY.md` for detailed info
2. Review logs in `logs/ai-service.log`
3. Run `python scripts/quick_test.py` to diagnose issues
4. Check health endpoint: http://localhost:8001/api/health

---

**🎉 You're ready to go! Happy coding!**
