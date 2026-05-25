/**
 * API Service - Centralized endpoint definitions
 * All API endpoints should be defined here and imported in other files
 */

// User/Auth endpoints
export const USER_ENDPOINTS = {
  SIGNUP: "/api/users/signup",
  SIGN_IN: "/api/users/sign-in",
  FORGOT_PASSWORD: "/api/users/forgot-password",
  RESET_PASSWORD: "/api/users/reset-password",
  VERIFY_CODE: "/api/users/verify-code",
  SEND_VERIFICATION_CODE: "/api/users/send-verification-code",
  GENERATE_TOKEN_BY_EMAIL: "/api/users/generate-token-by-email",
  SEND_PDF: "/api/users/send-pdf",
  SEND_MOCK_SUBMISSION_NOTIFICATION:
    "/api/users/send-mock-submission-notification",
  GET_ALL_USERS: "/api/users/get-all-users",
  ADD_USER: "/api/users/add-user",
  UPDATE_USER: (id) => `/api/users/update-user?id=${id}`,
  DELETE_USER: (id) => `/api/users/delete-user?id=${id}`,
  CAN_USER_PERFORM_ACTION: (userId, action) =>
    `/api/users/CanUserPerformAction?userId=${userId}&action=${action}`,
  GET_USER_INFO: "/api/users/GetUserInfo",
  GET_CHATS: "/api/users/chats",
};

// SDS (Self-Discovery System) endpoints
export const SDS_ENDPOINTS = {
  GET_SECTIONS: "/api/sds/get-sections",
  SUBMIT_RESPONSES: "/api/sds/submit-responses",
  GET_HOLLAND_POINTS: (userId) =>
    `/api/sds/get-holland-points?userId=${userId}`,
  GET_HOLLAND_POINTS_BY_ATTEMPT: (userId, attemptNumber) =>
    `/api/sds/get-holland-points-by-attempt?userId=${userId}&attemptNumber=${attemptNumber}`,
  GET_USER_RESPONSES: (userId) =>
    `/api/sds/get-user-responses?userId=${userId}`,
  DELETE_LAST_INCOMPLETE: (userId) =>
    `/api/sds/delete-last-incomplete?userId=${userId}`,
  GET_SDS_RESULTS: "/api/sds/SDSResults",
  /** Per-user SDS results (same row shape as SDSResults, scoped to userId) */
  GET_USER_SDS_RESULTS: (userId) =>
    `/api/sds/GetUserSDSResults?userId=${userId}`,
  SAVE_AI_FEEDBACK: "/api/sds/save-ai-feedback",
  // Admin endpoints (if needed)
  CREATE_SECTION: "/api/sds/create-section",
  CREATE_QUESTION: "/api/sds/create-question",
  CREATE_QUESTIONS: "/api/sds/create-questions",
  GET_QUESTIONS_BY_SECTION: (sectionId) =>
    `/api/sds/get-questions-by-section?sectionId=${sectionId}`,
  DELETE_QUESTION: (questionId) =>
    `/api/sds/delete-question?questionId=${questionId}`,
};

// Mock Interview/Evaluation endpoints
export const MOCK_INTERVIEW_ENDPOINTS = {
  CAN_DO_MOCK: (userId) => `/api/evaluation/can-do-mock?userId=${userId}`, // Deprecated - use USER_ENDPOINTS.CAN_USER_PERFORM_ACTION instead
  INCREASE_ATTEMPT: (userId) =>
    `/api/evaluation/increase-attempt?userId=${userId}`,
  EVALUATE: "/api/evaluation/evaluate",
  EVALUATE_MULTIPLE: "/api/evaluation/evaluate-multiple",
  /** Merged mock answers + EvaluateQuestion rows (partial saves show nulls until graded) */
  GET_EVALUATIONS_BY_MOCK_INTERVIEW_ID: (mockInterviewId) =>
    `/api/evaluation/GetEvaluationsByMockInterviewId?mockInterviewId=${mockInterviewId}`,
  CREATE_REPORT: "/api/evaluation/create-report",
  /** Completed mock interview evaluation reports for a user */
  GET_USER_INTERVIEW_REPORTS: (userId) =>
    `/api/evaluation/GetUserInterviewsReports?userId=${userId}`,
};

// User Action Types (matches backend UserActionType enum)
export const USER_ACTION_TYPES = {
  MOCK_INTERVIEW: "MockInterview",
  SDS: "SDS",
  RESUME: "Resume",
  COVER_LETTER: "CoverLetter",
};

// Blob Storage endpoints
export const BLOB_STORAGE_ENDPOINTS = {
  GET_RANDOM_QUESTIONS: "/api/blob/get-random-questions",
  UPLOAD_MOCK_INTERVIEW: "/api/blob/upload-mock-interview",
  GET_ALL_GROUPED: "/api/blob/get-all-grouped",
  GET_FACULTIES: "/api/blob/get-faculties",
  GET_MAJORS: "/api/blob/get-majors",
  UPLOAD_FILE: "/api/blob/upload-file",
  GET_ADMIN_FILES: "/api/blob/get-admin-files",
  /** Per-user resume/cover files (same item shape as get-admin-files) */
  GET_USER_FILES: (userId) => `/api/blob/GetUserFiles?userId=${userId}`,
  // Admin endpoints (if needed)
  CREATE_QUESTION: "/api/blob/create-question",
  CREATE_QUESTIONS: "/api/blob/create-questions",
  CREATE_MAJOR: "/api/blob/create-major",
  DELETE_QUESTION: (id) => `/api/blob/delete-question/${id}`,
  EDIT_QUESTION_TITLE: (id) => `/api/blob/edit-question-title/${id}`,
};

// AI endpoints (use base: "ai" when calling)
export const AI_ENDPOINTS = {
  ASK: "/ask",
  SUGGEST_BY_CODE: "/suggest-by-code",
  GET_OCCUPATIONS_OR_EDUCATIONS_FOR_CODE:
    "/get-occupations-or-educations-for-code",
};

// Job Comparison endpoints
export const JOB_COMPARISON_ENDPOINTS = {
  GET_CRITERIA: "/api/jobcomparison/criteria",
  CHECK_INCOMPLETE: "/api/jobcomparison/check",
  SAVE_COMPARISON: "/api/jobcomparison/save",
  GET_COMPARISON: (id) => `/api/jobcomparison/${id}`,
  GET_ALL_COMPARISONS: "/api/jobcomparison",
  GET_ALL_BY_USER_ID: (userId) =>
    `/api/jobcomparison/GetAllJobComparisonsByUserId?userId=${userId}`,
  DELETE_COMPARISON: (id) => `/api/jobcomparison/${id}`,
  EXPORT_EXCEL: (id) => `/api/jobcomparison/${id}/export-excel`,
};

// Job Matching endpoints (use base: "ai" when calling)
export const JOB_MATCHING_ENDPOINTS = {
  MAJOR_SKILLS: "/jobmatching/major_skills",
  SEARCH_OPPORTUNITIES: "/jobmatching/search_opportunities",
};

// Gamification quiz (JWT-protected, default API base)
export const GAME_ENDPOINTS = {
  PROGRESS: "/api/game/progress",
  /** Start a run — body e.g. { levelNumber } */
  START: "/api/game/start",
  SESSION: (sessionId) =>
    `/api/game/session/${encodeURIComponent(String(sessionId))}`,
  /** Body: { selectedOption: "A"|"B"|"C"|"D" } and/or { timedOut: true } if API supports it */
  ANSWER: (sessionId, answerId) =>
    `/api/game/session/${encodeURIComponent(String(sessionId))}/answer/${encodeURIComponent(String(answerId))}`,
  ABILITY: (sessionId, answerId) =>
    `/api/game/session/${encodeURIComponent(String(sessionId))}/ability/${encodeURIComponent(String(answerId))}`,
  FINISH: (sessionId) =>
    `/api/game/session/${encodeURIComponent(String(sessionId))}/finish`,
  /** All question justifications / hints for the session (for correct-answer UI). */
  SESSION_HINTS: (sessionId) =>
    `/api/game/session/${encodeURIComponent(String(sessionId))}/hints`,
  /** Admin: bulk import questions */
  QUESTIONS_IMPORT: "/api/game/questions/import",
};


