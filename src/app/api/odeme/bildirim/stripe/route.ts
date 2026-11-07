import { stripeAyar } from "@/lib/odeme/ayar";
import { olayAl, olayBirak } from "@/lib/odeme/depo";
import { stripeOlayIsle } from "@/lib/odeme/motor";
import { imzaDogrula } from "@/lib/odeme/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yanit = (durum: number, veri: Record<string, unknown>) => new Response(JSON.stringify(veri), { status: durum, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

/**
 * Stripe webhook: <VAYRA_KOKEN>/api/odeme/bildirim/stripe
 * Olaylar: checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.async_payment_failed,
 * checkout.session.expired, invoice.paid, invoice.payment_failed, customer.subscription.updated,
 * customer.subscription.deleted, charge.refunded.
 *
 * Güvenlik: imza (whsec, 5 dakika zaman toleransı) zorunlu; aynı olay kimliği ikinci kez işlenmez (tekrar oynatma).
 * İşlem başarısız olursa olay işaretini geri alır ve 500 döner: Stripe yeniden gönderir.
 */
export async function POST(req: Request) {
  const a = stripeAyar();
  if (!a) return yanit(503, { ok: false, hata: "Stripe bu sunucuda kurulu değil." });
  const govde = await req.text();
  if (govde.length > 512_000) return yanit(413, { ok: false });
  if (!imzaDogrula(a, req.headers.get("stripe-signature"), govde)) return yanit(400, { ok: false, hata: "İmza doğrulanamadı." });
  let ev: Record<string, unknown>;
  try { ev = JSON.parse(govde); } catch { return yanit(400, { ok: false }); }
  const id = String(ev.id ?? "");
  if (!/^evt_[A-Za-z0-9_]+$/.test(id)) return yanit(400, { ok: false });
  // Test modunun olayı canlı anahtarla (ya da tersi) gelirse işlenmez.
  if (typeof ev.livemode === "boolean" && ev.livemode !== (a.mod === "canli")) return yanit(200, { ok: true, sonuc: "mod uyuşmuyor" });
  if (!(await olayAl("stripe", id))) return yanit(200, { ok: true, sonuc: "tekrar" });
  try {
    const sonuc = await stripeOlayIsle(ev);
    return yanit(200, { ok: true, sonuc });
  } catch (e) {
    await olayBirak("stripe", id);
    console.error("[odeme-stripe-bildirim]", String(ev.type), (e as Error).message);
    return yanit(500, { ok: false });
  }
}
