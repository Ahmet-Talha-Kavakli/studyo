import { NextRequest, NextResponse } from "next/server";
import { KULLANIM_ESLEME } from "@/lib/sesVeri";

export const runtime = "nodejs";

/* Topluluk ses kütüphanesi — ElevenLabs Voice Library (GET /v1/shared-voices).
   Oturumsuz erişim en fazla 3 sese ve filtresiz listeye izin verir; bu yüzden yalnız
   sağlayıcı anahtarı varken sunulur. */

const CINSIYET: Record<string, string> = { male: "Erkek", female: "Kadın", neutral: "Nötr" };
const YAS: Record<string, string> = { young: "Genç", middle_aged: "Orta yaş", old: "Olgun" };
const KULLANIM_TERS: Record<string, string> = Object.fromEntries(Object.entries(KULLANIM_ESLEME).map(([k, v]) => [v, k]));
const CINSIYET_TERS: Record<string, string> = { Erkek: "male", Kadın: "female", Nötr: "neutral" };

type Paylasilan = {
  public_owner_id: string; voice_id: string; name: string; accent?: string; gender?: string; age?: string;
  descriptive?: string; use_case?: string; language?: string; locale?: string; description?: string; preview_url?: string; cloned_by_count?: number;
};

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const q = new URLSearchParams({ page_size: "24", page: String(Math.max(0, Number(p.get("sayfa") ?? 0) || 0)) });
  const dil = p.get("dil"); if (dil && /^[a-z]{2,3}$/.test(dil)) q.set("language", dil);
  const cins = CINSIYET_TERS[p.get("cinsiyet") ?? ""]; if (cins) q.set("gender", cins);
  const kul = KULLANIM_TERS[p.get("kullanim") ?? ""]; if (kul) q.set("use_cases", kul);
  const ara = p.get("ara")?.trim(); if (ara) q.set("search", ara.slice(0, 80));
  q.set("sort", p.get("sira") === "yeni" ? "created_date" : "trending");
  const anahtar = process.env.ELEVENLABS_API_KEY;
  if (!anahtar) return NextResponse.json({ ok: false, hata: "Topluluk kütüphanesi ses sağlayıcısı bağlıyken kullanılabilir." }, { status: 503 });
  try {
    const yanit = await fetch(`https://api.elevenlabs.io/v1/shared-voices?${q}`, { headers: { "xi-api-key": anahtar }, next: { revalidate: 3600 } });
    if (!yanit.ok) throw new Error(String(yanit.status));
    const j = (await yanit.json()) as { voices: Paylasilan[]; has_more: boolean; total_count?: number };
    return NextResponse.json({
      ok: true, dahaVar: j.has_more, toplam: j.total_count ?? null,
      sesler: j.voices.map((v) => {
        const [kisa, ...tanim] = v.name.split(" - ");
        return {
          sesId: v.voice_id, sahip: v.public_owner_id, ad: kisa.trim(), tanim: tanim.join(" - ").trim() || undefined,
          aciklama: v.description?.slice(0, 220), cinsiyet: CINSIYET[v.gender ?? ""] ?? "Nötr", yas: YAS[v.age ?? ""],
          aksan: v.accent, dil: v.language, kullanim: KULLANIM_ESLEME[v.use_case ?? ""], onizleme: v.preview_url, kullanan: v.cloned_by_count ?? 0,
        };
      }),
    });
  } catch {
    return NextResponse.json({ ok: false, hata: "Topluluk kütüphanesine ulaşılamadı." }, { status: 502 });
  }
}
