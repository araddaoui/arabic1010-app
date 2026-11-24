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

type SubscriptionObject = {
  id?: string;
  customer?: string | null;
  status?: string;
  metadata?: Record<string, string>;
};

type InvoiceObject = {
  id?: string;
  customer?: string | null;
  subscription?: string | null;
  status?: string;
};

type StripeEvent = {
  id?: string;
  type?: string;
  data?: { object?: CheckoutSession & SubscriptionObject & InvoiceObject };
};

/** Stripe subscription statuses that still grant access. */
const ACTIVE_STATUSES = new Set(["active", "trialing"]);

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

/**
 * Update an existing entitlement when a subscription changes state. Matching by
 * subscription id (preferred) or customer id also covers events that carry no
 * Supabase user id, such as invoices and cancellations.
 */
async function setEntitlementStatus(
  supabaseUrl: string,
  serviceRoleKey: string,
  match: { subscriptionId?: string | null; customerId?: string | null },
  status: string,
  plan?: string,
): Promise<void> {
  const filter = match.subscriptionId
    ? `stripe_subscription_id=eq.${encodeURIComponent(match.subscriptionId)}`
    : match.customerId
      ? `stripe_customer_id=eq.${encodeURIComponent(match.customerId)}`
      : null;
  if (!filter) throw new Error("Event is missing both subscription and customer id");

  const body: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (plan === "monthly" || plan === "yearly") body.plan = plan;

  const response = await fetch(`${supabaseUrl}/rest/v1/entitlements?${filter}`, {
    method: "PATCH",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    console.error("Entitlement status update failed", await response.text());
    throw new Error("Unable to update entitlement status");
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
    const object = event.data?.object;
    if (!object) return json({ received: true });

    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

    switch (event.type) {
      case "checkout.session.completed": {
        if (object.mode !== "subscription") return json({ received: true });
        await upsertEntitlement(supabaseUrl, serviceRoleKey, object);
        break;
      }
      case "customer.subscription.updated": {
        // Renewals, plan changes, past-due and reactivation all arrive here.
        const status = object.status ?? "";
        if (!status) return json({ received: true });
        await setEntitlementStatus(
          supabaseUrl,
          serviceRoleKey,
          { subscriptionId: object.id, customerId: object.customer },
          ACTIVE_STATUSES.has(status) ? "active" : status,
          object.metadata?.plan,
        );
        break;
      }
      case "customer.subscription.deleted": {
        await setEntitlementStatus(
          supabaseUrl,
          serviceRoleKey,
          { subscriptionId: object.id, customerId: object.customer },
          "canceled",
        );
        break;
      }
      case "invoice.payment_failed": {
        await setEntitlementStatus(
          supabaseUrl,
          serviceRoleKey,
          { subscriptionId: object.subscription, customerId: object.customer },
          "past_due",
        );
        break;
      }
      default:
        // Unhandled event types are acknowledged so Stripe stops retrying.
        return json({ received: true });
    }

    return json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error", error);
    return json({ error: "Webhook processing failed" }, 500);
  }
});
