import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Input,
  Heading,
  VStack,
  HStack,
  useToast,
  Spinner,
  Text,
  Badge,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Divider,
  Link,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex,
} from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { get } from "../../utils/httpServices";
import { BLOB_STORAGE_ENDPOINTS } from "../../services/apiService";

const ManageFiles = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [resumePage, setResumePage] = useState(1);
  const [coverLetterPage, setCoverLetterPage] = useState(1);
  const itemsPerPage = 6;
  const toast = useToast();

  const {
    isOpen: isEvaluationOpen,
    onOpen: onEvaluationOpen,
    onClose: onEvaluationClose,
  } = useDisclosure();

  // Fetch files from API
  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const data = await get(BLOB_STORAGE_ENDPOINTS.GET_ADMIN_FILES, { token });
      setFiles(data);
    } catch (err) {
      console.error("Error fetching files:", err);
      setError(err.message);
      toast({
        title: "Error loading files",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const { resumes, coverLetters } = useMemo(() => {
    let filtered = files;

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (file) =>
          file.userEmail.toLowerCase().includes(searchLower) ||
          (file.aiEvaluation &&
            file.aiEvaluation.toLowerCase().includes(searchLower))
      );
    }

    // Separate by type
    const resumes = filtered.filter((file) => file.title === "Resume");
    const coverLetters = filtered.filter((file) => file.title === "CoverLetter");

    return { resumes, coverLetters };
  }, [files, searchTerm]);

  // Pagination for resumes
  const resumeTotalPages = Math.ceil(resumes.length / itemsPerPage);
  const resumeStartIndex = (resumePage - 1) * itemsPerPage;
  const resumeEndIndex = resumeStartIndex + itemsPerPage;
  const paginatedResumes = resumes.slice(resumeStartIndex, resumeEndIndex);

  // Pagination for cover letters
  const coverLetterTotalPages = Math.ceil(coverLetters.length / itemsPerPage);
  const coverLetterStartIndex = (coverLetterPage - 1) * itemsPerPage;
  const coverLetterEndIndex = coverLetterStartIndex + itemsPerPage;
  const paginatedCoverLetters = coverLetters.slice(coverLetterStartIndex, coverLetterEndIndex);

  // Reset pages when search changes
  useEffect(() => {
    setResumePage(1);
    setCoverLetterPage(1);
  }, [searchTerm]);

  const handleViewEvaluation = (file) => {
    setSelectedFile(file);
    onEvaluationOpen();
  };

  const formatEvaluation = (evaluation) => {
    if (!evaluation) return <Text>No evaluation available</Text>;
    
    // Split by lines and format
    const lines = evaluation.split("\n");
    const elements = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Empty line
      if (trimmedLine === "") {
        elements.push(<br key={index} />);
        return;
      }
      
      // Bold text (markdown **text**)
      if (trimmedLine.startsWith("**") && trimmedLine.endsWith("**")) {
        elements.push(
          <Text key={index} fontWeight="bold" mt={2} mb={1} fontSize="sm">
            {trimmedLine.replace(/\*\*/g, "")}
          </Text>
        );
        return;
      }
      
      // Check for inline bold markers
      const boldRegex = /\*\*([^*]+)\*\*/g;
      if (boldRegex.test(trimmedLine)) {
        const parts = [];
        let lastIndex = 0;
        let match;
        boldRegex.lastIndex = 0;
        
        while ((match = boldRegex.exec(trimmedLine)) !== null) {
          if (match.index > lastIndex) {
            parts.push(trimmedLine.substring(lastIndex, match.index));
          }
          parts.push(
            <Text as="span" key={`bold-${match.index}`} fontWeight="bold">
              {match[1]}
            </Text>
          );
          lastIndex = match.index + match[0].length;
        }
        if (lastIndex < trimmedLine.length) {
          parts.push(trimmedLine.substring(lastIndex));
        }
        
        elements.push(
          <Text key={index} mb={1} fontSize="sm">
            {parts}
          </Text>
        );
        return;
      }
      
      // Bullet points
      if (trimmedLine.startsWith("- ")) {
        elements.push(
          <Text key={index} ml={4} mb={1} fontSize="sm">
            {trimmedLine}
          </Text>
        );
        return;
      }
      
      // Regular text
      elements.push(
        <Text key={index} mb={1} fontSize="sm">
          {trimmedLine}
        </Text>
      );
    });
    
    return elements.length > 0 ? elements : <Text>No evaluation available</Text>;
  };

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} color="gray.600">
          Loading files...
        </Text>
      </Box>
    );
  }

  if (error && files.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="red.500" fontSize="lg">
          Error: {error}
        </Text>
        <Button mt={4} colorScheme="blue" onClick={fetchFiles}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Heading color="brand.500" size="lg" mb={6}>
        Manage Files
      </Heading>

      <VStack spacing={4} align="stretch" mb={6}>
        <Input
          placeholder="Search by email or evaluation content"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          maxW="400px"
        />
      </VStack>

      <Tabs colorScheme="blue">
        <TabList>
          <Tab>
            Resumes ({resumes.length})
          </Tab>
          <Tab>
            Cover Letters ({coverLetters.length})
          </Tab>
        </TabList>

        <TabPanels>
          {/* Resumes Tab */}
          <TabPanel>
            {resumes.length === 0 ? (
              <Text color="gray.500" fontSize="sm" textAlign="center" py={10}>
                No resumes found
              </Text>
            ) : (
              <>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} mb={4}>
                  {paginatedResumes.map((file) => (
                    <Card key={file.id} variant="outline" size="sm">
                      <CardHeader pb={2}>
                        <Badge colorScheme="green" fontSize="sm">
                          Resume
                        </Badge>
                      </CardHeader>
                      <CardBody pt={2}>
                        <VStack align="stretch" spacing={3}>
                          <Box>
                            <Text fontSize="xs" color="gray.500" mb={1}>
                              User Email
                            </Text>
                            <Text fontSize="sm" fontWeight="medium">
                              {file.userEmail}
                            </Text>
                          </Box>

                          {file.resumeUrl && (
                            <Box>
                              <Text fontSize="xs" color="gray.500" mb={1}>
                                Resume
                              </Text>
                              <Link
                                href={file.resumeUrl}
                                isExternal
                                color="blue.500"
                                fontSize="sm"
                              >
                                <HStack>
                                  <Text>View Resume</Text>
                                  <ExternalLinkIcon />
                                </HStack>
                              </Link>
                            </Box>
                          )}

                          <Divider />

                          <Button
                            size="sm"
                            colorScheme="blue"
                            variant="outline"
                            onClick={() => handleViewEvaluation(file)}
                            isFullWidth
                          >
                            View AI Evaluation
                          </Button>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>

                {/* Resume Pagination */}
                {resumeTotalPages > 1 && (
                  <Flex justify="space-between" align="center" mt={4} flexWrap="wrap" gap={2}>
                    <Text fontSize="sm" color="gray.600">
                      Showing {resumeStartIndex + 1}-{Math.min(resumeEndIndex, resumes.length)} of{" "}
                      {resumes.length} resumes
                    </Text>
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setResumePage((prev) => Math.max(prev - 1, 1))}
                        isDisabled={resumePage === 1}
                      >
                        Previous
                      </Button>
                      <HStack spacing={1}>
                        {Array.from({ length: Math.min(5, resumeTotalPages) }, (_, i) => {
                          let pageNum;
                          if (resumeTotalPages <= 5) {
                            pageNum = i + 1;
                          } else if (resumePage <= 3) {
                            pageNum = i + 1;
                          } else if (resumePage >= resumeTotalPages - 2) {
                            pageNum = resumeTotalPages - 4 + i;
                          } else {
                            pageNum = resumePage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              size="sm"
                              variant={resumePage === pageNum ? "solid" : "outline"}
                              colorScheme={resumePage === pageNum ? "blue" : "gray"}
                              onClick={() => setResumePage(pageNum)}
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
                          setResumePage((prev) => Math.min(prev + 1, resumeTotalPages))
                        }
                        isDisabled={resumePage === resumeTotalPages}
                      >
                        Next
                      </Button>
                    </HStack>
                  </Flex>
                )}
              </>
            )}
          </TabPanel>

          {/* Cover Letters Tab */}
          <TabPanel>
            {coverLetters.length === 0 ? (
              <Text color="gray.500" fontSize="sm" textAlign="center" py={10}>
                No cover letters found
              </Text>
            ) : (
              <>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} mb={4}>
                  {paginatedCoverLetters.map((file) => (
                    <Card key={file.id} variant="outline" size="sm">
                      <CardHeader pb={2}>
                        <Badge colorScheme="purple" fontSize="sm">
                          Cover Letter
                        </Badge>
                      </CardHeader>
                      <CardBody pt={2}>
                        <VStack align="stretch" spacing={3}>
                          <Box>
                            <Text fontSize="xs" color="gray.500" mb={1}>
                              User Email
                            </Text>
                            <Text fontSize="sm" fontWeight="medium">
                              {file.userEmail}
                            </Text>
                          </Box>

                          {file.coverUrl && (
                            <Box>
                              <Text fontSize="xs" color="gray.500" mb={1}>
                                Cover Letter
                              </Text>
                              <Link
                                href={file.coverUrl}
                                isExternal
                                color="blue.500"
                                fontSize="sm"
                              >
                                <HStack>
                                  <Text>View Cover Letter</Text>
                                  <ExternalLinkIcon />
                                </HStack>
                              </Link>
                            </Box>
                          )}

                          {file.jobAddUrl && (
                            <Box>
                              <Text fontSize="xs" color="gray.500" mb={1}>
                                Job Advertisement
                              </Text>
                              <Link
                                href={file.jobAddUrl}
                                isExternal
                                color="blue.500"
                                fontSize="sm"
                              >
                                <HStack>
                                  <Text>View Job Ad</Text>
                                  <ExternalLinkIcon />
                                </HStack>
                              </Link>
                            </Box>
                          )}

                          <Divider />

                          <Button
                            size="sm"
                            colorScheme="blue"
                            variant="outline"
                            onClick={() => handleViewEvaluation(file)}
                            isFullWidth
                          >
                            View AI Evaluation
                          </Button>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>

                {/* Cover Letter Pagination */}
                {coverLetterTotalPages > 1 && (
                  <Flex justify="space-between" align="center" mt={4} flexWrap="wrap" gap={2}>
                    <Text fontSize="sm" color="gray.600">
                      Showing {coverLetterStartIndex + 1}-{Math.min(coverLetterEndIndex, coverLetters.length)} of{" "}
                      {coverLetters.length} cover letters
                    </Text>
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCoverLetterPage((prev) => Math.max(prev - 1, 1))}
                        isDisabled={coverLetterPage === 1}
                      >
                        Previous
                      </Button>
                      <HStack spacing={1}>
                        {Array.from({ length: Math.min(5, coverLetterTotalPages) }, (_, i) => {
                          let pageNum;
                          if (coverLetterTotalPages <= 5) {
                            pageNum = i + 1;
                          } else if (coverLetterPage <= 3) {
                            pageNum = i + 1;
                          } else if (coverLetterPage >= coverLetterTotalPages - 2) {
                            pageNum = coverLetterTotalPages - 4 + i;
                          } else {
                            pageNum = coverLetterPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              size="sm"
                              variant={coverLetterPage === pageNum ? "solid" : "outline"}
                              colorScheme={coverLetterPage === pageNum ? "blue" : "gray"}
                              onClick={() => setCoverLetterPage(pageNum)}
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
                          setCoverLetterPage((prev) => Math.min(prev + 1, coverLetterTotalPages))
                        }
                        isDisabled={coverLetterPage === coverLetterTotalPages}
                      >
                        Next
                      </Button>
                    </HStack>
                  </Flex>
                )}
              </>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Evaluation Modal */}
      <Modal
        isOpen={isEvaluationOpen}
        onClose={onEvaluationClose}
        size="xl"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            AI Evaluation - {selectedFile?.title}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Box>
                <Text fontSize="xs" color="gray.500" mb={1}>
                  User Email
                </Text>
                <Text fontWeight="medium">{selectedFile?.userEmail}</Text>
              </Box>

              {selectedFile?.title === "Resume" && selectedFile?.resumeUrl && (
                <Box>
                  <Text fontSize="xs" color="gray.500" mb={1}>
                    Resume File
                  </Text>
                  <Link href={selectedFile.resumeUrl} isExternal color="blue.500">
                    <HStack>
                      <Text>Open Resume</Text>
                      <ExternalLinkIcon />
                    </HStack>
                  </Link>
                </Box>
              )}

              {selectedFile?.title === "CoverLetter" && (
                <>
                  {selectedFile?.coverUrl && (
                    <Box>
                      <Text fontSize="xs" color="gray.500" mb={1}>
                        Cover Letter File
                      </Text>
                      <Link
                        href={selectedFile.coverUrl}
                        isExternal
                        color="blue.500"
                      >
                        <HStack>
                          <Text>Open Cover Letter</Text>
                          <ExternalLinkIcon />
                        </HStack>
                      </Link>
                    </Box>
                  )}
                  {selectedFile?.jobAddUrl && (
                    <Box>
                      <Text fontSize="xs" color="gray.500" mb={1}>
                        Job Advertisement File
                      </Text>
                      <Link
                        href={selectedFile.jobAddUrl}
                        isExternal
                        color="blue.500"
                      >
                        <HStack>
                          <Text>Open Job Ad</Text>
                          <ExternalLinkIcon />
                        </HStack>
                      </Link>
                    </Box>
                  )}
                </>
              )}

              <Divider />

              <Box>
                <Text fontSize="sm" fontWeight="bold" mb={2}>
                  AI Evaluation:
                </Text>
                <Box
                  p={4}
                  bg="gray.50"
                  borderRadius="md"
                  maxH="400px"
                  overflowY="auto"
                  fontSize="sm"
                >
                  {formatEvaluation(selectedFile?.aiEvaluation)}
                </Box>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
       
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ManageFiles;
