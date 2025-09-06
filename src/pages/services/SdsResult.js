import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Container, Heading, Text, Button, VStack, HStack, Spinner, useToast, Badge,
  SimpleGrid, Divider, List, ListItem, Icon, Alert, AlertIcon, useDisclosure
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, ChevronRight } from "lucide-react";

/* --- Expandable card --- */
const ExpandableRoleCard = ({ role, category }) => {
  const { isOpen, onToggle } = useDisclosure();
  return (
    <Box
      onClick={onToggle}
      cursor="pointer"
      p={3}
      bg="blue.50"
      rounded="md"
      shadow="sm"
      border="1px solid"
      borderColor="blue.200"
      transition="box-shadow 0.2s ease, border-color 0.2s ease, transform 0.05s ease"
      _hover={{ shadow: "md", borderColor: "blue.300" }}
      _active={{ transform: "scale(0.998)" }}
    >
      <HStack spacing={3} align="start">
        <Icon
          as={ChevronRight}
          boxSize={5}
          color="blue.500"
          transition="transform 0.2s ease"
          transform={isOpen ? "rotate(90deg)" : "rotate(0deg)"}
          mt="2px"
          flexShrink={0}
        />
        <VStack align="start" spacing={1} flex="1" minW={0}>
          <Text fontWeight="semibold" color="blue.700" noOfLines={isOpen ? undefined : 1} flex="1">
            {role} | {category || "Uncategorized"}
          </Text>

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

/* --- normalize API payload to a single UI shape --- */
function normalizeSuggestionsPayload(payload) {
  // New structured shape present?
  if (payload && Array.isArray(payload.available_items) && Array.isArray(payload.suggestions)) {
    return {
      code: payload.code,
      kind: payload.kind,
      comparison: payload.comparison || null,
      availableItems: payload.available_items.map((it) => ({
        text: it.text,
        category: it.category || "",
        group: it.group || "",
      })),
      top5: payload.suggestions.map((s) => ({
        text: s.text,
        category: s.category || "",
        reason: s.reason || "",
      })),
      legacy: payload.response || "",
    };
  }

  // Legacy fallback (string parsing)
  const parsed = parseLegacy(payload?.response);
  return {
    code: payload?.code,
    kind: payload?.kind,
    comparison: null, // we only have lines of text; we’ll render them as-is
    availableItems: parsed.available.map((line) => {
      // Try to split "Title | category: CAT"
      const [title, catPart] = line.split("| category:");
      return {
        text: (title || "").trim(),
        category: (catPart || "").trim(),
        group: "",
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
            {/* Comparison header */}
            {data.comparison ? (
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
            ) : suggestions?.response && data.legacyComparisonLines?.length > 0 ? (
              <Box bg="gray.50" border="1px solid" borderColor="gray.200" rounded="md" p={3}>
                {data.legacyComparisonLines.map((l, i) => (
                  <Text key={i}>{l}</Text>
                ))}
              </Box>
            ) : null}

            {/* Top 5 */}
            {data.top5?.length > 0 && (
              <Box>
                <Heading size="sm" mb={3}>
                  Top 5 Suggestions (with Why)
                </Heading>
                <List spacing={3}>
                  {data.top5.map((item, idx) => (
                    <ListItem key={`${item.text}-${idx}`} display="flex" alignItems="start" gap={3}>
                      <Icon as={CheckCircle} mt="3px" />
                      <Box>
                        <Text fontWeight="semibold">
                          {item.text}
                          {item.category && (
                            <Badge ml={2} colorScheme="gray" variant="subtle">
                              {item.category}
                            </Badge>
                          )}
                        </Text>
                        {item.reason && <Text color="gray.600" mt={1}>{item.reason}</Text>}
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            <Divider />

            {/* Available Items */}
            {data.availableItems?.length > 0 && (
              <Box>
                <Heading size="sm" mb={3}>
                  Available Items
                </Heading>
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                  {data.availableItems.map((it, idx) => (
                    <ExpandableRoleCard role={it.text} category={it.category} key={`${it.text}-${idx}`} />
                  ))}
                </SimpleGrid>
              </Box>
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

  const apiAiUrl = useMemo(() => process.env.REACT_APP_API_AI_URL || "http://192.168.0.100:5000", []);

  useEffect(() => {
    if (!state) {
      toast({ title: "No submission found.", status: "warning", duration: 4000, isClosable: true });
      navigate("/services/sds");
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
    setOccError("");
    setEduError("");

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

    const occ = fetch(`${apiAiUrl}/suggest-by-code?${paramsOcc.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then(setOccSuggestions)
      .catch(() => setOccError("Could not load occupation suggestions."));

    const edu = fetch(`${apiAiUrl}/suggest-by-code?${paramsEdu.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then(setEduSuggestions)
      .catch(() => setEduError("Could not load education suggestions."));

    Promise.allSettled([occ, edu]).finally(() => {
      setOccLoading(false);
      setEduLoading(false);
    });
  }, [state, apiAiUrl, codeStr, userCode, dreamOccupations]);

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
            <Text fontSize="sm" opacity={0.9}>
              Answered: <b>{state.answeredCount ?? "—"}</b> • Submitted at:{" "}
              <b>{new Date(state.submittedAt).toLocaleString()}</b>
            </Text>
          </VStack>
        </Container>
      </Box>

      <Container maxW="8xl">
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