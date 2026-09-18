import { assertProductionServicesEnabled, appConfig } from "@/lib/config";

export type BillingPlan = "monthly" | "yearly";

export async function createCheckoutSession(plan: BillingPlan, accessToken: string): Promise<{ url: string }> {
  assertProductionServicesEnabled();
  const response = await fetch(appConfig.checkoutFunctionUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ plan }),
  });
  const payload = (await response.json()) as { url?: string; error?: string };
  if (!response.ok || !payload.url) throw new Error(payload.error || "Unable to create Stripe Checkout Session.");
  return { url: payload.url };
}
