#!/usr/bin/env python3
"""
Model Testing Script for FundBrave AI Service.

Tests that models can be loaded and perform basic inference.
Use this to verify your setup before running the full service.

Usage:
    python scripts/test_models.py [--model conversational|media|multimodal|all]
"""

import argparse
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))


async def test_conversational_model():
    """Test the conversational AI model."""
    print("\n" + "=" * 60)
    print("Testing Conversational Model (Qwen2.5-7B-Instruct)")
    print("=" * 60)

    try:
        from app.models.conversational import get_conversational_model

        model = get_conversational_model()
        print(f"Model ID: {model.model_id}")
        print(f"Device: {model.device}")

        # Test loading
        print("\nLoading model...")
        await model.load()
        print(f"Model ready: {model.is_ready}")

        # Test generation
        print("\nTesting generation...")
        result = await model.generate_response(
            "How do I create a fundraising campaign?",
            max_new_tokens=100,
        )

        print(f"\nResponse: {result.response[:200]}...")
        print(f"Confidence: {result.confidence:.2%}")
        print(f"Tokens used: {result.tokens_used}")
        print(f"Finish reason: {result.finish_reason}")

        # Test streaming
        print("\nTesting streaming generation...")
        response_chunks = []
        async for chunk in model.generate_stream(
            "What is blockchain?",
            max_new_tokens=50,
        ):
            response_chunks.append(chunk)
            print(chunk, end="", flush=True)
        print("\n")

        # Unload
        print("Unloading model...")
        await model.unload()

        print("Conversational model test PASSED")
        return True

    except Exception as e:
        print(f"Conversational model test FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_media_verifier_model():
    """Test the media verifier model."""
    print("\n" + "=" * 60)
    print("Testing Media Verifier Model (Deep-Fake-Detector-v2)")
    print("=" * 60)

    try:
        from app.models.media_verifier import get_media_verifier_model
        from PIL import Image
        import io

        model = get_media_verifier_model()
        print(f"Model ID: {model.model_id}")
        print(f"Device: {model.device}")

        # Test loading
        print("\nLoading model...")
        await model.load()
        print(f"Model ready: {model.is_ready}")

        # Create a test image
        print("\nCreating test image...")
        test_image = Image.new("RGB", (224, 224), color="red")
        img_bytes = io.BytesIO()
        test_image.save(img_bytes, format="PNG")
        img_bytes.seek(0)

        # Test verification
        print("Testing image verification...")
        result = await model.verify_image(img_bytes.getvalue())

        print(f"\nIs authentic: {result.is_authentic}")
        print(f"Confidence: {result.confidence:.2%}")
        print(f"Requires review: {result.requires_review}")
        print(f"Analysis: {result.analysis}")
        print(f"Details: {result.details}")

        # Unload
        print("\nUnloading model...")
        await model.unload()

        print("Media verifier model test PASSED")
        return True

    except Exception as e:
        print(f"Media verifier model test FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_multimodal_model():
    """Test the multimodal vision-language model."""
    print("\n" + "=" * 60)
    print("Testing Multimodal Model (Qwen2-VL-7B-Instruct)")
    print("=" * 60)

    try:
        from app.models.multimodal import get_multimodal_model
        from PIL import Image
        import io

        model = get_multimodal_model()
        print(f"Model ID: {model.model_id}")
        print(f"Device: {model.device}")

        # Test loading
        print("\nLoading model...")
        await model.load()
        print(f"Model ready: {model.is_ready}")

        # Create a test image
        print("\nCreating test image...")
        test_image = Image.new("RGB", (224, 224), color="blue")
        img_bytes = io.BytesIO()
        test_image.save(img_bytes, format="PNG")
        img_bytes.seek(0)

        # Test analysis
        print("Testing image analysis...")
        response = await model.analyze_image(
            img_bytes.getvalue(),
            "What color is this image?",
            max_new_tokens=50,
        )

        print(f"\nResponse: {response}")

        # Test campaign image analysis
        print("\nTesting campaign image analysis...")
        img_bytes.seek(0)
        result = await model.analyze_campaign_image(
            img_bytes.getvalue(),
            campaign_name="Test Campaign",
        )

        print(f"Description: {result.description}")
        print(f"Is appropriate: {result.is_appropriate}")
        print(f"Tags: {result.tags}")

        # Unload
        print("\nUnloading model...")
        await model.unload()

        print("Multimodal model test PASSED")
        return True

    except Exception as e:
        print(f"Multimodal model test FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Test FundBrave AI models")
    parser.add_argument(
        "--model",
        choices=["conversational", "media", "multimodal", "all"],
        default="all",
        help="Model to test (default: all)",
    )
    parser.add_argument(
        "--mock",
        action="store_true",
        help="Test mock mode (without loading actual models)",
    )

    args = parser.parse_args()

    print("FundBrave AI Service - Model Tester")
    print("=" * 60)

    # Check environment
    import torch
    print(f"\nPyTorch version: {torch.__version__}")
    print(f"CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"CUDA device: {torch.cuda.get_device_name(0)}")
        print(
            f"CUDA memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB"
        )

    # Set mock mode if requested
    if args.mock:
        import os
        os.environ["LOAD_MODELS"] = "false"
        print("\nRunning in mock mode (models will not be loaded)")

    results = {}

    if args.model in ["conversational", "all"]:
        results["conversational"] = await test_conversational_model()

    if args.model in ["media", "all"]:
        results["media"] = await test_media_verifier_model()

    if args.model in ["multimodal", "all"]:
        results["multimodal"] = await test_multimodal_model()

    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)

    all_passed = True
    for model, passed in results.items():
        status = "PASSED" if passed else "FAILED"
        print(f"{model}: {status}")
        if not passed:
            all_passed = False

    if all_passed:
        print("\nAll tests passed!")
        sys.exit(0)
    else:
        print("\nSome tests failed. Check the output above for details.")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
