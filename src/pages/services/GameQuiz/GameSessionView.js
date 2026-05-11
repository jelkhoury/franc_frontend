import {
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  IconButton,
  Progress,
  Text,
  VStack,
  Badge,
  Alert,
  AlertIcon,
  Tooltip,
} from "@chakra-ui/react";
import {
  TimeIcon,
  ViewIcon,
  SearchIcon,
  CheckCircleIcon,
  WarningTwoIcon,
} from "@chakra-ui/icons";
import { FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import {
  OPTION_KEYS,
  GAME_ABILITIES,
  hasSessionAnswerId,
  hasQuestionContent,
} from "./gameSessionUtils";
import SandClockVisual from "./SandClockVisual";

const MotionBox = motion(Box);

/** Fast exit so the card doesn’t keep layout height while fading (no empty band). */
const FEEDBACK_OK_VARIANTS = {
  initial: { opacity: 0, y: 18, scale: 0.96 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 220, damping: 26 },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.98,
    transition: { duration: 0.14, ease: [0.4, 0, 1, 1] },
  },
};

const FEEDBACK_BAD_VARIANTS = {
  initial: { opacity: 0, y: 18, scale: 0.96 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 230, damping: 24 },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.98,
    transition: { duration: 0.14, ease: [0.4, 0, 1, 1] },
  },
};

const ABILITY_HINTS = {
  Skip: "Skip the current question",
  FiftyFifty: "Remove two wrong answers",
  DoubleChance: "Answer again if your first try was wrong",
  TimeFreeze: "Add extra time on this question",
};

const GameSessionView = ({
  levelNumber,
  questionIndex,
  questionTotal,
  currentAnswer,
  hiddenOptionKeys,
  submitting,
  /** True while question timer expired animation / timeout submit runs */
  showTimeUpOverlay,
  abilityLoading,
  abilityCounts,
  onSelectOption,
  onUseAbility,
  questionSecondsLeft,
  questionUrgency,
  soundEnabled,
  onToggleSound,
  doubleChanceNotice,
  /** After submit: { sessionAnswerId, optionKey, correct, justification? } — justification from answer API row when present. */
  answerFeedback,
  /** sessionAnswerId → text from GET /session/{id}/hints (fallback under Correct!). */
  justificationByAnswerId = {},
  /** True only while the answer POST is in flight (before green/red feedback). */
  answerAwaitingApi,
  onExit,
}) => {
  const hiddenSet = new Set(hiddenOptionKeys || []);
  const qMax = 30;
  const qPct = Math.min(100, (questionSecondsLeft / qMax) * 100);

  const feedbackForThisQuestion =
    answerFeedback &&
    currentAnswer &&
    String(answerFeedback.sessionAnswerId) === String(currentAnswer.sessionAnswerId)
      ? answerFeedback
      : null;
  const cardFeedbackBorder =
    feedbackForThisQuestion?.correct === true
      ? "green.400"
      : feedbackForThisQuestion?.correct === false
        ? "red.400"
        : null;

  const qScheme =
    questionUrgency === "critical" ? "red" : questionUrgency === "warning" ? "orange" : "brand";

  const correctExplanationText = useMemo(() => {
    if (!feedbackForThisQuestion || feedbackForThisQuestion.correct !== true) return "";
    const j = feedbackForThisQuestion.justification;
    if (j != null && String(j).trim() !== "") return String(j).trim();
    const sid = currentAnswer?.sessionAnswerId;
    const fromHints =
      sid != null && justificationByAnswerId
        ? justificationByAnswerId[String(sid)] ??
          justificationByAnswerId[sid]
        : null;
    if (fromHints != null && String(fromHints).trim() !== "") {
      return String(fromHints).trim();
    }
    if (currentAnswer?.hint != null && String(currentAnswer.hint).trim() !== "") {
      return String(currentAnswer.hint).trim();
    }
    return "";
  }, [feedbackForThisQuestion, currentAnswer, justificationByAnswerId]);

  const canInteract = hasSessionAnswerId(currentAnswer);
  const blockInput = submitting || showTimeUpOverlay;
  const canShowQuestion =
    currentAnswer &&
    (hasQuestionContent(currentAnswer) || canInteract);

  if (!canShowQuestion) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="gray.600">Loading question…</Text>
      </Box>
    );
  }

  return (
    <Box maxW="900px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
          <VStack align="start" spacing={0}>
            <Text fontSize="sm" color="gray.500" fontWeight="semibold">
              Level {levelNumber}
            </Text>
            <Heading size="md" color="brand.500">
              Question {questionIndex} of {questionTotal}
            </Heading>
          </VStack>
          <HStack>
            <Tooltip label={soundEnabled ? "Mute sounds" : "Enable sounds"}>
              <IconButton
                aria-label="Toggle sound"
                icon={<Icon as={soundEnabled ? FaVolumeUp : FaVolumeMute} />}
                variant="ghost"
                onClick={onToggleSound}
              />
            </Tooltip>
            <Button variant="outline" size="sm" onClick={onExit}>
              Exit to levels
            </Button>
          </HStack>
        </Flex>

        <Card
          position="relative"
          overflow="hidden"
          borderWidth={2}
          borderColor={cardFeedbackBorder ?? (questionUrgency === "critical" ? "red.200" : "brand.100")}
          shadow="lg"
          bg="white"
        >
          {answerAwaitingApi && !showTimeUpOverlay && (
            <Flex
              position="absolute"
              inset={0}
              zIndex={2}
              align="center"
              justify="center"
              px={4}
              py={6}
              bg="rgba(255,255,255,0.35)"
              backdropFilter="blur(3px)"
              pointerEvents="none"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <Flex
                direction="column"
                align="stretch"
                gap={3}
                w="full"
                maxW="sm"
                py={5}
                px={5}
                borderRadius="xl"
                bg="white"
                borderWidth="1px"
                borderColor="brand.200"
                boxShadow="xl"
                opacity={0.98}
              >
                <HStack spacing={3} flexShrink={0} justify="center" flexWrap="wrap">
                  <Box
                    aria-hidden
                    color="brand.500"
                    lineHeight={0}
                    sx={{
                      "@keyframes gameQuizVerifyLook": {
                        "0%, 100%": { transform: "translateX(0) rotate(-10deg)" },
                        "50%": { transform: "translateX(4px) rotate(10deg)" },
                      },
                      animation: "gameQuizVerifyLook 1.05s ease-in-out infinite",
                    }}
                  >
                    <Icon as={SearchIcon} boxSize={6} />
                  </Box>
                  <Text fontSize="md" fontWeight="semibold" color="brand.800" textAlign="center">
                    Verifying your answer…
                  </Text>
                </HStack>
                <HStack
                  spacing={1.5}
                  justify="center"
                  sx={{
                    "@keyframes gameQuizCheckingDot": {
                      "0%, 80%, 100%": { transform: "translateY(0)", opacity: 0.4 },
                      "40%": { transform: "translateY(-5px)", opacity: 1 },
                    },
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <Box
                      key={i}
                      w="7px"
                      h="7px"
                      borderRadius="full"
                      bg="brand.500"
                      sx={{
                        animation: "gameQuizCheckingDot 0.85s ease-in-out infinite",
                        animationDelay: `${i * 0.12}s`,
                      }}
                    />
                  ))}
                </HStack>
                <Progress
                  w="full"
                  size="xs"
                  isIndeterminate
                  colorScheme="brand"
                  borderRadius="full"
                  bg="gray.100"
                />
              </Flex>
            </Flex>
          )}
          {showTimeUpOverlay && (
            <Flex
              position="absolute"
              inset={0}
              zIndex={2}
              bg="blackAlpha.400"
              backdropFilter="blur(2px)"
              align="center"
              justify="center"
              direction="column"
              gap={3}
              px={4}
            >
              <Box filter="drop-shadow(0 1px 4px rgba(0,0,0,0.3))">
                <SandClockVisual fraction={0} widthPx={52} />
              </Box>
              <Text color="white" fontWeight="bold" fontSize="xl" textAlign="center">
                Time&apos;s up
              </Text>
              <Text color="whiteAlpha.900" fontSize="sm" textAlign="center">
                Counting this question as a wrong answer…
              </Text>
            </Flex>
          )}
          <CardBody>
            <VStack spacing={5} align="stretch">
              <HStack spacing={4} align="center" flexWrap="wrap">
                <HStack flex="1" minW={{ base: "100%", md: "280px" }} align="center" spacing={3}>
                  <SandClockVisual
                    fraction={qMax > 0 ? questionSecondsLeft / qMax : 0}
                    widthPx={36}
                  />
                  <VStack flex="1" align="stretch" spacing={1} minW={0}>
                    <HStack>
                      <Icon as={TimeIcon} color={`${qScheme}.500`} />
                      <Text fontWeight="bold" fontSize="sm">
                        Question timer
                      </Text>
                    </HStack>
                    <Progress
                      value={qPct}
                      size="sm"
                      colorScheme={qScheme}
                      borderRadius="full"
                      hasStripe={questionUrgency !== "normal"}
                      isAnimated={questionUrgency === "critical"}
                    />
                    <Text fontSize="2xl" fontWeight="extrabold" color={`${qScheme}.600`}>
                      {Math.ceil(questionSecondsLeft)}s
                    </Text>
                  </VStack>
                </HStack>
              </HStack>

              <Box>
                <Text fontSize="lg" fontWeight="semibold" color="gray.800" lineHeight="tall">
                  {currentAnswer.questionText || "Question"}
                </Text>
              </Box>

              {!canInteract && hasQuestionContent(currentAnswer) && (
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  Question loaded, but no answer id was found in the response. Answers and abilities stay
                  disabled until the API includes a session answer identifier.
                </Alert>
              )}

              {doubleChanceNotice && (
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  {doubleChanceNotice}
                </Alert>
              )}

              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
                {OPTION_KEYS.map((key) => {
                  const hidden = hiddenSet.has(key);
                  const label = currentAnswer.options[key] || `Option ${key}`;
                  const isFeedbackOption =
                    feedbackForThisQuestion && feedbackForThisQuestion.optionKey === key;
                  const fbScheme = isFeedbackOption
                    ? feedbackForThisQuestion.correct
                      ? "green"
                      : "red"
                    : null;
                  return (
                    <Button
                      key={key}
                      size="lg"
                      height="auto"
                      py={4}
                      px={4}
                      whiteSpace="normal"
                      textAlign="left"
                      colorScheme={fbScheme ?? "brand"}
                      variant={hidden ? "ghost" : fbScheme ? "solid" : "outline"}
                      isDisabled={hidden || blockInput || !canInteract}
                      opacity={hidden ? 0.35 : 1}
                      onClick={() => !hidden && canInteract && onSelectOption(key)}
                      boxShadow={fbScheme ? "md" : undefined}
                      transition="background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease"
                    >
                      <HStack align="start" w="full">
                        <Badge colorScheme="purple" fontSize="md" px={2}>
                          {key}
                        </Badge>
                        <Text flex="1">{hidden ? "—" : label}</Text>
                      </HStack>
                    </Button>
                  );
                })}
              </Grid>

              <Box position="relative">
                <AnimatePresence mode="popLayout" initial={false}>
                  {feedbackForThisQuestion?.correct === true && (
                    <MotionBox
                      key={`ok-${feedbackForThisQuestion.sessionAnswerId}`}
                      variants={FEEDBACK_OK_VARIANTS}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      borderRadius="xl"
                      overflow="hidden"
                      borderWidth="1px"
                      borderColor="green.200"
                      bg="linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)"
                      boxShadow="0 8px 28px -8px rgba(22, 163, 74, 0.35)"
                      px={4}
                      py={5}
                      role="status"
                      aria-live="polite"
                    >
                    <VStack align="stretch" spacing={3} w="full">
                      <HStack align="start" spacing={3}>
                        <MotionBox
                          flexShrink={0}
                          lineHeight={0}
                          initial={{ scale: 0 }}
                          animate={{ scale: [0, 1.18, 1] }}
                          transition={{
                            duration: 0.95,
                            ease: "easeOut",
                            times: [0, 0.5, 1],
                            delay: 0.08,
                          }}
                        >
                          <Icon as={CheckCircleIcon} boxSize={9} color="green.600" />
                        </MotionBox>
                        <Text fontWeight="extrabold" fontSize="lg" color="green.800" letterSpacing="tight" pt={1}>
                          Correct!
                        </Text>
                      </HStack>
                      {correctExplanationText !== "" && (
                        <MotionBox
                          pl={{ base: 0, sm: 12 }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.32, duration: 0.9, ease: "easeOut" }}
                          borderTopWidth="1px"
                          borderColor="green.200"
                          pt={3}
                        >
                          <Text
                            fontSize="xs"
                            fontWeight="bold"
                            color="green.700"
                            textTransform="uppercase"
                            letterSpacing="0.06em"
                            mb={1.5}
                          >
                            Explanation
                          </Text>
                          <Text fontSize="md" color="gray.800" lineHeight="tall">
                            {correctExplanationText}
                          </Text>
                        </MotionBox>
                      )}
                    </VStack>
                  </MotionBox>
                )}

                {feedbackForThisQuestion?.correct === false && (
                  <MotionBox
                    key={`bad-${feedbackForThisQuestion.sessionAnswerId}`}
                    variants={FEEDBACK_BAD_VARIANTS}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    borderRadius="xl"
                    overflow="hidden"
                    borderWidth="1px"
                    borderColor="red.200"
                    bg="linear-gradient(135deg, #fef2f2 0%, #fee2e2 45%, #fecaca 100%)"
                    boxShadow="0 8px 28px -8px rgba(220, 38, 38, 0.28)"
                    px={4}
                    py={5}
                    role="status"
                    aria-live="polite"
                  >
                    <MotionBox
                      animate={{ x: [0, -6, 6, -5, 5, -3, 3, 0] }}
                      transition={{ duration: 0.75, ease: "easeInOut", delay: 0.1 }}
                    >
                      <HStack align="start" spacing={3}>
                        <MotionBox
                          flexShrink={0}
                          lineHeight={0}
                          initial={{ rotate: -16, scale: 0.82 }}
                          animate={{ rotate: 0, scale: 1 }}
                          transition={{ type: "spring", stiffness: 260, damping: 15 }}
                        >
                          <Icon as={WarningTwoIcon} boxSize={9} color="red.500" />
                        </MotionBox>
                        <VStack align="start" spacing={1} flex="1" minW={0}>
                          <Text fontWeight="extrabold" fontSize="lg" color="red.800" letterSpacing="tight">
                            Wrong answer
                          </Text>
                          <Text fontSize="sm" color="red.900" lineHeight="short" opacity={0.92}>
                            Wrong Choice,Better luck next time!
                          </Text>
                        </VStack>
                      </HStack>
                    </MotionBox>
                  </MotionBox>
                )}
                </AnimatePresence>
              </Box>
            </VStack>
          </CardBody>
        </Card>

        <Card variant="outline" bg="purple.50" borderColor="purple.100">
          <CardBody>
            <HStack mb={3}>
              <Icon as={ViewIcon} color="purple.500" />
              <Heading size="sm" color="purple.700">
                Abilities
              </Heading>
            </HStack>
            <SimpleAbilityGrid>
              {GAME_ABILITIES.map((ability) => {
                const left = abilityCounts[ability] ?? 0;
                const busy = abilityLoading === ability;
                return (
                  <Tooltip key={ability} label={ABILITY_HINTS[ability] || ""} hasArrow>
                    <Button
                      size="sm"
                      variant="solid"
                      colorScheme="purple"
                      isDisabled={left <= 0 || !!abilityLoading || blockInput || !canInteract}
                      isLoading={busy}
                      onClick={() => onUseAbility(ability)}
                    >
                      {ability} ({left})
                    </Button>
                  </Tooltip>
                );
              })}
            </SimpleAbilityGrid>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

function SimpleAbilityGrid({ children }) {
  return (
    <Flex gap={2} flexWrap="wrap">
      {children}
    </Flex>
  );
}

export default GameSessionView;
