/**
 * HTML5 Audio — files live in /public/game-audio/ (same names on disk).
 * Timer beeps stay in gameWebAudio.js (synthetic).
 */

import { unlockGameAudio } from "./gameWebAudio";

const prefix = `${typeof process !== "undefined" && process.env.PUBLIC_URL ? process.env.PUBLIC_URL : ""}/game-audio`;

/** Your project assets (see public/game-audio/) */
const GAME_AUDIO_FILES = {
  bgm: "xtremefreddy-game-music-loop-7-145285.mp3",
  correct: "mixkit-correct-answer-tone-2870.wav",
  /** Per-ability success (50/50, skip, etc.) */
  abilityUse: "abilityUse.mp3",
  /** Countdown — final ~3s of a question */
  lastThreeSeconds: "Last 3 seconds.mp3",
  /** After level pass — landing on levels with newly unlocked stage */
  unlockNewLevel: "unlocknewlevel.mp3",
  /** Per-question wrong pick */
  wrongAnswer: "universfield-error-04-199275.mp3",
  /** Level not passed — results screen */
  levelFail: "universfield-fail-144746.mp3",
  /** “Level complete!” full-screen flash (before returning to level map) */
  levelPassFlash: "tithuh-level-up-02-528919.mp3",
};

let bgmEl = null;

function ensureBgmElement() {
  if (!bgmEl) {
    bgmEl = new Audio(`${prefix}/${GAME_AUDIO_FILES.bgm}`);
    bgmEl.loop = true;
    bgmEl.volume = 0.22;
  }
  return bgmEl;
}

/** Start looping background music during the quiz. */
export function startGameBgm() {
  const el = ensureBgmElement();
  void el.play().catch(() => {});
}

export function stopGameBgm() {
  if (bgmEl) {
    bgmEl.pause();
    try {
      bgmEl.currentTime = 0;
    } catch {
      /* ignore */
    }
  }
}

function playFile(filename, volume) {
  const a = new Audio(`${prefix}/${encodeURIComponent(filename)}`);
  a.volume = volume;
  void a.play().catch(() => {});
}

/** correct / wrong answer cues (wrong = error sting, not level fail). */
export function playGameMediaFeedback(kind, enabled) {
  if (!enabled) return;
  if (kind === "correct") playFile(GAME_AUDIO_FILES.correct, 0.45);
  else if (kind === "wrong") playFile(GAME_AUDIO_FILES.wrongAnswer, 0.42);
}

/** When the run ends and the level was not passed (results screen). */
export function playLevelFailSound(enabled) {
  if (!enabled) return;
  unlockGameAudio();
  playFile(GAME_AUDIO_FILES.levelFail, 0.46);
}

/** One-shot MP3 when the question timer hits the last ~3 seconds (per question). */
export function playLastThreeSecondsSound(enabled) {
  if (!enabled) return;
  playFile(GAME_AUDIO_FILES.lastThreeSeconds, 0.48);
}

/** After using an ability successfully. */
export function playAbilityUseSound(enabled) {
  if (!enabled) return;
  playFile(GAME_AUDIO_FILES.abilityUse, 0.44);
}

/** When the pass overlay appears (“Level complete!”). */
export function playLevelPassFlashSound(enabled) {
  if (!enabled) return;
  unlockGameAudio();
  playFile(GAME_AUDIO_FILES.levelPassFlash, 0.5);
}

/** Level cleared — shown when returning to the level map with a new unlock. */
export function playUnlockNewLevelSound(enabled) {
  if (!enabled) return;
  unlockGameAudio();
  playFile(GAME_AUDIO_FILES.unlockNewLevel, 0.48);
}
