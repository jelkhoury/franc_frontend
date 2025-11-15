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
  Badge,
  SimpleGrid,
  Card,
  CardBody,
  VStack,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";

const testResults = [
  {
    id: 1,
    userName: "John Doe",
    score: 85,
    status: "Passed",
  },
  {
    id: 2,
    userName: "Jane Smith",
    score: 65,
    status: "Failed",
  },
  {
    id: 3,
    userName: "Mike Johnson",
    score: 92,
    status: "Passed",
  },
];

const ManageSelfTests = () => {
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Box>
      <Heading color="brand.500" size="lg" mb={6}>
        Self-Directed Test Results
      </Heading>

      {/* Desktop Table View */}
      <TableContainer
        display={{ base: "none", md: "block" }}
        overflowX="auto"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="md"
      >
        <Table variant="striped" colorScheme="gray">
          <Thead bg="gray.50">
            <Tr>
              <Th>User</Th>
              <Th>Score</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {testResults.map((result) => (
              <Tr key={result.id}>
                <Td>{result.userName}</Td>
                <Td>{result.score}</Td>
                <Td>
                  <Badge
                    colorScheme={result.status === "Passed" ? "green" : "red"}
                  >
                    {result.status}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>

      {/* Mobile Card View */}
      <SimpleGrid
        columns={{ base: 1, sm: 1 }}
        spacing={4}
        display={{ base: "grid", md: "none" }}
      >
        {testResults.map((result) => (
          <Card key={result.id} variant="outline">
            <CardBody>
              <VStack align="stretch" spacing={3}>
                <Box>
                  <Text fontSize="xs" color="gray.500">
                    User
                  </Text>
                  <Text fontWeight="semibold">{result.userName}</Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500">
                    Score
                  </Text>
                  <Text fontWeight="semibold" fontSize="lg">
                    {result.score}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500">
                    Status
                  </Text>
                  <Badge
                    colorScheme={result.status === "Passed" ? "green" : "red"}
                    fontSize="sm"
                  >
                    {result.status}
                  </Badge>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default ManageSelfTests;
