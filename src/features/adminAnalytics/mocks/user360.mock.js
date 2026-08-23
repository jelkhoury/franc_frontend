/**
 * Rich mock data for User 360° design exploration.
 * TODO: Replace with GET /api/admin/analytics/users/{userId}
 */

import { SERVICE_KEYS, FRANC_SERVICES } from "../constants/serviceRegistry";

const now = new Date();
export const daysAgo360 = (n) => {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

const ALL_SERVICES = [
  SERVICE_KEYS.SDS,
  SERVICE_KEYS.MOCK_INTERVIEW,
  SERVICE_KEYS.GAMIFICATION,
  SERVICE_KEYS.JOB_COMPARISON,
  SERVICE_KEYS.RESUME,
  SERVICE_KEYS.COVER_LETTER,
  SERVICE_KEYS.CHAT,
  SERVICE_KEYS.JOB_MATCHING,
];

function serviceName(key) {
  return FRANC_SERVICES.find((s) => s.key === key)?.name ?? key;
}

function buildShowcaseProfile(base) {
  const name = `${base.firstName} ${base.lastName}`;
  return {
    ...base,
    summary: {
      servicesUsed: 8,
      totalActivities: 42,
      completedActivities: 38,
      mostUsedServiceKey: SERVICE_KEYS.SDS,
      mostUsedServiceName: serviceName(SERVICE_KEYS.SDS),
      lastActiveAt: daysAgo360(0),
    },
    recentActivity: [
      { id: "tl-1", userId: base.userId, userName: name, userEmail: base.email, activityLabel: "Completed SDS", serviceKey: SERVICE_KEYS.SDS, serviceName: serviceName(SERVICE_KEYS.SDS), result: "RIA", status: "completed", occurredAt: daysAgo360(0) },
      { id: "tl-2", userId: base.userId, userName: name, userEmail: base.email, activityLabel: "Mock Interview Evaluated", serviceKey: SERVICE_KEYS.MOCK_INTERVIEW, serviceName: serviceName(SERVICE_KEYS.MOCK_INTERVIEW), result: "4.5 / 5", status: "evaluated", occurredAt: daysAgo360(1) },
      { id: "tl-3", userId: base.userId, userName: name, userEmail: base.email, activityLabel: "Reached Level 4 — Finalist", serviceKey: SERVICE_KEYS.GAMIFICATION, serviceName: serviceName(SERVICE_KEYS.GAMIFICATION), result: "Platinum Badge", status: "completed", occurredAt: daysAgo360(2) },
      { id: "tl-4", userId: base.userId, userName: name, userEmail: base.email, activityLabel: "Job Comparison Completed", serviceKey: SERVICE_KEYS.JOB_COMPARISON, serviceName: serviceName(SERVICE_KEYS.JOB_COMPARISON), result: "Software Engineer wins", status: "completed", occurredAt: daysAgo360(3) },
      { id: "tl-5", userId: base.userId, userName: name, userEmail: base.email, activityLabel: "Resume Evaluated", serviceKey: SERVICE_KEYS.RESUME, serviceName: serviceName(SERVICE_KEYS.RESUME), result: "AI feedback received", status: "completed", occurredAt: daysAgo360(5) },
      { id: "tl-6", userId: base.userId, userName: name, userEmail: base.email, activityLabel: "Cover Letter Evaluated", serviceKey: SERVICE_KEYS.COVER_LETTER, serviceName: serviceName(SERVICE_KEYS.COVER_LETTER), result: "Strong fit", status: "completed", occurredAt: daysAgo360(7) },
      { id: "tl-7", userId: base.userId, userName: name, userEmail: base.email, activityLabel: "Chat Session", serviceKey: SERVICE_KEYS.CHAT, serviceName: serviceName(SERVICE_KEYS.CHAT), result: "18 messages", status: "completed", occurredAt: daysAgo360(10) },
      { id: "tl-8", userId: base.userId, userName: name, userEmail: base.email, activityLabel: "Job Matching Search", serviceKey: SERVICE_KEYS.JOB_MATCHING, serviceName: serviceName(SERVICE_KEYS.JOB_MATCHING), result: "14 jobs found", status: "completed", occurredAt: daysAgo360(14) },
    ],
    services: {
      mockInterview: {
        interviews: 4,
        attempts: 4,
        evaluated: 3,
        averageRating: 4.5,
        reportsGenerated: 2,
        items: [
          { id: "mi-1", status: "evaluated", overallRating: 5, major: base.major, submittedAt: daysAgo360(1), reportGenerated: true },
          { id: "mi-2", status: "evaluated", overallRating: 4, major: base.major, submittedAt: daysAgo360(20), reportGenerated: true },
          { id: "mi-3", status: "pending evaluation", overallRating: null, major: base.major, submittedAt: daysAgo360(2), reportGenerated: false },
        ],
      },
      sds: {
        attempts: 3,
        completed: 3,
        hollandCode: "RIA",
        items: [
          { id: "sds-1", hollandCode: "RIA", attemptNumber: 3, status: "completed", completedAt: daysAgo360(0) },
          { id: "sds-2", hollandCode: "RIE", attemptNumber: 2, status: "completed", completedAt: daysAgo360(45) },
          { id: "sds-3", hollandCode: "RIS", attemptNumber: 1, status: "completed", completedAt: daysAgo360(90) },
        ],
      },
      jobComparison: {
        comparisons: 3,
        completed: 2,
        items: [
          { id: "jc-1", jobAName: "Software Engineer", jobBName: "Data Analyst", scoreA: 82, scoreB: 68, winner: "A", status: "completed", createdAt: daysAgo360(3) },
          { id: "jc-2", jobAName: "Product Manager", jobBName: "UX Designer", scoreA: 71, scoreB: 75, winner: "B", status: "completed", createdAt: daysAgo360(18) },
          { id: "jc-3", jobAName: "DevOps Engineer", jobBName: "Backend Developer", scoreA: null, scoreB: null, winner: "—", status: "draft", createdAt: daysAgo360(1) },
        ],
      },
      gamification: {
        currentLevel: 4,
        totalPoints: 2840,
        accuracy: 87,
        sessionsCompleted: 12,
        badgesEarned: ["Bronze", "Silver", "Gold", "Platinum"],
        abilitiesUsed: { Skip: 4, FiftyFifty: 3, DoubleChance: 2, TimeFreeze: 5 },
      },
      resume: {
        uploads: 2,
        items: [
          { id: "rf-1", fileName: "cv_2026.pdf", uploadedAt: daysAgo360(5) },
          { id: "rf-2", fileName: "cv_draft.pdf", uploadedAt: daysAgo360(30) },
        ],
      },
      coverLetter: {
        uploads: 1,
        items: [{ id: "cl-1", fileName: "cover_letter.pdf", uploadedAt: daysAgo360(7) }],
      },
      chat: {
        sessions: 6,
        totalMessages: 94,
        items: [
          { id: "ch-1", messageCount: 18, lastMessageAt: daysAgo360(10) },
          { id: "ch-2", messageCount: 24, lastMessageAt: daysAgo360(25) },
        ],
      },
      jobMatching: {
        searches: 4,
        items: [
          { id: "jm-1", major: base.major, country: "Lebanon", resultsCount: 14, searchedAt: daysAgo360(14) },
          { id: "jm-2", major: base.major, country: "UAE", resultsCount: 22, searchedAt: daysAgo360(28) },
        ],
      },
    },
  };
}

export const MOCK_USER_360_PROFILES = {
  "u-demo": buildShowcaseProfile({
    userId: "u-demo",
    firstName: "Alex",
    lastName: "Morgan",
    email: "alex.morgan@demo.franc",
    faculty: "Engineering",
    major: "Computer Science",
    registeredAt: daysAgo360(180),
    lastActivityAt: daysAgo360(0),
    isDemo: true,
  }),
  "u-101": buildShowcaseProfile({
    userId: "u-101",
    firstName: "Rani",
    lastName: "Hijazi",
    email: "rani.h@example.com",
    faculty: "Engineering",
    major: "Computer Science",
    registeredAt: daysAgo360(120),
    lastActivityAt: daysAgo360(0),
  }),
  "u-102": {
    userId: "u-102",
    firstName: "John",
    lastName: "Doe",
    email: "john.d@example.com",
    faculty: "Business",
    major: "Finance",
    registeredAt: daysAgo360(90),
    lastActivityAt: daysAgo360(0),
    summary: {
      servicesUsed: 2,
      totalActivities: 12,
      completedActivities: 9,
      mostUsedServiceKey: SERVICE_KEYS.MOCK_INTERVIEW,
      mostUsedServiceName: serviceName(SERVICE_KEYS.MOCK_INTERVIEW),
      lastActiveAt: daysAgo360(0),
    },
    recentActivity: [
      { id: "j-1", userId: "u-102", userName: "John Doe", userEmail: "john.d@example.com", activityLabel: "Mock Interview Evaluated", serviceKey: SERVICE_KEYS.MOCK_INTERVIEW, serviceName: serviceName(SERVICE_KEYS.MOCK_INTERVIEW), result: "82%", status: "evaluated", occurredAt: daysAgo360(0) },
      { id: "j-2", userId: "u-102", userName: "John Doe", userEmail: "john.d@example.com", activityLabel: "Job Comparison Completed", serviceKey: SERVICE_KEYS.JOB_COMPARISON, serviceName: serviceName(SERVICE_KEYS.JOB_COMPARISON), result: "Job B wins", status: "completed", occurredAt: daysAgo360(4) },
    ],
    services: {
      mockInterview: {
        interviews: 2, attempts: 2, evaluated: 2, averageRating: 4.1, reportsGenerated: 1,
        items: [{ id: "mi-j1", status: "evaluated", overallRating: 4, major: "Finance", submittedAt: daysAgo360(0), reportGenerated: true }],
      },
      jobComparison: {
        comparisons: 2, completed: 1,
        items: [{ id: "jc-j1", jobAName: "Product Manager", jobBName: "Business Analyst", scoreA: 62, scoreB: 71, winner: "B", status: "completed", createdAt: daysAgo360(4) }],
      },
    },
  },
  "u-103": {
    userId: "u-103",
    firstName: "Sarah",
    lastName: "Chen",
    email: "sarah.c@example.com",
    faculty: "Arts",
    major: "Psychology",
    registeredAt: daysAgo360(60),
    lastActivityAt: daysAgo360(1),
    summary: {
      servicesUsed: 3, totalActivities: 18, completedActivities: 16,
      mostUsedServiceKey: SERVICE_KEYS.GAMIFICATION,
      mostUsedServiceName: serviceName(SERVICE_KEYS.GAMIFICATION),
      lastActiveAt: daysAgo360(1),
    },
    recentActivity: [
      { id: "s-1", userId: "u-103", userName: "Sarah Chen", userEmail: "sarah.c@example.com", activityLabel: "Completed Level 3", serviceKey: SERVICE_KEYS.GAMIFICATION, serviceName: serviceName(SERVICE_KEYS.GAMIFICATION), result: "Gold Badge", status: "completed", occurredAt: daysAgo360(1) },
      { id: "s-2", userId: "u-103", userName: "Sarah Chen", userEmail: "sarah.c@example.com", activityLabel: "Completed SDS", serviceKey: SERVICE_KEYS.SDS, serviceName: serviceName(SERVICE_KEYS.SDS), result: "AES", status: "completed", occurredAt: daysAgo360(8) },
    ],
    services: {
      sds: { attempts: 1, completed: 1, hollandCode: "AES", items: [{ id: "sds-s1", hollandCode: "AES", attemptNumber: 1, status: "completed", completedAt: daysAgo360(8) }] },
      gamification: { currentLevel: 3, totalPoints: 1580, accuracy: 79, sessionsCompleted: 7, badgesEarned: ["Bronze", "Silver", "Gold"], abilitiesUsed: { Skip: 3, FiftyFifty: 2, DoubleChance: 1, TimeFreeze: 2 } },
      resume: { uploads: 1, items: [{ id: "rf-s1", fileName: "sarah_resume.pdf", uploadedAt: daysAgo360(12) }] },
    },
  },
};

export const MOCK_PROFILE_CYCLE = ["u-demo", "u-101", "u-102", "u-103"];

export function getMockUser360Profile(mockProfileId, override = {}) {
  const template = MOCK_USER_360_PROFILES[mockProfileId] ?? MOCK_USER_360_PROFILES["u-demo"];
  if (!template) return null;
  const profile = JSON.parse(JSON.stringify(template));
  if (override.firstName) profile.firstName = override.firstName;
  if (override.lastName) profile.lastName = override.lastName;
  if (override.email) profile.email = override.email;
  if (override.userId) profile.userId = override.userId;
  if (override.faculty) profile.faculty = override.faculty;
  if (override.major) profile.major = override.major;
  return profile;
}

export function resolveMockProfileIdByEmail(email) {
  if (!email) return null;
  const normalized = email.toLowerCase();
  const entry = Object.entries(MOCK_USER_360_PROFILES).find(
    ([, p]) => p.email?.toLowerCase() === normalized
  );
  return entry?.[0] ?? null;
}

export function getMockProfileIdForIndex(index) {
  return MOCK_PROFILE_CYCLE[index % MOCK_PROFILE_CYCLE.length];
}

export function getDemoUserSummary() {
  const p = MOCK_USER_360_PROFILES["u-demo"];
  return {
    userId: "u-demo",
    firstName: p.firstName,
    lastName: p.lastName,
    email: p.email,
    faculty: p.faculty,
    major: p.major,
    servicesUsed: ALL_SERVICES,
    totalActivities: p.summary.totalActivities,
    completedActivities: p.summary.completedActivities,
    lastActivityAt: p.lastActivityAt,
    registeredAt: p.registeredAt,
    mockProfileId: "u-demo",
    isDemo: true,
  };
}
