/** Lottie segments @ ~24fps */
const SEGMENTS = {
  listening: [0, 90],
  start_talk: [70, 90],
  talkingA: [90, 130],
  talkingB: [129, 170],
  talkingC: [168, 190],
  thinking: [206, 273], // idle
  end_talk2: [0, 43], // post-prompt flourish
};

const TRIM = 1;
const trim = ([s, e]) => [s + TRIM, Math.max(s + TRIM + 1, e - TRIM)];

const THINKING_LOOP = [trim(SEGMENTS.thinking)];
const LISTENING_LOOP = [trim(SEGMENTS.listening)];
const TALKING_CHAIN = [
  SEGMENTS.talkingA,
  SEGMENTS.talkingB,
  SEGMENTS.talkingC,
].map(trim);
const END_TALK2_ONCE = [trim(SEGMENTS.end_talk2)];
const START_TALK_ONCE = [trim(SEGMENTS.start_talk)];

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
 * Queue segments to play in Lottie animation
 * @param {Object} lottieRef - Reference to Lottie instance
 * @param {Array} segments - Array of segment arrays to play
 * @param {Object} options - Options object
 * @param {boolean} options.forceFirst - Whether to force first segment
 */
const queueSegments = (lottieRef, segments, { forceFirst = true } = {}) => {
  const inst = lottieRef.current;
  if (!inst || !segments?.length) return;
  inst.playSegments(segments[0], forceFirst);
  for (let i = 1; i < segments.length; i++)
    inst.playSegments(segments[i], false);
};

/**
 * Set Lottie animation mode
 * @param {Object} lottieRef - Reference to Lottie instance
 * @param {string} newMode - New mode to set
 * @param {Function} setModeState - State setter for mode
 */
const setLottieMode = (lottieRef, newMode, setModeState) => {
  setModeState(newMode); // Make UI reactive

  switch (newMode) {
    case "listeningLoop":
      queueSegments(lottieRef, LISTENING_LOOP, { forceFirst: true });
      break;
    case "talkingChain":
      queueSegments(lottieRef, TALKING_CHAIN, { forceFirst: true });
      break;
    case "end_talk2":
      queueSegments(lottieRef, END_TALK2_ONCE, { forceFirst: true });
      break;
    case "start_talk":
      queueSegments(lottieRef, START_TALK_ONCE, { forceFirst: true });
      break;
    case "thinkingLoop":
    default:
      queueSegments(lottieRef, THINKING_LOOP, { forceFirst: true });
      break;
  }
};

/**
 * Handle Lottie animation completion
 * @param {Object} lottieRef - Reference to Lottie instance
 * @param {string} currentMode - Current mode from ref
 * @param {Function} setMode - Function to set new mode
 * @param {Object} pendingStartRef - Ref for pending start state
 */
const onLottieComplete = (lottieRef, currentMode, setMode, pendingStartRef) => {
  // Keep looping current mode
  if (currentMode === "thinkingLoop")
    queueSegments(lottieRef, THINKING_LOOP, { forceFirst: true });
  if (currentMode === "listeningLoop")
    queueSegments(lottieRef, LISTENING_LOOP, { forceFirst: true });
  if (currentMode === "talkingChain")
    queueSegments(lottieRef, TALKING_CHAIN, { forceFirst: true });
  if (currentMode === "start_talk") {
    // Intro finished → switch to the chain once
    setMode("talkingChain");
    return;
  }
  if (currentMode === "end_talk2") {
    setMode("thinkingLoop");
    if (pendingStartRef.current) {
      pendingStartRef.current = false;
      // Don't start countdown immediately, show retry prompt instead
    }
  }
};

export {
  SEGMENTS,
  TRIM,
  trim,
  THINKING_LOOP,
  LISTENING_LOOP,
  TALKING_CHAIN,
  END_TALK2_ONCE,
  START_TALK_ONCE,
  MODE_COPY,
  queueSegments,
  setLottieMode,
  onLottieComplete,
};
