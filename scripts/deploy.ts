// Deploy AgentRegistry trước → lấy địa chỉ
// Deploy AgentNFT sau → truyền địa chỉ AgentRegistry vào
// Sau đó gọi setAgentNFT để 2 contract biết nhau
import "dotenv/config";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defineChain } from "viem";
import AgentRegistryArtifact from "../artifacts/contracts/AgentRegistry.sol/AgentRegistry.json" assert { type: "json" };
import AgentNFTArtifact from "../artifacts/contracts/AgentNFT.sol/AgentNFT.json" assert { type: "json" };

const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: { default: { http: ["https://arc-testnet.drpc.org"] } },
});

const USDC = "0x3600000000000000000000000000000000000000";

async function main() {
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });
  const walletClient = createWalletClient({ account, chain: arcTestnet, transport: http() });

  console.log("Deploying with:", account.address);

  // Deploy AgentRegistry
  console.log("\nDeploying AgentRegistry...");
  const registryHash = await walletClient.deployContract({
    abi: AgentRegistryArtifact.abi,
    bytecode: AgentRegistryArtifact.bytecode as `0x${string}`,
    args: [],
  });
  const registryReceipt = await publicClient.waitForTransactionReceipt({ hash: registryHash });
  const registryAddress = registryReceipt.contractAddress!;
  console.log("AgentRegistry:", registryAddress);

  // Deploy AgentNFT
  console.log("\nDeploying AgentNFT...");
  const nftHash = await walletClient.deployContract({
    abi: AgentNFTArtifact.abi,
    bytecode: AgentNFTArtifact.bytecode as `0x${string}`,
    args: [USDC, registryAddress],
  });
  const nftReceipt = await publicClient.waitForTransactionReceipt({ hash: nftHash });
  const nftAddress = nftReceipt.contractAddress!;
  console.log("AgentNFT:", nftAddress);

  // Link 2 contract
  console.log("\nLinking contracts...");
  const linkHash = await walletClient.writeContract({
    address: registryAddress,
    abi: AgentRegistryArtifact.abi,
    functionName: "setAgentNFT",
    args: [nftAddress],
  });
  await publicClient.waitForTransactionReceipt({ hash: linkHash });
  console.log("Done — AgentNFT linked to AgentRegistry");
  console.log("\n--- Addresses ---");
  console.log("AgentRegistry:", registryAddress);
  console.log("AgentNFT:", nftAddress);
}

main().catch(console.error);