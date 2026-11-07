import { formBul, formGonder, formTanimi, testMi } from "@/lib/build/sistemGenel";
import { hizSiniri } from "@/lib/build/ziyaretciDepo";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ anahtar: string }> };
const yanit = (v: unknown, durum = 200) => Response.json(v, { status: durum, headers: { "Cache-Control": "no-store" } });
const ipAl = (req: Request) => (req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "yerel").split(",")[0].trim().slice(0, 64);

/** Form tanımı (sayfa sunucuda da okur): GET ?test=<test anahtarı> taslak tetiği gösterir. */
export async function GET(req: Request, { params }: Ctx) {
  const h = await formBul((await params).anahtar);
  if (!h) return yanit({ ok: false, hata: "Form bulunamadı." }, 404);
  return yanit({ ok: true, ...formTanimi(h, testMi(h, new URL(req.url).searchParams.get("test"))) });
}

/**
 * Form gönderimi: { alanlar: {...}, _web: "" (bot tuzağı, boş olmalı), _t: sayfada geçen ms, sorgu: {...}, test }.
 * Hız sınırı: kişi başına dakikada 10, sistem başına dakikada 60. Yanıt: { ok, mesaj?, sonuc?, yonlendir?, hatalar? }.
 */
export async function POST(req: Request, { params }: Ctx) {
  const anahtar = (await params).anahtar;
  const h = await formBul(anahtar);
  if (!h) return yanit({ ok: false, hata: "Form bulunamadı." }, 404);
  const metin = await req.text();
  if (metin.length > 80_000) return yanit({ ok: false, hata: "Gönderilen veri çok büyük." }, 413);
  let g: { alanlar?: Record<string, unknown>; _web?: string; _t?: number; sorgu?: Record<string, unknown>; test?: string } = {};
  try { g = JSON.parse(metin || "{}"); } catch { return yanit({ ok: false, hata: "İstek okunamadı." }, 400); }
  const ip = ipAl(req);
  if (!hizSiniri(`form:${anahtar}:${ip}`, 10, 60_000) || !hizSiniri(`form-sistem:${h.s.id}`, 60, 60_000)) return yanit({ ok: false, hata: "Çok fazla gönderim; bir dakika sonra yeniden dene." }, 429);
  // Bot tuzağı ve çok hızlı doldurma: sessizce kabul edilmiş gibi yanıt verilir, çalışma başlamaz.
  if ((g._web ?? "").trim() || (typeof g._t === "number" && g._t < 1200)) return yanit({ ok: true, mesaj: "Teşekkürler, yanıtın alındı." });
  const test = testMi(h, g.test);
  const sorgu = Object.fromEntries(Object.entries(g.sorgu && typeof g.sorgu === "object" ? g.sorgu : {}).slice(0, 20).map(([k, v]) => [k.slice(0, 40), String(v ?? "").slice(0, 300)]));
  const r = await formGonder(h, g.alanlar && typeof g.alanlar === "object" && !Array.isArray(g.alanlar) ? g.alanlar : {}, test, sorgu);
  const { durum, ...v } = r;
  return yanit(v, durum);
}
