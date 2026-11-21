import { admin, cors, getUser, json } from "../_shared/util.ts";
import { PADDLE } from "../_shared/paddle.ts";
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const user = await getUser(req);
  if (!user) return json({ error: "Please sign in to purchase." }, 401);
  const { productId } = await req.json().catch(() => ({}));
  if (!productId) return json({ error: "Missing productId" }, 400);
  const db = admin();
  // Price ALWAYS comes from the DB, never from the browser.
  const { data: p } = await db.from("products").select("*").eq("id", productId).eq("is_published", true).maybeSingle();
  if (!p || p.pricing !== "paid") return json({ error: "Product not purchasable." }, 400);
  const { data: owned } = await db.from("purchases").select("id").eq("user_id", user.id).eq("product_id", p.id).eq("status", "paid").maybeSingle();
  if (owned) return json({ error: "You already own this product." }, 409);
  const purchaseId = crypto.randomUUID();
  try {
    const r = await fetch(`${PADDLE}/transactions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("PADDLE_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ quantity: 1, price: {
          description: p.name.slice(0, 200), name: p.name.slice(0, 100),
          unit_price: { amount: String(p.price_cents), currency_code: p.currency.toUpperCase() },
          product: { name: p.name.slice(0, 200), tax_category: "standard" } } }],
        custom_data: { purchase_id: purchaseId, user_id: user.id, product_id: p.id },
      }),
    });
    const t = await r.json();
    const url = t?.data?.checkout?.url;
    if (!r.ok || !url) return json({ error: "Payment provider error." }, 502);
    await db.from("purchases").insert({ id: purchaseId, user_id: user.id, product_id: p.id, amount_cents: p.price_cents, currency: p.currency, status: "pending", paddle_txn_id: t.data.id });
    return json({ url });
  } catch { return json({ error: "Payment provider error." }, 502); }
});
