import React, { useState, useRef } from "react";
import {
  Box,
  Circle,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Icon,
  Flex,
  useColorModeValue,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircleIcon,
  StarIcon,
  TimeIcon,
  ArrowForwardIcon,
  QuestionOutlineIcon,
  ViewIcon,
} from "@chakra-ui/icons";
import Footer from "../../../components/Footer";
import { get } from "../../../utils/httpServices";
import { JOB_COMPARISON_ENDPOINTS } from "../../../services/apiService";

const JobComparisonLanding = () => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);
  const [incompleteComparison, setIncompleteComparison] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef(null);

  const handleStartClick = async () => {
    setIsChecking(true);
    setIncompleteComparison(null);
    try {
      const result = await get(JOB_COMPARISON_ENDPOINTS.CHECK_INCOMPLETE);
      if (!result || !result.id) {
        navigate("/job-comparison/setup");
        return;
      }
      setIncompleteComparison(result);
      onOpen();
    } catch (err) {
      console.warn("Check incomplete comparison failed, going to setup:", err);
      navigate("/job-comparison/setup");
    } finally {
      setIsChecking(false);
    }
  };

  const handleContinue = async () => {
    const c = incompleteComparison;
    const jobAName = c.jobAName ?? c.JobAName ?? "";
    const jobBName = c.jobBName ?? c.JobBName ?? "";
    const jobComparisonId = c.id ?? c.Id;

    let rawCriteria = c?.criteria ?? c?.Criteria ?? [];
    if (!rawCriteria.length) {
      try {
        const fetched = await get(JOB_COMPARISON_ENDPOINTS.GET_CRITERIA);
        rawCriteria = Array.isArray(fetched) ? fetched : [];
      } catch (e) {
        rawCriteria = [];
      }
    }

    if (!rawCriteria.length) {
      onClose();
      navigate("/job-comparison/setup", {
        state: { jobAName, jobBName, jobComparisonId },
      });
      return;
    }

    const criteria = rawCriteria.map((x) => ({
      id: x.id ?? x.Id,
      name: x.name ?? x.Name,
      section: x.section ?? x.Section,
      category: (x.category ?? x.Category ?? "").toUpperCase(),
      description: x.description ?? x.Description,
    }));

    const rawAnswers = c.criterionAnswers ?? c.answers ?? c.CriterionAnswers ?? [];
    const answers = Array.isArray(rawAnswers)
      ? rawAnswers.reduce((acc, a) => {
          const id = a.criterionId ?? a.CriterionId ?? a.criterion_id;
          if (id == null) return acc;
          const oldNA = !!(a.notApplicable ?? a.NotApplicable ?? a.not_applicable);
          const naA = a.notApplicableA ?? a.NotApplicableA ?? oldNA;
          const naB = a.notApplicableB ?? a.NotApplicableB ?? oldNA;
          acc[id] = {
            weight: a.weight ?? a.Weight ?? 0,
            scoreA: a.scoreA ?? a.ScoreA ?? a.score_a ?? 0,
            scoreB: a.scoreB ?? a.ScoreB ?? a.score_b ?? 0,
            notApplicable: naA && naB,
            notApplicableA: !!naA,
            notApplicableB: !!naB,
          };
          return acc;
        }, {})
      : { ...rawAnswers };

    const state = {
      jobAName,
      jobBName,
      criteria,
      answers,
      jobComparisonId,
    };

    const firstUnanswered = criteria.find((cr) => !answers[cr.id]);
    onClose();
    if (firstUnanswered) {
      navigate(`/job-comparison/question/${firstUnanswered.id}`, { state });
    } else {
      navigate("/job-comparison/review", { state });
    }
  };

  const handleRestart = () => {
    onClose();
    setIncompleteComparison(null);
    navigate("/job-comparison/setup");
  };

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-r, white, #ebf8ff)"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      {/* Main Content */}
      <Flex
        direction={{ base: "column", md: "row" }}
        align="center"
        justify="space-between"
        p={{ base: 6, md: 16 }}
        gap={10}
      >
        {/* Right - Video */}
        <Box
          maxW={{ base: "100%", md: "480px" }}
          w="100%"
          minH={{ base: "280px", md: "280px" }}
          borderRadius="xl"
          overflow="hidden"
          boxShadow="lg"
          sx={{ aspectRatio: "16/9" }}
        >
          <video
            src="/assets/images/job comparison.mp4"
            autoPlay
            muted
            loop
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
            }}
            title="Job comparison"
          />
        </Box>

        {/* Left - Card with Content */}
        <Box
          flex="1"
          maxW={{ base: "100%", md: "60%" }}
          p={8}
          bg="white"
          borderRadius="2xl"
          boxShadow="0 4px 12px rgba(4, 90, 171, 0.2)"
          border="1px solid"
          borderColor="gray.100"
        >
          <Heading color="brand.500" size="xl" mb={4}>
            Job Comparison Scorecard
          </Heading>

          <Text fontSize="lg" mb={6}>
            Compare two job opportunities using a structured evaluation framework. Rate each job across multiple criteria to take objective decision about your future career.
          </Text>

          {/* Icons Row */}
          <HStack spacing={6} mb={6}>
            <VStack spacing={1}>
              <Icon as={CheckCircleIcon} color="green.400" boxSize={6} />
              <Text fontSize="sm">Structured</Text>
            </VStack>
            <VStack spacing={1}>
              <Icon as={StarIcon} color="yellow.400" boxSize={6} />
              <Text fontSize="sm">Objective</Text>
            </VStack>
            <VStack spacing={1}>
              <Icon as={TimeIcon} color="blue.400" boxSize={6} />
              <Text fontSize="sm">5–10 minutes</Text>
            </VStack>
          </HStack>

          <Button
            onClick={handleStartClick}
            colorScheme="brand"
            size="md"
            isLoading={isChecking}
            loadingText="Checking..."
          >
            Start Comparison
          </Button>
        </Box>
      </Flex>

      <AlertDialog isOpen={isOpen} onClose={onClose} leastDestructiveRef={cancelRef}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Incomplete job comparison
            </AlertDialogHeader>
            <AlertDialogBody>
              You already have a job comparison you didn&apos;t finish. Would you like to continue it or start a new one?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={handleRestart} variant="outline">
                Start new test
              </Button>
              <Button colorScheme="brand" onClick={handleContinue} ml={3}>
                Continue
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Instructions Section */}
      <Box py={16} px={{ base: 6, md: 16 }} textAlign="center" bg="white">
        <Heading color="brand.500" size="lg" mb={10}>
          Instructions
        </Heading>

        <HStack spacing={10} justify="center" flexWrap="wrap" align="flex-start">
          {/* Step 1 */}
          <VStack spacing={4} align="center" minW="140px">
            <Circle size="60px" bg="blue.100" color="blue.700">
              <Icon as={ViewIcon} boxSize={6} />
            </Circle>
            <Text fontWeight="bold" minH="1.5em" textAlign="center">
              Weight Criteria
            </Text>
            <Text fontSize="sm" color="gray.600" maxW="200px" textAlign="center">
              Choose the importance of each criterion on a scale from 1 to 5.
            </Text>
          </VStack>

          {/* Arrow */}
          <Icon
            as={ArrowForwardIcon}
            color="gray.400"
            boxSize={6}
            display={{ base: "none", md: "block" }}
            alignSelf="center"
          />

          {/* Step 2 */}
          <VStack spacing={4} align="center" minW="140px">
            <Circle size="60px" bg="blue.100" color="blue.700">
              <Icon as={ViewIcon} boxSize={6} />
            </Circle>
            <Text fontWeight="bold" minH="1.5em" textAlign="center">
              Rate Criteria
            </Text>
            <Text fontSize="sm" color="gray.600" maxW="200px" textAlign="center">
              Rate each criterion for both jobs on a scale from 1 to 5.
            </Text>
          </VStack>

          {/* Arrow */}
          <Icon
            as={ArrowForwardIcon}
            color="gray.400"
            boxSize={6}
            display={{ base: "none", md: "block" }}
            alignSelf="center"
          />

          {/* Step 3 */}
          <VStack spacing={4} align="center" minW="140px">
            <Circle size="60px" bg="blue.100" color="blue.700">
              <Icon as={CheckCircleIcon} boxSize={6} />
            </Circle>
            <Text fontWeight="bold" minH="1.5em" textAlign="center">
              Get Results
            </Text>
            <Text fontSize="sm" color="gray.600" maxW="200px" textAlign="center">
              View comprehensive comparison with Overall, HEAD, and HEART
              scores.
            </Text>
          </VStack>
        </HStack>
      </Box>

      {/* Call to Action Section */}
      <Box
        bg="brand.500"
        color="white"
        py={16}
        px={{ base: 6, md: 16 }}
        textAlign="center"
      >
        <Heading color="white" size="lg" mb={4}>
          Ready to Compare Your Job Options?
        </Heading>
        <Text fontSize="lg" mb={6}>
          Make an informed decision with our structured comparison tool.
        </Text>
        <Button
          onClick={handleStartClick}
          size="lg"
          colorScheme="whiteAlpha"
          bg="white"
          color="brand.500"
          _hover={{ bg: "gray.100" }}
          isLoading={isChecking}
          loadingText="Checking..."
        >
          Start Comparison
        </Button>
      </Box>

      <Footer />
    </Box>
  );
};

export default JobComparisonLanding;
