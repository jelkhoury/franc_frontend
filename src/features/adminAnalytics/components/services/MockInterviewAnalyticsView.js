import React from "react";
import {
  Box,
  Heading,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import KpiCard, { KpiGrid } from "../KpiCard";
import ChartContainer from "../ChartContainer";
import { formatAnalyticsDate, statusColor } from "../../utils/analytics.utils";

export default function MockInterviewAnalyticsView({ data }) {
  const border = useColorModeValue("gray.200", "gray.600");

  if (!data) return null;

  return (
    <Box>
      <KpiGrid>
        <KpiCard label="Started" value={data.started} />
        <KpiCard label="Completed" value={data.completed} />
        <KpiCard label="Evaluated" value={data.evaluated} />
        <KpiCard label="Reports Generated" value={data.reportsGenerated} />
        <KpiCard label="Unique Users" value={data.uniqueUsers} />
        <KpiCard label="Avg. Overall Rating" value={data.averageOverallRating?.toFixed?.(1)} format="text" />
      </KpiGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
        <Box p={4} borderRadius="xl" borderWidth="1px" borderColor={border}>
          <Heading size="sm" mb={4}>Evaluation Distribution</Heading>
          <ChartContainer height={240}>
            <ResponsiveContainer width="100%" height={240} debounce={100}>
              <BarChart data={data.evaluationDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} interviews`, "Count"]} />
                <Bar dataKey="count" fill="#3E79BD" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Box>

        <Box p={4} borderRadius="xl" borderWidth="1px" borderColor={border}>
          <Heading size="sm" mb={4}>Attempts Distribution</Heading>
          <ChartContainer height={240}>
            <ResponsiveContainer width="100%" height={240} debounce={100}>
              <BarChart data={data.attemptDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} users`, "Count"]} />
                <Bar dataKey="count" fill="#805AD5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Box>
      </SimpleGrid>

      <Box p={4} borderRadius="xl" borderWidth="1px" borderColor={border} mb={8}>
        <Heading size="sm" mb={4}>Question Performance</Heading>
        <TableContainer>
          <Table size="sm">
            <Thead><Tr><Th>Question</Th><Th isNumeric>Avg. Rating</Th><Th isNumeric>Answers</Th></Tr></Thead>
            <Tbody>
              {data.questionPerformance.map((q) => (
                <Tr key={q.questionId}>
                  <Td fontSize="sm">{q.questionTitle}</Td>
                  <Td isNumeric fontSize="sm">{q.averageRating.toFixed(1)}</Td>
                  <Td isNumeric fontSize="sm">{q.answerCount}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>

      <Box p={4} borderRadius="xl" borderWidth="1px" borderColor={border}>
        <Heading size="sm" mb={4}>Recent Interviews</Heading>
        <TableContainer>
          <Table size="sm">
            <Thead><Tr><Th>User</Th><Th>Major</Th><Th>Status</Th><Th>Rating</Th><Th>Report</Th><Th>Submitted</Th></Tr></Thead>
            <Tbody>
              {data.recentInterviews.map((row) => (
                <Tr key={row.id}>
                  <Td><Text fontSize="sm" fontWeight="medium">{row.userName}</Text><Text fontSize="xs" color="gray.500">{row.email}</Text></Td>
                  <Td fontSize="sm">{row.major}</Td>
                  <Td><Badge colorScheme={statusColor(row.status)} fontSize="xs">{row.status}</Badge></Td>
                  <Td fontSize="sm">{row.overallRating ?? "—"}</Td>
                  <Td fontSize="sm">{row.reportGenerated ? "Yes" : "No"}</Td>
                  <Td fontSize="sm">{formatAnalyticsDate(row.submittedAt)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
