import React from "react";
import {
  Box,
  Flex,
  Text,
  Avatar,
  Badge,
  HStack,
  VStack,
  CircularProgress,
  CircularProgressLabel,
} from "@chakra-ui/react";
import { FaGraduationCap, FaCalendarAlt, FaClock } from "react-icons/fa";
import { formatAnalyticsDate, formatNumber } from "../../utils/analytics.utils";
import { getCompletionPercent } from "./user360.utils";

export default function User360Hero({ profile }) {
  const { summary } = profile;
  const completion = getCompletionPercent(summary);
  const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();

  return (
    <Box
      position="relative"
      overflow="hidden"
      bg="linear-gradient(135deg, #1a365d 0%, #2c5282 35%, #3E79BD 70%, #4299e1 100%)"
      color="white"
      px={{ base: 5, md: 8 }}
      py={{ base: 6, md: 8 }}
    >
      {/* Decorative 360 rings */}
      <Box
        position="absolute"
        top="-80px"
        right="-80px"
        w="280px"
        h="280px"
        borderRadius="full"
        border="2px solid"
        borderColor="whiteAlpha.200"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        top="-40px"
        right="-40px"
        w="200px"
        h="200px"
        borderRadius="full"
        border="1px dashed"
        borderColor="whiteAlpha.300"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="-60px"
        left="-60px"
        w="220px"
        h="220px"
        borderRadius="full"
        bg="whiteAlpha.100"
        pointerEvents="none"
      />

      <Flex direction={{ base: "column", md: "row" }} align="center" gap={6} position="relative">
        <Box position="relative" flexShrink={0}>
          <CircularProgress
            value={completion}
            size="120px"
            thickness="4px"
            color="secondary.50"
            trackColor="whiteAlpha.300"
            capIsRound
          >
            <CircularProgressLabel>
              <Avatar
                size="lg"
                name={fullName}
                bg="white"
                color="brand.600"
                fontWeight="bold"
              />
            </CircularProgressLabel>
          </CircularProgress>
          <Badge
            position="absolute"
            bottom="-2px"
            left="50%"
            transform="translateX(-50%)"
            bg="secondary.50"
            color="gray.800"
            fontSize="2xs"
            fontWeight="bold"
            px={2}
            borderRadius="full"
            whiteSpace="nowrap"
          >
            360° VIEW
          </Badge>
        </Box>

        <VStack align={{ base: "center", md: "start" }} spacing={2} flex={1}>
          <Text fontSize="xs" fontWeight="semibold" letterSpacing="wider" textTransform="uppercase" opacity={0.85}>
            Complete Franc Journey
          </Text>
          <Text as="h2" fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" lineHeight="shorter">
            {fullName || "Unknown User"}
          </Text>
          <Text fontSize="sm" opacity={0.9}>
            {profile.email}
          </Text>
          <HStack spacing={2} flexWrap="wrap" justify={{ base: "center", md: "flex-start" }}>
            {profile.faculty && (
              <Badge bg="whiteAlpha.200" color="white" px={2} py={1} borderRadius="md" fontSize="xs">
                <HStack spacing={1}>
                  <FaGraduationCap size={10} />
                  <Text>{profile.faculty}</Text>
                </HStack>
              </Badge>
            )}
            {profile.major && (
              <Badge bg="whiteAlpha.200" color="white" px={2} py={1} borderRadius="md" fontSize="xs">
                {profile.major}
              </Badge>
            )}
          </HStack>
        </VStack>

        <VStack
          align={{ base: "center", md: "end" }}
          spacing={3}
          flexShrink={0}
          bg="whiteAlpha.150"
          backdropFilter="blur(8px)"
          borderRadius="xl"
          p={4}
          minW={{ md: "200px" }}
        >
          <VStack spacing={0} align={{ base: "center", md: "end" }}>
            <Text fontSize="3xl" fontWeight="bold" lineHeight={1}>
              {completion}%
            </Text>
            <Text fontSize="xs" opacity={0.85}>
              Journey completion
            </Text>
          </VStack>
          <VStack spacing={1} align={{ base: "center", md: "end" }} fontSize="xs" opacity={0.9}>
            {profile.registeredAt && (
              <HStack spacing={2}>
                <FaCalendarAlt size={11} />
                <Text>Joined {formatAnalyticsDate(profile.registeredAt)}</Text>
              </HStack>
            )}
            {profile.lastActivityAt && (
              <HStack spacing={2}>
                <FaClock size={11} />
                <Text>Active {formatAnalyticsDate(profile.lastActivityAt)}</Text>
              </HStack>
            )}
          </VStack>
        </VStack>
      </Flex>
    </Box>
  );
}

export function User360StatsBar({ summary }) {
  const stats = [
    { label: "Services", value: summary.servicesUsed, suffix: "" },
    { label: "Activities", value: summary.totalActivities, suffix: "" },
    { label: "Completed", value: summary.completedActivities, suffix: "" },
    { label: "Top Service", value: summary.mostUsedServiceName ?? "—", suffix: "", isText: true },
  ];

  return (
    <Flex
      direction={{ base: "column", sm: "row" }}
      gap={0}
      borderBottomWidth="1px"
      borderColor="gray.200"
      bg="white"
      divider={<Box w={{ base: "100%", sm: "1px" }} h={{ base: "1px", sm: "auto" }} bg="gray.200" />}
    >
      {stats.map((stat) => (
        <Box key={stat.label} flex={1} py={4} px={5} textAlign="center">
          <Text fontSize="xs" color="gray.500" fontWeight="medium" textTransform="uppercase" letterSpacing="wide" mb={1}>
            {stat.label}
          </Text>
          <Text
            fontSize={stat.isText ? "sm" : "xl"}
            fontWeight="bold"
            color="brand.600"
            noOfLines={stat.isText ? 2 : 1}
          >
            {stat.isText ? stat.value : formatNumber(stat.value)}
            {stat.suffix}
          </Text>
        </Box>
      ))}
    </Flex>
  );
}
