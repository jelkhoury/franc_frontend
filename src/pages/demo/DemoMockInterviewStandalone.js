import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, Heading, Text, VStack, HStack, Flex, SimpleGrid, useToast } from '@chakra-ui/react';
import Webcam from 'react-webcam';
import Lottie from 'lottie-react';

import gptTalking from '../../assets/animations/chat_animation.json';
import voiceover from '../../assets/audio/voiceover.m4a';

// ---- Segments (24 fps) ----
const SEGMENTS = {
  listening: [0, 90],
  talkingA:  [70, 130],
  talkingB:  [129, 170],
  talkingC:  [168, 190],
  end_talk:  [250,  273],
  end_talk2: [0,  43],
  thinking:  [206, 273],
};

// Avoid tiny pops on boundaries
const TRIM = 1;
const trim = ([s, e]) => [s + TRIM, Math.max(s + TRIM + 1, e - TRIM)];

// Debug: flip to true if you want to SEE the native audio controls
const SHOW_AUDIO_CONTROLS = false;

// Dummy questions
const DUMMY_QUESTIONS = [
  { id: 1, title: 'Tell me about yourself.' },
  { id: 2, title: 'Why did you choose this major?' },
  { id: 3, title: 'Describe a challenge you overcame.' },
  { id: 4, title: 'What project are you most proud of?' },
  { id: 5, title: 'Where do you see yourself in 5 years?' },
];

export default function DemoMockInterviewStandalone() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [audioBlocked, setAudioBlocked] = useState(false);

  const webcamRef = useRef(null);
  const lottieRef = useRef(null);
  const audioRef = useRef(null);

  // modes: 'thinkingLoop' | 'talkingChain' | 'listening' (one-shot)
  const modeRef = useRef('thinkingLoop');

  const toast = useToast();
  const selectedTitle = DUMMY_QUESTIONS[selectedIdx]?.title || 'Interview Question';

  const TALKING_CHAIN = [SEGMENTS.talkingA, SEGMENTS.talkingB, SEGMENTS.talkingC].map(trim);
  const THINKING_LOOP = [trim(SEGMENTS.thinking)];
  const end_talk2 = [trim(SEGMENTS.end_talk2)];
  const end_talk = [trim(SEGMENTS.end_talk)];


  // Queue segments into Lottie (first forces a jump; the rest chain)
  const queueSegments = (segments, { forceFirst = true } = {}) => {
    const inst = lottieRef.current;
    if (!inst || !segments?.length) return;
    inst.playSegments(segments[0], forceFirst);
    for (let i = 1; i < segments.length; i++) inst.playSegments(segments[i], false);
  };

  const setMode = (m) => {
    if (modeRef.current === m) return;
    modeRef.current = m;

    switch (m) {
      case 'talkingChain':
        queueSegments(TALKING_CHAIN, { forceFirst: true });
        break;
      case 'end_talk2': // one-shot
        queueSegments(end_talk2, { forceFirst: true });
        break;
      case 'end_talk': // one-shot
        queueSegments(end_talk, { forceFirst: true });
        break;
      case 'thinkingLoop':
      default:
        queueSegments(THINKING_LOOP, { forceFirst: true });
        break;
    }
  };

  // When a segment queue finishes, keep looping the current mode
  const onLottieComplete = () => {
    if (modeRef.current === 'talkingChain') {
      queueSegments(TALKING_CHAIN, { forceFirst: true });
    } else if (modeRef.current === 'thinkingLoop') {
      queueSegments(THINKING_LOOP, { forceFirst: true });
    } else if (modeRef.current === 'end_talk2' || modeRef.current === 'end_talk') {
      // one-shot done → back to idle
      modeRef.current = 'thinkingLoop';
      queueSegments(THINKING_LOOP, { forceFirst: true });
    }
  };

  // Default idle on mount
  useEffect(() => {
    const t = setTimeout(() => setMode('thinkingLoop'), 0);
    return () => clearTimeout(t);
  }, []);

  // Play audio (simple & reliable)
  const playVoiceSequence = async () => {
    const el = audioRef.current;
    if (!el) return;
    setAudioBlocked(false);

    try {
      await el.play(); // must be called from a user gesture
      // While playing, switch to talking chain
      setMode('talkingChain');
    } catch (e) {
      // Autoplay blocked (mobile/desktop policy)
      setAudioBlocked(true);
      toast({
        title: 'Enable audio',
        description: 'Click “Enable Audio” to start the voiceover.',
        status: 'warning',
        duration: 2500,
      });
    }
  };

  const pauseVoice = () => {
    audioRef.current?.pause();
    setMode('thinkingLoop');
  };

  const stopVoice = () => {
    const el = audioRef.current;
    if (el) { el.pause(); el.currentTime = 0; }
    setMode('thinkingLoop');
  };

  const onAudioError = () => {
    const el = audioRef.current;
    const err = el?.error;
    if (!err) return;
    const map = { 1: 'MEDIA_ERR_ABORTED', 2: 'MEDIA_ERR_NETWORK', 3: 'MEDIA_ERR_DECODE', 4: 'MEDIA_ERR_SRC_NOT_SUPPORTED' };
    console.error('Audio error:', map[err.code] || err.code, err.message || '');
    toast({
      title: 'Audio error',
      description: `${map[err.code] || err.code}: ${err.message || 'See console'}`,
      status: 'error',
      duration: 4000,
    });
  };

  return (
    <Box minH="100vh" bgGradient="linear(to-r, white, #ebf8ff)" display="flex" flexDirection="column" justifyContent="space-between">
      <Box px={{ base: 4, md: 8 }} py={8}>
        <Heading size="lg" mb={2} textAlign="center">Mock Interview Demo</Heading>
        <Text color="gray.600" mb={8} textAlign="center">
          Solid baseline: Lottie plays **talking** while the audio is playing, **thinking** when it’s not. “Listening (one)” is a one-shot.
        </Text>

        <Flex gap={6} direction={{ base: 'column', md: 'row' }} align="stretch">
          {/* Left: Webcam */}
          <Box flex="1" bg="white" borderRadius="lg" borderWidth="1px" boxShadow="md" p={4}>
            <Heading size="sm" mb={3} color="gray.700">Your Camera</Heading>
            <Box overflow="hidden" borderRadius="md" borderWidth="1px" borderColor="gray.200">
              <Webcam
                ref={webcamRef}
                mirrored
                screenshotFormat="image/jpeg"
                videoConstraints={{ width: 640, height: 360 }}
                style={{ display: 'block', width: '100%' }}
                onUserMedia={() => toast({ title: 'Camera on ✅', status: 'info', duration: 1200 })}
              />
            </Box>
          </Box>

          {/* Right: Lottie + audio */}
          <Box flex="1" bg="white" borderRadius="lg" borderWidth="1px" boxShadow="md" p={4}>
            <Heading size="sm" mb={3} color="gray.700">Interviewer (Lottie + Audio)</Heading>
            <Box
              overflow="hidden"
              borderRadius="md"
              borderWidth="1px"
              borderColor="gray.200"
              display="flex"
              alignItems="center"
              justifyContent="center"
              height="360px"
              position="relative"
            >
              {/* Title */}
              <Box position="absolute" top="8px" left="50%" transform="translateX(-50%)" bg="whiteAlpha.800" px={3} py={1} borderRadius="md" boxShadow="sm" zIndex={3}>
                <Text fontSize="sm" fontWeight="semibold">{selectedTitle}</Text>
              </Box>

              <Box width="260px" aria-label="Assistant is speaking">
                <Lottie
                  lottieRef={lottieRef}
                  animationData={gptTalking}
                  loop={false}
                  autoplay={false}
                  onComplete={onLottieComplete}
                />
              </Box>

              {/* Hidden (or visible for debugging) audio element */}
              <audio
                ref={audioRef}
                src={voiceover}
                preload="auto"
                controls={SHOW_AUDIO_CONTROLS}
                style={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  width: 260,
                  display: SHOW_AUDIO_CONTROLS ? 'block' : 'none',
                }}
                onPlaying={() => setMode('talkingChain')}
                onPause={() => setMode('thinkingLoop')}
                onEnded={() => setMode('thinkingLoop')}
                onError={onAudioError}
              />
            </Box>

            {/* Controls */}
            <HStack mt={3} spacing={2} wrap="wrap">
              <Button size="sm" colorScheme="blue" onClick={playVoiceSequence}>Play Voiceover</Button>
              <Button size="sm" onClick={pauseVoice}>Pause</Button>
              <Button size="sm" variant="outline" onClick={stopVoice}>Stop</Button>

              {audioBlocked && (
                <Button
                  size="sm"
                  colorScheme="pink"
                  onClick={async () => {
                    try {
                      setAudioBlocked(false);
                      await audioRef.current.play();
                    } catch (e) { console.error(e); }
                  }}
                >
                  Enable Audio
                </Button>
              )}
            </HStack>

            {/* Manual testers */}
            <HStack mt={3} spacing={2} wrap="wrap">
              <Button size="xs" onClick={() => setMode('thinkingLoop')}>Thinking (idle loop)</Button>
              <Button size="xs" onClick={() => setMode('talkingChain')}>Talking (chain loop)</Button>
              <Button size="xs" onClick={() => setMode('end_talk2')}>end_talk2 (one)</Button>
              <Button size="xs" onClick={() => setMode('end_talk')}>end_talk (one)</Button>
            </HStack>
          </Box>
        </Flex>

        {/* Questions */}
        <Box mt={8} bg="white" borderRadius="lg" borderWidth="1px" boxShadow="md" p={4}>
          <Heading size="sm" mb={3} color="gray.700">Questions</Heading>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3}>
            {DUMMY_QUESTIONS.map((q, idx) => (
              <Box key={q.id} p={3} borderRadius="md" bg={idx === selectedIdx ? 'blue.50' : 'gray.50'} borderWidth="1px" borderColor={idx === selectedIdx ? 'blue.200' : 'gray.200'}>
                <VStack align="stretch" spacing={2}>
                  <Text fontWeight="semibold">Q{idx + 1}</Text>
                  <Text fontSize="sm" color="gray.700">{q.title}</Text>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    variant={idx === selectedIdx ? 'solid' : 'outline'}
                    onClick={() => { setSelectedIdx(idx); playVoiceSequence(); }}
                  >
                    Show
                  </Button>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      </Box>

      <Box py={6} textAlign="center" color="gray.400" fontSize="sm">
        Demo layout • Minimal, reliable audio + animation flow
      </Box>
    </Box>
  );
}
