import { beklemeOku, beklemeSil, prosedurImzaDogru } from "@/lib/build/ajanProsedur";
import { prosedurDisOlay } from "@/lib/build/ajanProsedurDevam";
import { denemeOku, hizSiniri, konusmaDosyadan } from "@/lib/build/ziyaretciDepo";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string; gizli: string }> };
const yanit = (v: unknown, durum = 200) => Response.json(v, { status: durum });

/**
 * Prosedürün "Web kancası bekle" adımına dış sistemin sonucu: gizli adres yalnız o konuşmanın o bekleme adımı için
 * üretilir ve bir kez kullanılır. Prosedürde imza anahtarı varsa X-Vayra-Imza: sha256=<HMAC-SHA256(anahtar, gövde)>
 * zorunludur. Gövde JSON ise değişkene nesne olarak, değilse metin olarak yazılır. IP başına dakikada 30 istek.
 */
export async function POST(req: Request, { params }: Ctx) {
  const { id, gizli } = await params;
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "yerel";
  if (!hizSiniri(`prosedur-kanca:${ip}`, 30, 60_000)) return yanit({ ok: false, hata: "Çok fazla istek." }, 429);
  const b = await beklemeOku(gizli);
  if (!b || b.ajanId !== id) return yanit({ ok: false, hata: "Bekleme bulunamadı ya da kullanıldı." }, 404);
  if (b.bitis < Date.now()) return yanit({ ok: false, hata: "Bekleme süresi doldu." }, 410);
  const ham = await req.text();
  if (ham.length > 100_000) return yanit({ ok: false, hata: "Gövde çok büyük." }, 413);
  const k = b.dosyaId === "deneme" ? await denemeOku(id) : await konusmaDosyadan(id, b.dosyaId);
  const d = k?.prosedur;
  if (!d || d.bekleme?.tur !== "webhook" || d.bekleme.gizli !== gizli) return yanit({ ok: false, hata: "Bu konuşma artık bu adımı beklemiyor." }, 409);
  if (d.tanim.imza && !prosedurImzaDogru(d.tanim.imza, ham, req.headers.get("x-vayra-imza"))) return yanit({ ok: false, hata: "İmza doğrulanamadı." }, 401);
  let veri: unknown = ham;
  try { veri = JSON.parse(ham); } catch { /* düz metin */ }
  await beklemeSil(gizli);
  const r = await prosedurDisOlay({ ajanId: id, sahipOz: b.sahipOz, dosyaId: b.dosyaId }, { tur: "webhook", veri });
  if (r.hata) return yanit({ ok: false, hata: r.hata }, 409);
  return yanit({ ok: true, ...(r.kanalHata ? { kanalHata: r.kanalHata } : {}) });
}
