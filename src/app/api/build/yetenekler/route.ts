import { AD, ozetle, paylasimGetir, skillMdCoz, yetenekKayitlari, yetenekOlustur, type Yetenek } from "@/lib/build/yetenekDepo";
import { YETENEK_KATALOGU } from "@/lib/build/yetenekKatalog";
import { anthropicIceAktar, zipCoz, zipYetenek } from "@/lib/build/yetenekPaket";
import { yetenekTaslagi } from "@/lib/build/yetenekTaslak";
import { hata, sahipAl } from "@/lib/build/sunucu";
import { icerikDenetle } from "@/lib/moderasyon";

export const dynamic = "force-dynamic";

/** Sahibin yetenekleri (özet; tarama sonucu, çağrı politikası, sabit sürüm ve gereken bağlantılarla). */
export async function GET(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return Response.json({ ok: true, yetenekler: [] });
  return Response.json({ ok: true, yetenekler: (await yetenekKayitlari(sahip)).map(ozetle) });
}

const YOL = /^[\w.-]+(\/[\w.-]+)*$/;
const baslikYap = (ad?: string) => (ad ?? "İçe aktarılan yetenek").replace(/-/g, " ").replace(/^\p{Ll}/u, (h) => h.toLocaleUpperCase("tr"));

/** SKILL.md + dosyalardan yetenek kaydı (denetim, ad kuralı, yol temizliği). */
async function skillMdden(sahip: string, md: string, dosyalar: { yol: string; icerik: string }[], kaynak: Yetenek["kaynak"], baslik?: string) {
  const c = skillMdCoz(md.slice(0, 200_000));
  const d = icerikDenetle(`${c.aciklama ?? ""}\n${c.govde}`.slice(0, 20000));
  if (!d.izin) return { hata: d.mesaj };
  const y = await yetenekOlustur(sahip, {
    baslik: baslik ?? baslikYap(c.ad), ad: c.ad && AD.test(c.ad) ? c.ad.slice(0, 64) : undefined, aciklama: c.aciklama ?? "", govde: c.govde,
    dosyalar: dosyalar.filter((x) => x && typeof x.yol === "string" && typeof x.icerik === "string" && YOL.test(x.yol) && !x.yol.split("/").includes("..")),
    cagri: c.cagri, gerekenBaglantilar: c.baglantilar, kaynak: kaynak ?? (c.lisans ? { tur: "dosya", lisans: c.lisans } : undefined),
  });
  return { y };
}

/**
 * Yeni yetenek:
 *  { katalog }              Vayra kataloğundan kopya
 *  { dizin }                Anthropic resmî yeteneği (yalnız lisansı izin verenler; GitHub'dan o anda okunur)
 *  { paylasim }             paylaşılan bir yeteneğin kopyası
 *  { zip } (base64)         .zip içe aktarımı (SKILL.md klasörü; betikler dahil metin dosyaları)
 *  { skillMd, dosyalar? }   SKILL.md içe aktarımı (Claude ve Codex yetenekleri)
 *  { tarif }                anlatılandan taslak; boşsa boş yetenek
 * İçe aktarılan her yetenek güvenlik taramasından geçer; kritik bulgu varsa etkinleşmez.
 */
export async function POST(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return hata("Oturum anahtarı eksik; sayfayı yenile.", 401);
  let g: { katalog?: string; dizin?: string; paylasim?: string; zip?: string; tarif?: string; skillMd?: string; dosyalar?: { yol: string; icerik: string }[]; baslik?: string } = {};
  try { g = await req.json(); } catch { /* boş */ }
  if (g.katalog) {
    if (!YETENEK_KATALOGU.some((k) => k.id === g.katalog)) return hata("Yetenek bulunamadı.", 404);
    const y = await yetenekOlustur(sahip, { katalog: g.katalog });
    return Response.json({ ok: true, id: y.id });
  }
  if (g.dizin) {
    try {
      const a = await anthropicIceAktar(String(g.dizin));
      const r = await skillMdden(sahip, a.skillMd, a.dosyalar, { tur: "anthropic", ad: String(g.dizin), url: a.url, lisans: a.lisans, commit: a.commit, agac: a.agac });
      if (r.hata) return hata(r.hata, 422);
      return Response.json({ ok: true, id: r.y!.id, atlanan: a.atlanan, tarama: r.y!.tarama?.sonuc });
    } catch (e) { return hata((e as Error).message, 422); }
  }
  if (g.paylasim) {
    const p = await paylasimGetir(String(g.paylasim));
    if (!p) return hata("Paylaşım bulunamadı ya da kapatılmış.", 404);
    const y = await yetenekOlustur(sahip, { baslik: p.baslik, ad: p.ad, aciklama: p.aciklama, govde: p.govde, dosyalar: p.dosyalar, simge: p.simge, kategori: p.kategori, ornekler: p.ornekler, cagri: p.cagri, gerekenBaglantilar: p.gerekenBaglantilar, kaynak: { tur: "paylasim", ad: p.ad } });
    return Response.json({ ok: true, id: y.id });
  }
  if (typeof g.zip === "string" && g.zip) {
    if (g.zip.length > 7_000_000) return hata("Zip en çok 5 MB olabilir.", 413);
    let z: ReturnType<typeof zipCoz>;
    try { z = zipCoz(Buffer.from(g.zip, "base64")); } catch (e) { return hata((e as Error).message, 422); }
    const s = zipYetenek(z.dosyalar);
    if (!s) return hata("Arşivde SKILL.md bulunamadı.", 422);
    const r = await skillMdden(sahip, s.skillMd, s.ekler, undefined);
    if (r.hata) return hata(r.hata, 422);
    return Response.json({ ok: true, id: r.y!.id, atlanan: z.atlanan, tarama: r.y!.tarama?.sonuc });
  }
  if (typeof g.skillMd === "string" && g.skillMd.trim()) {
    const r = await skillMdden(sahip, g.skillMd, g.dosyalar ?? [], undefined, g.baslik);
    if (r.hata) return hata(r.hata, 422);
    return Response.json({ ok: true, id: r.y!.id, tarama: r.y!.tarama?.sonuc });
  }
  const tarif = String(g.tarif ?? "").trim().slice(0, 4000);
  if (tarif) {
    const d = icerikDenetle(tarif);
    if (!d.izin) return hata(d.mesaj, 422);
    const { yapayZeka, ...t } = await yetenekTaslagi(tarif);
    const y = await yetenekOlustur(sahip, t);
    return Response.json({ ok: true, id: y.id, yapayZeka });
  }
  const y = await yetenekOlustur(sahip, { baslik: g.baslik?.slice(0, 80) || "Yeni yetenek", govde: "# Yeni yetenek\n\n## Adımlar\n1. …\n" });
  return Response.json({ ok: true, id: y.id });
}
