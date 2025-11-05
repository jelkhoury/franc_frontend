import {
  Box,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Flex,
  Icon,
  Image
} from "@chakra-ui/react";
import { FcDiploma1, FcDiploma2, FcComments } from "react-icons/fc";
import { useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import Footer from "../components/Footer";
import HeroSection from "../components/HeroSection";
import ComingSoonServices from "../components/Comming";
import { motion } from "framer-motion";

const LandingPage = () => {
  const servicesRef = useRef(null);
  const MotionBox = motion(Box);

  const scrollToServices = () => {
    servicesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const [page, setPage] = useState(0);
  const itemsPerPage = 3;

  // All service cards collected in an array
const serviceCards = [
  // Resume
  (
    <MotionBox key="resume" shadow="md" p={5} borderRadius="lg" textAlign="center" bg="gray.50"
      initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }} viewport={{ once: true }}
      _hover={{ transform: "scale(1.05)", transition: "0.2s ease-in-out" }}>
      
      <Flex w={20} h={20} bg="gray.100" rounded="full" align="center" justify="center" mx="auto" mb={4} overflow="hidden">
        {/* ✅ Use GIF if provided, else fallback to icon */}
        <Image src="/assets/images/cv_icon.gif" alt="Resume" boxSize="70px" objectFit="contain" />
        {/* Or: <Icon as={FcDiploma1} boxSize={10} /> */}
      </Flex>

      <Heading color="brand.500"size="md" mb={2}>Resume Feedback</Heading>
      <Text color="gray.600" mb={4}>
        A resume is like Wi-Fi — without it, you’re not connecting anywhere.
      </Text>
      <Button as={RouterLink} to="/resume-evaluation" colorScheme="brand" size="sm">
        Fix It
      </Button>
    </MotionBox>
  ),

  // Chatting
  (
    <MotionBox key="chatting" shadow="md" p={5} borderRadius="lg" textAlign="center" bg="gray.50"
      initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }} viewport={{ once: true }}
      _hover={{ transform: "scale(1.05)", transition: "0.2s ease-in-out" }}>
      
      <Flex w={20} h={20} bg="gray.100" rounded="full" align="center" justify="center" mx="auto" mb={4} overflow="hidden">
        <Image src="/assets/images/chatting_icon.gif" alt="Chatting" boxSize="70px" objectFit="contain" />
        {/* Or: <Icon as={FcComments} boxSize={10} /> */}
      </Flex>

      <Heading color="brand.500" size="md" mb={2}>Any help?</Heading>
      <Text color="gray.600" mb={4}>
        SOS! Someone save me from my own confusion?
      </Text>
      <Button as={RouterLink} to="/chatting" colorScheme="brand" size="sm">
        Save me
      </Button>
    </MotionBox>
  ),

  // Cover Letter
  (
    <MotionBox key="cover" shadow="md" p={5} borderRadius="lg" textAlign="center" bg="gray.50"
      initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }} viewport={{ once: true }}
      _hover={{ transform: "scale(1.05)", transition: "0.2s ease-in-out" }}>
      
      <Flex w={20} h={20} bg="gray.100" rounded="full" align="center" justify="center" mx="auto" mb={4} overflow="hidden">
        <Image src="/assets/images/cover_letter_icon.gif" alt="Cover Letter" boxSize="70px" objectFit="contain" />
        {/* Or: <Icon as={FcDiploma2} boxSize={10} /> */}
      </Flex>

      <Heading color="brand.500" size="md" mb={2}>Cover Letter feedback</Heading>
      <Text color="gray.600" mb={4}>
        A cover letter is the handshake before the meeting
      </Text>
      <Button as={RouterLink} to="/cover-letter-evaluation" colorScheme="brand" size="sm">
        Make it happen
      </Button>
    </MotionBox>
  ),

  // Personality Test (SDS)
  (
    <MotionBox key="sds" shadow="md" p={5} borderRadius="lg" textAlign="center" bg="gray.50"
      initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }} viewport={{ once: true }}
      _hover={{ transform: "scale(1.05)", transition: "0.2s ease-in-out" }}>
      
      <Flex w={20} h={20} bg="gray.100" rounded="full" align="center" justify="center" mx="auto" mb={4} overflow="hidden">
        <Image src="/assets/images/compass_icon.gif" alt="Personality Test" boxSize="70px" objectFit="contain" />
        {/* Or: <Icon as={FcDiploma2} boxSize={10} /> */}
      </Flex>

      <Heading color="brand.500" size="md" mb={2}>Personality Test</Heading>
      <Text color="gray.600" mb={4}>
        A personality test is your compass for your career
      </Text>
      <Button as={RouterLink} to="/self-directed-search" colorScheme="brand" size="sm">
        Discover me
      </Button>
    </MotionBox>
  ),

  // Mock Interview
  (
    <MotionBox key="mock" shadow="md" p={5} borderRadius="lg" textAlign="center" bg="gray.50"
      initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }} viewport={{ once: true }}
      _hover={{ transform: "scale(1.05)", transition: "0.2s ease-in-out" }}>
      
      <Flex w={20} h={20} bg="gray.100" rounded="full" align="center" justify="center" mx="auto" mb={4} overflow="hidden">
        <Image src="/assets/images/mockinterview.gif" alt="Mock Interview" boxSize="70px" objectFit="contain" />
        {/* Or: <Icon as={FcDiploma2} boxSize={10} /> */}
      </Flex>

      <Heading color="brand.500" size="md" mb={2}>Mock Interview</Heading>
      <Text color="gray.600" mb={4}>
        See yourself, hear yourself and repeat.
      </Text>
      <Button as={RouterLink} to="/mock-interview" colorScheme="brand" size="sm">
        Dare Me
      </Button>
    </MotionBox>
  ),
];


  const pageCount = Math.ceil(serviceCards.length / itemsPerPage);

  // visible slice
  const visibleCards = serviceCards.slice(
    page * itemsPerPage,
    page * itemsPerPage + itemsPerPage
  );

  return (
    <Box>
      <HeroSection onGetStartedClick={scrollToServices} />

      {/* Services Section */}
      <Box ref={servicesRef} py={20} bg="white">
        <Heading color="brand.500" size="xl" textAlign="center" mb={10} >
          Our Services
        </Heading>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10} px={10}>
          {visibleCards}
        </SimpleGrid>

        {/* Pagination controls */}
        <Flex mt={8} justify="center" align="center" gap={4}>
          <Button
            onClick={() => setPage((p) => (p - 1 + pageCount) % pageCount)}
            size="sm"
          >
            ◀
          </Button>

          {Array.from({ length: pageCount }).map((_, i) => (
            <Box
              key={i}
              w={3}
              h={3}
              rounded="full"
              bg={i === page ? "brand.500" : "gray.300"}
              cursor="pointer"
              onClick={() => setPage(i)}
            />
          ))}

          <Button onClick={() => setPage((p) => (p + 1) % pageCount)} size="sm">
            ▶
          </Button>
        </Flex>
      </Box>

      <ComingSoonServices />
      <Footer />
    </Box>
  );
};

export default LandingPage;
