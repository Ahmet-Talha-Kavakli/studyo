import { beklemeListesi, calismaOku, onayGecmisiEkle, sistemHam } from "@/lib/build/sistemDepo";
import { calismaDevam, devamBelirteciDogrula } from "@/lib/build/sistemMotoru";
import { hizSiniri } from "@/lib/build/ziyaretciDepo";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ calisma: string; belirtec: string }> };

/**
 * Çalışmaya özel devam adresi ({{calisma.devam}}). "Dış çağrıya kadar bekle" adımı bekliyorsa gövde (JSON ya da form)
 * ve sorgu parametreleri adımın çıktısı olur. Onay bekliyorsa ?karar=onay ya da ?karar=ret (isteğe bağlı not=) ile
 * karar verilir. Adım henüz bekleme noktasına gelmediyse veri saklanır ve gelince kullanılır.
 */
async function isle(req: Request, { params }: Ctx) {
  const { calisma, belirtec } = await params;
  const tarayici = req.method === "GET" && (req.headers.get("accept") ?? "").includes("text/html");
  const yanit = (v: Record<string, unknown>, durum = 200) => (tarayici ? sayfa(String(v.mesaj ?? v.hata ?? ""), durum < 300) : Response.json(v, { status: durum }));
  if (!hizSiniri(`devam:${calisma}`, 30, 60_000)) return yanit({ ok: false, hata: "Çok fazla istek." }, 429);
  const d = await devamBelirteciDogrula(calisma, belirtec);
  if (!d) return yanit({ ok: false, hata: "Bu devam adresi geçersiz ya da çalışma artık beklemiyor." }, 404);
  const u = new URL(req.url);
  const sorgu = Object.fromEntries(u.searchParams.entries());
  let govde: unknown = undefined;
  if (req.method !== "GET") {
    const tur = req.headers.get("content-type") ?? "";
    try {
      if (tur.includes("json")) govde = await req.json();
      else if (tur.includes("form")) govde = Object.fromEntries((await req.formData()).entries());
      else { const t = (await req.text()).slice(0, 100_000); govde = t ? { govde: t } : undefined; }
    } catch { return yanit({ ok: false, hata: "Gövde okunamadı." }, 400); }
    if (JSON.stringify(govde ?? null).length > 200_000) return yanit({ ok: false, hata: "Gövde çok büyük." }, 413);
  }
  const c = await calismaOku(d.sistemId, calisma);
  const onayB = c?.durum === "bekliyor" ? beklemeListesi(c).find((x) => x.tur === "onay" && c.devam?.[x.anahtar] === undefined && (!sorgu.adim || x.adimId === sorgu.adim)) : undefined;
  const dis = c?.durum === "bekliyor" ? beklemeListesi(c).find((x) => x.tur === "webhook" && c.devam?.[x.anahtar] === undefined) : undefined;
  if (c && onayB && (!dis || sorgu.karar || (govde as Record<string, unknown> | undefined)?.karar)) {
    const k = String((govde as Record<string, unknown> | undefined)?.karar ?? sorgu.karar ?? "");
    if (k !== "onay" && k !== "ret") return yanit({ ok: false, hata: "Bu çalışma onay bekliyor: karar=onay ya da karar=ret gönder." }, 400);
    const not = String((govde as Record<string, unknown> | undefined)?.not ?? sorgu.not ?? "").slice(0, 2000);
    const r = await calismaDevam(d.sistemId, calisma, { tur: "onay", anahtar: onayB.anahtar, veri: { karar: k, not, kararVeren: "adres" } });
    if (!r.ok) return yanit({ ok: false, hata: r.hata }, r.durum ?? 409);
    const h = await sistemHam(d.sistemId);
    if (h) await onayGecmisiEkle(d.sahipOz, { calismaId: calisma, sistemId: d.sistemId, sistemAd: h.s.ad, baslik: onayB.baslik ?? "Onay", karar: k, duzenlendi: false, not: not || undefined, zaman: Date.now(), kararVeren: "adres" });
    return yanit({ ok: true, mesaj: k === "onay" ? "Onaylandı; sistem devam ediyor." : "Reddedildi; kararın kaydedildi." });
  }
  const veri = govde === undefined ? sorgu : Object.keys(sorgu).length ? { ...(typeof govde === "object" && govde && !Array.isArray(govde) ? govde : { govde }), sorgu } : govde;
  const r = await calismaDevam(d.sistemId, calisma, { tur: "webhook", veri });
  if (!r.ok) return yanit({ ok: false, hata: r.hata }, r.durum ?? 409);
  return yanit({ ok: true, mesaj: "Alındı; sistem devam ediyor." });
}

function sayfa(mesaj: string, ok: boolean) {
  const g = mesaj.replace(/[<>&]/g, (x) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[x]!);
  return new Response(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vayra</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0b0c;color:#fff;font:15px/1.5 system-ui,sans-serif}div{max-width:420px;margin:24px;padding:24px 26px;border-radius:22px;background:#141416;border:1px solid rgba(255,255,255,.08)}b{display:block;font-size:17px;margin-bottom:6px;color:${ok ? "#8be6ff" : "#fda4af"}}</style></head><body><div><b>${ok ? "Tamam" : "Olmadı"}</b>${g}</div></body></html>`, { status: ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export const GET = isle;
export const POST = isle;
