import { Box, Button, Progress, useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import Footer from "../../../components/Footer";
import { useContext, useState, useEffect, useMemo, useRef, useCallback } from "react";
import { AuthContext } from "../../../components/AuthContext";
import { get, post } from "../../../utils/httpServices";
import { captureError } from "../../../utils/sentryUtils";
import { GAME_ENDPOINTS } from "../../../services/apiService";
import GameLevelsView from "./GameLevelsView";
import GameSessionView from "./GameSessionView";
import GameResultsView from "./GameResultsView";
import {
  pickSessionId,
  getTotalPoints,
  getMaxUnlockedLevel,
  resolveCurrentAnswer,
  buildAbilityCounts,
  isSessionComplete,
  extractResultSummary,
  getQuestionProgressDisplay,
  hasSessionAnswerId,
  unwrapSessionPayload,
  getActiveSessionIdFromProgress,
  getLevelNumberFromSession,
  formatGameApiError,
  isLikelySessionAlreadyActiveError,
  pickSessionIdFromErrorDetails,
  readPendingGameSessionId,
  writePendingGameSessionId,
  clearPendingGameSessionId,
  OPTION_KEYS,
} from "./gameSessionUtils";
import { playGameSound, unlockGameAudio } from "./gameWebAudio";

const SESSION_LIMIT_SEC = 15 * 60;
const QUESTION_LIMIT_SEC = 30;

const GameQuizTryPage = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [session, setSession] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [activeLevelNumber, setActiveLevelNumber] = useState(1);
  const [startingLevel, setStartingLevel] = useState(null);
  const [resumingSession, setResumingSession] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [abilityLoading, setAbilityLoading] = useState(null);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [finishSnapshot, setFinishSnapshot] = useState(null);
  const [tick, setTick] = useState(0);

  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return window.localStorage.getItem("franc_game_sound") !== "0";
    } catch {
      return true;
    }
  });

  const sessionStartedAtRef = useRef(null);
  const questionEndsAtRef = useRef(null);
  const sessionTimeoutFiredRef = useRef(false);
  const lastQuestionTimeoutIdRef = useRef(null);
  const lastTickSoundAtRef = useRef(0);
  const tenSecondSoundPlayedForKeyRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (!isLoggedIn || step !== 1) return undefined;
    let cancelled = false;
    (async () => {
      setLoadingProgress(true);
      try {
        const data = await get(GAME_ENDPOINTS.PROGRESS);
        if (!cancelled) setProgress(data);
      } catch (error) {
        captureError(error);
        console.error("Game progress:", error);
        toast({
          title: "Could not load progress",
          description: error?.message || "Please try again.",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      } finally {
        if (!cancelled) setLoadingProgress(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, step, toast]);

  useEffect(() => {
    if (step !== 2) return undefined;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [step]);

  const totalPoints = useMemo(() => getTotalPoints(progress), [progress]);
  const maxUnlocked = useMemo(() => getMaxUnlockedLevel(progress), [progress]);
  const activeSessionId = useMemo(
    () => getActiveSessionIdFromProgress(progress) ?? readPendingGameSessionId(),
    [progress]
  );

  const currentAnswer = useMemo(() => resolveCurrentAnswer(session), [session]);
  const currentQuestionKey = useMemo(() => {
    const ca = resolveCurrentAnswer(session);
    return hasSessionAnswerId(ca) ? String(ca.sessionAnswerId) : null;
  }, [session]);
  const abilityCounts = useMemo(
    () => buildAbilityCounts(session, currentAnswer),
    [session, currentAnswer]
  );
  const qProgress = useMemo(
    () => getQuestionProgressDisplay(session, currentAnswer),
    [session, currentAnswer]
  );

  const sessionSecondsLeft = useMemo(() => {
    if (step !== 2 || sessionStartedAtRef.current == null) return SESSION_LIMIT_SEC;
    const elapsed = (Date.now() - sessionStartedAtRef.current) / 1000;
    return Math.max(0, SESSION_LIMIT_SEC - elapsed);
  }, [step, tick]);

  const questionSecondsLeft = useMemo(() => {
    if (step !== 2 || !currentAnswer) return QUESTION_LIMIT_SEC;
    const end = questionEndsAtRef.current;
    if (end == null) return QUESTION_LIMIT_SEC;
    return Math.max(0, (end - Date.now()) / 1000);
  }, [step, currentAnswer, tick]);

  const questionUrgency =
    questionSecondsLeft <= 8 ? "critical" : questionSecondsLeft <= 15 ? "warning" : "normal";
  const sessionUrgency =
    sessionSecondsLeft <= 60 ? "critical" : sessionSecondsLeft <= 120 ? "warning" : "normal";

  useEffect(() => {
    if (step !== 2 || !currentQuestionKey) return;
    questionEndsAtRef.current = Date.now() + QUESTION_LIMIT_SEC * 1000;
    lastQuestionTimeoutIdRef.current = null;
    tenSecondSoundPlayedForKeyRef.current = null;
  }, [step, currentQuestionKey]);

  const autoFinishStartedForSessionRef = useRef(null);

  useEffect(() => {
    if (step === 1) {
      autoFinishStartedForSessionRef.current = null;
    }
  }, [step]);

  const finalizeRunAndShowResults = useCallback(async (sid, latestSession) => {
    if (sid == null || sid === "") return;
    clearPendingGameSessionId();
    try {
      const res = await post(GAME_ENDPOINTS.FINISH(sid), {});
      setFinishSnapshot({ session: latestSession, finish: res });
    } catch (e) {
      captureError(e);
      setFinishSnapshot({ session: latestSession, finish: null });
    }
    setStep(3);
  }, []);

  useEffect(() => {
    if (step !== 2 || !sessionId || !session || !isSessionComplete(session)) {
      return undefined;
    }
    if (autoFinishStartedForSessionRef.current === sessionId) {
      return undefined;
    }
    autoFinishStartedForSessionRef.current = sessionId;
    void finalizeRunAndShowResults(sessionId, session);
    return undefined;
  }, [step, sessionId, session, finalizeRunAndShowResults]);

  const reloadSession = useCallback(async () => {
    if (!sessionId) return null;
    const s = await get(GAME_ENDPOINTS.SESSION(sessionId));
    setSession(s);
    return s;
  }, [sessionId]);

  const playSound = useCallback(
    (key) => {
      playGameSound(key, soundEnabled);
    },
    [soundEnabled]
  );

  useEffect(() => {
    if (step !== 2 || !soundEnabled || !currentQuestionKey) return undefined;
    if (Math.ceil(questionSecondsLeft) !== 10) return undefined;
    if (tenSecondSoundPlayedForKeyRef.current === currentQuestionKey) return undefined;
    tenSecondSoundPlayedForKeyRef.current = currentQuestionKey;
    playGameSound("ten", soundEnabled);
    return undefined;
  }, [step, soundEnabled, currentQuestionKey, questionSecondsLeft, tick]);

  useEffect(() => {
    if (step !== 2 || questionUrgency !== "critical" || !soundEnabled) return undefined;
    if (questionSecondsLeft > 5) return undefined;
    const now = Date.now();
    if (now - lastTickSoundAtRef.current < 900) return undefined;
    lastTickSoundAtRef.current = now;
    playGameSound("tick", soundEnabled);
    return undefined;
  }, [step, questionUrgency, questionSecondsLeft, soundEnabled, tick]);

  useEffect(() => {
    if (step !== 2 || !sessionId || sessionSecondsLeft > 0 || sessionTimeoutFiredRef.current) {
      return undefined;
    }
    sessionTimeoutFiredRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const res = await post(GAME_ENDPOINTS.FINISH(sessionId), {});
        if (cancelled) return;
        clearPendingGameSessionId();
        setFinishSnapshot({ session, finish: res });
        setStep(3);
        toast({
          title: "Time's up",
          description: "Session ended — here is your result.",
          status: "info",
          duration: 4000,
          isClosable: true,
        });
      } catch (error) {
        captureError(error);
        if (!cancelled) {
          toast({
            title: "Could not finish session",
            description: error?.message || "Try again.",
            status: "error",
            duration: 4000,
            isClosable: true,
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step, sessionId, sessionSecondsLeft, session, toast]);

  useEffect(() => {
    if (step !== 2 || !currentQuestionKey || submitting) return undefined;
    if (questionSecondsLeft > 0.25) return undefined;
    const id = currentQuestionKey;
    if (lastQuestionTimeoutIdRef.current === id) return undefined;
    lastQuestionTimeoutIdRef.current = id;
    let cancelled = false;
    (async () => {
      try {
        if (!sessionId) return;
        let s = await get(GAME_ENDPOINTS.SESSION(sessionId));
        if (cancelled) return;
        let nextCa = resolveCurrentAnswer(s);
        if (!nextCa || String(nextCa.sessionAnswerId) !== String(id)) {
          setSession(s);
          return;
        }

        const skipLeft = buildAbilityCounts(s, nextCa).Skip ?? 0;
        if (skipLeft > 0) {
          await post(GAME_ENDPOINTS.ABILITY(sessionId, id), { ability: "Skip" });
        } else {
          try {
            await post(GAME_ENDPOINTS.ABILITY(sessionId, id), { ability: "Skip" });
          } catch {
            /* server may still advance */
          }
        }
        if (cancelled) return;
        s = await get(GAME_ENDPOINTS.SESSION(sessionId));
        setSession(s);
        nextCa = resolveCurrentAnswer(s);
        if (nextCa && String(nextCa.sessionAnswerId) === String(id)) {
          const fallback = OPTION_KEYS[0];
          try {
            await post(GAME_ENDPOINTS.ANSWER(sessionId, id), { selectedOption: fallback });
            if (cancelled) return;
            s = await get(GAME_ENDPOINTS.SESSION(sessionId));
            setSession(s);
          } catch (e) {
            captureError(e);
          }
        }

        const still = resolveCurrentAnswer(s);
        if (still && String(still.sessionAnswerId) === String(id)) {
          toast({
            title: "Time's up",
            description: "Choose an answer or use Skip if you have one.",
            status: "warning",
            duration: 4000,
            isClosable: true,
          });
        }
      } catch (error) {
        captureError(error);
        if (!cancelled) {
          toast({
            title: "Question timer",
            description: error?.message || "Could not move to the next question.",
            status: "warning",
            duration: 4000,
            isClosable: true,
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step, currentQuestionKey, questionSecondsLeft, submitting, sessionId, toast]);

  const handleResumeSession = useCallback(
    async (sid) => {
      const id = sid ?? activeSessionId;
      if (id == null || id === "") return;
      setResumingSession(true);
      try {
        const sessFromGet = await get(GAME_ENDPOINTS.SESSION(id));
        const layer =
          sessFromGet && typeof sessFromGet === "object"
            ? unwrapSessionPayload(sessFromGet)
            : {};
        const sess = { ...layer };
        setSessionId(id);
        setSession(sess);
        setActiveLevelNumber(getLevelNumberFromSession(sess));
        sessionTimeoutFiredRef.current = false;
        sessionStartedAtRef.current = Date.now();
        questionEndsAtRef.current = Date.now() + QUESTION_LIMIT_SEC * 1000;
        setHintRevealed(false);
        setFinishSnapshot(null);
        writePendingGameSessionId(id);
        if (isSessionComplete(sess)) {
          autoFinishStartedForSessionRef.current = id;
          await finalizeRunAndShowResults(id, sess);
          return;
        }
        setStep(2);
        unlockGameAudio();
      } catch (error) {
        captureError(error);
        if (error && typeof error === "object" && error.status === 404) {
          clearPendingGameSessionId();
        }
        toast({
          title: "Could not resume quiz",
          description: formatGameApiError(error),
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setResumingSession(false);
      }
    },
    [activeSessionId, toast, finalizeRunAndShowResults]
  );

  const handleStartLevel = async (levelNumber) => {
    if (levelNumber > maxUnlocked) {
      toast({
        title: "Level locked",
        description: "Complete earlier levels to unlock this one.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setStartingLevel(levelNumber);
    try {
      const res = await post(GAME_ENDPOINTS.START, { levelNumber });
      const sid = pickSessionId(res);
      if (sid == null) {
        throw new Error("Missing session id from server.");
      }
      const sessFromGet = await get(GAME_ENDPOINTS.SESSION(sid));
      const layerStart = res && typeof res === "object" ? unwrapSessionPayload(res) : {};
      const layerGet =
        sessFromGet && typeof sessFromGet === "object"
          ? unwrapSessionPayload(sessFromGet)
          : {};
      // GET wins on conflicts; POST fills fields sometimes omitted on the first GET.
      const sess = { ...layerStart, ...layerGet };
      setSessionId(sid);
      setSession(sess);
      writePendingGameSessionId(sid);
      setActiveLevelNumber(levelNumber);
      sessionTimeoutFiredRef.current = false;
      sessionStartedAtRef.current = Date.now();
      questionEndsAtRef.current = Date.now() + QUESTION_LIMIT_SEC * 1000;
      setHintRevealed(false);
      setFinishSnapshot(null);
      if (isSessionComplete(sess)) {
        autoFinishStartedForSessionRef.current = sid;
        await finalizeRunAndShowResults(sid, sess);
        return;
      }
      setStep(2);
      unlockGameAudio();
    } catch (error) {
      captureError(error);
      console.error("Start session:", error);
      const desc = formatGameApiError(error);
      const duplicateSession = isLikelySessionAlreadyActiveError(desc);
      const sidFromError = pickSessionIdFromErrorDetails(error?.details);
      if (duplicateSession) {
        try {
          const p = await get(GAME_ENDPOINTS.PROGRESS);
          const base =
            p != null && typeof p === "object" && !Array.isArray(p)
              ? { ...unwrapSessionPayload(p) }
              : {};
          if (sidFromError && !getActiveSessionIdFromProgress(base)) {
            base.activeSessionId = sidFromError;
          }
          if (Object.keys(base).length > 0) {
            setProgress(base);
          } else if (p != null) {
            setProgress(p);
          } else if (sidFromError) {
            setProgress({ activeSessionId: sidFromError });
          }
        } catch (e) {
          captureError(e);
          if (sidFromError) {
            setProgress((prev) => ({
              ...(prev && typeof prev === "object" && !Array.isArray(prev) ? prev : {}),
              activeSessionId: sidFromError,
            }));
          }
        }
      }
      toast({
        title: duplicateSession ? "Quiz already in progress" : "Could not start level",
        description: duplicateSession
          ? `${desc} Use “Continue quiz” on this screen when it appears.`
          : desc,
        status: duplicateSession ? "warning" : "error",
        duration: 8000,
        isClosable: true,
      });
    } finally {
      setStartingLevel(null);
    }
  };

  const handleSelectOption = async (selectedOption) => {
    if (!sessionId || !hasSessionAnswerId(currentAnswer) || submitting) return;
    setSubmitting(true);
    try {
      await post(GAME_ENDPOINTS.ANSWER(sessionId, currentAnswer.sessionAnswerId), {
        selectedOption,
      });
      const s = await get(GAME_ENDPOINTS.SESSION(sessionId));
      setSession(s);
      playSound("correct");
    } catch (error) {
      captureError(error);
      playSound("wrong");
      toast({
        title: "Answer not saved",
        description: error?.message || "Try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUseAbility = async (ability) => {
    if (!sessionId || !hasSessionAnswerId(currentAnswer) || abilityLoading || submitting) return;
    setAbilityLoading(ability);
    try {
      await post(GAME_ENDPOINTS.ABILITY(sessionId, currentAnswer.sessionAnswerId), {
        ability,
      });
      if (ability === "Hint") {
        setHintRevealed(true);
      }
      if (ability === "TimeFreeze") {
        const extra = 15;
        questionEndsAtRef.current = (questionEndsAtRef.current || Date.now()) + extra * 1000;
      }
      await reloadSession();
    } catch (error) {
      captureError(error);
      toast({
        title: "Ability failed",
        description: error?.message || "Try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setAbilityLoading(null);
    }
  };

  const handleExitSession = () => {
    if (sessionId) {
      writePendingGameSessionId(sessionId);
    }
    setStep(1);
    setSession(null);
    setSessionId(null);
    setFinishSnapshot(null);
    setHintRevealed(false);
    sessionStartedAtRef.current = null;
    questionEndsAtRef.current = null;
  };

  const handleFinishManually = async () => {
    if (!sessionId || submitting) return;
    setSubmitting(true);
    try {
      const res = await post(GAME_ENDPOINTS.FINISH(sessionId), {});
      clearPendingGameSessionId();
      setFinishSnapshot({ session, finish: res });
      setStep(3);
    } catch (error) {
      captureError(error);
      toast({
        title: "Could not finish",
        description: error?.message || "Try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSound = () => {
    unlockGameAudio();
    setSoundEnabled((v) => {
      const next = !v;
      try {
        window.localStorage.setItem("franc_game_sound", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const resultSummary = useMemo(
    () =>
      extractResultSummary(
        finishSnapshot?.session ?? session,
        finishSnapshot?.finish ?? null
      ),
    [finishSnapshot, session]
  );

  const doubleChanceNotice = currentAnswer?.canRetry
    ? "You can answer again on this question."
    : null;

  if (!isLoggedIn) {
    return null;
  }

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-r, white, #ebf8ff)"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      <Box px={{ base: 4, md: 16 }} py={8}>
        <Progress
          value={(step / 3) * 100}
          colorScheme="brand"
          mb={8}
          borderRadius="full"
        />

        {step === 1 && (
          <GameLevelsView
            totalPoints={totalPoints}
            maxUnlockedLevel={maxUnlocked}
            loading={loadingProgress}
            startingLevel={startingLevel}
            resumingSession={resumingSession}
            activeSessionId={activeSessionId}
            onStartLevel={handleStartLevel}
            onResumeSession={handleResumeSession}
            onBack={() => navigate("/game")}
          />
        )}

        {step === 2 && (
          <Box>
            <GameSessionView
              levelNumber={activeLevelNumber}
              questionIndex={qProgress.index}
              questionTotal={qProgress.total}
              currentAnswer={currentAnswer}
              hiddenOptionKeys={currentAnswer?.hiddenOptions || []}
              hintRevealed={hintRevealed}
              submitting={submitting}
              abilityLoading={abilityLoading}
              abilityCounts={abilityCounts}
              onSelectOption={handleSelectOption}
              onUseAbility={handleUseAbility}
              questionSecondsLeft={questionSecondsLeft}
              sessionSecondsLeft={sessionSecondsLeft}
              questionUrgency={questionUrgency}
              sessionUrgency={sessionUrgency}
              soundEnabled={soundEnabled}
              onToggleSound={toggleSound}
              doubleChanceNotice={doubleChanceNotice}
              onExit={handleExitSession}
            />
            <Box textAlign="center" mt={6}>
              <Button
                variant="link"
                colorScheme="gray"
                size="sm"
                onClick={handleFinishManually}
                isLoading={submitting}
              >
                Finish session early
              </Button>
            </Box>
          </Box>
        )}

        {step === 3 && (
          <GameResultsView
            summary={resultSummary}
            onPlayAgain={() => {
              clearPendingGameSessionId();
              setFinishSnapshot(null);
              setSession(null);
              setSessionId(null);
              setStep(1);
            }}
            onBackToLevels={() => {
              clearPendingGameSessionId();
              setFinishSnapshot(null);
              setSession(null);
              setSessionId(null);
              setStep(1);
            }}
          />
        )}
      </Box>

      <Footer />
    </Box>
  );
};

export default GameQuizTryPage;
