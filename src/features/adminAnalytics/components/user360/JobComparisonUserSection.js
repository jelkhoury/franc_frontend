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

export default function JobComparisonUserSection({ data, serviceKey = SERVICE_KEYS.JOB_COMPARISON, isHighlighted }) {
  return (
    <User360ServiceCard serviceKey={serviceKey} isHighlighted={isHighlighted}>
      <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3} mb={4}>
        <StatPill label="Comparisons" value={data.comparisons} />
        <StatPill label="Completed" value={data.completed} />
      </SimpleGrid>
      {data.items?.length > 0 && (
        <TableContainer borderRadius="lg" borderWidth="1px" borderColor="gray.100">
          <Table size="sm">
            <Thead bg="gray.50">
              <Tr><Th>Job A</Th><Th>Job B</Th><Th>Score A</Th><Th>Score B</Th><Th>Winner</Th><Th>Status</Th><Th>Date</Th></Tr>
            </Thead>
            <Tbody>
              {data.items.map((item) => (
                <Tr key={item.id}>
                  <Td fontSize="sm">{item.jobAName}</Td>
                  <Td fontSize="sm">{item.jobBName}</Td>
                  <Td fontSize="sm">{item.scoreA ?? "—"}</Td>
                  <Td fontSize="sm">{item.scoreB ?? "—"}</Td>
                  <Td fontSize="sm">{item.winner === "A" ? item.jobAName : item.winner === "B" ? item.jobBName : "Tie"}</Td>
                  <Td><Badge colorScheme={statusColor(item.status)} fontSize="xs">{item.status}</Badge></Td>
                  <Td fontSize="sm">{formatAnalyticsDate(item.createdAt)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}
    </User360ServiceCard>
  );
}
