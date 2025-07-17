import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Icon,
  Stack,
  Text,
  VStack,
  Image,
  useColorModeValue,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import {
  FcDiploma1,
  FcComments,
  FcDiploma2,
  FcAssistant,
  FcCollaboration,
  FcDonate,
  FcManager,
  FcAbout,
} from "react-icons/fc";
import Footer from "../components/Footer";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

const services = [
  {
    heading: "Resume Evaluation",
    description: "Fast, reliable at anytime anywhere CV Evaluation.",
    icon: FcDiploma1,
    isActive: true,
    link: "/resume-evaluation",
  },
  {
    heading: "Chatting",
    description: "Designed to help you explore your university options.",
    icon: FcComments,
    isActive: true,
    link: "/chatting",
  },
  {
    heading: "Cover Letter Evaluation",
    description: "Scalable and flexible Cover Letter Evaluation.",
    icon: FcDiploma2,
    isActive: true,
    link: "/cover-letter-evaluation",
  },
  {
    heading: "Mock Interviews",
    description:
      "Practice with AI-driven mock interviews tailored to your industry.",
    icon: FcAssistant,
    isActive: false,
  },
  {
    heading: "Job Matchmaking",
    description: "Get matched with opportunities that fit your career goals.",
    icon: FcCollaboration,
    isActive: false,
  },
  {
    heading: "Career Coaching",
    description:
      "Access personalized coaching based on your resume and interests.",
    icon: FcManager,
    isActive: false,
  },
  {
    heading: "AI Cover Letter Builder",
    description: "Generate job-specific cover letters in seconds.",
    icon: FcDonate,
    isActive: false,
  },
  {
    heading: "Personality Insights",
    description:
      "Understand your strengths better through AI-powered analysis.",
    icon: FcAbout,
    isActive: false,
  },
];

const ServiceCard = ({ heading, description, icon, isActive, link }) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const activeBg = useColorModeValue("brand.50", "gray.700");
  const iconBg = isActive ? "brand.100" : "gray.200";
  const iconColor = isActive ? "brand.500" : "gray.500";

  return (
    <Box
      h="100%"
      borderRadius="xl"
      p={6}
      bg={isActive ? activeBg : cardBg}
      boxShadow={isActive ? "lg" : "sm"}
      border={isActive ? "2px solid" : "1px solid"}
      borderColor={isActive ? "brand.300" : "gray.200"}
      transition="all 0.3s ease"
      _hover={
        isActive ? { transform: "translateY(-4px)", boxShadow: "xl" } : {}
      }
    >
      <Stack spacing={4} h="100%">
        <Flex
          w={14}
          h={14}
          align="center"
          justify="center"
          borderRadius="full"
          bg={iconBg}
          color={iconColor}
          fontSize="2xl"
          mx="auto"
        >
          <Icon as={icon} boxSize={8} />
        </Flex>

        <Box textAlign="center">
          <Heading size="md" mb={1}>
            {heading}
          </Heading>
          <Text fontSize="sm" color="gray.600">
            {description}
          </Text>
        </Box>

        <Box textAlign="center" mt="auto">
          {isActive ? (
            <Button
              as={RouterLink}
              to={link}
              colorScheme="brand"
              size="sm"
              px={6}
              borderRadius="full"
              fontWeight="semibold"
            >
              Learn More
            </Button>
          ) : (
            <Button
              size="sm"
              borderRadius="full"
              isDisabled
              variant="outline"
              opacity={0.7}
            >
              Coming Soon
            </Button>
          )}
        </Box>
      </Stack>
    </Box>
  );
};

const FrancPage = () => {
  return (
    <Box
      py={{ base: 24, md: 40 }}
      px={6}
      bgGradient="linear(to-r, white, #ebf8ff)"
    >
      {/* Intro Section */}
      <VStack spacing={6} textAlign="center" maxW="3xl" mx="auto">
        <Heading
          size="2xl"
          display="flex"
          alignItems="center"
          justifyContent="center"
          gap={4}
        >
          Meet
          <Image
            src="/assets/images/francyellow_transparentbg-01.svg"
            alt="Logo"
            height="60px"
            width="auto"
            objectFit="contain"
            ignoreFallback
          />
        </Heading>
        <Text fontSize="lg" color="gray.600">
          <Text as="span" color="brand.500" fontWeight="semibold">
            Franc
          </Text>{" "}
          started as a Final Year Project and grew into Lebanon's first
          AI-powered career adviser. His mission is to guide students and
          professionals toward their ideal path using smart tools like resume
          evaluation, AI coaching, and interactive chat support. From job
          seekers to career changers,{" "}
          <Text as="span" color="brand.500" fontWeight="semibold">
            Franc
          </Text>{" "}
          is here to assist every step of the way.
        </Text>
      </VStack>

      {/* Services Grid */}
      <Box mt={16} bg={useColorModeValue("gray.50", "gray.900")} py={10}>
        <Stack spacing={4} as={Container} maxW="3xl" textAlign="center" mb={12}>
          <Heading fontSize={{ base: "2xl", sm: "4xl" }} fontWeight="bold">
            <Text as="span" color="brand.500">
              Franc
            </Text>
            's Services
          </Heading>
          <Text color="gray.600" fontSize={{ base: "sm", sm: "lg" }}>
            Explore what{" "}
            <Text as="span" color="brand.500" fontWeight="semibold">
              Franc
            </Text>{" "}
            offers to support your career goals.
          </Text>
        </Stack>

        <Container maxW="100%">
          <Flex flexWrap="wrap" justify="center" gap={6} w="100%">
            {services.map((service, idx) => (
              <MotionBox
                key={idx}
                minW={{ base: "100%", sm: "47%", md: "275px" }}
                flex="1"
                h="100%"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                viewport={{ once: true }}
              >
                <ServiceCard {...service} />
              </MotionBox>
            ))}
          </Flex>
        </Container>
      </Box>

      {/* Footer */}
      <Footer />
    </Box>
  );
};

export default FrancPage;
