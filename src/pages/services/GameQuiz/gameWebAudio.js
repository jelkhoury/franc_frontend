/**
 * Lightweight UI sounds via Web Audio (no MP3 assets; works after a user gesture unlocks audio).
 */

let audioContext = null;

export function unlockGameAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audioContext) {
      audioContext = new AC();
    }
    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }
    return audioContext;
  } catch {
    return null;
  }
}

/**
 * @param {'correct' | 'wrong' | 'tick' | 'ten'} kind
 * @param {boolean} enabled
 */
export function playGameSound(kind, enabled) {
  if (!enabled) return;
  const ctx = unlockGameAudio();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (kind === "correct") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.07);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.23);
    } else if (kind === "wrong") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(120, now + 0.15);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.21);
    } else if (kind === "tick") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(920, now);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (kind === "ten") {
      const freqs = [660, 520];
      freqs.forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        const t0 = now + i * 0.14;
        o.type = "sine";
        o.frequency.setValueAtTime(freq, t0);
        g.gain.setValueAtTime(0.11, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.11);
        o.start(t0);
        o.stop(t0 + 0.12);
      });
    }
  } catch {
    /* ignore */
  }
}
