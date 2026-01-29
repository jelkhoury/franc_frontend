import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  VStack,
  Input,
  Button,
  Text,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
} from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { get } from "../../../utils/httpServices";
import { JOB_COMPARISON_ENDPOINTS } from "../../../services/apiService";

const JobComparisonSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [jobAName, setJobAName] = useState("");
  const [jobBName, setJobBName] = useState("");
  const [loading, setLoading] = useState(false);
  const [criteria, setCriteria] = useState([]);

  const cardBg = useColorModeValue("white", "gray.800");

  // Pre-fill job names when resuming (e.g. from "Continue" when check had no criteria)
  useEffect(() => {
    const s = location.state;
    if (s?.jobAName) setJobAName(String(s.jobAName));
    if (s?.jobBName) setJobBName(String(s.jobBName));
  }, [location.state]);

  const handleBegin = async () => {
    // Validation
    if (!jobAName.trim() || !jobBName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter names for both jobs.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);

    try {
      // Try to fetch criteria from API, fallback to demo data
      let fetchedCriteria = [];
      fetchedCriteria = await get(JOB_COMPARISON_ENDPOINTS.GET_CRITERIA);
      // Map backend response to frontend format if needed
      if (fetchedCriteria && fetchedCriteria.length > 0) {
        // Backend returns criteria with Id, Name, Section, Category, Description, DisplayOrder
        // Frontend expects id, name, section, category, description
        fetchedCriteria = fetchedCriteria.map(c => ({
          id: c.id || c.Id,
          name: c.name || c.Name,
          section: c.section || c.Section,
          category: c.category || c.Category,
          description: c.description || c.Description,
        }));
      }

      // Navigate to first question with job names in state
      if (fetchedCriteria.length > 0) {
        const existingId = location.state?.jobComparisonId ?? 0;
        navigate(`/job-comparison/question/${fetchedCriteria[0].id}`, {
          state: {
            jobAName: jobAName.trim(),
            jobBName: jobBName.trim(),
            criteria: fetchedCriteria,
            jobComparisonId: existingId,
          }
        });
      } else {
        toast({
          title: "Error",
          description: "No criteria available. Please try again later.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error starting comparison:", error);
      toast({
        title: "Error",
        description: "Failed to start comparison. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50" py={8}>
      <Box maxW="800px" mx="auto" px={6}>
        <Box bg={cardBg} rounded="xl" shadow="lg" p={8}>
          <Heading color="brand.500" size="lg" mb={6} textAlign="center">
            Job Comparison Setup
          </Heading>

          <Text color="gray.600" mb={6} textAlign="center">
            Enter the names of the two jobs you want to compare. You'll then
            rate each job across multiple criteria.
          </Text>

          <VStack spacing={6} align="stretch">
            <Box>
              <Text fontWeight="semibold" mb={2} color="gray.700">
                Job A
              </Text>
              <Input
                placeholder="e.g., Software Engineer at Google"
                value={jobAName}
                onChange={(e) => setJobAName(e.target.value)}
                size="lg"
                isDisabled={loading}
              />
            </Box>

            <Box>
              <Text fontWeight="semibold" mb={2} color="gray.700">
                Job B
              </Text>
              <Input
                placeholder="e.g., Product Manager at Microsoft"
                value={jobBName}
                onChange={(e) => setJobBName(e.target.value)}
                size="lg"
                isDisabled={loading}
              />
            </Box>

            <Button
              onClick={handleBegin}
              colorScheme="blue"
              size="lg"
              isLoading={loading}
              loadingText="Starting..."
              isDisabled={!jobAName.trim() || !jobBName.trim()}
            >
              Begin Comparison
            </Button>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};


export default JobComparisonSetup;
