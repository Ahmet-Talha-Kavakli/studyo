import { davetKatil, davetOnizle } from "@/lib/build/ekip";
import { ekipHataYaniti } from "@/lib/build/ekipRota";
import { hata, sahipAl } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ kod: string }> };

/** Basit sınır: aynı IP'den dakikada 30 istek (kodlar 144 bit rastgele; yine de taramayı yavaşlatır). */
const sayac = new Map<string, number[]>();
function sinirli(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "yerel";
  const s = Date.now(), l = (sayac.get(ip) ?? []).filter((t) => s - t < 60_000);
  l.push(s); sayac.set(ip, l);
  if (sayac.size > 5000) sayac.clear();
  return l.length > 30;
}

/**
 * Davet önizlemesi: proje adı, kapak, sahibin adı, rol ve isteği yapanın durumu (gecerli | uye | sahip).
 * Geçersiz: 404 (kod "gecersiz"); süresi dolmuş ya da kullanılmış: 410 (kod "suresi-doldu" | "kullanildi").
 */
export async function GET(req: Request, { params }: Ctx) {
  if (sinirli(req)) return hata("Çok fazla deneme; biraz bekle.", 429);
  try { return Response.json({ ok: true, davet: await davetOnizle((await params).kod, sahipAl(req)) }); }
  catch (e) { return ekipHataYaniti(e); }
}

/** Katıl: { ad } (ekipte görünecek ad). Sahip kendi davetine katılamaz; zaten üyeyse 409 (kod "uye"). */
export async function POST(req: Request, { params }: Ctx) {
  if (sinirli(req)) return hata("Çok fazla deneme; biraz bekle.", 429);
  const sahip = sahipAl(req);
  if (!sahip) return hata("Oturum anahtarı eksik; sayfayı yenile.", 401);
  let g: { ad?: unknown } = {};
  try { g = await req.json(); } catch { /* ad isteğe bağlı */ }
  try { return Response.json({ ok: true, ...(await davetKatil((await params).kod, sahip, g.ad)) }); }
  catch (e) { return ekipHataYaniti(e); }
}
