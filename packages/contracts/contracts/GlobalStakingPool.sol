// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./interfaces/IAavePool.sol";
import "./libraries/CircuitBreaker.sol";

// Interface for our new Reward Token
interface IFundBraveToken is IERC20 {
    function mint(address to, uint256 amount) external;
}

interface IReceiptOFT {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}

interface AutomationCompatibleInterface {
    function checkUpkeep(bytes calldata checkData) external view returns (bool upkeepNeeded, bytes memory performData);
    function performUpkeep(bytes calldata performData) external;
}

/**
 * @title GlobalStakingPool
 * @notice Stakes USDC -> Earns Aave Yield + FBT Rewards (Liquidity Mining)
 */
contract GlobalStakingPool is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, PausableUpgradeable, UUPSUpgradeable, AutomationCompatibleInterface {
    using SafeERC20 for IERC20;
    using CircuitBreaker for CircuitBreaker.BreakerConfig;

    // --- Core Contracts ---
    IAavePool public AAVE_POOL;
    IERC20 public USDC;   
    IERC20 public aUSDC;
    IReceiptOFT public receiptOFT;
    IFundBraveToken public FBT;

    // --- Config ---
    address public yieldDistributor; 

    // --- Staking Data ---
    uint256 public totalStakedPrincipal;
    mapping(address => uint256) public stakerPrincipal;
    
    // --- Liquidity Mining State (Synthetix Logic) ---
    uint256 public periodFinish;
    uint256 public rewardRate;
    uint256 public rewardsDuration;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    // --- Automation State ---
    uint256 public lastHarvestTimestamp;
    uint256 public constant HARVEST_INTERVAL = 1 days;

    // --- Circuit Breaker ---
    CircuitBreaker.BreakerConfig private circuitBreaker;

    event Staked(address indexed staker, uint256 usdcAmount);
    event Unstaked(address indexed staker, uint256 usdcAmount);
    event YieldHarvested(uint256 totalYield);
    event RewardAdded(uint256 reward);
    event RewardPaid(address indexed user, uint256 reward);

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
        address _yieldDistributor,
        address _owner
    ) external initializer {
        require(_aavePool != address(0), "Invalid Aave Pool");
        
        __Ownable_init(_owner);
        __ReentrancyGuard_init();
        __Pausable_init();

        AAVE_POOL = IAavePool(_aavePool);
        USDC = IERC20(_usdc);
        aUSDC = IERC20(_aUsdc);
        receiptOFT = IReceiptOFT(_receiptOFT);
        FBT = IFundBraveToken(_fbt);
        yieldDistributor = _yieldDistributor;

        rewardsDuration = 7 days; // Rewards are distributed over 7 day epochs

        // Infinite approve Aave to spend our USDC
        USDC.approve(address(AAVE_POOL), type(uint256).max);

        // Initialize circuit breaker with default limits
        // Max single: 10M USDC, Max hourly: 50M USDC, Max daily: 200M USDC
        circuitBreaker.initialize(
            10_000_000 * 10 ** 6, // 10M USDC max single transaction
            50_000_000 * 10 ** 6, // 50M USDC max hourly volume
            200_000_000 * 10 ** 6 // 200M USDC max daily volume
        );
    }

    // --- Liquidity Mining Modifier ---
    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
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
        harvestAndSendToDistributor();
    }

    // --- Core Logic ---

    function deposit(uint256 usdcAmount)
        external
        nonReentrant
        whenNotPaused
        updateReward(msg.sender)
    {
        require(usdcAmount > 0, "Amount must be > 0");

        // Check circuit breaker
        require(!circuitBreaker.isTriggered(), "Circuit breaker triggered");
        require(circuitBreaker.checkTransaction(usdcAmount), "Transaction blocked by circuit breaker");

        USDC.safeTransferFrom(msg.sender, address(this), usdcAmount);
        AAVE_POOL.supply(address(USDC), usdcAmount, address(this), 0);
        
        stakerPrincipal[msg.sender] += usdcAmount;
        totalStakedPrincipal += usdcAmount;

        if (address(receiptOFT) != address(0)) {
            receiptOFT.mint(msg.sender, usdcAmount);
        }

        emit Staked(msg.sender, usdcAmount);
    }

    function unstake(uint256 usdcAmount) external nonReentrant whenNotPaused updateReward(msg.sender) {
        require(usdcAmount > 0, "Amount must be > 0");
        require(stakerPrincipal[msg.sender] >= usdcAmount, "Insufficient stake");

        if (address(receiptOFT) != address(0)) {
            receiptOFT.burn(msg.sender, usdcAmount);
        }

        stakerPrincipal[msg.sender] -= usdcAmount;
        totalStakedPrincipal -= usdcAmount;

        AAVE_POOL.withdraw(address(USDC), usdcAmount, msg.sender);
        
        emit Unstaked(msg.sender, usdcAmount);
    }

    /**
     * @notice Claims accumulated FBT rewards
     */
    function getReward() external nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            FBT.mint(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    function harvestAndSendToDistributor() public nonReentrant whenNotPaused {
        uint256 currentAaveBalance = aUSDC.balanceOf(address(this));
        if (currentAaveBalance <= totalStakedPrincipal) return;
        
        uint256 yield = currentAaveBalance - totalStakedPrincipal;
        require(yield > 0, "No yield to harvest");

        AAVE_POOL.withdraw(address(USDC), yield, address(this));
        USDC.safeTransfer(yieldDistributor, yield);

        lastHarvestTimestamp = block.timestamp;
        emit YieldHarvested(yield);
    }

    // --- Reward Math Views ---

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

    function earned(address account) public view returns (uint256) {
        return (
            (stakerPrincipal[account] * (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18
        ) + rewards[account];
    }

    // --- Admin (Set Rewards) ---
    
    // Call this to start a new reward period (e.g. 1 million FBT over 7 days)
    function notifyRewardAmount(uint256 reward) external onlyOwner updateReward(address(0)) {
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

    function setYieldDistributor(address _newDistributor) external onlyOwner {
        yieldDistributor = _newDistributor;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // --- UUPS Upgrade Authorization ---

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // --- Circuit Breaker Functions ---

    /**
     * @notice Reset the circuit breaker after investigation
     * @dev Only owner can reset. Use with caution.
     */
    function resetCircuitBreaker() external onlyOwner {
        circuitBreaker.reset();
    }

    /**
     * @notice Update circuit breaker limits
     * @param maxTransaction Maximum single transaction amount
     * @param maxHourly Maximum hourly volume
     * @param maxDaily Maximum daily volume
     */
    function updateCircuitBreakerLimits(
        uint256 maxTransaction,
        uint256 maxHourly,
        uint256 maxDaily
    ) external onlyOwner {
        circuitBreaker.updateLimits(maxTransaction, maxHourly, maxDaily);
    }

    /**
     * @notice Check if circuit breaker is triggered
     * @return True if circuit breaker is triggered
     */
    function isCircuitBreakerTriggered() external view returns (bool) {
        return circuitBreaker.isTriggered();
    }

    /**
     * @notice Get remaining transaction capacity
     * @return maxSingle Maximum single transaction allowed
     * @return hourlyRemaining Remaining hourly capacity
     * @return dailyRemaining Remaining daily capacity
     */
    function getCircuitBreakerStatus()
        external
        view
        returns (
            uint256 maxSingle,
            uint256 hourlyRemaining,
            uint256 dailyRemaining
        )
    {
        return (
            circuitBreaker.getMaxTransactionAmount(),
            circuitBreaker.getRemainingHourlyCapacity(),
            circuitBreaker.getRemainingDailyCapacity()
        );
    }

    /**
     * @dev Storage gap for future upgrades
     * This reserves storage slots to allow adding new state variables in future upgrades
     * without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}