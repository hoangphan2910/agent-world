import "dotenv/config";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defineChain } from "viem";
import FeatureRegistryArtifact from "../artifacts/contracts/FeatureRegistry.sol/FeatureRegistry.json" assert { type: "json" };
import AgentNFTArtifact from "../artifacts/contracts/AgentNFT.sol/AgentNFT.json" assert { type: "json" };
import MissionBoardArtifact from "../artifacts/contracts/MissionBoard.sol/MissionBoard.json" assert { type: "json" };

const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: { default: { http: ["https://arc-testnet.drpc.org"] } },
});

// ARC Testnet contract addresses
const ARC = {
  USDC:                "0x3600000000000000000000000000000000000000",
  IDENTITY_REGISTRY:   "0x8004A818BFB912233c491871b3d84c89A494BD9e", // ERC-8004
  REPUTATION_REGISTRY: "0x8004B663056A597Dffe9eCcC1965A193B7388713", // ERC-8004
  AGENTIC_COMMERCE:    "0x0747EEf0706327138c69792bF28Cd525089e4583", // ERC-8183
};

async function deploy(walletClient: any, publicClient: any, artifact: any, args: any[] = []) {
  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode as `0x${string}`,
    args,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return receipt.contractAddress as `0x${string}`;
}

async function main() {
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });
  const walletClient = createWalletClient({ account, chain: arcTestnet, transport: http() });

  console.log("Deploying with:", account.address);

  // 1. Deploy FeatureRegistry
  console.log("\n1. Deploying FeatureRegistry...");
  const featureRegistryAddress = await deploy(walletClient, publicClient, FeatureRegistryArtifact);
  console.log("   FeatureRegistry:", featureRegistryAddress);

  // 2. Deploy AgentNFT
  console.log("\n2. Deploying AgentNFT...");
  const agentNFTAddress = await deploy(walletClient, publicClient, AgentNFTArtifact, [
    ARC.USDC,
    ARC.IDENTITY_REGISTRY,
  ]);
  console.log("   AgentNFT:", agentNFTAddress);

  // 3. Deploy MissionBoard
  console.log("\n3. Deploying MissionBoard...");
  const missionBoardAddress = await deploy(walletClient, publicClient, MissionBoardArtifact, [
    agentNFTAddress,
    ARC.AGENTIC_COMMERCE,
    ARC.REPUTATION_REGISTRY,
    ARC.USDC,
    featureRegistryAddress,
  ]);
  console.log("   MissionBoard:", missionBoardAddress);

  // 4. Link MissionBoard vào AgentNFT
  console.log("\n4. Linking MissionBoard to AgentNFT...");
  const linkHash = await walletClient.writeContract({
    address: agentNFTAddress,
    abi: AgentNFTArtifact.abi,
    functionName: "setMissionBoard",
    args: [missionBoardAddress],
  });
  await publicClient.waitForTransactionReceipt({ hash: linkHash });
  console.log("   Done.");

  console.log("\n========== DEPLOYED ==========");
  console.log("FeatureRegistry :", featureRegistryAddress);
  console.log("AgentNFT        :", agentNFTAddress);
  console.log("MissionBoard    :", missionBoardAddress);
  console.log("==============================");
  console.log("\nVerify on Arcscan: https://testnet.arcscan.app");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
