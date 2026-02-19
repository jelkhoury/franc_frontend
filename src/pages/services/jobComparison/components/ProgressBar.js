import React from "react";
import { Box, Progress, HStack, Text, Icon } from "@chakra-ui/react";
import { FaCheckCircle, FaCircle } from "react-icons/fa";

const ProgressBar = ({ current, total, answeredCount }) => {
  // Bar and left % show progress by answered count when provided; otherwise by current step
  const displayCount = answeredCount !== undefined && answeredCount !== null ? answeredCount : current;
  const percentage = total > 0 ? Math.round((displayCount / total) * 100) : 0;

  return (
    <Box>
      <Progress value={percentage} colorScheme="blue" size="sm" borderRadius="full" />
      <HStack justify="space-between" mt={2}>
        <HStack spacing={2}>
          <Icon as={FaCheckCircle} color="blue.500" boxSize={3} />
          <Text fontSize="sm" color="gray.600" fontWeight="medium">
            {percentage}%
          </Text>
        </HStack>
        <HStack spacing={2}>
          <Icon as={FaCircle} color="blue.500" boxSize={3} />
          <Text fontSize="sm" color="gray.600">
            Step {current} of {total}
          </Text>
        </HStack>
      </HStack>
    </Box>
  );
};

export default ProgressBar;
