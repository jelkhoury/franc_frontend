import React from "react";
import {
  SimpleGrid,
  Card,
  CardBody,
  VStack,
  Box,
  Text,
  HStack,
  Button,
} from "@chakra-ui/react";

const UserCardList = ({ users, onEdit, onDelete }) => {
  return (
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
                <Text fontWeight="semibold">{user.fullName}</Text>
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
                <Text
                  fontWeight="semibold"
                  color={user.role === "Admin" ? "blue.500" : "gray.600"}
                >
                  {user.role}
                </Text>
              </Box>
              <HStack justify="space-between">
                <Box>
                  <Text fontSize="xs" color="gray.500">
                    Verified
                  </Text>
                  <Text
                    color={user.isVerified ? "green.500" : "red.500"}
                    fontWeight="semibold"
                  >
                    {user.isVerified ? "Yes" : "No"}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500">
                    Can Do Mock
                  </Text>
                  <Text
                    color={user.canDoMockInterview ? "green.500" : "red.500"}
                    fontWeight="semibold"
                  >
                    {user.canDoMockInterview ? "Yes" : "No"}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500">
                    Attempts
                  </Text>
                  <Text fontWeight="semibold">
                    {user.mockAttempts ?? "-"}
                  </Text>
                </Box>
              </HStack>
              <HStack spacing={2} mt={2}>
                <Button
                  size="sm"
                  colorScheme="blue"
                  flex="1"
                  onClick={() => onEdit(user)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  colorScheme="red"
                  flex="1"
                  onClick={() => onDelete(user)}
                >
                  Delete
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      ))}
    </SimpleGrid>
  );
};

export default UserCardList;

