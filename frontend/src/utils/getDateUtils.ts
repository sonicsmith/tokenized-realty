import { ethers } from "ethers";

export const getMilliseconds = (seconds: ethers.BigNumber): number => {
  return seconds.mul(1000).toNumber();
};
