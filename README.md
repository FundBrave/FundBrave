# FundBrave

**Decentralized Fundraising Platform with DeFi Yields, AI Assistance & Social Impact**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-orange)](https://soliditylang.org/)

---

## Overview

FundBrave is a next-generation decentralized fundraising platform that combines blockchain transparency, DeFi yield generation, and AI-powered assistance to revolutionize charitable giving and campaign funding. The platform enables creators to raise funds while generating sustainable income through yield-bearing mechanisms, where donors can build wealth while supporting causes.

### Key Innovations

- **Wealth-Building Donations**: 78% direct impact + 20% permanent endowment generating perpetual yields
- **Three Staking Pillars**: Per-campaign staking, global pool, and Impact DAO treasury
- **AI-Powered Features**: Conversational assistant, deepfake detection, and campaign recommendations
- **Multi-Chain Support**: Deployed across 6+ EVM networks (Polygon, Base, Celo, Zircuit, RSK, Arbitrum)
- **Social Fundraising**: Full social network with posts, comments, messaging, and community engagement
- **Zero-Knowledge Privacy**: Optional anonymous donations with blockchain verification

---

## Architecture

FundBrave is built as a production-ready **TypeScript monorepo** with four main packages:

```
packages/
├── frontend/       # Next.js 16 + React 19 (App Router)
├── backend/        # NestJS + Prisma + PostgreSQL + GraphQL
├── contracts/      # Hardhat + Solidity 0.8.20 (UUPS Upgradeable)
└── ai-service/     # FastAPI + PyTorch + HuggingFace (Python ML)
```

### High-Level System Flow

```
┌─────────────┐
│   Next.js   │ ──Apollo──> ┌──────────┐ ──Prisma──> ┌────────────┐
│  Frontend   │             │  NestJS  │             │ PostgreSQL │
│  (React 19) │ <──SSE────  │ Backend  │ <──Events── │   (43 models) │
└─────────────┘             └──────────┘             └────────────┘
       │                         │
       │ Web3                    │ ethers.js
       │                         │
       ▼                         ▼
┌─────────────────────────────────────────────────┐
│          Blockchain Layer (Multi-chain)          │
│  FundraiserFactory, StakingPools, WealthBuilder  │
│  ImpactDAOPool, PlatformTreasury, FBT Token     │
└─────────────────────────────────────────────────┘
       ▲
       │ REST API
       │
┌─────────────┐
│  FastAPI    │ ──HuggingFace──> ML Models:
│ AI Service  │                   - Qwen2.5-7B (Chat)
│  (Python)   │                   - ViT (Deepfake)
└─────────────┘                   - Qwen2-VL (Vision)
```

---

## Tech Stack

### Frontend (`packages/frontend`)

| Category | Technologies |
|----------|-------------|
| **Framework** | Next.js 16.0.6 (App Router), React 19.2.0, TypeScript 5 |
| **Styling** | Tailwind CSS 4, CSS Variables (OkLch color space) |
| **State** | React Context API, Apollo Client cache |
| **Web3** | Wagmi 3.3.1, RainbowKit 2.2.10, viem 2.44.1, SIWE 3.0.0 |
| **GraphQL** | Apollo Client 3.14.0, GraphQL Codegen |
| **Animation** | GSAP 3.13.0, Motion 12.23.12 |
| **UI Libraries** | Radix UI, lucide-react 0.542.0, class-variance-authority |
| **Forms** | Zod 4.1.8, react-hook-form |
| **i18n** | next-intl 4.7.0 |

### Backend (`packages/backend`)

| Category | Technologies |
|----------|-------------|
| **Framework** | NestJS 11.0.1, TypeScript 5.7 |
| **Database** | PostgreSQL with Prisma 6.19.0 ORM (43 models) |
| **API** | Apollo GraphQL Server 5.2.0 + REST Controllers |
| **Real-time** | Socket.IO WebSockets (`/events` namespace) |
| **Auth** | JWT, SIWE (Web3), Google OAuth 2.0, AES-256-GCM |
| **Web3** | ethers.js 6.16.0 for blockchain interaction |
| **Storage** | AWS S3 with presigned URLs |
| **Email** | Resend API |
| **Jobs** | Bull + Redis for background processing |
| **Security** | Helmet, ReentrancyGuard, Pausable patterns |

### Smart Contracts (`packages/contracts`)

| Category | Technologies |
|----------|-------------|
| **Framework** | Hardhat with Solidity 0.8.20 |
| **Patterns** | UUPS Upgradeable Proxies, Clones (EIP-1167) |
| **Security** | OpenZeppelin libraries (v5.1.0), ReentrancyGuard, Pausable |
| **DeFi** | Aave V3, Morpho Blue, 1inch Swap, Backed Finance |
| **Cross-chain** | LayerZero V2 OApp/OFT |
| **Chains** | StatusL2, Polygon, Base, Celo, Zircuit, Rootstock, Arbitrum, Optimism |

### AI Service (`packages/ai-service`)

| Category | Technologies |
|----------|-------------|
| **Framework** | FastAPI 0.109.0, Uvicorn ASGI server |
| **ML Core** | PyTorch 2.2.0+, Transformers 4.37.2+, PEFT (LoRA) |
| **Models** | Qwen2.5-7B-Instruct, Deep-Fake-Detector-v2, Qwen2-VL-7B |
| **Quantization** | bitsandbytes (4-bit/8-bit), Flash Attention |
| **RAG** | ChromaDB 0.4.22, LangChain 0.1.6, FAISS 1.7.4 |
| **Search** | SerpAPI, DuckDuckGo-Search |
| **Moderation** | Detoxify, Profanity-Check, LangDetect |
| **Caching** | Redis 5.0.1, PostgreSQL for persistence |

---

## Quick Start

### Prerequisites

- **Node.js** 18+ and npm 9+
- **Python** 3.11+ with pip
- **PostgreSQL** 15+ (for backend)
- **Redis** 7+ (for caching and jobs)
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/FundBrave/FundBrave.git
cd FundBrave

# Install all dependencies (monorepo-wide)
npm install

# Set up environment files
cp packages/frontend/.env.example packages/frontend/.env.local
cp packages/backend/.env.example packages/backend/.env
cp packages/ai-service/.env.example packages/ai-service/.env

# Start PostgreSQL and Redis (via Docker Compose)
docker-compose up -d postgres redis

# Run database migrations
cd packages/backend
npx prisma migrate dev
npx prisma generate
cd ../..

# Start all services in development mode
npm run dev
```

### Development Services

After running `npm run dev`, the following services will be available:

- **Frontend**: http://localhost:3001
- **Backend**: http://localhost:3000
  - GraphQL Playground: http://localhost:3000/graphql
  - REST API: http://localhost:3000/api
- **AI Service**: http://localhost:8001
  - API Docs: http://localhost:8001/docs

### Environment Variables

#### Frontend (`packages/frontend/.env.local`)
```env
NEXT_PUBLIC_GRAPHQL_URI=http://localhost:3000/graphql
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key
```

#### Backend (`packages/backend/.env`)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/fundbrave
JWT_SECRET=minimum-32-character-secret-key
JWT_REFRESH_SECRET=another-32-character-secret
WALLET_ENCRYPTION_KEY=64-hex-character-key-for-aes-256
AWS_S3_BUCKET=your-bucket-name
RESEND_API_KEY=your-resend-key
```

#### AI Service (`packages/ai-service/.env`)
```env
LOAD_MODELS=false  # Set to true for GPU inference
BACKEND_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:pass@localhost:5432/fundbrave
```

## Core Features

### 1. Fundraising Ecosystem

#### Campaign Management
- **CRUD Operations**: Create, read, update campaigns with media archives
- **Categories**: Medical, Education, Emergency, Community, Environment, Technology, Arts, Sports
- **Search & Filters**: Full-text search, category/region filtering, sort by trending/funding
- **Milestones**: Track progress with verifiable updates
- **Goal Tracking**: Automatic goal reached detection with refund mechanism

#### Three Donation Models

**A. Direct Donations** (Traditional)
```
100 USDC → 100% to beneficiary
```

**B. Wealth-Building Donations** (Innovative)
```
1000 USDC Split:
├─ 780 USDC (78%) → Beneficiary (immediate)
├─ 200 USDC (20%) → Aave endowment (permanent)
│   └─ Yield: 30% to cause, 70% to donor as tokenized stocks
└─ 20 USDC (2%) → Platform treasury
```

**C. Staking Donations** (Yield-based)
```
Stake USDC → Aave/Morpho → Earn yield
├─ 79% yield to beneficiary
├─ 19% yield to staker
└─ 2% yield to platform
```

### 2. Three Staking Pillars

#### Per-Campaign Staking Pools
- Deployed per fundraiser via factory cloning
- Aave V3 or Morpho Blue integration
- Configurable yield splits (per-staker customization)
- FBT liquidity mining rewards (Synthetix-style)
- Receipt OFT tokens (cross-chain portable)

#### Global Staking Pool
- Platform-wide shared treasury
- Yield sent to YieldDistributor for DAO allocation
- Epoch-based voting on target fundraisers
- Circuit breaker protection (10M single, 50M hourly, 200M daily)

#### Impact DAO Pool
- Collective treasury with off-chain voting
- 79% to DAO-voted causes, 19% to stakers, 2% to platform
- FBT-weighted voting power
- Quorum requirements for proposals

### 3. Platform Treasury Model

"We practice what we preach" - The treasury operates entirely on yields:

```
Fee Flow:
1. All contracts send 2% fees → PlatformTreasury
2. Fees staked via WealthBuildingDonation (20% endowment)
3. Endowment yields distributed to FBT stakers
4. 78% operational funds for expenses
5. Principal never withdrawn (permanent)
```

### 4. FBT Token (FundBrave Token)

**Token Details**:
- Initial Supply: 10,000,000 FBT (18 decimals)
- Standard: ERC20 with Permit (gasless approvals)
- Upgradeable: UUPS pattern

**Vesting Schedules**:
- Donation rewards: 30 days linear vesting
- Engagement rewards: 7 days linear vesting
- Custom vesting: Team/investor allocations

**Utility**:
- Governance voting power (liquid + staked balance)
- Liquidity mining rewards in staking pools
- Yield participation from platform treasury
- Premium feature access (via burn)

### 5. Social Features

- **Posts**: Text, media, polls, donation events, fundraiser announcements
- **Comments**: Nested replies with likes
- **Engagement**: Likes, reposts, bookmarks
- **Following**: Social graph with followers/following
- **Messaging**: Direct messages with read receipts and typing indicators
- **Notifications**: Real-time push and email with granular controls
- **Mentions**: @username tagging with notifications
- **Hashtags**: Trending tags with time-decay scoring

### 6. AI-Powered Features

#### Conversational Assistant
- **Model**: Qwen2.5-7B-Instruct (4-bit quantized)
- **Context-Aware**: Campaign-specific responses
- **Streaming**: Real-time SSE responses
- **Features**: Fundraising guidance, platform questions, donor matching

#### Deepfake Detection
- **Model**: Deep-Fake-Detector-v2 (Vision Transformer)
- **Accuracy**: 92%+
- **Processing**: Single image or batch (max 10)
- **Output**: Binary classification (real/fake) with confidence scores

#### Image Analysis
- **Model**: Qwen2-VL-7B (multimodal)
- **Features**: Appropriateness checking, image-text coherence, content tagging
- **Use Case**: Campaign image verification

#### Advanced Features
- **RAG**: ChromaDB vector search for knowledge base queries
- **Recommendations**: Personalized campaign suggestions
- **Fraud Detection**: Pattern analysis and risk scoring
- **Content Moderation**: Toxicity detection, spam filtering

### 7. Cross-Chain Infrastructure

**LayerZero V2 Integration**:
- **FundBraveBridge**: Cross-chain donations and staking
- **ReceiptOFT**: Cross-chain receipt token transfers
- **Supported Chains**: Polygon, Base, Celo, Zircuit, Rootstock, Arbitrum, Optimism

**Flow**:
1. User donates any token on source chain
2. Bridge swaps to USDC via 1inch/Uniswap
3. LayerZero message sent to destination chain
4. Factory processes donation on destination
5. Receipt tokens minted on source chain

---

## API Reference

### GraphQL API (Primary)

**Endpoint**: `POST http://localhost:3000/graphql`

#### Key Queries

```graphql
# Get current user
query Me {
  me {
    id
    displayName
    email
    walletAddress
    reputationScore
    totalDonated
    totalStaked
  }
}

# List fundraisers with filters
query Fundraisers($limit: Int!, $offset: Int!, $filter: FundraiserFilter) {
  fundraisers(limit: $limit, offset: $offset, filter: $filter) {
    id
    name
    description
    goalAmount
    raisedAmount
    deadline
    isActive
    categories
  }
}

# Get donation leaderboard
query DonationLeaderboard($period: LeaderboardPeriod!) {
  getDonationLeaderboard(period: $period) {
    rank
    user { id, displayName, avatarUrl }
    totalDonated
    donationCount
  }
}
```

#### Key Mutations

```graphql
# Create fundraiser
mutation CreateFundraiser($input: CreateFundraiserInput!) {
  createFundraiser(input: $input) {
    id
    onChainId
    txHash
  }
}

# Record donation
mutation RecordDonation($input: RecordDonationInput!) {
  recordDonation(input: $input) {
    id
    amount
    amountUSD
    txHash
  }
}

# Create post
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    content
    likesCount
    createdAt
  }
}
```

### REST API Endpoints

**Authentication**:
```
POST /auth/siwe/nonce              # Get SIWE nonce
POST /auth/siwe/verify             # Verify SIWE signature
GET  /auth/google                  # Google OAuth redirect
GET  /auth/google/callback         # OAuth callback
POST /auth/forgot-password         # Password reset request
POST /auth/reset-password          # Reset with token
```

**File Uploads**:
```
POST /upload/avatar                # Upload user avatar (5MB max)
POST /upload/banner                # Upload banner (10MB max)
POST /upload/post-media            # Upload post media (10MB images, 100MB videos)
POST /upload/fundraiser-media      # Upload campaign images
```

**Health**:
```
GET /health                        # Basic health check
```

### WebSocket Events (Socket.IO)

**Namespace**: `/events`

```javascript
// Subscribe to fundraiser updates
socket.emit('subscribeFundraiser', { fundraiserId: '123' });

// Listen for donations
socket.on('donationReceived', (data) => {
  console.log('New donation:', data);
});

// Subscribe to user notifications
socket.emit('subscribeUser', { userId: '456' });

// Listen for new messages
socket.on('newMessage', (message) => {
  console.log('New message:', message);
});
```

### AI Service API

**Endpoint**: `http://localhost:8001`

```bash
# Chat with AI
curl -X POST http://localhost:8001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I create a fundraiser?", "stream": false}'

# Verify image authenticity
curl -X POST http://localhost:8001/api/verify-media \
  -F "file=@image.jpg"

# Get campaign recommendations
curl -X POST http://localhost:8001/api/advanced/recommendations \
  -H "Content-Type: application/json" \
  -d '{"user_id": "123", "limit": 5}'
```

---

## Smart Contract Deployment

### Deployment Flow

```bash
cd packages/contracts

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test
npx hardhat coverage

# Deploy to testnet (Polygon Mumbai)
npx hardhat run scripts/deploy/01_deploy_core.js --network polygonMumbai

# Verify contracts
npx hardhat verify --network polygonMumbai <CONTRACT_ADDRESS>
```

### Contract Addresses (Polygon Mainnet)

```
FundraiserFactory: 0x...
FundBraveToken: 0x...
GlobalStakingPool: 0x...
ImpactDAOPool: 0x...
WealthBuildingDonation: 0x...
PlatformTreasury: 0x...
FundBraveBridge: 0x...
```

### Interaction Example

```typescript
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(RPC_URL);
const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);

// Create a fundraiser
const tx = await factory.createFundraiser(
  'Campaign Name',
  'Campaign description',
  ethers.parseUnits('10000', 6), // 10,000 USDC goal
  Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days
  beneficiaryAddress,
  ['Medical', 'Emergency'],
  'Global',
  ['image1.jpg', 'image2.jpg']
);

await tx.wait();
```

---

## Development

### Monorepo Commands

```bash
# Start all services
npm run dev

# Build all packages
npm run build

# Lint all packages
npm run lint

# Type check all packages
npm run type-check

# Run tests for all packages
npm run test

# Clean all node_modules
npm run clean

# Individual package commands
npm run dev:frontend
npm run dev:backend
```

### Testing

#### Frontend Tests
```bash
cd packages/frontend
npm run test
npm run test:watch
```

#### Backend Tests
```bash
cd packages/backend
npm run test
npm run test:e2e
npm run test:cov
```

#### Contract Tests
```bash
cd packages/contracts
npx hardhat test
npx hardhat test --network hardhat
npx hardhat coverage
```

#### AI Service Tests
```bash
cd packages/ai-service
pytest tests/
pytest tests/ -v --cov=app
```

### Code Generation

```bash
# Frontend GraphQL codegen
cd packages/frontend
npm run codegen
npm run codegen:watch

# Backend Prisma client
cd packages/backend
npx prisma generate
npx prisma migrate dev

# Contract TypeChain types
cd packages/contracts
npx hardhat compile
```

### Database Management

```bash
cd packages/backend

# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset

# Seed database
npx prisma db seed

# Open Prisma Studio
npx prisma studio
```

---

## Deployment

### Production Deployment

#### Frontend (Vercel)
```bash
cd packages/frontend
vercel --prod
```

#### Backend (Railway/Render)
```bash
cd packages/backend
npm run build
npm run start:prod
```

#### Contracts (Multi-chain)
```bash
cd packages/contracts
npx hardhat run scripts/deploy/01_deploy_core.js --network polygon
npx hardhat run scripts/deploy/01_deploy_core.js --network base
npx hardhat run scripts/deploy/01_deploy_core.js --network celo
```

#### AI Service (AWS EC2 with GPU)
```bash
cd packages/ai-service
docker build -f Dockerfile.gpu -t fundbrave-ai:latest .
docker run -p 8001:8001 --gpus all fundbrave-ai:latest
```

### Environment Requirements

**Production**:
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Python 3.11+ with CUDA 12.1+ (for AI service with GPU)
- Minimum 16GB RAM (32GB recommended for AI service)
- 100GB+ storage

---

## Contributing

We welcome contributions from developers worldwide. Please read our [Contributing Guidelines](./CONTRIBUTING.md) before submitting pull requests.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write/update tests
5. Run linting and tests (`npm run lint`, `npm run test`)
6. Commit with conventional commits (`git commit -m "feat: add amazing feature"`)
7. Push to your branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Test additions or changes
- `chore:` - Build process or tooling changes

---

## Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md)
- [API Documentation](./docs/API.md)
- [Smart Contracts](./docs/SMART_CONTRACTS.md)
- [Tokenomics](./docs/TOKENOMICS.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Getting Started](./docs/development/getting-started.md)
- [Local Setup](./docs/development/local-setup.md)
- [Testing Guide](./docs/development/testing.md)
- [Troubleshooting](./docs/development/troubleshooting.md)
- [AI Implementation](./docs/technical/ai-implementation.md)
- [Blockchain Integration](./docs/technical/blockchain-integration.md)
- [Security Considerations](./docs/technical/security-considerations.md)
- [Performance Optimization](./docs/technical/performance-optimization.md)

---

## Security

Security is paramount for a financial platform. We follow industry best practices:

- **Smart Contract Audits**: Regular third-party security audits
- **Bug Bounty Program**: Rewards for vulnerability disclosures
- **Security Policy**: See [SECURITY.md](./SECURITY.md)
- **Automated Scanning**: Continuous vulnerability monitoring
- **Best Practices**: OWASP Top 10 compliance, CWE mitigation

### Reporting Vulnerabilities

Please report security vulnerabilities to: **security@fundbrave.com**

Do not open public issues for security vulnerabilities.

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

---

## Community & Support

- **Discord**: [Join our community](https://discord.gg/fundbrave)
- **Twitter**: [@FundBrave](https://twitter.com/fundbrave)
- **Email**: officialfundbrave@gmail.com
- **Forum**: [Logos Forum](https://forum.logos.co)
- **Documentation**: [docs.fundbrave.com](https://docs.fundbrave.com)

---

## Acknowledgments

- **Logos Network** - Developer Circle support
- **Numbers Protocol** - Content verification infrastructure
- **OpenZeppelin** - Secure smart contract libraries
- **HuggingFace** - ML model hosting and transformers library
- **Aave, Morpho, Backed Finance** - DeFi integrations
- **LayerZero** - Cross-chain infrastructure
- **Open Source Community** - Countless amazing tools and libraries

---

<div align="center">

**Built with ❤️ by the FundBrave Community**

[Website](https://fundbrave.com) • [Documentation](./docs) • [Contributing](./CONTRIBUTING.md) • [Security](./SECURITY.md) • [License](./LICENSE)

*Empowering transparent fundraising through blockchain, DeFi, and AI*

</div>
