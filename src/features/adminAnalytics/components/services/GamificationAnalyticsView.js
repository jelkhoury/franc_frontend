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
  LineChart,
  Line,
} from "recharts";
import KpiCard, { KpiGrid } from "../KpiCard";
import ChartContainer from "../ChartContainer";
import { formatPercent } from "../../utils/analytics.utils";

export default function GamificationAnalyticsView({ data }) {
  const border = useColorModeValue("gray.200", "gray.600");
  if (!data) return null;

  return (
    <Box>
      <KpiGrid>
        <KpiCard label="Total Players" value={data.totalPlayers} />
        <KpiCard label="Game Sessions" value={data.gameSessions} />
        <KpiCard label="Questions Answered" value={data.questionsAnswered} />
        <KpiCard label="Accuracy Rate" value={data.accuracyRate} format="percent" />
        <KpiCard label="Average Score" value={data.averageScore?.toFixed?.(1)} format="text" />
        <KpiCard label="Timeouts" value={data.timeoutCount} />
      </KpiGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
        <Box p={4} borderRadius="xl" borderWidth="1px" borderColor={border}>
          <Heading size="sm" mb={4}>Level Drop-off</Heading>
          <ChartContainer height={260}>
            <ResponsiveContainer width="100%" height={260} debounce={100}>
              <LineChart data={data.levelProgression}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="levelName" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v, name) => {
                    if (name === "dropOffRate") return [`${v}%`, "Drop-off rate"];
                    return [v, name === "started" ? "Started" : "Completed"];
                  }}
                />
                <Line type="monotone" dataKey="started" stroke="#3E79BD" strokeWidth={2} name="Started" />
                <Line type="monotone" dataKey="completed" stroke="#38A169" strokeWidth={2} name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Box>

        <Box p={4} borderRadius="xl" borderWidth="1px" borderColor={border}>
          <Heading size="sm" mb={4}>Ability Usage</Heading>
          <ChartContainer height={260}>
            <ResponsiveContainer width="100%" height={260} debounce={100}>
              <BarChart data={data.abilityUsage}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="ability" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} uses`, "Usage"]} />
                <Bar dataKey="usageCount" fill="#38A169" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Box>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
        <Box p={4} borderRadius="xl" borderWidth="1px" borderColor={border}>
          <Heading size="sm" mb={4}>Hardest Questions</Heading>
          <TableContainer>
            <Table size="sm">
              <Thead><Tr><Th>Question</Th><Th isNumeric>Incorrect Rate</Th><Th isNumeric>Answered</Th></Tr></Thead>
              <Tbody>
                {data.hardestQuestions.map((q) => (
                  <Tr key={q.questionId}>
                    <Td fontSize="sm" maxW="200px" noOfLines={2}>{q.questionText}</Td>
                    <Td isNumeric fontSize="sm">{formatPercent(q.incorrectRate)}</Td>
                    <Td isNumeric fontSize="sm">{q.timesAnswered}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>

        <Box p={4} borderRadius="xl" borderWidth="1px" borderColor={border}>
          <Heading size="sm" mb={4}>Easiest Questions</Heading>
          <TableContainer>
            <Table size="sm">
              <Thead><Tr><Th>Question</Th><Th isNumeric>Correct Rate</Th><Th isNumeric>Answered</Th></Tr></Thead>
              <Tbody>
                {data.easiestQuestions.map((q) => (
                  <Tr key={q.questionId}>
                    <Td fontSize="sm" maxW="200px" noOfLines={2}>{q.questionText}</Td>
                    <Td isNumeric fontSize="sm">{formatPercent(q.correctRate)}</Td>
                    <Td isNumeric fontSize="sm">{q.timesAnswered}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      </SimpleGrid>

      <Box p={4} borderRadius="xl" borderWidth="1px" borderColor={border}>
        <Heading size="sm" mb={4}>Level Progression Detail</Heading>
        <TableContainer>
          <Table size="sm">
            <Thead><Tr><Th>Level</Th><Th isNumeric>Started</Th><Th isNumeric>Completed</Th><Th isNumeric>Drop-off</Th></Tr></Thead>
            <Tbody>
              {data.levelProgression.map((l) => (
                <Tr key={l.levelNumber}>
                  <Td fontSize="sm">{l.levelNumber}. {l.levelName}</Td>
                  <Td isNumeric fontSize="sm">{l.started}</Td>
                  <Td isNumeric fontSize="sm">{l.completed}</Td>
                  <Td isNumeric fontSize="sm">{formatPercent(l.dropOffRate)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
