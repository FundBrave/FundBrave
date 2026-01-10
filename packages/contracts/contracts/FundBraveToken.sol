// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title FundBraveToken
 * @author FundBrave Team
 * @notice FBT is the governance and rewards token for the FundBrave platform
 * @dev Upgradeable ERC20 token with vesting, burning, minting, and staking tracking capabilities.
 *
 * Features:
 * - ERC20 with Permit (gasless approvals)
 * - Role-based minting (authorized minters like reward contracts)
 * - Linear vesting schedules for earned rewards
 * - Burn functionality for premium features
 * - Staking balance tracking for governance weight calculations
 * - UUPS upgradeability pattern
 *
 * Vesting:
 * - Donation rewards: 30 days vesting
 * - Engagement rewards: 7 days vesting
 * - Linear release: users can claim proportionally at any time
 *
 * Security:
 * - ReentrancyGuard on all claim/vest operations
 * - CEI pattern followed throughout
 * - Only authorized contracts can create vesting schedules
 * - Storage gap for safe upgrades
 */
contract FundBraveToken is
    Initializable,
    ERC20Upgradeable,
    ERC20PermitUpgradeable,
    ERC20BurnableUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    // ============ Custom Errors ============

    /// @notice Thrown when caller is not an authorized minter
    error NotAuthorizedMinter();

    /// @notice Thrown when caller is not an authorized vester
    error NotAuthorizedVester();

    /// @notice Thrown when caller is not an authorized staking contract
    error NotAuthorizedStakingContract();

    /// @notice Thrown when amount is zero or invalid
    error InvalidAmount();

    /// @notice Thrown when vesting duration is zero
    error InvalidVestingDuration();

    /// @notice Thrown when recipient address is zero
    error ZeroAddress();

    /// @notice Thrown when no tokens are claimable
    error NoClaimableTokens();

    /// @notice Thrown when schedule index is out of bounds
    error InvalidScheduleIndex();

    /// @notice Thrown when trying to set authorization to same value
    error AuthorizationUnchanged();

    // ============ Events ============

    /**
     * @notice Emitted when minter authorization changes
     * @param minter Address of the minter
     * @param authorized Whether minting is authorized
     */
    event MinterAuthorizationChanged(address indexed minter, bool authorized);

    /**
     * @notice Emitted when vester authorization changes
     * @param vester Address of the vester
     * @param authorized Whether vesting is authorized
     */
    event VesterAuthorizationChanged(address indexed vester, bool authorized);

    /**
     * @notice Emitted when staking contract authorization changes
     * @param stakingContract Address of the staking contract
     * @param authorized Whether staking notifications are authorized
     */
    event StakingContractAuthorizationChanged(address indexed stakingContract, bool authorized);

    /**
     * @notice Emitted when a new vesting schedule is created
     * @param recipient Address receiving the vesting schedule
     * @param scheduleId Index of the vesting schedule
     * @param amount Total tokens to vest
     * @param duration Vesting duration in seconds
     * @param startTime When vesting begins
     */
    event VestingScheduleCreated(
        address indexed recipient,
        uint256 indexed scheduleId,
        uint256 amount,
        uint256 duration,
        uint256 startTime
    );

    /**
     * @notice Emitted when vested tokens are claimed
     * @param account Address claiming tokens
     * @param amount Amount of tokens claimed
     */
    event VestedTokensClaimed(address indexed account, uint256 amount);

    /**
     * @notice Emitted when tokens are burned
     * @param account Address whose tokens were burned
     * @param amount Amount burned
     */
    event TokensBurned(address indexed account, uint256 amount);

    /**
     * @notice Emitted when staking balance is updated
     * @param staker Address of the staker
     * @param newBalance New staked balance
     * @param isStake True if staking, false if unstaking
     */
    event StakeBalanceUpdated(address indexed staker, uint256 newBalance, bool isStake);

    // ============ Constants ============

    /// @notice Vesting duration for donation rewards (30 days)
    uint256 public constant DONATION_VESTING_DURATION = 30 days;

    /// @notice Vesting duration for engagement rewards (7 days)
    uint256 public constant ENGAGEMENT_VESTING_DURATION = 7 days;

    // ============ Structs ============

    /**
     * @notice Represents a linear vesting schedule
     * @param total Total tokens to be vested
     * @param released Tokens already claimed/released
     * @param startTime Unix timestamp when vesting started
     * @param duration Vesting duration in seconds
     */
    struct VestingSchedule {
        uint256 total;
        uint256 released;
        uint256 startTime;
        uint256 duration;
    }

    // ============ State Variables ============

    /// @notice Mapping of authorized minters
    mapping(address => bool) public minters;

    /// @notice Mapping of authorized vesters (can create vesting schedules)
    mapping(address => bool) public authorizedVesters;

    /// @notice Mapping of authorized staking contracts (can notify stake changes)
    mapping(address => bool) public authorizedStakingContracts;

    /// @notice Mapping of user address to their vesting schedules
    mapping(address => VestingSchedule[]) private _vestingSchedules;

    /// @notice Mapping of staked FBT balances (tracked for governance weight)
    mapping(address => uint256) public stakedBalance;

    /// @notice Total FBT staked across all staking contracts
    uint256 private _totalStaked;

    /// @notice Storage gap for future upgrades
    uint256[44] private __gap;

    // ============ Constructor ============

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // ============ Initializer ============

    /**
     * @notice Initializes the FundBraveToken contract
     * @param initialOwner Address to receive initial token supply and ownership
     * @dev Initial supply: 10,000,000 FBT (18 decimals)
     */
    function initialize(address initialOwner) external initializer {
        if (initialOwner == address(0)) revert ZeroAddress();

        __ERC20_init("FundBrave Token", "FBT");
        __ERC20Permit_init("FundBrave Token");
        __ERC20Burnable_init();
        __Ownable_init(initialOwner);
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        // Mint initial supply to owner
        _mint(initialOwner, 10_000_000 * 10 ** decimals());
    }

    // ============ Modifiers ============

    /**
     * @notice Restricts function to authorized minters only
     */
    modifier onlyMinter() {
        if (!minters[msg.sender]) revert NotAuthorizedMinter();
        _;
    }

    /**
     * @notice Restricts function to authorized vesters or owner
     */
    modifier onlyAuthorizedVester() {
        if (!authorizedVesters[msg.sender] && msg.sender != owner()) {
            revert NotAuthorizedVester();
        }
        _;
    }

    /**
     * @notice Restricts function to authorized staking contracts
     */
    modifier onlyAuthorizedStakingContract() {
        if (!authorizedStakingContracts[msg.sender]) {
            revert NotAuthorizedStakingContract();
        }
        _;
    }

    // ============ Minting Functions ============

    /**
     * @notice Mint new FBT tokens
     * @param to Recipient address
     * @param amount Amount to mint
     * @dev Only callable by authorized minters
     */
    function mint(address to, uint256 amount) external onlyMinter whenNotPaused {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount();
        _mint(to, amount);
    }

    /**
     * @notice Set minter authorization
     * @param minter Address to authorize/deauthorize
     * @param authorized Whether address should be authorized
     */
    function setMinter(address minter, bool authorized) external onlyOwner {
        if (minter == address(0)) revert ZeroAddress();
        if (minters[minter] == authorized) revert AuthorizationUnchanged();

        minters[minter] = authorized;
        emit MinterAuthorizationChanged(minter, authorized);
    }

    // ============ Vesting Functions ============

    /**
     * @notice Create a vesting schedule for a recipient
     * @param recipient Address to receive vested tokens
     * @param amount Total tokens to vest
     * @param vestingDuration Duration of vesting in seconds
     * @return scheduleId Index of the created vesting schedule
     * @dev Tokens are minted to this contract and released linearly over vestingDuration
     */
    function vestTokens(
        address recipient,
        uint256 amount,
        uint256 vestingDuration
    ) external onlyAuthorizedVester nonReentrant whenNotPaused returns (uint256 scheduleId) {
        if (recipient == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount();
        if (vestingDuration == 0) revert InvalidVestingDuration();

        // Mint tokens to this contract for vesting
        _mint(address(this), amount);

        // Create vesting schedule
        VestingSchedule memory schedule = VestingSchedule({
            total: amount,
            released: 0,
            startTime: block.timestamp,
            duration: vestingDuration
        });

        _vestingSchedules[recipient].push(schedule);
        scheduleId = _vestingSchedules[recipient].length - 1;

        emit VestingScheduleCreated(
            recipient,
            scheduleId,
            amount,
            vestingDuration,
            block.timestamp
        );
    }

    /**
     * @notice Create a vesting schedule with donation vesting duration (30 days)
     * @param recipient Address to receive vested tokens
     * @param amount Total tokens to vest
     * @return scheduleId Index of the created vesting schedule
     */
    function vestDonationReward(
        address recipient,
        uint256 amount
    ) external onlyAuthorizedVester nonReentrant whenNotPaused returns (uint256 scheduleId) {
        if (recipient == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount();

        _mint(address(this), amount);

        VestingSchedule memory schedule = VestingSchedule({
            total: amount,
            released: 0,
            startTime: block.timestamp,
            duration: DONATION_VESTING_DURATION
        });

        _vestingSchedules[recipient].push(schedule);
        scheduleId = _vestingSchedules[recipient].length - 1;

        emit VestingScheduleCreated(
            recipient,
            scheduleId,
            amount,
            DONATION_VESTING_DURATION,
            block.timestamp
        );
    }

    /**
     * @notice Create a vesting schedule with engagement vesting duration (7 days)
     * @param recipient Address to receive vested tokens
     * @param amount Total tokens to vest
     * @return scheduleId Index of the created vesting schedule
     */
    function vestEngagementReward(
        address recipient,
        uint256 amount
    ) external onlyAuthorizedVester nonReentrant whenNotPaused returns (uint256 scheduleId) {
        if (recipient == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount();

        _mint(address(this), amount);

        VestingSchedule memory schedule = VestingSchedule({
            total: amount,
            released: 0,
            startTime: block.timestamp,
            duration: ENGAGEMENT_VESTING_DURATION
        });

        _vestingSchedules[recipient].push(schedule);
        scheduleId = _vestingSchedules[recipient].length - 1;

        emit VestingScheduleCreated(
            recipient,
            scheduleId,
            amount,
            ENGAGEMENT_VESTING_DURATION,
            block.timestamp
        );
    }

    /**
     * @notice Claim all vested tokens across all schedules
     * @return claimed Total amount of tokens claimed
     */
    function claimVestedTokens() external nonReentrant whenNotPaused returns (uint256 claimed) {
        VestingSchedule[] storage schedules = _vestingSchedules[msg.sender];
        uint256 schedulesLength = schedules.length;

        for (uint256 i = 0; i < schedulesLength;) {
            uint256 claimable = _calculateClaimable(schedules[i]);
            if (claimable > 0) {
                schedules[i].released += claimable;
                claimed += claimable;
            }
            unchecked { ++i; }
        }

        if (claimed == 0) revert NoClaimableTokens();

        // Transfer claimed tokens from contract to user
        _transfer(address(this), msg.sender, claimed);

        emit VestedTokensClaimed(msg.sender, claimed);
    }

    /**
     * @notice Claim vested tokens from a specific schedule
     * @param scheduleIndex Index of the vesting schedule
     * @return claimed Amount of tokens claimed
     */
    function claimVestedTokensFromSchedule(
        uint256 scheduleIndex
    ) external nonReentrant whenNotPaused returns (uint256 claimed) {
        VestingSchedule[] storage schedules = _vestingSchedules[msg.sender];

        if (scheduleIndex >= schedules.length) revert InvalidScheduleIndex();

        claimed = _calculateClaimable(schedules[scheduleIndex]);
        if (claimed == 0) revert NoClaimableTokens();

        schedules[scheduleIndex].released += claimed;

        _transfer(address(this), msg.sender, claimed);

        emit VestedTokensClaimed(msg.sender, claimed);
    }

    /**
     * @notice Calculate claimable amount from a vesting schedule
     * @param schedule The vesting schedule to calculate for
     * @return claimable Amount currently claimable
     */
    function _calculateClaimable(
        VestingSchedule memory schedule
    ) internal view returns (uint256 claimable) {
        if (schedule.total == 0) return 0;

        uint256 elapsed = block.timestamp - schedule.startTime;

        uint256 vested;
        if (elapsed >= schedule.duration) {
            // Fully vested
            vested = schedule.total;
        } else {
            // Linear vesting: vested = total * elapsed / duration
            vested = (schedule.total * elapsed) / schedule.duration;
        }

        // Claimable = vested - already released
        if (vested > schedule.released) {
            claimable = vested - schedule.released;
        }
    }

    /**
     * @notice Set authorized vester status
     * @param vester Address to authorize/deauthorize
     * @param authorized Whether address should be authorized
     */
    function setAuthorizedVester(address vester, bool authorized) external onlyOwner {
        if (vester == address(0)) revert ZeroAddress();
        if (authorizedVesters[vester] == authorized) revert AuthorizationUnchanged();

        authorizedVesters[vester] = authorized;
        emit VesterAuthorizationChanged(vester, authorized);
    }

    // ============ Vesting View Functions ============

    /**
     * @notice Get all vesting schedules for an account
     * @param account Address to query
     * @return Array of vesting schedules
     */
    function getVestingSchedules(
        address account
    ) external view returns (VestingSchedule[] memory) {
        return _vestingSchedules[account];
    }

    /**
     * @notice Get a specific vesting schedule
     * @param account Address to query
     * @param scheduleIndex Index of the schedule
     * @return schedule The vesting schedule
     */
    function getVestingSchedule(
        address account,
        uint256 scheduleIndex
    ) external view returns (VestingSchedule memory schedule) {
        if (scheduleIndex >= _vestingSchedules[account].length) {
            revert InvalidScheduleIndex();
        }
        return _vestingSchedules[account][scheduleIndex];
    }

    /**
     * @notice Get number of vesting schedules for an account
     * @param account Address to query
     * @return count Number of vesting schedules
     */
    function getVestingScheduleCount(address account) external view returns (uint256 count) {
        return _vestingSchedules[account].length;
    }

    /**
     * @notice Get total claimable amount across all vesting schedules
     * @param account Address to query
     * @return claimable Total claimable tokens
     */
    function getClaimableAmount(address account) external view returns (uint256 claimable) {
        VestingSchedule[] storage schedules = _vestingSchedules[account];
        uint256 schedulesLength = schedules.length;

        for (uint256 i = 0; i < schedulesLength;) {
            claimable += _calculateClaimable(schedules[i]);
            unchecked { ++i; }
        }
    }

    /**
     * @notice Get claimable amount for a specific schedule
     * @param account Address to query
     * @param scheduleIndex Index of the schedule
     * @return claimable Claimable tokens from this schedule
     */
    function getClaimableAmountFromSchedule(
        address account,
        uint256 scheduleIndex
    ) external view returns (uint256 claimable) {
        if (scheduleIndex >= _vestingSchedules[account].length) {
            revert InvalidScheduleIndex();
        }
        return _calculateClaimable(_vestingSchedules[account][scheduleIndex]);
    }

    /**
     * @notice Get total vested tokens (including released) for an account
     * @param account Address to query
     * @return total Total amount ever vested
     */
    function getTotalVested(address account) external view returns (uint256 total) {
        VestingSchedule[] storage schedules = _vestingSchedules[account];
        uint256 schedulesLength = schedules.length;

        for (uint256 i = 0; i < schedulesLength;) {
            total += schedules[i].total;
            unchecked { ++i; }
        }
    }

    /**
     * @notice Get total released (claimed) tokens for an account
     * @param account Address to query
     * @return released Total amount already claimed
     */
    function getTotalReleased(address account) external view returns (uint256 released) {
        VestingSchedule[] storage schedules = _vestingSchedules[account];
        uint256 schedulesLength = schedules.length;

        for (uint256 i = 0; i < schedulesLength;) {
            released += schedules[i].released;
            unchecked { ++i; }
        }
    }

    /**
     * @notice Get comprehensive vesting summary for an account
     * @param account Address to query
     * @return totalVested Total amount ever vested
     * @return totalReleased Total amount already claimed
     * @return totalClaimable Currently claimable amount
     * @return scheduleCount Number of vesting schedules
     */
    function getVestingSummary(
        address account
    ) external view returns (
        uint256 totalVested,
        uint256 totalReleased,
        uint256 totalClaimable,
        uint256 scheduleCount
    ) {
        VestingSchedule[] storage schedules = _vestingSchedules[account];
        scheduleCount = schedules.length;

        for (uint256 i = 0; i < scheduleCount;) {
            totalVested += schedules[i].total;
            totalReleased += schedules[i].released;
            totalClaimable += _calculateClaimable(schedules[i]);
            unchecked { ++i; }
        }
    }

    // ============ Burn Functions ============

    /**
     * @notice Burn tokens from caller's balance
     * @param amount Amount to burn
     * @dev Overrides ERC20Burnable to add event and validation
     */
    function burn(uint256 amount) public override whenNotPaused {
        if (amount == 0) revert InvalidAmount();
        super.burn(amount);
        emit TokensBurned(msg.sender, amount);
    }

    /**
     * @notice Burn tokens from another account (requires approval)
     * @param account Address to burn from
     * @param amount Amount to burn
     * @dev Overrides ERC20Burnable to add event and validation
     */
    function burnFrom(address account, uint256 amount) public override whenNotPaused {
        if (amount == 0) revert InvalidAmount();
        super.burnFrom(account, amount);
        emit TokensBurned(account, amount);
    }

    // ============ Staking Tracking Functions ============

    /**
     * @notice Notify that tokens have been staked
     * @param staker Address of the staker
     * @param amount Amount staked
     * @dev Called by authorized staking contracts to track governance weight
     *      Does NOT transfer tokens - staking contract handles transfers
     */
    function notifyStake(
        address staker,
        uint256 amount
    ) external onlyAuthorizedStakingContract {
        if (staker == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount();

        stakedBalance[staker] += amount;
        _totalStaked += amount;

        emit StakeBalanceUpdated(staker, stakedBalance[staker], true);
    }

    /**
     * @notice Notify that tokens have been unstaked
     * @param staker Address of the staker
     * @param amount Amount unstaked
     * @dev Called by authorized staking contracts to track governance weight
     *      Does NOT transfer tokens - staking contract handles transfers
     */
    function notifyUnstake(
        address staker,
        uint256 amount
    ) external onlyAuthorizedStakingContract {
        if (staker == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount();

        // Safe subtraction (will revert if underflow)
        stakedBalance[staker] -= amount;
        _totalStaked -= amount;

        emit StakeBalanceUpdated(staker, stakedBalance[staker], false);
    }

    /**
     * @notice Get total FBT staked across all staking contracts
     * @return Total staked amount
     */
    function totalStaked() external view returns (uint256) {
        return _totalStaked;
    }

    /**
     * @notice Get effective balance for governance (liquid + staked)
     * @param account Address to query
     * @return Effective governance balance
     * @dev This can be used for voting weight calculations
     */
    function getGovernanceBalance(address account) external view returns (uint256) {
        return balanceOf(account) + stakedBalance[account];
    }

    /**
     * @notice Set authorized staking contract status
     * @param stakingContract Address to authorize/deauthorize
     * @param authorized Whether address should be authorized
     */
    function setAuthorizedStakingContract(
        address stakingContract,
        bool authorized
    ) external onlyOwner {
        if (stakingContract == address(0)) revert ZeroAddress();
        if (authorizedStakingContracts[stakingContract] == authorized) {
            revert AuthorizationUnchanged();
        }

        authorizedStakingContracts[stakingContract] = authorized;
        emit StakingContractAuthorizationChanged(stakingContract, authorized);
    }

    // ============ Admin Functions ============

    /**
     * @notice Pause all token operations
     * @dev Emergency use only - affects minting, vesting, burning, transfers
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause token operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ Upgrade Authorization ============

    /**
     * @notice Authorize contract upgrades
     * @param newImplementation Address of new implementation
     * @dev Only owner can upgrade
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    // ============ ERC20 Overrides ============

    /**
     * @notice Override _update to add pause check
     * @dev Called on every transfer, mint, and burn
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override whenNotPaused {
        super._update(from, to, value);
    }
}
