import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Button, Heading, Text, VStack, HStack, Flex, SimpleGrid, useToast, Spinner,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  Alert, AlertIcon,
} from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircleIcon } from '@chakra-ui/icons';
import Webcam from 'react-webcam';
import { useTimer } from 'react-timer-hook';
import Footer from '../../components/Footer';
import { getStoredToken, decodeToken } from '../../utils/tokenUtils';

import Lottie from 'lottie-react';
import gptTalking from '../../assets/animations/chat_animation.json';
import fallbackVoiceover from '../../assets/audio/voiceover.m4a';

const INTERVIEW_DURATION_MINUTES = 10;
const COMMON_QUESTION_DURATION_SECONDS = 60; // 1 minute
const CANDIDATE_QUESTION_DURATION_SECONDS = 60; // 1 minute
const MAJOR_QUESTION_DURATION_SECONDS = 120; // 2 minutes
const RELAXATION_TIME_SECONDS = 10; // 10 seconds

/** Lottie segments @ ~24fps */
const SEGMENTS = {
  listening:  [0, 90],  
  start_talk: [70, 90],
  talkingA:   [90, 130],
  talkingB:   [129, 170],
  talkingC:   [168, 190],
  thinking:   [206, 273],  // idle
  end_talk2:  [0, 43],     // post-prompt flourish
};
const TRIM = 1;
const trim = ([s, e]) => [s + TRIM, Math.max(s + TRIM + 1, e - TRIM)];
const THINKING_LOOP = [trim(SEGMENTS.thinking)];
const LISTENING_LOOP = [trim(SEGMENTS.listening)];
const TALKING_CHAIN = [SEGMENTS.talkingA, SEGMENTS.talkingB, SEGMENTS.talkingC].map(trim);
const END_TALK2_ONCE = [trim(SEGMENTS.end_talk2)];
const START_TALK_ONCE = [trim(SEGMENTS.start_talk)];

const MODE_COPY = {
  thinkingLoop: {
    text: '🤔 Thinking...',
    bg: 'purple.50', color: 'purple.700'
  },
  start_talk: {
    text: '🎬 Getting ready...',
    bg: 'orange.50', color: 'orange.700'
  },
  talkingChain: {
    text: '🗣️ Talking...',
    bg: 'blue.100', color: 'blue.700'
  },
  listeningLoop: {
    text: '👂 Listening...',
    bg: 'green.50', color: 'green.700'
  },
  end_talk2: {
    text: '✨ Done!',
    bg: 'pink.50', color: 'pink.700'
  },
};



const MockInterviewQuestionsPage = () => {
  const location = useLocation();
  const major = location.state?.major || 'Nursing & Healthcare';
  const navigate = useNavigate();
  const toast = useToast();

  // Helper function to get answer duration based on question type
  const getAnswerDuration = (questionType) => {
    if (questionType === 'common') return COMMON_QUESTION_DURATION_SECONDS;
    if (questionType === 'special') return CANDIDATE_QUESTION_DURATION_SECONDS;
    return MAJOR_QUESTION_DURATION_SECONDS; // default to major
  };

  // lottie mode (and a ref so we don't fight with segments)
  const [mode, setModeState] = useState('thinkingLoop');

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
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [showReadyButton, setShowReadyButton] = useState(false);
  const [totalReplayCount, setTotalReplayCount] = useState(0);
  
  // Special question flow states
  const [showOpeningMessage, setShowOpeningMessage] = useState(false);
  const [showCandidateQuestion, setShowCandidateQuestion] = useState(false);
  const [showClosingMessage, setShowClosingMessage] = useState(false);
  const [currentSpecialQuestion, setCurrentSpecialQuestion] = useState(null);

  // prompt/audio
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(null);
  const [currentCommonQuestionIdx, setCurrentCommonQuestionIdx] = useState(null);
  const [currentQuestionType, setCurrentQuestionType] = useState(null); // 'common' | 'major' | 'special'
  const [selectedTitle, setSelectedTitle] = useState('');
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
  const modeRef = useRef('thinkingLoop'); // 'thinkingLoop' | 'listeningLoop' | 'talkingChain' | 'end_talk2'

  // queue helper
  const queueSegments = (segments, { forceFirst = true } = {}) => {
    const inst = lottieRef.current;
    if (!inst || !segments?.length) return;
    inst.playSegments(segments[0], forceFirst);
    for (let i = 1; i < segments.length; i++) inst.playSegments(segments[i], false);
  };

  const setMode = (m) => {
    if (modeRef.current === m) return;
    modeRef.current = m;
    setModeState(m); // <-- make UI reactive

    switch (m) {
      case 'listeningLoop':
        queueSegments(LISTENING_LOOP, { forceFirst: true });
        break;
      case 'talkingChain':
        queueSegments(TALKING_CHAIN, { forceFirst: true });
        break;
      case 'end_talk2':
        queueSegments(END_TALK2_ONCE, { forceFirst: true });
        break;
      case 'start_talk':
        queueSegments(START_TALK_ONCE, { forceFirst: true });
        break;
      case 'thinkingLoop':
      default:
        queueSegments(THINKING_LOOP, { forceFirst: true });
        break;
    }
  };


  const onLottieComplete = () => {
    // keep looping current mode
    if (modeRef.current === 'thinkingLoop') queueSegments(THINKING_LOOP, { forceFirst: true });
    if (modeRef.current === 'listeningLoop') queueSegments(LISTENING_LOOP, { forceFirst: true });
    if (modeRef.current === 'talkingChain') queueSegments(TALKING_CHAIN, { forceFirst: true });
    if (modeRef.current === 'start_talk') {
      // Intro finished → switch to the chain once
      setMode('talkingChain');
      return;
    }
    if (modeRef.current === 'end_talk2') {
      setMode('thinkingLoop');
      if (pendingStartRef.current) {
        pendingStartRef.current = false;
        // Don't start countdown immediately, show retry prompt instead
      }
    }
  };

  // ensure idle (thinking) starts once Lottie instance exists
  useEffect(() => {
    let tries = 0;
    const t = setInterval(() => {
      const inst = lottieRef.current;
      if (inst && typeof inst.playSegments === 'function') {
        setMode('thinkingLoop'); // autoplay idle on load
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
  interviewEnd.setMinutes(interviewEnd.getMinutes() + INTERVIEW_DURATION_MINUTES);
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
  const currentAnswerDuration = currentQuestionType ? getAnswerDuration(currentQuestionType) : MAJOR_QUESTION_DURATION_SECONDS;

  // duration ticker
  useEffect(() => {
    let interval;
    if (interviewStarted && interviewStartTime) {
      interval = setInterval(() => {
        setInterviewDuration(Math.floor((Date.now() - interviewStartTime) / 1000));
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
  const checkMockInterviewStatus = async () => {
    try {
      setCheckingMockStatus(true);
      const token = getStoredToken();
      if (!token) throw new Error('User not authenticated');
      const decoded = decodeToken(token);
      if (!decoded) throw new Error('Invalid token');
      const userId = parseInt(decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']);
      const baseUrl = process.env.REACT_APP_API_BASE_URL;
      const res = await fetch(`${baseUrl}/api/Evaluation/can-do-mock/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to check mock interview status');
      const data = await res.json();
      setCanDoMock(data.canDoMock);
      if (!data.canDoMock) {
        toast({
          title: 'Cannot Start Interview',
          description: 'You cannot do another interview right now. Please try again later.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: err.message, status: 'error', duration: 5000, isClosable: true });
    } finally {
      setCheckingMockStatus(false);
    }
  };
  useEffect(() => { checkMockInterviewStatus(); /* eslint-disable-line */ }, []);

  // Auto-start retry countdown when retry prompt is shown
  useEffect(() => {
    if (showRetryPrompt && retryCountdown > 0) {
      const timer = setTimeout(() => {
        setRetryCountdown(prev => prev - 1);
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
      e.returnValue = "Are you sure you want to leave? You will miss the interview and lose your chance and answers.";
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
  }, [interviewStarted]);

  // fetch questions with fallback
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const baseUrl = process.env.REACT_APP_API_BASE_URL ;
        const encodedMajorName = encodeURIComponent(major);
        const res = await fetch(`${baseUrl}/api/BlobStorage/random-questions?majorName=${encodedMajorName}&count=5`);
        if (!res.ok) throw new Error('Failed to fetch questions');
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
          setQuestions([{ questionId: 'fallback-1', title: 'Tell me about yourself.', videoUrl: fallbackVoiceover }]);
        } else {
          setQuestions(data);
          
          // Filter questions into three categories
          const specialTitles = ['Opening Message', 'Candidate Question', 'Closing Message'];
          const specialQuestionsObj = {};
          const commonQuestionsList = [];
          const interviewQuestionsList = [];
          
          data.forEach(question => {
            if (specialTitles.includes(question.title)) {
              specialQuestionsObj[question.title] = question;
            } else if (question.title === 'Common Question') {
              commonQuestionsList.push(question);
            } else {
              interviewQuestionsList.push(question);
            }
          });
          
          setSpecialQuestions(specialQuestionsObj);
          setCommonQuestions(commonQuestionsList);
          setInterviewQuestions(interviewQuestionsList);
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
        const fallbackQuestion = { questionId: 'fallback-1', title: 'Tell me about yourself.', videoUrl: fallbackVoiceover };
        setQuestions([fallbackQuestion]);
        setInterviewQuestions([fallbackQuestion]);
        setCommonQuestions([]);
        setSpecialQuestions({});
        toast({ title: 'Error loading questions', description: err.message, status: 'error', duration: 5000, isClosable: true });
      } finally {
        setLoading(false);
      }
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
    setMode('start_talk');
    
    try {
      if (audioRef.current) {
        audioRef.current.src = specialQuestion.videoUrl || '';
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
      }
    } catch (e) {
      console.error('Audio play blocked:', e);
      setAudioBlocked(true);
      toast({
        title: 'Enable audio',
        description: 'Click "Enable Audio" to start the audio.',
        status: 'warning',
        duration: 3000,
      });
    }
  };

  const onSpecialQuestionAudioEnded = () => {
    setMode('end_talk2');
    
    // Handle different special question types
    if (currentSpecialQuestion?.title === 'Opening Message') {
      setShowOpeningMessage(false);
      setShowReadyButton(true);
    } else if (currentSpecialQuestion?.title === 'Candidate Question') {
      setShowCandidateQuestion(false);
      setCurrentQuestionType('special');
      // Start recording for candidate question
      setTimeout(() => {
        setShowRecorder(true);
        if (webcamRef.current?.video?.srcObject) {
          handleStartRecording();
          const duration = getAnswerDuration('special');
          restartAnswerTimer(new Date(Date.now() + duration * 1000), true);
          toast({ title: 'Recording started', status: 'info', duration: 2000 });
        }
      }, 1000);
    } else if (currentSpecialQuestion?.title === 'Closing Message') {
      setShowClosingMessage(false);
      setShowControls(true);
    }
  };

  // ---- prompt audio & animation ----
  const playQuestionPrompt = async (audioUrl, title, idx, questionType = 'major') => {
    // Set appropriate index based on question type
    if (questionType === 'common') {
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
    setMode('start_talk');

    // 2) Start the audio right away; when intro completes, onComplete switches to the chain
    try {
      if (audioRef.current) {
        audioRef.current.src = audioUrl || '';
        audioRef.current.currentTime = 0;
        await audioRef.current.play(); // user gesture
      }
    } catch (e) {
      console.error('Audio play blocked:', e);
      setAudioBlocked(true);
      toast({
        title: 'Enable audio',
        description: 'Click "Enable Audio" to start the question audio.',
        status: 'warning',
        duration: 3000,
      });
    }
  };

  const onAudioPlaying = () => {
    // ensure we’re in talk mode as soon as audio actually starts
    setMode('talkingChain');
  };

  const onAudioEnded = () => {
    // Check if this is a special question
    if (currentSpecialQuestion) {
      onSpecialQuestionAudioEnded();
      return;
    }
    
    // After prompt: end_talk2 once, then show retry prompt
    pendingStartRef.current = true;
    setMode('end_talk2');
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
    setMode('end_talk2');
    setShowRetryPrompt(true);
    setRetryCountdown(5);
  };

  // ---- countdown & recording ----
  const beginAnswerCountdown = () => {
    const duration = getAnswerDuration(currentQuestionType);
    let countdown = 5;
    toast({ title: `Starting in ${countdown}...`, status: 'info', duration: 1000, isClosable: false });
    const interval = setInterval(() => {
      countdown -= 1;
      if (countdown > 0) {
        toast({ title: `Starting in ${countdown}...`, status: 'info', duration: 1000, isClosable: false });
      } else {
        clearInterval(interval);
        setShowRecorder(true);
        // start recording (switch Lottie to listening)
        if (webcamRef.current?.video?.srcObject) {
          handleStartRecording();
          restartAnswerTimer(new Date(Date.now() + duration * 1000), true);
          toast({ title: 'Recording started', status: 'info', duration: 2000 });
        } else {
          toast({ title: 'Waiting for webcam...', status: 'warning', duration: 2000 });
        }
      }
    }, 1000);
  };

  const handleStartRecording = () => {
    setRecordedChunks([]);
    setShowControls(false);
    setMode('listeningLoop'); // rule #2

    const videoElement = webcamRef.current?.video;
    if (!videoElement || !videoElement.srcObject) {
      toast({ title: 'Webcam not ready', status: 'error' });
      return;
    }
    const stream = videoElement.srcObject;
    const mr = new window.MediaRecorder(stream, { mimeType: 'video/webm' });
    setMediaRecorder(mr);

    mr.ondataavailable = (e) => { if (e.data.size > 0) setRecordedChunks((prev) => [...prev, e.data]); };
    mr.onstop = () => { setRecording(false); setMode('thinkingLoop'); };

    mr.start();
    setRecording(true);
  };

  const handleStopRecording = (auto = false) => {
    if (!mediaRecorder) return;
    const chunks = [];
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    mediaRecorder.onstop = () => {
      setRecording(false);
      if (chunks.length > 0) {
        const blob = new Blob(chunks, { type: 'video/webm' });
        
        // Determine question details based on current question type
        let questionId = null;
        let questionIdx = null;
        let questionType = currentQuestionType;
        
        if (currentQuestionType === 'common' && currentCommonQuestionIdx !== null) {
          questionIdx = currentCommonQuestionIdx;
          questionId = commonQuestions[currentCommonQuestionIdx]?.questionId;
        } else if (currentQuestionType === 'major' && currentQuestionIdx !== null) {
          questionIdx = currentQuestionIdx;
          questionId = interviewQuestions[currentQuestionIdx]?.questionId;
        } else if (currentSpecialQuestion?.title === 'Candidate Question') {
          questionType = 'special';
          questionId = currentSpecialQuestion?.questionId;
          questionIdx = 'candidate';
        }
        
        // Store answer with question type and ID
        const answerKey = questionType === 'common' 
          ? `common-${currentCommonQuestionIdx}`
          : questionType === 'major'
          ? `major-${currentQuestionIdx}`
          : `special-candidate`;
        
        setRecordedAnswers((prev) => [
          ...prev.filter((a) => a.answerKey !== answerKey),
          { 
            questionIdx, 
            blob, 
            questionType, 
            questionId,
            answerKey
          },
        ]);
        
        if (questionType !== 'special') {
          setAnsweredQuestions((prev) => [...prev, answerKey]);
        }
      }
      setShowRecorder(false);
      setMode('thinkingLoop');
      
      // Check if this was the candidate question
      if (currentSpecialQuestion?.title === 'Candidate Question') {
        // After candidate question, play closing message
        if (specialQuestions['Closing Message']) {
          setShowClosingMessage(true);
          setTimeout(() => {
            playSpecialQuestion('Closing Message');
          }, 500);
        } else {
          setShowControls(true);
        }
      } else if (currentQuestionType === 'common') {
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
            if (specialQuestions['Candidate Question']) {
              setShowCandidateQuestion(true);
              setTimeout(() => {
                playSpecialQuestion('Candidate Question');
              }, 500);
            } else if (specialQuestions['Closing Message']) {
              setShowClosingMessage(true);
              setTimeout(() => {
                playSpecialQuestion('Closing Message');
              }, 500);
            } else {
              setShowControls(true);
            }
          }
        }
      } else if (currentQuestionType === 'major') {
        // Major question flow
        if (currentQuestionIdx < interviewQuestions.length - 1) {
          // More major questions, continue with next
          startRelaxationTime();
        } else {
          // All major questions done, check for candidate question
          if (specialQuestions['Candidate Question']) {
            setShowCandidateQuestion(true);
            setTimeout(() => {
              playSpecialQuestion('Candidate Question');
            }, 500);
          } else {
            // No candidate question, go directly to closing message or submit
            if (specialQuestions['Closing Message']) {
              setShowClosingMessage(true);
              setTimeout(() => {
                playSpecialQuestion('Closing Message');
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

  const handleAnswerTimeout = () => { if (recording) handleStopRecording(true); };
  const handleUserStop = () => { pauseAnswerTimer(); handleStopRecording(false); };

  // ---- retry prompt functionality ----
  const handleRetryPrompt = () => {
    if (promptRetryUsed) return; // Only allow one retry
    setPromptRetryUsed(true);
    setShowRetryPrompt(false);
    setTotalReplayCount(prev => prev + 1); // Increment total replay count
    
    if (currentQuestionType === 'common' && currentCommonQuestionIdx !== null) {
      const q = commonQuestions[currentCommonQuestionIdx];
      playQuestionPrompt(q?.videoUrl, q?.title, currentCommonQuestionIdx, 'common');
    } else if (currentQuestionType === 'major' && currentQuestionIdx != null) {
      const q = interviewQuestions[currentQuestionIdx];
      playQuestionPrompt(q?.videoUrl, q?.title, currentQuestionIdx, 'major');
    }
  };

  const startRetryCountdown = () => {
    setRetryCountdown(5);
    const interval = setInterval(() => {
      setRetryCountdown(prev => {
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
      setRelaxationCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowRelaxationTime(false);
          setPromptRetryUsed(false); // Reset retry for next question
          setCurrentSpecialQuestion(null); // Reset special question state
          
          // Handle common questions
          if (currentQuestionType === 'common' && currentCommonQuestionIdx !== null) {
            const nextCommonIdx = currentCommonQuestionIdx + 1;
            if (nextCommonIdx < commonQuestions.length) {
              // Move to next common question
              const q = commonQuestions[nextCommonIdx];
              setSelectedTitle(q.title);
              setTimeout(() => { 
                playQuestionPrompt(q.videoUrl, q.title, nextCommonIdx, 'common'); 
              }, 300);
            } else {
              // All common questions done, move to first major question
              if (interviewQuestions.length > 0) {
                const q = interviewQuestions[0];
                setSelectedTitle(q.title);
                setTimeout(() => { 
                  playQuestionPrompt(q.videoUrl, q.title, 0, 'major'); 
                }, 300);
              } else {
                // No major questions, go to candidate question
                if (specialQuestions['Candidate Question']) {
                  setShowCandidateQuestion(true);
                  setTimeout(() => {
                    playSpecialQuestion('Candidate Question');
                  }, 500);
                } else if (specialQuestions['Closing Message']) {
                  setShowClosingMessage(true);
                  setTimeout(() => {
                    playSpecialQuestion('Closing Message');
                  }, 500);
                } else {
                  setShowControls(true);
                }
              }
            }
          } 
          // Handle major questions
          else if (currentQuestionType === 'major' && currentQuestionIdx !== null) {
            const nextMajorIdx = currentQuestionIdx + 1;
            if (nextMajorIdx < interviewQuestions.length) {
              // Move to next major question
              const q = interviewQuestions[nextMajorIdx];
              setSelectedTitle(q.title);
              setTimeout(() => { 
                playQuestionPrompt(q.videoUrl, q.title, nextMajorIdx, 'major'); 
              }, 300);
            } else {
              // All major questions completed, check for candidate question
              if (specialQuestions['Candidate Question']) {
                setShowCandidateQuestion(true);
                setTimeout(() => {
                  playSpecialQuestion('Candidate Question');
                }, 500);
              } else {
                // No candidate question, go directly to closing message or submit
                if (specialQuestions['Closing Message']) {
                  setShowClosingMessage(true);
                  setTimeout(() => {
                    playSpecialQuestion('Closing Message');
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

  const handleConfirmStartInterview = () => {
    setShowWarningModal(false);
    setInterviewStarted(true);
    setInterviewStartTime(Date.now());
    setInterviewDuration(0);
    setPromptRetryUsed(false);
    setCurrentQuestionIdx(null);
    setCurrentCommonQuestionIdx(null);
    setCurrentQuestionType(null);
    
    // Check if we have an opening message
    if (specialQuestions['Opening Message']) {
      setShowOpeningMessage(true);
      setTimeout(() => {
        playSpecialQuestion('Opening Message');
      }, 500);
    } else {
      // No opening message, go directly to ready button
      setShowReadyButton(true);
    }
    
    // ensure idle animation is running
    setMode('thinkingLoop');
  };

  const handleImReady = () => {
    setShowReadyButton(false);
    setCurrentSpecialQuestion(null); // Reset special question state
    // Start with first common question if exists, otherwise first major question
    setTimeout(() => { 
      if (commonQuestions.length > 0) {
        playQuestionPrompt(commonQuestions[0]?.videoUrl, commonQuestions[0]?.title, 0, 'common'); 
      } else if (interviewQuestions.length > 0) {
        playQuestionPrompt(interviewQuestions[0]?.videoUrl, interviewQuestions[0]?.title, 0, 'major'); 
      }
    }, 500);
  };

  const handleCancelStartInterview = () => {
    setShowWarningModal(false);
  };

  // ---- browser protection handlers ----
  const handleExitConfirm = () => {
    setShowExitWarning(false);
    navigate('/');
  };

  const handleExitCancel = () => {
    setShowExitWarning(false);
  };

  // ---- upload ----
  const handleSubmitVideos = async () => {
    if (recordedAnswers.length === 0) {
      toast({ title: 'No recordings to submit', description: 'Record at least one answer.', status: 'warning', duration: 3000, isClosable: true });
      return;
    }
    setSubmitting(true);
    try {
      const token = getStoredToken();
      if (!token) throw new Error('User not authenticated');
      const decoded = decodeToken(token);
      if (!decoded) throw new Error('Invalid token');
      const userId = parseInt(decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']);

      const formData = new FormData();
      const validAnswers = recordedAnswers.filter(a => a.blob && a.blob.size > 0);
      if (validAnswers.length === 0) throw new Error('No valid video recordings found');

      validAnswers.forEach((answer, index) => {
        const fileName = answer.questionType === 'common'
          ? `common_question_${answer.questionIdx + 1}.webm`
          : answer.questionType === 'major'
          ? `major_question_${answer.questionIdx + 1}.webm`
          : `candidate_question.webm`;
        const file = new File([answer.blob], fileName, { type: 'video/webm' });
        formData.append('Videos', file);
      });

      const duration = interviewDuration;
      const durationString = `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;
      formData.append('Duration', durationString);
      formData.append('UserId', String(userId));
      formData.append('NbOfTry', String(totalReplayCount));
      
      // Add question IDs from both common and major questions
      validAnswers.forEach((answer) => {
        if (answer.questionId) {
          formData.append('QuestionIds', String(answer.questionId));
        }
      });

      const baseUrl = process.env.REACT_APP_API_BASE_URL ;
      const res = await fetch(`${baseUrl}/api/BlobStorage/upload-mock-interview`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        let msg = 'Failed to upload videos';
        try { const err = await res.json(); msg = err.message || msg; } catch {}
        throw new Error(msg);
      }
      const result = await res.json();
      toast({
        title: 'Mock Interview completed successfully!',
        description: `Interview ID: ${result.mockInterviewId}. Duration: ${durationString}. Uploaded ${result.videoUrls.length} videos. Replays used: ${totalReplayCount}.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setShowThankYou(true);
      setInterviewStartTime(null);
      setInterviewDuration(0);
    } catch (err) {
      console.error(err);
      toast({ title: 'Upload failed', description: err.message, status: 'error', duration: 5000, isClosable: true });
    } finally {
      setSubmitting(false);
    }
  };

  // ---- UI helpers ----
  const isQuestionAnswered = (idx) => answeredQuestions.includes(idx);
  const interviewTimerDisplay = `${String(interviewHours).padStart(2, '0')}:${String(interviewMinutes).padStart(2, '0')}:${String(interviewSeconds).padStart(2, '0')}`;
  const answerTimerDisplay = `${String(answerMinutes).padStart(2, '0')}:${String(answerSeconds).padStart(2, '0')}`;

  // loading / error
  if (loading) {
    return (
      <Box minH="100vh" bgGradient="linear(to-r, white, #ebf8ff)" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} color="gray.600">Loading questions...</Text>
      </Box>
    );
  }
  if (error && interviewQuestions.length === 0) {
    return (
      <Box minH="100vh" bgGradient="linear(to-r, white, #ebf8ff)" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
        <Text color="red.500" fontSize="lg">Error: {error}</Text>
        <Button mt={4} colorScheme="blue" onClick={() => window.location.reload()}>Retry</Button>
      </Box>
    );
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
        <Box
          textAlign="center"
          py={4}
          bg="blue.50"
          borderBottom="1px"
          borderColor="blue.200"
        >
          <Text fontSize="lg" fontWeight="bold" color="blue.600">
            Interview Duration: {Math.floor(interviewDuration / 60)}:
            {(interviewDuration % 60).toString().padStart(2, "0")}
          </Text>
        </Box>
      )}

      <Box px={4} py={8}>
        <Heading color="brand.500" size="lg" mb={4} textAlign="center">
          Interview Questions - {major}
        </Heading>

        {showThankYou ? (
          <Box textAlign="center" py={10} px={6}>
            <CheckCircleIcon boxSize={"50px"} color={"green.500"} />
            <Heading color="brand.500" as="h2" size="xl" mt={6} mb={2}>
              Interview Complete
            </Heading>
            <Text color={"gray.500"} mb={6}>
              Thank you! Your responses have been submitted successfully.
            </Text>
            <Button colorScheme="blue" onClick={() => navigate("/")}>
              Return to Home
            </Button>
          </Box>
        ) : interviewStarted ? (
          <>
            {/* Top row: webcam | lottie */}
            <Flex
              gap={6}
              direction={{ base: "column", md: "row" }}
              align="stretch"
            >
              <Box
                flex="1"
                bg="white"
                borderRadius="lg"
                borderWidth="1px"
                boxShadow="md"
                p={4}
              >
                <Heading color="brand.500" size="sm" mb={3} color="gray.700">
                  Your Camera
                </Heading>
                <VStack spacing={4} align="stretch">
                  <Box
                    overflow="hidden"
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="gray.200"
                  >
                    <Webcam
                      //audio
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{ width: 480, height: 360 }}
                      style={{
                        borderRadius: "10px",
                        display: "block",
                        width: "100%",
                      }}
                      mirrored
                    />
                  </Box>
                  {showRecorder && recording && (
                    <VStack spacing={2} align="stretch">
                      <Box
                        bg="red.50"
                        p={2}
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor="red.200"
                      >
                        <Text
                          fontWeight="bold"
                          color="red.500"
                          textAlign="center"
                          mb={1}
                          fontSize="sm"
                        >
                          Recording...
                        </Text>
                        <Box>
                          <Text fontSize="xs" color="gray.600" mb={0.5} textAlign="center">
                            Time Remaining
                          </Text>
                          <Text fontSize="xl" fontWeight="bold" color="red.600" textAlign="center">
                            {String(answerMinutes).padStart(2, '0')}:{String(answerSeconds).padStart(2, '0')}
                          </Text>
                        </Box>
                      </Box>
                      <Button
                        colorScheme="red"
                        size="md"
                        onClick={handleUserStop}
                        isFullWidth
                      >
                        Stop Recording
                      </Button>
                    </VStack>
                  )}
                </VStack>
              </Box>

              <Box
                flex="1"
                bg="white"
                borderRadius="lg"
                borderWidth="1px"
                boxShadow="md"
                p={4}
                display="flex"
                flexDirection="column"
              >
                <Heading color="brand.500" size="sm" mb={3} color="gray.700">
                  Interviewer
                </Heading>

                <Box
                  // single card
                  overflow="hidden"
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="gray.200"
                  bg="blue.50" // 👈 very light blue background
                  display="flex"
                  alignItems="center"
                  justifyContent="center" // 👈 centers Lottie both ways
                  height="500px"
                  position="relative"
                  flex="1"
                  minH={0}
                >
                  {/* Title */}
                  <Box
                    position="absolute"
                    top="8px"
                    left="50%"
                    transform="translateX(-50%)"
                    bg="whiteAlpha.900"
                    px={3}
                    py={1}
                    borderRadius="md"
                    boxShadow="sm"
                    zIndex={3}
                  >
                    <Text fontSize="sm" fontWeight="semibold">
                      {selectedTitle || "—"}
                    </Text>
                  </Box>

                  {/* Lottie directly in the container */}
                  <Lottie
                    lottieRef={lottieRef}
                    animationData={gptTalking}
                    loop={false}
                    autoplay={false}
                    onComplete={onLottieComplete}
                    style={{
                      width: "70%", // responsive fit
                      maxWidth: 340, // prevent huge scaling
                      minWidth: 220,
                      height: "auto",
                      pointerEvents: "none",
                    }}
                  />

                  {/* Status pill */}
                  {(() => {
                    const s = MODE_COPY[mode] || MODE_COPY.thinkingLoop;
                    return (
                      <Box
                        position="absolute"
                        bottom="10px"
                        left="50%"
                        transform="translateX(-50%)"
                        bg={s.bg}
                        color={s.color}
                        px={4}
                        py={2}
                        borderRadius="md"
                        boxShadow="sm"
                        zIndex={3}
                      >
                        <Text fontSize="sm" fontWeight="medium">
                          {s.text}
                        </Text>
                      </Box>
                    );
                  })()}

                  {/* Hidden audio element */}
                  <audio
                    ref={audioRef}
                    preload="auto"
                    onPlaying={onAudioPlaying}
                    onEnded={onAudioEnded}
                    onError={onAudioError}
                  />
                </Box>

                {audioBlocked && (
                  <HStack mt={3} spacing={2} wrap="wrap">
                    <Button
                      size="sm"
                      colorScheme="pink"
                      onClick={async () => {
                        try {
                          setAudioBlocked(false);
                          await audioRef.current?.play();
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                    >
                      Enable Audio
                    </Button>
                  </HStack>
                )}
              </Box>
            </Flex>

            {/* Current Question Info - moved to top */}
            {(currentQuestionIdx !== null || currentCommonQuestionIdx !== null || currentSpecialQuestion) && (
              <Box
                mb={6}
                bg="white"
                borderRadius="lg"
                borderWidth="1px"
                boxShadow="md"
                p={4}
                textAlign="center"
              >
                {currentSpecialQuestion ? (
                  <>
                    <Heading color="brand.500" size="sm" mb={3} color="gray.700">
                      {currentSpecialQuestion.title}
                    </Heading>
                    <Text fontSize="lg" fontWeight="semibold" color="blue.600">
                      {selectedTitle}
                    </Text>
                  </>
                ) : currentQuestionType === 'common' && currentCommonQuestionIdx !== null ? (
                  <>
                    <Heading size="sm" mb={3} color="gray.700">
                      Common Question {currentCommonQuestionIdx + 1} of {commonQuestions.length}
                    </Heading>
                    <Text fontSize="lg" fontWeight="semibold" color="blue.600">
                      {selectedTitle}
                    </Text>
                  </>
                ) : (
                  <>
                    <Heading color="brand.500" size="sm" mb={3} color="gray.700">
                      Question {currentQuestionIdx + 1} of {interviewQuestions.length}
                    </Heading>
                    <Text fontSize="lg" fontWeight="semibold" color="blue.600">
                      {selectedTitle}
                    </Text>
                  </>
                )}
              </Box>
            )}

            {/* Retry Prompt Modal */}
            <Modal
              isOpen={showRetryPrompt}
              onClose={() => {}}
              isCentered
              closeOnOverlayClick={false}
            >
              <ModalOverlay />
              <ModalContent>
                <ModalHeader color="yellow.700">Ready to answer?</ModalHeader>
                <ModalBody>
                  <VStack spacing={4}>
                    <Text color="yellow.600">
                      You can replay the prompt once before recording starts.
                    </Text>
                    <HStack spacing={4}>
                      <Button
                        colorScheme="blue"
                        onClick={handleRetryPrompt}
                        isDisabled={promptRetryUsed}
                      >
                        {promptRetryUsed ? "Retry Used" : "Replay Prompt"}
                      </Button>
                      <Button
                        colorScheme="green"
                        onClick={() => {
                          setShowRetryPrompt(false);
                          beginAnswerCountdown();
                        }}
                      >
                        Start Recording ({retryCountdown})
                      </Button>
                    </HStack>
                  </VStack>
                </ModalBody>
              </ModalContent>
            </Modal>

            {/* I'm Ready Modal */}
            <Modal
              isOpen={showReadyButton}
              onClose={() => {}}
              isCentered
              closeOnOverlayClick={false}
            >
              <ModalOverlay />
              <ModalContent>
                <ModalHeader color="blue.700">Ready to Start?</ModalHeader>
                <ModalBody>
                  <VStack spacing={4}>
                    <Text color="blue.600">
                      Make sure you're in a quiet environment with good
                      lighting.
                    </Text>
                    <Button
                      colorScheme="green"
                      size="lg"
                      onClick={handleImReady}
                    >
                      I'm Ready - Start First Question
                    </Button>
                  </VStack>
                </ModalBody>
              </ModalContent>
            </Modal>

            {/* Relaxation Time Modal */}
            <Modal
              isOpen={showRelaxationTime}
              onClose={() => {}}
              isCentered
              closeOnOverlayClick={false}
            >
              <ModalOverlay />
              <ModalContent>
               
                <ModalBody>
                  <VStack spacing={4}>
                    <Text color="green.600">
                      Take a moment to relax before the next question.
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="green.500">
                      {relaxationCountdown}
                    </Text>
                  </VStack>
                </ModalBody>
              </ModalContent>
            </Modal>

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
          <>
            <Box
              mb={6}
              maxW="2xl"
              mx="auto"
              p={6}
              bg="white"
              borderRadius="lg"
              borderWidth="1px"
              boxShadow="md"
            >
              <Heading color="brand.500" size="md" mb={2} textAlign="center" color="gray.700">
                How the Interview Works
              </Heading>
              <VStack
                spacing={3}
                align="start"
                fontSize="sm"
                color="gray.600"
                as="ul"
                pl={4}
              >
                <Text as="li">
                  Click "Show" to hear the question (avatar “talks”).
                </Text>
                <Text as="li">
                  When the audio ends, a 5-second countdown starts.
                </Text>
                <Text as="li">
                  Retry or Go to the next question, then submit your answer
                </Text>
              </VStack>
            </Box>

            {!canDoMock && !checkingMockStatus && (
              <Box
                mt={4}
                p={4}
                bg="orange.50"
                border="1px"
                borderColor="orange.200"
                borderRadius="md"
                textAlign="center"
              >
                <Text color="orange.700" fontWeight="medium">
                  You cannot start another interview right now. Please try again
                  later.
                </Text>
              </Box>
            )}

            <VStack spacing={4}>
              <Button
                colorScheme="blue"
                size="lg"
                onClick={handleStartInterviewClick}
                isDisabled={
                  interviewQuestions.length === 0 || !canDoMock || checkingMockStatus
                }
                isLoading={checkingMockStatus}
              >
                {checkingMockStatus
                  ? "Checking..."
                  : !canDoMock
                  ? "Cannot Start Interview"
                  : "Start Interview"}
              </Button>
            </VStack>
          </>
        )}
      </Box>

      {/* Exit Warning Modal */}
      <Modal isOpen={showExitWarning} onClose={handleExitCancel} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader color="red.500">
            ⚠️ Warning: Leaving Interview
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Alert status="error" mb={4}>
              <AlertIcon />
              <Text fontWeight="bold">You will miss the interview!</Text>
            </Alert>

            <VStack align="stretch" spacing={4}>
              <Text>
                You are about to leave the mock interview. If you continue:
              </Text>

              <VStack align="stretch" spacing={2}>
                <Text>
                  •{" "}
                  <strong>
                    You will lose your chance to complete the interview
                  </strong>
                </Text>
                <Text>
                  • <strong>All your recorded answers will be lost</strong>
                </Text>
                <Text>
                  •{" "}
                  <strong>You'll need to start over from the beginning</strong>
                </Text>
              </VStack>

              <Alert status="warning" mt={4}>
                <AlertIcon />
                <Text fontSize="sm">
                  <strong>Progress:</strong> You have answered{" "}
                  {answeredQuestions.length} out of {commonQuestions.length + interviewQuestions.length}{" "}
                  questions.
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

      {/* Warning Modal */}
      <Modal
        isOpen={showWarningModal}
        onClose={handleCancelStartInterview}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader color="red.500">
            ⚠️ Warning: Starting Mock Interview
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Alert status="warning" mb={4}>
              <AlertIcon />
              <Text fontWeight="bold">
                Important: Interview will start now!
              </Text>
            </Alert>

            <VStack align="stretch" spacing={4}>
              <Text>Before proceeding, please ensure:</Text>

              <VStack align="stretch" spacing={2}>
                <Text>
                  • <strong>Check your internet connection</strong> - ensure
                  it's stable
                </Text>
                <Text>
                  • <strong>Check your camera and microphone</strong> - they
                  will be used for recording
                </Text>
                <Text>
                  • <strong>Do not navigate away</strong> - you will lose your
                  progress
                </Text>
                <Text>
                  • <strong>Do not close the browser</strong> - your answers
                  will not be recorded
                </Text>
              </VStack>

              <Alert status="error" mt={4}>
                <AlertIcon />
                <Text fontSize="sm">
                  <strong>Warning:</strong> If you leave this page or lose
                  connection during the interview, your answers will be lost and
                  you'll need to start over.
                </Text>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleCancelStartInterview}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleConfirmStartInterview}>
              I Understand - Start Interview
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Footer />
    </Box>
  );
};

// AnswerTimer component removed - using timer values directly from main component

export default MockInterviewQuestionsPage;
