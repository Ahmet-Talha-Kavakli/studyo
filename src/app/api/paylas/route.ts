import { NextRequest, NextResponse } from "next/server";
import { paylasimKaydet, type Paylasim } from "@/lib/paylasim";
import { icerikDenetle } from "@/lib/moderasyon";

export const runtime = "nodejs";

/** { tur, url, baslik, alt?, metin?, kapak?, renk?, kelimeler? } → { ok, id, yol } */
export async function POST(req: NextRequest) {
  const g = (await req.json().catch(() => ({}))) as Partial<Omit<Paylasim, "id" | "olusturma">>;
  if ((g.tur !== "ses" && g.tur !== "muzik") || typeof g.url !== "string" || typeof g.baslik !== "string")
    return NextResponse.json({ ok: false, hata: "Eksik bilgi." }, { status: 400 });
  const d = icerikDenetle([g.baslik, g.metin ?? ""].join("\n"));
  if (!d.izin) return NextResponse.json({ ok: false, hata: d.mesaj }, { status: 422 });
  try {
    const k = await paylasimKaydet({ tur: g.tur, url: g.url, baslik: g.baslik, alt: g.alt, metin: g.metin, kapak: g.kapak, renk: g.renk, kelimeler: g.kelimeler });
    return NextResponse.json({ ok: true, id: k.id, yol: `/p/${k.id}` });
  } catch (e) {
    return NextResponse.json({ ok: false, hata: e instanceof Error ? e.message : "Paylaşılamadı." }, { status: 400 });
  }
}
