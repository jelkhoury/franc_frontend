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
 * Modal shown before opening message - first "I'm Ready" confirmation
 */
const StartInterviewReadyModal = ({ isOpen, onReady }) => {
  return (
    <Modal isOpen={isOpen} onClose={() => {}} isCentered closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color="blue.700">Ready to Start Interview?</ModalHeader>
        <ModalBody>
          <VStack spacing={4}>
            <Text color="blue.600">
              Make sure you're in a quiet environment with good lighting. The
              interview will begin shortly.
            </Text>
            <Button colorScheme="green" size="lg" onClick={onReady}>
              I'm Ready - Start Interview
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default StartInterviewReadyModal;

