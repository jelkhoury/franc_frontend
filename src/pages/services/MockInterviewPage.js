import { Box, Heading, Text, Image, Button, Flex, Icon, VStack, HStack, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Alert, AlertIcon } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircleIcon,
  StarIcon,
  TimeIcon,
} from '@chakra-ui/icons';
import Footer from '../../components/Footer';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../components/AuthContext';
import { checkUserActionPermission } from '../../utils/userActionUtils';
import { USER_ACTION_TYPES } from '../../services/apiService';

const MockInterviewPage = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const [canPerformAction, setCanPerformAction] = useState(true);
  const [checkingPermission, setCheckingPermission] = useState(false);

  // Check permission when component mounts and user is logged in
  useEffect(() => {
    if (isLoggedIn) {
      checkUserActionPermission(
        USER_ACTION_TYPES.MOCK_INTERVIEW,
        setCheckingPermission,
        setCanPerformAction,
        null // Don't show toast on initial check
      );
    }
  }, [isLoggedIn]);

  const handleTryNowClick = () => {
    if (!isLoggedIn) {
      onOpen();
      return;
    }

    if (!canPerformAction) {
      onOpen(); // Show modal with restriction message
      return;
    }

    navigate("/mock-interview/select-major");
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
          <Heading color="brand.500" size="xl" mb={4}>
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

          {checkingPermission ? (
            <VStack spacing={3} align="stretch">
              <Button
                colorScheme="brand"
                size="md"
                isDisabled
                isLoading
              >
                Checking Permission...
              </Button>
            </VStack>
          ) : !canPerformAction && isLoggedIn ? (
            <VStack spacing={3} align="stretch">
              <Alert status="warning">
                <AlertIcon />
                <Text fontSize="sm">
                  You cannot start another interview right now. Please try again later.
                </Text>
              </Alert>
              <Button
                onClick={handleTryNowClick}
                colorScheme="brand"
                size="md"
                isDisabled
              >
                Try Mock Interview
              </Button>
            </VStack>
          ) : (
            <VStack spacing={3} align="stretch">
              <Button
                onClick={handleTryNowClick}
                colorScheme="brand"
                size="md"
              >
                Try Mock Interview
              </Button>
            </VStack>
          )}
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
        <Heading color="brand.500" size="lg" mb={4}>
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
            isDisabled={checkingPermission || (isLoggedIn && !canPerformAction)}
            isLoading={checkingPermission}
          >
            {checkingPermission ? "Checking..." : "Try Mock Interview"}
          </Button>
        </HStack>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {!isLoggedIn ? 'Login Required' : 'Cannot Start Interview'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {!isLoggedIn ? (
              <Text>Please log in to start the mock interview.</Text>
            ) : (
              <>
                <Alert status="warning" mb={4}>
                  <AlertIcon />
                  <Text fontWeight="bold">Action Restricted</Text>
                </Alert>
                <Text>
                  You cannot do another interview right now. Please try again later.
                </Text>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            {!isLoggedIn ? (
              <>
                <Button colorScheme="blue" onClick={handleLoginClick}>
                  Go to Login
                </Button>
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Footer />
    </Box>
  );
};

export default MockInterviewPage; 