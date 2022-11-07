import {
  Box,
  Button,
  Center,
  Flex,
  List,
  ListIcon,
  ListItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { CheckCircleIcon, TimeIcon, CheckIcon } from "@chakra-ui/icons";
import { useCallback, useEffect, useState } from "react";
import useAppNotification, { Status } from "../../providers/AppNotification";

export interface Transaction {
  title: string;
  function: Function;
}

enum TransactionStatus {
  Waiting = "Awaiting user confirmation",
  MemPool = "Transaction in mempool",
}

const TransactionModal = (props: {
  title: string;
  transactions: Transaction[];
  onComplete: Function;
}) => {
  const { title, transactions } = props;
  const [currentTransactionIndex, setCurrentTransactionIndex] = useState<
    number
  >(0);
  const [currentMessage, setCurrentMessage] = useState<string>();

  const setNotification = useAppNotification();

  const closeModal = useCallback(() => {
    setCurrentTransactionIndex(0);
    setCurrentMessage("");
    props.onComplete();
  }, [setCurrentTransactionIndex, setCurrentMessage, props.onComplete]);

  useEffect(() => {
    const startTransactions = async () => {
      try {
        for (let index = 0; index < transactions.length; index++) {
          setCurrentMessage(TransactionStatus.Waiting);
          const tx = await transactions[index].function();
          // A null response means no transaction was needed
          if (tx !== null) {
            setCurrentMessage(TransactionStatus.MemPool);
            const result = await tx.wait();
            // Do something with result?
          }
          setCurrentTransactionIndex(index + 1);
        }
      } catch (e) {
        let description: string = (e as any).reason || (e as any).message;
        if (description.includes("user rejected transaction")) {
          description = "User rejected transaction";
        }
        setNotification!!({
          title: "Failed",
          description,
          status: Status.Error,
        });
        closeModal();
      }
    };
    startTransactions();
  }, [transactions]);

  useEffect(() => {
    if (currentTransactionIndex >= transactions.length) {
      setTimeout(closeModal, 2000);
    }
  }, [currentTransactionIndex]);

  return (
    <Modal isOpen={transactions.length > 0} onClose={() => {}}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody p={6}>
          <List spacing={3}>
            {transactions.map(({ title }, index) => {
              const isSuccess = currentTransactionIndex > index;
              const isCurrentAction = currentTransactionIndex === index;
              let icon = TimeIcon;
              if (isSuccess) {
                icon = CheckCircleIcon;
              }
              if (
                !isSuccess &&
                isCurrentAction &&
                currentMessage === TransactionStatus.MemPool
              ) {
                icon = CheckIcon;
              }
              return (
                <ListItem key={title}>
                  <Flex>
                    <ListIcon as={icon} color={"green.500"} my={"auto"} />
                    <Text>{title}</Text>
                    <Text color={"red.500"} ml={3} as="i" size={"xsmall"}>
                      {isCurrentAction && currentMessage}
                    </Text>
                  </Flex>
                </ListItem>
              );
            })}
          </List>
          {currentTransactionIndex >= transactions.length ? (
            <Box mt={6}>
              <Text as={"b"}>All transactions completed</Text>
            </Box>
          ) : (
            <Center>
              <Spinner size={"xl"} mx={"auto"} mt={6} />
            </Center>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default TransactionModal;
