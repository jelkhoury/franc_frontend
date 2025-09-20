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
} from '@chakra-ui/react';
import { useState } from 'react';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';

const MockInterviewTryPage = () => {
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(50);
  const navigate = useNavigate();

  const handleNext = () => {
    setStep(2);
    setProgress(100);
  };

  const handleProceed = () => {
    navigate('/mock-interview/select-major');
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

          <Heading size="lg" mb={4}>
            Start Your Mock Interview
          </Heading>

          <Progress value={progress} size="sm" colorScheme="brand" mb={6} borderRadius="md" />

          {step === 1 && (
            <VStack spacing={5} align="stretch">
              <Box px={6} py={4} textAlign="center" bg="gray.50" borderRadius="2xl">
                <Heading size="md" mb={4} color="gray.700">
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
              <Button colorScheme="green" size="lg" onClick={handleProceed}>
                Choose Major & Start
              </Button>
            </VStack>
          )}
        </Box>
      </Flex>
      <Footer />
    </Box>
  );
};

export default MockInterviewTryPage; 