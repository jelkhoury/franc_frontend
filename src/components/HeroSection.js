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

const messageGroups = [
  [
    { text: "Empower your career with FRANC 24/7", direction: "left" },
    { text: "Explore your future career with FRANC 24/7", direction: "top" },
    { text: "Eliminate your career decisions ambiguity with FRANC 24/7", direction: "right" },
  ],
  [
    { text: "Enlarge your career lens with FRANC 24/7", direction: "left" },
    { text: "Elevate your job readiness with FRANC 24/7", direction: "top" },
    { text: "Empower your decisions with FRANC 24/7", direction: "right" },
  ]
];

const HeroSection = ({ onGetStartedClick }) => {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentGroupIndex((prev) => (prev + 1) % messageGroups.length);
    }, 5000); // Change message group every 5 seconds

    return () => clearInterval(timer);
  }, []);

  // Responsive flag: true on mobile (base), false on md and up
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Animation variants for floating bubbles
  const bubbleVariants = {
    initial: (direction) => ({
      opacity: 0,
      scale: direction === "top" ? 1.3 : 1.6,
      ...getDirectionalPosition(direction, direction === "top" ? 200 : 400),
    }),
    animate: {
      opacity: [0, 0.7, 1],
      scale: direction => direction === "top" ? [1.3, 0.8, 0.75] : [1.6, 0.9, 0.85],
      y: 0,
      x: 0,
      transition: {
        duration: 1.2,
        type: "spring",
        bounce: 0.2,
        opacity: { duration: 0.8 }
      }
    },
    exit: (direction) => ({
      opacity: 0,
      scale: 0.4,
      ...getDirectionalPosition(direction, 150),
      transition: {
        duration: 0.8,
        ease: [0.4, 0, 0.2, 1]
      }
    }),
    float: {
      y: [0, -10, 0],
      x: [0, 8, 0],
      scale: [0.8, 0.85, 0.8],
      transition: {
        duration: 3,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut"
      }
    }
  };

  const getDirectionalPosition = (direction, distance) => {
    switch (direction) {
      case "left":
        return { x: -distance, y: -30 };
      case "right":
        return { x: distance * 0.8, y: 60 };
      case "top":
        return { x: 0, y: -distance };
      default:
        return { x: 0, y: distance };
    }
  };

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
            
            {/* Animated Bubble Messages */}
            <Box
              position="absolute"
              top="-100px"
              left="-100px"
              right="-100px"
              bottom="-100px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              pointerEvents="none"
            >
              {messageGroups[currentGroupIndex].map((message, idx) => (
                <MotionText
                  key={`${currentGroupIndex}-${idx}`}
                  custom={message.direction}
                  initial="initial"
                  animate={["animate", "float"]}
                  exit="exit"
                  variants={bubbleVariants}
                  style={{
                    position: "absolute",
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(12px)",
                    padding: message.direction === "top" ? "0.6rem 1.2rem" : "0.7rem 1.4rem",
                    borderRadius: "16px",
                    boxShadow: "0 8px 32px rgba(31, 38, 135, 0.15)",
                    border: "1px solid rgba(255, 255, 255, 0.4)",
                    maxWidth: message.direction === "top" ? "60%" : "50%",
                    transform: "perspective(1000px)",
                    transformStyle: "preserve-3d",
                    ...(message.direction === "left" && { 
                      left: "-25%", 
                      top: "40%", 
                      transform: "translateY(-50%) scale(0.85)"
                    }),
                    ...(message.direction === "right" && { 
                      right: "-12%", 
                      top: "65%", 
                      transform: "translateY(-50%) scale(0.85)"
                    }),
                    ...(message.direction === "top" && { 
                      top: "10%", 
                      left: "50%", 
                      transform: "translateX(-50%) scale(0.75)"
                    }),
                    // Mobile overrides (isMobile flag)
                    ...(isMobile && {
                      padding: message.direction === "top" ? "0.35rem 0.7rem" : "0.45rem 0.9rem",
                      maxWidth: message.direction === "top" ? "50%" : "40%",
                      ...(message.direction === "left" && {
                        left: "2%",
                        top: "70%",
                        transform: "translateY(-50%) scale(0.7)",
                      }),
                      ...(message.direction === "right" && {
                        right: "5%",
                        top: "70%",
                        transform: "translateY(-50%) scale(0.7)",
                      }),
                      ...(message.direction === "top" && {
                        top: "15%",
                        right: "10%",
                        transform: "translateX(-50%) scale(0.6)",
                      }),
                    }),
                  }}
                  color="brand.500"
                  fontSize={{ base: "sm", md: "md" }}
                  fontWeight="bold"
                  textAlign="center"
                >
                  {message.text}
                </MotionText>
              ))}
            </Box>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
};

export default HeroSection;
