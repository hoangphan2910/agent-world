import "dotenv/config";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defineChain } from "viem";
import AgentRegistryArtifact from "../artifacts/contracts/AgentRegistry.sol/AgentRegistry.json" assert { type: "json" };
import ActivityTrackerArtifact from "../artifacts/contracts/ActivityTracker.sol/ActivityTracker.json" assert { type: "json" };

const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: { default: { http: ["https://arc-testnet.drpc.org"] } },
});

const EXISTING_REGISTRY = "0x69924e59f62489fe0d2d76167a41c0b3f8785f26";

async function main() {
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });
  const walletClient = createWalletClient({ account, chain: arcTestnet, transport: http() });

  console.log("Deploying ActivityTracker...");
  const trackerHash = await walletClient.deployContract({
    abi: ActivityTrackerArtifact.abi,
    bytecode: ActivityTrackerArtifact.bytecode as `0x${string}`,
    args: [EXISTING_REGISTRY],
  });
  const trackerReceipt = await publicClient.waitForTransactionReceipt({ hash: trackerHash });
  const trackerAddress = trackerReceipt.contractAddress!;
  console.log("ActivityTracker:", trackerAddress);

  console.log("\nLinking to AgentRegistry...");
  const linkHash = await walletClient.writeContract({
    address: EXISTING_REGISTRY,
    abi: AgentRegistryArtifact.abi,
    functionName: "setMissionBoard",
    args: [trackerAddress],
  });
  await publicClient.waitForTransactionReceipt({ hash: linkHash });
  console.log("Done");
  console.log("ActivityTracker:", trackerAddress);
}

main().catch(console.error);