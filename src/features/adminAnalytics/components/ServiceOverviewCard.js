import React from "react";
import { Box, Text, HStack, Badge, Progress, useColorModeValue } from "@chakra-ui/react";
import { formatPercent } from "../utils/analytics.utils";
import { getServiceByKey } from "../constants/serviceRegistry";

export default function ServiceOverviewCard({ item, onClick }) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.600");
  const service = getServiceByKey(item.serviceKey);
  const Icon = service?.icon;

  return (
    <Box
      p={4}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={border}
      bg={bg}
      cursor="pointer"
      transition="all 0.2s"
      onClick={() => onClick?.(item.serviceKey)}
      _hover={{ borderColor: "brand.500", shadow: "sm" }}
      h="100%"
    >
      <HStack spacing={3} mb={3}>
        {Icon && (
          <Box
            p={2}
            borderRadius="lg"
            bg={`${service?.color}15`}
            color={service?.color}
            fontSize="lg"
            lineHeight={0}
          >
            <Icon />
          </Box>
        )}
        <Box flex={1} minW={0}>
          <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
            {item.serviceName}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {item.uniqueUsers} users · {item.activities} activities
          </Text>
        </Box>
        <Badge colorScheme="blue" fontSize="xs">
          {formatPercent(item.activitySharePercent)}
        </Badge>
      </HStack>
      <Text fontSize="xs" color="gray.500" mb={1}>
        Completion rate
      </Text>
      <Progress
        value={item.completionRate}
        size="sm"
        colorScheme="brand"
        borderRadius="full"
        mb={1}
      />
      <Text fontSize="xs" color="gray.600">
        {item.completed} completed
      </Text>
    </Box>
  );
}
