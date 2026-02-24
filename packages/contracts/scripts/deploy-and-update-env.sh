#!/bin/bash
# Deploy contracts to Base Sepolia and update test-frontend .env.local
# Run from packages/contracts directory:
#   chmod +x scripts/deploy-and-update-env.sh
#   ./scripts/deploy-and-update-env.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTRACTS_DIR="$(dirname "$SCRIPT_DIR")"
TEST_FRONTEND_DIR="$CONTRACTS_DIR/../test-frontend"

echo "============================================="
echo "  FundBrave Contract Deployment"
echo "  Network: Base Sepolia (Chain ID: 84532)"
echo "============================================="
echo ""

# Check if .env exists
if [ ! -f "$CONTRACTS_DIR/.env" ]; then
    echo "ERROR: .env file not found in $CONTRACTS_DIR"
    echo "Create one with PRIVATE_KEY and ALCHEMY_API_KEY"
    exit 1
fi

# Step 1: Compile
echo "Step 1: Compiling contracts..."
cd "$CONTRACTS_DIR"
npx hardhat compile

# Step 2: Deploy
echo ""
echo "Step 2: Deploying to Base Sepolia..."
DEPLOY_OUTPUT=$(npx hardhat run scripts/deploy-base-sepolia-test.js --network baseSepolia 2>&1)
echo "$DEPLOY_OUTPUT"

# Step 3: Extract addresses from deployment output
echo ""
echo "Step 3: Extracting addresses and updating .env.local..."

FACTORY=$(echo "$DEPLOY_OUTPUT" | grep "NEXT_PUBLIC_FACTORY_ADDRESS=" | sed 's/NEXT_PUBLIC_FACTORY_ADDRESS=//')
USDC=$(echo "$DEPLOY_OUTPUT" | grep "NEXT_PUBLIC_USDC_ADDRESS=" | sed 's/NEXT_PUBLIC_USDC_ADDRESS=//')
AAVE_POOL=$(echo "$DEPLOY_OUTPUT" | grep "NEXT_PUBLIC_AAVE_POOL_ADDRESS=" | sed 's/NEXT_PUBLIC_AAVE_POOL_ADDRESS=//')
WEALTH_BUILDING=$(echo "$DEPLOY_OUTPUT" | grep "NEXT_PUBLIC_WEALTH_BUILDING_ADDRESS=" | sed 's/NEXT_PUBLIC_WEALTH_BUILDING_ADDRESS=//')
DAI=$(echo "$DEPLOY_OUTPUT" | grep "NEXT_PUBLIC_DAI_ADDRESS=" | sed 's/NEXT_PUBLIC_DAI_ADDRESS=//')
WETH=$(echo "$DEPLOY_OUTPUT" | grep "NEXT_PUBLIC_WETH_ADDRESS=" | sed 's/NEXT_PUBLIC_WETH_ADDRESS=//')

if [ -z "$FACTORY" ]; then
    echo "ERROR: Could not extract addresses from deployment output"
    echo "Please manually update .env.local using the addresses printed above"
    exit 1
fi

# Step 4: Write .env.local
ENV_FILE="$TEST_FRONTEND_DIR/.env.local"

cat > "$ENV_FILE" << EOF
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=be6d31c7c662d2e0b9e8ac6cd2e14f49
NEXT_PUBLIC_FACTORY_ADDRESS=$FACTORY
NEXT_PUBLIC_USDC_ADDRESS=$USDC
NEXT_PUBLIC_AAVE_POOL_ADDRESS=$AAVE_POOL
NEXT_PUBLIC_WEALTH_BUILDING_ADDRESS=$WEALTH_BUILDING
NEXT_PUBLIC_DAI_ADDRESS=$DAI
NEXT_PUBLIC_WETH_ADDRESS=$WETH
EOF

echo ""
echo "============================================="
echo "  Deployment Complete!"
echo "============================================="
echo ""
echo "Updated $ENV_FILE with:"
cat "$ENV_FILE"
echo ""
echo "Next: cd ../test-frontend && npm run dev"
