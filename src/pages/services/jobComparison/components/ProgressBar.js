import React from "react";
import { Box, Progress, HStack, Text, Icon } from "@chakra-ui/react";
import { FaCheckCircle, FaCircle } from "react-icons/fa";

const ProgressBar = ({ current, total }) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <Box>
      <Progress value={percentage} colorScheme="blue" size="sm" borderRadius="full" />
      <HStack justify="space-between" mt={2}>
        <HStack spacing={2}>
          <Icon as={FaCircle} color="blue.500" boxSize={3} />
          <Text fontSize="sm" color="gray.600">
            Question {current} of {total}
          </Text>
        </HStack>
        <HStack spacing={2}>
          <Icon as={FaCheckCircle} color="blue.500" boxSize={3} />
          <Text fontSize="sm" color="gray.600" fontWeight="medium">
            {percentage}%
          </Text>
        </HStack>
      </HStack>
    </Box>
  );
};

export default ProgressBar;
