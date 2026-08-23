import React from "react";
import { Box, Center, Spinner, Text, VStack } from "@chakra-ui/react";

export default function AnalyticsEmptyState({ title = "No data", description, icon }) {
  return (
    <Center py={12} px={4}>
      <VStack spacing={3}>
        {icon && (
          <Box color="gray.300" fontSize="3xl">
            {icon}
          </Box>
        )}
        <Text fontWeight="semibold" color="gray.600">
          {title}
        </Text>
        {description && (
          <Text color="gray.500" fontSize="sm" textAlign="center" maxW="md">
            {description}
          </Text>
        )}
      </VStack>
    </Center>
  );
}

export function AnalyticsErrorState({ message, onRetry }) {
  return (
    <Center py={12} px={4}>
      <VStack spacing={4}>
        <Text color="red.500" fontWeight="medium">
          {message || "Something went wrong"}
        </Text>
        {onRetry && (
          <Box as="button" color="brand.500" fontSize="sm" onClick={onRetry}>
            Try again
          </Box>
        )}
      </VStack>
    </Center>
  );
}

export function AnalyticsPageLoader({ label = "Loading analytics..." }) {
  return (
    <Center py={20} flexDirection="column" gap={4}>
      <Spinner size="xl" color="brand.500" thickness="3px" />
      <Text color="gray.500" fontSize="sm">
        {label}
      </Text>
    </Center>
  );
}

export function AnalyticsLoadingGrid({ count = 6 }) {
  return (
    <Box position="relative">
      <Box
        display="grid"
        gridTemplateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
        gap={4}
        opacity={0.45}
      >
        {Array.from({ length: count }).map((_, i) => (
          <Box key={i} h="100px" borderRadius="xl" bg="gray.100" />
        ))}
      </Box>
      <Center position="absolute" inset={0}>
        <Spinner size="lg" color="brand.500" thickness="3px" />
      </Center>
    </Box>
  );
}
