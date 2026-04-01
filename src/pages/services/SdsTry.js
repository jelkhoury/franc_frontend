import React, { useEffect, useMemo, useState, useContext, useRef, useCallback } from "react";
import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  Icon,
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
  List,
  ListItem,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { WarningIcon } from "@chakra-ui/icons";

import confetti from "canvas-confetti";

import QuestionField from "../../components/QuestionField";
import { AuthContext } from "../../components/AuthContext";
import { getStoredUserId } from "../../utils/tokenUtils";
import { get, post, del } from "../../utils/httpServices";
import { captureError } from "../../utils/sentryUtils";
import { SDS_ENDPOINTS } from "../../services/apiService";

const SDS_DRAFT_STORAGE_KEY = "sds_draft_answers";

const DEBOUNCE_TEXT_MS = 350;

/**
 * Wrapper for text/textarea that keeps local state so typing/deleting is instant;
 * syncs to parent after debounce or on blur. Avoids overwriting local state when
 * parent re-renders with stale value (e.g. from another question's update).
 */
/**
 * Stable per-question onChange so parent re-renders don't force this field to re-render.
 */
const DebouncedTextQuestionField = React.memo(function DebouncedTextQuestionField({
  value,
  question,
  onTextAnswerChange,
  ...rest
}) {
  const [localValue, setLocalValue] = useState(() => value ?? "");
  const debounceRef = useRef(null);
  const lastFlushedRef = useRef(value ?? "");

  const onChange = useCallback(
    (val) => onTextAnswerChange(question.id, question.text, val),
    [question.id, question.text, onTextAnswerChange]
  );

  useEffect(() => {
    const propVal = value ?? "";
    if (propVal === lastFlushedRef.current) return;
    lastFlushedRef.current = propVal;
    setLocalValue(propVal);
  }, [value]);

  const flushToParent = useCallback((val) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const trimmed = (val ?? "").toString().trim();
    const toSend = trimmed.length === 0 ? null : val;
    lastFlushedRef.current = val ?? "";
    onChange(toSend);
  }, [onChange]);

  const handleChange = useCallback((val) => {
    const next = val ?? "";
    setLocalValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => flushToParent(next), DEBOUNCE_TEXT_MS);
  }, [flushToParent]);

  const handleBlur = useCallback(() => {
    flushToParent(localValue);
  }, [localValue, flushToParent]);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  return (
    <QuestionField
      {...rest}
      type={question.type}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
});

/**
 * SDS Try page
 * Fetches SDS sections + questions from /api/sds/get-sections and renders them.
 * - Supports single choice (type=1) and multi choice (type=2)
 * - Captures answers in local state { [questionId]: value | value[] }
 * - Provides a Submit button (console.logs payload) – wire to your API as needed
 */
const SdsTry = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const navigate = useNavigate();

  const sectionThemes = {
    "Occupational Day Dreams": {
      color: "#6B46C1",
      scheme: "purple",
      bg: "paint",
      bgFile: "/assets/images/nnnoise.svg",
    },
    Activities: {
      color: "#0D9488",
      scheme: "teal",
      bg: "dots",
      bgFile: "/assets/images/sds_bg.svg",
    },
    Competencies: {
      color: "#2563EB",
      scheme: "blue",
      bg: "paint",
      bgFile: "/assets/images/ssspot.svg",
    },
    Occupations: {
      color: "#F59E0B",
      scheme: "orange",
      bg: "dots",
      bgFile: "/assets/images/cccoil.svg",
    },
    "Self-Estimates": {
      color: "#EF4444",
      scheme: "red",
      bg: "paint",
      bgFile: "/assets/images/bg-selfestimates.svg",
    },
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
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [pendingExistingAnswers, setPendingExistingAnswers] = useState(null);
  const [initialAnswersSnapshot, setInitialAnswersSnapshot] = useState({});
  const [checkingExistingAnswers, setCheckingExistingAnswers] = useState(true);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [riasecValidationErrors, setRiasecValidationErrors] = useState({});
  const [savingDraft, setSavingDraft] = useState(false);

  const toast = useToast();

  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");

  const getUserIdFromToken = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const tokenData = JSON.parse(atob(token.split(".")[1]));
      const userId = tokenData["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
      const id = parseInt(userId, 10);
      return isNaN(id) ? null : id;
    } catch (e) {
      captureError(e);
      return null;
    }
  };

  const normalizeAnswerForCompare = (val) => {
    if (val == null) return "";
    if (Array.isArray(val)) return [...val].sort().join(",");
    return String(val).trim();
  };

  const buildResponsesPayload = (answersObj, typeMap) => {
    return Object.entries(answersObj).map(([qid, val]) => {
      const questionId = Number(qid);
      const qType = typeMap[questionId];
      let selectedValue = null;
      let customAnswer = null;
      if (qType === 5) {
        const text = (val ?? "").toString().trim();
        customAnswer = text.length ? text : null;
      } else if (Array.isArray(val)) {
        selectedValue = val.join(",");
      } else {
        selectedValue = val != null ? String(val) : null;
      }
      return { questionId, selectedValue, customAnswer };
    });
  };

  const handleSaveAndReturnLater = async () => {
    const userId = getUserIdFromToken();
    if (!userId) {
      saveAnswersToStorage(answers);
      toast({
        title: "Saved locally",
        description: "Log in to sync your progress to the server. Your answers are saved in this browser.",
        status: "info",
        duration: 4000,
        isClosable: true,
      });
      navigate("/self-directed-search");
      return;
    }

    const typeMap = {};
    sections.forEach((s) => {
      (s.questions || []).forEach((q) => {
        typeMap[q.id] = q.type;
      });
    });

    const changedOrNew = Object.keys(answers).filter((qid) => {
      const current = normalizeAnswerForCompare(answers[qid]);
      const initial = normalizeAnswerForCompare(initialAnswersSnapshot[qid]);
      return current !== initial;
    });

    const responses = buildResponsesPayload(
      Object.fromEntries(changedOrNew.map((qid) => [qid, answers[qid]])),
      typeMap
    );

    if (responses.length === 0) {
      saveAnswersToStorage(answers);
      toast({
        title: "No changes to save",
        description: "Your progress is already saved. You can leave and continue later.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      navigate("/self-directed-search");
      return;
    }

    setSavingDraft(true);
    try {
      await post(SDS_ENDPOINTS.SUBMIT_RESPONSES, {
        userId: Number(userId),
        isCompleted: false,
        responses,
      });
      saveAnswersToStorage(answers);
      setInitialAnswersSnapshot({ ...answers });
      toast({
        title: "Progress saved",
        description: "Your answers have been saved. You can continue later.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      navigate("/self-directed-search");
    } catch (err) {
      captureError(err);
      toast({
        title: "Save failed",
        description: err.message || "Could not save draft. Your answers are still in this browser.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSavingDraft(false);
    }
  };

  const handleResumeContinue = () => {
    if (pendingExistingAnswers && Object.keys(pendingExistingAnswers).length > 0) {
      setAnswers(pendingExistingAnswers);
      setInitialAnswersSnapshot({ ...pendingExistingAnswers });
      saveAnswersToStorage(pendingExistingAnswers);
    }
    setPendingExistingAnswers(null);
    setShowResumeModal(false);
  };

  const handleResumeRestart = async () => {
    try {
      localStorage.removeItem(SDS_DRAFT_STORAGE_KEY);
    } catch (_) {}
    setAnswers({});
    setInitialAnswersSnapshot({});
    setPendingExistingAnswers(null);
    setShowResumeModal(false);

    const userId = getUserIdFromToken();
    if (userId) {
      try {
        await del(SDS_ENDPOINTS.DELETE_LAST_INCOMPLETE(userId));
      } catch (err) {
        captureError(err);
        console.warn("Could not delete incomplete attempt on server:", err);
        toast({
          title: "Draft cleared locally",
          description: "Server draft could not be removed. You can start over anyway.",
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
      }
    }
  };

  const saveAnswersToStorage = (answersObj) => {
    try {
      if (answersObj && Object.keys(answersObj).length > 0) {
        localStorage.setItem(SDS_DRAFT_STORAGE_KEY, JSON.stringify(answersObj));
      } else {
        localStorage.removeItem(SDS_DRAFT_STORAGE_KEY);
      }
    } catch (e) {
      captureError(e);
      console.warn("Could not save draft to localStorage", e);
    }
  };

  const totalQs = sections.reduce(
    (sum, s) => sum + (s.questions || []).length,
    0
  );
  const answered = Object.keys(answers).length;

  // Check if all questions are answered
  const isAllQuestionsAnswered = () => {
    return sections.every((section) =>
      (section.questions || []).every((q) => {
        const answer = answers[q.id];
        if (q.type === 5 || q.type === 6) {
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
    if (question.type === 5 || question.type === 6) {
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

  // Validation function for RIASEC personality traits question (stable ref for callbacks)
  const validateRiasecInput = useCallback((questionText, inputValue) => {
    const riasecQuestionText =
      "From the RIASEC videos, list your top three personality traits ranked from most dominant to least";

    if (questionText && questionText.includes(riasecQuestionText)) {
      if (!inputValue || typeof inputValue !== "string") {
        return "Please enter your top 3 RIASEC personality traits";
      }

      const trimmedValue = inputValue.trim().toUpperCase();

      if (trimmedValue.length !== 3) {
        return "Please enter exactly 3 letters (e.g., RIA, SEC, AIR)";
      }

      const validLetters = ["R", "I", "A", "S", "E", "C"];
      const invalidChars = [];
      for (let i = 0; i < trimmedValue.length; i++) {
        if (!validLetters.includes(trimmedValue[i])) {
          invalidChars.push(trimmedValue[i]);
        }
      }
      if (invalidChars.length > 0) {
        return `Invalid characters: ${invalidChars.join(", ")}. Only use letters: R, I, A, S, E, C`;
      }

      const uniqueChars = [...new Set(trimmedValue.split(""))];
      if (uniqueChars.length !== 3) {
        return "Each letter should appear only once. Use 3 different RIASEC letters: R, I, A, S, E, C";
      }
      return null;
    }
    return null;
  }, []);

  const handleTextAnswerChange = useCallback((questionId, questionText, val) => {
    if (val === null || (val ?? "").toString().trim().length === 0) {
      setAnswers((prev) => {
        const updated = { ...prev };
        delete updated[questionId];
        return updated;
      });
      setRiasecValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[questionId];
        return updated;
      });
    } else {
      const validationError = validateRiasecInput(questionText, val);
      setRiasecValidationErrors((prev) => ({ ...prev, [questionId]: validationError }));
      setAnswers((prev) => ({ ...prev, [questionId]: val }));
    }
  }, [validateRiasecInput]);

  const earnedBadges = [];
  if (answered > 0) earnedBadges.push({ label: "Getting Started", icon: "✨" });
  if (answered >= Math.ceil(totalQs / 2) && totalQs > 0)
    earnedBadges.push({ label: "Halfway", icon: "🧭" });
  if (answered === totalQs && totalQs > 0)
    earnedBadges.push({ label: "Finisher", icon: "🎖️" });

  useEffect(() => {
    const fetchSections = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await get(SDS_ENDPOINTS.GET_SECTIONS);
        setSections(Array.isArray(data) ? data : []);
      } catch (e) {
        captureError(e);
        setError(e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    fetchSections();
  }, []);

  // Debounced persist to localStorage so typing in textboxes doesn't lag (avoid save on every keystroke)
  const persistTimeoutRef = useRef(null);
  useEffect(() => {
    if (checkingExistingAnswers || showResumeModal) return;
    if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    persistTimeoutRef.current = setTimeout(() => {
      saveAnswersToStorage(answers);
      persistTimeoutRef.current = null;
    }, 400);
    return () => {
      if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    };
  }, [answers, checkingExistingAnswers, showResumeModal]);

  // Check for existing answers: localStorage first (instant), then API only if nothing local
  useEffect(() => {
    if (loading || sections.length === 0) return;

    const getUserIdFromToken = () => {
      const token = localStorage.getItem("token");
      if (!token) return null;
      try {
        const tokenData = JSON.parse(atob(token.split(".")[1]));
        const userId = tokenData["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
        const id = parseInt(userId, 10);
        return isNaN(id) ? null : id;
      } catch (e) {
        captureError(e);
        return null;
      }
    };

    const apiResponsesToAnswers = (responses, sectionList) => {
      const typeMap = {};
      sectionList.forEach((s) => {
        (s.questions || []).forEach((q) => {
          typeMap[q.id] = q.type;
        });
      });
      const result = {};
      (responses || []).forEach((r) => {
        const qId = r.questionId;
        const type = typeMap[qId];
        if (r.customAnswer != null && r.customAnswer !== "") {
          result[qId] = r.customAnswer;
        } else if (r.selectedValue != null && r.selectedValue !== "") {
          if (type === 2) {
            result[qId] = r.selectedValue.split(",").map((s) => s.trim()).filter(Boolean);
          } else {
            result[qId] = r.selectedValue;
          }
        }
      });
      return result;
    };

    const runCheck = async () => {
      setCheckingExistingAnswers(true);
      let existing = null;

      // 1. Check localStorage first (instant, no network)
      try {
        const stored = localStorage.getItem(SDS_DRAFT_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
            existing = parsed;
          }
        }
      } catch (_) {}

      // 2. Only if nothing in localStorage, call API
      if (!existing || Object.keys(existing).length === 0) {
        const userId = getUserIdFromToken();
        if (userId) {
          try {
            const data = await get(SDS_ENDPOINTS.GET_USER_RESPONSES(userId));
            const responses = Array.isArray(data) ? data : (data && data.responses) ? data.responses : [];
            if (responses.length > 0) {
              existing = apiResponsesToAnswers(responses, sections);
            }
          } catch (_) {}
        }
      }

      setCheckingExistingAnswers(false);
      if (existing && Object.keys(existing).length > 0) {
        setPendingExistingAnswers(existing);
        setShowResumeModal(true);
      }
    };

    runCheck();
  }, [loading, sections]);

  const handleSubmit = async () => {
    // Check for RIASEC validation errors
    const hasRiasecErrors = Object.values(riasecValidationErrors).some(
      (error) => error !== null
    );
    if (hasRiasecErrors) {
      toast({
        title: "Invalid RIASEC Input",
        description:
          "Please fix the RIASEC validation errors before submitting.",
        status: "error",
        duration: 5000,
        isClosable: true,
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
        isClosable: true,
      });
      return;
    }

    await performSubmission();
  };

  const performSubmission = async () => {
    // Get user ID from token
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "Please log in again",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setSubmitting(false);
      return;
    }

    // Decode token to get user ID
    const tokenData = JSON.parse(atob(token.split(".")[1]));
    const userId = parseInt(
      tokenData[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ]
    );

    if (!userId || isNaN(userId)) {
      toast({
        title: "Authentication Error",
        description: "Unable to retrieve user ID. Please log in again",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setSubmitting(false);
      return;
    }

    setSubmitting(true);

    const typeMap = {};
    sections.forEach((s) => {
      (s.questions || []).forEach((q) => {
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
      .filter(
        (r) =>
          typeMap[r.questionId] === 5 &&
          (!r.customAnswer || !r.customAnswer.trim())
      )
      .map((r) => r.questionId);

    if (missingText.length > 0) {
      toast({
        title: "Missing text answers",
        description: `These questions need text: ${missingText.join(", ")}`,
        status: "warning",
        duration: 6000,
        isClosable: true,
      });
      setSubmitting(false);
      return;
    }

    const payload = { userId: Number(userId), isCompleted: true, responses };

    // Debug logging for faculty question in final payload
    const facultyResponse = responses.find((r) => r.questionId === 364);
    console.log("Faculty response in final payload:", facultyResponse);
    console.log("All responses in payload:", responses);

    // Save original responses before they get overwritten by backend response
    const originalResponses = [...responses];

    try {
      // Handle both string and JSON responses
      let data;
      try {
        data = await post(SDS_ENDPOINTS.SUBMIT_RESPONSES, payload);
      } catch (err) {
        // If it's an HttpError with details, try to parse it
        if (err.details && typeof err.details === "string") {
          try {
            data = JSON.parse(err.details);
          } catch {
            data = err.details;
          }
        } else {
          throw err;
        }
      }

      // ---- Normalize to ALWAYS have a string code and an array of responses ----
      let code = null;
      let normalizedResponses = [];

      // Cases handled:
      // - "RIA"
      // - { hollandCode: "RIA" }
      // - { message, hollandCode: { hollandCode: "RIA", responses: [...] } }
      // - { message, result: { hollandCode: "RIA", responses: [...] } }
      if (typeof data === "string") {
        code = data;
      } else if (data && typeof data === "object") {
        // Check for result.hollandCode first (new API structure)
        if (data.result && typeof data.result.hollandCode === "string") {
          code = data.result.hollandCode;
          normalizedResponses = Array.isArray(data.result.responses)
            ? data.result.responses
            : [];
        } else if (typeof data.hollandCode === "string") {
          code = data.hollandCode;
        } else if (data.hollandCode && typeof data.hollandCode === "object") {
          code = data.hollandCode.hollandCode ?? null;
          normalizedResponses = Array.isArray(data.hollandCode.responses)
            ? data.hollandCode.responses
            : [];
        }
      }

      // Fallbacks to keep UI stable
      if (typeof code !== "string") code = "";
      if (!Array.isArray(normalizedResponses)) normalizedResponses = [];

      // Extract dream occupations (questionId 362) and user Holland code (questionId 363) from API response
      let dreamOccupations = "";
      let userHollandCode = "";
      
      if (data.result && Array.isArray(data.result.responses)) {
        const dreamOccResponse = data.result.responses.find(r => r.questionId === 362);
        const userCodeResponse = data.result.responses.find(r => r.questionId === 363);
        
        dreamOccupations = dreamOccResponse?.customAnswer || "";
        userHollandCode = userCodeResponse?.customAnswer || "";
      } else if (Array.isArray(normalizedResponses)) {
        // Fallback: try to find from normalized responses
        const dreamOccResponse = normalizedResponses.find(r => r.questionId === 362);
        const userCodeResponse = normalizedResponses.find(r => r.questionId === 363);
        
        dreamOccupations = dreamOccResponse?.customAnswer || "";
        userHollandCode = userCodeResponse?.customAnswer || "";
      }

      // ---- Navigate with normalized shape ----
      navigate("/self-directed-search/result", {
        state: {
          userId: Number(userId),
          hollandCode: code, // always a string (calculated Holland code from API)
          responses: normalizedResponses, // array (for Q265/Q266 if present)
          allResponses: originalResponses, // Pass all original responses including faculty
          serverResponse: data, // raw for debugging
          answeredCount: Object.keys(answers).length,
          submittedAt: new Date().toISOString(),
          dreamOccupations: dreamOccupations, // extracted from questionId 362
          userHollandCode: userHollandCode, // extracted from questionId 363
        },
      });

      toast({
        title: "Submitted Successfully!",
        description: code
          ? `Your result code is: ${code}`
          : "Responses submitted.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      // eslint-disable-next-line no-console
      console.log("SDS response (normalized):", { code, responses, data });
    } catch (error) {
      captureError(error);
      console.error("Error submitting SDS responses:", error);
      toast({
        title: "Submission Failed",
        description:
          error.message || "Failed to submit responses. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box minH="100vh" bgGradient="linear(to-r, white, #ebf8ff)">
      <Box
        maxW="1000px"
        mx="auto"
        px={{ base: 4, md: 8 }}
        py={{ base: 6, md: 10 }}
      >
        <Heading color="brand.500" textAlign="center" mb={{ base: 6, md: 8 }}>
          Personality Test Sections & Questions
        </Heading>
        <Alert status="info" variant="subtle" mb={4} rounded="md">
          <AlertIcon />
          <Text>🚀 Tip: Answer by instinct — there are no wrong choices.</Text>
        </Alert>
        {/* Progress & Badges */}
        <Box mb={6}>
          <Progress value={progressPct} rounded="full" size="sm" />
          <HStack mt={2} justify="space-between">
            <Text fontSize="sm" color="gray.600">
              {answered}/{totalQs} answered ({progressPct}%)
            </Text>
            <HStack spacing={2}>
              {earnedBadges.map((b, i) => (
                <Badge key={i} variant="subtle">
                  {b.icon} {b.label}
                </Badge>
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
              const theme = sectionThemes[section.name] || {
                color: "#6366F1",
                scheme: "purple",
                bg: "dots",
                bgFile: "/assets/images/nnnoise.svg",
              };
              const bgImage =
                theme.bg === "paint"
                  ? svgPaint(theme.color)
                  : svgDots(theme.color);

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
                          const meta = riasecMeta[section.name] || {
                            emoji: "⭐",
                          };
                          return (
                            <HStack>
                              <Badge colorScheme={theme.scheme}>
                                {meta.emoji}
                              </Badge>
                              <Text fontWeight="semibold" color={theme.color}>
                                {section.name}
                              </Text>
                            </HStack>
                          );
                        })()}
                        {section.description && (
                          <Text fontSize="sm" color={`${theme.color}cc`}>
                            {section.description}
                          </Text>
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
                                <Text
                                  fontWeight="semibold"
                                  color={showError ? "red.500" : "inherit"}
                                >
                                  {idx + 1}. {q.text}
                                </Text>
                                {showError && (
                                  <WarningIcon color="red.500" boxSize={4} />
                                )}
                              </HStack>
                              {(q.type === 5 || q.type === 6) ? (
                                <DebouncedTextQuestionField
                                  question={q}
                                  text=""
                                  value={answers[q.id]}
                                  onTextAnswerChange={handleTextAnswerChange}
                                  options={(q.answerOptions || []).map((opt) => ({
                                    id: opt.id,
                                    text: opt.text,
                                    value: String(opt.value),
                                  }))}
                                  sliderProps={{ min: 1, max: 7, step: 1 }}
                                  highlightColor={theme.color}
                                  colorScheme={theme.scheme}
                                />
                              ) : (
                                <QuestionField
                                  type={q.type}
                                  text=""
                                  value={
                                    q.type === 4
                                      ? (() => {
                                          if (answers[q.id]) {
                                            const option = q.answerOptions.find(
                                              (opt) => opt.value === answers[q.id]
                                            );
                                            return option
                                              ? Number(option.text)
                                              : 1;
                                          }
                                          return 1;
                                        })()
                                      : answers[q.id]
                                  }
                                  options={(q.answerOptions || []).map((opt) => ({
                                    id: opt.id,
                                    text: opt.text,
                                    value: String(opt.value),
                                  }))}
                                  onChange={(val) => {
                                    if (q.type === 4) {
                                      const sliderValue = Math.max(
                                        1,
                                        Math.min(7, Math.round(val))
                                      );
                                      const selectedOption = q.answerOptions.find(
                                        (opt) => opt.text === String(sliderValue)
                                      );
                                      setAnswers((prev) => ({
                                        ...prev,
                                        [q.id]: selectedOption
                                          ? selectedOption.value
                                          : null,
                                      }));
                                    } else if (q.type === 1) {
                                      const currentValue = answers[q.id];
                                      const newValue = String(val);
                                      if (currentValue !== null && currentValue !== undefined && String(currentValue) === newValue) {
                                        setAnswers((prev) => {
                                          const updated = { ...prev };
                                          delete updated[q.id];
                                          return updated;
                                        });
                                        setRiasecValidationErrors((prev) => {
                                          const updated = { ...prev };
                                          delete updated[q.id];
                                          return updated;
                                        });
                                      } else {
                                        if (q.id === 364) {
                                          console.log("Faculty question (ID 364) answered!", q.text, val, q.answerOptions);
                                        }
                                        const validationError = validateRiasecInput(q.text, val);
                                        setRiasecValidationErrors((prev) => ({ ...prev, [q.id]: validationError }));
                                        setAnswers((prev) => ({ ...prev, [q.id]: val }));
                                      }
                                    } else {
                                      if (q.id === 364) {
                                        console.log("Faculty question (ID 364) answered!", q.text, val, q.answerOptions);
                                      }
                                      const validationError = validateRiasecInput(q.text, val);
                                      setRiasecValidationErrors((prev) => ({ ...prev, [q.id]: validationError }));
                                      setAnswers((prev) => ({ ...prev, [q.id]: val }));
                                    }
                                  }}
                                  sliderProps={{
                                    min: 1,
                                    max: 7,
                                    step: 1,
                                  }}
                                  highlightColor={theme.color}
                                  colorScheme={theme.scheme}
                                />
                              )}
                              {/* RIASEC Validation Error Display */}
                              {riasecValidationErrors[q.id] && (
                                <Alert status="error" mt={2} size="sm">
                                  <AlertIcon />
                                  <Text fontSize="sm">
                                    {riasecValidationErrors[q.id]}
                                  </Text>
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
              <Button
                variant="outline"
                size="md"
                onClick={handleSaveAndReturnLater}
                disabled={submitting || savingDraft}
                isLoading={savingDraft}
                loadingText="Saving..."
              >
                Save changes and return later
              </Button>
            </VStack>
          </Box>
        )}

        {/* Resume / Restart modal: existing answers found */}
        <Modal
          isOpen={showResumeModal}
          onClose={handleResumeRestart}
          isCentered
          size="lg"
          closeOnOverlayClick={false}
        >
          <ModalOverlay bg="blackAlpha.600" />
          <ModalContent rounded="xl" shadow="xl">
            <ModalHeader color="brand.500" fontSize="xl" pt={6}>
              Welcome back! 👋
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={2}>
              <Text mb={4} color="gray.600">
                We found saved answers from a previous session. Choose how you’d like to proceed:
              </Text>
              <VStack align="stretch" spacing={4}>
                <List spacing={2}>
                  <ListItem>
                    <Text>
                      <strong>Continue where I left off</strong> — Load your saved answers and keep going. Your progress is saved automatically as you go.
                    </Text>
                  </ListItem>
                  <ListItem>
                    <Text>
                      <strong>Start over</strong> — Clear previous answers and take the test from the beginning. Your saved draft will be removed.
                    </Text>
                  </ListItem>
                </List>
                <Alert status="info" variant="subtle" rounded="md" fontSize="sm">
                  <AlertIcon />
                  <Text>
                    You can leave anytime using &quot;Save changes and return later&quot; — we’ll keep your progress.
                  </Text>
                </Alert>
              </VStack>
            </ModalBody>
            <ModalFooter pt={4} pb={6}>
              <Button variant="ghost" mr={3} onClick={handleResumeRestart}>
                Start over
              </Button>
              <Button colorScheme="brand" onClick={handleResumeContinue}>
                Continue 
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Box>
  );
};

export default SdsTry;
