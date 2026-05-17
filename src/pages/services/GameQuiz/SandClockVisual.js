import { Box } from "@chakra-ui/react";
import { useId, useMemo } from "react";

const TRANSITION = "y 0.2s linear, height 0.2s linear";

/** viewBox — compact silhouette, narrow neck */
const VB = { w: 56, h: 82 };
/** Top chamber: y 6..36; bottom: y 40..74 */
const TOP_Y0 = 6;
const TOP_Y1 = 36;
const BOT_Y0 = 40;
const BOT_Y1 = 74;

/**
 * Small, realistic hourglass: muted glass + fine sand grain.
 * @param {number} fraction — 1 = full time left, 0 = empty
 * @param {number} widthPx — display width (keep small, e.g. 36–42)
 */
export default function SandClockVisual({ fraction, widthPx = 38 }) {
  const f = Math.max(0, Math.min(1, Number.isFinite(fraction) ? fraction : 0));
  const w = Math.max(22, Math.min(56, Number(widthPx) || 38));
  const h = (w * VB.h) / VB.w;
  const uid = useId().replace(/:/g, "");

  const topH = TOP_Y1 - TOP_Y0;
  const botH = BOT_Y1 - BOT_Y0;

  const { topSand, bottomSand } = useMemo(() => {
    const tH = topH * f;
    const tY = TOP_Y1 - tH;
    const bH = botH * (1 - f);
    const bY = BOT_Y1 - bH;
    return { topSand: { y: tY, h: tH }, bottomSand: { y: bY, h: bH } };
  }, [f, topH, botH]);

  const gid = `sandGrad-${uid}`;
  const gGrain = `sandGrain-${uid}`;
  const clipTop = `clipTop-${uid}`;
  const clipBot = `clipBot-${uid}`;
  const glassPath =
    "M 8 6 L 48 6 L 31 36 L 31 40 L 48 74 L 8 74 L 25 40 L 25 36 Z";

  return (
    <Box flexShrink={0} lineHeight={0} display="inline-flex" alignItems="center" aria-hidden>
      <svg viewBox={`0 0 ${VB.w} ${VB.h}`} width={w} height={h} role="img">
        <title>Time remaining</title>
        <defs>
          <linearGradient id={gid} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#d8d0c4" />
            <stop offset="35%" stopColor="#b5a286" />
            <stop offset="100%" stopColor="#8f7b5e" />
          </linearGradient>
          <pattern id={gGrain} width="3" height="3" patternUnits="userSpaceOnUse">
            <circle cx="0.8" cy="1.1" r="0.22" fill="#6b5a45" opacity="0.14" />
            <circle cx="2.1" cy="2.2" r="0.18" fill="#5c4d3a" opacity="0.12" />
            <circle cx="1.6" cy="0.6" r="0.15" fill="#7a6a52" opacity="0.1" />
          </pattern>
          <clipPath id={clipTop}>
            <polygon points="8,6 48,6 31,36 25,36" />
          </clipPath>
          <clipPath id={clipBot}>
            <polygon points="25,40 31,40 48,74 8,74" />
          </clipPath>
        </defs>

        <g clipPath={`url(#${clipTop})`}>
          <rect
            x="0"
            y={topSand.y}
            width="56"
            height={topSand.h}
            fill={`url(#${gid})`}
            style={{ transition: TRANSITION }}
          />
          <rect
            x="0"
            y={topSand.y}
            width="56"
            height={topSand.h}
            fill={`url(#${gGrain})`}
            opacity={0.35}
            style={{ transition: TRANSITION }}
          />
        </g>

        <g clipPath={`url(#${clipBot})`}>
          <rect
            x="0"
            y={bottomSand.y}
            width="56"
            height={bottomSand.h}
            fill={`url(#${gid})`}
            style={{ transition: TRANSITION }}
          />
          <rect
            x="0"
            y={bottomSand.y}
            width="56"
            height={bottomSand.h}
            fill={`url(#${gGrain})`}
            opacity={0.35}
            style={{ transition: TRANSITION }}
          />
        </g>

        {f > 0.03 && f < 0.97 && (
          <rect
            x="27"
            y="36"
            width="2"
            height="4"
            fill="#8a7962"
            opacity={0.42}
            rx="0.35"
          />
        )}

        <path
          d={glassPath}
          fill="rgba(255,255,255,0.2)"
          stroke="#b8c2cc"
          strokeWidth="1.05"
          strokeLinejoin="round"
        />
        <path
          d="M 10 7.5 L 46 7.5 L 30.5 34.5 L 25.5 34.5 Z"
          fill="rgba(255,255,255,0.08)"
          pointerEvents="none"
        />
        <path
          d={glassPath}
          fill="none"
          stroke="#8a939e"
          strokeWidth="0.5"
          strokeLinejoin="round"
          opacity={0.85}
        />
      </svg>
    </Box>
  );
}
