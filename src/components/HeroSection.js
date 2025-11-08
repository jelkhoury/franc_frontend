// src/components/HeroSection.jsx or .js
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Stack,
  Text,
  VStack,
  useBreakpointValue,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const MotionText = motion(Text);

const messages = [
  "Empower your career with FRANC 24/7",
  "Explore your future career with FRANC 24/7",
  "Eliminate your career decisions ambiguity with FRANC 24/7",
  "Enlarge your career lens with FRANC 24/7",
  "Elevate your job readiness with FRANC 24/7",
  "Empower your decisions with FRANC 24/7"
];

const HeroSection = ({ onGetStartedClick }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000); // Change message every 3 seconds

    return () => clearInterval(timer);
  }, []);

  // Responsive flag: true on mobile (base), false on md and up
  const isMobile = useBreakpointValue({ base: true, md: false });



  return (
    <Box py={{ base: 16, md: 32 }} px={6} bg="#EBF2FF">
      <Container maxW="6xl">
        <Flex
          direction={{ base: "column", md: "row" }}
          align="center"
          justify="space-between"
          gap={{ base: 8, md: 12 }}
        >
          {/* Text Section */}
          <Box flex="1" textAlign={{ base: "center", md: "left" }}>
            <VStack spacing={6} align={{ base: "center", md: "flex-start" }}>
              <Heading color="brand.500"
                fontWeight={600}
                fontSize={{ base: "2xl", sm: "4xl", md: "5xl" }}
                lineHeight="110%"
              >
                {/* Welcome to{" "}
                <Text as="span" color="brand.500">
                  Franc's
                </Text>{" "}
                <Text as="span" color="secondary.50">
                  Platform
                </Text> */}
                <Text as="span" color="brand.500">Welcome to the Future of Career Support </Text>
              </Heading>

              <Text
                color="gray.600"
                fontSize={{ base: "md", sm: "lg" }}
                maxW="2xl"
              >
                Franc is Lebanon’s first AI powered career advisor launched by Antonine University - Center for Career Development (C.C.D). to make your career journey smarter, faster, and easier.
              </Text>

              <Stack
                direction={{ base: "column", sm: "row" }}
                spacing={4}
                justify={{ base: "center", md: "flex-start" }}
              >
                {/* <Button
                  onClick={onGetStartedClick}
                  colorScheme="brand"
                  bg="brand.500"
                  rounded="full"
                  px={6}
                  _hover={{ bg: "brand.600" }}
                >
                  Get Started
                </Button> */}
                <Button
                  as={RouterLink}
                  to="/franc"
                  bg="brand.500"
                  colorScheme="brand"
                                    rounded="full"
                  
                  size="sm"
                  px={6}
                  _hover={{ bg: "brand.600" }}
                >
                  Learn more
                </Button>
              </Stack>
            </VStack>
          </Box>

          {/* Video Section */}
          <Box flex="1" textAlign="center" position="relative">
            <Box
              as="video"
              src="/assets/videos/franclogo.mp4"
              autoPlay
              muted
              playsInline
              width={{ base: "280px", md: "500px" }}
              height={{ base: "200px", md: "350px" }}
              mx="auto"
              objectFit="cover"
              borderRadius="lg"
              boxShadow="xl"
            />
            
            {/* Animated Message */}
            <Box mt={6}>
              <MotionText
                key={currentMessageIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                color="brand.400"
                fontSize={{ base: "lg", md: "xl" }}
                fontWeight="bold"
                textAlign="center"
                py={4}
              >
                {messages[currentMessageIndex]}
              </MotionText>
            </Box>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
};

export default HeroSection;
