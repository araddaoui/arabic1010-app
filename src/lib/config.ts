const env = import.meta.env;
const productionFlag = env.VITE_ENABLE_PRODUCTION_SERVICES === "true";

const reviewerEmails = (env.VITE_REVIEWER_EMAILS || "")
  .split(/[,;\s]+/)
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const appConfig = {
  environment: env.VITE_APP_ENV || "demo",
  productionServicesEnabled: productionFlag,
  supabaseUrl: env.VITE_SUPABASE_URL || env.VITE_NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey:
    env.VITE_SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_KEY ||
    env.VITE_NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "",
  checkoutFunctionUrl: env.VITE_CHECKOUT_FUNCTION_URL || "",
  reviewerEmails,
} as const;

export const isSupabaseConfigured = Boolean(appConfig.supabaseUrl && appConfig.supabaseAnonKey);

/**
 * Supabase authentication only needs the project URL and public anon key.
 * Billing/checkout configuration must never block account sign-in.
 */
export const isSupabaseAuthEnabled = isSupabaseConfigured;
export const isBillingEnabled =
  isSupabaseAuthEnabled && Boolean(appConfig.checkoutFunctionUrl);
export const isDemoMode = !isSupabaseAuthEnabled;

// Kept as a compatibility alias for callers that only need to know whether
// live Supabase services are active.
export const isProductionMode = isSupabaseAuthEnabled;

export function assertSupabaseAuthEnabled(): void {
  if (!isSupabaseAuthEnabled) throw new Error("Supabase authentication is not configured.");
}

export function assertBillingEnabled(): void {
  if (!isBillingEnabled) throw new Error("Billing is not configured for this deployment.");
}

export function assertProductionServicesEnabled(): void {
  assertBillingEnabled();
}
