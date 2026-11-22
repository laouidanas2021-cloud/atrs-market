import { admin } from "../_shared/util.ts";
const enc = new TextEncoder();
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
function safeEq(a: string, b: string) { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; }
async function verify(raw: string, header: string): Promise<boolean> {
  const parts = header.split(";").map((x) => x.split("="));
  const ts = parts.find((p) => p[0] === "ts")?.[1]; const sigs = parts.filter((p) => p[0] === "h1").map((p) => p[1]);
  if (!ts || !sigs.length || Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", enc.encode(Deno.env.get("PADDLE_WEBHOOK_SECRET")!), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = hex(await crypto.subtle.sign("HMAC", key, enc.encode(`${ts}:${raw}`)));
  return sigs.some((s) => safeEq(s, mac));
}
Deno.serve(async (req) => {
  const raw = await req.text();
  if (!(await verify(raw, req.headers.get("paddle-signature") ?? ""))) return new Response("Invalid signature", { status: 400 });
  const ev = JSON.parse(raw); const d = ev.data ?? {}; const db = admin();
  const { error: dup } = await db.from("webhook_events").insert({ id: ev.event_id, type: ev.event_type }); // duplicate protection
  if (dup) return new Response("Already processed", { status: 200 });
  try {
    const custom = d.custom_data ?? {}; const id = custom.purchase_id; const table = custom.kind === "donation" ? "donations" : "purchases";
    if (ev.event_type === "transaction.completed" && id) {
      await db.from(table).update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id).eq("paddle_txn_id", d.id).in("status", ["pending", "failed"]);
    } else if (ev.event_type === "transaction.payment_failed" && id) {
      await db.from(table).update({ status: "failed" }).eq("id", id).eq("paddle_txn_id", d.id).eq("status", "pending");
    } else if ((ev.event_type === "adjustment.created" || ev.event_type === "adjustment.updated") && d.status === "approved" && (d.action === "refund" || d.action === "chargeback")) {
      await db.from("purchases").update({ status: "refunded" }).eq("paddle_txn_id", d.transaction_id);
      await db.from("donations").update({ status: "refunded" }).eq("paddle_txn_id", d.transaction_id);
    }
  } catch {
    await db.from("webhook_events").delete().eq("id", ev.event_id); // let Paddle retry
    return new Response("Processing error", { status: 500 });
  }
  return new Response("ok", { status: 200 });
});
