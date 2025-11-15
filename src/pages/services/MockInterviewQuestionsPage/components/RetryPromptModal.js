import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  VStack,
  HStack,
  Text,
} from "@chakra-ui/react";

/**
 * Modal shown after question audio ends, allowing user to replay prompt or start recording
 */
const RetryPromptModal = ({
  isOpen,
  promptRetryUsed,
  retryCountdown,
  onRetryPrompt,
  onStartRecording,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      isCentered
      closeOnOverlayClick={false}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color="yellow.700">Ready to answer?</ModalHeader>
        <ModalBody>
          <VStack spacing={4}>
            <Text color="yellow.600">
              You can replay the prompt once before recording starts.
            </Text>
            <HStack spacing={4}>
              <Button
                colorScheme="blue"
                onClick={onRetryPrompt}
                isDisabled={promptRetryUsed}
              >
                {promptRetryUsed ? "Retry Used" : "Replay Prompt"}
              </Button>
              <Button colorScheme="green" onClick={onStartRecording}>
                Start Recording ({retryCountdown})
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default RetryPromptModal;
