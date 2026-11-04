import { NextRequest, NextResponse } from "next/server";
import {
  gonderiKontrol, hesapDogrula, istatistik, kimlikDogrula, paparaOdeme, type Platform,
} from "@/lib/earn/entegrasyon";

export const runtime = "nodejs";

/**
 * Vayra Earn uç noktaları:
 *   POST /api/earn/hesap       { platform, kadi, kod }           → bio kodu doğrulama
 *   POST /api/earn/gonderi     { platform, link, kadi }          → gönderi var mı / sahibi mi
 *   POST /api/earn/istatistik  { platform, link }                → güncel görüntülenme
 *   POST /api/earn/kimlik      { tckn, ad, soyad, dogumYili }    → NVİ kimlik doğrulama
 *   POST /api/earn/cekim       { tur, hesapNo, tutar, referans, tckn? } → ödeme
 * Anahtar yoksa yanıtta `gercek: false` döner; istemci simülasyona düşer.
 */
const PLATFORMLAR: Platform[] = ["instagram", "tiktok", "youtube", "x"];
/** GET /api/earn/durum — hangi entegrasyonların canlı olduğu (anahtar değerleri dönmez). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ islem: string }> }) {
  const { islem } = await params;
  if (islem !== "durum") return NextResponse.json({ ok: false, hata: "Bilinmeyen işlem." }, { status: 404 });
  const e = process.env;
  return NextResponse.json({
    ok: true,
    dogrulama: { youtube: !!e.YOUTUBE_API_KEY, x: !!e.X_BEARER_TOKEN, instagram: !!(e.META_ACCESS_TOKEN && e.META_IG_USER_ID), tiktok: !!e.TIKTOK_RESEARCH_TOKEN },
    gonderiKontrol: { youtube: true, tiktok: true, x: true, instagram: !!e.META_OEMBED_TOKEN },
    istatistik: { youtube: !!e.YOUTUBE_API_KEY, x: !!e.X_BEARER_TOKEN, tiktok: !!e.TIKTOK_RESEARCH_TOKEN, instagram: false },
    odeme: { papara: !!e.PAPARA_API_KEY, iban: false },
  });
}

const hata = (mesaj: string, durum = 400) => NextResponse.json({ ok: false, hata: mesaj }, { status: durum });

export async function POST(req: NextRequest, { params }: { params: Promise<{ islem: string }> }) {
  const { islem } = await params;
  let g: Record<string, unknown>;
  try { g = await req.json(); } catch { return hata("Geçersiz JSON gövdesi."); }
  const str = (k: string, max = 300) => (typeof g[k] === "string" ? (g[k] as string).trim().slice(0, max) : "");
  const platform = str("platform") as Platform;

  try {
    switch (islem) {
      case "hesap": {
        if (!PLATFORMLAR.includes(platform)) return hata("Geçersiz platform.");
        const kadi = str("kadi", 60), kod = str("kod", 20);
        if (!/^@?[\w.]{2,30}$/.test(kadi) || !/^VYR-[A-Z0-9]{4}$/.test(kod)) return hata("Eksik ya da geçersiz bilgi.");
        return NextResponse.json({ ok: true, ...(await hesapDogrula(platform, kadi, kod)) });
      }
      case "gonderi": {
        if (!PLATFORMLAR.includes(platform)) return hata("Geçersiz platform.");
        const link = str("link", 500), kadi = str("kadi", 60);
        if (!/^https:\/\/\S+$/.test(link) || !kadi) return hata("Eksik ya da geçersiz bilgi.");
        return NextResponse.json({ ok: true, ...(await gonderiKontrol(platform, link, kadi)) });
      }
      case "istatistik": {
        if (!PLATFORMLAR.includes(platform)) return hata("Geçersiz platform.");
        const link = str("link", 500);
        if (!/^https:\/\/\S+$/.test(link)) return hata("Geçersiz bağlantı.");
        return NextResponse.json({ ok: true, ...(await istatistik(platform, link)) });
      }
      case "kimlik": {
        const tckn = str("tckn", 11), ad = str("ad", 60), soyad = str("soyad", 60), yil = Number(g.dogumYili);
        if (!/^\d{11}$/.test(tckn) || !ad || !soyad || !(yil > 1900 && yil < 2015)) return hata("Eksik ya da geçersiz bilgi.");
        return NextResponse.json({ ok: true, ...(await kimlikDogrula(tckn, ad, soyad, yil)) });
      }
      case "cekim": {
        const tur = str("tur"), hesapNo = str("hesapNo", 40), referans = str("referans", 60), tutar = Number(g.tutar);
        if (!["papara", "iban"].includes(tur) || !hesapNo || !referans || !(tutar >= 250 && tutar <= 250_000)) return hata("Eksik ya da geçersiz bilgi.");
        // IBAN havalesi banka/ödeme kuruluşu sözleşmesi gerektirir; o entegrasyon gelene dek kuyruğa alınır.
        if (tur === "iban") return NextResponse.json({ ok: true, gercek: false });
        return NextResponse.json({ ok: true, ...(await paparaOdeme({ hesapNo, tutar, referans, tckn: str("tckn", 11) || undefined })) });
      }
      default:
        return hata("Bilinmeyen işlem.", 404);
    }
  } catch (e) {
    return hata(`İşlem başarısız: ${String(e).slice(0, 200)}`, 502);
  }
}
