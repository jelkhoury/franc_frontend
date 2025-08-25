

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Spinner,
  Alert,
  AlertIcon,
  VStack,
  HStack,
  Divider,
  Button,
  useColorModeValue,
} from "@chakra-ui/react";

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

  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");

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
    alert("Answers captured. Check console for payload.");
  };

  return (
    <Box minH="100vh" bgGradient="linear(to-r, white, #ebf8ff)">
      <Box maxW="1000px" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 6, md: 10 }}>
        <Heading textAlign="center" mb={{ base: 6, md: 8 }}>
          SDS Sections & Questions
        </Heading>

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
                      <Text fontWeight="semibold">{section.name}</Text>
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