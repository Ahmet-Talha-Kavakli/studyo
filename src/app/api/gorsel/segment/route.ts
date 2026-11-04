import { NextRequest, NextResponse } from "next/server";
import { falHam, falHazir } from "@/lib/saglayicilar/fal";
import { gorselHazirla } from "@/lib/saglayicilar/video";
import { ciktiKalicilastir } from "@/lib/dosyaDepo";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({ hazir: falHazir() });
}

/**
 * Tıkla-seç / metinle seç (SAM 3, fal-ai/sam-3/image). Kredi düşmez.
 * { gorselUrl, noktalar?: [{x, y, ekle}] (piksel), metin? } → { ok, maskeUrl } (beyaz = seçili alan)
 */
export async function POST(req: NextRequest) {
  if (!falHazir()) return NextResponse.json({ ok: false, hata: "Akıllı seçim için fal.ai bağlantısı gerekli." }, { status: 503 });
  const g = (await req.json().catch(() => ({}))) as { gorselUrl?: string; noktalar?: { x: number; y: number; ekle?: boolean }[]; metin?: string };
  if (!g.gorselUrl?.startsWith("/api/dosya/")) return NextResponse.json({ ok: false, hata: "Önce görseli yükle." }, { status: 400 });
  const noktalar = (g.noktalar ?? []).filter((n) => Number.isFinite(n.x) && Number.isFinite(n.y)).slice(0, 12);
  const metin = (g.metin ?? "").trim().slice(0, 120);
  if (!noktalar.length && !metin) return NextResponse.json({ ok: false, hata: "Bir nokta seç ya da ne seçileceğini yaz." }, { status: 400 });
  try {
    const kaynak = await gorselHazirla(g.gorselUrl);
    const o = (await falHam("fal-ai/sam-3/image", {
      image_url: kaynak, max_masks: 1, apply_mask: false,
      ...(metin ? { text_prompt: metin } : {}),
      ...(noktalar.length ? { point_prompts: noktalar.map((n) => ({ x: Math.round(n.x), y: Math.round(n.y), label: n.ekle === false ? 0 : 1 })) } : {}),
    }, 90_000)) as { masks?: { url?: string }[]; image?: { url?: string }; images?: { url?: string }[] };
    const url = o.masks?.[0]?.url ?? o.images?.[0]?.url ?? o.image?.url;
    if (!url) return NextResponse.json({ ok: false, hata: "Seçilecek nesne bulunamadı." }, { status: 404 });
    return NextResponse.json({ ok: true, maskeUrl: await ciktiKalicilastir("gorsel", url, "image/png") });
  } catch (e) {
    return NextResponse.json({ ok: false, hata: String(e instanceof Error ? e.message : e).slice(0, 200) }, { status: 502 });
  }
}
