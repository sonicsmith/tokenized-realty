import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react";
import { Contract } from "@ethersproject/contracts";
import { useCallback, useMemo, useState } from "react";
import { USDTokenSymbol } from "../../constants";
import { useContract } from "../../hooks/useContract";
import { getFormattedCurrency } from "../../utils/getFormattedValues";

const PurchaseTokenModal = (props: {
  isOpen: boolean;
  onClose: () => void;
  zipCode: string;
  totalAmount: string;
  tokenExpiry: string;
}) => {
  const [amount, setAmount] = useState<number>(0);

  const contract = useContract() as Contract;

  const { isOpen, onClose, zipCode, totalAmount, tokenExpiry } = props;

  const isAmountValid = useMemo(() => {
    return Number(totalAmount) >= Number(amount);
  }, [totalAmount, amount]);

  const purchase = useCallback(() => {
    // contract
  }, [contract]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Purchase Property Tokens</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex mb={6} direction={"column"} backgroundColor={"gray.100"} p={3}>
            <Flex direction={"row"}>
              <Text as="b" mr={1}>
                Zip Code:
              </Text>
              <Text>{zipCode}</Text>
            </Flex>
            <Flex direction={"row"}>
              <Text as="b" mr={1}>
                Amount for sale:
              </Text>
              <Text>
                {getFormattedCurrency(totalAmount)} {USDTokenSymbol}
              </Text>
            </Flex>
            <Flex direction={"row"}>
              <Text as="b" mr={1}>
                Tokens expiry:
              </Text>
              <Text>{tokenExpiry}</Text>
            </Flex>
          </Flex>
          <FormControl mb={4} isRequired isInvalid={!isAmountValid}>
            <FormLabel>
              <b>Amount to purchase ({USDTokenSymbol})</b>
            </FormLabel>
            <InputGroup>
              <InputLeftElement
                pointerEvents="none"
                color="gray.300"
                fontSize="1.2em"
                children="$"
              />
              <Input
                placeholder={"eg 5,000"}
                value={amount}
                type={"number"}
                onChange={(event) => setAmount(Number(event.target.value))}
              />
            </InputGroup>
            <FormErrorMessage>Amount too high</FormErrorMessage>
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={purchase} disabled={!isAmountValid}>
            Purchase
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PurchaseTokenModal;
