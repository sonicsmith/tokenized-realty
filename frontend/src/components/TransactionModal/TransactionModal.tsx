import {
  Box,
  Center,
  Flex,
  List,
  ListIcon,
  ListItem,
  Modal,
  ModalBody,
  ModalContent,
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

enum TransactionStatusMessage {
  Waiting = "Awaiting user confirmation",
  MemPool = "Transaction in mempool",
}

export enum TransactionStatus {
  Success = "Success",
  Fail = "Fail",
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

  const { onComplete } = props;

  const closeModal = useCallback(
    (success: TransactionStatus) => {
      setCurrentTransactionIndex(0);
      setCurrentMessage("");
      onComplete(success);
    },
    [setCurrentTransactionIndex, setCurrentMessage, onComplete]
  );

  useEffect(() => {
    const startTransactions = async () => {
      try {
        for (let index = 0; index < transactions.length; index++) {
          setCurrentMessage(TransactionStatusMessage.Waiting);
          const tx = await transactions[index].function();
          // A null response means no transaction was needed
          if (tx !== null) {
            setCurrentMessage(TransactionStatusMessage.MemPool);
            const result = await tx.wait();
            console.log(result);
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
        closeModal(TransactionStatus.Fail);
      }
    };
    startTransactions();
  }, [transactions, closeModal, setNotification]);

  useEffect(() => {
    if (currentTransactionIndex >= transactions.length) {
      setTimeout(() => closeModal(TransactionStatus.Success), 2000);
    }
  }, [currentTransactionIndex, closeModal, transactions.length]);

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
                currentMessage === TransactionStatusMessage.MemPool
              ) {
                icon = CheckIcon;
              }
              return (
                <ListItem key={title}>
                  <Flex>
                    <ListIcon as={icon} color={"green.500"} my={"auto"} />
                    <Text>{title}</Text>
                    <Text
                      color={"red.500"}
                      ml={3}
                      as="i"
                      size={"xsmall"}
                      className={"flashing"}
                    >
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
