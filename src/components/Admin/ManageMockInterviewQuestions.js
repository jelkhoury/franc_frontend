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
  FormControl,
  FormLabel,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Tooltip,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { get, postForm, del, put } from "../../utils/httpServices";
import { BLOB_STORAGE_ENDPOINTS } from "../../services/apiService";

const ManageMockInterviewQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [majors, setMajors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMajor, setFilterMajor] = useState("");
  const [majorsLoaded, setMajorsLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [deleteQuestion, setDeleteQuestion] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const toast = useToast();

  // Modal controls
  const {
    isOpen: isAddOpen,
    onOpen: onAddOpen,
    onClose: onAddClose,
  } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  // Form state
  const [formData, setFormData] = useState({
    majorName: "",
    title: "",
    video: null,
  });
  const [editTitle, setEditTitle] = useState("");

  // Fetch majors on mount
  useEffect(() => {
    const fetchMajors = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const majorsData = await get(BLOB_STORAGE_ENDPOINTS.GET_MAJORS, { token });
        const majorsList = Array.isArray(majorsData) ? majorsData : [];
        setMajors(majorsList);

        // Set default major to "Computer Science" if it exists, otherwise use first major
        if (majorsList.length > 0) {
          const computerScience = majorsList.find(
            (m) => m.name && m.name.toLowerCase().includes("computer")
          );
          if (computerScience) {
            setFilterMajor(computerScience.name);
          } else if (majorsList[0].name) {
            setFilterMajor(majorsList[0].name);
          }
        }
        setMajorsLoaded(true);
      } catch (err) {
        console.error("Error fetching majors:", err);
        setError(err.message);
        toast({
          title: "Error loading majors",
          description: err.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setMajorsLoaded(true); // Set to true even on error to prevent blocking
      } finally {
        setLoading(false);
      }
    };
    fetchMajors();
  }, []);

  // Fetch questions when filterMajor changes (only after majors are loaded)
  useEffect(() => {
    if (filterMajor && majorsLoaded) {
      fetchQuestionsForMajor(filterMajor);
    }
  }, [filterMajor, majorsLoaded]);

  const fetchQuestionsForMajor = async (majorName) => {
    try {
      setLoadingQuestions(true);
      setError(null);
      const token = localStorage.getItem("token");

      const questionsData = await get(
        BLOB_STORAGE_ENDPOINTS.GET_RANDOM_QUESTIONS,
        {
          params: { majorName: majorName, count: 1000 }, // Get all questions
          token,
        }
      );

      if (Array.isArray(questionsData)) {
        const questionsWithMajor = questionsData.map((q) => ({
          ...q,
          majorName: majorName,
        }));
        setQuestions(questionsWithMajor);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.error(`Error fetching questions for ${majorName}:`, err);
      setError(err.message);
      toast({
        title: "Error loading questions",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleAddQuestion = () => {
    setFormData({
      majorName: "",
      title: "",
      video: null,
    });
    onAddOpen();
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setEditTitle(question.title || "");
    onEditOpen();
  };

  const handleDeleteQuestion = (question) => {
    setDeleteQuestion(question);
    onDeleteOpen();
  };

  const submitAddQuestion = async () => {
    if (isSubmitting) return;

    try {
      if (!formData.majorName || !formData.title || !formData.video) {
        toast({
          title: "Validation Error",
          description: "Major name, title, and video are required",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setIsSubmitting(true);
      const token = localStorage.getItem("token");

      const formDataToSend = new FormData();
      formDataToSend.append("majorName", formData.majorName);
      formDataToSend.append("title", formData.title);
      formDataToSend.append("video", formData.video);

      const result = await postForm(
        BLOB_STORAGE_ENDPOINTS.CREATE_QUESTION,
        formDataToSend,
        { token }
      );

      toast({
        title: "Success",
        description: "Question added successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onAddClose();
      // Refresh questions for the current major
      if (filterMajor) {
        fetchQuestionsForMajor(filterMajor);
      }
    } catch (err) {
      console.error("Error adding question:", err);
      toast({
        title: "Error",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitEditTitle = async () => {
    if (isUpdating) return;

    try {
      if (!editTitle || !editTitle.trim()) {
        toast({
          title: "Validation Error",
          description: "Title is required",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setIsUpdating(true);
      const token = localStorage.getItem("token");

      const questionId = editingQuestion.id || editingQuestion.questionId;
      const result = await put(
        BLOB_STORAGE_ENDPOINTS.EDIT_QUESTION_TITLE(questionId),
        null,
        {
          params: { newTitle: editTitle.trim() },
          token,
        }
      );

      toast({
        title: "Success",
        description: result.message || "Question title updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onEditClose();
      setEditingQuestion(null);
      // Refresh questions for the current major
      if (filterMajor) {
        fetchQuestionsForMajor(filterMajor);
      }
    } catch (err) {
      console.error("Error updating question:", err);
      toast({
        title: "Error",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDeleteQuestion = async () => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      const token = localStorage.getItem("token");
      const questionId = deleteQuestion.id || deleteQuestion.questionId;
      const result = await del(
        BLOB_STORAGE_ENDPOINTS.DELETE_QUESTION(questionId),
        { token }
      );

      toast({
        title: "Success",
        description: result.message || "Question deleted successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onDeleteClose();
      setDeleteQuestion(null);
      // Refresh questions for the current major
      if (filterMajor) {
        fetchQuestionsForMajor(filterMajor);
      }
    } catch (err) {
      console.error("Error deleting question:", err);
      toast({
        title: "Error",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter questions by search term only (major filter is already applied)
  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      const matchesSearch =
        question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (question.majorName &&
          question.majorName.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });
  }, [questions, searchTerm]);

  // Get major names from majors list
  const majorNames = useMemo(() => {
    return majors.map((m) => m.name).filter(Boolean).sort();
  }, [majors]);

  // Pagination logic
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} color="gray.600">
          Loading majors...
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      <Heading color="brand.500" size="lg" mb={6}>
        Manage Mock Interview Questions
      </Heading>

      {/* Search and Filter Controls */}
      <VStack spacing={4} align="stretch" mb={6}>
        <HStack spacing={3} flexWrap="wrap">
          <InputGroup flex="1" minW="200px">
            <InputLeftElement pointerEvents="none">
              <Icon as={SearchIcon} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search by question title or major"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              bg="white"
            />
          </InputGroup>
          <Select
            placeholder="Select Major"
            value={filterMajor}
            onChange={(e) => setFilterMajor(e.target.value)}
            bg="white"
            maxW="250px"
            isRequired
          >
            {majorNames.map((major) => (
              <option key={major} value={major}>
                {major}
              </option>
            ))}
          </Select>
          <Button colorScheme="blue" onClick={handleAddQuestion}>
            Add Question
          </Button>
        </HStack>
      </VStack>

      {/* Loading Questions Indicator */}
      {loadingQuestions && (
        <Box textAlign="center" py={4}>
          <Spinner size="md" color="blue.500" />
          <Text mt={2} color="gray.600" fontSize="sm">
            Loading questions for {filterMajor}...
          </Text>
        </Box>
      )}

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
              <Th>ID</Th>
              <Th>Major</Th>
              <Th>Title</Th>
              <Th>Video URL</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {!loadingQuestions && paginatedQuestions.length === 0 && (
              <Tr>
                <Td colSpan={5} textAlign="center" py={8}>
                  <Text color="gray.500">
                    No questions found for {filterMajor}
                  </Text>
                </Td>
              </Tr>
            )}
            {paginatedQuestions.map((question) => (
              <Tr key={question.id || question.questionId}>
                <Td>{question.id || question.questionId}</Td>
                <Td>
                  <Badge colorScheme="purple">{question.majorName}</Badge>
                </Td>
                <Td>
                  <Text noOfLines={2} maxW="300px">
                    {question.title}
                  </Text>
                </Td>
                <Td>
                  <Tooltip label={question.videoUrl} placement="top" hasArrow>
                    <Text
                      fontSize="xs"
                      noOfLines={1}
                      maxW="200px"
                      color="gray.600"
                      cursor="help"
                    >
                      {question.videoUrl}
                    </Text>
                  </Tooltip>
                </Td>
                <Td>
                  <HStack spacing={2}>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={() => handleEditQuestion(question)}
                    >
                      Edit Title
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleDeleteQuestion(question)}
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

      {/* Mobile Card View */}
      {!loadingQuestions && paginatedQuestions.length === 0 && (
        <Box textAlign="center" py={8}>
          <Text color="gray.500">
            No questions found for {filterMajor}
          </Text>
        </Box>
      )}
      <SimpleGrid
        columns={{ base: 1, sm: 1 }}
        spacing={4}
        display={{ base: "grid", md: "none" }}
        mb={4}
      >
        {paginatedQuestions.map((question) => (
          <Card key={question.id || question.questionId} variant="outline">
            <CardBody>
              <VStack align="stretch" spacing={3}>
                <Box>
                  <Text fontSize="xs" color="gray.500">
                    ID
                  </Text>
                  <Text fontWeight="semibold">
                    {question.id || question.questionId}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500">
                    Major
                  </Text>
                  <Badge colorScheme="purple">{question.majorName}</Badge>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500">
                    Title
                  </Text>
                  <Text fontWeight="semibold">{question.title}</Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500">
                    Video URL
                  </Text>
                  <Tooltip label={question.videoUrl} placement="top" hasArrow>
                    <Text
                      fontSize="xs"
                      color="gray.600"
                      noOfLines={2}
                      cursor="help"
                    >
                      {question.videoUrl}
                    </Text>
                  </Tooltip>
                </Box>
                <HStack spacing={2} mt={2}>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    flex="1"
                    onClick={() => handleEditQuestion(question)}
                  >
                    Edit Title
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="red"
                    flex="1"
                    onClick={() => handleDeleteQuestion(question)}
                  >
                    Delete
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
            Showing {startIndex + 1}-{Math.min(endIndex, filteredQuestions.length)}{" "}
            of {filteredQuestions.length} questions
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

      {/* Add Question Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={onAddClose}
        size="lg"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Question</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Major Name</FormLabel>
                <Input
                  placeholder="Enter major name"
                  value={formData.majorName}
                  onChange={(e) =>
                    setFormData({ ...formData, majorName: e.target.value })
                  }
                  list="majors-list"
                />
                <datalist id="majors-list">
                  {majors.map((major) => (
                    <option key={major.id || major.name} value={major.name} />
                  ))}
                </datalist>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  If major doesn't exist, it will be created automatically
                </Text>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Question Title</FormLabel>
                <Input
                  placeholder="Enter question title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Video File</FormLabel>
                <Input
                  type="file"
                  accept="video/*"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      video: e.target.files[0] || null,
                    })
                  }
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Upload a video file for this question
                </Text>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={onAddClose}
              isDisabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={submitAddQuestion}
              isLoading={isSubmitting}
              loadingText="Adding..."
            >
              Add Question
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Title Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Question Title</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Major</FormLabel>
                <Text fontWeight="semibold">{editingQuestion?.majorName}</Text>
              </FormControl>
              <FormControl>
                <FormLabel>Question ID</FormLabel>
                <Text fontSize="sm" color="gray.600">
                  {editingQuestion?.id || editingQuestion?.questionId}
                </Text>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Question Title</FormLabel>
                <Input
                  placeholder="Enter new title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={onEditClose}
              isDisabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={submitEditTitle}
              isLoading={isUpdating}
              loadingText="Updating..."
            >
              Update Title
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={undefined}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Question
            </AlertDialogHeader>

            <AlertDialogBody>
              <Text mb={3}>
                Are you sure you want to delete this question?
              </Text>
              <Text fontSize="sm" color="gray.600" mb={2}>
                <strong>Question:</strong> {deleteQuestion?.title}
              </Text>
              <Text fontSize="sm" color="gray.600">
                <strong>Major:</strong> {deleteQuestion?.majorName}
              </Text>
              <Text fontSize="xs" color="red.500" mt={2}>
                This action cannot be undone.
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button onClick={onDeleteClose} isDisabled={isDeleting}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={confirmDeleteQuestion}
                ml={3}
                isLoading={isDeleting}
                loadingText="Deleting..."
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default ManageMockInterviewQuestions;

