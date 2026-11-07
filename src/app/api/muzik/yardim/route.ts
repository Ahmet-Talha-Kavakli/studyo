import { NextRequest, NextResponse } from "next/server";
import { oturumGerekli } from "@/lib/hesap/yetki";
import { istemHazir, muzikIstemGelistir, sozYaz } from "@/lib/saglayicilar/istem";
import { icerikDenetle } from "@/lib/moderasyon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Müzik yazım yardımcısı bağlı mı (Gemini). */
export function GET() {
  return NextResponse.json({ hazir: istemHazir() });
}

/**
 * { islem: "soz", istem, stiller?, dil?, mevcut?, devam? } → { metin }   (söz yaz / devam ettir)
 * { islem: "gelistir", istem } → { metin }                               (istemi zenginleştir)
 * Kredi düşmez; yalnız sağlayıcı bağlıyken çalışır.
 */
export async function POST(req: NextRequest) {
  // Oturum gerekir: sağlayıcı maliyeti olan uç misafire açık değil (bu iş kredi harcamaz).
  const oturum = await oturumGerekli(req);
  if (oturum instanceof Response) return oturum;
  if (!istemHazir()) return NextResponse.json({ ok: false, hata: "Yazım yardımcısı (Gemini) bağlı değil." }, { status: 503 });
  const g = (await req.json().catch(() => ({}))) as { islem?: string; istem?: string; stiller?: string[]; dil?: string; mevcut?: string; devam?: boolean };
  const istem = (g.istem ?? "").trim().slice(0, 1000);
  const denetim = icerikDenetle([istem, g.mevcut ?? ""].join("\n"));
  if (!denetim.izin) return NextResponse.json({ ok: false, hata: denetim.mesaj }, { status: 422 });
  try {
    if (g.islem === "soz") {
      if (!istem && !(g.mevcut ?? "").trim()) return NextResponse.json({ ok: false, hata: "Önce şarkıyı birkaç kelimeyle anlat." }, { status: 400 });
      const metin = await sozYaz({ istem, stiller: (g.stiller ?? []).slice(0, 20), dil: g.dil, mevcut: g.mevcut, mod: g.devam ? "devam" : "yaz" });
      return NextResponse.json({ ok: true, metin });
    }
    if (g.islem === "gelistir") {
      if (istem.length < 2) return NextResponse.json({ ok: false, hata: "İstem boş." }, { status: 400 });
      return NextResponse.json({ ok: true, metin: await muzikIstemGelistir(istem) });
    }
    return NextResponse.json({ ok: false, hata: "Geçersiz işlem." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, hata: e instanceof Error ? e.message : "Başarısız." }, { status: 502 });
  }
}
