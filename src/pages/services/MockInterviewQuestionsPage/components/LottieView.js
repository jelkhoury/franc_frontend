import React from "react";
import { Box, Heading, Text, HStack, Button } from "@chakra-ui/react";
import Lottie from "lottie-react";
import gptTalking from "../../../../assets/animations/chat_animation.json";

const MODE_COPY = {
  thinkingLoop: {
    text: "🤔 Thinking...",
    bg: "purple.50",
    color: "purple.700",
  },
  start_talk: {
    text: "🎬 Getting ready...",
    bg: "orange.50",
    color: "orange.700",
  },
  talkingChain: {
    text: "🗣️ Talking...",
    bg: "blue.100",
    color: "blue.700",
  },
  listeningLoop: {
    text: "👂 Listening...",
    bg: "green.50",
    color: "green.700",
  },
  end_talk2: {
    text: "✨ Done!",
    bg: "pink.50",
    color: "pink.700",
  },
};

/**
 * Lottie animation view component for interviewer avatar
 */
const LottieView = ({
  lottieRef,
  audioRef,
  mode,
  selectedTitle,
  audioBlocked,
  onLottieComplete,
  onAudioPlaying,
  onAudioEnded,
  onAudioError,
  onEnableAudio,
}) => {
  return (
    <Box
      flex="1"
      bg="white"
      borderRadius="lg"
      borderWidth="1px"
      boxShadow="md"
      p={4}
      display="flex"
      flexDirection="column"
    >
      <Heading size="sm" mb={3} color="gray.700">
        Interviewer
      </Heading>

      <Box
        overflow="hidden"
        borderRadius="md"
        borderWidth="1px"
        borderColor="gray.200"
        bg="blue.50"
        display="flex"
        alignItems="center"
        justifyContent="center"
        height="500px"
        position="relative"
        flex="1"
        minH={0}
      >
        {/* Title */}
        <Box
          position="absolute"
          top="8px"
          left="50%"
          transform="translateX(-50%)"
          bg="whiteAlpha.900"
          px={3}
          py={1}
          borderRadius="md"
          boxShadow="sm"
          zIndex={3}
        >
          <Text fontSize="sm" fontWeight="semibold">
            {selectedTitle || "—"}
          </Text>
        </Box>

        {/* Lottie animation */}
        <Lottie
          lottieRef={lottieRef}
          animationData={gptTalking}
          loop={false}
          autoplay={false}
          onComplete={onLottieComplete}
          style={{
            width: "70%",
            maxWidth: 340,
            minWidth: 220,
            height: "auto",
            pointerEvents: "none",
          }}
        />

        {/* Status pill */}
        {(() => {
          const s = MODE_COPY[mode] || MODE_COPY.thinkingLoop;
          return (
            <Box
              position="absolute"
              bottom="10px"
              left="50%"
              transform="translateX(-50%)"
              bg={s.bg}
              color={s.color}
              px={4}
              py={2}
              borderRadius="md"
              boxShadow="sm"
              zIndex={3}
            >
              <Text fontSize="sm" fontWeight="medium">
                {s.text}
              </Text>
            </Box>
          );
        })()}

        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          preload="auto"
          onPlaying={onAudioPlaying}
          onEnded={onAudioEnded}
          onError={onAudioError}
        />
      </Box>

      {audioBlocked && (
        <HStack mt={3} spacing={2} wrap="wrap">
          <Button size="sm" colorScheme="pink" onClick={onEnableAudio}>
            Enable Audio
          </Button>
        </HStack>
      )}
    </Box>
  );
};

export default LottieView;

