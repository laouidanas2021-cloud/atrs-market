import { admin, cors, getUser, json } from "../_shared/util.ts";
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const { productId } = await req.json().catch(() => ({}));
  if (!productId) return json({ error: "Missing productId" }, 400);
  const db = admin();
  const user = await getUser(req);
  const { data: p } = await db.from("products").select("id,pricing,is_published").eq("id", productId).maybeSingle();
  if (!p) return json({ error: "Not found." }, 404);
  if (p.pricing === "paid") {
    if (!user) return json({ error: "Please sign in." }, 401);
    const { data: isAdm } = await db.from("admin_roles").select("user_id").eq("user_id", user.id).maybeSingle();
    if (!isAdm) {
      const { data: paid } = await db.from("purchases").select("id").eq("user_id", user.id).eq("product_id", p.id).eq("status", "paid").maybeSingle();
      if (!paid) return json({ error: "Purchase required." }, 403);
    }
  } else if (!p.is_published) return json({ error: "Not found." }, 404);
  const { data: f } = await db.from("product_files").select("id,path").eq("product_id", p.id).eq("is_current", true).maybeSingle();
  if (!f) return json({ error: "No file available yet." }, 404);
  const { data: signed, error } = await db.storage.from("product-files").createSignedUrl(f.path, 60);
  if (error || !signed) return json({ error: "Could not create download link." }, 500);
  await db.from("download_logs").insert({ user_id: user?.id ?? null, product_id: p.id, file_id: f.id });
  await db.rpc("increment_downloads", { pid: p.id });
  return json({ url: signed.signedUrl, expiresIn: 60 });
});
