import { Box } from "@chakra-ui/react";
import { LEVEL_BADGE_ORDER } from "./gameSessionUtils";

/**
 * Hiring-journey titles on medals (short labels for the starburst SVG).
 * Level 1–2: applicant · 3–4: candidate · 5: employee
 */
export const HIRING_MEDAL_TITLES = {
  1: "APPLY",
  2: "REVIEW",
  3: "PITCH",
  4: "OFFER",
  5: "HIRED",
};

const MEDAL_TITLES = HIRING_MEDAL_TITLES;

/** Matches level card tier colors (Bronze → Diamond). */
const TIER_MEDAL_PALETTE = {
  orange: {
    ring: "#B9722D",
    ringDark: "#8A5520",
    fill: "#E8C9A0",
    text: "#8A5520",
    star: "#B9722D",
  },
  gray: {
    ring: "#9BA3AF",
    ringDark: "#6B7280",
    fill: "#D8DEE6",
    text: "#4B5563",
    star: "#9BA3AF",
  },
  yellow: {
    ring: "#F6AD55",
    ringDark: "#C27803",
    fill: "#FFE4B8",
    text: "#B45309",
    star: "#F6AD55",
  },
  purple: {
    ring: "#4A5568",
    ringDark: "#2D3748",
    fill: "#A0AEC0",
    text: "#2D3748",
    star: "#4A5568",
  },
  cyan: {
    ring: "#005ea1",
    ringDark: "#00457a",
    fill: "#8ec5ea",
    text: "#005ea1",
    star: "#005ea1",
  },
};

export function getMedalPresetForLevel(level) {
  const tier =
    LEVEL_BADGE_ORDER.find((r) => r.level === Number(level)) ??
    LEVEL_BADGE_ORDER[0];
  const palette =
    TIER_MEDAL_PALETTE[tier.colorScheme] ?? TIER_MEDAL_PALETTE.orange;
  return {
    level: tier.level,
    title: MEDAL_TITLES[tier.level] ?? String(tier.label).toUpperCase(),
    label: tier.label,
    colorScheme: tier.colorScheme,
    ...palette,
  };
}

function starburstPath(cx, cy, outerR, innerR, teeth = 18) {
  const pts = [];
  for (let i = 0; i < teeth * 2; i += 1) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (Math.PI / teeth) * i - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return `M ${pts.join(" L ")} Z`;
}

function miniStarPath(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? r : r * 0.42;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${cx + radius * Math.cos(a)},${cy + radius * Math.sin(a)}`);
  }
  return `M ${pts.join(" L ")} Z`;
}

/**
 * @param {{ preset: ReturnType<typeof getMedalPresetForLevel>, size?: number, earned?: boolean, active?: boolean }} props
 */
export function CareerLevelMedalBadge({
  preset,
  size = 88,
  earned = false,
  active = true,
}) {
  const id = `medal-${preset.level}-${preset.title}`;
  const dimmed = !active;
  const muted = active && !earned;

  return (
    <Box
      as="span"
      display="inline-block"
      w={`${size}px`}
      h={`${size}px`}
      flexShrink={0}
      opacity={dimmed ? 0.42 : muted ? 0.78 : 1}
      filter={dimmed ? "grayscale(0.85)" : muted ? "saturate(0.65)" : "none"}
      transition="opacity 0.2s, filter 0.2s"
    >
      <Box
        as="svg"
        viewBox="0 0 100 100"
        w="100%"
        h="100%"
        role="img"
        aria-label={`${preset.title} medal`}
      >
        <defs>
          <radialGradient id={`${id}-inner`} cx="50%" cy="38%" r="58%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#f8fbff" />
            <stop offset="100%" stopColor="#e8f2fc" />
          </radialGradient>
          <linearGradient id={`${id}-ring`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={preset.fill} />
            <stop offset="45%" stopColor={preset.ring} />
            <stop offset="100%" stopColor={preset.ringDark} />
          </linearGradient>
        </defs>
        <path d={starburstPath(50, 50, 48, 40)} fill={`url(#${id}-ring)`} />
        <circle cx="50" cy="50" r="33" fill={`url(#${id}-inner)`} />
        <text
          x="50"
          y="46"
          textAnchor="middle"
          fill={preset.text}
          fontSize="13"
          fontWeight="800"
          fontFamily='"Outfit", system-ui, sans-serif'
          letterSpacing="0.04em"
        >
          {preset.title}
        </text>
        <text
          x="50"
          y="58"
          textAnchor="middle"
          fill={preset.text}
          fontSize="5.5"
          fontWeight="700"
          fontFamily='"Plus Jakarta Sans", system-ui, sans-serif'
          letterSpacing="0.14em"
          opacity={0.85}
        >
          CERTIFIED
        </text>
        <path d={miniStarPath(38, 72, 5)} fill={preset.star} />
        <path d={miniStarPath(50, 75, 5.5)} fill={preset.star} />
        <path d={miniStarPath(62, 72, 5)} fill={preset.star} />
      </Box>
    </Box>
  );
}

export default CareerLevelMedalBadge;
