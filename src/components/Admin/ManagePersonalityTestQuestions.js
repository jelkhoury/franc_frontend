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
  Textarea,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { get, post, del } from "../../utils/httpServices";
import { SDS_ENDPOINTS } from "../../services/apiService";

const QUESTION_TYPES = {
  1: "Radio",
  2: "Checkbox",
  3: "Select",
  4: "Slider",
  5: "TextBox",
  6: "TextArea",
};

const ManagePersonalityTestQuestions = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [deleteQuestion, setDeleteQuestion] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();

  // Modal controls
  const {
    isOpen: isAddOpen,
    onOpen: onAddOpen,
    onClose: onAddClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  // Form state
  const [formData, setFormData] = useState({
    sectionName: "",
    text: "",
    type: 1,
    answerOptions: [{ text: "", value: "" }],
  });

  // Fetch sections and questions from API
  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const data = await get(SDS_ENDPOINTS.GET_SECTIONS, { token });
      setSections(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching sections:", err);
      setError(err.message);
      toast({
        title: "Error loading questions",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setFormData({
      sectionName: "",
      text: "",
      type: 1,
      answerOptions: [{ text: "", value: "" }],
    });
    onAddOpen();
  };

  const handleDeleteQuestion = (question) => {
    setDeleteQuestion(question);
    onDeleteOpen();
  };

  const submitAddQuestion = async () => {
    if (isSubmitting) return;
    
    try {
      if (!formData.sectionName || !formData.text) {
        toast({
          title: "Validation Error",
          description: "Section name and question text are required",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // For non-TextBox questions, validate answer options
      if (formData.type !== 5 && formData.type !== 6) {
        const validOptions = formData.answerOptions.filter(
          (opt) => opt.text && opt.text.trim()
        );
        if (validOptions.length === 0) {
          toast({
            title: "Validation Error",
            description: "At least one answer option is required for this question type",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          return;
        }
      }

      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      const payload = {
        sectionName: formData.sectionName,
        text: formData.text,
        type: formData.type,
        answerOptions:
          formData.type === 5 || formData.type === 6
            ? []
            : formData.answerOptions
                .filter((opt) => opt.text && opt.text.trim())
                .map((opt) => ({
                  text: opt.text.trim(),
                  value: opt.value.trim() || null,
                })),
      };

      const result = await post(SDS_ENDPOINTS.CREATE_QUESTION, payload, {
        token,
      });

      toast({
        title: "Success",
        description: result.message || "Question added successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onAddClose();
      fetchSections();
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

  const confirmDeleteQuestion = async () => {
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      const token = localStorage.getItem("token");
      const result = await del(
        SDS_ENDPOINTS.DELETE_QUESTION(deleteQuestion.id),
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
      fetchSections();
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

  // Flatten all questions from all sections for display
  const allQuestions = useMemo(() => {
    const questions = [];
    sections.forEach((section) => {
      if (section.questions && Array.isArray(section.questions)) {
        section.questions.forEach((question) => {
          questions.push({
            ...question,
            sectionName: section.name,
            sectionId: section.id,
          });
        });
      }
    });
    return questions;
  }, [sections]);

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return allQuestions.filter((question) => {
      const matchesSearch =
        question.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.sectionName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        !filterSection || question.sectionName === filterSection;
      return matchesSearch && matchesFilter;
    });
  }, [allQuestions, searchTerm, filterSection]);

  // Get unique section names for filter
  const uniqueSections = useMemo(() => {
    const sectionNames = [
      ...new Set(sections.map((s) => s.name)),
    ].filter(Boolean);
    return sectionNames.sort();
  }, [sections]);

  // Pagination logic
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterSection]);

  const addAnswerOption = () => {
    setFormData({
      ...formData,
      answerOptions: [...formData.answerOptions, { text: "", value: "" }],
    });
  };

  const removeAnswerOption = (index) => {
    const newOptions = formData.answerOptions.filter((_, i) => i !== index);
    setFormData({ ...formData, answerOptions: newOptions });
  };

  const updateAnswerOption = (index, field, value) => {
    const newOptions = [...formData.answerOptions];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setFormData({ ...formData, answerOptions: newOptions });
  };

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} color="gray.600">
          Loading questions...
        </Text>
      </Box>
    );
  }

  if (error && sections.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="red.500" fontSize="lg">
          Error: {error}
        </Text>
        <Button mt={4} colorScheme="blue" onClick={fetchSections}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Heading color="brand.500" size="lg" mb={6}>
        Manage Personality Test Questions
      </Heading>

      {/* Search and Filter Controls */}
      <VStack spacing={4} align="stretch" mb={6}>
        <HStack spacing={3} flexWrap="wrap">
          <InputGroup flex="1" minW="200px">
            <InputLeftElement pointerEvents="none">
              <Icon as={SearchIcon} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search by question text or section"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              bg="white"
            />
          </InputGroup>
          <Select
            placeholder="Filter by Section"
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            bg="white"
            maxW="250px"
          >
            <option value="">All Sections</option>
            {uniqueSections.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </Select>
          <Button colorScheme="blue" onClick={handleAddQuestion}>
            Add Question
          </Button>
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
              <Th>ID</Th>
              <Th>Section</Th>
              <Th>Question Text</Th>
              <Th>Type</Th>
              <Th>Options Count</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {paginatedQuestions.map((question) => (
              <Tr key={question.id}>
                <Td>{question.id}</Td>
                <Td>
                  <Badge colorScheme="purple">{question.sectionName}</Badge>
                </Td>
                <Td>
                  <Text noOfLines={2} maxW="400px">
                    {question.text}
                  </Text>
                </Td>
                <Td>
                  <Badge colorScheme="blue">
                    {QUESTION_TYPES[question.type] || question.type}
                  </Badge>
                </Td>
                <Td>
                  {question.answerOptions?.length || 0}
                </Td>
                <Td>
                  <Button
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleDeleteQuestion(question)}
                  >
                    Delete
                  </Button>
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
        {paginatedQuestions.map((question) => (
          <Card key={question.id} variant="outline">
            <CardBody>
              <VStack align="stretch" spacing={3}>
                <Box>
                  <Text fontSize="xs" color="gray.500">
                    ID
                  </Text>
                  <Text fontWeight="semibold">{question.id}</Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500">
                    Section
                  </Text>
                  <Badge colorScheme="purple">{question.sectionName}</Badge>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500">
                    Question Text
                  </Text>
                  <Text fontWeight="semibold">{question.text}</Text>
                </Box>
                <HStack justify="space-between">
                  <Box>
                    <Text fontSize="xs" color="gray.500">
                      Type
                    </Text>
                    <Badge colorScheme="blue">
                      {QUESTION_TYPES[question.type] || question.type}
                    </Badge>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.500">
                      Options
                    </Text>
                    <Text fontWeight="semibold">
                      {question.answerOptions?.length || 0}
                    </Text>
                  </Box>
                </HStack>
                <Button
                  size="sm"
                  colorScheme="red"
                  onClick={() => handleDeleteQuestion(question)}
                >
                  Delete
                </Button>
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
      <Modal isOpen={isAddOpen} onClose={onAddClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Question</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Section Name</FormLabel>
                <Select
                  placeholder="Select section"
                  value={formData.sectionName}
                  onChange={(e) =>
                    setFormData({ ...formData, sectionName: e.target.value })
                  }
                >
                  {uniqueSections.map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Question Text</FormLabel>
                <Textarea
                  placeholder="Enter question text"
                  value={formData.text}
                  onChange={(e) =>
                    setFormData({ ...formData, text: e.target.value })
                  }
                  rows={3}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Question Type</FormLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => {
                    const newType = parseInt(e.target.value);
                    setFormData({
                      ...formData,
                      type: newType,
                      answerOptions:
                        newType === 5 || newType === 6
                          ? []
                          : [{ text: "", value: "" }],
                    });
                  }}
                >
                  <option value={1}>Radio</option>
                  <option value={2}>Checkbox</option>
                  <option value={3}>SelectBox</option>
                  <option value={4}>Slider</option>
                  <option value={5}>TextBox</option>
                  <option value={6}>TextArea</option>
                </Select>
              </FormControl>

              {(formData.type !== 5 && formData.type !== 6) && (
                <Box>
                  <HStack justify="space-between" mb={2}>
                    <FormLabel mb={0}>Answer Options</FormLabel>
                    <Button size="sm" onClick={addAnswerOption}>
                      Add Option
                    </Button>
                  </HStack>
                  <VStack spacing={2} align="stretch">
                    {formData.answerOptions.map((option, index) => (
                      <HStack key={index}>
                        <Input
                          placeholder="Option text"
                          value={option.text}
                          onChange={(e) =>
                            updateAnswerOption(index, "text", e.target.value)
                          }
                          flex="1"
                        />
                        <Input
                          placeholder="Value (e.g., R, I, A)"
                          value={option.value}
                          onChange={(e) =>
                            updateAnswerOption(index, "value", e.target.value)
                          }
                          maxW="120px"
                        />
                        {formData.answerOptions.length > 1 && (
                          <Button
                            size="sm"
                            colorScheme="red"
                            onClick={() => removeAnswerOption(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAddClose} isDisabled={isSubmitting}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={submitAddQuestion} isLoading={isSubmitting} loadingText="Adding...">
              Add Question
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
                <strong>Question:</strong> {deleteQuestion?.text}
              </Text>
              <Text fontSize="sm" color="gray.600">
                <strong>Section:</strong> {deleteQuestion?.sectionName}
              </Text>
              <Text fontSize="xs" color="red.500" mt={2}>
                This will also delete all related answer options and user responses.
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button onClick={onDeleteClose} isDisabled={isDeleting}>Cancel</Button>
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

export default ManagePersonalityTestQuestions;

