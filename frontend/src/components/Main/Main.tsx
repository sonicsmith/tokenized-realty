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
} from "@chakra-ui/react";
import PropertyTokenList from "../PropertyTokenList/PropertyTokenList";
import Portfolio from "../Portfolio/Portfolio";
import ConnectButton from "../ConnectButton/ConnectButton";
import { IPropertyToken } from "../PropertyToken/PropertyToken";
import { useEffect, useState } from "react";
import { useContract } from "../../hooks/useContract";
import { Contract } from "@ethersproject/contracts";

const Main = () => {
  const [propertyTokens, setPropertyTokens] = useState([]);

  const contract = useContract() as Contract;

  useEffect(() => {
    contract?.getPropertyTokenList().then((list: any) => {
      console.log(list);
      setPropertyTokens(list);
    });
  }, [contract]);

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
          <TabList sx={{ position: "sticky", top: 15 }} background={"white"}>
            <Tab>Properties</Tab>
            <Tab>Portfolio</Tab>
          </TabList>
          <Spacer />
          <ConnectButton />
        </Flex>
        <TabPanels>
          <TabPanel>
            <PropertyTokenList propertyTokens={propertyTokens} />
          </TabPanel>
          <TabPanel>
            <Portfolio />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Center>
  );
};

export default Main;
