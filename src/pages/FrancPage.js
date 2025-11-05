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
  Collapse,
  IconButton,
  HStack,
} from "@chakra-ui/react";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { useState } from "react";
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
    heading: "Resume Feedback",
    description:
      "A resume is like Wi-Fi — without it, you’re not connecting anywhere.",
    gif: "/assets/images/cv_icon.gif",
    isActive: true,
    link: "/resume-evaluation",
    buttonText: "Fix It",
  },
  {
    heading: "Any help?",
    description: "SOS! Someone save me from my own confusion?",
    gif: "/assets/images/chatting_icon.gif",
    isActive: true,
    link: "/chatting",
    buttonText: "Save me",
  },
  {
    heading: "Cover Letter feedback",
    description: "A cover letter is the handshake before the meeting",
    gif: "/assets/images/cover_letter_icon.gif",
    isActive: true,
    link: "/cover-letter-evaluation",
    buttonText: "Make it happen",
  },
  {
    heading: "Mock Interview",
    description: "See yourself, hear yourself and repeat.",
    gif: "/assets/images/mockinterview.gif",
    isActive: true,
    link: "/mock-interview",
    buttonText: "Dare Me",
  },
  {
    heading: "Personality Test",
    description: "A personality test is your compass for your career",
    gif: "/assets/images/compass_icon.gif",
    isActive: true,
    link: "/self-directed-search",
    buttonText: "Discover me",
  },
  {
    heading: "Job comparison",
    description: "Try the shoes before you choose the path.",
    gif: "/assets/images/comparison.gif",
    isActive: false,
  },
  {
    heading: "Job Matchmaking",
    description: "The right key opens the right door.",
    gif: "/assets/images/job_matching.gif",
    isActive: false,
  },
  {
    heading: "Values and Interests",
    description:
      "Choose a job you love and you will never have to work a day in your life.",
    gif: "/assets/images/values.gif",
    isActive: false,
  },
  {
    heading: "Gamification",
    description: "Level up your skills, level up your future.",
    gif: "/assets/images/gamification.gif",
    isActive: false,
  },
];

const ServiceCard = ({
  heading,
  description,
  icon,
  gif,
  isActive,
  link,
  buttonText,
}) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const activeBg = useColorModeValue("brand.50", "gray.700");
  const iconBg = isActive ? "brand.100" : "gray.200";
  const iconColor = isActive ? "brand.500" : "gray.500";

  return (
    <Box
      h="100%"
      minH="250px"
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
      display="flex"
      flexDirection="column"
    >
      <Stack spacing={4} flex="1">
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
          overflow="hidden"
        >
          {gif ? (
            <Image src={gif} alt={heading} boxSize="40px" objectFit="contain" />
          ) : (
            <Icon as={icon} boxSize={8} />
          )}
        </Flex>

        <Box textAlign="center" flex="1">
          <Heading color="brand.500" size="md" mb={1}>
            {heading}
          </Heading>
          <Text fontSize="sm" color="gray.600">
            {description}
          </Text>
        </Box>
      </Stack>

      <Box textAlign="center" mt={4}>
        {isActive ? (
          <Button
            as={RouterLink}
            to={link}
            colorScheme="brand"
            size="sm"
            px={6}
            borderRadius="full"
            fontWeight="semibold"
            minW={120}
          >
            {buttonText || "Learn More"}
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
    </Box>
  );
};

const ExpandableSections = () => {
  const [expandedSection, setExpandedSection] = useState(0); // First section expanded by default
  // letters correspond to images placed in public/assets/images as f.png, r.png, a.png, n.png, c.png
  const letters = ["f", "r", "a", "n", "c"];

  const sections = [
    {
      title: "The Birth of FRANC",
      content: (
        <Text fontSize="lg" color="gray.600">
          <Text as="span" color="brand.500" fontWeight="semibold">
            Franc
          </Text>{" "}
          was born from a dream—and a lot of hard work. Brainstormed by the
          passionate team at the Center for Career Development (CCD){" "}
          <Text as="span" fontWeight="semibold">
            in June 2024
          </Text>
          , pre-launched{" "}
          <Text as="span" fontWeight="semibold">
            in March 2025
          </Text>
          , and officially released{" "}
          <Text as="span" fontWeight="semibold">
            in September 2025
          </Text>
          , FRANC is the{" "}
          <Text as="span" fontWeight="semibold">
            Lebanon's first digital career advisor
          </Text>
          , designed to guide students on their journey toward professional
          success.
        </Text>
      ),
    },
    {
      title: "The Name Behind FRANC",
      content: (
        <Text fontSize="lg" color="gray.600">
          The name FRANC comes from{" "}
          <Text as="span" fontWeight="semibold">
            Frank Parsons
          </Text>
          , the{" "}
          <Text as="span" fontWeight="semibold">
            Father of Career Counseling
          </Text>{" "}
          and Founder of{" "}
          <Text as="span" fontWeight="semibold">
            Vocational Guidance
          </Text>
          —a pioneer whose legacy inspired us to create a tool that truly makes
          a difference in students' lives.
        </Text>
      ),
    },
    {
      title: "Our Values & Purpose",
      content: (
        <Text fontSize="lg" color="gray.600">
          FRANC provides personalized career guidance in multiple forms using
          advanced methods, embodying the values of{" "}
          <Text as="span" fontWeight="semibold">
            Focus, Reshape, Advise, Navigate, and Connect
          </Text>
          . We created FRANC because we recognized the challenges students face:
          limited access to the Career Center outside working hours, uncertainty
          about career goals, and low levels of career readiness.
        </Text>
      ),
    },
    {
      title: "Our Mission",
      content: (
        <Text fontSize="lg" color="gray.600">
          <Text as="span" fontWeight="semibold">
            Our mission is simple yet powerful:
          </Text>{" "}
          to offer personalized guidance{" "}
          <Text as="span" fontWeight="semibold">
            anytime, anywhere
          </Text>
          . FRANC acts as a helper, providing AI-powered career assessments and
          services that reduce anxiety, enhance confidence, and make the job
          search experience stress-free. Students can explore career paths,
          sharpen their skills, and gain the self-assurance they need to
          succeed—all at their own pace.
        </Text>
      ),
    },
    {
      title: "Built by Students, for Students",
      content: (
        <Text fontSize="lg" color="gray.600">
          FRANC's creation was a team effort fueled by feedback, creativity, and
          expertise. Its design was crafted by{" "}
          <Text as="span" fontWeight="semibold">
            UA graphic design students
          </Text>
          , and the final version was{" "}
          <Text as="span" fontWeight="semibold">
            chosen by a student vote
          </Text>
          —because this project is for students, by students. The platform was
          built using the cumulative experience of the CCD team and developed in
          collaboration with the{" "}
          <Text as="span" fontWeight="semibold">
            Department of Computer Science at the Faculty of Engineering and
            Technology (FET)
          </Text>{" "}
          and its students.
        </Text>
      ),
    },
  ];

  const toggleSection = (index) => {
    setExpandedSection(expandedSection === index ? -1 : index);
  };

  return (
    <Flex
      direction={{ base: "column", lg: "row" }}
      spacing={4}
      textAlign="left"
      align="stretch"
      maxW="6xl"
      mx="auto"
      gap={4}
    >
      {sections.map((section, index) => (
        <Box
          key={index}
          flex={expandedSection === index ? "3" : "1"}
          minW="0"
          border="1px"
          borderColor={useColorModeValue("gray.200", "gray.700")}
          borderRadius="lg"
          overflow="hidden"
          bgGradient={useColorModeValue(
            "linear(to-br, #ffffff, #f7fafc,rgb(249, 249, 250))", // light
            "linear(to-br, #1a202c, #2d3748, #4a5568)" // dark
          )}
          boxShadow={expandedSection === index ? "xl" : "lg"}
          display="flex"
          flexDirection="column"
          transition="all 0.3s ease"
          _hover={{
            boxShadow: "2xl",
            transform: "translateY(-2px)",
          }}
        >
          {expandedSection === index ? (
            // Expanded state: horizontal title at top
            <VStack spacing={0}>
              <HStack
                p={4}
                cursor="pointer"
                onClick={() => toggleSection(index)}
                _hover={{ bg: useColorModeValue("gray.50", "gray.700") }}
                transition="background-color 0.2s"
                w="100%"
                justify="space-between"
              >
                <Heading color="brand.500"
                  fontSize="lg"
                  fontWeight="semibold"
                  textAlign="left"
                >
                  {section.title}
                </Heading>
                <IconButton
                  aria-label="Collapse"
                  icon={<ChevronUpIcon />}
                  size="sm"
                  variant="ghost"
                />
              </HStack>
              <Box p={4} pt={0} flex="1">
                {section.content}
              </Box>
            </VStack>
          ) : (
            // Collapsed state: vertical title
            <VStack
              p={4}
              cursor="pointer"
              onClick={() => toggleSection(index)}
              _hover={{ bg: useColorModeValue("gray.50", "gray.700") }}
              transition="background-color 0.2s"
              minH="400px"
              justify="center"
              spacing={4}
            >
              <Heading color="brand.500"
                fontSize="lg"
                fontWeight="semibold"
                textAlign="center"
                transform="rotate(90deg)"
                whiteSpace="nowrap"
              >
                {section.title}
              </Heading>

            </VStack>
          )}

          {/* Footer with a single letter image (f, r, a, n, c) per section */}
          <Box
            as="footer"
            p={3}
            mt="auto"
            alignSelf="stretch"
            borderTop="1px"
            borderColor={useColorModeValue("gray.100", "gray.700")}
            bg={useColorModeValue("transparent", "transparent")}
            textAlign="center"
          >
            <Image
              src={`/assets/images/${letters[index]}.png`}
              alt={`Letter ${letters[index].toUpperCase()}`}
              boxSize={{ base: "36px", md: "48px" }}
              objectFit="contain"
              mx="auto"
              ignoreFallback
            />
          </Box>
        </Box>
      ))}
    </Flex>
  );
};

const FrancPage = () => {
  return (
    <Box
      py={{ base: 24, md: 35 }}
      px={6}
      bgGradient="linear(to-r, white, #ebf8ff)"
    >
      <Heading color="brand.500"
        size="2xl"
        display="flex"
        alignItems="center"
        justifyContent="center"
        gap={4}
        py={8}
      >
        <Image
          src="/assets/images/francyellow_transparentbg-01.svg"
          alt="Logo"
          height="70px"
          width="auto"
          objectFit="contain"
          ignoreFallback
        />
        in case You Missed it
      </Heading>
      <ExpandableSections />

      {/* Services Grid */}
      <Box mt={16} bg={useColorModeValue("gray.50", "gray.900")} py={10}>
        <Stack spacing={4} as={Container} maxW="3xl" textAlign="center" mb={12}>
          <Heading color="brand.500"
            fontSize={{ base: "2xl", sm: "4xl" }}
            fontWeight="bold"
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={2}
          >
            <Image
              src="/assets/images/francyellow_transparentbg-01.svg"
              alt="Logo"
              height="55px"
              width="auto"
              objectFit="contain"
              ignoreFallback
            />
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
