#!/usr/bin/env python3
"""
Model Download Script for FundBrave AI Service.

Downloads the required AI models from HuggingFace Hub:
- Qwen/Qwen2.5-7B-Instruct (Conversational AI)
- prithivMLmods/Deep-Fake-Detector-v2-Model (Deepfake Detection)
- Qwen/Qwen2-VL-7B-Instruct (Multimodal Vision-Language)

Usage:
    python scripts/download_models.py [--models all|conversational|media|multimodal]

Note: These models are large (7B+ parameters). Ensure you have:
    - Sufficient disk space (~30GB total)
    - Good internet connection
    - HuggingFace token for gated models (optional)
"""

import argparse
import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from huggingface_hub import snapshot_download, login
    from tqdm import tqdm
except ImportError:
    print("Error: Required packages not installed.")
    print("Run: pip install huggingface_hub tqdm")
    sys.exit(1)


# Model configurations
MODELS = {
    "conversational": {
        "id": "Qwen/Qwen2.5-7B-Instruct",
        "description": "Conversational AI model for chat and assistance",
        "size": "~14GB",
        "files": None,  # Download all files
    },
    "media": {
        "id": "prithivMLmods/Deep-Fake-Detector-v2-Model",
        "description": "Deepfake detection model for media verification",
        "size": "~1GB",
        "files": None,
    },
    "multimodal": {
        "id": "Qwen/Qwen2-VL-7B-Instruct",
        "description": "Multimodal vision-language model",
        "size": "~16GB",
        "files": None,
    },
}


def setup_hf_token():
    """Setup HuggingFace token if available."""
    token = os.environ.get("HF_TOKEN")

    if token:
        print("Using HuggingFace token from environment...")
        login(token=token)
        return True

    # Try to load from .env file
    env_file = Path(__file__).parent.parent / ".env"
    if env_file.exists():
        with open(env_file) as f:
            for line in f:
                if line.startswith("HF_TOKEN="):
                    token = line.split("=", 1)[1].strip()
                    if token and token != "":
                        print("Using HuggingFace token from .env file...")
                        login(token=token)
                        return True

    print("No HuggingFace token found. Some models may require authentication.")
    print("Set HF_TOKEN environment variable or add to .env file if needed.")
    return False


def get_models_dir() -> Path:
    """Get the models directory path."""
    models_dir = Path(__file__).parent.parent / "models"
    models_dir.mkdir(exist_ok=True)
    return models_dir


def download_model(model_key: str, models_dir: Path) -> bool:
    """
    Download a specific model.

    Args:
        model_key: Key from MODELS dict (conversational, media, multimodal)
        models_dir: Directory to save models

    Returns:
        True if successful, False otherwise
    """
    if model_key not in MODELS:
        print(f"Unknown model: {model_key}")
        return False

    config = MODELS[model_key]
    model_id = config["id"]
    description = config["description"]
    size = config["size"]

    # Create safe directory name from model ID
    safe_name = model_id.replace("/", "--")
    local_dir = models_dir / safe_name

    print(f"\n{'=' * 60}")
    print(f"Downloading: {model_id}")
    print(f"Description: {description}")
    print(f"Estimated size: {size}")
    print(f"Target directory: {local_dir}")
    print(f"{'=' * 60}\n")

    try:
        snapshot_download(
            repo_id=model_id,
            local_dir=local_dir,
            local_dir_use_symlinks=False,
            resume_download=True,
            allow_patterns=config.get("files"),
        )
        print(f"\nSuccessfully downloaded {model_id}")
        return True

    except Exception as e:
        print(f"\nError downloading {model_id}: {e}")
        return False


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Download AI models for FundBrave AI Service",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python download_models.py                    # Download all models
    python download_models.py --models media     # Download only deepfake detector
    python download_models.py --models conversational multimodal
    python download_models.py --list             # List available models
        """,
    )

    parser.add_argument(
        "--models",
        nargs="+",
        choices=["all", "conversational", "media", "multimodal"],
        default=["all"],
        help="Models to download (default: all)",
    )

    parser.add_argument(
        "--list",
        action="store_true",
        help="List available models and exit",
    )

    parser.add_argument(
        "--dir",
        type=Path,
        default=None,
        help="Custom directory for models (default: ./models)",
    )

    args = parser.parse_args()

    # List models
    if args.list:
        print("\nAvailable Models:")
        print("-" * 60)
        for key, config in MODELS.items():
            print(f"\n{key}:")
            print(f"  ID: {config['id']}")
            print(f"  Description: {config['description']}")
            print(f"  Size: {config['size']}")
        print()
        return

    # Setup
    print("FundBrave AI Service - Model Downloader")
    print("=" * 60)

    setup_hf_token()

    models_dir = args.dir or get_models_dir()
    models_dir.mkdir(parents=True, exist_ok=True)
    print(f"\nModels directory: {models_dir}")

    # Determine which models to download
    if "all" in args.models:
        models_to_download = list(MODELS.keys())
    else:
        models_to_download = args.models

    print(f"Models to download: {', '.join(models_to_download)}")

    # Calculate total size
    total_size = sum(
        int(MODELS[m]["size"].replace("~", "").replace("GB", ""))
        for m in models_to_download
    )
    print(f"Estimated total download size: ~{total_size}GB")

    # Confirm
    response = input("\nProceed with download? [y/N]: ")
    if response.lower() != "y":
        print("Download cancelled.")
        return

    # Download models
    success = []
    failed = []

    for model_key in models_to_download:
        if download_model(model_key, models_dir):
            success.append(model_key)
        else:
            failed.append(model_key)

    # Summary
    print("\n" + "=" * 60)
    print("Download Summary")
    print("=" * 60)

    if success:
        print(f"\nSuccessful: {', '.join(success)}")

    if failed:
        print(f"\nFailed: {', '.join(failed)}")

    if success and not failed:
        print("\nAll models downloaded successfully!")
        print(f"\nModels are stored in: {models_dir}")
        print("\nNext steps:")
        print("1. Set LOAD_MODELS=true in your .env file")
        print("2. Set MODELS_DIR to the models directory path")
        print("3. Restart the AI service")
    elif failed:
        print("\nSome downloads failed. Check the error messages above.")
        print("You may need to:")
        print("1. Set HF_TOKEN for gated models")
        print("2. Check your internet connection")
        print("3. Ensure sufficient disk space")


if __name__ == "__main__":
    main()
