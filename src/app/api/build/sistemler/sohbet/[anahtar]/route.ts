import { oturumMesajlari, sohbetBul, sohbetMesaj, sohbetTanimi, testMi } from "@/lib/build/sistemGenel";
import { hizSiniri } from "@/lib/build/ziyaretciDepo";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ anahtar: string }> };
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
const yanit = (v: unknown, durum = 200) => Response.json(v, { status: durum, headers: { ...CORS, "Cache-Control": "no-store" } });
const ipAl = (req: Request) => (req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "yerel").split(",")[0].trim().slice(0, 64);

/** Sohbet tanımı ve (oturum verilirse) oturumun mesajları: GET ?oturum=…&test=… */
export async function GET(req: Request, { params }: Ctx) {
  const h = await sohbetBul((await params).anahtar);
  if (!h) return yanit({ ok: false, hata: "Sohbet bulunamadı." }, 404);
  const q = new URL(req.url).searchParams;
  const test = testMi(h, q.get("test"));
  const oturum = q.get("oturum") ?? "";
  return yanit({ ok: true, ...sohbetTanimi(h, test), mesajlar: oturum ? await oturumMesajlari(h, oturum) : [] });
}

/**
 * Mesaj: { oturum, mesaj, test?, kaynak? }. Sistemi çalıştırır; Yanıt ver adımı ya da son çıktı en çok 45 saniye
 * beklenir, sürerse 202 { bekliyor, calisma } döner ve yanıt oturuma sonradan yazılır (GET ile sorulur).
 * Hız sınırı: oturum başına dakikada 20, kişi başına 40, sistem başına 120.
 */
export async function POST(req: Request, { params }: Ctx) {
  const anahtar = (await params).anahtar;
  const h = await sohbetBul(anahtar);
  if (!h) return yanit({ ok: false, hata: "Sohbet bulunamadı." }, 404);
  const metin = await req.text();
  if (metin.length > 20_000) return yanit({ ok: false, hata: "Mesaj çok uzun." }, 413);
  let g: { oturum?: string; mesaj?: string; test?: string; kaynak?: string } = {};
  try { g = JSON.parse(metin || "{}"); } catch { return yanit({ ok: false, hata: "İstek okunamadı." }, 400); }
  const ip = ipAl(req);
  const oturum = String(g.oturum ?? "");
  if (!hizSiniri(`sohbet:${anahtar}:${oturum}`, 20, 60_000) || !hizSiniri(`sohbet-ip:${anahtar}:${ip}`, 40, 60_000) || !hizSiniri(`sohbet-sistem:${h.s.id}`, 120, 60_000)) return yanit({ ok: false, hata: "Çok hızlı yazıyorsun; biraz bekleyip yeniden dene." }, 429);
  const r = await sohbetMesaj(h, oturum, String(g.mesaj ?? ""), testMi(h, g.test), g.kaynak === "gomulu" ? "gomulu" : "sayfa");
  const { durum, ...v } = r;
  return yanit(v, durum);
}

export function OPTIONS() { return new Response(null, { status: 204, headers: CORS }); }
