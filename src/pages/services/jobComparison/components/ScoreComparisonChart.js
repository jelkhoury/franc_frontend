import React from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Progress,
  Badge,
  useColorModeValue,
} from "@chakra-ui/react";

const ScoreComparisonChart = ({
  scoreA,
  scoreB,
  labelA,
  labelB,
  title,
}) => {
  const cardBg = useColorModeValue("white", "gray.800");
  // Scores are normalized to 0-100 scale (weighted average calculation)
  const maxScore = 100;
  const percentageA = scoreA; // Already normalized to 0-100
  const percentageB = scoreB; // Already normalized to 0-100
  const winner = scoreA > scoreB ? "A" : scoreB > scoreA ? "B" : "tie";

  return (
    <Box bg={cardBg} rounded="xl" shadow="md" p={6}>
      <Text fontSize="xl" fontWeight="bold" mb={6} color="gray.800">
        {title}
      </Text>

      <VStack spacing={6} align="stretch">
        {/* Job A */}
        <Box>
          <HStack justify="space-between" mb={2}>
            <HStack>
              <Text fontWeight="semibold" fontSize="md">
                {labelA}
              </Text>
              {winner === "A" && (
                <Badge colorScheme="green">Winner</Badge>
              )}
            </HStack>
            <Text fontSize="lg" fontWeight="bold" color="blue.500">
              {scoreA.toFixed(1)} / {maxScore}
            </Text>
          </HStack>
          <Progress
            value={percentageA}
            colorScheme="blue"
            size="lg"
            borderRadius="full"
            bg={useColorModeValue("gray.100", "gray.700")}
          />
        </Box>

        {/* Job B */}
        <Box>
          <HStack justify="space-between" mb={2}>
            <HStack>
              <Text fontWeight="semibold" fontSize="md">
                {labelB}
              </Text>
              {winner === "B" && (
                <Badge colorScheme="green">Winner</Badge>
              )}
            </HStack>
            <Text fontSize="lg" fontWeight="bold" color="red.500">
              {scoreB.toFixed(1)} / {maxScore}
            </Text>
          </HStack>
          <Progress
            value={percentageB}
            colorScheme="red"
            size="lg"
            borderRadius="full"
            bg={useColorModeValue("gray.100", "gray.700")}
          />
        </Box>

        {/* Difference */}
        {winner !== "tie" && (
          <Box textAlign="center" pt={2}>
            <Text fontSize="sm" color="gray.600">
              Difference:{" "}
              <Text as="span" fontWeight="bold" color="gray.800">
                {Math.abs(scoreA - scoreB).toFixed(1)} points
              </Text>
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default ScoreComparisonChart;
