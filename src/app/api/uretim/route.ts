import { NextRequest, NextResponse } from "next/server";
import { uretimYonlendir, type SaglayiciIstek, type UretimTuru } from "@/lib/saglayicilar";
import { icerikDenetle } from "@/lib/moderasyon";

export const runtime = "nodejs";
// 3D/video uzun sürebilir; makul bir üst sınır.
export const maxDuration = 300;

const GECERLI_TURLER: UretimTuru[] = ["gorsel", "video", "ses", "3d"];

/**
 * Gerçek üretim uç noktası. İstek gövdesi: { tur, model, prompt, meta }.
 * Anahtar varsa gerçek sağlayıcı, yoksa simülasyon çalışır — istemciye
 * { gercek, saglayici, ciktiUrl?, dataUri? } döner.
 */
export async function POST(req: NextRequest) {
  let govde: Partial<SaglayiciIstek>;
  try {
    govde = await req.json();
  } catch {
    return NextResponse.json({ ok: false, hata: "Geçersiz JSON gövdesi." }, { status: 400 });
  }

  const { tur, model, prompt, meta } = govde;
  if (!tur || !GECERLI_TURLER.includes(tur)) {
    return NextResponse.json({ ok: false, hata: "Geçersiz üretim türü." }, { status: 400 });
  }
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ ok: false, hata: "Prompt boş olamaz." }, { status: 400 });
  }

  // Sunucu tarafı moderasyon (katmanlı savunma). Higgsfield'ın API'sinde de
  // status enum'unda "nsfw" vardır — reddedilen istek 422 döner, istemci krediyi iade eder.
  const denetim = icerikDenetle(prompt);
  if (!denetim.izin) {
    return NextResponse.json(
      { ok: false, moderasyon: true, kategori: denetim.kategori, hata: denetim.mesaj },
      { status: 422 }
    );
  }

  try {
    const sonuc = await uretimYonlendir({ tur, model: model ?? "vayra", prompt, meta });
    return NextResponse.json({ ok: true, ...sonuc });
  } catch (hata) {
    return NextResponse.json(
      { ok: false, hata: `Üretim hatası: ${String(hata).slice(0, 300)}` },
      { status: 500 }
    );
  }
}
