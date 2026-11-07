import "server-only";
import { hizSiniri } from "./ziyaretciDepo";
import { islemTemizle, OdaHatasi, odaAdiGecerli, odaEsitle, odaUygula } from "./bulutOda";
import { veriAyarOku } from "./bulutVeriAyar";
import type { VeriOrtami } from "./veri";

/** Veri API'sinde odaların yolu: /api/build/veri/<proje>/$oda/<ad>. */
export const ODA = "$oda";
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-vayra-onizleme, x-build-sahip, x-vayra-oturum" };
const yanit = (v: unknown, durum = 200) => new Response(JSON.stringify(v), { status: durum, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...CORS } });

type Baglam = { id: string; yetkili: boolean; sahipMi: boolean; ortam: VeriOrtami; kim: string; uyeId: string | null; kayit?: string };

/**
 *  GET  …/$oda/<ad>?sonra=<seq>   eşitleme: kayıp yoksa sonraki olaylar, değilse bütün durum
 *  POST …/$oda/<ad>  { islemler: [...], kosul?: { seq }, ben? }   işlemleri uygula (tek olay)
 * Erişim: projenin oda ayarı (okuma herkes ya da üyeler; yazma herkes, üyeler ya da yalnız sunucu). "uyeler:" ile
 * başlayan odalara yalnız giriş yapmış üyeler girer. Sahip ve önizleme her şeyi yapar. Ziyaretçi yazımı IP başına
 * dakikada 240 ile sınırlı.
 */
export async function odaIstegi(req: Request, b: Baglam): Promise<Response> {
  const ad = b.kayit ?? "";
  if (!odaAdiGecerli(ad)) return yanit({ ok: false, hata: "Oda adı yalnız harf, rakam, tire, alt çizgi ve iki nokta olabilir (en çok 50)." }, 400);
  const ayar = (await veriAyarOku(b.id)).oda;
  const uyeOdasi = ad.startsWith("uyeler:");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "yerel";
  try {
    if (req.method === "GET") {
      if (!b.yetkili && (uyeOdasi || ayar.okuma === "uyeler") && !b.uyeId) return yanit({ ok: false, hata: "Bu odayı görmek için giriş yap." }, 401);
      if (!b.yetkili && !hizSiniri(`oda-oku:${b.id}:${ip}`, 600, 60_000)) return yanit({ ok: false, hata: "Çok fazla istek; biraz bekle." }, 429);
      const s = Number(new URL(req.url).searchParams.get("sonra"));
      return yanit({ ok: true, ...(await odaEsitle(b.id, b.ortam, ad, new URL(req.url).searchParams.has("sonra") ? s : undefined)) });
    }
    if (req.method !== "POST") return yanit({ ok: false, hata: "Yöntem desteklenmiyor." }, 405);
    if (!b.yetkili) {
      if (ayar.yazma === "sunucu") return yanit({ ok: false, hata: "Bu projede odalara yalnız sunucu fonksiyonları yazar (Bulut › Odalar ayarı)." }, 403);
      if ((ayar.yazma === "uyeler" || uyeOdasi) && !b.uyeId) return yanit({ ok: false, hata: "Odaya yazmak için giriş yap." }, 401);
      if (!hizSiniri(`oda-yaz:${b.id}:${ip}`, 240, 60_000)) return yanit({ ok: false, hata: "Çok fazla işlem; biraz bekle." }, 429);
    }
    let g: { islemler?: unknown; kosul?: { seq?: number }; ben?: string } = {};
    try { g = await req.json(); } catch { return yanit({ ok: false, hata: "Geçersiz gövde." }, 400); }
    const islemler = islemTemizle(g.islemler);
    const kim = typeof g.ben === "string" && /^[A-Za-z0-9_-]{4,20}$/.test(g.ben) ? g.ben : b.sahipMi ? "panel" : b.kim;
    const olay = await odaUygula(b.id, b.ortam, ad, islemler, { kim, uyeId: b.uyeId, kosul: g.kosul });
    return yanit({ ok: true, olay });
  } catch (e) {
    if (e instanceof OdaHatasi) return yanit({ ok: false, hata: e.message, ...(e.ek ?? {}) }, e.durum);
    return yanit({ ok: false, hata: "Oda işlemi yapılamadı." }, 500);
  }
}
