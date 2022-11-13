import { Box, Text, Button, useDisclosure, VStack } from "@chakra-ui/react";
import { useWeb3React } from "@web3-react/core";
import { USDC_LINK } from "../../constants";
import CreateTokenModal from "../CreateTokenModal/CreateTokenModal";
import PropertyToken, { IPropertyToken } from "../PropertyToken/PropertyToken";

const Portfolio = (props: { propertyTokens: IPropertyToken[] }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { account } = useWeb3React();

  const tokens = props.propertyTokens.filter(({ holders }) => {
    return account && holders.includes(account);
  });
  return (
    <Box>
      {tokens.length ? (
        tokens.map((details, index) => (
          <Box mb={6} key={`property${index}`}>
            <PropertyToken details={details} isLiteMode />
          </Box>
        ))
      ) : (
        <Box>
          <Text>No Portfolio to show</Text>
        </Box>
      )}
      <VStack>
        <Button mt={6} onClick={onOpen}>
          Create Property Tokens
        </Button>
        <Button
          mt={6}
          onClick={() => {
            window.open(USDC_LINK, "_blank", "noopener,noreferrer");
          }}
        >
          Get USDC Tokens
        </Button>
      </VStack>
      <CreateTokenModal isOpen={isOpen} onClose={onClose} />
    </Box>
  );
};
export default Portfolio;
