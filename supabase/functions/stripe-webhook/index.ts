const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, stripe-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type CheckoutSession = {
  id?: string;
  mode?: string;
  customer?: string | null;
  subscription?: string | null;
  client_reference_id?: string | null;
  metadata?: Record<string, string>;
};

type StripeEvent = {
  id?: string;
  type?: string;
  data?: { object?: CheckoutSession };
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing server configuration: ${name}`);
  return value;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) result |= left[index] ^ right[index];
  return result === 0;
}

async function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  const timestamp = signatureHeader.match(/(?:^|,)t=(\d+)/)?.[1];
  const signatures = [...signatureHeader.matchAll(/(?:^|,)v1=([a-f0-9]+)/g)].map((match) => match[1]);
  if (!timestamp || signatures.length === 0) return false;

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`)),
  );

  return signatures.some((signature) => constantTimeEqual(digest, hexToBytes(signature)));
}

async function upsertEntitlement(
  supabaseUrl: string,
  serviceRoleKey: string,
  session: CheckoutSession,
): Promise<void> {
  const userId = session.client_reference_id || session.metadata?.supabase_user_id;
  if (!userId) throw new Error("Checkout session is missing the Supabase user ID");

  const plan = session.metadata?.plan;
  if (plan !== "monthly" && plan !== "yearly") {
    throw new Error("Checkout session contains an unsupported plan");
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/entitlements?on_conflict=user_id`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      user_id: userId,
      stripe_customer_id: session.customer ?? null,
      stripe_subscription_id: session.subscription ?? null,
      plan,
      status: "active",
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    console.error("Entitlement upsert failed", await response.text());
    throw new Error("Unable to sync entitlement");
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const payload = await request.text();
    const signature = request.headers.get("stripe-signature");
    if (!signature) return json({ error: "Missing Stripe signature" }, 400);

    const valid = await verifyStripeSignature(
      payload,
      signature,
      requiredEnv("STRIPE_WEBHOOK_SECRET"),
    );
    if (!valid) return json({ error: "Invalid Stripe signature" }, 400);

    const event = JSON.parse(payload) as StripeEvent;
    if (event.type !== "checkout.session.completed") return json({ received: true });

    const session = event.data?.object;
    if (!session || session.mode !== "subscription") return json({ received: true });

    await upsertEntitlement(
      requiredEnv("SUPABASE_URL"),
      requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      session,
    );

    return json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error", error);
    return json({ error: "Webhook processing failed" }, 500);
  }
});
