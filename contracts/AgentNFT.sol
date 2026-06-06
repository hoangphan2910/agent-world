// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

interface IIdentityRegistry {
    function register(string calldata metadataURI) external returns (uint256);
}

contract AgentNFT is ERC721, IERC721Receiver, Ownable {
    uint256 public constant MAX_SUPPLY = 100;
    uint256 public constant MINT_PRICE = 10000; // 0.01 USDC (6 decimals)
    uint8 public constant MAX_STAT = 100;

    address public immutable usdc;
    address public immutable identityRegistry; // ERC-8004
    address public missionBoard;
    uint256 public totalMinted;

    struct AgentData {
        string name;
        string alias_;
        uint256 serial;
        string title;
        uint8 speed;
        uint8 accuracy;
        uint8 power;
        string[] features;
        uint256 erc8004Id;
    }

    mapping(uint256 => AgentData) private _agents;

    string[10] private firstNames = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta", "Iota", "Kappa"];
    string[10] private lastNames = ["Prime", "Core", "Node", "Flux", "Byte", "Cipher", "Nexus", "Pulse", "Sync", "Grid"];

    event AgentMinted(uint256 indexed tokenId, address indexed owner, string name, uint256 erc8004Id);
    event FeatureUnlocked(uint256 indexed tokenId, string feature);
    event TitleUpdated(uint256 indexed tokenId, string title);
    event StatsUpdated(uint256 indexed tokenId, uint8 speed, uint8 accuracy, uint8 power);

    modifier onlyMissionBoard() {
        require(msg.sender == missionBoard, "Only MissionBoard");
        _;
    }

    modifier agentExists(uint256 tokenId) {
        require(_ownerOf(tokenId) != address(0), "Agent does not exist");
        _;
    }

    constructor(address _usdc, address _identityRegistry) ERC721("AgentWorld", "AGNT") Ownable(msg.sender) {
        usdc = _usdc;
        identityRegistry = _identityRegistry;
    }

    function setMissionBoard(address _missionBoard) external onlyOwner {
        missionBoard = _missionBoard;
    }

    function mint(string calldata metadataURI) external {
        require(totalMinted < MAX_SUPPLY, "Sold out");
        require(IERC20(usdc).transferFrom(msg.sender, owner(), MINT_PRICE), "Payment failed");

        uint256 tokenId = totalMinted + 1;
        totalMinted++;

        string memory agentName = string(abi.encodePacked(
            firstNames[tokenId % 10], " ", lastNames[(tokenId * 3) % 10]
        ));

        uint256 erc8004Id = IIdentityRegistry(identityRegistry).register(metadataURI);

        // Tier 1 features có sẵn khi mint
        string[] memory baseFeatures = new string[](3);
        baseFeatures[0] = "accept_jobs";
        baseFeatures[1] = "market_analysis";
        baseFeatures[2] = "news_reader";

        _agents[tokenId] = AgentData({
            name: agentName,
            alias_: string(abi.encodePacked("AW-", _toString(tokenId))),
            serial: 1000 + tokenId,
            title: "Rookie",
            speed: 10,
            accuracy: 10,
            power: 10,
            features: baseFeatures,
            erc8004Id: erc8004Id
        });

        _safeMint(msg.sender, tokenId);
        emit AgentMinted(tokenId, msg.sender, agentName, erc8004Id);
    }

    function unlockFeature(uint256 tokenId, string calldata feature) external onlyMissionBoard agentExists(tokenId) {
        _agents[tokenId].features.push(feature);
        emit FeatureUnlocked(tokenId, feature);
    }

    function updateTitle(uint256 tokenId, string calldata title) external onlyMissionBoard agentExists(tokenId) {
        _agents[tokenId].title = title;
        emit TitleUpdated(tokenId, title);
    }

    // Cap tối đa MAX_STAT, không cho vượt quá
    function updateStats(uint256 tokenId, uint8 speed, uint8 accuracy, uint8 power) external onlyMissionBoard agentExists(tokenId) {
        AgentData storage a = _agents[tokenId];
        a.speed    = speed    > MAX_STAT ? MAX_STAT : speed;
        a.accuracy = accuracy > MAX_STAT ? MAX_STAT : accuracy;
        a.power    = power    > MAX_STAT ? MAX_STAT : power;
        emit StatsUpdated(tokenId, a.speed, a.accuracy, a.power);
    }

    function hasFeature(uint256 tokenId, string calldata feature) external view agentExists(tokenId) returns (bool) {
        string[] memory f = _agents[tokenId].features;
        for (uint256 i = 0; i < f.length; i++) {
            if (keccak256(bytes(f[i])) == keccak256(bytes(feature))) return true;
        }
        return false;
    }

    function getPower(uint256 tokenId) external view agentExists(tokenId) returns (uint8) {
        return _agents[tokenId].power;
    }

    function getAgent(uint256 tokenId) external view agentExists(tokenId) returns (AgentData memory) {
        return _agents[tokenId];
    }

    function getFeatures(uint256 tokenId) external view agentExists(tokenId) returns (string[] memory) {
        return _agents[tokenId].features;
    }

    // Cho phép nhận ERC-721 từ ERC-8004 IdentityRegistry khi register
    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (value != 0) { digits--; buffer[digits] = bytes1(uint8(48 + uint256(value % 10))); value /= 10; }
        return string(buffer);
    }
}
