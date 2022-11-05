import {
  Box,
  Center,
  Heading,
  Text,
  Stack,
  Button,
  useDisclosure,
  Spinner,
  Flex,
  Spacer,
} from "@chakra-ui/react";
import { format } from "date-fns";
import { LatLngExpression } from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { USDTokenSymbol } from "../../constants";
import getZipCodeDetails from "../../utils/getZipCodeDetails";
import MapView from "../MapView/MapView";
import PurchaseTokenModal from "../PurchaseTokenModal/PurchaseTokenModal";

export interface IPropertyToken {
  zipCode: string;
  totalAmount: string;
  tokenExpiry: number;
}

const PropertyToken = (props: { details: IPropertyToken }) => {
  const { zipCode, totalAmount, tokenExpiry } = props.details;

  const [details, setDetails] = useState<string[] | undefined>();
  const [position, setPosition] = useState<LatLngExpression | undefined>();
  const [label, setLabel] = useState<string | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const zipCodeDetails = getZipCodeDetails(zipCode);
    if (zipCodeDetails) {
      const { location, county, state, city } = zipCodeDetails;
      setDetails([city, county, state]);
      setPosition(location as LatLngExpression);
      setLabel(`${city}, ${county}, ${state}`);
    }
  }, [zipCode]);

  const hasExpired = useMemo(() => {
    return Number(tokenExpiry) * 1000 > Date.now();
  }, [tokenExpiry]);

  return (
    <Center>
      <Box
        p={6}
        bg={"white"}
        boxShadow={"2xl"}
        rounded={"lg"}
        cursor={"pointer"}
        _hover={{ bg: "red.200" }}
      >
        <Box rounded={"lg"} width={400} height={150} mb={6}>
          {position ? (
            <MapView
              width={400}
              height={150}
              position={position}
              label={label}
            />
          ) : (
            <Box>
              <Spinner size={"lg"} mt={20} />
            </Box>
          )}
        </Box>
        <Stack align={"center"} mb={6}>
          <Text color={"gray.500"} fontSize={"sm"} textTransform={"uppercase"}>
            {details?.[0] || "-"}
          </Text>
          <Heading fontSize={"2xl"} fontFamily={"body"} fontWeight={500}>
            {details?.[1] || "-"}
          </Heading>
          <Stack direction={"row"} align={"center"}>
            <Text fontWeight={800} fontSize={"xl"}>
              ${totalAmount} {USDTokenSymbol} AVAILABLE IN TOTAL
            </Text>
          </Stack>
          <Text color={"gray.500"} fontSize={"sm"} textTransform={"uppercase"}>
            Reconciles after {format(tokenExpiry, "dd MMMM, yyyy")}
          </Text>
        </Stack>
        <Flex>
          <Button onClick={console.log} disabled={hasExpired}>
            Claim
          </Button>
          <Spacer />
          <Button
            onClick={() => {
              setIsModalOpen(true);
            }}
            disabled={!hasExpired}
          >
            Purchase
          </Button>
        </Flex>
        <PurchaseTokenModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
          }}
          zipCode={zipCode}
          totalAmount={totalAmount}
          tokenExpiry={tokenExpiry}
        />
      </Box>
    </Center>
  );
};

export default PropertyToken;
