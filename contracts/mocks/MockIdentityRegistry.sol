// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Mock ERC-8004 IdentityRegistry
contract MockIdentityRegistry {
    uint256 private _nextId = 1;

    event Registered(uint256 indexed agentId, address indexed owner, string metadataURI);

    function register(string calldata metadataURI) external returns (uint256 agentId) {
        agentId = _nextId++;
        emit Registered(agentId, msg.sender, metadataURI);
    }
}
