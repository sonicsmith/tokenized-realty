import { ChainId } from "./utils/getInjectedConnectors";

const devContractAddress = process.env.REACT_APP_DEV_CONTRACT;

export const contractAddress: Record<number, string> = {
  [ChainId.Ethereum]: "",
  [ChainId.Ropsten]: "",
  [ChainId.Rinkeby]: "",
  [ChainId.Görli]: "0x72F90F57e2a49e4a7C6578dc66fdd70Be6948285",
  [ChainId.Kovan]: "",
  [ChainId.Polygon]: "",
  [ChainId.GoChain]: devContractAddress!,
};

export const usdAddress: Record<number, string> = {
  [ChainId.Ethereum]: "",
  [ChainId.Ropsten]: "",
  [ChainId.Rinkeby]: "",
  [ChainId.Görli]: "0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C",
  [ChainId.Kovan]: "",
  [ChainId.Polygon]: "",
  [ChainId.GoChain]: "",
};
export const USD_TOKEN_SYMBOL = "USDC";
export const USD_DECIMALS = 6;
export const USDC_LINK =
  "https://app.uniswap.org/#/swap?outputCurrency=0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C";

export const COLLATERAL_PERCENTAGE = 10;

export const VIDEO_LINK = "https://www.youtube.com/watch?v=rz53zPCdbb0";
