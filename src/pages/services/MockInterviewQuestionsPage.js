import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Button, Heading, Text, VStack, HStack, Flex, SimpleGrid, useToast, Spinner,
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
const ANSWER_DURATION_SECONDS = 5;

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
    text: '🤔 idle mode: thinking deep thoughts… about snacks.',
    bg: 'purple.50', color: 'purple.700'
  },
  start_talk: {
    text: '🎬 warming up… “check, check, 1–2–3.”',
    bg: 'orange.50', color: 'orange.700'
  },
  talkingChain: {
    text: '🗣️ talking through the prompt—no heckling from the peanut gallery.',
    bg: 'blue.100', color: 'blue.700'
  },
  listeningLoop: {
    text: '👂 your turn! i’m all ears (metaphorically).',
    bg: 'green.50', color: 'green.700'
  },
  end_talk2: {
    text: '✨ wrap-up sparkle… aaand scene!',
    bg: 'pink.50', color: 'pink.700'
  },
};



const MockInterviewQuestionsPage = () => {
  const location = useLocation();
  const major = location.state?.major || 'Nursing & Healthcare';
  const navigate = useNavigate();
  const toast = useToast();

  // lottie mode (and a ref so we don't fight with segments)
  const [mode, setModeState] = useState('thinkingLoop');

  // data
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // flow
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [canDoMock, setCanDoMock] = useState(true);
  const [checkingMockStatus, setCheckingMockStatus] = useState(false);

  // prompt/audio
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(null);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [countdownActive, setCountdownActive] = useState(false);

  // recording
  const [showRecorder, setShowRecorder] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordedAnswers, setRecordedAnswers] = useState([]); // {questionIdx, blob}
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
        beginAnswerCountdown();
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
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5121/api';
      const res = await fetch(`${baseUrl}/Evaluation/can-do-mock/${userId}`, {
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

  // fetch questions with fallback
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5121/api';
        const encodedMajorName = encodeURIComponent(major);
        const res = await fetch(`${baseUrl}/BlobStorage/random-questions?majorName=${encodedMajorName}&count=5`);
        if (!res.ok) throw new Error('Failed to fetch questions');
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
          setQuestions([{ questionId: 'fallback-1', title: 'Tell me about yourself.', videoUrl: fallbackVoiceover }]);
        } else {
          setQuestions(data);
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
        setQuestions([{ questionId: 'fallback-1', title: 'Tell me about yourself.', videoUrl: fallbackVoiceover }]);
        toast({ title: 'Error loading questions', description: err.message, status: 'error', duration: 5000, isClosable: true });
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
    // eslint-disable-next-line
  }, [major]);

  // ---- prompt audio & animation ----
    const playQuestionPrompt = async (audioUrl, title, idx) => {
    setCurrentQuestionIdx(idx);
    setSelectedTitle(title);
    setAudioBlocked(false);
    setCountdownActive(true);

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
        description: 'Click “Enable Audio” to start the question audio.',
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
    // After prompt: end_talk2 once, then idle → begin countdown
    pendingStartRef.current = true;
    setMode('end_talk2');
  };

  const onAudioError = () => {
    // Treat as ended
    pendingStartRef.current = true;
    setMode('end_talk2');
  };

  // ---- countdown & recording ----
  const beginAnswerCountdown = () => {
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
          restartAnswerTimer(new Date(Date.now() + ANSWER_DURATION_SECONDS * 1000), true);
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
    setShowControls(true);
    const chunks = [];
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    mediaRecorder.onstop = () => {
      setRecording(false);
      if (chunks.length > 0) {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setRecordedAnswers((prev) => [
          ...prev.filter((a) => a.questionIdx !== currentQuestionIdx),
          { questionIdx: currentQuestionIdx, blob },
        ]);
        setAnsweredQuestions((prev) => [...prev, currentQuestionIdx]);
      }
      setShowRecorder(false);
      setMode('thinkingLoop');
    };
    mediaRecorder.stop();
  };

  const handleAnswerTimeout = () => { if (recording) handleStopRecording(true); };
  const handleUserStop = () => { pauseAnswerTimer(); handleStopRecording(false); };

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

      validAnswers.forEach((answer) => {
        const file = new File([answer.blob], `answer_${answer.questionIdx + 1}.webm`, { type: 'video/webm' });
        formData.append('Videos', file);
      });

      const duration = interviewDuration;
      const durationString = `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;
      formData.append('Duration', durationString);
      formData.append('UserId', String(userId));
      validAnswers.forEach((answer) => {
        const qid = questions[answer.questionIdx]?.questionId;
        if (qid) formData.append('QuestionIds', String(qid));
      });

      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5121/api';
      const res = await fetch(`${baseUrl}/BlobStorage/upload-mock-interview`, {
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
        description: `Interview ID: ${result.mockInterviewId}. Duration: ${durationString}. Uploaded ${result.videoUrls.length} videos.`,
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
  if (error && questions.length === 0) {
    return (
      <Box minH="100vh" bgGradient="linear(to-r, white, #ebf8ff)" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
        <Text color="red.500" fontSize="lg">Error: {error}</Text>
        <Button mt={4} colorScheme="blue" onClick={() => window.location.reload()}>Retry</Button>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bgGradient="linear(to-r, white, #ebf8ff)" display="flex" flexDirection="column" justifyContent="space-between">
      {interviewStarted && !showThankYou && (
        <Box textAlign="center" py={4} bg="blue.50" borderBottom="1px" borderColor="blue.200">
          <Text fontSize="lg" fontWeight="bold" color="blue.600">
            Interview Duration: {Math.floor(interviewDuration / 60)}:{(interviewDuration % 60).toString().padStart(2, '0')}
          </Text>
        </Box>
      )}

      <Box px={4} py={8}>
        <Heading size="lg" mb={4} textAlign="center">Interview Questions - {major}</Heading>

        {showThankYou ? (
          <Box textAlign="center" py={10} px={6}>
            <CheckCircleIcon boxSize={'50px'} color={'green.500'} />
            <Heading as="h2" size="xl" mt={6} mb={2}>Interview Complete</Heading>
            <Text color={'gray.500'} mb={6}>Thank you! Your responses have been submitted successfully.</Text>
            <Button colorScheme="blue" onClick={() => navigate('/')}>Return to Home</Button>
          </Box>
        ) : interviewStarted ? (
          <>
            {/* Top row: webcam | lottie */}
            <Flex gap={6} direction={{ base: 'column', md: 'row' }} align="stretch">
              <Box flex="1" bg="white" borderRadius="lg" borderWidth="1px" boxShadow="md" p={4}>
                <Heading size="sm" mb={3} color="gray.700">Your Camera</Heading>
                <Box overflow="hidden" borderRadius="md" borderWidth="1px" borderColor="gray.200">
                  <Webcam
                    //audio
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ width: 480, height: 360 }}
                    style={{ borderRadius: '10px', display: 'block', width: '100%' }}
                    mirrored
                  />
                </Box>
                {recording && <Text mt={2} fontWeight="bold" color="red.500" textAlign="center">Recording...</Text>}
              </Box>

<Box flex="1" bg="white" borderRadius="lg" borderWidth="1px" boxShadow="md" p={4}>
  <Heading size="sm" mb={3} color="gray.700">Interviewer</Heading>

  <Box
    // single card
    overflow="hidden"
    borderRadius="md"
    borderWidth="1px"
    borderColor="gray.200"
    bg="blue.50"                 // 👈 very light blue background
    display="flex"
    alignItems="center"
    justifyContent="center"      // 👈 centers Lottie both ways
    height="500px"
    position="relative"
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
        {selectedTitle || '—'}
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
        width: '70%',        // responsive fit
        maxWidth: 340,       // prevent huge scaling
        minWidth: 220,
        height: 'auto',
        pointerEvents: 'none'
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
          <Text fontSize="sm" fontWeight="medium">{s.text}</Text>
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


                <HStack mt={3} spacing={2} wrap="wrap">
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={() => {
                      if (currentQuestionIdx == null) return;
                      const q = questions[currentQuestionIdx];
                      playQuestionPrompt(q?.videoUrl, q?.title, currentQuestionIdx);
                    }}
                    isDisabled={currentQuestionIdx == null}
                  >
                    Replay Prompt
                  </Button>

                  {audioBlocked && (
                    <Button
                      size="sm"
                      colorScheme="pink"
                      onClick={async () => {
                        try {
                          setAudioBlocked(false);
                          await audioRef.current?.play();
                        } catch (e) { console.error(e); }
                      }}
                    >
                      Enable Audio
                    </Button>
                  )}
                </HStack>
              </Box>
            </Flex>

            {/* Questions */}
            <Box mt={8} bg="white" borderRadius="lg" borderWidth="1px" boxShadow="md" p={4}>
              <Heading size="sm" mb={3} color="gray.700">Questions</Heading>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3}>
                {questions.map((q, idx) => (
                  <Box key={q.questionId ?? idx} p={3} borderRadius="md" bg={idx === currentQuestionIdx ? 'blue.50' : 'gray.50'} borderWidth="1px" borderColor={idx === currentQuestionIdx ? 'blue.200' : 'gray.200'}>
                    <VStack align="stretch" spacing={2}>
                      <Text fontWeight="semibold">Q{idx + 1}</Text>
                      <Text fontSize="sm" color="gray.700">{q.title}</Text>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        variant={idx === currentQuestionIdx ? 'solid' : 'outline'}
                        onClick={() => {
                          setCurrentQuestionIdx(idx);
                          setSelectedTitle(q.title);
                          playQuestionPrompt(q.videoUrl, q.title, idx);
                        }}
                        isDisabled={recording || countdownActive}
                      >
                        Show
                      </Button>
                    </VStack>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>

            {/* Answer timer & controls */}
            {(showRecorder || showControls) && (
              <>
                <Box mt={4}>
                  <AnswerTimer
                    key={answerTimerKey}
                    duration={ANSWER_DURATION_SECONDS}
                    onExpire={handleUserStop}
                    recording={recording}
                  />
                </Box>
                <HStack mt={4} justify="center">
                  <Button
                    colorScheme="gray"
                    onClick={() => {
                      setShowControls(false);
                      if (currentQuestionIdx != null) {
                        const q = questions[currentQuestionIdx];
                        playQuestionPrompt(q?.videoUrl, q?.title, currentQuestionIdx);
                      }
                      setRecordedChunks([]);
                      setRecording(false);
                    }}
                    isDisabled={recording}
                  >
                    Retry
                  </Button>

                  {currentQuestionIdx === questions.length - 1 ? (
                    <Button
                      colorScheme="green"
                      onClick={handleSubmitVideos}
                      isLoading={submitting}
                      isDisabled={recording || recordedAnswers.length === 0}
                    >
                      Submit
                    </Button>
                  ) : (
                    <Button
                      colorScheme="blue"
                      onClick={() => {
                        setShowControls(false);
                        handleUserStop();
                        const nextIdx = (currentQuestionIdx ?? -1) + 1;
                        if (nextIdx < questions.length) {
                          const q = questions[nextIdx];
                          setCurrentQuestionIdx(nextIdx);
                          setSelectedTitle(q.title);
                          setTimeout(() => { playQuestionPrompt(q.videoUrl, q.title, nextIdx); }, 300);
                        }
                      }}
                      isDisabled={countdownActive}
                    >
                      Next Question
                    </Button>
                  )}
                </HStack>
              </>
            )}
          </>
        ) : (
          <>
            <Box mb={6} maxW="2xl" mx="auto" p={6} bg="white" borderRadius="lg" borderWidth="1px" boxShadow="md">
              <Heading size="md" mb={2} textAlign="center" color="gray.700">How the Interview Works</Heading>
              <VStack spacing={3} align="start" fontSize="sm" color="gray.600" as="ul" pl={4}>
                <Text as="li">Click "Start Interview" to begin.</Text>
                <Text as="li">Click "Show" to hear the prompt in the right container (avatar “talks”).</Text>
                <Text as="li">When the audio ends, the avatar plays a close (end_talk2) and a 5-second countdown starts.</Text>
                <Text as="li">Your webcam records your answer (avatar “listens”).</Text>
                <Text as="li">Retry or go to the next question, then submit.</Text>
              </VStack>
            </Box>

            {!canDoMock && !checkingMockStatus && (
              <Box mt={4} p={4} bg="orange.50" border="1px" borderColor="orange.200" borderRadius="md" textAlign="center">
                <Text color="orange.700" fontWeight="medium">You cannot start another interview right now. Please try again later.</Text>
              </Box>
            )}

            <VStack spacing={4}>
              <Button
                colorScheme="blue"
                size="lg"
                onClick={() => {
                  setInterviewStarted(true);
                  setInterviewStartTime(Date.now());
                  setInterviewDuration(0);
                  setCurrentQuestionIdx(0);
                  setSelectedTitle(questions[0]?.title || '');
                  // ensure idle animation is running
                  setMode('thinkingLoop');
                }}
                isDisabled={questions.length === 0 || !canDoMock || checkingMockStatus}
                isLoading={checkingMockStatus}
              >
                {checkingMockStatus ? 'Checking...' : !canDoMock ? 'Cannot Start Interview' : 'Start Interview'}
              </Button>
              <Text fontSize="sm" color="gray.600" textAlign="center">
                Start your mock interview with an animated assistant.
              </Text>
            </VStack>
          </>
        )}
      </Box>

      <Footer />
    </Box>
  );
};

const AnswerTimer = ({ duration, onExpire, recording }) => {
  const { seconds, minutes, isRunning, start, pause } = useTimer({
    expiryTimestamp: new Date(Date.now() + duration * 1000),
    autoStart: true,
    onExpire,
  });

  useEffect(() => {
    if (recording && !isRunning) start();
    if (!recording && isRunning) pause();
  }, [recording, isRunning, start, pause]);

  return (
    <Heading size="md" color="brand.500" mt={4} textAlign="center">
      Answer Timer: {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </Heading>
  );
};

export default MockInterviewQuestionsPage;
