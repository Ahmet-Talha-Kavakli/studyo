import { ekGuncelle, ekOku, hizAsildi, istekIp, projeKimligiGecerli } from "@/lib/build/buyumeEkDepo";
import { kodUygun } from "@/lib/build/buyumeEkTipler";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
const yanit = (v: unknown, durum = 200) => Response.json(v, { status: durum, headers: CORS });
const bugun = () => new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10);

/**
 * İndirim ve tavsiye kodu doğrulama (sitelerden, herkese açık):
 *  GET ?kod=X   → { gecerli, tur, deger, aciklama }   (IP başına dakikada 20 deneme; kod tahminine karşı)
 *  POST {kod}   → kullanımı bir artırır (sipariş tamamlanınca); sınır dolduysa gecerli: false
 */
async function bul(req: Request, id: string, kod: string) {
  if (!projeKimligiGecerli(id) || !/^[A-Z0-9_-]{3,24}$/.test(kod)) return null;
  if (hizAsildi(`kod:${istekIp(req)}:${id}`, 20)) return "sinir" as const;
  return (await ekOku(id)).kodlar.find((k) => k.kod === kod) ?? null;
}
export async function GET(req: Request, { params }: Ctx) {
  const id = (await params).id;
  const k = await bul(req, id, (new URL(req.url).searchParams.get("kod") ?? "").trim().toUpperCase());
  if (k === "sinir") return yanit({ ok: false, hata: "Çok fazla deneme; biraz sonra tekrar dene." }, 429);
  if (!k || !kodUygun(k, bugun())) return yanit({ ok: true, gecerli: false });
  return yanit({ ok: true, gecerli: true, kod: k.kod, tur: k.tur, deger: k.deger, aciklama: k.aciklama });
}
export async function POST(req: Request, { params }: Ctx) {
  const id = (await params).id;
  let g: { kod?: unknown } = {};
  try { g = JSON.parse((await req.text()).slice(0, 300)); } catch { /* boş */ }
  const kod = String(g.kod ?? "").trim().toUpperCase();
  const k = await bul(req, id, kod);
  if (k === "sinir") return yanit({ ok: false, hata: "Çok fazla deneme." }, 429);
  if (!k || !kodUygun(k, bugun())) return yanit({ ok: true, gecerli: false });
  await ekGuncelle(id, (v) => { const x = v.kodlar.find((y) => y.id === k.id); if (x && kodUygun(x, bugun())) x.kullanim++; });
  return yanit({ ok: true, gecerli: true, kullanildi: true });
}
export function OPTIONS() { return new Response(null, { status: 204, headers: CORS }); }
