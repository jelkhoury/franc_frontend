import React, { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Divider,
  Spinner,
  Text,
  useColorModeValue,
  useToast,
  VStack,
  Alert,
  AlertIcon,
  Progress,
} from "@chakra-ui/react";

import confetti from "canvas-confetti";

import QuestionField from "../../components/QuestionField";

/**
 * SDS Try page
 * Fetches SDS sections + questions from /api/Sds/sections and renders them.
 * - Supports single choice (type=1) and multi choice (type=2)
 * - Captures answers in local state { [questionId]: value | value[] }
 * - Provides a Submit button (console.logs payload) – wire to your API as needed
 */
const SdsTry = () => {
  const baseUrl = useMemo(() => process.env.REACT_APP_API_BASE_URL || "http://localhost:5121", []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sections, setSections] = useState([]);
  const [answers, setAnswers] = useState({});

  const toast = useToast();

  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");

  const totalQs = sections.reduce((sum, s) => sum + ((s.questions || []).length), 0);
  const answered = Object.keys(answers).length;

  const riasecMeta = {
    Realistic: { emoji: "🛠️", color: "teal" },
    Investigative: { emoji: "🧪", color: "purple" },
    Artistic: { emoji: "🎨", color: "pink" },
    Social: { emoji: "🤝", color: "green" },
    Enterprising: { emoji: "🚀", color: "orange" },
    Conventional: { emoji: "📊", color: "blue" },
  };

  const progressPct = totalQs > 0 ? Math.round((answered / totalQs) * 100) : 0;

  const earnedBadges = [];
  if (answered > 0) earnedBadges.push({ label: "Getting Started", icon: "✨" });
  if (answered >= Math.ceil(totalQs / 2) && totalQs > 0) earnedBadges.push({ label: "Halfway", icon: "🧭" });
  if (answered === totalQs && totalQs > 0) earnedBadges.push({ label: "Finisher", icon: "🎖️" });

  useEffect(() => {
    const fetchSections = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${baseUrl}/api/Sds/sections`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setSections(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    fetchSections();
  }, [baseUrl]);

  const handleSingleChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleMultiChange = (questionId, values) => {
    setAnswers((prev) => ({ ...prev, [questionId]: values }));
  };

  const handleSubmit = () => {
    const payload = {
      submittedAt: new Date().toISOString(),
      answers: Object.entries(answers).map(([questionId, value]) => ({
        questionId: Number(questionId),
        value,
      })),
    };
    // TODO: POST to your backend endpoint
    // await fetch(`${baseUrl}/api/Sds/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    // For now, just log it
    // eslint-disable-next-line no-console
    console.log("SDS payload", payload);
    toast({ title: "Submitted!", description: "Great job — your answers were captured.", status: "success", duration: 2500, isClosable: true });
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
  };

  return (
    <Box minH="100vh" bgGradient="linear(to-r, white, #ebf8ff)">
      <Box maxW="1000px" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 6, md: 10 }}>
        <Heading textAlign="center" mb={{ base: 6, md: 8 }}>
          SDS Sections & Questions
        </Heading>

        {/* Progress & Badges */}
        <Box mb={6}>
          <Progress value={progressPct} rounded="full" size="sm" />
          <HStack mt={2} justify="space-between">
            <Text fontSize="sm" color="gray.600">{answered}/{totalQs} answered ({progressPct}%)</Text>
            <HStack spacing={2}>
              {earnedBadges.map((b, i) => (
                <Badge key={i}  variant="subtle">{b.icon} {b.label}</Badge>
              ))}
            </HStack>
          </HStack>
        </Box>

        {loading && (
          <HStack justify="center" py={10}>
            <Spinner size="lg" />
            <Text>Loading…</Text>
          </HStack>
        )}

        {error && (
          <Alert status="error" mb={6}>
            <AlertIcon /> Failed to load sections: {error}
          </Alert>
        )}

        {!loading && !error && (
          <Accordion allowMultiple>
            {sections.map((section) => (
              <AccordionItem key={section.id} border="1px" borderColor={cardBorder} rounded="md" bg={cardBg} mb={4}>
                <h2>
                  <AccordionButton py={5} px={6}>
                    <Box as="span" flex="1" textAlign="left">
                      {(() => {
                        const meta = riasecMeta[section.name] || { emoji: "⭐"};
                        return (
                          <HStack>
                            <Badge colorScheme={meta.color}>{meta.emoji}</Badge>
                            <Text fontWeight="semibold">{section.name}</Text>
                          </HStack>
                        );
                      })()}
                      {section.description && (
                        <Text fontSize="sm" color="gray.600">{section.description}</Text>
                      )}
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={6} px={{ base: 4, md: 6 }}>
                  <VStack align="stretch" spacing={6}>
                    {(section.questions || []).map((q, idx) => (
                      <Box key={q.id}>
                        <QuestionField
                          type={q.type}
                          text={`${idx + 1}. ${q.text}`}
                          value={answers[q.id]}
                          options={(q.answerOptions || []).map(opt => ({ id: opt.id, text: opt.text, value: String(opt.value) }))}
                          onChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
                        />
                        <Divider mt={4} />
                      </Box>
                    ))}
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        {!loading && !error && sections.length > 0 && (
          <Box textAlign="center">
            <Button colorScheme="blue" size="lg" mt={6} onClick={handleSubmit}>
              Submit
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SdsTry;