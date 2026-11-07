import { NextRequest, NextResponse } from "next/server";
import {
  gonderiKontrol, hesapDogrula, istatistik, kimlikDogrula, type Platform,
} from "@/lib/earn/entegrasyon";
import { oturumGerekli } from "@/lib/hesap/yetki";
import { basvuruEkle, basvurularim, itirazEt } from "@/lib/hesap/earnDepo";
import { kampanyaBul } from "@/lib/earn/kampanyalar";

export const runtime = "nodejs";

/**
 * Vayra Earn uç noktaları:
 *   POST /api/earn/hesap       { platform, kadi, kod }           → bio kodu doğrulama
 *   POST /api/earn/gonderi     { platform, link, kadi }          → gönderi var mı / sahibi mi
 *   POST /api/earn/istatistik  { platform, link }                → güncel görüntülenme
 *   POST /api/earn/kimlik      { tckn, ad, soyad, dogumYili }    → NVİ kimlik doğrulama
 *   POST /api/earn/basvuru     { kampanyaId, platform, link, kontrol? } → oturum gerekir; başvuru sunucuda "inceleme" durumunda kaydedilir
 *   POST /api/earn/itiraz      { id }                            → reddedilen başvuruya itiraz (oturum)
 *   GET  /api/earn/basvurular  → kullanıcının başvuruları ve inceleme durumları (oturum)
 *   POST /api/earn/cekim       → oturum gerekir; kazanç defteri sunucuda olmadığından 503 (ödeme yapılmaz)
 * Anahtar yoksa doğrulama yanıtında `gercek: false` döner; istemci kontrolü "yapılamadı" diye gösterir.
 * Başvuru durumu yalnız yönetim panelindeki kararla değişir (zamanla kendiliğinden onaylanmaz).
 */
const PLATFORMLAR: Platform[] = ["instagram", "tiktok", "youtube", "x"];
/** GET /api/earn/durum — hangi entegrasyonların canlı olduğu (anahtar değerleri dönmez). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ islem: string }> }) {
  const { islem } = await params;
  if (islem === "basvurular") {
    const o = await oturumGerekli(req);
    if (o instanceof Response) return o;
    return NextResponse.json({ ok: true, basvurular: await basvurularim(o.hesap.uid) }, { headers: { "Cache-Control": "no-store" } });
  }
  if (islem !== "durum") return NextResponse.json({ ok: false, hata: "Bilinmeyen işlem." }, { status: 404 });
  const e = process.env;
  return NextResponse.json({
    ok: true,
    dogrulama: { youtube: !!e.YOUTUBE_API_KEY, x: !!e.X_BEARER_TOKEN, instagram: !!(e.META_ACCESS_TOKEN && e.META_IG_USER_ID), tiktok: !!e.TIKTOK_RESEARCH_TOKEN },
    gonderiKontrol: { youtube: true, tiktok: true, x: true, instagram: !!e.META_OEMBED_TOKEN },
    istatistik: { youtube: !!e.YOUTUBE_API_KEY, x: !!e.X_BEARER_TOKEN, tiktok: !!e.TIKTOK_RESEARCH_TOKEN, instagram: false },
    odeme: { papara: false, iban: false },
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
        const o = await oturumGerekli(req);
        if (o instanceof Response) return o;
        const tckn = str("tckn", 11), ad = str("ad", 60), soyad = str("soyad", 60), yil = Number(g.dogumYili);
        if (!/^\d{11}$/.test(tckn) || !ad || !soyad || !(yil > 1900 && yil < 2015)) return hata("Eksik ya da geçersiz bilgi.");
        return NextResponse.json({ ok: true, ...(await kimlikDogrula(tckn, ad, soyad, yil)) });
      }
      case "basvuru": {
        const o = await oturumGerekli(req);
        if (o instanceof Response) return o;
        if (!PLATFORMLAR.includes(platform)) return hata("Geçersiz platform.");
        const k = kampanyaBul(str("kampanyaId", 80));
        if (!k) return hata("Kampanya bulunamadı.", 404);
        if (k.bitis <= Date.now()) return hata("Bu kampanya sona erdi; yeni başvuru alınmıyor.");
        if (!k.platformlar.includes(platform)) return hata("Bu kampanya bu platformu kabul etmiyor.");
        const link = str("link", 500);
        if (!/^https:\/\/\S+$/.test(link)) return hata("Geçersiz bağlantı.");
        const kk = g.kontrol as { gercek?: unknown; sahibiMi?: unknown } | undefined;
        const kontrol = kk && typeof kk === "object" ? { gercek: kk.gercek === true, sahibiMi: typeof kk.sahibiMi === "boolean" ? kk.sahibiMi : null } : undefined;
        const r = await basvuruEkle(o.hesap.uid, o.hesap.email, { kampanyaId: k.id, kampanyaAd: k.ad, platform, link, ...(kontrol ? { kontrol } : {}) });
        return r.ok ? NextResponse.json({ ok: true, basvuru: r.basvuru }) : hata(r.hata, 429);
      }
      case "itiraz": {
        const o = await oturumGerekli(req);
        if (o instanceof Response) return o;
        const b = await itirazEt(o.hesap.uid, str("id", 40));
        return b ? NextResponse.json({ ok: true, basvuru: b }) : hata("İtiraz edilebilecek bir başvuru bulunamadı.", 404);
      }
      case "cekim": {
        // Kazanç bakiyesi sunucuda tutulmuyor (gönderi kazançları tarayıcıda hesaplanıyor). Sunucu bakiyesi
        // doğrulanamayan bir tutarı ödemek güvenli değil: kazanç defteri sunucuya taşınana dek çekim kapalı.
        const o = await oturumGerekli(req);
        if (o instanceof Response) return o;
        return hata("Para çekme şu an kapalı: kazançların henüz sunucuda doğrulanmıyor. Ödeme yapılmadı, bakiyen olduğu gibi duruyor.", 503);
      }
      default:
        return hata("Bilinmeyen işlem.", 404);
    }
  } catch (e) {
    return hata(`İşlem başarısız: ${String(e).slice(0, 200)}`, 502);
  }
}
