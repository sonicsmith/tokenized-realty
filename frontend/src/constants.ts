import { ChainId } from "./utils/getInjectedConnectors";

const devContractAddress = process.env.REACT_APP_DEV_CONTRACT || "";

export const contractAddress: { [key: number]: string } = {
  [ChainId.Ethereum]: "0x",
  [ChainId.Ropsten]: "0x",
  [ChainId.Rinkeby]: "0x",
  [ChainId.Görli]: "0xF3DFcf3A36c894793b6B522947daa07726C04c2A",
  [ChainId.Kovan]: "0x",
  [ChainId.Polygon]: "0x",
  [ChainId.GoChain]: devContractAddress,
};

export const usdAddress: { [key: number]: string } = {
  [ChainId.Ethereum]: "0x",
  [ChainId.Ropsten]: "0x",
  [ChainId.Rinkeby]: "0x",
  [ChainId.Görli]: "0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C",
  [ChainId.Kovan]: "0x",
  [ChainId.Polygon]: "0x",
  [ChainId.GoChain]: devContractAddress,
};

export const USDTokenSymbol = "USDC";

export const usdDecimals = 6;

export const COLLATERAL_PERCENTAGE = 10;
