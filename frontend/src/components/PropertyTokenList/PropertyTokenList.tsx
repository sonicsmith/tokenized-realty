import { Box, Text } from "@chakra-ui/react";
import PropertyToken, { IPropertyToken } from "../PropertyToken/PropertyToken";

export default function PropertyTokenList(props: {
  propertyTokens: IPropertyToken[];
}) {
  return (
    <Box>
      {props.propertyTokens.length ? (
        props.propertyTokens.map((details, index) => (
          <Box mb={6} key={`property${index}`}>
            <PropertyToken details={details} />
          </Box>
        ))
      ) : (
        <Box>
          <Text>No Property Tokens to show</Text>
        </Box>
      )}
    </Box>
  );
}
