import {
  Box,
  Button,
  Circle,
  Flex,
  Heading,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Spinner,
} from "@chakra-ui/react";
import { CheckCircleIcon, LockIcon, UnlockIcon } from "@chakra-ui/icons";
import {
  Award,
  BarChart2,
  Gift,
  LayoutGrid,
  RefreshCw,
  Star,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { LEVEL_BADGE_ORDER } from "./gameSessionUtils";
import { useCountUp } from "./useCountUp";
import CareerLevelMedalBadge, {
  getMedalPresetForLevel,
} from "./CareerLevelMedalBadge";

const MotionText = motion(Text);
const MotionBox = motion(Box);

/** CareerQuest mock palette */
const CQ = {
  primary: "#005ea1",
  primaryContainer: "#2178c3",
  surface: "#f9f9ff",
  onSurface: "#121c2c",
  onSurfaceVariant: "#414751",
  onPrimary: "#ffffff",
  outlineVariant: "rgba(192, 199, 211, 0.45)",
  tierBronze: "#B9722D",
  tierSilver: "#9BA3AF",
  tierGold: "#F6AD55",
  tierPlatinum: "#4A5568",
  tierDiamond: "#005ea1",
  success: "#48BB78",
  surfaceContainerHigh: "#dee8ff",
  glass: "rgba(255, 255, 255, 0.72)",
  shadowPrimary: "0 10px 30px rgba(0, 94, 161, 0.06)",
};

const fontHeadline = '"Outfit", system-ui, sans-serif';
const fontBody = '"Plus Jakarta Sans", system-ui, sans-serif';

function tierHexFromColorScheme(colorScheme) {
  const m = {
    orange: CQ.tierBronze,
    gray: CQ.tierSilver,
    yellow: CQ.tierGold,
    purple: CQ.tierPlatinum,
    cyan: CQ.tierDiamond,
  };
  return m[colorScheme] ?? CQ.tierDiamond;
}

function tierTintBg(hex) {
  return `${hex}18`;
}

function AnimatedTotalPoints({ total }) {
  const n =
    typeof total === "number" && Number.isFinite(total)
      ? total
      : Number(total) || 0;
  const display = useCountUp(n, { duration: 950, enabled: true });
  return (
    <MotionText
      fontFamily={fontHeadline}
      fontSize={{ base: "1.5rem", md: "1.875rem" }}
      fontWeight="700"
      lineHeight="1.15"
      letterSpacing="-0.02em"
      color={CQ.primary}
      fontVariantNumeric="tabular-nums"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {display}
    </MotionText>
  );
}

function GlassCard({ children, ...rest }) {
  return (
    <Box
      bg={CQ.glass}
      backdropFilter="blur(12px)"
      sx={{ WebkitBackdropFilter: "blur(12px)" }}
      borderRadius="lg"
      borderWidth="1px"
      borderColor="rgba(0, 94, 161, 0.12)"
      boxShadow={CQ.shadowPrimary}
      {...rest}
    >
      {children}
    </Box>
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
  celebrateLevelNumber,
  onStartLevel,
  onResumeSession,
  onBack,
}) => {
  const [badgesDialogOpen, setBadgesDialogOpen] = useState(false);

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

  const highestTierHex = useMemo(() => {
    const row =
      LEVEL_BADGE_ORDER.find((r) => r.level === maxUnlockedLevel) ??
      LEVEL_BADGE_ORDER[0];
    return tierHexFromColorScheme(row.colorScheme);
  }, [maxUnlockedLevel]);

  return (
    <Box
      w="100%"
      minH="100%"
      pb={{ base: "72px", md: 0 }}
      fontFamily={fontBody}
      color={CQ.onSurface}
      bg={CQ.surface}
    >
      <Box
        as="main"
        maxW="1280px"
        mx="auto"
        px={{ base: 4, md: 8 }}
        py={{ base: 5, md: 7 }}
      >
        <VStack spacing={{ base: 6, md: 9 }} align="stretch">
          {activeSessionId && onResumeSession && (
            <GlassCard p={{ base: 3, md: 4 }}>
              <Flex
                direction={{ base: "column", md: "row" }}
                align={{ base: "stretch", md: "center" }}
                gap={4}
              >
                <Circle
                  size="36px"
                  bg="rgba(0, 94, 161, 0.1)"
                  color={CQ.primary}
                  flexShrink={0}
                >
                  <Icon as={RefreshCw} boxSize={4} />
                </Circle>
                <Box flex="1">
                  <Text
                    fontSize="10px"
                    fontWeight="700"
                    letterSpacing="0.1em"
                    color={CQ.primary}
                    textTransform="uppercase"
                    mb={0.5}
                  >
                    Active session
                  </Text>
                  <Heading
                    as="h2"
                    fontFamily={fontHeadline}
                    fontSize="md"
                    fontWeight="600"
                    mb={1}
                  >
                    Level in progress
                  </Heading>
                  <Text
                    color={CQ.onSurfaceVariant}
                    fontSize="sm"
                    maxW="2xl"
                    lineHeight="short"
                  >
                    You already have a run started. Continue where you left off,
                    or finish it from the quiz screen before starting another
                    level.
                  </Text>
                </Box>
                <Button
                  bg={CQ.primary}
                  color={CQ.onPrimary}
                  fontWeight="600"
                  fontSize="sm"
                  px={5}
                  py={2.5}
                  h="auto"
                  borderRadius="md"
                  boxShadow="0 6px 16px rgba(0, 94, 161, 0.2)"
                  _hover={{ bg: CQ.primaryContainer }}
                  _active={{ transform: "scale(0.98)" }}
                  isLoading={resumingSession}
                  isDisabled={!!startingLevel}
                  onClick={() => onResumeSession(activeSessionId)}
                  flexShrink={0}
                  alignSelf={{ base: "stretch", md: "center" }}
                >
                  Continue level
                </Button>
              </Flex>
            </GlassCard>
          )}

          <Box textAlign="center">
            <Box
              as="span"
              display="inline-block"
              px={3}
              py={0.5}
              borderRadius="full"
              bg={CQ.surfaceContainerHigh}
              color={CQ.primary}
              fontSize="10px"
              fontWeight="700"
              letterSpacing="0.1em"
              textTransform="uppercase"
              mb={2}
            >
              Your progression
            </Box>
            <Heading
              as="h1"
              fontFamily={fontHeadline}
              fontSize={{ base: "1.5rem", md: "1.875rem" }}
              fontWeight="700"
              letterSpacing="-0.02em"
              lineHeight="1.15"
              mb={3}
            >
              Career Quest
            </Heading>
            <Text
              fontSize={{ base: "sm", md: "md" }}
              color={CQ.onSurfaceVariant}
              maxW="3xl"
              mx="auto"
              lineHeight="short"
            >
              Clear{" "}
              <Box as="span" fontWeight="700" color={CQ.onSurface}>
                five levels
              </Box>
              , earn certified medals from{" "}
              <Box
                as="span"
                fontWeight="700"
                color={getMedalPresetForLevel(1).text}
              >
                Apply
              </Box>{" "}
              to{" "}
              <Box
                as="span"
                fontWeight="700"
                color={getMedalPresetForLevel(5).text}
              >
                Hired
              </Box>
              , and stack points. Jump into any{" "}
              <Box as="span" fontWeight="700" color={CQ.primary}>
                unlocked
              </Box>{" "}
              stage when you&apos;re ready.
            </Text>
          </Box>

          <SimpleGrid
            columns={{ base: 1, md: 2 }}
            spacing={4}
            alignItems="stretch"
          >
            <MotionBox
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06, duration: 0.38 }}
              h="full"
              minH={0}
            >
              <GlassCard
                p={4}
                borderLeftWidth="5px"
                borderLeftColor={CQ.primary}
                display="flex"
                alignItems="center"
                gap={4}
                h="full"
                w="full"
                transition="all 0.2s"
                _hover={{ shadow: "md", transform: "translateY(-2px)" }}
              >
                <Flex
                  w="44px"
                  h="44px"
                  borderRadius="xl"
                  bg="rgba(33, 120, 195, 0.1)"
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <Icon
                    as={Star}
                    boxSize={6}
                    color={CQ.primary}
                    fill={CQ.primary}
                  />
                </Flex>
                <Box flex="1" minW={0}>
                  <Text
                    fontSize="xs"
                    fontWeight="600"
                    color={CQ.onSurfaceVariant}
                    mb={0.5}
                  >
                    Total points
                  </Text>
                  <Box
                    minH={{ base: "2.5rem", md: "2.875rem" }}
                    display="flex"
                    alignItems="center"
                  >
                    {loading ? (
                      <Text
                        fontFamily={fontHeadline}
                        fontSize={{ base: "1.5rem", md: "1.875rem" }}
                        fontWeight="700"
                        lineHeight="1.15"
                        letterSpacing="-0.02em"
                        color={CQ.primary}
                      >
                        —
                      </Text>
                    ) : (
                      <AnimatedTotalPoints
                        key={totalPoints}
                        total={totalPoints}
                      />
                    )}
                  </Box>
                </Box>
              </GlassCard>
            </MotionBox>
            <MotionBox
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.38 }}
              h="full"
              minH={0}
            >
              <GlassCard
                p={4}
                borderLeftWidth="5px"
                borderLeftColor={highestTierHex}
                display="flex"
                alignItems="center"
                gap={4}
                h="full"
                w="full"
                transition="all 0.2s"
                _hover={{ shadow: "md", transform: "translateY(-2px)" }}
              >
                <Flex
                  w="44px"
                  h="44px"
                  borderRadius="xl"
                  bg={tierTintBg(highestTierHex)}
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <Icon as={UnlockIcon} boxSize={6} color={highestTierHex} />
                </Flex>
                <Box flex="1" minW={0}>
                  <Text
                    fontSize="xs"
                    fontWeight="600"
                    color={CQ.onSurfaceVariant}
                    mb={0.5}
                  >
                    Highest unlocked
                  </Text>
                  <Box
                    minH={{ base: "2.5rem", md: "2.875rem" }}
                    display="flex"
                    alignItems="center"
                  >
                    <MotionText
                      fontFamily={fontHeadline}
                      fontSize={{ base: "1.5rem", md: "1.875rem" }}
                      fontWeight="700"
                      letterSpacing="-0.02em"
                      lineHeight="1.15"
                      color={highestTierHex}
                      fontVariantNumeric="tabular-nums"
                      whiteSpace="nowrap"
                      initial={{ scale: 0.92 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 22,
                      }}
                    >
                      Level {maxUnlockedLevel}
                    </MotionText>
                  </Box>
                </Box>
              </GlassCard>
            </MotionBox>
          </SimpleGrid>

          {loading ? (
            <FlexCentered>
              <Spinner size="lg" color={CQ.primary} thickness="3px" />
            </FlexCentered>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={5} alignItems="stretch">
              {rows.map(
                ({
                  level,
                  colorScheme,
                  unlocked,
                  cleared,
                  bestScore,
                  questionCount,
                }) => {
                  const busy = startingLevel === level;
                  const tierHex = tierHexFromColorScheme(colorScheme);
                  const celebrateHere =
                    celebrateLevelNumber != null &&
                    Number(celebrateLevelNumber) === Number(level);
                  const isHighlightTier = level === 5 && unlocked && !cleared;

                  const cardInner = (
                    <GlassCard
                      p={5}
                      borderRadius="xl"
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      textAlign="center"
                      h="full"
                      borderTopWidth="4px"
                      borderTopColor={tierHex}
                      position="relative"
                      overflow="hidden"
                      opacity={unlocked ? 1 : 0.88}
                      transition="all 0.2s"
                      boxShadow={
                        isHighlightTier
                          ? `0 0 0 2px ${tierHex}55, ${CQ.shadowPrimary}`
                          : CQ.shadowPrimary
                      }
                      _hover={unlocked ? { shadow: "md" } : { shadow: "sm" }}
                      bg={unlocked ? CQ.glass : "rgba(240, 244, 250, 0.85)"}
                    >
                      {isHighlightTier && (
                        <Box
                          position="absolute"
                          inset={0}
                          bg={`${tierHex}0D`}
                          opacity={0}
                          _groupHover={{ opacity: 1 }}
                          transition="opacity 0.2s"
                          pointerEvents="none"
                        />
                      )}
                      <Box flexShrink={0} position="relative" zIndex={1} w="full">
                        <Flex justify="center" mb={3}>
                          <CareerLevelMedalBadge
                            preset={getMedalPresetForLevel(level)}
                            size={84}
                            earned={cleared}
                            active={unlocked}
                          />
                        </Flex>
                        <Heading
                          as="h3"
                          fontFamily={fontHeadline}
                          fontSize="lg"
                          fontWeight="600"
                          mb={5}
                          color={unlocked ? CQ.onSurface : CQ.onSurfaceVariant}
                        >
                          Level {level}
                        </Heading>
                      </Box>
                      <Box
                        flex="1"
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        w="full"
                        position="relative"
                        zIndex={1}
                      >
                        <HStack
                          color={unlocked ? CQ.success : CQ.onSurfaceVariant}
                          spacing={2}
                          mb={1.5}
                          minH="1.25rem"
                        >
                          <Icon
                            as={unlocked ? UnlockIcon : LockIcon}
                            boxSize={3.5}
                          />
                          <Text
                            fontSize="xs"
                            fontWeight="700"
                            letterSpacing="0.06em"
                          >
                            {unlocked ? "Unlocked" : "Locked"}
                          </Text>
                        </HStack>
                        <Box
                          minH="1.5rem"
                          mb={3}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <HStack
                            color={CQ.success}
                            fontWeight="700"
                            spacing={2}
                            visibility={cleared ? "visible" : "hidden"}
                            aria-hidden={!cleared}
                          >
                            <Icon as={CheckCircleIcon} boxSize={3.5} />
                            <Text
                              fontSize="xs"
                              fontWeight="700"
                              letterSpacing="0.08em"
                              textTransform="uppercase"
                            >
                              Passed
                            </Text>
                          </HStack>
                        </Box>
                        <Text
                          fontSize="sm"
                          fontWeight="600"
                          color={CQ.onSurfaceVariant}
                          mb={2}
                          minH="1.375rem"
                          lineHeight="1.375rem"
                        >
                          Best score:{" "}
                          <Box
                            as="span"
                            color={CQ.onSurface}
                            fontWeight="700"
                            opacity={
                              cleared &&
                              bestScore != null &&
                              Number.isFinite(bestScore)
                                ? 1
                                : 0.35
                            }
                          >
                            {cleared &&
                            bestScore != null &&
                            Number.isFinite(bestScore)
                              ? `${bestScore}/${questionCount ?? 10}`
                              : "—"}
                          </Box>
                        </Text>
                      </Box>
                      <Box
                        w="full"
                        flexShrink={0}
                        minH="44px"
                        display="flex"
                        alignItems="flex-end"
                        position="relative"
                        zIndex={1}
                      >
                        {unlocked && !activeSessionId ? (
                          <Button
                            w="full"
                            px={6}
                            py={2.5}
                            h="40px"
                            size="sm"
                            bg={tierHex}
                            color={CQ.onPrimary}
                            fontWeight="600"
                            fontSize="sm"
                            borderRadius="md"
                            _hover={{ bg: CQ.primaryContainer }}
                            boxShadow={`0 8px 18px ${tierHex}33`}
                            isDisabled={!!startingLevel}
                            isLoading={busy}
                            onClick={() => onStartLevel(level)}
                          >
                            Start level
                          </Button>
                        ) : (
                          <Button
                            w="full"
                            px={6}
                            py={2.5}
                            h="40px"
                            size="sm"
                            variant="outline"
                            borderColor={CQ.outlineVariant}
                            color={CQ.onSurfaceVariant}
                            fontWeight="600"
                            fontSize="sm"
                            borderRadius="md"
                            isDisabled
                            visibility={unlocked ? "hidden" : "visible"}
                            aria-hidden={unlocked}
                            pointerEvents="none"
                          >
                            Locked
                          </Button>
                        )}
                      </Box>
                    </GlassCard>
                  );

                  const wrapped = (
                    <Box
                      key={level}
                      role="group"
                      h="full"
                      display="flex"
                      flexDirection="column"
                    >
                      {cardInner}
                    </Box>
                  );

                  if (!celebrateHere) {
                    return wrapped;
                  }
                  return (
                    <MotionBox
                      key={level}
                      h="full"
                      alignSelf="stretch"
                      display="flex"
                      flexDirection="column"
                      layout
                      initial={{ scale: 0.97, opacity: 0.92 }}
                      animate={{
                        scale: [1, 1.045, 1, 1.035, 1],
                        opacity: 1,
                        boxShadow: [
                          CQ.shadowPrimary,
                          "0 0 0 6px rgba(72, 187, 120, 0.35), 0 22px 48px -12px rgba(34, 197, 94, 0.35)",
                          CQ.shadowPrimary,
                          "0 0 0 5px rgba(72, 187, 120, 0.28), 0 18px 40px -12px rgba(34, 197, 94, 0.28)",
                          CQ.shadowPrimary,
                        ],
                      }}
                      transition={{
                        duration: 2.4,
                        ease: "easeInOut",
                        times: [0, 0.22, 0.45, 0.72, 1],
                      }}
                    >
                      {wrapped}
                    </MotionBox>
                  );
                },
              )}
            </SimpleGrid>
          )}

          <Box
            borderRadius="2xl"
            overflow="hidden"
            bgGradient={`linear(to-r, ${CQ.primaryContainer}, ${CQ.tierDiamond})`}
            p={{ base: 4, md: 6 }}
            color={CQ.onPrimary}
            position="relative"
            boxShadow="md"
          >
            <Box
              position="absolute"
              right="-5%"
              top="-10%"
              w="180px"
              h="180px"
              bg="rgba(255,255,255,0.1)"
              borderRadius="full"
              filter="blur(40px)"
              pointerEvents="none"
            />
            <Flex
              direction={{ base: "column", md: "row" }}
              align="center"
              justify="space-between"
              gap={5}
              position="relative"
              zIndex={1}
            >
              <VStack
                align={{ base: "center", md: "start" }}
                spacing={2.5}
                maxW="lg"
                textAlign={{ base: "center", md: "left" }}
              >
                <Heading
                  as="h2"
                  fontFamily={fontHeadline}
                  fontSize={{ base: "md", md: "lg" }}
                  fontWeight="600"
                >
                  Badges worth earning
                </Heading>
                <Text
                  fontSize={{ base: "sm", md: "md" }}
                  opacity={0.92}
                  lineHeight="short"
                >
                  Every level you pass earns you a badge—a clear mark of what
                  you&apos;ve mastered and something you can genuinely be proud
                  of.
                </Text>
                <Button
                  bg="white"
                  color={CQ.primary}
                  px={5}
                  py={2}
                  h="auto"
                  fontSize="sm"
                  borderRadius="lg"
                  fontWeight="600"
                  boxShadow="0 8px 24px rgba(0,0,0,0.1)"
                  _hover={{ transform: "scale(1.02)" }}
                  onClick={() => setBadgesDialogOpen(true)}
                >
                  Explore game badges
                </Button>
              </VStack>
              <Flex
                justify="center"
                align="center"
                fontSize="3rem"
                filter="drop-shadow(0 8px 16px rgba(0,0,0,0.18))"
                aria-hidden
              >
                <Icon as={Award} strokeWidth={1.25} boxSize={12} />
              </Flex>
            </Flex>
          </Box>
        </VStack>
      </Box>

      {/* Mobile bottom nav */}
      <Flex
        as="nav"
        display={{ base: "flex", md: "none" }}
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        zIndex={50}
        bg="rgba(249, 249, 255, 0.96)"
        backdropFilter="blur(10px)"
        borderTopWidth="1px"
        borderColor={CQ.outlineVariant}
        borderTopRadius="xl"
        boxShadow="0 -6px 20px rgba(18, 28, 44, 0.06)"
        py={2}
        px={3}
        justify="space-around"
        align="center"
      >
        <VStack
          as="button"
          spacing={0.5}
          cursor="pointer"
          onClick={onBack}
          bg="rgba(33, 120, 195, 0.12)"
          borderRadius="lg"
          px={3}
          py={0.5}
          border="none"
          color={CQ.primary}
        >
          <Icon as={LayoutGrid} boxSize={4} />
          <Text fontSize="10px" fontWeight="700">
            Home
          </Text>
        </VStack>
        <VStack spacing={0.5} color={CQ.onSurfaceVariant} opacity={0.7}>
          <Icon as={BarChart2} boxSize={4} />
          <Text fontSize="10px" fontWeight="700">
            Rank
          </Text>
        </VStack>
        <VStack spacing={0.5} color={CQ.onSurfaceVariant} opacity={0.7}>
          <Icon as={Gift} boxSize={4} />
          <Text fontSize="10px" fontWeight="700">
            Prizes
          </Text>
        </VStack>
        <VStack spacing={0.5} color={CQ.onSurfaceVariant} opacity={0.7}>
          <Icon as={User} boxSize={4} />
          <Text fontSize="10px" fontWeight="700">
            Me
          </Text>
        </VStack>
      </Flex>

      <Modal
        isOpen={badgesDialogOpen}
        onClose={() => setBadgesDialogOpen(false)}
        isCentered
        size="md"
        motionPreset="slideInBottom"
      >
        <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(4px)" />
        <ModalContent
          borderRadius="xl"
          mx={3}
          fontFamily={fontBody}
          boxShadow="xl"
          borderWidth="1px"
          borderColor="rgba(0, 94, 161, 0.12)"
        >
          <ModalHeader
            fontFamily={fontHeadline}
            fontSize="lg"
            fontWeight="700"
            color={CQ.onSurface}
            pr={10}
            pb={1}
          >
            Your level badges
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody maxH="65vh" overflowY="auto" pt={0}>
            <Text
              fontSize="sm"
              color={CQ.onSurfaceVariant}
              mb={4}
              lineHeight="short"
            >
              One certified medal per level when you pass it. Earn Apply through
              Hired as you move from applicant to employee.
            </Text>
            <VStack align="stretch" spacing={4}>
              {rows.map(({ level, cleared, unlocked }) => {
                const preset = getMedalPresetForLevel(level);
                const earned = !!cleared;
                const desc = earned
                  ? `${preset.title} — earned by passing Level ${level}.`
                  : unlocked
                    ? `${preset.title} — pass Level ${level} to earn this medal.`
                    : `${preset.title} — unlock Level ${level} by clearing the previous stage.`;
                return (
                  <HStack key={level} align="start" spacing={4}>
                    <CareerLevelMedalBadge
                      preset={preset}
                      size={64}
                      earned={earned}
                      active={unlocked}
                    />
                    <Box minW={0} pt={1}>
                      <Text
                        fontSize="xs"
                        fontWeight="700"
                        color={CQ.onSurface}
                        lineHeight="short"
                      >
                        Level {level}{" "}
                        <Text
                          as="span"
                          fontWeight="600"
                          color={CQ.onSurfaceVariant}
                        >
                          ({preset.title})
                        </Text>
                      </Text>
                      <Text
                        fontSize="xs"
                        color={CQ.onSurfaceVariant}
                        lineHeight="short"
                        mt={0.5}
                      >
                        {desc}
                      </Text>
                    </Box>
                  </HStack>
                );
              })}
            </VStack>
          </ModalBody>
          <ModalFooter pt={2} gap={2}>
            <Button
              bg={CQ.primary}
              color={CQ.onPrimary}
              fontWeight="600"
              size="sm"
              px={6}
              _hover={{ bg: CQ.primaryContainer }}
              onClick={() => setBadgesDialogOpen(false)}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

function FlexCentered({ children }) {
  return (
    <Flex justify="center" align="center" minH="140px">
      {children}
    </Flex>
  );
}

export default GameLevelsView;
