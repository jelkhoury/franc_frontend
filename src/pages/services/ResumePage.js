import { useContext, useState, useEffect } from "react";
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
  ModalBody,
  ModalFooter,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { FaBolt } from "react-icons/fa";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../../components/AuthContext";
import {
  CheckCircleIcon,
  StarIcon,
  ArrowForwardIcon,
  AttachmentIcon,
  Search2Icon,
  ViewIcon,
} from "@chakra-ui/icons";
import Footer from "../../components/Footer";
import { FaWandSparkles } from "react-icons/fa6";
import { checkUserActionPermission } from "../../utils/userActionUtils";
import { USER_ACTION_TYPES } from "../../services/apiService";



const PlainStep = ({ icon, title, desc, gif }) => (
  <VStack
    spacing={3}
    align="center"
    w="auto"
    minW={{ base: "auto", md: "200px" }}
    maxW="240px"
  >
    <Circle size="64px" bg="blue.100" color="blue.700">
      <Icon as={icon} boxSize={6} />
    </Circle>

    <Text fontWeight="bold" textAlign="center" noOfLines={2}>
      {title}
    </Text>

    {/* Description + optional gif */}
    <HStack spacing={2} justify="center">
      <Text fontSize="sm" color="gray.600" textAlign="center">
        {desc}
      </Text>
      {gif && (
        <Image
          src={gif}
          alt="step gif"
          boxSize="24px"
          objectFit="contain"
          borderRadius="md"
        />
      )}
    </HStack>
  </VStack>
);

const ResumePage = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const [canPerformAction, setCanPerformAction] = useState(true);
  const [checkingPermission, setCheckingPermission] = useState(false);

  // Check permission when component mounts and user is logged in
  useEffect(() => {
    if (isLoggedIn) {
      checkUserActionPermission(
        USER_ACTION_TYPES.RESUME,
        setCheckingPermission,
        setCanPerformAction,
        null // Don't show toast on initial check
      );
    }
  }, [isLoggedIn]);

  const handleTryNow = () => {
    if (!isLoggedIn) {
      onOpen();
      return;
    }

    if (!canPerformAction) {
      onOpen(); // Show modal with restriction message
      return;
    }

    navigate("/resume-evaluation/try");
  };

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-r, white, #ebf8ff)"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      <Flex
        direction={{ base: "column", md: "row" }}
        align="center"
        justify="space-between"
        p={{ base: 6, md: 16 }}
        gap={10}
      >
        <Image
          src="/assets/images/resume.gif"
          alt="Resume Evaluation"
          maxW="400px"
          objectFit="contain"
          alignSelf="flex-end"
        />
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
            Resume Feedback
          </Heading>
          <Text fontSize="lg" mb={6}>
            Franc’s helps you craft a resume which is fully aligned with
            Antonine University's CCD department standards, which are
            internationally accepted. Ensure your Resume is optimized for
            academic, internship, and job applications.
          </Text>
          <HStack spacing={6} mb={6}>
            <VStack spacing={1}>
              <Icon as={CheckCircleIcon} color="green.400" boxSize={6} />
              <Text fontSize="sm">Accurate</Text>
            </VStack>
            <VStack spacing={1}>
              <Icon as={StarIcon} color="yellow.400" boxSize={6} />
              <Text fontSize="sm">Professional</Text>
            </VStack>
            <VStack spacing={1}>
              <Icon as={FaBolt} color="blue.400" boxSize={6} />
              <Text fontSize="sm">Fast</Text>
            </VStack>
          </HStack>
          {checkingPermission ? (
            <Button
              colorScheme="brand"
              size="md"
              isDisabled
              isLoading
            >
              Checking Permission...
            </Button>
          ) : !canPerformAction && isLoggedIn ? (
            <VStack spacing={3} align="stretch">
              <Alert status="warning">
                <AlertIcon />
                <Text fontSize="sm">
                  You cannot evaluate a resume right now. Please try again later.
                </Text>
              </Alert>
              <Button
                colorScheme="brand"
                size="md"
                onClick={handleTryNow}
                rightIcon={<Icon as={FaWandSparkles} boxSize={5} />}
                isDisabled
              >
                Abra Cadabra
              </Button>
            </VStack>
          ) : (
            <Button
              colorScheme="brand"
              size="md"
              onClick={handleTryNow}
              rightIcon={<Icon as={FaWandSparkles} boxSize={5} />}
            >
              Abra Cadabra
            </Button>
          )}
        </Box>
      </Flex>

      {/* ✅ Improved How It Works */}
      <Box py={16} px={{ base: 6, md: 16 }} bg="white">
        <Heading color="brand.500" size="lg" mb={10} textAlign="center">
          How It Works
        </Heading>

        {/* Desktop: plain items with arrows */}
        <HStack
          spacing={6}
          justify="center"
          display={{ base: "none", md: "flex" }}
        >
          <PlainStep
            icon={AttachmentIcon}
            title="Start by uploading your current resume"
            desc="Upload your current resume to start the evaluation."
          />
          <Icon as={ArrowForwardIcon} color="gray.400" boxSize={6} />
          <PlainStep
            icon={Search2Icon}
            title="Resume Screening"
            desc="Franc screens your resume based on professional standards."
          />
          <Icon as={ArrowForwardIcon} color="gray.400" boxSize={6} />
          <PlainStep
            icon={ViewIcon}
            title="Get Feedback"
            desc="Let the judgment begin."
            gif="/assets/images/judge_hammer.gif"
          />
        </HStack>

        {/* Mobile: stacked list, no arrows */}
        <VStack
          spacing={6}
          maxW="lg"
          mx="auto"
          display={{ base: "flex", md: "none" }}
        >
          <PlainStep
            icon={AttachmentIcon}
            title="Start by uploading your current resume"
            desc="Upload your current resume to start the evaluation."
          />
          <PlainStep
            icon={Search2Icon}
            title="Resume Screening"
            desc="Franc screens your resume based on professional standards."
          />
          <PlainStep
            icon={ViewIcon}
            title="Get Feedback"
            desc="Let the judgment begin."
            gif="/assets/images/judge_hammer.gif"
          />
        </VStack>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {!isLoggedIn ? 'Please Login' : 'Cannot Evaluate Resume'}
          </ModalHeader>
          <ModalBody>
            {!isLoggedIn ? (
              <Text>You need to be logged in to benefit from this service.</Text>
            ) : (
              <>
                <Alert status="warning" mb={4}>
                  <AlertIcon />
                  <Text fontWeight="bold">Action Restricted</Text>
                </Alert>
                <Text>
                  You cannot evaluate a resume right now. Please try again later.
                </Text>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            {!isLoggedIn ? (
              <>
                <Button variant="ghost" mr={3} onClick={onClose}>
                  Cancel
                </Button>
                <Button colorScheme="blue" onClick={() => navigate("/login")}>
                  Go to Login
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

export default ResumePage;
