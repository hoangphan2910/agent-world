// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IAgentRegistry {
    function unlockFeature(uint256 tokenId, string calldata feature) external;
}

contract ActivityTracker {
    address public owner;
    address public agentRegistry;

    uint256 public constant THRESHOLD_1 = 10;

    mapping(uint256 => mapping(uint256 => bool)) public claimed;

    event FeatureClaimed(uint256 indexed tokenId, uint256 level, address claimer);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(address _agentRegistry) {
        owner = msg.sender;
        agentRegistry = _agentRegistry;
    }

    function submitProof(
        uint256 tokenId,
        address walletOwner,
        uint256 txCount
    ) external onlyOwner {
        if (txCount >= THRESHOLD_1 && !claimed[tokenId][1]) {
            claimed[tokenId][1] = true;
            IAgentRegistry(agentRegistry).unlockFeature(tokenId, "auto_trade_100tx_per_day");
            emit FeatureClaimed(tokenId, 1, walletOwner);
        }
    }
}