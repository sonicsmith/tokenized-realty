import {
  Box,
  Center,
  Heading,
  Text,
  Stack,
  Button,
  useDisclosure,
} from "@chakra-ui/react";
import { USDTokenSymbol } from "../../constants";
import MapView from "../MapView/MapView";
import PurchaseTokenModal from "../PurchaseTokenModal/PurchaseTokenModal";

export interface IPropertyToken {
  propertyId: string;
  detail1: string;
  detail2: string;
  totalAmount: string;
  tokenExpiry: string;
}

const PropertyToken = (props: { details: IPropertyToken }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const {
    propertyId,
    detail1,
    detail2,
    totalAmount,
    tokenExpiry,
  } = props.details;

  return (
    <Center>
      <Box
        p={6}
        bg={"white"}
        boxShadow={"2xl"}
        rounded={"lg"}
        cursor={"pointer"}
        _hover={{ bg: "red.200" }} // TODO Make this more styled
      >
        <Box rounded={"lg"} width={400} height={150} mb={6}>
          <MapView width={400} height={150} position={[-45.8611, 170.5327]} />
        </Box>
        <Stack align={"center"} mb={6}>
          <Text color={"gray.500"} fontSize={"sm"} textTransform={"uppercase"}>
            {detail1}
          </Text>
          <Heading fontSize={"2xl"} fontFamily={"body"} fontWeight={500}>
            {detail2}
          </Heading>
          <Stack direction={"row"} align={"center"}>
            <Text fontWeight={800} fontSize={"xl"}>
              AVAILABLE: ${totalAmount} {USDTokenSymbol}
            </Text>
          </Stack>
        </Stack>
        <Button onClick={onOpen}>Purchase</Button>
        <PurchaseTokenModal
          isOpen={isOpen}
          onClose={onClose}
          propertyId={propertyId}
          totalAmount={totalAmount}
          tokenExpiry={tokenExpiry}
        />
      </Box>
    </Center>
  );
};

export default PropertyToken;
