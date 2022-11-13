import { Button } from "@chakra-ui/react";
import { useWeb3React } from "@web3-react/core";
import { useCallback, useState } from "react";
import type { Web3Provider } from "@ethersproject/providers";
import useAppNotification, { Status } from "../../providers/AppNotification";
import { getShortAddress } from "../../utils/getShortAddress";

const ConnectButton = () => {
  const context = useWeb3React<Web3Provider>();
  const [activating, setActivating] = useState<boolean>(false);
  const setNotification = useAppNotification();

  const { isActive, connector } = context

  const connectToWallet = useCallback(async () => {
    console.log("Connecting to wallet");
    setActivating(true);
    try {
      await connector.activate();
    } catch (e) {
      setNotification!!({
        title: "Error Connecting",
        description: (e as any).message,
        status: Status.Error,
      });
    }
    setActivating(false);
  }, [setActivating, setNotification, connector]);

  const buttonLabel = isActive ? getShortAddress(context.account!) : "Connect Wallet"

  return (
    <Button onClick={connectToWallet} disabled={isActive || activating}>
      {buttonLabel}
    </Button>
  );
};

export default ConnectButton;
