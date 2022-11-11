import { Contract } from "@ethersproject/contracts";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import { contractAddress, usdAddress } from "../constants";
import * as artifacts from "../artifacts/contracts/TokenizedRealty.sol/TokenizedRealty.json";
import erc20Abi from "./erc20.json";

const { abi } = artifacts;

export function useContract<Contract>(): {
  mainContract: Contract | null;
  usdContract: Contract | null;
} {
  const { provider, account, chainId } = useWeb3React();

  const [mainContract, setMainContract] = useState<Contract | null>(null);
  const [usdContract, setUsdContract] = useState<Contract | null>(null);

  useEffect(() => {
    if (provider && chainId) {
      try {
        const signer = provider.getSigner(account).connectUnchecked();
        setMainContract(
          new Contract(
            contractAddress[chainId],
            abi,
            account ? signer : provider
          ) as Contract
        );
        setUsdContract(
          new Contract(
            usdAddress[chainId],
            erc20Abi,
            account ? signer : provider
          ) as Contract
        );
      } catch (error) {
        console.error("Failed to get contract", error);
      }
    }
  }, [provider, chainId, account]);

  return { mainContract, usdContract };
}
