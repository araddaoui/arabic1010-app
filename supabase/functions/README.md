# Stripe webhook — setup and testing

The app sells one subscription (monthly or yearly) through Stripe Checkout. A
Supabase Edge Function records the purchase in the `entitlements` table, and the
web client treats a user as premium only while `entitlements.status` is
`active` or `trialing`.

Nothing here contains secrets. All values are read from the function's
environment at runtime.

## 1. Required function secrets

Set these in Supabase (Project Settings → Edge Functions → Secrets, or
`supabase secrets set`):

| Name | Purpose |
| --- | --- |
| `STRIPE_SECRET_KEY` | Creates Checkout Sessions (`create-checkout-session`) |
| `STRIPE_WEBHOOK_SECRET` | Verifies the `stripe-signature` header |
| `SUPABASE_URL` | REST base URL used to write `entitlements` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side write key (never expose to the client) |

`create-checkout-session` additionally needs `SUPABASE_ANON_KEY`, `APP_URL`
(the site origin used for success/cancel redirects), `STRIPE_MONTHLY_PRICE_ID`
and `STRIPE_YEARLY_PRICE_ID`.

## 2. Events the endpoint must receive

The handler ignores anything else and returns `200`, so Stripe stops retrying.

| Event | Effect on `entitlements` |
| --- | --- |
| `checkout.session.completed` | Creates/updates the row: `plan`, `status = active`, Stripe customer + subscription ids |
| `customer.subscription.updated` | Sets `status` from Stripe (`active`/`trialing` → `active`, otherwise stored as-is); refreshes `plan` when metadata carries it |
| `customer.subscription.deleted` | Sets `status = canceled` |
| `invoice.payment_failed` | Sets `status = past_due` |

Without the last three, a cancelled or unpaid subscription keeps premium access
forever.

## 3. Configure the endpoint in Stripe

1. Stripe Dashboard → Developers → Webhooks → **Add endpoint**.
2. URL: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`.
3. Select the four events above (do not use "all events" — unnecessary noise).
4. Copy the signing secret (`whsec_…`) into `STRIPE_WEBHOOK_SECRET`.
5. Deploy the function (below), then use **Send test event** in Stripe.

## 4. Deploy

```powershell
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy create-checkout-session
```

`--no-verify-jwt` is required for the webhook: Stripe does not send a Supabase
JWT. The function authenticates the request with the Stripe signature instead.

## 5. Test locally

```powershell
supabase functions serve stripe-webhook --env-file supabase/.env.local
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
stripe trigger customer.subscription.deleted
```

Then check the row:

```sql
select user_id, plan, status, updated_at from entitlements;
```

Expected: `status` changes to `canceled`, and the app drops to the free tier on
its next load (it re-reads entitlements at startup and after sign-in).

## 6. Behaviour notes

- Signature verification uses HMAC-SHA256 with a 5-minute timestamp tolerance.
- Matching is by `stripe_subscription_id`, falling back to `stripe_customer_id`,
  so events that omit the Supabase user id still resolve.
- The handler always returns `200` for event types it does not handle; a `500`
  means the entitlement write failed and Stripe will retry.
