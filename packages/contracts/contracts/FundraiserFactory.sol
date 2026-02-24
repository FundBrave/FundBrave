// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./interfaces/ISwapAdapter.sol";
import "./libraries/FundraiserFactoryLib.sol";

import { Fundraiser } from "./Fundraiser.sol";
import { StakingPool } from "./StakingPool.sol";
import { MorphoStakingPool } from "./MorphoStakingPool.sol";
import { WealthBuildingDonation } from "./WealthBuildingDonation.sol";
import { ImpactDAOPool } from "./ImpactDAOPool.sol";
import { PlatformTreasury } from "./PlatformTreasury.sol";

/// @dev Minimal interface for ReceiptOFT controller management
interface IReceiptOFTController {
    function setController(address _controller, bool _enabled) external;
}

/**
 * @title FundraiserFactory
 * @author FundBrave Team
 * @notice Factory contract for deploying and managing fundraiser campaigns
 * @dev Uses Clones for Fundraiser and StakingPool to minimize contract size.
 *      MorphoStakingPool is currently deployed normally (not cloned).
 *      Integrates WealthBuildingDonation and ImpactDAOPool mechanisms.
 */
contract FundraiserFactory is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIED_CREATOR_ROLE = keccak256("VERIFIED_CREATOR_ROLE");
    using SafeERC20 for IERC20;
    using Clones for address;
    using FundraiserFactoryLib for Fundraiser[];

    // ============ Custom Errors ============

    error InvalidFundraiserId();
    error InvalidAmount();
    error ZeroAddress();
    error InvalidStakingPoolType();
    error AaveNotConfigured();
    error MorphoNotConfigured();
    error NoStakingPool();
    error WealthBuildingNotConfigured();
    error MessageAlreadyProcessed();
    error InvalidMessageHash();


    // ============ Implementations for Clones ============

    address public immutable fundraiserImplementation;
    address public immutable stakingPoolImplementation;

    // ============ State Variables ============

    Fundraiser[] private _fundraisers;
    mapping(address => Fundraiser[]) private _fundraisersByOwner;
    mapping(address => bool) public verifiedCreators;
    mapping(uint256 => bool) public activeFundraisers;
    mapping(uint256 => address) public stakingPools;

    /// @notice Tracks processed cross-chain message hashes to prevent replay attacks
    mapping(bytes32 => bool) public processedMessages;

    string[] public availableCategories;
    mapping(string => bool) private _categoryExists;

    // ============ Core Configuration ============

    ISwapAdapter public immutable swapAdapter;
    address public immutable USDC;
    address public immutable WETH;
    address public platformFeeRecipient;
    address public fundBraveBridge;
    address public receiptOFT;
    address public fbtToken;

    // ============ New Contract References ============

    /// @notice WealthBuildingDonation contract for 80/20 donation split mechanism
    WealthBuildingDonation public wealthBuildingDonation;

    /// @notice ImpactDAOPool contract for shared treasury staking
    ImpactDAOPool public impactDAOPool;

    /// @notice PlatformTreasury contract that receives platform fees
    PlatformTreasury public platformTreasury;

    // ============ Yield Configuration ============

    address public immutable AAVE_POOL;
    address public immutable A_USDC;
    address public immutable MORPHO_VAULT;
    uint8 public immutable stakingPoolType;

    // ============ Limits & Stats ============

    uint256 public currentId;
    uint256 constant MAX_LIMIT = 20;
    uint256 public minGoal = 100 * 10**6;
    uint256 public maxGoal = 10000000 * 10**6;
    uint256 public minDuration = 7 days;
    uint256 public maxDuration = 365 days;

    uint256 public totalFundraisersCreated;
    uint256 public totalFundsRaised;
    uint256 public activeFundraiserCount;

    // ============ Events ============

    event FundraiserCreated(address indexed fundraiser, address indexed owner, uint256 indexed id, string name, uint256 goal, uint256 deadline);
    event StakingPoolCreated(uint256 indexed fundraiserId, address indexed poolAddress);
    event FundraiserDeactivated(uint256 indexed id, address indexed fundraiser);
    event CreatorVerified(address indexed creator);
    event CreatorUnverified(address indexed creator);
    event CategoryAdded(string category);
    event PlatformFeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
    event BridgeUpdated(address indexed newBridge);
    event ReceiptOFTUpdated(address indexed newReceiptOFT);
    event FBTUpdated(address indexed newFBT);

    /// @notice Emitted when a wealth-building donation is made
    event WealthBuildingDonationMade(
        address indexed donor,
        uint256 indexed fundraiserId,
        uint256 totalAmount,
        uint256 directAmount,
        uint256 endowmentAmount
    );

    /// @notice Emitted when WealthBuildingDonation contract is updated
    event WealthBuildingDonationUpdated(address indexed newAddress);

    /// @notice Emitted when ImpactDAOPool contract is updated
    event ImpactDAOPoolUpdated(address indexed newAddress);

    /// @notice Emitted when PlatformTreasury contract is updated
    event PlatformTreasuryUpdated(address indexed newAddress);

    // ============ Custom Error for Constructor ============
    error InvalidImplementation();
    error NotBridge();

    // ============ Constructor ============

    constructor(
        address _fundraiserImplementation,
        address _stakingPoolImplementation,
        address _swapAdapter,
        address _usdc,
        address _weth,
        address _platformFeeRecipient,
        address _aavePool,
        address _aUsdc,
        address _morphoVault,
        uint8 _stakingPoolType
    ) {
        if (_fundraiserImplementation == address(0)) revert InvalidImplementation();
        if (_stakingPoolImplementation == address(0)) revert InvalidImplementation();

        fundraiserImplementation = _fundraiserImplementation;
        stakingPoolImplementation = _stakingPoolImplementation;

        swapAdapter = ISwapAdapter(_swapAdapter);
        USDC = _usdc;
        WETH = _weth;
        platformFeeRecipient = _platformFeeRecipient;

        AAVE_POOL = _aavePool;
        A_USDC = _aUsdc;
        MORPHO_VAULT = _morphoVault;
        stakingPoolType = _stakingPoolType;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        _initDefaultCategories();
    }

    /// @dev Initializes default categories to reduce constructor bytecode
    function _initDefaultCategories() private {
        _addCategory("Medical");
        _addCategory("Education");
        _addCategory("Emergency");
        _addCategory("Community");
        _addCategory("Environment");
        _addCategory("Technology");
        _addCategory("Arts");
        _addCategory("Sports");
    }

    /// @notice BridgeRouter contract address (authorized to call cross-chain handlers)
    address public bridgeRouter;

    /// @notice Emitted when BridgeRouter is updated
    event BridgeRouterUpdated(address indexed newRouter);

    // ============ Modifiers ============

    /// @dev Allows calls from either the direct bridge or the BridgeRouter
    modifier onlyBridge() {
        if (msg.sender != fundBraveBridge && msg.sender != bridgeRouter) revert NotBridge();
        _;
    }

    // ============ Configuration Setters ============

    /**
     * @notice Sets the ReceiptOFT contract address
     * @param _receiptOFT Address of the ReceiptOFT contract
     */
    function setReceiptOFT(address _receiptOFT) external onlyRole(ADMIN_ROLE) {
        receiptOFT = _receiptOFT;
        emit ReceiptOFTUpdated(_receiptOFT);
    }

    /**
     * @notice Sets the FBT token address
     * @param _fbt Address of the FundBraveToken contract
     */
    function setFBT(address _fbt) external onlyRole(ADMIN_ROLE) {
        if (_fbt == address(0)) revert ZeroAddress();
        fbtToken = _fbt;
        emit FBTUpdated(_fbt);
    }

    /**
     * @notice Sets the WealthBuildingDonation contract address
     * @param _wealthBuildingDonation Address of the WealthBuildingDonation contract
     */
    function setWealthBuildingDonation(address _wealthBuildingDonation) external onlyRole(ADMIN_ROLE) {
        if (_wealthBuildingDonation == address(0)) revert ZeroAddress();
        wealthBuildingDonation = WealthBuildingDonation(_wealthBuildingDonation);
        emit WealthBuildingDonationUpdated(_wealthBuildingDonation);
    }

    /**
     * @notice Sets the ImpactDAOPool contract address
     * @param _impactDAOPool Address of the ImpactDAOPool contract
     */
    function setImpactDAOPool(address _impactDAOPool) external onlyRole(ADMIN_ROLE) {
        if (_impactDAOPool == address(0)) revert ZeroAddress();
        impactDAOPool = ImpactDAOPool(_impactDAOPool);
        emit ImpactDAOPoolUpdated(_impactDAOPool);
    }

    /**
     * @notice Sets the PlatformTreasury contract address
     * @param _platformTreasury Address of the PlatformTreasury contract
     */
    function setPlatformTreasury(address _platformTreasury) external onlyRole(ADMIN_ROLE) {
        if (_platformTreasury == address(0)) revert ZeroAddress();
        platformTreasury = PlatformTreasury(_platformTreasury);
        emit PlatformTreasuryUpdated(_platformTreasury);
    }

    // ============ Fundraiser Creation ============

    /**
     * @notice Creates a new fundraiser
     * @param name Name of the fundraiser
     * @param images Array of image URLs
     * @param categories Array of category strings
     * @param description Description of the fundraiser
     * @param region Geographic region
     * @param beneficiary Address to receive funds
     * @param goal Funding goal in USDC (6 decimals)
     * @param durationInDays Duration of the campaign
     * @return fundraiserAddress Address of the created fundraiser
     */
    function createFundraiser(
        string memory name,
        string[] memory images,
        string[] memory categories,
        string memory description,
        string memory region,
        address payable beneficiary,
        uint256 goal,
        uint256 durationInDays
    ) external nonReentrant whenNotPaused returns (address fundraiserAddress) {
        _validateFundraiserParams(name, images, categories, description, beneficiary, goal, durationInDays);

        fundraiserAddress = _createFundraiserInternal(
            name, images, categories, description, region, beneficiary, goal, durationInDays
        );
    }

    /**
     * @notice Creates a fundraiser for verified creators with minimal validation
     * @dev Only callable by addresses with VERIFIED_CREATOR_ROLE
     */
    function createVerifiedFundraiser(
        string memory name,
        string[] memory images,
        string[] memory categories,
        string memory description,
        string memory region,
        address payable beneficiary,
        uint256 goal,
        uint256 durationInDays
    ) external onlyRole(VERIFIED_CREATOR_ROLE) nonReentrant whenNotPaused returns (address) {
        if (bytes(name).length == 0) revert FundraiserFactoryLib.InvalidNameLength();
        if (beneficiary == address(0)) revert FundraiserFactoryLib.InvalidBeneficiary();
        if (goal == 0) revert InvalidAmount();

        return _createFundraiserInternal(
            name, images, categories, description, region, beneficiary, goal, durationInDays
        );
    }

    /// @dev Internal function to create and register a fundraiser
    function _createFundraiserInternal(
        string memory name,
        string[] memory images,
        string[] memory categories,
        string memory description,
        string memory region,
        address payable beneficiary,
        uint256 goal,
        uint256 durationInDays
    ) internal returns (address) {
        uint256 deadline = block.timestamp + (durationInDays * 1 days);
        address clone = fundraiserImplementation.clone();

        address feeRecipient = address(platformTreasury) != address(0)
            ? address(platformTreasury)
            : platformFeeRecipient;

        Fundraiser(clone).initialize(
            currentId, name, images, categories, description, region,
            beneficiary, msg.sender, goal, deadline, USDC, feeRecipient, address(this)
        );

        Fundraiser fundraiser = Fundraiser(clone);
        _fundraisers.push(fundraiser);
        _fundraisersByOwner[msg.sender].push(fundraiser);

        address poolAddress = _deployStakingPool(beneficiary);
        stakingPools[currentId] = poolAddress;
        activeFundraisers[currentId] = true;

        // Register fundraiser with WealthBuildingDonation for wealth building donations
        if (address(wealthBuildingDonation) != address(0)) {
            try wealthBuildingDonation.registerFundraiser(currentId, beneficiary) {} catch {}
        }

        unchecked {
            totalFundraisersCreated++;
            activeFundraiserCount++;
        }

        emit FundraiserCreated(clone, msg.sender, currentId, name, goal, deadline);
        emit StakingPoolCreated(currentId, poolAddress);

        unchecked { currentId++; }
        return clone;
    }

    // ============ Internal Functions ============

    function _validateFundraiserParams(
        string memory name,
        string[] memory images,
        string[] memory categories,
        string memory description,
        address beneficiary,
        uint256 goal,
        uint256 durationInDays
    ) internal view {
        FundraiserFactoryLib.validateFundraiserParams(
            name,
            images,
            categories,
            description,
            beneficiary,
            goal,
            durationInDays,
            minGoal,
            maxGoal,
            minDuration / 1 days,
            maxDuration / 1 days,
            _categoryExists
        );
    }

    /**
     * @notice Deploys a staking pool for a fundraiser
     * @dev Uses either Aave StakingPool (cloned) or MorphoStakingPool based on configuration
     * @param beneficiary Address of the fundraiser beneficiary
     * @return Address of the deployed staking pool
     */
    function _deployStakingPool(address beneficiary) internal returns (address) {
        address feeRecipient = address(platformTreasury) != address(0)
            ? address(platformTreasury)
            : platformFeeRecipient;

        if (stakingPoolType == 0) {
            if (AAVE_POOL == address(0)) revert AaveNotConfigured();
            address pool = stakingPoolImplementation.clone();
            StakingPool(pool).initialize(
                AAVE_POOL,
                USDC,
                A_USDC,
                receiptOFT,
                fbtToken,
                payable(beneficiary),
                feeRecipient,
                address(this),
                msg.sender
            );
            // Register pool as authorized controller on ReceiptOFT for mint/burn
            if (receiptOFT != address(0)) {
                IReceiptOFTController(receiptOFT).setController(pool, true);
            }
            return pool;
        } else if (stakingPoolType == 1) {
            if (MORPHO_VAULT == address(0)) revert MorphoNotConfigured();
            return address(new MorphoStakingPool(
                MORPHO_VAULT,
                USDC,
                fbtToken,
                payable(beneficiary),
                feeRecipient,
                address(this),
                msg.sender
            ));
        } else {
            revert InvalidStakingPoolType();
        }
    }

    // ============ Staking Functions ============

    /**
     * @notice Stakes native currency (ETH) into a fundraiser's staking pool
     * @param fundraiserId ID of the fundraiser to stake in
     */
    function stakeNative(uint256 fundraiserId) external payable nonReentrant whenNotPaused {
        if (msg.value == 0) revert InvalidAmount();
        address poolAddress = stakingPools[fundraiserId];
        if (poolAddress == address(0)) revert NoStakingPool();
        uint256 usdcAmount = _swapNativeToUSDC(msg.value);
        IERC20(USDC).safeTransfer(poolAddress, usdcAmount);
        _depositToPool(poolAddress, msg.sender, usdcAmount);
    }

    /**
     * @notice Stakes ERC20 tokens into a fundraiser's staking pool
     * @param fundraiserId ID of the fundraiser to stake in
     * @param token Address of the ERC20 token to stake
     * @param amount Amount of tokens to stake
     */
    function stakeERC20(uint256 fundraiserId, address token, uint256 amount) external nonReentrant whenNotPaused {
        address poolAddress = stakingPools[fundraiserId];
        if (poolAddress == address(0)) revert NoStakingPool();
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        uint256 usdcAmount = _swapToUSDC(token, amount);
        IERC20(USDC).safeTransfer(poolAddress, usdcAmount);
        _depositToPool(poolAddress, msg.sender, usdcAmount);
    }

    /// @dev Internal helper to deposit to appropriate staking pool type
    function _depositToPool(address poolAddress, address depositor, uint256 amount) internal {
        if (stakingPoolType == 0) {
            StakingPool(poolAddress).depositFor(depositor, amount);
        } else {
            MorphoStakingPool(poolAddress).depositFor(depositor, amount);
        }
    }

    // ============ Direct Donation Functions ============

    /**
     * @notice Donates native currency (ETH) to a fundraiser
     * @param fundraiserId ID of the fundraiser to donate to
     */
    function donateNative(uint256 fundraiserId) external payable nonReentrant whenNotPaused {
        if (fundraiserId >= _fundraisers.length) revert InvalidFundraiserId();
        Fundraiser fundraiser = _fundraisers[fundraiserId];
        uint256 usdcAmount = _swapNativeToUSDC(msg.value);
        IERC20(USDC).safeTransfer(address(fundraiser), usdcAmount);
        fundraiser.creditDonation(msg.sender, usdcAmount, "native-local");
        totalFundsRaised += usdcAmount;
    }

    /**
     * @notice Donates ERC20 tokens to a fundraiser
     * @param fundraiserId ID of the fundraiser to donate to
     * @param token Address of the ERC20 token to donate
     * @param amount Amount of tokens to donate
     */
    function donateERC20(uint256 fundraiserId, address token, uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert InvalidAmount();
        if (fundraiserId >= _fundraisers.length) revert InvalidFundraiserId();
        Fundraiser fundraiser = _fundraisers[fundraiserId];
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        uint256 usdcAmount = _swapToUSDC(token, amount);
        IERC20(USDC).safeTransfer(address(fundraiser), usdcAmount);
        fundraiser.creditDonation(msg.sender, usdcAmount, "erc20-local");
        totalFundsRaised += usdcAmount;
    }

    // ============ Wealth-Building Donation Functions ============

    /// @dev Shared internal logic for wealth-building donations
    function _executeWealthBuilding(address donor, uint256 fundraiserId, uint256 usdcAmount) internal {
        if (fundraiserId >= _fundraisers.length) revert InvalidFundraiserId();
        if (usdcAmount == 0) revert InvalidAmount();
        if (address(wealthBuildingDonation) == address(0)) revert WealthBuildingNotConfigured();
        Fundraiser fundraiser = _fundraisers[fundraiserId];
        IERC20(USDC).forceApprove(address(wealthBuildingDonation), usdcAmount);
        (uint256 directAmount, uint256 endowmentAmount) = wealthBuildingDonation.donate(
            donor, fundraiserId, usdcAmount, fundraiser.beneficiary()
        );
        fundraiser.creditDonation(donor, directAmount, "wealth-building");
        totalFundsRaised += usdcAmount;
        emit WealthBuildingDonationMade(donor, fundraiserId, usdcAmount, directAmount, endowmentAmount);
    }

    /// @notice Make a Wealth-Building donation in USDC (80% direct, 20% endowed)
    function donateWealthBuilding(uint256 fundraiserId, uint256 amount) external nonReentrant whenNotPaused {
        IERC20(USDC).safeTransferFrom(msg.sender, address(this), amount);
        _executeWealthBuilding(msg.sender, fundraiserId, amount);
    }

    /// @notice Make a Wealth-Building donation using any ERC20 token
    function donateWealthBuildingERC20(uint256 fundraiserId, address token, uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert InvalidAmount();
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        _executeWealthBuilding(msg.sender, fundraiserId, _swapToUSDC(token, amount));
    }

    /// @notice Make a Wealth-Building donation using native currency (ETH)
    function donateWealthBuildingNative(uint256 fundraiserId) external payable nonReentrant whenNotPaused {
        if (msg.value == 0) revert InvalidAmount();
        _executeWealthBuilding(msg.sender, fundraiserId, _swapNativeToUSDC(msg.value));
    }

    // ============ Cross-Chain Functions ============

    /// @dev Validates and marks a cross-chain message as processed (replay protection + hash verification)
    function _validateCrossChainMsg(
        address donor, uint256 fundraiserId, uint256 usdcAmount,
        bytes32 messageHash, uint32 sourceChainId, uint8 actionType
    ) internal {
        if (processedMessages[messageHash]) revert MessageAlreadyProcessed();
        bytes32 expectedHash = keccak256(abi.encodePacked(
            donor, fundraiserId, usdcAmount, sourceChainId, block.chainid, actionType
        ));
        if (messageHash != expectedHash) revert InvalidMessageHash();
        processedMessages[messageHash] = true;
    }

    function handleCrossChainDonation(
        address donor, uint256 fundraiserId, uint256 usdcAmount,
        bytes32 messageHash, uint32 sourceChainId
    ) external nonReentrant whenNotPaused onlyBridge {
        _validateCrossChainMsg(donor, fundraiserId, usdcAmount, messageHash, sourceChainId, 0);
        if (fundraiserId >= _fundraisers.length) revert InvalidFundraiserId();
        Fundraiser fundraiser = _fundraisers[fundraiserId];
        IERC20(USDC).safeTransfer(address(fundraiser), usdcAmount);
        fundraiser.creditDonation(donor, usdcAmount, "cross-chain");
        totalFundsRaised += usdcAmount;
    }

    function handleCrossChainStake(
        address donor, uint256 fundraiserId, uint256 usdcAmount,
        bytes32 messageHash, uint32 sourceChainId
    ) external nonReentrant whenNotPaused onlyBridge {
        _validateCrossChainMsg(donor, fundraiserId, usdcAmount, messageHash, sourceChainId, 1);
        address poolAddress = stakingPools[fundraiserId];
        if (poolAddress == address(0)) revert NoStakingPool();
        IERC20(USDC).safeTransfer(poolAddress, usdcAmount);
        _depositToPool(poolAddress, donor, usdcAmount);
    }

    function handleCrossChainWealthBuilding(
        address donor, uint256 fundraiserId, uint256 usdcAmount,
        bytes32 messageHash, uint32 sourceChainId
    ) external nonReentrant whenNotPaused onlyBridge {
        _validateCrossChainMsg(donor, fundraiserId, usdcAmount, messageHash, sourceChainId, 2);
        _executeWealthBuilding(donor, fundraiserId, usdcAmount);
    }

    function isMessageProcessed(bytes32 messageHash) external view returns (bool) {
        return processedMessages[messageHash];
    }

    /// @notice Compute expected message hash for any cross-chain action
    /// @param actionType 0=donate, 1=stake, 2=wealthBuild
    function computeMessageHash(
        address donor, uint256 fundraiserId, uint256 usdcAmount,
        uint32 sourceChainId, uint8 actionType
    ) external view returns (bytes32) {
        return keccak256(abi.encodePacked(
            donor, fundraiserId, usdcAmount, sourceChainId, block.chainid, actionType
        ));
    }

    // ============ Internal Swap Functions ============

    function _swapToUSDC(address tokenIn, uint256 amountIn) internal returns (uint256) {
        if (tokenIn == USDC) return amountIn;
        IERC20(tokenIn).forceApprove(address(swapAdapter), amountIn);
        return swapAdapter.swapToUSDT(tokenIn, amountIn);
    }

    function _swapNativeToUSDC(uint256 amountIn) internal returns (uint256) {
        return swapAdapter.swapNativeToUSDT{value: amountIn}();
    }

    // ============ View Functions ============

    function fundraisersCount() public view returns (uint256) { return _fundraisers.length; }

    function fundraisers(uint256 limit, uint256 offset) external view returns (Fundraiser[] memory coll) {
        uint256 size = FundraiserFactoryLib.calculatePageSize(_fundraisers.length, offset, limit, MAX_LIMIT);
        coll = new Fundraiser[](size);
        for (uint256 i = 0; i < size;) {
            coll[i] = _fundraisers[offset + i];
            unchecked { ++i; }
        }
    }

    function fundraisersByOwner(address owner) external view returns (Fundraiser[] memory) { return _fundraisersByOwner[owner]; }

    function _activeFundraisers() external view returns (Fundraiser[] memory) {
        uint256 activeCount = _fundraisers.countActive(activeFundraisers);
        return _fundraisers.getActive(activeFundraisers, activeCount);
    }

    function getFundraiserById(uint256 id) external view returns (Fundraiser) {
        if (id >= _fundraisers.length) revert InvalidFundraiserId();
        return _fundraisers[id];
    }

    function searchFundraisersByCategory(string memory category) external view returns (Fundraiser[] memory) {
        if (!_categoryExists[category]) revert FundraiserFactoryLib.CategoryDoesNotExist();
        uint256 count = _fundraisers.countByCategory(category);
        return _fundraisers.findByCategory(category, count);
    }

    function searchFundraisersByRegion(string memory region) external view returns (Fundraiser[] memory) {
        uint256 count = _fundraisers.countByRegion(region);
        return _fundraisers.findByRegion(region, count);
    }

    function getAvailableCategories() external view returns (string[] memory) { return availableCategories; }

    function getPlatformStats() external view returns (uint256, uint256, uint256) {
        return (totalFundraisersCreated, activeFundraiserCount, totalFundsRaised);
    }

    // ============ Admin Functions ============

    error CategoryAlreadyExists();
    error InvalidCategoryLength();
    error AlreadyVerified();
    error NotVerified();
    error AlreadyInactive();
    error InvalidGoalParams();
    error InvalidDurationParams();

    function addCategory(string memory category) external onlyRole(ADMIN_ROLE) { _addCategory(category); }

    function _addCategory(string memory category) private {
        if (_categoryExists[category]) revert CategoryAlreadyExists();
        uint256 len = bytes(category).length;
        if (len == 0 || len > 50) revert InvalidCategoryLength();
        availableCategories.push(category);
        _categoryExists[category] = true;
        emit CategoryAdded(category);
    }

    function verifyCreator(address creator) external onlyRole(ADMIN_ROLE) {
        if (verifiedCreators[creator]) revert AlreadyVerified();
        verifiedCreators[creator] = true;
        _grantRole(VERIFIED_CREATOR_ROLE, creator);
        emit CreatorVerified(creator);
    }

    function unverifyCreator(address creator) external onlyRole(ADMIN_ROLE) {
        if (!verifiedCreators[creator]) revert NotVerified();
        verifiedCreators[creator] = false;
        _revokeRole(VERIFIED_CREATOR_ROLE, creator);
        emit CreatorUnverified(creator);
    }

    function deactivateFundraiser(uint256 id) external onlyRole(ADMIN_ROLE) {
        if (id >= _fundraisers.length) revert InvalidFundraiserId();
        if (!activeFundraisers[id]) revert AlreadyInactive();
        activeFundraisers[id] = false;
        unchecked { activeFundraiserCount--; }
        emit FundraiserDeactivated(id, address(_fundraisers[id]));
    }

    function updateMinGoal(uint256 newMinGoal) external onlyRole(ADMIN_ROLE) {
        if (newMinGoal == 0 || newMinGoal >= maxGoal) revert InvalidGoalParams();
        minGoal = newMinGoal;
    }

    function updateMaxGoal(uint256 newMaxGoal) external onlyRole(ADMIN_ROLE) {
        if (newMaxGoal <= minGoal) revert InvalidGoalParams();
        maxGoal = newMaxGoal;
    }

    function updateDurationLimits(uint256 newMinDuration, uint256 newMaxDuration) external onlyRole(ADMIN_ROLE) {
        if (newMinDuration == 0 || newMinDuration >= newMaxDuration) revert InvalidDurationParams();
        minDuration = newMinDuration;
        maxDuration = newMaxDuration;
    }

    function updatePlatformFeeRecipient(address newRecipient) external onlyRole(ADMIN_ROLE) {
        if (newRecipient == address(0)) revert ZeroAddress();
        address oldRecipient = platformFeeRecipient;
        platformFeeRecipient = newRecipient;
        emit PlatformFeeRecipientUpdated(oldRecipient, newRecipient);
    }

    function pause() external onlyRole(ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(ADMIN_ROLE) { _unpause(); }

    function updateBridge(address _newBridge) external onlyRole(ADMIN_ROLE) {
        if (_newBridge == address(0)) revert ZeroAddress();
        fundBraveBridge = _newBridge;
        emit BridgeUpdated(_newBridge);
    }

    /**
     * @notice Sets the BridgeRouter contract address (also authorized to call cross-chain handlers)
     * @param _bridgeRouter Address of the BridgeRouter contract
     */
    function setBridgeRouter(address _bridgeRouter) external onlyRole(ADMIN_ROLE) {
        bridgeRouter = _bridgeRouter;
        emit BridgeRouterUpdated(_bridgeRouter);
    }
}
