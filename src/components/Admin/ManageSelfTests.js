import React, { useState, useEffect, useMemo } from "react";
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
  HStack,
  Button,
  Spinner,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  useDisclosure,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Flex,
  Icon,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { get } from "../../utils/httpServices";
import { SDS_ENDPOINTS } from "../../services/apiService";
import RIASECScoringTable from "./RIASECScoringTable";

const ManageSelfTests = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterHollandCode, setFilterHollandCode] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [selectedScoring, setSelectedScoring] = useState(null);
  const [hollandPoints, setHollandPoints] = useState(null);
  const [hollandPointsLoading, setHollandPointsLoading] = useState(false);
  const [hollandPointsError, setHollandPointsError] = useState("");
  const toast = useToast();

  // Modal controls
  const {
    isOpen: isFeedbackOpen,
    onOpen: onFeedbackOpen,
    onClose: onFeedbackClose,
  } = useDisclosure();
  const {
    isOpen: isScoringOpen,
    onOpen: onScoringOpen,
    onClose: onScoringClose,
  } = useDisclosure();

  // Fetch results from API
  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const data = await get(SDS_ENDPOINTS.GET_SDS_RESULTS, { token });
      setResults(data);
    } catch (err) {
      console.error("Error fetching SDS results:", err);
      setError(err.message);
      toast({
        title: "Error loading results",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewFeedback = (result) => {
    setSelectedFeedback(result);
    onFeedbackOpen();
  };

  const handleViewScoring = async (result) => {
    setSelectedScoring(result);
    setHollandPoints(null);
    setHollandPointsLoading(true);
    setHollandPointsError("");
    onScoringOpen();

    try {
      const token = localStorage.getItem("token");
      const response = await get(
        SDS_ENDPOINTS.GET_HOLLAND_POINTS_BY_ATTEMPT(
          result.userId,
          result.attemptNumber
        ),
        { token }
      );

      if (response.message && response.data) {
        setHollandPoints(response.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching Holland points:", err);
      setHollandPointsError("Could not load Holland points.");
      toast({
        title: "Error",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setHollandPointsLoading(false);
    }
  };

  // Format AI feedback for display (replace \r\n with line breaks)
  const formatFeedback = (feedback) => {
    if (!feedback) return "";
    return feedback.split(/\r\n|\n/).map((line, index) => (
      <Text key={index} mb={2}>
        {line}
      </Text>
    ));
  };

  // Filter and search logic
  const filteredResults = useMemo(() => {
    return results.filter((result) => {
      const matchesSearch =
        result.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.hollandCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        !filterHollandCode || result.hollandCode === filterHollandCode;
      return matchesSearch && matchesFilter;
    });
  }, [results, searchTerm, filterHollandCode]);

  // Get unique Holland codes for filter
  const uniqueHollandCodes = useMemo(() => {
    const codes = [...new Set(results.map((r) => r.hollandCode))].filter(
      Boolean
    );
    return codes.sort();
  }, [results]);

  // Pagination logic
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResults = filteredResults.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterHollandCode]);

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} color="gray.600">
          Loading personality test results...
        </Text>
      </Box>
    );
  }

  if (error && results.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="red.500" fontSize="lg">
          Error: {error}
        </Text>
        <Button mt={4} colorScheme="blue" onClick={fetchResults}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Heading color="brand.500" size="lg" mb={6}>
        Manage Personality Test
      </Heading>

      {/* Search and Filter Controls */}
      <VStack spacing={4} align="stretch" mb={6}>
        <HStack spacing={3} flexWrap="wrap">
          <InputGroup flex="1" minW="200px">
            <InputLeftElement pointerEvents="none">
              <Icon as={SearchIcon} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search by email or Holland code"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              bg="white"
            />
          </InputGroup>
          <Select
            placeholder="Filter by Holland Code"
            value={filterHollandCode}
            onChange={(e) => setFilterHollandCode(e.target.value)}
            bg="white"
            maxW="200px"
          >
            <option value="">All Codes</option>
            {uniqueHollandCodes.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </Select>
        </HStack>
      </VStack>

      {/* Desktop Table View */}
      <TableContainer
        display={{ base: "none", md: "block" }}
        overflowX="auto"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="md"
        mb={4}
      >
        <Table variant="striped" colorScheme="gray">
          <Thead bg="gray.50">
            <Tr>
              <Th>User Email</Th>
              <Th>Holland Code</Th>
              <Th>Attempt Number</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {paginatedResults.map((result) => (
              <Tr key={result.resultId}>
                <Td fontWeight="semibold">{result.userEmail}</Td>
                <Td>
                  <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
                    {result.hollandCode}
                  </Badge>
                </Td>
                <Td>{result.attemptNumber}</Td>
                <Td>
                  <HStack spacing={2}>
                    <Button
                      size="sm"
                      colorScheme="purple"
                      onClick={() => handleViewFeedback(result)}
                    >
                      View Feedback
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={() => handleViewScoring(result)}
                      isLoading={hollandPointsLoading && selectedScoring?.resultId === result.resultId}
                      loadingText="Loading..."
                    >
                      View Scoring
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
        mb={4}
      >
        {paginatedResults.map((result) => (
          <Card key={result.resultId} variant="outline">
            <CardBody>
              <VStack align="stretch" spacing={3}>
                <Box>
                  <Text fontSize="xs" color="gray.500">
                    User Email
                  </Text>
                  <Text fontWeight="semibold">{result.userEmail}</Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500">
                    Holland Code
                  </Text>
                  <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
                    {result.hollandCode}
                  </Badge>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500">
                    Attempt Number
                  </Text>
                  <Text fontWeight="semibold">{result.attemptNumber}</Text>
                </Box>
                <HStack spacing={2} mt={2}>
                  <Button
                    size="sm"
                    colorScheme="purple"
                    flex="1"
                    onClick={() => handleViewFeedback(result)}
                  >
                    View Feedback
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    flex="1"
                    onClick={() => handleViewScoring(result)}
                    isLoading={hollandPointsLoading && selectedScoring?.resultId === result.resultId}
                    loadingText="Loading..."
                  >
                    View Scoring
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Flex justify="space-between" align="center" mt={4} flexWrap="wrap" gap={2}>
          <Text fontSize="sm" color="gray.600">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredResults.length)}{" "}
            of {filteredResults.length} results
          </Text>
          <HStack spacing={2}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              isDisabled={currentPage === 1}
            >
              Previous
            </Button>
            <HStack spacing={1}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    size="sm"
                    variant={currentPage === pageNum ? "solid" : "outline"}
                    colorScheme={currentPage === pageNum ? "blue" : "gray"}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </HStack>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              isDisabled={currentPage === totalPages}
            >
              Next
            </Button>
          </HStack>
        </Flex>
      )}

      {/* AI Feedback Modal */}
      <Modal
        isOpen={isFeedbackOpen}
        onClose={onFeedbackClose}
        size="lg"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>AI Feedback</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Box>
                <Text fontSize="sm" color="gray.500" mb={1}>
                  User Email
                </Text>
                <Text fontWeight="semibold">{selectedFeedback?.userEmail}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.500" mb={1}>
                  Holland Code
                </Text>
                <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
                  {selectedFeedback?.hollandCode}
                </Badge>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.500" mb={2}>
                  Feedback
                </Text>
                <Box
                  bg="gray.50"
                  p={4}
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.200"
                >
                  {formatFeedback(selectedFeedback?.aiFeedback)}
                </Box>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onFeedbackClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Scoring Modal */}
      <Modal
        isOpen={isScoringOpen}
        onClose={onScoringClose}
        size="6xl"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            RIASEC Scoring - {selectedScoring?.userEmail} (Attempt{" "}
            {selectedScoring?.attemptNumber})
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <RIASECScoringTable
              hollandPoints={hollandPoints}
              loading={hollandPointsLoading}
              error={hollandPointsError}
            />
          </ModalBody>
          <ModalFooter>
            <Button onClick={onScoringClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ManageSelfTests;
