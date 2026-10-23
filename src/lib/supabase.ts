import { appConfig } from "@/lib/config";

type SupabaseMetadata = {
  role?: string;
  reviewer?: boolean;
  full_access?: boolean;
  display_name?: string;
};

export type SupabaseSession = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user?: {
    id?: string;
    email?: string;
    email_confirmed_at?: string | null;
    role?: string;
    app_metadata?: SupabaseMetadata;
    user_metadata?: SupabaseMetadata;
  };
};

export type AccountRole = "user" | "reviewer" | "admin";

type Entitlement = {
  status?: string;
};

export function isReviewerEmail(email?: string | null): boolean {
  if (!email) return false;
  return appConfig.reviewerEmails.includes(email.trim().toLowerCase());
}

export function resolveAccountRole(user?: SupabaseSession["user"]): AccountRole {
  const metadataRoles = [user?.app_metadata?.role, user?.user_metadata?.role].map((role) =>
    typeof role === "string" ? role.trim().toLowerCase() : "",
  );
  if (metadataRoles.includes("admin")) return "admin";

  const hasReviewerFlag =
    user?.app_metadata?.reviewer === true ||
    user?.user_metadata?.reviewer === true ||
    user?.app_metadata?.full_access === true ||
    user?.user_metadata?.full_access === true;

  if (metadataRoles.includes("reviewer") || hasReviewerFlag || isReviewerEmail(user?.email)) {
    return "reviewer";
  }
  return "user";
}

export function hasFullPlatformAccess(user?: SupabaseSession["user"]): boolean {
  return resolveAccountRole(user) !== "user";
}

export function supabaseHeaders(accessToken?: string): HeadersInit {
  return {
    apikey: appConfig.supabaseAnonKey,
    Authorization: `Bearer ${accessToken || appConfig.supabaseAnonKey}`,
    "Content-Type": "application/json",
  };
}

export function supabaseAuthUrl(path: string): string {
  return `${appConfig.supabaseUrl.replace(/\/$/, "")}/auth/v1/${path.replace(/^\//, "")}`;
}

export async function hasActiveEntitlement(session: SupabaseSession): Promise<boolean> {
  const userId = session.user?.id;
  if (!session.access_token || !userId) return false;

  const query = new URLSearchParams({
    select: "status",
    user_id: `eq.${userId}`,
    limit: "1",
  });
  const response = await fetch(
    `${appConfig.supabaseUrl.replace(/\/$/, "")}/rest/v1/entitlements?${query}`,
    { headers: supabaseHeaders(session.access_token) },
  );
  if (!response.ok) throw new Error("Unable to verify subscription entitlement.");
  const rows = (await response.json()) as Entitlement[];
  return rows.some((row) => row.status === "active" || row.status === "trialing");
}
