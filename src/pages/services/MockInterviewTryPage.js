import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  useToast,
  Image,
  Progress,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Alert,
  AlertIcon,
  useDisclosure,
} from '@chakra-ui/react';
import { useState, useContext } from 'react';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../components/AuthContext';

const MockInterviewTryPage = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(50);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();

  const handleNext = () => {
    setStep(2);
    setProgress(100);
  };

  const handleProceed = () => {
    navigate('/mock-interview/select-major');
  };

  const handleStartInterview = () => {
    if (isLoggedIn) {
      setShowWarningModal(true);
    } else {
      onOpen();
    }
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  const handleConfirmStart = () => {
    setShowWarningModal(false);
    navigate('/mock-interview/select-major');
  };

  const handleCancelStart = () => {
    setShowWarningModal(false);
  };

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-r, white, #ebf8ff)"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      <Flex justify="center" align="center" flex="1" px={4} py={16}>
        <Box
          bg="white"
          p={10}
          borderRadius="2xl"
          boxShadow="lg"
          border="1px solid"
          borderColor="gray.100"
          maxW="600px"
          w="100%"
          textAlign="center"
        >
          <Image
            src="/assets/images/franc_avatar.jpg"
            alt="Franc Avatar"
            boxSize="100px"
            objectFit="cover"
            borderRadius="full"
            mx="auto"
            mb={4}
            transition="transform 0.3s"
            _hover={{ transform: 'scale(1.05)' }}
          />

          <Heading color="brand.500" size="lg" mb={4}>
            Start Your Mock Interview
          </Heading>

          <Progress value={progress} size="sm" colorScheme="brand" mb={6} borderRadius="md" />

          {step === 1 && (
            <VStack spacing={5} align="stretch">
              <Box px={6} py={4} textAlign="center" bg="gray.50" borderRadius="2xl">
                <Heading color="brand.500" size="md" mb={4}>
                  🎤 How It Works
                </Heading>
                <VStack spacing={2} color="gray.600" fontSize="md">
                  <Text>1. Select your academic major or program</Text>
                  <Text>2. Watch the interview question video</Text>
                  <Text>3. Record your answer using your webcam</Text>
                  <Text>4. Submit your responses for review</Text>
                </VStack>
              </Box>
              <Button colorScheme="brand" onClick={handleNext}>
                Next
              </Button>
            </VStack>
          )}

          {step === 2 && (
            <VStack spacing={6}>
              <Text color="gray.600" fontSize="md">
                Ready to begin? Click below to choose your major and start your mock interview.
              </Text>
              <Button colorScheme="green" size="lg" onClick={handleStartInterview}>
                Choose Major & Start
              </Button>
            </VStack>
          )}
        </Box>
      </Flex>
      
      {/* Login Required Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Login Required</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Please log in to start the mock interview.</Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={handleLoginClick}>
              Go to Login
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Warning Modal */}
      <Modal isOpen={showWarningModal} onClose={handleCancelStart} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader color="red.500">
            ⚠️ Warning: Starting Mock Interview
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Alert status="warning" mb={4}>
              <AlertIcon />
              <Text fontWeight="bold">Important: Interview will start now!</Text>
            </Alert>
            
            <VStack align="stretch" spacing={4}>
              <Text>
                Before proceeding, please ensure:
              </Text>
              
              <VStack align="stretch" spacing={2}>
                <Text>• <strong>Check your internet connection</strong> - ensure it's stable</Text>
                <Text>• <strong>Check your camera and microphone</strong> - they will be used for recording</Text>
                <Text>• <strong>Find a quiet environment</strong> - minimize background noise</Text>
                <Text>• <strong>Do not navigate away</strong> - you will lose your progress</Text>
                <Text>• <strong>Do not close the browser</strong> - your answers will not be recorded</Text>
              </VStack>
              
              <Alert status="error" mt={4}>
                <AlertIcon />
                <Text fontSize="sm">
                  <strong>Warning:</strong> If you leave this page or lose connection during the interview, 
                  your answers will be lost and you'll need to start over.
                </Text>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleCancelStart}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleConfirmStart}>
              I Understand - Start Interview
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Footer />
    </Box>
  );
};

export default MockInterviewTryPage; 