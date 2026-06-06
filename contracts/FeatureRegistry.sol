// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// FeatureRegistry — danh sách tính năng hợp lệ của AgentWorld
// Tier 1: có sẵn khi mint
// Tier 2: unlock qua quest vừa
// Tier 3: unlock qua quest khó (rare)

contract FeatureRegistry {
    address public owner;

    struct Feature {
        string id;
        string name;
        uint8 tier;          // 1, 2, 3
        int128 reputation;   // điểm ERC-8004 thưởng khi unlock
        bool active;
    }

    mapping(string => Feature) public features;
    string[] public featureIds;

    event FeatureAdded(string id, uint8 tier);
    event FeatureDeactivated(string id);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        _seed();
    }

    function _seed() internal {
        // Tier 1 — base features (có sẵn khi mint, không cần unlock)
        _add("accept_jobs",     "Accept Jobs",          1, 0);
        _add("market_analysis", "Market Analysis",      1, 0);
        _add("news_reader",     "News Reader",          1, 0);

        // Tier 2 — unlock qua quest
        _add("risk_scoring",    "Risk Scoring",         2, 50);
        _add("task_scheduler",  "Task Scheduler",       2, 50);
        _add("agent_to_agent",  "Agent to Agent",       2, 75);
        _add("escrow_manager",  "Escrow Manager",       2, 75);

        // Tier 3 — rare, unlock qua quest khó
        _add("yield_optimizer", "Yield Optimizer",      3, 150);
        _add("auto_trade",      "Auto Trade",           3, 150);
        _add("smart_swap",      "Smart Swap",           3, 150);
    }

    function _add(string memory id, string memory name, uint8 tier, int128 reputation) internal {
        features[id] = Feature(id, name, tier, reputation, true);
        featureIds.push(id);
    }

    function isValid(string calldata id) external view returns (bool) {
        return features[id].active;
    }

    function getTier(string calldata id) external view returns (uint8) {
        return features[id].tier;
    }

    function getReputation(string calldata id) external view returns (int128) {
        return features[id].reputation;
    }

    // Owner thêm tính năng mới sau này
    function addFeature(string calldata id, string calldata name, uint8 tier, int128 reputation) external onlyOwner {
        require(!features[id].active, "Already exists");
        _add(id, name, tier, reputation);
        emit FeatureAdded(id, tier);
    }

    function deactivate(string calldata id) external onlyOwner {
        features[id].active = false;
        emit FeatureDeactivated(id);
    }

    function getAllFeatureIds() external view returns (string[] memory) {
        return featureIds;
    }
}
