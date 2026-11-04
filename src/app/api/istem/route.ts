import { NextRequest, NextResponse } from "next/server";
import { captionYaz, gorselTarifEt, istemHazir, istemIsle, sahnelereBol } from "@/lib/saglayicilar/istem";
import { icerikDenetle } from "@/lib/moderasyon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** İstem yardımcısı bağlı mı. */
export function GET() {
  return NextResponse.json({ hazir: istemHazir() });
}

/**
 * { islem: "gelistir", istem } → { istem }   (zenginleştir + İngilizce)
 * { islem: "tarif", gorselUrl, adet? } → { istemler }   (görselden istem; Türkçe)
 * { islem: "sahneler", istem, adet } → { sahneler: [{istem, cekim, aci}] }   (hikâye → storyboard)
 */
export async function POST(req: NextRequest) {
  if (!istemHazir()) return NextResponse.json({ ok: false, hata: "İstem yardımcısı (Gemini) bağlı değil." }, { status: 503 });
  const g = (await req.json().catch(() => ({}))) as { islem?: string; istem?: string; gorselUrl?: string; adet?: number; caption?: { ad: string; nis: string; ton: string; biyografi: string; sahne: string; not?: string; platform: string } };
  try {
    if (g.islem === "gelistir") {
      const istem = (g.istem ?? "").trim();
      if (istem.length < 2) return NextResponse.json({ ok: false, hata: "İstem boş." }, { status: 400 });
      const d = icerikDenetle(istem);
      if (!d.izin) return NextResponse.json({ ok: false, hata: d.mesaj }, { status: 422 });
      return NextResponse.json({ ok: true, istem: await istemIsle(istem.slice(0, 2000), "gelistir") });
    }
    if (g.islem === "sahneler") {
      const istem = (g.istem ?? "").trim();
      if (istem.length < 8) return NextResponse.json({ ok: false, hata: "Hikâyeyi birkaç cümleyle anlat." }, { status: 400 });
      const d = icerikDenetle(istem);
      if (!d.izin) return NextResponse.json({ ok: false, hata: d.mesaj }, { status: 422 });
      return NextResponse.json({ ok: true, sahneler: await sahnelereBol(istem, Math.min(8, Math.max(2, g.adet ?? 4))) });
    }
    if (g.islem === "caption" && g.caption) {
      const c = g.caption;
      const d = icerikDenetle(`${c.biyografi} ${c.not ?? ""}`);
      if (!d.izin) return NextResponse.json({ ok: false, hata: d.mesaj }, { status: 422 });
      return NextResponse.json({ ok: true, ...(await captionYaz({ ad: String(c.ad).slice(0, 40), nis: String(c.nis).slice(0, 40), ton: String(c.ton).slice(0, 40), biyografi: String(c.biyografi ?? "").slice(0, 300), sahne: String(c.sahne).slice(0, 120), not: c.not ? String(c.not).slice(0, 300) : undefined, platform: String(c.platform).slice(0, 40) })) });
    }
    if (g.islem === "tarif") {
      if (!g.gorselUrl || !/^(\/|https:\/\/|data:image\/)/.test(g.gorselUrl)) return NextResponse.json({ ok: false, hata: "Görsel yok." }, { status: 400 });
      return NextResponse.json({ ok: true, istemler: await gorselTarifEt(g.gorselUrl, Math.min(4, Math.max(1, g.adet ?? 3))) });
    }
    return NextResponse.json({ ok: false, hata: "Geçersiz işlem." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, hata: e instanceof Error ? e.message : "Başarısız." }, { status: 502 });
  }
}
