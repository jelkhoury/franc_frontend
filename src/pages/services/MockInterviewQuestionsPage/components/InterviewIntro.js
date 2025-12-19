import React from "react";
import { Box, Heading, Text, VStack, Button } from "@chakra-ui/react";

/**
 * Introduction view shown before interview starts
 */
const InterviewIntro = ({
  canDoMock,
  checkingMockStatus,
  interviewQuestionsLength,
  onStartInterview,
}) => {
  return (
    <>
      <Box
        mb={6}
        maxW="2xl"
        mx="auto"
        p={6}
        bg="white"
        borderRadius="lg"
        borderWidth="1px"
        boxShadow="md"
      >
        <Heading size="md" mb={2} textAlign="center" color="gray.700">
          How the Interview Works
        </Heading>
        <VStack
          spacing={3}
          align="start"
          fontSize="sm"
          color="gray.600"
          as="ul"
          pl={4}
        >
          <Text as="li">
            Click "Show" to hear the question (avatar "talks").
          </Text>
          <Text as="li">When the audio ends, a 5-second countdown starts.</Text>
          <Text as="li">
            Retry or Go to the next question, then submit your answer
          </Text>
        </VStack>
      </Box>

      {!canDoMock && !checkingMockStatus && (
        <Box
          mt={4}
          p={4}
          bg="orange.50"
          border="1px"
          borderColor="orange.200"
          borderRadius="md"
          textAlign="center"
        >
          <Text color="orange.700" fontWeight="medium">
            You cannot start another interview right now. Please try again
            later.
          </Text>
        </Box>
      )}

      <VStack spacing={4}>
        <Button
          colorScheme="blue"
          size="lg"
          onClick={onStartInterview}
          isDisabled={
            interviewQuestionsLength === 0 || !canDoMock || checkingMockStatus
          }
          isLoading={checkingMockStatus}
        >
          {checkingMockStatus
            ? "Checking..."
            : !canDoMock
            ? "Cannot Start Interview"
            : "Start Interview"}
        </Button>
      </VStack>
    </>
  );
};

export default InterviewIntro;
