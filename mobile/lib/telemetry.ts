import * as Sentry from '@sentry/react-native';
import PostHog from 'posthog-react-native';

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

export const sentryEnabled = Boolean(sentryDsn);
export const posthogEnabled = Boolean(posthogKey);

export let posthog: PostHog | null = null;

/**
 * Ambas herramientas son opcionales: si falta la clave, la app funciona igual
 * sin telemetría. Así el proyecto sigue clonable sin cuentas de terceros.
 */
export function initTelemetry() {
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      // En desarrollo los errores ya se ven en consola; mandarlos gasta cuota.
      enabled: !__DEV__,
      tracesSampleRate: 0.2,
    });
  }

  if (posthogKey) {
    posthog = new PostHog(posthogKey, { host: posthogHost });
  }
}

/** Asocia los eventos y errores al usuario logueado. */
export function identifyUser(userId: string, email?: string) {
  if (sentryEnabled) {
    Sentry.setUser({ id: userId, email });
  }
  posthog?.identify(userId, email ? { email } : undefined);
}

export function clearUser() {
  if (sentryEnabled) {
    Sentry.setUser(null);
  }
  posthog?.reset();
}

/** Los valores tienen que ser serializables a JSON: PostHog los rechaza si no. */
type EventProperties = Record<string, string | number | boolean | null>;

export function track(event: string, properties?: EventProperties) {
  posthog?.capture(event, properties);
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (sentryEnabled) {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  }
}
