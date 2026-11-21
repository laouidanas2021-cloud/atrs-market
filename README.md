# ATR'S MARKET — setup & deployment

Stack: React + TypeScript + Tailwind (Vite) · Supabase (Postgres, Auth, Storage, Edge Functions) · Stripe · Netlify.

## 1. Supabase
1. Create a project at supabase.com. Note **Project URL**, **anon key** (Settings → API) and the project **ref**.
2. SQL Editor → run `supabase/schema.sql`, then `supabase/002_admin_fixes.sql`, then `supabase/003_reviews_and_hardening.sql`.
3. Authentication → URL Configuration: set **Site URL** to your Netlify URL (use `http://localhost:5173` while testing) and add `https://YOUR-SITE/**` and `http://localhost:5173/**` to Redirect URLs. (Needed for email confirmation and password reset.)
4. Storage → Settings: raise the global file size limit if you sell files above 50 MB (free plan max is 50 MB; larger needs Pro).

## 2. Stripe
1. Create an account; use **Test mode** first. Developers → API keys → copy the **secret key** (`sk_test_...`).
2. Developers → Webhooks → Add endpoint: `https://YOUR-REF.supabase.co/functions/v1/stripe-webhook`
   Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`. Copy the **signing secret** (`whsec_...`).

## 3. Deploy the server functions
```
npm i -g supabase
supabase login
supabase link --project-ref YOUR-REF
supabase secrets set STRIPE_SECRET_KEY=sk_test_... STRIPE_WEBHOOK_SECRET=whsec_... SITE_URL=https://YOUR-SITE.netlify.app
supabase functions deploy create-checkout
supabase functions deploy get-download-url
supabase functions deploy stripe-webhook --no-verify-jwt
```
(`--no-verify-jwt` is required for the webhook: Stripe isn't a Supabase user; the Stripe signature is verified in code.)

## 4. Run locally
```
cp .env.example .env     # fill in the 3 values
npm install
npm run dev              # http://localhost:5173
```

## 5. Deploy the site (Netlify)
Push this folder to GitHub → Netlify → Add new site → Import. Build `npm run build`, publish `dist` (already in `netlify.toml`).
Site settings → Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_CONTACT_EMAIL`. Redeploy. Then update Supabase Site URL and the `SITE_URL` secret to the real domain.
**Never** put the service-role key or Stripe secret in Netlify/frontend variables.

## 6. Make the data work (first run)
1. Open the site → Sign in → Create account (confirm the email).
2. SQL Editor: `insert into admin_roles(user_id) select id from auth.users where email='YOU@EMAIL.COM';` → refresh; an **Admin** link appears.
3. Admin → Categories (six starters already exist) → Products → **Add product**: fill details, upload cover + screenshots + the product file, choose Free/Paid and price, Save.
4. Tick **Published** (and **Featured** for the homepage). It now appears publicly. The file itself is never public.

## 7. Test checklist
- Sign up / sign in / sign out / reset password.
- Create a free product → log out → download works (signed link expires in 60 s).
- Create a paid product (≥ $0.50) → logged out, "Sign in to buy" → buy with Stripe test card `4242 4242 4242 4242`, any future date, any CVC.
- After redirect, the order shows **paid** only once the webhook fires (Admin → Orders). Library shows Download.
- With a second user who hasn't paid: calling the download returns "Purchase required." Try a declined card `4000 0000 0000 0002` → no access.
- Refund in Stripe dashboard → order becomes **refunded**, download is blocked.
- Local webhook testing: `stripe listen --forward-to https://YOUR-REF.supabase.co/functions/v1/stripe-webhook`.

## 8. Go live
Switch Stripe to Live mode: new `sk_live_`, new webhook endpoint + `whsec_`, update with `supabase secrets set`. Use a custom domain and update Site URL / `SITE_URL`.

## Security notes
Paid files sit in a private bucket; only admins/service role can access it. Downloads are issued by `get-download-url` after a server-side purchase check. `purchases` has no client write access. Price is read from the DB at checkout. Webhooks are signature-verified and idempotent. Screenshots/text shown publicly can always be copied — only the file is protected.

## Deploy walkthrough (copy/paste order)
1. Supabase: create project → run the 3 SQL files in order → set Auth URL config (temporary Site URL `http://localhost:5173`).
2. `npm install -g supabase` → `supabase login` → `supabase link --project-ref YOUR-REF`.
3. Stripe (test mode): copy `sk_test_...`. Create the webhook endpoint (URL above) → copy `whsec_...`.
4. `supabase secrets set STRIPE_SECRET_KEY=... STRIPE_WEBHOOK_SECRET=... SITE_URL=http://localhost:5173`
5. Deploy the three functions (commands in section 3).
6. `cp .env.example .env`, fill values, `npm install`, `npm run dev`. Create account → make yourself admin → add a free product and a paid product → run the test checklist.
7. Publish: `git init && git add . && git commit -m "ATR'S MARKET" && git branch -M main`, create an empty GitHub repo, `git remote add origin <url> && git push -u origin main`.
8. Netlify → Add new site → Import from GitHub → add the 3 `VITE_` variables → Deploy. Copy your `https://xxxx.netlify.app` URL.
9. Update: Supabase Auth Site URL + Redirect URLs, and `supabase secrets set SITE_URL=https://xxxx.netlify.app`. Redeploy `create-checkout` is NOT needed (secrets are read at runtime).
10. Re-test a Stripe test purchase on the live URL. When happy, switch Stripe to live keys (section 8).


# PayPal edition (replaces Stripe)
Run `supabase/004_paypal.sql`. Secrets: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_ENV` (`sandbox` or `live`), `SITE_URL`.
Deploy (each with `--no-verify-jwt --yes`): `create-checkout`, `paypal-capture`, `paypal-webhook`, `get-download-url`.
PayPal webhook URL: `https://YOUR-REF.supabase.co/functions/v1/paypal-webhook`, events: PAYMENT.CAPTURE.COMPLETED, DENIED, REFUNDED, REVERSED.
Stripe is no longer used; ignore the Stripe steps above.


# Paddle edition (replaces Stripe/PayPal)
Run `supabase/005_paddle.sql`. Secrets: `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `PADDLE_ENV` (`sandbox` or `production`), `SITE_URL`.
Deploy (each `--no-verify-jwt --yes`): `create-checkout`, `paddle-webhook`, `get-download-url`.
Frontend env: `VITE_PADDLE_CLIENT_TOKEN`, `VITE_PADDLE_ENV` (`sandbox` or `production`).
Paddle dashboard: Default payment link = `https://YOUR-SITE/pay`. Webhook URL = `https://YOUR-REF.supabase.co/functions/v1/paddle-webhook`,
events: transaction.completed, transaction.payment_failed, adjustment.created, adjustment.updated.
