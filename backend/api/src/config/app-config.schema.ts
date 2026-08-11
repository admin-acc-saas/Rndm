/**
 * Typed environment configuration for the RNDM backend.
 *
 * Secrets are kept in this interface but NEVER exposed to clients. The
 * service-role key, in particular, must only be used server-side.
 */
export interface AppConfig {
  app: {
    nodeEnv: string;
    port: number;
    apiBaseUrl: string;
    webAppUrl: string;
    corsOrigins: string[];
  };
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
}

export type AppConfigValidationResult =
  | { ok: true; config: AppConfig }
  | { ok: false; error: string };

/**
 * Read a string env value with a fallback.
 */
function str(
  raw: Record<string, unknown>,
  key: string,
  fallback?: string,
): string {
  const value = raw[key];
  if (typeof value === "string" && value.length > 0) return value;
  if (fallback !== undefined) return fallback;
  return "";
}

/**
 * Read a numeric env value.
 */
function num(
  raw: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const value = raw[key];
  if (typeof value !== "string" || value.length === 0) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Parse a comma-separated list of origins into a clean array.
 */
function list(raw: Record<string, unknown>, key: string, fallback: string[]): string[] {
  const value = raw[key];
  if (typeof value !== "string" || value.length === 0) return fallback;
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/**
 * Validate the raw environment and return a typed {@link AppConfig}.
 *
 * Validation is intentionally dependency-free so the backend does not pull
 * in a schema library solely for this. Required secrets (Supabase URL and
 * keys) are checked; if absent the app fails fast with a clear message rather
 * than running in a broken state.
 */
export function appConfigValidationSchema(
  raw: Record<string, unknown>,
): AppConfigValidationResult {
  const config: AppConfig = {
    app: {
      nodeEnv: str(raw, "NODE_ENV", "development"),
      port: num(raw, "PORT", 3001),
      apiBaseUrl: str(raw, "API_BASE_URL", "http://localhost:3001"),
      webAppUrl: str(raw, "WEB_APP_URL", "http://localhost:3000"),
      corsOrigins: list(raw, "CORS_ORIGINS", [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ]),
    },
    supabase: {
      url: str(raw, "SUPABASE_URL"),
      anonKey: str(raw, "SUPABASE_ANON_KEY"),
      serviceRoleKey: str(raw, "SUPABASE_SERVICE_ROLE_KEY"),
    },
  };

  const missing: string[] = [];
  if (!config.supabase.url) missing.push("SUPABASE_URL");
  if (!config.supabase.anonKey) missing.push("SUPABASE_ANON_KEY");
  if (!config.supabase.serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  // In test environments the backend must boot without real Supabase
  // credentials so unit/integration tests can run. In production, missing
  // Supabase config is a fatal boot error.
  const isTest = config.app.nodeEnv === "test" || Boolean(raw["JEST_WORKER_ID"]);
  if (missing.length > 0 && !isTest) {
    return {
      ok: false,
      error: `Missing required environment variables: ${missing.join(", ")}. Copy .env.example to .env and fill in real values.`,
    };
  }

  // Reject wildcard CORS in production to avoid unrestricted cross-origin
  // access. Per-origin configuration is required for deployed environments.
  if (
    config.app.nodeEnv === "production" &&
    config.app.corsOrigins.includes("*")
  ) {
    return {
      ok: false,
      error:
        "CORS_ORIGINS must not include '*' in production. Configure explicit origins.",
    };
  }

  return { ok: true, config };
}
