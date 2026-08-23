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
  Legend,
} from "recharts";
import KpiCard, { KpiGrid } from "../KpiCard";
import ChartContainer from "../ChartContainer";
import { formatAnalyticsDate, statusColor } from "../../utils/analytics.utils";

export default function JobComparisonAnalyticsView({ data }) {
  const border = useColorModeValue("gray.200", "gray.600");
  if (!data) return null;

  const headHeartChart = data.headVsHeart.map((h) => ({
    category: h.category,
    "Job A wins": h.jobAWins,
    "Job B wins": h.jobBWins,
    Ties: h.ties,
  }));

  return (
    <Box>
      <KpiGrid>
        <KpiCard label="Total Comparisons" value={data.totalComparisons} />
        <KpiCard label="Completed" value={data.completedComparisons} />
        <KpiCard label="Drafts" value={data.draftComparisons} />
        <KpiCard label="Unique Users" value={data.uniqueUsers} />
        <KpiCard label="Completion Rate" value={data.completionRate} format="percent" />
      </KpiGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
        <Box p={4} borderRadius="xl" borderWidth="1px" borderColor={border}>
          <Heading size="sm" mb={4}>Most Compared Jobs</Heading>
          <TableContainer>
            <Table size="sm">
              <Thead><Tr><Th>Job</Th><Th isNumeric>Count</Th></Tr></Thead>
              <Tbody>
                {data.mostComparedJobs.map((j) => (
                  <Tr key={j.jobName}><Td fontSize="sm">{j.jobName}</Td><Td isNumeric fontSize="sm">{j.count}</Td></Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>

        <Box p={4} borderRadius="xl" borderWidth="1px" borderColor={border}>
          <Heading size="sm" mb={4}>Top Job Pairs</Heading>
          <TableContainer>
            <Table size="sm">
              <Thead><Tr><Th>Job A</Th><Th>Job B</Th><Th isNumeric>Count</Th></Tr></Thead>
              <Tbody>
                {data.topJobPairs.map((p, i) => (
                  <Tr key={i}>
                    <Td fontSize="sm">{p.jobA}</Td>
                    <Td fontSize="sm">{p.jobB}</Td>
                    <Td isNumeric fontSize="sm">{p.count}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
        <Box p={4} borderRadius="xl" borderWidth="1px" borderColor={border}>
          <Heading size="sm" mb={4}>Winner Distribution</Heading>
          <ChartContainer height={220}>
            <ResponsiveContainer width="100%" height={220} debounce={100}>
              <BarChart data={data.winnerDistribution.map((w) => ({ label: w.winner === "A" ? "Job A" : w.winner === "B" ? "Job B" : "Tie", count: w.count }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(v) => [`${v} comparisons`, "Count"]} />
                <Bar dataKey="count" fill="#DD6B20" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Box>

        <Box p={4} borderRadius="xl" borderWidth="1px" borderColor={border}>
          <Heading size="sm" mb={4}>HEAD vs HEART Results</Heading>
          <ChartContainer height={220}>
            <ResponsiveContainer width="100%" height={220} debounce={100}>
              <BarChart data={headHeartChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Job A wins" fill="#3E79BD" stackId="a" />
                <Bar dataKey="Job B wins" fill="#E53E3E" stackId="a" />
                <Bar dataKey="Ties" fill="#718096" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Box>
      </SimpleGrid>

      <Box p={4} borderRadius="xl" borderWidth="1px" borderColor={border}>
        <Heading size="sm" mb={4}>Recent Comparisons</Heading>
        <TableContainer>
          <Table size="sm">
            <Thead>
              <Tr><Th>User</Th><Th>Job A</Th><Th>Job B</Th><Th>Score A</Th><Th>Score B</Th><Th>Winner</Th><Th>Status</Th><Th>Date</Th></Tr>
            </Thead>
            <Tbody>
              {data.recentComparisons.map((row) => (
                <Tr key={row.id}>
                  <Td><Text fontSize="sm" fontWeight="medium">{row.userName}</Text><Text fontSize="xs" color="gray.500">{row.email}</Text></Td>
                  <Td fontSize="sm">{row.jobAName}</Td>
                  <Td fontSize="sm">{row.jobBName}</Td>
                  <Td fontSize="sm">{row.scoreA ?? "—"}</Td>
                  <Td fontSize="sm">{row.scoreB ?? "—"}</Td>
                  <Td fontSize="sm">{row.winner === "A" ? "Job A" : row.winner === "B" ? "Job B" : "Tie"}</Td>
                  <Td><Badge colorScheme={statusColor(row.status)} fontSize="xs">{row.status}</Badge></Td>
                  <Td fontSize="sm">{formatAnalyticsDate(row.createdAt)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
