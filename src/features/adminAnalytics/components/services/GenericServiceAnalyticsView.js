import React from "react";
import {
  Box,
  Heading,
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
import KpiCard, { KpiGrid } from "../KpiCard";
import { formatAnalyticsDate } from "../../utils/analytics.utils";

export default function GenericServiceAnalyticsView({ title, data, type }) {
  const border = useColorModeValue("gray.200", "gray.600");
  if (!data) return null;

  const kpis = {
    resume: [{ label: "Uploads", value: data.uploads }, { label: "Unique Users", value: data.uniqueUsers }],
    coverLetter: [{ label: "Uploads", value: data.uploads }, { label: "Unique Users", value: data.uniqueUsers }],
    chat: [
      { label: "Sessions", value: data.totalSessions },
      { label: "Unique Users", value: data.uniqueUsers },
      { label: "Total Messages", value: data.totalMessages },
      { label: "Avg. Messages/Session", value: data.averageMessagesPerSession?.toFixed?.(1), format: "text" },
    ],
    jobMatching: [
      { label: "Total Searches", value: data.totalSearches },
      { label: "Unique Users", value: data.uniqueUsers },
    ],
  };

  const recentKey =
    type === "chat" ? "recentSessions" :
    type === "jobMatching" ? "recentSearches" : "recentUploads";

  return (
    <Box>
      <KpiGrid>
        {(kpis[type] || []).map((k) => (
          <KpiCard
            key={k.label}
            label={k.label}
            value={k.value ?? "—"}
            format={k.format || (k.value == null ? "text" : "number")}
          />
        ))}
      </KpiGrid>

      {type === "jobMatching" && data.topMajors && (
        <Box p={4} borderRadius="xl" borderWidth="1px" borderColor={border} mb={6}>
          <Heading size="sm" mb={3}>Top Majors</Heading>
          <TableContainer>
            <Table size="sm">
              <Thead><Tr><Th>Major</Th><Th isNumeric>Searches</Th></Tr></Thead>
              <Tbody>
                {data.topMajors.map((m) => (
                  <Tr key={m.major}><Td fontSize="sm">{m.major}</Td><Td isNumeric fontSize="sm">{m.count}</Td></Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {type === "jobMatching" && data.topCountries && (
        <Box p={4} borderRadius="xl" borderWidth="1px" borderColor={border} mb={6}>
          <Heading size="sm" mb={3}>Top Countries</Heading>
          <TableContainer>
            <Table size="sm">
              <Thead><Tr><Th>Country</Th><Th isNumeric>Searches</Th></Tr></Thead>
              <Tbody>
                {data.topCountries.map((c) => (
                  <Tr key={c.country}><Td fontSize="sm">{c.country}</Td><Td isNumeric fontSize="sm">{c.count}</Td></Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {data[recentKey]?.length > 0 && (
        <Box p={4} borderRadius="xl" borderWidth="1px" borderColor={border}>
          <Heading size="sm" mb={4}>Recent Activity</Heading>
          <TableContainer>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>User</Th>
                  {type === "resume" || type === "coverLetter" ? (
                    <><Th>File</Th><Th>Date</Th></>
                  ) : type === "chat" ? (
                    <><Th>Messages</Th><Th>Last message</Th></>
                  ) : (
                    <><Th>Major</Th><Th>Country</Th><Th>Results</Th><Th>Date</Th></>
                  )}
                </Tr>
              </Thead>
              <Tbody>
                {data[recentKey].map((row) => (
                  <Tr key={row.id}>
                    <Td><Text fontSize="sm" fontWeight="medium">{row.userName}</Text><Text fontSize="xs" color="gray.500">{row.email}</Text></Td>
                    {type === "resume" || type === "coverLetter" ? (
                      <><Td fontSize="sm">{row.fileName}</Td><Td fontSize="sm">{formatAnalyticsDate(row.uploadedAt)}</Td></>
                    ) : type === "chat" ? (
                      <><Td fontSize="sm">{row.messageCount}</Td><Td fontSize="sm">{formatAnalyticsDate(row.lastMessageAt)}</Td></>
                    ) : (
                      <><Td fontSize="sm">{row.major}</Td><Td fontSize="sm">{row.country}</Td><Td fontSize="sm">{row.resultsCount}</Td><Td fontSize="sm">{formatAnalyticsDate(row.searchedAt)}</Td></>
                    )}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}
