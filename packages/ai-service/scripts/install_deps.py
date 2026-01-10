#!/usr/bin/env python
"""
Smart dependency installer for FundBrave AI Service.

Installs dependencies in batches to avoid memory issues and timeouts.
Run this instead of `pip install -r requirements.txt` for more reliable installation.
"""

import subprocess
import sys
from pathlib import Path

# Dependency groups (in order of installation)
DEPENDENCY_GROUPS = [
    # Group 1: Core web framework
    {
        "name": "Web Framework",
        "packages": [
            "fastapi>=0.109.0",
            "uvicorn[standard]>=0.27.0",
            "python-multipart>=0.0.6",
            "starlette>=0.35.1",
        ]
    },

    # Group 2: Data validation and utilities
    {
        "name": "Data & Validation",
        "packages": [
            "pydantic>=2.5.3",
            "pydantic-settings>=2.1.0",
            "python-dotenv>=1.0.0",
            "tenacity>=8.2.3",
            "orjson>=3.9.12",
        ]
    },

    # Group 3: HTTP clients and caching
    {
        "name": "HTTP & Caching",
        "packages": [
            "httpx>=0.26.0",
            "aiohttp>=3.9.3",
            "redis>=5.0.1",
        ]
    },

    # Group 4: Database
    {
        "name": "Database",
        "packages": [
            "psycopg2-binary>=2.9.9",
            "asyncpg>=0.29.0",
            "sqlalchemy>=2.0.25",
            "alembic>=1.13.1",
        ]
    },

    # Group 5: Auth and rate limiting
    {
        "name": "Auth & Security",
        "packages": [
            "python-jose[cryptography]>=3.3.0",
            "passlib[bcrypt]>=1.7.4",
            "slowapi>=0.1.9",
        ]
    },

    # Group 6: Logging and monitoring
    {
        "name": "Logging & Monitoring",
        "packages": [
            "loguru>=0.7.2",
            "prometheus-client>=0.19.0",
            "prometheus-fastapi-instrumentator>=6.1.0",
        ]
    },

    # Group 7: ML Core (LARGE - takes time)
    {
        "name": "ML Core",
        "packages": [
            "torch>=2.2.0",
            "transformers>=4.37.2",
            "accelerate>=0.26.1",
            "safetensors>=0.4.2",
        ]
    },

    # Group 8: Quantization (requires torch)
    {
        "name": "Quantization",
        "packages": [
            "bitsandbytes>=0.42.0",
        ]
    },

    # Group 9: Fine-tuning
    {
        "name": "Fine-tuning",
        "packages": [
            "peft>=0.8.2",
            "trl>=0.7.10",
            "datasets>=2.16.1",
        ]
    },

    # Group 10: Vision
    {
        "name": "Vision",
        "packages": [
            "pillow>=10.2.0",
            "timm>=0.9.12",
            "opencv-python-headless>=4.9.0",
            "av>=11.0.0",
            "qwen-vl-utils>=0.0.8",
        ]
    },

    # Group 11: RAG & Vector DB (LARGE)
    {
        "name": "RAG & Vector DB",
        "packages": [
            "chromadb>=0.4.22",
            "sentence-transformers>=2.3.1",
            "faiss-cpu>=1.7.4",
        ]
    },

    # Group 12: LangChain
    {
        "name": "LangChain",
        "packages": [
            "langchain>=0.1.6",
            "langchain-community>=0.0.16",
            "langchain-huggingface>=0.0.1",
        ]
    },

    # Group 13: Web Search
    {
        "name": "Web Search",
        "packages": [
            "serpapi>=0.1.5",
            "google-search-results>=2.4.2",
            "duckduckgo-search>=4.4.3",
        ]
    },

    # Group 14: Analytics
    {
        "name": "Analytics",
        "packages": [
            "numpy>=1.26.3",
            "scipy>=1.12.0",
            "pandas>=2.2.0",
        ]
    },

    # Group 15: Safety & Moderation
    {
        "name": "Safety & Moderation",
        "packages": [
            "detoxify>=0.5.2",
            "profanity-check>=1.0.3",
        ]
    },

    # Group 16: Multi-language
    {
        "name": "Multi-language",
        "packages": [
            "langdetect>=1.0.9",
            "deep-translator>=1.11.4",
        ]
    },

    # Group 17: Utilities
    {
        "name": "Utilities",
        "packages": [
            "apscheduler>=3.10.4",
            "aiofiles>=23.2.1",
            "huggingface-hub>=0.20.3",
        ]
    },

    # Group 18: Testing (dev)
    {
        "name": "Testing",
        "packages": [
            "pytest>=7.4.4",
            "pytest-asyncio>=0.23.3",
            "pytest-cov>=4.1.0",
            "pytest-mock>=3.12.0",
            "factory-boy>=3.3.0",
            "faker>=22.5.1",
            "responses>=0.24.1",
            "aioresponses>=0.7.6",
        ]
    },

    # Group 19: Type checking (dev)
    {
        "name": "Type Checking",
        "packages": [
            "mypy>=1.8.0",
            "types-redis>=4.6.0.20240106",
        ]
    },
]


def install_group(group_name: str, packages: list[str]) -> bool:
    """Install a group of packages."""
    print(f"\n{'='*60}")
    print(f"Installing: {group_name}")
    print(f"{'='*60}")

    for package in packages:
        print(f"  • {package}")

    try:
        # Install packages one by one to avoid timeout issues
        for package in packages:
            print(f"\n→ Installing {package}...")
            result = subprocess.run(
                [sys.executable, "-m", "pip", "install", package],
                capture_output=True,
                text=True,
                timeout=600  # 10 minute timeout per package
            )

            if result.returncode != 0:
                print(f"  ⚠️  Warning: {package} failed to install")
                print(f"  Error: {result.stderr[:200]}")
                # Continue with other packages
            else:
                print(f"  ✅ {package} installed")

        return True

    except subprocess.TimeoutExpired:
        print(f"  ❌ Timeout installing {group_name}")
        return False
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False


def main():
    """Main installation function."""
    print("=" * 60)
    print("FundBrave AI Service - Smart Dependency Installer")
    print("=" * 60)
    print("\nThis will install dependencies in batches to avoid issues.")
    print("Installation may take 20-30 minutes.\n")

    # Check Python version
    if sys.version_info < (3, 10):
        print("❌ Python 3.10+ required")
        return 1

    if sys.version_info >= (3, 13):
        print("⚠️  Warning: Python 3.13 detected. Some packages may have issues.")
        print("   Recommended: Python 3.10 or 3.11")

    print(f"✓ Python {sys.version_info.major}.{sys.version_info.minor}")
    print()

    # Upgrade pip first
    print("Upgrading pip...")
    subprocess.run([sys.executable, "-m", "pip", "install", "--upgrade", "pip"])
    print()

    # Install groups
    total_groups = len(DEPENDENCY_GROUPS)
    successful = 0
    failed = []

    for i, group in enumerate(DEPENDENCY_GROUPS, 1):
        print(f"\n[{i}/{total_groups}] Processing {group['name']}...")

        if install_group(group['name'], group['packages']):
            successful += 1
        else:
            failed.append(group['name'])

    # Summary
    print("\n" + "=" * 60)
    print("Installation Summary")
    print("=" * 60)
    print(f"✅ Successful: {successful}/{total_groups}")

    if failed:
        print(f"❌ Failed: {len(failed)}")
        for name in failed:
            print(f"   - {name}")
        print("\nYou can retry failed groups manually with:")
        print("   pip install <package-name>")
    else:
        print("\n🎉 All dependencies installed successfully!")
        print("\nNext steps:")
        print("  1. Configure .env: cp .env.example .env")
        print("  2. Run tests: python scripts/quick_test.py")
        print("  3. Start service: uvicorn app.main:app --reload")

    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main())
