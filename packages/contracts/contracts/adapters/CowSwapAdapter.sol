// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ISwapAdapter.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Interface for the CoW Protocol Vault Relayer/Batcher
interface ICowBatcher {
    function sell(
        address sellToken,
        address buyToken,
        uint256 sellAmount,
        uint256 minBuyAmount,
        uint32 validTo,
        bytes32 appData,
        uint256 feeAmount
    ) external returns (uint256 buyAmount);
}

/**
 * @title AggregatorV3Interface
 * @notice Chainlink price feed interface for fetching asset prices
 */
interface AggregatorV3Interface {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );

    function decimals() external view returns (uint8);
}

interface IWeth {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

/**
 * @title CowSwapAdapter
 * @dev Implements ISwapAdapter by routing swaps through the CoW Protocol Batcher.
 * This provides MEV protection and price aggregation.
 */
contract CowSwapAdapter is ISwapAdapter, Ownable {
    using SafeERC20 for IERC20;

    // --- Custom Errors ---
    error InvalidPrice();
    error StalePrice();
    error PriceTooOld();
    error ZeroAddress();

    // --- Events ---
    event PriceFeedUpdated(address indexed oldFeed, address indexed newFeed);

    ICowBatcher public immutable cowBatcher;
    address public immutable USDC;
    address public immutable WETH;

    // --- Chainlink Oracle ---
    /// @notice ETH/USD Chainlink price feed
    AggregatorV3Interface public ethUsdPriceFeed;

    /// @notice Maximum staleness threshold for price feed data (1 hour)
    uint256 public constant PRICE_FEED_STALENESS_THRESHOLD = 1 hours;

    // We can define a default slippage tolerance and order validity here
    uint256 public constant DEFAULT_SLIPPAGE_BPS = 50; // 0.5%
    uint32 public constant ORDER_VALIDITY_SECONDS = 300; // 5 minutes

    /**
     * @notice Constructs the CowSwapAdapter
     * @param _cowBatcher CoW Protocol batcher/settlement contract
     * @param _usdc USDC token address
     * @param _weth WETH token address
     * @param _ethUsdPriceFeed Chainlink ETH/USD price feed address
     * @param _owner Contract owner address
     */
    constructor(
        address _cowBatcher,
        address _usdc,
        address _weth,
        address _ethUsdPriceFeed,
        address _owner
    ) Ownable(_owner) {
        if (_cowBatcher == address(0)) revert ZeroAddress();
        if (_usdc == address(0)) revert ZeroAddress();
        if (_weth == address(0)) revert ZeroAddress();
        if (_ethUsdPriceFeed == address(0)) revert ZeroAddress();

        cowBatcher = ICowBatcher(_cowBatcher);
        USDC = _usdc;
        WETH = _weth;
        ethUsdPriceFeed = AggregatorV3Interface(_ethUsdPriceFeed);

        IERC20(USDC).forceApprove(address(cowBatcher), type(uint256).max);
    }

    /**
     * @dev Swaps an ERC20 token to USDT (USDC in this implementation) via CoW Swap.
     * Requires prior approval of the sellToken to the Batcher.
     * Note: In this architecture, the FundBraveBridge/Factory handles the approval.
     */
    function swapToUSDT(address tokenIn, uint256 amountIn)
        external
        override
        returns (uint256 usdcAmountOut)
    {
        if (tokenIn == USDC) return amountIn;

        IERC20(tokenIn).safeTransferFrom(msg.sender, address(cowBatcher), amountIn);

        uint256 minBuyAmount = _applySlippage(amountIn, DEFAULT_SLIPPAGE_BPS);

        usdcAmountOut = cowBatcher.sell(
            tokenIn, 
            USDC, 
            amountIn, 
            minBuyAmount, 
            uint32(block.timestamp + ORDER_VALIDITY_SECONDS), 
            bytes32(0),
            0
        );
        
        return usdcAmountOut;
    }

    /**
     * @dev Swaps native ETH/MATIC to USDT (USDC) via CoW Swap.
     * @notice Uses Chainlink oracle for accurate price estimation
     */
    function swapNativeToUSDT()
        external
        payable
        override
        returns (uint256 usdcAmountOut)
    {
        IWeth(WETH).deposit{value: msg.value}();
        IERC20(WETH).forceApprove(address(cowBatcher), msg.value);

        // Get minimum buy amount using Chainlink oracle
        uint256 minBuyAmount = _getMinBuyAmount(msg.value);

        usdcAmountOut = cowBatcher.sell(
            WETH,
            USDC,
            msg.value,
            minBuyAmount,
            uint32(block.timestamp + ORDER_VALIDITY_SECONDS),
            bytes32(0),
            0
        );

        // Refund dust WETH if any remains
        uint256 remainingWeth = IERC20(WETH).balanceOf(address(this));
        if (remainingWeth > 0) {
            IWeth(WETH).withdraw(remainingWeth);
            (bool success,) = msg.sender.call{value: remainingWeth}("");
            require(success, "ETH Refund failed");
        }

        return usdcAmountOut;
    }

    // --- Chainlink Oracle Functions ---

    /**
     * @notice Get current ETH/USD price from Chainlink oracle
     * @return price ETH price in USD (with oracle decimals, typically 8)
     */
    function getEthUsdPrice() public view returns (uint256) {
        (
            uint80 roundId,
            int256 answer,
            ,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = ethUsdPriceFeed.latestRoundData();

        // Validate the price data
        if (answer <= 0) revert InvalidPrice();
        if (answeredInRound < roundId) revert StalePrice();
        if (block.timestamp - updatedAt > PRICE_FEED_STALENESS_THRESHOLD) revert PriceTooOld();

        return uint256(answer);
    }

    /**
     * @notice Calculate minimum buy amount for ETH->USDC swap using oracle price
     * @param ethAmount Amount of ETH being swapped (18 decimals)
     * @return Minimum USDC amount to receive (6 decimals)
     */
    function _getMinBuyAmount(uint256 ethAmount) private view returns (uint256) {
        uint256 ethPriceUsd = getEthUsdPrice(); // 8 decimals from Chainlink
        uint8 ethDecimals = ethUsdPriceFeed.decimals(); // typically 8

        // Calculate USDC amount:
        // ethAmount (18 decimals) * ethPrice (8 decimals) / 10^18 * 10^6 / 10^8
        // = ethAmount * ethPrice * 10^6 / 10^18 / 10^8
        // = ethAmount * ethPrice / 10^20
        uint256 estimate = (ethAmount * ethPriceUsd * 10 ** 6) / (10 ** 18 * 10 ** ethDecimals);

        // Apply higher slippage for native swaps (2%)
        uint256 minBuyAmount = _applySlippage(estimate, DEFAULT_SLIPPAGE_BPS * 4);

        return minBuyAmount;
    }

    function _applySlippage(uint256 amount, uint256 bps) private pure returns (uint256) {
        return amount * (10000 - bps) / 10000;
    }

    // --- Admin Functions ---

    /**
     * @notice Update the ETH/USD price feed address
     * @param _newPriceFeed New Chainlink price feed address
     */
    function setEthUsdPriceFeed(address _newPriceFeed) external onlyOwner {
        if (_newPriceFeed == address(0)) revert ZeroAddress();

        address oldFeed = address(ethUsdPriceFeed);
        ethUsdPriceFeed = AggregatorV3Interface(_newPriceFeed);

        emit PriceFeedUpdated(oldFeed, _newPriceFeed);
    }
}