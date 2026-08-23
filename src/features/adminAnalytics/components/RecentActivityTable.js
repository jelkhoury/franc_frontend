import React from "react";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Text,
  Avatar,
  HStack,
  Box,
  useColorModeValue,
} from "@chakra-ui/react";
import { formatAnalyticsDate, statusColor, serviceColor } from "../utils/analytics.utils";
import AnalyticsEmptyState from "./AnalyticsStates";

export default function RecentActivityTable({ items, onUserClick }) {
  const border = useColorModeValue("gray.200", "gray.600");

  if (!items?.length) {
    return (
      <AnalyticsEmptyState
        title="No recent activity"
        description="Activity will appear here as users interact with Franc services."
      />
    );
  }

  return (
    <TableContainer borderWidth="1px" borderColor={border} borderRadius="xl" overflow="hidden">
      <Table size="sm" variant="simple">
        <Thead bg="gray.50">
          <Tr>
            <Th>User</Th>
            <Th>Activity</Th>
            <Th>Service</Th>
            <Th>Result</Th>
            <Th>Status</Th>
            <Th>Date</Th>
          </Tr>
        </Thead>
        <Tbody>
          {items.map((row) => (
            <Tr key={row.id} _hover={{ bg: "gray.50" }}>
              <Td>
                <HStack
                  spacing={2}
                  cursor={onUserClick ? "pointer" : "default"}
                  onClick={() => onUserClick?.(row.userId)}
                >
                  <Avatar size="xs" name={row.userName} bg="brand.500" color="white" />
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                      {row.userName}
                    </Text>
                    <Text fontSize="xs" color="gray.500" noOfLines={1}>
                      {row.userEmail}
                    </Text>
                  </Box>
                </HStack>
              </Td>
              <Td fontSize="sm">{row.activityLabel}</Td>
              <Td>
                <HStack spacing={2}>
                  <Box w={2} h={2} borderRadius="full" bg={serviceColor(row.serviceKey)} flexShrink={0} />
                  <Text fontSize="sm">{row.serviceName}</Text>
                </HStack>
              </Td>
              <Td fontSize="sm" color="gray.600">
                {row.result ?? "—"}
              </Td>
              <Td>
                <Badge colorScheme={statusColor(row.status)} fontSize="xs">
                  {row.status}
                </Badge>
              </Td>
              <Td fontSize="sm" color="gray.600" whiteSpace="nowrap">
                {formatAnalyticsDate(row.occurredAt)}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}
