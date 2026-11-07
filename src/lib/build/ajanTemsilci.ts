import "server-only";
import { guvenliFetch } from "@/lib/guvenliAg";
import type { KonusmaOzet, Oncelik, ZiyaretciKonusma } from "./ziyaretciDepo";

/**
 * Gelen kutusunda ekip: temsilciler (rol, kapasite, durum, sorumlu olduğu ajanlar ve kanallar), atama (elle ya da
 * sırayla / en az yüklüye otomatik), SLA hedefleri (ilk yanıt, sonraki yanıt, çözüm; önceliğe göre çarpan) ve
 * kayıtlı görünümler. Hesaplar saf işlevler; ayarlar gelen kutusu ayar dosyasında durur (ajanGelen.ts).
 * Roller: yönetici her şeyi yapar; temsilci yanıtlar, devralır, atar ama ekip ve SLA ayarını değiştiremez;
 * izleyici yalnız okur. Hepsi aynı Vayra hesabıyla çalışır; rol, bu cihazda seçilen temsilcinin yapabileceklerini
 * sunucuda sınırlar (x-vayra-temsilci başlığı).
 */
export type TemsilciRol = "yonetici" | "temsilci" | "izleyici";
export const ROL_AD: Record<TemsilciRol, string> = { yonetici: "Yönetici", temsilci: "Temsilci", izleyici: "İzleyici" };
export type TemsilciDurum = "cevrimici" | "mesgul" | "cevrimdisi";
export const TDURUM_AD: Record<TemsilciDurum, string> = { cevrimici: "Çevrimiçi", mesgul: "Meşgul", cevrimdisi: "Çevrimdışı" };
export type Temsilci = { id: string; ad: string; rol: TemsilciRol; kapasite: number; durum: TemsilciDurum; ajanlar: string[]; kanallar: string[]; eposta?: string; sonGorulme?: number };
export type AtamaAyar = { otomatik: boolean; yontem: "sirayla" | "enAz"; yalnizCevrimici: boolean; son?: string };
/**
 * Mesai takvimi: SLA saati yalnız çalışma saatlerinde işler (Zendesk ve Intercom'daki çalışma saatleri gibi). Günler
 * 0 Pazar ile 6 Cumartesi; null o gün kapalı. Saatler takvimin saat diliminde (IANA, ör. Europe/Istanbul). Tatil
 * günleri (YYYY-AA-GG) bütün gün kapalı sayılır.
 */
export type SlaTakvim = { acik: boolean; saatDilimi: string; gunler: ({ bas: string; bit: string } | null)[]; tatiller: { tarih: string; ad: string }[] };
export type SlaPolitika = { acik: boolean; ilkYanit: number; sonrakiYanit: number; cozum: number; uyariYuzde: number; carpan: Record<Oncelik, number>; bildirim?: string; takvim?: SlaTakvim };
export type GorunumSuzgec = { sekme?: string; ajan?: string; kanal?: string; etiket?: string; atanan?: string; oncelik?: Oncelik | ""; sla?: "yaklasiyor" | "asildi" | ""; ara?: string };
/** Kayıtlı görünüm. sahip: görünümü kaydeden temsilcinin kimliği (yalnız o görür); yoksa ekiple paylaşılır. */
export type Gorunum = { id: string; ad: string; suzgec: GorunumSuzgec; sahip?: string };
export const ONCELIK_AD: Record<Oncelik, string> = { acil: "Acil", yuksek: "Yüksek", normal: "Normal", dusuk: "Düşük" };

export const varsayilanSla = (): SlaPolitika => ({ acik: false, ilkYanit: 15, sonrakiYanit: 30, cozum: 24, uyariYuzde: 75, carpan: { acil: 0.25, yuksek: 0.5, normal: 1, dusuk: 2 } });
export const varsayilanAtama = (): AtamaAyar => ({ otomatik: false, yontem: "sirayla", yalnizCevrimici: true });
export const HAZIR_GORUNUMLER: Gorunum[] = [
  { id: "atanmamis", ad: "Atanmamış", suzgec: { sekme: "hepsi", atanan: "atanmamis" } },
  { id: "sla-asildi", ad: "SLA aşılan", suzgec: { sekme: "hepsi", sla: "asildi" } },
  { id: "acil", ad: "Acil ve yüksek", suzgec: { sekme: "hepsi", oncelik: "acil" } },
];

const s = (x: unknown, n: number) => (typeof x === "string" ? x.slice(0, n) : "");
const sayiAralik = (x: unknown, alt: number, ust: number, v: number) => { const n = Number(x); return Number.isFinite(n) ? Math.max(alt, Math.min(ust, n)) : v; };
const kim = (x: unknown) => (typeof x === "string" && /^[A-Za-z0-9_-]{2,20}$/.test(x) ? x : Math.random().toString(36).slice(2, 10));
export function temsilciTemizle(x: unknown): Temsilci {
  const t = (x ?? {}) as Partial<Temsilci>;
  return {
    id: kim(t.id), ad: s(t.ad, 40).trim() || "Temsilci", rol: (["yonetici", "temsilci", "izleyici"] as const).includes(t.rol as TemsilciRol) ? (t.rol as TemsilciRol) : "temsilci",
    kapasite: Math.round(sayiAralik(t.kapasite, 1, 100, 5)), durum: (["cevrimici", "mesgul", "cevrimdisi"] as const).includes(t.durum as TemsilciDurum) ? (t.durum as TemsilciDurum) : "cevrimici",
    ajanlar: (Array.isArray(t.ajanlar) ? t.ajanlar : []).filter((a): a is string => typeof a === "string" && /^[A-Za-z0-9_-]{10}$/.test(a)).slice(0, 50),
    kanallar: (Array.isArray(t.kanallar) ? t.kanallar : []).filter((a): a is string => typeof a === "string" && /^[a-z]{2,12}$/.test(a)).slice(0, 20),
    ...(t.eposta && /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(t.eposta) ? { eposta: t.eposta.toLowerCase().slice(0, 120) } : {}),
    ...(t.sonGorulme ? { sonGorulme: Number(t.sonGorulme) } : {}),
  };
}
export const varsayilanTakvim = (): SlaTakvim => ({ acik: false, saatDilimi: "Europe/Istanbul", gunler: [null, ...Array.from({ length: 5 }, () => ({ bas: "09:00", bit: "18:00" })), null], tatiller: [] });
const SAAT = /^([01]\d|2[0-3]):[0-5]\d$|^24:00$/;
export function saatDilimiGecerli(tz: string): boolean { try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return true; } catch { return false; } }
export function takvimTemizle(x: unknown): SlaTakvim {
  const v = varsayilanTakvim(), t = (x ?? {}) as Partial<SlaTakvim>;
  const tz = s(t.saatDilimi, 60).trim();
  const gunler = Array.from({ length: 7 }, (_, i) => {
    const g = Array.isArray(t.gunler) ? t.gunler[i] : v.gunler[i];
    if (!g || !SAAT.test(String(g.bas)) || !SAAT.test(String(g.bit)) || dk(g.bit) <= dk(g.bas)) return null;
    return { bas: g.bas, bit: g.bit };
  });
  const tatiller = (Array.isArray(t.tatiller) ? t.tatiller : []).filter((h) => h && /^\d{4}-\d{2}-\d{2}$/.test(String(h.tarih))).slice(0, 120).map((h) => ({ tarih: String(h.tarih), ad: s(h.ad, 60).trim() || "Tatil" }));
  return { acik: t.acik === true, saatDilimi: tz && saatDilimiGecerli(tz) ? tz : v.saatDilimi, gunler, tatiller: [...new Map(tatiller.map((h) => [h.tarih, h])).values()].sort((a, b) => a.tarih.localeCompare(b.tarih)) };
}
export function slaTemizle(x: unknown): SlaPolitika {
  const v = varsayilanSla(), p = (x ?? {}) as Partial<SlaPolitika>;
  const bildirim = s(p.bildirim, 500).trim();
  return {
    ...(p.takvim ? { takvim: takvimTemizle(p.takvim) } : {}),
    acik: p.acik === true, ilkYanit: Math.round(sayiAralik(p.ilkYanit, 1, 10080, v.ilkYanit)), sonrakiYanit: Math.round(sayiAralik(p.sonrakiYanit, 1, 10080, v.sonrakiYanit)), cozum: sayiAralik(p.cozum, 1, 720, v.cozum),
    uyariYuzde: Math.round(sayiAralik(p.uyariYuzde, 30, 95, v.uyariYuzde)),
    carpan: { acil: sayiAralik(p.carpan?.acil, 0.05, 5, v.carpan.acil), yuksek: sayiAralik(p.carpan?.yuksek, 0.05, 5, v.carpan.yuksek), normal: 1, dusuk: sayiAralik(p.carpan?.dusuk, 0.05, 10, v.carpan.dusuk) },
    ...(/^https:\/\/\S{8,490}$/.test(bildirim) ? { bildirim } : {}),
  };
}
export function gorunumTemizle(x: unknown): Gorunum {
  const g = (x ?? {}) as Partial<Gorunum>, f = (g.suzgec ?? {}) as GorunumSuzgec;
  return { id: kim(g.id), ad: s(g.ad, 40).trim() || "Görünüm", ...(typeof g.sahip === "string" && /^[A-Za-z0-9_-]{2,20}$/.test(g.sahip) ? { sahip: g.sahip } : {}), suzgec: { sekme: s(f.sekme, 12), ajan: s(f.ajan, 10), kanal: s(f.kanal, 12), etiket: s(f.etiket, 40), atanan: s(f.atanan, 20), oncelik: (["acil", "yuksek", "normal", "dusuk"] as const).includes(f.oncelik as Oncelik) ? f.oncelik : "", sla: f.sla === "asildi" || f.sla === "yaklasiyor" ? f.sla : "", ara: s(f.ara, 80) } };
}

/* ───────────── Mesai takvimi ───────────── */
const dk = (h: string) => { const [a, b] = h.split(":").map(Number); return (a || 0) * 60 + (b || 0); };
const BICIM = new Map<string, Intl.DateTimeFormat>();
const HAFTA: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
/** Zamanın takvim saat dilimindeki günü, haftanın günü ve gün içi dakikası (saniye kesirli). */
function yerel(t: number, tz: string): { tarih: string; hafta: number; dakika: number } {
  let f = BICIM.get(tz);
  if (!f) { f = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23" }); BICIM.set(tz, f); }
  const p: Record<string, string> = {};
  for (const x of f.formatToParts(new Date(t))) p[x.type] = x.value;
  return { tarih: `${p.year}-${p.month}-${p.day}`, hafta: HAFTA[p.weekday] ?? 0, dakika: (Number(p.hour) % 24) * 60 + Number(p.minute) + (t % 60_000) / 60_000 };
}
/** O günün açık mesai aralığı: [başlangıç, bitiş] dakika ya da kapalıysa null. */
function gunAraligi(y: { tarih: string; hafta: number }, k: SlaTakvim): [number, number] | null {
  if (k.tatiller.some((h) => h.tarih === y.tarih)) return null;
  const g = k.gunler[y.hafta];
  return g ? [dk(g.bas), dk(g.bit)] : null;
}
/** Şu an mesai içinde mi? Takvim kapalıysa her zaman içinde. */
export function mesaiIcinde(k: SlaTakvim | undefined, t = Date.now()): boolean {
  if (!k?.acik) return true;
  const y = yerel(t, k.saatDilimi), a = gunAraligi(y, k);
  return !!a && y.dakika >= a[0] && y.dakika < a[1];
}
/** bas anından itibaren sureMs kadar MESAİ süresi geçince ulaşılan takvim zamanı. */
export function mesaiEkle(bas: number, sureMs: number, k: SlaTakvim | undefined): number {
  if (!k?.acik || !k.gunler.some(Boolean)) return bas + sureMs;
  let t = bas, kalan = sureMs;
  for (let i = 0; i < 1200 && kalan > 0; i++) {
    const y = yerel(t, k.saatDilimi), a = gunAraligi(y, k);
    if (!a || y.dakika >= a[1]) { t += Math.max(1, 1440 - y.dakika) * 60_000; continue; }
    if (y.dakika < a[0]) { t += (a[0] - y.dakika) * 60_000; continue; }
    const acik = (a[1] - y.dakika) * 60_000;
    if (kalan <= acik) return t + kalan;
    kalan -= acik; t += acik;
  }
  return t + kalan;
}
/** İki an arasındaki mesai süresi (ms). */
export function mesaiSuresi(a: number, b: number, k: SlaTakvim | undefined): number {
  if (b <= a) return -mesaiSuresi(b, a, k);
  if (!k?.acik || !k.gunler.some(Boolean)) return b - a;
  let t = a, top = 0;
  for (let i = 0; i < 1200 && t < b; i++) {
    const y = yerel(t, k.saatDilimi), r = gunAraligi(y, k);
    if (!r || y.dakika >= r[1]) { t = Math.min(b, t + Math.max(1, 1440 - y.dakika) * 60_000); continue; }
    if (y.dakika < r[0]) { t = Math.min(b, t + (r[0] - y.dakika) * 60_000); continue; }
    const son = Math.min(b, t + (r[1] - y.dakika) * 60_000);
    top += son - t; t = son;
  }
  return top;
}

/* ───────────── SLA ───────────── */
/** kalan: mesai takvimi açıksa kalan mesai süresi (ms). duraklatildi: şu an mesai dışında, saat işlemiyor. */
export type SlaHedef = { ad: string; bitis: number; kalan: number; durum: "yolunda" | "yaklasiyor" | "asildi"; duraklatildi?: boolean };
export type SlaDurum = { durum: "yok" | "yolunda" | "yaklasiyor" | "asildi"; hedefler: SlaHedef[]; en?: SlaHedef; mesaiDisi?: boolean };
type SlaGirdi = Pick<KonusmaOzet, "durum" | "devir" | "ilkYanit" | "bekleyenZiyaretci" | "oncelik">;
export function slaHesapla(k: SlaGirdi, p: SlaPolitika, simdi = Date.now()): SlaDurum {
  if (!p.acik || !k.devir || k.durum === "acik" || k.durum === "cozuldu") return { durum: "yok", hedefler: [] };
  const c = p.carpan[k.oncelik ?? "normal"] ?? 1;
  const h: SlaHedef[] = [];
  const tk = p.takvim?.acik ? p.takvim : undefined;
  const disarida = !mesaiIcinde(tk, simdi);
  // Mesai takvimi açıksa süre yalnız çalışma saatlerinde işler: bitişe mesai süresi eklenir, kalan mesai süresidir.
  const ekle = (ad: string, bas: number, sureMs: number) => {
    const bitis = mesaiEkle(bas, sureMs * c, tk), kalan = simdi < bitis ? mesaiSuresi(simdi, bitis, tk) : bitis - simdi;
    h.push({ ad, bitis, kalan, durum: kalan < 0 ? "asildi" : kalan < sureMs * c * (1 - p.uyariYuzde / 100) ? "yaklasiyor" : "yolunda", ...(disarida && kalan >= 0 ? { duraklatildi: true } : {}) });
  };
  if (k.ilkYanit === undefined) ekle("İlk yanıt", k.devir.zaman, p.ilkYanit * 60_000);
  else if (k.bekleyenZiyaretci) ekle("Sonraki yanıt", k.bekleyenZiyaretci, p.sonrakiYanit * 60_000);
  ekle("Çözüm", k.devir.zaman, p.cozum * 3600_000);
  const en = [...h].sort((a, b) => a.kalan - b.kalan)[0];
  return { durum: h.some((x) => x.durum === "asildi") ? "asildi" : h.some((x) => x.durum === "yaklasiyor") ? "yaklasiyor" : "yolunda", hedefler: h, en, ...(disarida ? { mesaiDisi: true } : {}) };
}

/* ───────────── Atama ───────────── */
/** Uygun temsilciyi seçer: rol izleyici değil, (istenirse) çevrimiçi, ajan ve kanal kapsamında, kapasitesi dolmamış. */
export function temsilciSec(ekip: Temsilci[], a: AtamaAyar, yuk: Record<string, number>, k: { ajanId: string; kanal: string }): Temsilci | null {
  const aday = ekip.filter((t) => t.rol !== "izleyici" && (!a.yalnizCevrimici || t.durum === "cevrimici") && (!t.ajanlar.length || t.ajanlar.includes(k.ajanId)) && (!t.kanallar.length || t.kanallar.includes(k.kanal)) && (yuk[t.id] ?? 0) < t.kapasite);
  if (!aday.length) return null;
  if (a.yontem === "enAz") return [...aday].sort((x, y) => (yuk[x.id] ?? 0) / x.kapasite - (yuk[y.id] ?? 0) / y.kapasite)[0];
  const i = ekip.findIndex((t) => t.id === a.son);
  for (let j = 1; j <= ekip.length; j++) { const t = ekip[(i + j + ekip.length) % ekip.length]; if (aday.includes(t)) return t; }
  return aday[0];
}
export const acikMi = (k: Pick<ZiyaretciKonusma, "durum">) => k.durum === "devredildi" || k.durum === "insan";

/** SLA aşım bildirimi (Slack gelen web kancası ya da herhangi bir HTTPS adresi): yalnız guvenliFetch ile. */
export async function slaBildir(adres: string, metin: string, veri: Record<string, unknown>): Promise<string | null> {
  try {
    const r = await guvenliFetch(adres, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: metin, ...veri }), signal: AbortSignal.timeout(8000) }, { yalnizHttps: true });
    return r.ok ? null : `Bildirim adresi ${r.status} döndü.`;
  } catch (e) { return (e as Error).message.slice(0, 200); }
}
