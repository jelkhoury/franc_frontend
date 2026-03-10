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
  Tooltip,
} from "@chakra-ui/react";
import { FaBriefcase, FaBalanceScale, FaBan } from "react-icons/fa";
import CriterionSlider from "./CriterionSlider";

const SideBySideComparison = ({
  criterion,
  jobAName,
  jobBName,
  weight,
  scoreA,
  scoreB,
  notApplicableA = false,
  notApplicableB = false,
  onWeightChange,
  onScoreAChange,
  onScoreBChange,
  onNotApplicableAChange,
  onNotApplicableBChange,
  noticeAboveJobs,
}) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const jobAColor = useColorModeValue("blue.500", "blue.300");
  const jobBColor = useColorModeValue("red.500", "red.300");

  // Helper function to capitalize words and remove "if any" (e.g., "Starting salary, if any" -> "Starting Salary")
  const capitalizeWords = (str) => {
    if (!str) return str;
    // Remove ", if any" or "if any" phrase (case insensitive)
    let cleaned = str.replace(/,\s*if any\b/gi, '').replace(/\bif any\b/gi, '').trim();
    // Clean up extra spaces and trailing commas
    cleaned = cleaned.replace(/\s+/g, ' ').replace(/,\s*$/, '').trim();
    return cleaned
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const criterionName = capitalizeWords(criterion?.name || '');

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
                How important is "{criterionName || 'this criterion'}" to you?
              </Text>
            </HStack>
            <Badge
              colorScheme={weight >= 4 ? "red" : weight >= 3 ? "yellow" : "gray"}
              fontSize="md"
              px={3}
              py={1}
            >
              {weight === 5 ? "Extremely Important" : weight === 4 ? "Very Important" : weight === 3 ? "Important" : weight === 2 ? "Slightly Important" : "Not Important"}
            </Badge>
          </HStack>
          <CriterionSlider
            label=""
            value={weight}
            onChange={onWeightChange}
            min={1}
            max={5}
            valueLabels={{ 1: "", 2: "", 3: "", 4: "", 5: "" }}
            leftLabel="Not Important"
            rightLabel="Extremely Important"
          />
        </VStack>
      </Box>

      {noticeAboveJobs}

      {/* Side-by-Side Job Comparison */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {/* Job A Card */}
        <Box
          bg={cardBg}
          rounded="xl"
          shadow="md"
          p={6}
          border="2px"
          borderColor={notApplicableA ? "orange.400" : jobAColor}
          position="relative"
          display="flex"
          flexDirection="column"
          minH="280px"
        >
          <VStack spacing={4} align="stretch" flex={1}>
            <HStack justify="space-between" align="center" flexWrap="wrap" gap={2} flexShrink={0}>
              <HStack spacing={2}>
                <Icon as={FaBriefcase} color={jobAColor} boxSize={5} />
                <Text fontWeight="bold" fontSize="lg" color={jobAColor}>
                  {jobAName}
                </Text>
              </HStack>
              <HStack spacing={2} align="center">
                <Tooltip
                  label={notApplicableA ? "Click Answer to rate this job again" : `I don't have enough information about this criterion for ${jobAName}`}
                  hasArrow
                  placement="top"
                  openDelay={300}
                >
                  <HStack
                    as="button"
                    spacing={1.5}
                    align="center"
                    onClick={() => onNotApplicableAChange?.(!notApplicableA)}
                    role="button"
                    aria-label={notApplicableA ? "Answer / rate this job" : "Mark as not applicable"}
                    px={3}
                    py={1.5}
                    borderRadius="md"
                    bg={notApplicableA ? "orange.100" : "gray.100"}
                    borderWidth="1px"
                    borderColor={notApplicableA ? "orange.300" : "gray.300"}
                    _hover={{ bg: notApplicableA ? "orange.200" : "gray.200" }}
                  >
                    <Icon as={FaBan} boxSize={3.5} color={notApplicableA ? "orange.600" : "gray.500"} />
                    <Text fontSize="sm" fontWeight="medium" color={notApplicableA ? "orange.700" : "gray.600"}>
                      {notApplicableA ? "Answer" : "Not applicable"}
                    </Text>
                  </HStack>
                </Tooltip>
                {!notApplicableA && (
                  <Badge
                    bg={getScoreColor(scoreA)}
                    color="white"
                    fontSize="lg"
                    px={3}
                    py={1}
                    borderRadius="full"
                  >
                    <Text>{scoreA}/5</Text>
                  </Badge>
                )}
              </HStack>
            </HStack>
            {notApplicableA ? (
              <Box flex={1} display="flex" alignItems="center" justifyContent="center" minH="120px">
                <Box
                  py={5}
                  px={4}
                  bg="orange.50"
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor="orange.200"
                  textAlign="center"
                >
                  <Text fontSize="sm" color="orange.700" lineHeight="tall">
                    This job will get a score of 0 for this criterion and won&apos;t be compared on it.
                  </Text>
                </Box>
              </Box>
            ) : (
              <>
                <Divider />
                <CriterionSlider
                  label={`Rate this job for ${criterionName}`}
                  value={scoreA < 1 ? 1 : scoreA}
                  onChange={onScoreAChange}
                  min={1}
                  max={5}
                  valueLabels={{ 1: "", 2: "", 3: "", 4: "", 5: "" }}
                  leftLabel="Low Satisfaction"
                  rightLabel="High Satisfaction"
                />
                <Box mt={2} textAlign="center">
                  <Text fontSize="lg" fontWeight="bold" color={jobAColor}>{weight * scoreA}</Text>
                </Box>
              </>
            )}
          </VStack>
        </Box>

        {/* Job B Card */}
        <Box
          bg={cardBg}
          rounded="xl"
          shadow="md"
          p={6}
          border="2px"
          borderColor={notApplicableB ? "orange.400" : jobBColor}
          position="relative"
          display="flex"
          flexDirection="column"
          minH="280px"
        >
          <VStack spacing={4} align="stretch" flex={1}>
            <HStack justify="space-between" align="center" flexWrap="wrap" gap={2} flexShrink={0}>
              <HStack spacing={2}>
                <Icon as={FaBriefcase} color={jobBColor} boxSize={5} />
                <Text fontWeight="bold" fontSize="lg" color={jobBColor}>
                  {jobBName}
                </Text>
              </HStack>
              <HStack spacing={2} align="center">
                <Tooltip
                  label={notApplicableB ? "Click Answer to rate this job again" : `I don't have enough information about this criterion for ${jobBName}`}
                  hasArrow
                  placement="top"
                  openDelay={300}
                >
                  <HStack
                    as="button"
                    spacing={1.5}
                    align="center"
                    onClick={() => onNotApplicableBChange?.(!notApplicableB)}
                    role="button"
                    aria-label={notApplicableB ? "Answer / rate this job" : "Mark as not applicable"}
                    px={3}
                    py={1.5}
                    borderRadius="md"
                    bg={notApplicableB ? "orange.100" : "gray.100"}
                    borderWidth="1px"
                    borderColor={notApplicableB ? "orange.300" : "gray.300"}
                    _hover={{ bg: notApplicableB ? "orange.200" : "gray.200" }}
                  >
                    <Icon as={FaBan} boxSize={3.5} color={notApplicableB ? "orange.600" : "gray.500"} />
                    <Text fontSize="sm" fontWeight="medium" color={notApplicableB ? "orange.700" : "gray.600"}>
                      {notApplicableB ? "Answer" : "Not applicable"}
                    </Text>
                  </HStack>
                </Tooltip>
                {!notApplicableB && (
                  <Badge
                    bg={getScoreColor(scoreB)}
                    color="white"
                    fontSize="lg"
                    px={3}
                    py={1}
                    borderRadius="full"
                  >
                    <Text>{scoreB}/5</Text>
                  </Badge>
                )}
              </HStack>
            </HStack>
            {notApplicableB ? (
              <Box flex={1} display="flex" alignItems="center" justifyContent="center" minH="120px">
                <Box
                  py={5}
                  px={4}
                  bg="orange.50"
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor="orange.200"
                  textAlign="center"
                >
                  <Text fontSize="sm" color="orange.700" lineHeight="tall">
                    This job will get a score of 0 for this criterion and won&apos;t be compared on it.
                  </Text>
                </Box>
              </Box>
            ) : (
              <>
                <Divider />
                <CriterionSlider
                  label={`Rate this job for ${criterionName}`}
                  value={scoreB < 1 ? 1 : scoreB}
                  onChange={onScoreBChange}
                  min={1}
                  max={5}
                  valueLabels={{ 1: "", 2: "", 3: "", 4: "", 5: "" }}
                  leftLabel="Low Satisfaction"
                  rightLabel="High Satisfaction"
                />
                <Box mt={2} textAlign="center">
                  <Text fontSize="lg" fontWeight="bold" color={jobBColor}>{weight * scoreB}</Text>
                </Box>
              </>
            )}
          </VStack>
        </Box>
      </SimpleGrid>

      {/* Quick Comparison Indicator */}
      {!notApplicableA && !notApplicableB && (scoreA >= 1 && scoreB >= 1) && (
        <Box mt={4} textAlign="center">
          <Text fontSize="sm" color="gray.600">
            Difference:{" "}
            <Text as="span" fontWeight="bold" color="gray.800">
              {Math.abs(weight * (scoreA - scoreB))} points
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
