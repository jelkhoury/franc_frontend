import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Spinner,
  useToast,
  Badge,
  SimpleGrid,
  Divider,
  List,
  ListItem,
  Icon,
  Alert,
  AlertIcon,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Input,
  InputGroup,
  InputLeftElement,
  Flex,
  Select,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, ChevronRight, Search } from "lucide-react";
import { get, post } from "../../utils/httpServices";
import { SDS_ENDPOINTS, AI_ENDPOINTS } from "../../services/apiService";

/* --- Expandable card --- */
const ExpandableRoleCard = ({
  role,
  category,
  description,
  isHighlighted = false,
}) => {
  const { isOpen, onToggle } = useDisclosure();
  const hasDescription = description && description.trim() !== "";

  // All items with descriptions are expandable, highlighted items just have different styling
  const shouldShowDescription = isOpen;
  const isExpandable = hasDescription;

  return (
    <Box
      onClick={isExpandable ? onToggle : undefined}
      cursor={isExpandable ? "pointer" : "default"}
      p={4}
      bg={isHighlighted ? "yellow.50" : "blue.50"}
      rounded="md"
      shadow="sm"
      border="1px solid"
      borderColor={isHighlighted ? "yellow.300" : "blue.200"}
      transition="box-shadow 0.2s ease, border-color 0.2s ease, transform 0.05s ease"
      _hover={
        isExpandable
          ? {
              shadow: "md",
              borderColor: isHighlighted ? "yellow.400" : "blue.300",
            }
          : {}
      }
      _active={isExpandable ? { transform: "scale(0.998)" } : {}}
      minH="70px"
      position="relative"
    >
      {isHighlighted && (
        <Box
          position="absolute"
          top={1}
          right={1}
          bg="yellow.400"
          color="white"
          px={1.5}
          py={0.5}
          rounded="full"
          fontSize="xs"
          fontWeight="bold"
          zIndex={1}
        >
          ⭐
        </Box>
      )}
      <HStack spacing={3} align="start">
        {isExpandable ? (
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
          <Text
            fontWeight="semibold"
            color={isHighlighted ? "yellow.800" : "blue.700"}
            noOfLines={isOpen ? undefined : 2}
            flex="1"
          >
            {role} | {category || "Uncategorized"}
          </Text>
          {shouldShowDescription && description && (
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
  const lines = response.split("\n");

  for (const line of lines) {
    if (kind === "occupation") {
      // Look for pattern: "- Title | category: CAT (Description) HIGHLIGHTED" for occupation
      const match = line.match(
        /^- (.+?) \| category: (\w+) \((.+?)\)(?: HIGHLIGHTED)?$/
      );
      if (match) {
        const [, title, category, description] = match;
        descriptions[title.trim()] = {
          category: category.trim(),
          description: description.trim(),
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
          description: "", // No descriptions for education
        };
      }
    }
  }

  return descriptions;
}

/* --- normalize API payload to a single UI shape --- */
function normalizeSuggestionsPayload(payload) {
  // New structured shape present?
  if (
    payload &&
    Array.isArray(payload.available_items) &&
    Array.isArray(payload.suggestions)
  ) {
    const categoryDescriptions = parseCategoryDescriptions(
      payload.response,
      payload.kind
    );

    // Extract highlighted items from the response text
    const highlightedItems = [];
    if (payload.response) {
      const lines = payload.response.split("\n");
      lines.forEach((line) => {
        if (line.includes("(HIGHLIGHTED)") || line.includes("HIGHLIGHTED")) {
          // Extract the item name before the category
          const match = line.match(/^- (.+?) \| category:/);
          if (match) {
            highlightedItems.push(match[1].trim());
          }
        }
      });
    }

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
      highlightedItems: highlightedItems,
      legacy: payload.response || "",
    };
  }

  // Legacy fallback (string parsing)
  const parsed = parseLegacy(payload?.response);

  // Extract highlighted items from legacy response
  const highlightedItems = [];
  if (payload?.response) {
    const lines = payload.response.split("\n");
    lines.forEach((line) => {
      if (line.includes("(HIGHLIGHTED)") || line.includes("HIGHLIGHTED")) {
        const match = line.match(/^- (.+?) \| category:/);
        if (match) {
          highlightedItems.push(match[1].trim());
        }
      }
    });
  }

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
    top5: parsed.top5.map((t) => ({
      text: t.title,
      category: "",
      reason: t.reason,
    })),
    highlightedItems: highlightedItems,
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
    colorScheme={
      { R: "teal", I: "purple", A: "pink", S: "green", E: "orange", C: "blue" }[
        ch
      ] || "gray"
    }
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
    "Summary scores": { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
  };

  if (!responses || !questionsData) return scores;

  // Process each section
  questionsData.forEach((section) => {
    const sectionName = section.name;
    let sectionKey = sectionName;

    // Map section names to our scoring keys
    if (sectionName === "Self-Estimates") {
      sectionKey = "Self-Estimates Part 1"; // We'll handle both parts
    }

    section.questions.forEach((question) => {
      const response = responses.find((r) => r.questionId === question.id);
      if (!response) return;

      // Handle different question types
      if (question.type === 1) {
        // Like/Dislike questions
        const selectedOption = question.answerOptions.find(
          (opt) => opt.id === response.selectedOptionId
        );
        if (selectedOption && selectedOption.value) {
          const letter = selectedOption.value;
          if (scores[sectionKey] && scores[sectionKey][letter] !== undefined) {
            scores[sectionKey][letter]++;
          }
        }
      } else if (question.type === 4) {
        // Self-Estimates (1-7 scale)
        const selectedOption = question.answerOptions.find(
          (opt) => opt.id === response.selectedOptionId
        );
        if (selectedOption && selectedOption.value) {
          const value = selectedOption.value;
          // Extract letter and number from values like "3R", "5I", etc.
          const match = value.match(/(\d+)([RIASEC])/);
          if (match) {
            const number = parseInt(match[1]);
            const letter = match[2];
            if (
              scores[sectionKey] &&
              scores[sectionKey][letter] !== undefined
            ) {
              scores[sectionKey][letter] += number;
            }
          }
        }
      }
    });
  });

  // Calculate summary scores
  Object.keys(scores["Summary scores"]).forEach((letter) => {
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
  const sections = [
    "Activities",
    "Competencies",
    "Occupations",
    "Self-Estimates Part 1",
    "Self-Estimates Part 2",
    "Summary scores",
  ];
  const letters = ["R", "I", "A", "S", "E", "C"];

  return (
    <Box
      bg="white"
      rounded="xl"
      p={{ base: 5, md: 6 }}
      boxShadow="sm"
      border="1px solid"
      borderColor="gray.200"
      mb={6}
    >
      <VStack align="stretch" spacing={4}>
        <Heading color="brand.500" size="md" textAlign="center">
          RIASEC Scoring Summary
        </Heading>
        <Text fontSize="sm" color="gray.600" textAlign="center">
          Your scores across different assessment sections
        </Text>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

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
                  {letters.map((letter) => (
                    <Th key={letter} textAlign="center">
                      <LetterBadge ch={letter} />
                    </Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {sections.map((section) => (
                  <Tr key={section}>
                    <Td
                      fontWeight={
                        section === "Summary scores" ? "bold" : "normal"
                      }
                    >
                      {section}
                    </Td>
                    {letters.map((letter) => (
                      <Td key={letter} textAlign="center">
                        <Box
                          bg={
                            section === "Summary scores"
                              ? `${
                                  letter === "R"
                                    ? "teal"
                                    : letter === "I"
                                    ? "purple"
                                    : letter === "A"
                                    ? "pink"
                                    : letter === "S"
                                    ? "green"
                                    : letter === "E"
                                    ? "orange"
                                    : "blue"
                                }.100`
                              : "gray.50"
                          }
                          p={2}
                          rounded="md"
                          fontWeight={
                            section === "Summary scores" ? "bold" : "normal"
                          }
                          color={
                            section === "Summary scores"
                              ? `${
                                  letter === "R"
                                    ? "teal"
                                    : letter === "I"
                                    ? "purple"
                                    : letter === "A"
                                    ? "pink"
                                    : letter === "S"
                                    ? "green"
                                    : letter === "E"
                                    ? "orange"
                                    : "blue"
                                }.700`
                              : "gray.700"
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
              (Add the five R scores, the five I scores, the five A scores,
              etc.)
            </Text>
          </TableContainer>
        )}
      </VStack>
    </Box>
  );
};

/* --- Paginated Available Items Component --- */
const PaginatedAvailableItems = ({ items, kind, highlightedItems = [] }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const itemsPerPage = 12;

  // Filter items based on search and category
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.text
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        !selectedCategory || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, selectedCategory]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(items.map((item) => item.category)),
    ].filter(Boolean);
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
      <Heading color="brand.500" size="sm" mb={3}>
        Available Items ({filteredItems.length})
      </Heading>
      {kind === "occupation" && (
        <Text fontSize="sm" color="gray.600" mb={4}>
          Based on your code, this is the list of occupations that align with
          your top interest areas,the highlighted ones are the ones related to
          your Faculty.
        </Text>
      )}
      {kind === "education" && (
        <Text fontSize="sm" color="gray.600" mb={4}>
          Based on your code, this is the list of majors or fields that align
          with your top interest areas.
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
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
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
            isHighlighted={highlightedItems.includes(it.text)}
            key={`${it.text}-${idx}`}
          />
        ))}
      </SimpleGrid>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Flex justify="space-between" align="center" mt={4}>
          <Text fontSize="sm" color="gray.600">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredItems.length)}{" "}
            of {filteredItems.length} items
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
    </Box>
  );
};

/* --- Suggestions panel --- */
const SuggestionsPanel = ({
  label,
  code,
  kind,
  suggestions,
  loading,
  error,
}) => {
  const data = suggestions ? normalizeSuggestionsPayload(suggestions) : null;

  return (
    <Box
      bg="white"
      rounded="xl"
      p={{ base: 5, md: 6 }}
      boxShadow="sm"
      border="1px solid"
      borderColor="gray.200"
    >
      <VStack align="stretch" spacing={4}>
        <HStack justify="space-between" align="center">
          <Heading color="brand.500" size="md">
            {label}
          </Heading>
          <HStack>
            <Badge>{data?.code || code}</Badge>
            <Badge colorScheme="purple" variant="subtle">
              {data?.kind || kind}
            </Badge>
          </HStack>
        </HStack>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {loading && !error && (
          <VStack py={8}>
            <Spinner />
            <Text>Loading suggestions…</Text>
          </VStack>
        )}

        {!loading && !error && data && (
          <>
            <Divider />

            {/* Available Items */}
            {data.availableItems?.length > 0 && (
              <PaginatedAvailableItems
                items={data.availableItems}
                kind={kind}
                highlightedItems={data.highlightedItems || []}
              />
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

  // Process Holland points from API
  const riasecScores = useMemo(() => {
    if (!hollandPoints) return null;

    // Transform API data to match our table structure
    const scores = {
      Activities: hollandPoints.Activities || {
        R: 0,
        I: 0,
        A: 0,
        S: 0,
        E: 0,
        C: 0,
      },
      Competencies: hollandPoints.Competencies || {
        R: 0,
        I: 0,
        A: 0,
        S: 0,
        E: 0,
        C: 0,
      },
      Occupations: hollandPoints.Occupations || {
        R: 0,
        I: 0,
        A: 0,
        S: 0,
        E: 0,
        C: 0,
      },
      "Self-Estimates Part 1": hollandPoints["Self-Estimates"] || {
        R: 0,
        I: 0,
        A: 0,
        S: 0,
        E: 0,
        C: 0,
      },
      "Self-Estimates Part 2": { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }, // Not provided in API yet
      "Summary scores": { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
    };

    // Calculate summary scores
    Object.keys(scores["Summary scores"]).forEach((letter) => {
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
      toast({
        title: "No submission found.",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
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
      : state?.hollandCode && typeof state.hollandCode === "object"
      ? state.hollandCode.hollandCode ?? ""
      : "";

  // Extract dream occupations and user Holland code from state or responses
  const dreamOccupations = useMemo(() => {
    // First try to get from state (passed from SdsTry)
    if (state?.dreamOccupations) {
      return state.dreamOccupations;
    }
    // Fallback: extract from responses by questionId 362
    const responsesToSearch = state?.allResponses || state?.responses || [];
    const dreamOccResponse = responsesToSearch.find(r => r.questionId === 362);
    return dreamOccResponse?.customAnswer || "";
  }, [state?.dreamOccupations, state?.allResponses, state?.responses]);

  const userCode = useMemo(() => {
    // First try to get from state (passed from SdsTry)
    if (state?.userHollandCode) {
      return state.userHollandCode;
    }
    // Fallback: extract from responses by questionId 363
    const responsesToSearch = state?.allResponses || state?.responses || [];
    const userCodeResponse = responsesToSearch.find(r => r.questionId === 363);
    return userCodeResponse?.customAnswer || "";
  }, [state?.userHollandCode, state?.allResponses, state?.responses]);

  // Extract faculty value from responses
  const faculty = useMemo(() => {
    // Use allResponses if available, otherwise fall back to responses
    const responsesToSearch = state?.allResponses || state?.responses || [];

    if (!responsesToSearch.length) return "";

    // Debug logging to see the actual response structure
    console.log("All responses:", responsesToSearch);
    console.log("Looking for faculty question (ID 364)...");

    // Look for faculty question by ID (364) - "Select your faculty"
    const facultyResponse = responsesToSearch.find((response) => {
      console.log(`Checking response with questionId: ${response.questionId}`);
      return response.questionId === 364; // Faculty question ID
    });

    console.log("Faculty response found:", facultyResponse);

    if (facultyResponse) {
      // For type 3 (select), the value should be in selectedValue
      // The selectedValue contains the option value (e.g., "ENGINEERING", "BUSINESS ADMINISTRATION")
      const facultyValue =
        facultyResponse.selectedValue || facultyResponse.customAnswer || "";
      console.log("Extracted faculty value:", facultyValue);
      return facultyValue;
    }

    console.log("No faculty response found");
    return "";
  }, [state?.allResponses, state?.responses]);

  useEffect(() => {
    if (!state) return;

    setOccLoading(true);
    setEduLoading(true);
    setHollandPointsLoading(true);
    setOccError("");
    setEduError("");
    setHollandPointsError("");

    const paramsOcc = {
      code: codeStr,
      kind: "occupation",
      user_holland_code: userCode,
      dreams_occupations: dreamOccupations, // server will split by comma
      faculty: faculty, // Add faculty parameter
    };

    console.log("Faculty value being sent:", faculty);

    const paramsEdu = {
      code: codeStr,
      kind: "education",
      user_holland_code: userCode,
    };
    // Fetch Holland points from backend
    const hollandPoints = get(
      SDS_ENDPOINTS.GET_HOLLAND_POINTS(state.userId)
    )
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

    const occ = get(AI_ENDPOINTS.SUGGEST_BY_CODE, { params: paramsOcc, base: "ai" })
      .then((suggestions) => {
        setOccSuggestions(suggestions);
        
        // Save AI feedback (only work/occupation suggestions, not education)
        if (suggestions && suggestions.response && state?.userId) {
          const aiFeedback = suggestions.response;
          // Save AI feedback asynchronously (don't block UI)
          post(SDS_ENDPOINTS.SAVE_AI_FEEDBACK, {
            userId: state.userId,
            aiFeedback: aiFeedback,
          })
            .then(() => {
              console.log("AI feedback saved successfully");
            })
            .catch((error) => {
              console.error("Error saving AI feedback:", error);
              // Don't show error to user, just log it
            });
        }
      })
      .catch(() => setOccError("Could not load occupation suggestions."));

    const edu = get(AI_ENDPOINTS.SUGGEST_BY_CODE, { params: paramsEdu, base: "ai" })
      .then(setEduSuggestions)
      .catch(() => setEduError("Could not load education suggestions."));

    Promise.allSettled([occ, edu, hollandPoints]).finally(() => {
      setOccLoading(false);
      setEduLoading(false);
      setHollandPointsLoading(false);
    });
  }, [state, codeStr, userCode, dreamOccupations, faculty]);

  if (!state) {
    return (
      <VStack py={16}>
        <Spinner />
        <Text>Redirecting…</Text>
      </VStack>
    );
  }

  const letters = (codeStr || "").split("").slice(0, 3);

  // Helper function to check if a letter is in the user's Holland code
  const isInUserCode = (letter) => letters.includes(letter);

  return (
    <Box minH="100vh" bgGradient="linear(to-br, #ffffff, #f1f5f9)" pb={16}>
      {/* hero */}
      <Box
        bgGradient="linear(to-r, blue.500, teal.500)"
        color="white"
        py={{ base: 8, md: 10 }}
        mb={8}
        boxShadow="sm"
      >
        <Container maxW="5xl">
          <VStack spacing={4} align="stretch">
            <Heading color="white" size="lg" lineHeight="1.2">
              Thank you for completing the Personality Test
            </Heading>
            <HStack spacing={4} align="center" flexWrap="wrap">
              <Text fontSize="lg">Your summary code:</Text>
              <HStack spacing={2}>
                {letters.map((ch, i) => (
                  <LetterBadge key={`${ch}-${i}`} ch={ch} />
                ))}
              </HStack>
            </HStack>
            {/* <Text fontSize="sm" opacity={0.9} mt={2}>
              This three-letter code represents your strongest interest areas according to John Holland's RIASEC model.
            </Text> */}
            <Text fontSize="sm" opacity={0.9}>
              Answered: <b>{state.answeredCount ?? "—"}</b> • Submitted at:{" "}
              <b>{new Date(state.submittedAt).toLocaleString()}</b>
            </Text>
          </VStack>
        </Container>
      </Box>

      <Container maxW="8xl">
        {/* RIASEC Dimensions Explanation */}
        <Box
          bg="white"
          rounded="xl"
          p={{ base: 5, md: 6 }}
          boxShadow="sm"
          border="1px solid"
          borderColor="gray.200"
          mb={6}
        >
          <VStack align="stretch" spacing={4}>
            <Heading color="brand.500" size="md" textAlign="center">
              Explanation of RIASEC Dimensions
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              <Box
                p={3}
                bg={isInUserCode("R") ? "teal.50" : "white"}
                rounded="md"
                border="1px solid"
                borderColor={isInUserCode("R") ? "teal.200" : "gray.200"}
              >
                <HStack mb={2}>
                  <LetterBadge ch="R" />
                  <Text
                    fontWeight="bold"
                    color={isInUserCode("R") ? "teal.700" : "black"}
                  >
                    Realistic
                  </Text>
                </HStack>
                <Text
                  fontSize="sm"
                  color={isInUserCode("R") ? "gray.700" : "black"}
                >
                  Prefers hands-on activities, working with tools, machines, or
                  the outdoors. Practical, mechanical, and action-oriented.
                </Text>
              </Box>
              <Box
                p={3}
                bg={isInUserCode("I") ? "purple.50" : "white"}
                rounded="md"
                border="1px solid"
                borderColor={isInUserCode("I") ? "purple.200" : "gray.200"}
              >
                <HStack mb={2}>
                  <LetterBadge ch="I" />
                  <Text
                    fontWeight="bold"
                    color={isInUserCode("I") ? "purple.700" : "black"}
                  >
                    Investigative
                  </Text>
                </HStack>
                <Text
                  fontSize="sm"
                  color={isInUserCode("I") ? "gray.700" : "black"}
                >
                  Prefers working with ideas, thinking, and problem-solving.
                  Analytical, curious, and scientific.
                </Text>
              </Box>
              <Box
                p={3}
                bg={isInUserCode("A") ? "pink.50" : "white"}
                rounded="md"
                border="1px solid"
                borderColor={isInUserCode("A") ? "pink.200" : "gray.200"}
              >
                <HStack mb={2}>
                  <LetterBadge ch="A" />
                  <Text
                    fontWeight="bold"
                    color={isInUserCode("A") ? "pink.700" : "black"}
                  >
                    Artistic
                  </Text>
                </HStack>
                <Text
                  fontSize="sm"
                  color={isInUserCode("A") ? "gray.700" : "black"}
                >
                  Prefers creative expression through art, music, writing, or
                  design. Imaginative, innovative, and original.
                </Text>
              </Box>
              <Box
                p={3}
                bg={isInUserCode("S") ? "green.50" : "white"}
                rounded="md"
                border="1px solid"
                borderColor={isInUserCode("S") ? "green.200" : "gray.200"}
              >
                <HStack mb={2}>
                  <LetterBadge ch="S" />
                  <Text
                    fontWeight="bold"
                    color={isInUserCode("S") ? "green.700" : "black"}
                  >
                    Social
                  </Text>
                </HStack>
                <Text
                  fontSize="sm"
                  color={isInUserCode("S") ? "gray.700" : "black"}
                >
                  Prefers working with people, helping, teaching, or serving.
                  Cooperative, empathetic, and supportive.
                </Text>
              </Box>
              <Box
                p={3}
                bg={isInUserCode("E") ? "orange.50" : "white"}
                rounded="md"
                border="1px solid"
                borderColor={isInUserCode("E") ? "orange.200" : "gray.200"}
              >
                <HStack mb={2}>
                  <LetterBadge ch="E" />
                  <Text
                    fontWeight="bold"
                    color={isInUserCode("E") ? "orange.700" : "black"}
                  >
                    Enterprising
                  </Text>
                </HStack>
                <Text
                  fontSize="sm"
                  color={isInUserCode("E") ? "gray.700" : "black"}
                >
                  Prefers leadership roles, persuading, and managing projects or
                  people. Energetic, ambitious, and outgoing.
                </Text>
              </Box>
              <Box
                p={3}
                bg={isInUserCode("C") ? "blue.50" : "white"}
                rounded="md"
                border="1px solid"
                borderColor={isInUserCode("C") ? "blue.200" : "gray.200"}
              >
                <HStack mb={2}>
                  <LetterBadge ch="C" />
                  <Text
                    fontWeight="bold"
                    color={isInUserCode("C") ? "blue.700" : "black"}
                  >
                    Conventional
                  </Text>
                </HStack>
                <Text
                  fontSize="sm"
                  color={isInUserCode("C") ? "gray.700" : "black"}
                >
                  Prefers structured tasks, organization, data management, and
                  attention to detail. Methodical, efficient, and orderly.
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

        {/* Comparison Section */}
        {occSuggestions && (
          <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            rounded="md"
            p={4}
            mb={6}
            mt={6}
          >
            <Heading color="brand.500" size="md" mb={3}>
              Comparison with your dream occupations
            </Heading>
            {(() => {
              const occData = normalizeSuggestionsPayload(occSuggestions);
              if (occData.comparison) {
                return (
                  <>
                    <Text>
                      <b>Code match:</b> {occData.comparison.code_match_message}
                    </Text>
                    <Text>
                      <b>Dream occupations:</b>{" "}
                      {occData.comparison.dreams_provided?.length
                        ? occData.comparison.dreams_provided.join(", ")
                        : "none provided."}
                    </Text>
                    <Text>
                      <b>Dreams alignment:</b> {occData.comparison.dreams_hit}/
                      {occData.comparison.total_dreams} matched
                      {occData.comparison.dreams_matched?.length
                        ? ` (matched: ${occData.comparison.dreams_matched.join(
                            ", "
                          )})`
                        : ""}
                      .
                    </Text>
                    <Text>
                      <b>Self-knowledge:</b> {occData.comparison.verdict}
                    </Text>
                  </>
                );
              } else if (
                occSuggestions?.response &&
                occData.legacyComparisonLines?.length > 0
              ) {
                return (
                  <>
                    {occData.legacyComparisonLines.map((l, i) => (
                      <Text key={i}>{l}</Text>
                    ))}
                  </>
                );
              }
              return null;
            })()}
          </Box>
        )}

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
