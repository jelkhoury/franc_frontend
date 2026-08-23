import React from "react";
import {
  Box,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from "@chakra-ui/react";
import { formatAnalyticsDate } from "../../utils/analytics.utils";
import User360ServiceCard from "./User360ServiceCard";
import { SERVICE_KEYS } from "../../constants/serviceRegistry";

const SERVICE_KEY_BY_TYPE = {
  resume: SERVICE_KEYS.RESUME,
  coverLetter: SERVICE_KEYS.COVER_LETTER,
  chat: SERVICE_KEYS.CHAT,
  jobMatching: SERVICE_KEYS.JOB_MATCHING,
};

export default function GenericServiceUserSection({ title, data, type, serviceKey, isHighlighted }) {
  const key = serviceKey ?? SERVICE_KEY_BY_TYPE[type];
  const countKey =
    type === "resume" || type === "coverLetter" ? "uploads" :
    type === "chat" ? "sessions" : "searches";

  const recentKey =
    type === "chat" ? "recentSessions" :
    type === "resume" || type === "coverLetter" ? "recentUploads" :
    null;

  const listItems =
    type === "jobMatching" ? (data.items || []) :
    recentKey ? (data[recentKey] || []) :
    [];

  return (
    <User360ServiceCard serviceKey={key} title={title} isHighlighted={isHighlighted}>
      <Box mb={4} p={3} borderRadius="xl" bg="gray.50" textAlign="center">
        <Text fontSize="xs" color="gray.500">Total {countKey}</Text>
        <Text fontSize="2xl" fontWeight="bold" color="brand.600">
          {data[countKey] ?? 0}
          {type === "chat" && data.totalMessages != null && (
            <Text as="span" fontSize="sm" fontWeight="normal" color="gray.500">
              {" "}· {data.totalMessages} messages
            </Text>
          )}
        </Text>
      </Box>
      {listItems.length > 0 && (
        <TableContainer borderRadius="lg" borderWidth="1px" borderColor="gray.100">
          <Table size="sm">
            <Thead bg="gray.50">
              <Tr>
                {type === "resume" || type === "coverLetter" ? (
                  <><Th>File</Th><Th>Uploaded</Th></>
                ) : type === "chat" ? (
                  <><Th>Messages</Th><Th>Last message</Th></>
                ) : (
                  <><Th>Type</Th><Th>Major</Th><Th>Country</Th><Th>Results</Th><Th>Searched</Th></>
                )}
              </Tr>
            </Thead>
            <Tbody>
              {listItems.map((item) => (
                <Tr key={item.id}>
                  {type === "resume" || type === "coverLetter" ? (
                    <><Td fontSize="sm">{item.fileName}</Td><Td fontSize="sm">{formatAnalyticsDate(item.uploadedAt)}</Td></>
                  ) : type === "chat" ? (
                    <><Td fontSize="sm">{item.messageCount}</Td><Td fontSize="sm">{formatAnalyticsDate(item.lastMessageAt)}</Td></>
                  ) : (
                    <>
                      <Td fontSize="sm">{item.searchType || "—"}</Td>
                      <Td fontSize="sm">{item.major || item.queryText || "—"}</Td>
                      <Td fontSize="sm">{item.country || "—"}</Td>
                      <Td fontSize="sm">{item.resultsCount}</Td>
                      <Td fontSize="sm">{formatAnalyticsDate(item.searchedAt)}</Td>
                    </>
                  )}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}
    </User360ServiceCard>
  );
}
