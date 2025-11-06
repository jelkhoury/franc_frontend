import {
  Box,
  Container,
  Flex,
  Heading,
  Icon,
  Stack,
  Text,
  useColorModeValue,
  Image,
} from "@chakra-ui/react";
import { motion } from 'framer-motion';
import React from "react";
import {
  FcAssistant,
  FcCollaboration,
  FcManager,
  FcDonate,
} from 'react-icons/fc';

const MotionBox = motion(Box);

const services = [
  {
    heading: 'Job comparison',
    description: 'Try the shoes before you choose the path.',
    gif:"/assets/images/comparison.gif",
  },
  {
    heading: 'Job Matchmaking',
    description: 'The right key opens the right door.',
    gif:"/assets/images/job_matching.gif",
  },
  {
    heading: 'Values and Interests',
    description: 'Choose a job you love and you will never have to work a day in your life.',
    gif:"/assets/images/values.gif",
  },
  {
    heading: 'Gamification',
    description: 'Level up your skills, level up your future.',
    gif:"/assets/images/gamification.gif",
  },
];

const ServiceCard = ({ heading, description, icon, gif }) => {
  const [flipped, setFlipped] = React.useState(false);
  const cardBg = useColorModeValue("white", "gray.800");
  const frontBg = useColorModeValue("gray.50", "gray.700");
  const backText = useColorModeValue("gray.600", "gray.300");

  // Toggle flip on click/tap. Keep hover flip for desktop via _groupHover.
  const handleToggle = () => setFlipped((v) => !v);
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <Box
      w={{ base: "100%", sm: "47%", md: "300px" }}
      h="250px"
      sx={{ perspective: "1000px" }}
      cursor="pointer"
      role="group"
      // make clickable and keyboard accessible
      as="button"
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-pressed={flipped}
      _focus={{ outline: "none" }}
    >
      <Box
        position="relative"
        w="100%"
        h="100%"
        transition="transform 450ms cubic-bezier(.2,.8,.2,1)"
        sx={{
          transformStyle: "preserve-3d",
          willChange: "transform",
          // If flipped state is true, keep the card rotated. _groupHover still provides hover flip on desktop.
          transform: flipped ? "rotateY(180deg)" : "translateZ(0)", // GPU promote
          transformOrigin: "center",
          contain: "layout paint style",
        }}
        _groupHover={{ transform: "rotateY(180deg)" }}
      >
        {/* Front: ICON ONLY */}
        <Box
          position="absolute"
          inset={0}
          bg={cardBg}
          borderRadius="lg"
          // keep shadows light to reduce paint cost:
          boxShadow="sm"
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={6}
          sx={{
            transform: "rotateY(0deg)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <Flex
            w={28}
            h={28}
            align="center"
            justify="center"
            rounded="full"
            bg={frontBg}
            overflow="hidden"
          >
            {gif ? (
              <Image
                src={gif}
                alt={heading}
                maxW="80%"
                maxH="80%"
                objectFit="contain"
                draggable={false}
              />
            ) : (
              <Icon as={icon} boxSize={12} />
            )}
          </Flex>
        </Box>

        {/* Back: TITLE + TEXT */}
        <Box
          position="absolute"
          inset={0}
          bg={cardBg}
          borderRadius="lg"
          boxShadow="sm"
          display="flex"
          flexDir="column"
          alignItems="center"
          justifyContent="center"
          gap={3}
          p={6}
          textAlign="center"
          sx={{
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <Heading color="brand.500" size="md">{heading}</Heading>
          <Text fontSize="md" color={backText}>
            {description}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

const ComingSoonServices = () => (
  <Box py={20} px={6} bg={useColorModeValue("gray.50", "gray.900")}>
    <Stack spacing={4} as={Container} maxW="4xl" textAlign="center" mb={12}>
      {/* Avatar Image */}
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        bg="transparent" // ✅ no background
      >
        <Image
          src="/assets/images/ratatouille.png" // your image path
          alt="Cooking Avatar"
          boxSize="200px"
          borderRadius="md"
          objectFit="contain" // ✅ shows the full image (not cropped)
          bg="transparent" // ✅ makes sure image background stays clean
        />
      </Box>

      <Heading color="brand.500" fontSize={{ base: "2xl", sm: "4xl" }} fontWeight="bold" mt={4}>
        Something is Cooking
      </Heading>

      <Text color="gray.600" fontSize={{ base: "sm", sm: "lg" }}>
        Upcoming items on the menu.
      </Text>
    </Stack>

    <Container maxW="100%">
      <Flex flexWrap="wrap" justify="center" gap={6} w="100%">
        {services.map((service, idx) => (
          <ServiceCard key={idx} {...service} />
        ))}
      </Flex>
    </Container>
  </Box>
);

export default ComingSoonServices;
