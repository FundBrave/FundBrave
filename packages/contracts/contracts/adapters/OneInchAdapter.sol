// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ISwapAdapter.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

struct SwapDescription {
    address srcToken;
    address dstToken;
    address payable srcReceiver;
    address payable dstReceiver;
    uint256 amount;
    uint256 minReturnAmount;
    uint256 flags;
}

interface IAggregationRouterV5 {
    function swap(
        address executor,
        SwapDescription calldata desc,
        bytes calldata permits,
        bytes calldata data
    ) external payable returns (uint256 returnAmount, uint256 spentAmount);
}

contract OneInchAdapter is ISwapAdapter, Ownable {
    using SafeERC20 for IERC20;

    address public immutable ONE_INCH_ROUTER;
    address public immutable USDC;
    address public immutable WETH;
    bytes public nextSwapData;
    address public nextExecutor;
    uint256 public nextMinReturnAmount;

    constructor(address _router, address _usdc, address _weth, address _owner) Ownable(_owner) {
        ONE_INCH_ROUTER = _router;
        USDC = _usdc;
        WETH = _weth;
    }

    /**
     * @dev Call this BEFORE triggering the Bridge or Factory action.
     * Pass the 'tx.data' you get from the 1inch API response.
     * @param _executor The executor address from 1inch API
     * @param _data The swap data from 1inch API
     * @param _minReturnAmount Minimum acceptable output amount (with slippage tolerance applied)
     *                        Calculate as: expectedOutput * (100 - slippageBps) / 10000
     */
    function setSwapData(address _executor, bytes calldata _data, uint256 _minReturnAmount) external onlyOwner {
        require(_minReturnAmount > 0, "MinReturn must be > 0");
        nextExecutor = _executor;
        nextSwapData = _data;
        nextMinReturnAmount = _minReturnAmount;
    }

    function swapToUSDT(address tokenIn, uint256 amountIn) external override returns (uint256 amountOut) {
        if (tokenIn == USDC) return amountIn;
        require(nextSwapData.length > 0, "1inch: No swap data set");
        require(nextMinReturnAmount > 0, "1inch: Min return not set");

        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        IERC20(tokenIn).forceApprove(ONE_INCH_ROUTER, amountIn);

        SwapDescription memory desc = SwapDescription({
            srcToken: tokenIn,
            dstToken: USDC,
            srcReceiver: payable(address(this)),
            dstReceiver: payable(address(this)),
            amount: amountIn,
            minReturnAmount: nextMinReturnAmount,
            flags: 0
        });

        try IAggregationRouterV5(ONE_INCH_ROUTER).swap(
            nextExecutor,
            desc,
            "",
            nextSwapData
        ) returns (uint256 retAmount, uint256) {
            amountOut = retAmount;
        } catch {
            revert("1inch Swap Failed");
        }

        // Clear swap data after use
        delete nextSwapData;
        delete nextExecutor;
        delete nextMinReturnAmount;

        IERC20(USDC).safeTransfer(msg.sender, amountOut);

        return amountOut;
    }

    /**
     * @notice Native ETH to USDC swaps are not supported via 1inch adapter
     * @dev This function is intentionally not implemented because 1inch swaps require
     *      pre-computed swap data from the 1inch API which cannot be generated on-chain.
     *      Use the UniswapAdapter for native ETH swaps instead.
     */
    function swapNativeToUSDT() external payable override returns (uint256) {
        revert("1inch: Native swaps not supported. Use UniswapAdapter for ETH swaps");
    }
}