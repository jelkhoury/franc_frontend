import {
  FaVideo,
  FaBrain,
  FaBalanceScale,
  FaGamepad,
  FaFileAlt,
  FaEnvelope,
  FaRobot,
  FaBriefcase,
} from "react-icons/fa";

/** Canonical Franc service keys used across analytics */
export const SERVICE_KEYS = {
  MOCK_INTERVIEW: "mockInterview",
  SDS: "sds",
  JOB_COMPARISON: "jobComparison",
  GAMIFICATION: "gamification",
  RESUME: "resume",
  COVER_LETTER: "coverLetter",
  CHAT: "chat",
  JOB_MATCHING: "jobMatching",
};

/**
 * @typedef {Object} ServiceDefinition
 * @property {string} key
 * @property {string} name
 * @property {string} shortName
 * @property {string} description
 * @property {import('react').IconType} icon
 * @property {string} color
 * @property {boolean} active
 */

/** @type {ServiceDefinition[]} */
export const FRANC_SERVICES = [
  {
    key: SERVICE_KEYS.MOCK_INTERVIEW,
    name: "Mock Interview",
    shortName: "Mock Interview",
    description: "Simulated video interviews with CCD evaluation and reports",
    icon: FaVideo,
    color: "#3E79BD",
    active: true,
  },
  {
    key: SERVICE_KEYS.SDS,
    name: "Personality Test (SDS)",
    shortName: "SDS",
    description: "Holland Code (RIASEC) career assessment",
    icon: FaBrain,
    color: "#805AD5",
    active: true,
  },
  {
    key: SERVICE_KEYS.JOB_COMPARISON,
    name: "Job Comparison",
    shortName: "Job Comparison",
    description: "HEAD vs HEART weighted job option comparison",
    icon: FaBalanceScale,
    color: "#DD6B20",
    active: true,
  },
  {
    key: SERVICE_KEYS.GAMIFICATION,
    name: "Career Quest",
    shortName: "Gamification",
    description: "Timed quiz levels with badges and power-ups",
    icon: FaGamepad,
    color: "#38A169",
    active: true,
  },
  {
    key: SERVICE_KEYS.RESUME,
    name: "Resume Feedback",
    shortName: "Resume",
    description: "AI-powered CV evaluation",
    icon: FaFileAlt,
    color: "#319795",
    active: true,
  },
  {
    key: SERVICE_KEYS.COVER_LETTER,
    name: "Cover Letter Feedback",
    shortName: "Cover Letter",
    description: "AI cover letter and job ad fit evaluation",
    icon: FaEnvelope,
    color: "#D69E2E",
    active: true,
  },
  {
    key: SERVICE_KEYS.CHAT,
    name: "Franc Chatbot",
    shortName: "Chat",
    description: "Conversational career guidance",
    icon: FaRobot,
    color: "#718096",
    active: true,
  },
  {
    key: SERVICE_KEYS.JOB_MATCHING,
    name: "Job Matching",
    shortName: "Job Matching",
    description: "Skills-based job opportunity search",
    icon: FaBriefcase,
    color: "#E53E3E",
    active: true,
  },
];

export function getServiceByKey(key) {
  return FRANC_SERVICES.find((s) => s.key === key) ?? null;
}

export function getActiveServices() {
  return FRANC_SERVICES.filter((s) => s.active);
}
