import { Box, Heading, Text, Image, Button, Flex, Icon, VStack, HStack, Circle } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircleIcon,
  StarIcon,
  TimeIcon,
} from '@chakra-ui/icons';
import Footer from '../../components/Footer';

const MockInterviewPage = () => {
  const navigate = useNavigate();

  const handleTryNowClick = () => {
    navigate("/mock-interview/select-major");
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

          <VStack spacing={3} align="stretch">
            <Button
              onClick={handleTryNowClick}
              colorScheme="brand"
              size="md"
            >
              Try Mock Interview
            </Button>
          </VStack>
        </Box>
      </Flex>


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
        <HStack spacing={4} justify="center">
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
        </HStack>
      </Box>


      <Footer />
    </Box>
  );
};

export default MockInterviewPage; 