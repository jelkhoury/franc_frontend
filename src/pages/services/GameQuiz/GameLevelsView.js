import {
  Box,
  Button,
  Card,
  CardBody,
  Circle,
  Flex,
  Heading,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Badge,
  Spinner,
  Icon,
} from "@chakra-ui/react";
import { LockIcon, UnlockIcon, CheckCircleIcon, StarIcon, RepeatIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { LEVEL_BADGE_ORDER } from "./gameSessionUtils";
import { useCountUp } from "./useCountUp";

const MotionText = motion(Text);
const MotionBox = motion(Box);

/** Unlocked card: gradient surface + top bar + glow. Keys align with `colorScheme` on each tier. */
const TIER_CARD_STYLES = {
  orange: {
    unlockBg: "linear-gradient(165deg, #fffbeb 0%, #ffedd5 42%, #fdba74 120%)",
    unlockBorder: "orange.400",
    accentBar: "linear(to-r, #c2410c, #f97316, #fb923c)",
    shadow: "0 12px 40px -14px rgba(234, 88, 12, 0.42)",
    buttonScheme: "orange",
  },
  gray: {
    unlockBg: "linear-gradient(165deg, #f8fafc 0%, #e2e8f0 48%, #94a3b8 125%)",
    unlockBorder: "blue.400",
    accentBar: "linear(to-r, #334155, #64748b, #94a3b8)",
    shadow: "0 12px 40px -14px rgba(59, 130, 246, 0.3)",
    buttonScheme: "blue",
  },
  yellow: {
    unlockBg: "linear-gradient(165deg, #fefce8 0%, #fef9c3 45%, #facc15 115%)",
    unlockBorder: "yellow.500",
    accentBar: "linear(to-r, #a16207, #ca8a04, #eab308)",
    shadow: "0 12px 40px -14px rgba(202, 138, 4, 0.38)",
    buttonScheme: "yellow",
  },
  purple: {
    unlockBg: "linear-gradient(165deg, #faf5ff 0%, #f3e8ff 42%, #c084fc 120%)",
    unlockBorder: "purple.500",
    accentBar: "linear(to-r, #6b21a8, #9333ea, #c084fc)",
    shadow: "0 12px 40px -14px rgba(147, 51, 234, 0.36)",
    buttonScheme: "purple",
  },
  cyan: {
    unlockBg: "linear-gradient(165deg, #ecfeff 0%, #cffafe 48%, #22d3ee 118%)",
    unlockBorder: "cyan.500",
    accentBar: "linear(to-r, #0e7490, #0891b2, #22d3ee)",
    shadow: "0 12px 40px -14px rgba(8, 145, 178, 0.4)",
    buttonScheme: "cyan",
  },
};

function tierStyle(colorScheme) {
  return TIER_CARD_STYLES[colorScheme] || TIER_CARD_STYLES.cyan;
}

/** Soft panel tint for the “highest unlocked” stat — matches tier. */
function statPanelBgForTier(colorScheme) {
  const m = {
    orange: "linear-gradient(135deg, #fff7ed 0%, #ffffff 55%)",
    gray: "linear-gradient(135deg, #eff6ff 0%, #ffffff 55%)",
    yellow: "linear-gradient(135deg, #fefce8 0%, #ffffff 55%)",
    purple: "linear-gradient(135deg, #faf5ff 0%, #ffffff 55%)",
    cyan: "linear-gradient(135deg, #ecfeff 0%, #ffffff 55%)",
  };
  return m[colorScheme] ?? m.cyan;
}

function AnimatedTotalPoints({ total }) {
  const n = typeof total === "number" && Number.isFinite(total) ? total : Number(total) || 0;
  const display = useCountUp(n, { duration: 950, enabled: true });
  return (
    <MotionText
      fontSize="2xl"
      fontWeight="bold"
      color="brand.600"
      fontVariantNumeric="tabular-nums"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {display}
    </MotionText>
  );
}

const GameLevelsView = ({
  totalPoints,
  maxUnlockedLevel,
  levelSummaries,
  loading,
  startingLevel,
  resumingSession,
  activeSessionId,
  /** When set, this level card plays a short “newly unlocked” celebration (e.g. after passing prior level). */
  celebrateLevelNumber,
  onStartLevel,
  onResumeSession,
  onBack,
}) => {
  const rows =
    levelSummaries ??
    LEVEL_BADGE_ORDER.map(({ level, label, colorScheme }) => ({
      level,
      label,
      colorScheme,
      unlocked: level <= maxUnlockedLevel,
      cleared: false,
      bestScore: null,
      questionCount: 10,
    }));

  const highestUnlockedVisual = useMemo(() => {
    const row =
      LEVEL_BADGE_ORDER.find((r) => r.level === maxUnlockedLevel) ?? LEVEL_BADGE_ORDER[0];
    const badgeScheme = row.colorScheme === "gray" ? "blue" : row.colorScheme;
    return {
      tier: tierStyle(row.colorScheme),
      badgeScheme,
      statBg: statPanelBgForTier(row.colorScheme),
    };
  }, [maxUnlockedLevel]);

  return (
    <Box maxW="1100px" mx="auto">
      <VStack spacing={8} align="stretch">
        {activeSessionId && onResumeSession && (
          <Box
            borderRadius="2xl"
            overflow="hidden"
            borderWidth="1px"
            borderColor="brand.100"
            bg="white"
            boxShadow="0 4px 28px rgba(49, 130, 206, 0.08)"
            position="relative"
            _before={{
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              h: "3px",
              bgGradient: "linear(to-r, brand.400, purple.400, cyan.400)",
            }}
          >
            <HStack align="stretch" spacing={0}>
              <Flex w={1} bgGradient="linear(to-b, cyan.400, brand.400)" flexShrink={0} />
              <VStack
                align="stretch"
                spacing={3}
                p={{ base: 4, md: 5 }}
                pt={{ base: 5, md: 6 }}
                flex="1"
              >
                <HStack align="start" spacing={3}>
                  <Circle size="40px" bg="brand.50" color="brand.600" flexShrink={0} mt={0.5}>
                    <Icon as={RepeatIcon} boxSize={5} />
                  </Circle>
                  <VStack align="start" spacing={1.5} flex="1">
                    <Text
                      fontSize="2xs"
                      fontWeight="bold"
                      letterSpacing="0.1em"
                      color="brand.600"
                      textTransform="uppercase"
                    >
                      Active session
                    </Text>
                    <Heading as="h2" size="sm" color="gray.800" fontWeight="extrabold" lineHeight="shorter">
                      Quiz in progress
                    </Heading>
                    <Text color="gray.600" fontSize="sm" lineHeight="tall">
                      You already have a run started. Continue where you left off, or finish it from the
                      quiz screen before starting another level.
                    </Text>
                  </VStack>
                </HStack>
                <Button
                  colorScheme="brand"
                  size="sm"
                  alignSelf={{ base: "stretch", sm: "flex-start" }}
                  fontWeight="bold"
                  isLoading={resumingSession}
                  isDisabled={!!startingLevel}
                  onClick={() => onResumeSession(activeSessionId)}
                >
                  Continue quiz
                </Button>
              </VStack>
            </HStack>
          </Box>
        )}

        <Box
          borderRadius="2xl"
          bg="white"
          borderWidth="1px"
          borderColor="brand.100"
          boxShadow="0 4px 28px rgba(49, 130, 206, 0.08)"
          px={{ base: 4, md: 8 }}
          py={{ base: 5, md: 7 }}
          textAlign={{ base: "left", md: "center" }}
          position="relative"
          overflow="hidden"
          _before={{
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            h: "3px",
            bgGradient: "linear(to-r, brand.400, purple.400, cyan.400)",
          }}
        >
          <Text
            fontSize="2xs"
            fontWeight="bold"
            letterSpacing="0.1em"
            color="brand.600"
            textTransform="uppercase"
            mb={1.5}
            textAlign={{ base: "left", md: "center" }}
          >
            Your progression
          </Text>
          <Heading
            as="h1"
            color="gray.800"
            fontWeight="extrabold"
            letterSpacing="-0.02em"
            fontSize={{ base: "xl", md: "2xl" }}
            mb={2}
            lineHeight="shorter"
          >
            Career Quest
          </Heading>
          <Text
            color="gray.600"
            fontSize={{ base: "sm", md: "md" }}
            lineHeight="tall"
            maxW="3xl"
            mx={{ md: "auto" }}
          >
            Clear <Box as="span" fontWeight="semibold" color="gray.700">five levels</Box>, earn badges
            from <Box as="span" color="orange.600" fontWeight="semibold">Bronze</Box> to{" "}
            <Box as="span" color="cyan.700" fontWeight="semibold">Diamond</Box>, and stack points. Jump
            into any <Box as="span" fontWeight="semibold" color="brand.600">unlocked</Box> stage when
            you&apos;re ready.
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} maxW="640px" mx="auto" w="full">
          <MotionBox
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.38 }}
          >
            <HStack
              align="stretch"
              spacing={0}
              borderRadius="xl"
              overflow="hidden"
              borderWidth="1px"
              borderColor="brand.100"
              bg="linear-gradient(135deg, #eff6ff 0%, #ffffff 55%)"
              boxShadow="sm"
            >
              <Flex w={1} bgGradient="linear(to-b, brand.400, cyan.400)" flexShrink={0} />
              <HStack flex="1" spacing={4} p={4} align="center">
                <Circle size="44px" bg="brand.100" color="brand.600">
                  <Icon as={StarIcon} boxSize={5} />
                </Circle>
                <VStack align="start" spacing={0}>
                  <Text fontSize="xs" fontWeight="bold" color="gray.500" letterSpacing="wide">
                    Total points
                  </Text>
                  {loading ? (
                    <Text fontSize="2xl" fontWeight="extrabold" color="brand.600">
                      —
                    </Text>
                  ) : (
                    <AnimatedTotalPoints key={totalPoints} total={totalPoints} />
                  )}
                </VStack>
              </HStack>
            </HStack>
          </MotionBox>
          <MotionBox
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.38 }}
          >
            <HStack
              align="stretch"
              spacing={0}
              borderRadius="xl"
              overflow="hidden"
              borderWidth="1px"
              borderColor={highestUnlockedVisual.tier.unlockBorder}
              bg={highestUnlockedVisual.statBg}
              boxShadow="sm"
            >
              <Flex
                w={1}
                bgGradient={highestUnlockedVisual.tier.accentBar}
                flexShrink={0}
              />
              <HStack flex="1" spacing={4} p={4} align="center">
                <Circle
                  size="44px"
                  bg={`${highestUnlockedVisual.badgeScheme}.100`}
                  color={`${highestUnlockedVisual.badgeScheme}.600`}
                >
                  <Icon as={UnlockIcon} boxSize={5} />
                </Circle>
                <VStack align="start" spacing={0}>
                  <Text fontSize="xs" fontWeight="bold" color="gray.500" letterSpacing="wide">
                    Highest unlocked
                  </Text>
                  <MotionText
                    fontSize="2xl"
                    fontWeight="extrabold"
                    color={`${highestUnlockedVisual.badgeScheme}.600`}
                    fontVariantNumeric="tabular-nums"
                    initial={{ scale: 0.92 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  >
                    Level {maxUnlockedLevel}
                  </MotionText>
                </VStack>
              </HStack>
            </HStack>
          </MotionBox>
        </SimpleGrid>

        {loading ? (
          <FlexCentered>
            <Spinner size="xl" color="brand.500" />
          </FlexCentered>
        ) : (
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 5 }} spacing={5}>
            {rows.map(({ level, label, colorScheme, unlocked, cleared, bestScore, questionCount }) => {
              const busy = startingLevel === level;
              const tier = tierStyle(colorScheme);
              const badgeScheme = colorScheme === "gray" ? "blue" : colorScheme;
              const celebrateHere =
                celebrateLevelNumber != null && Number(celebrateLevelNumber) === Number(level);
              const card = (
                <Card
                  variant="outline"
                  overflow="hidden"
                  borderWidth={celebrateHere ? 3 : 2}
                  borderColor={
                    celebrateHere ? "green.400" : unlocked ? tier.unlockBorder : "gray.300"
                  }
                  bg={unlocked ? tier.unlockBg : "linear-gradient(180deg, #f4f4f5 0%, #e4e4e7 100%)"}
                  boxShadow={unlocked ? tier.shadow : "sm"}
                  opacity={unlocked ? 1 : 0.88}
                  transition="transform 0.22s ease, box-shadow 0.22s ease"
                  _hover={
                    unlocked
                      ? {
                          transform: "translateY(-6px)",
                          boxShadow: "0 18px 44px -16px rgba(0, 0, 0, 0.18)",
                        }
                      : undefined
                  }
                >
                  <Box
                    h="3px"
                    w="full"
                    bgGradient={unlocked ? tier.accentBar : "linear(to-r, #a1a1aa, #d4d4d8)"}
                  />
                  <CardBody pt={5} pb={4} px={4}>
                    <VStack spacing={3.5}>
                      <Badge
                        colorScheme={badgeScheme}
                        fontSize="0.8em"
                        px={3}
                        py={1}
                        borderRadius="full"
                        textTransform="none"
                        fontWeight="bold"
                        boxShadow="sm"
                      >
                        {label}
                      </Badge>
                      <Text fontWeight="extrabold" fontSize="xl" color={unlocked ? "gray.800" : "gray.500"}>
                        Level {level}
                      </Text>
                      <HStack
                        color={unlocked ? "green.700" : "gray.500"}
                        bg={unlocked ? "whiteAlpha.700" : "blackAlpha.50"}
                        px={3}
                        py={1}
                        borderRadius="full"
                      >
                        <Icon as={unlocked ? UnlockIcon : LockIcon} boxSize={3.5} />
                        <Text fontSize="sm" fontWeight="semibold">
                          {unlocked ? "Unlocked" : "Locked"}
                        </Text>
                      </HStack>
                      {cleared && (
                        <VStack spacing={1}>
                          <HStack spacing={1.5} color="green.800">
                            <Icon as={CheckCircleIcon} boxSize={4} />
                            <Text fontSize="sm" fontWeight="bold">
                              Passed
                            </Text>
                          </HStack>
                          {bestScore != null && Number.isFinite(bestScore) && (
                            <Text fontSize="sm" color="gray.700" fontWeight="bold">
                              Best score: {bestScore}/{questionCount ?? 10}
                            </Text>
                          )}
                        </VStack>
                      )}
                      {unlocked && !cleared && (
                        <Text fontSize="xs" color="gray.700" textAlign="center" lineHeight="short" px={1}>
                          Earn the badge by passing this level.
                        </Text>
                      )}
                      {unlocked && !activeSessionId && (
                        <Button
                          colorScheme={tier.buttonScheme}
                          size="sm"
                          w="full"
                          fontWeight="bold"
                          isDisabled={!!startingLevel}
                          isLoading={busy}
                          onClick={() => onStartLevel(level)}
                        >
                          Play level
                        </Button>
                      )}
                      {!unlocked && (
                        <Button colorScheme="gray" size="sm" w="full" fontWeight="bold" isDisabled>
                          Locked
                        </Button>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              );
              if (!celebrateHere) {
                return (
                  <Box key={level}>
                    {card}
                  </Box>
                );
              }
              return (
                <MotionBox
                  key={level}
                  layout
                  initial={{ scale: 0.97, opacity: 0.92 }}
                  animate={{
                    scale: [1, 1.045, 1, 1.035, 1],
                    opacity: 1,
                    boxShadow: [
                      tier.shadow,
                      "0 0 0 6px rgba(34, 197, 94, 0.35), 0 22px 48px -12px rgba(22, 163, 74, 0.45)",
                      tier.shadow,
                      "0 0 0 5px rgba(34, 197, 94, 0.28), 0 18px 40px -12px rgba(22, 163, 74, 0.35)",
                      tier.shadow,
                    ],
                  }}
                  transition={{ duration: 2.4, ease: "easeInOut", times: [0, 0.22, 0.45, 0.72, 1] }}
                >
                  {card}
                </MotionBox>
              );
            })}
          </SimpleGrid>
        )}

       
      </VStack>
    </Box>
  );
};

function FlexCentered({ children }) {
  return (
    <Flex justify="center" align="center" minH="200px">
      {children}
    </Flex>
  );
}

export default GameLevelsView;
