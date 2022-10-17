import { ChainId } from "./utils/getInjectedConnectors";

const devContractAddress = process.env.REACT_APP_DEV_CONTRACT || "";

export const contractAddress: { [key: number]: string } = {
  [ChainId.Ethereum]: "0x",
  [ChainId.Ropsten]: "0x",
  [ChainId.Rinkeby]: "0x",
  [ChainId.Görli]: "0x",
  [ChainId.Kovan]: "0x",
  [ChainId.Polygon]: "0x",
  [ChainId.GoChain]: devContractAddress,
};
