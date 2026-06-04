import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
    },
  },
  networks: {
    arc: {
      type: "http",
      chainType: "l1",
      url: "https://arc-testnet.drpc.org",
      accounts: [configVariable("PRIVATE_KEY")],
    },
  },
});