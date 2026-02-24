// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockWormholeCore
 * @notice Mock Wormhole Core Bridge contract for testnet
 * @dev Simulates VAA verification for testing cross-chain flows without real Wormhole.
 *      All VAAs are considered valid. Use only on testnet.
 */
contract MockWormholeCore {

    struct Signature {
        bytes32 r;
        bytes32 s;
        uint8 v;
        uint8 guardianIndex;
    }

    struct VM {
        uint8 version;
        uint32 timestamp;
        uint32 nonce;
        uint16 emitterChainId;
        bytes32 emitterAddress;
        uint64 sequence;
        uint8 consistencyLevel;
        bytes payload;
        uint32 guardianSetIndex;
        Signature[] signatures;
        bytes32 hash;
    }

    uint64 public nextSequence;

    /**
     * @notice Parse and verify a VAA (mock - always returns valid)
     * @dev For testnet use only. Decodes the raw bytes as a simplified VAA format.
     *      Real VAA format: version(1) + guardianSetIndex(4) + signatureCount(1) + signatures(66*N)
     *                     + timestamp(4) + nonce(4) + emitterChainId(2) + emitterAddress(32)
     *                     + sequence(8) + consistencyLevel(1) + payload(remaining)
     *
     *      For testing, we accept a simplified format:
     *      abi.encode(emitterChainId, emitterAddress, payload)
     */
    function parseAndVerifyVM(bytes calldata encodedVM)
        external
        view
        returns (VM memory vm, bool valid, string memory reason)
    {
        // Decode simplified test format
        (uint16 emitterChainId, bytes32 emitterAddress, bytes memory payload) =
            abi.decode(encodedVM, (uint16, bytes32, bytes));

        vm.version = 1;
        vm.timestamp = uint32(block.timestamp);
        vm.nonce = 0;
        vm.emitterChainId = emitterChainId;
        vm.emitterAddress = emitterAddress;
        vm.sequence = 0;
        vm.consistencyLevel = 1;
        vm.payload = payload;
        vm.guardianSetIndex = 0;
        vm.hash = keccak256(encodedVM);

        return (vm, true, "");
    }

    /**
     * @notice Create a test VAA for simulation
     * @param emitterChainId Source chain ID (1 for Solana)
     * @param emitterAddress Emitter program address
     * @param payload The message payload
     * @return encodedVAA The encoded VAA bytes
     */
    function createTestVAA(
        uint16 emitterChainId,
        bytes32 emitterAddress,
        bytes calldata payload
    ) external pure returns (bytes memory encodedVAA) {
        return abi.encode(emitterChainId, emitterAddress, payload);
    }
}
