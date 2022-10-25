import { Box, Center, Heading, Text, Stack } from "@chakra-ui/react";
import MapView from "../MapView/MapView";

export interface IPropertyToken {
  detail1: string;
  detail2: string;
  totalAmount: string;
}

export default function PropertyToken(props: { details: IPropertyToken }) {
  const { detail1, detail2, totalAmount } = props.details;

  return (
    <Center>
      <Box p={6} bg={"white"} boxShadow={"2xl"} rounded={"lg"}>
        <Box rounded={"lg"} width={400} height={150}>
          <MapView width={400} height={150} />
        </Box>
        <Stack align={"center"}>
          <Text color={"gray.500"} fontSize={"sm"} textTransform={"uppercase"}>
            {detail1}
          </Text>
          <Heading fontSize={"2xl"} fontFamily={"body"} fontWeight={500}>
            {detail2}
          </Heading>
          <Stack direction={"row"} align={"center"}>
            <Text fontWeight={800} fontSize={"xl"}>
              AVAILABLE: ${totalAmount} USD
            </Text>
          </Stack>
        </Stack>
      </Box>
    </Center>
  );
}
