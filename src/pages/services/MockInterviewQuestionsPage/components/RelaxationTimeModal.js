import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  VStack,
  Text,
} from "@chakra-ui/react";

/**
 * Modal shown between questions - relaxation countdown
 */
const RelaxationTimeModal = ({ isOpen, countdown }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      isCentered
      closeOnOverlayClick={false}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalBody>
          <VStack spacing={4}>
            <Text color="green.600">
              Take a moment to relax before the next question.
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="green.500">
              {countdown}
            </Text>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default RelaxationTimeModal;
