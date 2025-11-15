import React from "react";
import {
  Box,
  Button,
  Input,
  FormControl,
  FormLabel,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Heading,
  SimpleGrid,
  Card,
  CardBody,
  useBreakpointValue,
  Text,
} from "@chakra-ui/react";

const ManageUsers = () => {
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Sample data
  const users = [
    { id: 1, name: "John Doe", email: "john.doe@example.com", role: "Admin" },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane.smith@example.com",
      role: "User",
    },
  ];

  return (
    <Box>
      <Heading color="brand.500" size="lg" mb={6}>
        Manage Users
      </Heading>

      <VStack spacing={4} align="stretch" mb={8}>
        <FormControl>
          <FormLabel>Search Users</FormLabel>
          <HStack spacing={2}>
            <Input placeholder="Enter username or email" />
            <Button colorScheme="blue" flexShrink={0}>
              Search
            </Button>
          </HStack>
        </FormControl>
      </VStack>

      {/* Desktop Table View */}
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
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {users.map((user) => (
              <Tr key={user.id}>
                <Td>{user.id}</Td>
                <Td>{user.name}</Td>
                <Td>{user.email}</Td>
                <Td>{user.role}</Td>
                <Td>
                  <HStack spacing={2}>
                    <Button size="sm" colorScheme="blue">
                      Edit
                    </Button>
                    <Button size="sm" colorScheme="red">
                      Delete
                    </Button>
                  </HStack>
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
        {users.map((user) => (
          <Card key={user.id} variant="outline">
            <CardBody>
              <VStack align="stretch" spacing={3}>
                <Box>
                  <Text fontSize="xs" color="gray.500">
                    ID
                  </Text>
                  <Text fontWeight="semibold">{user.id}</Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500">
                    Name
                  </Text>
                  <Text fontWeight="semibold">{user.name}</Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500">
                    Email
                  </Text>
                  <Text fontSize="sm">{user.email}</Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500">
                    Role
                  </Text>
                  <Text>{user.role}</Text>
                </Box>
                <HStack spacing={2} mt={2}>
                  <Button size="sm" colorScheme="blue" flex="1">
                    Edit
                  </Button>
                  <Button size="sm" colorScheme="red" flex="1">
                    Delete
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default ManageUsers;
