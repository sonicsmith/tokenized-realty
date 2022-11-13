import { Box, Text } from "@chakra-ui/react";
import PropertyToken, { IPropertyToken } from "../PropertyToken/PropertyToken";

const PropertyTokenList = (props: { propertyTokens: IPropertyToken[] }) => {
  // Only show tokens that have tokens available to buy
  const tokens = props.propertyTokens.filter(({ amountLeft }) => {
    return Number(amountLeft) > 0;
  });

  return (
    <Box>
      {tokens.length ? (
        tokens.map((details, index) => (
          <Box mb={6} key={`property${index}`}>
            <PropertyToken details={details} />
          </Box>
        ))
      ) : (
        <Box>
          <Text>No Property Tokens to show</Text>
          <Text>(Check Portfolio for owned tokens)</Text>
        </Box>
      )}
    </Box>
  );
};

export default PropertyTokenList;
