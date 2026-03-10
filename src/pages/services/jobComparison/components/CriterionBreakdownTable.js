import React, { useMemo } from "react";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableContainer,
  Text,
  useColorModeValue,
  HStack,
  Icon,
  Badge,
  Tooltip,
} from "@chakra-ui/react";
import { FaBan, FaBrain, FaHeart, FaTrophy, FaListUl, FaWeightHanging, FaChartLine } from "react-icons/fa";
import CategoryBadge from "./CategoryBadge";

// Helper function to clean criterion names
const cleanCriterionName = (str) => {
  if (!str) return str;
  // Remove ", if any" or "if any" phrase (case insensitive)
  let cleaned = str.replace(/,\s*if any\b/gi, '').replace(/\bif any\b/gi, '').trim();
  // Clean up extra spaces and trailing commas
  cleaned = cleaned.replace(/\s+/g, ' ').replace(/,\s*$/, '').trim();
  return cleaned;
};

const CriterionBreakdownTable = ({
  criteria,
  answers,
  jobAName,
  jobBName,
  category = "all",
  fairMode = false,
}) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headerBg = useColorModeValue("blue.50", "blue.900");
  const totalRowBg = useColorModeValue("blue.100", "blue.800");
  const naRowBg = useColorModeValue("orange.50", "orange.900");
  const stripedEven = useColorModeValue("gray.50", "gray.700");
  const rowHoverBg = useColorModeValue("blue.50", "gray.600");
  const headerText = useColorModeValue("blue.800", "blue.100");
  const totalText = useColorModeValue("blue.900", "blue.50");
  const weightedScoreColor = useColorModeValue("blue.600", "blue.300");
  const headingColor = useColorModeValue("gray.800", "gray.100");

  // Filter criteria by category and build rows with weighted scores
  const rows = useMemo(() => {
    const list =
      category === "all"
        ? criteria
        : criteria.filter((c) => c.category === category);

    const getRowData = (criterion) => {
      const answer = answers[criterion.id];
      if (!answer) return null;

      const naA = answer.notApplicableA ?? answer.notApplicable;
      const naB = answer.notApplicableB ?? answer.notApplicable;
      const bothNA = (naA && naB) || answer.notApplicable;
      const onlyOneNA = (naA && !naB) || (!naA && naB);

      // In fair mode: if only one job is N/A, show the row as both N/A (display only, not calculated)
      if (fairMode && onlyOneNA) {
        return {
          criterion: cleanCriterionName(criterion.name),
          category: criterion.category || "—",
          notApplicable: true,
          fairModeExcluded: true, // shown but not in totals
        };
      }

      if (bothNA) {
        return {
          criterion: cleanCriterionName(criterion.name),
          category: criterion.category || "—",
          notApplicable: true,
        };
      }

      const { weight, scoreA, scoreB } = answer;
      if (weight <= 0) return null;
      // Allow scoreA=0 or scoreB=0 (e.g. not applicable for one job only)
      const sA = Number(scoreA) || 0;
      const sB = Number(scoreB) || 0;
      if (sA <= 0 && sB <= 0) return null;

      const weightedA = weight * sA;
      const weightedB = weight * sB;
      return {
        criterion: cleanCriterionName(criterion.name),
        category: criterion.category || "—",
        weight,
        scoreA: sA,
        scoreB: sB,
        weightedA,
        weightedB,
        notApplicable: false,
        notApplicableA: answer.notApplicableA,
        notApplicableB: answer.notApplicableB,
      };
    };

    return list.map(getRowData).filter((row) => row !== null);
  }, [criteria, category, answers, fairMode]);

  // Totals: match backend Excel calculation exactly - iterate answers ordered by CriterionId, treat N/A as 0,0,0
  const { totalWeightedA, totalWeightedB } = useMemo(() => {
    let sumA = 0;
    let sumB = 0;
    
    // Backend iterates: comparison.Answers.OrderBy(x => x.CriterionId)
    // CRITICAL: Only iterate answers that exist (like backend), not all criteria
    // Filter by category AFTER getting all answers (for table display), but calculation should match backend
    const answerEntries = Object.entries(answers)
      .map(([idStr, answer]) => {
        const criterionId = parseInt(idStr, 10);
        if (isNaN(criterionId)) return null;
        
        // For category filtering (table display), check if criterion matches
        if (category !== "all") {
          const criterion = criteria.find(c => c.id === criterionId);
          if (!criterion || criterion.category !== category) return null;
        }
        
        return { criterionId, answer };
      })
      .filter(Boolean)
      .sort((a, b) => a.criterionId - b.criterionId); // OrderBy CriterionId like backend
    
    answerEntries.forEach(({ answer }) => {
      const naA = answer.notApplicableA ?? answer.notApplicable;
      const naB = answer.notApplicableB ?? answer.notApplicable;
      const bothNA = (naA && naB) || answer.notApplicable;
      
      // In fair mode: exclude criteria where only one job is N/A
      if (fairMode) {
        const onlyOneNA = (naA && !naB) || (!naA && naB);
        if (onlyOneNA) {
          return; // Skip this criterion - it's not fair
        }
      }
      
      // Backend reads: a.Weight, a.ScoreA, a.ScoreB, a.NotApplicableA, a.NotApplicableB
      let weight = Number(answer.weight) || 0;
      let scoreA = Number(answer.scoreA) || 0;
      let scoreB = Number(answer.scoreB) || 0;
      
      if (bothNA) {
        weight = 0;
        scoreA = 0;
        scoreB = 0;
      } else {
        if (naA) scoreA = 0;
        if (naB) scoreB = 0;
      }
      
      // Backend writes to Excel: B=weight, C=scoreA, E=scoreB
      // Excel formulas: D = B*C (weight * scoreA), F = B*E (weight * scoreB)
      // Excel TOTAL = SUM(D column), SUM(F column)
      // IMPORTANT: Include ALL answers, even if scoreA=0 or scoreB=0 (they contribute 0 to that job's total)
      const weightedA = weight * scoreA;
      const weightedB = weight * scoreB;
      
      sumA += weightedA;
      sumB += weightedB;
    });
    
    return {
      totalWeightedA: sumA,
      totalWeightedB: sumB,
    };
  }, [criteria, category, answers, fairMode]);

  return (
    <Box bg={cardBg} rounded="xl" shadow="md" p={6}>
      <HStack mb={4} spacing={3}>
        <Icon as={FaChartLine} color="blue.500" boxSize={6} />
        <Text fontSize="lg" fontWeight="bold" color={headingColor}>
          Detailed Breakdown
        </Text>
      </HStack>
      <TableContainer
        borderRadius="lg"
        overflowX="visible"
        overflowY="visible"
        borderWidth="1px"
        borderColor={borderColor}
        maxW="100%"
      >
        <Table variant="simple" size="sm" width="100%" sx={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "42%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "6%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "12%" }} />
          </colgroup>
          <Thead bg={headerBg}>
            <Tr>
              <Th borderColor={borderColor} color={headerText} whiteSpace="normal" lineHeight="tall" py={2} px={1}>
                <HStack spacing={1} flexWrap="wrap">
                  <Icon as={FaListUl} boxSize={3.5} flexShrink={0} />
                  <span>Criterion</span>
                </HStack>
              </Th>
              <Th borderColor={borderColor} color={headerText} whiteSpace="normal" py={2} px={1}>
                <HStack spacing={1}>
                  <Icon as={FaBrain} boxSize={3} opacity={0.8} />
                  <Icon as={FaHeart} boxSize={2.5} opacity={0.8} />
                  <span>Category</span>
                </HStack>
              </Th>
              <Th borderColor={borderColor} isNumeric color={headerText} py={2} px={1}>
                <Tooltip label="Importance 1–5" hasArrow placement="top">
                  <HStack spacing={1} justify="flex-end" as="span" cursor="help">
                    <Icon as={FaWeightHanging} boxSize={3.5} />
                    <span>Weight</span>
                  </HStack>
                </Tooltip>
              </Th>
              <Th borderColor={borderColor} isNumeric color={headerText} whiteSpace="normal" py={2} px={1}>
                {jobAName || "Job A"} Score
              </Th>
              <Th borderColor={borderColor} isNumeric color={headerText} whiteSpace="normal" py={2} px={1}>
                {jobBName || "Job B"} Score
              </Th>
              <Th borderColor={borderColor} isNumeric color={headerText} whiteSpace="normal" py={2} px={1}>
                {jobAName || "Job A"} Wtd
              </Th>
              <Th borderColor={borderColor} isNumeric color={headerText} whiteSpace="normal" py={2} px={1}>
                {jobBName || "Job B"} Wtd
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {rows.length === 0 ? (
              <Tr>
                <Td colSpan={7} textAlign="center" color="gray.500" py={8}>
                  No data available
                </Td>
              </Tr>
            ) : (
              rows.map((row, index) => (
                <Tr
                  key={index}
                  bg={row.notApplicable ? naRowBg : index % 2 === 1 ? stripedEven : undefined}
                  _hover={!row.notApplicable ? { bg: rowHoverBg } : undefined}
                  transition="background 0.15s"
                >
                  <Td
                    borderColor={borderColor}
                    fontWeight={row.notApplicable ? "medium" : "normal"}
                    whiteSpace="normal"
                    wordBreak="break-word"
                    py={2}
                    px={1}
                  >
                    {row.notApplicable ? (
                      <HStack spacing={2} flexWrap="wrap">
                        <Text>{row.criterion}</Text>
                        <Badge colorScheme="orange" variant="subtle" display="inline-flex" alignItems="center" gap={1.5} px={2} py={0.5} borderRadius="md" fontSize="xs">
                          <Icon as={FaBan} boxSize={2.5} />
                          N/A
                        </Badge>
                      </HStack>
                    ) : (
                      row.criterion
                    )}
                  </Td>
                  <Td borderColor={borderColor} py={2} px={1} whiteSpace="normal">
                    {row.notApplicable ? (
                      "—"
                    ) : (
                      <CategoryBadge category={row.category} />
                    )}
                  </Td>
                  {row.notApplicable ? (
                    <Td colSpan={5} borderColor={borderColor} textAlign="center" py={2} px={1}>
                      <Badge colorScheme="orange" variant="subtle" fontSize="xs" px={2} py={0.5} borderRadius="md" display="inline-flex">
                        Not applicable
                      </Badge>
                    </Td>
                  ) : (
                    <>
                      <Td borderColor={borderColor} isNumeric py={2} px={1}>
                        <Badge colorScheme="gray" variant="subtle" fontSize="sm">
                          {row.weight}
                        </Badge>
                      </Td>
                      <Td borderColor={borderColor} isNumeric fontWeight="medium" py={2} px={1}>
                        {row.notApplicableA ? (
                          <Badge colorScheme="orange" variant="subtle" fontSize="xs" px={2} py={0.5} borderRadius="md">
                            N/A
                          </Badge>
                        ) : (
                          row.scoreA
                        )}
                      </Td>
                      <Td borderColor={borderColor} isNumeric fontWeight="medium" py={2} px={1}>
                        {row.notApplicableB ? (
                          <Badge colorScheme="orange" variant="subtle" fontSize="xs" px={2} py={0.5} borderRadius="md">
                            N/A
                          </Badge>
                        ) : (
                          row.scoreB
                        )}
                      </Td>
                      <Td borderColor={borderColor} isNumeric fontWeight="semibold" color={weightedScoreColor} py={2} px={1}>
                        {typeof row.weightedA === "number"
                          ? row.weightedA.toFixed(1)
                          : row.weightedA}
                      </Td>
                      <Td borderColor={borderColor} isNumeric fontWeight="semibold" color={weightedScoreColor} py={2} px={1}>
                        {typeof row.weightedB === "number"
                          ? row.weightedB.toFixed(1)
                          : row.weightedB}
                      </Td>
                    </>
                  )}
                </Tr>
              ))
            )}
          </Tbody>
          {rows.length > 0 && (
            <Tfoot>
              <Tr bg={totalRowBg}>
                <Th borderColor={borderColor} colSpan={5} color={totalText} fontSize="md" py={4}>
                  <HStack spacing={2}>
                    <Icon as={FaTrophy} boxSize={5} />
                    <span>TOTAL</span>
                  </HStack>
                </Th>
                <Th borderColor={borderColor} isNumeric color={totalText} fontSize="md" py={4}>
                  {totalWeightedA.toFixed(1)}
                </Th>
                <Th borderColor={borderColor} isNumeric color={totalText} fontSize="md" py={4}>
                  {totalWeightedB.toFixed(1)}
                </Th>
              </Tr>
            </Tfoot>
          )}
        </Table>
      </TableContainer>
    </Box>
  );
};

export default CriterionBreakdownTable;
