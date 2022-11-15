import {
  Center,
  Flex,
  Spacer,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Box,
  Spinner,
  useColorMode,
  Button,
} from "@chakra-ui/react";
import PropertyTokenList from "../PropertyTokenList/PropertyTokenList";
import Portfolio from "../Portfolio/Portfolio";
import ConnectButton from "../ConnectButton/ConnectButton";
import { IPropertyToken } from "../PropertyToken/PropertyToken";
import { useCallback, useEffect, useState } from "react";
import { useContract } from "../../hooks/useContracts";
import { Contract } from "@ethersproject/contracts";
import { useWeb3React } from "@web3-react/core";
import { Web3Provider } from "@ethersproject/providers";
import { getMilliseconds } from "../../utils/getDateUtils";
import TransactionModal, {
  TransactionStatus,
} from "../TransactionModal/TransactionModal";
import useAppStore, { ActionTypes } from "../../providers/AppStore";
import { ethers } from "ethers";
import { USD_DECIMALS } from "../../constants";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";

const Main = () => {
  const [propertyTokens, setPropertyTokens] = useState<IPropertyToken[]>([]);
  const { isActive, account } = useWeb3React<Web3Provider>();
  const { mainContract } = useContract() as { mainContract: Contract };
  const { state, dispatch } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);

  const refreshPropertyTokens = useCallback(async () => {
    setIsLoading(true);
    const list: ethers.BigNumber[] = await mainContract?.getPropertyTokenList();
    console.log("List of property tokens:", (list || []).toString());
    if (list && list.length) {
      const tokenData = await Promise.all(
        list.map((zipCode) => {
          return mainContract?.getPropertyToken(zipCode);
        })
      );
      const holders = await Promise.all(
        list.map((zipCode) => {
          return mainContract?.getHoldersForToken(zipCode);
        })
      );
      const reconciledList = await Promise.all(
        list.map((zipCode) => {
          return mainContract?.getAreTokensReconciled(zipCode);
        })
      );
      console.log("reconciledList", (reconciledList || []).toString());
      const holdersInfo = await Promise.all(
        list.map((zipCode) => {
          return mainContract?.getHolderForAddress(account, zipCode);
        })
      );
      console.log("holdersInfo", (holdersInfo || []).toString());
      const tokens: IPropertyToken[] = tokenData.map((data, index) => {
        console.log("Property Data:", data.toString());
        return {
          tokenExpiry: getMilliseconds(data[0]),
          amountLeft: ethers.utils.formatUnits(data[2], USD_DECIMALS),
          zipCode: list[index].toString(),
          holders: holders[index],
          hasReconciled: reconciledList[index],
          hasClaimed: holdersInfo[index][5],
        };
      });
      setPropertyTokens(tokens);

      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [mainContract, account, setIsLoading, setPropertyTokens]);

  useEffect(() => {
    if (mainContract) {
      refreshPropertyTokens();
    }
  }, [mainContract, refreshPropertyTokens]);

  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Center>
      <Tabs align={"center"} width={"100%"}>
        <Flex
          alignItems={"stretch"}
          p={4}
          sx={{ position: "sticky", top: 0, zIndex: 1 }}
        >
          <Text fontSize={"xl"} p={1}>
            🏠 Tokenized Realty (BETA)
          </Text>
          <Spacer />
          {isActive && (
            <TabList sx={{ position: "sticky", top: 15 }}>
              <Tab>Properties</Tab>
              <Tab>Portfolio</Tab>
            </TabList>
          )}
          <Spacer />
          <Button
            onClick={toggleColorMode}
            leftIcon={colorMode === "dark" ? <SunIcon /> : <MoonIcon />}
            variant="link"
          />
          <ConnectButton />
        </Flex>
        {isActive ? (
          <TabPanels>
            <TabPanel>
              {isLoading ? (
                <Box>
                  <Spinner size={"lg"} mt={20} />
                </Box>
              ) : (
                <PropertyTokenList propertyTokens={propertyTokens} />
              )}
            </TabPanel>
            <TabPanel>
              <Portfolio propertyTokens={propertyTokens} />
            </TabPanel>
          </TabPanels>
        ) : (
          <Box>
            <Text>Please connect your web3 wallet to begin</Text>
          </Box>
        )}
      </Tabs>
      <TransactionModal
        title={"Attempting transactions"}
        transactions={state?.transactions || []}
        onComplete={(status: TransactionStatus) => {
          dispatch!({ type: ActionTypes.AddTransactions, payload: [] });
          if (status === TransactionStatus.Success) {
            refreshPropertyTokens();
          }
        }}
      />
    </Center>
  );
};

export default Main;
