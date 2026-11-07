import { ekGuncelle, hizAsildi, istekIp, kisaBul } from "@/lib/build/buyumeEkDepo";
import { ekOku } from "@/lib/build/buyumeEkDepo";
import { utmEkle } from "@/lib/build/buyumeEkTipler";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ kod: string }> };

/**
 * Vayra kısa bağlantısı: /k/<kod> hedefe (UTM eklenmiş) 302 ile yönlenir, tık sayılır (gün, kaynak alan adı, cihaz).
 * Bot ve önizleme tarayıcıları sayılmaz; aynı IP'den dakikada 20'den fazla tık sayılmaz ama yönlendirme her zaman yapılır.
 */
const BOT = /bot|crawl|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|headless|curl|wget|python|go-http/i;
const trGun = () => new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10);
const bulunamadi = () => new Response(`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Bağlantı yok</title><body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#0b0b0d;color:#e9eef5;font:16px system-ui"><div style="text-align:center;padding:24px"><p style="font-size:20px;font-weight:600;margin:0">Bu kısa bağlantı bulunamadı</p><p style="color:#9aa3ad">Silinmiş ya da yanlış yazılmış olabilir.</p></div>`, { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });

export async function GET(req: Request, { params }: Ctx) {
  const kod = (await params).kod.toLowerCase();
  if (!/^[a-z0-9_-]{3,32}$/.test(kod)) return bulunamadi();
  const projeId = kisaBul(kod);
  if (!projeId) return bulunamadi();
  const b = (await ekOku(projeId)).baglantilar.find((x) => x.kod === kod);
  if (!b) return bulunamadi();
  const ua = req.headers.get("user-agent") ?? "";
  if (!BOT.test(ua) && !hizAsildi(`kisa:${istekIp(req)}:${kod}`, 20)) {
    const ref = (() => { try { return new URL(req.headers.get("referer") ?? "").hostname.replace(/^www\./, "") || "Doğrudan"; } catch { return "Doğrudan"; } })();
    const cihaz = /mobile|iphone|android/i.test(ua) ? "Telefon" : /ipad|tablet/i.test(ua) ? "Tablet" : "Masaüstü";
    ekGuncelle(projeId, (v) => {
      const x = v.baglantilar.find((y) => y.kod === kod);
      if (!x) return;
      x.tik++; x.sonTik = Date.now();
      const g = trGun(); x.gunler[g] = (x.gunler[g] ?? 0) + 1;
      for (const k of Object.keys(x.gunler).sort().slice(0, -120)) delete x.gunler[k];
      if (ref in x.kaynaklar || Object.keys(x.kaynaklar).length < 50) x.kaynaklar[ref] = (x.kaynaklar[ref] ?? 0) + 1;
      x.cihazlar[cihaz] = (x.cihazlar[cihaz] ?? 0) + 1;
    }).catch(() => {});
  }
  return new Response(null, { status: 302, headers: { Location: utmEkle(b.hedef, b.utm), "Cache-Control": "no-store", "Referrer-Policy": "no-referrer-when-downgrade" } });
}
