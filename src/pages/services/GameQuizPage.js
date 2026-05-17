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
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircleIcon,
  StarIcon,
  ArrowForwardIcon,
  QuestionOutlineIcon,
  ViewIcon,
} from "@chakra-ui/icons";
import { FaGamepad } from "react-icons/fa";
import Footer from "../../components/Footer";
import { useContext } from "react";
import { AuthContext } from "../../components/AuthContext";

const GameQuizPage = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();

  const handleTryNowClick = () => {
    if (!isLoggedIn) {
      onOpen();
      return;
    }
    navigate("/game/try");
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
      <Flex
        direction={{ base: "column", md: "row" }}
        align="center"
        justify="space-between"
        p={{ base: 6, md: 16 }}
        gap={10}
      >
        <Image
          src="/assets/images/gamification.gif"
          alt="Gamification quiz"
          maxW="400px"
          objectFit="contain"
          alignSelf="flex-end"
          fallbackSrc="/assets/images/sds.svg"
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
          <Heading color="brand.500" size="xl" mb={2}>
            Career Quest
          </Heading>

          <Text fontSize="lg" mb={6}>
            A timed, level-based quiz with abilities, badges, and points. Unlock Bronze through Diamond
            as you prove what you know.
          </Text>

          <HStack spacing={6} mb={6} flexWrap="wrap">
            <VStack spacing={1}>
              <Icon as={FaGamepad} color="purple.400" boxSize={6} />
              <Text fontSize="sm">Five levels</Text>
            </VStack>
            <VStack spacing={1}>
              <Icon as={StarIcon} color="yellow.400" boxSize={6} />
              <Text fontSize="sm">Badges & points</Text>
            </VStack>
            <VStack spacing={1}>
              <Icon as={CheckCircleIcon} color="green.400" boxSize={6} />
              <Text fontSize="sm">Power-up abilities</Text>
            </VStack>
          </HStack>

          <Button onClick={handleTryNowClick} colorScheme="brand" size="md">
            Start playing
          </Button>
        </Box>
      </Flex>

      <Box py={16} px={{ base: 6, md: 16 }} textAlign="center" bg="white">
        <Heading color="brand.500" size="lg" mb={10}>
          How it works
        </Heading>

        <HStack spacing={10} justify="center" flexWrap="wrap">
          <VStack spacing={4}>
            <Circle size="60px" bg="purple.100" color="purple.700">
              <Icon as={QuestionOutlineIcon} boxSize={6} />
            </Circle>
            <Text fontWeight="bold">Pick a level</Text>
            <Text fontSize="sm" color="gray.600" maxW="150px">
              Only unlocked levels can be started. Your progress syncs from the server.
            </Text>
          </VStack>

          <Icon
            as={ArrowForwardIcon}
            color="gray.400"
            boxSize={6}
            display={{ base: "none", md: "block" }}
          />

          <VStack spacing={4}>
            <Circle size="60px" bg="purple.100" color="purple.700">
              <Icon as={ViewIcon} boxSize={6} />
            </Circle>
            <Text fontWeight="bold">Beat the clock</Text>
            <Text fontSize="sm" color="gray.600" maxW="150px">
              Each question has its own countdown on the client.
            </Text>
          </VStack>

          <Icon
            as={ArrowForwardIcon}
            color="gray.400"
            boxSize={6}
            display={{ base: "none", md: "block" }}
          />

          <VStack spacing={4}>
            <Circle size="60px" bg="purple.100" color="purple.700">
              <Icon as={CheckCircleIcon} boxSize={6} />
            </Circle>
            <Text fontWeight="bold">Earn rewards</Text>
            <Text fontSize="sm" color="gray.600" maxW="150px">
              Finish to see your score, badge, and unlocked levels when the API provides them.
            </Text>
          </VStack>
        </HStack>
      </Box>

      <Box bg="brand.500" color="white" py={16} px={{ base: 6, md: 16 }} textAlign="center">
        <Heading size="lg" mb={4}>
          Ready to level up?
        </Heading>
        <Text fontSize="lg" mb={6}>
          Log in and jump into the quiz — abilities, timers, and five badge tiers await.
        </Text>
        <Button
          onClick={handleTryNowClick}
          size="lg"
          colorScheme="whiteAlpha"
          bg="white"
          color="brand.500"
          _hover={{ bg: "gray.100" }}
        >
          Start playing
        </Button>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Login required</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Please log in to play Career Quest.</Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={handleLoginClick}>
              Go to login
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

export default GameQuizPage;
