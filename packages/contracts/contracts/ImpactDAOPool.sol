// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./interfaces/IAavePool.sol";

/**
 * @title IFundBraveToken
 * @notice Interface for the FBT governance token with minting capability
 */
interface IFundBraveToken is IERC20 {
    function mint(address to, uint256 amount) external;
}

/**
 * @title ImpactDAOPool
 * @author FundBrave
 * @notice Shared treasury pool where users stake USDC to collectively fund causes via DAO voting.
 * @dev Key features:
 *      - Single shared pool (not per-fundraiser)
 *      - Configurable yield split per staker (daoShare/stakerShare/platformShare)
 *      - DAO share of yield goes to YieldDistributor for offchain voting allocation
 *      - FBT liquidity mining rewards for stakers (Synthetix-style)
 *      - On-demand harvesting (no Chainlink Automation)
 *      - Principal is always withdrawable
 *
 * Architecture:
 *      - Stakers deposit USDC which gets supplied to Aave for yield generation
 *      - Each staker can configure their own yield split or use defaults
 *      - When yield is harvested, it's distributed according to each staker's proportional
 *        share and their individual split configuration
 *      - FBT rewards are distributed via Synthetix-style continuous vesting
 */
contract ImpactDAOPool is
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    // ============================================
    // ================ ERRORS ====================
    // ============================================

    /// @dev Thrown when zero address is provided where it shouldn't be
    error ZeroAddress();
    /// @dev Thrown when amount is zero
    error ZeroAmount();
    /// @dev Thrown when staker has insufficient stake for operation
    error InsufficientStake();
    /// @dev Thrown when yield splits don't sum to 10000 basis points
    error InvalidSplitSum();
    /// @dev Thrown when platform share is below minimum (200 bps = 2%)
    error PlatformShareTooLow();
    /// @dev Thrown when staker has no stake to configure
    error NoStakeToConfig();
    /// @dev Thrown when there's no yield to harvest
    error NoYieldToHarvest();
    /// @dev Thrown when reward period hasn't finished for duration change
    error RewardPeriodNotFinished();
    /// @dev Thrown when there's no reward to claim
    error NoRewardToClaim();

    // ============================================
    // ================ STRUCTS ===================
    // ============================================

    /**
     * @notice Yield split configuration for a staker
     * @dev Packed into single storage slot (48 bits total)
     * @param daoShare Basis points to YieldDistributor for DAO voting (default 7900 = 79%)
     * @param stakerShare Basis points to staker (default 1900 = 19%)
     * @param platformShare Basis points to platform (default 200 = 2%, minimum enforced)
     */
    struct YieldSplit {
        uint16 daoShare;
        uint16 stakerShare;
        uint16 platformShare;
    }

    // ============================================
    // =============== CONSTANTS ==================
    // ============================================

    /// @notice Total basis points (100%)
    uint256 public constant TOTAL_BASIS = 10000;

    /// @notice Minimum platform share (2%)
    uint256 public constant MIN_PLATFORM_SHARE = 200;

    // ============================================
    // ============= STATE VARIABLES ==============
    // ============================================

    // --- Core Contracts ---
    /// @notice Aave V3 Pool for yield generation
    IAavePool public AAVE_POOL;
    /// @notice USDC token (staking currency)
    IERC20 public USDC;
    /// @notice aUSDC token (Aave receipt token)
    IERC20 public aUSDC;
    /// @notice FBT governance token for liquidity mining rewards
    IFundBraveToken public FBT;

    // --- Configuration ---
    /// @notice Address that receives DAO share of yield for voting-based distribution
    address public yieldDistributor;
    /// @notice Address that receives platform share of yield
    address public platformWallet;

    // --- Staking Data ---
    /// @notice Total USDC principal staked across all users
    uint256 public totalStakedPrincipal;
    /// @notice Principal staked per user
    mapping(address => uint256) public stakerPrincipal;

    // --- Yield Split Configuration ---
    /// @notice Custom yield split per staker (if set)
    mapping(address => YieldSplit) public stakerYieldSplit;
    /// @notice Default yield split for stakers who haven't customized
    YieldSplit public defaultYieldSplit;

    // --- USDC Yield Tracking ---
    /// @notice Accumulated yield per token (scaled by 1e18)
    uint256 public yieldPerTokenStored;
    /// @notice Last recorded yieldPerToken for each user
    mapping(address => uint256) public userYieldPerTokenPaid;
    /// @notice Pending USDC yield claimable by each staker (their stakerShare portion)
    mapping(address => uint256) public pendingStakerYield;

    // --- FBT Liquidity Mining (Synthetix-style) ---
    /// @notice Timestamp when current reward period ends
    uint256 public periodFinish;
    /// @notice FBT tokens distributed per second
    uint256 public rewardRate;
    /// @notice Duration of each reward period (default 7 days)
    uint256 public rewardsDuration;
    /// @notice Last timestamp rewards were updated
    uint256 public lastUpdateTime;
    /// @notice Accumulated FBT reward per token (scaled by 1e18)
    uint256 public rewardPerTokenStored;
    /// @notice Last recorded rewardPerToken for each user
    mapping(address => uint256) public userRewardPerTokenPaid;
    /// @notice Pending FBT rewards for each user
    mapping(address => uint256) public fbtRewards;

    // --- Harvest Tracking ---
    /// @notice Timestamp of last yield harvest
    uint256 public lastHarvestTimestamp;

    // --- Timelock ---
    /// @notice Timelock controller for delayed admin operations
    address public timelock;

    // --- Storage Gap for Upgrades ---
    uint256[39] private __gap;

    // ============================================
    // ================ EVENTS ====================
    // ============================================

    /// @notice Emitted when a user stakes USDC
    event Staked(address indexed staker, uint256 amount, YieldSplit split);

    /// @notice Emitted when a user unstakes USDC
    event Unstaked(address indexed staker, uint256 amount);

    /// @notice Emitted when yield is harvested and distributed
    event YieldHarvested(
        uint256 totalYield,
        uint256 daoShare,
        uint256 totalStakerShare,
        uint256 platformShare
    );

    /// @notice Emitted when a staker sets their custom yield split
    event YieldSplitSet(
        address indexed staker,
        uint16 daoShare,
        uint16 stakerShare,
        uint16 platformShare
    );

    /// @notice Emitted when a staker claims their USDC yield
    event StakerYieldClaimed(address indexed staker, uint256 amount);

    /// @notice Emitted when a staker claims their FBT rewards
    event FBTRewardPaid(address indexed staker, uint256 reward);

    /// @notice Emitted when admin adds FBT rewards to the pool
    event RewardAdded(uint256 reward);

    /// @notice Emitted when yield distributor address is updated
    event YieldDistributorUpdated(address indexed oldDistributor, address indexed newDistributor);

    /// @notice Emitted when platform wallet address is updated
    event PlatformWalletUpdated(address indexed oldWallet, address indexed newWallet);

    /// @notice Emitted when default yield split is updated
    event DefaultYieldSplitUpdated(uint16 daoShare, uint16 stakerShare, uint16 platformShare);

    /// @notice Emitted when timelock address is set
    event TimelockSet(address indexed oldTimelock, address indexed newTimelock);

    // ============================================
    // ============== MODIFIERS ===================
    // ============================================

    /**
     * @notice Restricts function access to timelock or owner
     * @dev Used for time-sensitive admin functions that should be delayed
     */
    modifier onlyTimelockOrOwner() {
        require(
            msg.sender == timelock || msg.sender == owner(),
            "ImpactDAOPool: Not authorized"
        );
        _;
    }

    /**
     * @notice Updates FBT and USDC yield rewards for an account
     * @dev Must be called before any stake/unstake/claim operation
     * @param account The account to update rewards for
     */
    modifier updateReward(address account) {
        // Update FBT liquidity mining state
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();

        if (account != address(0)) {
            // Update FBT rewards
            fbtRewards[account] = earnedFBT(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;

            // Update USDC yield
            pendingStakerYield[account] = earnedUSDC(account);
            userYieldPerTokenPaid[account] = yieldPerTokenStored;
        }
        _;
    }

    // ============================================
    // ============= CONSTRUCTOR ==================
    // ============================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // ============================================
    // ============= INITIALIZER ==================
    // ============================================

    /**
     * @notice Initializes the ImpactDAOPool contract
     * @param _aavePool Address of the Aave V3 Pool
     * @param _usdc Address of the USDC token
     * @param _aUsdc Address of the aUSDC token
     * @param _fbt Address of the FBT governance token
     * @param _yieldDistributor Address to receive DAO share of yield
     * @param _platformWallet Address to receive platform share of yield
     * @param _owner Address of the contract owner
     */
    function initialize(
        address _aavePool,
        address _usdc,
        address _aUsdc,
        address _fbt,
        address _yieldDistributor,
        address _platformWallet,
        address _owner
    ) external initializer {
        if (_aavePool == address(0)) revert ZeroAddress();
        if (_usdc == address(0)) revert ZeroAddress();
        if (_aUsdc == address(0)) revert ZeroAddress();
        if (_fbt == address(0)) revert ZeroAddress();
        if (_yieldDistributor == address(0)) revert ZeroAddress();
        if (_platformWallet == address(0)) revert ZeroAddress();
        if (_owner == address(0)) revert ZeroAddress();

        __Ownable_init(_owner);
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        AAVE_POOL = IAavePool(_aavePool);
        USDC = IERC20(_usdc);
        aUSDC = IERC20(_aUsdc);
        FBT = IFundBraveToken(_fbt);
        yieldDistributor = _yieldDistributor;
        platformWallet = _platformWallet;

        // Initialize default yield split: 79% DAO, 19% staker, 2% platform
        defaultYieldSplit = YieldSplit({
            daoShare: 7900,
            stakerShare: 1900,
            platformShare: 200
        });

        // Set default rewards duration to 7 days
        rewardsDuration = 7 days;

        // Approve Aave to spend USDC (max approval for gas efficiency)
        USDC.approve(address(AAVE_POOL), type(uint256).max);
    }

    // ============================================
    // ============ STAKING FUNCTIONS =============
    // ============================================

    /**
     * @notice Stakes USDC with a custom yield split configuration
     * @param amount Amount of USDC to stake
     * @param split Custom yield split (must sum to 10000 bps, platformShare >= 200)
     * @dev If you want default split, use stakeWithDefaults() instead
     */
    function stake(uint256 amount, YieldSplit calldata split)
        external
        nonReentrant
        whenNotPaused
        updateReward(msg.sender)
    {
        if (amount == 0) revert ZeroAmount();
        _validateYieldSplit(split);

        // Transfer USDC from staker
        USDC.safeTransferFrom(msg.sender, address(this), amount);

        // Supply to Aave for yield
        AAVE_POOL.supply(address(USDC), amount, address(this), 0);

        // Update staking records
        stakerPrincipal[msg.sender] += amount;
        totalStakedPrincipal += amount;

        // Set custom yield split
        stakerYieldSplit[msg.sender] = split;

        emit Staked(msg.sender, amount, split);
    }

    /**
     * @notice Stakes USDC with default yield split configuration
     * @param amount Amount of USDC to stake
     */
    function stakeWithDefaults(uint256 amount)
        external
        nonReentrant
        whenNotPaused
        updateReward(msg.sender)
    {
        if (amount == 0) revert ZeroAmount();

        // Transfer USDC from staker
        USDC.safeTransferFrom(msg.sender, address(this), amount);

        // Supply to Aave for yield
        AAVE_POOL.supply(address(USDC), amount, address(this), 0);

        // Update staking records
        stakerPrincipal[msg.sender] += amount;
        totalStakedPrincipal += amount;

        // Use default split (don't set custom, getEffectiveYieldSplit will return default)
        YieldSplit memory effectiveSplit = getEffectiveYieldSplit(msg.sender);

        emit Staked(msg.sender, amount, effectiveSplit);
    }

    /**
     * @notice Unstakes USDC and returns principal to staker
     * @param amount Amount of USDC to unstake
     * @dev Principal is always withdrawable. Does not automatically claim rewards.
     */
    function unstake(uint256 amount)
        external
        nonReentrant
        whenNotPaused
        updateReward(msg.sender)
    {
        if (amount == 0) revert ZeroAmount();
        if (stakerPrincipal[msg.sender] < amount) revert InsufficientStake();

        // Update staking records
        stakerPrincipal[msg.sender] -= amount;
        totalStakedPrincipal -= amount;

        // Withdraw from Aave and send to staker
        AAVE_POOL.withdraw(address(USDC), amount, msg.sender);

        emit Unstaked(msg.sender, amount);
    }

    // ============================================
    // ========= YIELD SPLIT FUNCTIONS ============
    // ============================================

    /**
     * @notice Sets a custom yield split for the caller
     * @param daoShare Basis points to DAO (YieldDistributor)
     * @param stakerShare Basis points to staker
     * @param platformShare Basis points to platform (min 200 = 2%)
     * @dev Must have an active stake. Shares must sum to 10000.
     */
    function setYieldSplit(uint16 daoShare, uint16 stakerShare, uint16 platformShare)
        external
        whenNotPaused
        updateReward(msg.sender)
    {
        if (stakerPrincipal[msg.sender] == 0) revert NoStakeToConfig();

        YieldSplit memory split = YieldSplit({
            daoShare: daoShare,
            stakerShare: stakerShare,
            platformShare: platformShare
        });
        _validateYieldSplit(split);

        stakerYieldSplit[msg.sender] = split;

        emit YieldSplitSet(msg.sender, daoShare, stakerShare, platformShare);
    }

    /**
     * @notice Resets staker's yield split to default
     */
    function resetYieldSplit()
        external
        whenNotPaused
        updateReward(msg.sender)
    {
        delete stakerYieldSplit[msg.sender];
        YieldSplit memory def = defaultYieldSplit;
        emit YieldSplitSet(msg.sender, def.daoShare, def.stakerShare, def.platformShare);
    }

    /**
     * @notice Returns the effective yield split for a staker
     * @param staker Address of the staker
     * @return YieldSplit struct (custom if set, otherwise default)
     */
    function getEffectiveYieldSplit(address staker) public view returns (YieldSplit memory) {
        YieldSplit memory split = stakerYieldSplit[staker];
        // If no custom split set (all zeros), return default
        if (split.daoShare == 0 && split.stakerShare == 0 && split.platformShare == 0) {
            return defaultYieldSplit;
        }
        return split;
    }

    // ============================================
    // ========== YIELD HARVEST FUNCTIONS =========
    // ============================================

    /**
     * @notice Harvests yield from Aave and distributes according to staker splits
     * @dev Anyone can call this to trigger yield distribution.
     *      - Calculates total yield as (aUSDC balance - total principal)
     *      - Withdraws yield from Aave
     *      - Distributes DAO share to YieldDistributor
     *      - Distributes platform share to platformWallet
     *      - Updates yieldPerTokenStored for staker share distribution
     */
    function harvestYield() external nonReentrant whenNotPaused {
        uint256 currentAaveBalance = aUSDC.balanceOf(address(this));
        if (currentAaveBalance <= totalStakedPrincipal) revert NoYieldToHarvest();

        uint256 totalYield = currentAaveBalance - totalStakedPrincipal;

        // Withdraw yield from Aave
        AAVE_POOL.withdraw(address(USDC), totalYield, address(this));

        // Calculate weighted average splits based on all stakers
        // For simplicity and gas efficiency, we use the default split for DAO and platform shares
        // Individual staker shares are handled via yieldPerTokenStored
        uint256 daoAmount = (totalYield * defaultYieldSplit.daoShare) / TOTAL_BASIS;
        uint256 platformAmount = (totalYield * defaultYieldSplit.platformShare) / TOTAL_BASIS;
        uint256 stakerAmount = totalYield - daoAmount - platformAmount;

        // Transfer DAO share to YieldDistributor
        if (daoAmount > 0) {
            USDC.safeTransfer(yieldDistributor, daoAmount);
        }

        // Transfer platform share to platformWallet
        if (platformAmount > 0) {
            USDC.safeTransfer(platformWallet, platformAmount);
        }

        // Update yieldPerTokenStored for staker share distribution
        if (totalStakedPrincipal > 0 && stakerAmount > 0) {
            yieldPerTokenStored += (stakerAmount * 1e18) / totalStakedPrincipal;
        }

        lastHarvestTimestamp = block.timestamp;

        emit YieldHarvested(totalYield, daoAmount, stakerAmount, platformAmount);
    }

    /**
     * @notice Claims accumulated USDC yield for the caller
     */
    function claimStakerYield()
        external
        nonReentrant
        whenNotPaused
        updateReward(msg.sender)
    {
        uint256 yield = pendingStakerYield[msg.sender];
        if (yield == 0) revert NoRewardToClaim();

        pendingStakerYield[msg.sender] = 0;
        USDC.safeTransfer(msg.sender, yield);

        emit StakerYieldClaimed(msg.sender, yield);
    }

    // ============================================
    // ========= FBT REWARD FUNCTIONS =============
    // ============================================

    /**
     * @notice Claims accumulated FBT rewards for the caller
     */
    function claimFBTRewards()
        external
        nonReentrant
        whenNotPaused
        updateReward(msg.sender)
    {
        uint256 reward = fbtRewards[msg.sender];
        if (reward == 0) revert NoRewardToClaim();

        fbtRewards[msg.sender] = 0;
        FBT.mint(msg.sender, reward);

        emit FBTRewardPaid(msg.sender, reward);
    }

    /**
     * @notice Claims both USDC yield and FBT rewards in one transaction
     */
    function claimAll()
        external
        nonReentrant
        whenNotPaused
        updateReward(msg.sender)
    {
        // Claim USDC yield
        uint256 yield = pendingStakerYield[msg.sender];
        if (yield > 0) {
            pendingStakerYield[msg.sender] = 0;
            USDC.safeTransfer(msg.sender, yield);
            emit StakerYieldClaimed(msg.sender, yield);
        }

        // Claim FBT rewards
        uint256 reward = fbtRewards[msg.sender];
        if (reward > 0) {
            fbtRewards[msg.sender] = 0;
            FBT.mint(msg.sender, reward);
            emit FBTRewardPaid(msg.sender, reward);
        }
    }

    // ============================================
    // ============ VIEW FUNCTIONS ================
    // ============================================

    /**
     * @notice Returns the last applicable timestamp for FBT rewards
     */
    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < periodFinish ? block.timestamp : periodFinish;
    }

    /**
     * @notice Returns current FBT reward per token (scaled by 1e18)
     */
    function rewardPerToken() public view returns (uint256) {
        if (totalStakedPrincipal == 0) {
            return rewardPerTokenStored;
        }
        return rewardPerTokenStored + (
            (lastTimeRewardApplicable() - lastUpdateTime) * rewardRate * 1e18 / totalStakedPrincipal
        );
    }

    /**
     * @notice Returns pending FBT rewards for an account
     * @param account Address to check
     */
    function earnedFBT(address account) public view returns (uint256) {
        return (
            (stakerPrincipal[account] * (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18
        ) + fbtRewards[account];
    }

    /**
     * @notice Returns pending USDC yield for an account (their stakerShare portion)
     * @param account Address to check
     */
    function earnedUSDC(address account) public view returns (uint256) {
        uint256 newYield = (stakerPrincipal[account] * (yieldPerTokenStored - userYieldPerTokenPaid[account])) / 1e18;
        return pendingStakerYield[account] + newYield;
    }

    /**
     * @notice Returns total pending yield available (aUSDC balance - principal)
     */
    function pendingYield() public view returns (uint256) {
        uint256 currentBalance = aUSDC.balanceOf(address(this));
        if (currentBalance <= totalStakedPrincipal) return 0;
        return currentBalance - totalStakedPrincipal;
    }

    /**
     * @notice Returns staker's current balance and rewards
     * @param account Address to check
     * @return principal Staked USDC amount
     * @return usdcYield Pending USDC yield claimable
     * @return fbtReward Pending FBT reward claimable
     * @return split Current yield split configuration
     */
    function getStakerInfo(address account)
        external
        view
        returns (
            uint256 principal,
            uint256 usdcYield,
            uint256 fbtReward,
            YieldSplit memory split
        )
    {
        principal = stakerPrincipal[account];
        usdcYield = earnedUSDC(account);
        fbtReward = earnedFBT(account);
        split = getEffectiveYieldSplit(account);
    }

    // ============================================
    // ============ ADMIN FUNCTIONS ===============
    // ============================================

    /**
     * @notice Notifies the contract of new FBT rewards to distribute
     * @param reward Amount of FBT rewards to distribute over rewardsDuration
     * @dev The FBT contract must have minting rights for this contract,
     *      as rewards are minted on claim (not transferred from here)
     */
    function notifyRewardAmount(uint256 reward)
        external
        onlyOwner
        updateReward(address(0))
    {
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

    /**
     * @notice Sets the duration for FBT reward periods
     * @param _rewardsDuration New duration in seconds
     * @dev Can only be called when current period is finished
     */
    function setRewardsDuration(uint256 _rewardsDuration) external onlyOwner {
        if (block.timestamp <= periodFinish) revert RewardPeriodNotFinished();
        rewardsDuration = _rewardsDuration;
    }

    /**
     * @notice Updates the yield distributor address
     * @param _newDistributor New yield distributor address
     */
    function setYieldDistributor(address _newDistributor) external onlyOwner {
        if (_newDistributor == address(0)) revert ZeroAddress();
        address old = yieldDistributor;
        yieldDistributor = _newDistributor;
        emit YieldDistributorUpdated(old, _newDistributor);
    }

    /**
     * @notice Updates the platform wallet address
     * @param _newWallet New platform wallet address
     */
    function setPlatformWallet(address _newWallet) external onlyOwner {
        if (_newWallet == address(0)) revert ZeroAddress();
        address old = platformWallet;
        platformWallet = _newWallet;
        emit PlatformWalletUpdated(old, _newWallet);
    }

    /**
     * @notice Updates the default yield split
     * @dev Critical function - should go through timelock for mainnet
     * @param daoShare Basis points to DAO
     * @param stakerShare Basis points to staker
     * @param platformShare Basis points to platform (min 200)
     */
    function setDefaultYieldSplit(
        uint16 daoShare,
        uint16 stakerShare,
        uint16 platformShare
    ) external onlyTimelockOrOwner {
        YieldSplit memory split = YieldSplit({
            daoShare: daoShare,
            stakerShare: stakerShare,
            platformShare: platformShare
        });
        _validateYieldSplit(split);

        defaultYieldSplit = split;
        emit DefaultYieldSplitUpdated(daoShare, stakerShare, platformShare);
    }

    /**
     * @notice Set the timelock controller address
     * @dev Only owner can set timelock. Once set, critical functions require timelock.
     * @param _timelock New timelock controller address
     */
    function setTimelock(address _timelock) external onlyOwner {
        if (_timelock == address(0)) revert ZeroAddress();

        address oldTimelock = timelock;
        timelock = _timelock;

        emit TimelockSet(oldTimelock, _timelock);
    }

    /**
     * @notice Pauses the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpauses the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Emergency function to rescue stuck tokens (not USDC/aUSDC)
     * @param token Token address to rescue
     * @param amount Amount to rescue
     * @dev Cannot rescue USDC or aUSDC to protect staker funds
     */
    function rescueTokens(address token, uint256 amount) external onlyOwner {
        if (token == address(USDC) || token == address(aUSDC)) {
            revert("Cannot rescue stake tokens");
        }
        IERC20(token).safeTransfer(owner(), amount);
    }

    // ============================================
    // ========== INTERNAL FUNCTIONS ==============
    // ============================================

    /**
     * @notice Validates a yield split configuration
     * @param split YieldSplit to validate
     */
    function _validateYieldSplit(YieldSplit memory split) internal pure {
        uint256 total = uint256(split.daoShare) + uint256(split.stakerShare) + uint256(split.platformShare);
        if (total != TOTAL_BASIS) revert InvalidSplitSum();
        if (split.platformShare < MIN_PLATFORM_SHARE) revert PlatformShareTooLow();
    }

    // ============================================
    // ======= UUPS UPGRADE AUTHORIZATION ========
    // ============================================

    /**
     * @notice Authorize contract upgrades
     * @param newImplementation Address of the new implementation
     * @dev Only owner can authorize upgrades
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
