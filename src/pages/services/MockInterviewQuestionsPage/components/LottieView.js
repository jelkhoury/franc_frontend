import React from "react";
import { Box, Heading, Text, HStack, Button } from "@chakra-ui/react";
import Lottie from "lottie-react";
import gptTalking from "../../../../assets/animations/chat_animation.json";
import { isVideoMediaUrl } from "../utils/mediaUtils";

const MODE_COPY = {
  thinkingLoop: {
    text: "Thinking...",
    bg: "purple.50",
    color: "purple.700",
  },
  start_talk: {
    text: "Getting ready...",
    bg: "orange.50",
    color: "orange.700",
  },
  talkingChain: {
    text: "Playing question...",
    bg: "blue.100",
    color: "blue.700",
  },
  listeningLoop: {
    text: "Listening...",
    bg: "green.50",
    color: "green.700",
  },
  end_talk2: {
    text: "Done!",
    bg: "pink.50",
    color: "pink.700",
  },
};

/**
 * Interviewer panel: shows blob video prompts as <video>,
 * and falls back to Lottie + <audio> for audio-only URLs.
 */
const LottieView = ({
  lottieRef,
  videoRef,
  audioRef,
  mediaUrl,
  mode,
  selectedTitle,
  audioBlocked,
  onLottieComplete,
  onMediaPlaying,
  onMediaEnded,
  onMediaError,
  onEnableAudio,
}) => {
  const showVideo = isVideoMediaUrl(mediaUrl);
  const status = MODE_COPY[mode] || MODE_COPY.thinkingLoop;

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
        bg={showVideo ? "black" : "blue.50"}
        display="flex"
        alignItems="center"
        justifyContent="center"
        height="500px"
        position="relative"
        flex="1"
        minH={0}
      >
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
          maxW="90%"
        >
          <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
            {selectedTitle || "—"}
          </Text>
        </Box>

        {/* Always mounted so play() works without waiting for remount */}
        <Box
          as="video"
          ref={videoRef}
          controls
          playsInline
          preload="auto"
          onPlaying={onMediaPlaying}
          onEnded={onMediaEnded}
          onError={onMediaError}
          display={showVideo ? "block" : "none"}
          w="100%"
          h="100%"
          objectFit="contain"
          bg="black"
        />

        {!showVideo && (
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
        )}

        <audio
          ref={audioRef}
          preload="auto"
          onPlaying={onMediaPlaying}
          onEnded={onMediaEnded}
          onError={onMediaError}
          style={{ display: "none" }}
        />

        {!showVideo && (
          <Box
            position="absolute"
            bottom="10px"
            left="50%"
            transform="translateX(-50%)"
            bg={status.bg}
            color={status.color}
            px={4}
            py={2}
            borderRadius="md"
            boxShadow="sm"
            zIndex={3}
          >
            <Text fontSize="sm" fontWeight="medium">
              {status.text}
            </Text>
          </Box>
        )}
      </Box>

      {audioBlocked && (
        <HStack mt={3} spacing={2} wrap="wrap">
          <Button size="sm" colorScheme="pink" onClick={onEnableAudio}>
            Enable media
          </Button>
        </HStack>
      )}
    </Box>
  );
};

export default LottieView;
