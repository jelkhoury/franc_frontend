import React, { useMemo, useState } from "react";
import {
  Box, Heading, Text, VStack, HStack, Badge, Progress, Button, Divider, Accordion,
  AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, useColorModeValue,
  RadioGroup, Radio, CheckboxGroup, Checkbox, Select, Textarea, Slider, SliderTrack,
  SliderFilledTrack, SliderThumb, Alert, AlertIcon, Tag, TagLabel
} from "@chakra-ui/react";

// Optional flair
import { motion } from "framer-motion";      // remove if you don't want animations
import confetti from "canvas-confetti";      // remove if you don't want confetti

const MotionBox = motion ? motion(Box) : Box;

// ---------- MOCK DATA (wireframe only) ----------
const DEMO_SECTIONS = [
  {
    id: 1,
    name: "Occupational Daydreams",
    description: "Pick 2–3 dream jobs and enter three RIASEC codes.",
    questions: [
      {
        id: 1001,
        type: 2, // chips multi-select
        text: "Pick 2–3 dream jobs",
        minSelect: 2,
        maxSelect: 3,
        answerOptions: [
          { id: 1, text: "Product Designer", value: "prod_designer" },
          { id: 2, text: "Data Scientist", value: "data_scientist" },
          { id: 3, text: "Mechanical Engineer", value: "mech_engineer" },
          { id: 4, text: "Marketing Manager", value: "marketing_manager" },
          { id: 5, text: "Teacher", value: "teacher" },
          { id: 6, text: "Nurse", value: "nurse" },
          { id: 7, text: "Software Engineer", value: "software_engineer" },
          { id: 8, text: "Graphic Artist", value: "graphic_artist" },
        ],
      },
      {
        id: 1002,
        type: 5, // textbox
        text: "Enter three RIASEC codes (e.g., RIA, SEC)",
        placeholder: "RIA, SEC, ...",
      },
    ],
  },
  {
    id: 2,
    name: "Activities",
    description: "Mark Like (L) or Dislike (D) for each activity.",
    questions: [
      {
        id: 2001,
        type: 1, // radio L/D
        text: "Build a wooden bookshelf",
        answerOptions: [
          { id: 1, text: "L", value: "L" },
          { id: 2, text: "D", value: "D" },
        ],
      },
      {
        id: 2002,
        type: 1,
        text: "Write a short story",
        answerOptions: [
          { id: 1, text: "L", value: "L" },
          { id: 2, text: "D", value: "D" },
        ],
      },
      {
        id: 2003,
        type: 1,
        text: "Repair a bicycle",
        answerOptions: [
          { id: 1, text: "L", value: "L" },
          { id: 2, text: "D", value: "D" },
        ],
      },
      {
        id: 2004,
        type: 1,
        text: "Help organize a community event",
        answerOptions: [
          { id: 1, text: "L", value: "L" },
          { id: 2, text: "D", value: "D" },
        ],
      },
      {
        id: 2005,
        type: 1,
        text: "Analyze a dataset for patterns",
        answerOptions: [
          { id: 1, text: "L", value: "L" },
          { id: 2, text: "D", value: "D" },
        ],
      },
    ],
  },
  {
    id: 3,
    name: "Competencies",
    description: "Can do well (Y) or Not well (N).",
    questions: [
      {
        id: 3001,
        type: 1, // radio Y/N
        text: "Present to a group",
        answerOptions: [
          { id: 1, text: "Y", value: "Y" },
          { id: 2, text: "N", value: "N" },
        ],
      },
      {
        id: 3002,
        type: 1,
        text: "Use power tools",
        answerOptions: [
          { id: 1, text: "Y", value: "Y" },
          { id: 2, text: "N", value: "N" },
        ],
      },
      {
        id: 3003,
        type: 1,
        text: "Write clear reports",
        answerOptions: [
          { id: 1, text: "Y", value: "Y" },
          { id: 2, text: "N", value: "N" },
        ],
      },
      {
        id: 3004,
        type: 1,
        text: "Teach a new skill",
        answerOptions: [
          { id: 1, text: "Y", value: "Y" },
          { id: 2, text: "N", value: "N" },
        ],
      },
      {
        id: 3005,
        type: 1,
        text: "Solve math problems",
        answerOptions: [
          { id: 1, text: "Y", value: "Y" },
          { id: 2, text: "N", value: "N" },
        ],
      },
    ],
  },
  {
    id: 4,
    name: "Occupations",
    description: "Interested (Y) or Not interested (N).",
    questions: [
      {
        id: 4001,
        type: 1, // radio Y/N
        text: "Civil Engineer",
        answerOptions: [
          { id: 1, text: "Y", value: "Y" },
          { id: 2, text: "N", value: "N" },
        ],
      },
      {
        id: 4002,
        type: 1,
        text: "UX Designer",
        answerOptions: [
          { id: 1, text: "Y", value: "Y" },
          { id: 2, text: "N", value: "N" },
        ],
      },
      {
        id: 4003,
        type: 1,
        text: "School Counselor",
        answerOptions: [
          { id: 1, text: "Y", value: "Y" },
          { id: 2, text: "N", value: "N" },
        ],
      },
      {
        id: 4004,
        type: 1,
        text: "Entrepreneur",
        answerOptions: [
          { id: 1, text: "Y", value: "Y" },
          { id: 2, text: "N", value: "N" },
        ],
      },
      {
        id: 4005,
        type: 1,
        text: "Accountant",
        answerOptions: [
          { id: 1, text: "Y", value: "Y" },
          { id: 2, text: "N", value: "N" },
        ],
      },
    ],
  },
  {
    id: 5,
    name: "Self-Estimates",
    description: "Rate your ability from 1 (low) to 7 (high).",
    questions: [
      { id: 5001, type: 4, text: "Mechanical ability", sliderProps: { min: 1, max: 7, step: 1 } },
      { id: 5002, type: 4, text: "Scientific ability", sliderProps: { min: 1, max: 7, step: 1 } },
      { id: 5003, type: 4, text: "Artistic ability", sliderProps: { min: 1, max: 7, step: 1 } },
      { id: 5004, type: 4, text: "Teaching ability", sliderProps: { min: 1, max: 7, step: 1 } },
      { id: 5005, type: 4, text: "Sales/Leadership ability", sliderProps: { min: 1, max: 7, step: 1 } },
      { id: 5006, type: 4, text: "Clerical ability", sliderProps: { min: 1, max: 7, step: 1 } },
    ],
  },
];

const RIASEC_META = {
  "Occupational Daydreams": { emoji: "💭", color: "pink", bg: "pink.400" },
  Activities: { emoji: "🧩", color: "teal", bg: "teal.400" },
  Competencies: { emoji: "🏅", color: "purple", bg: "purple.400" },
  Occupations: { emoji: "💼", color: "orange", bg: "orange.400" },
  "Self-Estimates": { emoji: "📊", color: "blue", bg: "blue.500" },
};

// ---------- INLINE FIELD RENDERER (wireframe-only) ----------
function Field({
  type, text, options = [], value, onChange, sliderProps = {}, required = false,
}) {
  const chipBorder = useColorModeValue("gray.200", "gray.600");
  const chipBgSel = useColorModeValue("blue.50", "blue.900");
  const chipBg = useColorModeValue("white", "gray.800");

  return (
    <Box>
      {text && (
        <Text fontWeight="semibold" mb={2}>
          {text}{required ? " *" : ""}
        </Text>
      )}

      {/* 1 = radio (chips) */}
      {type === 1 && (
        <RadioGroup value={value ?? ""} onChange={onChange}>
          <HStack wrap="wrap" spacing={3}>
            {options.map((opt) => {
              const selected = String(value) === String(opt.value);
              return (
                <MotionBox
                  key={opt.id ?? opt.value}
                  as="label"
                  px={3} py={2}
                  rounded="full"
                  borderWidth="1px"
                  borderColor={selected ? "blue.400" : chipBorder}
                  bg={selected ? chipBgSel : chipBg}
                  cursor="pointer"
                  display="inline-flex"
                  alignItems="center"
                  gap={2}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Radio value={String(opt.value)} display="none" />
                  <Text fontSize="sm">{opt.text}</Text>
                </MotionBox>
              );
            })}
          </HStack>
        </RadioGroup>
      )}

      {/* 2 = checkbox (chips) */}
      {type === 2 && (
        <CheckboxGroup value={Array.isArray(value) ? value : []}
          onChange={onChange}>
          <HStack wrap="wrap" spacing={3}>
            {options.map((opt) => {
              const selected = (value || []).map(String).includes(String(opt.value));
              return (
                <MotionBox
                  key={opt.id ?? opt.value}
                  as="label"
                  px={3} py={2}
                  rounded="full"
                  borderWidth="1px"
                  borderColor={selected ? "green.400" : chipBorder}
                  bg={selected ? useColorModeValue("green.50", "green.900") : chipBg}
                  cursor="pointer"
                  display="inline-flex"
                  alignItems="center"
                  gap={2}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Checkbox value={String(opt.value)} display="none" />
                  <Text fontSize="sm">{opt.text}</Text>
                </MotionBox>
              );
            })}
          </HStack>
        </CheckboxGroup>
      )}

      {/* 3 = select */}
      {type === 3 && (
        <Select value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
          <option value="" disabled hidden>Select…</option>
          {(options || []).map((opt) => (
            <option key={opt.id ?? opt.value} value={String(opt.value)}>{opt.text}</option>
          ))}
        </Select>
      )}

      {/* 4 = slider with face */}
      {type === 4 && (
        <Box>
          <Slider
            value={typeof value === "number" ? value : Number(value ?? (sliderProps.min ?? 0))}
            min={sliderProps.min ?? 0}
            max={sliderProps.max ?? 10}
            step={sliderProps.step ?? 1}
            onChange={onChange}
          >
            <SliderTrack><SliderFilledTrack /></SliderTrack>
            <SliderThumb boxSize={8}>
              <Text fontSize="lg">
                {(() => {
                  const v = typeof value === "number" ? value : Number(value ?? 0);
                  const max = sliderProps.max ?? 10;
                  return v >= max * 0.8 ? "🤩"
                    : v >= max * 0.6 ? "🙂"
                    : v >= max * 0.4 ? "😐"
                    : v >= max * 0.2 ? "🙁"
                    : "😣";
                })()}
              </Text>
            </SliderThumb>
          </Slider>
          <Text mt={2} fontSize="sm" color="gray.600">
            {typeof value === "number" ? value : Number(value ?? 0)}
          </Text>
        </Box>
      )}

      {/* 5 = textbox */}
      {type === 5 && (
        <Textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={typeof options === "string" ? options : undefined} />
      )}

      {/* 6 = textarea (same control; longer answer) */}
      {type === 6 && (
        <Textarea rows={5} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
      )}
    </Box>
  );
}

// ---------- THE DEMO PAGE ----------
export default function SdsFunDemo() {
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");

  const [sections] = useState(DEMO_SECTIONS);
  const [answers, setAnswers] = useState({});   // { [qid]: value | value[] }

  const total = useMemo(() => sections.reduce((s, sec) => s + (sec.questions?.length || 0), 0), [sections]);
  const answeredCount = Object.keys(answers).length;
  const progress = total ? Math.round((answeredCount / total) * 100) : 0;

  const earned = [];
  if (answeredCount > 0) earned.push({ icon: "✨", label: "Getting Started" });
  if (answeredCount >= Math.ceil(total/2) && total > 0) earned.push({ icon: "🧭", label: "Halfway" });

  const handleChange = (qid, val) => {
    setAnswers(prev => ({ ...prev, [qid]: val }));
  };

  const handleSubmit = () => {
    // demo only
    confetti?.({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    console.log("DEMO payload", {
      submittedAt: new Date().toISOString(),
      answers
    });
  };

  return (
    <Box minH="100vh" bgGradient="linear(to-r, white, #ebf8ff)">
      <Box  mx="auto" px={{ base: 4, md: 8 }} py={{ base: 6, md: 10 }}>
        {/* Mascot tip */}
        <Alert status="info" variant="subtle" mb={4} rounded="md">
          <AlertIcon />
          <Text>🚀 Tip: Answer by instinct — there are no wrong choices.</Text>
        </Alert>

        <Heading textAlign="center" mb={2}>SDS Quest</Heading>
        <Text textAlign="center" color="gray.600" mb={6}>Level up as you explore each world.</Text>

        {/* XP progress + badges */}
        <Box mb={6}>
          <Progress value={progress} size="sm" rounded="full" />
          <HStack mt={2} justify="space-between">
            <Text fontSize="sm" color="gray.600">{answeredCount}/{total} answered ({progress}%)</Text>
            <HStack spacing={2}>
              {earned.map((b, i) => (
                <Tag key={i} variant="subtle">
                  <TagLabel>{b.icon} {b.label}</TagLabel>
                </Tag>
              ))}
            </HStack>
          </HStack>
        </Box>

        {/* Sections */}
        <Accordion allowMultiple>
          {sections.map((section) => {
            const meta = RIASEC_META[section.name] || { emoji: "⭐" };
            return (
              <AccordionItem key={section.id} border="1px" borderColor={cardBorder} rounded="md" mb={4}>
                <h2>
                  <AccordionButton py={5} px={6} bg={useColorModeValue(meta.bg ?? meta.color + ".50", meta.color + ".900")}>
                    <Box flex="1" textAlign="left">
                      <HStack mb={1}>
                        <Badge colorScheme={meta.color}>{meta.emoji}</Badge>
                        <Text fontWeight="semibold">{section.name}</Text>
                      </HStack>
                      {section.description && (
                        <Text fontSize="sm" color="gray.600">{section.description}</Text>
                      )}
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={6} px={{ base: 4, md: 6 }} bg={cardBg}>
                  <VStack align="stretch" spacing={6}>
                    {section.questions.map((q, idx) => (
                      <MotionBox
                        key={q.id}
                        borderWidth="1px"
                        borderColor={cardBorder}
                        bg={cardBg}
                        rounded="md"
                        p={4}
                        whileHover={{ y: -2 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <Field
                          type={q.type}
                          text={`${idx + 1}. ${q.text}`}
                          options={q.answerOptions}
                          value={answers[q.id]}
                          onChange={(val) => {
                            // Enforce 2–3 selection for dream jobs (id 1001)
                            if (q.id === 1001) {
                              const max = q.maxSelect ?? 3;
                              const v = Array.isArray(val) ? val : [];
                              if (v.length <= max) handleChange(q.id, v);
                              return;
                            }
                            // Uppercase RIASEC codes input (id 1002)
                            if (q.id === 1002 && typeof val === "string") {
                              handleChange(q.id, val.toUpperCase());
                              return;
                            }
                            handleChange(q.id, val);
                          }}
                          sliderProps={q.sliderProps}
                          required={q.minSelect ? true : false}
                        />
                        <Divider mt={4} />
                      </MotionBox>
                    ))}
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            );
          })}
        </Accordion>

        <Box textAlign="center">
          <Button colorScheme="blue" size="lg" mt={6} onClick={handleSubmit}>
            Finish & Reveal
          </Button>
        </Box>
      </Box>
    </Box>
  );
}