// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { MessagingFee, Origin } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";
import { MessagingReceipt } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OAppSender.sol";

interface ILayerZeroReceiver {
    function lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) external payable;
}

interface ILayerZeroEndpointV2 {
    function send(
        uint32 _dstEid,
        bytes32 _receiver,
        bytes calldata _message,
        address _refundAddress,
        address _lzTokenPaymentAddress,
        bytes calldata _options,
        MessagingFee calldata _fee
    ) external payable returns (MessagingReceipt memory);

    function quote(
        uint32 _dstEid,
        bytes32 _receiver,
        bytes calldata _message,
        bytes calldata _options,
        bool _payInLzToken
    ) external view returns (MessagingFee memory);
}

/**
 * @title MockLZEndpoint
 * @dev Simulates LayerZero V2 Endpoint for local testing.
 */
contract MockLZEndpoint is ILayerZeroEndpointV2 {
    uint32 public eid;
    address public delegate;
    uint256 private nonce;
    bool public acceptMessage = true; // Default to accepting messages

    event PacketSent(
        uint32 indexed dstEid,
        bytes32 indexed receiver,
        bytes message,
        bytes options,
        MessagingFee fee
    );

    constructor(uint32 _eid) {
        eid = _eid;
    }

    function setDelegate(address _delegate) external {
        delegate = _delegate;
    }

    // Helper method for tests to control message acceptance
    function setAcceptMessage(bool _accept) external {
        acceptMessage = _accept;
    }

    // Helper method to simulate message delivery to a destination contract
    function deliverMessage(
        address _target,
        uint32 _srcEid,
        bytes calldata _payload
    ) external payable {
        require(acceptMessage, "Messages not being accepted");

        // Create a unique GUID for this message
        bytes32 guid = bytes32(uint256(keccak256(abi.encodePacked(_srcEid, nonce, block.timestamp))));
        nonce++;

        // Create the origin struct
        Origin memory origin = Origin(_srcEid, bytes32(uint256(uint160(msg.sender))), 1);

        // Call lzReceive on the target contract
        ILayerZeroReceiver(_target).lzReceive{value: msg.value}(
            origin,
            guid,
            _payload,
            address(0), // executor
            "" // extraData
        );
    }

    // Implement the correct send function signature for LayerZero V2
    function send(
        uint32 _dstEid,
        bytes32 _receiver,
        bytes calldata _message,
        address _refundAddress,
        address /*_lzTokenPaymentAddress*/,
        bytes calldata _options,
        MessagingFee calldata _fee
    ) external payable override returns (MessagingReceipt memory) {
        require(msg.value >= _fee.nativeFee, "Insufficient fee");
        
        emit PacketSent(_dstEid, _receiver, _message, _options, _fee);
        
        // Refund excess
        if (msg.value > _fee.nativeFee) {
            payable(_refundAddress).transfer(msg.value - _fee.nativeFee);
        }
        
        // Return a mock receipt - MessagingReceipt has 3 fields: guid, nonce, fee
        nonce++;
        return MessagingReceipt(
            bytes32(nonce),    // guid
            uint64(nonce),     // nonce
            _fee               // fee
        );
    }

    // Implement the quote function
    function quote(
        uint32 /*_dstEid*/,
        bytes32 /*_receiver*/,
        bytes calldata /*_message*/,
        bytes calldata /*_options*/,
        bool /*_payInLzToken*/
    ) external pure override returns (MessagingFee memory) {
        // Return minimal fee for testing
        return MessagingFee(0.001 ether, 0);
    }

    // Helper to mock receiving a message on the destination OApp
    function mockReceive(
        address _oapp, 
        uint32 _srcEid, 
        bytes32 _guid, 
        bytes calldata _message
    ) external payable {
        Origin memory origin = Origin(_srcEid, bytes32(uint256(uint160(msg.sender))), 1);
        
        ILayerZeroReceiver(_oapp).lzReceive{value: msg.value}(
            origin,
            _guid,
            _message,
            address(0),
            ""  
        );
    }

    // Allow receiving ETH
    receive() external payable {}
}