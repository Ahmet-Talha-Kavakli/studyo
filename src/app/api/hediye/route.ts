import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

/**
 * Promosyon ve hediye kodları — doğrulama sunucuda yapılır.
 *
 * - Promosyon kodları yalnız burada tanımlı; istemci paketinde görünmez.
 * - Hediye kodu: "VAYRA-" + kredi + rastgele kısım + HMAC imzası. İmza sunucudaki sırla
 *   atıldığı için kod elde üretilemez. Kullanılan kodlar bellekte tutulur (aynı kod iki
 *   kez kullanılamaz); istemci de kendi hesabında ikinci bir kayıt tutar.
 */

const SIR = process.env.VAYRA_HEDIYE_SIRRI ?? "vayra_hediye_imza_siri_2026";
const PROMOSYONLAR: Record<string, { kredi: number; aciklama: string; bitis?: string }> = {
  HOSGELDIN: { kredi: 100, aciklama: "Hoş geldin hediyesi" },
  VAYRA50: { kredi: 50, aciklama: "Topluluk kodu" },
  YARATICI2026: { kredi: 250, aciklama: "2026 yaratıcı kampanyası", bitis: "2026-12-31T23:59:59+03:00" },
};
const HEDIYE_TUTARLARI = [100, 250, 500, 1000, 2500];

type Durum = { kullanilan: Map<string, { email: string; zaman: number }> };
const g = globalThis as unknown as { __vayraHediye?: Durum };
const durum: Durum = (g.__vayraHediye ??= { kullanilan: new Map() });

const imza = (govde: string) => createHmac("sha256", SIR).update(govde).digest("base64url").replace(/[-_]/g, "").slice(0, 8).toUpperCase();

function hediyeCoz(kod: string): { kredi: number } | null {
  const m = /^VAYRA-(\d{3,4})-([A-Z0-9]{6})-([A-Z0-9]{8})$/.exec(kod);
  if (!m) return null;
  const beklenen = imza(`${m[1]}-${m[2]}`);
  const a = Buffer.from(beklenen), b = Buffer.from(m[3]);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const kredi = Number(m[1]);
  return HEDIYE_TUTARLARI.includes(kredi) ? { kredi } : null;
}

const hata = (mesaj: string, kod = 400) => NextResponse.json({ ok: false, hata: mesaj }, { status: kod });

export async function POST(req: Request) {
  let b: { islem?: string; kod?: string; kredi?: number; email?: string };
  try { b = await req.json(); } catch { return hata("Geçersiz istek"); }
  const email = String(b.email ?? "").trim().toLowerCase();
  if (!email.includes("@")) return hata("Giriş gerekli", 401);

  if (b.islem === "olustur") {
    const kredi = Number(b.kredi);
    if (!HEDIYE_TUTARLARI.includes(kredi)) return hata("Geçersiz tutar");
    const alfabe = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const rast = Array.from(randomBytes(6), (x) => alfabe[x % alfabe.length]).join("");
    const govde = `${String(kredi).padStart(3, "0")}-${rast}`;
    return NextResponse.json({ ok: true, kod: `VAYRA-${govde}-${imza(govde)}`, kredi });
  }

  if (b.islem === "kullan") {
    const kod = String(b.kod ?? "").trim().toUpperCase().replace(/\s+/g, "");
    if (!kod) return hata("Bir kod gir.");
    const promo = PROMOSYONLAR[kod];
    if (promo) {
      if (promo.bitis && Date.now() > Date.parse(promo.bitis)) return hata("Bu kampanyanın süresi doldu.", 410);
      const anahtar = `${kod}:${email}`;
      if (durum.kullanilan.has(anahtar)) return hata("Bu kodu bu hesapta zaten kullandın.", 409);
      durum.kullanilan.set(anahtar, { email, zaman: Date.now() });
      return NextResponse.json({ ok: true, tur: "promo", kod, kredi: promo.kredi, aciklama: promo.aciklama });
    }
    const h = hediyeCoz(kod);
    if (!h) return hata("Bu kod geçerli değil. Harfleri ve tireleri kontrol et.", 404);
    const once = durum.kullanilan.get(kod);
    if (once) return hata(once.email === email ? "Bu hediye kodunu zaten kullandın." : "Bu hediye kodu başka bir hesapta kullanılmış.", 409);
    durum.kullanilan.set(kod, { email, zaman: Date.now() });
    return NextResponse.json({ ok: true, tur: "hediye", kod, kredi: h.kredi, aciklama: "Hediye kredisi" });
  }

  if (b.islem === "durum") {
    const kodlar = (Array.isArray((b as { kodlar?: unknown }).kodlar) ? (b as { kodlar: string[] }).kodlar : []).slice(0, 100);
    return NextResponse.json({ ok: true, durumlar: Object.fromEntries(kodlar.map((k) => { const u = durum.kullanilan.get(String(k).toUpperCase()); return [k, u ? { kullanildi: u.zaman } : { kullanildi: null }]; })) });
  }

  return hata("Bilinmeyen işlem");
}

export function GET() {
  return NextResponse.json({ tutarlar: HEDIYE_TUTARLARI });
}
