import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";

const TransactionModal = (props: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  transactions: Function[];
}) => {
  const { isOpen, onClose, title } = props;
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody></ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default TransactionModal;
