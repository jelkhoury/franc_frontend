import React from "react";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Text,
  HStack,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Center,
  Flex,
  useColorModeValue,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { formatAnalyticsDate, serviceLabel } from "../utils/analytics.utils";
import AnalyticsEmptyState from "./AnalyticsStates";

export default function UserExplorer({
  users,
  loading,
  search,
  onSearchChange,
  onUserSelect,
  page,
  totalPages,
  onPageChange,
}) {
  const border = useColorModeValue("gray.200", "gray.600");

  return (
    <Box>
      <Flex mb={4} gap={3} flexWrap="wrap">
        <InputGroup maxW="320px" size="sm">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            bg="white"
          />
        </InputGroup>
      </Flex>

      {!loading && !users?.length ? (
        <AnalyticsEmptyState
          title="No users found"
          description="Try adjusting your search or filters."
        />
      ) : loading && !users?.length ? (
        <Center py={16}>
          <Spinner size="lg" color="brand.500" thickness="3px" />
        </Center>
      ) : (
        <>
          <TableContainer borderWidth="1px" borderColor={border} borderRadius="xl" overflow="hidden" position="relative">
            {loading && (
              <Center
                position="absolute"
                inset={0}
                bg="whiteAlpha.800"
                zIndex={1}
              >
                <Spinner size="lg" color="brand.500" thickness="3px" />
              </Center>
            )}
            <Table size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Services Used</Th>
                  <Th isNumeric>Activities</Th>
                  <Th isNumeric>Completed</Th>
                  <Th>Last Activity</Th>
                  <Th>Registered</Th>
                  <Th />
                </Tr>
              </Thead>
              <Tbody>
                {(users || []).map((user) => (
                  <Tr key={user.userId} _hover={{ bg: "gray.50" }}>
                    <Td fontWeight="medium" fontSize="sm">
                      <HStack spacing={2}>
                        <Text>{user.firstName} {user.lastName}</Text>
                        {user.isDemo && (
                          <Badge colorScheme="purple" fontSize="2xs">Demo</Badge>
                        )}
                      </HStack>
                    </Td>
                    <Td fontSize="sm" color="gray.600">
                      {user.email}
                    </Td>
                    <Td>
                      <HStack spacing={1} flexWrap="wrap">
                        {(user.servicesUsed || []).slice(0, 3).map((sk) => (
                          <Badge key={sk} fontSize="2xs" colorScheme="blue" variant="subtle">
                            {serviceLabel(sk).split(" ")[0]}
                          </Badge>
                        ))}
                        {(user.servicesUsed || []).length > 3 && (
                          <Badge fontSize="2xs" variant="outline">
                            +{user.servicesUsed.length - 3}
                          </Badge>
                        )}
                        {!user.servicesUsed?.length && (
                          <Text fontSize="xs" color="gray.400">
                            —
                          </Text>
                        )}
                      </HStack>
                    </Td>
                    <Td isNumeric fontSize="sm">
                      {user.totalActivities}
                    </Td>
                    <Td isNumeric fontSize="sm">
                      {user.completedActivities}
                    </Td>
                    <Td fontSize="sm" color="gray.600" whiteSpace="nowrap">
                      {formatAnalyticsDate(user.lastActivityAt)}
                    </Td>
                    <Td fontSize="sm" color="gray.600" whiteSpace="nowrap">
                      {formatAnalyticsDate(user.registeredAt)}
                    </Td>
                    <Td>
                      <Button
                        size="xs"
                        colorScheme="brand"
                        variant={user.isDemo ? "solid" : "outline"}
                        onClick={() => onUserSelect(user)}
                      >
                        View 360°
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Flex justify="center" mt={4} gap={2}>
              <Button size="sm" isDisabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                Previous
              </Button>
              <Text fontSize="sm" alignSelf="center" color="gray.600">
                Page {page} of {totalPages}
              </Text>
              <Button size="sm" isDisabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
                Next
              </Button>
            </Flex>
          )}
        </>
      )}
    </Box>
  );
}
