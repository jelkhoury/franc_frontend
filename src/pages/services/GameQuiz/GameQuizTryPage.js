import { Box, Button, useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import Footer from "../../../components/Footer";
import {
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { AuthContext } from "../../../components/AuthContext";
import { get, post } from "../../../utils/httpServices";
import { captureError } from "../../../utils/sentryUtils";
import { GAME_ENDPOINTS } from "../../../services/apiService";
import GameLevelsView from "./GameLevelsView";
import GameSessionView from "./GameSessionView";
import GameResultsView from "./GameResultsView";
import AbilityFlashOverlay from "./AbilityFlashOverlay";
import LevelOutcomeFlashOverlay from "./LevelOutcomeFlashOverlay";
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
  getSessionTotalQuestions,
  parseUnlockedLevelNumber,
  getAnswerRowOutcome,
  getAnswerRowJustificationText,
  buildJustificationLookupFromHintsApi,
  readFiftyFiftyAlreadyUsedSession,
  markFiftyFiftyUsedSession,
  getLevelSummariesForLevelsView,
  formatGameApiError,
  isLikelySessionAlreadyActiveError,
  pickSessionIdFromErrorDetails,
  readPendingGameSessionId,
  writePendingGameSessionId,
  clearPendingGameSessionId,
  GAME_TIME_FREEZE_EXTRA_SECONDS,
} from "./gameSessionUtils";
import { playGameSound, unlockGameAudio } from "./gameWebAudio";
import { playGameMediaFeedback, startGameBgm, stopGameBgm, playLevelFailSound, playLevelPassFlashSound, playLastThreeSecondsSound, playAbilityUseSound, playUnlockNewLevelSound } from "./gameMediaAudio";

const QUESTION_LIMIT_SEC = 30;
/** Hold after grading before session advances (wrong: quick; correct: longer so explanation can be read). */
const ANSWER_REVEAL_MS_WRONG = 2400;
const ANSWER_REVEAL_MS_CORRECT = 5200;

/** Set to true to trace [GameQuiz timeout] in the console */
const DEBUG_GAME_QUIZ_TIMEOUT = false;

/** Ignore timeout arming briefly after sessionAnswerId changes (stops spurious timedOut on new question / first paint). */
const QUESTION_KEY_ARM_COOLDOWN_MS = 450;

const GameQuizTryPage = () => {
  const { isLoggedIn, authInitialized } = useContext(AuthContext);
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
  /** null — idle; 'answer' — POST /answer or reveal; 'finish' — POST /finish only */
  const [submittingMode, setSubmittingMode] = useState(null);
  const submitting = submittingMode != null;
  /** True only until the answer POST returns (friendly overlay on the card; not during reveal delay). */
  const [answerAwaitingApi, setAnswerAwaitingApi] = useState(false);
  const [abilityLoading, setAbilityLoading] = useState(null);
  /** Successful ability use — drives center-screen flash (see AbilityFlashOverlay). */
  const [abilityFlash, setAbilityFlash] = useState(null);
  /** After POST /answer: highlight chosen option green/red until next question or timeout (Double Chance retry). */
  const [answerFeedback, setAnswerFeedback] = useState(null);
  /** sessionAnswerId → justification from GET /session/{id}/hints */
  const [justificationByAnswerId, setJustificationByAnswerId] = useState(() => ({}));
  const [finishSnapshot, setFinishSnapshot] = useState(null);
  /** One-shot pass/fail flash when landing on results (see LevelOutcomeFlashOverlay). */
  const [levelOutcomeFlash, setLevelOutcomeFlash] = useState(null);
  /** Level grid: pulse this stage after pass + unlock (see GameLevelsView). */
  const [levelsCelebrateLevel, setLevelsCelebrateLevel] = useState(null);
  const [tick, setTick] = useState(0);
  /** Client-only: allow 50/50 once per session id even if API returns two charges. */
  const [fiftyFiftyConsumedFrontend, setFiftyFiftyConsumedFrontend] = useState(false);

  /** After a level pass with unlock: play unlock SFX only once PROGRESS has loaded (ref set in handleLevelOutcomeComplete). */
  const pendingUnlockSoundAfterProgressRef = useRef(false);

  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return window.localStorage.getItem("franc_game_sound") !== "0";
    } catch {
      return true;
    }
  });

  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  const questionEndsAtRef = useRef(null);
  /** While an answer POST is in flight, UI shows this many seconds frozen (no countdown). */
  const questionDisplayFrozenRef = useRef(null);
  const sessionIdRef = useRef(null);
  const lastQuestionTimeoutIdRef = useRef(null);
  const lastTickSoundAtRef = useRef(0);
  const tenSecondSoundPlayedForKeyRef = useRef(null);
  const lastThreeSecSoundPlayedForKeyRef = useRef(null);
  /** Sync question timer as soon as the active question id changes (must run before effects; avoids double timeout POST). */
  const prevQuestionKeyForTimerRef = useRef(null);
  /** Only the question id that triggered the “time’s up” overlay may show 0s; avoids next question looking expired. */
  const timeUpDisplayKeyRef = useRef(null);
  /** After a question key change, do not arm question-timeout until this time (prevents false ARM when memo lags ref). */
  const questionKeyArmCooldownUntilRef = useRef(0);
  const prevStepForOutcomeRef = useRef(null);

  const dismissAbilityFlash = useCallback(() => setAbilityFlash(null), []);
  const handleLevelOutcomeComplete = useCallback((payload) => {
    setLevelOutcomeFlash(null);
    if (payload?.variant !== "pass") return;
    clearPendingGameSessionId();
    setFinishSnapshot(null);
    setSession(null);
    setSessionId(null);
    setJustificationByAnswerId({});
    stopGameBgm();
    questionEndsAtRef.current = null;
    const ul = payload.unlockedLevel;
    if (ul != null) {
      setLevelsCelebrateLevel(Number(ul));
      pendingUnlockSoundAfterProgressRef.current = true;
    }
    setStep(1);
  }, []);

  const loadSessionJustifications = useCallback(async (sid) => {
    if (sid == null || sid === "") return;
    try {
      const data = await get(GAME_ENDPOINTS.SESSION_HINTS(sid));
      const lookup = buildJustificationLookupFromHintsApi(data);
      setJustificationByAnswerId(lookup);
    } catch (error) {
      captureError(error);
      setJustificationByAnswerId({});
    }
  }, []);

  const [timeUpAnimating, setTimeUpAnimating] = useState(false);
  /** Mirrors timeUpAnimating synchronously so the timeout effect never sees a stale “idle” while overlay is active. */
  const timeUpAnimatingRef = useRef(false);

  const applySessionFromResponse = useCallback((res) => {
    if (res == null || typeof res !== "object") return;
    const layer = unwrapSessionPayload(res);
    const sess =
      layer && typeof layer === "object" && !Array.isArray(layer) ? { ...layer } : res;
    setSession(sess);
  }, []);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    if (!authInitialized) return;
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [authInitialized, isLoggedIn, navigate]);

  useEffect(() => {
    if (!authInitialized || !isLoggedIn || step !== 1) return undefined;
    let cancelled = false;
    (async () => {
      setLoadingProgress(true);
      try {
        const data = await get(GAME_ENDPOINTS.PROGRESS);
        if (cancelled) return;
        setProgress(data);
        if (pendingUnlockSoundAfterProgressRef.current) {
          pendingUnlockSoundAfterProgressRef.current = false;
          playUnlockNewLevelSound(soundEnabledRef.current);
        }
      } catch (error) {
        pendingUnlockSoundAfterProgressRef.current = false;
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
  }, [authInitialized, isLoggedIn, step, toast]);

  useEffect(() => {
    if (step !== 2) return undefined;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [step]);

  useEffect(() => {
    if (step !== 2) setAbilityFlash(null);
  }, [step]);

  useEffect(() => {
    if (step !== 2) {
      setAnswerFeedback(null);
      setAnswerAwaitingApi(false);
    }
  }, [step]);

  const totalPoints = useMemo(() => getTotalPoints(progress), [progress]);
  const maxUnlocked = useMemo(() => getMaxUnlockedLevel(progress), [progress]);
  const activeSessionId = useMemo(
    () => getActiveSessionIdFromProgress(progress) ?? readPendingGameSessionId(),
    [progress]
  );
  const levelSummaries = useMemo(() => getLevelSummariesForLevelsView(progress), [progress]);

  const currentAnswer = useMemo(() => resolveCurrentAnswer(session), [session]);
  const currentQuestionKey = useMemo(() => {
    const ca = resolveCurrentAnswer(session);
    return hasSessionAnswerId(ca) ? String(ca.sessionAnswerId) : null;
  }, [session]);

  // Must run BEFORE questionSecondsLeft useMemo: that memo reads questionEndsAtRef. If this ran after
  // useMemo, one render would pair the NEW sessionAnswerId with the OLD expired deadline → double timedOut POST.
  if (step === 2 && currentQuestionKey) {
    if (currentQuestionKey !== prevQuestionKeyForTimerRef.current) {
      if (DEBUG_GAME_QUIZ_TIMEOUT) {
        // eslint-disable-next-line no-console
        console.log("[GameQuiz timeout] question key changed — reset 30s deadline + timeout guards", {
          from: prevQuestionKeyForTimerRef.current,
          to: currentQuestionKey,
          prevDeadlineMs: questionEndsAtRef.current,
        });
      }
      prevQuestionKeyForTimerRef.current = currentQuestionKey;
      questionEndsAtRef.current = Date.now() + QUESTION_LIMIT_SEC * 1000;
      questionKeyArmCooldownUntilRef.current = Date.now() + QUESTION_KEY_ARM_COOLDOWN_MS;
      lastQuestionTimeoutIdRef.current = null;
      timeUpDisplayKeyRef.current = null;
      tenSecondSoundPlayedForKeyRef.current = null;
      lastThreeSecSoundPlayedForKeyRef.current = null;
      questionDisplayFrozenRef.current = null;
    }
  } else {
    prevQuestionKeyForTimerRef.current = null;
    timeUpDisplayKeyRef.current = null;
    questionKeyArmCooldownUntilRef.current = 0;
  }

  useEffect(() => {
    if (sessionId == null || sessionId === "") {
      setFiftyFiftyConsumedFrontend(false);
      return;
    }
    setFiftyFiftyConsumedFrontend(readFiftyFiftyAlreadyUsedSession(sessionId));
  }, [sessionId]);

  const abilityCounts = useMemo(() => {
    const base = buildAbilityCounts(session, currentAnswer);
    if (!fiftyFiftyConsumedFrontend) return base;
    return { ...base, FiftyFifty: 0 };
  }, [session, currentAnswer, fiftyFiftyConsumedFrontend]);
  const qProgress = useMemo(
    () => getQuestionProgressDisplay(session, currentAnswer),
    [session, currentAnswer]
  );

  const questionSecondsLeft = useMemo(() => {
    if (step !== 2 || !currentAnswer) return QUESTION_LIMIT_SEC;
    const key = currentQuestionKey;
    if (
      timeUpAnimating &&
      key != null &&
      timeUpDisplayKeyRef.current != null &&
      String(key) === String(timeUpDisplayKeyRef.current)
    ) {
      return 0;
    }
    if (submitting && questionDisplayFrozenRef.current != null) {
      return questionDisplayFrozenRef.current;
    }
    const end = questionEndsAtRef.current;
    if (end == null) return QUESTION_LIMIT_SEC;
    return Math.max(0, (end - Date.now()) / 1000);
  }, [step, currentAnswer, currentQuestionKey, tick, submitting, timeUpAnimating]);

  const questionUrgency =
    questionSecondsLeft <= 8 ? "critical" : questionSecondsLeft <= 15 ? "warning" : "normal";

  useLayoutEffect(() => {
    if (step === 2 && currentQuestionKey) {
      timeUpAnimatingRef.current = false;
      setTimeUpAnimating(false);
    }
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
    let finishRes = null;
    try {
      finishRes = await post(GAME_ENDPOINTS.FINISH(sid), {});
      setFinishSnapshot({ session: latestSession, finish: finishRes });
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

  const playSound = useCallback(
    (key) => {
      if (key === "correct" || key === "wrong") {
        playGameMediaFeedback(key, soundEnabled);
        return;
      }
      playGameSound(key, soundEnabled);
    },
    [soundEnabled]
  );

  useEffect(() => {
    if (step === 2 && soundEnabled) {
      startGameBgm();
    } else {
      stopGameBgm();
    }
    return () => stopGameBgm();
  }, [step, soundEnabled]);

  useEffect(() => {
    if (step !== 2 || !soundEnabled || !currentQuestionKey) return undefined;
    if (Math.ceil(questionSecondsLeft) !== 10) return undefined;
    if (tenSecondSoundPlayedForKeyRef.current === currentQuestionKey) return undefined;
    tenSecondSoundPlayedForKeyRef.current = currentQuestionKey;
    playGameSound("ten", soundEnabled);
    return undefined;
  }, [step, soundEnabled, currentQuestionKey, questionSecondsLeft, tick]);

  useEffect(() => {
    if (step !== 2 || !soundEnabled || !currentQuestionKey) return undefined;
    if (Math.ceil(questionSecondsLeft) !== 3) return undefined;
    if (lastThreeSecSoundPlayedForKeyRef.current === currentQuestionKey) return undefined;
    lastThreeSecSoundPlayedForKeyRef.current = currentQuestionKey;
    playLastThreeSecondsSound(soundEnabled);
    return undefined;
  }, [step, soundEnabled, currentQuestionKey, questionSecondsLeft, tick]);

  useEffect(() => {
    if (step !== 2 || questionUrgency !== "critical" || !soundEnabled) return undefined;
    if (questionSecondsLeft > 5) return undefined;
    if (questionSecondsLeft <= 3) return undefined;
    const now = Date.now();
    if (now - lastTickSoundAtRef.current < 900) return undefined;
    lastTickSoundAtRef.current = now;
    playGameSound("tick", soundEnabled);
    return undefined;
  }, [step, questionUrgency, questionSecondsLeft, soundEnabled, tick]);

  /**
   * Question timer expired: show brief overlay, then POST answer as timeout (wrong), no abilities.
   * Backend: extend SubmitGameAnswerRequestDto with bool TimedOut; when true, set wrong answer
   * without consuming Skip (see GameQuizService.SubmitAnswerAsync).
   */
  useEffect(() => {
    if (step !== 2 || !currentQuestionKey || !sessionId || submitting) {
      return undefined;
    }
    // While overlay / POST for a timed-out question is in flight, do not arm another timeout (fixes double timedOut on next question).
    if (timeUpAnimatingRef.current) {
      if (DEBUG_GAME_QUIZ_TIMEOUT) {
        // eslint-disable-next-line no-console
        console.log("[GameQuiz timeout] skip arm: timeUpAnimatingRef still true", {
          currentQuestionKey,
          questionSecondsLeft,
        });
      }
      return undefined;
    }
    const now = Date.now();
    if (now < questionKeyArmCooldownUntilRef.current) {
      if (DEBUG_GAME_QUIZ_TIMEOUT) {
        // eslint-disable-next-line no-console
        console.log("[GameQuiz timeout] skip arm: key-change cooldown", {
          currentQuestionKey,
          cooldownEndsInMs: questionKeyArmCooldownUntilRef.current - now,
        });
      }
      return undefined;
    }
    const endMs = questionEndsAtRef.current;
    const liveQuestionSecLeft =
      endMs == null ? QUESTION_LIMIT_SEC : Math.max(0, (endMs - now) / 1000);
    if (liveQuestionSecLeft > 0.25) return undefined;
    const id = currentQuestionKey;
    if (lastQuestionTimeoutIdRef.current === id) return undefined;
    const prevTimeoutGuard = lastQuestionTimeoutIdRef.current;
    lastQuestionTimeoutIdRef.current = id;

    if (DEBUG_GAME_QUIZ_TIMEOUT) {
      // eslint-disable-next-line no-console
      console.log("[GameQuiz timeout] ARM question timeout flow", {
        sessionAnswerId: id,
        questionSecondsLeftMemo: questionSecondsLeft,
        liveQuestionSecLeft,
        questionEndsAtMs: questionEndsAtRef.current,
        prevTimeoutGuard,
      });
    }

    let cancelled = false;
    timeUpDisplayKeyRef.current = id;
    timeUpAnimatingRef.current = true;
    setTimeUpAnimating(true);
    const animTimer = window.setTimeout(() => {
      void (async () => {
        try {
          const sid = sessionIdRef.current;
          if (cancelled || sid == null) return;
          if (DEBUG_GAME_QUIZ_TIMEOUT) {
            // eslint-disable-next-line no-console
            console.log("[GameQuiz timeout] POST timedOut", {
              url: `session/${sid}/answer/${id}`,
              sessionAnswerId: id,
            });
          }
          let res = await post(GAME_ENDPOINTS.ANSWER(sid, id), { timedOut: true });
          /**
           * Do not skip applySession when `cancelled` — effect cleanup can run while `post` is in flight
           * (e.g. deps tick). Dropping the response leaves the user on the same question at 0s forever.
           */
          applySessionFromResponse(res);

          /**
           * Double Chance with no answer: some APIs leave the slot "open" after the first timedOut.
           * Do not add a new question clock — chain one more timedOut so one "time's up" advances.
           */
          const readRetryStillOpen = (payload) => {
            const after = unwrapSessionPayload(payload);
            const sessShape =
              after && typeof after === "object" && !Array.isArray(after) ? after : payload;
            const ca = resolveCurrentAnswer(sessShape);
            return (
              hasSessionAnswerId(ca) &&
              String(ca.sessionAnswerId) === String(id) &&
              !!ca.canRetry
            );
          };

          if (!cancelled && readRetryStillOpen(res)) {
            if (DEBUG_GAME_QUIZ_TIMEOUT) {
              // eslint-disable-next-line no-console
              console.log("[GameQuiz timeout] second timedOut POST (finish Double Chance without extra clock)", {
                sessionAnswerId: id,
              });
            }
            res = await post(GAME_ENDPOINTS.ANSWER(sid, id), { timedOut: true });
            applySessionFromResponse(res);
          }

          if (!cancelled) playSound("wrong");
          lastQuestionTimeoutIdRef.current = null;
        } catch (error) {
          captureError(error);
          lastQuestionTimeoutIdRef.current = null;
          if (!cancelled) {
            toast({
              title: "Time's up",
              description:
                "Could not record a timed-out answer. The API must accept { timedOut: true } on the answer endpoint (see comment in GameQuizTryPage).",
              status: "error",
              duration: 7000,
              isClosable: true,
            });
          }
        } finally {
          if (DEBUG_GAME_QUIZ_TIMEOUT) {
            // eslint-disable-next-line no-console
            console.log("[GameQuiz timeout] POST finished — clear overlay flags");
          }
          timeUpDisplayKeyRef.current = null;
          timeUpAnimatingRef.current = false;
          setTimeUpAnimating(false);
        }
      })();
    }, 700);

    return () => {
      if (DEBUG_GAME_QUIZ_TIMEOUT) {
        // eslint-disable-next-line no-console
        console.log("[GameQuiz timeout] effect cleanup (deps changed or unmount)", {
          cancelledArmForId: id,
        });
      }
      cancelled = true;
      window.clearTimeout(animTimer);
      timeUpDisplayKeyRef.current = null;
      timeUpAnimatingRef.current = false;
      setTimeUpAnimating(false);
      /**
       * Critical: we set lastQuestionTimeoutIdRef = id when arming. If this cleanup runs before the
       * POST (e.g. submitting toggles or effect deps churn), the timer is cancelled but the ref stayed
       * === id, so the guard below blocked re-arming — user stuck at 0s on the same question forever.
       */
      lastQuestionTimeoutIdRef.current = prevTimeoutGuard;
    };
  }, [step, currentQuestionKey, questionSecondsLeft, submitting, sessionId, toast, playSound, applySessionFromResponse]);

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
        questionEndsAtRef.current = Date.now() + QUESTION_LIMIT_SEC * 1000;
        setFinishSnapshot(null);
        writePendingGameSessionId(id);
        if (isSessionComplete(sess)) {
          autoFinishStartedForSessionRef.current = id;
          await finalizeRunAndShowResults(id, sess);
          return;
        }
        setStep(2);
        unlockGameAudio();
        void loadSessionJustifications(id);
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
    [activeSessionId, toast, finalizeRunAndShowResults, loadSessionJustifications]
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
      questionEndsAtRef.current = Date.now() + QUESTION_LIMIT_SEC * 1000;
      setFinishSnapshot(null);
      if (isSessionComplete(sess)) {
        autoFinishStartedForSessionRef.current = sid;
        await finalizeRunAndShowResults(sid, sess);
        return;
      }
      setStep(2);
      unlockGameAudio();
      void loadSessionJustifications(sid);
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
    const prevAnswerId = currentAnswer.sessionAnswerId;
    const end = questionEndsAtRef.current;
    questionDisplayFrozenRef.current =
      end == null ? QUESTION_LIMIT_SEC : Math.max(0, (end - Date.now()) / 1000);
    setSubmittingMode("answer");
    setAnswerAwaitingApi(true);
    try {
      const res = await post(GAME_ENDPOINTS.ANSWER(sessionId, prevAnswerId), {
        selectedOption,
      });
      setAnswerAwaitingApi(false);
      const outcome = getAnswerRowOutcome(res, prevAnswerId);
      const layer = unwrapSessionPayload(res);
      const nextCa =
        layer && typeof layer === "object" && !Array.isArray(layer)
          ? resolveCurrentAnswer(layer)
          : null;

      if (outcome != null) {
        playSound(outcome.isCorrect ? "correct" : "wrong");
        const justification = getAnswerRowJustificationText(res, prevAnswerId);
        setAnswerFeedback({
          sessionAnswerId: String(prevAnswerId),
          optionKey: selectedOption,
          correct: outcome.isCorrect,
          justification: justification ?? undefined,
        });
      } else {
        playSound("wrong");
      }

      const revealMs =
        outcome?.isCorrect === true ? ANSWER_REVEAL_MS_CORRECT : ANSWER_REVEAL_MS_WRONG;
      await new Promise((r) => setTimeout(r, revealMs));

      applySessionFromResponse(res);

      const completeShape =
        layer && typeof layer === "object" && !Array.isArray(layer) ? layer : res;
      if (completeShape && typeof completeShape === "object" && isSessionComplete(completeShape)) {
        setAnswerFeedback(null);
      }

      const sameSlotRetry =
        outcome &&
        !outcome.isCorrect &&
        nextCa?.canRetry &&
        String(nextCa.sessionAnswerId) === String(prevAnswerId);
      if (sameSlotRetry) {
        window.setTimeout(() => setAnswerFeedback(null), 850);
      }
    } catch (error) {
      captureError(error);
      playSound("wrong");
      setAnswerFeedback(null);
      toast({
        title: "Answer not saved",
        description: error?.message || "Try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      questionDisplayFrozenRef.current = null;
      setAnswerAwaitingApi(false);
      setSubmittingMode(null);
    }
  };

  const handleUseAbility = async (ability) => {
    if (!sessionId || !hasSessionAnswerId(currentAnswer) || abilityLoading || submitting) return;
    if (ability === "FiftyFifty" && readFiftyFiftyAlreadyUsedSession(sessionId)) return;
    setAbilityLoading(ability);
    try {
      const res = await post(GAME_ENDPOINTS.ABILITY(sessionId, currentAnswer.sessionAnswerId), {
        ability,
      });
      if (ability === "TimeFreeze") {
        const extra = GAME_TIME_FREEZE_EXTRA_SECONDS;
        questionEndsAtRef.current = (questionEndsAtRef.current || Date.now()) + extra * 1000;
      }
      applySessionFromResponse(res);
      if (ability === "FiftyFifty" && sessionId) {
        markFiftyFiftyUsedSession(sessionId);
        setFiftyFiftyConsumedFrontend(true);
      }
      playAbilityUseSound(soundEnabled);
      setAbilityFlash(ability);
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
    setSubmittingMode(null);
    setAnswerAwaitingApi(false);
    setStep(1);
    setSession(null);
    setSessionId(null);
    setFinishSnapshot(null);
    setJustificationByAnswerId({});
    setLevelsCelebrateLevel(null);
    stopGameBgm();
    questionEndsAtRef.current = null;
  };

  const handleFinishManually = async () => {
    if (!sessionId || submitting) return;
    const end = questionEndsAtRef.current;
    questionDisplayFrozenRef.current =
      end == null ? QUESTION_LIMIT_SEC : Math.max(0, (end - Date.now()) / 1000);
    setSubmittingMode("finish");
    try {
      const res = await post(GAME_ENDPOINTS.FINISH(sessionId), {});
      clearPendingGameSessionId();
      stopGameBgm();
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
      questionDisplayFrozenRef.current = null;
      setSubmittingMode(null);
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

  /** Passed runs show only the congrats overlay, then return to the level map (no results panel). */
  const sessionEndedPassed = useMemo(() => {
    if (step !== 3 || !finishSnapshot) return false;
    const summary = extractResultSummary(finishSnapshot.session, finishSnapshot.finish);
    return summary.passed === true || summary.passed === "true";
  }, [step, finishSnapshot]);

  useEffect(() => {
    if (step !== 3) {
      setLevelOutcomeFlash(null);
      prevStepForOutcomeRef.current = step;
      return;
    }
    const justEntered = prevStepForOutcomeRef.current !== 3;
    prevStepForOutcomeRef.current = step;
    if (!justEntered) return;

    const sess = finishSnapshot?.session ?? session;
    const summary = extractResultSummary(sess, finishSnapshot?.finish ?? null);
    const passed =
      summary.passed === true || summary.passed === "true"
        ? true
        : summary.passed === false || summary.passed === "false"
          ? false
          : null;
    const scoreNum = Number(summary.score);
    setLevelOutcomeFlash({
      variant: passed === true ? "pass" : passed === false ? "fail" : "ambiguous",
      levelNumber: activeLevelNumber,
      unlockedLevel: parseUnlockedLevelNumber(summary.unlockedNextLevel),
      correctCount: Number.isFinite(scoreNum) ? scoreNum : 0,
      totalQuestions: getSessionTotalQuestions(sess),
      badgeLabel:
        summary.badge != null && String(summary.badge).trim() !== ""
          ? String(summary.badge).trim()
          : null,
    });
    /** Level-up / fail stings with overlay — fire after paint so it lines up with the flash animation. */
    if (passed === true) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          playLevelPassFlashSound(soundEnabledRef.current);
        });
      });
    } else if (passed === false) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          playLevelFailSound(soundEnabledRef.current);
        });
      });
    }
  }, [step, finishSnapshot, session, activeLevelNumber]);

  useEffect(() => {
    if (levelsCelebrateLevel == null) return undefined;
    const t = window.setTimeout(() => setLevelsCelebrateLevel(null), 5200);
    return () => window.clearTimeout(t);
  }, [levelsCelebrateLevel]);

  const doubleChanceNotice = currentAnswer?.canRetry
    ? "You can answer again on this question."
    : null;

  if (!authInitialized || !isLoggedIn) {
    return null;
  }

  return (
    <Box
      minH="100vh"
      bg={step === 1 ? "#f9f9ff" : "linear-gradient(to right, white, #ebf8ff)"}
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      <Box
        flex="1"
        px={step === 1 ? 0 : { base: 4, md: 16 }}
        py={step === 1 ? 0 : 8}
      >
        {step === 1 && (
          <GameLevelsView
            totalPoints={totalPoints}
            maxUnlockedLevel={maxUnlocked}
            levelSummaries={levelSummaries}
            loading={loadingProgress}
            startingLevel={startingLevel}
            resumingSession={resumingSession}
            activeSessionId={activeSessionId}
            celebrateLevelNumber={levelsCelebrateLevel}
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
              submitting={submitting}
              answerAwaitingApi={answerAwaitingApi}
              showTimeUpOverlay={timeUpAnimating}
              abilityLoading={abilityLoading}
              abilityCounts={abilityCounts}
              onSelectOption={handleSelectOption}
              onUseAbility={handleUseAbility}
              questionSecondsLeft={questionSecondsLeft}
              questionUrgency={questionUrgency}
              soundEnabled={soundEnabled}
              onToggleSound={toggleSound}
              doubleChanceNotice={doubleChanceNotice}
              answerFeedback={answerFeedback}
              justificationByAnswerId={justificationByAnswerId}
              onExit={handleExitSession}
            />
         
          </Box>
        )}

        {step === 3 && !sessionEndedPassed && (
          <GameResultsView
            summary={resultSummary}
            onPlayAgain={() => {
              clearPendingGameSessionId();
              setFinishSnapshot(null);
              setSession(null);
              setSessionId(null);
              setJustificationByAnswerId({});
              setLevelsCelebrateLevel(null);
              setStep(1);
            }}
            onBackToLevels={() => {
              clearPendingGameSessionId();
              setFinishSnapshot(null);
              setSession(null);
              setSessionId(null);
              setJustificationByAnswerId({});
              setLevelsCelebrateLevel(null);
              setStep(1);
            }}
          />
        )}
      </Box>

      <AbilityFlashOverlay ability={abilityFlash} onDismiss={dismissAbilityFlash} />
      <LevelOutcomeFlashOverlay payload={levelOutcomeFlash} onDismiss={handleLevelOutcomeComplete} />

      <Footer />
    </Box>
  );
};

export default GameQuizTryPage;
