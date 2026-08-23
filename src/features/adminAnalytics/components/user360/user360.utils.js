/** Maps profile.services object keys to service registry keys */
export const PROFILE_SERVICE_MAP = {
  mockInterview: "mockInterview",
  sds: "sds",
  jobComparison: "jobComparison",
  gamification: "gamification",
  resume: "resume",
  coverLetter: "coverLetter",
  chat: "chat",
  jobMatching: "jobMatching",
};

export function getActiveProfileServices(services = {}) {
  return Object.entries(PROFILE_SERVICE_MAP)
    .filter(([profileKey]) => services[profileKey] != null)
    .map(([profileKey, registryKey]) => ({ profileKey, registryKey }));
}

export function getInitials(firstName, lastName) {
  const a = (firstName || "").trim()[0] || "";
  const b = (lastName || "").trim()[0] || "";
  return (a + b).toUpperCase() || "?";
}

export function getCompletionPercent(summary) {
  if (!summary?.totalActivities) return 0;
  return Math.round((summary.completedActivities / summary.totalActivities) * 100);
}
