import "dotenv/config";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defineChain } from "viem";
import ActivityTrackerArtifact from "../artifacts/contracts/ActivityTracker.sol/ActivityTracker.json" assert { type: "json" };

const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: { default: { http: ["https://arc-testnet.drpc.org"] } },
});

const ACTIVITY_TRACKER = "0xc93b16345d07dde693f683f64dcd535500359fa4";

async function main() {
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });
  const walletClient = createWalletClient({ account, chain: arcTestnet, transport: http() });

  const TOKEN_ID = 1n;
  const WALLET = account.address;

  // Dùng RPC trực tiếp để lấy nonce = số tx đã gửi
  const txCount = await publicClient.getTransactionCount({ address: WALLET });
  console.log("Tx count (nonce):", txCount);

  if (txCount >= 10) {
    console.log("Eligible! Submitting proof...");
    const hash = await walletClient.writeContract({
      address: ACTIVITY_TRACKER,
      abi: ActivityTrackerArtifact.abi,
      functionName: "submitProof",
      args: [TOKEN_ID, WALLET, BigInt(txCount)],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log("Done — feature unlocked for agent", TOKEN_ID.toString());
  } else {
    console.log(`Not enough tx. Need ${10 - txCount} more.`);
  }
}

main().catch(console.error);