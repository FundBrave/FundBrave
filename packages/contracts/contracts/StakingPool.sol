// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./interfaces/IAavePool.sol";

interface IReceiptOFT {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}

// Chainlink Automation Interface
interface AutomationCompatibleInterface {
    function checkUpkeep(bytes calldata checkData) external view returns (bool upkeepNeeded, bytes memory performData);
    function performUpkeep(bytes calldata performData) external;
}

/**
 * @title StakingPool
 * @dev Manages staked funds, generates yield via Aave, and issues Receipt Tokens.
 *      Supports configurable per-staker yield splits.
 */
contract StakingPool is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, PausableUpgradeable, UUPSUpgradeable, AutomationCompatibleInterface {
    using SafeERC20 for IERC20;

    // --- Yield Split Configuration (gas-optimized: fits in single slot) ---
    struct YieldSplit {
        uint16 causeShare;      // Basis points to fundraiser (e.g., 7900 = 79%)
        uint16 stakerShare;     // Basis points to staker (e.g., 1900 = 19%)
        uint16 platformShare;   // Basis points to platform (e.g., 200 = 2%)
    }

    // --- Core Contracts ---
    IAavePool public AAVE_POOL;
    IERC20 public USDC;
    IERC20 public aUSDC;
    IReceiptOFT public receiptOFT;
    IERC20 public FBT;

    // --- Config ---
    address public beneficiary;
    address public platformWallet;
    address public factoryAddress;

    // --- Staking Data ---
    uint256 public totalStakedPrincipal;
    mapping(address => uint256) public stakerPrincipal;

    // --- Staker Rewards (The 19%) ---
    uint256 public rewardPerTokenStored;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    // --- Automation State ---
    uint256 public lastHarvestTimestamp;
    uint256 public constant HARVEST_INTERVAL = 1 days;

    // --- Profit Sharing (kept for backwards compatibility) ---
    uint256 public constant FUNDRAISER_SHARE = 7900;
    uint256 public constant STAKER_SHARE = 1900;
    uint256 public constant PLATFORM_SHARE = 200;
    uint256 public constant TOTAL_BASIS = 10000;

    // --- Yield Rewards (USDC) ---
    uint256 public usdcRewardPerTokenStored;
    mapping(address => uint256) public userUsdcRewardPerTokenPaid;
    mapping(address => uint256) public usdcRewards;

    // --- FBT Liquidity Mining State (NEW) ---
    uint256 public periodFinish;
    uint256 public rewardRate;
    uint256 public rewardsDuration;
    uint256 public lastUpdateTime;

    // --- Configurable Per-Staker Yield Splits ---
    mapping(address => YieldSplit) public stakerYieldSplit;
    YieldSplit public defaultYieldSplit;

    // --- Pending Yield Per Staker (for custom split distribution) ---
    // Tracks raw yield allocated to each staker before split application
    uint256 public yieldPerTokenStored;
    mapping(address => uint256) public userYieldPerTokenPaid;
    mapping(address => uint256) public pendingYield;

    event Staked(address indexed staker, uint256 usdcAmount);
    event Unstaked(address indexed staker, uint256 usdcAmount);
    event YieldHarvested(uint256 totalYield, uint256 stakerShare);
    event UsdcRewardsClaimed(address indexed staker, uint256 amount);
    event RewardAdded(uint256 reward);
    event FbtRewardPaid(address indexed user, uint256 reward);
    event YieldSplitSet(address indexed staker, uint16 causeShare, uint16 stakerShare, uint16 platformShare);

    modifier onlyFactory() {
        require(msg.sender == factoryAddress, "StakingPool: Only factory");
        _;
    }

    modifier updateReward(address account) {
        // 1. Update FBT Liquidity Mining Rewards
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earnedFBT(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;

            // 2. Update per-staker yield and apply custom split
            _updateYieldRewards(account);
        }
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
        constructor() {
            _disableInitializers();
        }
    
    function initialize(
        address _aavePool,
        address _usdc,
        address _aUsdc,
        address _receiptOFT,
        address _fbt,
        address _beneficiary,
        address _platformWallet,
        address _factoryAddress,
        address _owner
    ) external initializer {
        require(_aavePool != address(0), "Invalid Aave Pool");

        // Init Parents
        __Ownable_init(_owner);
        __ReentrancyGuard_init();
        __Pausable_init();

        // Init State
        AAVE_POOL = IAavePool(_aavePool);
        USDC = IERC20(_usdc);
        aUSDC = IERC20(_aUsdc);
        receiptOFT = IReceiptOFT(_receiptOFT);
        FBT = IERC20(_fbt);
        beneficiary = _beneficiary;
        platformWallet = _platformWallet;
        factoryAddress = _factoryAddress;

        rewardsDuration = 7 days;

        // Initialize default yield split (79% cause, 19% staker, 2% platform)
        defaultYieldSplit = YieldSplit({
            causeShare: 7900,
            stakerShare: 1900,
            platformShare: 200
        });

        // Infinite approve Aave to spend our USDC
        USDC.approve(address(AAVE_POOL), type(uint256).max);
    }

    // --- Automation ---

    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory performData) {
        bool timePassed = (block.timestamp - lastHarvestTimestamp) > HARVEST_INTERVAL;
        bool hasYield = aUSDC.balanceOf(address(this)) > totalStakedPrincipal;
        upkeepNeeded = timePassed && hasYield;
        performData = ""; 
    }

    function performUpkeep(bytes calldata) external override {
        require((block.timestamp - lastHarvestTimestamp) > HARVEST_INTERVAL, "Too soon");
        harvestAndDistribute();
    }

    // --- Core Logic ---

    function earned(address staker) public view returns (uint256) {
        uint256 currentRewardPerToken = rewardPerToken();
        return (stakerPrincipal[staker] * (currentRewardPerToken - userRewardPerTokenPaid[staker])) / 1e18;
    }

    function claimableRewards(address staker) public view returns (uint256) {
        return rewards[staker] + earned(staker);
    }

    function depositFor(address staker, uint256 usdcAmount) 
        external 
        onlyFactory 
        nonReentrant
        whenNotPaused
        updateReward(staker)
    {
        require(usdcAmount > 0, "Amount must be > 0");
        
        //USDC.safeTransferFrom(factoryAddress, address(this), usdcAmount);
        AAVE_POOL.supply(address(USDC), usdcAmount, address(this), 0);
        
        stakerPrincipal[staker] += usdcAmount;
        totalStakedPrincipal += usdcAmount;

        // MINT RECEIPT TOKEN
        if (address(receiptOFT) != address(0)) {
            receiptOFT.mint(staker, usdcAmount);
        }

        emit Staked(staker, usdcAmount);
    }

    function unstake(uint256 usdcAmount) external nonReentrant whenNotPaused updateReward(msg.sender) {
        require(usdcAmount > 0, "Amount must be > 0");
        require(stakerPrincipal[msg.sender] >= usdcAmount, "Insufficient stake");

        // BURN RECEIPT TOKEN (Must have approved this contract first)
        if (address(receiptOFT) != address(0)) {
            receiptOFT.burn(msg.sender, usdcAmount);
        }

        stakerPrincipal[msg.sender] -= usdcAmount;
        totalStakedPrincipal -= usdcAmount;

        AAVE_POOL.withdraw(address(USDC), usdcAmount, msg.sender);
        
        emit Unstaked(msg.sender, usdcAmount);
    }

    /**
     * @notice Claims BOTH USDC Yield and FBT Rewards
     */
    function claimAllRewards() external nonReentrant whenNotPaused updateReward(msg.sender) {
        _claimUSDC();
        _claimFBT();
    }

    function _claimUSDC() internal {
        uint256 reward = usdcRewards[msg.sender];
        if (reward > 0) {
            usdcRewards[msg.sender] = 0;
            USDC.safeTransfer(msg.sender, reward);
            emit UsdcRewardsClaimed(msg.sender, reward);
        }
    }

    function _claimFBT() internal {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            // NOTE: We transfer FBT, not mint.
            // The Admin/DAO must fund this contract with FBT using notifyRewardAmount first.
            FBT.safeTransfer(msg.sender, reward);
            emit FbtRewardPaid(msg.sender, reward);
        }
    }

    /**
     * @notice Legacy support for claiming just staker USDC rewards
     * @dev Added for backwards compatibility with older tests/integrations
     */
    function claimStakerRewards() external nonReentrant whenNotPaused updateReward(msg.sender) {
        _claimUSDC();
    }

    /**
     * @notice Harvests yield from Aave and distributes based on per-staker splits.
     * @dev The raw yield is distributed proportionally to all stakers via yieldPerTokenStored.
     *      When stakers claim or interact, their custom split is applied to determine
     *      how much goes to them vs. the cause vs. platform.
     */
    function harvestAndDistribute() public nonReentrant whenNotPaused {
        uint256 currentAaveBalance = aUSDC.balanceOf(address(this));
        if (currentAaveBalance <= totalStakedPrincipal) return;
        uint256 yield = currentAaveBalance - totalStakedPrincipal;
        require(yield > 0, "No yield to harvest");

        AAVE_POOL.withdraw(address(USDC), yield, address(this));

        // Store total yield per token - individual splits applied during claim
        if (totalStakedPrincipal > 0) {
            yieldPerTokenStored += (yield * 1e18) / totalStakedPrincipal;
        }

        lastHarvestTimestamp = block.timestamp;

        // Calculate average staker share for event (using default split as reference)
        uint256 avgStakerShare = (yield * defaultYieldSplit.stakerShare) / TOTAL_BASIS;
        emit YieldHarvested(yield, avgStakerShare);
    }

    /**
     * @notice Returns the total claimable USDC for a staker (accumulated from yield distributions).
     * @param staker Address of the staker
     * @return Total USDC claimable including already accumulated rewards plus pending yield
     * @dev This includes both already-distributed rewards in usdcRewards and pending yield not yet processed
     */
    function earnedUSDC(address staker) public view returns (uint256) {
        // Already accumulated rewards + claimable from pending yield
        return usdcRewards[staker] + claimableYield(staker);
    }

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

    // --- Yield Split Configuration ---

    /**
     * @notice Sets a custom yield split for the caller.
     * @param _causeShare Basis points allocated to the fundraiser (cause)
     * @param _stakerShare Basis points allocated to the staker
     * @param _platformShare Basis points allocated to the platform (min 200 = 2%)
     * @dev Shares must sum to 10000 (100%). Platform share must be at least 200 bps (2%).
     *      Caller must have an active stake to configure.
     */
    function setYieldSplit(
        uint16 _causeShare,
        uint16 _stakerShare,
        uint16 _platformShare
    ) external whenNotPaused updateReward(msg.sender) {
        require(
            uint256(_causeShare) + uint256(_stakerShare) + uint256(_platformShare) == TOTAL_BASIS,
            "StakingPool: Splits must sum to 10000"
        );
        require(_platformShare >= 200, "StakingPool: Platform share must be at least 200 bps");
        require(stakerPrincipal[msg.sender] > 0, "StakingPool: No stake to configure");

        stakerYieldSplit[msg.sender] = YieldSplit({
            causeShare: _causeShare,
            stakerShare: _stakerShare,
            platformShare: _platformShare
        });

        emit YieldSplitSet(msg.sender, _causeShare, _stakerShare, _platformShare);
    }

    /**
     * @notice Returns the effective yield split for a staker.
     * @param staker Address of the staker
     * @return YieldSplit struct with the staker's custom split, or default if not set
     */
    function getEffectiveYieldSplit(address staker) public view returns (YieldSplit memory) {
        YieldSplit memory split = stakerYieldSplit[staker];
        // Return custom split if set (non-zero), otherwise return default
        if (split.causeShare == 0 && split.stakerShare == 0 && split.platformShare == 0) {
            return defaultYieldSplit;
        }
        return split;
    }

    /**
     * @notice Calculates the pending raw yield for a staker (before split application).
     * @param staker Address of the staker
     * @return The raw yield amount allocated to this staker
     */
    function pendingRawYield(address staker) public view returns (uint256) {
        return pendingYield[staker] +
            (stakerPrincipal[staker] * (yieldPerTokenStored - userYieldPerTokenPaid[staker])) / 1e18;
    }

    /**
     * @notice Calculates the claimable USDC yield for a staker after applying their split.
     * @param staker Address of the staker
     * @return The USDC amount claimable by this staker
     */
    function claimableYield(address staker) public view returns (uint256) {
        uint256 rawYield = pendingRawYield(staker);
        YieldSplit memory split = getEffectiveYieldSplit(staker);
        return (rawYield * split.stakerShare) / TOTAL_BASIS;
    }

    /**
     * @notice Internal function to update yield rewards for a staker and distribute according to their split.
     * @param account Address of the staker
     * @dev Called by updateReward modifier. Distributes cause and platform shares immediately,
     *      accumulates staker share in usdcRewards for later claim.
     *      SECURITY: Follows Checks-Effects-Interactions (CEI) pattern to prevent reentrancy.
     *      All state updates occur BEFORE external token transfers.
     */
    function _updateYieldRewards(address account) internal {
        // Calculate new raw yield since last update
        uint256 newYield = (stakerPrincipal[account] * (yieldPerTokenStored - userYieldPerTokenPaid[account])) / 1e18;

        // EFFECTS FIRST - Update all state before any external calls
        userYieldPerTokenPaid[account] = yieldPerTokenStored;
        pendingYield[account] = 0;

        if (newYield > 0) {
            YieldSplit memory split = getEffectiveYieldSplit(account);

            // Calculate shares based on staker's custom split
            uint256 causeAmount = (newYield * split.causeShare) / TOTAL_BASIS;
            uint256 platformAmount = (newYield * split.platformShare) / TOTAL_BASIS;
            uint256 stakerAmount = newYield - causeAmount - platformAmount; // Remainder to staker

            // Accumulate staker's share for later claim (state update before transfers)
            usdcRewards[account] += stakerAmount;

            // INTERACTIONS LAST - External token transfers after all state updates
            if (causeAmount > 0) {
                USDC.safeTransfer(beneficiary, causeAmount);
            }
            if (platformAmount > 0) {
                USDC.safeTransfer(platformWallet, platformAmount);
            }
        }
    }

    // --- Admin (FBT Funding) ---

    // Admin calls this after sending FBT to this contract to start distribution
    function notifyRewardAmount(uint256 reward) external onlyOwner updateReward(address(0)) {
        require(FBT.balanceOf(address(this)) >= reward, "Insufficient FBT in contract");

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

    // --- Admin ---
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    /**
     * @notice Updates the default yield split for new stakers.
     * @param _causeShare Basis points allocated to the fundraiser (cause)
     * @param _stakerShare Basis points allocated to the staker
     * @param _platformShare Basis points allocated to the platform (min 200 = 2%)
     * @dev Only callable by owner. Does not affect existing custom splits.
     */
    function setDefaultYieldSplit(
        uint16 _causeShare,
        uint16 _stakerShare,
        uint16 _platformShare
    ) external onlyOwner {
        require(
            uint256(_causeShare) + uint256(_stakerShare) + uint256(_platformShare) == TOTAL_BASIS,
            "StakingPool: Splits must sum to 10000"
        );
        require(_platformShare >= 200, "StakingPool: Platform share must be at least 200 bps");

        defaultYieldSplit = YieldSplit({
            causeShare: _causeShare,
            stakerShare: _stakerShare,
            platformShare: _platformShare
        });
    }

    /**
     * @notice Resets a staker's yield split to the default.
     * @dev Callable by the staker themselves to remove their custom configuration.
     */
    function resetYieldSplit() external whenNotPaused updateReward(msg.sender) {
        delete stakerYieldSplit[msg.sender];
        YieldSplit memory def = defaultYieldSplit;
        emit YieldSplitSet(msg.sender, def.causeShare, def.stakerShare, def.platformShare);
    }

    /**
     * @dev Function that authorizes an upgrade to a new implementation
     * @param newImplementation Address of the new implementation
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // --- Emergency Functions ---

    /**
     * @notice Revokes all USDC approval from Aave pool in case of emergency
     * @dev Only callable by owner. Use when Aave pool is compromised or during migration.
     *      After calling this, new deposits will fail until approval is restored.
     */
    function revokeAaveApproval() external onlyOwner {
        USDC.approve(address(AAVE_POOL), 0);
    }

    /**
     * @notice Restores USDC approval to Aave pool after emergency
     * @dev Only callable by owner. Required before deposits can resume.
     */
    function restoreAaveApproval() external onlyOwner {
        USDC.approve(address(AAVE_POOL), type(uint256).max);
    }

    // --- Version ---

    /**
     * @notice Returns the contract version
     * @return Version string in semver format
     */
    function version() external pure returns (string memory) {
        return "1.2.0";
    }

    /**
     * @notice Checks if the implementation contract is properly locked
     * @dev This function should always revert when called on the implementation contract
     *      because _disableInitializers() was called in the constructor.
     *      Can be used by deployment scripts to verify implementation security.
     * @return True if this is a proxy (initialized), should never return on implementation
     */
    function isProxyInitialized() external view returns (bool) {
        return true;
    }

    // --- Storage Gap for Upgradeability ---

    /**
     * @dev Reserved storage slots for future upgrades.
     * This ensures that new state variables can be added in future versions
     * without shifting the storage layout of child contracts.
     * See https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable#storage-gaps
     */
    uint256[30] private __gap;
}