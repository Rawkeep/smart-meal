/**
 * Optional error monitoring (Sentry).
 *
 * Completely inert unless a DSN is provided via the VITE_SENTRY_DSN build env.
 * Sentry is loaded dynamically so it adds nothing to the main bundle when
 * monitoring is disabled. No PII is collected; the app stores user data only
 * in localStorage and never sends it anywhere but the recipe AI.
 */
export async function initMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  try {
    const Sentry = await import("@sentry/react");
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      release: import.meta.env.VITE_APP_VERSION || undefined,
      // Conservative sampling — this is a small app, not a high-traffic API.
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      // Don't attach IPs or user identifiers.
      sendDefaultPii: false,
    });
  } catch {
    // Monitoring is best-effort and must never break the app.
  }
}
