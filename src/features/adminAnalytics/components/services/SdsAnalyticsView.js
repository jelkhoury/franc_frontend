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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import KpiCard, { KpiGrid } from "../KpiCard";
import ChartContainer from "../ChartContainer";
import { formatAnalyticsDate, formatPercent } from "../../utils/analytics.utils";

const COLORS = ["#3E79BD", "#805AD5", "#38A169", "#DD6B20", "#E53E3E", "#718096"];

export default function SdsAnalyticsView({ data }) {
  const border = useColorModeValue("gray.200", "gray.600");
  if (!data) return null;

  return (
    <Box>
      <KpiGrid>
        <KpiCard label="Started" value={data.started} />
        <KpiCard label="Completed" value={data.completed} />
        <KpiCard label="Drafts / Incomplete" value={data.drafts} />
        <KpiCard label="Completion Rate" value={data.completionRate} format="percent" />
        <KpiCard label="Unique Users" value={data.uniqueUsers} />
        <KpiCard label="Most Common Result" value={data.mostCommonHollandCode ?? "—"} format="text" />
      </KpiGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
        <Box p={4} borderRadius="xl" borderWidth="1px" borderColor={border}>
          <Heading size="sm" mb={4}>Holland Code Distribution</Heading>
          <ChartContainer height={260}>
            <ResponsiveContainer width="100%" height={260} debounce={100}>
              <PieChart>
                <Pie
                  data={data.resultDistribution}
                  dataKey="count"
                  nameKey="hollandCode"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ hollandCode, percent }) => `${hollandCode} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.resultDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, name, props) => [`${v} completions`, props.payload.hollandCode]} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Box>

        <Box p={4} borderRadius="xl" borderWidth="1px" borderColor={border}>
          <Heading size="sm" mb={4}>Attempt Distribution</Heading>
          <ChartContainer height={260}>
            <ResponsiveContainer width="100%" height={260} debounce={100}>
              <BarChart data={data.attemptDistribution.map((a) => ({ label: `Attempt ${a.attemptNumber}`, count: a.count }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} completions`, "Count"]} />
                <Bar dataKey="count" fill="#805AD5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Box>
      </SimpleGrid>

      <Box p={4} borderRadius="xl" borderWidth="1px" borderColor={border}>
        <Heading size="sm" mb={4}>Recent Completions</Heading>
        <TableContainer>
          <Table size="sm">
            <Thead><Tr><Th>User</Th><Th>Holland Code</Th><Th>Attempt</Th><Th>Completed</Th></Tr></Thead>
            <Tbody>
              {data.recentCompletions.map((row) => (
                <Tr key={row.id}>
                  <Td><Text fontSize="sm" fontWeight="medium">{row.userName}</Text><Text fontSize="xs" color="gray.500">{row.email}</Text></Td>
                  <Td><Badge colorScheme="purple">{row.hollandCode}</Badge></Td>
                  <Td fontSize="sm">{row.attemptNumber}</Td>
                  <Td fontSize="sm">{formatAnalyticsDate(row.completedAt)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
