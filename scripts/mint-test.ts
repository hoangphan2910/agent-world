import "dotenv/config";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defineChain } from "viem";
import AgentNFTArtifact from "../artifacts/contracts/AgentNFT.sol/AgentNFT.json" assert { type: "json" };
import deployment from "../deployments/arc-testnet.json" assert { type: "json" };

const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: { default: { http: ["https://arc-testnet.drpc.org"] } },
});

const USDC_ABI = [
  { name: "approve", type: "function", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
  { name: "balanceOf", type: "function", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

async function main() {
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });
  const walletClient = createWalletClient({ account, chain: arcTestnet, transport: http() });

  console.log("Wallet:", account.address);

  // Check USDC balance
  const balance = await publicClient.readContract({
    address: deployment.arc.USDC as `0x${string}`,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: [account.address],
  });
  console.log("USDC balance:", Number(balance) / 1_000_000, "USDC");

  if (balance < 10000n) {
    console.log("\nKhông đủ USDC. Lấy testnet USDC tại: https://faucet.circle.com");
    return;
  }

  // Approve 0.01 USDC cho AgentNFT
  console.log("\nApproving 0.01 USDC...");
  const approveHash = await walletClient.writeContract({
    address: deployment.arc.USDC as `0x${string}`,
    abi: USDC_ABI,
    functionName: "approve",
    args: [deployment.contracts.AgentNFT as `0x${string}`, 10000n],
  });
  await publicClient.waitForTransactionReceipt({ hash: approveHash });
  console.log("Approved.");

  // Mint agent
  console.log("\nMinting agent...");
  const mintHash = await walletClient.writeContract({
    address: deployment.contracts.AgentNFT as `0x${string}`,
    abi: AgentNFTArtifact.abi,
    functionName: "mint",
    args: ["ipfs://QmAgentWorldTestMetadata"],
  });
  const mintReceipt = await publicClient.waitForTransactionReceipt({ hash: mintHash });
  console.log("Mint tx:", mintHash);
  console.log("View on Arcscan:", `https://testnet.arcscan.app/tx/${mintHash}`);

  // Đọc agent data
  const totalMinted = await publicClient.readContract({
    address: deployment.contracts.AgentNFT as `0x${string}`,
    abi: AgentNFTArtifact.abi,
    functionName: "totalMinted",
  });
  const tokenId = totalMinted as bigint;

  const agentData = await publicClient.readContract({
    address: deployment.contracts.AgentNFT as `0x${string}`,
    abi: AgentNFTArtifact.abi,
    functionName: "getAgent",
    args: [tokenId],
  }) as any;

  console.log("\n========== AGENT MINTED ==========");
  console.log("Token ID  :", tokenId.toString());
  console.log("Name      :", agentData.name);
  console.log("Alias     :", agentData.alias_);
  console.log("Title     :", agentData.title);
  console.log("Speed     :", agentData.speed);
  console.log("Accuracy  :", agentData.accuracy);
  console.log("Power     :", agentData.power);
  console.log("Features  :", agentData.features);
  console.log("ERC-8004 ID:", agentData.erc8004Id.toString());
  console.log("==================================");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
