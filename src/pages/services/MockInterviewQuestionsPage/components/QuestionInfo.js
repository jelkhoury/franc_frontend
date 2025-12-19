import React from "react";
import { Box, Heading, Text } from "@chakra-ui/react";

/**
 * Component displaying current question information
 */
const QuestionInfo = ({
  currentQuestionIdx,
  currentCommonQuestionIdx,
  currentSpecialQuestion,
  currentQuestionType,
  selectedTitle,
  commonQuestions,
  interviewQuestions,
}) => {
  if (
    currentQuestionIdx === null &&
    currentCommonQuestionIdx === null &&
    !currentSpecialQuestion
  ) {
    return null;
  }

  return (
    <Box
      mb={6}
      bg="white"
      borderRadius="lg"
      borderWidth="1px"
      boxShadow="md"
      p={4}
      textAlign="center"
    >
      {currentSpecialQuestion ? (
        <>
          <Heading size="sm" mb={3} color="gray.700">
            {currentSpecialQuestion.title}
          </Heading>
          <Text fontSize="lg" fontWeight="semibold" color="blue.600">
            {selectedTitle}
          </Text>
        </>
      ) : currentQuestionType === "common" && currentCommonQuestionIdx !== null ? (
        <>
          <Heading size="sm" mb={3} color="gray.700">
            Common Question {currentCommonQuestionIdx + 1} of{" "}
            {commonQuestions.length}
          </Heading>
          <Text fontSize="lg" fontWeight="semibold" color="blue.600">
            {selectedTitle}
          </Text>
        </>
      ) : (
        <>
          <Heading size="sm" mb={3} color="gray.700">
            Question {currentQuestionIdx + 1} of {interviewQuestions.length}
          </Heading>
          <Text fontSize="lg" fontWeight="semibold" color="blue.600">
            {selectedTitle}
          </Text>
        </>
      )}
    </Box>
  );
};

export default QuestionInfo;

