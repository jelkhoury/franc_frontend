import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  Image,
  useToast,
  Spinner,
  HStack,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
} from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { CheckCircleIcon } from '@chakra-ui/icons';
import Footer from '../../components/Footer';
import Webcam from 'react-webcam';
import { useTimer } from 'react-timer-hook';

const questionBank = {
  Nursing: [
    { title: 'Why did you choose Nursing?', video: '/assets/videos/file1.mp4' },
    { title: 'Describe a time you handled a stressful situation.', video: '/assets/videos/file2.mp4' },
  ],
  Business: [
    { title: 'What interests you about Business?', video: '/assets/videos/file1.mp4' },
    { title: 'How do you handle teamwork?', video: '/assets/videos/file2.mp4' },
  ],
  Engineering: [
    { title: 'Why Engineering?', video: '/assets/videos/file1.mp4' },
    { title: 'Describe a technical challenge you solved.', video: '/assets/videos/file2.mp4' },
  ],
};

const INTERVIEW_DURATION_MINUTES = 10; // Example: 10 min for the whole interview
const ANSWER_DURATION_SECONDS = 5; // 1 min per answer

const MockInterviewQuestionsPage = () => {
  const location = useLocation();
  const major = location.state?.major || 'Nursing';
  const questions = questionBank[major] || [];
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [videoEnded, setVideoEnded] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordedAnswers, setRecordedAnswers] = useState([]); // {questionIdx, blob}
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState([]); // [idx]
  const webcamRef = useRef(null);
  const toast = useToast();
  const [webcamReady, setWebcamReady] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [countdownActive, setCountdownActive] = useState(false);

  const [interviewStarted, setInterviewStarted] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [displayedQuestions, setDisplayedQuestions] = useState([]);
  const navigate = useNavigate();

  // Interview timer
  const interviewEnd = new Date();
  interviewEnd.setMinutes(interviewEnd.getMinutes() + INTERVIEW_DURATION_MINUTES);
  const {
    seconds: interviewSeconds,
    minutes: interviewMinutes,
    hours: interviewHours,
    isRunning: interviewRunning,
    restart: restartInterviewTimer,
  } = useTimer({ expiryTimestamp: interviewEnd, autoStart: true });

  // Per-answer timer
  const [answerTimerKey, setAnswerTimerKey] = useState(0);
  const [answerTimerActive, setAnswerTimerActive] = useState(false);
  const [answerTimerExpired, setAnswerTimerExpired] = useState(false);
  const {
    seconds: answerSeconds,
    minutes: answerMinutes,
    isRunning: answerRunning,
    start: startAnswerTimer,
    pause: pauseAnswerTimer,
    restart: restartAnswerTimer,
  } = useTimer({
    expiryTimestamp: new Date(),
    autoStart: false,
    onExpire: () => {
      setAnswerTimerExpired(true);
      handleAnswerTimeout();
    },
  });

  // Open video (no modal)
  const handlePlay = (video, title, idx) => {
    setSelectedVideo(video);
    setSelectedTitle(title);
    setCurrentQuestionIdx(idx);
    setVideoEnded(false);
    setShowRecorder(false);
    setShowControls(false);
    setRecording(false);
    setRecordedChunks([]);
    setWebcamReady(false);
    setAnswerTimerExpired(false);
  };

  // When video ends, show a countdown before starting recorder/timer
  const handleVideoEnded = () => {
    setIsVideoModalOpen(false);
    setVideoEnded(true);
    setShowRecorder(true);
    setWebcamReady(false);
    setAnswerTimerExpired(false);

    let countdown = 5;
    toast({
      title: `Starting in ${countdown}...`,
      status: 'info',
      duration: 1000,
      isClosable: false,
    });

    const interval = setInterval(() => {
      countdown -= 1;
      if (countdown > 0) {
        toast({
          title: `Starting in ${countdown}...`,
          status: 'info',
          duration: 1000,
          isClosable: false,
        });
      } else {
        clearInterval(interval);
        setCountdownActive(false);
        // Wait for webcam to be ready, then start recording
        if (webcamRef.current?.video?.srcObject) {
          setWebcamReady(true);
          handleStartRecording();
          restartAnswerTimer(new Date(Date.now() + ANSWER_DURATION_SECONDS * 1000), true);
          toast({ title: 'Recording started', status: 'info', duration: 2000 });
        } else {
          toast({ title: 'Waiting for webcam...', status: 'warning', duration: 2000 });
        }
      }
    }, 1000);
  };

  useEffect(() => {
    if (showRecorder && webcamReady && !recording) {
      handleStartRecording();
      restartAnswerTimer(new Date(Date.now() + ANSWER_DURATION_SECONDS * 1000), true);
      toast({ title: 'Recording started', status: 'info', duration: 2000 });
    }
  }, [showRecorder, webcamReady]);

  // Start recording and answer timer
  const handleStartRecording = () => {
    setRecordedChunks([]);
    setShowControls(false);
    const videoElement = webcamRef.current?.video;
    if (!videoElement || !videoElement.srcObject) {
      toast({ title: 'Webcam not ready', status: 'error' });
      return;
    }
    const stream = videoElement.srcObject;
    const mr = new window.MediaRecorder(stream, { mimeType: 'video/webm' });
    setMediaRecorder(mr);
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) {
        setRecordedChunks((prev) => [...prev, e.data]);
      }
    };
    mr.onstop = () => {
      setRecording(false);
    };
    mr.start();
    setRecording(true);

    // Start answer timer
    setAnswerTimerKey((k) => k + 1); // This will force the timer to remount
  };

  // Stop recording and save
  const handleStopRecording = (auto = false) => {
    if (mediaRecorder) {
      setShowControls(true); // Ensure controls are shown immediately
      mediaRecorder.stop();
      setSaving(true);
      setTimeout(() => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        setRecordedAnswers((prev) => [
          ...prev.filter((a) => a.questionIdx !== currentQuestionIdx),
          { questionIdx: currentQuestionIdx, blob },
        ]);
        setAnsweredQuestions((prev) => [...prev, currentQuestionIdx]);
        setSaving(false);
        setShowRecorder(false);
        setMediaRecorder(null);
        setAnswerTimerActive(false);
        if (auto) toast({ title: 'Recording stopped', status: 'info', duration: 2000 });
      }, 500);
    }
  };

  // When answer timer expires
  const handleAnswerTimeout = () => {
    if (recording) {
      handleStopRecording(true);
      setShowControls(true); // Ensure it's explicitly shown after timer expires
    }
  };

  // Allow user to stop and save early
  const handleUserStop = () => {
    pauseAnswerTimer();
    handleStopRecording(false);
  };

  // Disable question if answered
  const isQuestionAnswered = (idx) => answeredQuestions.includes(idx);

  // Interview timer display
  const interviewTimerDisplay = `${interviewHours.toString().padStart(2, '0')}:${interviewMinutes
    .toString()
    .padStart(2, '0')}:${interviewSeconds.toString().padStart(2, '0')}`;

  // Per-answer timer display
  const answerTimerDisplay = `${answerMinutes.toString().padStart(2, '0')}:${answerSeconds
    .toString()
    .padStart(2, '0')}`;

  // Reset interview timer on mount
  useEffect(() => {
    const end = new Date();
    end.setMinutes(end.getMinutes() + INTERVIEW_DURATION_MINUTES);
    restartInterviewTimer(end, true);
    // eslint-disable-next-line
  }, []);

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-r, white, #ebf8ff)"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      {/* Interview Timer */}
      <Box textAlign="center" py={4}>
      </Box>
      <Box px={4} py={8}>
        <Heading size="lg" mb={4} textAlign="center">
          Interview Questions - {major}
        </Heading>
        {showThankYou ? (
          <Box textAlign="center" py={10} px={6}>
            <CheckCircleIcon boxSize={'50px'} color={'green.500'} />
            <Heading as="h2" size="xl" mt={6} mb={2}>
              Interview Complete
            </Heading>
            <Text color={'gray.500'} mb={6}>
              Thank you! Your responses have been submitted successfully.
            </Text>
            <Button colorScheme="blue" onClick={() => navigate('/')}>
              Return to Home
            </Button>
          </Box>
        ) : interviewStarted ? (
          <>
            <Flex direction={{ base: 'column', md: 'row' }} gap={6} align="start">
              <Box flex="1">
                <Webcam
                  audio={true}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ width: 480, height: 360 }}
                  style={{ borderRadius: '10px', display: 'block', width: '100%' }}
                  mirrored={true}
                  onUserMedia={() => setWebcamReady(true)}
                />
                {recording && (
                  <Text mt={2} fontWeight="bold" color="red.500" textAlign="center">
                    Recording...
                  </Text>
                )}
              </Box>
              <Box flex="1" bg="gray.50" p={4} borderRadius="lg" boxShadow="sm" maxH="400px" overflowY="auto">
                <Heading size="sm" mb={2}>Questions</Heading>
                {displayedQuestions.map((idx) => (
                  <Box
                    key={idx}
                    p={3}
                    mb={3}
                    bg={idx === currentQuestionIdx ? 'blue.50' : 'gray.100'}
                    borderRadius="md"
                  >
                    <Flex justify="space-between" align="center">
                      <Text fontWeight="bold">Q{idx + 1}: {questions[idx].title}</Text>
                      {!isQuestionAnswered(idx) && (
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() => {
                            setSelectedTitle(questions[idx].title);
                            setSelectedVideo(questions[idx].video);
                            setCurrentQuestionIdx(idx);
                            setIsVideoModalOpen(true);
                          }}
                          isDisabled={recording || countdownActive}
                        >
                          Show
                        </Button>
                      )}
                    </Flex>
                  </Box>
                ))}
              </Box>
            </Flex>
            {currentQuestionIdx !== null &&
              !selectedVideo &&
              !isQuestionAnswered(currentQuestionIdx) && (
                <Box mt={6} p={4} bg="gray.100" borderRadius="md" boxShadow="sm">
                  <Text fontWeight="bold">Q{currentQuestionIdx + 1}: {questions[currentQuestionIdx].title}</Text>
                  <Button mt={3} colorScheme="blue" onClick={() => {
                    const idx = currentQuestionIdx;
                    setSelectedTitle(questions[idx].title);
                    setSelectedVideo(questions[idx].video);
                    setCurrentQuestionIdx(idx);
                    setIsVideoModalOpen(true);
                  }} isDisabled={recording || countdownActive}>
                    Show
                  </Button>
                </Box>
            )}
            {(showRecorder || showControls) && (
              <Box mt={4}>
                <AnswerTimer
                  key={answerTimerKey}
                  duration={ANSWER_DURATION_SECONDS}
                  onExpire={handleUserStop}
                  recording={recording}
                />
              </Box>
            )}

            {(showRecorder || showControls) && (
              <HStack mt={4} justify="center">
                <Button
                  colorScheme="gray"
                  onClick={() => {
                    setShowControls(false);
                    setSelectedTitle(questions[currentQuestionIdx].title);
                    setSelectedVideo(questions[currentQuestionIdx].video);
                    setRecordedChunks([]);
                    setRecording(false);
                    setIsVideoModalOpen(true);
                  }}
                  isDisabled={recording}
                >
                  Retry
                </Button>
                {currentQuestionIdx === questions.length - 1 ? (
                  <Button
                    colorScheme="green"
                    onClick={() => setShowThankYou(true)}
                    isDisabled={recording}
                  >
                    Submit
                  </Button>
                ) : (
                  <Button
                    colorScheme="blue"
                    onClick={async () => {
                      setShowControls(false);
                      await handleUserStop();

                      const nextIdx = currentQuestionIdx + 1;
                      if (nextIdx < questions.length) {
                        if (!displayedQuestions.includes(nextIdx)) {
                          setDisplayedQuestions(prev => [...prev, nextIdx]);
                        }
                        setTimeout(() => {
                          setSelectedTitle(questions[nextIdx].title);
                          setSelectedVideo(questions[nextIdx].video);
                          setCurrentQuestionIdx(nextIdx);
                          setIsVideoModalOpen(true);
                        }, 500);
                      }
                    }} isDisabled={countdownActive}                  
                    >
                    Next Question
                  </Button>
                )}
              </HStack>
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
              <Heading size="md" mb={2} textAlign="center" color="gray.700">How the Interview Works</Heading>
              <VStack spacing={3} align="start" fontSize="sm" color="gray.600" as="ul" pl={4}>
                <Text as="li">Click "Start Interview" to begin.</Text>
                <Text as="li">You'll see the first interview question as a card with a "Show" button.</Text>
                <Text as="li">Click "Show" to watch a short video prompt for that question.</Text>
                <Text as="li">After the video ends, you'll get a 5-second countdown.</Text>
                <Text as="li">Your webcam will start recording your answer for a limited time.</Text>
                <Text as="li">You can either "Retry" the question or click "Next Question" to move on.</Text>
                <Text as="li">At the end, all your recorded answers will be saved.</Text>
              </VStack>
            </Box>
            <Button
              colorScheme="blue"
              size="lg"
              onClick={() => {
                setInterviewStarted(true);
                setCurrentQuestionIdx(0);
                setDisplayedQuestions([0]);
                setTimeout(() => handlePlay(questions[0].video, questions[0].title, 0), 500);
              }}
              display="block"
              mx="auto"
            >
              Start Interview
            </Button>
          </>
        )}
      </Box>
      <Footer />
      <Modal isOpen={isVideoModalOpen} onClose={() => setIsVideoModalOpen(false)} size="6xl" isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="lg" p={4} bg="gray.50">
          <ModalHeader fontSize="xl" fontWeight="bold">{selectedTitle}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box overflow="hidden" borderRadius="md" boxShadow="lg">
              <video
                src={selectedVideo}
                controls
                width="100%"
                style={{ borderRadius: '8px' }}
                onEnded={handleVideoEnded}
              />
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
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
      Answer Timer: {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
    </Heading>
  );
};

export default MockInterviewQuestionsPage;