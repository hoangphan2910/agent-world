// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// AgentNFT — ERC-721 cho AI Agent
// Mint 1 agent = 1 NFT unique, trả 0.01 USDC
// Khi mint xong tự động register identity vào AgentRegistry

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

interface IAgentRegistry {
    function register(uint256 tokenId, address owner) external;
}

contract AgentNFT is ERC721, Ownable {
    uint256 public constant MAX_SUPPLY = 100;
    uint256 public constant MINT_PRICE = 10000; // 0.01 USDC (6 decimals)

    IERC20 public usdc;
    IAgentRegistry public registry;
    uint256 public totalMinted;

    struct AgentData {
        string name;
        string alias_;
        uint256 serial;
    }

    mapping(uint256 => AgentData) public agents;

    string[10] private firstNames = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta", "Iota", "Kappa"];
    string[10] private lastNames = ["Prime", "Core", "Node", "Flux", "Byte", "Cipher", "Nexus", "Pulse", "Sync", "Grid"];

    event AgentMinted(uint256 indexed tokenId, address indexed owner, string name, string alias_, uint256 serial);

    constructor(address _usdc, address _registry) ERC721("AgentWorld", "AGNT") Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        registry = IAgentRegistry(_registry);
    }

    function mint() external {
        require(totalMinted < MAX_SUPPLY, "Sold out");
        require(usdc.transferFrom(msg.sender, owner(), MINT_PRICE), "Payment failed");

        uint256 tokenId = totalMinted + 1;
        totalMinted++;

        string memory agentName = string(abi.encodePacked(
            firstNames[tokenId % 10], " ", lastNames[(tokenId * 3) % 10]
        ));
        string memory agentAlias = string(abi.encodePacked("AW-", _toString(tokenId)));
        uint256 serial = 1000 + tokenId;

        agents[tokenId] = AgentData(agentName, agentAlias, serial);
        _safeMint(msg.sender, tokenId);

        // Tự động register identity vào AgentRegistry
        registry.register(tokenId, msg.sender);

        emit AgentMinted(tokenId, msg.sender, agentName, agentAlias, serial);
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