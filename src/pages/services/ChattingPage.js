import { Box, Heading, Text, Image, Button, Flex, Icon, VStack, HStack, Circle, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  CheckCircleIcon,
  StarIcon,
  TimeIcon,
  ArrowForwardIcon,
  AttachmentIcon,
  ViewIcon,
  ArrowUpIcon,
} from '@chakra-ui/icons';
import Footer from '../../components/Footer';
import { useContext } from 'react';
import { AuthContext } from "../../components/AuthContext"; // Assuming you have the AuthContext in this path
import { FaBolt } from "react-icons/fa";


const PlainStep = ({ icon, title, desc }) => (
  <VStack
    spacing={3}
    align="center"
    w="auto"
    minW={{ base: "auto", md: "240px" }}
    maxW="260px"
  >
    <Circle size="64px" bg="blue.50" color="blue.700">
      <Icon as={icon} boxSize={6} />
    </Circle>

    <Text fontWeight="bold" noOfLines={2} textAlign="center">
      {title}
    </Text>

    <Text fontSize="sm" color="gray.600" textAlign="center">
      {desc}
    </Text>
  </VStack>
);
const ChattingPage = () => {
  const { isLoggedIn } = useContext(AuthContext);  // Get the login state from context
  const { isOpen, onOpen, onClose } = useDisclosure();  // For handling the modal
  const navigate = useNavigate();

  const handleTryNowClick = () => {
    if (isLoggedIn) {
      onOpen();  // Open the modal if not logged in
    } else {
      navigate("/chat-franc");  // Redirect to the chat page if logged in
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
          src="/assets/images/franc_support.gif"
          alt="Chatting Service"
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
            Any Help?
          </Heading>

          <Text fontSize="lg" mb={6}>
            Got questions about your career or your next move? Franc got your back! He’s smart, fast and always learning. Despite he’s available “24/7”, Don’t forget to go easy on him if he gets it a little wrong!
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
           Save me
          </Button>
        </Box>
      </Flex>

      {/* How It Works Section */}
  
     <Box py={16} px={{ base: 6, md: 16 }} bg="white">
  <Heading size="lg" mb={10} textAlign="center">
    How It Works
  </Heading>

  {/* Desktop: steps with arrows */}
  <HStack
    spacing={10}
    maxW="6xl"
    mx="auto"
    justify="center"
    align="center"
    display={{ base: "none", md: "flex" }}
  >
    <PlainStep
      icon={AttachmentIcon}
      title="Ask any question"
      desc="Be curious."
    />
    <PlainStep
      icon={ArrowUpIcon}
      title="Get an instant answer"
      desc="Get insights about your career related questions."
    />
  </HStack>

  {/* Mobile: stacked, no arrows */}
  <VStack
    spacing={8}
    maxW="lg"
    mx="auto"
    display={{ base: "flex", md: "none" }}
  >
    <PlainStep
      icon={AttachmentIcon}
      title="Ask any question"
      desc="Be curious."
    />
    <PlainStep
      icon={ArrowUpIcon}
      title="Get an instant answer"
      desc="Get insights about your career related questions."
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
          Need Instant Help About University Life?
        </Heading>
        <Text fontSize="lg" mb={6}>
          Let Franc guide you — he's always ready to answer questions and help you navigate Antonine University!
        </Text>
        <Button
          onClick={handleTryNowClick}  // Same button handler for the CTA button
          size="lg"
          colorScheme="whiteAlpha"
          bg="white"
          color="brand.500"
          _hover={{ bg: "gray.100" }}
        >
          Start Chatting Now
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

export default ChattingPage;
