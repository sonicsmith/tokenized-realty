import {
  Button,
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
} from "@chakra-ui/react";
import { Contract } from "@ethersproject/contracts";
import { useCallback, useMemo, useState } from "react";
import { ethers, utils } from "ethers";
import { isBefore, addQuarters, format } from "date-fns";

import {
  COLLATERAL_PERCENTAGE,
  contractAddress,
  usdAddress,
  usdDecimals,
  USDTokenSymbol,
} from "../../constants";
import { useContract } from "../../hooks/useContracts";
import { getFormattedCurrency } from "../../utils/getFormattedValues";
import DatePicker from "../DatePicker/DatePicker";
import getZipCodeDetails from "../../utils/getZipCodeDetails";
import { useWeb3React } from "@web3-react/core";
import useAppStore, { ActionTypes } from "../../providers/AppStore";
import { getMockTransaction } from "../../test/getMockTransaction";

const CreateTokenModal = (props: { isOpen: boolean; onClose: () => void }) => {
  const [totalAmount, setTotalAmount] = useState<number>();
  const [zipCode, setPropertyId] = useState<number>();
  const [tokenExpiry, setEndDate] = useState(addQuarters(new Date(), 1));

  const { mainContract, usdContract } = useContract() as {
    mainContract: Contract;
    usdContract: Contract;
  };

  const { account, chainId } = useWeb3React();

  const { isOpen, onClose } = props;

  const collateralDisplay = useMemo(() => {
    return (totalAmount || 0) * (COLLATERAL_PERCENTAGE / 100);
  }, [totalAmount]);

  const { dispatch } = useAppStore();

  const createTokens = useCallback(async () => {
    if (zipCode && tokenExpiry && totalAmount && usdContract && mainContract) {
      const totalBigAmount = ethers.utils.parseUnits(
        totalAmount.toString(),
        usdDecimals
      );

      const grantAllowance = () => {
        const collateral = totalBigAmount.div(COLLATERAL_PERCENTAGE);
        return usdContract
          .allowance(account, contractAddress[chainId!])
          .then((allowance: ethers.BigNumber) => {
            // If not enough USD allowance
            if (allowance.lt(collateral)) {
              return usdContract.approve(
                contractAddress[chainId!],
                collateral.sub(allowance)
              );
            } else {
              return null;
            }
          });
      };

      const createPropertyTokens = () => {
        return mainContract.createPropertyTokens(
          zipCode,
          format(tokenExpiry, "t"),
          totalBigAmount
        );
      };

      const payload = [
        {
          title: "Grant USDC Allowance",
          function: grantAllowance,
        },
        {
          title: "Create Property Tokens",
          function: createPropertyTokens,
        },
      ];
      dispatch!({ type: ActionTypes.AddTransactions, payload });
      onClose();
    }
  }, [mainContract, usdAddress, zipCode, tokenExpiry, totalAmount]);

  const location = useMemo(() => {
    const details = zipCode && getZipCodeDetails(zipCode);
    if (details) {
      const { county, state, city } = details;
      return `${city}, ${county}, ${state}`;
    }
  }, [zipCode]);

  const dateIsInFuture = useMemo(() => {
    return isBefore(new Date(), tokenExpiry);
  }, [tokenExpiry]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create Property Tokens</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl mb={4} isRequired>
            <FormLabel>Zip Code</FormLabel>
            <Input
              type={"number"}
              placeholder={"eg 90210"}
              value={zipCode || ""}
              onChange={(event) => setPropertyId(Number(event.target.value))}
            />
            <FormHelperText>{location}</FormHelperText>
          </FormControl>
          <FormControl mb={4} isRequired>
            <FormLabel>Total {USDTokenSymbol} Value of Tokens</FormLabel>
            <InputGroup>
              <InputLeftElement
                pointerEvents="none"
                color="gray.300"
                fontSize="1.2em"
                children="$"
              />
              <Input
                placeholder={"eg 10,000"}
                value={totalAmount || ""}
                type={"number"}
                onChange={(event) => setTotalAmount(Number(event.target.value))}
              />
            </InputGroup>
            {totalAmount ? (
              <FormHelperText>
                (You will pay collateral of:{" "}
                {getFormattedCurrency(collateralDisplay)} {USDTokenSymbol})
              </FormHelperText>
            ) : (
              undefined
            )}
          </FormControl>
          <FormControl mb={4} isRequired isInvalid={!dateIsInFuture}>
            <FormLabel>Token Expiry:</FormLabel>
            <DatePicker date={tokenExpiry} setDate={setEndDate} />
            <FormErrorMessage>Date must be in the future</FormErrorMessage>
            <FormHelperText>
              (The date that your tokens will reconcile)
            </FormHelperText>
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={createTokens}
            disabled={!location || !totalAmount || !dateIsInFuture}
          >
            Create
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateTokenModal;
