import {
  Box,
  Heading,
  Text,
  Image,
  Button,
  Flex,
  Icon,
  VStack,
  HStack,
  Circle,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircleIcon,
  StarIcon,
  ArrowForwardIcon,
  QuestionOutlineIcon,
  ViewIcon,
  SearchIcon,
} from '@chakra-ui/icons';
import Footer from '../../components/Footer';
import { useContext } from 'react';
import { AuthContext } from '../../components/AuthContext';

const JobMatchingPage = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();

  const handleTryNowClick = () => {
    if (!isLoggedIn) {
      onOpen();
      return;
    }
    navigate('/job-matching/try');
  };

  const handleLoginClick = () => {
    navigate('/login');
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
            src="/assets/images/job-matching.svg"
            alt="Job Matching"
            maxW="400px"
            objectFit="contain"
            alignSelf="flex-end"
            fallbackSrc="/assets/images/sds.svg"
          />

          {/* Left - Card with Content */}
          <Box
            flex="1"
            maxW={{ base: '100%', md: '60%' }}
            p={8}
            bg="white"
            borderRadius="2xl"
            boxShadow="0 4px 12px rgba(4, 90, 171, 0.2)"
            border="1px solid"
            borderColor="gray.100"
          >
            <Heading color="brand.500" size="xl" mb={2}>
              Job Matching
            </Heading>

            <Text fontSize="lg" mb={6}>
              Find real job opportunities that match your skills and academic
              background.
            </Text>

            {/* Icons Row */}
            <HStack spacing={6} mb={6}>
              <VStack spacing={1}>
                <Icon as={SearchIcon} color="blue.400" boxSize={6} />
                <Text fontSize="sm">Real Job Listings</Text>
              </VStack>
              <VStack spacing={1}>
                <Icon as={StarIcon} color="yellow.400" boxSize={6} />
                <Text fontSize="sm">Skill-Based Matching</Text>
              </VStack>
              <VStack spacing={1}>
                <Icon as={CheckCircleIcon} color="green.400" boxSize={6} />
                <Text fontSize="sm">Personalized Results</Text>
              </VStack>
            </HStack>

            <Button onClick={handleTryNowClick} colorScheme="brand" size="md">
              Start Matching
            </Button>
          </Box>
        </Flex>

        {/* How It Works Section */}
        <Box py={16} px={{ base: 6, md: 16 }} textAlign="center" bg="white">
          <Heading color="brand.500" size="lg" mb={10}>
            How It Works
          </Heading>

          <HStack spacing={10} justify="center" flexWrap="wrap">
            {/* Step 1 */}
            <VStack spacing={4}>
              <Circle size="60px" bg="blue.100" color="blue.700">
                <Icon as={QuestionOutlineIcon} boxSize={6} />
              </Circle>
              <Text fontWeight="bold">Enter Your Details</Text>
              <Text fontSize="sm" color="gray.600" maxW="150px">
                Provide your faculty, major, level, and country information.
              </Text>
            </VStack>

            {/* Arrow */}
            <Icon
              as={ArrowForwardIcon}
              color="gray.400"
              boxSize={6}
              display={{ base: 'none', md: 'block' }}
            />

            {/* Step 2 */}
            <VStack spacing={4}>
              <Circle size="60px" bg="blue.100" color="blue.700">
                <Icon as={ViewIcon} boxSize={6} />
              </Circle>
              <Text fontWeight="bold">Select Your Skills</Text>
              <Text fontSize="sm" color="gray.600" maxW="150px">
                View skills related to your major and select the ones you have.
              </Text>
            </VStack>

            {/* Arrow */}
            <Icon
              as={ArrowForwardIcon}
              color="gray.400"
              boxSize={6}
              display={{ base: 'none', md: 'block' }}
            />

            {/* Step 3 */}
            <VStack spacing={4}>
              <Circle size="60px" bg="blue.100" color="blue.700">
                <Icon as={CheckCircleIcon} boxSize={6} />
              </Circle>
              <Text fontWeight="bold">Get Matched Jobs</Text>
              <Text fontSize="sm" color="gray.600" maxW="150px">
                Receive a list of real job opportunities matching your profile.
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
            Ready to Find Your Perfect Job Match?
          </Heading>
          <Text fontSize="lg" mb={6}>
            Start the job matching process and discover opportunities tailored to
            your skills and background.
          </Text>
          <Button
            onClick={handleTryNowClick}
            size="lg"
            colorScheme="whiteAlpha"
            bg="white"
            color="brand.500"
            _hover={{ bg: 'gray.100' }}
          >
            Start Matching
          </Button>
        </Box>

        <Modal isOpen={isOpen} onClose={onClose} isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Login Required</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text>Please log in to use the job matching service.</Text>
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

export default JobMatchingPage;
