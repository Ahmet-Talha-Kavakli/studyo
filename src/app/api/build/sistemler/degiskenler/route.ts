import { sahipOzeti } from "@/lib/build/depo";
import { degiskenDegistir, degiskenListesi, type DegiskenIslem } from "@/lib/build/sistemDegisken";
import { sistemleriListele } from "@/lib/build/sistemDepo";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** Hesap değişkenleri ve sırlar (sırların değeri hiç dönmez) + hangi sistemlerin kullandığı. */
export async function GET(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const v = await degiskenListesi(sahipOzeti(sahip));
  const kullanim: Record<string, { id: string; ad: string }[]> = {};
  for (const s of await sistemleriListele(sahip)) {
    const j = JSON.stringify([s.adimlar, s.tetikler]);
    for (const m of j.matchAll(/\{\{\s*(degisken|sir)\.([A-Za-z_][A-Za-z0-9_]*)/g)) {
      const k = `${m[1]}.${m[2]}`;
      const l = (kullanim[k] ??= []);
      if (!l.some((x) => x.id === s.id)) l.push({ id: s.id, ad: s.ad });
    }
  }
  return Response.json({ ok: true, ...v, kullanim });
}

/** { islem: "degisken", ad, deger, aciklama?, eskiAd? } · { islem: "sir", ad, deger?, aciklama?, eskiAd? } · { islem: "sil", tur, ad } */
export async function POST(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  let g: DegiskenIslem;
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  if (!g || !["degisken", "sir", "sil"].includes(String(g.islem))) return hata("Bilinmeyen işlem.");
  const h = await degiskenDegistir(sahipOzeti(sahip), g);
  if (h) return hata(h);
  return Response.json({ ok: true, ...(await degiskenListesi(sahipOzeti(sahip))) });
}
