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
          src="/assets/images/gamification_icon.svg"
          alt="Career Quest"
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

          <Text fontSize="lg" mb={6} lineHeight="tall">
            Ready to play the hiring game? Career Quest turns the real path from{" "}
            <Box as="span" fontWeight="bold" color="brand.500">
              Applicant
            </Box>{" "}
            to{" "}
            <Box as="span" fontWeight="bold" color="brand.500">
              Candidate
            </Box>{" "}
            to{" "}
            <Box as="span" fontWeight="bold" color="brand.500">
              Employee
            </Box>{" "}
            into a five-level adventure. Beat the clock, unleash power-ups, stack points, and collect
            shiny badges as you master every step it takes to get hired.
          </Text>

          <HStack spacing={6} mb={6} flexWrap="wrap">
            <VStack spacing={1}>
              <Icon as={FaGamepad} color="purple.400" boxSize={6} />
              <Text fontSize="sm">5 hiring levels</Text>
            </VStack>
            <VStack spacing={1}>
              <Icon as={StarIcon} color="yellow.400" boxSize={6} />
              <Text fontSize="sm">Bronze → Diamond badges</Text>
            </VStack>
            <VStack spacing={1}>
              <Icon as={CheckCircleIcon} color="green.400" boxSize={6} />
              <Text fontSize="sm">Timed quiz + abilities</Text>
            </VStack>
          </HStack>

          <Button onClick={handleTryNowClick} colorScheme="brand" size="md">
            Start playing
          </Button>
        </Box>
      </Flex>

      <Box py={16} px={{ base: 6, md: 16 }} textAlign="center" bg="white">
        <Heading color="brand.500" size="lg" mb={3}>
          How it works
        </Heading>
        <Text fontSize="md" color="gray.600" maxW="3xl" mx="auto" mb={10} lineHeight="tall">
          Play through five levels that mirror the hiring journey. Clear each stage to earn a badge,
          unlock the next level, and climb from Applicant to Employee.
        </Text>

        <Flex
          direction={{ base: "column", lg: "row" }}
          align="stretch"
          justify="center"
          gap={{ base: 6, lg: 4 }}
          maxW="6xl"
          mx="auto"
        >
          {[
            {
              level: 1,
              stage: "Applicant",
              title: "First contact",
              badge: "Bronze",
              detail: "Kick off your quest — apply what you know and earn your first badge.",
            },
            {
              level: 2,
              stage: "Applicant",
              title: "Stand out",
              badge: "Silver",
              detail: "Prove you are more than a CV and level up your applicant game.",
            },
            {
              level: 3,
              stage: "Candidate",
              title: "In the arena",
              badge: "Gold",
              detail: "Face interview-style challenges and show you belong on the shortlist.",
            },
            {
              level: 4,
              stage: "Candidate",
              title: "Closing in",
              badge: "Platinum",
              detail: "Nail the final hurdles before the offer — you are almost hired.",
            },
            {
              level: 5,
              stage: "Employee",
              title: "Hired!",
              badge: "Diamond",
              detail: "Cross the finish line, flash your top badge, and complete the journey.",
            },
          ].map((step, index, steps) => (
            <Flex key={step.level} align="center" flex={{ base: "none", lg: 1 }} minW={0}>
              <VStack spacing={3} flex="1" px={2}>
                <Circle size="52px" bg="brand.50" color="brand.600" fontWeight="bold" fontSize="lg">
                  {step.level}
                </Circle>
                <Text fontSize="xs" fontWeight="700" color="brand.500" textTransform="uppercase" letterSpacing="wider">
                  {step.stage}
                </Text>
                <Text fontWeight="bold">{step.title}</Text>
                <Text fontSize="sm" color="gray.600" lineHeight="short">
                  {step.detail}
                </Text>
                <HStack spacing={1} justify="center">
                  <Icon as={StarIcon} color="yellow.400" boxSize={3} />
                  <Text fontSize="xs" fontWeight="semibold" color="gray.700">
                    {step.badge} badge
                  </Text>
                </HStack>
              </VStack>
              {index < steps.length - 1 && (
                <Icon
                  as={ArrowForwardIcon}
                  color="gray.300"
                  boxSize={5}
                  flexShrink={0}
                  display={{ base: "none", lg: "block" }}
                  mx={1}
                />
              )}
            </Flex>
          ))}
        </Flex>
      </Box>

      <Box bg="brand.500" color="white" py={16} px={{ base: 6, md: 16 }} textAlign="center">
        <Heading size="lg" mb={4}>
          Ready to level up?
        </Heading>
        <Text fontSize="lg" mb={6}>
          Log in and start your quest — five levels, five badges, and one epic path from applicant to
          employee.
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
