import React from "react";
import { Box, Text } from "@chakra-ui/react";

/**
 * Header showing interview duration
 */
const InterviewHeader = ({ interviewDuration }) => {
  return (
    <Box
      textAlign="center"
      py={4}
      bg="blue.50"
      borderBottom="1px"
      borderColor="blue.200"
    >
      <Text fontSize="lg" fontWeight="bold" color="blue.600">
        Interview Duration: {Math.floor(interviewDuration / 60)}:
        {(interviewDuration % 60).toString().padStart(2, "0")}
      </Text>
    </Box>
  );
};

export default InterviewHeader;

