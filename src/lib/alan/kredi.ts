import "server-only";
import path from "path";
import { jsonOku, jsonYaz, kilitle, satirEkle } from "@/lib/hesap/depo";
import { krediEkle, krediHarca, krediIade, krediOzeti } from "@/lib/hesap/kredi";
import type { KrediOzeti } from "@/lib/hesap/tipler";
import { AD, alanGuncelle, alanOku, gunlukEkle, jsonlOku, uyeBul, type AlanKaydi, type UyeKaydi } from "./depo";
import type { AlanKrediBilgisi, AlanKrediHata, AlanUrun } from "./tipler";

/**
 * Ortak kredi havuzu. Harcama alan defterinden düşer; üye başına aylık sınır (UTC takvim ayı, ayın 1'inde sıfırlanır)
 * kesintiden önce, alan başına tek sırada denetlenir. İzleyici harcayamaz. Her harcama ve iade üye adıyla kullanım
 * günlüğüne yazılır (kullanım raporu ve CSV buradan çıkar).
 */

const SON_SINIRI = 3000;
export const ayAnahtari = (t = Date.now()) => new Date(t).toISOString().slice(0, 7);
const sayacDosyasi = (id: string) => path.join(AD.sayac, `${id}.json`);
const kullanimDosyasi = (id: string) => path.join(AD.kullanim, `${id}.jsonl`);

interface Sayac { ay: string; uye: Record<string, number>; son: Record<string, { uid: string; ay: string; miktar: number }> }
/** Kullanım günlüğü satırı (kısa alan adlarıyla). m: harcamada artı, iadede eksi. */
export interface KullanimKaydi { z: number; uid: string; m: number; k: string; a: string; an?: string; i?: 1 }

async function sayacOku(id: string): Promise<Sayac> {
  const s = (await jsonOku<Sayac>(sayacDosyasi(id))) ?? { ay: ayAnahtari(), uye: {}, son: {} };
  if (s.ay !== ayAnahtari()) { s.ay = ayAnahtari(); s.uye = {}; }
  s.son ??= {};
  return s;
}

export const etkinSinir = (a: AlanKaydi, u: UyeKaydi): number | null => (u.sinir === undefined || u.sinir === null ? a.varsayilanSinir : u.sinir);

export function urunBul(kaynak: string): AlanUrun {
  if (kaynak.startsWith("build:")) return "build";
  if (kaynak.startsWith("api:")) return "api";
  if (/^(sunucu:|istemci:|uretim|muzik|ses|upscale|karakter)/.test(kaynak)) return "studyo";
  return "diger";
}

export async function uyeBuAy(id: string): Promise<Record<string, number>> { return (await sayacOku(id)).uye; }

/** Üyenin bu ay harcayabileceği: havuz bakiyesi ile kalan sınırın küçüğü. */
export async function alanKrediBilgisi(a: AlanKaydi, uid: string): Promise<AlanKrediBilgisi> {
  const o = await krediOzeti(a.id, a.plan);
  // Ödenmiş alan dönemi bitince defter planı düşürür; alan kaydı defterle eşitlenir.
  if (o.plan !== a.plan) { a.plan = o.plan; delete a.planBitis; void alanGuncelle(a.id, (x) => { x.plan = o.plan; delete x.planBitis; }).catch(() => {}); }
  const u = uyeBul(a, uid);
  const buAy = (await sayacOku(a.id)).uye[uid] ?? 0;
  const sinir = u ? etkinSinir(a, u) : 0;
  const kalanSinir = sinir === null ? Infinity : Math.max(0, sinir - buAy);
  const kullanilabilir = !u || u.rol === "izleyici" ? 0 : Math.max(0, Math.min(o.bakiye, kalanSinir));
  return { bakiye: o.bakiye, planKredi: o.planKredi, ekKalan: o.ekKalan, kota: o.kota, donemBaslangic: o.donemBaslangic, donemBitis: o.donemBitis, donemToplam: o.donemToplam, kullanilabilir, buAy, etkinSinir: sinir };
}

export type AlanKesSonucu =
  | { ok: true; kesilen: number; tekrar: boolean; ozet: KrediOzeti; kullanilabilir: number }
  | { ok: false; neden: AlanKrediHata | "cakisma" | "gecersiz"; bakiye: number; kullanilabilir: number; sinir: number | null; buAy: number };

/**
 * Alan havuzundan kesinti. kismi: bedel kullanılabilirden büyükse kalanı düşer (Build işi bittikten sonra kesildiği için).
 * Aynı anahtar ikinci kez düşülmez (defter tekrar döner).
 */
export async function alanKrediKes(g: { alanId: string; uid: string; ad: string; tutar: number; kaynak: string; aciklama: string; anahtar: string; kismi?: boolean }): Promise<AlanKesSonucu> {
  return kilitle(`alan-kredi:${g.alanId}`, async () => {
    const a = await alanOku(g.alanId);
    const u = a && uyeBul(a, g.uid);
    if (!a || !u) return { ok: false, neden: "uye-degil", bakiye: 0, kullanilabilir: 0, sinir: null, buAy: 0 } as const;
    const s = await sayacOku(a.id);
    const buAy = s.uye[g.uid] ?? 0;
    const sinir = etkinSinir(a, u);
    const o = await krediOzeti(a.id, a.plan);
    const kalanSinir = sinir === null ? Infinity : Math.max(0, sinir - buAy);
    const kullanilabilir = Math.max(0, Math.min(o.bakiye, kalanSinir));
    if (u.rol === "izleyici") return { ok: false, neden: "izleyici", bakiye: o.bakiye, kullanilabilir: 0, sinir, buAy } as const;
    const once = s.son[g.anahtar];
    let miktar = once ? once.miktar : Math.ceil(g.tutar);
    if (!once) {
      if (g.kismi) miktar = Math.min(miktar, Math.floor(kullanilabilir));
      if (!(miktar > 0) || miktar > kalanSinir || miktar > o.bakiye) {
        const neden = (g.kismi ? kalanSinir <= 0 : g.tutar > kalanSinir) ? "sinir" : "yetersiz";
        return { ok: false, neden, bakiye: o.bakiye, kullanilabilir, sinir, buAy } as const;
      }
    }
    const r = await krediHarca(a.id, miktar, { kaynak: g.kaynak, aciklama: `${g.ad}: ${g.aciklama}`.slice(0, 160), anahtar: g.anahtar, plan: a.plan });
    if (!r.ok) return { ok: false, neden: r.neden, bakiye: r.ozet?.bakiye ?? o.bakiye, kullanilabilir, sinir, buAy } as const;
    if (!r.tekrar) {
      s.uye[g.uid] = buAy + miktar;
      s.son[g.anahtar] = { uid: g.uid, ay: s.ay, miktar };
      const l = Object.entries(s.son);
      if (l.length > SON_SINIRI) s.son = Object.fromEntries(l.slice(-SON_SINIRI));
      await jsonYaz(sayacDosyasi(a.id), s);
      await satirEkle(kullanimDosyasi(a.id), { z: Date.now(), uid: g.uid, m: miktar, k: g.kaynak.slice(0, 80), a: g.aciklama.slice(0, 160), an: g.anahtar } satisfies KullanimKaydi);
    }
    const yeniKalan = sinir === null ? Infinity : Math.max(0, sinir - (s.uye[g.uid] ?? 0));
    return { ok: true, kesilen: r.tekrar ? 0 : miktar, tekrar: r.tekrar, ozet: r.ozet, kullanilabilir: Math.max(0, Math.min(r.ozet.bakiye, yeniKalan)) } as const;
  });
}

/** Alan harcamasını anahtarıyla bir kez geri verir; üyenin bu ayki toplamı da düşer. */
export async function alanIade(alanId: string, anahtar: string, g: { kaynak: string; aciklama: string }) {
  const r = await krediIade(alanId, anahtar, { kaynak: g.kaynak, aciklama: g.aciklama });
  if (r.ok && !r.tekrar) {
    await kilitle(`alan-kredi:${alanId}`, async () => {
      const s = await sayacOku(alanId);
      const k = s.son[anahtar];
      if (!k) return;
      if (k.ay === s.ay) s.uye[k.uid] = Math.max(0, (s.uye[k.uid] ?? 0) - r.miktar);
      delete s.son[anahtar];
      await jsonYaz(sayacDosyasi(alanId), s);
      await satirEkle(kullanimDosyasi(alanId), { z: Date.now(), uid: k.uid, m: -r.miktar, k: g.kaynak.slice(0, 80), a: g.aciklama.slice(0, 160), an: anahtar, i: 1 } satisfies KullanimKaydi);
    });
  }
  return r;
}

export const kullanimOku = (id: string) => jsonlOku<KullanimKaydi>(kullanimDosyasi(id), 8_000_000);

/** Kişisel bakiyeden alan havuzuna aktarım (sahip ve yönetici). Alan tarafı başarısız olursa kişisel harcama geri verilir. */
export async function krediAktar(g: { alanId: string; uid: string; plan: Parameters<typeof krediHarca>[2]["plan"]; miktar: number; ad: string; alanAd: string; ip?: string }) {
  const anahtar = `alan-aktar:${g.alanId.slice(2, 10)}:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const h = await krediHarca(g.uid, g.miktar, { kaynak: "alan:aktar", aciklama: `${g.alanAd} çalışma alanına aktarıldı`, anahtar, plan: g.plan });
  if (!h.ok) return { ok: false as const, neden: h.neden, bakiye: h.ozet?.bakiye };
  const e = await krediEkle(g.alanId, g.miktar, { kaynak: "aktar", aciklama: `${g.ad} kişisel bakiyesinden aktardı`, anahtar });
  if (!e.ok) { await krediIade(g.uid, anahtar, { kaynak: "alan:aktar", aciklama: "Aktarım tamamlanamadı, iade" }); return { ok: false as const, neden: "gecersiz" as const, bakiye: h.ozet.bakiye }; }
  await gunlukEkle(g.alanId, "kredi", { uid: g.uid, ad: g.ad }, `${g.miktar} kredi kişisel bakiyeden aktarıldı`, g.ip);
  return { ok: true as const, kisisel: h.ozet.bakiye, alan: e.ozet };
}
