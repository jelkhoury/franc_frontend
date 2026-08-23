import React from "react";
import {
  Box,
  SimpleGrid,
  Text,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from "@chakra-ui/react";
import { formatAnalyticsDate, statusColor } from "../../utils/analytics.utils";
import User360ServiceCard from "./User360ServiceCard";
import { SERVICE_KEYS } from "../../constants/serviceRegistry";

function StatPill({ label, value }) {
  return (
    <Box textAlign="center" p={3} borderRadius="xl" bg="gray.50">
      <Text fontSize="xs" color="gray.500" mb={1}>{label}</Text>
      <Text fontWeight="bold" color="gray.800">{value}</Text>
    </Box>
  );
}

export default function MockInterviewUserSection({ data, serviceKey = SERVICE_KEYS.MOCK_INTERVIEW, isHighlighted }) {
  return (
    <User360ServiceCard serviceKey={serviceKey} isHighlighted={isHighlighted}>
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={4}>
        <StatPill label="Interviews" value={data.interviews} />
        <StatPill label="Attempts" value={data.attempts} />
        <StatPill label="Evaluated" value={data.evaluated} />
        <StatPill label="Avg. Rating" value={data.averageRating?.toFixed?.(1) ?? "—"} />
      </SimpleGrid>
      {data.items?.length > 0 && (
        <TableContainer borderRadius="lg" borderWidth="1px" borderColor="gray.100">
          <Table size="sm">
            <Thead bg="gray.50">
              <Tr><Th>Major</Th><Th>Status</Th><Th>Rating</Th><Th>Report</Th><Th>Submitted</Th></Tr>
            </Thead>
            <Tbody>
              {data.items.map((item) => (
                <Tr key={item.id}>
                  <Td fontSize="sm">{item.major}</Td>
                  <Td><Badge colorScheme={statusColor(item.status)} fontSize="xs">{item.status}</Badge></Td>
                  <Td fontSize="sm">{item.overallRating ?? "—"}</Td>
                  <Td fontSize="sm">{item.reportGenerated ? "Yes" : "No"}</Td>
                  <Td fontSize="sm">{formatAnalyticsDate(item.submittedAt)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}
    </User360ServiceCard>
  );
}
