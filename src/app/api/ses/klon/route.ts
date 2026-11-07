import { NextRequest, NextResponse } from "next/server";
import { sesKlonla } from "@/lib/saglayicilar/eleven";
import { krediAl, sahteSaglayici, saglayiciyla } from "@/lib/hesap/krediKapi";
import { oturumGerekli } from "@/lib/hesap/yetki";
import { SABIT_KREDI } from "@/lib/krediTarife";

export const runtime = "nodejs";

/**
 * Anlık ses klonu. Gövde:
 *  { ad, ornekler: [{ veri: dataURL, ad }] (1–5), aciklama?, etiketler?: { anahtar: değer }, gurultuTemizle? }
 *  Eski biçim de kabul edilir: { ad, ornek: dataURL, dosyaAdi }.
 * Oturum gerekir. Sağlayıcı bağlı değilse 503 (kredi kesilmez). Bedel sabittir (lib/krediTarife), klon istenmeden
 * önce kesilir; sağlayıcı hata verirse iade edilir.
 */
export async function POST(req: NextRequest) {
  const o = await oturumGerekli(req);
  if (o instanceof Response) return o;
  if (!process.env.ELEVENLABS_API_KEY && !sahteSaglayici(req)) {
    return NextResponse.json({ ok: false, hata: "Ses sağlayıcısı bağlı değil; klonlama yapılamıyor." }, { status: 503 });
  }
  let govde: { ad?: string; ornek?: string; dosyaAdi?: string; ornekler?: { veri?: string; ad?: string }[]; aciklama?: string; etiketler?: Record<string, unknown>; gurultuTemizle?: boolean };
  try { govde = await req.json(); } catch { return NextResponse.json({ ok: false, hata: "Geçersiz istek." }, { status: 400 }); }
  const ad = govde.ad?.trim();
  if (!ad || ad.length < 2) return NextResponse.json({ ok: false, hata: "Sese bir ad ver." }, { status: 400 });
  const ornekler = (govde.ornekler?.length ? govde.ornekler : govde.ornek ? [{ veri: govde.ornek, ad: govde.dosyaAdi }] : [])
    .filter((o): o is { veri: string; ad?: string } => typeof o?.veri === "string" && o.veri.startsWith("data:"))
    .slice(0, 5)
    .map((o, i) => ({ veri: o.veri, ad: (o.ad || `ornek-${i + 1}`).slice(0, 120) }));
  if (!ornekler.length) return NextResponse.json({ ok: false, hata: "Örnek ses gerekli." }, { status: 400 });
  const etiketler = Object.fromEntries(Object.entries(govde.etiketler ?? {})
    .filter(([k, v]) => typeof v === "string" && k.trim() && (v as string).trim()).slice(0, 5)
    .map(([k, v]) => [k.trim().slice(0, 30), (v as string).trim().slice(0, 40)]));
  const k = await krediAl(req, { oturum: o, kaynak: "ses/klon", aciklama: `Ses klonu · ${ad.slice(0, 40)}`, taban: SABIT_KREDI.sesKlon, ucretli: true });
  if (k instanceof Response) return k;
  try {
    const { sesId } = await saglayiciyla(k, () => sesKlonla(ad, ornekler, { aciklama: govde.aciklama, etiketler, gurultuTemizle: govde.gurultuTemizle !== false }), () => ({ sesId: "sinamaSes0123456789" }));
    return NextResponse.json({ ok: true, sesId, ...k.alanlar() });
  } catch (e) {
    await k.iade("Ses klonlanamadı: kredi iade edildi");
    return NextResponse.json({ ok: false, hata: String(e instanceof Error ? e.message : e).slice(0, 300), ...k.alanlar() }, { status: 502 });
  }
}
