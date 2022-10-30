import {
  Box,
  Center,
  Heading,
  Text,
  Stack,
  Button,
  useDisclosure,
  Spinner,
} from "@chakra-ui/react";
import { LatLngExpression } from "leaflet";
import { useEffect, useState } from "react";
import { USDTokenSymbol } from "../../constants";
import MapView from "../MapView/MapView";
import PurchaseTokenModal from "../PurchaseTokenModal/PurchaseTokenModal";

const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
export interface IPropertyToken {
  zipCode: string;
  detail1: string;
  detail2: string;
  totalAmount: string;
  tokenExpiry: string;
}

const PropertyToken = (props: { details: IPropertyToken }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { zipCode, totalAmount, tokenExpiry } = props.details;

  const [details, setDetails] = useState<string[] | undefined>();
  const [position, setPosition] = useState<LatLngExpression | undefined>();
  const [label, setLabel] = useState<string | undefined>();

  useEffect(() => {
    const URL = "https://maps.googleapis.com/maps/api/geocode/json?";
    fetch(`${URL}key=${API_KEY}&address=${zipCode},USA`)
      .then((res) => res.json())
      .then((res) => {
        setDetails(res?.results?.[0]?.postcode_localities);
        const coords = res?.results?.[0]?.geometry?.location;
        if (coords) {
          setPosition([coords.lat, coords.lng]);
        }
        setLabel(res?.results?.[0]?.formatted_address);
      });
  }, [zipCode]);

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
              AVAILABLE: ${totalAmount} {USDTokenSymbol}
            </Text>
          </Stack>
        </Stack>
        <Button onClick={onOpen}>Purchase</Button>
        <PurchaseTokenModal
          isOpen={isOpen}
          onClose={onClose}
          zipCode={zipCode}
          totalAmount={totalAmount}
          tokenExpiry={tokenExpiry}
        />
      </Box>
    </Center>
  );
};

export default PropertyToken;
