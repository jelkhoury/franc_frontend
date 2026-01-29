import React from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Divider,
  Badge,
  useColorModeValue,
  SimpleGrid,
  Icon,
} from "@chakra-ui/react";
import { FaStar, FaStarHalfAlt, FaStar as FaStarEmpty, FaTrophy, FaBalanceScale } from "react-icons/fa";
import CriterionSlider from "./CriterionSlider";

const SideBySideComparison = ({
  criterion,
  jobAName,
  jobBName,
  weight,
  scoreA,
  scoreB,
  onWeightChange,
  onScoreAChange,
  onScoreBChange,
}) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const jobAColor = useColorModeValue("blue.500", "blue.300");
  const jobBColor = useColorModeValue("red.500", "red.300");

  const getScoreColor = (score) => {
    // For 1-5 scale
    if (score >= 4) return "green.500";
    if (score >= 3) return "yellow.500";
    return "red.500";
  };

  const getWeightIntensity = (weight) => {
    // Visual indicator for weight importance (1-5 scale)
    const intensity = (weight / 5) * 100;
    return {
      opacity: 0.3 + (intensity / 100) * 0.7,
      borderWidth: weight >= 4 ? "2px" : "1px",
    };
  };

  return (
    <Box>
      {/* Weight Section - Full Width */}
      <Box
        bg={cardBg}
        rounded="xl"
        shadow="md"
        p={6}
        mb={6}
        border="1px"
        borderColor={borderColor}
        borderWidth={getWeightIntensity(weight).borderWidth}
        opacity={getWeightIntensity(weight).opacity}
      >
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between">
            <HStack spacing={2}>
              <Icon as={FaBalanceScale} color="blue.500" boxSize={5} />
              <Text fontWeight="bold" fontSize="lg" color="gray.800">
                How important is this to you?
              </Text>
            </HStack>
            <Badge
              colorScheme={weight >= 4 ? "red" : weight >= 3 ? "yellow" : "gray"}
              fontSize="md"
              px={3}
              py={1}
            >
              {weight >= 4 ? "Very Important" : weight >= 3 ? "Moderate" : "Less Important"}
            </Badge>
          </HStack>
          <CriterionSlider
            label=""
            value={weight}
            onChange={onWeightChange}
            min={1}
            max={5}
            leftLabel="Not Important"
            rightLabel="Very Important"
          />
        </VStack>
      </Box>

      {/* Side-by-Side Job Comparison */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {/* Job A Card */}
        <Box
          bg={cardBg}
          rounded="xl"
          shadow="md"
          p={6}
          border="2px"
          borderColor={jobAColor}
          position="relative"
        >
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between" mb={2}>
              <HStack spacing={2}>
                <Icon as={FaTrophy} color={jobAColor} boxSize={5} />
                <Text fontWeight="bold" fontSize="lg" color={jobAColor}>
                  {jobAName}
                </Text>
              </HStack>
              <Badge
                bg={getScoreColor(scoreA)}
                color="white"
                fontSize="lg"
                px={3}
                py={1}
                borderRadius="full"
              >
                <HStack spacing={1}>
                  <Icon as={FaStar} boxSize={3} />
                  <Text>{scoreA}/5</Text>
                </HStack>
              </Badge>
            </HStack>
            <Divider />
            <CriterionSlider
              label={`Rate this job for ${criterion.name}`}
              value={scoreA}
              onChange={onScoreAChange}
              min={0}
              max={5}
              leftLabel="Poor"
              rightLabel="Excellent"
            />
            {/* Visual Score Indicator */}
            <Box mt={2}>
              <Box
                h="8px"
                bg={getScoreColor(scoreA)}
                borderRadius="full"
                width={`${(scoreA / 5) * 100}%`}
                transition="all 0.3s"
              />
            </Box>
          </VStack>
        </Box>

        {/* Job B Card */}
        <Box
          bg={cardBg}
          rounded="xl"
          shadow="md"
          p={6}
          border="2px"
          borderColor={jobBColor}
          position="relative"
        >
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between" mb={2}>
              <HStack spacing={2}>
                <Icon as={FaTrophy} color={jobBColor} boxSize={5} />
                <Text fontWeight="bold" fontSize="lg" color={jobBColor}>
                  {jobBName}
                </Text>
              </HStack>
              <Badge
                bg={getScoreColor(scoreB)}
                color="white"
                fontSize="lg"
                px={3}
                py={1}
                borderRadius="full"
              >
                <HStack spacing={1}>
                  <Icon as={FaStar} boxSize={3} />
                  <Text>{scoreB}/5</Text>
                </HStack>
              </Badge>
            </HStack>
            <Divider />
            <CriterionSlider
              label={`Rate this job for ${criterion.name}`}
              value={scoreB}
              onChange={onScoreBChange}
              min={0}
              max={5}
              leftLabel="Poor"
              rightLabel="Excellent"
            />
            {/* Visual Score Indicator */}
            <Box mt={2}>
              <Box
                h="8px"
                bg={getScoreColor(scoreB)}
                borderRadius="full"
                width={`${(scoreB / 5) * 100}%`}
                transition="all 0.3s"
              />
            </Box>
          </VStack>
        </Box>
      </SimpleGrid>

      {/* Quick Comparison Indicator */}
      {(scoreA >= 0 && scoreB >= 0) && (
        <Box mt={4} textAlign="center">
          <Text fontSize="sm" color="gray.600">
            Difference:{" "}
            <Text as="span" fontWeight="bold" color="gray.800">
              {Math.abs(scoreA - scoreB)} points
            </Text>
            {scoreA > scoreB ? (
              <Text as="span" color={jobAColor} ml={2}>
                → {jobAName} leads
              </Text>
            ) : scoreB > scoreA ? (
              <Text as="span" color={jobBColor} ml={2}>
                → {jobBName} leads
              </Text>
            ) : (
              <Text as="span" color="gray.500" ml={2}>
                → Tie
              </Text>
            )}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default SideBySideComparison;
