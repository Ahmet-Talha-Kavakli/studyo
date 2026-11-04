import { NextRequest, NextResponse } from "next/server";
import { istemHazir, explainerSenaryo, sahneYaz, senaryoCevir } from "@/lib/saglayicilar/istem";
import { icerikDenetle } from "@/lib/moderasyon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Senaryo yazarı bağlı mı (Gemini). Bağlı değilse istemci yerel taslak kullanır. */
export function GET() {
  return NextResponse.json({ hazir: istemHazir() });
}

/**
 * { islem: "yaz", konu, kaynak?, ton, kitle, dil, hedefSn, stil } → { sahneler }
 * { islem: "sahne", konu, baslik, anlatim, mod, dil } → { baslik, anlatim }
 * { islem: "cevir", sahneler, hedef } → { sahneler }
 */
export async function POST(req: NextRequest) {
  if (!istemHazir()) return NextResponse.json({ ok: false, hata: "Senaryo yazarı (Gemini) bağlı değil." }, { status: 503 });
  const g = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const s = (k: string) => (typeof g[k] === "string" ? (g[k] as string) : "");
  try {
    const denet = icerikDenetle(`${s("konu")} ${s("anlatim")}`.slice(0, 4000));
    if (!denet.izin) return NextResponse.json({ ok: false, hata: denet.mesaj }, { status: 422 });
    if (g.islem === "yaz") {
      if (s("konu").trim().length < 3 && s("kaynak").trim().length < 40) return NextResponse.json({ ok: false, hata: "Konu ya da kaynak metin gerekli." }, { status: 400 });
      const sahneler = await explainerSenaryo({ konu: s("konu") || "Kaynak metnin özeti", kaynak: s("kaynak") || undefined, ton: s("ton") || "samimi", kitle: s("kitle") || "genel", dil: s("dil") || "tr", hedefSn: Math.min(600, Math.max(15, Number(g.hedefSn) || 60)), stil: s("stil") || "2D illustration" });
      return NextResponse.json({ ok: true, sahneler });
    }
    if (g.islem === "sahne") return NextResponse.json({ ok: true, ...(await sahneYaz({ anlatim: s("anlatim"), baslik: s("baslik"), mod: s("mod"), konu: s("konu"), dil: s("dil") || "tr" })) });
    if (g.islem === "cevir" && Array.isArray(g.sahneler)) return NextResponse.json({ ok: true, sahneler: await senaryoCevir(g.sahneler as { baslik: string; anlatim: string }[], s("hedef") || "English") });
    return NextResponse.json({ ok: false, hata: "Geçersiz işlem." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, hata: e instanceof Error ? e.message : "Başarısız." }, { status: 502 });
  }
}
