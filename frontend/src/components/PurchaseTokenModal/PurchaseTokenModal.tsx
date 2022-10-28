import {
  Box,
  Button,
  Flex,
  FormControl,
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
import { useState } from "react";
import { USDTokenSymbol } from "../../constants";
import { useContract } from "../../hooks/useContract";
import { getFormattedCurrency } from "../../utils/getFormattedValues";

const PurchaseTokenModal = (props: {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  totalAmount: string;
  tokenExpiry: string;
}) => {
  const [amount, setAmount] = useState<number>();

  const contract = useContract() as Contract;

  const { isOpen, onClose, propertyId, totalAmount, tokenExpiry } = props;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Purchase Property Tokens</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex mb={6} direction={"column"}>
            <Text as="i">Property ID: {propertyId}</Text>
            <Text as="i">
              Amount of tokens for sale: {getFormattedCurrency(totalAmount)}
              {USDTokenSymbol}
            </Text>
            <Text as="i">Tokens expire on the {tokenExpiry}</Text>
          </Flex>
          <FormControl mb={4} isRequired>
            <FormLabel>Amount to purchase ({USDTokenSymbol})</FormLabel>
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
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={console.log} disabled={true}>
            Purchase
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PurchaseTokenModal;
