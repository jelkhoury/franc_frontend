import React, { useMemo } from "react";
import {
  Box,
  VStack,
  Heading,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
} from "@chakra-ui/react";

const LetterBadge = ({ ch }) => (
  <Badge
    fontSize="lg"
    px={3}
    py={1}
    rounded="full"
    colorScheme={
      { R: "teal", I: "purple", A: "pink", S: "green", E: "orange", C: "blue" }[
        ch
      ] || "gray"
    }
  >
    {ch}
  </Badge>
);

const RIASECScoringTable = ({ hollandPoints, loading, error }) => {
  const sections = [
    "Activities",
    "Competencies",
    "Occupations",
    "Self-Estimates Part 1",
    "Self-Estimates Part 2",
    "Summary scores",
  ];
  const letters = ["R", "I", "A", "S", "E", "C"];

  // Process Holland points from API
  const scores = useMemo(() => {
    if (!hollandPoints) return null;

    // Transform API data to match our table structure
    const scoreData = {
      Activities: hollandPoints.Activities || {
        R: 0,
        I: 0,
        A: 0,
        S: 0,
        E: 0,
        C: 0,
      },
      Competencies: hollandPoints.Competencies || {
        R: 0,
        I: 0,
        A: 0,
        S: 0,
        E: 0,
        C: 0,
      },
      Occupations: hollandPoints.Occupations || {
        R: 0,
        I: 0,
        A: 0,
        S: 0,
        E: 0,
        C: 0,
      },
      "Self-Estimates Part 1": hollandPoints["Self-Estimates"] || {
        R: 0,
        I: 0,
        A: 0,
        S: 0,
        E: 0,
        C: 0,
      },
      "Self-Estimates Part 2": { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
      "Summary scores": { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
    };

    // Calculate summary scores
    Object.keys(scoreData["Summary scores"]).forEach((letter) => {
      scoreData["Summary scores"][letter] =
        scoreData["Activities"][letter] +
        scoreData["Competencies"][letter] +
        scoreData["Occupations"][letter] +
        scoreData["Self-Estimates Part 1"][letter] +
        scoreData["Self-Estimates Part 2"][letter];
    });

    return scoreData;
  }, [hollandPoints]);

  return (
    <Box
      bg="white"
      rounded="xl"
      p={{ base: 5, md: 6 }}
      boxShadow="sm"
      border="1px solid"
      borderColor="gray.200"
      mb={6}
    >
      <VStack align="stretch" spacing={4}>
        <Heading color="brand.500" size="md" textAlign="center">
          RIASEC Scoring Summary
        </Heading>
        <Text fontSize="sm" color="gray.600" textAlign="center">
          Scores across different assessment sections
        </Text>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {loading && !error && (
          <VStack py={8}>
            <Spinner />
            <Text>Loading scoring data…</Text>
          </VStack>
        )}

        {!loading && !error && scores && (
          <TableContainer>
            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th>Section</Th>
                  {letters.map((letter) => (
                    <Th key={letter} textAlign="center">
                      <LetterBadge ch={letter} />
                    </Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {sections.map((section) => (
                  <Tr key={section}>
                    <Td
                      fontWeight={
                        section === "Summary scores" ? "bold" : "normal"
                      }
                    >
                      {section}
                    </Td>
                    {letters.map((letter) => (
                      <Td key={letter} textAlign="center">
                        <Box
                          bg={
                            section === "Summary scores"
                              ? `${
                                  letter === "R"
                                    ? "teal"
                                    : letter === "I"
                                    ? "purple"
                                    : letter === "A"
                                    ? "pink"
                                    : letter === "S"
                                    ? "green"
                                    : letter === "E"
                                    ? "orange"
                                    : "blue"
                                }.100`
                              : "gray.50"
                          }
                          p={2}
                          rounded="md"
                          fontWeight={
                            section === "Summary scores" ? "bold" : "normal"
                          }
                          color={
                            section === "Summary scores"
                              ? `${
                                  letter === "R"
                                    ? "teal"
                                    : letter === "I"
                                    ? "purple"
                                    : letter === "A"
                                    ? "pink"
                                    : letter === "S"
                                    ? "green"
                                    : letter === "E"
                                    ? "orange"
                                    : "blue"
                                }.700`
                              : "gray.700"
                          }
                        >
                          {scores[section]?.[letter] || 0}
                        </Box>
                      </Td>
                    ))}
                  </Tr>
                ))}
              </Tbody>
            </Table>

            <Text fontSize="xs" color="gray.500" textAlign="center" mt={2}>
              (Add the five R scores, the five I scores, the five A scores,
              etc.)
            </Text>
          </TableContainer>
        )}
      </VStack>
    </Box>
  );
};

export default RIASECScoringTable;

