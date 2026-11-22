import { admin, cors, getUser, json } from "../_shared/util.ts";
import { PADDLE } from "../_shared/paddle.ts";
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const user = await getUser(req);
  if (!user) return json({ error: "Please sign in to donate." }, 401);
  const { amountCents, message } = await req.json().catch(() => ({}));
  const amount = Math.round(Number(amountCents));
  if (!Number.isFinite(amount) || amount < 100 || amount > 100000) return json({ error: "Choose an amount between $1 and $1,000." }, 400);
  const db = admin();
  const donationId = crypto.randomUUID();
  try {
    const r = await fetch(`${PADDLE}/transactions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("PADDLE_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ quantity: 1, price: {
          description: "Donation to ATR'S MARKET", name: "Donation",
          unit_price: { amount: String(amount), currency_code: "USD" },
          product: { name: "Donation", tax_category: "standard" } } }],
        custom_data: { kind: "donation", purchase_id: donationId, user_id: user.id },
      }),
    });
    const t = await r.json();
    const url = t?.data?.checkout?.url;
    if (!r.ok || !url) return json({ error: "Payment provider error." }, 502);
    await db.from("donations").insert({ id: donationId, user_id: user.id, amount_cents: amount, currency: "usd", message: (message || "").slice(0, 300) || null, status: "pending", paddle_txn_id: t.data.id });
    return json({ url });
  } catch { return json({ error: "Payment provider error." }, 502); }
});
