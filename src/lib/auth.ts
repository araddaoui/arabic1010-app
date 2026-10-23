import { assertSupabaseAuthEnabled } from "@/lib/config";
import { supabaseAuthUrl, supabaseHeaders, type SupabaseSession } from "@/lib/supabase";

const SESSION_KEY = "arabic1010.supabase.session";

type AuthErrorPayload = SupabaseSession & {
  msg?: string;
  error?: string;
  error_code?: string;
  error_description?: string;
};

function authErrorMessage(payload: AuthErrorPayload, status: number): string {
  const detail = payload.error_description || payload.msg || payload.error || "";
  if (payload.error_code === "email_not_confirmed" || /email not confirmed/i.test(detail)) {
    return "Your email address has not been confirmed yet. Confirm it from the Supabase email, then sign in again.";
  }
  if (payload.error_code === "invalid_credentials" || /invalid login credentials/i.test(detail)) {
    return "Invalid email or password.";
  }
  return detail || `Authentication request failed${status ? ` (${status})` : ""}.`;
}

async function request(path: string, body?: unknown): Promise<SupabaseSession> {
  assertSupabaseAuthEnabled();
  const response = await fetch(supabaseAuthUrl(path), {
    method: "POST",
    headers: supabaseHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let payload: AuthErrorPayload = {};
  if (text) {
    try {
      payload = JSON.parse(text) as AuthErrorPayload;
    } catch {
      if (!response.ok) throw new Error(text);
    }
  }
  if (!response.ok) throw new Error(authErrorMessage(payload, response.status));
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
  const session = await request("token?grant_type=password", { email: email.trim(), password });
  if (!session.access_token || !session.user?.id) throw new Error("Supabase returned an incomplete user session.");
  return saveSession(session);
}

export async function signUpWithSupabase(name: string, email: string, password: string): Promise<SupabaseSession> {
  return saveSession(
    await request("signup", { email: email.trim(), password, data: { display_name: name } }),
  );
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
