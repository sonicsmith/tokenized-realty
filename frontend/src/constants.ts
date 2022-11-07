import { ChainId } from "./utils/getInjectedConnectors";

const devContractAddress = process.env.REACT_APP_DEV_CONTRACT;

export const contractAddress: { [key: number]: string } = {
  [ChainId.Ethereum]: "0x",
  [ChainId.Ropsten]: "0x",
  [ChainId.Rinkeby]: "0x",
  [ChainId.Görli]: "0xf4bfea9096db1c243a62ef603e549146d5f648c2",
  [ChainId.Kovan]: "0x",
  [ChainId.Polygon]: "0x",
  [ChainId.GoChain]: devContractAddress!,
};

export const usdAddress: { [key: number]: string } = {
  [ChainId.Ethereum]: "0x",
  [ChainId.Ropsten]: "0x",
  [ChainId.Rinkeby]: "0x",
  [ChainId.Görli]: "0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C",
  [ChainId.Kovan]: "0x",
  [ChainId.Polygon]: "0x",
  [ChainId.GoChain]: "0x",
};
export const USD_TOKEN_SYMBOL = "USDC";
export const USD_DECIMALS = 6;

export const COLLATERAL_PERCENTAGE = 10;
