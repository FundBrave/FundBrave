// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { OFT } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/OFT.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FundraiserReceiptOFT
 * @dev Cross-chain Receipt Token. Minter/Burner access controlled.
 *      The controllerAdmin (typically the FundraiserFactory) can register
 *      new staking pool clones as authorized controllers for mint/burn.
 */
contract ReceiptOFT is OFT {
    // Only the Staking Pools or Factory can mint/burn
    mapping(address => bool) public controllers;

    /// @notice Address authorized to add/remove controllers (e.g., FundraiserFactory)
    address public controllerAdmin;

    event ControllerAdminUpdated(address indexed oldAdmin, address indexed newAdmin);
    event ControllerUpdated(address indexed controller, bool enabled);

    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _delegate
    ) OFT(_name, _symbol, _lzEndpoint, _delegate) Ownable(_delegate) {}

    /// @notice Sets the controllerAdmin address (only owner can call)
    /// @param _admin Address of the new controller admin (e.g., the FundraiserFactory)
    function setControllerAdmin(address _admin) external onlyOwner {
        address oldAdmin = controllerAdmin;
        controllerAdmin = _admin;
        emit ControllerAdminUpdated(oldAdmin, _admin);
    }

    /// @notice Adds or removes a controller (callable by owner OR controllerAdmin)
    function setController(address _controller, bool _enabled) external {
        require(msg.sender == owner() || msg.sender == controllerAdmin, "Not authorized");
        controllers[_controller] = _enabled;
        emit ControllerUpdated(_controller, _enabled);
    }

    function mint(address _to, uint256 _amount) external {
        require(controllers[msg.sender], "Not authorized");
        _mint(_to, _amount);
    }

    function burn(address _from, uint256 _amount) external {
        require(controllers[msg.sender], "Not authorized");
        _burn(_from, _amount);
    }
}