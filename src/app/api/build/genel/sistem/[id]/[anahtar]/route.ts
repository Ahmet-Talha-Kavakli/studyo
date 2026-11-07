import { canliAkis, sistemHam, sistemGuncelleOz, webhookOzeti } from "@/lib/build/sistemDepo";
import { sistemBaslat, sistemCalistir, yanitBekle } from "@/lib/build/sistemMotoru";
import { hizSiniri } from "@/lib/build/ziyaretciDepo";
import { calismaDegiskenleri } from "@/lib/build/sistemDegisken";
import { kancaDogrula } from "@/lib/build/sistemKancaImza";
import { kancaImzaBul } from "@/lib/build/sistemTetikKatalog";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string; anahtar: string }> };
const yanit = (v: unknown, durum = 200) => Response.json(v, { status: durum });

async function dogrula(params: Ctx["params"]) {
  const { id, anahtar } = await params;
  const h = await sistemHam(id);
  if (!h || !h.s.webhookOzeti || webhookOzeti(anahtar) !== h.s.webhookOzeti) return null;
  return { id, h };
}

/**
 * Webhook tetiği: POST https://<vayra>/api/build/genel/sistem/<sistem>/<anahtar> — gövde (JSON ya da form) tetik
 * verisi olur ({{tetik.alan}}); sorgu parametreleri de eklenir. Sistem açıksa yayındaki sürüm arka planda çalışır;
 * kapalıyken istek çalıştırılmaz, deneme verisi olarak saklanır (düzenleyicide veri seçicide görünür).
 * Tetikte "yanıt" yazılıysa (ör. PayTR için OK) o metin döner.
 */
export async function POST(req: Request, { params }: Ctx) {
  const d = await dogrula(params);
  if (!d) return yanit({ ok: false, hata: "Geçersiz webhook adresi." }, 404);
  const { id, h } = d;
  const canli = h.s.durum === "acik" ? canliAkis(h.s).tetikler.find((t) => t.tur === "webhook") : undefined;
  const taslak = h.s.tetikler.find((t) => t.tur === "webhook");
  if (!canli && !taslak) return yanit({ ok: false, hata: "Bu sistemde webhook tetiği yok." }, 404);
  if (!hizSiniri(`sistem:${id}`, 120, 60_000)) return yanit({ ok: false, hata: "Çok fazla istek." }, 429);
  const tur = req.headers.get("content-type") ?? "";
  // Gövde ham okunur: imzalı web kancasında imza ham gövde üzerinden doğrulanır.
  const ham = await req.text().catch(() => "");
  if (ham.length > 1_000_000) return yanit({ ok: false, hata: "Gövde çok büyük." }, 413);
  const imzali = (canli ?? taslak) as Extract<typeof taslak, { tur: "webhook" }> | undefined;
  if (imzali?.imza && kancaImzaBul(imzali.imza)) {
    const t = kancaImzaBul(imzali.imza)!;
    const { sir } = await calismaDegiskenleri(h.sahipOz).catch(() => ({ sir: {} as Record<string, string> }));
    const d = kancaDogrula(imzali.imza, ham, req.headers, sir[t.sir] ?? "", imzali.imzaBaslik);
    if (!d.ok) return yanit({ ok: false, hata: `İmza doğrulanamadı: ${d.neden}` }, 401);
  }
  let veri: unknown = {};
  try {
    if (tur.includes("json")) veri = ham ? JSON.parse(ham) : {};
    else if (tur.includes("form")) veri = Object.fromEntries(new URLSearchParams(ham).entries());
    else { const t = ham.slice(0, 100_000); veri = t ? { govde: t } : {}; }
  } catch { return yanit({ ok: false, hata: "Gövde okunamadı." }, 400); }
  const sorgu = Object.fromEntries(new URL(req.url).searchParams.entries());
  if (Object.keys(sorgu).length && veri && typeof veri === "object" && !Array.isArray(veri)) veri = { ...veri, sorgu };
  if (JSON.stringify(veri).length > 200_000) return yanit({ ok: false, hata: "Gövde çok büyük." }, 413);
  if (!canli) {
    await sistemGuncelleOz(id, h.sahipOz, (s) => { s.test ??= {}; s.test.tetik = veri; s.test.sonTetik = veri; });
    return yanit({ ok: true, deneme: true, mesaj: "Sistem kapalı: istek çalıştırılmadı, deneme verisi olarak kaydedildi." }, 202);
  }
  // Yanıt modu: akışta "Yanıt ver" adımı varsa çağırana o yanıt döner (en çok 25 sn; sonra 202 ve çalışma sürer).
  if (canliAkis(h.s).adimlar.some((a) => a.tur === "yanit") || (canli.tur === "webhook" && canli.yanitModu === "bitince")) {
    const r = await sistemBaslat(id, h.sahipOz, { tur: "webhook", veri });
    if (!r) return yanit({ ok: false, hata: "Sistem şu an istek almıyor." }, 409);
    r.bitti.catch(() => {});
    const y = await yanitBekle(r, 25_000);
    if (y.tur === "yanit") {
      const d = y.yanit.durum >= 100 && y.yanit.durum < 600 ? y.yanit.durum : 200;
      return y.yanit.json !== undefined ? Response.json(y.yanit.json, { status: d }) : new Response(y.yanit.metin, { status: d, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }
    if (y.tur === "bitti") {
      const son = y.c.adimlar.filter((x) => x.durum === "basarili").at(-1);
      return yanit({ ok: y.c.durum !== "basarisiz", calisma: y.c.id, durum: y.c.durum, ...(y.c.durum === "basarisiz" ? { hata: y.c.hata } : { cikti: son?.cikti ?? "", veri: son?.veri ?? null }) }, y.c.durum === "basarisiz" ? 500 : 200);
    }
    return yanit({ ok: true, kabul: true, suruyor: true, calisma: r.c.id }, 202);
  }
  const p = sistemCalistir(id, h.sahipOz, { tur: "webhook", veri });
  p.catch(() => {});
  if (canli.tur === "webhook" && canli.yanit) return new Response(canli.yanit, { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  return yanit({ ok: true, kabul: true });
}

/** Doğrulama el sıkışması (WhatsApp Cloud API, Meta): ?hub.mode=subscribe&hub.verify_token=…&hub.challenge=… */
export async function GET(req: Request, { params }: Ctx) {
  const d = await dogrula(params);
  if (!d) return yanit({ ok: false, hata: "Geçersiz webhook adresi." }, 404);
  const q = new URL(req.url).searchParams;
  const belirtec = [...canliAkis(d.h.s).tetikler, ...d.h.s.tetikler].map((t) => (t.tur === "webhook" ? t.dogrulama : undefined)).find(Boolean);
  if (q.get("hub.mode") === "subscribe" && belirtec && q.get("hub.verify_token") === belirtec) return new Response(q.get("hub.challenge") ?? "", { status: 200, headers: { "Content-Type": "text/plain" } });
  return yanit({ ok: true, mesaj: "Webhook adresi çalışıyor; veriyi POST ile gönder." });
}
