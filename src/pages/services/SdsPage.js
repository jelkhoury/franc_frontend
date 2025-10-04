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

const SdsPage = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();

  const handleTryNowClick = () => {
    if (isLoggedIn) {
      navigate("/self-directed-search/brief");
    } else {
      onOpen();
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
        direction={{ base: "column", md: "row" }}
        align="center"
        justify="space-between"
        p={{ base: 6, md: 16 }}
        gap={10}
      >
        {/* Right - Image */}
        <Image
          src="/assets/images/sds.svg"
          alt="Self-Directed Search (SDS)"
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
            Self-Directed Search (SDS)
          </Heading>

          <Text fontSize="lg" mb={6}>
            Discover careers and majors that fit your interests. This test asks
            you asks you to rate activities and abilities, then generates a
            code with personalized role and program suggestions.
          </Text>

          {/* Icons Row */}
          <HStack spacing={6} mb={6}>
            <VStack spacing={1}>
              <Icon as={CheckCircleIcon} color="green.400" boxSize={6} />
              <Text fontSize="sm">Evidence-based</Text>
            </VStack>
            <VStack spacing={1}>
              <Icon as={StarIcon} color="yellow.400" boxSize={6} />
              <Text fontSize="sm">Personalized results</Text>
            </VStack>
            <VStack spacing={1}>
              <Icon as={TimeIcon} color="blue.400" boxSize={6} />
              <Text fontSize="sm">15–20 minutes</Text>
            </VStack>
          </HStack>

          <Button onClick={handleTryNowClick} colorScheme="brand" size="md">
            Start Test
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
            <Text fontWeight="bold">Start the Assessment</Text>
            <Text fontSize="sm" color="gray.600" maxW="150px">
              Begin the SDS and answer simple interest questions.
            </Text>
          </VStack>

          {/* Arrow */}
          <Icon
            as={ArrowForwardIcon}
            color="gray.400"
            boxSize={6}
            display={{ base: "none", md: "block" }}
          />

          {/* Step 2 */}
          <VStack spacing={4}>
            <Circle size="60px" bg="blue.100" color="blue.700">
              <Icon as={ViewIcon} boxSize={6} />
            </Circle>
            <Text fontWeight="bold">Rate Activities & Skills</Text>
            <Text fontSize="sm" color="gray.600" maxW="150px">
              Indicate how much you like or can do various tasks.
            </Text>
          </VStack>

          {/* Arrow */}
          <Icon
            as={ArrowForwardIcon}
            color="gray.400"
            boxSize={6}
            display={{ base: "none", md: "block" }}
          />

          {/* Step 3 */}
          <VStack spacing={4}>
            <Circle size="60px" bg="blue.100" color="blue.700">
              <Icon as={TimeIcon} boxSize={6} />
            </Circle>
            <Text fontWeight="bold">Get Your Code</Text>
            <Text fontSize="sm" color="gray.600" maxW="150px">
              See your top three interest types (e.g., R–I–A).
            </Text>
          </VStack>

          {/* Arrow */}
          <Icon
            as={ArrowForwardIcon}
            color="gray.400"
            boxSize={6}
            display={{ base: "none", md: "block" }}
          />

          {/* Step 4 */}
          <VStack spacing={4}>
            <Circle size="60px" bg="blue.100" color="blue.700">
              <Icon as={CheckCircleIcon} boxSize={6} />
            </Circle>
            <Text fontWeight="bold">Explore Matches</Text>
            <Text fontSize="sm" color="gray.600" maxW="150px">
              Browse suggested careers and majors aligned to your code.
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
          Ready to Find Your Best‑Fit Careers?
        </Heading>
        <Text fontSize="lg" mb={6}>
          Take the SDS and get a personalized RIASEC profile with tailored
          suggestions.
        </Text>
        <Button
          onClick={handleTryNowClick}
          size="lg"
          colorScheme="whiteAlpha"
          bg="white"
          color="brand.500"
          _hover={{ bg: "gray.100" }}
        >
          Start Test
        </Button>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Login Required</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Please log in to take the test.</Text>
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

      <Footer />
    </Box>
  );
};

export default SdsPage;