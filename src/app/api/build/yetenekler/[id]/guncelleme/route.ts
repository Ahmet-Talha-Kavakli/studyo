import { skillMdCoz, yetenekGuncelle, yetenekKaydi } from "@/lib/build/yetenekDepo";
import { anthropicIceAktar, anthropicKlasorOzeti, anthropicSkillMd } from "@/lib/build/yetenekPaket";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Kaynak güncellemesi denetimi (Anthropic dizininden içe aktarılan yetenekler): kaynaktaki klasör özeti içe
 * aktarılandan farklıysa güncelleme vardır. Eski kayıtlarda (özet tutulmamış) ilk sürümün gövdesi kaynaktaki
 * SKILL.md gövdesiyle karşılaştırılır.
 */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const y = await yetenekKaydi((await params).id, sahip);
  if (!y) return hata("Yetenek bulunamadı.", 404);
  if (y.kaynak?.tur !== "anthropic" || !y.kaynak.ad) return Response.json({ ok: true, destek: false });
  try {
    const ozet = await anthropicKlasorOzeti(y.kaynak.ad);
    let var_ = false;
    if (y.kaynak.agac && ozet) var_ = ozet !== y.kaynak.agac;
    else { const md = await anthropicSkillMd(y.kaynak.ad); var_ = skillMdCoz(md.skillMd).govde.trim() !== (y.surumler[0]?.govde ?? y.govde).trim(); }
    return Response.json({ ok: true, destek: true, var: var_, kaynak: y.kaynak.url });
  } catch (e) { return hata((e as Error).message, 502); }
}

/** Güncellemeyi uygular: kaynaktaki SKILL.md ve dosyalar yeni bir notlu sürüm olur (eski sürümler kalır, sabit sürüm değişmez). */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const y = await yetenekKaydi(id, sahip);
  if (!y) return hata("Yetenek bulunamadı.", 404);
  if (y.kaynak?.tur !== "anthropic" || !y.kaynak.ad) return hata("Bu yeteneğin güncellenebilir bir kaynağı yok.");
  let a: Awaited<ReturnType<typeof anthropicIceAktar>>;
  try { a = await anthropicIceAktar(y.kaynak.ad); } catch (e) { return hata((e as Error).message, 502); }
  const c = skillMdCoz(a.skillMd);
  const r = await yetenekGuncelle(id, sahip, (x) => {
    x.govde = c.govde.slice(0, 80_000);
    if (c.aciklama) x.aciklama = c.aciklama.slice(0, 1024);
    x.dosyalar = a.dosyalar;
    x.kaynak = { ...x.kaynak!, url: a.url, commit: a.commit, agac: a.agac };
  }, { surumNotu: "Anthropic kaynağından güncellendi" });
  if (!r?.yetenek) return hata(r?.hata ?? "Güncellenemedi.");
  return Response.json({ ok: true, yetenek: r.yetenek, atlanan: a.atlanan });
}
