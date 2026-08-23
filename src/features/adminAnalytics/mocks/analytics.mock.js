/**
 * Temporary mock analytics data.
 * TODO: Replace with analytics endpoints — see FRANC_ANALYTICS_BACKEND_REQUIREMENTS.md
 */

import { SERVICE_KEYS } from "../constants/serviceRegistry";
import {
  getDemoUserSummary,
  getMockUser360Profile,
  resolveMockProfileIdByEmail,
  getMockProfileIdForIndex,
} from "./user360.mock";

const now = new Date();
const daysAgo = (n) => {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

/** @returns {import('../types/analytics.types').AnalyticsOverview} */
export function getMockOverview() {
  return {
    totalUsers: 1248,
    activeUsers: 412,
    totalActivities: 5830,
    completedActivities: 4215,
    completionRate: 72.3,
    mostUsedService: {
      serviceKey: SERVICE_KEYS.SDS,
      serviceName: "Personality Test (SDS)",
      activityCount: 1580,
    },
    serviceUsage: [
      { serviceKey: SERVICE_KEYS.SDS, serviceName: "Personality Test (SDS)", uniqueUsers: 380, activities: 1580, completed: 1240, completionRate: 78.5, activitySharePercent: 27.1 },
      { serviceKey: SERVICE_KEYS.MOCK_INTERVIEW, serviceName: "Mock Interview", uniqueUsers: 210, activities: 980, completed: 620, completionRate: 63.3, activitySharePercent: 16.8 },
      { serviceKey: SERVICE_KEYS.GAMIFICATION, serviceName: "Career Quest", uniqueUsers: 295, activities: 1120, completed: 890, completionRate: 79.5, activitySharePercent: 19.2 },
      { serviceKey: SERVICE_KEYS.JOB_COMPARISON, serviceName: "Job Comparison", uniqueUsers: 145, activities: 520, completed: 410, completionRate: 78.8, activitySharePercent: 8.9 },
      { serviceKey: SERVICE_KEYS.RESUME, serviceName: "Resume Feedback", uniqueUsers: 320, activities: 680, completed: 680, completionRate: 100, activitySharePercent: 11.7 },
      { serviceKey: SERVICE_KEYS.COVER_LETTER, serviceName: "Cover Letter Feedback", uniqueUsers: 180, activities: 340, completed: 340, completionRate: 100, activitySharePercent: 5.8 },
      { serviceKey: SERVICE_KEYS.CHAT, serviceName: "Franc Chatbot", uniqueUsers: 260, activities: 420, completed: 0, completionRate: 0, activitySharePercent: 7.2 },
      { serviceKey: SERVICE_KEYS.JOB_MATCHING, serviceName: "Job Matching", uniqueUsers: 190, activities: 190, completed: 35, completionRate: 18.4, activitySharePercent: 3.3 },
    ],
  };
}

/** @returns {import('../types/analytics.types').ActivityTrendPoint[]} */
export function getMockActivityTrend(groupBy = "daily") {
  const points = [];
  const count = groupBy === "monthly" ? 6 : groupBy === "weekly" ? 8 : 30;
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    if (groupBy === "monthly") d.setMonth(d.getMonth() - i);
    else if (groupBy === "weekly") d.setDate(d.getDate() - i * 7);
    else d.setDate(d.getDate() - i);
    const label =
      groupBy === "monthly"
        ? d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
        : groupBy === "weekly"
          ? `W${Math.ceil(d.getDate() / 7)} ${d.toLocaleDateString("en-US", { month: "short" })}`
          : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    points.push({
      date: d.toISOString(),
      label,
      activeUsers: 80 + Math.floor(Math.random() * 60) + (count - i) * 2,
      activities: 120 + Math.floor(Math.random() * 80) + (count - i) * 3,
      completed: 90 + Math.floor(Math.random() * 60) + (count - i) * 2,
    });
  }
  return points;
}

/** @returns {import('../types/analytics.types').RecentActivityItem[]} */
export function getMockRecentActivity() {
  return [
    { id: "ra-1", userId: "u-101", userName: "Rani Hijazi", userEmail: "rani.h@example.com", activityLabel: "Completed SDS", serviceKey: SERVICE_KEYS.SDS, serviceName: "Personality Test (SDS)", result: "RIA", status: "completed", occurredAt: daysAgo(0) },
    { id: "ra-2", userId: "u-102", userName: "John Doe", userEmail: "john.d@example.com", activityLabel: "Mock Interview Evaluated", serviceKey: SERVICE_KEYS.MOCK_INTERVIEW, serviceName: "Mock Interview", result: "82%", status: "evaluated", occurredAt: daysAgo(0) },
    { id: "ra-3", userId: "u-103", userName: "Sarah Chen", userEmail: "sarah.c@example.com", activityLabel: "Completed Level 3", serviceKey: SERVICE_KEYS.GAMIFICATION, serviceName: "Career Quest", result: "Gold Badge", status: "completed", occurredAt: daysAgo(1) },
    { id: "ra-4", userId: "u-104", userName: "Ahmed Hassan", userEmail: "ahmed.h@example.com", activityLabel: "Job Comparison Completed", serviceKey: SERVICE_KEYS.JOB_COMPARISON, serviceName: "Job Comparison", result: "Job A wins", status: "completed", occurredAt: daysAgo(1) },
    { id: "ra-5", userId: "u-105", userName: "Maria Garcia", userEmail: "maria.g@example.com", activityLabel: "Resume Evaluated", serviceKey: SERVICE_KEYS.RESUME, serviceName: "Resume Feedback", result: "AI feedback", status: "completed", occurredAt: daysAgo(2) },
    { id: "ra-6", userId: "u-106", userName: "Tom Wilson", userEmail: "tom.w@example.com", activityLabel: "Started Mock Interview", serviceKey: SERVICE_KEYS.MOCK_INTERVIEW, serviceName: "Mock Interview", result: null, status: "in progress", occurredAt: daysAgo(2) },
    { id: "ra-7", userId: "u-107", userName: "Lisa Park", userEmail: "lisa.p@example.com", activityLabel: "Chat Session", serviceKey: SERVICE_KEYS.CHAT, serviceName: "Franc Chatbot", result: "12 messages", status: "completed", occurredAt: daysAgo(3) },
    { id: "ra-8", userId: "u-108", userName: "David Kim", userEmail: "david.k@example.com", activityLabel: "Job Matching Search", serviceKey: SERVICE_KEYS.JOB_MATCHING, serviceName: "Job Matching", result: "8 jobs found", status: "completed", occurredAt: daysAgo(3) },
  ];
}

/** @returns {import('../types/analytics.types').UserSummaryItem[]} */
export function getMockUserSummaries() {
  return [
    getDemoUserSummary(),
    { userId: "u-101", firstName: "Rani", lastName: "Hijazi", email: "rani.h@example.com", faculty: "Engineering", major: "Computer Science", servicesUsed: [SERVICE_KEYS.SDS, SERVICE_KEYS.MOCK_INTERVIEW, SERVICE_KEYS.GAMIFICATION, SERVICE_KEYS.JOB_COMPARISON, SERVICE_KEYS.RESUME, SERVICE_KEYS.COVER_LETTER, SERVICE_KEYS.CHAT, SERVICE_KEYS.JOB_MATCHING], totalActivities: 42, completedActivities: 38, lastActivityAt: daysAgo(0), registeredAt: daysAgo(120), mockProfileId: "u-101" },
    { userId: "u-102", firstName: "John", lastName: "Doe", email: "john.d@example.com", faculty: "Business", major: "Finance", servicesUsed: [SERVICE_KEYS.MOCK_INTERVIEW, SERVICE_KEYS.JOB_COMPARISON], totalActivities: 12, completedActivities: 9, lastActivityAt: daysAgo(0), registeredAt: daysAgo(90), mockProfileId: "u-102" },
    { userId: "u-103", firstName: "Sarah", lastName: "Chen", email: "sarah.c@example.com", faculty: "Arts", major: "Psychology", servicesUsed: [SERVICE_KEYS.SDS, SERVICE_KEYS.GAMIFICATION, SERVICE_KEYS.RESUME], totalActivities: 18, completedActivities: 16, lastActivityAt: daysAgo(1), registeredAt: daysAgo(60), mockProfileId: "u-103" },
    { userId: "u-104", firstName: "Ahmed", lastName: "Hassan", email: "ahmed.h@example.com", faculty: "Engineering", major: "Mechanical", servicesUsed: [SERVICE_KEYS.JOB_COMPARISON, SERVICE_KEYS.COVER_LETTER], totalActivities: 8, completedActivities: 6, lastActivityAt: daysAgo(1), registeredAt: daysAgo(45), mockProfileId: "u-demo" },
    { userId: "u-105", firstName: "Maria", lastName: "Garcia", email: "maria.g@example.com", faculty: "Science", major: "Biology", servicesUsed: [SERVICE_KEYS.RESUME, SERVICE_KEYS.SDS], totalActivities: 6, completedActivities: 6, lastActivityAt: daysAgo(2), registeredAt: daysAgo(30), mockProfileId: "u-demo" },
    { userId: "u-106", firstName: "Tom", lastName: "Wilson", email: "tom.w@example.com", faculty: "Engineering", major: "Electrical", servicesUsed: [SERVICE_KEYS.MOCK_INTERVIEW], totalActivities: 3, completedActivities: 1, lastActivityAt: daysAgo(2), registeredAt: daysAgo(15), mockProfileId: "u-demo" },
    { userId: "u-107", firstName: "Lisa", lastName: "Park", email: "lisa.p@example.com", faculty: "Business", major: "Marketing", servicesUsed: [SERVICE_KEYS.CHAT, SERVICE_KEYS.JOB_MATCHING], totalActivities: 10, completedActivities: 7, lastActivityAt: daysAgo(3), registeredAt: daysAgo(75), mockProfileId: "u-demo" },
    { userId: "u-108", firstName: "David", lastName: "Kim", email: "david.k@example.com", faculty: "Engineering", major: "Software", servicesUsed: [SERVICE_KEYS.JOB_MATCHING, SERVICE_KEYS.GAMIFICATION], totalActivities: 14, completedActivities: 11, lastActivityAt: daysAgo(3), registeredAt: daysAgo(100), mockProfileId: "u-demo" },
  ];
}

/** @param {string} mockProfileId @param {object} [override] */
export function getMockUserProfile(mockProfileId, override = {}) {
  return getMockUser360Profile(mockProfileId, override);
}

export { resolveMockProfileIdByEmail, getMockProfileIdForIndex };

/** @returns {import('../types/analytics.types').MockInterviewAnalytics} */
export function getMockMockInterviewAnalytics() {
  return {
    started: 980,
    completed: 720,
    evaluated: 620,
    reportsGenerated: 480,
    uniqueUsers: 210,
    averageOverallRating: 3.8,
    evaluationDistribution: [
      { label: "1 - Needs improvement", count: 42 },
      { label: "2 - Below average", count: 68 },
      { label: "3 - Average", count: 145 },
      { label: "4 - Good", count: 210 },
      { label: "5 - Excellent", count: 155 },
    ],
    attemptDistribution: [
      { label: "Attempt 1", count: 520 },
      { label: "Attempt 2", count: 280 },
      { label: "Attempt 3+", count: 180 },
    ],
    questionPerformance: [
      { questionId: "q-1", questionTitle: "Tell me about yourself", averageRating: 4.2, answerCount: 580 },
      { questionId: "q-2", questionTitle: "Why this major?", averageRating: 3.9, answerCount: 560 },
      { questionId: "q-3", questionTitle: "Describe a challenge", averageRating: 3.4, answerCount: 540 },
      { questionId: "q-4", questionTitle: "Where do you see yourself?", averageRating: 3.6, answerCount: 520 },
      { questionId: "q-5", questionTitle: "Questions for us?", averageRating: 4.0, answerCount: 500 },
    ],
    recentInterviews: [
      { id: "mi-r1", userName: "John Doe", email: "john.d@example.com", major: "Finance", status: "evaluated", overallRating: 4, reportGenerated: true, submittedAt: daysAgo(0) },
      { id: "mi-r2", userName: "Tom Wilson", email: "tom.w@example.com", major: "Electrical", status: "pending evaluation", overallRating: null, reportGenerated: false, submittedAt: daysAgo(2) },
      { id: "mi-r3", userName: "Rani Hijazi", email: "rani.h@example.com", major: "Computer Science", status: "evaluated", overallRating: 5, reportGenerated: true, submittedAt: daysAgo(5) },
    ],
  };
}

/** @returns {import('../types/analytics.types').SdsAnalytics} */
export function getMockSdsAnalytics() {
  return {
    started: 1680,
    completed: 1240,
    drafts: 180,
    completionRate: 73.8,
    uniqueUsers: 380,
    resultDistribution: [
      { hollandCode: "RIA", count: 185 },
      { hollandCode: "SEC", count: 162 },
      { hollandCode: "AES", count: 148 },
      { hollandCode: "IRC", count: 132 },
      { hollandCode: "SAE", count: 118 },
      { hollandCode: "Other", count: 495 },
    ],
    attemptDistribution: [
      { attemptNumber: 1, count: 920 },
      { attemptNumber: 2, count: 240 },
      { attemptNumber: 3, count: 80 },
    ],
    mostCommonHollandCode: "RIA",
    recentCompletions: [
      { id: "sds-r1", userName: "Rani Hijazi", email: "rani.h@example.com", hollandCode: "RIA", attemptNumber: 2, completedAt: daysAgo(0) },
      { id: "sds-r2", userName: "Sarah Chen", email: "sarah.c@example.com", hollandCode: "AES", attemptNumber: 1, completedAt: daysAgo(3) },
      { id: "sds-r3", userName: "Maria Garcia", email: "maria.g@example.com", hollandCode: "SEC", attemptNumber: 1, completedAt: daysAgo(5) },
    ],
  };
}

/** @returns {import('../types/analytics.types').JobComparisonAnalytics} */
export function getMockJobComparisonAnalytics() {
  return {
    totalComparisons: 520,
    completedComparisons: 410,
    draftComparisons: 110,
    uniqueUsers: 145,
    completionRate: 78.8,
    mostComparedJobs: [
      { jobName: "Software Engineer", count: 85 },
      { jobName: "Data Analyst", count: 72 },
      { jobName: "Product Manager", count: 58 },
      { jobName: "Marketing Specialist", count: 45 },
    ],
    topJobPairs: [
      { jobA: "Software Engineer", jobB: "Data Analyst", count: 42 },
      { jobA: "Product Manager", jobB: "Business Analyst", count: 28 },
      { jobA: "Marketing Specialist", jobB: "Sales Manager", count: 22 },
    ],
    winnerDistribution: [
      { winner: "A", count: 185 },
      { winner: "B", count: 168 },
      { winner: "Tie", count: 57 },
    ],
    headVsHeart: [
      { category: "HEAD", jobAWins: 120, jobBWins: 98, ties: 32 },
      { category: "HEART", jobAWins: 65, jobBWins: 70, ties: 25 },
    ],
    recentComparisons: [
      { id: "jc-r1", userName: "Ahmed Hassan", email: "ahmed.h@example.com", jobAName: "Software Engineer", jobBName: "Data Analyst", scoreA: 78, scoreB: 65, winner: "A", status: "completed", createdAt: daysAgo(1) },
      { id: "jc-r2", userName: "John Doe", email: "john.d@example.com", jobAName: "Product Manager", jobBName: "Business Analyst", scoreA: 62, scoreB: 71, winner: "B", status: "completed", createdAt: daysAgo(4) },
    ],
  };
}

/** @returns {import('../types/analytics.types').GamificationAnalytics} */
export function getMockGamificationAnalytics() {
  return {
    totalPlayers: 295,
    gameSessions: 1120,
    questionsAnswered: 8400,
    correctAnswers: 6720,
    incorrectAnswers: 1680,
    accuracyRate: 80,
    averageScore: 74.5,
    levelProgression: [
      { levelNumber: 1, levelName: "Applicant", started: 1120, completed: 980, dropOffRate: 12.5 },
      { levelNumber: 2, levelName: "Candidate", started: 980, completed: 820, dropOffRate: 16.3 },
      { levelNumber: 3, levelName: "Interviewee", started: 820, completed: 640, dropOffRate: 22.0 },
      { levelNumber: 4, levelName: "Finalist", started: 640, completed: 420, dropOffRate: 34.4 },
      { levelNumber: 5, levelName: "Employee", started: 420, completed: 280, dropOffRate: 33.3 },
    ],
    abilityUsage: [
      { ability: "Skip", usageCount: 420 },
      { ability: "FiftyFifty", usageCount: 380 },
      { ability: "DoubleChance", usageCount: 210 },
      { ability: "TimeFreeze", usageCount: 290 },
    ],
    timeoutCount: 340,
    hardestQuestions: [
      { questionId: "gq-12", questionText: "What is the STAR method used for?", incorrectRate: 48, timesAnswered: 520 },
      { questionId: "gq-28", questionText: "Which skill is most valued in teamwork?", incorrectRate: 42, timesAnswered: 480 },
    ],
    easiestQuestions: [
      { questionId: "gq-3", questionText: "What does CV stand for?", correctRate: 95, timesAnswered: 890 },
      { questionId: "gq-7", questionText: "What is a cover letter?", correctRate: 92, timesAnswered: 860 },
    ],
  };
}

/** @returns {import('../types/analytics.types').ResumeAnalytics} */
export function getMockResumeAnalytics() {
  return {
    uploads: 680,
    uniqueUsers: 320,
    recentUploads: [
      { id: "rf-r1", userName: "Maria Garcia", email: "maria.g@example.com", fileName: "maria_cv.pdf", uploadedAt: daysAgo(2) },
      { id: "rf-r2", userName: "Sarah Chen", email: "sarah.c@example.com", fileName: "sarah_resume.pdf", uploadedAt: daysAgo(5) },
    ],
  };
}

/** @returns {import('../types/analytics.types').CoverLetterAnalytics} */
export function getMockCoverLetterAnalytics() {
  return {
    uploads: 340,
    uniqueUsers: 180,
    recentUploads: [
      { id: "cl-r1", userName: "Ahmed Hassan", email: "ahmed.h@example.com", fileName: "cover_letter.pdf", uploadedAt: daysAgo(1) },
    ],
  };
}

/** @returns {import('../types/analytics.types').ChatAnalytics} */
export function getMockChatAnalytics() {
  return {
    totalSessions: 420,
    uniqueUsers: 260,
    totalMessages: 3840,
    averageMessagesPerSession: 9.1,
    recentSessions: [
      { id: "ch-r1", userName: "Lisa Park", email: "lisa.p@example.com", messageCount: 12, lastMessageAt: daysAgo(3) },
      { id: "ch-r2", userName: "David Kim", email: "david.k@example.com", messageCount: 8, lastMessageAt: daysAgo(6) },
    ],
  };
}

/** @returns {import('../types/analytics.types').JobMatchingAnalytics} */
export function getMockJobMatchingAnalytics() {
  return {
    totalSearches: 190,
    uniqueUsers: 190,
    topMajors: [
      { major: "Computer Science", count: 45 },
      { major: "Marketing", count: 32 },
      { major: "Finance", count: 28 },
    ],
    topCountries: [
      { country: "Lebanon", count: 85 },
      { country: "UAE", count: 42 },
      { country: "Saudi Arabia", count: 28 },
    ],
    recentSearches: [
      { id: "jm-r1", userName: "David Kim", email: "david.k@example.com", major: "Software", country: "Lebanon", resultsCount: 8, searchedAt: daysAgo(3) },
      { id: "jm-r2", userName: "Lisa Park", email: "lisa.p@example.com", major: "Marketing", country: "UAE", resultsCount: 12, searchedAt: daysAgo(5) },
    ],
  };
}

/** @param {string} serviceKey */
export function getMockServiceAnalytics(serviceKey) {
  switch (serviceKey) {
    case SERVICE_KEYS.MOCK_INTERVIEW:
      return getMockMockInterviewAnalytics();
    case SERVICE_KEYS.SDS:
      return getMockSdsAnalytics();
    case SERVICE_KEYS.JOB_COMPARISON:
      return getMockJobComparisonAnalytics();
    case SERVICE_KEYS.GAMIFICATION:
      return getMockGamificationAnalytics();
    case SERVICE_KEYS.RESUME:
      return getMockResumeAnalytics();
    case SERVICE_KEYS.COVER_LETTER:
      return getMockCoverLetterAnalytics();
    case SERVICE_KEYS.CHAT:
      return getMockChatAnalytics();
    case SERVICE_KEYS.JOB_MATCHING:
      return getMockJobMatchingAnalytics();
    default:
      return null;
  }
}
