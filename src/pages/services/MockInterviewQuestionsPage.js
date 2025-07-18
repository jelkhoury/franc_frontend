import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Image,
  HStack,
  Spinner,
  useToast,
  Icon,
} from '@chakra-ui/react';
import { useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import Footer from '../../components/Footer';
import Webcam from 'react-webcam';
import { useTimer } from 'react-timer-hook';
import { CheckCircleIcon } from '@chakra-ui/icons';

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
const ANSWER_DURATION_SECONDS = 60; // 1 min per answer

const MockInterviewQuestionsPage = () => {
  const location = useLocation();
  const major = location.state?.major || 'Nursing';
  const questions = questionBank[major] || [];
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [videoEnded, setVideoEnded] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
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
    onExpire: () => handleAnswerTimeout(),
  });

  // Open video modal
  const handlePlay = (video, title, idx) => {
    setSelectedVideo(video);
    setSelectedTitle(title);
    setCurrentQuestionIdx(idx);
    setVideoEnded(false);
    setShowRecorder(false);
    setRecording(false);
    setRecordedChunks([]);
    setWebcamReady(false);
    onOpen();
  };

  // When video ends, show recorder (webcam) and wait for webcam to be ready
  const handleVideoEnded = () => {
    setVideoEnded(true);
    setTimeout(() => {
      handleAnswerClick();
    }, 500);
  };

  // Show recorder and wait for webcam to be ready
  const handleAnswerClick = () => {
    setShowRecorder(true);
    setWebcamReady(false);
  };

  // Start recording and answer timer when webcam is ready
  useEffect(() => {
    if (showRecorder && webcamReady && !recording) {
      handleStartRecording();
      toast({ title: 'Recording started', status: 'info', duration: 2000 });
    }
    // eslint-disable-next-line
  }, [showRecorder, webcamReady]);

  // Start recording and answer timer
  const handleStartRecording = () => {
    setRecordedChunks([]);
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
        if (auto) toast({ title: 'Recording stopped (time up)', status: 'info', duration: 2000 });
        // Close modal after saving (for both auto and manual stop)
        onClose();
      }, 500);
    }
  };

  // When answer timer expires
  const handleAnswerTimeout = () => {
    if (recording) {
      handleStopRecording(true);
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
        <Heading size="md" color="brand.500">
          Interview Timer: {interviewTimerDisplay}
        </Heading>
      </Box>
      <Flex justify="center" align="center" flex="1" px={4} py={8}>
        <Box
          bg="white"
          p={10}
          borderRadius="2xl"
          boxShadow="lg"
          border="1px solid"
          borderColor="gray.100"
          maxW="700px"
          w="100%"
          textAlign="center"
        >
          <Image
            src="/assets/images/franc_avatar.jpg"
            alt="Franc Avatar"
            boxSize="80px"
            objectFit="cover"
            borderRadius="full"
            mx="auto"
            mb={4}
          />
          <Heading size="lg" mb={4}>
            Interview Questions - {major}
          </Heading>
          <Text color="gray.600" mb={6}>
            Click on a question to watch the pre-recorded video.
          </Text>
          <VStack spacing={6} align="stretch">
            {questions.length === 0 && <Text>No questions found for this major.</Text>}
            {questions.map((q, idx) => (
              <Box key={idx} p={4} bg="gray.50" borderRadius="lg" boxShadow="sm">
                <Flex align="center" justify="space-between">
                  <HStack>
                    <Text fontWeight="semibold">{q.title}</Text>
                    {isQuestionAnswered(idx) && <Icon as={CheckCircleIcon} color="green.400" boxSize={5} ml={2} />}
                  </HStack>
                  <Button
                    colorScheme="brand"
                    onClick={() => handlePlay(q.video, q.title, idx)}
                    isDisabled={isQuestionAnswered(idx)}
                  >
                    View Video
                  </Button>
                </Flex>
              </Box>
            ))}
          </VStack>
        </Box>
      </Flex>
      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedTitle}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {!showRecorder ? (
              <Box w="100%" h="350px">
                <video
                  src={selectedVideo}
                  controls
                  width="100%"
                  height="100%"
                  onEnded={handleVideoEnded}
                  style={{ pointerEvents: videoEnded ? 'none' : 'auto', opacity: videoEnded ? 0.5 : 1 }}
                />
                <HStack mt={4} justify="center">
                  <Button
                    colorScheme="green"
                    onClick={handleAnswerClick}
                    isDisabled={!videoEnded}
                    display="none"
                  >
                    Answer
                  </Button>
                </HStack>
              </Box>
            ) : (
              <Box w="100%" textAlign="center">
                <Webcam
                  audio={true}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ width: 480, height: 360 }}
                  style={{ borderRadius: '10px', margin: '0 auto' }}
                  onUserMedia={() => setWebcamReady(true)}
                />
                <AnswerTimer
                  key={answerTimerKey}
                  duration={ANSWER_DURATION_SECONDS}
                  onExpire={handleUserStop}
                  recording={recording}
                />
                <HStack mt={4} justify="center">
                  <Button colorScheme="blue" onClick={handleUserStop} isDisabled={saving || !recording}>
                    Finish & Save
                  </Button>
                  {saving && <Spinner size="sm" />}
                </HStack>
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
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
    <Heading size="md" color="brand.500" mt={4}>
      Answer Timer: {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
    </Heading>
  );
};

export default MockInterviewQuestionsPage; 