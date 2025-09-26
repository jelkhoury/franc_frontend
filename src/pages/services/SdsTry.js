import React, { useEffect, useMemo, useState, useContext } from "react";
import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Divider,
  Spinner,
  Text,
  useColorModeValue,
  useToast,
  VStack,
  Alert,
  AlertIcon,
  Progress,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { WarningIcon } from "@chakra-ui/icons";

import confetti from "canvas-confetti";

import QuestionField from "../../components/QuestionField";
import { AuthContext } from "../../components/AuthContext";
import { getStoredUserId } from "../../utils/tokenUtils";

/**
 * SDS Try page
 * Fetches SDS sections + questions from /api/Sds/sections and renders them.
 * - Supports single choice (type=1) and multi choice (type=2)
 * - Captures answers in local state { [questionId]: value | value[] }
 * - Provides a Submit button (console.logs payload) – wire to your API as needed
 */
const SdsTry = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const navigate = useNavigate();
  const baseUrl = useMemo(() => process.env.REACT_APP_API_BASE_URL || "http://localhost:5121", []);

  const sectionThemes = {
  "Occupational Day Dreams": { color: "#6B46C1", scheme: "purple", bg: "paint", bgFile: "/assets/images/nnnoise.svg" },
  "Activities":              { color: "#0D9488", scheme: "teal",   bg: "dots",  bgFile: "/assets/images/sds_bg.svg" },
  "Competencies":            { color: "#2563EB", scheme: "blue",   bg: "paint", bgFile: "/assets/images/ssspot.svg" },
  "Occupations":             { color: "#F59E0B", scheme: "orange", bg: "dots",  bgFile: "/assets/images/cccoil.svg" },
  "Self-Estimates":          { color: "#EF4444", scheme: "red",    bg: "paint", bgFile: "/assets/images/bg-selfestimates.svg" },
};
  const svgPaint = (hex) => {
    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 300'>
        <defs>
          <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
            <stop offset='0%' stop-color='${hex}' stop-opacity='0.10'/>
            <stop offset='100%' stop-color='${hex}' stop-opacity='0.03'/>
          </linearGradient>
          <filter id='f'>
            <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/>
            <feColorMatrix type='saturate' values='0.2'/>
            <feComponentTransfer><feFuncA type='table' tableValues='0 0.35'/></feComponentTransfer>
          </filter>
        </defs>
        <rect width='100%' height='100%' fill='url(#g)'/>
        <rect width='100%' height='100%' filter='url(#f)' fill='${hex}' opacity='0.18'/>
      </svg>`;
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  };

  const svgDots = (hex) => {
    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>
        <circle cx='4' cy='4' r='2' fill='${hex}' fill-opacity='0.22'/>
      </svg>`;
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  };

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [sections, setSections] = useState([]);
  const [answers, setAnswers] = useState({});
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [riasecValidationErrors, setRiasecValidationErrors] = useState({});

  const toast = useToast();

  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");

  // Browser back button warning handlers
  const handleExitConfirm = () => {
    setShowExitWarning(false);
    navigate("/self-directed-search");
  };

  const handleExitCancel = () => {
    setShowExitWarning(false);
  };

  const totalQs = sections.reduce((sum, s) => sum + ((s.questions || []).length), 0);
  const answered = Object.keys(answers).length;

  // Check if all questions are answered
  const isAllQuestionsAnswered = () => {
    return sections.every(section => 
      (section.questions || []).every(q => {
        const answer = answers[q.id];
        if (q.type === 5) {
          // Text questions need non-empty text
          return answer && answer.toString().trim().length > 0;
        } else if (q.type === 2) {
          // Multi-select questions need at least one selection
          return Array.isArray(answer) && answer.length > 0;
        } else {
          // Single select, slider, etc.
          return answer !== null && answer !== undefined && answer !== "";
        }
      })
    );
  };

  const allAnswered = isAllQuestionsAnswered();

  // Check if a specific question is answered
  const isQuestionAnswered = (question) => {
    const answer = answers[question.id];
    if (question.type === 5) {
      // Text questions need non-empty text
      return answer && answer.toString().trim().length > 0;
    } else if (question.type === 2) {
      // Multi-select questions need at least one selection
      return Array.isArray(answer) && answer.length > 0;
    } else {
      // Single select, slider, etc.
      return answer !== null && answer !== undefined && answer !== "";
    }
  };

  const riasecMeta = {
    Realistic: { emoji: "🛠️", color: "teal" },
    Investigative: { emoji: "🧪", color: "purple" },
    Artistic: { emoji: "🎨", color: "pink" },
    Social: { emoji: "🤝", color: "green" },
    Enterprising: { emoji: "🚀", color: "orange" },
    Conventional: { emoji: "📊", color: "blue" },
  };

  const progressPct = totalQs > 0 ? Math.round((answered / totalQs) * 100) : 0;

  // Validation function for RIASEC personality traits question
  const validateRiasecInput = (questionText, inputValue) => {
    const riasecQuestionText = "From the RIASEC videos, list your top three personality traits ranked from most dominant to least";
    
    if (questionText && questionText.includes(riasecQuestionText)) {
      if (!inputValue || typeof inputValue !== 'string') {
        return "Please enter your top 3 RIASEC personality traits";
      }
      
      const trimmedValue = inputValue.trim().toUpperCase();
      
      // Check if exactly 3 characters
      if (trimmedValue.length !== 3) {
        return "Please enter exactly 3 letters (e.g., RIA, SEC, AIR)";
      }
      
      // Check if all characters are valid RIASEC letters
      const validLetters = ['R', 'I', 'A', 'S', 'E', 'C'];
      const invalidChars = [];
      
      for (let i = 0; i < trimmedValue.length; i++) {
        if (!validLetters.includes(trimmedValue[i])) {
          invalidChars.push(trimmedValue[i]);
        }
      }
      
      if (invalidChars.length > 0) {
        return `Invalid characters: ${invalidChars.join(', ')}. Only use letters: R, I, A, S, E, C`;
      }
      
      // Check for duplicates
      const uniqueChars = [...new Set(trimmedValue.split(''))];
      if (uniqueChars.length !== 3) {
        return "Each letter should appear only once. Use 3 different RIASEC letters: R, I, A, S, E, C";
      }
      
      return null; // Valid input
    }
    
    return null; // Not a RIASEC question, no validation needed
  };

  const earnedBadges = [];
  if (answered > 0) earnedBadges.push({ label: "Getting Started", icon: "✨" });
  if (answered >= Math.ceil(totalQs / 2) && totalQs > 0) earnedBadges.push({ label: "Halfway", icon: "🧭" });
  if (answered === totalQs && totalQs > 0) earnedBadges.push({ label: "Finisher", icon: "🎖️" });

  useEffect(() => {
    const fetchSections = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${baseUrl}/api/Sds/sections`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setSections(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    fetchSections();
  }, [baseUrl]);

  // Browser back button and page unload warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "Are you sure you want to leave? Your answers will be lost and the test will be incomplete.";
      return "Are you sure you want to leave? Your answers will be lost and the test will be incomplete.";
    };

    const handlePopState = (e) => {
      e.preventDefault();
      setShowExitWarning(true);
      // Push the current state back to prevent navigation
      window.history.pushState(null, "", window.location.href);
    };

    // Add event listeners
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    
    // Push initial state to enable popstate detection
    window.history.pushState(null, "", window.location.href);

    // Cleanup
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);


  const handleSubmit = async () => {
    // Check for RIASEC validation errors
    const hasRiasecErrors = Object.values(riasecValidationErrors).some(error => error !== null);
    if (hasRiasecErrors) {
      toast({
        title: "Invalid RIASEC Input",
        description: "Please fix the RIASEC validation errors before submitting.",
        status: "error",
        duration: 5000,
        isClosable: true
      });
      return;
    }

    // Show validation errors if not all questions are answered
    if (!allAnswered) {
      setShowValidationErrors(true);
      toast({
        title: "Incomplete Assessment",
        description: "Please answer all questions before submitting.",
        status: "warning",
        duration: 5000,
        isClosable: true
      });
      return;
    }

    await performSubmission();
  };

  const handleTestSubmit = async () => {
    // Skip validation for testing purposes
    await performSubmission();
  };

  const performSubmission = async () => {
    const userId = 1;
    setSubmitting(true);

    const typeMap = {};
    sections.forEach(s => {
      (s.questions || []).forEach(q => {
        typeMap[q.id] = q.type;
      });
    });

    const responses = Object.entries(answers).map(([qid, val]) => {
      const questionId = Number(qid);
      const qType = typeMap[questionId];

      let selectedValue = null;
      let customAnswer = null;

      // Debug logging for faculty question
      if (questionId === 364) {
        console.log("Processing faculty question (ID 364) in submission:");
        console.log("Question type:", qType);
        console.log("Raw value:", val);
      }

      if (qType === 5) {
        const text = (val ?? "").toString().trim();
        customAnswer = text.length ? text : null;
      } else if (Array.isArray(val)) {
        selectedValue = val.join(",");
      } else {
        selectedValue = val != null ? String(val) : null;
      }

      // Debug logging for faculty question
      if (questionId === 364) {
        console.log("Faculty question processed:");
        console.log("selectedValue:", selectedValue);
        console.log("customAnswer:", customAnswer);
      }

      return { questionId, selectedValue, customAnswer };
    });

    const missingText = responses
      .filter(r => typeMap[r.questionId] === 5 && (!r.customAnswer || !r.customAnswer.trim()))
      .map(r => r.questionId);

    if (missingText.length > 0) {
      toast({
        title: "Missing text answers",
        description: `These questions need text: ${missingText.join(", ")}`,
        status: "warning",
        duration: 6000,
        isClosable: true
      });
      setSubmitting(false);
      return;
    }

    const payload = { userId: Number(userId), responses };

    // Debug logging for faculty question in final payload
    const facultyResponse = responses.find(r => r.questionId === 364);
    console.log("Faculty response in final payload:", facultyResponse);
    console.log("All responses in payload:", responses);

    // Save original responses before they get overwritten by backend response
    const originalResponses = [...responses];

    try {
      const response = await fetch(`${baseUrl}/api/Sds/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

// Read raw so we can handle string or JSON from backend
const raw = await response.text();
if (!response.ok) throw new Error(raw || `HTTP ${response.status}`);

let data;
try { data = JSON.parse(raw); } catch { data = raw; }

// ---- Normalize to ALWAYS have a string code and an array of responses ----
let code = null;
let responses = [];

// Cases handled:
// - "RIA"
// - { hollandCode: "RIA" }
// - { message, hollandCode: { hollandCode: "RIA", responses: [...] } }
if (typeof data === "string") {
  code = data;
} else if (data && typeof data === "object") {
  if (typeof data.hollandCode === "string") {
    code = data.hollandCode;
  } else if (data.hollandCode && typeof data.hollandCode === "object") {
    code = data.hollandCode.hollandCode ?? null;
    responses = Array.isArray(data.hollandCode.responses) ? data.hollandCode.responses : [];
  }
}

// Fallbacks to keep UI stable
if (typeof code !== "string") code = "";
if (!Array.isArray(responses)) responses = [];

// ---- Navigate with normalized shape ----
navigate("/self-directed-search/result", {
  state: {
    hollandCode: code,                 // always a string
    responses,                         // array (for Q265/Q266 if present)
    allResponses: originalResponses,  // Pass all original responses including faculty
    serverResponse: data,              // raw for debugging
    answeredCount: Object.keys(answers).length,
    submittedAt: new Date().toISOString()
  }
});

toast({
  title: "Submitted Successfully!",
  description: code ? `Your Holland code is: ${code}` : "Responses submitted.",
  status: "success",
  duration: 5000,
  isClosable: true
});

confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
// eslint-disable-next-line no-console
console.log("SDS response (normalized):", { code, responses, data });
    } catch (error) {
      console.error("Error submitting SDS responses:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit responses. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box minH="100vh" bgGradient="linear(to-r, white, #ebf8ff)">
      <Box maxW="1000px" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 6, md: 10 }}>
        <Heading textAlign="center" mb={{ base: 6, md: 8 }}>
          SDS Sections & Questions
        </Heading>
        <Alert status="info" variant="subtle" mb={4} rounded="md">
          <AlertIcon />
          <Text>🚀 Tip: Answer by instinct — there are no wrong choices.</Text>
        </Alert>
        {/* Progress & Badges */}
        <Box mb={6}>
          <Progress value={progressPct} rounded="full" size="sm" />
          <HStack mt={2} justify="space-between">
            <Text fontSize="sm" color="gray.600">{answered}/{totalQs} answered ({progressPct}%)</Text>
            <HStack spacing={2}>
              {earnedBadges.map((b, i) => (
                <Badge key={i}  variant="subtle">{b.icon} {b.label}</Badge>
              ))}
            </HStack>
          </HStack>
        </Box>

        {loading && (
          <HStack justify="center" py={10}>
            <Spinner size="lg" />
            <Text>Loading…</Text>
          </HStack>
        )}

        {error && (
          <Alert status="error" mb={6}>
            <AlertIcon /> Failed to load sections: {error}
          </Alert>
        )}

        {!loading && !error && (
          <Accordion allowMultiple>
            {sections.map((section) => {
              const theme = sectionThemes[section.name] || { color: "#6366F1", scheme: "purple", bg: "dots", bgFile: "/assets/images/nnnoise.svg" };
              const bgImage = theme.bg === "paint" ? svgPaint(theme.color) : svgDots(theme.color);

              return (
                  <AccordionItem
                    key={section.id}
                    border="1px"
                    borderColor={cardBorder}
                    rounded="md"
                    mb={4}
                    bg={cardBg}
                    boxShadow={`0 0 0 1px rgba(0,0,0,0.03), 0 6px 20px -8px ${theme.color}40`}
                  >
                  <h2>
                    <AccordionButton py={5} px={6}>
                      <Box as="span" flex="1" textAlign="left">
                        {(() => {
                          const meta = riasecMeta[section.name] || { emoji: "⭐" };
                          return (
                            <HStack>
                              <Badge colorScheme={theme.scheme}>{meta.emoji}</Badge>
                              <Text fontWeight="semibold" color={theme.color}>{section.name}</Text>
                            </HStack>
                          );
                        })()}
                        {section.description && (
                          <Text fontSize="sm" color={`${theme.color}cc`}>{section.description}</Text>
                        )}
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
<AccordionPanel
  pb={6}
  px={{ base: 4, md: 6 }}
  roundedBottom="md"
>
  {/* content with solid white bg */}
  <Box
    bg="white"
    rounded="md"
    p={4}
    boxShadow="sm"
    border="0.5px solid"
    borderColor={theme.color}
  >
    <VStack align="stretch" spacing={6}>
      {(section.questions || []).map((q, idx) => {
        const isAnswered = isQuestionAnswered(q);
        const showError = showValidationErrors && !isAnswered;
        return (
        <Box key={q.id}>
          <HStack spacing={2} mb={2}>
            <Text fontWeight="semibold" color={showError ? "red.500" : "inherit"}>
              {idx + 1}. {q.text}
            </Text>
            {showError && (
              <WarningIcon color="red.500" boxSize={4} />
            )}
          </HStack>
                     <QuestionField
             type={q.type}
             text=""
             value={q.type === 4 ? (() => {
             
               if (answers[q.id]) {
                 const option = q.answerOptions.find(opt => opt.value === answers[q.id]);
                 return option ? Number(option.text) : 1;
               }
               return 1; 
             })() : answers[q.id]}
             options={(q.answerOptions || []).map(opt => ({
               id: opt.id,
               text: opt.text,
               value: String(opt.value),
             }))}
             onChange={(val) => {
              
               if (q.type === 4) { 
                 
                 const sliderValue = Math.max(1, Math.min(7, Math.round(val))); 
                 const selectedOption = q.answerOptions.find(opt => opt.text === String(sliderValue));
                 setAnswers((prev) => ({ ...prev, [q.id]: selectedOption ? selectedOption.value : null }));
               } else {
                 // Log faculty question selection
                 if (q.id === 364) {
                   console.log("Faculty question (ID 364) answered!");
                   console.log("Question text:", q.text);
                   console.log("Selected value:", val);
                   console.log("Available options:", q.answerOptions);
                   
                   // Find the selected option details
                   const selectedOption = q.answerOptions.find(opt => String(opt.value) === String(val));
                   console.log("Selected option details:", selectedOption);
                 }
                 
                 // Validate RIASEC input for specific question
                 const validationError = validateRiasecInput(q.text, val);
                 
                 // Update validation errors
                 setRiasecValidationErrors((prev) => ({
                   ...prev,
                   [q.id]: validationError
                 }));
                 
                 setAnswers((prev) => ({ ...prev, [q.id]: val }));
               }
             }}
             sliderProps={{
               min: 1,
               max: 7,
               step: 1
             }}
             highlightColor={theme.color}
             colorScheme={theme.scheme}
           />
          {/* RIASEC Validation Error Display */}
          {riasecValidationErrors[q.id] && (
            <Alert status="error" mt={2} size="sm">
              <AlertIcon />
              <Text fontSize="sm">{riasecValidationErrors[q.id]}</Text>
            </Alert>
          )}
          <Divider mt={4} />
        </Box>
        );
      })}
    </VStack>
  </Box>
</AccordionPanel>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        {!loading && !error && sections.length > 0 && (
          <Box textAlign="center">
            <VStack spacing={4}>
              <Button 
                colorScheme="blue" 
                size="lg" 
                mt={6} 
                onClick={handleSubmit}
                isLoading={submitting}
                loadingText="Submitting..."
                disabled={submitting}
              >
                Submit
              </Button>
              
              {/* Test Submit Button - for testing purposes */}
              <Button 
                colorScheme="orange" 
                size="md" 
                variant="outline"
                onClick={handleTestSubmit}
                isLoading={submitting}
                loadingText="Submitting..."
                disabled={submitting}
              >
                Submit Test (Skip Validation)
              </Button>
            </VStack>
          </Box>
        )}

        {/* Exit Warning Modal */}
        <Modal isOpen={showExitWarning} onClose={handleExitCancel} isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader color="red.500">
              ⚠️ Warning: Leaving Test
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Alert status="error" mb={4}>
                <AlertIcon />
                <Text fontWeight="bold">Your answers will be lost!</Text>
              </Alert>
              
              <VStack align="stretch" spacing={4}>
                <Text>
                  You are about to leave the SDS assessment. If you continue:
                </Text>
                
                <VStack align="stretch" spacing={2}>
                  <Text>• <strong>All your answers will be deleted</strong></Text>
                  <Text>• <strong>The test will be marked as incomplete</strong></Text>
                  <Text>• <strong>You'll need to start over from the beginning</strong></Text>
                </VStack>
                
                <Alert status="warning" mt={4}>
                  <AlertIcon />
                  <Text fontSize="sm">
                    <strong>Progress:</strong> You have answered {answered} out of {totalQs} questions ({progressPct}% complete).
                  </Text>
                </Alert>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={handleExitCancel}>
                Stay and Continue
              </Button>
              <Button colorScheme="red" onClick={handleExitConfirm}>
                Leave Anyway
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Box>
  );
};

export default SdsTry;