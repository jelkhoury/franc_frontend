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
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaChartBar, FaBrain, FaHeart, FaTrophy } from "react-icons/fa";
import ScoreComparisonChart from "./components/ScoreComparisonChart";
import CriterionBreakdownTable from "./components/CriterionBreakdownTable";
import RadarChart from "./components/RadarChart";
import { JOB_COMPARISON_ENDPOINTS } from "../../../services/apiService";

const JobComparisonResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [criteria, setCriteria] = useState([]);
  const [jobAName, setJobAName] = useState("");
  const [jobBName, setJobBName] = useState("");
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [jobComparisonId, setJobComparisonId] = useState(0);

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

  // Calculate scores - "Not Fair" (includes all criteria, even if only one job is N/A)
  const { overall: overallNotFair, head: headNotFair, heart: heartNotFair } = useMemo(() => {
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
        // Backend reads: a.Weight, a.ScoreA, a.ScoreB, a.NotApplicableA, a.NotApplicableB
        // Use Number() to ensure we get actual numbers, not strings
        let weight = Number(answer.weight) || 0;
        let scoreA = Number(answer.scoreA) || 0;
        let scoreB = Number(answer.scoreB) || 0;
        const naA = answer.notApplicableA ?? answer.notApplicable;
        const naB = answer.notApplicableB ?? answer.notApplicable;

        // When a job is N/A for this criterion, that job's score is 0
        if (naA) scoreA = 0;
        if (naB) scoreB = 0;
        // When both jobs are N/A, weight is 0 (criterion excluded from totals)
        if (answer.notApplicable || (naA && naB)) {
          weight = 0;
        }

        // Backend writes to Excel: B=weight, C=scoreA, E=scoreB
        // Excel formulas: D = B*C (weight * scoreA), F = B*E (weight * scoreB)
        // Excel TOTAL = SUM(D column), SUM(F column)
        // IMPORTANT: Include ALL answers, even if scoreA=0 or scoreB=0 (they contribute 0 to that job's total)
        const weightedA = weight * scoreA;
        const weightedB = weight * scoreB;
        
        totalWeightA += weightedA;
        totalWeightB += weightedB;
        
        // Only count weight for normalization if it's a valid answer (weight > 0 and both scores are defined/answered)
        // Note: scoreA=0 or scoreB=0 are valid ratings and should be included
        if (weight > 0 && (answer.scoreA !== null && answer.scoreA !== undefined) && (answer.scoreB !== null && answer.scoreB !== undefined)) {
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

  // Calculate scores - "Fair" (only includes criteria where both jobs are answered OR both are N/A)
  const { overall: overallFair, head: headFair, heart: heartFair } = useMemo(() => {
    const headCriteria = criteria.filter((c) => c.category === "HEAD");
    const heartCriteria = criteria.filter((c) => c.category === "HEART");

    const calculate = (criteriaList) => {
      let totalWeightA = 0;
      let totalWeightB = 0;
      let totalWeight = 0;

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
        .sort((a, b) => a.criterionId - b.criterionId);

      answerEntries.forEach(({ answer }) => {
        const naA = answer.notApplicableA ?? answer.notApplicable;
        const naB = answer.notApplicableB ?? answer.notApplicable;
        
        // For "Fair" calculation: exclude criteria where only one job is N/A
        // Only include if: both answered OR both N/A
        const onlyOneNA = (naA && !naB) || (!naA && naB);
        if (onlyOneNA) {
          return; // Skip this criterion - it's not fair
        }

        let weight = Number(answer.weight) || 0;
        let scoreA = Number(answer.scoreA) || 0;
        let scoreB = Number(answer.scoreB) || 0;

        // When a job is N/A for this criterion, that job's score is 0
        if (naA) scoreA = 0;
        if (naB) scoreB = 0;
        // When both jobs are N/A, weight is 0 (criterion excluded from totals)
        if (answer.notApplicable || (naA && naB)) {
          weight = 0;
        }

        const weightedA = weight * scoreA;
        const weightedB = weight * scoreB;
        
        totalWeightA += weightedA;
        totalWeightB += weightedB;
        
        // Only count weight for normalization if it's a valid answer (weight > 0 and both scores are defined/answered)
        // Note: scoreA=0 or scoreB=0 are valid ratings and should be included
        if (weight > 0 && (answer.scoreA !== null && answer.scoreA !== undefined) && (answer.scoreB !== null && answer.scoreB !== undefined)) {
          totalWeight += weight;
        }
      });

      // Normalize to 0-100 scale: (weightedSum / totalWeight) * 20
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
        </VStack>

        <Box bg={cardBg} rounded="xl" shadow="lg" p={6}>
          <Tabs>
            <TabList>
              <Tab>
                <Text fontWeight="semibold">Result Not Fair</Text>
              </Tab>
              <Tab>
                <Text fontWeight="semibold">Result Fair</Text>
              </Tab>
            </TabList>

            <TabPanels>
              {/* Result Not Fair Tab */}
              <TabPanel>
                <Box mb={4}>
                  <Text fontSize="md" color="blue.500">
                    The "Not Fair" result includes all criteria in the comparison, even when only one job is marked as Not Applicable (N/A) for a criterion. This calculation may not provide a fair comparison when criteria don't apply equally to both jobs.
                  </Text>
                </Box>
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
                          scoreA={overallNotFair.scoreA}
                          scoreB={overallNotFair.scoreB}
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
                        <Box mb={2}>
                          <Text fontSize="sm" color="gray.600" fontStyle="italic">
                            Head Comparison: A choice made primarily using logic, reasoning, and objective analysis, with minimal influence from emotions.
                          </Text>
                        </Box>
                        <ScoreComparisonChart
                          scoreA={headNotFair.scoreA}
                          scoreB={headNotFair.scoreB}
                          labelA={jobAName}
                          labelB={jobBName}
                          title="HEAD Comparison"
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
                        <Box mb={2}>
                          <Text fontSize="sm" color="gray.600" fontStyle="italic">
                            Heart Comparison: A choice made primarily based on emotions, intuition, personal values, or feelings.
                          </Text>
                        </Box>
                        <ScoreComparisonChart
                          scoreA={heartNotFair.scoreA}
                          scoreB={heartNotFair.scoreB}
                          labelA={jobAName}
                          labelB={jobBName}
                          title="HEART Comparison"
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
              </TabPanel>

              {/* Result Fair Tab */}
              <TabPanel>
                <Box mb={4}>
                  <Text fontSize="md" color="blue.500">
                    The "Fair" result only includes criteria where both jobs have been answered or both are marked as Not Applicable (N/A). This provides a more equitable comparison by excluding criteria that don't apply equally to both jobs.
                  </Text>
                </Box>
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
                          scoreA={overallFair.scoreA}
                          scoreB={overallFair.scoreB}
                          labelA={jobAName}
                          labelB={jobBName}
                          title="Overall Comparison (Fair)"
                        />
                        <CriterionBreakdownTable
                          criteria={criteria}
                          answers={answers}
                          jobAName={jobAName}
                          jobBName={jobBName}
                          category="all"
                          fairMode={true}
                        />
                      </VStack>
                    </TabPanel>

                    {/* HEAD Tab */}
                    <TabPanel>
                      <VStack spacing={6} align="stretch">
                        <Box mb={2}>
                          <Text fontSize="sm" color="gray.600" fontStyle="italic">
                            Head Comparison: A choice made primarily using logic, reasoning, and objective analysis, with minimal influence from emotions.
                          </Text>
                        </Box>
                        <ScoreComparisonChart
                          scoreA={headFair.scoreA}
                          scoreB={headFair.scoreB}
                          labelA={jobAName}
                          labelB={jobBName}
                          title="HEAD Comparison (Fair)"
                        />
                        <CriterionBreakdownTable
                          criteria={criteria}
                          answers={answers}
                          jobAName={jobAName}
                          jobBName={jobBName}
                          category="HEAD"
                          fairMode={true}
                        />
                      </VStack>
                    </TabPanel>

                    {/* HEART Tab */}
                    <TabPanel>
                      <VStack spacing={6} align="stretch">
                        <Box mb={2}>
                          <Text fontSize="sm" color="gray.600" fontStyle="italic">
                            Heart Comparison: A choice made primarily based on emotions, intuition, personal values, or feelings.
                          </Text>
                        </Box>
                        <ScoreComparisonChart
                          scoreA={heartFair.scoreA}
                          scoreB={heartFair.scoreB}
                          labelA={jobAName}
                          labelB={jobBName}
                          title="HEART Comparison (Fair)"
                        />
                        <CriterionBreakdownTable
                          criteria={criteria}
                          answers={answers}
                          jobAName={jobAName}
                          jobBName={jobBName}
                          category="HEART"
                          fairMode={true}
                        />
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Box>
    </Box>
  );
};

export default JobComparisonResults;
