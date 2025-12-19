import React, { useState, useRef, useEffect } from "react";
import { Box, Button, Heading, Flex, useToast } from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTimer } from "react-timer-hook";
import { getStoredToken, decodeToken } from "../../../utils/tokenUtils";
import { useMockInterviewState } from "../../../contexts/MockInterviewStateContext";
import Footer from "../../../components/Footer";
import fallbackVoiceover from "../../../assets/audio/voiceover.m4a";
// Services
import {
  checkMockInterviewStatus as checkMockInterviewStatusService,
  fetchQuestions as fetchQuestionsService,
  increaseAttemptCount,
  handleSubmitVideos as handleSubmitVideosService,
} from "./services/mockInterviewService";
// UI Components
import LoadingView from "./components/LoadingView";
import ErrorView from "./components/ErrorView";
import ThankYouView from "./components/ThankYouView";
import InterviewHeader from "./components/InterviewHeader";
import InterviewIntro from "./components/InterviewIntro";
import WebcamView from "./components/WebcamView";
import LottieView from "./components/LottieView";
import QuestionInfo from "./components/QuestionInfo";
import RetryPromptModal from "./components/RetryPromptModal";
import StartInterviewReadyModal from "./components/StartInterviewReadyModal";
import ImReadyModal from "./components/ImReadyModal";
import RelaxationTimeModal from "./components/RelaxationTimeModal";
import ExitWarningModal from "./components/ExitWarningModal";
import StartInterviewWarningModal from "./components/StartInterviewWarningModal";
// Lottie utilities
import {
  queueSegments,
  setLottieMode,
  onLottieComplete as handleLottieComplete,
  THINKING_LOOP,
} from "./utils/lottieUtils";

const INTERVIEW_DURATION_MINUTES = 10;
const COMMON_QUESTION_DURATION_SECONDS = 60; // 1 minute
const CANDIDATE_QUESTION_DURATION_SECONDS = 60; // 1 minute
const MAJOR_QUESTION_DURATION_SECONDS = 120; // 2 minutes
const RELAXATION_TIME_SECONDS = 10; // 10 seconds

const MockInterviewQuestionsPage = () => {
  const location = useLocation();
  const major = location.state?.major || "Nursing & Healthcare";
  const navigate = useNavigate();
  const toast = useToast();
  const {
    setIsInterviewActive,
    showExitWarning,
    setShowExitWarning,
    setOnExitConfirm,
    setOnExitCancel,
    answeredQuestionsCount,
    setAnsweredQuestionsCount,
    totalQuestionsCount,
    setTotalQuestionsCount,
  } = useMockInterviewState();

  // Helper function to get answer duration based on question type
  const getAnswerDuration = (questionType) => {
    if (questionType === "common") return COMMON_QUESTION_DURATION_SECONDS;
    if (questionType === "special") return CANDIDATE_QUESTION_DURATION_SECONDS;
    return MAJOR_QUESTION_DURATION_SECONDS; // default to major
  };

  // lottie mode (and a ref so we don't fight with segments)
  const [mode, setModeState] = useState("thinkingLoop");

  // data
  const [questions, setQuestions] = useState([]);
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [commonQuestions, setCommonQuestions] = useState([]);
  const [specialQuestions, setSpecialQuestions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // flow
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [canDoMock, setCanDoMock] = useState(true);
  const [checkingMockStatus, setCheckingMockStatus] = useState(false);
  const [showQuestionList, setShowQuestionList] = useState(false);
  const [showRetryPrompt, setShowRetryPrompt] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(5);
  const [showRelaxationTime, setShowRelaxationTime] = useState(false);
  const [relaxationCountdown, setRelaxationCountdown] = useState(5);
  const [promptRetryUsed, setPromptRetryUsed] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showStartInterviewReady, setShowStartInterviewReady] = useState(false);
  const [showReadyButton, setShowReadyButton] = useState(false);
  const [totalReplayCount, setTotalReplayCount] = useState(0);

  // Special question flow states
  const [showOpeningMessage, setShowOpeningMessage] = useState(false);
  const [showCandidateQuestion, setShowCandidateQuestion] = useState(false);
  const [showClosingMessage, setShowClosingMessage] = useState(false);
  const [currentSpecialQuestion, setCurrentSpecialQuestion] = useState(null);

  // prompt/audio
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(null);
  const [currentCommonQuestionIdx, setCurrentCommonQuestionIdx] =
    useState(null);
  const [currentQuestionType, setCurrentQuestionType] = useState(null); // 'common' | 'major' | 'special'
  const [selectedTitle, setSelectedTitle] = useState("");
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [countdownActive, setCountdownActive] = useState(false);

  // recording
  const [showRecorder, setShowRecorder] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordedAnswers, setRecordedAnswers] = useState([]); // {questionIdx, blob, questionType, questionId}
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [answerRetryUsed, setAnswerRetryUsed] = useState(new Set()); // Track which questions have used retry

  // timers
  const [interviewDuration, setInterviewDuration] = useState(0);
  const [interviewStartTime, setInterviewStartTime] = useState(null);
  const [answerTimerKey, setAnswerTimerKey] = useState(0);

  // refs
  const webcamRef = useRef(null);
  const lottieRef = useRef(null);
  const audioRef = useRef(null);
  const pendingStartRef = useRef(false); // begin countdown after end_talk2 completes

  // lottie mode
  const modeRef = useRef("thinkingLoop"); // 'thinkingLoop' | 'listeningLoop' | 'talkingChain' | 'end_talk2'

  // Wrapper function to set mode with ref tracking
  const setMode = (m) => {
    if (modeRef.current === m) return;
    modeRef.current = m;
    setLottieMode(lottieRef, m, setModeState);
  };

  // Wrapper function for Lottie completion handler
  const onLottieComplete = () => {
    handleLottieComplete(lottieRef, modeRef.current, setMode, pendingStartRef);
  };

  // ensure idle (thinking) starts once Lottie instance exists
  useEffect(() => {
    let tries = 0;
    const t = setInterval(() => {
      const inst = lottieRef.current;
      if (inst && typeof inst.playSegments === "function") {
        setMode("thinkingLoop"); // autoplay idle on load
        clearInterval(t);
      } else if (++tries > 60) {
        clearInterval(t);
      }
    }, 50);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, []);

  // interview timer
  const interviewEnd = new Date();
  interviewEnd.setMinutes(
    interviewEnd.getMinutes() + INTERVIEW_DURATION_MINUTES
  );
  const {
    seconds: interviewSeconds,
    minutes: interviewMinutes,
    hours: interviewHours,
    restart: restartInterviewTimer,
  } = useTimer({ expiryTimestamp: interviewEnd, autoStart: true });

  const {
    seconds: answerSeconds,
    minutes: answerMinutes,
    start: startAnswerTimer,
    pause: pauseAnswerTimer,
    restart: restartAnswerTimer,
  } = useTimer({
    expiryTimestamp: new Date(),
    autoStart: false,
    onExpire: () => handleAnswerTimeout(),
  });

  // Get current answer duration for display
  const currentAnswerDuration = currentQuestionType
    ? getAnswerDuration(currentQuestionType)
    : MAJOR_QUESTION_DURATION_SECONDS;

  // duration ticker
  useEffect(() => {
    let interval;
    if (interviewStarted && interviewStartTime) {
      interval = setInterval(() => {
        setInterviewDuration(
          Math.floor((Date.now() - interviewStartTime) / 1000)
        );
      }, 1000);
    }
    return () => interval && clearInterval(interval);
  }, [interviewStarted, interviewStartTime]);

  useEffect(() => {
    const end = new Date();
    end.setMinutes(end.getMinutes() + INTERVIEW_DURATION_MINUTES);
    restartInterviewTimer(end, true);
    // eslint-disable-next-line
  }, []);

  // can-do status
  const checkMockInterviewStatus = () => {
    checkMockInterviewStatusService(setCheckingMockStatus, setCanDoMock, toast);
  };
  useEffect(() => {
    checkMockInterviewStatus(); /* eslint-disable-line */
  }, []);

  // Auto-start retry countdown when retry prompt is shown
  useEffect(() => {
    if (showRetryPrompt && retryCountdown > 0) {
      const timer = setTimeout(() => {
        setRetryCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showRetryPrompt && retryCountdown === 0) {
      setShowRetryPrompt(false);
      beginAnswerCountdown();
    }
  }, [showRetryPrompt, retryCountdown]);

  // Browser back button and page unload warning
  useEffect(() => {
    if (!interviewStarted) return; // Only protect when interview is started

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue =
        "Are you sure you want to leave? You will miss the interview and lose your chance and answers.";
      return "Are you sure you want to leave? You will miss the interview and lose your chance and answers.";
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
  }, [interviewStarted, setShowExitWarning]);

  // Cleanup: Reset interview state when component unmounts
  useEffect(() => {
    return () => {
      // Reset interview state when component unmounts
      if (interviewStarted) {
        setIsInterviewActive(false);
        setShowExitWarning(false);
      }
    };
  }, [interviewStarted, setIsInterviewActive, setShowExitWarning]);

  // fetch questions with fallback
  useEffect(() => {
    const fetchQuestions = () => {
      fetchQuestionsService(
        major,
        setLoading,
        setError,
        setQuestions,
        setInterviewQuestions,
        setCommonQuestions,
        setSpecialQuestions,
        toast,
        fallbackVoiceover
      );
    };
    fetchQuestions();
    // eslint-disable-next-line
  }, [major]);

  // ---- special question handling ----
  const playSpecialQuestion = async (questionType) => {
    const specialQuestion = specialQuestions[questionType];
    if (!specialQuestion) return;

    setCurrentSpecialQuestion(specialQuestion);
    setSelectedTitle(specialQuestion.title);
    setAudioBlocked(false);

    // Play the start_talk intro ONCE
    setMode("start_talk");

    try {
      if (audioRef.current) {
        audioRef.current.src = specialQuestion.videoUrl || "";
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
      }
    } catch (e) {
      console.error("Audio play blocked:", e);
      setAudioBlocked(true);
      toast({
        title: "Enable audio",
        description: 'Click "Enable Audio" to start the audio.',
        status: "warning",
        duration: 3000,
      });
    }
  };

  const onSpecialQuestionAudioEnded = () => {
    setMode("end_talk2");

    // Handle different special question types
    if (currentSpecialQuestion?.title === "Opening Message") {
      setShowOpeningMessage(false);
      setShowReadyButton(true);
    } else if (currentSpecialQuestion?.title === "Candidate Question") {
      setShowCandidateQuestion(false);
      setCurrentQuestionType("special");
      // Start recording for candidate question
      setTimeout(() => {
        setShowRecorder(true);
        if (webcamRef.current?.video?.srcObject) {
          handleStartRecording();
          const duration = getAnswerDuration("special");
          restartAnswerTimer(new Date(Date.now() + duration * 1000), true);
          toast({ title: "Recording started", status: "info", duration: 2000 });
        }
      }, 1000);
    } else if (currentSpecialQuestion?.title === "Closing Message") {
      setShowClosingMessage(false);
      setShowControls(true);
    }
  };

  // ---- prompt audio & animation ----
  const playQuestionPrompt = async (
    audioUrl,
    title,
    idx,
    questionType = "major"
  ) => {
    // Set appropriate index based on question type
    if (questionType === "common") {
      setCurrentCommonQuestionIdx(idx);
      setCurrentQuestionIdx(null);
    } else {
      setCurrentQuestionIdx(idx);
      setCurrentCommonQuestionIdx(null);
    }
    setCurrentQuestionType(questionType);
    setSelectedTitle(title);
    setAudioBlocked(false);
    setCountdownActive(true);
    setCurrentSpecialQuestion(null); // Reset special question state

    // 1) Play the start_talk intro ONCE
    setMode("start_talk");

    // 2) Start the audio right away; when intro completes, onComplete switches to the chain
    try {
      if (audioRef.current) {
        audioRef.current.src = audioUrl || "";
        audioRef.current.currentTime = 0;
        await audioRef.current.play(); // user gesture
      }
    } catch (e) {
      console.error("Audio play blocked:", e);
      setAudioBlocked(true);
      toast({
        title: "Enable audio",
        description: 'Click "Enable Audio" to start the question audio.',
        status: "warning",
        duration: 3000,
      });
    }
  };

  const onAudioPlaying = () => {
    // ensure we’re in talk mode as soon as audio actually starts
    setMode("talkingChain");
  };

  const onAudioEnded = () => {
    // Check if this is a special question
    if (currentSpecialQuestion) {
      onSpecialQuestionAudioEnded();
      return;
    }

    // After prompt: end_talk2 once, then show retry prompt
    pendingStartRef.current = true;
    setMode("end_talk2");
    setShowRetryPrompt(true);
    setRetryCountdown(5);
  };

  const onAudioError = () => {
    // Check if this is a special question
    if (currentSpecialQuestion) {
      onSpecialQuestionAudioEnded();
      return;
    }

    // Treat as ended
    pendingStartRef.current = true;
    setMode("end_talk2");
    setShowRetryPrompt(true);
    setRetryCountdown(5);
  };

  // ---- countdown & recording ----
  const beginAnswerCountdown = () => {
    const duration = getAnswerDuration(currentQuestionType);
    let countdown = 5;
    toast({
      title: `Starting in ${countdown}...`,
      status: "info",
      duration: 1000,
      isClosable: false,
    });
    const interval = setInterval(() => {
      countdown -= 1;
      if (countdown > 0) {
        toast({
          title: `Starting in ${countdown}...`,
          status: "info",
          duration: 1000,
          isClosable: false,
        });
      } else {
        clearInterval(interval);
        setShowRecorder(true);
        // start recording (switch Lottie to listening)
        if (webcamRef.current?.video?.srcObject) {
          handleStartRecording();
          restartAnswerTimer(new Date(Date.now() + duration * 1000), true);
          toast({ title: "Recording started", status: "info", duration: 2000 });
        } else {
          toast({
            title: "Waiting for webcam...",
            status: "warning",
            duration: 2000,
          });
        }
      }
    }, 1000);
  };

  const handleStartRecording = () => {
    setRecordedChunks([]);
    setShowControls(false);
    setMode("listeningLoop"); // rule #2

    const videoElement = webcamRef.current?.video;
    if (!videoElement || !videoElement.srcObject) {
      toast({ title: "Webcam not ready", status: "error" });
      return;
    }
    const stream = videoElement.srcObject;
    const mr = new window.MediaRecorder(stream, { mimeType: "video/webm" });
    setMediaRecorder(mr);

    mr.ondataavailable = (e) => {
      if (e.data.size > 0) setRecordedChunks((prev) => [...prev, e.data]);
    };
    mr.onstop = () => {
      setRecording(false);
      setMode("thinkingLoop");
    };

    mr.start();
    setRecording(true);
  };

  const handleStopRecording = (auto = false) => {
    if (!mediaRecorder) return;
    const chunks = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    mediaRecorder.onstop = () => {
      setRecording(false);
      if (chunks.length > 0) {
        const blob = new Blob(chunks, { type: "video/webm" });

        // Determine question details based on current question type
        let questionId = null;
        let questionIdx = null;
        let questionType = currentQuestionType;

        if (
          currentQuestionType === "common" &&
          currentCommonQuestionIdx !== null
        ) {
          questionIdx = currentCommonQuestionIdx;
          questionId = commonQuestions[currentCommonQuestionIdx]?.questionId;
        } else if (
          currentQuestionType === "major" &&
          currentQuestionIdx !== null
        ) {
          questionIdx = currentQuestionIdx;
          questionId = interviewQuestions[currentQuestionIdx]?.questionId;
        } else if (currentSpecialQuestion?.title === "Candidate Question") {
          questionType = "special";
          questionId = currentSpecialQuestion?.questionId;
          questionIdx = "candidate";
        }

        // Store answer with question type and ID
        const answerKey =
          questionType === "common"
            ? `common-${currentCommonQuestionIdx}`
            : questionType === "major"
            ? `major-${currentQuestionIdx}`
            : `special-candidate`;

        setRecordedAnswers((prev) => [
          ...prev.filter((a) => a.answerKey !== answerKey),
          {
            questionIdx,
            blob,
            questionType,
            questionId,
            answerKey,
          },
        ]);

        if (questionType !== "special") {
          setAnsweredQuestions((prev) => {
            const updated = [...prev, answerKey];
            // Update context with answered questions count
            setAnsweredQuestionsCount(updated.length);
            return updated;
          });
        }
      }
      setShowRecorder(false);
      setMode("thinkingLoop");

      // Check if this was the candidate question
      if (currentSpecialQuestion?.title === "Candidate Question") {
        // After candidate question, play closing message
        if (specialQuestions["Closing Message"]) {
          setShowClosingMessage(true);
          setTimeout(() => {
            playSpecialQuestion("Closing Message");
          }, 500);
        } else {
          setShowControls(true);
        }
      } else if (currentQuestionType === "common") {
        // Common question flow
        if (currentCommonQuestionIdx < commonQuestions.length - 1) {
          // More common questions, continue with next
          startRelaxationTime();
        } else {
          // All common questions done, move to major questions
          if (interviewQuestions.length > 0) {
            startRelaxationTime();
          } else {
            // No major questions, go to candidate question
            if (specialQuestions["Candidate Question"]) {
              setShowCandidateQuestion(true);
              setTimeout(() => {
                playSpecialQuestion("Candidate Question");
              }, 500);
            } else if (specialQuestions["Closing Message"]) {
              setShowClosingMessage(true);
              setTimeout(() => {
                playSpecialQuestion("Closing Message");
              }, 500);
            } else {
              setShowControls(true);
            }
          }
        }
      } else if (currentQuestionType === "major") {
        // Major question flow
        if (currentQuestionIdx < interviewQuestions.length - 1) {
          // More major questions, continue with next
          startRelaxationTime();
        } else {
          // All major questions done, check for candidate question
          if (specialQuestions["Candidate Question"]) {
            setShowCandidateQuestion(true);
            setTimeout(() => {
              playSpecialQuestion("Candidate Question");
            }, 500);
          } else {
            // No candidate question, go directly to closing message or submit
            if (specialQuestions["Closing Message"]) {
              setShowClosingMessage(true);
              setTimeout(() => {
                playSpecialQuestion("Closing Message");
              }, 500);
            } else {
              setShowControls(true);
            }
          }
        }
      }
    };
    mediaRecorder.stop();
  };

  // Helper function to get current answer key
  const getCurrentAnswerKey = () => {
    if (currentQuestionType === "common" && currentCommonQuestionIdx !== null) {
      return `common-${currentCommonQuestionIdx}`;
    } else if (currentQuestionType === "major" && currentQuestionIdx !== null) {
      return `major-${currentQuestionIdx}`;
    } else if (currentSpecialQuestion?.title === "Candidate Question") {
      return `special-candidate`;
    }
    return null;
  };

  const handleRetryAnswer = () => {
    const answerKey = getCurrentAnswerKey();
    if (!answerKey) return;

    // Check if retry already used
    if (answerRetryUsed.has(answerKey)) {
      toast({
        title: "Retry already used",
        description: "You can only retry once per question.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    // Stop current recording if active
    if (recording && mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
      pauseAnswerTimer();
    }

    // Remove the recorded answer for this question
    setRecordedAnswers((prev) => prev.filter((a) => a.answerKey !== answerKey));

    // Remove from answeredQuestions if applicable
    if (currentQuestionType !== "special") {
      setAnsweredQuestions((prev) => {
        const updated = prev.filter((key) => key !== answerKey);
        // Update context with answered questions count
        setAnsweredQuestionsCount(updated.length);
        return updated;
      });
    }

    // Mark retry as used
    setAnswerRetryUsed((prev) => new Set([...prev, answerKey]));

    // Reset recording state
    setRecordedChunks([]);
    setMode("thinkingLoop");
    setShowRecorder(false);

    // Use the same countdown mechanism as after question finishes
    setTimeout(() => {
      beginAnswerCountdown();
    }, 500);
  };

  const handleAnswerTimeout = () => {
    if (recording) handleStopRecording(true);
  };
  const handleUserStop = () => {
    pauseAnswerTimer();
    handleStopRecording(false);
  };

  // ---- retry prompt functionality ----
  const handleRetryPrompt = () => {
    if (promptRetryUsed) return; // Only allow one retry
    setPromptRetryUsed(true);
    setShowRetryPrompt(false);
    setTotalReplayCount((prev) => prev + 1); // Increment total replay count

    if (currentQuestionType === "common" && currentCommonQuestionIdx !== null) {
      const q = commonQuestions[currentCommonQuestionIdx];
      playQuestionPrompt(
        q?.videoUrl,
        q?.title,
        currentCommonQuestionIdx,
        "common"
      );
    } else if (currentQuestionType === "major" && currentQuestionIdx != null) {
      const q = interviewQuestions[currentQuestionIdx];
      playQuestionPrompt(q?.videoUrl, q?.title, currentQuestionIdx, "major");
    }
  };

  const startRetryCountdown = () => {
    setRetryCountdown(5);
    const interval = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowRetryPrompt(false);
          beginAnswerCountdown();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ---- relaxation time between questions ----
  const startRelaxationTime = () => {
    setShowRelaxationTime(true);
    setRelaxationCountdown(RELAXATION_TIME_SECONDS);
    const interval = setInterval(() => {
      setRelaxationCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowRelaxationTime(false);
          setPromptRetryUsed(false); // Reset retry for next question
          setCurrentSpecialQuestion(null); // Reset special question state

          // Handle common questions
          if (
            currentQuestionType === "common" &&
            currentCommonQuestionIdx !== null
          ) {
            const nextCommonIdx = currentCommonQuestionIdx + 1;
            if (nextCommonIdx < commonQuestions.length) {
              // Move to next common question
              const q = commonQuestions[nextCommonIdx];
              setSelectedTitle(q.title);
              setTimeout(() => {
                playQuestionPrompt(
                  q.videoUrl,
                  q.title,
                  nextCommonIdx,
                  "common"
                );
              }, 300);
            } else {
              // All common questions done, move to first major question
              if (interviewQuestions.length > 0) {
                const q = interviewQuestions[0];
                setSelectedTitle(q.title);
                setTimeout(() => {
                  playQuestionPrompt(q.videoUrl, q.title, 0, "major");
                }, 300);
              } else {
                // No major questions, go to candidate question
                if (specialQuestions["Candidate Question"]) {
                  setShowCandidateQuestion(true);
                  setTimeout(() => {
                    playSpecialQuestion("Candidate Question");
                  }, 500);
                } else if (specialQuestions["Closing Message"]) {
                  setShowClosingMessage(true);
                  setTimeout(() => {
                    playSpecialQuestion("Closing Message");
                  }, 500);
                } else {
                  setShowControls(true);
                }
              }
            }
          }
          // Handle major questions
          else if (
            currentQuestionType === "major" &&
            currentQuestionIdx !== null
          ) {
            const nextMajorIdx = currentQuestionIdx + 1;
            if (nextMajorIdx < interviewQuestions.length) {
              // Move to next major question
              const q = interviewQuestions[nextMajorIdx];
              setSelectedTitle(q.title);
              setTimeout(() => {
                playQuestionPrompt(q.videoUrl, q.title, nextMajorIdx, "major");
              }, 300);
            } else {
              // All major questions completed, check for candidate question
              if (specialQuestions["Candidate Question"]) {
                setShowCandidateQuestion(true);
                setTimeout(() => {
                  playSpecialQuestion("Candidate Question");
                }, 500);
              } else {
                // No candidate question, go directly to closing message or submit
                if (specialQuestions["Closing Message"]) {
                  setShowClosingMessage(true);
                  setTimeout(() => {
                    playSpecialQuestion("Closing Message");
                  }, 500);
                } else {
                  setShowControls(true);
                }
              }
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ---- warning modal handlers ----
  const handleStartInterviewClick = () => {
    setShowWarningModal(true);
  };

  const handleConfirmStartInterview = async () => {
    setShowWarningModal(false);
    setInterviewStarted(true);
    setInterviewStartTime(Date.now());
    setInterviewDuration(0);
    setPromptRetryUsed(false);
    setCurrentQuestionIdx(null);
    setCurrentCommonQuestionIdx(null);
    setCurrentQuestionType(null);
    setAnswerRetryUsed(new Set()); // Reset retry state for new interview

    // Set interview as active in context
    setIsInterviewActive(true);

    // Set total questions count
    setTotalQuestionsCount(commonQuestions.length + interviewQuestions.length);

    // Set up exit handlers in context
    setOnExitConfirm(() => () => {
      setShowExitWarning(false);
      setIsInterviewActive(false);
      navigate("/");
    });
    setOnExitCancel(() => () => {
      setShowExitWarning(false);
    });

    // Increment attempt count for user
    increaseAttemptCount();

    // Show first "I'm Ready" modal before opening message
    setShowStartInterviewReady(true);

    // ensure idle animation is running
    setMode("thinkingLoop");
  };

  const handleStartInterviewReady = () => {
    setShowStartInterviewReady(false);

    // Check if we have an opening message
    if (specialQuestions["Opening Message"]) {
      setShowOpeningMessage(true);
      setTimeout(() => {
        playSpecialQuestion("Opening Message");
      }, 500);
    } else {
      // No opening message, go directly to second ready button
      setShowReadyButton(true);
    }
  };

  const handleImReady = () => {
    setShowReadyButton(false);
    setCurrentSpecialQuestion(null); // Reset special question state
    // Start with first common question if exists, otherwise first major question
    setTimeout(() => {
      if (commonQuestions.length > 0) {
        playQuestionPrompt(
          commonQuestions[0]?.videoUrl,
          commonQuestions[0]?.title,
          0,
          "common"
        );
      } else if (interviewQuestions.length > 0) {
        playQuestionPrompt(
          interviewQuestions[0]?.videoUrl,
          interviewQuestions[0]?.title,
          0,
          "major"
        );
      }
    }, 500);
  };

  const handleCancelStartInterview = () => {
    setShowWarningModal(false);
  };

  // ---- browser protection handlers ----
  const handleExitConfirm = () => {
    setShowExitWarning(false);
    setIsInterviewActive(false);
    navigate("/");
  };

  const handleExitCancel = () => {
    setShowExitWarning(false);
  };

  // ---- upload ----
  const handleSubmitVideos = () => {
    handleSubmitVideosService(
      recordedAnswers,
      interviewDuration,
      totalReplayCount,
      setSubmitting,
      setShowThankYou,
      setInterviewStartTime,
      setInterviewDuration,
      setIsInterviewActive,
      toast
    );
  };

  // ---- UI helpers ----
  const isQuestionAnswered = (idx) => answeredQuestions.includes(idx);
  const interviewTimerDisplay = `${String(interviewHours).padStart(
    2,
    "0"
  )}:${String(interviewMinutes).padStart(2, "0")}:${String(
    interviewSeconds
  ).padStart(2, "0")}`;
  const answerTimerDisplay = `${String(answerMinutes).padStart(
    2,
    "0"
  )}:${String(answerSeconds).padStart(2, "0")}`;

  // loading / error
  if (loading) {
    return <LoadingView />;
  }
  if (error && interviewQuestions.length === 0) {
    return <ErrorView error={error} />;
  }

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-r, white, #ebf8ff)"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      {interviewStarted && !showThankYou && (
        <InterviewHeader interviewDuration={interviewDuration} />
      )}

      <Box px={4} py={8}>
        <Heading size="lg" mb={4} textAlign="center">
          Interview Questions - {major}
        </Heading>

        {showThankYou ? (
          <ThankYouView onReturnHome={() => navigate("/")} />
        ) : interviewStarted ? (
          <>
            {/* Top row: webcam | lottie */}
            <Flex
              gap={6}
              direction={{ base: "column", md: "row" }}
              align="stretch"
            >
              <WebcamView
                webcamRef={webcamRef}
                showRecorder={showRecorder}
                recording={recording}
                answerMinutes={answerMinutes}
                answerSeconds={answerSeconds}
                answerRetryUsed={answerRetryUsed}
                currentQuestionType={currentQuestionType}
                currentQuestionIdx={currentQuestionIdx}
                currentCommonQuestionIdx={currentCommonQuestionIdx}
                currentSpecialQuestion={currentSpecialQuestion}
                handleRetryAnswer={handleRetryAnswer}
                handleUserStop={handleUserStop}
                getCurrentAnswerKey={getCurrentAnswerKey}
              />

              <LottieView
                lottieRef={lottieRef}
                audioRef={audioRef}
                mode={mode}
                selectedTitle={selectedTitle}
                audioBlocked={audioBlocked}
                onLottieComplete={onLottieComplete}
                onAudioPlaying={onAudioPlaying}
                onAudioEnded={onAudioEnded}
                onAudioError={onAudioError}
                onEnableAudio={async () => {
                  try {
                    setAudioBlocked(false);
                    await audioRef.current?.play();
                  } catch (e) {
                    console.error(e);
                  }
                }}
              />
            </Flex>

            {/* Current Question Info */}
            <QuestionInfo
              currentQuestionIdx={currentQuestionIdx}
              currentCommonQuestionIdx={currentCommonQuestionIdx}
              currentSpecialQuestion={currentSpecialQuestion}
              currentQuestionType={currentQuestionType}
              selectedTitle={selectedTitle}
              commonQuestions={commonQuestions}
              interviewQuestions={interviewQuestions}
            />

            {/* Modals */}
            <RetryPromptModal
              isOpen={showRetryPrompt}
              promptRetryUsed={promptRetryUsed}
              retryCountdown={retryCountdown}
              onRetryPrompt={handleRetryPrompt}
              onStartRecording={() => {
                setShowRetryPrompt(false);
                beginAnswerCountdown();
              }}
            />

            <StartInterviewReadyModal
              isOpen={showStartInterviewReady}
              onReady={handleStartInterviewReady}
            />

            <ImReadyModal isOpen={showReadyButton} onReady={handleImReady} />

            <RelaxationTimeModal
              isOpen={showRelaxationTime}
              countdown={relaxationCountdown}
            />

            {/* Submit button */}
            {showControls && (
              <Box mt={4} textAlign="center">
                <Button
                  colorScheme="green"
                  size="lg"
                  onClick={handleSubmitVideos}
                  isLoading={submitting}
                  isDisabled={recording || recordedAnswers.length === 0}
                >
                  Submit Interview
                </Button>
              </Box>
            )}
          </>
        ) : (
          <InterviewIntro
            canDoMock={canDoMock}
            checkingMockStatus={checkingMockStatus}
            interviewQuestionsLength={interviewQuestions.length}
            onStartInterview={handleStartInterviewClick}
          />
        )}
      </Box>

      {/* Exit Warning Modal */}
      <ExitWarningModal
        isOpen={showExitWarning}
        onClose={handleExitCancel}
        onConfirm={handleExitConfirm}
        answeredQuestionsCount={answeredQuestionsCount}
        totalQuestionsCount={totalQuestionsCount}
      />

      {/* Start Interview Warning Modal */}
      <StartInterviewWarningModal
        isOpen={showWarningModal}
        onClose={handleCancelStartInterview}
        onConfirm={handleConfirmStartInterview}
      />

      <Footer />
    </Box>
  );
};

export default MockInterviewQuestionsPage;
