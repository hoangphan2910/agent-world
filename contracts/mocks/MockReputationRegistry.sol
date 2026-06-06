// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Mock ERC-8004 ReputationRegistry
contract MockReputationRegistry {
    mapping(uint256 => int128) public reputationScore;

    event FeedbackGiven(uint256 indexed agentId, int128 score, string tag);

    function giveFeedback(
        uint256 agentId,
        int128 score,
        uint8,
        string calldata tag,
        string calldata,
        string calldata,
        string calldata,
        bytes32
    ) external {
        reputationScore[agentId] += score;
        emit FeedbackGiven(agentId, score, tag);
    }
}
