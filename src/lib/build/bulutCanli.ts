import "server-only";
import { randomBytes } from "crypto";
import { suzgecUygula, type Kayit, type Kural, type Suzgec, type VeriOrtami } from "./veri";

/**
 * Vayra Bulut gerçek zamanlı katmanı (Supabase Realtime, Firestore onSnapshot, PocketBase SSE benzeri).
 *  - Tablo değişiklikleri: kayıt eklenince, güncellenince ya da silinince abonelere "degisiklik" olayı gider. Okuma kuralı
 *    her abone ve her olay için ayrı denetlenir (herkes, üyeler, yalnız kaydın sahibi, kapalı). Abonelik süzgeci
 *    (vayra.veri süzgeç biçimi) sunucuda uygulanır; güncellemede eski ya da yeni hâl süzgece uyuyorsa gönderilir.
 *  - Kanallar: herkese açık yayın mesajları (vayra.kanal(ad).gonder) ve varlık (kim çevrimiçi; bağlantı kapanınca düşer).
 *    "uyeler:" ile başlayan kanallara yalnız giriş yapmış üyeler katılır.
 *  - Bağlantı tek bir SSE akışıdır (tarayıcı başına bir); abonelikler ve kanallar adres parametresiyle gelir.
 * Bellekte tutulur (tek sunucu); son 100 olay Bulut > Gerçek zamanlı izleyicisi için saklanır.
 */
export type CanliOlayTur = "ekle" | "guncelle" | "sil" | "toplu";
export type Abonelik = { i: string; t: string; s?: Suzgec[] };
export type Abone = {
  id: string; projeId: string; ortam: VeriOrtami; yetkili: boolean; uyeId: string | null; kaynak: "site" | "panel";
  abonelikler: Abonelik[]; kanallar: Map<string, Record<string, unknown>>; ip: string; z: number;
  /** Panel izleyicisi: bütün kanal mesajlarını alır, varlık listesinde görünmez. */ izleyici?: boolean;
  yaz: (olay: string, veri: unknown) => void;
};
export type IzOlay = { z: number; tur: "degisiklik" | "mesaj" | "katildi" | "ayrildi"; tablo?: string; olay?: string; kanal?: string; ozet: string; ortam: VeriOrtami; alici: number; veri?: unknown };
type Durum = { aboneler: Map<string, Set<Abone>>; iz: Map<string, IzOlay[]>; sayac: Map<string, { olay: number; mesaj: number; bas: number }> };
const G = globalThis as unknown as { __vayraCanli?: Durum };
const d: Durum = (G.__vayraCanli ??= { aboneler: new Map(), iz: new Map(), sayac: new Map() });

export const CANLI_SINIR = { proje: 500, ip: 20, abonelik: 20, kanal: 10, mesaj: 4000 };
export const kanalAdiGecerli = (a: string) => /^[A-Za-z0-9_:-]{1,60}$/.test(a);

function izEkle(projeId: string, o: IzOlay) {
  const l = d.iz.get(projeId) ?? [];
  l.unshift(o);
  d.iz.set(projeId, l.slice(0, 100));
  const s = d.sayac.get(projeId) ?? { olay: 0, mesaj: 0, bas: Date.now() };
  if (o.tur === "degisiklik") s.olay++; else if (o.tur === "mesaj") s.mesaj++;
  d.sayac.set(projeId, s);
}

/** Yeni bağlantı açılabilir mi (proje ve IP başına sınır). */
export function canliYerVar(projeId: string, ip: string) {
  const l = [...(d.aboneler.get(projeId) ?? [])];
  if (l.length >= CANLI_SINIR.proje) return "Bu sitede aynı anda en çok 500 canlı bağlantı açılabilir.";
  if (l.filter((a) => a.ip === ip).length >= CANLI_SINIR.ip) return "Bu bağlantıdan çok fazla canlı akış açık.";
  return null;
}

/** Aboneyi kaydeder; dönen işlev bağlantı kapanınca çağrılır (kanallardan düşer, varlık yayınlanır). */
export function aboneEkle(a: Omit<Abone, "id" | "z">): { abone: Abone; kaldir: () => void } {
  const abone: Abone = { ...a, id: randomBytes(6).toString("base64url"), z: Date.now() };
  const l = d.aboneler.get(a.projeId) ?? new Set<Abone>();
  l.add(abone);
  d.aboneler.set(a.projeId, l);
  for (const k of abone.kanallar.keys()) { varlikYayinla(a.projeId, a.ortam, k); izEkle(a.projeId, { z: Date.now(), tur: "katildi", kanal: k, ozet: `${k} kanalına katılım`, ortam: a.ortam, alici: 0 }); }
  return {
    abone,
    kaldir: () => {
      l.delete(abone);
      if (!l.size) d.aboneler.delete(a.projeId);
      for (const k of abone.kanallar.keys()) { varlikYayinla(a.projeId, a.ortam, k); izEkle(a.projeId, { z: Date.now(), tur: "ayrildi", kanal: k, ozet: `${k} kanalından ayrılış`, ortam: a.ortam, alici: 0 }); }
    },
  };
}

/** Abone kaydı görebilir mi (tablonun okuma kuralı). */
function gorebilir(a: Abone, okuma: Kural, kayit?: Kayit) {
  if (a.yetkili) return true;
  if (okuma === "herkes") return true;
  if (okuma === "uyeler") return !!a.uyeId;
  if (okuma === "sahibi") return !!a.uyeId && (!kayit || kayit.uyeId === a.uyeId);
  return false;
}

/**
 * Tablo değişikliğini abonelere iletir. kayit: yeni hâl (silmede silinen kayıt), onceki: güncellemeden önceki hâl.
 * Silmede ziyaretçiye yalnız kimlik gider; panel (sahip) bütün kaydı görür.
 */
export function canliYayinla(projeId: string, ortam: VeriOrtami, tablo: string, okuma: Kural, olay: CanliOlayTur, kayit?: Kayit, onceki?: Kayit, adet?: number) {
  const l = d.aboneler.get(projeId);
  let alici = 0;
  if (l) for (const a of l) {
    if (a.ortam !== ortam) continue;
    const eslesen = a.abonelikler.filter((s) => {
      if (s.t !== tablo && !(s.t === "*" && a.yetkili)) return false;
      if (olay === "toplu") return true;
      if (!gorebilir(a, okuma, kayit ?? onceki)) return false;
      if (!s.s?.length) return true;
      return [kayit, onceki].some((k) => !!k && suzgecUygula([k], s.s!).length > 0);
    });
    if (!eslesen.length) continue;
    if (olay === "toplu" && !a.yetkili && okuma === "kapali") continue;
    alici++;
    const k = olay === "sil" && !a.yetkili && kayit ? { id: kayit.id } : kayit;
    a.yaz("degisiklik", { i: eslesen.map((s) => s.i), tablo, olay, ...(k ? { kayit: k } : {}), ...(olay === "guncelle" && onceki && a.yetkili ? { onceki } : {}), ...(adet ? { adet } : {}), z: Date.now() });
  }
  // Veri kancaları (dış adrese imzalı POST): yalnız Canlı ortamda ve tek kayıt olaylarında.
  if (ortam === "canli" && olay !== "toplu") import("./bulutKanca").then((m) => m.kancaTetikle(projeId, tablo, olay, kayit, onceki)).catch(() => {});
  izEkle(projeId, { z: Date.now(), tur: "degisiklik", tablo, olay, ozet: olay === "toplu" ? `${tablo}: toplu değişiklik${adet ? `, ${adet} kayıt` : ""}` : `${tablo}: ${olay === "ekle" ? "kayıt eklendi" : olay === "guncelle" ? "kayıt güncellendi" : "kayıt silindi"}${kayit?.id ? ` (${kayit.id})` : ""}`, ortam, alici, veri: kayit });
}

/** Kanaldaki varlık listesi (en çok 100 kişi): { id, ...meta }. */
export function kanalKimler(projeId: string, ortam: VeriOrtami, kanal: string) {
  const o: Record<string, unknown>[] = [];
  for (const a of d.aboneler.get(projeId) ?? []) if (a.ortam === ortam && a.kanallar.has(kanal) && o.length < 100) o.push({ ...a.kanallar.get(kanal), id: a.id, ...(a.uyeId ? { uyeId: a.uyeId } : {}) });
  return o;
}
function varlikYayinla(projeId: string, ortam: VeriOrtami, kanal: string) {
  const kimler = kanalKimler(projeId, ortam, kanal);
  for (const a of d.aboneler.get(projeId) ?? []) if (a.ortam === ortam && a.kanallar.has(kanal)) a.yaz("varlik", { kanal, kimler, z: Date.now() });
}

/** Kanala yayın mesajı gönderir; alıcı sayısını döner. haric: gönderen abonenin kendisi (kendine yankı istemezse). */
export function kanalGonder(projeId: string, ortam: VeriOrtami, kanal: string, olay: string, veri: unknown, haric?: string) {
  let alici = 0;
  for (const a of d.aboneler.get(projeId) ?? []) {
    if (a.ortam !== ortam || (!a.kanallar.has(kanal) && !a.izleyici) || a.id === haric) continue;
    a.yaz("mesaj", { kanal, olay, veri, z: Date.now() });
    alici++;
  }
  izEkle(projeId, { z: Date.now(), tur: "mesaj", kanal, olay, ozet: `${kanal}: "${olay}" mesajı`, ortam, alici, veri });
  return alici;
}
export const aboneVarMi = (projeId: string, id: string) => [...(d.aboneler.get(projeId) ?? [])].some((a) => a.id === id);

/** İzleyici özeti: bağlantılar, kanallar (kişi sayısı), tablo başına abone, son olaylar, sayaçlar. */
export function canliDurum(projeId: string) {
  const l = [...(d.aboneler.get(projeId) ?? [])];
  const kanallar = new Map<string, number>();
  const tablolar = new Map<string, number>();
  for (const a of l) {
    for (const k of a.kanallar.keys()) kanallar.set(k, (kanallar.get(k) ?? 0) + 1);
    for (const s of a.abonelikler) tablolar.set(s.t, (tablolar.get(s.t) ?? 0) + 1);
  }
  const s = d.sayac.get(projeId) ?? { olay: 0, mesaj: 0, bas: Date.now() };
  return {
    baglanti: l.length, site: l.filter((a) => a.kaynak === "site").length, uye: l.filter((a) => a.uyeId).length,
    kanallar: [...kanallar.entries()].map(([ad, kisi]) => ({ ad, kisi, kimler: kanalKimler(projeId, l.find((a) => a.kanallar.has(ad))?.ortam ?? "canli", ad).slice(0, 20) })).sort((a, b) => b.kisi - a.kisi),
    tablolar: [...tablolar.entries()].map(([ad, abone]) => ({ ad, abone })).sort((a, b) => b.abone - a.abone),
    son: d.iz.get(projeId) ?? [], sayac: s,
  };
}
