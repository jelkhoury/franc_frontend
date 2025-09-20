

import React from 'react';
import {
  Box,
  Button,
  Input,
  FormControl,
  FormLabel,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from '@chakra-ui/react';

const ManageUsers = () => {
  return (
    <>
      <VStack spacing={4} align="stretch" mb={8}>
        <FormControl>
          <FormLabel>Search Users</FormLabel>
          <Input placeholder="Enter username or email" />
        </FormControl>
        <Button colorScheme="blue">Search</Button>
      </VStack>

      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td>1</Td>
              <Td>John Doe</Td>
              <Td>john.doe@example.com</Td>
              <Td>Admin</Td>
              <Td>
                <Button size="sm" colorScheme="blue" mr={2}>Edit</Button>
                <Button size="sm" colorScheme="red">Delete</Button>
              </Td>
            </Tr>
            <Tr>
              <Td>2</Td>
              <Td>Jane Smith</Td>
              <Td>jane.smith@example.com</Td>
              <Td>User</Td>
              <Td>
                <Button size="sm" colorScheme="blue" mr={2}>Edit</Button>
                <Button size="sm" colorScheme="red">Delete</Button>
              </Td>
            </Tr>
          </Tbody>
        </Table>
      </TableContainer>
    </>
  );
};

export default ManageUsers;