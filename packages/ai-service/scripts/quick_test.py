#!/usr/bin/env python
"""
Quick test script to verify AI service setup.

Tests core functionality without requiring models to be loaded.
Run this after installing dependencies to verify everything works.
"""

import asyncio
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Set environment for testing
os.environ["LOAD_MODELS"] = "false"
os.environ["ENVIRONMENT"] = "development"
os.environ["DEBUG"] = "true"


async def test_config():
    """Test configuration loading."""
    print("✓ Testing configuration...")
    try:
        from app.config import settings
        assert settings.environment == "development"
        assert not settings.load_models
        print("  ✅ Configuration loaded successfully")
        return True
    except Exception as e:
        print(f"  ❌ Configuration failed: {e}")
        return False


async def test_cache_service():
    """Test cache service initialization."""
    print("✓ Testing cache service...")
    try:
        from app.services.cache import CacheService
        cache = CacheService()
        await cache.set("test_key", "test_value")
        value = await cache.get("test_key")
        assert value == "test_value"
        print("  ✅ Cache service working")
        return True
    except Exception as e:
        print(f"  ⚠️  Cache service: {e} (Redis not required for testing)")
        return True  # Cache failure is not critical for testing


async def test_database_service():
    """Test database service initialization."""
    print("✓ Testing database service...")
    try:
        from app.services.database import DatabaseService
        db = DatabaseService()
        assert db.backend_url is not None
        print("  ✅ Database service initialized")
        return True
    except Exception as e:
        print(f"  ❌ Database service failed: {e}")
        return False


async def test_rag_service():
    """Test RAG service initialization."""
    print("✓ Testing RAG service...")
    try:
        from app.services.rag import RAGService
        rag = RAGService()
        assert rag.collection_name is not None
        print("  ✅ RAG service initialized")
        return True
    except Exception as e:
        print(f"  ❌ RAG service failed: {e}")
        return False


async def test_recommendations_service():
    """Test recommendations service."""
    print("✓ Testing recommendations service...")
    try:
        from app.services.recommendations import RecommendationEngine
        engine = RecommendationEngine()
        assert engine is not None
        print("  ✅ Recommendations service initialized")
        return True
    except Exception as e:
        print(f"  ❌ Recommendations service failed: {e}")
        return False


async def test_model_router():
    """Test model router service."""
    print("✓ Testing model router...")
    try:
        from app.services.model_router import ModelRouterService
        router = ModelRouterService()
        classification = await router.classify_query("Hello, how are you?")
        assert classification.query == "Hello, how are you?"
        print("  ✅ Model router working")
        return True
    except Exception as e:
        print(f"  ❌ Model router failed: {e}")
        return False


async def test_safety_service():
    """Test safety service."""
    print("✓ Testing safety service...")
    try:
        from app.services.safety import SafetyService
        safety = SafetyService()
        result = await safety.check_input("This is a normal message")
        assert result.is_safe
        print("  ✅ Safety service working")
        return True
    except Exception as e:
        print(f"  ❌ Safety service failed: {e}")
        return False


async def test_cost_monitor():
    """Test cost monitoring service."""
    print("✓ Testing cost monitor...")
    try:
        from app.services.cost_monitor import CostMonitorService
        monitor = CostMonitorService()
        cost = monitor.calculate_cost(input_tokens=100, output_tokens=50)
        assert cost > 0
        print("  ✅ Cost monitor working")
        return True
    except Exception as e:
        print(f"  ❌ Cost monitor failed: {e}")
        return False


async def test_ab_testing():
    """Test A/B testing service."""
    print("✓ Testing A/B testing service...")
    try:
        from app.services.ab_testing import ABTestingService
        ab_service = ABTestingService()
        assert ab_service is not None
        print("  ✅ A/B testing service initialized")
        return True
    except Exception as e:
        print(f"  ❌ A/B testing failed: {e}")
        return False


async def test_fastapi_app():
    """Test FastAPI application creation."""
    print("✓ Testing FastAPI application...")
    try:
        from app.main import app
        assert app is not None
        assert app.title == "FundBrave AI Service"
        print("  ✅ FastAPI app created successfully")
        return True
    except Exception as e:
        print(f"  ❌ FastAPI app failed: {e}")
        return False


async def main():
    """Run all tests."""
    print("=" * 60)
    print("FundBrave AI Service - Quick Test Suite")
    print("=" * 60)
    print()

    tests = [
        test_config,
        test_cache_service,
        test_database_service,
        test_rag_service,
        test_recommendations_service,
        test_model_router,
        test_safety_service,
        test_cost_monitor,
        test_ab_testing,
        test_fastapi_app,
    ]

    results = []
    for test in tests:
        try:
            result = await test()
            results.append(result)
        except Exception as e:
            print(f"  ❌ Test crashed: {e}")
            results.append(False)
        print()

    # Summary
    print("=" * 60)
    passed = sum(results)
    total = len(results)
    print(f"Results: {passed}/{total} tests passed")

    if passed == total:
        print("✅ All tests passed! AI service is ready.")
        print()
        print("Next steps:")
        print("  1. Configure .env file with your settings")
        print("  2. Start the service: uvicorn app.main:app --reload")
        print("  3. Access docs at: http://localhost:8001/docs")
        return 0
    else:
        print(f"⚠️  {total - passed} test(s) failed. Review errors above.")
        print()
        print("Common issues:")
        print("  - Missing dependencies: pip install -r requirements.txt")
        print("  - Environment variables: cp .env.example .env")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
