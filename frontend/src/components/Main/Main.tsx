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
} from "@chakra-ui/react";
import PropertyTokenList from "../PropertyTokenList/PropertyTokenList";
import Portfolio from "../Portfolio/Portfolio";
import ConnectButton from "../ConnectButton/ConnectButton";
import { IPropertyToken } from "../PropertyToken/PropertyToken";
import { useEffect, useState } from "react";
import { useContract } from "../../hooks/useContracts";
import { Contract } from "@ethersproject/contracts";
import { useWeb3React } from "@web3-react/core";
import { Web3Provider } from "@ethersproject/providers";
import { getMilliseconds } from "../../utils/getDateUtils";
import TransactionModal from "../TransactionModal/TransactionModal";
import useAppStore, { ActionTypes } from "../../providers/AppStore";
import { ethers } from "ethers";
import { usdDecimals } from "../../constants";

const Main = () => {
  const [propertyTokens, setPropertyTokens] = useState<IPropertyToken[]>([]);
  const { isActive } = useWeb3React<Web3Provider>();
  const { mainContract } = useContract() as { mainContract: Contract };
  const { state, dispatch } = useAppStore();

  useEffect(() => {
    const getPropertyTokens = async () => {
      const list: ethers.BigNumber[] = await mainContract?.getPropertyTokenList();
      if (list && list.length) {
        const tokenData = await Promise.all(
          list.map((zipCode) => {
            return mainContract?.getPropertyToken(zipCode);
          })
        );
        const tokens = tokenData.map((data, index) => {
          return {
            tokenExpiry: getMilliseconds(data[0]),
            totalAmount: ethers.utils.formatUnits(data[1], usdDecimals),
            zipCode: list[index].toString(),
          };
        });
        setPropertyTokens(tokens);
      }
    };
    getPropertyTokens();
  }, [mainContract]);

  return (
    <Center>
      <Tabs align={"center"} width={"100%"}>
        <Flex
          alignItems={"stretch"}
          p={4}
          sx={{ position: "sticky", top: 0, zIndex: 1 }}
          backgroundColor={"white"}
        >
          <Text fontSize={"xl"} p={1}>
            🏠 Tokenized Realty
          </Text>
          <Spacer />
          {isActive && (
            <TabList sx={{ position: "sticky", top: 15 }} background={"white"}>
              <Tab>Properties</Tab>
              <Tab>Portfolio</Tab>
            </TabList>
          )}
          <Spacer />
          <ConnectButton />
        </Flex>
        {isActive ? (
          <TabPanels>
            <TabPanel>
              <PropertyTokenList propertyTokens={propertyTokens} />
            </TabPanel>
            <TabPanel>
              <Portfolio />
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
        onComplete={() => {
          dispatch!({ type: ActionTypes.AddTransactions, payload: [] });
        }}
      />
    </Center>
  );
};

export default Main;
