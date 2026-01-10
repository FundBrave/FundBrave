"""
Tests for LoRA Training Service.

Tests the training pipeline, dataset creation, and adapter management.
"""

import pytest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.training import (
    LoRATrainingService,
    TrainingConfig,
    TrainingExample,
    TrainingProgress,
    get_training_service,
)


class TestTrainingConfig:
    """Tests for TrainingConfig dataclass."""

    def test_default_config(self):
        """Test default configuration values."""
        config = TrainingConfig()

        assert config.num_epochs == 3
        assert config.learning_rate == 2e-4
        assert config.batch_size == 4
        assert config.max_seq_length == 2048
        assert config.lora_r == 16
        assert config.lora_alpha == 32
        assert config.lora_dropout == 0.05
        assert config.warmup_ratio == 0.1
        assert config.save_steps == 100
        assert config.use_4bit is True

    def test_custom_config(self):
        """Test custom configuration values."""
        config = TrainingConfig(
            num_epochs=5,
            learning_rate=1e-4,
            batch_size=8,
            lora_r=32,
        )

        assert config.num_epochs == 5
        assert config.learning_rate == 1e-4
        assert config.batch_size == 8
        assert config.lora_r == 32


class TestTrainingExample:
    """Tests for TrainingExample dataclass."""

    def test_basic_example(self):
        """Test basic training example creation."""
        example = TrainingExample(
            instruction="What is FundBrave?",
            output="FundBrave is a decentralized fundraising platform.",
        )

        assert example.instruction == "What is FundBrave?"
        assert example.output == "FundBrave is a decentralized fundraising platform."
        assert example.input_text == ""
        assert example.system_prompt is None

    def test_full_example(self):
        """Test training example with all fields."""
        example = TrainingExample(
            instruction="Translate to Spanish",
            input_text="Hello, world!",
            output="Hola, mundo!",
            system_prompt="You are a translator.",
        )

        assert example.instruction == "Translate to Spanish"
        assert example.input_text == "Hello, world!"
        assert example.output == "Hola, mundo!"
        assert example.system_prompt == "You are a translator."


class TestLoRATrainingService:
    """Tests for LoRATrainingService."""

    @pytest.fixture
    def service(self):
        """Create a training service for testing."""
        return LoRATrainingService()

    def test_service_initialization(self, service):
        """Test service initializes correctly."""
        assert service is not None
        assert service._is_training is False
        assert service._training_jobs == {}

    def test_create_fundbrave_training_data(self, service):
        """Test FundBrave training data creation."""
        examples = service.create_fundbrave_training_data()

        assert len(examples) > 0
        assert all(isinstance(ex, TrainingExample) for ex in examples)

        # Check for expected content
        instructions = [ex.instruction.lower() for ex in examples]
        assert any("fundbrave" in inst for inst in instructions)

    @pytest.mark.asyncio
    async def test_create_training_dataset(self, service, tmp_path):
        """Test training dataset file creation."""
        examples = [
            TrainingExample(
                instruction="Test instruction",
                output="Test output",
            ),
            TrainingExample(
                instruction="Another instruction",
                input_text="With input",
                output="Another output",
            ),
        ]

        output_path = tmp_path / "test_dataset.jsonl"
        count = await service.create_training_dataset(examples, output_path)

        assert count == 2
        assert output_path.exists()

        # Verify file content
        with open(output_path) as f:
            lines = f.readlines()
        assert len(lines) == 2

    @pytest.mark.asyncio
    async def test_start_training_mock_mode(self, service, tmp_path):
        """Test training in mock mode."""
        # Create a test dataset
        dataset_path = tmp_path / "train.jsonl"
        examples = service.create_fundbrave_training_data()[:5]
        await service.create_training_dataset(examples, dataset_path)

        job_id = "test_job_001"
        progress_updates = []

        async for progress in service.start_training(
            job_id=job_id,
            dataset_path=dataset_path,
            config=TrainingConfig(num_epochs=1),
        ):
            progress_updates.append(progress)

        # Should have received progress updates
        assert len(progress_updates) > 0

        # Final progress should be completed
        final = progress_updates[-1]
        assert final.status == "completed"
        assert final.progress_percent == 100.0

    @pytest.mark.asyncio
    async def test_load_adapter_mock(self, service):
        """Test adapter loading in mock mode."""
        # Non-existent adapter should return False
        result = await service.load_adapter(Path("/nonexistent/adapter"))
        assert result is False

    @pytest.mark.asyncio
    async def test_unload_adapter_mock(self, service):
        """Test adapter unloading in mock mode."""
        result = await service.unload_adapter()
        # Should return False when no adapter is loaded
        assert result is False


class TestTrainingServiceSingleton:
    """Test singleton pattern for training service."""

    def test_get_training_service_singleton(self):
        """Test that get_training_service returns singleton."""
        service1 = get_training_service()
        service2 = get_training_service()

        assert service1 is service2


class TestTrainingProgress:
    """Tests for TrainingProgress dataclass."""

    def test_progress_calculation(self):
        """Test progress percentage calculation."""
        progress = TrainingProgress(
            job_id="test",
            status="running",
            current_step=50,
            total_steps=100,
            current_epoch=1,
            total_epochs=2,
            loss=0.5,
            learning_rate=2e-4,
            progress_percent=50.0,
            eta_seconds=120.0,
            message="Training...",
        )

        assert progress.progress_percent == 50.0
        assert progress.current_step == 50
        assert progress.total_steps == 100
