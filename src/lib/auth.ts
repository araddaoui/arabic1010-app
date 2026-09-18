import { assertProductionServicesEnabled } from "@/lib/config";
import { supabaseAuthUrl, supabaseHeaders, type SupabaseSession } from "@/lib/supabase";

const SESSION_KEY = "arabic1010.supabase.session";

async function request(path: string, body?: unknown): Promise<SupabaseSession> {
  assertProductionServicesEnabled();
  const response = await fetch(supabaseAuthUrl(path), {
    method: "POST",
    headers: supabaseHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = (await response.json()) as SupabaseSession & { msg?: string; error_description?: string };
  if (!response.ok) throw new Error(payload.error_description || payload.msg || "Authentication request failed.");
  return payload;
}

function saveSession(session: SupabaseSession): SupabaseSession {
  if (session.access_token) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
  return session;
}

export function getStoredSupabaseSession(): SupabaseSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SupabaseSession) : null;
  } catch {
    return null;
  }
}

export async function signInWithSupabase(email: string, password: string): Promise<SupabaseSession> {
  const session = await request("token?grant_type=password", { email, password });
  if (!session.access_token || !session.user?.id) throw new Error("Supabase returned an incomplete user session.");
  return saveSession(session);
}

export async function signUpWithSupabase(name: string, email: string, password: string): Promise<SupabaseSession> {
  return saveSession(await request("signup", { email, password, data: { display_name: name } }));
}

export async function signOutWithSupabase(): Promise<void> {
  const session = getStoredSupabaseSession();
  if (session?.access_token) {
    await fetch(supabaseAuthUrl("logout"), {
      method: "POST",
      headers: supabaseHeaders(session.access_token),
    });
  }
  localStorage.removeItem(SESSION_KEY);
}
