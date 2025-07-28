

import React from 'react';
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
  Badge
} from '@chakra-ui/react';

const testResults = [
  {
    id: 1,
    userName: 'John Doe',
    score: 85,
    status: 'Passed'
  },
  {
    id: 2,
    userName: 'Jane Smith',
    score: 65,
    status: 'Failed'
  },
  {
    id: 3,
    userName: 'Mike Johnson',
    score: 92,
    status: 'Passed'
  }
];

const ManageSelfTests = () => {
  return (
    <Box>
      <Heading size="md" mb={4}>Self-Directed Test Results</Heading>
      <TableContainer>
        <Table variant="striped" colorScheme="gray">
          <Thead>
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
                  <Badge colorScheme={result.status === 'Passed' ? 'green' : 'red'}>
                    {result.status}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ManageSelfTests;