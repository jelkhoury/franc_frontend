import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Heading,
  VStack,
  HStack,
  useToast,
  Spinner,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  IconButton,
  useColorModeValue,
  Alert,
  AlertIcon,
  Flex,
  Tooltip,
} from "@chakra-ui/react";
import { get } from "../../utils/httpServices";
import { JOB_COMPARISON_ENDPOINTS } from "../../services/apiService";
import { FaFileExcel, FaExternalLinkAlt, FaDownload } from "react-icons/fa";

const ManageJobComparisons = () => {
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const toast = useToast();
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    fetchComparisons();
  }, []);

  // Reset to page 1 when comparisons change
  useEffect(() => {
    setCurrentPage(1);
  }, [comparisons.length]);

  const fetchComparisons = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await get(JOB_COMPARISON_ENDPOINTS.GET_ALL_COMPARISONS);
      setComparisons(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching job comparisons:", err);
      setError(err.message || "Failed to load job comparisons");
      toast({
        title: "Error loading job comparisons",
        description: err.message || "Failed to load job comparisons",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async (comparisonId) => {
    try {
      const token = localStorage.getItem("token");
      const url = JOB_COMPARISON_ENDPOINTS.EXPORT_EXCEL(comparisonId);
      const baseUrl = process.env.REACT_APP_API_BASE_URL || "";
      const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;

      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `Job Comparison Scorecard - ${comparisonId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: "Success",
        description: "Excel file downloaded successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error downloading Excel:", error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download Excel file.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(comparisons.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentComparisons = comparisons.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading job comparisons...</Text>
        </VStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color="brand.500">
          Manage Job Comparisons
        </Heading>
        <Button onClick={fetchComparisons} size="sm" variant="outline">
          Refresh
        </Button>
      </Flex>

      {comparisons.length === 0 ? (
        <Box
          p={8}
          bg={cardBg}
          borderRadius="lg"
          textAlign="center"
          border="1px"
          borderColor={borderColor}
        >
          <Text color="gray.500" fontSize="lg">
            No job comparisons found.
          </Text>
        </Box>
      ) : (
        <TableContainer
          bg={cardBg}
          borderRadius="lg"
          border="1px"
          borderColor={borderColor}
          overflowX="auto"
        >
          <Table variant="simple" size="md">
            <Thead bg={useColorModeValue("gray.50", "gray.700")}>
              <Tr>
                <Th borderColor={borderColor}>ID</Th>
                <Th borderColor={borderColor}>User ID</Th>
                <Th borderColor={borderColor}>Job A</Th>
                <Th borderColor={borderColor}>Job B</Th>
                <Th borderColor={borderColor}>Status</Th>
                <Th borderColor={borderColor}>Created</Th>
                <Th borderColor={borderColor}>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {currentComparisons.map((comparison) => (
                <Tr key={comparison.id || comparison.Id}>
                  <Td borderColor={borderColor} fontWeight="medium">
                    {comparison.id || comparison.Id}
                  </Td>
                  <Td borderColor={borderColor}>
                    {comparison.userId || comparison.UserId || "N/A"}
                  </Td>
                  <Td borderColor={borderColor}>
                    {comparison.jobAName || comparison.JobAName || "N/A"}
                  </Td>
                  <Td borderColor={borderColor}>
                    {comparison.jobBName || comparison.JobBName || "N/A"}
                  </Td>
                  <Td borderColor={borderColor}>
                    <Badge
                      colorScheme={
                        comparison.isCompleted === true || comparison.IsCompleted === true
                          ? "green"
                          : "yellow"
                      }
                    >
                      {comparison.isCompleted === true || comparison.IsCompleted === true
                        ? "Completed"
                        : "In Progress"}
                    </Badge>
                  </Td>
                  <Td borderColor={borderColor} fontSize="sm">
                    {formatDate(
                      comparison.createdAt || comparison.CreatedAt
                    )}
                  </Td>
                  <Td borderColor={borderColor}>
                    <HStack spacing={2}>
                      {comparison.excelResultUrl ||
                      comparison.ExcelResultUrl ? (
                        <Tooltip label="View Excel file">
                          <IconButton
                            as="a"
                            href={
                              comparison.excelResultUrl ||
                              comparison.ExcelResultUrl
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            icon={<FaExternalLinkAlt />}
                            size="sm"
                            colorScheme="blue"
                            variant="ghost"
                            aria-label="View Excel"
                          />
                        </Tooltip>
                      ) : null}
                      <Tooltip label="Download Excel">
                        <IconButton
                          icon={<FaDownload />}
                          size="sm"
                          colorScheme="green"
                          variant="outline"
                          onClick={() =>
                            handleDownloadExcel(
                              comparison.id || comparison.Id
                            )
                          }
                          aria-label="Download Excel"
                        />
                      </Tooltip>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}

      <Flex justify="space-between" align="center" mt={4} flexWrap="wrap" gap={4}>
        <Text fontSize="sm" color="gray.500">
          Showing {startIndex + 1}-{Math.min(endIndex, comparisons.length)} of {comparisons.length} job comparison
          {comparisons.length !== 1 ? "s" : ""}
        </Text>
        
        {totalPages > 1 && (
          <HStack spacing={2}>
            <Button
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              isDisabled={currentPage === 1}
              variant="outline"
            >
              Previous
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page, and pages around current
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <Button
                    key={page}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    colorScheme={currentPage === page ? "blue" : "gray"}
                    variant={currentPage === page ? "solid" : "outline"}
                  >
                    {page}
                  </Button>
                );
              } else if (
                page === currentPage - 2 ||
                page === currentPage + 2
              ) {
                return (
                  <Text key={page} px={2} color="gray.500">
                    ...
                  </Text>
                );
              }
              return null;
            })}
            
            <Button
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              isDisabled={currentPage === totalPages}
              variant="outline"
            >
              Next
            </Button>
          </HStack>
        )}
      </Flex>
    </Box>
  );
};

export default ManageJobComparisons;
