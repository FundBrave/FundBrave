// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title ERC1967ProxyWrapper
 * @notice This contract imports OpenZeppelin's ERC1967Proxy to make it available
 *         as a Hardhat artifact for deployment scripts.
 * @dev Hardhat only compiles contracts that are part of the project source.
 *      By importing ERC1967Proxy here, we force Hardhat to compile it and
 *      generate the necessary artifact for deployment.
 *
 *      This wrapper does not add any functionality - it simply re-exports
 *      the standard OpenZeppelin ERC1967Proxy for use in deployment scripts.
 *
 *      Usage in deployment scripts:
 *      ```javascript
 *      const { contract: proxy } = await deployWithRetry(
 *        "ERC1967ProxyWrapper",
 *        [implementationAddress, initData]
 *      );
 *      ```
 */

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @notice Wrapper contract that inherits from ERC1967Proxy
 * @dev This contract is bytecode-identical to ERC1967Proxy after compilation.
 *      It exists solely to make the proxy available as a Hardhat artifact.
 */
contract ERC1967ProxyWrapper is ERC1967Proxy {
    /**
     * @notice Initializes the proxy with an implementation and initialization data
     * @param implementation Address of the implementation contract
     * @param _data Encoded function call to initialize the implementation
     */
    constructor(
        address implementation,
        bytes memory _data
    ) ERC1967Proxy(implementation, _data) {}
}
