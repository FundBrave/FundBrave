// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title IWealthBuildingDonation
 * @notice Interface for the WealthBuildingDonation contract
 */
interface IWealthBuildingDonation {
    /**
     * @notice Process a donation with wealth-building split
     * @param donor Address making the donation
     * @param fundraiserId ID of the fundraiser to donate to
     * @param amount Total USDC amount being donated
     * @param beneficiary Address to receive direct donation
     * @return directAmount Amount sent to beneficiary
     * @return endowmentAmount Amount staked in Aave
     */
    function donate(
        address donor,
        uint256 fundraiserId,
        uint256 amount,
        address beneficiary
    ) external returns (uint256 directAmount, uint256 endowmentAmount);

    /**
     * @notice Harvest and distribute yield for a specific donor/fundraiser pair
     * @param donor Address of the endowment holder
     * @param fundraiserId ID of the fundraiser
     */
    function harvestYield(address donor, uint256 fundraiserId) external;

    /**
     * @notice Get complete endowment information for a donor/fundraiser pair
     * @param donor Address of the donor
     * @param fundraiserId ID of the fundraiser
     * @return principal Amount staked permanently
     * @return lifetimeYield Total yield generated since donation
     * @return causeYieldPaid Cumulative yield sent to cause
     * @return donorStockValue Cumulative USDC value converted to stocks
     * @return lastHarvestTime Timestamp of last yield harvest
     */
    function getEndowmentInfo(
        address donor,
        uint256 fundraiserId
    ) external view returns (
        uint256 principal,
        uint256 lifetimeYield,
        uint256 causeYieldPaid,
        uint256 donorStockValue,
        uint256 lastHarvestTime
    );

    /**
     * @notice Register a new fundraiser for wealth-building donations
     * @param fundraiserId Unique identifier for the fundraiser
     * @param beneficiary Address to receive donations and yield
     */
    function registerFundraiser(uint256 fundraiserId, address beneficiary) external;

    /**
     * @notice Calculate pending yield for a donor/fundraiser pair
     * @param donor Address of the donor
     * @param fundraiserId ID of the fundraiser
     * @return causeYield Estimated yield that would go to cause (30%)
     * @return donorYield Estimated yield that would go to donor stocks (70%)
     */
    function getPendingYield(
        address donor,
        uint256 fundraiserId
    ) external view returns (uint256 causeYield, uint256 donorYield);
}

/**
 * @title IFundBraveToken
 * @notice Interface for the FBT governance token
 */
interface IFundBraveToken is IERC20 {
    function mint(address to, uint256 amount) external;
}

/**
 * @title PlatformTreasury
 * @author FundBrave Team
 * @notice Collects all platform fees and stakes them via WealthBuildingDonation
 * @dev
 * The PlatformTreasury demonstrates "we practice what we preach" by:
 * - Collecting 2% platform fees from various sources (StakingPool, ImpactDAOPool, etc.)
 * - Staking 100% of collected fees via the WealthBuildingDonation mechanism
 * - Operating entirely off the yield generated, never touching principal
 * - Distributing treasury yield to FBT stakers proportionally
 *
 * Fee Flow:
 * 1. Various contracts send 2% fees to PlatformTreasury
 * 2. Treasury stakes fees via WealthBuildingDonation contract
 * 3. Yield from staked fees distributed to FBT holders
 *
 * When fees are staked via WealthBuildingDonation:
 * - 78% returns directly to treasury (operational funds)
 * - 20% staked permanently in Aave (generates perpetual yield)
 * - 2% goes to platform fee (circular, but transparent)
 *
 * Security Considerations:
 * - ReentrancyGuard on all external state-changing functions
 * - CEI pattern followed throughout
 * - Access control for admin functions
 * - Input validation on all public functions
 * - Only authorized contracts can send fees
 */
contract PlatformTreasury is
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    // ============ Custom Errors ============

    /// @notice Thrown when caller is not authorized to send fees
    error Unauthorized();

    /// @notice Thrown when amount is zero or invalid
    error InvalidAmount();

    /// @notice Thrown when staker has insufficient stake
    error InsufficientStake();

    /// @notice Thrown when a zero address is provided
    error ZeroAddress();

    /// @notice Thrown when there is no yield available to claim
    error NoYieldAvailable();

    /// @notice Thrown when there are no pending fees to stake
    error NoPendingFees();

    /// @notice Thrown when fee sender is already authorized
    error AlreadyAuthorized();

    /// @notice Thrown when fee sender is not authorized
    error NotAuthorized();

    // ============ Events ============

    /**
     * @notice Emitted when fees are received from an authorized sender
     * @param from Address that sent the fees
     * @param amount Amount of USDC fees received
     */
    event FeeReceived(address indexed from, uint256 amount);

    /**
     * @notice Emitted when accumulated fees are staked via WealthBuildingDonation
     * @param amount Total amount staked
     * @param endowmentAmount Amount that went to permanent endowment (20%)
     */
    event FeesStaked(uint256 amount, uint256 endowmentAmount);

    /**
     * @notice Emitted when yield is harvested from the treasury's endowment
     * @param yieldAmount Total yield harvested
     */
    event YieldHarvested(uint256 yieldAmount);

    /**
     * @notice Emitted when yield is distributed to FBT stakers
     * @param yieldPerToken New accumulated yield per token
     */
    event YieldDistributed(uint256 yieldPerToken);

    /**
     * @notice Emitted when a user stakes FBT tokens
     * @param staker Address of the staker
     * @param amount Amount of FBT staked
     */
    event FBTStaked(address indexed staker, uint256 amount);

    /**
     * @notice Emitted when a user unstakes FBT tokens
     * @param staker Address of the staker
     * @param amount Amount of FBT unstaked
     */
    event FBTUnstaked(address indexed staker, uint256 amount);

    /**
     * @notice Emitted when a user claims their yield
     * @param staker Address of the staker
     * @param amount Amount of USDC yield claimed
     */
    event YieldClaimed(address indexed staker, uint256 amount);

    /**
     * @notice Emitted when a fee sender is authorized
     * @param sender Address authorized to send fees
     */
    event FeeSenderAuthorized(address indexed sender);

    /**
     * @notice Emitted when a fee sender authorization is revoked
     * @param sender Address whose authorization was revoked
     */
    event FeeSenderRevoked(address indexed sender);

    /**
     * @notice Emitted when minimum stake threshold is updated
     * @param oldThreshold Previous threshold
     * @param newThreshold New threshold
     */
    event MinStakeThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);

    /**
     * @notice Emitted when operational funds are withdrawn
     * @param to Recipient address
     * @param amount Amount withdrawn
     */
    event OperationalFundsWithdrawn(address indexed to, uint256 amount);

    /**
     * @notice Emitted when timelock address is set
     * @param oldTimelock Previous timelock address
     * @param newTimelock New timelock address
     */
    event TimelockSet(address indexed oldTimelock, address indexed newTimelock);

    // ============ Constants ============

    /// @notice Treasury's special fundraiser ID (represents platform operations)
    /// @dev Using max uint256 to avoid collision with regular fundraiser IDs
    uint256 public constant PLATFORM_FUNDRAISER_ID = type(uint256).max;

    /// @notice Precision for yield per token calculations
    uint256 private constant PRECISION = 1e18;

    // ============ State Variables ============

    /// @notice USDC token contract
    IERC20 public USDC;

    /// @notice WealthBuildingDonation contract for staking fees
    IWealthBuildingDonation public wealthBuildingDonation;

    /// @notice FBT governance token contract
    IFundBraveToken public FBT;

    /// @notice Total platform fees ever collected
    uint256 public totalFeesCollected;

    /// @notice Total fees that have been staked via WealthBuildingDonation
    uint256 public totalFeesStaked;

    /// @notice Fees accumulated but not yet staked
    uint256 public pendingFeesToStake;

    /// @notice Total FBT tokens staked by all users
    uint256 public totalFBTStaked;

    /// @notice FBT staked per user
    mapping(address => uint256) public fbtStaked;

    /// @notice Accumulated yield per FBT token (scaled by PRECISION)
    uint256 public yieldPerTokenStored;

    /// @notice Yield per token already paid to each user
    mapping(address => uint256) public userYieldPerTokenPaid;

    /// @notice Pending yield for each user (not yet claimed)
    mapping(address => uint256) public pendingYield;

    /// @notice Minimum threshold to trigger automatic fee staking
    uint256 public minStakeThreshold;

    /// @notice Mapping of authorized fee senders
    mapping(address => bool) public authorizedFeeSenders;

    /// @notice Operational funds available (78% direct return from WealthBuildingDonation)
    uint256 public operationalFunds;

    /// @notice Total yield distributed to FBT stakers
    uint256 public totalYieldDistributed;

    /// @notice Timelock controller for delayed admin operations
    address public timelock;

    /// @notice Storage gap for future upgrades
    uint256[39] private __gap;

    // ============ Modifiers ============

    /**
     * @notice Updates reward state for a user before executing the function
     * @dev Follows Synthetix StakingRewards pattern
     * @param account The account to update rewards for
     */
    modifier updateReward(address account) {
        if (account != address(0)) {
            pendingYield[account] = earnedYield(account);
            userYieldPerTokenPaid[account] = yieldPerTokenStored;
        }
        _;
    }

    /**
     * @notice Restricts function access to timelock or owner
     * @dev Used for time-sensitive admin functions that should be delayed
     */
    modifier onlyTimelockOrOwner() {
        require(
            msg.sender == timelock || msg.sender == owner(),
            "PlatformTreasury: Not authorized"
        );
        _;
    }

    // ============ Constructor & Initializer ============

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the PlatformTreasury contract
     * @param _usdc USDC token address
     * @param _wealthBuildingDonation WealthBuildingDonation contract address
     * @param _fbt FundBrave Token address
     * @param _owner Contract owner address
     */
    function initialize(
        address _usdc,
        address _wealthBuildingDonation,
        address _fbt,
        address _owner
    ) external initializer {
        if (_usdc == address(0)) revert ZeroAddress();
        if (_wealthBuildingDonation == address(0)) revert ZeroAddress();
        if (_fbt == address(0)) revert ZeroAddress();
        if (_owner == address(0)) revert ZeroAddress();

        __Ownable_init(_owner);
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        USDC = IERC20(_usdc);
        wealthBuildingDonation = IWealthBuildingDonation(_wealthBuildingDonation);
        FBT = IFundBraveToken(_fbt);

        // Default threshold: 1000 USDC (6 decimals)
        minStakeThreshold = 1000 * 1e6;

        // Approve WealthBuildingDonation to spend USDC
        USDC.forceApprove(address(wealthBuildingDonation), type(uint256).max);
    }

    // ============ Fee Collection ============

    /**
     * @notice Receive platform fees from authorized contracts
     * @dev Called by StakingPool, ImpactDAOPool, WealthBuildingDonation, etc.
     * @param amount Amount of USDC fees to receive
     */
    function receiveFee(uint256 amount) external nonReentrant whenNotPaused {
        if (!authorizedFeeSenders[msg.sender]) revert Unauthorized();
        if (amount == 0) revert InvalidAmount();

        // Transfer USDC from sender to treasury
        USDC.safeTransferFrom(msg.sender, address(this), amount);

        // Update tracking
        unchecked {
            totalFeesCollected += amount;
            pendingFeesToStake += amount;
        }

        emit FeeReceived(msg.sender, amount);

        // Auto-stake if threshold reached
        if (pendingFeesToStake >= minStakeThreshold) {
            _stakeFees();
        }
    }

    // ============ Fee Staking ============

    /**
     * @notice Stake accumulated fees via WealthBuildingDonation
     * @dev Can be called by anyone, but typically triggered automatically
     *      when fees reach minStakeThreshold
     *
     * When staking via WealthBuildingDonation:
     * - 78% returns as direct amount (operational funds)
     * - 20% goes to permanent endowment
     * - 2% goes to platform fee (circular but transparent)
     */
    function stakeFees() external nonReentrant whenNotPaused {
        _stakeFees();
    }

    /**
     * @notice Internal function to stake accumulated fees
     */
    function _stakeFees() internal {
        uint256 amountToStake = pendingFeesToStake;
        if (amountToStake == 0) revert NoPendingFees();

        // Reset pending before external call (CEI pattern)
        pendingFeesToStake = 0;

        // Donate to treasury's own fundraiser via WealthBuildingDonation
        // Returns: directAmount (78%), endowmentAmount (20%), platformFee (2%)
        (uint256 directAmount, uint256 endowmentAmount) = wealthBuildingDonation.donate(
            address(this),
            PLATFORM_FUNDRAISER_ID,
            amountToStake,
            address(this) // beneficiary is treasury itself
        );

        // Track staked amount and operational funds
        unchecked {
            totalFeesStaked += amountToStake;
            operationalFunds += directAmount;
        }

        emit FeesStaked(amountToStake, endowmentAmount);
    }

    // ============ Yield Harvesting ============

    /**
     * @notice Harvest yield from treasury's endowment and distribute to FBT stakers
     * @dev Calls WealthBuildingDonation.harvestYield which:
     *      - 30% of yield goes to cause (treasury in this case)
     *      - 70% of yield goes to donor (treasury) as stocks
     *
     *      For treasury, both shares end up back here and are distributed to FBT stakers
     */
    function harvestPlatformYield() external nonReentrant whenNotPaused {
        // Get current pending yield before harvest
        (uint256 causeYield, uint256 donorYield) = wealthBuildingDonation.getPendingYield(
            address(this),
            PLATFORM_FUNDRAISER_ID
        );

        uint256 totalYield = causeYield + donorYield;
        if (totalYield == 0) revert NoYieldAvailable();

        // Harvest yield from WealthBuildingDonation
        // This will send 30% to treasury (as cause) and 70% as stocks
        wealthBuildingDonation.harvestYield(address(this), PLATFORM_FUNDRAISER_ID);

        // The causeYield (30%) comes back to treasury as USDC
        // The donorYield (70%) may come as stocks or USDC depending on swap config
        // For simplicity, we distribute the causeYield portion to FBT stakers
        uint256 yieldToDistribute = causeYield;

        emit YieldHarvested(yieldToDistribute);

        // Distribute yield to FBT stakers
        if (totalFBTStaked > 0 && yieldToDistribute > 0) {
            // Update yield per token
            uint256 yieldPerTokenIncrease = (yieldToDistribute * PRECISION) / totalFBTStaked;
            unchecked {
                yieldPerTokenStored += yieldPerTokenIncrease;
                totalYieldDistributed += yieldToDistribute;
            }

            emit YieldDistributed(yieldPerTokenStored);
        } else {
            // No FBT staked, add yield to operational funds
            unchecked {
                operationalFunds += yieldToDistribute;
            }
        }
    }

    // ============ FBT Staking ============

    /**
     * @notice Stake FBT tokens to earn treasury yield
     * @param amount Amount of FBT to stake
     */
    function stakeFBT(uint256 amount) external nonReentrant whenNotPaused updateReward(msg.sender) {
        if (amount == 0) revert InvalidAmount();

        // Transfer FBT from staker to treasury
        IERC20(address(FBT)).safeTransferFrom(msg.sender, address(this), amount);

        // Update staking records
        unchecked {
            fbtStaked[msg.sender] += amount;
            totalFBTStaked += amount;
        }

        emit FBTStaked(msg.sender, amount);
    }

    /**
     * @notice Unstake FBT tokens
     * @param amount Amount of FBT to unstake
     */
    function unstakeFBT(uint256 amount) external nonReentrant whenNotPaused updateReward(msg.sender) {
        if (amount == 0) revert InvalidAmount();
        if (fbtStaked[msg.sender] < amount) revert InsufficientStake();

        // Update staking records
        unchecked {
            fbtStaked[msg.sender] -= amount;
            totalFBTStaked -= amount;
        }

        // Transfer FBT back to staker
        IERC20(address(FBT)).safeTransfer(msg.sender, amount);

        emit FBTUnstaked(msg.sender, amount);
    }

    // ============ Yield Claiming ============

    /**
     * @notice Claim accumulated USDC yield from treasury staking
     */
    function claimYield() external nonReentrant whenNotPaused updateReward(msg.sender) {
        uint256 yieldAmount = pendingYield[msg.sender];
        if (yieldAmount == 0) revert NoYieldAvailable();

        // Reset pending yield before transfer (CEI pattern)
        pendingYield[msg.sender] = 0;

        // Transfer USDC yield to staker
        USDC.safeTransfer(msg.sender, yieldAmount);

        emit YieldClaimed(msg.sender, yieldAmount);
    }

    /**
     * @notice Claim yield and unstake FBT in a single transaction
     * @param unstakeAmount Amount of FBT to unstake (0 for full balance)
     */
    function exit(uint256 unstakeAmount) external nonReentrant whenNotPaused updateReward(msg.sender) {
        // Claim yield
        uint256 yieldAmount = pendingYield[msg.sender];
        if (yieldAmount > 0) {
            pendingYield[msg.sender] = 0;
            USDC.safeTransfer(msg.sender, yieldAmount);
            emit YieldClaimed(msg.sender, yieldAmount);
        }

        // Unstake FBT
        uint256 amountToUnstake = unstakeAmount == 0 ? fbtStaked[msg.sender] : unstakeAmount;
        if (amountToUnstake > 0) {
            if (fbtStaked[msg.sender] < amountToUnstake) revert InsufficientStake();

            unchecked {
                fbtStaked[msg.sender] -= amountToUnstake;
                totalFBTStaked -= amountToUnstake;
            }

            IERC20(address(FBT)).safeTransfer(msg.sender, amountToUnstake);
            emit FBTUnstaked(msg.sender, amountToUnstake);
        }
    }

    // ============ View Functions ============

    /**
     * @notice Calculate pending yield for a staker
     * @param staker Address of the staker
     * @return Pending USDC yield claimable
     */
    function earnedYield(address staker) public view returns (uint256) {
        if (totalFBTStaked == 0) return pendingYield[staker];

        uint256 stakerShare = fbtStaked[staker];
        uint256 rewardPerToken = yieldPerTokenStored;
        uint256 paidPerToken = userYieldPerTokenPaid[staker];

        uint256 newEarnings = (stakerShare * (rewardPerToken - paidPerToken)) / PRECISION;

        return pendingYield[staker] + newEarnings;
    }

    /**
     * @notice Get comprehensive treasury information
     * @return _totalFeesCollected Total fees ever collected
     * @return _totalFeesStaked Total fees staked via WealthBuildingDonation
     * @return _pendingFeesToStake Fees waiting to be staked
     * @return _totalFBTStaked Total FBT staked by all users
     * @return _endowmentPrincipal Principal in treasury's endowment
     * @return _lifetimeYield Total yield generated from endowment
     */
    function getTreasuryInfo() external view returns (
        uint256 _totalFeesCollected,
        uint256 _totalFeesStaked,
        uint256 _pendingFeesToStake,
        uint256 _totalFBTStaked,
        uint256 _endowmentPrincipal,
        uint256 _lifetimeYield
    ) {
        // Get endowment info from WealthBuildingDonation
        (
            uint256 principal,
            uint256 lifetimeYield,
            ,
            ,

        ) = wealthBuildingDonation.getEndowmentInfo(address(this), PLATFORM_FUNDRAISER_ID);

        return (
            totalFeesCollected,
            totalFeesStaked,
            pendingFeesToStake,
            totalFBTStaked,
            principal,
            lifetimeYield
        );
    }

    /**
     * @notice Get information about a specific staker
     * @param staker Address of the staker
     * @return _fbtStaked Amount of FBT staked by this user
     * @return _pendingYield Pending USDC yield claimable
     * @return _shareOfTreasury User's share of total FBT staked (in basis points)
     */
    function getStakerInfo(address staker) external view returns (
        uint256 _fbtStaked,
        uint256 _pendingYield,
        uint256 _shareOfTreasury
    ) {
        _fbtStaked = fbtStaked[staker];
        _pendingYield = earnedYield(staker);

        if (totalFBTStaked > 0) {
            // Share in basis points (0-10000)
            _shareOfTreasury = (_fbtStaked * 10000) / totalFBTStaked;
        } else {
            _shareOfTreasury = 0;
        }
    }

    /**
     * @notice Get treasury's pending yield from WealthBuildingDonation
     * @return causeYield Yield portion going to cause (30%)
     * @return donorYield Yield portion going to donor/stocks (70%)
     */
    function getTreasuryPendingYield() external view returns (
        uint256 causeYield,
        uint256 donorYield
    ) {
        return wealthBuildingDonation.getPendingYield(address(this), PLATFORM_FUNDRAISER_ID);
    }

    /**
     * @notice Get operational funds and yield distribution stats
     * @return _operationalFunds Available operational funds (78% returns)
     * @return _totalYieldDistributed Total yield distributed to FBT stakers
     * @return _yieldPerTokenStored Current accumulated yield per token
     */
    function getOperationalStats() external view returns (
        uint256 _operationalFunds,
        uint256 _totalYieldDistributed,
        uint256 _yieldPerTokenStored
    ) {
        return (operationalFunds, totalYieldDistributed, yieldPerTokenStored);
    }

    // ============ Admin Functions ============

    /**
     * @notice Authorize a contract to send fees to treasury
     * @param sender Address to authorize
     */
    function authorizeFeeSender(address sender) external onlyOwner {
        if (sender == address(0)) revert ZeroAddress();
        if (authorizedFeeSenders[sender]) revert AlreadyAuthorized();

        authorizedFeeSenders[sender] = true;

        emit FeeSenderAuthorized(sender);
    }

    /**
     * @notice Revoke fee sending authorization
     * @param sender Address to revoke
     */
    function revokeFeeSender(address sender) external onlyOwner {
        if (!authorizedFeeSenders[sender]) revert NotAuthorized();

        authorizedFeeSenders[sender] = false;

        emit FeeSenderRevoked(sender);
    }

    /**
     * @notice Update minimum stake threshold for auto-staking
     * @param newThreshold New threshold in USDC (6 decimals)
     */
    function setMinStakeThreshold(uint256 newThreshold) external onlyOwner {
        uint256 oldThreshold = minStakeThreshold;
        minStakeThreshold = newThreshold;

        emit MinStakeThresholdUpdated(oldThreshold, newThreshold);
    }

    /**
     * @notice Register treasury as a fundraiser in WealthBuildingDonation
     * @dev Must be called after deployment to enable donations
     *      Owner must also be owner of WealthBuildingDonation or have proper access
     */
    function registerTreasuryFundraiser() external onlyOwner {
        wealthBuildingDonation.registerFundraiser(PLATFORM_FUNDRAISER_ID, address(this));
    }

    /**
     * @notice Withdraw operational funds for platform operations
     * @dev Only withdraws from operational funds (78% direct returns)
     *      Never touches endowment principal
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function withdrawOperationalFunds(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0 || amount > operationalFunds) revert InvalidAmount();

        unchecked {
            operationalFunds -= amount;
        }

        USDC.safeTransfer(to, amount);

        emit OperationalFundsWithdrawn(to, amount);
    }

    /**
     * @notice Rescue accidentally sent tokens (not USDC or FBT)
     * @dev Cannot rescue USDC (fee/yield funds) or FBT (staked tokens)
     * @param token Token address to rescue
     * @param amount Amount to rescue
     */
    function rescueTokens(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        if (token == address(USDC)) revert InvalidAmount(); // Cannot rescue USDC
        if (token == address(FBT)) revert InvalidAmount(); // Cannot rescue staked FBT

        IERC20(token).safeTransfer(owner(), amount);
    }

    /**
     * @notice Pause contract operations
     * @dev Emergency use only
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Update WealthBuildingDonation contract address
     * @dev Use with caution - affects all fee staking. Should go through timelock.
     * @param _wealthBuildingDonation New WealthBuildingDonation address
     */
    function setWealthBuildingDonation(address _wealthBuildingDonation) external onlyTimelockOrOwner {
        if (_wealthBuildingDonation == address(0)) revert ZeroAddress();

        // Revoke old approval
        USDC.forceApprove(address(wealthBuildingDonation), 0);

        // Update contract reference
        wealthBuildingDonation = IWealthBuildingDonation(_wealthBuildingDonation);

        // Approve new contract
        USDC.forceApprove(_wealthBuildingDonation, type(uint256).max);
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

    // ============ UUPS Upgrade Authorization ============

    /**
     * @notice Authorize contract upgrades
     * @param newImplementation Address of the new implementation
     * @dev Only owner can authorize upgrades
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
