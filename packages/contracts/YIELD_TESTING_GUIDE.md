# 🧪 Yield Testing Guide

Complete guide for testing staking and wealth building yield functionality.

---

## 📋 Prerequisites

1. **Contracts deployed** on Base Sepolia
2. **Test USDC** in your wallet
3. **Campaign created** (Campaign ID 0 exists)
4. **Frontend running** at localhost

---

## 🔄 Complete Testing Flow

### Part 1: Staking Yield Testing

#### Step 1: Stake USDC

```bash
# On the frontend:
1. Go to campaign page (e.g., /campaigns/0/donate)
2. Click "Staking" tab
3. Enter amount (e.g., 100 USDC)
4. Click "Approve USDC" → Confirm transaction
5. Wait for approval confirmation
6. Click "Stake" → Confirm transaction
7. Wait for staking confirmation
```

**Expected Result**:
- ✅ Staked Amount shows 100 USDC
- ✅ All other fields show 0 (no yield yet)

---

#### Step 2: Simulate Yield Accrual

```bash
cd packages/contracts

# Simulate 5 USDC yield (default)
npx hardhat run scripts/simulate-aave-yield.js --network baseSepolia

# Or specify custom amount
YIELD_AMOUNT=10 npx hardhat run scripts/simulate-aave-yield.js --network baseSepolia
```

**Expected Output**:
```
⚡ Simulating Aave Yield
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Simulating 5 USDC yield

📊 Current Balances:
   StakingPool aUSDC: 100.0
   WealthBuilding aUSDC: 0.0

⚡ Calling MockAavePool.simulateYield()...
   ✅ Yield simulated

📊 New Balances:
   StakingPool aUSDC: 105.0 (+5.0)
   WealthBuilding aUSDC: 0.0 (+0.0)

✅ Yield simulation complete!
```

**On Frontend**:
- Refresh the page
- ❌ Yield still shows 0 (not yet harvested)
- ✅ This is expected!

---

#### Step 3: Harvest and Distribute Yield

```bash
# Harvest yield from Aave and distribute to stakers
npx hardhat run scripts/harvest-staking-yield.js --network baseSepolia
```

**Expected Output**:
```
🌾 Harvesting Staking Yield from Aave
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Current State:
   Total Staked Principal: 100.0 USDC
   aUSDC Balance: 105.0 aUSDC

💰 Available Yield: 5.0 USDC

🚀 Calling harvestAndDistribute()...
   ✅ Transaction confirmed

🔍 Checking your rewards:
   Your Staked Amount: 100.0 USDC
   Your Claimable Rewards: 0.95 USDC  👈 19% of 5 USDC
   Already Distributed: 0.95 USDC

✅ Harvest successful!
```

**On Frontend**:
- Refresh the page
- ✅ "Total Claimable" now shows ~0.95 USDC
- ✅ "Already Distributed" shows ~0.95 USDC
- ✅ "Pending Distribution" shows 0 USDC

---

#### Step 4: Test Frontend Harvest Button

```bash
# On the frontend:
1. Wait 1 minute (more yield should accrue)
2. Refresh the page
3. Look for "Pending Distribution" > 0
4. If visible, click "Update Yield (Harvest from Aave)" button
5. Confirm transaction
6. Wait for confirmation
```

**Expected Result**:
- ✅ "Total Claimable" increases
- ✅ "Already Distributed" increases
- ✅ "Pending Distribution" resets to 0

---

#### Step 5: Claim Rewards

```bash
# On the frontend:
1. Click "Claim Rewards" button
2. Confirm transaction
3. Wait for confirmation
4. Check your USDC balance
```

**Expected Result**:
- ✅ USDC balance increases
- ✅ "Total Claimable" resets to 0
- ✅ Toast shows "Rewards claimed!"

---

### Part 2: Wealth Building Yield Testing

#### Step 1: Make Wealth Building Donation

```bash
# On the frontend:
1. Go to campaign page
2. Click "Wealth Building" tab
3. Enter amount (e.g., 1000 USDC)
4. Click "Approve USDC" → Confirm transaction
5. Wait for approval
6. Click "Donate" → Confirm transaction
7. Wait for confirmation
```

**Expected Result**:
- ✅ Shows endowment panel
- ✅ "Principal (Locked)" shows 200 USDC (20%)
- ✅ All yield fields show 0

---

#### Step 2: Simulate Yield Accrual

```bash
cd packages/contracts

# Simulate 10 USDC yield for wealth building
YIELD_AMOUNT=10 npx hardhat run scripts/simulate-aave-yield.js --network baseSepolia
```

**Expected Output**:
```
⚡ Simulating Aave Yield
💰 Simulating 10 USDC yield

📊 New Balances:
   StakingPool aUSDC: 105.0 (+0.0)
   WealthBuilding aUSDC: 210.0 (+10.0)  👈 200 + 10

✅ Yield simulation complete!
```

---

#### Step 3: Check Pending Yield

```bash
# On the frontend:
1. Refresh the page
2. Go to "Wealth Building" tab
3. Look for yellow "Pending Yield" box
```

**Expected Result**:
- ✅ Yellow box appears
- ✅ "Will go to cause" shows ~3 USDC (30%)
- ✅ "Will become stocks" shows ~7 USDC (70%)
- ✅ Auto-refreshes every 5 seconds

---

#### Step 4: Harvest Wealth Building Yield

**Option A: Use Script**
```bash
# Harvest for your address and campaign 0
npx hardhat run scripts/harvest-wealth-building-yield.js --network baseSepolia

# Or specify custom donor/campaign
DONOR_ADDRESS=0x... CAMPAIGN_ID=0 npx hardhat run scripts/harvest-wealth-building-yield.js --network baseSepolia
```

**Option B: Use Frontend**
```bash
# On the frontend:
1. Go to "Wealth Building" tab
2. Click "Harvest Yield" button
3. Confirm transaction
4. Wait for confirmation
```

**Expected Output (Script)**:
```
🌾 Harvesting Wealth Building Yield
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Current Endowment State:
   Principal (Locked): 200.0 USDC
   Lifetime Yield: 0.0 USDC

💰 Pending Yield:
   To Cause (30%): 3.0 USDC
   To Donor (70%): 7.0 USDC
   Total Pending: 10.0 USDC

🚀 Calling harvestYield()...
   ✅ Transaction confirmed

📊 New Endowment State:
   Principal (Locked): 200.0 USDC
   Lifetime Yield: 10.0 USDC  👈 Increased!
   Yield to Cause: 3.0 USDC   👈 30%
   Stocks Value: 7.0 USDC     👈 70%

📈 Stock Portfolio:
   USDC (Unclaimed): 7.0      👈 Held as USDC (no swap configured)

✅ Harvest successful!
```

**Expected Result (Frontend)**:
- ✅ "Lifetime Yield Generated" increases to 10 USDC
- ✅ "Yield to Cause" shows 3 USDC
- ✅ "Your Stocks Value" shows 7 USDC
- ✅ "Stock Portfolio" section appears
- ✅ Shows "USDC (Unclaimed): 7.0"
- ✅ Yellow "Pending Yield" box disappears

---

#### Step 5: Claim Stocks

```bash
# On the frontend:
1. In "Stock Portfolio" section
2. Click "Claim" button next to USDC
3. Confirm transaction
4. Wait for confirmation
```

**Expected Result**:
- ✅ USDC balance increases by 7 USDC
- ✅ Stock disappears from portfolio
- ✅ Toast shows "Stocks claimed!"

---

## 🎯 Quick Testing Commands

```bash
# Full staking test flow
cd packages/contracts

# 1. Simulate yield
YIELD_AMOUNT=5 npx hardhat run scripts/simulate-aave-yield.js --network baseSepolia

# 2. Harvest and distribute
npx hardhat run scripts/harvest-staking-yield.js --network baseSepolia

# Full wealth building test flow

# 1. Simulate yield
YIELD_AMOUNT=10 npx hardhat run scripts/simulate-aave-yield.js --network baseSepolia

# 2. Harvest for your address
npx hardhat run scripts/harvest-wealth-building-yield.js --network baseSepolia

# Or harvest for specific donor
DONOR_ADDRESS=0x... CAMPAIGN_ID=0 npx hardhat run scripts/harvest-wealth-building-yield.js --network baseSepolia
```

---

## 🐛 Troubleshooting

### "No yield available to harvest"

**Cause**: No yield has accrued yet
**Fix**:
```bash
# Run the simulate script first
npx hardhat run scripts/simulate-aave-yield.js --network baseSepolia
```

---

### "Harvest cooldown active"

**Cause**: StakingPool has 24-hour cooldown between harvests
**Fix**:
- Wait 24 hours, OR
- For testing only: Modify `HARVEST_INTERVAL` in StakingPool.sol

---

### "Fundraiser not registered"

**Cause**: WealthBuilding doesn't have the fundraiser registered
**Fix**:
```bash
# Use the Factory.createFundraiser() which auto-registers
# Or manually register:
WealthBuilding.registerFundraiser(campaignId, beneficiaryAddress)
```

---

### "No endowment found"

**Cause**: Donor hasn't made a wealth-building donation yet
**Fix**:
- Make a wealth-building donation first through the frontend

---

### Frontend shows 0 yield after harvesting

**Cause**: Page not refreshed
**Fix**:
- Refresh the page (F5)
- Wait 5 seconds for auto-refresh

---

### TypeError: Cannot read properties

**Cause**: Contract ABI mismatch
**Fix**:
```bash
# Make sure you're using the updated contracts.ts
cd packages/test-frontend
git pull  # or verify you have the latest changes
```

---

## 📊 Expected Yield Distribution

### Staking Pool (79/19/2 split)
- **79%** → Campaign beneficiary
- **19%** → Stakers (you)
- **2%** → Platform

Example: 100 USDC yield = 19 USDC claimable for you

### Wealth Building (30/70 split)
- **30%** → Campaign beneficiary (instant)
- **70%** → Donor as stocks (you)

Example: 10 USDC yield = 7 USDC in stocks for you

---

## 🔄 Real-World Scenario Test

```bash
# Day 1: Setup
1. Stake 1000 USDC
2. Make 1000 USDC wealth-building donation

# Day 2: First harvest
1. Simulate 50 USDC yield
2. Harvest staking: Get ~9.5 USDC (19%)
3. Harvest wealth building: Get ~35 USDC (70% of 50 USDC)
4. Claim both

# Day 3: Second harvest
1. Simulate another 30 USDC yield
2. Harvest staking: Get additional ~5.7 USDC
3. Harvest wealth building: Get additional ~21 USDC
4. Claim both

# Result after 2 days:
- Staking earned: ~15.2 USDC total
- Wealth building earned: ~56 USDC total (in stocks/USDC)
- Campaign beneficiary received perpetual income stream!
```

---

## 🎓 Understanding the Flow

### Why Yield Doesn't Show Immediately

```
User stakes → USDC in Aave → aUSDC accrues (invisible)
                                    ↓
                         Someone calls harvestAndDistribute()
                                    ↓
                         Yield withdrawn from Aave
                                    ↓
                         yieldPerTokenStored updated
                                    ↓
                         User's share calculated
                                    ↓
                         Frontend shows claimable amount
```

### Key Points:
- ✅ Yield IS accruing in Aave (aUSDC balance growing)
- ❌ But NOT visible to users until harvested
- ⏰ Production: Chainlink Keeper calls harvest every 24 hours
- 🧪 Testing: We call harvest manually

---

## 💡 Pro Tips

1. **Always simulate yield before testing harvest**
   - MockAavePool doesn't auto-generate yield
   - Run simulate-aave-yield.js first

2. **Use the scripts for quick testing**
   - Faster than clicking through UI
   - Shows detailed output for debugging

3. **Check the explorer**
   - All transactions have links
   - Verify events were emitted correctly

4. **Test incrementally**
   - Don't skip steps
   - Verify each step before moving forward

5. **Keep notes**
   - Track your balances before/after
   - Note transaction hashes for later reference

---

*Last Updated: 2026-02-10*
*All fixes implemented and tested*
