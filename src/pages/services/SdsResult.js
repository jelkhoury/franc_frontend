import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Container, Heading, Text, Button, VStack, HStack, Spinner, useToast, Badge,
  SimpleGrid, Divider, List, ListItem, Icon, Alert, AlertIcon, useDisclosure, Table,
  Thead, Tbody, Tr, Th, Td, TableContainer, Input, InputGroup, InputLeftElement,
  Flex, Select, Wrap, WrapItem
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, ChevronRight, Search } from "lucide-react";

/* --- Expandable card --- */
const ExpandableRoleCard = ({ role, category, description }) => {
  const { isOpen, onToggle } = useDisclosure();
  const hasDescription = description && description.trim() !== "";
  
  return (
    <Box
      onClick={hasDescription ? onToggle : undefined}
      cursor={hasDescription ? "pointer" : "default"}
      p={4}
      bg="blue.50"
      rounded="md"
      shadow="sm"
      border="1px solid"
      borderColor="blue.200"
      transition="box-shadow 0.2s ease, border-color 0.2s ease, transform 0.05s ease"
      _hover={hasDescription ? { shadow: "md", borderColor: "blue.300" } : {}}
      _active={hasDescription ? { transform: "scale(0.998)" } : {}}
      minH="70px"
    >
      <HStack spacing={3} align="start">
        {hasDescription ? (
          <Icon
            as={ChevronRight}
            boxSize={5}
            color="blue.500"
            transition="transform 0.2s ease"
            transform={isOpen ? "rotate(90deg)" : "rotate(0deg)"}
            mt="2px"
            flexShrink={0}
          />
        ) : (
          <Box boxSize={5} mt="2px" flexShrink={0} />
        )}
        <VStack align="start" spacing={1} flex="1" minW={0}>
          <Text fontWeight="semibold" color="blue.700" noOfLines={isOpen ? undefined : 2} flex="1">
            {role} | {category || "Uncategorized"}
          </Text>
          {isOpen && description && (
            <Text fontSize="sm" color="gray.600" mt={2} lineHeight="1.4">
              {description}
            </Text>
          )}
        </VStack>
      </HStack>
    </Box>
  );
};

/* --- legacy parser (fallback only) --- */
function parseLegacy(raw) {
  if (!raw) return { available: [], top5: [], comparisonLines: [] };
  const blocks = raw.split(/\n1\)\s*Available Items:\s*/i);
  const header = blocks[0] || "";
  const comparisonLines = header
    .split("\n")
    .slice(1, 5) // usually the 4 lines we added (Code match / Dream occupations / Dreams alignment / Self-knowledge)
    .filter(Boolean);

  const parts = (blocks[1] || "").split(/\n\s*2\)\s*Top 5 Suggestions.*?:\s*/i);
  const availableBlock = parts[0] || "";
  const top5Block = parts[1] || "";

  const available = availableBlock
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.replace(/^- /, "").trim());

  const top5 = top5Block
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => {
      const m = l.replace(/^- /, "");
      const [left, ...why] = m.split(/—| - /);
      return { title: (left || "").trim(), reason: why.join("—").trim() };
    })
    .filter((x) => x.title);

  return { available, top5, comparisonLines };
}

/* --- parse category descriptions from response --- */
function parseCategoryDescriptions(response, kind) {
  if (!response) return {};
  
  const descriptions = {};
  const lines = response.split('\n');
  
  for (const line of lines) {
    if (kind === "occupation") {
      // Look for pattern: "- Title | category: CAT (Description)" for occupation
      const match = line.match(/^- (.+?) \| category: (\w+) \((.+?)\)$/);
      if (match) {
        const [, title, category, description] = match;
        descriptions[title.trim()] = {
          category: category.trim(),
          description: description.trim()
        };
      }
    } else if (kind === "education") {
      // For education, there are no descriptions in parentheses, just category names
      // Pattern: "- Title | category: Full Category Name"
      const match = line.match(/^- (.+?) \| category: (.+?)$/);
      if (match) {
        const [, title, category] = match;
        descriptions[title.trim()] = {
          category: category.trim(),
          description: "" // No descriptions for education
        };
      }
    }
  }
  
  return descriptions;
}

/* --- normalize API payload to a single UI shape --- */
function normalizeSuggestionsPayload(payload) {
  // New structured shape present?
  if (payload && Array.isArray(payload.available_items) && Array.isArray(payload.suggestions)) {
    const categoryDescriptions = parseCategoryDescriptions(payload.response, payload.kind);
    
    return {
      code: payload.code,
      kind: payload.kind,
      comparison: payload.comparison || null,
      availableItems: payload.available_items.map((it) => {
        const descInfo = categoryDescriptions[it.text] || {};
        return {
          text: it.text,
          category: it.category || "",
          group: it.group || "",
          description: descInfo.description || "",
        };
      }),
      top5: payload.suggestions.map((s) => ({
        text: s.text,
        category: s.category || "",
        reason: "", // No longer provided in new format
      })),
      legacy: payload.response || "",
    };
  }

  // Legacy fallback (string parsing)
  const parsed = parseLegacy(payload?.response);
  return {
    code: payload?.code,
    kind: payload?.kind,
    comparison: null, // we only have lines of text; we'll render them as-is
    availableItems: parsed.available.map((line) => {
      // Try to split "Title | category: CAT"
      const [title, catPart] = line.split("| category:");
      return {
        text: (title || "").trim(),
        category: (catPart || "").trim(),
        group: "",
        description: "",
      };
    }),
    top5: parsed.top5.map((t) => ({ text: t.title, category: "", reason: t.reason })),
    legacy: payload?.response || "",
    legacyComparisonLines: parsed.comparisonLines || [],
  };
}

const LetterBadge = ({ ch }) => (
  <Badge
    fontSize="lg"
    px={3}
    py={1}
    rounded="full"
    colorScheme={{ R: "teal", I: "purple", A: "pink", S: "green", E: "orange", C: "blue" }[ch] || "gray"}
  >
    {ch}
  </Badge>
);

/* --- Calculate RIASEC scores from user responses --- */
function calculateRIASECScores(responses, questionsData) {
  const scores = {
    Activities: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
    Competencies: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
    Occupations: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
    "Self-Estimates Part 1": { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
    "Self-Estimates Part 2": { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
    "Summary scores": { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }
  };

  if (!responses || !questionsData) return scores;

  // Process each section
  questionsData.forEach(section => {
    const sectionName = section.name;
    let sectionKey = sectionName;
    
    // Map section names to our scoring keys
    if (sectionName === "Self-Estimates") {
      sectionKey = "Self-Estimates Part 1"; // We'll handle both parts
    }

    section.questions.forEach(question => {
      const response = responses.find(r => r.questionId === question.id);
      if (!response) return;

      // Handle different question types
      if (question.type === 1) { // Like/Dislike questions
        const selectedOption = question.answerOptions.find(opt => opt.id === response.selectedOptionId);
        if (selectedOption && selectedOption.value) {
          const letter = selectedOption.value;
          if (scores[sectionKey] && scores[sectionKey][letter] !== undefined) {
            scores[sectionKey][letter]++;
          }
        }
      } else if (question.type === 4) { // Self-Estimates (1-7 scale)
        const selectedOption = question.answerOptions.find(opt => opt.id === response.selectedOptionId);
        if (selectedOption && selectedOption.value) {
          const value = selectedOption.value;
          // Extract letter and number from values like "3R", "5I", etc.
          const match = value.match(/(\d+)([RIASEC])/);
          if (match) {
            const number = parseInt(match[1]);
            const letter = match[2];
            if (scores[sectionKey] && scores[sectionKey][letter] !== undefined) {
              scores[sectionKey][letter] += number;
            }
          }
        }
      }
    });
  });

  // Calculate summary scores
  Object.keys(scores["Summary scores"]).forEach(letter => {
    scores["Summary scores"][letter] = 
      scores["Activities"][letter] +
      scores["Competencies"][letter] +
      scores["Occupations"][letter] +
      scores["Self-Estimates Part 1"][letter] +
      scores["Self-Estimates Part 2"][letter];
  });

  return scores;
}

/* --- RIASEC Scoring Table Component --- */
const RIASECScoringTable = ({ scores, loading, error }) => {
  const sections = ["Activities", "Competencies", "Occupations", "Self-Estimates Part 1", "Self-Estimates Part 2", "Summary scores"];
  const letters = ["R", "I", "A", "S", "E", "C"];
  
  return (
    <Box bg="white" rounded="xl" p={{ base: 5, md: 6 }} boxShadow="sm" border="1px solid" borderColor="gray.200" mb={6}>
      <VStack align="stretch" spacing={4}>
        <Heading size="md" textAlign="center">RIASEC Scoring Summary</Heading>
        <Text fontSize="sm" color="gray.600" textAlign="center">
          Your scores across different assessment sections
        </Text>

        {error && <Alert status="error"><AlertIcon />{error}</Alert>}

        {loading && !error && (
          <VStack py={8}>
            <Spinner />
            <Text>Loading scoring data…</Text>
          </VStack>
        )}

        {!loading && !error && scores && (
          <TableContainer>
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th>Section</Th>
                {letters.map(letter => (
                  <Th key={letter} textAlign="center">
                    <LetterBadge ch={letter} />
                  </Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {sections.map(section => (
                <Tr key={section}>
                  <Td fontWeight={section === "Summary scores" ? "bold" : "normal"}>
                    {section}
                  </Td>
                  {letters.map(letter => (
                    <Td key={letter} textAlign="center">
                      <Box
                        bg={section === "Summary scores" ? 
                          `${letter === "R" ? "teal" : letter === "I" ? "purple" : letter === "A" ? "pink" : letter === "S" ? "green" : letter === "E" ? "orange" : "blue"}.100` : 
                          "gray.50"
                        }
                        p={2}
                        rounded="md"
                        fontWeight={section === "Summary scores" ? "bold" : "normal"}
                        color={section === "Summary scores" ? 
                          `${letter === "R" ? "teal" : letter === "I" ? "purple" : letter === "A" ? "pink" : letter === "S" ? "green" : letter === "E" ? "orange" : "blue"}.700` : 
                          "gray.700"
                        }
                      >
                        {scores[section]?.[letter] || 0}
                      </Box>
                    </Td>
                  ))}
                </Tr>
              ))}
            </Tbody>
          </Table>
          
          <Text fontSize="xs" color="gray.500" textAlign="center" mt={2}>
            (Add the five R scores, the five I scores, the five A scores, etc.)
          </Text>
        </TableContainer>
        )}
      </VStack>
    </Box>
  );
};

/* --- Paginated Available Items Component --- */
const PaginatedAvailableItems = ({ items, kind }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const itemsPerPage = 12;

  // Filter items based on search and category
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.text.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, selectedCategory]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(items.map(item => item.category))].filter(Boolean);
    return uniqueCategories.sort();
  }, [items]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  return (
    <Box>
      <Heading size="sm" mb={3}>
        Available Items ({filteredItems.length})
      </Heading>
      {kind === "occupation" && (
        <Text fontSize="sm" color="gray.600" mb={4}>
          Based on your code, you may be most satisfied in occupations that align with your top interest areas.
        </Text>
      )}
      {kind === "education" && (
        <Text fontSize="sm" color="gray.600" mb={4}>
          Based on your code, you may be most satisfied in majors or fields that align with your top interest areas.
        </Text>
      )}

      {/* Search and Filter Controls */}
      <VStack spacing={3} mb={4} align="stretch">
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <Icon as={Search} color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search available items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            bg="white"
          />
        </InputGroup>
        
        {categories.length > 0 && (
          <Select
            placeholder="Filter by category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            bg="white"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </Select>
        )}
      </VStack>

      {/* Items Grid */}
      <SimpleGrid 
        columns={{ base: 1, sm: kind === "education" ? 1 : 2 }} 
        spacing={3} 
        alignItems="start"
        mb={4}
      >
        {currentItems.map((it, idx) => (
          <ExpandableRoleCard 
            role={it.text} 
            category={it.category} 
            description={it.description}
            key={`${it.text}-${idx}`} 
          />
        ))}
      </SimpleGrid>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Flex justify="space-between" align="center" mt={4}>
          <Text fontSize="sm" color="gray.600">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredItems.length)} of {filteredItems.length} items
          </Text>
          <HStack spacing={2}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              isDisabled={currentPage === totalPages}
            >
              Next
            </Button>
          </HStack>
        </Flex>
      )}
    </Box>
  );
};

/* --- Suggestions panel --- */
const SuggestionsPanel = ({ label, code, kind, suggestions, loading, error }) => {
  const data = suggestions ? normalizeSuggestionsPayload(suggestions) : null;

  return (
    <Box bg="white" rounded="xl" p={{ base: 5, md: 6 }} boxShadow="sm" border="1px solid" borderColor="gray.200">
      <VStack align="stretch" spacing={4}>
        <HStack justify="space-between" align="center">
          <Heading size="md">{label}</Heading>
          <HStack>
            <Badge>{data?.code || code}</Badge>
            <Badge colorScheme="purple" variant="subtle">
              {data?.kind || kind}
            </Badge>
          </HStack>
        </HStack>

        {error && <Alert status="error"><AlertIcon />{error}</Alert>}

        {loading && !error && (
          <VStack py={8}>
            <Spinner />
            <Text>Loading suggestions…</Text>
          </VStack>
        )}

        {!loading && !error && data && (
          <>
            {/* Comparison header - only show for occupation suggestions */}
            {kind === "occupation" && data.comparison ? (
              <Box bg="gray.50" border="1px solid" borderColor="gray.200" rounded="md" p={3}>
                <Text><b>Code match:</b> {data.comparison.code_match_message}</Text>
                <Text>
                  <b>Dream occupations:</b>{" "}
                  {data.comparison.dreams_provided?.length
                    ? data.comparison.dreams_provided.join(", ")
                    : "none provided."}
                </Text>
                <Text>
                  <b>Dreams alignment:</b> {data.comparison.dreams_hit}/{data.comparison.total_dreams} matched
                  {data.comparison.dreams_matched?.length
                    ? ` (matched: ${data.comparison.dreams_matched.join(", ")})`
                    : ""}
                  .
                </Text>
                <Text><b>Self-knowledge:</b> {data.comparison.verdict}</Text>
              </Box>
            ) : kind === "occupation" && suggestions?.response && data.legacyComparisonLines?.length > 0 ? (
              <Box bg="gray.50" border="1px solid" borderColor="gray.200" rounded="md" p={3}>
                {data.legacyComparisonLines.map((l, i) => (
                  <Text key={i}>{l}</Text>
                ))}
              </Box>
            ) : null}


            <Divider />

            {/* Available Items */}
            {data.availableItems?.length > 0 && (
              <PaginatedAvailableItems items={data.availableItems} kind={kind} />
            )}
          </>
        )}
      </VStack>
    </Box>
  );
};

const SdsResult = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [occSuggestions, setOccSuggestions] = useState(null);
  const [eduSuggestions, setEduSuggestions] = useState(null);

  const [occLoading, setOccLoading] = useState(true);
  const [eduLoading, setEduLoading] = useState(true);

  const [occError, setOccError] = useState("");
  const [eduError, setEduError] = useState("");

  const [hollandPoints, setHollandPoints] = useState(null);
  const [hollandPointsLoading, setHollandPointsLoading] = useState(true);
  const [hollandPointsError, setHollandPointsError] = useState("");

  const apiAiUrl = useMemo(() => process.env.REACT_APP_API_AI_URL || "http://10.138.129.183:5000", []);
  const apiBaseUrl = useMemo(() => "http://localhost:5121", []);

  // Process Holland points from API
  const riasecScores = useMemo(() => {
    if (!hollandPoints) return null;
    
    // Transform API data to match our table structure
    const scores = {
      Activities: hollandPoints.Activities || { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
      Competencies: hollandPoints.Competencies || { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
      Occupations: hollandPoints.Occupations || { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
      "Self-Estimates Part 1": hollandPoints["Self-Estimates"] || { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
      "Self-Estimates Part 2": { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }, // Not provided in API yet
      "Summary scores": { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }
    };
    
    // Calculate summary scores
    Object.keys(scores["Summary scores"]).forEach(letter => {
      scores["Summary scores"][letter] = 
        scores["Activities"][letter] +
        scores["Competencies"][letter] +
        scores["Occupations"][letter] +
        scores["Self-Estimates Part 1"][letter] +
        scores["Self-Estimates Part 2"][letter];
    });
    
    return scores;
  }, [hollandPoints]);

  useEffect(() => {
    if (!state) {
      toast({ title: "No submission found.", status: "warning", duration: 4000, isClosable: true });
      navigate("/services/sds");
    } else {
      // Debug: Log state structure to understand what data is available
      console.log("SDS Result State:", state);
      console.log("Available state keys:", Object.keys(state));
    }
  }, [state, navigate, toast]);

  const codeStr =
    typeof state?.hollandCode === "string"
      ? state.hollandCode
      : (state?.hollandCode && typeof state.hollandCode === "object"
          ? (state.hollandCode.hollandCode ?? "")
          : "");

  const dreamOccupations = state?.responses?.[0]?.customAnswer || "";
  const userCode = state?.responses?.[1]?.customAnswer || "";

  useEffect(() => {
    if (!state) return;

    setOccLoading(true);
    setEduLoading(true);
    setHollandPointsLoading(true);
    setOccError("");
    setEduError("");
    setHollandPointsError("");

    const paramsOcc = new URLSearchParams({
      code: codeStr,
      kind: "occupation",
      user_holland_code: userCode,
      dreams_occupations: dreamOccupations, // server will split by comma
    });

    const paramsEdu = new URLSearchParams({
      code: codeStr,
      kind: "education",
      user_holland_code: userCode,
    });

    // Fetch Holland points from backend
    const hollandPoints = fetch(`${apiBaseUrl}/api/Sds/responses/1/holland-points`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((response) => {
        if (response.message && response.data) {
          setHollandPoints(response.data);
        } else {
          throw new Error("Invalid response format");
        }
      })
      .catch((error) => {
        console.error("Error fetching Holland points:", error);
        setHollandPointsError("Could not load Holland points.");
      });

    const occ = fetch(`${apiAiUrl}/suggest-by-code?${paramsOcc.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then(setOccSuggestions)
      .catch(() => setOccError("Could not load occupation suggestions."));

    const edu = fetch(`${apiAiUrl}/suggest-by-code?${paramsEdu.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then(setEduSuggestions)
      .catch(() => setEduError("Could not load education suggestions."));

    Promise.allSettled([occ, edu, hollandPoints]).finally(() => {
      setOccLoading(false);
      setEduLoading(false);
      setHollandPointsLoading(false);
    });
  }, [state, apiAiUrl, apiBaseUrl, codeStr, userCode, dreamOccupations]);

  if (!state) {
    return (
      <VStack py={16}>
        <Spinner />
        <Text>Redirecting…</Text>
      </VStack>
    );
  }

  const letters = (codeStr || "").split("").slice(0, 3);

  return (
    <Box minH="100vh" bgGradient="linear(to-br, #ffffff, #f1f5f9)" pb={16}>
      {/* hero */}
      <Box bgGradient="linear(to-r, blue.500, teal.500)" color="white" py={{ base: 8, md: 10 }} mb={8} boxShadow="sm">
        <Container maxW="5xl">
          <VStack spacing={4} align="stretch">
            <Heading size="lg" lineHeight="1.2">
              Thank you for completing the SDS 🎉
            </Heading>
            <HStack spacing={4} align="center" flexWrap="wrap">
              <Text fontSize="lg">Your preliminary Holland code:</Text>
              <HStack spacing={2}>
                {letters.map((ch, i) => (
                  <LetterBadge key={`${ch}-${i}`} ch={ch} />
                ))}
              </HStack>
            </HStack>
            <Text fontSize="sm" opacity={0.9} mt={2}>
              This three-letter code represents your strongest interest areas according to John Holland's RIASEC model.
            </Text>
            <Text fontSize="sm" opacity={0.9}>
              Answered: <b>{state.answeredCount ?? "—"}</b> • Submitted at:{" "}
              <b>{new Date(state.submittedAt).toLocaleString()}</b>
            </Text>
          </VStack>
        </Container>
      </Box>

      <Container maxW="8xl">
        {/* RIASEC Dimensions Explanation */}
        <Box bg="white" rounded="xl" p={{ base: 5, md: 6 }} boxShadow="sm" border="1px solid" borderColor="gray.200" mb={6}>
          <VStack align="stretch" spacing={4}>
            <Heading size="md" textAlign="center">Explanation of RIASEC Dimensions</Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              <Box p={3} bg="teal.50" rounded="md" border="1px solid" borderColor="teal.200">
                <HStack mb={2}>
                  <LetterBadge ch="R" />
                  <Text fontWeight="bold" color="teal.700">Realistic</Text>
                </HStack>
                <Text fontSize="sm" color="gray.700">
                  Prefers hands-on activities, working with tools, machines, or the outdoors. Practical, mechanical, and action-oriented.
                </Text>
              </Box>
              <Box p={3} bg="purple.50" rounded="md" border="1px solid" borderColor="purple.200">
                <HStack mb={2}>
                  <LetterBadge ch="I" />
                  <Text fontWeight="bold" color="purple.700">Investigative</Text>
                </HStack>
                <Text fontSize="sm" color="gray.700">
                  Prefers working with ideas, thinking, and problem-solving. Analytical, curious, and scientific.
                </Text>
              </Box>
              <Box p={3} bg="pink.50" rounded="md" border="1px solid" borderColor="pink.200">
                <HStack mb={2}>
                  <LetterBadge ch="A" />
                  <Text fontWeight="bold" color="pink.700">Artistic</Text>
                </HStack>
                <Text fontSize="sm" color="gray.700">
                  Prefers creative expression through art, music, writing, or design. Imaginative, innovative, and original.
                </Text>
              </Box>
              <Box p={3} bg="green.50" rounded="md" border="1px solid" borderColor="green.200">
                <HStack mb={2}>
                  <LetterBadge ch="S" />
                  <Text fontWeight="bold" color="green.700">Social</Text>
                </HStack>
                <Text fontSize="sm" color="gray.700">
                  Prefers working with people, helping, teaching, or serving. Cooperative, empathetic, and supportive.
                </Text>
              </Box>
              <Box p={3} bg="orange.50" rounded="md" border="1px solid" borderColor="orange.200">
                <HStack mb={2}>
                  <LetterBadge ch="E" />
                  <Text fontWeight="bold" color="orange.700">Enterprising</Text>
                </HStack>
                <Text fontSize="sm" color="gray.700">
                  Prefers leadership roles, persuading, and managing projects or people. Energetic, ambitious, and outgoing.
                </Text>
              </Box>
              <Box p={3} bg="blue.50" rounded="md" border="1px solid" borderColor="blue.200">
                <HStack mb={2}>
                  <LetterBadge ch="C" />
                  <Text fontWeight="bold" color="blue.700">Conventional</Text>
                </HStack>
                <Text fontSize="sm" color="gray.700">
                  Prefers structured tasks, organization, data management, and attention to detail. Methodical, efficient, and orderly.
                </Text>
              </Box>
            </SimpleGrid>
          </VStack>
        </Box>

        {/* RIASEC Scoring Table */}
        <RIASECScoringTable 
          scores={riasecScores} 
          loading={hollandPointsLoading} 
          error={hollandPointsError} 
        />

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <SuggestionsPanel
            label="Occupation Suggestions"
            code={codeStr}
            kind="occupation"
            suggestions={occSuggestions}
            loading={occLoading}
            error={occError}
          />
          <SuggestionsPanel
            label="Education Suggestions"
            code={codeStr}
            kind="education"
            suggestions={eduSuggestions}
            loading={eduLoading}
            error={eduError}
          />
        </SimpleGrid>

        <HStack justify="center" spacing={4} mt={8}>
          <Button onClick={() => navigate("/")} variant="outline">
            Back to Home
          </Button>
          <Button colorScheme="blue" onClick={() => navigate("/services/sds")}>
            Retake / Explore More
          </Button>
        </HStack>
      </Container>
    </Box>
  );
};

export default SdsResult;