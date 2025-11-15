import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  Text,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";

/**
 * Modal shown before starting interview - warning about requirements
 */
const StartInterviewWarningModal = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color="red.500">
          ⚠️ Warning: Starting Mock Interview
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Alert status="warning" mb={4}>
            <AlertIcon />
            <Text fontWeight="bold">Important: Interview will start now!</Text>
          </Alert>

          <VStack align="stretch" spacing={4}>
            <Text>Before proceeding, please ensure:</Text>

            <VStack align="stretch" spacing={2}>
              <Text>
                • <strong>Check your internet connection</strong> - ensure it's
                stable
              </Text>
              <Text>
                • <strong>Check your camera and microphone</strong> - they will
                be used for recording
              </Text>
              <Text>
                • <strong>Do not navigate away</strong> - you will lose your
                progress
              </Text>
              <Text>
                • <strong>Do not close the browser</strong> - your answers will
                not be recorded
              </Text>
            </VStack>

            <Alert status="error" mt={4}>
              <AlertIcon />
              <Text fontSize="sm">
                <strong>Warning:</strong> If you leave this page or lose
                connection during the interview, your answers will be lost and
                you'll need to start over.
              </Text>
            </Alert>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="red" onClick={onConfirm}>
            I Understand - Start Interview
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default StartInterviewWarningModal;

