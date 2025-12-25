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
  Spinner,
  Center,
  Badge,
} from "@chakra-ui/react";
import { CheckCircleIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import { get } from "../utils/httpServices";
import { getStoredToken } from "../utils/tokenUtils";
import { USER_ENDPOINTS } from "../services/apiService";

export default function UserProfileEdit({ onClose, onLogout }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    isVerified: false,
    mockAttempts: 0,
    coverAttempts: 0,
    resumeAttempts: 0,
    sdsAttempts: 0,
  });

  // Fetch user info from API
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoading(true);
        const token = getStoredToken();
        const data = await get(USER_ENDPOINTS.GET_USER_INFO, { token });

        setUserInfo({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          role: data.role || "",
          isVerified: data.isVerified || false,
          mockAttempts: data.mockAttempts ?? 0,
          coverAttempts: data.coverAttempts ?? 0,
          resumeAttempts: data.resumeAttempts ?? 0,
          sdsAttempts: data.sdsAttempts ?? 0,
        });
      } catch (error) {
        console.error("Error fetching user info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  const userName =
    `${userInfo.firstName} ${userInfo.lastName}`.trim() || "User";
  const email = userInfo.email || "No email available";

  const handleChangePassword = () => {
    onClose();
    navigate("/forgot-password", { state: { from: "profile-edit" } });
  };

  if (loading) {
    return (
      <Center py={8}>
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

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
          <HStack spacing={2} align="center">
            <Text fontSize="xl" fontWeight="bold" color="gray.700">
              {userName || "User"}
            </Text>
            {userInfo.isVerified && (
              <CheckCircleIcon color="green.500" boxSize={5} />
            )}
          </HStack>
          <Text fontSize="md" color="gray.600">
            {email || "No email available"}
          </Text>
          <Badge
            colorScheme={userInfo.isVerified ? "green" : "gray"}
            fontSize="xs"
            px={2}
            py={1}
            borderRadius="full"
          >
            {userInfo.isVerified ? "Verified" : "Not Verified"}
          </Badge>
        </VStack>
      </Flex>

      <Box w="full" pt={2}>
        <Heading fontSize="md" color="gray.700" mb={2} textAlign="center">
          Service Attempts (Remaining)
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
              Resume Evaluations
            </Text>
            <Text fontSize="xl" fontWeight="bold" color="brand.500">
              {loading ? "-" : userInfo.resumeAttempts}
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
              Cover Letter Evaluations
            </Text>
            <Text fontSize="xl" fontWeight="bold" color="brand.500">
              {loading ? "-" : userInfo.coverAttempts}
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
              Mock Interviews
            </Text>
            <Text fontSize="xl" fontWeight="bold" color="brand.500">
              {loading ? "-" : userInfo.mockAttempts}
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
              Personality Tests
            </Text>
            <Text fontSize="xl" fontWeight="bold" color="brand.500">
              {loading ? "-" : userInfo.sdsAttempts}
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
