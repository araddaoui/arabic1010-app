const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Plan = "monthly" | "yearly";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing server configuration: ${name}`);
  return value;
}

function getBearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const accessToken = getBearerToken(request);
    if (!accessToken) {
      return json({ error: "Authentication required" }, 401);
    }

    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const supabaseAnonKey = requiredEnv("SUPABASE_ANON_KEY");
    const stripeSecretKey = requiredEnv("STRIPE_SECRET_KEY");
    const appUrl = requiredEnv("APP_URL").replace(/\/$/, "");

    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      return json({ error: "Invalid or expired authentication session" }, 401);
    }

    const user = (await userResponse.json()) as {
      id?: string;
      email?: string;
    };

    if (!user.id || !user.email) {
      return json({ error: "Authenticated user has no usable identity" }, 401);
    }

    const body = (await request.json()) as { plan?: Plan };
    const plan = body.plan;

    if (plan !== "monthly" && plan !== "yearly") {
      return json({ error: "Unsupported plan" }, 400);
    }

    const priceId =
      plan === "monthly"
        ? requiredEnv("STRIPE_MONTHLY_PRICE_ID")
        : requiredEnv("STRIPE_YEARLY_PRICE_ID");

    const form = new URLSearchParams();
    form.set("mode", "subscription");
    form.set("line_items[0][price]", priceId);
    form.set("line_items[0][quantity]", "1");
    form.set("customer_email", user.email);
    form.set("client_reference_id", user.id);
    form.set("metadata[supabase_user_id]", user.id);
    form.set("metadata[plan]", plan);
    form.set("success_url", `${appUrl}/#/settings?checkout=success`);
    form.set("cancel_url", `${appUrl}/#/settings?checkout=cancel`);

    if (plan === "monthly") {
      form.set("subscription_data[trial_period_days]", "14");
    }

    const checkoutResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });

    const checkout = (await checkoutResponse.json()) as {
      id?: string;
      url?: string;
      error?: { message?: string };
    };

    if (!checkoutResponse.ok || !checkout.url) {
      console.error("Stripe Checkout creation failed", checkout.error);
      return json({ error: "Unable to create Checkout Session" }, 502);
    }

    return json({
      sessionId: checkout.id,
      url: checkout.url,
    });
  } catch (error) {
    console.error("Checkout function error", error);
    return json({ error: "Checkout service is unavailable" }, 500);
  }
});
