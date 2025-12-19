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
 * Modal shown when user tries to leave the interview page
 */
const ExitWarningModal = ({
  isOpen,
  onClose,
  onConfirm,
  answeredQuestionsCount,
  totalQuestionsCount,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color="red.500">⚠️ Warning: Leaving Interview</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Alert status="error" mb={4}>
            <AlertIcon />
            <Text fontWeight="bold">You will miss the interview!</Text>
          </Alert>

          <VStack align="stretch" spacing={4}>
            <Text>
              You are about to leave the mock interview. If you continue:
            </Text>

            <VStack align="stretch" spacing={2}>
              <Text>
                •{" "}
                <strong>
                  You will lose your chance to complete the interview
                </strong>
              </Text>
              <Text>
                • <strong>All your recorded answers will be lost</strong>
              </Text>
              <Text>
                • <strong>You'll need to start over from the beginning</strong>
              </Text>
            </VStack>

            <Alert status="warning" mt={4}>
              <AlertIcon />
              <Text fontSize="sm">
                <strong>Progress:</strong> You have answered{" "}
                {answeredQuestionsCount} out of {totalQuestionsCount} questions.
              </Text>
            </Alert>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Stay and Continue
          </Button>
          <Button colorScheme="red" onClick={onConfirm}>
            Leave Anyway
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ExitWarningModal;
