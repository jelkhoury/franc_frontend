import {
  Box,
  Button,
  Card,
  CardBody,
  Center,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  IconButton,
  SimpleGrid,
  Text,
  VStack,
  Alert,
  AlertIcon,
  Tooltip,
  Progress,
} from "@chakra-ui/react";
import {
  TimeIcon,
  SearchIcon,
  CheckCircleIcon,
  WarningTwoIcon,
} from "@chakra-ui/icons";
import { FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import {
  Bolt,
  Copy,
  FastForward,
  LogOut,
  Snowflake,
  SquareSplitHorizontal,
  Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import {
  OPTION_KEYS,
  GAME_ABILITIES,
  hasSessionAnswerId,
  hasQuestionContent,
  LEVEL_BADGE_ORDER,
} from "./gameSessionUtils";
import SandClockVisual from "./SandClockVisual";

const MotionBox = motion(Box);

const fontHeadline = '"Outfit", system-ui, sans-serif';
const fontBody = '"Plus Jakarta Sans", system-ui, sans-serif';

const CQ = {
  primary: "#005ea1",
  primaryContainer: "#2178c3",
  surface: "#f9f9ff",
  surfaceLow: "#f0f3ff",
  surfaceLowest: "#ffffff",
  surfaceContainerHigh: "#dee8ff",
  onSurface: "#121c2c",
  onSurfaceVariant: "#414751",
  onPrimary: "#ffffff",
  outlineVariant: "rgba(192, 199, 211, 0.45)",
  danger: "#F56565",
  glass: "rgba(255, 255, 255, 0.72)",
};

const ABILITY_ICONS = {
  Skip: FastForward,
  FiftyFifty: SquareSplitHorizontal,
  DoubleChance: Copy,
  TimeFreeze: Snowflake,
};

const ABILITY_SHORT = {
  Skip: "SKIP",
  FiftyFifty: "50/50",
  DoubleChance: "DOUBLE",
  TimeFreeze: "FREEZE",
};

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

/** Circular countdown ring; `pct` is 0–100 time remaining. */
function TimerRing({ pct, stroke, track = "rgba(192, 199, 211, 0.35)", size = 40 }) {
  const s = Math.max(28, Math.min(48, size));
  const strokeW = 3;
  const r = s / 2 - strokeW;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const offset = c * (1 - clamped / 100);
  const cx = s / 2;
  const cy = s / 2;
  return (
    <Box as="svg" width={`${s}px`} height={`${s}px`} viewBox={`0 0 ${s} ${s}`} flexShrink={0}>
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={track} strokeWidth={strokeW} />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeW}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </g>
    </Box>
  );
}

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

  const ringStroke =
    questionUrgency === "critical"
      ? "#E53E3E"
      : questionUrgency === "warning"
        ? CQ.primaryContainer
        : CQ.primary;

  const correctExplanationText = useMemo(() => {
    if (!feedbackForThisQuestion || feedbackForThisQuestion.correct !== true) return "";
    const j = feedbackForThisQuestion.justification;
    if (j != null && String(j).trim() !== "") return String(j).trim();
    const sid = currentAnswer?.sessionAnswerId;
    const fromHints =
      sid != null && justificationByAnswerId
        ? justificationByAnswerId[String(sid)] ?? justificationByAnswerId[sid]
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
    currentAnswer && (hasQuestionContent(currentAnswer) || canInteract);

  const levelBadgeText = useMemo(() => {
    const row = LEVEL_BADGE_ORDER.find((r) => r.level === Number(levelNumber));
    const tier = row?.label ? String(row.label).toUpperCase() : "CHALLENGE";
    return `LEVEL ${levelNumber}: ${tier}`;
  }, [levelNumber]);

  if (!canShowQuestion) {
    return (
      <Box textAlign="center" py={10} fontFamily={fontBody}>
        <Text color={CQ.onSurfaceVariant} fontSize="sm">
          Loading question…
        </Text>
      </Box>
    );
  }

  return (
    <Box
      maxW="1100px"
      mx="auto"
      px={{ base: 3, md: 6 }}
      py={{ base: 5, md: 6 }}
      fontFamily={fontBody}
      color={CQ.onSurface}
      sx={{
        background: "radial-gradient(circle at top right, #e7eeff 0%, #f9f9ff 100%)",
      }}
    >
      <Flex
        direction={{ base: "column", md: "row" }}
        align={{ base: "stretch", md: "flex-end" }}
        justify="space-between"
        gap={3}
        mb={6}
      >
        <Box>
          <HStack
            as="span"
            display="inline-flex"
            spacing={1}
            px={2.5}
            py={0.5}
            borderRadius="full"
            bg="rgba(74, 85, 104, 0.1)"
            color="#4A5568"
            fontSize="10px"
            fontWeight="700"
            letterSpacing="0.06em"
            mb={1.5}
          >
            <Icon as={Star} boxSize={3} fill="#4A5568" color="#4A5568" />
            <Text as="span">{levelBadgeText}</Text>
          </HStack>
          <HStack spacing={2} align="baseline" flexWrap="wrap">
            <Heading
              as="h2"
              fontFamily={fontHeadline}
              fontSize={{ base: "1.25rem", md: "1.5rem" }}
              fontWeight="700"
              letterSpacing="-0.02em"
              lineHeight="shorter"
            >
              Question {String(questionIndex).padStart(2, "0")}
            </Heading>
            <Text
              as="span"
              fontFamily={fontHeadline}
              fontSize={{ base: "md", md: "lg" }}
              fontWeight="600"
              color={CQ.primary}
              opacity={0.42}
            >
              / {questionTotal}
            </Text>
          </HStack>
        </Box>
        <HStack spacing={2} justify={{ base: "space-between", md: "flex-end" }} flexShrink={0}>
          <Tooltip label={soundEnabled ? "Mute sounds" : "Enable sounds"}>
            <IconButton
              aria-label="Toggle sound"
              icon={<Icon as={soundEnabled ? FaVolumeUp : FaVolumeMute} boxSize={4} />}
              variant="ghost"
              size="sm"
              color={CQ.onSurfaceVariant}
              borderRadius="lg"
              onClick={onToggleSound}
              _hover={{ bg: "rgba(0, 94, 161, 0.06)" }}
            />
          </Tooltip>
          <Button
            size="sm"
            leftIcon={<Icon as={LogOut} boxSize={4} />}
            px={4}
            py={2}
            h="auto"
            borderRadius="xl"
            borderWidth="2px"
            borderColor={CQ.outlineVariant}
            bg="transparent"
            color={CQ.onSurface}
            fontWeight="600"
            fontSize="xs"
            _hover={{
              borderColor: CQ.danger,
              color: CQ.danger,
              bg: "rgba(245, 101, 101, 0.06)",
            }}
            _active={{ transform: "scale(0.97)" }}
            onClick={onExit}
          >
            Exit to levels
          </Button>
        </HStack>
      </Flex>

      <Box as="section" position="relative">
        {/* Floating timer */}
        <Box position="absolute" left="50%" top="-22px" transform="translateX(-50%)" zIndex={10}>
          <HStack
            spacing={3}
            px={4}
            py={2}
            borderRadius="full"
            bg={CQ.glass}
            backdropFilter="blur(12px)"
            sx={{ WebkitBackdropFilter: "blur(12px)" }}
            borderWidth="1px"
            borderColor="rgba(0, 94, 161, 0.18)"
            boxShadow="0 8px 24px rgba(0, 94, 161, 0.12)"
          >
            <Box position="relative" w="36px" h="36px" flexShrink={0}>
              <Center position="absolute" inset={0}>
                <TimerRing pct={qPct} stroke={ringStroke} size={36} />
              </Center>
              <Center position="absolute" inset={0} pointerEvents="none">
                <Icon as={TimeIcon} color={CQ.primary} boxSize={3} />
              </Center>
            </Box>
            <VStack align="start" spacing={0}>
              <Text
                fontSize="10px"
                fontWeight="700"
                letterSpacing="0.08em"
                color={CQ.onSurfaceVariant}
                lineHeight={1}
              >
                TIME REMAINING
              </Text>
              <Text
                fontFamily={fontHeadline}
                fontSize="md"
                fontWeight="700"
                color={CQ.primary}
                lineHeight="tight"
              >
                {Math.ceil(questionSecondsLeft)}s
              </Text>
            </VStack>
          </HStack>
        </Box>

        <Card
          position="relative"
          overflow="hidden"
          borderRadius="24px"
          borderWidth="1px"
          borderColor={
            cardFeedbackBorder ??
            (questionUrgency === "critical" ? "rgba(229, 62, 62, 0.35)" : "rgba(192, 199, 211, 0.35)")
          }
          boxShadow="0 12px 40px -12px rgba(0, 94, 161, 0.12)"
          bg={CQ.surfaceLowest}
          pt={12}
          px={{ base: 4, md: 8 }}
          pb={{ base: 5, md: 7 }}
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
                py={4}
                px={4}
                borderRadius="xl"
                bg="white"
                borderWidth="1px"
                borderColor="rgba(0, 94, 161, 0.2)"
                boxShadow="xl"
                opacity={0.98}
              >
                <HStack spacing={3} flexShrink={0} justify="center" flexWrap="wrap">
                  <Box
                    aria-hidden
                    color={CQ.primary}
                    lineHeight={0}
                    sx={{
                      "@keyframes gameQuizVerifyLook": {
                        "0%, 100%": { transform: "translateX(0) rotate(-10deg)" },
                        "50%": { transform: "translateX(4px) rotate(10deg)" },
                      },
                      animation: "gameQuizVerifyLook 1.05s ease-in-out infinite",
                    }}
                  >
                    <Icon as={SearchIcon} boxSize={5} />
                  </Box>
                  <Text fontSize="sm" fontWeight="semibold" color={CQ.onSurface} textAlign="center">
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
                      w="6px"
                      h="6px"
                      borderRadius="full"
                      bg={CQ.primary}
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
                  colorScheme="blue"
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
                <SandClockVisual fraction={0} widthPx={48} />
              </Box>
              <Text color="white" fontWeight="bold" fontSize="lg" textAlign="center">
                Time&apos;s up
              </Text>
              <Text color="whiteAlpha.900" fontSize="xs" textAlign="center">
                Counting this question as a wrong answer…
              </Text>
            </Flex>
          )}

          <CardBody p={0}>
            <VStack spacing={5} align="stretch">
              <Box w="full" mb={1}>
                <Text
                  as="p"
                  dir="ltr"
                  fontFamily={fontHeadline}
                  fontSize={{ base: "md", md: "lg" }}
                  fontWeight="600"
                  color={CQ.onSurface}
                  lineHeight="snug"
                  textAlign="left"
                  w="full"
                  maxW="48rem"
                  mx="auto"
                >
                  {currentAnswer.questionText || "Question"}
                </Text>
              </Box>

              {!canInteract && hasQuestionContent(currentAnswer) && (
                <Alert status="warning" borderRadius="md" fontSize="sm">
                  <AlertIcon />
                  Question loaded, but no answer id was found in the response. Answers and abilities stay
                  disabled until the API includes a session answer identifier.
                </Alert>
              )}

              {doubleChanceNotice && (
                <Alert status="info" borderRadius="md" fontSize="sm">
                  <AlertIcon />
                  {doubleChanceNotice}
                </Alert>
              )}

              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
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
                  const selectedFeedback = Boolean(fbScheme);
                  return (
                    <Button
                      key={key}
                      as="button"
                      type="button"
                      height="auto"
                      py={3}
                      px={3}
                      borderRadius="xl"
                      borderWidth="2px"
                      borderColor={
                        selectedFeedback
                          ? fbScheme === "green"
                            ? "green.400"
                            : "red.400"
                          : "transparent"
                      }
                      bg={CQ.surfaceLow}
                      color={CQ.onSurface}
                      textAlign="left"
                      whiteSpace="normal"
                      justifyContent="flex-start"
                      isDisabled={hidden || blockInput || !canInteract}
                      opacity={hidden ? 0.35 : 1}
                      onClick={() => !hidden && canInteract && onSelectOption(key)}
                      boxShadow={selectedFeedback ? "md" : "sm"}
                      transition="transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease"
                      _hover={
                        !hidden && !blockInput && canInteract && !selectedFeedback
                          ? {
                              borderColor: "rgba(0, 94, 161, 0.45)",
                              boxShadow: "0 10px 24px -6px rgba(0, 94, 161, 0.12)",
                              transform: "translateY(-3px)",
                            }
                          : undefined
                      }
                      _active={{ transform: "scale(0.98)" }}
                    >
                      <HStack align="start" w="full" spacing={3}>
                        <Flex
                          w="40px"
                          h="40px"
                          flexShrink={0}
                          align="center"
                          justify="center"
                          borderRadius="lg"
                          bg="white"
                          borderWidth="1px"
                          borderColor="rgba(192, 199, 211, 0.45)"
                          boxShadow="sm"
                          fontFamily={fontHeadline}
                          fontSize="md"
                          fontWeight="700"
                          color={
                            selectedFeedback
                              ? fbScheme === "green"
                                ? "green.600"
                                : "red.600"
                              : CQ.primary
                          }
                        >
                          {key}
                        </Flex>
                        <Text
                          dir="ltr"
                          flex="1"
                          fontSize="sm"
                          lineHeight="short"
                          textAlign="left"
                          color={
                            selectedFeedback
                              ? CQ.onSurface
                              : hidden
                                ? CQ.onSurfaceVariant
                                : CQ.onSurfaceVariant
                          }
                          fontWeight="500"
                        >
                          {hidden ? "—" : label}
                        </Text>
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
                      px={3}
                      py={4}
                      role="status"
                      aria-live="polite"
                    >
                      <VStack align="stretch" spacing={2.5} w="full">
                        <HStack align="start" spacing={2.5}>
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
                            <Icon as={CheckCircleIcon} boxSize={8} color="green.600" />
                          </MotionBox>
                          <Text
                            fontWeight="extrabold"
                            fontSize="md"
                            color="green.800"
                            letterSpacing="tight"
                            pt={0.5}
                            fontFamily={fontHeadline}
                          >
                            Correct!
                          </Text>
                        </HStack>
                        {correctExplanationText !== "" && (
                          <MotionBox
                            pl={{ base: 0, sm: 10 }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.32, duration: 0.9, ease: "easeOut" }}
                            borderTopWidth="1px"
                            borderColor="green.200"
                            pt={2.5}
                          >
                            <Text
                              fontSize="10px"
                              fontWeight="bold"
                              color="green.700"
                              textTransform="uppercase"
                              letterSpacing="0.06em"
                              mb={1}
                            >
                              Explanation
                            </Text>
                            <Text fontSize="sm" color="gray.800" lineHeight="tall">
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
                      px={3}
                      py={4}
                      role="status"
                      aria-live="polite"
                    >
                      <MotionBox
                        animate={{ x: [0, -6, 6, -5, 5, -3, 3, 0] }}
                        transition={{ duration: 0.75, ease: "easeInOut", delay: 0.1 }}
                      >
                        <HStack align="start" spacing={2.5}>
                          <MotionBox
                            flexShrink={0}
                            lineHeight={0}
                            initial={{ rotate: -16, scale: 0.82 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 15 }}
                          >
                            <Icon as={WarningTwoIcon} boxSize={8} color="red.500" />
                          </MotionBox>
                          <VStack align="start" spacing={0.5} flex="1" minW={0}>
                            <Text
                              fontWeight="extrabold"
                              fontSize="md"
                              color="red.800"
                              letterSpacing="tight"
                              fontFamily={fontHeadline}
                            >
                              Wrong answer
                            </Text>
                            <Text fontSize="xs" color="red.900" lineHeight="short" opacity={0.92}>
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
      </Box>

      <Box as="section" mt={8} w="100%">
        <Box
          w="100%"
          borderRadius="xl"
          overflow="hidden"
          borderWidth="1px"
          borderColor="rgba(0, 94, 161, 0.12)"
          bg={CQ.glass}
          backdropFilter="blur(12px)"
          sx={{ WebkitBackdropFilter: "blur(12px)" }}
          boxShadow="0 8px 32px rgba(0, 94, 161, 0.08)"
        >
          <Flex
            align="center"
            justify="space-between"
            flexWrap="wrap"
            gap={2}
            px={{ base: 3, md: 4 }}
            py={2.5}
            borderBottomWidth="1px"
            borderColor="rgba(0, 94, 161, 0.08)"
            bg="rgba(255, 255, 255, 0.45)"
          >
            <HStack spacing={2}>
              <Flex
                w="32px"
                h="32px"
                borderRadius="lg"
                align="center"
                justify="center"
                bg="rgba(0, 94, 161, 0.1)"
                color={CQ.primary}
              >
                <Icon as={Bolt} boxSize={4} fill={CQ.primary} />
              </Flex>
              <VStack align="start" spacing={0}>
                <Text
                  fontSize="xs"
                  fontWeight="800"
                  letterSpacing="0.14em"
                  color={CQ.onSurface}
                  textTransform="uppercase"
                  lineHeight={1.1}
                >
                  Abilities
                </Text>
                <Text fontSize="10px" color={CQ.onSurfaceVariant} lineHeight={1.2}>
                  Tap a power-up when you have uses left
                </Text>
              </VStack>
            </HStack>
          </Flex>

          <Box px={{ base: 2, md: 3 }} py={2}>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2.5} w="100%">
              {GAME_ABILITIES.map((ability) => {
                const left = abilityCounts[ability] ?? 0;
                const busy = abilityLoading === ability;
                const LucideIcon = ABILITY_ICONS[ability] ?? Bolt;
                const short = ABILITY_SHORT[ability] ?? ability;
                const disabled = left <= 0 || !!abilityLoading || blockInput || !canInteract;
                const statusLabel = left > 0 ? `${left} left` : "Locked";
                const available = left > 0;
                const iconBg = available ? CQ.primary : "rgba(255, 255, 255, 0.9)";
                const iconColor = available ? CQ.onPrimary : CQ.primary;

                return (
                  <Tooltip
                    key={ability}
                    label={ABILITY_HINTS[ability] || ""}
                    hasArrow
                    shouldWrapChildren
                  >
                    <Box w="100%" minH="62px" h="100%">
                      <Button
                        variant="unstyled"
                        display="flex"
                        flexDirection="row"
                        alignItems="center"
                        justifyContent="flex-start"
                        w="100%"
                        h="100%"
                        minH="62px"
                        p={2}
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor={
                          available
                            ? "rgba(0, 94, 161, 0.22)"
                            : "rgba(192, 199, 211, 0.45)"
                        }
                        bg={
                          available
                            ? "rgba(255, 255, 255, 0.85)"
                            : "rgba(247, 249, 252, 0.9)"
                        }
                        boxShadow={available ? "0 2px 8px rgba(0, 94, 161, 0.06)" : "none"}
                        position="relative"
                        overflow="hidden"
                        _before={
                          available
                            ? {
                                content: '""',
                                position: "absolute",
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: "3px",
                                bg: CQ.primary,
                                borderRadius: "0",
                              }
                            : undefined
                        }
                        _hover={
                          !disabled
                            ? {
                                borderColor: "rgba(0, 94, 161, 0.4)",
                                bg: "rgba(255, 255, 255, 0.98)",
                                boxShadow: "0 8px 24px rgba(0, 94, 161, 0.12)",
                                transform: "translateY(-1px)",
                              }
                            : undefined
                        }
                        _active={!disabled ? { transform: "scale(0.98)" } : undefined}
                        opacity={disabled ? 0.72 : 1}
                        cursor={disabled ? "not-allowed" : "pointer"}
                        isDisabled={disabled}
                        isLoading={busy}
                        onClick={() => onUseAbility(ability)}
                      >
                        <HStack spacing={2} align="center" w="100%" pl={available ? 0.5 : 0}>
                          <Flex
                            w="32px"
                            h="32px"
                            borderRadius="md"
                            align="center"
                            justify="center"
                            bg={iconBg}
                            boxShadow="sm"
                            flexShrink={0}
                          >
                            <Icon as={LucideIcon} boxSize={3.5} color={iconColor} strokeWidth={2} />
                          </Flex>
                          <VStack align="start" spacing={0} flex="1" minW={0}>
                            <Text
                              fontSize="9px"
                              fontWeight="800"
                              color={CQ.onSurfaceVariant}
                              lineHeight={1}
                              letterSpacing="0.08em"
                              noOfLines={1}
                            >
                              {short}
                            </Text>
                            <Text
                              fontSize="xs"
                              fontWeight="700"
                              color={available ? CQ.primary : CQ.onSurfaceVariant}
                              lineHeight="short"
                              textTransform="capitalize"
                              noOfLines={1}
                            >
                              {statusLabel}
                            </Text>
                          </VStack>
                        </HStack>
                      </Button>
                    </Box>
                  </Tooltip>
                );
              })}
            </SimpleGrid>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default GameSessionView;