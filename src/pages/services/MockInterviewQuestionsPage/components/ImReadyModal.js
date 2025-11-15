import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  VStack,
  Text,
} from "@chakra-ui/react";

/**
 * Modal shown after opening message - second "I'm Ready" confirmation
 */
const ImReadyModal = ({ isOpen, onReady }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      isCentered
      closeOnOverlayClick={false}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color="blue.700">Ready to Start?</ModalHeader>
        <ModalBody>
          <VStack spacing={4}>
            <Text color="blue.600">
              Make sure you're in a quiet environment with good lighting.
            </Text>
            <Button colorScheme="green" size="lg" onClick={onReady}>
              I'm Ready - Start First Question
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ImReadyModal;
