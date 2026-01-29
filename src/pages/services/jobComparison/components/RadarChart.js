import React from "react";
import { Box, VStack, HStack, Text, useColorModeValue } from "@chakra-ui/react";

const RadarChart = ({ criteria, answers, jobAName, jobBName, category = "all" }) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const jobAColor = "#3182CE"; // blue.500
  const jobBColor = "#E53E3E"; // red.500

  // Filter criteria by category
  const filteredCriteria =
    category === "all"
      ? criteria
      : criteria.filter((c) => c.category === category);

  // Calculate weighted scores for visualization
  const data = filteredCriteria
    .map((criterion) => {
      const answer = answers[criterion.id];
      if (!answer || answer.notApplicable) return null;
      
      const { weight, scoreA, scoreB } = answer;
      // Skip if not fully answered
      if (weight <= 0 || scoreA <= 0 || scoreB <= 0) return null;
      
      // weight is 1-5 (O.I.W), scoreA/scoreB are 1-5 (D.F.S)
      // Normalize to 0-10 scale: (weight * score) / 2.5
      // Max: (5 * 5) / 2.5 = 10
      return {
        name: criterion.name,
        valueA: (weight * scoreA) / 2.5, // Normalized weighted score (0-10 scale)
        valueB: (weight * scoreB) / 2.5,
      };
    })
    .filter((item) => item !== null);

  if (data.length === 0) {
    return (
      <Box bg={cardBg} rounded="xl" shadow="md" p={6} textAlign="center">
        <Text color="gray.500">No data available</Text>
      </Box>
    );
  }

  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.valueA, d.valueB)),
    10
  );

  return (
    <Box bg={cardBg} rounded="xl" shadow="md" p={6}>
      <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.800">
        {category === "all"
          ? "Overall Comparison"
          : category === "HEAD"
          ? "HEAD (Rational) Comparison"
          : "HEART (Emotional) Comparison"}
      </Text>

      <VStack spacing={4} align="stretch">
        {data.map((item, index) => {
          const percentageA = (item.valueA / maxValue) * 100;
          const percentageB = (item.valueB / maxValue) * 100;

          return (
            <Box key={index}>
              <HStack justify="space-between" mb={2}>
                <Text fontSize="sm" fontWeight="medium" color="gray.700" flex="1">
                  {item.name}
                </Text>
                <HStack spacing={4}>
                  <Text fontSize="xs" color={jobAColor} fontWeight="bold">
                    {item.valueA.toFixed(1)}
                  </Text>
                  <Text fontSize="xs" color={jobBColor} fontWeight="bold">
                    {item.valueB.toFixed(1)}
                  </Text>
                </HStack>
              </HStack>

              {/* Dual Progress Bars */}
              <HStack spacing={2} align="stretch">
                <Box flex="1" position="relative">
                  <Box
                    h="20px"
                    bg={jobAColor}
                    borderRadius="md"
                    width={`${percentageA}%`}
                    transition="width 0.3s"
                    display="flex"
                    alignItems="center"
                    justifyContent="flex-end"
                    pr={2}
                  >
                    {percentageA > 15 && (
                      <Text fontSize="xs" color="white" fontWeight="bold">
                        {item.valueA.toFixed(1)}
                      </Text>
                    )}
                  </Box>
                </Box>
                <Box flex="1" position="relative">
                  <Box
                    h="20px"
                    bg={jobBColor}
                    borderRadius="md"
                    width={`${percentageB}%`}
                    transition="width 0.3s"
                    display="flex"
                    alignItems="center"
                    justifyContent="flex-start"
                    pl={2}
                  >
                    {percentageB > 15 && (
                      <Text fontSize="xs" color="white" fontWeight="bold">
                        {item.valueB.toFixed(1)}
                      </Text>
                    )}
                  </Box>
                </Box>
              </HStack>
            </Box>
          );
        })}
      </VStack>

      {/* Legend */}
      <HStack justify="center" mt={6} spacing={6}>
        <HStack>
          <Box w="16px" h="16px" bg={jobAColor} borderRadius="sm" />
          <Text fontSize="sm" color="gray.600">
            {jobAName}
          </Text>
        </HStack>
        <HStack>
          <Box w="16px" h="16px" bg={jobBColor} borderRadius="sm" />
          <Text fontSize="sm" color="gray.600">
            {jobBName}
          </Text>
        </HStack>
      </HStack>
    </Box>
  );
};

export default RadarChart;
