/**
 * API Service - Centralized endpoint definitions
 * All API endpoints should be defined here and imported in other files
 */

// User/Auth endpoints
export const USER_ENDPOINTS = {
  SIGNUP: '/api/users/signup',
  SIGN_IN: '/api/users/sign-in',
  FORGOT_PASSWORD: '/api/users/forgot-password',
  RESET_PASSWORD: '/api/users/reset-password',
  VERIFY_CODE: '/api/users/verify-code',
  SEND_PDF: '/api/users/send-pdf',
  SEND_MOCK_SUBMISSION_NOTIFICATION: '/api/users/send-mock-submission-notification',
  GET_ALL_USERS: '/api/users/get-all-users',
  ADD_USER: '/api/users/add-user',
  UPDATE_USER: (id) => `/api/users/update-user?id=${id}`,
  DELETE_USER: (id) => `/api/users/delete-user?id=${id}`,
  CAN_USER_PERFORM_ACTION: (userId, action) => `/api/users/CanUserPerformAction?userId=${userId}&action=${action}`,
};

// SDS (Self-Discovery System) endpoints
export const SDS_ENDPOINTS = {
  GET_SECTIONS: '/api/sds/get-sections',
  SUBMIT_RESPONSES: '/api/sds/submit-responses',
  GET_HOLLAND_POINTS: (userId) => `/api/sds/get-holland-points?userId=${userId}`,
  GET_HOLLAND_POINTS_BY_ATTEMPT: (userId, attemptNumber) => `/api/sds/get-holland-points-by-attempt?userId=${userId}&attemptNumber=${attemptNumber}`,
  GET_USER_RESPONSES: (userId) => `/api/sds/get-user-responses?userId=${userId}`,
  GET_SDS_RESULTS: '/api/sds/SDSResults',
  SAVE_AI_FEEDBACK: '/api/sds/save-ai-feedback',
  // Admin endpoints (if needed)
  CREATE_SECTION: '/api/sds/create-section',
  CREATE_QUESTION: '/api/sds/create-question',
  CREATE_QUESTIONS: '/api/sds/create-questions',
  GET_QUESTIONS_BY_SECTION: (sectionId) => `/api/sds/get-questions-by-section?sectionId=${sectionId}`,
  DELETE_QUESTION: (questionId) => `/api/sds/delete-question?questionId=${questionId}`,
};

// Mock Interview/Evaluation endpoints
export const MOCK_INTERVIEW_ENDPOINTS = {
  CAN_DO_MOCK: (userId) => `/api/evaluation/can-do-mock?userId=${userId}`, // Deprecated - use USER_ENDPOINTS.CAN_USER_PERFORM_ACTION instead
  INCREASE_ATTEMPT: (userId) => `/api/evaluation/increase-attempt?userId=${userId}`,
  EVALUATE: '/api/evaluation/evaluate',
  EVALUATE_MULTIPLE: '/api/evaluation/evaluate-multiple',
  CREATE_REPORT: '/api/evaluation/create-report',
};

// User Action Types (matches backend UserActionType enum)
export const USER_ACTION_TYPES = {
  MOCK_INTERVIEW: 'MockInterview',
  SDS: 'SDS',
  RESUME: 'Resume',
  COVER_LETTER: 'CoverLetter',
};

// Blob Storage endpoints
export const BLOB_STORAGE_ENDPOINTS = {
  GET_RANDOM_QUESTIONS: '/api/blob/get-random-questions',
  UPLOAD_MOCK_INTERVIEW: '/api/blob/upload-mock-interview',
  GET_ALL_GROUPED: '/api/blob/get-all-grouped',
  GET_FACULTIES: '/api/blob/get-faculties',
  GET_MAJORS: '/api/blob/get-majors',
  UPLOAD_FILE: '/api/blob/upload-file',
  // Admin endpoints (if needed)
  CREATE_QUESTION: '/api/blob/create-question',
  CREATE_QUESTIONS: '/api/blob/create-questions',
  CREATE_MAJOR: '/api/blob/create-major',
  DELETE_QUESTION: (id) => `/api/blob/delete-question/${id}`,
  EDIT_QUESTION_TITLE: (id) => `/api/blob/edit-question-title/${id}`,
};

// AI endpoints (use base: "ai" when calling)
export const AI_ENDPOINTS = {
  ASK: '/ask',
  SUGGEST_BY_CODE: '/suggest-by-code',
};

