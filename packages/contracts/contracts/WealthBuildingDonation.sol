// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IAavePool.sol";

/**
 * @title IStockSwapAdapter
 * @notice Extended swap interface for swapping USDC to tokenized stocks (Backed Finance tokens)
 * @dev This interface extends beyond the base ISwapAdapter to support arbitrary token swaps
 */
interface IStockSwapAdapter {
    /**
     * @notice Swaps USDC to a target token (e.g., Backed Finance tokenized stocks)
     * @param tokenOut The target token to receive (e.g., bCSPX, bIB01)
     * @param usdcAmountIn Amount of USDC to swap
     * @param minAmountOut Minimum amount of tokenOut to receive (slippage protection)
     * @return amountOut Actual amount of tokenOut received
     */
    function swapUSDCToToken(
        address tokenOut,
        uint256 usdcAmountIn,
        uint256 minAmountOut
    ) external returns (uint256 amountOut);

    /**
     * @notice Gets a quote for swapping USDC to a target token
     * @param tokenOut The target token address
     * @param usdcAmountIn Amount of USDC to swap
     * @return expectedOut Expected amount of tokenOut
     */
    function getQuote(
        address tokenOut,
        uint256 usdcAmountIn
    ) external view returns (uint256 expectedOut);
}

/**
 * @title WealthBuildingDonation
 * @author FundBrave Team
 * @notice Enables "zero-cost donations" where donors build wealth while supporting causes
 * @dev
 * When someone donates:
 * - 80% goes directly to the fundraiser beneficiary (minus 2% platform fee)
 * - 20% is staked permanently in Aave as an endowment
 * - Yield from endowment splits: 30% to cause (perpetual income), 70% to donor (as tokenized stocks)
 *
 * Key Features:
 * - Permanent endowment (principal never withdrawable)
 * - Perpetual income stream for causes
 * - Donor wealth building via tokenized stocks (Backed Finance)
 * - Transparent Proxy upgradeable pattern (via hardhat-upgrades)
 *
 * Security Considerations:
 * - ReentrancyGuard on all external state-changing functions
 * - CEI pattern followed throughout
 * - Access control for admin functions
 * - Input validation on all public functions
 */
contract WealthBuildingDonation is
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    // ============ Custom Errors ============

    /// @notice Thrown when donation amount is zero or invalid
    error InvalidAmount();

    /// @notice Thrown when fundraiser ID is not registered
    error InvalidFundraiser();

    /// @notice Thrown when donor has no endowment for the specified fundraiser
    error NoEndowment();

    /// @notice Thrown when there is no yield available to harvest
    error NoYieldAvailable();

    /// @notice Thrown when attempting to use an unsupported stock token
    error StockNotSupported();

    /// @notice Thrown when a zero address is provided where non-zero is required
    error ZeroAddress();

    /// @notice Thrown when arrays have mismatched lengths
    error ArrayLengthMismatch();

    /// @notice Thrown when caller is not authorized
    error Unauthorized();

    /// @notice Thrown when no stocks are configured for swaps
    error NoStocksConfigured();

    /// @notice Thrown when swap returns insufficient output
    error InsufficientSwapOutput();

    // ============ Events ============

    /**
     * @notice Emitted when a donation is made
     * @param donor Address of the donor
     * @param fundraiserId ID of the fundraiser receiving donation
     * @param totalAmount Total donation amount in USDC
     * @param directAmount Amount sent directly to beneficiary
     * @param endowmentAmount Amount staked as permanent endowment
     * @param platformFee Fee collected by platform
     */
    event DonationMade(
        address indexed donor,
        uint256 indexed fundraiserId,
        uint256 totalAmount,
        uint256 directAmount,
        uint256 endowmentAmount,
        uint256 platformFee
    );

    /**
     * @notice Emitted when yield is harvested and distributed
     * @param donor Address of the donor whose endowment generated yield
     * @param fundraiserId ID of the associated fundraiser
     * @param yieldAmount Total yield harvested
     * @param causeShare Amount sent to cause (30%)
     * @param donorShare Amount converted to stocks for donor (70%)
     */
    event YieldHarvested(
        address indexed donor,
        uint256 indexed fundraiserId,
        uint256 yieldAmount,
        uint256 causeShare,
        uint256 donorShare
    );

    /**
     * @notice Emitted when USDC is swapped to tokenized stocks for a donor
     * @param donor Address of the donor receiving stocks
     * @param stockToken Address of the tokenized stock (e.g., bCSPX)
     * @param usdcAmount Amount of USDC used for purchase
     * @param stockAmount Amount of stock tokens received
     */
    event StockPurchased(
        address indexed donor,
        address indexed stockToken,
        uint256 usdcAmount,
        uint256 stockAmount
    );

    /**
     * @notice Emitted when a new stock token is added to supported list
     * @param stockToken Address of the newly supported stock token
     */
    event StockAdded(address indexed stockToken);

    /**
     * @notice Emitted when a stock token is removed from supported list
     * @param stockToken Address of the removed stock token
     */
    event StockRemoved(address indexed stockToken);

    /**
     * @notice Emitted when a fundraiser is registered
     * @param fundraiserId ID of the registered fundraiser
     * @param beneficiary Address that will receive donations
     */
    event FundraiserRegistered(uint256 indexed fundraiserId, address indexed beneficiary);

    /**
     * @notice Emitted when platform treasury is updated
     * @param oldTreasury Previous treasury address
     * @param newTreasury New treasury address
     */
    event PlatformTreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    /**
     * @notice Emitted when swap adapter is updated
     * @param oldAdapter Previous adapter address
     * @param newAdapter New adapter address
     */
    event SwapAdapterUpdated(address indexed oldAdapter, address indexed newAdapter);

    /**
     * @notice Emitted when donor claims their accumulated stock tokens
     * @param donor Address of the donor
     * @param stockToken Address of the stock token claimed
     * @param amount Amount of stock tokens claimed
     */
    event StocksClaimed(address indexed donor, address indexed stockToken, uint256 amount);

    // ============ Constants ============

    /// @notice Basis points for direct donation (80%)
    uint256 public constant DIRECT_SHARE_BPS = 8000;

    /// @notice Basis points for endowment (20%)
    uint256 public constant ENDOWMENT_SHARE_BPS = 2000;

    /// @notice Basis points of yield going to cause (30%)
    uint256 public constant CAUSE_YIELD_BPS = 3000;

    /// @notice Basis points of yield going to donor as stocks (70%)
    uint256 public constant DONOR_YIELD_BPS = 7000;

    /// @notice Platform fee in basis points (2% of direct donation)
    uint256 public constant PLATFORM_FEE_BPS = 200;

    /// @notice Total basis points denominator
    uint256 public constant BASIS_POINTS = 10000;

    /// @notice Minimum donation amount (1 USDC with 6 decimals)
    uint256 public constant MIN_DONATION = 1e6;

    // ============ State Variables ============

    /// @notice Aave V3 Pool contract for yield generation
    IAavePool public aavePool;

    /// @notice USDC token contract
    IERC20 public usdc;

    /// @notice Aave aUSDC token contract (yield-bearing)
    IERC20 public aUsdc;

    /// @notice Adapter for swapping USDC to tokenized stocks
    IStockSwapAdapter public swapAdapter;

    /// @notice Address receiving platform fees
    address public platformTreasury;

    /// @notice Authorized factory address that can register fundraisers
    address public authorizedFactory;

    /// @notice Mapping of fundraiser ID to beneficiary address
    mapping(uint256 => address) public fundraiserBeneficiaries;

    /// @notice Array of supported tokenized stock addresses
    address[] public supportedStocks;

    /// @notice Quick lookup for stock support status
    mapping(address => bool) public isStockSupported;

    /// @notice Default stock token for automatic swaps (first in supportedStocks)
    address public defaultStock;

    /// @notice Total principal staked across all endowments
    uint256 public totalEndowmentPrincipal;

    /// @notice Total principal per fundraiser
    mapping(uint256 => uint256) public fundraiserEndowmentPrincipal;

    /// @notice Timestamp of last global yield harvest
    uint256 public lastGlobalHarvestTime;

    /**
     * @notice Tracks individual donor's endowment per fundraiser
     * @param principal Amount staked permanently (never withdrawable)
     * @param lifetimeYield Total yield generated since donation
     * @param causeYieldPaid Cumulative yield sent to cause
     * @param donorStockValue Cumulative USDC value converted to stocks
     * @param lastHarvestTime Timestamp of last yield harvest for this endowment
     */
    struct EndowmentRecord {
        uint256 principal;
        uint256 lifetimeYield;
        uint256 causeYieldPaid;
        uint256 donorStockValue;
        uint256 lastHarvestTime;
    }

    /// @notice Endowment records: donor => fundraiserId => EndowmentRecord
    mapping(address => mapping(uint256 => EndowmentRecord)) public endowments;

    /// @notice Stock token balances held for donors: donor => stockToken => balance
    mapping(address => mapping(address => uint256)) public donorStockBalances;

    /// @notice Accumulated yield per unit of principal (scaled by 1e18)
    uint256 public accumulatedYieldPerPrincipal;

    /// @notice Tracks yield already accounted for per endowment
    mapping(address => mapping(uint256 => uint256)) public endowmentYieldDebt;

    /// @notice Storage gap for future upgrades
    uint256[40] private __gap;

    // ============ Modifiers ============

    /**
     * @notice Ensures fundraiser is registered before operations
     * @param fundraiserId The fundraiser ID to validate
     */
    modifier validFundraiser(uint256 fundraiserId) {
        if (fundraiserBeneficiaries[fundraiserId] == address(0)) {
            revert InvalidFundraiser();
        }
        _;
    }

    // ============ Constructor & Initializer ============

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract with required dependencies
     * @param _aavePool Aave V3 Pool address
     * @param _usdc USDC token address
     * @param _aUsdc Aave aUSDC token address
     * @param _swapAdapter Stock swap adapter address
     * @param _platformTreasury Address to receive platform fees
     * @param _owner Contract owner address
     */
    function initialize(
        address _aavePool,
        address _usdc,
        address _aUsdc,
        address _swapAdapter,
        address _platformTreasury,
        address _owner
    ) external initializer {
        if (_aavePool == address(0)) revert ZeroAddress();
        if (_usdc == address(0)) revert ZeroAddress();
        if (_aUsdc == address(0)) revert ZeroAddress();
        if (_platformTreasury == address(0)) revert ZeroAddress();
        if (_owner == address(0)) revert ZeroAddress();
        // Note: swapAdapter can be zero initially and set later

        __Ownable_init(_owner);
        __ReentrancyGuard_init();
        __Pausable_init();

        aavePool = IAavePool(_aavePool);
        usdc = IERC20(_usdc);
        aUsdc = IERC20(_aUsdc);
        swapAdapter = IStockSwapAdapter(_swapAdapter);
        platformTreasury = _platformTreasury;

        // Approve Aave Pool to spend our USDC (infinite approval)
        usdc.forceApprove(address(aavePool), type(uint256).max);
    }

    // ============ Core Donation Function ============

    /**
     * @notice Process a donation with wealth-building split
     * @dev Called by FundraiserFactory or directly with prior USDC approval
     *
     * Split breakdown for $1000 donation:
     * - $800 (80%) -> Beneficiary (direct impact)
     * - $180 (18%) -> Aave endowment (permanent)
     * - $20 (2%) -> Platform treasury
     *
     * Platform fee is taken from the endowment portion so the cause
     * always receives exactly 80% of the donation.
     *
     * @param donor Address making the donation
     * @param fundraiserId ID of the fundraiser to donate to
     * @param amount Total USDC amount being donated
     * @param beneficiary Address to receive direct donation (passed for validation)
     * @return directAmount Amount sent to beneficiary
     * @return endowmentAmount Amount staked in Aave
     */
    function donate(
        address donor,
        uint256 fundraiserId,
        uint256 amount,
        address beneficiary
    )
        external
        nonReentrant
        whenNotPaused
        validFundraiser(fundraiserId)
        returns (uint256 directAmount, uint256 endowmentAmount)
    {
        // Input validation
        if (amount < MIN_DONATION) revert InvalidAmount();
        if (donor == address(0)) revert ZeroAddress();

        // Verify beneficiary matches registered one
        address registeredBeneficiary = fundraiserBeneficiaries[fundraiserId];
        if (beneficiary != registeredBeneficiary) revert InvalidFundraiser();

        // Transfer USDC from caller to this contract
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        // Calculate splits: cause gets exactly 80%, platform fee from endowment
        uint256 platformFee;
        unchecked {
            // Direct to beneficiary: exactly 80% of total
            directAmount = (amount * DIRECT_SHARE_BPS) / BASIS_POINTS;

            // Platform fee: 2% of total (taken from endowment portion)
            platformFee = (amount * PLATFORM_FEE_BPS) / BASIS_POINTS;

            // Endowment: remainder (20% - 2% = 18%)
            endowmentAmount = amount - directAmount - platformFee;
        }

        // === Effects: Update state before external calls (CEI pattern) ===

        // Update endowment tracking
        EndowmentRecord storage endowment = endowments[donor][fundraiserId];

        // If this is a new endowment, set the debt to current accumulated yield
        if (endowment.principal == 0) {
            endowmentYieldDebt[donor][fundraiserId] = accumulatedYieldPerPrincipal;
        }

        unchecked {
            endowment.principal += endowmentAmount;
            fundraiserEndowmentPrincipal[fundraiserId] += endowmentAmount;
            totalEndowmentPrincipal += endowmentAmount;
        }

        endowment.lastHarvestTime = block.timestamp;

        // === Interactions: External calls ===

        // 1. Send direct amount to beneficiary
        usdc.safeTransfer(beneficiary, directAmount);

        // 2. Send platform fee to treasury
        usdc.safeTransfer(platformTreasury, platformFee);

        // 3. Stake endowment in Aave
        aavePool.supply(address(usdc), endowmentAmount, address(this), 0);

        emit DonationMade(
            donor,
            fundraiserId,
            amount,
            directAmount,
            endowmentAmount,
            platformFee
        );

        return (directAmount, endowmentAmount);
    }

    // ============ Yield Harvesting ============

    /**
     * @notice Harvest and distribute yield for a specific donor/fundraiser pair
     * @dev Anyone can call this to trigger yield distribution
     *
     * Yield distribution:
     * - 30% sent to fundraiser beneficiary (perpetual income)
     * - 70% swapped to tokenized stocks for donor
     *
     * @param donor Address of the endowment holder
     * @param fundraiserId ID of the fundraiser
     */
    function harvestYield(
        address donor,
        uint256 fundraiserId
    )
        external
        nonReentrant
        whenNotPaused
        validFundraiser(fundraiserId)
    {
        _harvestYieldInternal(donor, fundraiserId);
    }

    /**
     * @notice Batch harvest yield for multiple donor/fundraiser pairs
     * @dev Gas-efficient method for automation (e.g., Chainlink Keepers)
     * @param donors Array of donor addresses
     * @param fundraiserIds Array of corresponding fundraiser IDs
     */
    function harvestYieldBatch(
        address[] calldata donors,
        uint256[] calldata fundraiserIds
    )
        external
        nonReentrant
        whenNotPaused
    {
        if (donors.length != fundraiserIds.length) revert ArrayLengthMismatch();

        uint256 length = donors.length;
        for (uint256 i = 0; i < length;) {
            // Skip invalid entries silently to not fail entire batch
            if (fundraiserBeneficiaries[fundraiserIds[i]] != address(0)) {
                _harvestYieldInternal(donors[i], fundraiserIds[i]);
            }
            unchecked { ++i; }
        }

        lastGlobalHarvestTime = block.timestamp;
    }

    /**
     * @notice Internal yield harvesting logic
     * @dev Calculates proportional yield, distributes to cause and swaps to stocks
     * @param donor Address of the endowment holder
     * @param fundraiserId ID of the fundraiser
     */
    function _harvestYieldInternal(
        address donor,
        uint256 fundraiserId
    ) internal {
        EndowmentRecord storage endowment = endowments[donor][fundraiserId];

        if (endowment.principal == 0) revert NoEndowment();

        // Calculate total yield available in contract
        uint256 currentAUSDCBalance = aUsdc.balanceOf(address(this));
        if (currentAUSDCBalance <= totalEndowmentPrincipal) revert NoYieldAvailable();

        uint256 totalYield;
        unchecked {
            totalYield = currentAUSDCBalance - totalEndowmentPrincipal;
        }

        // Calculate this endowment's proportional share of yield
        // Using high precision to avoid rounding errors
        uint256 fundraiserTotalPrincipal = fundraiserEndowmentPrincipal[fundraiserId];
        if (fundraiserTotalPrincipal == 0) revert NoYieldAvailable();

        // Endowment's share = (endowment.principal / totalEndowmentPrincipal) * totalYield
        uint256 endowmentYield = (endowment.principal * totalYield) / totalEndowmentPrincipal;

        if (endowmentYield == 0) revert NoYieldAvailable();

        // Calculate yield splits
        uint256 causeShare;
        uint256 donorShare;
        unchecked {
            causeShare = (endowmentYield * CAUSE_YIELD_BPS) / BASIS_POINTS;
            donorShare = endowmentYield - causeShare; // Remainder to avoid dust
        }

        // Update state before external calls
        unchecked {
            endowment.lifetimeYield += endowmentYield;
            endowment.causeYieldPaid += causeShare;
            endowment.donorStockValue += donorShare;
        }
        endowment.lastHarvestTime = block.timestamp;

        // Withdraw yield from Aave
        aavePool.withdraw(address(usdc), endowmentYield, address(this));

        // Send cause share to beneficiary
        address beneficiary = fundraiserBeneficiaries[fundraiserId];
        if (causeShare > 0) {
            usdc.safeTransfer(beneficiary, causeShare);
        }

        // Swap donor share to stocks
        if (donorShare > 0) {
            _swapYieldToStocks(donor, donorShare);
        }

        emit YieldHarvested(
            donor,
            fundraiserId,
            endowmentYield,
            causeShare,
            donorShare
        );
    }

    /**
     * @notice Swap USDC yield to tokenized stocks for donor
     * @dev Uses CowSwap adapter for MEV protection
     * @param donor Address to credit stock tokens to
     * @param yieldAmount Amount of USDC to swap
     */
    function _swapYieldToStocks(
        address donor,
        uint256 yieldAmount
    ) internal {
        // Check if swap adapter and stocks are configured
        if (address(swapAdapter) == address(0) || supportedStocks.length == 0) {
            // If no swap configured, hold USDC for donor (they can claim later)
            // Store as "default" stock balance using zero address as placeholder
            unchecked {
                donorStockBalances[donor][address(0)] += yieldAmount;
            }
            return;
        }

        // Use default stock or first available
        address targetStock = defaultStock != address(0) ? defaultStock : supportedStocks[0];

        // Approve swap adapter
        usdc.forceApprove(address(swapAdapter), yieldAmount);

        // Get quote for slippage calculation (allow 1% slippage)
        uint256 expectedOut = swapAdapter.getQuote(targetStock, yieldAmount);
        uint256 minAmountOut = (expectedOut * 9900) / BASIS_POINTS;

        // Execute swap
        uint256 stockReceived = swapAdapter.swapUSDCToToken(
            targetStock,
            yieldAmount,
            minAmountOut
        );

        // Credit stocks to donor
        unchecked {
            donorStockBalances[donor][targetStock] += stockReceived;
        }

        emit StockPurchased(donor, targetStock, yieldAmount, stockReceived);
    }

    // ============ Stock Claiming ============

    /**
     * @notice Allows donor to claim their accumulated stock tokens
     * @param stockToken Address of the stock token to claim
     * @param amount Amount to claim (0 for full balance)
     */
    function claimStocks(
        address stockToken,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        uint256 balance = donorStockBalances[msg.sender][stockToken];

        if (balance == 0) revert NoEndowment();

        uint256 claimAmount = amount == 0 ? balance : amount;
        if (claimAmount > balance) revert InvalidAmount();

        unchecked {
            donorStockBalances[msg.sender][stockToken] -= claimAmount;
        }

        // Handle USDC held when no swap was configured (address(0) key)
        if (stockToken == address(0)) {
            usdc.safeTransfer(msg.sender, claimAmount);
        } else {
            IERC20(stockToken).safeTransfer(msg.sender, claimAmount);
        }

        emit StocksClaimed(msg.sender, stockToken, claimAmount);
    }

    // ============ View Functions ============

    /**
     * @notice Get complete endowment information for a donor/fundraiser pair
     * @param donor Address of the donor
     * @param fundraiserId ID of the fundraiser
     * @return record The endowment record
     */
    function getEndowmentInfo(
        address donor,
        uint256 fundraiserId
    ) external view returns (EndowmentRecord memory record) {
        return endowments[donor][fundraiserId];
    }

    /**
     * @notice Get donor's complete stock portfolio
     * @param donor Address of the donor
     * @return tokens Array of stock token addresses
     * @return balances Array of corresponding balances
     */
    function getDonorStockPortfolio(
        address donor
    ) external view returns (address[] memory tokens, uint256[] memory balances) {
        uint256 stockCount = supportedStocks.length;

        // Count non-zero balances (+1 for potential USDC holding)
        uint256 nonZeroCount = 0;

        // Check USDC placeholder balance
        if (donorStockBalances[donor][address(0)] > 0) {
            nonZeroCount++;
        }

        for (uint256 i = 0; i < stockCount;) {
            if (donorStockBalances[donor][supportedStocks[i]] > 0) {
                nonZeroCount++;
            }
            unchecked { ++i; }
        }

        tokens = new address[](nonZeroCount);
        balances = new uint256[](nonZeroCount);

        uint256 idx = 0;

        // Include USDC placeholder if exists
        if (donorStockBalances[donor][address(0)] > 0) {
            tokens[idx] = address(0); // Represents unclaimed USDC
            balances[idx] = donorStockBalances[donor][address(0)];
            idx++;
        }

        for (uint256 i = 0; i < stockCount;) {
            address stock = supportedStocks[i];
            uint256 balance = donorStockBalances[donor][stock];
            if (balance > 0) {
                tokens[idx] = stock;
                balances[idx] = balance;
                idx++;
            }
            unchecked { ++i; }
        }

        return (tokens, balances);
    }

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
    ) external view returns (uint256 causeYield, uint256 donorYield) {
        EndowmentRecord storage endowment = endowments[donor][fundraiserId];

        if (endowment.principal == 0) return (0, 0);

        uint256 currentAUSDCBalance = aUsdc.balanceOf(address(this));
        if (currentAUSDCBalance <= totalEndowmentPrincipal) return (0, 0);

        uint256 totalYield = currentAUSDCBalance - totalEndowmentPrincipal;

        // Calculate proportional share
        uint256 endowmentYield = (endowment.principal * totalYield) / totalEndowmentPrincipal;

        causeYield = (endowmentYield * CAUSE_YIELD_BPS) / BASIS_POINTS;
        donorYield = endowmentYield - causeYield;

        return (causeYield, donorYield);
    }

    /**
     * @notice Get total endowment statistics for a fundraiser
     * @param fundraiserId ID of the fundraiser
     * @return principal Total principal staked for this fundraiser
     * @return estimatedYield Estimated pending yield for this fundraiser
     */
    function getTotalEndowmentValue(
        uint256 fundraiserId
    ) external view returns (uint256 principal, uint256 estimatedYield) {
        principal = fundraiserEndowmentPrincipal[fundraiserId];

        if (totalEndowmentPrincipal == 0) return (principal, 0);

        uint256 currentAUSDCBalance = aUsdc.balanceOf(address(this));
        if (currentAUSDCBalance <= totalEndowmentPrincipal) return (principal, 0);

        uint256 totalYield = currentAUSDCBalance - totalEndowmentPrincipal;

        // Fundraiser's proportional share of yield
        estimatedYield = (principal * totalYield) / totalEndowmentPrincipal;

        return (principal, estimatedYield);
    }

    /**
     * @notice Get list of all supported stock tokens
     * @return Array of supported stock token addresses
     */
    function getSupportedStocks() external view returns (address[] memory) {
        return supportedStocks;
    }

    /**
     * @notice Get platform statistics
     * @return _totalPrincipal Total endowment principal across all fundraisers
     * @return _totalAUSDC Current aUSDC balance (principal + yield)
     * @return _pendingYield Total pending yield to be harvested
     */
    function getPlatformStats() external view returns (
        uint256 _totalPrincipal,
        uint256 _totalAUSDC,
        uint256 _pendingYield
    ) {
        _totalPrincipal = totalEndowmentPrincipal;
        _totalAUSDC = aUsdc.balanceOf(address(this));
        _pendingYield = _totalAUSDC > _totalPrincipal ? _totalAUSDC - _totalPrincipal : 0;
    }

    // ============ Admin Functions ============

    /**
     * @notice Register a new fundraiser for wealth-building donations
     * @dev Called by FundraiserFactory when creating new campaigns
     * @param fundraiserId Unique identifier for the fundraiser
     * @param beneficiary Address to receive donations and yield
     */
    function registerFundraiser(
        uint256 fundraiserId,
        address beneficiary
    ) external {
        require(msg.sender == owner() || msg.sender == authorizedFactory, "WBD: Not authorized");
        if (beneficiary == address(0)) revert ZeroAddress();
        if (fundraiserBeneficiaries[fundraiserId] != address(0)) {
            revert InvalidFundraiser(); // Already registered
        }

        fundraiserBeneficiaries[fundraiserId] = beneficiary;

        emit FundraiserRegistered(fundraiserId, beneficiary);
    }

    /**
     * @notice Update beneficiary address for a fundraiser
     * @dev Use with caution - changes where donations are sent
     * @param fundraiserId ID of the fundraiser
     * @param newBeneficiary New beneficiary address
     */
    function updateFundraiserBeneficiary(
        uint256 fundraiserId,
        address newBeneficiary
    ) external onlyOwner validFundraiser(fundraiserId) {
        if (newBeneficiary == address(0)) revert ZeroAddress();

        fundraiserBeneficiaries[fundraiserId] = newBeneficiary;

        emit FundraiserRegistered(fundraiserId, newBeneficiary);
    }

    /**
     * @notice Add a tokenized stock to supported list
     * @param stockToken Address of the Backed Finance token (e.g., bCSPX)
     */
    function addSupportedStock(address stockToken) external onlyOwner {
        if (stockToken == address(0)) revert ZeroAddress();
        if (isStockSupported[stockToken]) revert InvalidAmount(); // Already added

        supportedStocks.push(stockToken);
        isStockSupported[stockToken] = true;

        // Set as default if first stock
        if (supportedStocks.length == 1) {
            defaultStock = stockToken;
        }

        emit StockAdded(stockToken);
    }

    /**
     * @notice Remove a tokenized stock from supported list
     * @param stockToken Address of the stock token to remove
     */
    function removeSupportedStock(address stockToken) external onlyOwner {
        if (!isStockSupported[stockToken]) revert StockNotSupported();

        isStockSupported[stockToken] = false;

        // Remove from array (swap and pop)
        uint256 length = supportedStocks.length;
        for (uint256 i = 0; i < length;) {
            if (supportedStocks[i] == stockToken) {
                supportedStocks[i] = supportedStocks[length - 1];
                supportedStocks.pop();
                break;
            }
            unchecked { ++i; }
        }

        // Update default if removed
        if (defaultStock == stockToken) {
            defaultStock = supportedStocks.length > 0 ? supportedStocks[0] : address(0);
        }

        emit StockRemoved(stockToken);
    }

    /**
     * @notice Set the default stock token for yield swaps
     * @param stockToken Address of the stock token to set as default
     */
    function setDefaultStock(address stockToken) external onlyOwner {
        if (stockToken != address(0) && !isStockSupported[stockToken]) {
            revert StockNotSupported();
        }
        defaultStock = stockToken;
    }

    /**
     * @notice Set the authorized factory address that can register fundraisers
     * @param _factory New factory address
     */
    function setAuthorizedFactory(address _factory) external onlyOwner {
        authorizedFactory = _factory;
    }

    /**
     * @notice Update platform treasury address
     * @param _platformTreasury New treasury address
     */
    function setPlatformTreasury(address _platformTreasury) external onlyOwner {
        if (_platformTreasury == address(0)) revert ZeroAddress();

        address oldTreasury = platformTreasury;
        platformTreasury = _platformTreasury;

        emit PlatformTreasuryUpdated(oldTreasury, _platformTreasury);
    }

    /**
     * @notice Update swap adapter for stock purchases
     * @param _swapAdapter New swap adapter address
     */
    function setSwapAdapter(address _swapAdapter) external onlyOwner {
        address oldAdapter = address(swapAdapter);
        swapAdapter = IStockSwapAdapter(_swapAdapter);

        // Approve new adapter if set
        if (_swapAdapter != address(0)) {
            usdc.forceApprove(_swapAdapter, type(uint256).max);
        }

        // Revoke old adapter approval
        if (oldAdapter != address(0)) {
            usdc.forceApprove(oldAdapter, 0);
        }

        emit SwapAdapterUpdated(oldAdapter, _swapAdapter);
    }

    /**
     * @notice Pause contract operations
     * @dev Emergency use only - blocks donations and harvests
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

    // ============ Emergency Functions ============

    /**
     * @notice Emergency withdrawal of stuck tokens (not endowment principal)
     * @dev Only for tokens accidentally sent to contract
     * @param token Address of token to rescue
     * @param to Address to send tokens to
     * @param amount Amount to withdraw
     */
    function rescueTokens(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();

        // Prevent withdrawing endowment (aUSDC)
        if (token == address(aUsdc)) {
            uint256 available = aUsdc.balanceOf(address(this));
            // Only allow withdrawing excess beyond principal
            uint256 maxWithdraw = available > totalEndowmentPrincipal
                ? available - totalEndowmentPrincipal
                : 0;
            if (amount > maxWithdraw) revert InvalidAmount();
        }

        IERC20(token).safeTransfer(to, amount);
    }

    // ============ UUPS Upgrade Authorization ============

    /**
     * @notice Authorize contract upgrades (UUPS pattern)
     * @dev Only owner can authorize upgrades
     * @param newImplementation Address of the new implementation
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
