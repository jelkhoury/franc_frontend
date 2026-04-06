"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Heading,
  HStack,
  Input,
  Text,
  VStack,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Flex,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertDescription,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Divider,
  Link,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Icon,
  useColorModeValue,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useToast,
} from "@chakra-ui/react";
import { ArrowBackIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import {
  FaFileAlt,
  FaBrain,
  FaVideo,
  FaBalanceScale,
  FaStar,
} from "react-icons/fa";
import Footer from "../components/Footer";
import { get } from "../utils/httpServices";
import { captureError } from "../utils/sentryUtils";
import { getStoredToken, getUserId, getStoredUserId } from "../utils/tokenUtils";
import {
  SDS_ENDPOINTS,
  BLOB_STORAGE_ENDPOINTS,
  MOCK_INTERVIEW_ENDPOINTS,
  JOB_COMPARISON_ENDPOINTS,
} from "../services/apiService";
import RIASECScoringTable from "../components/Admin/RIASECScoringTable";
import {
  mapCriteriaFromApi,
  mapAnswersFromComparisonApi,
} from "./services/jobComparison/jobComparisonStateFromApi";

function pick(obj, ...keys) {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") return [data];
  return [];
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

const statusColor = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "completed") return "green";
  if (s === "in progress" || s === "draft") return "orange";
  return "gray";
};

/** Renders AI evaluation text like Manage Files (markdown-ish **bold**, bullets) */
function formatAiEvaluationToElements(evaluation) {
  if (!evaluation) return <Text color="gray.500">No evaluation available</Text>;
  const lines = String(evaluation).split("\n");
  const elements = [];
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed === "") {
      elements.push(<br key={index} />);
      return;
    }
    if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      elements.push(
        <Text key={index} fontWeight="bold" mt={2} mb={1} fontSize="sm">
          {trimmed.replace(/\*\*/g, "")}
        </Text>
      );
      return;
    }
    const boldRegex = /\*\*([^*]+)\*\*/g;
    if (/\*\*[^*]+\*\*/.test(trimmed)) {
      boldRegex.lastIndex = 0;
      const parts = [];
      let lastIndex = 0;
      let match;
      while ((match = boldRegex.exec(trimmed)) !== null) {
        if (match.index > lastIndex) {
          parts.push(trimmed.substring(lastIndex, match.index));
        }
        parts.push(
          <Text as="span" key={`b-${match.index}`} fontWeight="bold">
            {match[1]}
          </Text>
        );
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < trimmed.length) parts.push(trimmed.substring(lastIndex));
      elements.push(
        <Text key={index} mb={1} fontSize="sm">
          {parts}
        </Text>
      );
      return;
    }
    if (trimmed.startsWith("- ")) {
      elements.push(
        <Text key={index} ml={4} mb={1} fontSize="sm">
          {trimmed}
        </Text>
      );
      return;
    }
    elements.push(
      <Text key={index} mb={1} fontSize="sm" whiteSpace="pre-wrap">
        {trimmed}
      </Text>
    );
  });
  return elements.length ? elements : <Text fontSize="sm">No evaluation available</Text>;
}

function formatSdsFeedback(feedback) {
  if (!feedback) return <Text color="gray.500">No feedback available</Text>;
  return String(feedback)
    .split(/\r\n|\n/)
    .map((line, index) => (
      <Text key={index} mb={2} fontSize="sm">
        {line}
      </Text>
    ));
}

function buildRowsFromSds(results) {
  return results.map((r) => {
    const resultId = pick(r, "resultId", "ResultId") ?? Math.random();
    const holland = pick(r, "hollandCode", "HollandCode") || "—";
    const attempt = pick(r, "attemptNumber", "AttemptNumber");
    const createdAt =
      pick(r, "createdAt", "CreatedAt", "completedAt", "CompletedAt") ||
      new Date(0).toISOString();
    return {
      id: `sds-${resultId}`,
      type: "sds",
      summary: `Holland code ${holland}${
        attempt != null ? ` · attempt ${attempt}` : ""
      }`,
      status: "Completed",
      createdAt,
      sortTime: new Date(createdAt).getTime(),
      sdsResult: r,
    };
  });
}

function buildRowsFromFiles(files) {
  return files.map((f) => {
    const id = pick(f, "id", "Id");
    const title = pick(f, "title", "Title") || "";
    const isCover =
      String(title).toLowerCase().includes("cover") || title === "CoverLetter";
    const type = isCover ? "cover" : "resume";
    const ai = pick(f, "aiEvaluation", "AiEvaluation");
    const createdAt =
      pick(f, "createdAt", "CreatedAt", "uploadedAt", "UploadedAt") ||
      new Date(0).toISOString();
    const summary = ai
      ? `${String(ai).slice(0, 120)}${String(ai).length > 120 ? "…" : ""}`
      : isCover
        ? "Cover letter uploaded"
        : "Resume uploaded";
    return {
      id: `file-${id}`,
      type,
      summary,
      status: ai ? "Completed" : "Uploaded",
      createdAt,
      sortTime: new Date(createdAt).getTime(),
      fileDetail: f,
    };
  });
}

function buildRowsFromMockReports(reports) {
  return reports.map((r) => {
    const id = pick(r, "id", "Id");
    const overall = pick(r, "overallRating", "OverallRating");
    const comment = pick(r, "summaryComment", "SummaryComment") || "";
    const generatedAt =
      pick(r, "generatedAt", "GeneratedAt") || new Date(0).toISOString();
    const summary =
      overall != null
        ? `Overall ${Number(overall).toFixed(1)}/5 — ${comment.slice(0, 80)}${
            comment.length > 80 ? "…" : ""
          }`
        : comment.slice(0, 100) || "Mock interview report";
    return {
      id: `mock-${id}`,
      type: "mock",
      summary,
      status: "Completed",
      createdAt: generatedAt,
      sortTime: new Date(generatedAt).getTime(),
      mockReport: r,
    };
  });
}

function buildRowsFromJobComparisons(comparisons) {
  return comparisons
    .filter((c) => pick(c, "isCompleted", "IsCompleted") === true)
    .map((c) => {
      const id = pick(c, "id", "Id");
      const jobA = pick(c, "jobAName", "JobAName") || "Job A";
      const jobB = pick(c, "jobBName", "JobBName") || "Job B";
      const completed = pick(c, "isCompleted", "IsCompleted") === true;
      const createdAt =
        pick(c, "createdAt", "CreatedAt") || new Date(0).toISOString();
      const excelUrl = pick(c, "excelResultUrl", "ExcelResultUrl");
      return {
        id: `jc-${id}`,
        type: "jobComparison",
        summary: `${jobA} vs ${jobB}`,
        status: completed ? "Completed" : "In progress",
        createdAt,
        sortTime: new Date(createdAt).getTime(),
        jobComparisonDetail: { ...c, jobA, jobB, excelUrl, completed },
      };
    });
}

/** Card shell — natural height (no fixed min-height) to avoid empty middle gap */
function ActivityCard({ children, cardBorder }) {
  return (
    <Card
      variant="outline"
      borderColor={cardBorder}
      borderRadius="lg"
      shadow="sm"
      bg="white"
      w="100%"
      maxW={{ base: "100%", md: "420px" }}
      overflow="hidden"
    >
      {children}
    </Card>
  );
}

/** Collapsible section — unified brand styling */
function CollapsibleSection({
  title,
  description,
  icon,
  children,
  emptyLabel,
  isEmpty,
}) {
  const border = useColorModeValue("gray.200", "gray.600");
  const subtleBg = useColorModeValue("white", "gray.800");

  return (
    <AccordionItem
      borderWidth="1px"
      borderColor={border}
      borderRadius="xl"
      overflow="hidden"
      bg={subtleBg}
      boxShadow="sm"
    >
      <AccordionButton
        px={{ base: 4, md: 6 }}
        py={5}
        bg="brand.50"
        _hover={{ bg: "brand.100" }}
        _expanded={{ bg: "brand.50" }}
      >
        <Flex flex="1" align="flex-start" gap={4} textAlign="left">
          <Flex
            align="center"
            justify="center"
            w={12}
            h={12}
            borderRadius="lg"
            bg="white"
            color="brand.500"
            flexShrink={0}
            boxShadow="sm"
            borderWidth="1px"
            borderColor="brand.100"
          >
            <Icon as={icon} boxSize={6} />
          </Flex>
          <Box flex="1">
            <Heading size="md" color="gray.800">
              {title}
            </Heading>
            <Text fontSize="sm" color="gray.600" mt={1}>
              {description}
            </Text>
          </Box>
        </Flex>
        <AccordionIcon color="brand.500" fontSize="xl" />
      </AccordionButton>
      <AccordionPanel px={{ base: 4, md: 6 }} pb={6} pt={2} borderTopWidth="1px" borderColor={border}>
        {isEmpty ? (
          <Text color="gray.500" fontSize="sm" textAlign="center" py={6}>
            {emptyLabel}
          </Text>
        ) : (
          children
        )}
      </AccordionPanel>
    </AccordionItem>
  );
}

function RatingStars({ value, max = 5 }) {
  const n = Math.round(Number(value) || 0);
  return (
    <HStack spacing={0.5} aria-label={`Rating ${n} of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <Icon
          key={i}
          as={FaStar}
          color={i < n ? "brand.400" : "gray.200"}
          boxSize={3.5}
        />
      ))}
    </HStack>
  );
}

export default function ActivityHistoryPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [userIdNum, setUserIdNum] = useState(null);

  const [fileEvalModal, setFileEvalModal] = useState(null);
  const [sdsFeedbackModal, setSdsFeedbackModal] = useState(null);
  const [sdsScoringModal, setSdsScoringModal] = useState(null);
  const [hollandPoints, setHollandPoints] = useState(null);
  const [hollandLoading, setHollandLoading] = useState(false);
  const [hollandError, setHollandError] = useState("");

  const [mockModal, setMockModal] = useState(null);
  /** { url, title } when playing an answer video in a nested modal */
  const [mockVideoModal, setMockVideoModal] = useState(null);
  const [jobComparisonNavId, setJobComparisonNavId] = useState(null);

  const toast = useToast();
  const cardBorder = useColorModeValue("gray.100", "gray.700");

  const loadActivities = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      navigate("/login", { state: { from: "/activity-history" } });
      setLoading(false);
      return;
    }

    const rawId = getUserId(token) || getStoredUserId();
    const uid = parseInt(rawId, 10);
    if (Number.isNaN(uid)) {
      setWarnings(["Could not read your user id from the session."]);
      setUserIdNum(null);
      setLoading(false);
      return;
    }
    setUserIdNum(uid);

    setLoading(true);
    setWarnings([]);

    const settled = await Promise.allSettled([
      get(SDS_ENDPOINTS.GET_USER_SDS_RESULTS(uid), { token }),
      get(BLOB_STORAGE_ENDPOINTS.GET_USER_FILES(uid), { token }),
      get(MOCK_INTERVIEW_ENDPOINTS.GET_USER_INTERVIEW_REPORTS(uid), { token }),
      get(JOB_COMPARISON_ENDPOINTS.GET_ALL_BY_USER_ID(uid), { token }),
    ]);

    const labels = ["SDS results", "Files", "Mock interview reports", "Job comparisons"];
    const nextWarnings = [];
    const merged = [];

    settled.forEach((result, i) => {
      if (result.status === "rejected") {
        const err = result.reason;
        // Backend returns 404 when user has no job comparisons — treat as empty list
        if (
          i === 3 &&
          err &&
          (err.status === 404 ||
            /no job comparisons found/i.test(String(err.message || "")))
        ) {
          return;
        }
        captureError(err);
        nextWarnings.push(`${labels[i]}: ${err?.message || "request failed"}`);
        return;
      }
      const data = result.value;
      try {
        if (i === 0) merged.push(...buildRowsFromSds(normalizeArray(data)));
        if (i === 1) merged.push(...buildRowsFromFiles(normalizeArray(data)));
        if (i === 2) merged.push(...buildRowsFromMockReports(normalizeArray(data)));
        if (i === 3) merged.push(...buildRowsFromJobComparisons(normalizeArray(data)));
      } catch (e) {
        captureError(e);
        nextWarnings.push(`${labels[i]}: could not parse response`);
      }
    });

    merged.sort((a, b) => b.sortTime - a.sortTime);
    setRows(merged);
    setWarnings(nextWarnings);
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const activities = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const q = searchTerm.toLowerCase();
    return rows.filter((row) => {
      const typeLabel =
        row.type === "resume"
          ? "resume"
          : row.type === "cover"
            ? "cover"
            : row.type;
      const extra =
        row.fileDetail &&
        JSON.stringify(row.fileDetail).toLowerCase().includes(q);
      return (
        typeLabel.includes(q) ||
        (row.summary && row.summary.toLowerCase().includes(q)) ||
        (row.status && row.status.toLowerCase().includes(q)) ||
        extra
      );
    });
  }, [rows, searchTerm]);

  const grouped = useMemo(
    () => ({
      files: activities.filter((r) => r.type === "resume" || r.type === "cover"),
      sds: activities.filter((r) => r.type === "sds"),
      mock: activities.filter((r) => r.type === "mock"),
      jobComparison: activities.filter((r) => r.type === "jobComparison"),
    }),
    [activities]
  );

  const openSdsScoring = async (sdsRow) => {
    const token = getStoredToken();
    const r = sdsRow.sdsResult;
    const attempt = pick(r, "attemptNumber", "AttemptNumber");
    if (userIdNum == null || attempt == null) {
      setHollandError("Missing attempt data for scoring.");
      setSdsScoringModal(sdsRow);
      return;
    }
    setSdsScoringModal(sdsRow);
    setHollandPoints(null);
    setHollandError("");
    setHollandLoading(true);
    try {
      const response = await get(
        SDS_ENDPOINTS.GET_HOLLAND_POINTS_BY_ATTEMPT(userIdNum, attempt),
        { token }
      );
      if (response && response.message && response.data) {
        setHollandPoints(response.data);
      } else {
        setHollandPoints(response?.data ?? response);
      }
    } catch (err) {
      captureError(err);
      setHollandError(err.message || "Could not load RIASEC scores.");
    } finally {
      setHollandLoading(false);
    }
  };

  const closeSdsScoring = () => {
    setSdsScoringModal(null);
    setHollandPoints(null);
    setHollandError("");
  };

  const navigateToJobComparisonResults = async (comparisonDetail) => {
    const cid =
      pick(comparisonDetail, "id", "Id") ?? pick(comparisonDetail, "jobComparisonId");
    setJobComparisonNavId(cid);
    const token = getStoredToken();
    try {
      const rawCriteria = await get(JOB_COMPARISON_ENDPOINTS.GET_CRITERIA, { token });
      const criteria = mapCriteriaFromApi(
        Array.isArray(rawCriteria) ? rawCriteria : []
      );
      if (!criteria.length) {
        toast({
          title: "Could not load criteria",
          description: "The criteria list is empty. Try again later.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      const rawAnswers =
        comparisonDetail.answers ?? comparisonDetail.Answers ?? [];
      const answers = mapAnswersFromComparisonApi(rawAnswers);

      navigate("/job-comparison/results", {
        state: {
          jobAName: comparisonDetail.jobA ?? pick(comparisonDetail, "jobAName", "JobAName") ?? "",
          jobBName: comparisonDetail.jobB ?? pick(comparisonDetail, "jobBName", "JobBName") ?? "",
          criteria,
          answers,
          jobComparisonId: cid ?? 0,
          fromActivityHistory: true,
        },
      });
    } catch (e) {
      captureError(e);
      toast({
        title: "Could not open results",
        description: e?.message || "Failed to load comparison criteria.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setJobComparisonNavId(null);
    }
  };

  return (
    <Box bg="gray.50" minH="100vh">
      <Box maxW="1200px" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 8, md: 10 }}>
        <Button
          leftIcon={<ArrowBackIcon />}
          variant="outline"
          colorScheme="gray"
          mb={6}
          onClick={() => navigate(-1)}
        >
          Back
        </Button>

        <Heading color="brand.500" size="xl" mb={2}>
          Activity history
        </Heading>
        <Text color="gray.600" mb={6} fontSize="md" maxW="720px">
          Browse everything you have done on Franc, grouped by service. Open AI feedback,
          documents, RIASEC tables, and full mock interview reports when available.
        </Text>

        {warnings.length > 0 && (
          <Alert status="warning" borderRadius="md" mb={6}>
            <AlertIcon />
            <Box>
              <Text fontWeight="medium" fontSize="sm">
                Some data could not be loaded
              </Text>
              <AlertDescription fontSize="sm">
                {warnings.map((w) => (
                  <Text key={w}>{w}</Text>
                ))}
              </AlertDescription>
            </Box>
          </Alert>
        )}

        <Box mb={8} maxW="480px">
          <Input
            placeholder="Search across all sections…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            bg="white"
            borderColor="gray.200"
            size="lg"
            focusBorderColor="brand.500"
          />
          <Text fontSize="xs" color="gray.500" mt={2}>
            Filters every section below. {activities.length} matching entr
            {activities.length === 1 ? "y" : "ies"}.
          </Text>
        </Box>

        {loading ? (
          <Center py={20}>
            <VStack>
              <Spinner size="xl" color="brand.500" />
              <Text color="gray.500">Loading your history…</Text>
            </VStack>
          </Center>
        ) : (
          <VStack spacing={6} align="stretch">
            <Accordion
              allowMultiple
              reduceMotion
              defaultIndex={[0, 1, 2, 3]}
              spacing={4}
            >
            {/* Resume & cover */}
            <CollapsibleSection
              title="Resume & cover letter"
              description="Open files or read the full AI evaluation in a modal."
              icon={FaFileAlt}
              isEmpty={grouped.files.length === 0}
              emptyLabel={
                rows.length === 0
                  ? "No files yet, or this section failed to load."
                  : "No items match your search in this section."
              }
            >
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {grouped.files.map((row) => {
                  const f = row.fileDetail;
                  const title = pick(f, "title", "Title") || "Document";
                  const resumeUrl = pick(f, "resumeUrl", "ResumeUrl");
                  const coverUrl = pick(f, "coverUrl", "CoverUrl");
                  const jobAdUrl = pick(f, "jobAddUrl", "jobAdUrl", "JobAddUrl");
                  const ai = pick(f, "aiEvaluation", "AiEvaluation");
                  const isResume =
                    row.type === "resume" ||
                    String(title).toLowerCase().includes("resume");

                  return (
                    <ActivityCard key={row.id} cardBorder={cardBorder}>
                      <CardHeader pb={2}>
                        <HStack justify="space-between" align="flex-start">
                          <Badge colorScheme="brand" fontSize="sm" px={2} py={0.5}>
                            {isResume ? "Resume" : "Cover letter"}
                          </Badge>
                          <Badge
                            variant="subtle"
                            colorScheme={ai ? "gray" : "orange"}
                            fontSize="xs"
                          >
                            {ai ? "Ready" : "Pending"}
                          </Badge>
                        </HStack>
                        <Text fontSize="xs" color="gray.500" mt={2} lineHeight="short">
                          Full AI text opens in the modal.
                        </Text>
                      </CardHeader>
                      <CardBody pt={0}>
                        <VStack align="stretch" spacing={2}>
                          <HStack spacing={2} flexWrap="wrap">
                            {resumeUrl && (
                              <Button
                                as={Link}
                                href={resumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                size="sm"
                                variant="outline"
                                colorScheme="brand"
                                rightIcon={<ExternalLinkIcon />}
                              >
                                Resume (PDF)
                              </Button>
                            )}
                            {coverUrl && (
                              <Button
                                as={Link}
                                href={coverUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                size="sm"
                                variant="outline"
                                colorScheme="brand"
                                rightIcon={<ExternalLinkIcon />}
                              >
                                Cover (PDF)
                              </Button>
                            )}
                            {jobAdUrl && (
                              <Button
                                as={Link}
                                href={jobAdUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                size="sm"
                                variant="ghost"
                                colorScheme="gray"
                                rightIcon={<ExternalLinkIcon />}
                              >
                                Job ad
                              </Button>
                            )}
                          </HStack>
                          <Button
                            size="sm"
                            colorScheme="brand"
                            onClick={() => setFileEvalModal(f)}
                          >
                            View AI evaluation
                          </Button>
                        </VStack>
                      </CardBody>
                    </ActivityCard>
                  );
                })}
              </SimpleGrid>
            </CollapsibleSection>

            {/* SDS */}
            <CollapsibleSection
              title="Personality test (SDS)"
              description="Holland code, AI feedback, and RIASEC scoring table."
              icon={FaBrain}
              isEmpty={grouped.sds.length === 0}
              emptyLabel={
                rows.length === 0
                  ? "No SDS attempts found yet."
                  : "No SDS items match your search."
              }
            >
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {grouped.sds.map((row) => {
                  const r = row.sdsResult;
                  const holland = pick(r, "hollandCode", "HollandCode") || "—";
                  const attempt = pick(r, "attemptNumber", "AttemptNumber");
                  const feedback = pick(r, "aiFeedback", "AiFeedback");
                  return (
                    <ActivityCard key={row.id} cardBorder={cardBorder}>
                      <CardHeader pb={2}>
                        <HStack justify="space-between" flexWrap="wrap" align="flex-start">
                          <Badge colorScheme="brand" fontSize="md" px={3} py={1}>
                            {holland}
                          </Badge>
                          <Text fontSize="xs" color="gray.500" whiteSpace="nowrap">
                            {formatDate(row.createdAt)}
                          </Text>
                        </HStack>
                        <Text fontSize="sm" color="gray.600" mt={2}>
                          Attempt {attempt != null ? attempt : "—"}
                        </Text>
                      </CardHeader>
                      <CardBody pt={0}>
                        <VStack align="stretch" spacing={2}>
                          <Button
                            size="sm"
                            colorScheme="brand"
                            variant="outline"
                            isDisabled={!feedback}
                            onClick={() => setSdsFeedbackModal(row)}
                          >
                            View AI feedback
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="brand"
                            onClick={() => openSdsScoring(row)}
                          >
                            View RIASEC table
                          </Button>
                          {!feedback && (
                            <Text fontSize="xs" color="gray.500" textAlign="center">
                              No AI feedback for this attempt.
                            </Text>
                          )}
                        </VStack>
                      </CardBody>
                    </ActivityCard>
                  );
                })}
              </SimpleGrid>
            </CollapsibleSection>

            {/* Mock interviews */}
            <CollapsibleSection
              title="Mock interviews"
              description="Overall score and full evaluator report with videos."
              icon={FaVideo}
              isEmpty={grouped.mock.length === 0}
              emptyLabel={
                rows.length === 0
                  ? "No completed mock interview reports yet."
                  : "No mock interviews match your search."
              }
            >
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {grouped.mock.map((row) => {
                  const rep = row.mockReport;
                  const overall = pick(rep, "overallRating", "OverallRating");
                  return (
                    <ActivityCard key={row.id} cardBorder={cardBorder}>
                      <CardHeader pb={2}>
                        <HStack justify="space-between" align="flex-start">
                          <Badge colorScheme="brand" variant="subtle">
                            Mock interview
                          </Badge>
                          <Text fontSize="xs" color="gray.500" textAlign="right">
                            {formatDate(row.createdAt)}
                          </Text>
                        </HStack>
                        <HStack align="baseline" spacing={2} mt={3}>
                          <Text fontSize="4xl" fontWeight="bold" color="brand.600" lineHeight={1}>
                            {overall != null ? Number(overall).toFixed(1) : "—"}
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            / 5
                          </Text>
                        </HStack>
                        {overall != null && <RatingStars value={overall} />}
                        <Text fontSize="xs" color="gray.500" mt={2}>
                          Summary and per-question detail are in the report.
                        </Text>
                      </CardHeader>
                      <CardBody pt={0}>
                        <Button
                          size="sm"
                          colorScheme="brand"
                          w="full"
                          onClick={() => setMockModal(rep)}
                        >
                          Open full report
                        </Button>
                      </CardBody>
                    </ActivityCard>
                  );
                })}
              </SimpleGrid>
            </CollapsibleSection>

            {/* Job comparison */}
            <CollapsibleSection
              title="Job comparisons"
              description="Charts and criterion tables — same view as when you finish a comparison."
              icon={FaBalanceScale}
              isEmpty={grouped.jobComparison.length === 0}
              emptyLabel={
                rows.length === 0
                  ? "No job comparisons saved yet."
                  : "No comparisons match your search."
              }
            >
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {grouped.jobComparison.map((row) => {
                  const d = row.jobComparisonDetail;
                  return (
                    <ActivityCard key={row.id} cardBorder={cardBorder}>
                      <CardHeader pb={2}>
                        <Badge colorScheme="brand" variant="subtle" mb={2}>
                          Job comparison
                        </Badge>
                        <Text fontWeight="semibold" fontSize="md" noOfLines={2}>
                          {d.jobA}{" "}
                          <Text as="span" color="gray.400" fontWeight="normal">
                            vs
                          </Text>{" "}
                          {d.jobB}
                        </Text>
                        <HStack mt={2} justify="space-between" flexWrap="wrap">
                          <Badge colorScheme="gray" variant="subtle">
                            Completed
                          </Badge>
                          <Text fontSize="xs" color="gray.500">
                            {formatDate(row.createdAt)}
                          </Text>
                        </HStack>
                      </CardHeader>
                      <CardBody pt={0}>
                        <Button
                          size="sm"
                          colorScheme="brand"
                          w="full"
                          onClick={() => navigateToJobComparisonResults(d)}
                          isLoading={jobComparisonNavId === (d.id ?? d.Id)}
                          loadingText="Loading…"
                        >
                          View results
                        </Button>
                      </CardBody>
                    </ActivityCard>
                  );
                })}
              </SimpleGrid>
            </CollapsibleSection>
            </Accordion>

            {!loading && activities.length === 0 && rows.length > 0 && (
              <Text textAlign="center" color="gray.500" py={4}>
                Nothing matches your search. Clear the search box to see all activity.
              </Text>
            )}
            {!loading && rows.length === 0 && (
              <Text textAlign="center" color="gray.500" py={8}>
                No activity found yet, or all requests failed.
              </Text>
            )}
          </VStack>
        )}
      </Box>

      {/* File: AI evaluation */}
      <Modal
        isOpen={!!fileEvalModal}
        onClose={() => setFileEvalModal(null)}
        size="xl"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader>
            AI evaluation —{" "}
            {pick(fileEvalModal, "title", "Title") === "CoverLetter"
              ? "Cover letter"
              : pick(fileEvalModal, "title", "Title") || "Document"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {fileEvalModal && (
              <Box
                bg="gray.50"
                p={4}
                borderRadius="md"
                borderWidth="1px"
                borderColor="gray.200"
              >
                {formatAiEvaluationToElements(
                  pick(fileEvalModal, "aiEvaluation", "AiEvaluation")
                )}
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setFileEvalModal(null)}>
              Close
            </Button>
            {fileEvalModal && pick(fileEvalModal, "resumeUrl", "ResumeUrl") && (
              <Button
                as={Link}
                href={pick(fileEvalModal, "resumeUrl", "ResumeUrl")}
                target="_blank"
                rel="noopener noreferrer"
                colorScheme="brand"
                rightIcon={<ExternalLinkIcon />}
              >
                Open resume
              </Button>
            )}
            {fileEvalModal && pick(fileEvalModal, "coverUrl", "CoverUrl") && (
              <Button
                as={Link}
                href={pick(fileEvalModal, "coverUrl", "CoverUrl")}
                target="_blank"
                rel="noopener noreferrer"
                colorScheme="brand"
                ml={2}
                rightIcon={<ExternalLinkIcon />}
              >
                Open cover letter
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* SDS: AI feedback */}
      <Modal
        isOpen={!!sdsFeedbackModal}
        onClose={() => setSdsFeedbackModal(null)}
        size="lg"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>SDS — AI feedback</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {sdsFeedbackModal && (
              <VStack align="stretch" spacing={4}>
                <HStack>
                  <Text fontSize="sm" color="gray.500">
                    Holland code
                  </Text>
                  <Badge colorScheme="green" fontSize="md">
                    {pick(sdsFeedbackModal.sdsResult, "hollandCode", "HollandCode")}
                  </Badge>
                </HStack>
                <Box
                  bg="gray.50"
                  p={4}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="gray.200"
                >
                  {formatSdsFeedback(
                    pick(sdsFeedbackModal.sdsResult, "aiFeedback", "AiFeedback")
                  )}
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setSdsFeedbackModal(null)}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* SDS: RIASEC */}
      <Modal
        isOpen={!!sdsScoringModal}
        onClose={closeSdsScoring}
        size="6xl"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            RIASEC scoring
            {sdsScoringModal &&
              ` · attempt ${pick(sdsScoringModal.sdsResult, "attemptNumber", "AttemptNumber") ?? "—"}`}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <RIASECScoringTable
              hollandPoints={hollandPoints}
              loading={hollandLoading}
              error={hollandError}
            />
          </ModalBody>
          <ModalFooter>
            <Button onClick={closeSdsScoring}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Mock: full report */}
      <Modal
        isOpen={!!mockModal}
        onClose={() => {
          setMockVideoModal(null);
          setMockModal(null);
        }}
        size="4xl"
      >
        <ModalOverlay />
        <ModalContent maxH="92vh" borderRadius="xl">
          <ModalHeader borderBottomWidth="1px" bg="brand.50">
            <VStack align="stretch" spacing={1}>
              <Text fontSize="sm" fontWeight="normal" color="gray.600">
                Mock interview evaluation report
              </Text>
              <HStack justify="space-between" flexWrap="wrap" align="flex-end">
                <HStack spacing={4}>
                  <Box>
                    <Text fontSize="xs" color="gray.500">
                      Overall rating
                    </Text>
                    <HStack align="baseline">
                      <Text fontSize="4xl" fontWeight="bold" color="brand.600">
                        {pick(mockModal, "overallRating", "OverallRating") ?? "—"}
                      </Text>
                      <Text fontSize="lg" color="gray.500">
                        / 5
                      </Text>
                    </HStack>
                  </Box>
                  {pick(mockModal, "overallRating", "OverallRating") != null && (
                    <RatingStars value={pick(mockModal, "overallRating", "OverallRating")} />
                  )}
                </HStack>
                <Text fontSize="sm" color="gray.500">
                  {formatDate(pick(mockModal, "generatedAt", "GeneratedAt"))}
                </Text>
              </HStack>
            </VStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody overflowY="auto" py={6}>
            {mockModal && (
              <VStack align="stretch" spacing={8}>
                <Box
                  bg="gray.50"
                  p={5}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor="gray.200"
                >
                  <Text fontWeight="semibold" mb={2} color="gray.700">
                    Evaluator summary
                  </Text>
                  <Text fontSize="sm" whiteSpace="pre-wrap" color="gray.800">
                    {pick(mockModal, "summaryComment", "SummaryComment") || "—"}
                  </Text>
                </Box>

                <Box>
                  <Heading size="sm" mb={4} color="gray.700">
                    Question-by-question review
                  </Heading>
                  <VStack spacing={4} align="stretch">
                    {(pick(mockModal, "answers", "Answers") || []).map((a, idx) => {
                      const qTitle = pick(a, "questionTitle", "QuestionTitle");
                      const rating = pick(a, "rating", "Rating");
                      const vid = pick(a, "videoUrl", "VideoUrl");
                      return (
                        <Card key={pick(a, "answerId", "AnswerId") || idx} variant="outline" shadow="sm">
                          <CardHeader py={3} bg="gray.50">
                            <Text fontWeight="semibold" fontSize="sm">
                              {idx + 1}. {qTitle || "Question"}
                            </Text>
                          </CardHeader>
                          <CardBody pt={3}>
                            <HStack mb={3} flexWrap="wrap" spacing={4}>
                              <Box>
                                <Text fontSize="xs" color="gray.500" mb={1}>
                                  Rating
                                </Text>
                                <HStack>
                                  <Text fontSize="xl" fontWeight="bold">
                                    {rating ?? "—"}
                                  </Text>
                                  <Text fontSize="sm" color="gray.500">
                                    / 5
                                  </Text>
                                  {rating != null && <RatingStars value={rating} />}
                                </HStack>
                              </Box>
                              {vid && (
                                <Button
                                  size="sm"
                                  colorScheme="brand"
                                  variant="outline"
                                  onClick={() =>
                                    setMockVideoModal({
                                      url: vid,
                                      title: qTitle || `Question ${idx + 1}`,
                                    })
                                  }
                                >
                                  Watch answer video
                                </Button>
                              )}
                            </HStack>
                            <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap">
                              <Text as="span" fontWeight="semibold" display="block" mb={1}>
                                Comment
                              </Text>
                              {pick(a, "comment", "Comment") || "—"}
                            </Text>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </VStack>
                </Box>

                <Box>
                  <Heading size="sm" mb={3}>
                    Quick reference — all videos
                  </Heading>
                  <TableContainer>
                    <Table size="sm" variant="simple">
                      <Thead bg="gray.100">
                        <Tr>
                          <Th>#</Th>
                          <Th>Question</Th>
                          <Th isNumeric>Rating</Th>
                          <Th>Video</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {(pick(mockModal, "answers", "Answers") || []).map((a, idx) => (
                          <Tr key={pick(a, "answerId", "AnswerId") || idx}>
                            <Td>{idx + 1}</Td>
                            <Td fontSize="sm" maxW="220px">
                              {pick(a, "questionTitle", "QuestionTitle")}
                            </Td>
                            <Td isNumeric>{pick(a, "rating", "Rating") ?? "—"}</Td>
                            <Td>
                              {pick(a, "videoUrl", "VideoUrl") ? (
                                <Button
                                  size="xs"
                                  variant="link"
                                  colorScheme="brand"
                                  onClick={() =>
                                    setMockVideoModal({
                                      url: pick(a, "videoUrl", "VideoUrl"),
                                      title:
                                        pick(a, "questionTitle", "QuestionTitle") ||
                                        `Question ${idx + 1}`,
                                    })
                                  }
                                >
                                  Open video
                                </Button>
                              ) : (
                                "—"
                              )}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter borderTopWidth="1px" bg="gray.50">
            <Button
              onClick={() => {
                setMockVideoModal(null);
                setMockModal(null);
              }}
              colorScheme="brand"
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Mock interview: inline video — light UI, close only via X (no footer) */}
      <Modal
        isOpen={!!mockVideoModal}
        onClose={() => setMockVideoModal(null)}
        size="4xl"
        isCentered
      >
        <ModalOverlay bg="blackAlpha.300" />
        <ModalContent bg="white" maxW="900px" borderRadius="xl" boxShadow="xl">
          <ModalHeader color="gray.800" pr={12} borderBottomWidth="1px" borderColor="gray.100">
            {mockVideoModal?.title || "Answer video"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={4} pb={6}>
            {mockVideoModal?.url && (
              <Box
                borderRadius="md"
                overflow="hidden"
                bg="gray.100"
                borderWidth="1px"
                borderColor="gray.200"
                sx={{ aspectRatio: "16 / 9" }}
              >
                <video
                  key={mockVideoModal.url}
                  src={mockVideoModal.url}
                  controls
                  playsInline
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    objectFit: "contain",
                    backgroundColor: "#e2e8f0",
                  }}
                >
                  Your browser does not support embedded video.
                </video>
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      <Footer />
    </Box>
  );
}
