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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import { FaExclamationTriangle, FaInfoCircle, FaArrowLeft, FaArrowRight, FaCheckCircle, FaDollarSign, FaGift, FaBuilding, FaBriefcase, FaClock, FaEllipsisH, FaTimesCircle, FaBan, FaListUl } from "react-icons/fa";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { get, post } from "../../../utils/httpServices";
import { captureError } from "../../../utils/sentryUtils";
import { JOB_COMPARISON_ENDPOINTS } from "../../../services/apiService";
import ProgressBar from "./components/ProgressBar";
import SideBySideComparison from "./components/SideBySideComparison";

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
  const { isOpen: isCriteriaModalOpen, onOpen: openCriteriaModal, onClose: closeCriteriaModal } = useDisclosure();
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
  const [scoreA, setScoreA] = useState(1);
  const [scoreB, setScoreB] = useState(1);
  const [notApplicableA, setNotApplicableA] = useState(false);
  const [notApplicableB, setNotApplicableB] = useState(false);

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
          const na = !!a?.notApplicable;
          const naA = a?.notApplicableA ?? na;
          const naB = a?.notApplicableB ?? na;
          acc[id] = { weight: a?.weight ?? 0, scoreA: a?.scoreA ?? 0, scoreB: a?.scoreB ?? 0, notApplicable: naA && naB, notApplicableA: naA, notApplicableB: naB };
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
                notApplicableA: a.notApplicableA ?? !!(a.notApplicable ?? a.NotApplicable ?? a.not_applicable),
                notApplicableB: a.notApplicableB ?? !!(a.notApplicable ?? a.NotApplicable ?? a.not_applicable),
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
          const na = !!a?.notApplicable;
          const naA = a?.notApplicableA ?? na;
          const naB = a?.notApplicableB ?? na;
          acc[id] = { weight: a?.weight ?? 0, scoreA: a?.scoreA ?? 0, scoreB: a?.scoreB ?? 0, notApplicable: naA && naB, notApplicableA: naA, notApplicableB: naB };
          return acc;
        }, {});
      setJobComparisonId(stateForNav.jobComparisonId);
      } catch (e) {
        captureError(e);
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
      const answer = answersRef.current[criterion.id] || { weight: 1, scoreA: 1, scoreB: 1, notApplicable: false, notApplicableA: false, notApplicableB: false };
      const na = !!answer.notApplicable;
      const naA = answer.notApplicableA ?? na;
      const naB = answer.notApplicableB ?? na;
      setWeight(typeof answer.weight === "number" && answer.weight >= 1 ? answer.weight : 1);
      setScoreA(typeof answer.scoreA === "number" ? answer.scoreA : 1);
      setScoreB(typeof answer.scoreB === "number" ? answer.scoreB : 1);
      setNotApplicableA(!!naA);
      setNotApplicableB(!!naB);
    }
  }, [criterionId, criterion?.id]); // Only depend on criterionId

  // Persist current criterion to answers whenever sliders or N/A change (including when both scores are 0).
  useEffect(() => {
    if (!criterion || !criterion.id) return;
    const currentAnswer = answersRef.current[criterion.id];
    const next = {
      weight,
      scoreA: notApplicableA ? 0 : (scoreA < 1 ? 1 : scoreA),
      scoreB: notApplicableB ? 0 : (scoreB < 1 ? 1 : scoreB),
      notApplicable: notApplicableA && notApplicableB,
      notApplicableA,
      notApplicableB,
    };
    if (
      !currentAnswer ||
      currentAnswer.weight !== next.weight ||
      currentAnswer.scoreA !== next.scoreA ||
      currentAnswer.scoreB !== next.scoreB ||
      currentAnswer.notApplicableA !== next.notApplicableA ||
      currentAnswer.notApplicableB !== next.notApplicableB
    ) {
      const newAnswers = { ...answersRef.current, [criterion.id]: next };
      answersRef.current = newAnswers;
      setAnswers(newAnswers);
    }
  }, [weight, scoreA, scoreB, notApplicableA, notApplicableB, criterion?.id]);

  // Count and percentage of criteria answered (for progress bar: bar reflects how many answered, not which step)
  const { answeredCount } = useMemo(() => {
    const fromCheck = lastSavedAnswersRef.current || {};
    let answered = 0;
    criteria.forEach((c) => {
      const answer = answersRef.current[c.id] ?? fromCheck[c.id];
      const fromSaved = !!fromCheck[c.id];
      const naA = answer?.notApplicableA ?? answer?.notApplicable;
      const naB = answer?.notApplicableB ?? answer?.notApplicable;
      const bothNA = naA && naB;
      const sideAAnswered = naA || (fromSaved ? typeof answer?.scoreA === "number" : (answer && (answer.scoreA ?? 0) > 0));
      const sideBAnswered = naB || (fromSaved ? typeof answer?.scoreB === "number" : (answer && (answer.scoreB ?? 0) > 0));
      const hasScores = answer && answer.weight > 0 && sideAAnswered && sideBAnswered;
      if (bothNA || hasScores) answered++;
    });
    return { answeredCount: answered };
  }, [criteria, answers]);

  // Criteria list with status for "View All Criteria" modal: only show complete if we have an answer from check/API or real user input
  // From API: score 0 counts as answered. In-memory only: require score > 0 or N/A so default 0,0 doesn't show as complete
  const criteriaWithStatus = useMemo(() => {
    const fromCheck = lastSavedAnswersRef.current || {};
    return criteria.map((c) => {
      const answer = answersRef.current[c.id] ?? fromCheck[c.id];
      const fromSaved = !!fromCheck[c.id];
      const naA = answer?.notApplicableA ?? answer?.notApplicable;
      const naB = answer?.notApplicableB ?? answer?.notApplicable;
      const bothNA = naA && naB;
      const sideAAnswered = naA || (fromSaved ? typeof answer?.scoreA === "number" : (answer && (answer.scoreA ?? 0) > 0));
      const sideBAnswered = naB || (fromSaved ? typeof answer?.scoreB === "number" : (answer && (answer.scoreB ?? 0) > 0));
      const hasScores =
        answer &&
        answer.weight > 0 &&
        sideAAnswered &&
        sideBAnswered;
      const isComplete = bothNA || !!hasScores;
      const hasNA = naA || naB;
      return {
        criterion: c,
        isComplete,
        hasNA,
        naA: !!naA,
        naB: !!naB,
      };
    });
  }, [criteria, answers]);

  // Calculate percentage of Not Applicable (either job or both) answers — for >30% warning
  const notApplicableStats = useMemo(() => {
    let notApplicableCount = 0;
    criteria.forEach((c) => {
      const answer = answersRef.current[c.id];
      // Count if EITHER job A OR job B (or both) is marked as not applicable
      const hasNA = answer?.notApplicableA || answer?.notApplicableB || answer?.notApplicable;
      if (answer && hasNA) notApplicableCount++;
    });
    const percentage = criteria.length > 0 ? (notApplicableCount / criteria.length) * 100 : 0;
    return { count: notApplicableCount, percentage, total: criteria.length };
  }, [criteria, answers]);

  const allAnswered =
    (notApplicableA && notApplicableB) ||
    (weight > 0 && ((scoreA >= 1 || notApplicableA) && (scoreB >= 1 || notApplicableB)));

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
        isCompleted: false,
        answers: answersArray,
      };

      const response = await post(JOB_COMPARISON_ENDPOINTS.SAVE_COMPARISON, saveData);

      const nextLastSaved = { ...lastSaved };
      idsToSend.forEach((id) => {
        const a = answersToSave[id];
        const bothNA = a.notApplicableA && a.notApplicableB;
        nextLastSaved[id] = {
          weight: bothNA ? 0 : (a.weight ?? 0),
          scoreA: a.notApplicableA ? 0 : (a.scoreA ?? 0),
          scoreB: a.notApplicableB ? 0 : (a.scoreB ?? 0),
          notApplicable: !!bothNA,
          notApplicableA: !!a.notApplicableA,
          notApplicableB: !!a.notApplicableB,
        };
      });
      lastSavedAnswersRef.current = nextLastSaved;

      if (response.jobComparisonId && jobComparisonId === 0) {
        setJobComparisonId(response.jobComparisonId);
        return response.jobComparisonId;
      }
      return jobComparisonId || response.jobComparisonId;
    } catch (error) {
      captureError(error);
      console.error("Error saving progress:", error);
      return jobComparisonId;
    } finally {
      setSaving(false);
    }
  };

  // Flush current criterion into answers before saving (so Next/Previous/Review send it).
  const flushCurrentAndSave = async () => {
    if (criterion?.id != null) {
      const next = {
        ...answersRef.current,
        [criterion.id]: {
          weight,
          scoreA: notApplicableA ? 0 : (scoreA < 1 ? 1 : scoreA),
          scoreB: notApplicableB ? 0 : (scoreB < 1 ? 1 : scoreB),
          notApplicable: notApplicableA && notApplicableB,
          notApplicableA,
          notApplicableB,
        },
      };
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

  const handleCriteriaClick = (criterionId) => {
    if (criterionId === currentCriterionId) {
      closeCriteriaModal();
      return;
    }
    closeCriteriaModal();
    flushCurrentAndSave().then((updatedId) => {
      navigate(`/job-comparison/question/${criterionId}`, {
        state: {
          jobAName,
          jobBName,
          criteria,
          answers: answersRef.current,
          jobComparisonId: updatedId,
        },
      });
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
        {/* Progress: percentage left, step right + View All Criteria */}
        <Box mb={4}>
          <ProgressBar current={currentIndex + 1} total={criteria.length} answeredCount={answeredCount} />
          <HStack mt={2} justify="flex-end" align="center">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Icon as={FaListUl} />}
              onClick={openCriteriaModal}
              colorScheme="blue"
            >
              View All Criteria
            </Button>
          </HStack>
        </Box>

        {/* View All Criteria modal */}
        <Modal isOpen={isCriteriaModalOpen} onClose={closeCriteriaModal} size="md" scrollBehavior="inside">
          <ModalOverlay />
          <ModalContent maxH="85vh">
            <ModalHeader>
              <HStack spacing={2}>
                <Icon as={FaListUl} color="blue.500" />
                <span>All Criteria</span>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack align="stretch" spacing={1}>
                {criteriaWithStatus.map(({ criterion, isComplete, hasNA, naA, naB }) => {
                  const isCurrent = criterion.id === currentCriterionId;
                  const sectionIcon = getSectionIcon(criterion.section);
                  return (
                    <HStack
                      key={criterion.id}
                      p={2}
                      borderRadius="md"
                      bg={isCurrent ? "blue.50" : undefined}
                      borderWidth={isCurrent ? "1px" : 0}
                      borderColor="blue.300"
                      justify="space-between"
                      align="center"
                      spacing={3}
                      cursor="pointer"
                      _hover={{ bg: "gray.50" }}
                      onClick={() => handleCriteriaClick(criterion.id)}
                    >
                      <HStack spacing={2} flex={1} minW={0}>
                        {isComplete ? (
                          <Icon as={FaCheckCircle} color="green.500" boxSize={4} flexShrink={0} title="Complete" />
                        ) : (
                          <Icon as={FaTimesCircle} color="red.500" boxSize={4} flexShrink={0} title="Not completed" />
                        )}
                        <Icon as={sectionIcon} color="blue.500" boxSize={3.5} opacity={0.8} flexShrink={0} />
                        <Text fontSize="sm" noOfLines={1} title={capitalizeWords(criterion.name)}>
                          {capitalizeWords(criterion.name)}
                        </Text>
                        {isCurrent && (
                          <Badge colorScheme="blue" size="sm">
                            Current
                          </Badge>
                        )}
                      </HStack>
                      {hasNA && (
                        <Badge colorScheme="orange" fontSize="xs" flexShrink={0} title={naA && naB ? "Both jobs N/A" : naA ? `${jobAName} N/A` : `${jobBName} N/A`}>
                          <HStack spacing={1}>
                            <Icon as={FaBan} boxSize={2.5} />
                            <span>N/A</span>
                          </HStack>
                        </Badge>
                      )}
                    </HStack>
                  );
                })}
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Combined Section Header and Question Card */}
        <Box 
          bg={cardBg} 
          rounded="md"
          shadow="sm"
          mt={6}
          mb={4}
          border="1px solid"
          borderColor="gray.200"
          overflow="hidden"
        >
          <VStack spacing={0} align="stretch">
            {/* Section Header - styled like accordion button but always expanded */}
            {currentSection && (
              <Box
                bg="blue.50"
                borderLeft="4px"
                borderColor="blue.500"
                py={5}
                px={6}
                borderTopRadius="md"
              >
                <Heading size="lg" color="blue.700" fontWeight="semibold">
                  Section {currentSectionIndex + 1} of {sections.length} – {currentSection}
                </Heading>
              </Box>
            )}

            {/* Content area */}
            <Box bg="white" p={8} borderBottomRadius="md">
              <VStack spacing={6} align="stretch">
                {/* Criterion number, name, and definition on one row */}
                <Box mb={4}>
                  <HStack spacing={2} align="baseline" flexWrap="wrap" justify="space-between">
                    <HStack spacing={2} align="baseline" flexWrap="wrap">
                      <Heading size="md" color="gray.800">
                        {capitalizeWords(criterion.name)}
                      </Heading>
                      {criterion.description && (
                        <Text fontSize="sm" color="gray.500">
                          — {criterion.description}
                        </Text>
                      )}
                    </HStack>
                    <Text fontSize="sm" color="gray.600" fontWeight="medium">
                      Criterion {sectionIndex + 1} of {sectionCriteria.length}
                    </Text>
                  </HStack>
                </Box>

                {/* Side-by-Side Comparison — per-job Not applicable inside each job container */}
                <SideBySideComparison
                  criterion={criterion}
                  jobAName={jobAName}
                  jobBName={jobBName}
                  weight={weight}
                  scoreA={scoreA}
                  scoreB={scoreB}
                  notApplicableA={notApplicableA}
                  notApplicableB={notApplicableB}
                  onWeightChange={setWeight}
                  onScoreAChange={setScoreA}
                  onScoreBChange={setScoreB}
                  onNotApplicableAChange={(checked) => {
                    setNotApplicableA(!!checked);
                    if (checked) setScoreA(0);
                  }}
                  onNotApplicableBChange={(checked) => {
                    setNotApplicableB(!!checked);
                    if (checked) setScoreB(0);
                  }}
                  noticeAboveJobs={
                    notApplicableStats.percentage > 30 ? (
                      <Box mb={4} px={3} py={2} bg="orange.50" borderRadius="md" borderLeft="4px" borderColor="orange.400" w="100%">
                        <Text fontSize="sm" color="orange.800">
                          <strong>Note:</strong> {notApplicableStats.count} of {notApplicableStats.total} questions ({notApplicableStats.percentage.toFixed(0)}%) are &quot;Not applicable&quot;. This may affect the objective comparaison between the 2 job; you can still complete and calculate normally.
                        </Text>
                      </Box>
                    ) : null
                  }
                />
              </VStack>
            </Box>
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
