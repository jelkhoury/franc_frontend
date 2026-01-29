import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Heading,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  VStack,
  HStack,
  Text,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Icon,
  Button,
  useToast,
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaChartBar, FaBrain, FaHeart, FaTrophy, FaFileExcel } from "react-icons/fa";
import ScoreComparisonChart from "./components/ScoreComparisonChart";
import CriterionBreakdownTable from "./components/CriterionBreakdownTable";
import RadarChart from "./components/RadarChart";
import { JOB_COMPARISON_ENDPOINTS } from "../../../services/apiService";
import { getStoredToken } from "../../../utils/tokenUtils";

const JobComparisonResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [criteria, setCriteria] = useState([]);
  const [jobAName, setJobAName] = useState("");
  const [jobBName, setJobBName] = useState("");
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [jobComparisonId, setJobComparisonId] = useState(0);
  const [exporting, setExporting] = useState(false);
  const toast = useToast();

  const cardBg = useColorModeValue("white", "gray.800");

  useEffect(() => {
    if (!location.state?.criteria?.length) {
      navigate("/job-comparison/setup", { replace: true });
      return;
    }
    setJobAName(location.state.jobAName || "");
    setJobBName(location.state.jobBName || "");
    setCriteria(location.state.criteria);
    setAnswers(location.state.answers || {});
    setJobComparisonId(location.state.jobComparisonId || 0);
    setLoading(false);
  }, [location.state, navigate]);

  // When on results, browser back should go to home page
  useEffect(() => {
    const handlePopState = () => {
      navigate("/", { replace: true });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate]);

  // Calculate scores (hidden logic)
  const { overall, head, heart } = useMemo(() => {
    const headCriteria = criteria.filter((c) => c.category === "HEAD");
    const heartCriteria = criteria.filter((c) => c.category === "HEART");

    const calculate = (criteriaList) => {
      let totalWeightA = 0;
      let totalWeightB = 0;
      let totalWeight = 0;

      // Match backend Excel: iterate answers ordered by CriterionId, treat N/A as 0,0,0
      // Backend does: comparison.Answers.OrderBy(x => x.CriterionId)
      // CRITICAL: Only iterate answers that exist (like backend), filter by category for this calculation
      const answerEntries = Object.entries(answers)
        .map(([idStr, answer]) => {
          const criterionId = parseInt(idStr, 10);
          if (isNaN(criterionId)) return null;
          
          // Filter by category (HEAD/HEART/overall)
          const criterion = criteriaList.find(c => c.id === criterionId);
          if (!criterion) return null;
          
          return { criterionId, answer };
        })
        .filter(Boolean)
        .sort((a, b) => a.criterionId - b.criterionId); // OrderBy CriterionId like backend

      answerEntries.forEach(({ answer }) => {
        // Backend reads: a.Weight, a.ScoreA, a.ScoreB, a.NotApplicable
        // Use Number() to ensure we get actual numbers, not strings
        let weight = Number(answer.weight) || 0;
        let scoreA = Number(answer.scoreA) || 0;
        let scoreB = Number(answer.scoreB) || 0;
        
        // Backend logic: if NotApplicable, force zeros (contributes 0 to totals)
        // Backend code: if (a.NotApplicable) { weight=0; scoreA=0; scoreB=0; }
        if (answer.notApplicable) {
          weight = 0;
          scoreA = 0;
          scoreB = 0;
        }

        // Backend writes to Excel: B=weight, C=scoreA, E=scoreB
        // Excel formulas: D = B*C (weight * scoreA), F = B*E (weight * scoreB)
        // Excel TOTAL = SUM(D column), SUM(F column)
        // IMPORTANT: Include ALL answers, even if scoreA=0 or scoreB=0 (they contribute 0 to that job's total)
        const weightedA = weight * scoreA;
        const weightedB = weight * scoreB;
        
        totalWeightA += weightedA;
        totalWeightB += weightedB;
        
        // Only count weight for normalization if it's a valid answer
        if (weight > 0 && scoreA > 0 && scoreB > 0) {
          totalWeight += weight;
        }
      });

      // Normalize to 0-100 scale: (weightedSum / totalWeight) * 20
      // Max possible: (5 * 5) / 5 * 20 = 100
      const scoreA =
        totalWeight > 0 ? (totalWeightA / totalWeight) * 20 : 0;
      const scoreB =
        totalWeight > 0 ? (totalWeightB / totalWeight) * 20 : 0;

      return {
        scoreA: Math.round(scoreA * 10) / 10,
        scoreB: Math.round(scoreB * 10) / 10,
      };
    };

    return {
      overall: calculate(criteria),
      head: calculate(headCriteria),
      heart: calculate(heartCriteria),
    };
  }, [criteria, answers]);

  const handleExportExcel = async () => {
    if (!jobComparisonId) {
      toast({
        title: "Error",
        description: "No comparison ID found. Please save your comparison first.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setExporting(true);
    try {
      const token = getStoredToken();
      const url = JOB_COMPARISON_ENDPOINTS.EXPORT_EXCEL(jobComparisonId);
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

      // Get the Excel URL from response header
      const excelUrl = response.headers.get("X-Excel-Url");

      // Download the file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `Job Comparison Scorecard - ${jobAName} vs ${jobBName}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: "Success",
        description: excelUrl
          ? "Excel file downloaded and saved to cloud storage."
          : "Excel file downloaded successfully.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error exporting Excel:", error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export Excel file. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Box
        minH="100vh"
        bg="gray.50"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Spinner size="xl" color="blue.500" />
      </Box>
    );
  }

  if (criteria.length === 0) {
    return (
      <Box minH="100vh" bg="gray.50" py={8}>
        <Box maxW="1400px" mx="auto" px={6}>
          <Alert status="error">
            <AlertIcon />
            No data available. Please start a new comparison.
          </Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50" py={8}>
      <Box maxW="1400px" mx="auto" px={6}>
        <VStack spacing={4} mb={8}>
          <Icon as={FaTrophy} color="brand.500" boxSize={10} />
          <Heading textAlign="center" color="brand.500">
            Job Comparison Results
          </Heading>
          <HStack spacing={4} mt={4}>
            <Button
              leftIcon={<Icon as={FaFileExcel} />}
              colorScheme="green"
              size="lg"
              onClick={handleExportExcel}
              isLoading={exporting}
              loadingText="Exporting..."
            >
              Save as Excel
            </Button>
          </HStack>
        </VStack>

        <Box bg={cardBg} rounded="xl" shadow="lg" p={6}>
          <Tabs>
            <TabList>
              <Tab>
                <HStack spacing={2}>
                  <Icon as={FaChartBar} />
                  <Text>Overall Score</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <Icon as={FaBrain} />
                  <Text>HEAD Score</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <Icon as={FaHeart} />
                  <Text>HEART Score</Text>
                </HStack>
              </Tab>
            </TabList>

            <TabPanels>
              {/* Overall Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <ScoreComparisonChart
                    scoreA={overall.scoreA}
                    scoreB={overall.scoreB}
                    labelA={jobAName}
                    labelB={jobBName}
                    title="Overall Comparison"
                  />
                  <CriterionBreakdownTable
                    criteria={criteria}
                    answers={answers}
                    jobAName={jobAName}
                    jobBName={jobBName}
                    category="all"
                  />
                </VStack>
              </TabPanel>

              {/* HEAD Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <ScoreComparisonChart
                    scoreA={head.scoreA}
                    scoreB={head.scoreB}
                    labelA={jobAName}
                    labelB={jobBName}
                    title="HEAD Comparison (Rational Factors)"
                  />
                  <CriterionBreakdownTable
                    criteria={criteria}
                    answers={answers}
                    jobAName={jobAName}
                    jobBName={jobBName}
                    category="HEAD"
                  />
                </VStack>
              </TabPanel>

              {/* HEART Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <ScoreComparisonChart
                    scoreA={heart.scoreA}
                    scoreB={heart.scoreB}
                    labelA={jobAName}
                    labelB={jobBName}
                    title="HEART Comparison (Emotional Factors)"
                  />
                  <CriterionBreakdownTable
                    criteria={criteria}
                    answers={answers}
                    jobAName={jobAName}
                    jobBName={jobBName}
                    category="HEART"
                  />
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Box>
    </Box>
  );
};

export default JobComparisonResults;
