import { appConfig } from "@/lib/config";

export type SupabaseSession = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user?: { id?: string; email?: string; user_metadata?: { display_name?: string } };
};

type Entitlement = {
  status?: string;
};

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
