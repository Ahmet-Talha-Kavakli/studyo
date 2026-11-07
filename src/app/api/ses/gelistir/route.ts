import { NextRequest, NextResponse } from "next/server";
import { oturumGerekli } from "@/lib/hesap/yetki";
import { istemHazir, sesMetniGelistir } from "@/lib/saglayicilar/istem";
import { icerikDenetle } from "@/lib/moderasyon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ hazir: istemHazir() });
}

/** { metin } → { metin } — kelimeler korunur, yalnız ses etiketleri eklenir. Kredi düşmez. */
export async function POST(req: NextRequest) {
  // Oturum gerekir: sağlayıcı maliyeti olan uç misafire açık değil (bu iş kredi harcamaz).
  const oturum = await oturumGerekli(req);
  if (oturum instanceof Response) return oturum;
  if (!istemHazir()) return NextResponse.json({ ok: false, hata: "Yazım yardımcısı (Gemini) bağlı değil." }, { status: 503 });
  const { metin } = (await req.json().catch(() => ({}))) as { metin?: string };
  const t = (metin ?? "").trim();
  if (t.length < 2) return NextResponse.json({ ok: false, hata: "Metin boş." }, { status: 400 });
  if (t.length > 10000) return NextResponse.json({ ok: false, hata: "Metin çok uzun (en fazla 10.000 karakter)." }, { status: 400 });
  const d = icerikDenetle(t);
  if (!d.izin) return NextResponse.json({ ok: false, hata: d.mesaj }, { status: 422 });
  try {
    const sonuc = await sesMetniGelistir(t);
    // Güvenlik: etiketler çıkarıldığında kelimeler aynı kalmalı; değilse reddet.
    const yalin = (s: string) => s.replace(/\[[^\]\n]{1,40}\]/g, "").replace(/\s+/g, " ").trim();
    if (yalin(sonuc) !== yalin(t)) return NextResponse.json({ ok: false, hata: "Geliştirici metni değiştirdi; güvenlik için uygulanmadı. Yeniden dene." }, { status: 502 });
    return NextResponse.json({ ok: true, metin: sonuc });
  } catch (e) {
    return NextResponse.json({ ok: false, hata: e instanceof Error ? e.message : "Başarısız." }, { status: 502 });
  }
}
