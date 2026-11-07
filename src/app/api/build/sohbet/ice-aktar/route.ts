import { aktarilanlar, sohbetleriIceAktar, type IceKaynak, type IceSohbet } from "@/lib/build/sohbetDepo";
import { VARSAYILAN_MODEL } from "@/lib/build/modeller";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
const KAYNAKLAR: IceKaynak[] = ["chatgpt", "claude", "ozel"];

/** Daha önce aktarılan sohbetler: { aktarilan: { "<kaynak>:<kimlik>": sohbetId } } (listede işaretlemek için). */
export async function GET(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  return Response.json({ ok: true, aktarilan: await aktarilanlar(sahip) });
}

/**
 * İçe aktar (istemci dışa aktarma ZIP'ini kendisi okur, seçilenleri parça parça gönderir):
 * { kaynak: "chatgpt" | "claude" | "ozel", sohbetler: [{ kimlik, baslik, olusturma, guncelleme, mesajlar: [{ rol, metin, zaman? }] }] }
 * En çok 40 sohbet, sohbet başına 3000 mesaj. → { eklenen: [{ kimlik, id }], atlanan }
 */
export async function POST(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  let g: { kaynak?: string; sohbetler?: unknown };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const kaynak = KAYNAKLAR.includes(g.kaynak as IceKaynak) ? (g.kaynak as IceKaynak) : null;
  if (!kaynak) return hata("Kaynak tanınmadı.");
  if (!Array.isArray(g.sohbetler) || !g.sohbetler.length) return hata("Aktarılacak sohbet yok.");
  if (g.sohbetler.length > 40) return hata("Tek seferde en çok 40 sohbet.");
  const l: IceSohbet[] = [];
  for (const x of g.sohbetler as Record<string, unknown>[]) {
    if (!x || typeof x !== "object") continue;
    const kimlik = String(x.kimlik ?? "").slice(0, 120);
    const mesajlar = (Array.isArray(x.mesajlar) ? x.mesajlar : []).slice(0, 3000)
      .filter((m): m is { rol: string; metin: string; zaman?: number } => !!m && typeof m === "object" && typeof (m as { metin?: unknown }).metin === "string")
      .map((m) => ({ rol: m.rol === "asistan" ? "asistan" as const : "kullanici" as const, metin: m.metin, ...(Number.isFinite(Number(m.zaman)) && Number(m.zaman) > 0 ? { zaman: Number(m.zaman) } : {}) }));
    if (!kimlik || !mesajlar.length) continue;
    const ol = Number(x.olusturma), gu = Number(x.guncelleme);
    const olusturma = Number.isFinite(ol) && ol > 0 ? ol : Date.now();
    l.push({ kimlik, baslik: String(x.baslik ?? ""), olusturma, guncelleme: Number.isFinite(gu) && gu > 0 ? gu : olusturma, mesajlar });
  }
  if (!l.length) return hata("Geçerli sohbet bulunamadı.");
  return Response.json({ ok: true, ...(await sohbetleriIceAktar(sahip, kaynak, l, VARSAYILAN_MODEL)) });
}
