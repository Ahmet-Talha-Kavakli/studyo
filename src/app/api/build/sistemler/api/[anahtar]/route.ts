import { disariCalisma, disaridanBul, disaridanCalistir } from "@/lib/build/sistemDisari";
import { hizSiniri } from "@/lib/build/ziyaretciDepo";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ anahtar: string }> };
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" };
const yanit = (v: unknown, durum = 200) => Response.json(v, { status: durum, headers: { ...CORS, "Cache-Control": "no-store" } });

/**
 * Sistem API uç noktası: POST /api/build/sistemler/api/<anahtar> gövde: girdi alanları (JSON nesnesi).
 * Yayındaki sürüm çalışır; 60 saniyede biterse yanıt son adımın çıktısıdır ({ ok, durum, cikti, veri, calisma }).
 * Bitmezse 202 ve çalışma kimliği döner: GET ?calisma=<kimlik> ile sonuç sorulur. ?bekle=0 hemen 202 döner.
 */
export async function POST(req: Request, { params }: Ctx) {
  const h = await disaridanBul((await params).anahtar);
  if (!h || !h.s.disari?.api) return yanit({ ok: false, hata: "Geçersiz anahtar ya da API kapalı." }, 404);
  if (!hizSiniri(`sistem-api:${h.s.id}`, 60, 60_000)) return yanit({ ok: false, hata: "Çok fazla istek; dakikada en çok 60." }, 429);
  let girdi: unknown = {};
  const metin = await req.text();
  if (metin.trim()) { try { girdi = JSON.parse(metin); } catch { return yanit({ ok: false, hata: "Gövde geçerli JSON değil." }, 400); } }
  const bekle = new URL(req.url).searchParams.get("bekle") === "0" ? 0 : 60_000;
  const r = await disaridanCalistir(h, girdi, "api", bekle);
  if (r.tur === "hata") return yanit({ ok: false, hata: r.hata, ...(r.ayrinti ? { ayrinti: r.ayrinti } : {}) }, r.durum);
  if (r.tur === "suruyor") return yanit({ ok: true, durum: r.c.durum, calisma: r.c.id, mesaj: "Çalışma sürüyor; sonucu GET ile sor." }, 202);
  const x = r.sonuc;
  return yanit({ ok: x.durum === "basarili" || x.durum === "durdu", durum: x.durum, calisma: x.calisma, cikti: x.cikti, veri: x.veri, ...(x.hata ? { hata: x.hata } : {}), sure: x.sure, kredi: x.kredi }, x.durum === "basarisiz" ? 500 : 200);
}

/** Çalışma durumu: GET ?calisma=<kimlik>. Kimliksiz istek aracın tanımını döner. */
export async function GET(req: Request, { params }: Ctx) {
  const h = await disaridanBul((await params).anahtar);
  if (!h || !h.s.disari?.api) return yanit({ ok: false, hata: "Geçersiz anahtar ya da API kapalı." }, 404);
  const cid = new URL(req.url).searchParams.get("calisma");
  if (!cid) return yanit({ ok: true, sistem: h.s.ad, aciklama: h.s.disari.aracAciklama || h.s.aciklama, girdi: (h.s.girdi ?? []).map((a) => ({ ad: a.ad, tur: a.tur, zorunlu: !!a.zorunlu, aciklama: a.aciklama ?? a.etiket })) });
  const x = await disariCalisma(h, cid);
  if (!x) return yanit({ ok: false, hata: "Çalışma bulunamadı." }, 404);
  return yanit({ ok: true, ...x });
}

export function OPTIONS() { return new Response(null, { status: 204, headers: CORS }); }
