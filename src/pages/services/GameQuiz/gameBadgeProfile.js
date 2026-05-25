/** Session hint for profile “new medal” highlight after a level pass. */
export const GAME_NEW_BADGE_LEVEL_KEY = "franc_game_new_badge_level";

export function markGameBadgeEarnedForProfile(levelNumber) {
  if (levelNumber == null || !Number.isFinite(Number(levelNumber))) return;
  try {
    sessionStorage.setItem(GAME_NEW_BADGE_LEVEL_KEY, String(levelNumber));
  } catch {
    /* ignore quota / private mode */
  }
}

export function consumeNewGameBadgeLevel() {
  try {
    const raw = sessionStorage.getItem(GAME_NEW_BADGE_LEVEL_KEY);
    sessionStorage.removeItem(GAME_NEW_BADGE_LEVEL_KEY);
    if (raw == null || raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}
