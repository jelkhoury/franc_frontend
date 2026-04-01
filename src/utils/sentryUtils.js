import * as Sentry from "@sentry/react";

/**
 * Report an error to Sentry once per error instance (avoids duplicate events when
 * multiple catch blocks handle the same rethrown error).
 */
export function captureError(error, extra) {
  if (!error) return;
  if (error.__sentryCaptured) return;
  error.__sentryCaptured = true;
  if (!process.env.REACT_APP_SENTRY_DSN) return;
  Sentry.captureException(error, extra ? { extra } : undefined);
}
