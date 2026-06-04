// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// AgentRegistry — Lưu identity + featureSlots per agent
// Chỉ AgentNFT contract mới được ghi vào đây khi mint
// MissionBoard contract ghi thêm feature khi user unlock

contract AgentRegistry {
    address public agentNFT;
    address public owner;
    address public missionBoard;

    struct Identity {
        uint256 tokenId;
        address owner;
        uint256 registeredAt;
        string[] unlockedFeatures;
    }

    mapping(uint256 => Identity) public identities;

    event AgentRegistered(uint256 indexed tokenId, address indexed owner);
    event FeatureUnlocked(uint256 indexed tokenId, string feature);

    modifier onlyAgentNFT() {
        require(msg.sender == agentNFT, "Only AgentNFT");
        _;
    }

    modifier onlyMissionBoard() {
        require(msg.sender == missionBoard, "Only MissionBoard");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Owner set địa chỉ AgentNFT sau khi deploy
    function setAgentNFT(address _agentNFT) external onlyOwner {
        agentNFT = _agentNFT;
    }

    // Owner set địa chỉ MissionBoard sau khi deploy
    function setMissionBoard(address _missionBoard) external onlyOwner {
        missionBoard = _missionBoard;
    }

    // AgentNFT gọi khi mint — tự động register identity
    function register(uint256 tokenId, address _owner) external onlyAgentNFT {
        identities[tokenId] = Identity({
            tokenId: tokenId,
            owner: _owner,
            registeredAt: block.timestamp,
            unlockedFeatures: new string[](0)
        });
        emit AgentRegistered(tokenId, _owner);
    }

    // MissionBoard gọi khi user claim quest xong
    function unlockFeature(uint256 tokenId, string calldata feature) external onlyMissionBoard {
        identities[tokenId].unlockedFeatures.push(feature);
        emit FeatureUnlocked(tokenId, feature);
    }

    // Đọc danh sách feature đã unlock của agent
    function getFeatures(uint256 tokenId) external view returns (string[] memory) {
        return identities[tokenId].unlockedFeatures;
    }
}