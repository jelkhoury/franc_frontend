import { Box, Heading, Text, Image, Button, Flex, Icon, VStack, HStack, Circle, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  CheckCircleIcon,
  StarIcon,
  TimeIcon,
  ArrowForwardIcon,
  AttachmentIcon,
  Search2Icon,
  ViewIcon,
  ArrowUpIcon,
} from '@chakra-ui/icons';
import Footer from '../../components/Footer';
import { useContext } from 'react';
import { AuthContext } from "../../components/AuthContext"; // Assuming you have the AuthContext in this path
import { FaBolt } from "react-icons/fa";


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


const CoverLetterPage = () => {
  const { isLoggedIn } = useContext(AuthContext);  // Get the login state from context
  const { isOpen, onOpen, onClose } = useDisclosure();  // For handling the modal
  const navigate = useNavigate();

  const handleTryNowClick = () => {
    if (!isLoggedIn) {
      onOpen();  // Open the modal if not logged in
    } else {
      navigate("/cover-letter-evaluation/try");  // Redirect to the cover letter evaluation page if logged in
    }
  };

  const handleLoginClick = () => {
    navigate("/login");  // Navigate to the login page
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
          src="/assets/images/cover_letter.gif"
          alt="Resume Evaluation"
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
            Cover Letter Feedback
          </Heading>

          <Text fontSize="lg" mb={6}>
            Turn your cover letter into a secret weapon — not just to impress, but to make real impact.
          </Text>

          {/* Icons Row */}
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

          <Button
            onClick={handleTryNowClick}  // Use this to handle click event
            colorScheme="brand"
            size="md"
          >
            Try It Now
          </Button>
        </Box>
      </Flex>

    {/* How It Works Section */}
    <Box py={16} px={{ base: 6, md: 16 }} bg="white">
      <Heading size="lg" mb={10} textAlign="center">
        How It Works
      </Heading>

      {/* Desktop layout: with arrows */}
      <HStack
        spacing={10}
        justify="center"
        flexWrap="wrap"
        align="center"
        display={{ base: "none", md: "flex" }}
      >
        <PlainStep
          icon={AttachmentIcon}
          title="Start by uploading your current cover letter"
          desc="Upload your current cover letter."
        />
        <Icon as={ArrowForwardIcon} color="gray.400" boxSize={6} />
        <PlainStep
          icon={ArrowUpIcon}
          title="Upload Job Ad"
          desc="Upload the Job posting of the vacancy you are applying for."
        />
        <Icon as={ArrowForwardIcon} color="gray.400" boxSize={6} />
        <PlainStep
          icon={Search2Icon}
          title="Cover letter Screening"
          desc="Franc screens your cover letter based on professional standards."
        />
        <Icon as={ArrowForwardIcon} color="gray.400" boxSize={6} />
        <PlainStep
          icon={ViewIcon}
          title="Get Feedback"
          desc="Let the judgment begin."
          gif="/assets/images/judge_hammer.gif"

        />
      </HStack>

      {/* Mobile layout: stacked, no arrows */}
      <VStack
        spacing={8}
        maxW="lg"
        mx="auto"
        display={{ base: "flex", md: "none" }}
      >
        <PlainStep
          icon={AttachmentIcon}
          title="Upload CV"
          desc="Upload your current cover letter."
        />
        <PlainStep
          icon={ArrowUpIcon}
          title="Upload Job AD"
          desc="Upload the Job Ad to start the evaluation."
        />
        <PlainStep
          icon={Search2Icon}
          title="Evaluate"
          desc="System checks Cover Letter against the Job Ad and professional standards."
        />
        <PlainStep
          icon={ViewIcon}
          title="Get Feedback"
          desc="Let the judgment begin."
          gif="/assets/images/judge_hammer.gif"
        />
      </VStack>
    </Box>

      {/* Call to Action Section */}
      {/* <Box
        bg="brand.500"
        color="white"
        py={16}
        px={{ base: 6, md: 16 }}
        textAlign="center"
      >
        <Heading size="lg" mb={4}>
          Ready to Improve Your Cover Letter?
        </Heading>
        <Text fontSize="lg" mb={6}>
          Take the first step towards a professional Cover Letter aligned with international standards.
        </Text>
        <Button
          onClick={handleTryNowClick}  // Same button handler for the CTA button
          size="lg"
          colorScheme="whiteAlpha"
          bg="white"
          color="brand.500"
          _hover={{ bg: "gray.100" }}
        >
          Try Cover Letter Evaluation
        </Button>
      </Box> */}

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

export default CoverLetterPage;
