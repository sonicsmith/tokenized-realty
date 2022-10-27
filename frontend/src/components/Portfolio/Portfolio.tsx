import { Box, Text, Button, useDisclosure } from "@chakra-ui/react";
import CreateTokenModal from "../CreateTokenModal/CreateTokenModal";

const Portfolio = (props: any) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <Box>
      <Text>No Portfolio to show</Text>
      <Button mt={6} onClick={onOpen}>
        Create Property Tokens
      </Button>
      <CreateTokenModal isOpen={isOpen} onClose={onClose} />
    </Box>
  );
};
export default Portfolio;
