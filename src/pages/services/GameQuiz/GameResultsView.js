import {
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  Text,
  VStack,
  Badge,
  Icon,
} from "@chakra-ui/react";
import { CheckCircleIcon, StarIcon, RepeatIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import { useCountUp } from "./useCountUp";

const MotionBox = motion(Box);
const MotionHeading = motion(Heading);
const MotionText = motion(Text);
const MotionIcon = motion(Icon);
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 380, damping: 28 },
  },
};

function AnimatedScoreLine({ label, rawValue, colorScheme = "blue", prefix = "", suffix = "" }) {
  const n = typeof rawValue === "number" ? rawValue : Number(rawValue);
  const canCount = Number.isFinite(n);
  const display = useCountUp(canCount ? n : 0, { duration: 1100, enabled: canCount });
  const str =
    rawValue != null && String(rawValue).trim() !== "" && !canCount ? String(rawValue).trim() : "";

  return (
    <Badge
      fontSize="lg"
      px={4}
      py={2}
      colorScheme={colorScheme}
      borderRadius="md"
      boxShadow="sm"
    >
      {label}:{" "}
      {canCount ? (
        <Box as="span" fontWeight="extrabold" fontVariantNumeric="tabular-nums">
          {prefix}
          {display}
          {suffix}
        </Box>
      ) : str ? (
        <Box as="span" fontWeight="extrabold">
          {str}
        </Box>
      ) : null}
    </Badge>
  );
}

/** Large animated score for the “didn’t pass” results hero. */
function FailRunScoreHero({ rawValue, itemVariants }) {
  const n = typeof rawValue === "number" ? rawValue : Number(rawValue);
  const canCount = Number.isFinite(n);
  const display = useCountUp(canCount ? n : 0, { duration: 1200, enabled: canCount });
  const str =
    rawValue != null && String(rawValue).trim() !== "" && !canCount ? String(rawValue).trim() : "";

  return (
    <MotionBox
      w="full"
      maxW="260px"
      mx="auto"
      borderRadius="xl"
      bg="white"
      borderWidth="1px"
      borderColor="orange.100"
      boxShadow="0 10px 32px -14px rgba(251, 146, 60, 0.32)"
      px={{ base: 6, md: 7 }}
      py={6}
      variants={itemVariants}
    >
      <VStack spacing={1}>
        <Text
          fontSize="xs"
          fontWeight="bold"
          color="gray.500"
          letterSpacing="0.08em"
          textTransform="uppercase"
        >
          Your score this run
        </Text>
        <Box
          fontSize={{ base: "3xl", md: "4xl" }}
          fontWeight="extrabold"
          color="orange.500"
          lineHeight="shorter"
          fontVariantNumeric="tabular-nums"
        >
          {canCount ? (
            <>
              {display}
            </>
          ) : str ? (
            str
          ) : (
            "—"
          )}
        </Box>
      </VStack>
    </MotionBox>
  );
}

const GameResultsView = ({ summary, onPlayAgain, onBackToLevels }) => {
  const passed = summary.passed === true || summary.passed === "true";
  const failed = summary.passed === false || summary.passed === "false";
  const ambiguous = !passed && !failed;

  const scoreRaw = summary.score != null && summary.score !== "" ? summary.score : null;
  const hasBadge = summary.badge != null && summary.badge !== "";
  const hasPoints = summary.pointsEarned != null && summary.pointsEarned !== "";
  const showStatRow =
    (!failed && scoreRaw != null) || hasBadge || hasPoints;

  return (
    <Box maxW="500px" mx="auto" textAlign="center">
      <Card
        overflow="hidden"
        borderWidth={2}
        borderColor={passed ? "green.200" : failed ? "orange.200" : "brand.100"}
        shadow="xl"
        bg={
          failed
            ? "linear-gradient(165deg, #fff7ed 0%, #ffffff 42%, #faf5ff 100%)"
            : undefined
        }
        as={motion.div}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {failed && (
          <Box h={1.5} w="full" bgGradient="linear(to-r, orange.300, amber.400, purple.300)" />
        )}
        <CardBody py={8} px={{ base: 5, md: 8 }}>
          <MotionBox
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={5}
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <MotionBox
              variants={itemVariants}
              w={24}
              h={24}
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg={failed ? "orange.100" : passed ? "green.50" : "brand.50"}
              borderWidth="1px"
              borderColor={failed ? "orange.200" : passed ? "green.100" : "brand.100"}
              boxShadow="sm"
            >
              <MotionIcon
                as={passed ? CheckCircleIcon : failed ? RepeatIcon : StarIcon}
                boxSize={12}
                color={passed ? "green.500" : failed ? "orange.500" : "brand.500"}
                animate={
                  passed
                    ? { scale: [1, 1.08, 1], rotate: [0, -3, 3, 0] }
                    : failed
                      ? { rotate: [0, -6, 6, 0] }
                      : { scale: [1, 1.05, 1] }
                }
                transition={{ duration: 0.65, ease: "easeInOut" }}
              />
            </MotionBox>
            <MotionBox variants={itemVariants}>
              <Badge
                colorScheme={failed ? "orange" : passed ? "green" : "brand"}
                variant="subtle"
                px={3}
                py={1}
                borderRadius="full"
                fontWeight="semibold"
                letterSpacing="wide"
              >
                {failed ? "LEVEL NOT PASSED" : passed ? "LEVEL PASSED" : "COMPLETE"}
              </Badge>
            </MotionBox>
            <MotionHeading size="lg" color={failed ? "gray.800" : "brand.500"} variants={itemVariants}>
              {passed ? "Level complete!" : failed ? "Keep practicing" : "Session finished"}
            </MotionHeading>

            {failed && (
              <>
                <MotionText
                  color="gray.600"
                  fontSize="sm"
                  fontWeight="medium"
                  maxW="md"
                  mx="auto"
                  lineHeight="short"
                  variants={itemVariants}
                >
                  Every attempt sharpens what you remember — progress is the win.
                </MotionText>
                <MotionBox
                  w="full"
                  maxW="md"
                  mx="auto"
                  textAlign="left"
                  borderLeftWidth="4px"
                  borderLeftColor="orange.300"
                  bg="blackAlpha.50"
                  borderRadius="md"
                  py={3}
                  px={4}
                  variants={itemVariants}
                >
                  <Text color="gray.700" fontSize="sm" lineHeight="tall">
                    Scores improve with every run. Review the level, try another attempt, and come back
                    when you are ready — <Box as="span" fontWeight="semibold">consistency beats speed</Box>.
                  </Text>
                </MotionBox>
                {scoreRaw != null && (
                  <FailRunScoreHero rawValue={scoreRaw} itemVariants={itemVariants} />
                )}
              </>
            )}

            {ambiguous && (
              <MotionText color="gray.600" fontSize="md" variants={itemVariants}>
                Review your outcome below. If your backend adds a clear pass/fail flag, this title will
                match automatically.
              </MotionText>
            )}

            {showStatRow && (
              <MotionBox
                display="flex"
                flexDirection="row"
                flexWrap="wrap"
                gap={4}
                justifyContent="center"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {!failed && scoreRaw != null && (
                  <MotionBox variants={itemVariants} layout>
                    <AnimatedScoreLine label="Score" rawValue={summary.score} colorScheme="blue" />
                  </MotionBox>
                )}
                {hasBadge && (
                  <MotionBox variants={itemVariants} layout>
                    <Badge fontSize="lg" px={4} py={2} colorScheme="yellow" borderRadius="md" boxShadow="sm">
                      Badge: {String(summary.badge)}
                    </Badge>
                  </MotionBox>
                )}
                {hasPoints && (
                  <MotionBox variants={itemVariants} layout>
                    <AnimatedScoreLine
                      label="Points"
                      rawValue={summary.pointsEarned}
                      colorScheme="purple"
                      prefix="+"
                      suffix=" pts"
                    />
                  </MotionBox>
                )}
              </MotionBox>
            )}

            {summary.unlockedNextLevel != null && summary.unlockedNextLevel !== "" && (
              <MotionText
                color="green.600"
                fontWeight="semibold"
                variants={itemVariants}
                initial={{ scale: 0.92 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
              >
                Next level unlocked: {String(summary.unlockedNextLevel)}
              </MotionText>
            )}

            <MotionBox
              display="flex"
              flexDirection="column"
              gap={2}
              w="full"
              pt={3}
              variants={itemVariants}
            >
              <Button colorScheme="brand" size="md" w="full" onClick={onPlayAgain}>
                {failed ? "Try again" : "Play again"}
              </Button>
              <Button variant="ghost" w="full" onClick={onBackToLevels}>
                Back to levels
              </Button>
            </MotionBox>
          </MotionBox>
        </CardBody>
      </Card>
    </Box>
  );
};

export default GameResultsView;
