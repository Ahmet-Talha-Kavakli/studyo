import { timingSafeEqual } from "crypto";
import { sistemGuncelleOz, sistemHam, yeniKimlik } from "@/lib/build/sistemDepo";
import { hizSiniri } from "@/lib/build/ziyaretciDepo";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string; anahtar: string }> };
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, PUT, PATCH, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
const yanit = (v: unknown, durum = 200) => Response.json(v, { status: durum, headers: CORS });

/**
 * Test web kancası: POST /api/build/sistemler/test-kanca/<sistem>/<test anahtarı>. Yalnız düzenleyicide "Test olayını
 * dinle" açıkken (3 dakika) kabul eder; gelen istek hiçbir akışı çalıştırmaz, deneme verisi olur ve düzenleyiciye düşer.
 * Canlı adres (/api/build/genel/sistem/...) yayındaki sürümü çalıştırır.
 */
async function al(req: Request, { params }: Ctx) {
  const { id, anahtar } = await params;
  const h = await sistemHam(id);
  const a = Buffer.from(h?.s.testAnahtari ?? ""), b = Buffer.from(anahtar);
  if (!h || !h.s.testAnahtari || a.length !== b.length || !timingSafeEqual(a, b)) return yanit({ ok: false, hata: "Geçersiz test adresi." }, 404);
  if (!hizSiniri(`sistem-test:${id}`, 30, 60_000)) return yanit({ ok: false, hata: "Çok fazla istek." }, 429);
  if (!h.s.test?.dinle || h.s.test.dinle < Date.now()) return yanit({ ok: false, hata: "Test dinlemesi kapalı. Düzenleyicide Test olayını dinle düğmesine bas, sonra isteği yeniden gönder. Canlı çalışma için canlı adresi kullan." }, 409);
  const tur = req.headers.get("content-type") ?? "";
  let veri: unknown = {};
  try {
    if (tur.includes("json")) veri = await req.json();
    else if (tur.includes("form")) veri = Object.fromEntries((await req.formData()).entries());
    else { const t = (await req.text()).slice(0, 100_000); veri = t ? { govde: t } : {}; }
  } catch { return yanit({ ok: false, hata: "Gövde okunamadı." }, 400); }
  const sorgu = Object.fromEntries(new URL(req.url).searchParams.entries());
  if (Object.keys(sorgu).length && veri && typeof veri === "object" && !Array.isArray(veri)) veri = { ...veri, sorgu };
  if (JSON.stringify(veri).length > 60_000) return yanit({ ok: false, hata: "Gövde çok büyük (60 KB sınırı)." }, 413);
  await sistemGuncelleOz(id, h.sahipOz, (s) => {
    s.test ??= {};
    s.test.tetik = veri; s.test.sonTetik = veri; s.test.dinle = undefined;
    s.test.olaylar = [{ id: yeniKimlik(8), zaman: Date.now(), tur: "webhook-test", veri }, ...(s.test.olaylar ?? [])].slice(0, 10);
  });
  return yanit({ ok: true, mesaj: "Test olayı alındı; düzenleyicide deneme verisi oldu. Hiçbir akış çalıştırılmadı." });
}
export const POST = al;
export const PUT = al;
export const PATCH = al;
export function OPTIONS() { return new Response(null, { status: 204, headers: CORS }); }
