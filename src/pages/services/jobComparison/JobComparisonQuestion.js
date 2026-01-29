import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Box,
  Heading,
  VStack,
  HStack,
  Button,
  Text,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Checkbox,
  Icon,
  Badge,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import { FaBan, FaExclamationTriangle, FaInfoCircle, FaArrowLeft, FaArrowRight, FaCheckCircle, FaDollarSign, FaGift, FaBuilding, FaBriefcase, FaClock, FaEllipsisH, FaTimesCircle, FaQuestionCircle } from "react-icons/fa";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { get, post } from "../../../utils/httpServices";
import { JOB_COMPARISON_ENDPOINTS } from "../../../services/apiService";
import ProgressBar from "./components/ProgressBar";
import SideBySideComparison from "./components/SideBySideComparison";
import QuickSummaryCard from "./components/QuickSummaryCard";

const JobComparisonQuestion = () => {
  const { criterionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [criteria, setCriteria] = useState([]);
  const [jobAName, setJobAName] = useState("");
  const [jobBName, setJobBName] = useState("");
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [jobComparisonId, setJobComparisonId] = useState(0);
  const [saving, setSaving] = useState(false);
  const answersRef = useRef({});
  const lastSavedAnswersRef = useRef(null); // snapshot of what we last sent / what backend has
  const { isOpen: isLeaveModalOpen, onOpen: openLeaveModal, onClose: closeLeaveModal } = useDisclosure();
  const leaveModalCancelRef = useRef(null);
  const isLeavingRef = useRef(false);

  const currentCriterionId = parseInt(criterionId);
  const currentIndex = criteria.findIndex((c) => c.id === currentCriterionId);
  const criterion = criteria[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === criteria.length - 1;

  // Get current section and section info
  const currentSection = criterion?.section || "";
  const sectionCriteria = criteria.filter((c) => c.section === currentSection);
  const sectionIndex = sectionCriteria.findIndex((c) => c.id === currentCriterionId);
  const isFirstInSection = sectionIndex === 0;
  const isLastInSection = sectionIndex === sectionCriteria.length - 1;
  
  // Get all sections
  const sections = [...new Set(criteria.map((c) => c.section).filter(Boolean))];
  const currentSectionIndex = sections.indexOf(currentSection);

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
    return iconMap[sectionName] || FaInfoCircle;
  };

  const [weight, setWeight] = useState(1); // Weight is 1-5 (cannot be 0)
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [notApplicable, setNotApplicable] = useState(false);

  const cardBg = useColorModeValue("white", "gray.800");

  // Load data from location state, or restore from check when state is empty (refresh / new tab)
  useEffect(() => {
    if (location.state?.criteria?.length) {
      setJobAName(location.state.jobAName || "");
      setJobBName(location.state.jobBName || "");
      setCriteria(location.state.criteria);
      setJobComparisonId(location.state.jobComparisonId || 0);
      if (location.state.answers) {
        const init = location.state.answers;
        setAnswers(init);
        answersRef.current = init;
        lastSavedAnswersRef.current = Object.keys(init).reduce((acc, id) => {
          const a = init[id];
          acc[id] = { weight: a?.weight ?? 0, scoreA: a?.scoreA ?? 0, scoreB: a?.scoreB ?? 0, notApplicable: !!a?.notApplicable };
          return acc;
        }, {});
      } else {
        lastSavedAnswersRef.current = {};
      }
      setLoading(false);
      return;
    }

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
        const rawAnswers = result.criterionAnswers ?? result.answers ?? result.CriterionAnswers ?? [];
        const answersMap = Array.isArray(rawAnswers)
          ? rawAnswers.reduce((acc, a) => {
              const id = a.criterionId ?? a.CriterionId ?? a.criterion_id;
              if (id == null) return acc;
              acc[id] = {
                weight: a.weight ?? a.Weight ?? 0,
                scoreA: a.scoreA ?? a.ScoreA ?? a.score_a ?? 0,
                scoreB: a.scoreB ?? a.ScoreB ?? a.score_b ?? 0,
                notApplicable: !!(a.notApplicable ?? a.NotApplicable ?? a.not_applicable),
              };
              return acc;
            }, {})
          : { ...rawAnswers };
        if (cancelled) return;
        const idFromUrl = parseInt(criterionId, 10);
        const stateForNav = {
          jobAName: result.jobAName ?? result.JobAName ?? "",
          jobBName: result.jobBName ?? result.JobBName ?? "",
          criteria: criteriaList,
          answers: answersMap,
          jobComparisonId: result.id ?? result.Id,
        };
        if (!criteriaList.some((c) => c.id === idFromUrl)) {
          const first = criteriaList[0];
          if (first) {
            navigate(`/job-comparison/question/${first.id}`, { replace: true, state: stateForNav });
          } else {
            navigate("/job-comparison/setup", { replace: true });
          }
          return;
        }
        setJobAName(stateForNav.jobAName);
        setJobBName(stateForNav.jobBName);
        setCriteria(criteriaList);
        setAnswers(answersMap);
        answersRef.current = answersMap;
        lastSavedAnswersRef.current = Object.keys(answersMap).reduce((acc, id) => {
          const a = answersMap[id];
          acc[id] = { weight: a?.weight ?? 0, scoreA: a?.scoreA ?? 0, scoreB: a?.scoreB ?? 0, notApplicable: !!a?.notApplicable };
          return acc;
        }, {});
        setJobComparisonId(stateForNav.jobComparisonId);
      } catch (e) {
        if (!cancelled) {
          console.warn("Restore question from API failed:", e);
          navigate("/job-comparison/setup", { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    restore();
    return () => { cancelled = true; };
  }, [location.state, navigate, criterionId]);

  // Update local state when criterionId changes
  useEffect(() => {
    if (criterion && criterion.id) {
      const answer = answersRef.current[criterion.id] || { weight: 1, scoreA: 0, scoreB: 0, notApplicable: false };
      setWeight(typeof answer.weight === "number" && answer.weight >= 1 ? answer.weight : 1);
      setScoreA(typeof answer.scoreA === "number" ? answer.scoreA : 0);
      setScoreB(typeof answer.scoreB === "number" ? answer.scoreB : 0);
      setNotApplicable(!!answer.notApplicable);
    }
  }, [criterionId, criterion?.id]); // Only depend on criterionId

  // Persist current criterion to answers whenever sliders or N/A change (including when both scores are 0).
  useEffect(() => {
    if (!criterion || !criterion.id) return;
    const currentAnswer = answersRef.current[criterion.id];
    const next = notApplicable
      ? { weight: 0, scoreA: 0, scoreB: 0, notApplicable: true }
      : { weight, scoreA, scoreB, notApplicable: false };
    if (
      !currentAnswer ||
      currentAnswer.weight !== next.weight ||
      currentAnswer.scoreA !== next.scoreA ||
      currentAnswer.scoreB !== next.scoreB ||
      currentAnswer.notApplicable !== next.notApplicable
    ) {
      const newAnswers = { ...answersRef.current, [criterion.id]: next };
      answersRef.current = newAnswers;
      setAnswers(newAnswers);
    }
  }, [weight, scoreA, scoreB, notApplicable, criterion?.id]);

  // Handle Not Applicable checkbox change
  const handleNotApplicableChange = (e) => {
    const checked = e.target.checked;
    setNotApplicable(checked);
    if (checked) {
      // When checked, disable sliders by resetting values
      setWeight(0);
      setScoreA(0);
      setScoreB(0);
    } else {
      const answer = answersRef.current[criterion?.id];
      if (answer && !answer.notApplicable) {
        setWeight(typeof answer.weight === "number" && answer.weight >= 1 ? answer.weight : 1);
        setScoreA(typeof answer.scoreA === "number" ? answer.scoreA : 0);
        setScoreB(typeof answer.scoreB === "number" ? answer.scoreB : 0);
      } else {
        setWeight(1);
        setScoreA(0);
        setScoreB(0);
      }
    }
  };

  // Calculate percentage of Not Applicable answers
  const notApplicableStats = useMemo(() => {
    let notApplicableCount = 0;
    criteria.forEach((c) => {
      const answer = answersRef.current[c.id];
      if (answer && answer.notApplicable) {
        notApplicableCount++;
      }
    });
    const percentage = criteria.length > 0 ? (notApplicableCount / criteria.length) * 100 : 0;
    return { count: notApplicableCount, percentage, total: criteria.length };
  }, [criteria, answers]);

  const allAnswered = notApplicable || (weight > 0 && (scoreA > 0 || scoreB > 0));

  const isAnswerEqual = (a, b) => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return a.notApplicable === b.notApplicable &&
      (a.weight ?? 0) === (b.weight ?? 0) &&
      (a.scoreA ?? 0) === (b.scoreA ?? 0) &&
      (a.scoreB ?? 0) === (b.scoreB ?? 0);
  };

  // Save progress — send only new or changed answers compared to last saved
  const saveProgress = async (answersToSave) => {
    if (!jobAName || !jobBName) return jobComparisonId;
    const lastSaved = lastSavedAnswersRef.current || {};

    const idsToSend = criteria
      .filter((c) => {
        const current = answersToSave[c.id];
        if (current == null) return false;
        const last = lastSaved[c.id];
        if (last == null) return true;
        return !isAnswerEqual(current, last);
      })
      .map((c) => c.id);
    if (idsToSend.length === 0) return jobComparisonId;

    try {
      setSaving(true);
      const answersArray = idsToSend.map((id) => {
        const answer = answersToSave[id];
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
        isCompleted: false,
        answers: answersArray,
      };

      const response = await post(JOB_COMPARISON_ENDPOINTS.SAVE_COMPARISON, saveData);

      const nextLastSaved = { ...lastSaved };
      idsToSend.forEach((id) => {
        const a = answersToSave[id];
        nextLastSaved[id] = {
          weight: a.notApplicable ? 0 : (a.weight ?? 0),
          scoreA: a.notApplicable ? 0 : (a.scoreA ?? 0),
          scoreB: a.notApplicable ? 0 : (a.scoreB ?? 0),
          notApplicable: !!a.notApplicable,
        };
      });
      lastSavedAnswersRef.current = nextLastSaved;

      if (response.jobComparisonId && jobComparisonId === 0) {
        setJobComparisonId(response.jobComparisonId);
        return response.jobComparisonId;
      }
      return jobComparisonId || response.jobComparisonId;
    } catch (error) {
      console.error("Error saving progress:", error);
      return jobComparisonId;
    } finally {
      setSaving(false);
    }
  };

  // Flush current criterion into answers before saving (so Next/Previous/Review send it).
  const flushCurrentAndSave = async () => {
    if (criterion?.id != null) {
      const next = { ...answersRef.current, [criterion.id]: { weight, scoreA, scoreB, notApplicable } };
      answersRef.current = next;
      setAnswers(next);
    }
    return saveProgress(answersRef.current);
  };

  const handleNext = async () => {
    if (!allAnswered) return;
    const updatedId = await flushCurrentAndSave();
    const navigationState = {
      jobAName,
      jobBName,
      criteria,
      answers: answersRef.current,
      jobComparisonId: updatedId,
    };
    if (isLast) {
      navigate("/job-comparison/review", { state: navigationState });
    } else {
      const nextCriterion = criteria[currentIndex + 1];
      navigate(`/job-comparison/question/${nextCriterion.id}`, { state: navigationState });
    }
  };

  const handlePrevious = async () => {
    if (!isFirst) {
      const updatedId = await flushCurrentAndSave();
      const prevCriterion = criteria[currentIndex - 1];
      navigate(`/job-comparison/question/${prevCriterion.id}`, {
        state: {
          jobAName,
          jobBName,
          criteria,
          answers: answersRef.current,
          jobComparisonId: updatedId,
        },
      });
    }
  };

  const handleReviewClick = async () => {
    const updatedId = await flushCurrentAndSave();
    navigate("/job-comparison/review", {
      state: {
        jobAName,
        jobBName,
        criteria,
        answers: answersRef.current,
        jobComparisonId: updatedId,
      },
    });
  };

  // Reload/close: warn. Back/change URL: show Save or discard modal.
  useEffect(() => {
    if (loading || !criteria?.length) return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "Your progress may be lost. Save before leaving?";
      return e.returnValue;
    };
    const handlePopState = () => {
      if (isLeavingRef.current) return;
      window.history.pushState(null, "", window.location.href);
      openLeaveModal();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    window.history.pushState(null, "", window.location.href);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [loading, criteria?.length, openLeaveModal]);

  const handleLeaveSaveAndLeave = async () => {
    isLeavingRef.current = true;
    closeLeaveModal();
    await flushCurrentAndSave();
    window.history.back();
  };
  const handleLeaveDiscard = () => {
    isLeavingRef.current = true;
    closeLeaveModal();
    window.history.back();
  };

  if (loading) {
    return (
      <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="blue.500" />
      </Box>
    );
  }

  if (!criterion) {
    return (
      <Box minH="100vh" bg="gray.50" py={8}>
        <Box maxW="800px" mx="auto" px={4}>
          <Alert status="error">
            <AlertIcon />
            Criterion not found. Please start over.
          </Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50" py={8}>
      <AlertDialog isOpen={isLeaveModalOpen} onClose={closeLeaveModal} leastDestructiveRef={leaveModalCancelRef}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Leave this page?
            </AlertDialogHeader>
            <AlertDialogBody>
              You're about to leave. Do you want to save your progress or discard your last changes?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={leaveModalCancelRef} onClick={closeLeaveModal}>
                Cancel
              </Button>
              <Button variant="outline" onClick={handleLeaveDiscard} ml={3}>
                Discard and leave
              </Button>
              <Button colorScheme="blue" onClick={handleLeaveSaveAndLeave} ml={3} isLoading={saving}>
                Save and leave
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      <Box maxW="1400px" mx="auto" px={6}>
        {/* Progress Bar */}
        <ProgressBar current={currentIndex + 1} total={criteria.length} />

        {/* Quick Summary Card */}
        <QuickSummaryCard
          criteria={criteria}
          answers={answers}
          jobAName={jobAName}
          jobBName={jobBName}
        />

        {/* Warning if >30% Not Applicable - Informational only, doesn't block navigation */}
        {notApplicableStats.percentage > 30 && (
          <Alert 
            status="warning" 
            borderRadius="xl" 
            mb={4}
            bg="orange.50"
            border="2px"
            borderColor="orange.300"
          >
            <Box display="flex" alignItems="start" w="100%">
              <Icon as={FaExclamationTriangle} mr={4} color="orange.500" boxSize={6} mt={1} />
              <Box flex={1}>
                <Text fontWeight="bold" fontSize="md" color="orange.700" mb={2}>
                  ⚠️ Results Calculation Will Be Blocked
                </Text>
                <VStack align="start" spacing={2}>
                  <Text fontSize="sm" color="orange.700">
                    {`You've marked ${notApplicableStats.count} out of ${notApplicableStats.total} questions (${notApplicableStats.percentage.toFixed(1)}%) as "Not Applicable".`}
                  </Text>
                  <Box
                    bg="orange.100"
                    p={2}
                    borderRadius="md"
                    w="100%"
                  >
                    <Text fontSize="sm" fontWeight="medium" color="orange.800">
                      💡 You can continue answering questions, but results cannot be calculated until at least 70% ({Math.ceil(notApplicableStats.total * 0.7)} questions) are answered.
                    </Text>
                  </Box>
                  <Text fontSize="xs" color="orange.600" fontStyle="italic">
                    You can uncheck "Not Applicable" on some questions to provide ratings instead.
                  </Text>
                </VStack>
              </Box>
            </Box>
          </Alert>
        )}

        {/* Section Header */}
        {currentSection && (
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
                <Icon as={getSectionIcon(currentSection)} color="blue.600" boxSize={6} />
                <Box>
                  <Text fontSize="xs" color="blue.600" fontWeight="bold" textTransform="uppercase" letterSpacing="wide">
                    Section {currentSectionIndex + 1} of {sections.length}
                  </Text>
                  <Heading size="md" color="blue.700" mt={1}>
                    {currentSection}
                  </Heading>
                </Box>
              </HStack>
              <HStack spacing={2}>
                <Icon as={FaInfoCircle} color="blue.500" boxSize={4} />
                <Text fontSize="sm" color="blue.600" fontWeight="medium">
                  Question {sectionIndex + 1} of {sectionCriteria.length}
                </Text>
              </HStack>
            </HStack>
          </Box>
        )}

        {/* Question Card */}
        <Box bg={cardBg} rounded="xl" shadow="lg" p={8} mt={6}>
          <VStack spacing={6} align="stretch">
            {/* Question Title - Clear and Separate */}
            <Box mb={4}>
              <Heading size="xl" color="gray.800" mb={4}>
                {criterion.name}
              </Heading>
            </Box>

            {/* Question Explanation/Description - Clearly Separated */}
            {criterion.description && (
              <Box
                bg="blue.50"
                p={4}
                borderRadius="lg"
                borderLeft="4px"
                borderColor="blue.400"
                mb={2}
              >
                <HStack spacing={3} align="start">
                  <Icon as={FaInfoCircle} color="blue.500" boxSize={5} mt={0.5} flexShrink={0} />
                  <Box>
                    <Text fontSize="xs" color="blue.600" fontWeight="bold" textTransform="uppercase" letterSpacing="wide" mb={1}>
                      What this means:
                    </Text>
                    <Text color="gray.700" fontSize="sm" lineHeight="tall">
                      {criterion.description}
                    </Text>
                  </Box>
                </HStack>
              </Box>
            )}

            {/* Not Applicable Feature - More User Friendly */}
            <Box
              as="button"
              onClick={() => handleNotApplicableChange({ target: { checked: !notApplicable } })}
              p={5}
              border="2px"
              borderStyle="dashed"
              borderColor={notApplicable ? "orange.400" : "gray.300"}
              borderRadius="xl"
              bg={notApplicable ? "orange.50" : "gray.50"}
              _hover={{
                bg: notApplicable ? "orange.100" : "gray.100",
                borderColor: notApplicable ? "orange.500" : "gray.400",
              }}
              transition="all 0.2s"
              cursor="pointer"
              w="100%"
            >
              <VStack spacing={3} align="stretch">
                <HStack spacing={3} justify="space-between">
                  <HStack spacing={3}>
                    <Box
                      w="24px"
                      h="24px"
                      borderRadius="full"
                      border="2px"
                      borderColor={notApplicable ? "orange.500" : "gray.400"}
                      bg={notApplicable ? "orange.500" : "transparent"}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      transition="all 0.2s"
                    >
                      {notApplicable && (
                        <Icon as={FaCheckCircle} color="white" boxSize={4} />
                      )}
                    </Box>
                    <VStack align="start" spacing={0}>
                      <HStack spacing={2}>
                        <Icon 
                          as={notApplicable ? FaBan : FaQuestionCircle} 
                          color={notApplicable ? "orange.600" : "gray.600"} 
                          boxSize={5} 
                        />
                        <Text fontWeight="bold" fontSize="md" color={notApplicable ? "orange.700" : "gray.700"}>
                          This doesn't apply to either job
                        </Text>
                      </HStack>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Click to mark this criterion as not applicable
                      </Text>
                    </VStack>
                  </HStack>
                  {notApplicable && (
                    <Badge colorScheme="orange" fontSize="sm" px={3} py={1}>
                      N/A
                    </Badge>
                  )}
                </HStack>
                
                {notApplicable && (
                  <Box
                    mt={2}
                    p={3}
                    bg="orange.100"
                    borderRadius="md"
                    borderLeft="3px"
                    borderColor="orange.500"
                  >
                    <HStack spacing={2} align="start">
                      <Icon as={FaInfoCircle} color="orange.600" boxSize={4} mt={0.5} />
                      <VStack align="start" spacing={1}>
                        <Text fontSize="sm" fontWeight="medium" color="orange.800">
                          Both jobs will be excluded from scoring for this criterion
                        </Text>
                        <Text fontSize="xs" color="orange.700">
                          You can uncheck this box anytime to provide ratings instead
                        </Text>
                      </VStack>
                    </HStack>
                  </Box>
                )}
              </VStack>
            </Box>

            {/* Side-by-Side Comparison */}
            {!notApplicable && (
              <SideBySideComparison
                criterion={criterion}
                jobAName={jobAName}
                jobBName={jobBName}
                weight={weight}
                scoreA={scoreA}
                scoreB={scoreB}
                onWeightChange={setWeight}
                onScoreAChange={setScoreA}
                onScoreBChange={setScoreB}
              />
            )}

            {notApplicable && (
              <Box
                p={8}
                pt={12}
                bg="gradient-to-br"
                bgGradient="linear(to-br, orange.50, yellow.50)"
                borderRadius="xl"
                textAlign="center"
                border="2px dashed"
                borderColor="orange.300"
                position="relative"
              >
                <Badge
                  position="absolute"
                  top={4}
                  right={4}
                  bg="orange.500"
                  color="white"
                  px={4}
                  py={2}
                  borderRadius="md"
                  fontSize="xs"
                  fontWeight="bold"
                  textTransform="uppercase"
                  letterSpacing="wide"
                  boxShadow="md"
                >
                  NOT APPLICABLE
                </Badge>
                
                <VStack spacing={4}>
                  <Box
                    bg="white"
                    borderRadius="full"
                    p={4}
                    boxShadow="md"
                  >
                    <Icon as={FaBan} boxSize={10} color="orange.500" />
                  </Box>
                  
                  <VStack spacing={2}>
                    <Text color="orange.800" fontWeight="bold" fontSize="lg">
                      This Criterion is Not Applicable
                    </Text>
                    <Text fontSize="sm" color="orange.700" maxW="400px">
                      {`Both ${jobAName} and ${jobBName} will be marked as "Not Applicable" for this criterion and excluded from the comparison score.`}
                    </Text>
                  </VStack>
                  
                  <Box
                    mt={2}
                    p={3}
                    bg="white"
                    borderRadius="md"
                    border="1px"
                    borderColor="orange.200"
                    maxW="300px"
                  >
                    <HStack spacing={4} justify="center">
                      <VStack spacing={1}>
                        <Text fontSize="xs" color="gray.600">Job A</Text>
                        <Badge colorScheme="orange" fontSize="sm">N/A</Badge>
                      </VStack>
                      <Text fontSize="sm" color="gray.400">vs</Text>
                      <VStack spacing={1}>
                        <Text fontSize="xs" color="gray.600">Job B</Text>
                        <Badge colorScheme="orange" fontSize="sm">N/A</Badge>
                      </VStack>
                    </HStack>
                  </Box>
                  
                  <Text fontSize="xs" color="orange.600" fontStyle="italic" mt={2}>
                    Click the box above to uncheck and provide ratings instead
                  </Text>
                </VStack>
              </Box>
            )}
          </VStack>
        </Box>

        {/* Navigation */}
        <HStack justify="space-between" mt={8}>
          <Button
            onClick={handlePrevious}
            isDisabled={isFirst || saving}
            isLoading={saving}
            loadingText="Saving..."
            variant="outline"
            size="lg"
            leftIcon={<Icon as={FaArrowLeft} />}
          >
            Previous
          </Button>
          <HStack spacing={4}>
            <Button
              onClick={handleReviewClick}
              isDisabled={saving}
              isLoading={saving}
              loadingText="Saving..."
              variant="outline"
              size="lg"
              leftIcon={<Icon as={FaCheckCircle} />}
            >
              Review Answers
            </Button>
            <Button
              onClick={handleNext}
              isDisabled={!allAnswered || saving}
              isLoading={saving}
              loadingText="Saving..."
              colorScheme="blue"
              size="lg"
              rightIcon={isLast ? <Icon as={FaCheckCircle} /> : <Icon as={FaArrowRight} />}
            >
              {isLast ? "Review Answers" : "Next"}
            </Button>
          </HStack>
        </HStack>
      </Box>
    </Box>
  );
};

export default JobComparisonQuestion;
