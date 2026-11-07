import { NextRequest, NextResponse } from "next/server";
import { sesTasarla } from "@/lib/saglayicilar/eleven";
import { krediAl, sahteSaglayici, saglayiciyla } from "@/lib/hesap/krediKapi";
import { oturumGerekli } from "@/lib/hesap/yetki";
import { SABIT_KREDI } from "@/lib/krediTarife";

export const runtime = "nodejs";

/**
 * Metinden ses tasarımı: { aciklama, metin?, gelistir?, loudness?, guidanceScale?, seed? } → 3 önizleme.
 * Oturum gerekir. Bedel sabittir, önizleme istenmeden önce kesilir; sağlayıcı hata verirse iade edilir.
 */
export async function POST(req: NextRequest) {
  const o = await oturumGerekli(req);
  if (o instanceof Response) return o;
  if (!process.env.ELEVENLABS_API_KEY && !sahteSaglayici(req)) return NextResponse.json({ ok: false, hata: "Ses sağlayıcısı bağlı değil; ses tasarımı yapılamıyor." }, { status: 503 });
  const g = (await req.json().catch(() => ({}))) as { aciklama?: string; metin?: string; gelistir?: boolean; loudness?: number; guidanceScale?: number; seed?: number };
  const aciklama = g.aciklama?.trim() ?? "";
  if (aciklama.length < 20) return NextResponse.json({ ok: false, hata: "Sesi en az 20 karakterle tarif et." }, { status: 400 });
  const k = await krediAl(req, { oturum: o, kaynak: "ses/tasarim", aciklama: "Ses tasarımı · 3 önizleme", taban: SABIT_KREDI.sesTasarim, ucretli: true });
  if (k instanceof Response) return k;
  try {
    const s = await saglayiciyla(k,
      () => sesTasarla(aciklama, g.metin?.trim(), g.gelistir, { loudness: g.loudness, guidanceScale: g.guidanceScale, seed: g.seed }),
      () => ({ onizlemeler: [{ kimlik: "sinama-1", ses: "/brand/vayra-logo-320.webm", sn: 3 }], metin: g.metin?.trim() ?? "" }));
    return NextResponse.json({ ok: true, ...s, ...k.alanlar() });
  } catch (e) {
    await k.iade("Ses tasarımı başarısız: kredi iade edildi");
    return NextResponse.json({ ok: false, hata: String(e instanceof Error ? e.message : e).slice(0, 300), ...k.alanlar() }, { status: 502 });
  }
}
