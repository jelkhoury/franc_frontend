"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Flex,
  Heading,
  Stack,
  HStack,
  Avatar,
  Text,
  VStack,
  Box,
  SimpleGrid,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import {
  getStoredToken,
  getStoredUserName,
  decodeToken,
} from "../utils/tokenUtils";

export default function UserProfileEdit({ onClose, onLogout }) {
  const navigate = useNavigate();

  // Dummy data for attempts - will be replaced with API call
  const [attempts, setAttempts] = useState({
    cvEvaluation: 2,
    coverLetterEvaluation: 2,
    mockInterview: 2,
    sds: 2,
  });

  // TODO: Replace with actual API call
  // useEffect(() => {
  //   const fetchAttempts = async () => {
  //     try {
  //       const response = await get(USER_ENDPOINTS.GET_ATTEMPTS);
  //       setAttempts(response.data);
  //     } catch (error) {
  //       console.error("Error fetching attempts:", error);
  //     }
  //   };
  //   fetchAttempts();
  // }, []);

  // Get user data from localStorage and token
  const userName = getStoredUserName() || "";
  const token = getStoredToken();
  const decodedToken = token ? decodeToken(token) : null;

  // Try to get email from token (common claim names)
  const email = decodedToken
    ? decodedToken[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
      ] ||
      decodedToken.email ||
      decodedToken.Email ||
      ""
    : "";

  const handleChangePassword = () => {
    onClose();
    navigate("/forgot-password", { state: { from: "profile-edit" } });
  };

  return (
    <Stack spacing={6}>

      <Flex direction="column" align="center" spacing={4}>
        <Avatar
          size="xl"
          icon={<FaUser fontSize="2rem" />}
          bg="brand.500"
          color="white"
          mb={4}
        />
        <VStack spacing={2} align="center">
          <Text fontSize="xl" fontWeight="bold" color="gray.700">
            {userName || "User"}
          </Text>
          <Text fontSize="md" color="gray.600">
            {email || "No email available"}
          </Text>
        </VStack>
      </Flex>

      <Box w="full" pt={2}>
        <Heading fontSize="md" color="gray.700" mb={2} textAlign="center">
          Service Attempts
        </Heading>
        <SimpleGrid columns={2} spacing={2}>
          <Box
            p={2}
            borderWidth="1px"
            borderRadius="md"
            borderColor="gray.200"
            bg="gray.50"
          >
            <Text fontSize="xs" color="gray.600" mb={0.5}>
              CV Evaluation
            </Text>
            <Text fontSize="xl" fontWeight="bold" color="brand.500">
              {attempts.cvEvaluation}
            </Text>
          </Box>
          <Box
            p={2}
            borderWidth="1px"
            borderRadius="md"
            borderColor="gray.200"
            bg="gray.50"
          >
            <Text fontSize="xs" color="gray.600" mb={0.5}>
              Cover Letter Evaluation
            </Text>
            <Text fontSize="xl" fontWeight="bold" color="brand.500">
              {attempts.coverLetterEvaluation}
            </Text>
          </Box>
          <Box
            p={2}
            borderWidth="1px"
            borderRadius="md"
            borderColor="gray.200"
            bg="gray.50"
          >
            <Text fontSize="xs" color="gray.600" mb={0.5}>
              Mock Interview
            </Text>
            <Text fontSize="xl" fontWeight="bold" color="brand.500">
              {attempts.mockInterview}
            </Text>
          </Box>
          <Box
            p={2}
            borderWidth="1px"
            borderRadius="md"
            borderColor="gray.200"
            bg="gray.50"
          >
            <Text fontSize="xs" color="gray.600" mb={0.5}>
              SDS
            </Text>
            <Text fontSize="xl" fontWeight="bold" color="brand.500">
              {attempts.sds}
            </Text>
          </Box>
        </SimpleGrid>
      </Box>

      <HStack spacing={4} pt={4}>
        <Button
          bg="gray.100"
          color="brand.500"
          w="full"
          _hover={{ bg: "gray.200" }}
          onClick={handleChangePassword}
        >
          Change Password
        </Button>

        <Button
          bg="brand.500"
          color="white"
          w="full"
          _hover={{ bg: "brand.700" }}
          onClick={() => {
            onClose();
            onLogout();
          }}
        >
          Logout
        </Button>
      </HStack>
    </Stack>
  );
}
