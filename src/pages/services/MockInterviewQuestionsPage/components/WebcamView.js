import React from "react";
import { Box, Heading, VStack, HStack, Button, Text } from "@chakra-ui/react";
import Webcam from "react-webcam";

/**
 * Webcam view component with recording controls
 */
const WebcamView = ({
  webcamRef,
  showRecorder,
  recording,
  answerMinutes,
  answerSeconds,
  answerRetryUsed,
  currentQuestionType,
  currentQuestionIdx,
  currentCommonQuestionIdx,
  currentSpecialQuestion,
  handleRetryAnswer,
  handleUserStop,
  getCurrentAnswerKey,
}) => {
  return (
    <Box
      flex="1"
      bg="white"
      borderRadius="lg"
      borderWidth="1px"
      boxShadow="md"
      p={4}
    >
      <Heading size="sm" mb={3} color="gray.700">
        Your Camera
      </Heading>
      <VStack spacing={4} align="stretch">
        <Box
          overflow="hidden"
          borderRadius="md"
          borderWidth="1px"
          borderColor="gray.200"
        >
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ width: 480, height: 360 }}
            style={{
              borderRadius: "10px",
              display: "block",
              width: "100%",
            }}
            mirrored
          />
        </Box>
        {showRecorder && recording && (
          <VStack spacing={2} align="stretch">
            <Box
              bg="red.50"
              p={2}
              borderRadius="md"
              borderWidth="1px"
              borderColor="red.200"
            >
              <Text
                fontWeight="bold"
                color="red.500"
                textAlign="center"
                mb={1}
                fontSize="sm"
              >
                Recording...
              </Text>
              <Box>
                <Text
                  fontSize="xs"
                  color="gray.600"
                  mb={0.5}
                  textAlign="center"
                >
                  Time Remaining
                </Text>
                <Text
                  fontSize="xl"
                  fontWeight="bold"
                  color="red.600"
                  textAlign="center"
                >
                  {String(answerMinutes).padStart(2, "0")}:
                  {String(answerSeconds).padStart(2, "0")}
                </Text>
              </Box>
            </Box>
            <HStack spacing={3}>
              <Button
                colorScheme="green"
                size="md"
                onClick={handleRetryAnswer}
                isDisabled={(() => {
                  const answerKey = getCurrentAnswerKey(
                    currentQuestionType,
                    currentQuestionIdx,
                    currentCommonQuestionIdx,
                    currentSpecialQuestion
                  );
                  return (
                    !answerKey || answerRetryUsed.has(answerKey) || !recording
                  );
                })()}
                flex="1"
              >
                {(() => {
                  const totalSeconds = answerMinutes * 60 + answerSeconds;
                  if (recording && totalSeconds <= 5 && totalSeconds > 0) {
                    return `Retry Answer (${totalSeconds})`;
                  }
                  return "Retry Answer";
                })()}
              </Button>
              <Button
                colorScheme="red"
                size="md"
                onClick={handleUserStop}
                flex="1"
              >
                Stop Recording
              </Button>
            </HStack>
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

export default WebcamView;
