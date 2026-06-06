import { network } from "hardhat";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("AgentWorld", async function () {
  const { viem, networkHelpers } = await network.create();

  async function deploy() {
    const [owner, user, evaluator, stranger] = await viem.getWalletClients();

    const usdc = await viem.deployContract("MockUSDC");
    const identityRegistry = await viem.deployContract("MockIdentityRegistry");
    const agenticCommerce = await viem.deployContract("MockAgenticCommerce");
    const reputationRegistry = await viem.deployContract("MockReputationRegistry");
    const featureRegistry = await viem.deployContract("FeatureRegistry");

    const agentNFT = await viem.deployContract("AgentNFT", [
      usdc.address,
      identityRegistry.address,
    ]);

    const missionBoard = await viem.deployContract("MissionBoard", [
      agentNFT.address,
      agenticCommerce.address,
      reputationRegistry.address,
      usdc.address,
      featureRegistry.address,
    ]);

    await agentNFT.write.setMissionBoard([missionBoard.address]);

    return { owner, user, evaluator, stranger, usdc, agentNFT, missionBoard, featureRegistry, reputationRegistry };
  }

  async function mintAgent(usdc: any, agentNFT: any, user: any) {
    await usdc.write.mint([user.account.address, 10000000n]);
    await usdc.write.approve([agentNFT.address, 10000n], { account: user.account });
    await agentNFT.write.mint(["ipfs://QmTestMetadata"], { account: user.account });
  }

  it("mint agent — có NFT, ERC-8004 identity, base features Tier 1", async function () {
    const { user, usdc, agentNFT } = await networkHelpers.loadFixture(deploy);
    await mintAgent(usdc, agentNFT, user);

    assert.equal(await agentNFT.read.totalMinted(), 1n);

    const agent = await agentNFT.read.getAgent([1n]);
    assert.equal(agent.title, "Rookie");
    assert.equal(agent.speed, 10);
    assert.equal(agent.erc8004Id, 1n);

    // Base features Tier 1 có sẵn
    assert.equal(agent.features.length, 3);
    assert.equal(agent.features[0], "accept_jobs");
    assert.equal(agent.features[1], "market_analysis");
    assert.equal(agent.features[2], "news_reader");
  });

  it("stats cap tối đa 100", async function () {
    const { user, usdc, agentNFT, missionBoard, featureRegistry } = await networkHelpers.loadFixture(deploy);
    await mintAgent(usdc, agentNFT, user);

    // updateStats trực tiếp qua MissionBoard với giá trị vượt 100
    // Tạo quest với statBoost = 200 → contract phải cap lại
    const [, , evaluator] = await viem.getWalletClients();
    const reward = 1000000n;
    await usdc.write.mint([user.account.address, 5000000n]);
    await usdc.write.approve([missionBoard.address, reward], { account: user.account });

    await missionBoard.write.createQuest(
      [1n, evaluator.account.address, reward, 3600n, "Test quest", "risk_scoring", "", 200],
      { account: user.account }
    );
    await missionBoard.write.completeQuest([1n], { account: evaluator.account });

    const agent = await agentNFT.read.getAgent([1n]);
    assert.equal(agent.speed, 100);    // cap tại 100
    assert.equal(agent.accuracy, 100);
    assert.equal(agent.power, 100);
  });

  it("feature phải hợp lệ trong FeatureRegistry", async function () {
    const { user, evaluator, usdc, agentNFT, missionBoard } = await networkHelpers.loadFixture(deploy);
    await mintAgent(usdc, agentNFT, user);

    const reward = 1000000n;
    await usdc.write.mint([user.account.address, 5000000n]);
    await usdc.write.approve([missionBoard.address, reward], { account: user.account });

    await viem.assertions.revertWith(
      missionBoard.write.createQuest(
        [1n, evaluator.account.address, reward, 3600n, "Test", "fake_feature", "", 0],
        { account: user.account }
      ),
      "Invalid feature"
    );
  });

  it("power enforce số quest đồng thời — power=10 chỉ nhận 1 quest", async function () {
    const { user, evaluator, usdc, agentNFT, missionBoard } = await networkHelpers.loadFixture(deploy);
    await mintAgent(usdc, agentNFT, user);

    const reward = 1000000n;
    await usdc.write.mint([user.account.address, 10000000n]);

    // Quest 1 — OK
    await usdc.write.approve([missionBoard.address, reward], { account: user.account });
    await missionBoard.write.createQuest(
      [1n, evaluator.account.address, reward, 3600n, "Quest 1", "risk_scoring", "", 0],
      { account: user.account }
    );

    // Quest 2 — bị block vì power=10 → chỉ được 1 quest cùng lúc
    await usdc.write.approve([missionBoard.address, reward], { account: user.account });
    await viem.assertions.revertWith(
      missionBoard.write.createQuest(
        [1n, evaluator.account.address, reward, 3600n, "Quest 2", "task_scheduler", "", 0],
        { account: user.account }
      ),
      "Agent at max concurrent quests"
    );
  });

  it("hoàn thành quest → unlock feature + tăng stats + reputation đúng theo tier", async function () {
    const { user, evaluator, usdc, agentNFT, missionBoard, reputationRegistry } =
      await networkHelpers.loadFixture(deploy);
    await mintAgent(usdc, agentNFT, user);

    const reward = 1000000n;
    await usdc.write.mint([user.account.address, 5000000n]);
    await usdc.write.approve([missionBoard.address, reward], { account: user.account });

    await missionBoard.write.createQuest(
      [1n, evaluator.account.address, reward, 3600n, "Trade quest", "auto_trade", "Trader", 5],
      { account: user.account }
    );
    await missionBoard.write.completeQuest([1n], { account: evaluator.account });

    const agent = await agentNFT.read.getAgent([1n]);
    assert.equal(agent.title, "Trader");
    assert.equal(agent.speed, 15);
    assert.equal(agent.features.length, 4); // 3 base + 1 unlock
    assert.equal(agent.features[3], "auto_trade");

    // Tier 3 feature → reputation 150
    const score = await reputationRegistry.read.reputationScore([1n]);
    assert.equal(score, 150n);
  });

  it("agent không tồn tại thì không tạo quest được", async function () {
    const { user, evaluator, usdc, missionBoard } = await networkHelpers.loadFixture(deploy);

    const reward = 1000000n;
    await usdc.write.mint([user.account.address, 5000000n]);
    await usdc.write.approve([missionBoard.address, reward], { account: user.account });

    await viem.assertions.revert(
      missionBoard.write.createQuest(
        [999n, evaluator.account.address, reward, 3600n, "Quest", "risk_scoring", "", 0],
        { account: user.account }
      )
    );
  });

  it("chỉ evaluator mới duyệt được quest", async function () {
    const { user, evaluator, stranger, usdc, agentNFT, missionBoard } =
      await networkHelpers.loadFixture(deploy);
    await mintAgent(usdc, agentNFT, user);

    const reward = 1000000n;
    await usdc.write.mint([user.account.address, 5000000n]);
    await usdc.write.approve([missionBoard.address, reward], { account: user.account });
    await missionBoard.write.createQuest(
      [1n, evaluator.account.address, reward, 3600n, "Quest", "risk_scoring", "", 0],
      { account: user.account }
    );

    await viem.assertions.revertWith(
      missionBoard.write.completeQuest([1n], { account: stranger.account }),
      "Only evaluator"
    );
  });
});
