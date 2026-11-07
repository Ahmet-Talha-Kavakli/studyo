import { paylasimSil } from "@/lib/build/sohbetPaylasim";
import { sohbetGetir, sohbetKaydet, sohbetSil } from "@/lib/build/sohbetDepo";
import { klasorGetir } from "@/lib/build/sohbetKlasor";
import { yayinlar } from "@/lib/build/sohbetYayin";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** Toplu işlem: { kimlikler, islem: "arsivle" | "arsivdenCikar" | "sil" | "klasor", klasor?: string | null } → { islenen }. */
export async function POST(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  let g: { kimlikler?: unknown; islem?: string; klasor?: string | null };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const l = Array.isArray(g.kimlikler) ? [...new Set(g.kimlikler.filter((x): x is string => typeof x === "string"))].slice(0, 200) : [];
  if (!l.length) return hata("Seçili sohbet yok.");
  if (!["arsivle", "arsivdenCikar", "sil", "klasor"].includes(String(g.islem))) return hata("Bilinmeyen işlem.");
  if (g.islem === "klasor" && g.klasor && !(await klasorGetir(sahip, g.klasor))) return hata("Klasör bulunamadı.", 404);
  let islenen = 0;
  for (const id of l) {
    const s = await sohbetGetir(id, sahip);
    if (!s) continue;
    if (g.islem === "sil") {
      if (s.paylasim) await paylasimSil(s.paylasim.id).catch(() => {});
      yayinlar.get(id)?.durdur.abort();
      await sohbetSil(id, sahip);
    } else {
      if (g.islem === "arsivle") { s.arsiv = true; s.sabit = undefined; }
      else if (g.islem === "arsivdenCikar") s.arsiv = undefined;
      else if (!s.ajanId) { if (g.klasor) s.klasor = g.klasor; else delete s.klasor; }
      await sohbetKaydet(s, sahip);
    }
    islenen++;
  }
  return Response.json({ ok: true, islenen });
}
