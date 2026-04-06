/**
 * Normalizes game API payloads — backend field names may vary (PascalCase / camelCase).
 * TODO: Tighten once OpenAPI / sample responses are fixed.
 */

export const LEVEL_BADGE_ORDER = [
  { level: 1, label: "Bronze", colorScheme: "orange" },
  { level: 2, label: "Silver", colorScheme: "gray" },
  { level: 3, label: "Gold", colorScheme: "yellow" },
  { level: 4, label: "Platinum", colorScheme: "purple" },
  { level: 5, label: "Diamond", colorScheme: "cyan" },
];

export const GAME_ABILITIES = [
  "Skip",
  "FiftyFifty",
  "DoubleChance",
  "TimeFreeze",
  "Hint",
];

export const OPTION_KEYS = ["A", "B", "C", "D"];

/**
 * API may return { data: { ...session } } or { result: ... }.
 */
export function unwrapSessionPayload(session) {
  if (session == null || typeof session !== "object") return session;
  const inner =
    session.data ??
    session.Data ??
    session.result ??
    session.Result ??
    session.value ??
    session.Value ??
    session.payload ??
    session.Payload ??
    session.session ??
    session.Session;
  if (inner != null && typeof inner === "object") {
    return inner;
  }
  return session;
}

function isAwaitingDoubleChanceRetry(row) {
  return !!(
    row.awaitingDoubleChanceRetry ??
    row.AwaitingDoubleChanceRetry ??
    row.canRetry ??
    row.CanRetry ??
    row.doubleChanceAvailable ??
    row.DoubleChanceAvailable
  );
}

function isAnswerRowStillActive(row) {
  if (!row || typeof row !== "object") return false;
  const awaitingRetry = isAwaitingDoubleChanceRetry(row);

  const resolved = row.isResolved ?? row.IsResolved ?? row.resolved ?? row.Resolved;
  if (resolved === true || resolved === "true" || resolved === 1) {
    if (awaitingRetry) return true;
    return false;
  }

  const selected = row.selectedOption ?? row.SelectedOption ?? null;
  if (selected != null && String(selected).trim() !== "" && !awaitingRetry) {
    return false;
  }

  const done = row.isAnswered ?? row.IsAnswered ?? row.answered ?? row.Answered;
  if (done === true || done === "true" || done === 1) return false;
  if (done === false || done === "false" || done === 0) return true;
  const st = String(row.status ?? row.Status ?? "").toLowerCase();
  if (st === "answered" || st === "complete" || st === "completed") return false;
  if (st === "pending" || st === "current" || st === "active") return true;
  // If backend omits flags, treat as active so the UI can render.
  return true;
}

export function pickSessionId(data) {
  if (data == null || typeof data !== "object") return null;
  const readId = (o) => {
    if (!o || typeof o !== "object") return null;
    const v = o.sessionId ?? o.SessionId ?? o.session_id ?? o.id ?? o.Id;
    if (v === null || v === undefined || v === "") return null;
    return v;
  };
  const top = readId(data);
  if (top != null) return top;
  const inner = unwrapSessionPayload(data);
  if (inner && inner !== data) {
    const nested = readId(inner);
    if (nested != null) return nested;
  }
  return null;
}

export function getTotalPoints(progress) {
  if (!progress || typeof progress !== "object") return 0;
  const progressRoot = unwrapSessionPayload(progress);
  const v =
    progressRoot.totalPoints ??
    progressRoot.TotalPoints ??
    progressRoot.points ??
    progressRoot.Points;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Highest level the user may start (1–5). Defaults to 1 if unknown. */
export function getMaxUnlockedLevel(progress) {
  if (!progress || typeof progress !== "object") return 1;
  const progressRoot = unwrapSessionPayload(progress);
  const v =
    progressRoot.highestUnlockedLevel ??
    progressRoot.HighestUnlockedLevel ??
    progressRoot.highestLevelUnlocked ??
    progressRoot.currentLevel ??
    progressRoot.CurrentLevel;
  const n = parseInt(String(v), 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(5, n);
}

export function normalizeOptions(answer) {
  if (!answer || typeof answer !== "object") {
    return { A: "", B: "", C: "", D: "" };
  }
  if (
    answer.optionA != null ||
    answer.OptionA != null ||
    answer.optionB != null ||
    answer.OptionB != null
  ) {
    return {
      A: String(answer.optionA ?? answer.OptionA ?? ""),
      B: String(answer.optionB ?? answer.OptionB ?? ""),
      C: String(answer.optionC ?? answer.OptionC ?? ""),
      D: String(answer.optionD ?? answer.OptionD ?? ""),
    };
  }
  const raw = answer.options ?? answer.Options;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return {
      A: String(raw.A ?? raw.a ?? ""),
      B: String(raw.B ?? raw.b ?? ""),
      C: String(raw.C ?? raw.c ?? ""),
      D: String(raw.D ?? raw.d ?? ""),
    };
  }
  if (Array.isArray(raw)) {
    return {
      A: String(raw[0] ?? ""),
      B: String(raw[1] ?? ""),
      C: String(raw[2] ?? ""),
      D: String(raw[3] ?? ""),
    };
  }
  return { A: "", B: "", C: "", D: "" };
}

export function getHiddenOptionKeys(answer) {
  if (!answer || typeof answer !== "object") return [];
  const h = answer.hiddenOptions ?? answer.HiddenOptions ?? [];
  if (!Array.isArray(h)) return [];
  return h.map((x) => String(x).toUpperCase()).filter((k) => OPTION_KEYS.includes(k));
}

export function pickSessionAnswerId(answer) {
  if (!answer || typeof answer !== "object") return null;
  const v =
    answer.sessionAnswerId ??
    answer.SessionAnswerId ??
    answer.sessionQuestionAnswerId ??
    answer.SessionQuestionAnswerId ??
    answer.answerId ??
    answer.AnswerId ??
    answer.sessionAnswerID ??
    answer.id ??
    answer.Id;
  if (v === null || v === undefined || v === "") return null;
  return v;
}

function buildResolvedAnswer(row) {
  if (!row || typeof row !== "object") return null;
  const sessionAnswerId = pickSessionAnswerId(row);
  const questionText = String(
    row.questionText ??
      row.QuestionText ??
      row.question ??
      row.Question ??
      row.text ??
      row.Text ??
      row.prompt ??
      row.Prompt ??
      ""
  );
  const options = normalizeOptions(row);
  const hiddenOptions = getHiddenOptionKeys(row);
  const hint = row.hint ?? row.Hint ?? null;
  const canRetry = isAwaitingDoubleChanceRetry(row);
  return {
    raw: row,
    sessionAnswerId,
    questionText,
    options,
    hiddenOptions,
    hint,
    canRetry,
  };
}

/**
 * Current question may live on the session root instead of `answers[]`.
 */
function resolveCurrentAnswerFromRoot(s) {
  if (!s || typeof s !== "object") return null;
  const row =
    s.currentQuestion ??
    s.CurrentQuestion ??
    s.currentAnswer ??
    s.CurrentAnswer ??
    s.activeQuestion ??
    s.ActiveQuestion ??
    s.question ??
    s.Question ??
    null;
  if (!row || typeof row !== "object") return null;
  const built = buildResolvedAnswer(row);
  if (!built) return null;
  if (
    !built.sessionAnswerId &&
    (built.questionText || OPTION_KEYS.some((k) => built.options[k]))
  ) {
    const fallback = pickSessionAnswerId(s);
    if (fallback != null && fallback !== "") {
      return { ...built, sessionAnswerId: fallback };
    }
  }
  return built;
}

/**
 * Prefer the first still-active row; else last row (finished / review).
 */
export function resolveCurrentAnswer(session) {
  if (!session || typeof session !== "object") return null;
  const s = unwrapSessionPayload(session);

  const list =
    s.answers ??
    s.Answers ??
    s.sessionAnswers ??
    s.SessionAnswers ??
    s.questions ??
    s.Questions ??
    s.items ??
    s.Items ??
    [];

  if (!Array.isArray(list) || list.length === 0) {
    return resolveCurrentAnswerFromRoot(s);
  }

  const targetId =
    s.currentAnswerId ??
    s.CurrentAnswerId ??
    s.currentSessionAnswerId ??
    s.CurrentSessionAnswerId;
  if (targetId != null && targetId !== "") {
    const byId = list.find(
      (a) => a && String(pickSessionAnswerId(a)) === String(targetId)
    );
    if (byId) {
      const built = buildResolvedAnswer(byId);
      if (built && (built.questionText || OPTION_KEYS.some((k) => built.options[k]))) {
        return built;
      }
    }
  }

  const qIdx = s.currentQuestionIndex ?? s.CurrentQuestionIndex;
  if (qIdx != null && qIdx !== "") {
    const n = parseInt(String(qIdx), 10);
    if (Number.isFinite(n) && n >= 0 && n < list.length) {
      const built = buildResolvedAnswer(list[n]);
      if (built && (built.questionText || OPTION_KEYS.some((k) => built.options[k]))) {
        return built;
      }
    }
  }

  const activeRows = list.filter((a) => a && isAnswerRowStillActive(a));
  const byOrder = (a, b) => {
    const oa = a?.questionOrder ?? a?.QuestionOrder ?? 0;
    const ob = b?.questionOrder ?? b?.QuestionOrder ?? 0;
    return Number(oa) - Number(ob);
  };
  activeRows.sort(byOrder);
  const active = activeRows[0];
  const row = active || list[list.length - 1];
  const built = buildResolvedAnswer(row);
  if (built && (built.questionText || OPTION_KEYS.some((k) => built.options[k]))) {
    return built;
  }

  const fromRoot = resolveCurrentAnswerFromRoot(s);
  return fromRoot || built;
}

/** True if numeric/string id is present (including 0). */
export function hasSessionAnswerId(currentAnswer) {
  if (!currentAnswer || currentAnswer.sessionAnswerId == null) return false;
  if (currentAnswer.sessionAnswerId === "") return false;
  return true;
}

export function hasQuestionContent(currentAnswer) {
  if (!currentAnswer) return false;
  if (String(currentAnswer.questionText || "").trim()) return true;
  return OPTION_KEYS.some((k) => String(currentAnswer.options[k] || "").trim());
}

function getSessionQuestionListRoot(s) {
  if (!s || typeof s !== "object") return null;
  const list =
    s.answers ??
    s.Answers ??
    s.sessionAnswers ??
    s.SessionAnswers ??
    s.questions ??
    s.Questions ??
    null;
  return Array.isArray(list) ? list : null;
}

/** True when every question row is done (no active row), or resolvedCount meets total. */
export function areAllSessionQuestionsResolved(session) {
  const s = unwrapSessionPayload(session);
  if (!s || typeof s !== "object") return false;
  const resolved = Number(s.resolvedCount ?? s.ResolvedCount);
  const total = Number(s.totalQuestions ?? s.TotalQuestions);
  if (Number.isFinite(resolved) && Number.isFinite(total) && total > 0 && resolved >= total) {
    return true;
  }
  const list = getSessionQuestionListRoot(s);
  if (!list || list.length === 0) return false;
  return list.every((row) => row && !isAnswerRowStillActive(row));
}

export function isSessionComplete(session) {
  if (!session || typeof session !== "object") return false;
  const s = unwrapSessionPayload(session);
  const v =
    s.isComplete ??
    s.IsComplete ??
    s.isFinished ??
    s.IsFinished ??
    s.finished ??
    s.Finished;
  if (typeof v === "boolean") return v;
  const st = String(s.status ?? s.Status ?? "").toLowerCase();
  if (st === "complete" || st === "finished" || st === "completed") return true;
  if (areAllSessionQuestionsResolved(session)) return true;
  return false;
}

/** Backend may use PascalCase or camelCase keys in abilitiesRemaining. */
function readAbilityCountFromBlock(block, abilityName) {
  if (!block || typeof block !== "object") return null;
  const camel = abilityName.charAt(0).toLowerCase() + abilityName.slice(1);
  const keys = [abilityName, camel];
  for (const k of keys) {
    if (k in block && block[k] != null) {
      const n = Number(block[k]);
      return Number.isFinite(n) ? n : null;
    }
  }
  return null;
}

export function getAbilityRemaining(session, currentAnswer, abilityName) {
  const from = (obj) => {
    if (!obj || typeof obj !== "object") return null;
    const block =
      obj.abilityCharges ??
      obj.AbilityCharges ??
      obj.abilitiesRemaining ??
      obj.AbilitiesRemaining ??
      obj.abilities ??
      obj.Abilities;
    if (block && typeof block === "object") {
      const n = readAbilityCountFromBlock(block, abilityName);
      if (n != null) return n;
    }
    const key = `${abilityName}Remaining`;
    if (key in obj) return Number(obj[key]);
    const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
    if (camelKey in obj) return Number(obj[camelKey]);
    const pascal = `${abilityName}Remaining`;
    if (pascal in obj) return Number(obj[pascal]);
    return null;
  };
  let n = from(currentAnswer?.raw);
  if (n == null || Number.isNaN(n)) n = from(session);
  if (n == null || Number.isNaN(n)) n = from(unwrapSessionPayload(session));
  if (n == null || Number.isNaN(n)) return 0;
  return Math.max(0, n);
}

export function buildAbilityCounts(session, currentAnswer) {
  return GAME_ABILITIES.reduce((acc, name) => {
    acc[name] = getAbilityRemaining(session, currentAnswer, name);
    return acc;
  }, {});
}

/** Score / pass hints for results UI */
export function getQuestionProgressDisplay(session, currentAnswer) {
  const s =
    session && typeof session === "object" ? unwrapSessionPayload(session) : null;
  const list =
    s?.answers ??
    s?.Answers ??
    s?.sessionAnswers ??
    s?.SessionAnswers ??
    s?.questions ??
    s?.Questions ??
    [];
  const fromSession = Number(s?.totalQuestions ?? s?.TotalQuestions);
  const total =
    (Number.isFinite(fromSession) && fromSession > 0 ? fromSession : null) ??
    (Array.isArray(list) && list.length > 0 ? list.length : null) ??
    10;
  if (!hasSessionAnswerId(currentAnswer) || !Array.isArray(list) || list.length === 0) {
    return { index: 1, total };
  }
  const i = list.findIndex(
    (a) => String(pickSessionAnswerId(a)) === String(currentAnswer.sessionAnswerId)
  );
  return { index: i >= 0 ? i + 1 : 1, total };
}

/** Active run id from GET /api/game/progress (field names vary by backend). */
export function getActiveSessionIdFromProgress(progress) {
  if (!progress || typeof progress !== "object") return null;
  const u = unwrapSessionPayload(progress);
  const id =
    u.activeSessionId ??
    u.ActiveSessionId ??
    u.currentSessionId ??
    u.CurrentSessionId ??
    u.inProgressSessionId ??
    u.InProgressSessionId ??
    u.openSessionId ??
    u.OpenSessionId ??
    u.activeRunId ??
    u.ActiveRunId ??
    (u.hasActiveSession === true || u.HasActiveSession === true
      ? u.sessionId ?? u.SessionId
      : null) ??
    null;
  if (id === null || id === undefined || id === "") return null;
  return id;
}

export function getLevelNumberFromSession(session) {
  if (!session || typeof session !== "object") return 1;
  const s = unwrapSessionPayload(session);
  const n = s.levelNumber ?? s.LevelNumber ?? s.level ?? s.Level;
  const p = parseInt(String(n), 10);
  return Number.isFinite(p) && p >= 1 ? Math.min(5, p) : 1;
}

/** Best-effort message for toast (HttpError.message + JSON body). */
export function formatGameApiError(error) {
  const base = error?.message ? String(error.message).trim() : "";
  const d = error?.details;
  if (typeof d === "string" && d.trim()) return d.trim();
  if (d && typeof d === "object") {
    const m =
      d.message ??
      d.Message ??
      d.error ??
      d.Error ??
      d.title ??
      d.Title ??
      d.detail ??
      d.Detail;
    if (m != null && String(m).trim()) return String(m).trim();
  }
  return base || "Something went wrong.";
}

export function isLikelySessionAlreadyActiveError(message) {
  const m = String(message || "").toLowerCase();
  if (!m) return false;
  if (m.includes("finish or abandon")) return true;
  if (m.includes("in progress") && (m.includes("session") || m.includes("quiz") || m.includes("run")))
    return true;
  if (m.includes("already") && (m.includes("session") || m.includes("quiz") || m.includes("run")))
    return true;
  return false;
}

export function pickSessionIdFromErrorDetails(details) {
  if (!details || typeof details !== "object") return null;
  return (
    pickSessionId(details) ??
    details.activeSessionId ??
    details.ActiveSessionId ??
    details.currentSessionId ??
    details.CurrentSessionId ??
    null
  );
}

export function extractResultSummary(session, finishPayload) {
  const src = finishPayload && typeof finishPayload === "object" ? finishPayload : session;
  if (!src || typeof src !== "object") {
    return {
      passed: null,
      score: null,
      badge: null,
      pointsEarned: null,
      unlockedNextLevel: null,
    };
  }
  return {
    passed: src.passed ?? src.Passed ?? src.isPassed ?? src.IsPassed ?? null,
    score: src.score ?? src.Score ?? src.totalScore ?? src.TotalScore ?? null,
    badge: src.badge ?? src.Badge ?? src.badgeEarned ?? src.BadgeEarned ?? null,
    pointsEarned: src.pointsEarned ?? src.PointsEarned ?? src.sessionPoints ?? null,
    unlockedNextLevel:
      src.unlockedNextLevel ?? src.UnlockedNextLevel ?? src.nextLevelUnlocked ?? null,
  };
}

const PENDING_GAME_SESSION_KEY = "franc_game_pending_session_id";

/** Remember in-flight run after “Exit to levels” so Continue works before progress refetches. */
export function readPendingGameSessionId() {
  try {
    const v = window.sessionStorage.getItem(PENDING_GAME_SESSION_KEY);
    return v && String(v).trim() ? String(v).trim() : null;
  } catch {
    return null;
  }
}

export function writePendingGameSessionId(sessionId) {
  try {
    if (sessionId == null || sessionId === "") {
      window.sessionStorage.removeItem(PENDING_GAME_SESSION_KEY);
    } else {
      window.sessionStorage.setItem(PENDING_GAME_SESSION_KEY, String(sessionId));
    }
  } catch {
    /* ignore */
  }
}

export function clearPendingGameSessionId() {
  writePendingGameSessionId(null);
}
