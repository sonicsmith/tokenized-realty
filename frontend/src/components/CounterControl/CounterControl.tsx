import { Box, Button, Center, Flex, Text, VStack } from "@chakra-ui/react";
import { Contract } from "@ethersproject/contracts";
import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useCallback, useEffect, useState } from "react";
import { useContract } from "../../hooks/useContract";

const CounterControl = () => {
  const { account } = useWeb3React<Web3Provider>();
  const [count, setCount] = useState<string>();
  const contractInstance = useContract<Contract>();

  console.log(contractInstance);

  useEffect(() => {
    if (contractInstance) {
      contractInstance.get().then((newCount: any) => {
        console.log(newCount);
        setCount(newCount.toString());
      });
    }
  }, [contractInstance]);

  const changeCount = useCallback(
    async (amount: number) => {
      if (contractInstance && account) {
        let method;
        // Get the correct method
        if (amount < 0) {
          method = contractInstance.dec;
        } else {
          method = contractInstance.inc;
        }
        const tx = await method();
        console.log("Transaction", tx);
        await tx.wait();
        console.log("Transaction Finished");
        const newCount = await contractInstance.get();
        setCount(newCount.toString());
      }
    },
    [contractInstance, account]
  );

  const isButtonEnabled = !account;

  return (
    <Center height={"200"}>
      {account ? (
        <VStack>
          <Box>
            <Text fontSize={"3xl"}>Current Value: {count}</Text>
          </Box>
          <Flex m={1}>
            <Button
              onClick={() => changeCount(-1)}
              m={3}
              disabled={isButtonEnabled}
            >
              Decrement TokenizedRealty
            </Button>
            <Button
              onClick={() => changeCount(1)}
              m={3}
              disabled={isButtonEnabled}
            >
              Increment TokenizedRealty
            </Button>
          </Flex>
        </VStack>
      ) : (
        <Box>
          <Text fontSize={"3xl"}>
            Connect your wallet to access the TokenizedRealty
          </Text>
        </Box>
      )}
    </Center>
  );
};

export default CounterControl;
