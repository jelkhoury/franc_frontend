import {
  Badge,
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  HStack,
  Icon,
  List,
  ListIcon,
  ListItem,
  Progress,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { CheckCircleIcon, WarningIcon } from "@chakra-ui/icons";

function humanizeKey(key) {
  if (typeof key !== "string") return String(key);
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function extractScore(text) {
  if (typeof text !== "string") return null;
  const m =
    text.match(/(\d{1,3})\s*\/\s*100\b/) ||
    text.match(/\b(?:score|rating)[:\s]+(\d{1,3})\b/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  if (Number.isNaN(n) || n < 0 || n > 100) return null;
  return n;
}

function pickNumericScoreFromObject(obj) {
  if (!obj || typeof obj !== "object") return null;
  const keys = [
    "overall_score",
    "OverallScore",
    "overallScore",
    "score",
    "Score",
    "rating",
    "Rating",
  ];
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && v >= 0 && v <= 100 && !Number.isNaN(v)) {
      return v;
    }
  }
  return null;
}

function tryParseJsonString(str) {
  const t = str.trim();
  if (
    (t.startsWith("{") && t.endsWith("}")) ||
    (t.startsWith("[") && t.endsWith("]"))
  ) {
    try {
      return JSON.parse(t);
    } catch {
      return null;
    }
  }
  return null;
}

function parseMarkdownishSections(text) {
  const trimmed = text.trim();
  const chunks = trimmed.split(/\n(?=#{1,3}\s+)/);
  if (chunks.length === 1 && !trimmed.match(/^#{1,3}\s/m)) {
    return null;
  }
  return chunks.map((chunk) => {
    const c = chunk.trim();
    const m = c.match(/^(#{1,3})\s+(.+?)(?:\n|$)/);
    if (m) {
      return {
        title: m[2].trim(),
        body: c.slice(m[0].length).trim(),
      };
    }
    return { title: null, body: c };
  });
}

const KEY_ORDER = [
  "overall_score",
  "score",
  "rating",
  "summary",
  "overall_summary",
  "executive_summary",
  "overview",
  "strengths",
  "highlights",
  "what_works_well",
  "weaknesses",
  "areas_for_improvement",
  "improvements",
  "recommendations",
  "suggestions",
  "next_steps",
  "sections",
  "feedback",
];

function sortObjectKeys(obj) {
  const keys = Object.keys(obj);
  return keys.sort((a, b) => {
    const ia = KEY_ORDER.indexOf(a);
    const ib = KEY_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

function isBulletLine(line) {
  return /^(\s*[-*•]|\s*\d+\.)\s+/.test(line);
}

function renderTextBlock(body, keyPrefix = "") {
  const lines = body.split("\n");
  const blocks = [];
  let buf = [];

  const flushBuf = () => {
    if (buf.length === 0) return;
    const allBullets = buf.every((l) => isBulletLine(l) || l.trim() === "");
    const filtered = buf.filter((l) => l.trim() !== "");
    if (allBullets && filtered.length > 0) {
      blocks.push(
        <List key={`${keyPrefix}-list-${blocks.length}`} spacing={2} pl={0} styleType="none">
          {filtered.map((line, i) => {
            const clean = line.replace(/^(\s*[-*•]|\s*\d+\.)\s+/, "").trim();
            return (
              <ListItem key={i} display="flex" alignItems="flex-start" gap={2}>
                <Text
                  as="span"
                  color="brand.500"
                  fontWeight="bold"
                  flexShrink={0}
                  mt="0.2em"
                  lineHeight="short"
                >
                  •
                </Text>
                <Text fontSize="md" color="gray.700" lineHeight="tall">
                  {clean}
                </Text>
              </ListItem>
            );
          })}
        </List>
      );
    } else {
      blocks.push(
        <Text
          key={`${keyPrefix}-p-${blocks.length}`}
          fontSize="md"
          color="gray.700"
          lineHeight="tall"
          whiteSpace="pre-wrap"
        >
          {buf.join("\n").trim()}
        </Text>
      );
    }
    buf = [];
  };

  for (const line of lines) {
    if (isBulletLine(line)) {
      if (buf.length && !buf.every((l) => isBulletLine(l) || l.trim() === "")) {
        flushBuf();
      }
      buf.push(line);
    } else {
      if (buf.length && buf.some((l) => isBulletLine(l))) {
        flushBuf();
      }
      buf.push(line);
    }
  }
  flushBuf();
  return blocks;
}

function ScoreBanner({ score }) {
  const colorScheme =
    score >= 75 ? "green" : score >= 50 ? "yellow" : "orange";
  return (
    <Box
      borderRadius="xl"
      bg={`${colorScheme}.50`}
      borderWidth="1px"
      borderColor={`${colorScheme}.200`}
      p={5}
      w="full"
    >
      <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
        <VStack align="start" spacing={1}>
          <Text fontSize="sm" fontWeight="semibold" color="gray.600" textTransform="uppercase" letterSpacing="wide">
            Overall impression
          </Text>
          <Text fontSize="lg" fontWeight="bold" color="gray.800">
            Resume strength
          </Text>
        </VStack>
        <HStack spacing={4} align="center">
          <Badge colorScheme={colorScheme} fontSize="2xl" px={4} py={2} borderRadius="lg">
            {score}/100
          </Badge>
        </HStack>
      </HStack>
      <Progress
        value={score}
        size="sm"
        colorScheme={colorScheme}
        borderRadius="full"
        mt={4}
      />
    </Box>
  );
}

function renderValue(value, depth = 0) {
  if (value === null || value === undefined) {
    return (
      <Text fontSize="sm" color="gray.500" fontStyle="italic">
        —
      </Text>
    );
  }
  if (typeof value === "boolean") {
    return <Text fontSize="md">{value ? "Yes" : "No"}</Text>;
  }
  if (typeof value === "number") {
    return (
      <Text fontSize="md" fontWeight="medium" color="gray.800">
        {value}
      </Text>
    );
  }
  if (typeof value === "string") {
    return <Box>{renderTextBlock(value, "str")}</Box>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <Text fontSize="sm" color="gray.500" fontStyle="italic">
          None listed
        </Text>
      );
    }
    if (value.every((v) => typeof v === "string" || typeof v === "number")) {
      return (
        <List spacing={2} styleType="none" pl={0}>
          {value.map((item, i) => (
            <ListItem key={i} display="flex" alignItems="flex-start" gap={2}>
              <ListIcon as={CheckCircleIcon} color="green.500" mt={0.5} flexShrink={0} />
              <Text fontSize="md" color="gray.700" lineHeight="tall">
                {String(item)}
              </Text>
            </ListItem>
          ))}
        </List>
      );
    }
    return (
      <VStack align="stretch" spacing={3}>
        {value.map((item, i) => (
          <Box key={i} pl={depth > 0 ? 2 : 0} borderLeftWidth={depth > 0 ? "2px" : 0} borderColor="brand.100">
            {typeof item === "object" && item !== null ? (
              <StructuredObject data={item} depth={depth + 1} />
            ) : (
              renderValue(item, depth + 1)
            )}
          </Box>
        ))}
      </VStack>
    );
  }
  if (typeof value === "object") {
    return <StructuredObject data={value} depth={depth + 1} />;
  }
  return null;
}

function sectionIconForKey(key) {
  const k = key.toLowerCase();
  if (k.includes("strength") || k.includes("highlight") || k.includes("work_well"))
    return CheckCircleIcon;
  if (
    k.includes("weak") ||
    k.includes("improve") ||
    k.includes("recommend") ||
    k.includes("issue") ||
    k.includes("gap")
  )
    return WarningIcon;
  return null;
}

function StructuredObject({ data, depth = 0 }) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }
  const keys = sortObjectKeys(data);
  return (
    <VStack align="stretch" spacing={4}>
      {keys.map((key) => {
        const value = data[key];
        if (value === undefined) return null;
        const SectionGlyph = sectionIconForKey(key);
        const title = humanizeKey(key);
        const showBulletMarker = SectionGlyph == null;
        const isNestedObject =
          value !== null &&
          typeof value === "object" &&
          !Array.isArray(value) &&
          Object.keys(value).length > 0;
        const isSimpleArray =
          Array.isArray(value) &&
          value.every((v) => typeof v === "string" || typeof v === "number");

        return (
          <Card
            key={key}
            variant="outline"
            shadow="sm"
            borderColor="gray.200"
            overflow="hidden"
          >
            <CardHeader
              py={3}
              px={5}
              bg={depth === 0 ? "gray.50" : "white"}
              borderBottomWidth="1px"
              borderColor="gray.100"
            >
              <HStack spacing={2} align="center">
                {showBulletMarker ? (
                  <Text color="brand.500" fontWeight="bold" fontSize="lg" lineHeight="none" flexShrink={0}>
                    •
                  </Text>
                ) : (
                  <Icon as={SectionGlyph} color="brand.500" boxSize={5} flexShrink={0} />
                )}
                <Heading size="sm" color="gray.800" fontWeight="semibold">
                  {title}
                </Heading>
              </HStack>
            </CardHeader>
            <CardBody pt={4} pb={5} px={5}>
              {isNestedObject ? (
                <StructuredObject data={value} depth={depth + 1} />
              ) : isSimpleArray && value.length > 3 ? (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                  {value.map((item, i) => (
                    <HStack key={i} align="start" spacing={2}>
                      <ListIcon as={CheckCircleIcon} color="green.500" mt={1} flexShrink={0} />
                      <Text fontSize="md" color="gray.700">
                        {String(item)}
                      </Text>
                    </HStack>
                  ))}
                </SimpleGrid>
              ) : (
                renderValue(value, depth)
              )}
            </CardBody>
          </Card>
        );
      })}
    </VStack>
  );
}

function MarkdownSectionsView({ sections }) {
  return (
    <VStack align="stretch" spacing={4}>
      {sections.map((sec, i) => (
        <Card key={i} variant="outline" shadow="sm" borderColor="gray.200">
          {sec.title && (
            <CardHeader py={3} px={5} bg="gray.50" borderBottomWidth="1px" borderColor="gray.100">
              <Heading size="sm" color="gray.800">
                {sec.title}
              </Heading>
            </CardHeader>
          )}
          <CardBody pt={sec.title ? 4 : 5} pb={5} px={5}>
            <VStack align="stretch" spacing={3}>
              {renderTextBlock(sec.body || "", `md-${i}`)}
            </VStack>
          </CardBody>
        </Card>
      ))}
    </VStack>
  );
}

/**
 * Renders AI resume evaluation — supports JSON objects, markdown-ish headers, and plain text.
 */
export default function ResumeEvaluationDisplay({ evaluationResult }) {
  if (
    evaluationResult == null ||
    (typeof evaluationResult === "string" && !evaluationResult.trim())
  ) {
    return (
      <Text color="gray.500" fontSize="md" textAlign="center" py={4}>
        No written feedback was returned. Try again in a moment or use a different file.
      </Text>
    );
  }

  let data = evaluationResult;
  if (typeof data === "string") {
    const parsed = tryParseJsonString(data);
    if (parsed !== null) {
      data = parsed;
    }
  }

  const scoreFromString =
    typeof evaluationResult === "string" ? extractScore(evaluationResult) : null;

  if (typeof data === "object" && data !== null && !Array.isArray(data)) {
    const numericScore = pickNumericScoreFromObject(data) ?? scoreFromString;

    const rest = { ...data };
    [
      "overall_score",
      "OverallScore",
      "overallScore",
      "score",
      "Score",
      "rating",
      "Rating",
    ].forEach((k) => {
      delete rest[k];
    });
    const hasOtherKeys = Object.keys(rest).length > 0;

    return (
      <VStack align="stretch" spacing={5} w="full">
        {numericScore != null && numericScore >= 0 && numericScore <= 100 && (
          <ScoreBanner score={Math.round(numericScore)} />
        )}
        {hasOtherKeys ? (
          <StructuredObject data={rest} />
        ) : numericScore != null ? (
          <Text color="gray.600" fontSize="md" textAlign="center" py={2}>
            Your score is shown above. Upload another version anytime to track improvements.
          </Text>
        ) : (
          <Text color="gray.600" fontSize="sm">
            No detailed sections were returned.
          </Text>
        )}
      </VStack>
    );
  }

  if (Array.isArray(data)) {
    return (
      <VStack align="stretch" spacing={4} w="full">
        {scoreFromString != null && <ScoreBanner score={scoreFromString} />}
        {data.map((item, i) => (
          <Card key={i} variant="outline" shadow="sm">
            <CardBody>
              {typeof item === "object" && item !== null ? (
                <StructuredObject data={item} />
              ) : (
                renderValue(item)
              )}
            </CardBody>
          </Card>
        ))}
      </VStack>
    );
  }

  const text = typeof data === "string" ? data : String(data);
  const mdSections = parseMarkdownishSections(text);
  const score = extractScore(text);

  if (mdSections) {
    return (
      <VStack align="stretch" spacing={5} w="full">
        {score != null && <ScoreBanner score={score} />}
        <MarkdownSectionsView sections={mdSections} />
      </VStack>
    );
  }

  return (
    <VStack align="stretch" spacing={5} w="full">
      {score != null && <ScoreBanner score={score} />}
      <Card variant="outline" shadow="sm" borderColor="gray.200">
        <CardHeader py={3} px={5} bg="gray.50" borderBottomWidth="1px" borderColor="gray.100">
          <Heading size="sm" color="gray.800">
            Feedback
          </Heading>
        </CardHeader>
        <CardBody pt={4} pb={5} px={5}>
          <VStack align="stretch" spacing={4}>
            {text.split(/\n{2,}/).map((para, i) => (
              <Box key={i}>{renderTextBlock(para.trim(), `para-${i}`)}</Box>
            ))}
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
}
