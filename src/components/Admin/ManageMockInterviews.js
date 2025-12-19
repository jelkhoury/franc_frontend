import React, { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import { get, post, postForm } from "../../utils/httpServices";
import { BLOB_STORAGE_ENDPOINTS, MOCK_INTERVIEW_ENDPOINTS, USER_ENDPOINTS } from "../../services/apiService";
import {
  Box,
  Text,
  VStack,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Textarea,
  Spinner,
  useToast,
  SimpleGrid,
  Card,
  CardBody,
  HStack,
  useBreakpointValue,
  Flex,
} from "@chakra-ui/react";

const ManageMockInterviews = () => {
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [questionFilter, setQuestionFilter] = useState("all");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [overallComment, setOverallComment] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmittingEvaluation, setIsSubmittingEvaluation] = useState(false);
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const toast = useToast();
  const videoRef = useRef(null);
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Review state per question (can be enhanced with more fields and real save)
  const [reviews, setReviews] = useState({});

  // Function definitions
  const updateReview = (field, value) => {
    setReviews((prev) => ({
      ...prev,
      [currentQuestionIndex]: {
        ...prev[currentQuestionIndex],
        [field]: value,
      },
    }));
  };

  const submitAllEvaluations = async () => {
    if (isSubmittingAll) return;
    
    try {
      setIsSubmittingAll(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setIsSubmittingAll(false);
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Decode token to get evaluator ID
      const tokenData = JSON.parse(atob(token.split(".")[1]));
      const evaluatorId = parseInt(
        tokenData[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ]
      );

      // Prepare evaluations for bulk submission
      const evaluations = selectedInterview.answers
        .map((answer, index) => {
          const review = reviews[index] || {};
          if (review.rating && review.comments) {
            return {
              answerId: answer.answerId,
              rating: parseInt(review.rating),
              comment: review.comments,
            };
          }
          return null;
        })
        .filter((evaluation) => evaluation !== null);

      if (evaluations.length === 0) {
        toast({
          title: "No Evaluations",
          description:
            "Please provide ratings and comments for at least one question",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Submit all evaluations in one request
      const result = await post(
        MOCK_INTERVIEW_ENDPOINTS.EVALUATE_MULTIPLE,
        {
          evaluatorId: evaluatorId,
          evaluations: evaluations,
        },
        { token }
      );
      toast({
        title: "All Evaluations Saved",
        description: result.message,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error submitting evaluations:", error);
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmittingAll(false);
    }
  };

  const submitSingleEvaluation = async (answerId, rating, comment) => {
    if (isSubmittingEvaluation) return;
    
    try {
      setIsSubmittingEvaluation(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setIsSubmittingEvaluation(false);
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Decode token to get evaluator ID
      const tokenData = JSON.parse(atob(token.split(".")[1]));
      const evaluatorId = parseInt(
        tokenData[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ]
      );

      const result = await post(
        MOCK_INTERVIEW_ENDPOINTS.EVALUATE,
        {
          answerId: answerId,
          evaluatorId: evaluatorId,
          rating: rating,
          comment: comment,
        },
        { token }
      );
      toast({
        title: "Evaluation Saved",
        description: result.message,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Return to summary after successful submission
      setEditMode(false);
      setShowSummary(true);
    } catch (error) {
      console.error("Error submitting evaluation:", error);
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmittingEvaluation(false);
    }
  };

  const generateEvaluationReport = async () => {
    if (isGeneratingReport) return;
    
    try {
      setIsGeneratingReport(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setIsGeneratingReport(false);
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Get user ID from the selected interview
      const userId = selectedInterview.userId;
      const answerIds = selectedInterview.answers.map(
        (answer) => answer.answerId
      );

      const report = await post(
        MOCK_INTERVIEW_ENDPOINTS.CREATE_REPORT,
        {
          userId: userId,
          answerIds: answerIds,
          summaryComment: overallComment || null,
        },
        { token }
      );

      // Generate PDF with the report data
      generatePDF(report);

      toast({
        title: "Report Generated",
        description: "Evaluation report has been generated and downloaded",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const generatePDF = (report) => {
    // Create PDF content using jsPDF
    const doc = new jsPDF();

    // Set font
    doc.setFont("helvetica");
    doc.setFontSize(16);

    // Title
    doc.text("Mock Interview Evaluation Report", 105, 20, { align: "center" });

    // Generation date
    doc.setFontSize(10);
    doc.text(
      `Generated on: ${new Date(report.generatedAt).toLocaleString()}`,
      105,
      30,
      { align: "center" }
    );

    // Report Information
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Report Information", 20, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Report ID: ${report.id}`, 20, 60);
    doc.text(`User ID: ${selectedInterview.userId}`, 20, 70);
    doc.text(`Email: ${selectedInterview.email}`, 20, 80);
    doc.text(`Interview: ${selectedInterview.mockInterviewTitle}`, 20, 90);

    // Overall Rating
    doc.setFont("helvetica", "bold");
    doc.text("Overall Rating", 20, 110);
    doc.setFont("helvetica", "normal");
    if (report.overallRating) {
      doc.text(`${report.overallRating.toFixed(1)} / 5.0`, 20, 120);
    } else {
      doc.text("No ratings available", 20, 120);
    }

    // Question Evaluations
    doc.setFont("helvetica", "bold");
    doc.text("Question Evaluations", 20, 140);
    doc.setFont("helvetica", "normal");

    let yPosition = 150;
    report.answers.forEach((answer, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.text(`Question ${index + 1}: ${answer.questionTitle}`, 20, yPosition);
      doc.setFont("helvetica", "normal");

      yPosition += 10;
      doc.text(
        `Rating: ${answer.rating ? `${answer.rating} / 5` : "Not rated"}`,
        20,
        yPosition
      );

      yPosition += 10;
      doc.text(
        `Comment: ${answer.comment || "No comment provided"}`,
        20,
        yPosition
      );

      yPosition += 20;
    });

    // Summary Comment
    if (overallComment) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.text("Summary Comment", 20, yPosition);
      doc.setFont("helvetica", "normal");
      yPosition += 10;

      // Split long comments into multiple lines
      const words = overallComment.split(" ");
      let line = "";
      for (let word of words) {
        const testLine = line + word + " ";
        if (doc.getTextWidth(testLine) > 170) {
          doc.text(line, 20, yPosition);
          yPosition += 5;
          line = word + " ";
        } else {
          line = testLine;
        }
      }
      if (line) {
        doc.text(line, 20, yPosition);
      }
    }

    // Save PDF
    const pdfBlob = doc.output("blob");
    const pdfFile = new File(
      [pdfBlob],
      `evaluation-report-${report.id}-${selectedInterview.email}.pdf`,
      { type: "application/pdf" }
    );

    // Send PDF via email
    sendPDFToUser(pdfFile, selectedInterview.userId);

    // Also download locally
    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `evaluation-report-${report.id}-${selectedInterview.email}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const sendPDFToUser = async (pdfFile, userId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("pdfFile", pdfFile);

      const result = await postForm(USER_ENDPOINTS.SEND_PDF, formData, { token });
      toast({
        title: "PDF Sent",
        description: result.message,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error sending PDF:", error);
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const onNext = () => {
    if (currentQuestionIndex === selectedInterview.answers.length - 1) {
      // Submit all evaluations when going to summary
      submitAllEvaluations();
      setShowSummary(true);
    } else {
      setCurrentQuestionIndex((i) => i + 1);
    }
  };

  const onPrevious = () => {
    if (showSummary) {
      setShowSummary(false);
      setCurrentQuestionIndex(selectedInterview.answers.length - 1);
    } else if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((i) => i - 1);
    }
  };

  // Fetch interviews from API
  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoading(true);
        const data = await get(BLOB_STORAGE_ENDPOINTS.GET_ALL_GROUPED);
        setInterviews(data);
      } catch (err) {
        console.error("Error fetching interviews:", err);
        setError(err.message);
        toast({
          title: "Error loading interviews",
          description: err.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, [toast]);

  useEffect(() => {
    if (selectedInterview) {
      setCurrentQuestionIndex(0);
      setShowSummary(false);
      setEditMode(false);
      setReviews({});
      setOverallComment("");
    }
  }, [selectedInterview]);

  // Force video reload when answer changes
  useEffect(() => {
    if (
      selectedInterview &&
      selectedInterview.answers[currentQuestionIndex] &&
      videoRef.current
    ) {
      videoRef.current.load();
    }
  }, [currentQuestionIndex, selectedInterview]);

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} color="gray.600">
          Loading interviews...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="red.500" fontSize="lg">
          Error: {error}
        </Text>
        <Button
          mt={4}
          colorScheme="blue"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Box>
    );
  }

  if (selectedInterview) {
    if (showSummary) {
      return (
        <Box>
          <Button
            size="sm"
            mb={4}
            onClick={() => {
              setShowSummary(false);
              setCurrentQuestionIndex(selectedInterview.answers.length - 1);
            }}
          >
            ← Back to Last Question
          </Button>
          <Heading color="brand.500" size="md" mb={6}>
            Summary of Reviews for {selectedInterview.email}
          </Heading>
          {/* Desktop Table View */}
          <Box
            display={{ base: "none", md: "block" }}
            overflowX="auto"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
          >
            <Table variant="simple" size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th>#</Th>
                  <Th>Question</Th>
                  <Th>Your Rating</Th>
                  <Th>Your Comments</Th>
                  <Th>Edit</Th>
                </Tr>
              </Thead>
              <Tbody>
                {selectedInterview.answers.map((answer, i) => {
                  const review = reviews[i] || {};
                  return (
                    <Tr key={i}>
                      <Td>{i + 1}</Td>
                      <Td>{answer.questionTitle}</Td>
                      <Td>{review.rating || "-"}</Td>
                      <Td>{review.comments || "-"}</Td>
                      <Td>
                        <Button
                          size="xs"
                          onClick={() => {
                            setCurrentQuestionIndex(i);
                            setShowSummary(false);
                            setEditMode(true);
                          }}
                        >
                          Edit
                        </Button>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>

          {/* Mobile Card View */}
          <SimpleGrid
            columns={{ base: 1 }}
            spacing={4}
            display={{ base: "grid", md: "none" }}
          >
            {selectedInterview.answers.map((answer, i) => {
              const review = reviews[i] || {};
              return (
                <Card key={i} variant="outline">
                  <CardBody>
                    <VStack align="stretch" spacing={3}>
                      <Box>
                        <Text fontSize="xs" color="gray.500">
                          Question #{i + 1}
                        </Text>
                        <Text fontWeight="semibold" fontSize="sm">
                          {answer.questionTitle}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="xs" color="gray.500">
                          Rating
                        </Text>
                        <Text>{review.rating || "-"}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="xs" color="gray.500">
                          Comments
                        </Text>
                        <Text fontSize="sm">{review.comments || "-"}</Text>
                      </Box>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={() => {
                          setCurrentQuestionIndex(i);
                          setShowSummary(false);
                          setEditMode(true);
                        }}
                      >
                        Edit
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              );
            })}
          </SimpleGrid>
          <FormControl mt={6}>
            <FormLabel>Overall Comment</FormLabel>
            <Textarea
              placeholder="Enter overall comments..."
              value={overallComment}
              onChange={(e) => setOverallComment(e.target.value)}
              minHeight="100px"
            />
          </FormControl>
          <Flex direction={{ base: "column", md: "row" }} gap={2} mt={4}>
            <Button
              colorScheme="green"
              onClick={generateEvaluationReport}
              flex={{ base: "1", md: "0 1 auto" }}
              isLoading={isGeneratingReport}
              loadingText="Generating..."
            >
              Generate Report
            </Button>
            <Button
              colorScheme="gray"
              onClick={() => {
                setSelectedInterview(null);
              }}
              flex={{ base: "1", md: "0 1 auto" }}
            >
              Finish Review
            </Button>
          </Flex>
        </Box>
      );
    }

    const currentAnswer = selectedInterview.answers[currentQuestionIndex];
    const currentReview = reviews[currentQuestionIndex] || {};

    // Debug logging
    console.log("Current answer:", currentAnswer);
    console.log("Current question index:", currentQuestionIndex);
    console.log("All answers:", selectedInterview.answers);

    return (
      <Box>
        <Button
          size="sm"
          mb={4}
          onClick={() => {
            if (editMode) {
              setEditMode(false);
              setShowSummary(true);
            } else {
              setSelectedInterview(null);
            }
          }}
        >
          ← {editMode ? "Back to Summary" : "Back to Interviews"}
        </Button>
        <Box
          p={{ base: 4, md: 6 }}
          borderWidth="1px"
          borderRadius="md"
          bg="white"
        >
          <Text fontWeight="bold" mb={2}>
            {editMode
              ? "Edit Evaluation"
              : `Question ${currentQuestionIndex + 1} of ${
                  selectedInterview.answers.length
                }`}
            : {currentAnswer.questionTitle}
          </Text>
          <Box display="flex" justifyContent="center" my={2}>
            <Box
              as="video"
              ref={videoRef}
              width={{ base: "100%", md: "600px" }}
              maxW="100%"
              controls
              key={currentAnswer.answerId}
              borderRadius="md"
            >
              <source src={currentAnswer.videoUrl} type="video/webm" />
              Your browser does not support the video tag.
            </Box>
          </Box>
          <Text fontSize="sm" color="gray.500" textAlign="center" mt={2}>
            Video URL: {currentAnswer.videoUrl}
          </Text>
          <FormControl mt={4}>
            <FormLabel>Rating (1-5)</FormLabel>
            <Select
              placeholder="Select rating"
              value={currentReview.rating || ""}
              onChange={(e) => updateReview("rating", e.target.value)}
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </Select>
          </FormControl>
          <FormControl mt={4}>
            <FormLabel>Comments</FormLabel>
            <Input
              placeholder="Add comments"
              value={currentReview.comments || ""}
              onChange={(e) => updateReview("comments", e.target.value)}
            />
          </FormControl>

          {editMode ? (
            <Box mt={6} display="flex" justifyContent="center">
              <Button
                colorScheme="blue"
                onClick={() => {
                  const currentReview = reviews[currentQuestionIndex] || {};
                  if (currentReview.rating && currentReview.comments) {
                    submitSingleEvaluation(
                      currentAnswer.answerId,
                      parseInt(currentReview.rating),
                      currentReview.comments
                    );
                  } else {
                    toast({
                      title: "Missing Information",
                      description:
                        "Please provide both rating and comments before submitting",
                      status: "warning",
                      duration: 3000,
                      isClosable: true,
                    });
                  }
                }}
                isLoading={isSubmittingEvaluation}
                loadingText="Submitting..."
              >
                Submit Evaluation
              </Button>
            </Box>
          ) : (
            <Flex
              mt={6}
              direction={{ base: "column", md: "row" }}
              gap={2}
              justify="space-between"
              align="stretch"
            >
              <Button
                onClick={onPrevious}
                isDisabled={currentQuestionIndex === 0}
                flex={{ base: "1", md: "0 1 auto" }}
              >
                ← Previous
              </Button>
              <Button
                colorScheme="green"
                onClick={onNext}
                flex={{ base: "1", md: "0 1 auto" }}
                isLoading={isSubmittingAll && currentQuestionIndex === selectedInterview.answers.length - 1}
                loadingText="Saving..."
              >
                {currentQuestionIndex === selectedInterview.answers.length - 1
                  ? "Summary →"
                  : "Next →"}
              </Button>
            </Flex>
          )}
        </Box>
      </Box>
    );
  }

  const filteredInterviews = interviews.filter((interview) => {
    const matchesSearch =
      interview.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.mockInterviewTitle
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    let matchesFilter = true;
    if (questionFilter === "1") {
      matchesFilter = interview.answers.length === 1;
    } else if (questionFilter === "2+") {
      matchesFilter = interview.answers.length >= 2;
    }
    return matchesSearch && matchesFilter;
  });

  return (
    <VStack align="stretch" spacing={6}>
      <Heading color="brand.500" size="lg" mb={6}>
        Submitted Interviews
      </Heading>
      <VStack spacing={4} align="stretch" mb={4}>
        <Input
          placeholder="Search by email or interview title"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select
          value={questionFilter}
          onChange={(e) => setQuestionFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="1">1 question</option>
          <option value="2+">2+ questions</option>
        </Select>
      </VStack>

      {/* Desktop Table View */}
      <Box
        display={{ base: "none", md: "block" }}
        overflowX="auto"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="md"
      >
        <Table variant="simple">
          <Thead bg="gray.50">
            <Tr>
              <Th>Email</Th>
              <Th>Interview</Th>
              <Th>Questions Count</Th>
              <Th>Replays Used</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredInterviews.map((interview, index) => (
              <Tr key={index}>
                <Td fontWeight="bold">{interview.email}</Td>
                <Td>{interview.mockInterviewTitle}</Td>
                <Td>{interview.answers.length}</Td>
                <Td>
                  <Text
                    fontWeight="semibold"
                    color={interview.nbOfTry > 0 ? "orange.500" : "green.500"}
                  >
                    {interview.nbOfTry || 0}
                  </Text>
                </Td>
                <Td>
                  <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={() => setSelectedInterview(interview)}
                  >
                    Review
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Mobile Card View */}
      <SimpleGrid
        columns={{ base: 1 }}
        spacing={4}
        display={{ base: "grid", md: "none" }}
      >
        {filteredInterviews.map((interview, index) => (
          <Card key={index} variant="outline">
            <CardBody>
              <VStack align="stretch" spacing={3}>
                <Box>
                  <Text fontSize="xs" color="gray.500">
                    Email
                  </Text>
                  <Text fontWeight="bold" fontSize="sm">
                    {interview.email}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500">
                    Interview
                  </Text>
                  <Text fontSize="sm">{interview.mockInterviewTitle}</Text>
                </Box>
                <HStack justify="space-between">
                  <Box>
                    <Text fontSize="xs" color="gray.500">
                      Questions
                    </Text>
                    <Text fontWeight="semibold">
                      {interview.answers.length}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.500">
                      Replays
                    </Text>
                    <Text
                      fontWeight="semibold"
                      color={interview.nbOfTry > 0 ? "orange.500" : "green.500"}
                    >
                      {interview.nbOfTry || 0}
                    </Text>
                  </Box>
                </HStack>
                <Button
                  colorScheme="blue"
                  size="sm"
                  width="100%"
                  onClick={() => setSelectedInterview(interview)}
                >
                  Review
                </Button>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </VStack>
  );
};

export default ManageMockInterviews;
