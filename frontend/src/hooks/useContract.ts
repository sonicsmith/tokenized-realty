import { Contract } from "@ethersproject/contracts";
import { useWeb3React } from "@web3-react/core";
import { useMemo } from "react";
import { contractAddress } from "../constants";
import * as counterArtifacts from "./../artifacts/contracts/Counter.sol/Counter.json";

const { abi } = counterArtifacts;

export function useContract<Contract>(): Contract | null {
  const { provider, account, chainId } = useWeb3React();

  const contract = useMemo(() => {
    if (!provider || !chainId) {
      return null;
    }
    try {
      const signer = provider.getSigner(account).connectUnchecked();
      return new Contract(
        contractAddress[chainId],
        abi,
        account ? signer : provider
      );
    } catch (error) {
      console.error("Failed to get contract", error);
      return null;
    }
  }, [provider, chainId, account]) as Contract;

  return contract;
}
