import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { falBagli, upscaleBaslat, upscaleSorgula, type UpscaleDurum } from "@/lib/saglayicilar/upscale";
import { upscaleModel, type UpscaleAyar, type UpscaleModelId } from "@/lib/upscaleVeri";
import { isFaturasi, isFaturasiYaz, isIade, isKapat, krediAl, sahteSaglayici, saglayiciyla } from "@/lib/hesap/krediKapi";
import { gelistirme } from "@/lib/hesap/guvenlik";
import { oturumGerekli } from "@/lib/hesap/yetki";
import { depoGorselBoyutu } from "@/lib/gorselBoyut";
import { upscaleTutari } from "@/lib/krediTarife";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Sınama işi (yalnız geliştirmede, sahte sağlayıcıyla başlatılan): sağlayıcıya gitmez. */
const SINAMA = "sinama.";

/**
 * İşi başlatır: { model, kaynakUrl, olcek, ayar, genislik?, yukseklik?, sureSn?, kredi? } → { jeton, kredi }.
 * Oturum gerekir. Bedel çıktı megapikseline göre sunucuda hesaplanır: depodaki görselin boyutu dosyadan okunur
 * (istemcinin bildirdiği boyut yalnız dosya okunamazsa kullanılır). Kesinti iş başlarken yapılır; sağlayıcı işi
 * başlatamazsa hemen, sonradan başarısız olursa durum sorgusunda iade edilir.
 */
export async function POST(req: NextRequest) {
  const o = await oturumGerekli(req);
  if (o instanceof Response) return o;
  const g = (await req.json().catch(() => ({}))) as { model?: string; kaynakUrl?: string; olcek?: number; ayar?: UpscaleAyar; genislik?: number; yukseklik?: number; sureSn?: number; kredi?: unknown };
  const m = g.model ? upscaleModel(g.model) : undefined;
  if (!m) return NextResponse.json({ ok: false, hata: "Geçersiz model." }, { status: 400 });
  if (!g.kaynakUrl) return NextResponse.json({ ok: false, hata: "Kaynak dosya yok." }, { status: 400 });
  if (!falBagli() && !sahteSaglayici(req)) return NextResponse.json({ ok: false, hata: "Büyütme sağlayıcısı (fal.ai) bağlı değil." }, { status: 503 });
  const olcek = Number(g.olcek) || 2;
  const boyut = m.tur === "gorsel" ? await depoGorselBoyutu(g.kaynakUrl) : null;
  const taban = upscaleTutari(m.id, { w: boyut?.w ?? g.genislik, h: boyut?.h ?? g.yukseklik, sureSn: g.sureSn, olcek });
  const k = await krediAl(req, { oturum: o, kaynak: "upscale", aciklama: `Büyütme · ${m.ad} · ${olcek || 2} kat`, taban, istemci: g.kredi, ucretli: true });
  if (k instanceof Response) return k;
  try {
    const { jeton } = await saglayiciyla(k,
      () => upscaleBaslat({ model: m.id as UpscaleModelId, kaynakUrl: g.kaynakUrl!, olcek, ayar: g.ayar }),
      () => ({ jeton: `${SINAMA}${randomBytes(12).toString("hex")}` }));
    await isFaturasiYaz(jeton, k);
    return NextResponse.json({ ok: true, jeton, ...k.alanlar() });
  } catch (e) {
    await k.iade("Büyütme başlatılamadı: kredi iade edildi");
    return NextResponse.json({ ok: false, hata: e instanceof Error ? e.message : "Başlatılamadı.", ...k.alanlar() }, { status: 502 });
  }
}

/** Durum: ?jeton= → { durum, ... }. İş başarısız olduysa kesinti burada bir kez iade edilir ({ kredi: { iade, bakiye } }). */
export async function GET(req: NextRequest) {
  const o = await oturumGerekli(req);
  if (o instanceof Response) return o;
  const jeton = req.nextUrl.searchParams.get("jeton");
  if (!jeton) return NextResponse.json({ durum: "hata", hata: "İş yok." }, { status: 400 });
  const f = await isFaturasi(jeton);
  if (f && f.uid !== o.hesap.uid) return NextResponse.json({ durum: "hata", hata: "Bu iş başka bir hesaba ait." }, { status: 403 });
  let d: UpscaleDurum;
  if (jeton.startsWith(SINAMA)) {
    d = !gelistirme() ? { durum: "hata", hata: "Geçersiz iş." }
      : sahteSaglayici(req) === "hata" ? { durum: "hata", hata: "Sınama: sağlayıcı işi tamamlayamadı." }
      : { durum: "tamam", url: "/gercek/galeri/3d1.webp", genislik: 2048, yukseklik: 2048 };
  } else {
    try { d = await upscaleSorgula(jeton); } catch (e) { d = { durum: "hata", hata: e instanceof Error ? e.message : "Sorgulanamadı." }; }
  }
  if (d.durum === "hata") {
    const iade = await isIade(jeton, "Büyütme sağlayıcıda tamamlanamadı: kredi iade edildi");
    return NextResponse.json({ ...d, ...(iade ? { kredi: { harcanan: 0, iade: true, ...(iade.bakiye !== undefined ? { bakiye: iade.bakiye } : {}) } } : {}) });
  }
  if (d.durum === "tamam") await isKapat(jeton);
  return NextResponse.json(d);
}
