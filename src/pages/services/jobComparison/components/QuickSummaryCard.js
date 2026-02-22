import React, { useMemo } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Progress,
  Badge,
  useColorModeValue,
  Icon,
} from "@chakra-ui/react";
import { FaBan, FaChartLine, FaTrophy, FaFlagCheckered } from "react-icons/fa";

const QuickSummaryCard = ({ criteria, answers, jobAName, jobBName }) => {
  const cardBg = useColorModeValue("blue.50", "blue.900");
  const borderColor = useColorModeValue("blue.200", "blue.700");

  const summary = useMemo(() => {
    let totalWeightA = 0;
    let totalWeightB = 0;
    let totalWeight = 0;
    let answeredCount = 0;
    let notApplicableCount = 0;

    criteria.forEach((criterion) => {
      const answer = answers[criterion.id];
      if (answer && answer.notApplicable) {
        notApplicableCount++;
      } else if (answer && answer.weight > 0 && 
                 (answer.scoreA !== null && answer.scoreA !== undefined) && 
                 (answer.scoreB !== null && answer.scoreB !== undefined)) {
        // Include criteria where both scores are answered, even if scoreA=0 or scoreB=0
        const { weight, scoreA = 0, scoreB = 0 } = answer;
        totalWeightA += weight * scoreA;
        totalWeightB += weight * scoreB;
        totalWeight += weight;
        answeredCount++;
      }
    });

    // Normalize to 0-100 scale: (weightedSum / totalWeight) * 20
    // weight is 1-5 (O.I.W), scoreA/scoreB are 1-5 (D.F.S)
    // Max possible: (5 * 5) / 5 * 20 = 100
    const scoreA = totalWeight > 0 ? (totalWeightA / totalWeight) * 20 : 0;
    const scoreB = totalWeight > 0 ? (totalWeightB / totalWeight) * 20 : 0;

    return {
      scoreA: Math.round(scoreA * 10) / 10,
      scoreB: Math.round(scoreB * 10) / 10,
      answeredCount,
      notApplicableCount,
      totalCount: criteria.length,
      progress: criteria.length > 0 ? (answeredCount / criteria.length) * 100 : 0,
      notApplicablePercentage: criteria.length > 0 ? (notApplicableCount / criteria.length) * 100 : 0,
    };
  }, [criteria, answers]);

  const winner = summary.scoreA > summary.scoreB ? "A" : summary.scoreB > summary.scoreA ? "B" : "tie";

  return (
    <Box
      bg={cardBg}
      border="2px"
      borderColor={borderColor}
      rounded="xl"
      p={4}
      mb={6}
    >
      <VStack spacing={3} align="stretch">
        <HStack justify="space-between">
          <HStack spacing={2}>
            <Icon as={FaChartLine} color="blue.600" boxSize={4} />
            <Text fontWeight="bold" fontSize="sm" color="gray.700">
              Quick Summary
            </Text>
          </HStack>
          <HStack spacing={2}>
            {summary.notApplicableCount > 0 && (
              <Badge colorScheme="orange" display="flex" alignItems="center" gap={1}>
                <Icon as={FaBan} boxSize={2} />
                {summary.notApplicableCount} N/A
              </Badge>
            )}
            <Badge colorScheme="blue">
              {summary.answeredCount}/{summary.totalCount} answered
            </Badge>
          </HStack>
        </HStack>

        <Progress
          value={summary.progress}
          colorScheme="blue"
          size="sm"
          borderRadius="full"
        />

        {summary.answeredCount > 0 && (
          <HStack justify="space-around" mt={2}>
            <VStack spacing={1}>
              <HStack spacing={1}>
                <Icon as={FaTrophy} color="blue.500" boxSize={3} />
                <Text fontSize="xs" color="gray.600">
                  {jobAName}
                </Text>
              </HStack>
              <Text fontSize="xl" fontWeight="bold" color="blue.600">
                {summary.scoreA.toFixed(1)}
              </Text>
            </VStack>

            <Text fontSize="sm" color="gray.500" fontWeight="bold">
              vs
            </Text>

            <VStack spacing={1}>
              <HStack spacing={1}>
                <Icon as={FaTrophy} color="red.500" boxSize={3} />
                <Text fontSize="xs" color="gray.600">
                  {jobBName}
                </Text>
              </HStack>
              <Text fontSize="xl" fontWeight="bold" color="red.600">
                {summary.scoreB.toFixed(1)}
              </Text>
            </VStack>
          </HStack>
        )}

        {summary.answeredCount > 0 && winner !== "tie" && (
          <HStack spacing={2} justify="center" mt={1}>
            <Icon as={FaFlagCheckered} color="green.500" boxSize={3} />
            <Text fontSize="xs" textAlign="center" color="gray.600">
              {winner === "A" ? jobAName : jobBName} is currently leading
            </Text>
          </HStack>
        )}
      </VStack>
    </Box>
  );
};

export default QuickSummaryCard;
