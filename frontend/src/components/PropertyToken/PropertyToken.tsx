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
import { useWeb3React } from "@web3-react/core";
import { format } from "date-fns";
import { LatLngExpression } from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { USD_TOKEN_SYMBOL } from "../../constants";
import getZipCodeDetails from "../../utils/getZipCodeDetails";
import MapView from "../MapView/MapView";
import PurchaseTokenModal from "../PurchaseTokenModal/PurchaseTokenModal";

export interface IPropertyToken {
  zipCode: string;
  amountLeft: string;
  tokenExpiry: number;
  holders: string[];
}

const PropertyToken = (props: {
  details: IPropertyToken;
  isLiteMode?: boolean;
}) => {
  const { zipCode, amountLeft, tokenExpiry } = props.details;

  const [details, setDetails] = useState<string[] | undefined>();
  const [position, setPosition] = useState<LatLngExpression | undefined>();
  const [label, setLabel] = useState<string | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { account } = useWeb3React();

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

  const isHolder = useMemo(() => {
    return account && props.details.holders.includes(account);
  }, []);

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
        {!props.isLiteMode && (
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
        )}
        <Stack align={"center"} mb={6}>
          <Text color={"gray.500"} fontSize={"sm"} textTransform={"uppercase"}>
            {details?.[0] || "-"}
          </Text>
          <Heading fontSize={"2xl"} fontFamily={"body"} fontWeight={500}>
            {details?.[1] || "-"}
          </Heading>
          <Stack direction={"row"} align={"center"}>
            <Text fontWeight={800} fontSize={"xl"}>
              ${amountLeft} {USD_TOKEN_SYMBOL} AVAILABLE IN TOTAL
            </Text>
          </Stack>
          <Text color={"gray.500"} fontSize={"sm"} textTransform={"uppercase"}>
            Reconciles after {format(tokenExpiry, "dd MMMM, yyyy")}
          </Text>
        </Stack>
        <Flex>
          {isHolder && (
            <Button onClick={console.log} disabled={hasExpired}>
              Claim
            </Button>
          )}
          <Spacer />
          {!isHolder && (
            <Button
              onClick={() => {
                setIsModalOpen(true);
              }}
              disabled={!hasExpired}
            >
              Purchase
            </Button>
          )}
        </Flex>
        <PurchaseTokenModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
          }}
          zipCode={zipCode}
          amountLeft={amountLeft}
          tokenExpiry={tokenExpiry}
        />
      </Box>
    </Center>
  );
};

export default PropertyToken;
