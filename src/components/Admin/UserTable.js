import React from "react";
import {
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  HStack,
  Button,
} from "@chakra-ui/react";

const UserTable = ({ users, onEdit, onDelete }) => {
  return (
    <TableContainer
      display={{ base: "none", md: "block" }}
      overflowX="auto"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
    >
      <Table variant="simple" size="md">
        <Thead bg="gray.50">
          <Tr>
            <Th>ID</Th>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Role</Th>
            <Th>Verified</Th>
            <Th>Can Do Mock</Th>
            <Th>Mock Attempts</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {users.map((user) => (
            <Tr key={user.id}>
              <Td>{user.id}</Td>
              <Td fontWeight="semibold">{user.fullName}</Td>
              <Td>{user.email}</Td>
              <Td>
                <Text
                  fontWeight="semibold"
                  color={user.role === "Admin" ? "blue.500" : "gray.600"}
                >
                  {user.role}
                </Text>
              </Td>
              <Td>
                <Text
                  color={user.isVerified ? "green.500" : "red.500"}
                  fontWeight="semibold"
                >
                  {user.isVerified ? "Yes" : "No"}
                </Text>
              </Td>
              <Td>
                <Text
                  color={user.canDoMockInterview ? "green.500" : "red.500"}
                  fontWeight="semibold"
                >
                  {user.canDoMockInterview ? "Yes" : "No"}
                </Text>
              </Td>
              <Td>{user.mockAttempts ?? "-"}</Td>
              <Td>
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={() => onEdit(user)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="red"
                    onClick={() => onDelete(user)}
                  >
                    Delete
                  </Button>
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

export default UserTable;

