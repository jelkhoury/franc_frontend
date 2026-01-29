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
} from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { get, post } from "../../../utils/httpServices";
import { JOB_COMPARISON_ENDPOINTS } from "../../../services/apiService";
import { FaBan, FaExclamationTriangle, FaDollarSign, FaGift, FaBuilding, FaBriefcase, FaClock, FaEllipsisH, FaEdit, FaCheckCircle } from "react-icons/fa";

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
    return a.notApplicable === b.notApplicable &&
      (a.weight ?? 0) === (b.weight ?? 0) &&
      (a.scoreA ?? 0) === (b.scoreA ?? 0) &&
      (a.scoreB ?? 0) === (b.scoreB ?? 0);
  };

  const handleSubmit = async () => {
    if (!allAnswered || notApplicableStats.percentage > 30) {
      return;
    }

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
        return {
          criterionId: id,
          weight: answer.notApplicable ? 0 : (answer.weight ?? 0),
          scoreA: answer.notApplicable ? 0 : (answer.scoreA ?? 0),
          scoreB: answer.notApplicable ? 0 : (answer.scoreB ?? 0),
          notApplicable: !!answer.notApplicable,
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
    const a = answer?.scoreA ?? 0;
    const b = answer?.scoreB ?? 0;
    return answer && (answer.notApplicable || (answer.weight > 0 && (a > 0 || b > 0)));
  });

  // Calculate percentage of Not Applicable answers
  const notApplicableStats = useMemo(() => {
    let notApplicableCount = 0;
    criteria.forEach((c) => {
      const answer = answers[c.id];
      if (answer && answer.notApplicable) {
        notApplicableCount++;
      }
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
          <Alert status="error" mb={6}>
            <Icon as={FaExclamationTriangle} mr={3} />
            <Box>
              <Text fontWeight="bold">
                Comparison Cannot Be Completed
              </Text>
              <Text fontSize="sm">
                {notApplicableStats.count} out of {notApplicableStats.total} questions ({notApplicableStats.percentage.toFixed(1)}%) are marked as "Not Applicable". 
                Please ensure at least 70% of questions are answered to proceed with the comparison.
              </Text>
            </Box>
          </Alert>
        )}

        {/* Group criteria by sections */}
        {(() => {
          const sections = [...new Set(criteria.map((c) => c.section).filter(Boolean))];
          
          // Section icons mapping
          const getSectionIcon = (sectionName) => {
            const iconMap = {
              "Salary": FaDollarSign,
              "Benefits & Perks": FaGift,
              "The Company": FaBuilding,
              "The Job": FaBriefcase,
              "Schedule": FaClock,
              "Others": FaEllipsisH,
            };
            return iconMap[sectionName] || FaEllipsisH;
          };
          
          return sections.map((section, sectionIndex) => {
            const sectionCriteria = criteria.filter((c) => c.section === section);
            
            return (
              <Box key={section} mb={8}>
                {/* Section Header */}
                <Box
                  bg="blue.50"
                  borderLeft="4px"
                  borderColor="blue.500"
                  p={4}
                  borderRadius="md"
                  mb={4}
                >
                  <HStack justify="space-between">
                    <HStack spacing={3}>
                      <Icon as={getSectionIcon(section)} color="blue.600" boxSize={6} />
                      <Box>
                        <Text fontSize="xs" color="blue.600" fontWeight="bold" textTransform="uppercase" letterSpacing="wide">
                          Section {sectionIndex + 1} of {sections.length}
                        </Text>
                        <Heading size="md" color="blue.700" mt={1}>
                          {section}
                        </Heading>
                      </Box>
                    </HStack>
                    <Badge colorScheme="blue" fontSize="sm">
                      {sectionCriteria.length} {sectionCriteria.length === 1 ? 'question' : 'questions'}
                    </Badge>
                  </HStack>
                </Box>

                {/* Section Criteria */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {sectionCriteria.map((criterion) => {
                    const answer = answers[criterion.id] || {
                      weight: 0,
                      scoreA: 0,
                      scoreB: 0,
                      notApplicable: false,
                    };
                    const isComplete =
                      answer.notApplicable || (answer.weight > 0 && ((answer.scoreA ?? 0) > 0 || (answer.scoreB ?? 0) > 0));

                    return (
                      <Card 
                        key={criterion.id} 
                        bg={cardBg} 
                        border="1px" 
                        borderColor={borderColor}
                        cursor="pointer"
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
                            left={2}
                            fontSize="xs"
                            color="blue.600"
                            fontWeight="medium"
                            _hover={{ color: "blue.700" }}
                          >
                            Edit
                          </Text>
                          <VStack align="stretch" spacing={3} pt={4}>
                            <Heading size="sm" color="gray.800">
                              {criterion.name}
                            </Heading>

                            {isComplete ? (
                              answer.notApplicable ? (
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
                                    <HStack spacing={2} pl={7} mt={1}>
                                      <Badge colorScheme="orange" fontSize="xs">
                                        {jobAName}: N/A
                                      </Badge>
                                      <Badge colorScheme="orange" fontSize="xs">
                                        {jobBName}: N/A
                                      </Badge>
                                    </HStack>
                                  </VStack>
                                </Box>
                              ) : (
                                <>
                                  <HStack spacing={2}>
                                    <Icon as={FaCheckCircle} color="green.500" boxSize={4} />
                                    <Text fontSize="sm" color="gray.600">
                                      <strong>Importance:</strong> {answer.weight}/5
                                    </Text>
                                  </HStack>
                                  <Text fontSize="sm" color="gray.600">
                                    <strong>{jobAName}:</strong> {answer.scoreA}/5
                                  </Text>
                                  <Text fontSize="sm" color="gray.600">
                                    <strong>{jobBName}:</strong> {answer.scoreB}/5
                                  </Text>
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
                
                {sectionIndex < sections.length - 1 && <Divider mt={6} />}
              </Box>
            );
          });
        })()}

        <Box textAlign="center">
          <VStack spacing={4}>
            {notApplicableStats.percentage > 30 && (
              <Alert status="error" maxW="800px" mx="auto">
                <Icon as={FaExclamationTriangle} mr={3} />
                <Box>
                  <Text fontWeight="bold">
                    Cannot Calculate Results
                  </Text>
                  <Text fontSize="sm">
                    {notApplicableStats.count} out of {notApplicableStats.total} questions ({notApplicableStats.percentage.toFixed(1)}%) are marked as "Not Applicable". 
                    Please ensure at least 70% of questions are answered to calculate results.
                  </Text>
                </Box>
              </Alert>
            )}
            <Button
              onClick={handleSubmit}
              colorScheme="blue"
              size="lg"
              isDisabled={!allAnswered || notApplicableStats.percentage > 30 || saving}
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
