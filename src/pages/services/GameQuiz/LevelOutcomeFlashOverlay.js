import { Box, Text, VStack, HStack } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { FaTrophy, FaUnlock, FaRedo, FaStar } from "react-icons/fa";
import { useCountUp } from "./useCountUp";

const DISMISS_MS_PASS = 2800;
const DISMISS_MS_FAIL = 3600;
const DISMISS_MS_NEUTRAL = 2400;

/**
 * Full-screen outcome flash when a level run ends (pass / unlock vs fail / try again).
 * @param {object|null} payload
 * @param {'pass'|'fail'|'ambiguous'} payload.variant
 * @param {number} payload.levelNumber — level just played
 * @param {number|null} payload.unlockedLevel — next level unlocked (pass)
 * @param {number} payload.correctCount — correct answers this run
 * @param {number} payload.totalQuestions — e.g. 10
 * @param {string|null} payload.badgeLabel
 */
export default function LevelOutcomeFlashOverlay({ payload, onDismiss }) {
  useEffect(() => {
    if (!payload) return undefined;
    const ms =
      payload.variant === "pass"
        ? DISMISS_MS_PASS
        : payload.variant === "fail"
          ? DISMISS_MS_FAIL
          : DISMISS_MS_NEUTRAL;
    const t = window.setTimeout(() => onDismiss?.(payload), ms);
    return () => window.clearTimeout(t);
  }, [payload, onDismiss]);

  const correct = payload?.correctCount;
  const total = payload?.totalQuestions ?? 10;
  const countDisplay = useCountUp(typeof correct === "number" && Number.isFinite(correct) ? correct : 0, {
    duration: 900,
    enabled: !!payload && payload.variant === "fail",
  });

  return (
    <AnimatePresence>
      {payload && (
        <Box
          key={`${payload.variant}-${payload.levelNumber}`}
          as={motion.div}
          position="fixed"
          inset={0}
          zIndex={1990}
          display="flex"
          alignItems="center"
          justifyContent="center"
          pointerEvents="none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Box
            position="absolute"
            inset={0}
            bg="blackAlpha.40"
            backdropFilter="blur(5px)"
            as={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <Box
            as={motion.div}
            role="status"
            aria-live="polite"
            position="relative"
            maxW="md"
            mx={4}
            px={{ base: 6, md: 10 }}
            py={{ base: 8, md: 10 }}
            borderRadius="2xl"
            borderWidth="3px"
            borderColor={
              payload.variant === "pass"
                ? "green.400"
                : payload.variant === "fail"
                  ? "orange.300"
                  : "blue.200"
            }
            sx={
              payload.variant === "pass"
                ? {
                    background:
                      "linear-gradient(145deg, #ecfdf5 0%, #6ee7b7 45%, #059669 100%)",
                    boxShadow:
                      "0 25px 50px -12px rgba(0,0,0,0.28), 0 0 48px rgba(16, 185, 129, 0.45)",
                  }
                : payload.variant === "fail"
                  ? {
                      background:
                        "linear-gradient(145deg, #fff7ed 0%, #fdba74 42%, #ea580c 100%)",
                      boxShadow:
                        "0 25px 50px -12px rgba(0,0,0,0.25), 0 0 36px rgba(234, 88, 12, 0.35)",
                    }
                  : {
                      background:
                        "linear-gradient(145deg, #eff6ff 0%, #93c5fd 50%, #2563eb 100%)",
                      boxShadow: "0 25px 50px -12px rgba(0,0,0,0.22)",
                    }
            }
            initial={{ scale: 0.72, y: 32, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: -16, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
          >
            <VStack spacing={4} textAlign="center">
              {payload.variant === "pass" && (
                <>
                  <HStack justify="center" spacing={3}>
                    <Box
                      as={motion.div}
                      animate={{ rotate: [0, -8, 8, 0], y: [0, -4, 0] }}
                      transition={{ duration: 0.7, ease: "easeInOut" }}
                      filter="drop-shadow(0 6px 16px rgba(5, 150, 105, 0.5))"
                    >
                      <FaTrophy size={56} color="#14532d" />
                    </Box>
                    <Box
                      as={motion.div}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, rotate: [0, 10, 0] }}
                      transition={{ type: "spring", delay: 0.12, stiffness: 260, damping: 14 }}
                    >
                      <FaStar size={40} color="#ca8a04" />
                    </Box>
                  </HStack>
                  <Text
                    fontSize={{ base: "2xl", md: "3xl" }}
                    fontWeight="black"
                    color="gray.900"
                    textShadow="0 1px 0 rgba(255,255,255,0.45)"
                  >
                    Level {payload.levelNumber} complete!
                  </Text>
                  {payload.unlockedLevel != null && (
                    <HStack
                      as={motion.div}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      justify="center"
                      spacing={2}
                      bg="whiteAlpha.900"
                      px={4}
                      py={3}
                      borderRadius="xl"
                      borderWidth="2px"
                      borderColor="green.500"
                    >
                      <FaUnlock size={22} color="#15803d" />
                      <Text fontWeight="bold" fontSize="lg" color="green.800">
                        Level {payload.unlockedLevel} unlocked
                      </Text>
                    </HStack>
                  )}
                  {payload.badgeLabel && (
                    <Text fontSize="sm" fontWeight="semibold" color="green.900" opacity={0.95}>
                      Badge: {payload.badgeLabel}
                    </Text>
                  )}
                </>
              )}

              {payload.variant === "fail" && (
                <>
                  <Box
                    as={motion.div}
                    animate={{ x: [0, -3, 3, -2, 2, 0] }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    filter="drop-shadow(0 6px 18px rgba(234, 88, 12, 0.4))"
                  >
                    <FaRedo size={52} color="#9a3412" />
                  </Box>
                  <Text
                    fontSize={{ base: "2xl", md: "3xl" }}
                    fontWeight="black"
                    color="gray.900"
                    textShadow="0 1px 0 rgba(255,255,255,0.4)"
                  >
                    Not quite yet
                  </Text>
                  <Box
                    as={motion.div}
                    initial={{ scale: 0.85 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 280, damping: 16 }}
                    px={6}
                    py={4}
                    borderRadius="2xl"
                    bg="whiteAlpha.920"
                    borderWidth="2px"
                    borderColor="orange.400"
                    boxShadow="md"
                  >
                    <HStack spacing={2} justify="center" align="baseline">
                      <Text
                        fontSize="5xl"
                        fontWeight="black"
                        fontVariantNumeric="tabular-nums"
                        color="orange.900"
                        lineHeight="1"
                      >
                        {countDisplay}
                      </Text>
                      <Text fontSize="3xl" fontWeight="bold" color="gray.600">
                        /
                      </Text>
                      <Text
                        fontSize="5xl"
                        fontWeight="extrabold"
                        fontVariantNumeric="tabular-nums"
                        color="gray.700"
                        lineHeight="1"
                      >
                        {total}
                      </Text>
                    </HStack>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.600" mt={2}>
                      correct this run
                    </Text>
                  </Box>
                  <Text fontSize="md" fontWeight="medium" color="gray.900" px={2} lineHeight="tall">
                    Keep practicing — try again when you are ready to pass the level.
                  </Text>
                </>
              )}

              {payload.variant === "ambiguous" && (
                <>
                  <FaStar size={48} color="#1d4ed8" />
                  <Text fontSize="2xl" fontWeight="extrabold" color="gray.900">
                    Session finished
                  </Text>
                  <Text fontSize="sm" color="gray.800">
                    See your results on the screen below.
                  </Text>
                </>
              )}
            </VStack>
          </Box>
        </Box>
      )}
    </AnimatePresence>
  );
}
