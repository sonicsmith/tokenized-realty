import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "solidity-coverage";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      { version: "0.8.17" },
      { version: "0.6.6" },
      { version: "0.4.24" },
    ],
  },
  paths: {
    artifacts: "./frontend/src/artifacts",
  },
};

export default config;
