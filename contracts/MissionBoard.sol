// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IAgenticCommerce {
    function createJob(address provider, address evaluator, uint256 expiration, string calldata description, address hook) external returns (uint256);
    function setBudget(uint256 jobId, uint256 amount, bytes calldata optParams) external;
    function fund(uint256 jobId, bytes calldata optParams) external;
    function submit(uint256 jobId, bytes32 deliverableHash, bytes calldata optParams) external;
    function complete(uint256 jobId, bytes32 reasonHash, bytes calldata optParams) external;
    function claimRefund(uint256 jobId) external;
}

interface IReputationRegistry {
    function giveFeedback(uint256 agentId, int128 score, uint8 feedbackType, string calldata tag, string calldata metadataURI, string calldata metadataHash, string calldata rewardId, bytes32 feedbackHash) external;
}

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

interface IAgentNFT {
    function ownerOf(uint256 tokenId) external view returns (address);
    function unlockFeature(uint256 tokenId, string calldata feature) external;
    function updateTitle(uint256 tokenId, string calldata title) external;
    function updateStats(uint256 tokenId, uint8 speed, uint8 accuracy, uint8 power) external;
    function getAgent(uint256 tokenId) external view returns (AgentData memory);
    function getPower(uint256 tokenId) external view returns (uint8);
    function hasFeature(uint256 tokenId, string calldata feature) external view returns (bool);
}

interface IFeatureRegistry {
    function isValid(string calldata id) external view returns (bool);
    function getTier(string calldata id) external view returns (uint8);
    function getReputation(string calldata id) external view returns (int128);
}

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MissionBoard is ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public immutable agenticCommerce; // ERC-8183
    address public immutable reputationRegistry; // ERC-8004
    address public immutable usdc;
    address public immutable featureRegistry;

    address public owner;
    address public agentNFT;

    // Platform fee: giảm theo accuracy của agent
    uint8 public constant BASE_FEE_PCT = 5; // 5%

    struct Quest {
        uint256 tokenId;
        uint256 erc8183JobId;
        address client;
        address evaluator;
        uint256 reward;
        string featureReward;  // feature unlock khi hoàn thành (phải có trong FeatureRegistry)
        string titleReward;
        uint8 statBoost;
        uint256 deadline;
        bool completed;
        bool cancelled;
    }

    mapping(uint256 => Quest) public quests;
    uint256 public questCount;

    // Enforce power: track số quest đang active của mỗi agent
    mapping(uint256 => uint256) public activeQuestCount; // tokenId → số quest đang làm

    event QuestCreated(uint256 indexed questId, uint256 indexed tokenId, string featureReward, uint256 reward);
    event QuestSubmitted(uint256 indexed questId, bytes32 deliverableHash);
    event QuestCompleted(uint256 indexed questId, uint256 indexed tokenId, string featureReward);
    event QuestCancelled(uint256 indexed questId, uint256 indexed tokenId, address indexed client, uint256 refunded);
    event AgentNFTUpdated(address indexed agentNFT);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(address _agentNFT, address _agenticCommerce, address _reputationRegistry, address _usdc, address _featureRegistry) {
        owner = msg.sender;
        agentNFT = _agentNFT;
        agenticCommerce = _agenticCommerce;
        reputationRegistry = _reputationRegistry;
        usdc = _usdc;
        featureRegistry = _featureRegistry;
    }

    function createQuest(
        uint256 tokenId,
        address evaluator,
        uint256 reward,
        uint256 durationSeconds,
        string calldata description,
        string calldata featureReward,
        string calldata titleReward,
        uint8 statBoost
    ) external nonReentrant returns (uint256 questId) {
        require(reward > 0, "Reward required");

        // Validate feature phải có trong FeatureRegistry
        require(IFeatureRegistry(featureRegistry).isValid(featureReward), "Invalid feature");

        // Enforce power: agent chỉ nhận tối đa (power/10) quest cùng lúc, tối thiểu 1
        // (getPower revert "Agent does not exist" nếu tokenId không tồn tại)
        uint8 power = IAgentNFT(agentNFT).getPower(tokenId);

        // Evaluator phải là bên độc lập: không phải client và không phải chủ agent
        // (chống self-dealing: tự tạo quest rồi tự đánh giá để farm feature/stat/reputation)
        require(evaluator != address(0), "Evaluator required");
        require(evaluator != msg.sender, "Evaluator cannot be client");
        require(evaluator != IAgentNFT(agentNFT).ownerOf(tokenId), "Evaluator cannot be agent owner");
        uint256 maxConcurrent = power / 10;
        if (maxConcurrent == 0) maxConcurrent = 1;
        require(activeQuestCount[tokenId] < maxConcurrent, "Agent at max concurrent quests");

        IERC20(usdc).safeTransferFrom(msg.sender, address(this), reward);

        uint256 deadline = block.timestamp + durationSeconds;
        uint256 jobId = IAgenticCommerce(agenticCommerce).createJob(
            address(this),
            evaluator,
            deadline,
            description,
            address(0)
        );

        IAgenticCommerce(agenticCommerce).setBudget(jobId, reward, "");
        IERC20(usdc).forceApprove(agenticCommerce, reward);
        IAgenticCommerce(agenticCommerce).fund(jobId, "");

        activeQuestCount[tokenId]++;

        questId = ++questCount;
        quests[questId] = Quest({
            tokenId: tokenId,
            erc8183JobId: jobId,
            client: msg.sender,
            evaluator: evaluator,
            reward: reward,
            featureReward: featureReward,
            titleReward: titleReward,
            statBoost: statBoost,
            deadline: deadline,
            completed: false,
            cancelled: false
        });

        emit QuestCreated(questId, tokenId, featureReward, reward);
    }

    function submitQuest(uint256 questId, bytes32 deliverableHash) external nonReentrant {
        Quest storage q = quests[questId];
        require(!q.completed && !q.cancelled, "Quest closed");

        IAgenticCommerce(agenticCommerce).submit(q.erc8183JobId, deliverableHash, "");
        emit QuestSubmitted(questId, deliverableHash);
    }

    // Cho phép client thu hồi USDC nếu quest hết hạn mà evaluator chưa hoàn thành.
    // AgenticCommerce giữ USDC trong escrow riêng của nó sau fund(), không phải trong
    // MissionBoard — nên phải gọi claimRefund() để kéo tiền về MissionBoard (với vai trò
    // job.client) trước khi chuyển tiếp cho client thật của quest.
    function cancelQuest(uint256 questId) external nonReentrant {
        Quest storage q = quests[questId];
        require(!q.completed && !q.cancelled, "Quest closed");
        require(msg.sender == q.client, "Only client");
        require(block.timestamp > q.deadline, "Quest not expired");

        q.cancelled = true;
        activeQuestCount[q.tokenId]--;

        // Kéo USDC từ escrow của AgenticCommerce về MissionBoard (MissionBoard là job.client)
        IAgenticCommerce(agenticCommerce).claimRefund(q.erc8183JobId);

        uint256 refund = q.reward;
        IERC20(usdc).safeTransfer(q.client, refund);

        emit QuestCancelled(questId, q.tokenId, q.client, refund);
    }

    function completeQuest(uint256 questId) external nonReentrant {
        Quest storage q = quests[questId];
        require(msg.sender == q.evaluator, "Only evaluator");
        require(!q.completed && !q.cancelled, "Quest closed");

        q.completed = true;
        activeQuestCount[q.tokenId]--;

        IAgenticCommerce(agenticCommerce).complete(q.erc8183JobId, keccak256("quest_completed"), "");

        // Unlock feature
        IAgentNFT(agentNFT).unlockFeature(q.tokenId, q.featureReward);

        // Cập nhật danh hiệu nếu có
        if (bytes(q.titleReward).length > 0) {
            IAgentNFT(agentNFT).updateTitle(q.tokenId, q.titleReward);
        }

        // Tăng stats, giới hạn do AgentNFT enforce
        if (q.statBoost > 0) {
            AgentData memory a = IAgentNFT(agentNFT).getAgent(q.tokenId);
            IAgentNFT(agentNFT).updateStats(
                q.tokenId,
                a.speed + q.statBoost,
                a.accuracy + q.statBoost,
                a.power + q.statBoost
            );
        }

        // Reputation lấy từ FeatureRegistry theo tier của feature
        int128 reputationScore = IFeatureRegistry(featureRegistry).getReputation(q.featureReward);
        if (reputationScore > 0) {
            AgentData memory agent = IAgentNFT(agentNFT).getAgent(q.tokenId);
            IReputationRegistry(reputationRegistry).giveFeedback(
                agent.erc8004Id,
                reputationScore,
                0,
                q.featureReward,
                "", "", "",
                keccak256(abi.encodePacked(questId, q.tokenId))
            );
        }

        emit QuestCompleted(questId, q.tokenId, q.featureReward);
    }

    function setAgentNFT(address _agentNFT) external onlyOwner {
        agentNFT = _agentNFT;
        emit AgentNFTUpdated(_agentNFT);
    }
}
