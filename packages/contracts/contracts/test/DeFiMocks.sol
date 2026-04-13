// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// 1. Mock ERC20 (USDC, DAI, etc.)
contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol, uint8 decimalsVal) ERC20(name, symbol) {
        // _decimals = decimalsVal; // In OZ 5.0 we might need to override decimals() if not 18
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }

    // Helper for 6 decimal tokens like USDC
    function decimals() public view virtual override returns (uint8) {
        if (keccak256(bytes(symbol())) == keccak256(bytes("USDC")) ||
            keccak256(bytes(symbol())) == keccak256(bytes("aUSDC")) ||
            keccak256(bytes(symbol())) == keccak256(bytes("rcptUSDC"))) {
            return 6;
        }
        return 18;
    }
}

// 2. Mock WETH
contract MockWETH is MockERC20 {
    constructor() MockERC20("Wrapped Ether", "WETH", 18) {}

    function deposit() external payable {
        _mint(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        _burn(msg.sender, amount);
        payable(msg.sender).transfer(amount);
    }
}

// 3. Mock Aave Pool (with yield simulation for testnet)
contract MockAavePool {
    IERC20 public asset;
    MockERC20 public aToken;

    // Track depositors for proportional yield distribution
    address[] public depositors;
    mapping(address => uint256) public deposits;
    mapping(address => bool) public isDepositor;
    uint256 public totalDeposits;

    constructor(address _asset, address _aToken) {
        asset = IERC20(_asset);
        aToken = MockERC20(_aToken);
    }

    function getReserveData(address /*asset*/) external view returns (uint256) {
        return 0;
    }

    function supply(address _asset, uint256 amount, address onBehalfOf, uint16 /*referralCode*/) external {
        require(_asset == address(asset), "Invalid asset");
        asset.transferFrom(msg.sender, address(this), amount);
        aToken.mint(onBehalfOf, amount);

        // Track depositor for yield simulation
        if (!isDepositor[onBehalfOf]) {
            depositors.push(onBehalfOf);
            isDepositor[onBehalfOf] = true;
        }
        deposits[onBehalfOf] += amount;
        totalDeposits += amount;
    }

    function withdraw(address _asset, uint256 amount, address to) external returns (uint256) {
        require(_asset == address(asset), "Invalid asset");
        asset.transfer(to, amount);
        return amount;
    }

    /**
     * @notice Simulates yield accrual by minting additional aTokens proportionally to depositors.
     * @dev In real Aave, aTokens rebase to reflect yield. Here we explicitly mint extra aTokens.
     *      The caller should first mint USDC to this contract (to back withdrawals),
     *      then call simulateYield to distribute aToken yield to depositors.
     * @param amount Total yield amount to simulate (in asset decimals, e.g., 6 for USDC)
     */
    function simulateYield(uint256 amount) external {
        require(totalDeposits > 0, "No deposits to generate yield for");

        // Distribute yield proportionally to all depositors
        uint256 remaining = amount;
        for (uint256 i = 0; i < depositors.length; i++) {
            address depositor = depositors[i];
            if (deposits[depositor] > 0) {
                uint256 share;
                if (i == depositors.length - 1) {
                    // Last depositor gets remainder to avoid dust
                    share = remaining;
                } else {
                    share = (amount * deposits[depositor]) / totalDeposits;
                    remaining -= share;
                }
                if (share > 0) {
                    aToken.mint(depositor, share);
                }
            }
        }
    }

    /**
     * @notice Returns the aUSDC token address
     */
    function aUsdc() external view returns (address) {
        return address(aToken);
    }

    /**
     * @notice Returns the number of depositors
     */
    function getDepositorCount() external view returns (uint256) {
        return depositors.length;
    }
}

// 4. Mock Router (Hybrid 1inch/Uniswap for testing)
contract MockUniswapRouter {
    address public WETH;
    address public USDC;

    constructor(address _weth, address _usdc) {
        WETH = _weth;
        USDC = _usdc;
    }

    struct SwapDescription {
        address srcToken;
        address dstToken;
        address payable srcReceiver;
        address payable dstReceiver;
        uint256 amount;
        uint256 minReturnAmount;
        uint256 flags;
    }

    function swap(
        address /*executor*/,
        SwapDescription calldata desc,
        bytes calldata /*permits*/,
        bytes calldata /*data*/
    ) external payable returns (uint256 returnAmount, uint256 spentAmount) {
        if (desc.srcToken != address(0)) {
             IERC20(desc.srcToken).transferFrom(msg.sender, address(this), desc.amount);
        }
        IERC20(desc.dstToken).transfer(desc.dstReceiver, desc.amount);
        return (desc.amount, desc.amount);
    }
}