import { Box, Heading, Text, Image, Button, Flex, Icon, VStack, HStack, Circle, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  CheckCircleIcon,
  StarIcon,
  TimeIcon,
  ArrowForwardIcon,
  QuestionOutlineIcon,
  ViewIcon,
  ArrowUpIcon,
} from '@chakra-ui/icons';
import Footer from '../../components/Footer';
import { useContext } from 'react';
import { AuthContext } from "../../components/AuthContext";

const MockInterviewPage = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();

  const handleTryNowClick = () => {
    if (!isLoggedIn) {
      onOpen();
    } else {
      navigate("/mock-interview/try");
    }
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-r, white, #ebf8ff)"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      {/* Main Content */}
      <Flex
        direction={{ base: 'column', md: 'row' }}
        align="center"
        justify="space-between"
        p={{ base: 6, md: 16 }}
        gap={10}
      >
        {/* Right - Image */}
        <Image
          src="/assets/images/chat_service.svg"
          alt="Mock Interview"
          maxW="400px"
          objectFit="contain"
          alignSelf="flex-end"
        />

        {/* Left - Card with Content */}
        <Box
          flex="1"
          maxW={{ base: "100%", md: "60%" }}
          p={8}
          bg="white"
          borderRadius="2xl"
          boxShadow="0 4px 12px rgba(4, 90, 171, 0.2)"
          border="1px solid"
          borderColor="gray.100"
        >
          <Heading size="xl" mb={4}>
            Mock Interview Service
          </Heading>

          <Text fontSize="lg" mb={6}>
            Simulate a real interview experience tailored to your academic major. Practice answering real interview questions, record your responses, and get ready for your next opportunity!
          </Text>

          {/* Icons Row */}
          <HStack spacing={6} mb={6}>
            <VStack spacing={1}>
              <Icon as={CheckCircleIcon} color="green.400" boxSize={6} />
              <Text fontSize="sm">Realistic</Text>
            </VStack>
            <VStack spacing={1}>
              <Icon as={StarIcon} color="yellow.400" boxSize={6} />
              <Text fontSize="sm">Personalized</Text>
            </VStack>
            <VStack spacing={1}>
              <Icon as={TimeIcon} color="blue.400" boxSize={6} />
              <Text fontSize="sm">Timed</Text>
            </VStack>
          </HStack>

          <Button
            onClick={handleTryNowClick}
            colorScheme="brand"
            size="md"
          >
            Try Mock Interview
          </Button>
        </Box>
      </Flex>

      {/* How It Works Section */}
      <Box py={16} px={{ base: 6, md: 16 }} textAlign="center" bg="white">
        <Heading size="lg" mb={10}>
          How It Works
        </Heading>

        <HStack spacing={10} justify="center" flexWrap="wrap">
          {/* Step 1 */}
          <VStack spacing={4}>
            <Circle size="60px" bg="blue.100" color="blue.700">
              <Icon as={QuestionOutlineIcon} boxSize={6} />
            </Circle>
            <Text fontWeight="bold">Select Major</Text>
            <Text fontSize="sm" color="gray.600" maxW="150px">
              Choose your academic major to get tailored interview questions.
            </Text>
          </VStack>

          {/* Arrow */}
          <Icon as={ArrowForwardIcon} color="gray.400" boxSize={6} display={{ base: 'none', md: 'block' }} />

          {/* Step 2 */}
          <VStack spacing={4}>
            <Circle size="60px" bg="blue.100" color="blue.700">
              <Icon as={ViewIcon} boxSize={6} />
            </Circle>
            <Text fontWeight="bold">Watch & Record</Text>
            <Text fontSize="sm" color="gray.600" maxW="150px">
              Watch the question video, then record your answer using your webcam.
            </Text>
          </VStack>

          {/* Arrow */}
          <Icon as={ArrowForwardIcon} color="gray.400" boxSize={6} display={{ base: 'none', md: 'block' }} />

          {/* Step 3 */}
          <VStack spacing={4}>
            <Circle size="60px" bg="blue.100" color="blue.700">
              <Icon as={TimeIcon} boxSize={6} />
            </Circle>
            <Text fontWeight="bold">Timed Practice</Text>
            <Text fontSize="sm" color="gray.600" maxW="150px">
              Each answer is timed to simulate real interview pressure.
            </Text>
          </VStack>

          {/* Arrow */}
          <Icon as={ArrowForwardIcon} color="gray.400" boxSize={6} display={{ base: 'none', md: 'block' }} />

          {/* Step 4 */}
          <VStack spacing={4}>
            <Circle size="60px" bg="blue.100" color="blue.700">
              <Icon as={CheckCircleIcon} boxSize={6} />
            </Circle>
            <Text fontWeight="bold">Submit</Text>
            <Text fontSize="sm" color="gray.600" maxW="150px">
              Submit your interview for review by the Career Center team.
            </Text>
          </VStack>
        </HStack>
      </Box>

      {/* Call to Action Section */}
      <Box
        bg="brand.500"
        color="white"
        py={16}
        px={{ base: 6, md: 16 }}
        textAlign="center"
      >
        <Heading size="lg" mb={4}>
          Ready to Practice Your Interview?
        </Heading>
        <Text fontSize="lg" mb={6}>
          Take the next step towards interview success with realistic practice.
        </Text>
        <Button
          onClick={handleTryNowClick}
          size="lg"
          colorScheme="whiteAlpha"
          bg="white"
          color="brand.500"
          _hover={{ bg: "gray.100" }}
        >
          Try Mock Interview
        </Button>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Login Required</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Please login to benefit from the service.</Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={handleLoginClick}>Go to Login</Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Footer />
    </Box>
  );
};

export default MockInterviewPage; 