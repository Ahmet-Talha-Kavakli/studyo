import "server-only";
import { open } from "fs/promises";
import path from "path";
import { PLAN_KREDI } from "@/lib/fiyat";
import { D, jsonOku, jsonYaz, kilitle, satirEkle, sil, yeniKimlik } from "./depo";
import type { KrediHareketi, KrediHareketTuru, KrediOzeti, PlanKimligi } from "./tipler";

/**
 * Sunucu kredi defteri. Kullanıcı başına tek sırada çalışır (kilitle), bakiye hiçbir zaman eksiye düşmez.
 *
 * İki kova: planKredi (aylık kotadan kalan) ve ekKredi (satın alınan ya da eklenen, süresi dolmaz).
 * Harcama önce plan kovasından düşer. Dönem (bir ay) bitince plan kotası yenilenir: Artı, Ultra ve Kurumsal'da
 * kullanılmayan aylık kredi en çok bir aylık kota kadar devreder; Başlangıç'ta devretmez.
 *
 *  kredi/<uid>.json    durum: kovalar, dönem, son sıra, işlem anahtarları (aynı anahtarla ikinci harcama düşülmez)
 *  kredi/<uid>.jsonl   hareketler; yalnız sona eklenir, hiç değiştirilmez
 */

const DEVREDER: Record<PlanKimligi, boolean> = { baslangic: false, arti: true, ultra: true, kurumsal: true };
const PLAN_AD: Record<PlanKimligi, string> = { baslangic: "Başlangıç", arti: "Artı", ultra: "Ultra", kurumsal: "Kurumsal" };
export const planKotasi = (p: PlanKimligi) => PLAN_KREDI[p] ?? PLAN_KREDI.baslangic;
export const ANAHTAR_DESENI = /^[A-Za-z0-9_:.-]{8,100}$/;
const ANAHTAR_SINIRI = 3000;
const TEK_ISLEM_SINIRI = 1_000_000;

interface AnahtarKaydi { sira: number; tur: "harcama" | "ekleme" | "iade" | "plan"; miktar: number; zaman: number; plandan?: number; ekten?: number; iadeSira?: number }

interface Defter {
  surum: 1;
  uid: string;
  plan: PlanKimligi;
  planKredi: number;
  ekKredi: number;
  donemBaslangic: number;
  donemBitis: number;
  donemToplam: number;
  sonSira: number;
  anahtarlar: Record<string, AnahtarKaydi>;
  /** Plana özel aylık kota (Ultra kademeleri). Yoksa planın kotası. */
  ozelKota?: number;
  /**
   * Ödenmiş dönemin sonu (abonelik). Elle yenilenen abonelikte gelecek defter dönemi bu zamana kadar ödenmemişse dönümde
   * plan Başlangıç'a döner (ödenmemiş kota verilmez). Otomatik yenilenen abonelikte (planOtomatik) yenileme bildirimi için
   * iki gün beklenir; ödeme alınamazsa bildirim planı hemen düşürür.
   */
  planBitis?: number;
  planOtomatik?: boolean;
  /** Dönem sonunda geçilecek plan (aboneliği düşürme ya da dönem değişikliği). */
  planGecis?: { zaman: number; plan: PlanKimligi; kota?: number; bitis?: number };
  /** Çalışma alanının ortak havuzu: ücretsiz (Başlangıç) alan planında aylık kota yoktur; kredi aktarım ve satın almayla gelir. */
  alan?: true;
}

/** Defterin geçerli aylık kotası. */
const kotaAl = (d: Defter) => d.ozelKota ?? (d.alan && d.plan === "baslangic" ? 0 : planKotasi(d.plan));
/** Abonelik dönem sonu ile defter dönümü arasında saniyelik kayma olabilir: bu kadar önceki dönüm de sona ermiş sayılır. */
const GECIS_TOLERANSI = 6 * 3_600_000;
/** Otomatik yenilemede ödeme bildirimi gecikirse plan bu kadar süre açık kalır. */
const OTOMATIK_TAMPON = 2 * 86_400_000;

const durumDosyasi = (uid: string) => path.join(D.kredi, `${uid}.json`);
const hareketDosyasi = (uid: string) => path.join(D.kredi, `${uid}.jsonl`);

/** Takvim ayı ekler (31'i olmayan ayda ayın son günü). */
export function ayEkle(t: number, n = 1): number {
  const d = new Date(t);
  const gun = d.getUTCDate();
  const hedef = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1, d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()));
  const son = new Date(Date.UTC(hedef.getUTCFullYear(), hedef.getUTCMonth() + 1, 0)).getUTCDate();
  hedef.setUTCDate(Math.min(gun, son));
  return hedef.getTime();
}

function ozetle(d: Defter): KrediOzeti {
  return {
    bakiye: d.planKredi + d.ekKredi, plan: d.plan, kota: kotaAl(d), planKredi: d.planKredi, ekKalan: d.ekKredi,
    donemBaslangic: d.donemBaslangic, donemBitis: d.donemBitis, donemToplam: Math.max(d.donemToplam, d.planKredi + d.ekKredi), sira: d.sonSira,
  };
}

type Ekle = (tur: KrediHareketTuru, miktar: number, kaynak: string, aciklama: string) => KrediHareketi;

/** Dönem dönümünde planın değişip değişmeyeceği: planlanmış geçiş ya da ödenmiş dönemin bitişi. */
function gecisUygula(d: Defter, ekle: Ekle) {
  const eski = d.plan;
  if (d.planGecis && d.donemBitis >= d.planGecis.zaman - GECIS_TOLERANSI) {
    const g = d.planGecis;
    d.plan = g.plan;
    if (g.kota && g.kota !== planKotasi(g.plan)) d.ozelKota = g.kota; else delete d.ozelKota;
    if (g.bitis) d.planBitis = g.bitis;
    delete d.planGecis;
    if (eski !== d.plan) ekle("plan", 0, "abonelik", `Dönem sonu: ${PLAN_AD[eski]} planından ${PLAN_AD[d.plan]} planına geçildi`);
  }
  if (!d.planBitis) return;
  const odenmedi = d.planOtomatik ? d.donemBitis >= d.planBitis + OTOMATIK_TAMPON : d.planBitis < ayEkle(d.donemBitis) - GECIS_TOLERANSI;
  if (!odenmedi) return;
  const onceki = d.plan;
  d.plan = "baslangic";
  delete d.ozelKota; delete d.planBitis; delete d.planOtomatik; delete d.planGecis;
  if (onceki !== "baslangic") ekle("plan", 0, "abonelik", `${PLAN_AD[onceki]} planının ödenmiş dönemi bitti, Başlangıç planına geçildi`);
}

function donemYenile(d: Defter, ekle: Ekle) {
  for (let n = 0; Date.now() >= d.donemBitis && n < 36; n++) {
    gecisUygula(d, ekle);
    const k = kotaAl(d);
    const devir = DEVREDER[d.plan] ? Math.min(Math.max(0, d.planKredi), k) : 0;
    const kaybedilen = Math.max(0, d.planKredi - devir);
    if (kaybedilen) { d.planKredi -= kaybedilen; ekle("sona-erdi", -kaybedilen, "sistem", DEVREDER[d.plan] ? "Dönem sonu: devir sınırını aşan aylık kredi" : "Dönem sonu: kullanılmayan aylık kredi"); }
    d.planKredi = devir + k;
    d.donemBaslangic = d.donemBitis;
    d.donemBitis = ayEkle(d.donemBaslangic);
    d.donemToplam = d.planKredi + d.ekKredi;
    ekle("kota", k, "sistem", `${PLAN_AD[d.plan]} planı aylık kotası${devir ? `, ${devir} kredi devretti` : ""}`);
  }
}

function yeniDefter(uid: string, plan: PlanKimligi): Defter {
  const simdi = Date.now();
  return { surum: 1, uid, plan, planKredi: planKotasi(plan), ekKredi: 0, donemBaslangic: simdi, donemBitis: ayEkle(simdi), donemToplam: planKotasi(plan), sonSira: 0, anahtarlar: {} };
}

/**
 * Defter üzerinde sıralı işlem. Defter yoksa verilen planla açılır (açılış hareketi yazılır).
 * Durum önce atomik yazılır, hareketler sonra sona eklenir.
 */
async function islem<T>(uid: string, plan: PlanKimligi | null, f: (d: Defter, ekle: Ekle) => T): Promise<{ ozet: KrediOzeti; sonuc: T }> {
  return kilitle(`kredi:${uid}`, async () => {
    let d = await jsonOku<Defter>(durumDosyasi(uid));
    const yeni: KrediHareketi[] = [];
    const ekle: Ekle = (tur, miktar, kaynak, aciklama) => {
      d!.sonSira += 1;
      const h: KrediHareketi = { sira: d!.sonSira, id: yeniKimlik("kh"), zaman: Date.now(), tur, miktar, bakiye: d!.planKredi + d!.ekKredi, kaynak: kaynak.slice(0, 80), aciklama: aciklama.slice(0, 200) };
      yeni.push(h);
      return h;
    };
    let degisti = false;
    if (!d) {
      d = yeniDefter(uid, plan ?? "baslangic");
      ekle("acilis", d.planKredi, "sistem", `Hesap açıldı: ${PLAN_AD[d.plan]} planı aylık kotası`);
      degisti = true;
    }
    const oncekiSira = d.sonSira;
    donemYenile(d, ekle);
    const anahtarSayisi = Object.keys(d.anahtarlar).length;
    const sonuc = f(d, ekle);
    if (degisti || d.sonSira !== oncekiSira || Object.keys(d.anahtarlar).length !== anahtarSayisi) {
      const l = Object.entries(d.anahtarlar);
      if (l.length > ANAHTAR_SINIRI) d.anahtarlar = Object.fromEntries(l.sort((a, b) => b[1].sira - a[1].sira).slice(0, ANAHTAR_SINIRI));
      await jsonYaz(durumDosyasi(uid), d);
      for (const h of yeni) await satirEkle(hareketDosyasi(uid), h);
    }
    return { ozet: ozetle(d), sonuc };
  });
}

const gecerliMiktar = (m: unknown): m is number => typeof m === "number" && Number.isInteger(m) && m > 0 && m <= TEK_ISLEM_SINIRI;

/* ── Dışa açık işlemler ── */

export async function defterAc(uid: string, plan: PlanKimligi) { return (await islem(uid, plan, () => null)).ozet; }

/**
 * Çalışma alanı havuzu: kotasız Başlangıç planıyla boş açılır (ücretsiz alan açarak kredi çoğaltılamasın).
 * Defter varsa dokunmaz. Kimlik a_ ile başlar; hesap defterleriyle aynı dizinde, aynı kurallarla çalışır.
 */
export async function alanDefteriAc(id: string) {
  await kilitle(`kredi:${id}`, async () => {
    if (await jsonOku<Defter>(durumDosyasi(id))) return;
    const simdi = Date.now();
    const d: Defter = { surum: 1, uid: id, plan: "baslangic", planKredi: 0, ekKredi: 0, donemBaslangic: simdi, donemBitis: ayEkle(simdi), donemToplam: 0, sonSira: 1, anahtarlar: {}, alan: true };
    await jsonYaz(durumDosyasi(id), d);
    await satirEkle(hareketDosyasi(id), { sira: 1, id: yeniKimlik("kh"), zaman: simdi, tur: "acilis", miktar: 0, bakiye: 0, kaynak: "alan", aciklama: "Çalışma alanı kredi havuzu açıldı" } satisfies KrediHareketi);
  });
  return krediOzeti(id);
}
export async function krediOzeti(uid: string, plan: PlanKimligi = "baslangic") { return (await islem(uid, plan, () => null)).ozet; }

export type HarcamaSonucu =
  | { ok: true; tekrar: boolean; ozet: KrediOzeti; hareket?: KrediHareketi }
  | { ok: false; neden: "yetersiz" | "cakisma" | "gecersiz"; ozet?: KrediOzeti };

/**
 * Harcama. Aynı anahtarla gelen ikinci istek yeniden düşmez, ilk sonucu döndürür (tekrar: true).
 * Aynı anahtar başka miktarla gelirse çakışma. Bakiye yetmezse hiçbir şey düşmez.
 */
export async function krediHarca(uid: string, miktar: number, g: { kaynak: string; aciklama?: string; anahtar: string; plan?: PlanKimligi }): Promise<HarcamaSonucu> {
  if (!gecerliMiktar(miktar) || !ANAHTAR_DESENI.test(g.anahtar)) return { ok: false, neden: "gecersiz" };
  const { ozet, sonuc } = await islem(uid, g.plan ?? null, (d, ekle) => {
    const once = d.anahtarlar[g.anahtar];
    if (once) return once.tur === "harcama" && once.miktar === miktar ? ({ durum: "tekrar" } as const) : ({ durum: "cakisma" } as const);
    if (d.planKredi + d.ekKredi < miktar) return { durum: "yetersiz" } as const;
    const plandan = Math.min(Math.max(0, d.planKredi), miktar), ekten = miktar - plandan;
    d.planKredi -= plandan; d.ekKredi -= ekten;
    const h = ekle("harcama", -miktar, g.kaynak, g.aciklama || "Kredi harcaması");
    d.anahtarlar[g.anahtar] = { sira: h.sira, tur: "harcama", miktar, zaman: h.zaman, plandan, ekten };
    return { durum: "tamam", hareket: h } as const;
  });
  if (sonuc.durum === "tamam") return { ok: true, tekrar: false, ozet, hareket: sonuc.hareket };
  if (sonuc.durum === "tekrar") return { ok: true, tekrar: true, ozet };
  return { ok: false, neden: sonuc.durum, ozet };
}

/** Kredi ekler (süresi dolmayan kova). Anahtar verilirse aynı ekleme iki kez yapılmaz. */
export async function krediEkle(uid: string, miktar: number, g: { kaynak: string; aciklama?: string; anahtar?: string; plan?: PlanKimligi }): Promise<HarcamaSonucu> {
  if (!gecerliMiktar(miktar) || (g.anahtar && !ANAHTAR_DESENI.test(g.anahtar))) return { ok: false, neden: "gecersiz" };
  const { ozet, sonuc } = await islem(uid, g.plan ?? null, (d, ekle) => {
    if (g.anahtar && d.anahtarlar[g.anahtar]) return d.anahtarlar[g.anahtar].tur === "ekleme" && d.anahtarlar[g.anahtar].miktar === miktar ? "tekrar" : "cakisma";
    d.ekKredi += miktar;
    d.donemToplam += miktar;
    const h = ekle("ekleme", miktar, g.kaynak, g.aciklama || "Kredi eklendi");
    if (g.anahtar) d.anahtarlar[g.anahtar] = { sira: h.sira, tur: "ekleme", miktar, zaman: h.zaman };
    return "tamam";
  });
  if (sonuc === "cakisma") return { ok: false, neden: "cakisma", ozet };
  return { ok: true, tekrar: sonuc === "tekrar", ozet };
}

export type IadeSonucu = { ok: true; tekrar: boolean; miktar: number; ozet: KrediOzeti } | { ok: false; neden: "bulunamadi" | "gecersiz"; ozet?: KrediOzeti };

/** Bir harcamayı anahtarıyla bir kez geri verir; düştüğü kovalara döner. */
export async function krediIade(uid: string, harcamaAnahtari: string, g: { kaynak: string; aciklama?: string }): Promise<IadeSonucu> {
  if (!ANAHTAR_DESENI.test(harcamaAnahtari)) return { ok: false, neden: "gecersiz" };
  const { ozet, sonuc } = await islem(uid, null, (d, ekle) => {
    const a = d.anahtarlar[harcamaAnahtari];
    if (!a || a.tur !== "harcama") return { durum: "yok" } as const;
    if (a.iadeSira) return { durum: "tekrar", miktar: a.miktar } as const;
    d.planKredi += a.plandan ?? a.miktar;
    d.ekKredi += a.ekten ?? 0;
    const h = ekle("iade", a.miktar, g.kaynak, g.aciklama || "Kredi iadesi");
    a.iadeSira = h.sira;
    return { durum: "tamam", miktar: a.miktar } as const;
  });
  if (sonuc.durum === "yok") return { ok: false, neden: "bulunamadi", ozet };
  return { ok: true, tekrar: sonuc.durum === "tekrar", miktar: sonuc.miktar, ozet };
}

/** Plan değişikliği: yeni dönem hemen başlar, yeni planın kotası verilir (devir kuralı yeni plana göre). */
export async function planDegistir(uid: string, yeni: PlanKimligi, kaynak: string) {
  return (await islem(uid, yeni, (d, ekle) => {
    if (d.plan === yeni) return;
    const eski = d.plan;
    const k = planKotasi(yeni);
    const devir = DEVREDER[yeni] ? Math.min(Math.max(0, d.planKredi), k) : 0;
    const kaybedilen = Math.max(0, d.planKredi - devir);
    if (kaybedilen) { d.planKredi -= kaybedilen; ekle("sona-erdi", -kaybedilen, kaynak, `${PLAN_AD[eski]} planından kalan aylık kredi`); }
    d.plan = yeni;
    delete d.ozelKota; delete d.planBitis; delete d.planGecis; delete d.planOtomatik;
    d.planKredi = devir + k;
    d.donemBaslangic = Date.now();
    d.donemBitis = ayEkle(d.donemBaslangic);
    d.donemToplam = d.planKredi + d.ekKredi;
    ekle("plan", k, kaynak, `${PLAN_AD[eski]} planından ${PLAN_AD[yeni]} planına geçildi`);
  })).ozet;
}

export type PlanAyari = {
  plan: PlanKimligi;
  /** Aylık kota; planın varsayılanından farklıysa özel kota olarak saklanır. */
  kota?: number;
  /** true: yeni dönem hemen başlar ve yeni kota verilir (yükseltme, yeni abonelik). false: yalnız ödenmiş dönem sonu ve geçiş güncellenir. */
  yeniDonem: boolean;
  /** Ödenmiş dönemin sonu; null kaldırır (süresiz), undefined dokunmaz. */
  planBitis?: number | null;
  /** Dönem sonu geçişi; null kaldırır, undefined dokunmaz. */
  gecis?: { zaman: number; plan: PlanKimligi; kota?: number; bitis?: number } | null;
  /** Otomatik yenilenen abonelik mi (Stripe); undefined dokunmaz. */
  otomatik?: boolean;
  /** Defter döneminin bitişini sağlayıcının dönem sonuna eşitler (aylık Stripe aboneliğinde takvim kayması olmasın). */
  donemBitis?: number;
  kaynak: string;
  aciklama?: string;
  /** Aynı anahtarla ikinci çağrı hiçbir şeyi değiştirmez (ödeme bildirimi tekrar gelirse). */
  anahtar?: string;
};

/**
 * Abonelik için plan ayarı. Ödeme sistemi çağırır: yükseltmede yeni dönem hemen başlar (devir kuralı yeni plana göre),
 * yenilemede yalnız ödenmiş dönem sonu uzar, düşürmede geçiş dönem sonuna yazılır.
 */
export async function planAyarla(uid: string, g: PlanAyari): Promise<{ ozet: KrediOzeti; tekrar: boolean }> {
  if (g.anahtar && !ANAHTAR_DESENI.test(g.anahtar)) throw new Error("Geçersiz işlem anahtarı.");
  const { ozet, sonuc } = await islem(uid, g.plan, (d, ekle) => {
    if (g.anahtar && d.anahtarlar[g.anahtar]) return true;
    if (g.yeniDonem) {
      const eski = d.plan, eskiKota = kotaAl(d);
      const k = g.kota ?? planKotasi(g.plan);
      const devir = DEVREDER[g.plan] ? Math.min(Math.max(0, d.planKredi), k) : 0;
      const kaybedilen = Math.max(0, d.planKredi - devir);
      if (kaybedilen) { d.planKredi -= kaybedilen; ekle("sona-erdi", -kaybedilen, g.kaynak, `${PLAN_AD[eski]} planından kalan aylık kredi`); }
      d.plan = g.plan;
      if (k !== planKotasi(g.plan)) d.ozelKota = k; else delete d.ozelKota;
      d.planKredi = devir + k;
      d.donemBaslangic = Date.now();
      d.donemBitis = g.donemBitis && g.donemBitis > d.donemBaslangic && g.donemBitis - d.donemBaslangic < 40 * 86_400_000 ? g.donemBitis : ayEkle(d.donemBaslangic);
      d.donemToplam = d.planKredi + d.ekKredi;
      const h = ekle("plan", k, g.kaynak, g.aciklama || (eski === g.plan && eskiKota === k ? `${PLAN_AD[g.plan]} planı başladı` : `${PLAN_AD[eski]} planından ${PLAN_AD[g.plan]} planına geçildi`));
      if (g.anahtar) d.anahtarlar[g.anahtar] = { sira: h.sira, tur: "plan", miktar: k, zaman: h.zaman };
    } else {
      if (g.anahtar) d.anahtarlar[g.anahtar] = { sira: d.sonSira, tur: "plan", miktar: 0, zaman: Date.now() };
      if (g.donemBitis && g.donemBitis > Date.now() && Math.abs(g.donemBitis - d.donemBitis) < 5 * 86_400_000) d.donemBitis = g.donemBitis;
    }
    if (g.planBitis === null) delete d.planBitis; else if (g.planBitis !== undefined) d.planBitis = g.planBitis;
    if (g.gecis === null) delete d.planGecis; else if (g.gecis !== undefined) d.planGecis = g.gecis;
    if (g.otomatik !== undefined) { if (g.otomatik) d.planOtomatik = true; else delete d.planOtomatik; }
    return false;
  });
  // Yalnız dönem sonu değiştiyse de durum yazılmalı: islem yalnız sıra ya da anahtar değişince yazar; anahtarsız uzatmada sıra değişmez.
  if (!g.yeniDonem && !g.anahtar) await defterAyarYaz(uid, g);
  return { ozet, tekrar: sonuc };
}

/** Anahtarsız dönem sonu güncellemesi (islem yalnız hareket ya da anahtar eklenince yazdığı için ayrı yazılır). */
async function defterAyarYaz(uid: string, g: PlanAyari) {
  await kilitle(`kredi:${uid}`, async () => {
    const d = await jsonOku<Defter>(durumDosyasi(uid));
    if (!d) return;
    if (g.planBitis === null) delete d.planBitis; else if (g.planBitis !== undefined) d.planBitis = g.planBitis;
    if (g.gecis === null) delete d.planGecis; else if (g.gecis !== undefined) d.planGecis = g.gecis;
    if (g.otomatik !== undefined) { if (g.otomatik) d.planOtomatik = true; else delete d.planOtomatik; }
    await jsonYaz(durumDosyasi(uid), d);
  });
}

/** Defterin abonelik alanları (ödeme sistemi tanılama ve sınama için). */
export async function defterPlanDurumu(uid: string): Promise<{ plan: PlanKimligi; kota: number; planBitis?: number; planOtomatik?: boolean; planGecis?: Defter["planGecis"]; donemBitis: number } | null> {
  const d = await jsonOku<Defter>(durumDosyasi(uid));
  return d ? { plan: d.plan, kota: kotaAl(d), planBitis: d.planBitis, planOtomatik: d.planOtomatik, planGecis: d.planGecis, donemBitis: d.donemBitis } : null;
}

/** Son hareketler (en yeni başta). Dosyanın yalnız sonu okunur. */
export async function sonHareketler(uid: string, adet = 50): Promise<KrediHareketi[]> {
  let fh;
  try { fh = await open(hareketDosyasi(uid), "r"); } catch { return []; }
  try {
    const { size } = await fh.stat();
    const oku = Math.min(size, Math.max(16_384, adet * 400));
    const b = Buffer.alloc(oku);
    await fh.read(b, 0, oku, size - oku);
    const satirlar = b.toString("utf8").split("\n").filter(Boolean);
    if (oku < size) satirlar.shift();
    const l: KrediHareketi[] = [];
    for (const s of satirlar) { try { l.push(JSON.parse(s)); } catch { /* yarım satır */ } }
    return l.slice(-adet).reverse();
  } finally { await fh.close(); }
}

export async function defterSil(uid: string) {
  await kilitle(`kredi:${uid}`, async () => { await sil(durumDosyasi(uid)); await sil(hareketDosyasi(uid)); });
}
