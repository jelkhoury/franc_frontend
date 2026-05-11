import { useState, useEffect } from "react";

/**
 * Eased count from 0 (or `from`) to `target` when `enabled` becomes true.
 */
export function useCountUp(target, { duration = 900, enabled = true, from = 0 } = {}) {
  const num =
    typeof target === "number" && Number.isFinite(target)
      ? target
      : Number.isFinite(Number(target))
        ? Number(target)
        : NaN;

  const [value, setValue] = useState(enabled && Number.isFinite(num) ? from : 0);

  useEffect(() => {
    if (!enabled || !Number.isFinite(num)) {
      setValue(Number.isFinite(num) ? num : 0);
      return undefined;
    }

    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setValue(Math.round(from + eased * (num - from)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [num, duration, enabled, from]);

  return Number.isFinite(num) ? value : 0;
}
