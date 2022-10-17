import { Box, Flex, Text, Spacer } from "@chakra-ui/react";
import ConnectButton from "../ConnectButton/ConnectButton";

export default function AppBar(props: any) {
  return (
    <Box bg={"gray.300"} p={4}>
      <Flex alignItems={"stretch"}>
        <Text fontSize={"xl"} p={1}>
          Counter Dapp
        </Text>
        <Spacer />
        <ConnectButton />
      </Flex>
    </Box>
  );
}
