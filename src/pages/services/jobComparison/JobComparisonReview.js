import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Box,
  Heading,
  VStack,
  HStack,
  Button,
  Text,
  useColorModeValue,
  Card,
  CardBody,
  SimpleGrid,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  Icon,
  Divider,
  useToast,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { get, post } from "../../../utils/httpServices";
import { captureError } from "../../../utils/sentryUtils";
import { JOB_COMPARISON_ENDPOINTS } from "../../../services/apiService";
import { FaBan, FaEdit, FaCheckCircle } from "react-icons/fa";

// Helper function to clean and format criterion names
const cleanCriterionName = (str) => {
  if (!str) return str;
  // Remove ", if any" or "if any" phrase (case insensitive)
  let cleaned = str.replace(/,\s*if any\b/gi, '').replace(/\bif any\b/gi, '').trim();
  // Clean up extra spaces and trailing commas
  cleaned = cleaned.replace(/\s+/g, ' ').replace(/,\s*$/, '').trim();
  return cleaned;
};

const JobComparisonReview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [criteria, setCriteria] = useState([]);
  const [jobAName, setJobAName] = useState("");
  const [jobBName, setJobBName] = useState("");
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [jobComparisonId, setJobComparisonId] = useState(0);
  const [saving, setSaving] = useState(false);
  const lastSavedAnswersRef = useRef(null);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    const loadFromState = (state) => {
      setJobAName(state.jobAName || "");
      setJobBName(state.jobBName || "");
      setCriteria(state.criteria || []);
      const initAnswers = state.answers || {};
      setAnswers(initAnswers);
      lastSavedAnswersRef.current = Object.keys(initAnswers).reduce((acc, id) => {
        const a = initAnswers[id];
        acc[id] = { weight: a?.weight ?? 0, scoreA: a?.scoreA ?? 0, scoreB: a?.scoreB ?? 0, notApplicable: !!a?.notApplicable };
        return acc;
      }, {});
      setJobComparisonId(state.jobComparisonId || 0);
      setLoading(false);
    };

    if (location.state?.criteria?.length) {
      loadFromState(location.state);
      return;
    }

    // Reload or direct URL: try to restore from DB (check incomplete comparison)
    let cancelled = false;
    const restore = async () => {
      try {
        const result = await get(JOB_COMPARISON_ENDPOINTS.CHECK_INCOMPLETE);
        if (cancelled) return;
        if (!result?.id) {
          navigate("/job-comparison/setup", { replace: true });
          return;
        }
        let rawCriteria = result.criteria ?? result.Criteria ?? [];
        if (!rawCriteria.length) {
          const fetched = await get(JOB_COMPARISON_ENDPOINTS.GET_CRITERIA);
          rawCriteria = Array.isArray(fetched) ? fetched : [];
        }
        if (cancelled || !rawCriteria.length) {
          navigate("/job-comparison/setup", { replace: true });
          return;
        }
        const criteriaList = rawCriteria.map((x) => ({
          id: x.id ?? x.Id,
          name: x.name ?? x.Name,
          section: x.section ?? x.Section,
          category: (x.category ?? x.Category ?? "").toUpperCase(),
          description: x.description ?? x.Description,
        }));
        const rawAnswers = result.answers ?? result.criterionAnswers ?? result.CriterionAnswers ?? [];
        const answersMap = Array.isArray(rawAnswers)
          ? rawAnswers.reduce((acc, a) => {
              const id = a.criterionId ?? a.CriterionId ?? a.criterion_id;
              if (id == null) return acc;
              acc[id] = {
                weight: a.weight ?? a.Weight ?? 0,
                scoreA: a.scoreA ?? a.ScoreA ?? 0,
                scoreB: a.scoreB ?? a.ScoreB ?? 0,
                notApplicable: !!(a.notApplicable ?? a.NotApplicable),
              };
              return acc;
            }, {})
          : { ...rawAnswers };
        loadFromState({
          jobAName: result.jobAName ?? result.JobAName ?? "",
          jobBName: result.jobBName ?? result.JobBName ?? "",
          criteria: criteriaList,
          answers: answersMap,
          jobComparisonId: result.id ?? result.Id,
        });
      } catch (e) {
        captureError(e);
        if (!cancelled) {
          console.warn("Restore review from API failed:", e);
          navigate("/job-comparison/setup", { replace: true });
        }
      }
    };
    restore();
    return () => { cancelled = true; };
  }, [location.state, navigate]);

  const handleEdit = (criterionId) => {
    navigate(`/job-comparison/question/${criterionId}`, {
      state: {
        jobAName,
        jobBName,
        criteria,
        answers,
        jobComparisonId,
      }
    });
  };

  const isAnswerEqual = (a, b) => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    const naA = a.notApplicableA ?? a.notApplicable;
    const naB = a.notApplicableB ?? a.notApplicable;
    const nbA = b.notApplicableA ?? b.notApplicable;
    const nbB = b.notApplicableB ?? b.notApplicable;
    return (
      naA === nbA &&
      naB === nbB &&
      (a.weight ?? 0) === (b.weight ?? 0) &&
      (a.scoreA ?? 0) === (b.scoreA ?? 0) &&
      (a.scoreB ?? 0) === (b.scoreB ?? 0)
    );
  };

  const handleSubmit = async () => {
    if (!allAnswered) return;

    const lastSaved = lastSavedAnswersRef.current || {};
    const idsToSend = criteria.filter((c) => {
      const current = answers[c.id];
      if (current == null) return false;
      const last = lastSaved[c.id];
      if (last == null) return true;
      return !isAnswerEqual(current, last);
    }).map((c) => c.id);

    try {
      setSaving(true);
      const answersArray = idsToSend.map((id) => {
        const answer = answers[id];
        const naA = !!answer.notApplicableA;
        const naB = !!answer.notApplicableB;
        const bothNA = naA && naB;
        return {
          criterionId: id,
          weight: bothNA ? 0 : (answer.weight ?? 0),
          scoreA: naA ? 0 : (answer.scoreA ?? 0),
          scoreB: naB ? 0 : (answer.scoreB ?? 0),
          notApplicableA: naA,
          notApplicableB: naB,
        };
      });

      const saveData = {
        jobComparisonId: jobComparisonId || 0,
        jobAName: jobAName.trim(),
        jobBName: jobBName.trim(),
        isCompleted: true,
        answers: answersArray,
      };

      const response = await post(JOB_COMPARISON_ENDPOINTS.SAVE_COMPARISON, saveData);
      
      const finalId = response.jobComparisonId || jobComparisonId;

      // Navigate to results with saved data
      navigate("/job-comparison/results", {
        state: {
          jobAName,
          jobBName,
          criteria,
          answers,
          jobComparisonId: finalId,
        }
      });
    } catch (error) {
      captureError(error);
      console.error("Error saving comparison:", error);
      toast({
        title: "Error",
        description: "Failed to save comparison. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const allAnswered = criteria.every((c) => {
    const answer = answers[c.id];
    const bothNA = (answer?.notApplicableA && answer?.notApplicableB) || answer?.notApplicable;
    const hasScores =
      answer &&
      answer.weight > 0 &&
      ((answer.scoreA ?? 0) > 0 || answer.notApplicableA) &&
      ((answer.scoreB ?? 0) > 0 || answer.notApplicableB);
    return answer && (bothNA || hasScores);
  });

  // Calculate percentage of Not Applicable (either job or both) answers
  const notApplicableStats = useMemo(() => {
    let notApplicableCount = 0;
    criteria.forEach((c) => {
      const answer = answers[c.id];
      // Count if EITHER job A OR job B (or both) is marked as not applicable
      const hasNA = answer?.notApplicableA || answer?.notApplicableB || answer?.notApplicable;
      if (answer && hasNA) notApplicableCount++;
    });
    const percentage = criteria.length > 0 ? (notApplicableCount / criteria.length) * 100 : 0;
    return { count: notApplicableCount, percentage, total: criteria.length };
  }, [criteria, answers]);

  if (loading) {
    return (
      <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="blue.500" />
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50" py={8}>
      <Box maxW="1400px" mx="auto" px={6}>
        <Heading color="brand.500" size="lg" mb={6} textAlign="center">
          Review Your Answers
        </Heading>

        <Text color="gray.600" mb={6} textAlign="center">
          Review your comparison below. You can edit any criterion before
          calculating results.
        </Text>

        {!allAnswered && (
          <Alert status="warning" mb={6}>
            <AlertIcon />
            Some criteria are not fully answered. Please complete all answers
            before proceeding.
          </Alert>
        )}

        {notApplicableStats.percentage > 30 && (
          <Box mb={4} px={3} py={2} bg="orange.50" borderRadius="md" borderLeft="4px" borderColor="orange.400" w="100%">
            <Text fontSize="sm" color="orange.800">
              <strong>Note:</strong> {notApplicableStats.count} of {notApplicableStats.total} questions ({notApplicableStats.percentage.toFixed(0)}%) are marked as &quot;Not applicable&quot;. This may affect the calculation and make it less fair, but you can still calculate results normally.
            </Text>
          </Box>
        )}

        {/* Group criteria by sections */}
        {(() => {
          const sections = [...new Set(criteria.map((c) => c.section).filter(Boolean))];
          
          // Expand all sections by default
          const defaultIndexes = sections.map((_, index) => index);
          
          return (
            <Accordion allowMultiple defaultIndex={defaultIndexes}>
              {sections.map((section, sectionIndex) => {
                const sectionCriteria = criteria.filter((c) => c.section === section);
                
                return (
                  <AccordionItem key={section} border="1px" borderColor="gray.200" borderRadius="md" mb={4}>
                    <AccordionButton
                      bg="blue.50"
                      borderLeft="4px"
                      borderColor="blue.500"
                      p={4}
                      borderRadius="md"
                      _hover={{ bg: "blue.100" }}
                    >
                      <Box flex="1" textAlign="left">
                        <HStack justify="space-between">
                          <Box>
                            <Text fontSize="xs" color="blue.600" fontWeight="bold" textTransform="uppercase" letterSpacing="wide">
                              Section {sectionIndex + 1} of {sections.length}
                            </Text>
                            <Heading size="md" color="blue.700" mt={1}>
                              {section}
                            </Heading>
                          </Box>
                          <Badge colorScheme="blue" fontSize="sm" mr={4}>
                            {sectionCriteria.length} {sectionCriteria.length === 1 ? 'question' : 'questions'}
                          </Badge>
                        </HStack>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      {/* Section Criteria */}
                      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} mt={4}>
                        {sectionCriteria.map((criterion) => {
                          const answer = answers[criterion.id] || {
                            weight: 0,
                            scoreA: 0,
                            scoreB: 0,
                            notApplicable: false,
                            notApplicableA: false,
                            notApplicableB: false,
                          };
                          const naA = answer.notApplicableA ?? answer.notApplicable;
                          const naB = answer.notApplicableB ?? answer.notApplicable;
                          const bothNA = naA && naB;
                          const isComplete =
                            bothNA || (answer.weight > 0 && ((answer.scoreA ?? 0) > 0 || (answer.scoreB ?? 0) > 0 || naA || naB));

                          return (
                            <Card 
                              key={criterion.id} 
                              bg={cardBg} 
                              border="1px" 
                              borderColor={borderColor}
                              cursor="pointer"
                              maxW="500px"
                              _hover={{ 
                                borderColor: "blue.400",
                                shadow: "md",
                                transform: "translateY(-2px)",
                                transition: "all 0.2s"
                              }}
                              onClick={() => handleEdit(criterion.id)}
                              position="relative"
                            >
                              <CardBody>
                                <Text
                                  position="absolute"
                                  top={2}
                                  right={2}
                                  fontSize="xs"
                                  color="blue.600"
                                  fontWeight="medium"
                                  _hover={{ color: "blue.700" }}
                                >
                                  Edit
                                </Text>
                                <VStack align="stretch" spacing={3} pt={2}>
                                  <Box minH="2.8em" display="flex" alignItems="flex-start">
                                    <Heading size="sm" color="gray.800" lineHeight="tall">
                                      {cleanCriterionName(criterion.name)}
                                    </Heading>
                                  </Box>

                                  {isComplete ? (
                                    bothNA ? (
                                      <Box
                                        p={3}
                                        bg="orange.50"
                                        borderRadius="md"
                                        border="1px"
                                        borderColor="orange.200"
                                        w="100%"
                                      >
                                        <VStack spacing={2} align="start">
                                          <HStack spacing={2}>
                                            <Icon as={FaBan} color="orange.600" boxSize={5} />
                                            <Text fontSize="sm" fontWeight="bold" color="orange.700">
                                              Not Applicable
                                            </Text>
                                          </HStack>
                                          <Text fontSize="xs" color="orange.600" pl={7}>
                                            Both jobs excluded from scoring for this criterion
                                          </Text>
                                        </VStack>
                                      </Box>
                                    ) : (
                                      <>
                                        <HStack spacing={2} mb={2}>
                                          <Icon as={FaCheckCircle} color="green.500" boxSize={4} />
                                          <Text fontSize="sm" color="gray.600">
                                            <strong>Importance:</strong> {answer.weight}/5
                                          </Text>
                                        </HStack>
                                        <HStack spacing={3} align="stretch">
                                          {/* Job A Box */}
                                          <Box
                                            p={2.5}
                                            bg="blue.50"
                                            borderRadius="md"
                                            border="1px"
                                            borderColor="blue.200"
                                            flex="1"
                                            minW="100px"
                                            maxW="150px"
                                          >
                                            <VStack align="start" spacing={1}>
                                              <Text fontSize="sm" fontWeight="bold" color="blue.500">
                                                {jobAName}
                                              </Text>
                                              <Text fontSize="md" fontWeight="semibold" color="blue.700">
                                                {naA ? "Not applicable" : `${answer.scoreA}/5`}
                                              </Text>
                                            </VStack>
                                          </Box>
                                          {/* Job B Box */}
                                          <Box
                                            p={2.5}
                                            bg="red.50"
                                            borderRadius="md"
                                            border="1px"
                                            borderColor="red.200"
                                            flex="1"
                                            minW="100px"
                                            maxW="150px"
                                          >
                                            <VStack align="start" spacing={1}>
                                              <Text fontSize="sm" fontWeight="bold" color="red.500">
                                                {jobBName}
                                              </Text>
                                              <Text fontSize="md" fontWeight="semibold" color="red.700">
                                                {naB ? "Not applicable" : `${answer.scoreB}/5`}
                                              </Text>
                                            </VStack>
                                          </Box>
                                        </HStack>
                                      </>
                                    )
                                  ) : (
                                    <Text fontSize="sm" color="red.500">
                                      Incomplete
                                    </Text>
                                  )}
                                </VStack>
                              </CardBody>
                            </Card>
                          );
                        })}
                      </SimpleGrid>
                    </AccordionPanel>
                  </AccordionItem>
                );
              })}
            </Accordion>
          );
        })()}

        <Box textAlign="center">
          <VStack spacing={4}>
            {notApplicableStats.percentage > 30 && (
              <Box px={3} py={2} bg="orange.50" borderRadius="md" borderLeft="4px" borderColor="orange.400" w="100%">
                <Text fontSize="xs" color="orange.800">
                  Many Not applicable may affect fairness of the comparison; you can still calculate normally.
                </Text>
              </Box>
            )}
            <Button
              onClick={handleSubmit}
              colorScheme="blue"
              size="lg"
              isDisabled={!allAnswered || saving}
              isLoading={saving}
              loadingText="Saving..."
            >
              Calculate Results
            </Button>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};

export default JobComparisonReview;
