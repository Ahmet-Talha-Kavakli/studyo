import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { loraEgitBaslat, loraSorgula, type LoraDurum } from "@/lib/saglayicilar/lora";
import { isFaturasi, isFaturasiYaz, isIade, isKapat, krediAl, sahteSaglayici, saglayiciyla } from "@/lib/hesap/krediKapi";
import { gelistirme } from "@/lib/hesap/guvenlik";
import { oturumGerekli } from "@/lib/hesap/yetki";
import { SABIT_KREDI } from "@/lib/krediTarife";

export const runtime = "nodejs";

const SINAMA = "sinama.";

/** GET ?jeton= → eğitim durumu (başarısızsa kesinti burada bir kez iade edilir) · GET (jetonsuz) → { hazir } */
export async function GET(req: NextRequest) {
  const jeton = req.nextUrl.searchParams.get("jeton");
  if (!jeton) return NextResponse.json({ hazir: Boolean(process.env.FAL_KEY) });
  const o = await oturumGerekli(req);
  if (o instanceof Response) return o;
  const f = await isFaturasi(jeton);
  if (f && f.uid !== o.hesap.uid) return NextResponse.json({ durum: "hata", hata: "Bu eğitim başka bir hesaba ait." }, { status: 403 });
  const d: LoraDurum = jeton.startsWith(SINAMA)
    ? (!gelistirme() ? { durum: "hata", hata: "Geçersiz iş." } : sahteSaglayici(req) === "hata" ? { durum: "hata", hata: "Sınama: eğitim tamamlanamadı." } : { durum: "hazir", url: "https://ornek.vayra.ai/sinama.safetensors" })
    : await loraSorgula(jeton);
  if (d.durum === "hata") {
    const iade = await isIade(jeton, "Derin eğitim tamamlanamadı: kredi iade edildi");
    return NextResponse.json({ ...d, ...(iade ? { kredi: { harcanan: 0, iade: true, ...(iade.bakiye !== undefined ? { bakiye: iade.bakiye } : {}) } } : {}) });
  }
  if (d.durum === "hazir") await isKapat(jeton);
  return NextResponse.json(d);
}

/**
 * { gorseller: string[] (depo adresleri, 5–30), tetik } → { ok, jeton, kredi }. Oturum gerekir; derin eğitim sabit
 * bedellidir (lib/krediTarife) ve iş başlarken kesilir. Başlatılamazsa hemen, sonradan başarısız olursa durum sorgusunda iade.
 */
export async function POST(req: NextRequest) {
  const o = await oturumGerekli(req);
  if (o instanceof Response) return o;
  const g = (await req.json().catch(() => ({}))) as { gorseller?: string[]; tetik?: string };
  const tetik = (g.tetik ?? "").replace(/[^\p{L}\p{N}_]/gu, "").slice(0, 24);
  if (!tetik) return NextResponse.json({ ok: false, hata: "Tetik kelimesi gerekli." }, { status: 400 });
  const gorseller = (g.gorseller ?? []).filter((u) => typeof u === "string");
  if (gorseller.length < 5) return NextResponse.json({ ok: false, hata: "Derin eğitim için en az 5 fotoğraf gerekli." }, { status: 400 });
  if (!process.env.FAL_KEY && !sahteSaglayici(req)) return NextResponse.json({ ok: false, hata: "Derin eğitim için fal.ai bağlantısı gerekli." }, { status: 503 });
  const k = await krediAl(req, { oturum: o, kaynak: "karakter/egit", aciklama: `Derin eğitim · ${tetik}`, taban: SABIT_KREDI.loraEgitim, ucretli: true });
  if (k instanceof Response) return k;
  try {
    const r = await saglayiciyla(k, () => loraEgitBaslat(gorseller, tetik), () => ({ jeton: `${SINAMA}${randomBytes(12).toString("hex")}` }));
    await isFaturasiYaz(r.jeton, k);
    return NextResponse.json({ ok: true, ...r, ...k.alanlar() });
  } catch (e) {
    await k.iade("Derin eğitim başlatılamadı: kredi iade edildi");
    return NextResponse.json({ ok: false, hata: e instanceof Error ? e.message : "Başlatılamadı.", ...k.alanlar() }, { status: 400 });
  }
}
