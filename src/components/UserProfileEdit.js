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
import { captureError } from "../utils/sentryUtils";
import { getStoredToken, getUserRole, getStoredUserRole } from "../utils/tokenUtils";
import { USER_ENDPOINTS, GAME_ENDPOINTS } from "../services/apiService";
import { LEVEL_BADGE_ORDER, getEarnedBadgeLevels } from "../pages/services/GameQuiz/gameSessionUtils";
import CareerLevelMedalBadge, {
  getMedalPresetForLevel,
} from "../pages/services/GameQuiz/CareerLevelMedalBadge";
import { consumeNewGameBadgeLevel } from "../pages/services/GameQuiz/gameBadgeProfile";

export default function UserProfileEdit({ onClose, onLogout }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [gameProgress, setGameProgress] = useState(null);
  const [newBadgeLevel, setNewBadgeLevel] = useState(null);
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

  useEffect(() => {
    setNewBadgeLevel(consumeNewGameBadgeLevel());
  }, []);

  // Fetch user info and Career Quest progress
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoading(true);
        const token = getStoredToken();
        const [data, progress] = await Promise.all([
          get(USER_ENDPOINTS.GET_USER_INFO, { token }),
          get(GAME_ENDPOINTS.PROGRESS, { token }).catch((err) => {
            captureError(err);
            return null;
          }),
        ]);

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
        setGameProgress(progress);
      } catch (error) {
        captureError(error);
        console.error("Error fetching user info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  const earnedBadgeLevels = getEarnedBadgeLevels(gameProgress);
  const earnedSet = new Set(earnedBadgeLevels);

  const userName =
    `${userInfo.firstName} ${userInfo.lastName}`.trim() || "User";
  const email = userInfo.email || "No email available";

  const token = getStoredToken();
  const roleFromToken = token ? getUserRole(token) : null;
  const roleFromStorage = getStoredUserRole();
  const isAdmin = roleFromToken === "Admin" || roleFromStorage === "Admin";

  const handleReturnToAdmin = () => {
    onClose?.();
    navigate("/admin");
  };

  const handleChangePassword = () => {
    onClose();
    navigate("/forgot-password", { state: { from: "profile-edit" } });
  };

  const handleViewHistory = () => {
    onClose?.();
    navigate("/activity-history");
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
          Career Quest medals
        </Heading>
        <Text fontSize="xs" color="gray.500" textAlign="center" mb={3} lineHeight="short">
          Medals you earn by passing levels appear here. Colors match each level tier.
        </Text>
        <Flex justify="center" flexWrap="wrap" gap={3} mb={2}>
          {LEVEL_BADGE_ORDER.map(({ level }) => {
            const earned = earnedSet.has(level);
            const preset = getMedalPresetForLevel(level);
            const isNew = newBadgeLevel != null && Number(newBadgeLevel) === level;
            return (
              <VStack key={level} spacing={1} minW="72px">
                <Box position="relative">
                  <CareerLevelMedalBadge
                    preset={preset}
                    size={64}
                    earned={earned}
                    active={earned}
                  />
                  {isNew && earned && (
                    <Badge
                      position="absolute"
                      top="-6px"
                      right="-8px"
                      colorScheme="green"
                      fontSize="9px"
                      px={1.5}
                      borderRadius="full"
                    >
                      New
                    </Badge>
                  )}
                </Box>
                <Text fontSize="10px" fontWeight="600" color="gray.600">
                  L{level}
                </Text>
              </VStack>
            );
          })}
        </Flex>
        {earnedBadgeLevels.length === 0 && (
          <Text fontSize="xs" color="gray.500" textAlign="center" mb={2}>
            No medals yet — pass a level in Career Quest to earn your first one.
          </Text>
        )}
      </Box>

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

      <VStack spacing={3} w="full" pt={4} align="stretch">
        {isAdmin && (
          <Button
            variant="outline"
            colorScheme="brand"
            size="md"
            w="full"
            onClick={handleReturnToAdmin}
          >
            Return to Admin Panel
          </Button>
        )}
        <Button
          variant="outline"
          colorScheme="brand"
          size="md"
          w="full"
          onClick={handleViewHistory}
        >
          View History
        </Button>
        <Button
          variant="outline"
          colorScheme="brand"
          size="md"
          w="full"
          onClick={handleChangePassword}
        >
          Change Password
        </Button>
        <Button
          variant="solid"
          colorScheme="brand"
          size="md"
          w="full"
          onClick={() => {
            onClose?.();
            onLogout?.();
          }}
        >
          Logout
        </Button>
      </VStack>
    </Stack>
  );
}
