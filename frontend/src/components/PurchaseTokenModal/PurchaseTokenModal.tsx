import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  InputGroup,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberInput,
  NumberInputField,
  Text,
} from "@chakra-ui/react";
import { Contract } from "@ethersproject/contracts";
import { useWeb3React } from "@web3-react/core";
import { format } from "date-fns";
import { ethers } from "ethers";
import { useCallback, useMemo, useState } from "react";
import {
  contractAddress,
  USD_DECIMALS,
  USD_TOKEN_SYMBOL,
} from "../../constants";
import { useContract } from "../../hooks/useContracts";
import useAppStore, { ActionTypes } from "../../providers/AppStore";
import { getFormattedCurrency } from "../../utils/getFormattedValues";

const PurchaseTokenModal = (props: {
  isOpen: boolean;
  onClose: () => void;
  zipCode: string;
  amountLeft: string;
  tokenExpiry: number;
}) => {
  const [amount, setAmount] = useState<number>(Number(props.amountLeft));

  const { mainContract, usdContract } = useContract() as {
    mainContract: Contract;
    usdContract: Contract;
  };

  const { account, chainId } = useWeb3React();

  const { dispatch } = useAppStore();

  const { isOpen, onClose, zipCode, amountLeft, tokenExpiry } = props;

  const isAmountValid = useMemo(() => {
    return Number(amountLeft) >= Number(amount);
  }, [amountLeft, amount]);

  const purchase = useCallback(() => {
    if (isAmountValid) {
      const bigAmount = ethers.utils.parseUnits(
        amount.toString(),
        USD_DECIMALS
      );

      const grantAllowance = () => {
        return usdContract
          .allowance(account, contractAddress[chainId!])
          .then((allowance: ethers.BigNumber) => {
            // If not enough USD allowance
            if (allowance.lt(bigAmount)) {
              return usdContract.approve(
                contractAddress[chainId!],
                bigAmount.sub(allowance)
              );
            } else {
              return null;
            }
          });
      };

      const purchasePropertyTokens = () => {
        return mainContract.purchasePropertyTokens(
          zipCode,
          bigAmount.toString()
        );
      };

      const payload = [
        {
          title: "Grant USDC Allowance",
          function: grantAllowance,
        },
        {
          title: "Purchase Property Tokens",
          function: purchasePropertyTokens,
        },
      ];
      console.log("bigAmount.toString()", bigAmount.toString());
      dispatch!({ type: ActionTypes.AddTransactions, payload });
      onClose();
    }
  }, [
    mainContract,
    account,
    amount,
    chainId,
    dispatch,
    isAmountValid,
    onClose,
    usdContract,
    zipCode,
  ]);

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
                {getFormattedCurrency(amountLeft)} {USD_TOKEN_SYMBOL}
              </Text>
            </Flex>
            <Flex direction={"row"}>
              <Text as="b" mr={1}>
                Token expiry:
              </Text>
              <Text>{format(tokenExpiry, "dd MMM, yyyy")}</Text>
            </Flex>
          </Flex>
          <FormControl mb={4} isRequired isInvalid={!isAmountValid}>
            <FormLabel>
              <b>Amount to purchase ({USD_TOKEN_SYMBOL})</b>
            </FormLabel>
            <InputGroup>
              <NumberInput
                pl={2}
                onChange={(value) =>
                  setAmount(Number(value.replace(/^\$/, "")))
                }
                value={"$" + amount}
                min={0}
                max={Number(amountLeft)}
              >
                <NumberInputField />
              </NumberInput>
            </InputGroup>
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
