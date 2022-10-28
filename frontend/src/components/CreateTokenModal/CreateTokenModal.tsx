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
  Spacer,
  Text,
} from "@chakra-ui/react";
import { Contract } from "@ethersproject/contracts";
import { useCallback, useMemo, useState } from "react";

import "react-datepicker/dist/react-datepicker.css";
import { USDTokenSymbol } from "../../constants";
import { useContract } from "../../hooks/useContract";
import { getFormattedCurrency } from "../../utils/getFormattedValues";
import DatePicker from "../DatePicker/DatePicker";

const CreateTokenModal = (props: { isOpen: boolean; onClose: () => void }) => {
  const [totalAmount, setTotalAmount] = useState<number>();
  const [propertyId, setPropertyId] = useState<number>();
  const [tokenExpiry, setEndDate] = useState(new Date());

  const contract = useContract() as Contract;

  const { isOpen, onClose } = props;

  const collateral = useMemo(() => {
    return (totalAmount || 0) * 0.1; // 10%
  }, [totalAmount]);

  const createTokens = useCallback(() => {
    contract
      ?.createPropertyTokens(propertyId, tokenExpiry, totalAmount)
      .then((res: any) => {
        console.log(res);
      });
  }, [contract]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create Property Tokens</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl mb={4} isRequired>
            <FormLabel>Property ID</FormLabel>
            <Input
              type={"number"}
              placeholder={"eg 12345"}
              value={propertyId}
              onChange={(event) => setPropertyId(Number(event.target.value))}
            />
          </FormControl>
          <FormControl mb={4} isRequired>
            <FormLabel>Total {USDTokenSymbol} value of tokens</FormLabel>
            <InputGroup>
              <InputLeftElement
                pointerEvents="none"
                color="gray.300"
                fontSize="1.2em"
                children="$"
              />
              <Input
                placeholder={"eg 10,000"}
                value={totalAmount}
                type={"number"}
                onChange={(event) => setTotalAmount(Number(event.target.value))}
              />
            </InputGroup>
            {totalAmount ? (
              <FormHelperText>
                (You will pay collateral of: {getFormattedCurrency(collateral)})
              </FormHelperText>
            ) : (
              undefined
            )}
          </FormControl>
          <FormControl mb={4} isRequired>
            <FormLabel>Token expiry:</FormLabel>
            <DatePicker date={tokenExpiry} setDate={setEndDate} />
            <FormHelperText>
              (The date that your tokens will reconcile)
            </FormHelperText>
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={createTokens} disabled={true}>
            Create
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateTokenModal;
