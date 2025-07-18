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
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

const HeroSection = ({ onGetStartedClick }) => {
  return (
    <Box py={{ base: 16, md: 32 }} px={6} bg="gray.100">
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
              <Heading
                fontWeight={600}
                fontSize={{ base: "2xl", sm: "4xl", md: "5xl" }}
                lineHeight="110%"
              >
                Welcome to{" "}
                <Text as="span" color="brand.500">
                  Franc's
                </Text>{" "}
                <Text as="span" color="secondary.50">
                  Platform
                </Text>
              </Heading>

              <Text
                color="gray.600"
                fontSize={{ base: "md", sm: "lg" }}
                maxW="2xl"
              >
                Discover our amazing services and grow with us. Franc is the
                first AI-powered career adviser in Lebanon, launched by Antonine
                University and the Center for Career Development (CCD).
              </Text>

              <Stack
                direction={{ base: "column", sm: "row" }}
                spacing={4}
                justify={{ base: "center", md: "flex-start" }}
              >
                <Button
                  onClick={onGetStartedClick}
                  colorScheme="brand"
                  bg="brand.500"
                  rounded="full"
                  px={6}
                  _hover={{ bg: "brand.600" }}
                >
                  Get Started
                </Button>
                <Button
                  as={RouterLink}
                  to="/franc"
                  variant="link"
                  colorScheme="gray"
                  size="sm"
                >
                  Learn more
                </Button>
              </Stack>
            </VStack>
          </Box>

          {/* Video Section */}
          <Box flex="1" textAlign="center">
            <Box
              as="video"
              src="/assets/videos/franclogo.mp4"
              autoPlay
              loop
              muted
              playsInline
              width={{ base: "280px", md: "500px" }}
              height={{ base: "200px", md: "350px" }}
              mx="auto"
              objectFit="cover"
              borderRadius="lg"
              boxShadow="xl"
            />
          </Box>
        </Flex>
      </Container>
    </Box>
  );
};

export default HeroSection;
