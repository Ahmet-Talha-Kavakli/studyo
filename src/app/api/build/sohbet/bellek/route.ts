import { bellekGetir, bellekGuncelle, bellekKimligi, talimatSurumuIzle, VARSAYILAN_TERCIH, type Tercihler, type YanitTarzi } from "@/lib/build/sohbetBellek";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
const TARZ: YanitTarzi[] = ["varsayilan", "kisa", "aciklayici", "resmi", "samimi", "ozel"];

export async function GET(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  return Response.json({ ok: true, bellek: await bellekGetir(sahip) });
}

/**
 * { acik?, hakkimda?, tarz?, ozelTarz?, ekle?: metin, ekleToplu?: metin[], aktarim?: kaynak adı, duzenle?: { id, metin }, sil?: id, temizle?: true }
 */
export async function PATCH(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  let g: { acik?: boolean; hakkimda?: string; tarz?: YanitTarzi; ozelTarz?: string; ekle?: string; duzenle?: { id: string; metin: string }; sil?: string; temizle?: boolean; ekleToplu?: string[]; aktarim?: string; tercih?: Partial<Tercihler>; geriYukle?: string; surumSil?: string };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const b = await bellekGuncelle(sahip, (x) => {
    // Özel talimatlar (Hakkımda, tarz, tercihler) değişirse önceki hâl sürüm olarak saklanır.
    const bitir = talimatSurumuIzle(x);
    if (g.tercih && typeof g.tercih === "object") x.tercih = tercihTemizle({ ...x.tercih, ...g.tercih });
    if (typeof g.geriYukle === "string") {
      const v = x.surumler.find((y) => y.id === g.geriYukle);
      if (v) { x.hakkimda = v.hakkimda; x.tarz = v.tarz; x.ozelTarz = v.ozelTarz; x.tercih = tercihTemizle(v.tercih); }
    }
    if (typeof g.surumSil === "string") x.surumler = x.surumler.filter((y) => y.id !== g.surumSil);
    if (typeof g.acik === "boolean") x.acik = g.acik;
    if (typeof g.hakkimda === "string") x.hakkimda = g.hakkimda.slice(0, 4000);
    if (g.tarz && TARZ.includes(g.tarz)) x.tarz = g.tarz;
    if (typeof g.ozelTarz === "string") x.ozelTarz = g.ozelTarz.slice(0, 2000);
    if (typeof g.ekle === "string" && g.ekle.trim()) x.kayitlar.push({ id: bellekKimligi(), metin: g.ekle.trim().slice(0, 400), zaman: Date.now() });
    if (g.duzenle && typeof g.duzenle.metin === "string") { const k = x.kayitlar.find((y) => y.id === g.duzenle!.id); if (k && g.duzenle.metin.trim()) k.metin = g.duzenle.metin.trim().slice(0, 400); }
    // Hafızanı getir: başka asistandan gelen notlar (aynısı varsa atlanır).
    if (Array.isArray(g.ekleToplu)) {
      const var_ = new Set(x.kayitlar.map((k) => k.metin.toLocaleLowerCase("tr").trim()));
      const aktarim = typeof g.aktarim === "string" ? g.aktarim.trim().slice(0, 40) : "";
      for (const m of g.ekleToplu.slice(0, 200)) {
        const t = typeof m === "string" ? m.trim().slice(0, 400) : "";
        if (!t || var_.has(t.toLocaleLowerCase("tr"))) continue;
        var_.add(t.toLocaleLowerCase("tr"));
        x.kayitlar.push({ id: bellekKimligi(), metin: t, zaman: Date.now(), ...(aktarim ? { aktarim } : {}) });
      }
    }
    if (g.sil) x.kayitlar = x.kayitlar.filter((y) => y.id !== g.sil);
    if (g.temizle) x.kayitlar = [];
    bitir();
  });
  return Response.json({ ok: true, bellek: b });
}

const SECIM = { uzunluk: ["otomatik", "kisa", "orta", "uzun", "ozel"], emoji: ["hic", "az", "serbest"], dil: ["otomatik", "tr", "en", "de", "ozel"], hitap: ["otomatik", "sen", "siz", "ad", "ozel"], bicim: ["otomatik", "duz", "maddeli"] } as const;
/** Tercihlerin doğrulanması: bilinmeyen seçenek varsayılana döner, metin alanları kısaltılır. */
function tercihTemizle(t: Partial<Tercihler>): Tercihler {
  const o = { ...VARSAYILAN_TERCIH };
  for (const k of Object.keys(SECIM) as (keyof typeof SECIM)[]) if ((SECIM[k] as readonly string[]).includes(String(t[k]))) (o as Record<string, string>)[k] = String(t[k]);
  o.uzunlukOzel = String(t.uzunlukOzel ?? "").slice(0, 300); o.dilOzel = String(t.dilOzel ?? "").slice(0, 60);
  o.ad = String(t.ad ?? "").slice(0, 40); o.hitapOzel = String(t.hitapOzel ?? "").slice(0, 200);
  return o;
}
