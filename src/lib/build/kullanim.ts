import "server-only";
import { ajanlariListele } from "./ajanDepo";
import { calismalariListele } from "./ajanCalismaDepo";
import { projeOku, sahipProjeleri } from "./depo";
import { sistemleriListele, calismalariOku } from "./sistemDepo";
import { sohbetGetir, sohbetleriListele } from "./sohbetDepo";

/**
 * Build kredi kullanımı: projelerdeki ajan turları, sohbetler, ajan çalışmaları ve sistem çalışmaları.
 * Kayıtlar dönem ve önceki dönem için toplanır; gün gün seri, türe ve kaynağa göre kırılım.
 */
export type KullanimTur = "proje" | "sohbet" | "ajan" | "sistem";
export type KullanimKaynak = { tur: KullanimTur; id: string; ad: string; kredi: number; adet: number; href: string };
export type KullanimRaporu = {
  gun: number; bas: number; bit: number;
  toplam: number; onceki: number; islem: number;
  turler: Record<KullanimTur, number>;
  gunluk: { gun: string; proje: number; sohbet: number; ajan: number; sistem: number }[];
  kaynaklar: KullanimKaynak[];
  modeller: { model: string; kredi: number }[];
};

const GUN = 86_400_000;
const gunAnahtari = (t: number) => new Date(t + 3 * 3600_000).toISOString().slice(0, 10); // Türkiye saati

export async function kullanimRaporu(sahip: string, gun: number): Promise<KullanimRaporu> {
  const bit = Date.now();
  const bas = bit - gun * GUN;
  const oncekiBas = bas - gun * GUN;
  const turler: Record<KullanimTur, number> = { proje: 0, sohbet: 0, ajan: 0, sistem: 0 };
  const gunluk = new Map<string, { proje: number; sohbet: number; ajan: number; sistem: number }>();
  for (let t = bas; t <= bit; t += GUN) gunluk.set(gunAnahtari(t), { proje: 0, sohbet: 0, ajan: 0, sistem: 0 });
  gunluk.set(gunAnahtari(bit), gunluk.get(gunAnahtari(bit)) ?? { proje: 0, sohbet: 0, ajan: 0, sistem: 0 });
  const kaynak = new Map<string, KullanimKaynak>();
  const model = new Map<string, number>();
  let toplam = 0, onceki = 0, islem = 0;

  const ekle = (tur: KullanimTur, id: string, ad: string, href: string, zaman: number, kredi: number, m?: string) => {
    if (!kredi || kredi < 0) return;
    if (zaman >= oncekiBas && zaman < bas) { onceki += kredi; return; }
    if (zaman < bas || zaman > bit) return;
    toplam += kredi; islem++; turler[tur] += kredi;
    const g = gunluk.get(gunAnahtari(zaman)); if (g) g[tur] += kredi;
    const k = kaynak.get(`${tur}:${id}`) ?? { tur, id, ad, kredi: 0, adet: 0, href };
    k.kredi += kredi; k.adet++; kaynak.set(`${tur}:${id}`, k);
    if (m) model.set(m, (model.get(m) ?? 0) + kredi);
  };

  // Projeler: ajan turları (asistan mesajlarının kredisi)
  // Ekip üyesi olunan projeler sayılmaz; sahibin ve diğer üyelerin harcaması bu rapora girmesin.
  for (const o of (await sahipProjeleri(sahip)).filter((x) => !x.ekipRol).slice(0, 300)) {
    if (o.guncelleme < oncekiBas) continue;
    const p = await projeOku(o.id, sahip).catch(() => null);
    for (const m of p?.mesajlar ?? []) if (m.rol === "asistan") ekle("proje", o.id, o.ad, `/panel/build/${o.id}`, m.zaman, m.kredi ?? 0, m.model);
  }
  // Sohbetler
  for (const o of (await sohbetleriListele(sahip, new Set(), { hepsi: true }).catch(() => [])).slice(0, 400)) {
    if (o.guncelleme < oncekiBas) continue;
    const s = await sohbetGetir(o.id, sahip).catch(() => null);
    for (const m of s?.mesajlar ?? []) if (m.rol === "asistan") ekle("sohbet", o.id, o.baslik || "Sohbet", `/panel/build/sohbet/${o.id}`, m.zaman, (m.kredi ?? 0) + (m.aracKredi ?? 0), m.model);
  }
  // Ajan çalışmaları (deneme, kanallar, zamanlı, web kancası)
  for (const a of (await ajanlariListele(sahip)).slice(0, 200)) {
    for (const c of await calismalariListele(a.id).catch(() => [])) ekle("ajan", a.id, a.ad, `/panel/build/ajanlar/${a.id}`, c.baslangic, c.kredi, c.model);
  }
  // Sistem çalışmaları
  for (const s of (await sistemleriListele(sahip)).slice(0, 200)) {
    for (const c of await calismalariOku(s.id, 2000).catch(() => [])) ekle("sistem", s.id, s.ad, `/panel/build/sistemler/${s.id}`, c.baslangic, c.kredi);
  }

  const yuvarla = (n: number) => Math.round(n * 10) / 10;
  return {
    gun, bas, bit, toplam: yuvarla(toplam), onceki: yuvarla(onceki), islem,
    turler: { proje: yuvarla(turler.proje), sohbet: yuvarla(turler.sohbet), ajan: yuvarla(turler.ajan), sistem: yuvarla(turler.sistem) },
    gunluk: [...gunluk.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([g, v]) => ({ gun: g, proje: yuvarla(v.proje), sohbet: yuvarla(v.sohbet), ajan: yuvarla(v.ajan), sistem: yuvarla(v.sistem) })),
    kaynaklar: [...kaynak.values()].map((k) => ({ ...k, kredi: yuvarla(k.kredi) })).sort((a, b) => b.kredi - a.kredi).slice(0, 25),
    modeller: [...model.entries()].map(([m, k]) => ({ model: m, kredi: yuvarla(k) })).sort((a, b) => b.kredi - a.kredi).slice(0, 10),
  };
}
