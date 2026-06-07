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

  // --- Các test "tấn công" kiểm chứng những lỗ hổng đã được vá ---

  it("[security] client không thể tự đặt mình làm evaluator (self-deal)", async function () {
    const { user, usdc, agentNFT, missionBoard } = await networkHelpers.loadFixture(deploy);
    await mintAgent(usdc, agentNFT, user);

    const reward = 1000000n;
    await usdc.write.mint([user.account.address, 5000000n]);
    await usdc.write.approve([missionBoard.address, reward], { account: user.account });

    await viem.assertions.revertWith(
      missionBoard.write.createQuest(
        [1n, user.account.address, reward, 3600n, "Quest", "risk_scoring", "", 0],
        { account: user.account }
      ),
      "Evaluator cannot be client"
    );
  });

  it("[security] chủ agent không thể đặt chính mình làm evaluator qua người khác đứng tên client", async function () {
    const { user, stranger, usdc, agentNFT, missionBoard } = await networkHelpers.loadFixture(deploy);
    await mintAgent(usdc, agentNFT, user); // user là chủ token 1

    const reward = 1000000n;
    await usdc.write.mint([stranger.account.address, 5000000n]);
    await usdc.write.approve([missionBoard.address, reward], { account: stranger.account });

    // stranger tạo quest cho agent của user, nhưng cố đặt evaluator = user (chủ agent)
    await viem.assertions.revertWith(
      missionBoard.write.createQuest(
        [1n, user.account.address, reward, 3600n, "Quest", "risk_scoring", "", 0],
        { account: stranger.account }
      ),
      "Evaluator cannot be agent owner"
    );
  });

  it("[security] client lấy lại được USDC khi quest hết hạn mà evaluator không duyệt", async function () {
    const { user, evaluator, usdc, agentNFT, missionBoard } = await networkHelpers.loadFixture(deploy);
    await mintAgent(usdc, agentNFT, user);

    const reward = 1000000n;
    await usdc.write.mint([user.account.address, 5000000n]);
    const balanceBefore = await usdc.read.balanceOf([user.account.address]);

    await usdc.write.approve([missionBoard.address, reward], { account: user.account });
    await missionBoard.write.createQuest(
      [1n, evaluator.account.address, reward, 3600n, "Quest", "risk_scoring", "", 0],
      { account: user.account }
    );

    // Chưa hết hạn → không hủy được
    await viem.assertions.revertWith(
      missionBoard.write.cancelQuest([1n], { account: user.account }),
      "Quest not expired"
    );

    // Tua thời gian qua khỏi deadline (3600s)
    await networkHelpers.time.increase(3601);

    await missionBoard.write.cancelQuest([1n], { account: user.account });

    const balanceAfter = await usdc.read.balanceOf([user.account.address]);
    assert.equal(balanceAfter, balanceBefore - reward + reward); // hoàn lại đủ reward
    assert.equal(balanceAfter, balanceBefore);

    // Không thể hủy hai lần / không thể hoàn thành sau khi đã hủy
    await viem.assertions.revertWith(
      missionBoard.write.cancelQuest([1n], { account: user.account }),
      "Quest closed"
    );
    await viem.assertions.revertWith(
      missionBoard.write.completeQuest([1n], { account: evaluator.account }),
      "Quest closed"
    );
  });

  it("[security] không thể hoàn thành quest đã bị hủy, kể cả trước hạn nếu trạng thái đã đóng", async function () {
    const { user, evaluator, usdc, agentNFT, missionBoard } = await networkHelpers.loadFixture(deploy);
    await mintAgent(usdc, agentNFT, user);

    const reward = 1000000n;
    await usdc.write.mint([user.account.address, 5000000n]);
    await usdc.write.approve([missionBoard.address, reward], { account: user.account });
    await missionBoard.write.createQuest(
      [1n, evaluator.account.address, reward, 3600n, "Quest", "risk_scoring", "", 0],
      { account: user.account }
    );

    await missionBoard.write.completeQuest([1n], { account: evaluator.account });

    // Sau khi hoàn thành, không thể hủy (kể cả khi hết hạn)
    await networkHelpers.time.increase(3601);
    await viem.assertions.revertWith(
      missionBoard.write.cancelQuest([1n], { account: user.account }),
      "Quest closed"
    );
  });
});
