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
import { getStoredToken, decodeToken } from '../../utils/tokenUtils';

const INTERVIEW_DURATION_MINUTES = 10; // Example: 10 min for the whole interview
const ANSWER_DURATION_SECONDS = 5; // 1 min per answer

const MockInterviewQuestionsPage = () => {
  const location = useLocation();
  const major = location.state?.major || 'Nursing & Healthcare';
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  const [submitting, setSubmitting] = useState(false);
  const [interviewDuration, setInterviewDuration] = useState(0); // Duration in seconds
  const [interviewStartTime, setInterviewStartTime] = useState(null);
  const webcamRef = useRef(null);
  const toast = useToast();
  const [webcamReady, setWebcamReady] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [countdownActive, setCountdownActive] = useState(false);

  const [interviewStarted, setInterviewStarted] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [displayedQuestions, setDisplayedQuestions] = useState([]);
  const [canDoMock, setCanDoMock] = useState(true);
  const [checkingMockStatus, setCheckingMockStatus] = useState(false);
  const navigate = useNavigate();

  // Check if user can do mock interview
  const checkMockInterviewStatus = async () => {
    try {
      setCheckingMockStatus(true);
      const token = getStoredToken();
      if (!token) {
        throw new Error('User not authenticated');
      }

      const decodedToken = decodeToken(token);
      if (!decodedToken) {
        throw new Error('Invalid token');
      }

      const userId = parseInt(decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']);
      
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5121/api';
      const response = await fetch(`${baseUrl}/Evaluation/can-do-mock/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to check mock interview status');
      }
      
      const data = await response.json();
      setCanDoMock(data.canDoMock);
      
      if (!data.canDoMock) {
        toast({
          title: "Cannot Start Interview",
          description: "You cannot do another interview right now. Please try again later.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error('Error checking mock interview status:', err);
      toast({
        title: "Error",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCheckingMockStatus(false);
    }
  };

  // Fetch questions from API
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5121/api';
        const encodedMajorName = encodeURIComponent(major);
        const response = await fetch(`${baseUrl}/BlobStorage/random-questions?majorName=${encodedMajorName}&count=5`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch questions');
        }
        
        const questionsData = await response.json();
        setQuestions(questionsData);
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError(err.message);
        toast({
          title: "Error loading questions",
          description: err.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [major, toast]);

  // Check mock interview status on component mount
  useEffect(() => {
    checkMockInterviewStatus();
  }, []);

  // Submit recorded videos to backend
  const handleSubmitVideos = async () => {
    if (recordedAnswers.length === 0) {
      toast({
        title: "No recordings to submit",
        description: "Please record at least one answer before submitting.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSubmitting(true);
    try {
      // Get user token and decode to get user ID
      const token = getStoredToken();
      if (!token) {
        throw new Error('User not authenticated');
      }

      const decodedToken = decodeToken(token);
      if (!decodedToken) {
        throw new Error('Invalid token');
      }

      const userId = parseInt(decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']);
      
      console.log('Uploading videos for user:', userId);
      console.log('Recorded answers:', recordedAnswers);
      console.log('Questions:', questions);
      
      // Debug recorded answers
      recordedAnswers.forEach((answer, index) => {
        console.log(`Answer ${index + 1}:`, {
          questionIdx: answer.questionIdx,
          blobSize: answer.blob?.size || 0,
          blobType: answer.blob?.type || 'unknown'
        });
      });
      
      // Prepare form data
      const formData = new FormData();
      
      // Add videos - each video needs a unique name for the backend to recognize them as separate files
      const validAnswers = recordedAnswers.filter(answer => answer.blob && answer.blob.size > 0);
      
      validAnswers.forEach((answer, index) => {
        const videoFile = new File([answer.blob], `answer_${answer.questionIdx + 1}.webm`, {
          type: 'video/webm'
        });
        formData.append('Videos', videoFile);
        console.log(`Added video: answer_${answer.questionIdx + 1}.webm, size: ${answer.blob.size} bytes`);
      });

      // Ensure we have valid videos before proceeding
      if (validAnswers.length === 0) {
        throw new Error('No valid video recordings found');
      }

      // Calculate interview duration
      const duration = interviewDuration;
      const durationString = `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;

      // Add user ID
      formData.append('UserId', userId.toString());
      console.log('Added UserId:', userId);

      // Add duration
      formData.append('Duration', durationString);
      console.log('Added Duration:', durationString);

      // Add question IDs - ensure they match the order of videos
      validAnswers.forEach(answer => {
        const questionId = questions[answer.questionIdx]?.questionId;
        if (questionId) {
          formData.append('QuestionIds', questionId.toString());
          console.log('Added QuestionId:', questionId);
        }
      });

      // Log FormData contents for debugging
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
      
      // Send to backend
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5121/api';
      const response = await fetch(`${baseUrl}/BlobStorage/upload-mock-interview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData, let the browser set it with boundary
        },
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend error:', errorData);
        throw new Error(errorData.message || 'Failed to upload videos');
      }

      const result = await response.json();
      console.log('Upload result:', result);
      
      toast({
        title: "Mock Interview completed successfully!",
        description: `Interview ID: ${result.mockInterviewId}. Duration: ${durationString}. Uploaded ${result.videoUrls.length} videos.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      setShowThankYou(true);
      // Stop the interview duration timer
      setInterviewStartTime(null);
      setInterviewDuration(0);
    } catch (err) {
      console.error('Error uploading videos:', err);
      toast({
        title: "Upload failed",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

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
    
    // Set up data collection for the state (for debugging)
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) {
        setRecordedChunks((prev) => [...prev, e.data]);
        console.log(`Data available: ${e.data.size} bytes`);
      }
    };
    
    mr.onstop = () => {
      setRecording(false);
    };
    
    mr.start();
    setRecording(true);
    console.log('Recording started');

    // Start answer timer
    setAnswerTimerKey((k) => k + 1); // This will force the timer to remount
  };

  // Stop recording and save
  const handleStopRecording = (auto = false) => {
    if (mediaRecorder) {
      setShowControls(true); // Ensure controls are shown immediately
      setSaving(true);
      
      // Create a local array to collect chunks
      const chunks = [];
      
      // Override the ondataavailable to collect chunks immediately
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      // Override onstop to handle the blob creation
      mediaRecorder.onstop = () => {
        setRecording(false);
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: 'video/webm' });
          console.log(`Created blob for question ${currentQuestionIdx + 1}, size: ${blob.size} bytes`);
          setRecordedAnswers((prev) => [
            ...prev.filter((a) => a.questionIdx !== currentQuestionIdx),
            { questionIdx: currentQuestionIdx, blob },
          ]);
          setAnsweredQuestions((prev) => [...prev, currentQuestionIdx]);
        } else {
          console.warn(`No chunks recorded for question ${currentQuestionIdx + 1}`);
        }
        setSaving(false);
        setShowRecorder(false);
        setMediaRecorder(null);
        setAnswerTimerActive(false);
        if (auto) toast({ title: 'Recording stopped', status: 'info', duration: 2000 });
      };
      
      mediaRecorder.stop();
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

  // Interview duration timer
  useEffect(() => {
    let interval;
    if (interviewStarted && interviewStartTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - interviewStartTime) / 1000);
        setInterviewDuration(elapsed);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [interviewStarted, interviewStartTime]);

  // Reset interview timer on mount
  useEffect(() => {
    const end = new Date();
    end.setMinutes(end.getMinutes() + INTERVIEW_DURATION_MINUTES);
    restartInterviewTimer(end, true);
    // eslint-disable-next-line
  }, []);

  if (loading) {
    return (
      <Box
        minH="100vh"
        bgGradient="linear(to-r, white, #ebf8ff)"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
      >
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} color="gray.600">Loading questions...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        minH="100vh"
        bgGradient="linear(to-r, white, #ebf8ff)"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
      >
        <Text color="red.500" fontSize="lg">Error: {error}</Text>
        <Button mt={4} colorScheme="blue" onClick={() => window.location.reload()}>
          Retry
        </Button>
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
      {/* Interview Duration Timer */}
      {interviewStarted && !showThankYou && (
        <Box textAlign="center" py={4} bg="blue.50" borderBottom="1px" borderColor="blue.200">
          <Text fontSize="lg" fontWeight="bold" color="blue.600">
            Interview Duration: {Math.floor(interviewDuration / 60)}:{(interviewDuration % 60).toString().padStart(2, '0')}
          </Text>
        </Box>
      )}
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
                      <Text fontWeight="bold">Q{idx + 1}: {questions[idx]?.title}</Text>
                      {!isQuestionAnswered(idx) && (
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() => {
                            setSelectedTitle(questions[idx]?.title);
                            setSelectedVideo(questions[idx]?.videoUrl);
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
                  <Text fontWeight="bold">Q{currentQuestionIdx + 1}: {questions[currentQuestionIdx]?.title}</Text>
                  <Button mt={3} colorScheme="blue" onClick={() => {
                    const idx = currentQuestionIdx;
                    setSelectedTitle(questions[idx]?.title);
                    setSelectedVideo(questions[idx]?.videoUrl);
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
                    setSelectedTitle(questions[currentQuestionIdx]?.title);
                    setSelectedVideo(questions[currentQuestionIdx]?.videoUrl);
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
                    onClick={handleSubmitVideos}
                    isLoading={submitting}
                    isDisabled={recording || recordedAnswers.length === 0}
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
                          setSelectedTitle(questions[nextIdx]?.title);
                          setSelectedVideo(questions[nextIdx]?.videoUrl);
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
                  You cannot start another interview right now. Please try again later.
                </Text>
              </Box>
            )}
            <Button
              colorScheme="blue"
              size="lg"
              onClick={() => {
                setInterviewStarted(true);
                setInterviewStartTime(Date.now());
                setInterviewDuration(0);
                setCurrentQuestionIdx(0);
                setDisplayedQuestions([0]);
                setTimeout(() => handlePlay(questions[0]?.videoUrl, questions[0]?.title, 0), 500);
              }}
              display="block"
              mx="auto"
              isDisabled={questions.length === 0 || !canDoMock || checkingMockStatus}
              isLoading={checkingMockStatus}
            >
              {checkingMockStatus ? 'Checking...' : !canDoMock ? 'Cannot Start Interview' : 'Start Interview'}
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