// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IMetaMorpho.sol";

/**
 * @title StakingPool (Morpho Version)
 * @dev A staking pool that interacts with a Morpho MetaMorpho (ERC4626) vault.
 * It has the SAME external functions as your Aave pool,
 * but its internal logic calls a Morpho MetaMorpho (ERC4626) vault.
 */
contract MorphoStakingPool is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // --- Morpho & Token Addresses ---
    // This is the ERC4626 MetaMorpho Vault
    IMetaMorpho public immutable METAMORPHO_VAULT;
    IERC20 public immutable USDT;
    IERC20 public immutable FBT;

    // --- Beneficiaries ---
    address public immutable beneficiary;
    address public immutable platformWallet;
    address public immutable factoryAddress;

    // --- Staking Data ---
    uint256 public totalStakedPrincipal;
    mapping(address => uint256) public stakerPrincipal;

    uint256 public rewardPerTokenStored;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    // --- Profit Sharing ---
    uint256 public constant FUNDRAISER_SHARE = 7900;
    uint256 public constant STAKER_SHARE = 1900;
    uint256 public constant PLATFORM_SHARE = 200;
    uint256 public constant TOTAL_BASIS = 10000;

    uint256 public usdtRewardPerTokenStored;
    mapping(address => uint256) public userUsdtRewardPerTokenPaid;
    mapping(address => uint256) public usdtRewards;

    // --- 2. FBT Liquidity Mining State (New) ---
    uint256 public periodFinish;
    uint256 public rewardRate;
    uint256 public rewardsDuration;
    uint256 public lastUpdateTime;

    // --- Events ---
    event Staked(address indexed staker, uint256 usdtAmount);
    event Unstaked(address indexed staker, uint256 usdtAmount);
    event YieldHarvested(uint256 totalYield, uint256 stakerShare);
    event UsdtRewardsClaimed(address indexed staker, uint256 amount);
    event FbtRewardsClaimed(address indexed staker, uint256 amount);
    event RewardAdded(uint256 reward);

    modifier onlyFactory() {
        require(msg.sender == factoryAddress, "StakingPool: Only factory");
        _;
    }

    modifier updateReward(address staker) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (staker != address(0)) {
            rewards[staker] = earnedFBT(staker);
            userRewardPerTokenPaid[staker] = rewardPerTokenStored;
        }

        usdtRewards[staker] += earnedUSDT(staker);
        userUsdtRewardPerTokenPaid[staker] = usdtRewardPerTokenStored;
        _;
    }

    constructor(
        address _morphoVault,
        address _usdt,
        address _fbt,
        address _beneficiary,
        address _platformWallet,
        address _factoryAddress,
        address _owner
    ) Ownable(_owner) {
        METAMORPHO_VAULT = IMetaMorpho(_morphoVault);
        USDT = IERC20(_usdt);
        FBT = IERC20(_fbt);
        beneficiary = _beneficiary;
        platformWallet = _platformWallet;
        factoryAddress = _factoryAddress;

        rewardsDuration = 7 days;

        USDT.approve(address(METAMORPHO_VAULT), type(uint256).max);
    }

    // --- Core Staking Functions ---

    /**
     * @dev Called by the Factory.
     */
    function depositFor(address staker, uint256 usdtAmount)
        external
        onlyFactory
        nonReentrant
        whenNotPaused
        updateReward(staker)
    {
        require(usdtAmount > 0, "Amount must be > 0");
        
        METAMORPHO_VAULT.deposit(usdtAmount, address(this));

        stakerPrincipal[staker] += usdtAmount;
        totalStakedPrincipal += usdtAmount;

        emit Staked(staker, usdtAmount);
    }

    /**
     * @dev Staker withdraws their principal.
     */
    function unstake(uint256 usdtAmount)
        external
        nonReentrant
        whenNotPaused
        updateReward(msg.sender)
    {
        require(usdtAmount > 0, "Amount must be > 0");
        require(stakerPrincipal[msg.sender] >= usdtAmount, "Insufficient stake");

        stakerPrincipal[msg.sender] -= usdtAmount;
        totalStakedPrincipal -= usdtAmount;

        METAMORPHO_VAULT.withdraw(usdtAmount, msg.sender, address(this));

        emit Unstaked(msg.sender, usdtAmount);
    }

    // --- Reward Claiming ---

    function claimAllRewards() external nonReentrant whenNotPaused updateReward(msg.sender) {
        _claimUSDT();
        _claimFBT();
    }

    function _claimUSDT() internal {
        uint256 reward = usdtRewards[msg.sender];
        if (reward > 0) {
            usdtRewards[msg.sender] = 0;
            USDT.safeTransfer(msg.sender, reward);
            emit UsdtRewardsClaimed(msg.sender, reward);
        }
    }

    function _claimFBT() internal {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            FBT.safeTransfer(msg.sender, reward);
            emit FbtRewardsClaimed(msg.sender, reward);
        }
    }

    /**
     * @dev Legacy support for claiming just staking rewards (USDT)
     */
    function claimStakerRewards() external nonReentrant whenNotPaused updateReward(msg.sender) {
        _claimUSDT();
    }

    // --- Harvest Logic ---

    /**
     * @dev Harvests yield from Morpho and splits it 79/19/2.
     */
    function harvestAndDistribute() external nonReentrant whenNotPaused {
        // Calculate Yield from Morpho
        uint256 totalShares = METAMORPHO_VAULT.balanceOf(address(this));
        uint256 currentAssetValue = METAMORPHO_VAULT.previewRedeem(totalShares);
        
        if (currentAssetValue <= totalStakedPrincipal) return;

        uint256 yield = currentAssetValue - totalStakedPrincipal;
        require(yield > 0, "No yield to harvest");

        // Withdraw ONLY the yield
        METAMORPHO_VAULT.withdraw(yield, address(this), address(this));

        // Split
        uint256 fundraiserShare = (yield * FUNDRAISER_SHARE) / TOTAL_BASIS;
        uint256 stakerShare = (yield * STAKER_SHARE) / TOTAL_BASIS;
        uint256 platformShare = (yield * PLATFORM_SHARE) / TOTAL_BASIS;

        USDT.safeTransfer(beneficiary, fundraiserShare);
        USDT.safeTransfer(platformWallet, platformShare);

        // Update Staker Yield Index
        if (totalStakedPrincipal > 0) {
            usdtRewardPerTokenStored += (stakerShare * 1e18) / totalStakedPrincipal;
        }

        emit YieldHarvested(yield, stakerShare);
    }

    // --- View Functions (Math) ---

    // 1. USDT Yield Math
    function earnedUSDT(address staker) public view returns (uint256) {
        return (stakerPrincipal[staker] * (usdtRewardPerTokenStored - userUsdtRewardPerTokenPaid[staker])) / 1e18;
    }

    // 2. FBT Reward Math
    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < periodFinish ? block.timestamp : periodFinish;
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalStakedPrincipal == 0) {
            return rewardPerTokenStored;
        }
        return rewardPerTokenStored + (
            (lastTimeRewardApplicable() - lastUpdateTime) * rewardRate * 1e18 / totalStakedPrincipal
        );
    }

    function earnedFBT(address account) public view returns (uint256) {
        return (
            (stakerPrincipal[account] * (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18
        ) + rewards[account];
    }

    // --- Admin (FBT Funding) ---

    function notifyRewardAmount(uint256 reward) external onlyOwner updateReward(address(0)) {
        require(FBT.balanceOf(address(this)) >= reward, "Insufficient FBT");

        if (block.timestamp >= periodFinish) {
            rewardRate = reward / rewardsDuration;
        } else {
            uint256 remaining = periodFinish - block.timestamp;
            uint256 leftover = remaining * rewardRate;
            rewardRate = (reward + leftover) / rewardsDuration;
        }

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + rewardsDuration;
        
        emit RewardAdded(reward);
    }
    
    function setRewardsDuration(uint256 _rewardsDuration) external onlyOwner {
        require(block.timestamp > periodFinish, "Period not finished");
        rewardsDuration = _rewardsDuration;
    }

    /**
     * @notice Pause the staking pool in case of emergency
     * @dev Only owner can pause
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the staking pool after emergency is resolved
     * @dev Only owner can unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}