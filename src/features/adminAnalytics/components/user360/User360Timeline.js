import React from "react";
import { Box, Text, HStack, VStack, Badge } from "@chakra-ui/react";
import { formatAnalyticsDate, statusColor, serviceColor } from "../../utils/analytics.utils";
import { getServiceByKey } from "../../constants/serviceRegistry";

export default function User360Timeline({ items }) {
  if (!items?.length) {
    return (
      <Box p={6} borderRadius="2xl" borderWidth="1px" borderColor="gray.200" bg="gray.50" textAlign="center">
        <Text color="gray.500" fontSize="sm">No recent activity recorded</Text>
      </Box>
    );
  }

  return (
    <Box p={6} borderRadius="2xl" borderWidth="1px" borderColor="gray.200" bg="white">
      <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={5}>
        Journey Timeline
      </Text>
      <Box position="relative" pl={6}>
        {/* Vertical line */}
        <Box
          position="absolute"
          left="11px"
          top="8px"
          bottom="8px"
          w="2px"
          bg="gray.200"
          borderRadius="full"
        />

        <VStack align="stretch" spacing={0}>
          {items.map((item, index) => {
            const service = getServiceByKey(item.serviceKey);
            const color = serviceColor(item.serviceKey);

            return (
              <HStack key={item.id} align="flex-start" spacing={4} pb={index < items.length - 1 ? 6 : 0} position="relative">
                {/* Node dot */}
                <Box
                  position="absolute"
                  left="-19px"
                  top="4px"
                  w="14px"
                  h="14px"
                  borderRadius="full"
                  bg={color}
                  border="3px solid white"
                  boxShadow={`0 0 0 2px ${color}`}
                  flexShrink={0}
                />

                <Box flex={1} minW={0}>
                  <HStack justify="space-between" align="start" flexWrap="wrap" gap={2} mb={1}>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                      {item.activityLabel}
                    </Text>
                    <Badge colorScheme={statusColor(item.status)} fontSize="2xs">
                      {item.status}
                    </Badge>
                  </HStack>
                  <HStack spacing={2} flexWrap="wrap" fontSize="xs" color="gray.500">
                    <Text>{service?.shortName ?? item.serviceName}</Text>
                    {item.result && (
                      <>
                        <Text>·</Text>
                        <Text fontWeight="medium" color="brand.600">{item.result}</Text>
                      </>
                    )}
                    <Text>·</Text>
                    <Text>{formatAnalyticsDate(item.occurredAt)}</Text>
                  </HStack>
                </Box>
              </HStack>
            );
          })}
        </VStack>
      </Box>
    </Box>
  );
}
