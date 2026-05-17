import { Box, Text, VStack, HStack } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import {
  FaCut,
  FaDice,
  FaSnowflake,
  FaForward,
} from "react-icons/fa";
import { GAME_TIME_FREEZE_EXTRA_SECONDS } from "./gameSessionUtils";

const DISMISS_MS_DEFAULT = 1600;
const DISMISS_MS_TIME_FREEZE = 2400;

const ABILITY_CONFIG = {
  FiftyFifty: {
    Icon: FaCut,
    title: "50 / 50",
    subtitle: "Two incorrect answers were removed.",
    gradient: "linear-gradient(135deg, #dcfce7 0%, #4ade80 45%, #16a34a 100%)",
    iconColor: "#14532d",
    borderColor: "green.300",
    glow: "0 0 36px rgba(34, 197, 94, 0.45)",
  },
  DoubleChance: {
    Icon: FaDice,
    title: "Double chance",
    subtitle: "You can answer again on this question.",
    gradient: "linear-gradient(135deg, #ede9fe 0%, #a78bfa 50%, #7c3aed 100%)",
    iconColor: "#4c1d95",
    borderColor: "purple.300",
    glow: "0 0 38px rgba(139, 92, 246, 0.5)",
  },
  TimeFreeze: {
    Icon: FaSnowflake,
    title: "Time extended",
    subtitle: "Extra time was added to this question's clock.",
    gradient: "linear-gradient(135deg, #e0f2fe 0%, #38bdf8 45%, #0284c7 100%)",
    iconColor: "#0c4a6e",
    borderColor: "cyan.300",
    glow: "0 0 42px rgba(14, 165, 233, 0.5)",
  },
  Skip: {
    Icon: FaForward,
    title: "Skipped",
    subtitle: "Moving on — this question counts as missed.",
    gradient: "linear-gradient(135deg, #f1f5f9 0%, #94a3b8 50%, #475569 100%)",
    iconColor: "#1e293b",
    borderColor: "gray.400",
    glow: "0 0 32px rgba(100, 116, 139, 0.4)",
  },
};

function AbilityVisual({ ability }) {
  const cfg = ABILITY_CONFIG[ability];
  if (!cfg) return null;
  const { Icon } = cfg;

  if (ability === "FiftyFifty") {
    return (
      <HStack spacing={0} justify="center" mb={2}>
        <Box
          w="56px"
          h="72px"
          bg="green.400"
          borderRadius="md 0 0 md"
          borderWidth="2px"
          borderColor="green.700"
          as={motion.div}
          initial={{ x: -40, opacity: 0, rotate: -8 }}
          animate={{ x: 0, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
        />
        <Box
          w="8px"
          h="80px"
          bg="white"
          borderRadius="sm"
          boxShadow="md"
          as={motion.div}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.15, duration: 0.25 }}
        />
        <Box
          w="56px"
          h="72px"
          bg="green.400"
          borderRadius="0 md md 0"
          borderWidth="2px"
          borderColor="green.700"
          as={motion.div}
          initial={{ x: 40, opacity: 0, rotate: 8 }}
          animate={{ x: 0, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
        />
      </HStack>
    );
  }

  if (ability === "TimeFreeze") {
    const sec = GAME_TIME_FREEZE_EXTRA_SECONDS;
    return (
      <VStack spacing={3} mb={2}>
        <Box position="relative" display="inline-block">
          <Box
            as={motion.div}
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            filter="drop-shadow(0 4px 12px rgba(14, 165, 233, 0.5))"
          >
            <Icon size={64} color={cfg.iconColor} />
          </Box>
          <Box
            position="absolute"
            inset={0}
            as={motion.div}
            initial={{ scale: 1.2, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 0 }}
            transition={{ duration: 1.2, repeat: Infinity }}
            borderRadius="full"
            bg="cyan.200"
            opacity={0.35}
            pointerEvents="none"
          />
        </Box>
        <Box
          as={motion.div}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: [0.85, 1.08, 1], opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.05 }}
          px={5}
          py={2}
          borderRadius="xl"
          bg="whiteAlpha.900"
          borderWidth="2px"
          borderColor="cyan.300"
          boxShadow="lg"
        >
          <Text
            as="span"
            fontSize="4xl"
            fontWeight="black"
            letterSpacing="tight"
            bgGradient="linear(to-br, cyan.600, blue.700)"
            bgClip="text"
            lineHeight="1"
          >
            +{sec}s
          </Text>
        </Box>
      </VStack>
    );
  }

  if (ability === "DoubleChance") {
    return (
      <HStack spacing={3} justify="center" mb={2}>
        <Box
          as={motion.div}
          animate={{ y: [0, -6, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: 2 }}
        >
          <Icon size={56} color={cfg.iconColor} />
        </Box>
        <Box
          as={motion.div}
          animate={{ y: [0, -6, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 0.6, repeat: 2, delay: 0.1 }}
        >
          <Icon size={56} color={cfg.iconColor} />
        </Box>
      </HStack>
    );
  }

  if (ability === "Skip") {
    return (
      <Box mb={2} filter="drop-shadow(0 4px 14px rgba(71, 85, 105, 0.45))">
        <Box
          as={motion.div}
          initial={{ x: -80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 16 }}
        >
          <Icon size={72} color={cfg.iconColor} />
        </Box>
      </Box>
    );
  }

  return null;
}

/**
 * Full-screen centered flash when an ability is used successfully.
 * @param {string|null} ability — one of GAME_ABILITIES or null
 */
export default function AbilityFlashOverlay({ ability, onDismiss }) {
  useEffect(() => {
    if (!ability) return undefined;
    const ms =
      ability === "TimeFreeze" ? DISMISS_MS_TIME_FREEZE : DISMISS_MS_DEFAULT;
    const t = window.setTimeout(() => onDismiss?.(), ms);
    return () => window.clearTimeout(t);
  }, [ability, onDismiss]);

  return (
    <AnimatePresence>
      {ability && ABILITY_CONFIG[ability] && (
        <Box
          key={ability}
          as={motion.div}
          position="fixed"
          inset={0}
          zIndex={2000}
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
            bg="blackAlpha.35"
            backdropFilter="blur(4px)"
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
            maxW="sm"
            mx={4}
            px={8}
            py={7}
            borderRadius="2xl"
            borderWidth="3px"
            borderColor={ABILITY_CONFIG[ability].borderColor}
            sx={{
              background: ABILITY_CONFIG[ability].gradient,
              boxShadow: `0 25px 50px -12px rgba(0,0,0,0.25), ${ABILITY_CONFIG[ability].glow}`,
            }}
            initial={{ scale: 0.75, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: -12, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
          >
            <VStack spacing={2} textAlign="center">
              <AbilityVisual ability={ability} />
              <Text fontSize="2xl" fontWeight="extrabold" color="gray.900" textShadow="0 1px 0 rgba(255,255,255,0.5)">
                {ABILITY_CONFIG[ability].title}
              </Text>
              <Text fontSize="sm" fontWeight="medium" color="gray.800" opacity={0.92}>
                {ABILITY_CONFIG[ability].subtitle}
              </Text>
            </VStack>
          </Box>
        </Box>
      )}
    </AnimatePresence>
  );
}
