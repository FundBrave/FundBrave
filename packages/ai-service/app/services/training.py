"""
LoRA Fine-tuning Service for FundBrave AI.

Provides capabilities to fine-tune Qwen2.5-7B model with LoRA adapters
for FundBrave-specific knowledge (FAQs, guidelines, campaign patterns).
"""

import asyncio
import json
import os
import shutil
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, AsyncIterator

from loguru import logger

from app.config import settings


@dataclass
class TrainingConfig:
    """Configuration for a training run."""

    # LoRA parameters
    lora_r: int = 16
    lora_alpha: int = 32
    lora_dropout: float = 0.05
    target_modules: list[str] = field(
        default_factory=lambda: ["q_proj", "k_proj", "v_proj", "o_proj"]
    )

    # Training parameters
    batch_size: int = 4
    gradient_accumulation_steps: int = 4
    num_epochs: int = 3
    learning_rate: float = 2e-4
    warmup_ratio: float = 0.03
    max_seq_length: int = 2048

    # Optimization
    use_gradient_checkpointing: bool = True
    use_flash_attention: bool = True
    fp16: bool = True
    bf16: bool = False

    # Logging
    logging_steps: int = 10
    save_steps: int = 100
    eval_steps: int = 100

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "lora_r": self.lora_r,
            "lora_alpha": self.lora_alpha,
            "lora_dropout": self.lora_dropout,
            "target_modules": self.target_modules,
            "batch_size": self.batch_size,
            "gradient_accumulation_steps": self.gradient_accumulation_steps,
            "num_epochs": self.num_epochs,
            "learning_rate": self.learning_rate,
            "warmup_ratio": self.warmup_ratio,
            "max_seq_length": self.max_seq_length,
            "use_gradient_checkpointing": self.use_gradient_checkpointing,
            "use_flash_attention": self.use_flash_attention,
            "fp16": self.fp16,
            "bf16": self.bf16,
        }


@dataclass
class TrainingExample:
    """A single training example."""

    instruction: str
    input: str = ""
    output: str = ""
    category: str = "general"

    def to_prompt(self) -> str:
        """Convert to prompt format."""
        if self.input:
            return (
                f"### Instruction:\n{self.instruction}\n\n"
                f"### Input:\n{self.input}\n\n"
                f"### Response:\n{self.output}"
            )
        return f"### Instruction:\n{self.instruction}\n\n### Response:\n{self.output}"


@dataclass
class TrainingProgress:
    """Training progress tracking."""

    job_id: str
    status: str  # 'pending', 'preparing', 'training', 'completed', 'failed'
    current_epoch: int = 0
    total_epochs: int = 0
    current_step: int = 0
    total_steps: int = 0
    loss: float = 0.0
    learning_rate: float = 0.0
    elapsed_seconds: int = 0
    error: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None

    @property
    def progress_percentage(self) -> float:
        """Calculate progress percentage."""
        if self.total_steps == 0:
            return 0.0
        return (self.current_step / self.total_steps) * 100


@dataclass
class TrainingResult:
    """Result of a training run."""

    job_id: str
    success: bool
    adapter_path: str | None
    final_loss: float
    total_steps: int
    training_time_seconds: int
    config: dict
    error: str | None = None


class LoRATrainingService:
    """
    Service for fine-tuning models with LoRA adapters.

    Supports:
    - Training Qwen2.5-7B on FundBrave-specific data
    - Incremental training with existing adapters
    - Progress tracking and streaming updates
    - Checkpoint management
    """

    def __init__(self):
        """Initialize the training service."""
        self.adapters_dir = settings.lora_adapters_dir
        self.adapters_dir.mkdir(parents=True, exist_ok=True)

        self._active_jobs: dict[str, TrainingProgress] = {}
        self._model = None
        self._tokenizer = None

    async def prepare_training_data(
        self,
        examples: list[TrainingExample],
        output_path: Path,
    ) -> Path:
        """
        Prepare training data from examples.

        Args:
            examples: List of training examples
            output_path: Path to save processed data

        Returns:
            Path to the prepared dataset
        """
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Convert examples to JSONL format
        with open(output_path, "w", encoding="utf-8") as f:
            for example in examples:
                data = {
                    "instruction": example.instruction,
                    "input": example.input,
                    "output": example.output,
                    "category": example.category,
                }
                f.write(json.dumps(data, ensure_ascii=False) + "\n")

        logger.info(f"Prepared {len(examples)} training examples at {output_path}")
        return output_path

    async def create_fundbrave_dataset(self) -> list[TrainingExample]:
        """
        Create the default FundBrave training dataset.

        Returns:
            List of training examples for FundBrave-specific knowledge
        """
        examples = [
            # Platform FAQs
            TrainingExample(
                instruction="What is FundBrave?",
                output=(
                    "FundBrave is a decentralized fundraising platform built on blockchain technology. "
                    "It enables transparent, secure crowdfunding where all donations and fund "
                    "distributions are recorded on-chain. Key features include:\n\n"
                    "1. Smart contract-based fund management\n"
                    "2. Transparent donation tracking\n"
                    "3. AI-powered campaign verification\n"
                    "4. Low platform fees\n"
                    "5. Global accessibility"
                ),
                category="faq",
            ),
            TrainingExample(
                instruction="How do I create a fundraising campaign on FundBrave?",
                output=(
                    "To create a fundraising campaign on FundBrave:\n\n"
                    "1. Connect your Web3 wallet (MetaMask, WalletConnect, etc.)\n"
                    "2. Click 'Create Campaign' in the navigation\n"
                    "3. Fill in your campaign details:\n"
                    "   - Campaign title and description\n"
                    "   - Funding goal amount\n"
                    "   - Campaign duration\n"
                    "   - Category selection\n"
                    "4. Upload supporting images (verified by our AI)\n"
                    "5. Review and submit your campaign\n"
                    "6. Confirm the transaction in your wallet\n\n"
                    "Your campaign will be live once the transaction is confirmed!"
                ),
                category="guide",
            ),
            TrainingExample(
                instruction="How do donations work on FundBrave?",
                output=(
                    "Donations on FundBrave are processed through smart contracts:\n\n"
                    "1. Select a campaign you want to support\n"
                    "2. Enter your donation amount\n"
                    "3. Choose your preferred cryptocurrency\n"
                    "4. Confirm the transaction in your wallet\n"
                    "5. Receive an on-chain receipt\n\n"
                    "Benefits of blockchain-based donations:\n"
                    "- Instant, global transfers\n"
                    "- Full transparency (track where funds go)\n"
                    "- Lower fees than traditional platforms\n"
                    "- Permanent, verifiable records"
                ),
                category="guide",
            ),
            TrainingExample(
                instruction="What cryptocurrencies can I use to donate?",
                output=(
                    "FundBrave supports multiple cryptocurrencies for donations:\n\n"
                    "Primary:\n"
                    "- ETH (Ethereum)\n"
                    "- USDC (USD Coin)\n"
                    "- USDT (Tether)\n\n"
                    "Additional supported tokens:\n"
                    "- DAI\n"
                    "- WETH\n\n"
                    "We're continuously adding support for more tokens. "
                    "All transactions are processed on the Ethereum network "
                    "(with Layer 2 support for lower fees)."
                ),
                category="faq",
            ),
            TrainingExample(
                instruction="How does FundBrave verify campaign authenticity?",
                output=(
                    "FundBrave uses multiple verification methods:\n\n"
                    "1. AI Image Verification: Our deepfake detection model (92%+ accuracy) "
                    "scans all campaign images for manipulation.\n\n"
                    "2. Text Analysis: AI reviews campaign descriptions for fraud patterns.\n\n"
                    "3. Creator Verification: Optional identity verification for higher trust.\n\n"
                    "4. Community Reporting: Users can flag suspicious campaigns.\n\n"
                    "5. Smart Contract Audits: All fund movements are transparent on-chain.\n\n"
                    "Campaigns flagged by our AI are reviewed before going live."
                ),
                category="faq",
            ),
            TrainingExample(
                instruction="What are the platform fees on FundBrave?",
                output=(
                    "FundBrave has minimal, transparent fees:\n\n"
                    "- Platform fee: 2.5% of funds raised\n"
                    "- Payment processing: 0% (blockchain native)\n"
                    "- Withdrawal fee: Gas costs only\n\n"
                    "Compare to traditional platforms:\n"
                    "- GoFundMe: 2.9% + $0.30 per transaction\n"
                    "- Kickstarter: 5% + payment fees\n\n"
                    "Our fees go toward platform maintenance, AI services, "
                    "and continuous improvement."
                ),
                category="faq",
            ),
            TrainingExample(
                instruction="How do I withdraw funds from my campaign?",
                output=(
                    "To withdraw funds from your campaign:\n\n"
                    "1. Go to your Campaign Dashboard\n"
                    "2. Click 'Withdraw Funds'\n"
                    "3. Enter the amount to withdraw\n"
                    "4. Confirm the transaction in your wallet\n\n"
                    "Important notes:\n"
                    "- Partial withdrawals are allowed\n"
                    "- Funds go directly to your connected wallet\n"
                    "- All withdrawals are recorded on-chain\n"
                    "- No waiting period for verified creators"
                ),
                category="guide",
            ),
            TrainingExample(
                instruction="Can I edit my campaign after it's live?",
                output=(
                    "Yes, you can edit certain aspects of your campaign:\n\n"
                    "Editable:\n"
                    "- Campaign description and updates\n"
                    "- Additional images\n"
                    "- Campaign story/timeline\n"
                    "- FAQs and responses\n\n"
                    "Not editable:\n"
                    "- Funding goal (to maintain transparency)\n"
                    "- Campaign title\n"
                    "- Wallet address\n\n"
                    "Major changes may require campaign resubmission."
                ),
                category="faq",
            ),
            TrainingExample(
                instruction="What happens if a campaign doesn't reach its goal?",
                output=(
                    "FundBrave uses an 'All-or-Something' model:\n\n"
                    "- Campaigns keep whatever they raise\n"
                    "- No deadline pressure for withdrawals\n"
                    "- Donors are informed of final amounts\n\n"
                    "This differs from 'All-or-Nothing' platforms where "
                    "campaigns must reach their goal. We believe every "
                    "contribution helps, and partial funding can still "
                    "make a meaningful impact."
                ),
                category="faq",
            ),
            TrainingExample(
                instruction="How do I report a suspicious campaign?",
                output=(
                    "To report a suspicious campaign:\n\n"
                    "1. Go to the campaign page\n"
                    "2. Click the 'Report' button (flag icon)\n"
                    "3. Select the reason for reporting:\n"
                    "   - Fraudulent/fake campaign\n"
                    "   - Misleading information\n"
                    "   - Inappropriate content\n"
                    "   - Other concerns\n"
                    "4. Add details about your concern\n"
                    "5. Submit the report\n\n"
                    "Our team reviews all reports within 24 hours. "
                    "Campaigns may be paused pending investigation."
                ),
                category="guide",
            ),
            # Blockchain-specific
            TrainingExample(
                instruction="What is a smart contract and how does FundBrave use it?",
                output=(
                    "A smart contract is self-executing code on the blockchain.\n\n"
                    "FundBrave uses smart contracts for:\n\n"
                    "1. Campaign Creation: Each campaign has a unique contract "
                    "that manages its funds.\n\n"
                    "2. Donations: Funds are sent directly to campaign contracts, "
                    "not to FundBrave.\n\n"
                    "3. Withdrawals: Campaign creators can withdraw through the "
                    "contract with full transparency.\n\n"
                    "4. Escrow (optional): Milestone-based fund release for "
                    "larger campaigns.\n\n"
                    "Benefits: Trustless, transparent, and immutable records."
                ),
                category="education",
            ),
            TrainingExample(
                instruction="What wallet do I need to use FundBrave?",
                output=(
                    "FundBrave supports most Ethereum-compatible wallets:\n\n"
                    "Recommended:\n"
                    "- MetaMask (browser extension & mobile)\n"
                    "- WalletConnect (works with many wallets)\n"
                    "- Coinbase Wallet\n"
                    "- Rainbow Wallet\n\n"
                    "Requirements:\n"
                    "- Ethereum mainnet support\n"
                    "- Ability to sign transactions\n"
                    "- Some ETH for gas fees\n\n"
                    "New to crypto? We recommend starting with MetaMask, "
                    "which has excellent guides for beginners."
                ),
                category="guide",
            ),
            TrainingExample(
                instruction="How do I connect my wallet to FundBrave?",
                output=(
                    "To connect your wallet:\n\n"
                    "1. Click 'Connect Wallet' in the top right\n"
                    "2. Choose your wallet provider:\n"
                    "   - MetaMask\n"
                    "   - WalletConnect\n"
                    "   - Coinbase Wallet\n"
                    "3. Approve the connection in your wallet\n"
                    "4. Sign the authentication message\n\n"
                    "Security notes:\n"
                    "- We never ask for your seed phrase\n"
                    "- The signature is for authentication only\n"
                    "- No tokens are transferred during connection"
                ),
                category="guide",
            ),
            # Campaign best practices
            TrainingExample(
                instruction="What makes a successful fundraising campaign?",
                output=(
                    "Key elements of successful campaigns:\n\n"
                    "1. Compelling Story: Share why this cause matters.\n"
                    "2. Clear Goal: Specific, achievable funding target.\n"
                    "3. Transparency: Explain how funds will be used.\n"
                    "4. Quality Images: Authentic, high-resolution photos.\n"
                    "5. Regular Updates: Keep donors informed.\n"
                    "6. Social Proof: Share early donor testimonials.\n"
                    "7. Shareable Content: Make it easy to spread.\n\n"
                    "Pro tip: Campaigns with video content raise 4x more on average!"
                ),
                category="best_practice",
            ),
            TrainingExample(
                instruction="How should I write my campaign description?",
                output=(
                    "Effective campaign description structure:\n\n"
                    "1. Hook (2-3 sentences): Capture attention immediately.\n\n"
                    "2. The Story: Share the background and need.\n"
                    "   - Who is affected?\n"
                    "   - What's the current situation?\n"
                    "   - Why is this urgent?\n\n"
                    "3. The Solution: What will donations achieve?\n\n"
                    "4. Fund Breakdown: How money will be used.\n"
                    "   - Be specific and transparent\n\n"
                    "5. Call to Action: Direct ask for support.\n\n"
                    "Keep it personal, authentic, and update regularly!"
                ),
                category="best_practice",
            ),
            # Technical help
            TrainingExample(
                instruction="My transaction is stuck, what should I do?",
                output=(
                    "If your transaction is stuck (pending for >10 minutes):\n\n"
                    "1. Check gas price: Network may be congested.\n"
                    "   - Visit etherscan.io/gastracker\n\n"
                    "2. Speed up transaction (MetaMask):\n"
                    "   - Click pending transaction\n"
                    "   - Select 'Speed Up'\n"
                    "   - Increase gas fee\n\n"
                    "3. Cancel and retry:\n"
                    "   - Send 0 ETH to yourself with same nonce\n"
                    "   - Higher gas fee than original\n\n"
                    "4. Wait: During high congestion, patience helps.\n\n"
                    "Still stuck? Contact support with your transaction hash."
                ),
                category="support",
            ),
            TrainingExample(
                instruction="I accidentally sent funds to the wrong address",
                output=(
                    "Unfortunately, blockchain transactions are irreversible.\n\n"
                    "If you sent to a wrong address:\n\n"
                    "1. If it's another user's wallet:\n"
                    "   - Try to contact them through blockchain explorers\n"
                    "   - Some addresses have ENS names that might help\n\n"
                    "2. If it's an invalid/burn address:\n"
                    "   - The funds are likely unrecoverable\n\n"
                    "Prevention tips:\n"
                    "- Always double-check addresses\n"
                    "- Send a small test amount first\n"
                    "- Use address book features\n"
                    "- Verify the last 4-6 characters\n\n"
                    "This is why FundBrave shows address confirmations before every transaction."
                ),
                category="support",
            ),
        ]

        logger.info(f"Created default FundBrave dataset with {len(examples)} examples")
        return examples

    async def start_training(
        self,
        job_id: str,
        dataset_path: Path,
        config: TrainingConfig | None = None,
        base_adapter_path: Path | None = None,
    ) -> AsyncIterator[TrainingProgress]:
        """
        Start a LoRA training job.

        Args:
            job_id: Unique job identifier
            dataset_path: Path to training data (JSONL format)
            config: Training configuration
            base_adapter_path: Optional path to existing adapter for continued training

        Yields:
            TrainingProgress updates
        """
        config = config or TrainingConfig(
            lora_r=settings.lora_r,
            lora_alpha=settings.lora_alpha,
            lora_dropout=settings.lora_dropout,
            batch_size=settings.training_batch_size,
            num_epochs=settings.training_epochs,
            learning_rate=settings.training_learning_rate,
        )

        progress = TrainingProgress(
            job_id=job_id,
            status="preparing",
            total_epochs=config.num_epochs,
            started_at=datetime.utcnow(),
        )
        self._active_jobs[job_id] = progress
        yield progress

        try:
            # Check if we're in mock mode
            if not settings.load_models:
                logger.info("Mock mode: Simulating training progress")
                async for mock_progress in self._mock_training(job_id, config):
                    yield mock_progress
                return

            # Real training (requires GPU)
            async for real_progress in self._run_training(
                job_id, dataset_path, config, base_adapter_path
            ):
                yield real_progress

        except Exception as e:
            logger.error(f"Training failed for job {job_id}: {e}")
            progress.status = "failed"
            progress.error = str(e)
            yield progress

    async def _mock_training(
        self, job_id: str, config: TrainingConfig
    ) -> AsyncIterator[TrainingProgress]:
        """Simulate training for testing without GPU."""
        import random

        progress = self._active_jobs[job_id]
        total_steps = 100  # Simulated
        progress.total_steps = total_steps

        for epoch in range(config.num_epochs):
            progress.current_epoch = epoch + 1
            progress.status = "training"

            for step in range(total_steps // config.num_epochs):
                await asyncio.sleep(0.1)  # Simulate work

                progress.current_step += 1
                progress.loss = max(0.1, 2.0 - (progress.current_step / total_steps) * 1.8 + random.uniform(-0.1, 0.1))
                progress.learning_rate = config.learning_rate
                progress.elapsed_seconds = int(
                    (datetime.utcnow() - progress.started_at).total_seconds()
                )

                yield progress

        # Complete
        progress.status = "completed"
        progress.completed_at = datetime.utcnow()

        # Create mock adapter directory
        adapter_path = self.adapters_dir / f"adapter_{job_id}"
        adapter_path.mkdir(parents=True, exist_ok=True)
        (adapter_path / "adapter_config.json").write_text(
            json.dumps(config.to_dict(), indent=2)
        )
        (adapter_path / "mock_adapter.bin").write_bytes(b"mock")

        yield progress

    async def _run_training(
        self,
        job_id: str,
        dataset_path: Path,
        config: TrainingConfig,
        base_adapter_path: Path | None = None,
    ) -> AsyncIterator[TrainingProgress]:
        """
        Run actual LoRA training with PEFT.

        Args:
            job_id: Unique job identifier
            dataset_path: Path to training data
            config: Training configuration
            base_adapter_path: Optional path to existing adapter
        """
        # Lazy imports for heavy ML libraries
        import torch
        from datasets import load_dataset
        from peft import LoraConfig, TaskType, get_peft_model
        from transformers import (
            AutoModelForCausalLM,
            AutoTokenizer,
            TrainingArguments,
            Trainer,
            DataCollatorForSeq2Seq,
        )

        progress = self._active_jobs[job_id]
        progress.status = "preparing"
        yield progress

        # Load tokenizer
        logger.info(f"Loading tokenizer for {settings.conversational_model}")
        tokenizer = AutoTokenizer.from_pretrained(
            settings.conversational_model,
            trust_remote_code=True,
            token=settings.hf_token,
        )
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token

        # Load base model
        logger.info(f"Loading base model {settings.conversational_model}")
        model = AutoModelForCausalLM.from_pretrained(
            settings.conversational_model,
            torch_dtype=torch.float16,
            device_map="auto",
            trust_remote_code=True,
            token=settings.hf_token,
        )

        # Configure LoRA
        lora_config = LoraConfig(
            task_type=TaskType.CAUSAL_LM,
            r=config.lora_r,
            lora_alpha=config.lora_alpha,
            lora_dropout=config.lora_dropout,
            target_modules=config.target_modules,
            bias="none",
        )

        # Apply LoRA
        if base_adapter_path and base_adapter_path.exists():
            logger.info(f"Loading existing adapter from {base_adapter_path}")
            from peft import PeftModel

            model = PeftModel.from_pretrained(model, str(base_adapter_path))
            model.merge_and_unload()
            model = get_peft_model(model, lora_config)
        else:
            model = get_peft_model(model, lora_config)

        model.print_trainable_parameters()

        # Load and prepare dataset
        logger.info(f"Loading dataset from {dataset_path}")
        dataset = load_dataset("json", data_files=str(dataset_path), split="train")

        def preprocess(example):
            prompt = (
                f"### Instruction:\n{example['instruction']}\n\n"
                f"### Input:\n{example.get('input', '')}\n\n"
                f"### Response:\n{example['output']}"
            )
            tokenized = tokenizer(
                prompt,
                truncation=True,
                max_length=config.max_seq_length,
                padding=False,
            )
            tokenized["labels"] = tokenized["input_ids"].copy()
            return tokenized

        tokenized_dataset = dataset.map(preprocess, remove_columns=dataset.column_names)

        progress.total_steps = (
            len(tokenized_dataset)
            // config.batch_size
            // config.gradient_accumulation_steps
            * config.num_epochs
        )
        yield progress

        # Output directory
        output_dir = self.adapters_dir / f"adapter_{job_id}"

        # Training arguments
        training_args = TrainingArguments(
            output_dir=str(output_dir),
            per_device_train_batch_size=config.batch_size,
            gradient_accumulation_steps=config.gradient_accumulation_steps,
            num_train_epochs=config.num_epochs,
            learning_rate=config.learning_rate,
            warmup_ratio=config.warmup_ratio,
            fp16=config.fp16,
            bf16=config.bf16,
            logging_steps=config.logging_steps,
            save_steps=config.save_steps,
            save_total_limit=2,
            gradient_checkpointing=config.use_gradient_checkpointing,
            report_to="none",
        )

        # Data collator
        data_collator = DataCollatorForSeq2Seq(
            tokenizer=tokenizer,
            model=model,
            padding=True,
        )

        # Custom callback for progress updates
        class ProgressCallback:
            def __init__(self, progress: TrainingProgress, job_id: str):
                self.progress = progress
                self.job_id = job_id

            def on_log(self, args, state, control, logs=None, **kwargs):
                if logs:
                    self.progress.current_step = state.global_step
                    self.progress.current_epoch = int(state.epoch)
                    self.progress.loss = logs.get("loss", 0.0)
                    self.progress.learning_rate = logs.get("learning_rate", 0.0)
                    self.progress.elapsed_seconds = int(
                        (datetime.utcnow() - self.progress.started_at).total_seconds()
                    )
                    self.progress.status = "training"

        callback = ProgressCallback(progress, job_id)

        # Create trainer
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=tokenized_dataset,
            data_collator=data_collator,
            tokenizer=tokenizer,
        )
        trainer.add_callback(callback)

        # Train
        progress.status = "training"
        yield progress

        logger.info("Starting training...")
        trainer.train()

        # Save adapter
        logger.info(f"Saving adapter to {output_dir}")
        model.save_pretrained(str(output_dir))
        tokenizer.save_pretrained(str(output_dir))

        # Save training config
        with open(output_dir / "training_config.json", "w") as f:
            json.dump(config.to_dict(), f, indent=2)

        progress.status = "completed"
        progress.completed_at = datetime.utcnow()
        yield progress

        # Cleanup
        del model
        del tokenizer
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

    async def get_training_status(self, job_id: str) -> TrainingProgress | None:
        """Get the status of a training job."""
        return self._active_jobs.get(job_id)

    async def cancel_training(self, job_id: str) -> bool:
        """Cancel an active training job."""
        if job_id in self._active_jobs:
            self._active_jobs[job_id].status = "cancelled"
            return True
        return False

    async def list_adapters(self) -> list[dict]:
        """List all available LoRA adapters."""
        adapters = []
        for adapter_dir in self.adapters_dir.iterdir():
            if adapter_dir.is_dir() and adapter_dir.name.startswith("adapter_"):
                config_path = adapter_dir / "training_config.json"
                if config_path.exists():
                    with open(config_path) as f:
                        config = json.load(f)
                else:
                    config = {}

                adapters.append({
                    "name": adapter_dir.name,
                    "path": str(adapter_dir),
                    "config": config,
                    "created_at": datetime.fromtimestamp(
                        adapter_dir.stat().st_ctime
                    ).isoformat(),
                })

        return adapters

    async def delete_adapter(self, adapter_name: str) -> bool:
        """Delete a LoRA adapter."""
        adapter_path = self.adapters_dir / adapter_name
        if adapter_path.exists() and adapter_path.is_dir():
            shutil.rmtree(adapter_path)
            logger.info(f"Deleted adapter: {adapter_name}")
            return True
        return False

    async def load_adapter(self, adapter_name: str) -> bool:
        """
        Load a LoRA adapter into the conversational model.

        Args:
            adapter_name: Name of the adapter to load

        Returns:
            True if successful
        """
        adapter_path = self.adapters_dir / adapter_name

        if not adapter_path.exists():
            logger.error(f"Adapter not found: {adapter_name}")
            return False

        # Get the conversational model and apply adapter
        from app.models.conversational import get_conversational_model

        model_wrapper = get_conversational_model()

        if not model_wrapper.is_ready:
            logger.error("Conversational model not loaded")
            return False

        try:
            from peft import PeftModel

            model_wrapper._model = PeftModel.from_pretrained(
                model_wrapper._model, str(adapter_path)
            )
            logger.info(f"Loaded adapter: {adapter_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to load adapter: {e}")
            return False


# Singleton instance
_training_service: LoRATrainingService | None = None


def get_training_service() -> LoRATrainingService:
    """Get the singleton training service instance."""
    global _training_service
    if _training_service is None:
        _training_service = LoRATrainingService()
    return _training_service
