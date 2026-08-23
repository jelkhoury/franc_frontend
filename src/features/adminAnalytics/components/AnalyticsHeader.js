import React from "react";
import { Box, Heading, Text, VStack } from "@chakra-ui/react";

export default function AnalyticsHeader({ title, subtitle, actions }) {
  return (
    <Box mb={8}>
      <Box display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="flex-start" gap={4}>
        <VStack align="start" spacing={1}>
          <Heading size="lg" color="brand.500" fontWeight="semibold">
            {title}
          </Heading>
          {subtitle && (
            <Text color="gray.600" fontSize="md" maxW="2xl">
              {subtitle}
            </Text>
          )}
        </VStack>
        {actions && <Box flexShrink={0}>{actions}</Box>}
      </Box>
    </Box>
  );
}
