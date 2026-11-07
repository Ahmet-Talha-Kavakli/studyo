import "server-only";
import { randomBytes } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { guvenliFetch } from "@/lib/guvenliAg";
import { epostaGonder, epostaKurulu } from "./bulutEposta";
import { sahipOzeti } from "./depo";
import { vapidBasligi, vapidGecerli, yukSifrele, type VapidCifti } from "./bildirimSifre";

/**
 * Vayra Build bildirim merkezi (sahip başına): uygulama içi bildirimler, tarayıcı push abonelikleri ve kanal
 * tercihleri. Bir bildirim her zaman uygulama içine yazılır; tercihe göre push (Web Push + VAPID) ve e-posta
 * (Resend) da gönderilir. Kanal kurulu değilse gönderilmiş gibi davranılmaz: bildirimin kanal durumunda "kurulu
 * değil" yazar. Dosya: .veri/build/bildirim/<sahip özeti>.json
 */
export type BildirimTur = "izleme" | "gorev" | "yorum" | "davet" | "dokum" | "sistem";
export const BILDIRIM_TURLERI: { id: BildirimTur; ad: string; alt: string }[] = [
  { id: "izleme", ad: "İzleme", alt: "İzlediğin koşul gerçekleşince" },
  { id: "gorev", ad: "Zamanlanmış görevler", alt: "Görev çalışıp sonucu sohbete düşünce" },
  { id: "yorum", ad: "Yorumlar", alt: "Paylaştığın sohbete biri yorum yazınca" },
  { id: "davet", ad: "Davetler", alt: "Biri seni bir sohbete ya da klasöre davet edince" },
  { id: "dokum", ad: "Ses dökümleri", alt: "Kayıt metne dökülüp özetlenince" },
  { id: "sistem", ad: "Vayra", alt: "Hesap ve hizmet duyuruları" },
];
export type KanalDurumu = "gonderildi" | "kapali" | "kurulu-degil" | "hata" | "abonelik-yok" | "sessiz";
export type Bildirim = {
  id: string; tur: BildirimTur; baslik: string; metin: string; adres?: string; zaman: number; okundu?: boolean;
  /** Bildirimi doğuran kayıt (izleme, sohbet, döküm...): aynı kaynaktan gelenler gruplanır. */
  kaynak?: { tur: string; id: string; ad?: string };
  kanallar?: { push?: KanalDurumu; eposta?: KanalDurumu };
};
export type PushAboneligi = { endpoint: string; p256dh: string; auth: string; ekleme: number; cihaz: string; sonBasari?: number; sonHata?: string };
export type TurTercihi = { push: boolean; eposta: boolean };
export type BildirimAyari = {
  eposta: string;
  turler: Record<BildirimTur, TurTercihi>;
  /** Sessiz saatler (Türkiye saati): bu aralıkta push ve e-posta gönderilmez, bildirim uygulamada kalır. */
  sessiz: { acik: boolean; bas: string; bit: string };
};
type Kayit = { bildirimler: Bildirim[]; abonelikler: PushAboneligi[]; ayar: BildirimAyari };

const VARSAYILAN_AYAR: BildirimAyari = {
  eposta: "",
  turler: { izleme: { push: true, eposta: true }, gorev: { push: true, eposta: false }, yorum: { push: true, eposta: true }, davet: { push: true, eposta: true }, dokum: { push: true, eposta: false }, sistem: { push: false, eposta: false } },
  sessiz: { acik: false, bas: "23:00", bit: "08:00" },
};
const SINIR = 300;
const dosya = (oz: string) => path.join(DEPO_KOK, "build", "bildirim", `${oz}.json`);
const OZ = /^[a-f0-9]{40}$/;
const kilitler = new Map<string, Promise<unknown>>();

async function oku(oz: string): Promise<Kayit> {
  try {
    const v = JSON.parse(await readFile(dosya(oz), "utf8")) as Partial<Kayit>;
    const ayar = { ...VARSAYILAN_AYAR, ...(v.ayar ?? {}) };
    ayar.turler = { ...VARSAYILAN_AYAR.turler, ...(v.ayar?.turler ?? {}) };
    ayar.sessiz = { ...VARSAYILAN_AYAR.sessiz, ...(v.ayar?.sessiz ?? {}) };
    return { bildirimler: v.bildirimler ?? [], abonelikler: v.abonelikler ?? [], ayar };
  } catch { return { bildirimler: [], abonelikler: [], ayar: structuredClone(VARSAYILAN_AYAR) }; }
}
function degistir<T>(oz: string, f: (k: Kayit) => T | Promise<T>): Promise<T> {
  if (!OZ.test(oz)) return Promise.reject(new Error("Geçersiz sahip."));
  const once = kilitler.get(oz) ?? Promise.resolve();
  const is = once.then(async () => {
    const k = await oku(oz);
    const r = await f(k);
    k.bildirimler = k.bildirimler.slice(0, SINIR);
    await mkdir(path.dirname(dosya(oz)), { recursive: true });
    await writeFile(dosya(oz), JSON.stringify(k));
    return r;
  });
  kilitler.set(oz, is.catch(() => {}));
  return is;
}

/* ───────────── Kanalların kurulumu ───────────── */
/** VAPID çifti ortamdan (VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY, isteğe bağlı VAPID_SUBJECT). */
export function vapidCifti(): VapidCifti | null {
  const genel = (process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "").trim(), ozel = (process.env.VAPID_PRIVATE_KEY || "").trim();
  return vapidGecerli({ genel, ozel }) ? { genel, ozel } : null;
}
export type KanalKurulumu = { push: { kurulu: boolean; genel?: string; neden?: string }; eposta: { kurulu: boolean; gonderen?: string; neden?: string } };
export function kanalKurulumu(): KanalKurulumu {
  const v = vapidCifti();
  const ham = !!(process.env.VAPID_PUBLIC_KEY || process.env.VAPID_PRIVATE_KEY);
  const gonderen = process.env.BUILD_EPOSTA_GONDEREN || process.env.RESEND_FROM;
  return {
    push: v ? { kurulu: true, genel: v.genel } : { kurulu: false, neden: ham ? "VAPID anahtarları hatalı: genel ve özel anahtar eşleşmiyor ya da biçimi bozuk." : "Sunucuda VAPID anahtarları tanımlı değil." },
    eposta: epostaKurulu() ? { kurulu: true, gonderen: gonderen || "onboarding@resend.dev" } : { kurulu: false, neden: "Sunucuda RESEND_API_KEY tanımlı değil." },
  };
}

/** Push hizmeti adresleri yalnız bilinen tarayıcı push sunucuları olabilir (sunucudan rastgele adrese istek atılmasın). */
const PUSH_SUNUCULARI = [/^fcm\.googleapis\.com$/, /^android\.googleapis\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)notify\.windows\.com$/, /^web\.push\.apple\.com$/, /(^|\.)push\.apple\.com$/];
export function pushAdresiGecerli(endpoint: string): boolean {
  try { const u = new URL(endpoint); return u.protocol === "https:" && PUSH_SUNUCULARI.some((r) => r.test(u.hostname)); } catch { return false; }
}

const saatDakika = (s: string) => { const m = /^(\d{2}):(\d{2})$/.exec(s); return m ? Number(m[1]) * 60 + Number(m[2]) : -1; };
function sessizMi(a: BildirimAyari, simdi = Date.now()): boolean {
  if (!a.sessiz.acik) return false;
  const d = new Date(simdi + 3 * 3600_000), dk = d.getUTCHours() * 60 + d.getUTCMinutes();
  const b = saatDakika(a.sessiz.bas), e = saatDakika(a.sessiz.bit);
  if (b < 0 || e < 0 || b === e) return false;
  return b < e ? dk >= b && dk < e : dk >= b || dk < e;
}

/** Tek aboneliğe push gönderir. 404/410: abonelik ölmüş (silinmeli). */
async function pushGonder(a: PushAboneligi, yuk: Record<string, unknown>, v: VapidCifti): Promise<"ok" | "olu" | string> {
  if (!pushAdresiGecerli(a.endpoint)) return "olu";
  try {
    const govde = yukSifrele(Buffer.from(JSON.stringify(yuk)), a.p256dh, a.auth);
    const konu = process.env.VAPID_SUBJECT || `mailto:${process.env.VAYRA_DESTEK_EPOSTA || "destek@vayra.app"}`;
    const r = await guvenliFetch(a.endpoint, {
      method: "POST", body: new Uint8Array(govde),
      headers: { Authorization: vapidBasligi(a.endpoint, v, konu), "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", TTL: "86400", Urgency: "normal" },
      signal: AbortSignal.timeout(10_000),
    }, { yalnizHttps: true });
    if (r.status === 404 || r.status === 410) return "olu";
    if (r.status >= 200 && r.status < 300) return "ok";
    const t = (await r.text().catch(() => "")).slice(0, 160);
    return `Push sunucusu ${r.status} döndürdü${t ? `: ${t}` : ""}`;
  } catch (e) { return (e as Error).message.slice(0, 160) || "Push gönderilemedi."; }
}

const kok = () => process.env.VAYRA_ANA_ALAN ? `https://${process.env.VAYRA_ANA_ALAN}` : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3100";

export type YeniBildirim = { tur: BildirimTur; baslik: string; metin: string; adres?: string; kaynak?: Bildirim["kaynak"]; /** Yalnız uygulama içi (deneme ve sessiz olaylar). */ yalnizUygulama?: boolean };

/**
 * Bildirim gönderir (sahip özetiyle; zamanlayıcılar ham anahtarı bilmez). Önce uygulama içine yazılır, sonra
 * tercihe göre push ve e-posta denenir; sonuç kanal durumu olarak bildirime işlenir.
 */
export async function bildirimOz(oz: string, b: YeniBildirim): Promise<Bildirim> {
  const yeni: Bildirim = {
    id: randomBytes(8).toString("base64url"), tur: b.tur, baslik: b.baslik.slice(0, 140), metin: b.metin.slice(0, 1200), zaman: Date.now(),
    ...(b.adres && /^\/[^/]/.test(b.adres) ? { adres: b.adres.slice(0, 300) } : {}), ...(b.kaynak ? { kaynak: { tur: b.kaynak.tur.slice(0, 20), id: b.kaynak.id.slice(0, 60), ...(b.kaynak.ad ? { ad: b.kaynak.ad.slice(0, 80) } : {}) } } : {}),
  };
  const { ayar, abonelikler } = await degistir(oz, (k) => { k.bildirimler.unshift(yeni); return { ayar: k.ayar, abonelikler: [...k.abonelikler] }; });
  if (b.yalnizUygulama) return yeni;
  const tercih = ayar.turler[b.tur] ?? { push: false, eposta: false };
  const sessiz = sessizMi(ayar);
  const kanallar: NonNullable<Bildirim["kanallar"]> = {};
  // Push
  const v = vapidCifti();
  if (!tercih.push) kanallar.push = "kapali";
  else if (!v) kanallar.push = "kurulu-degil";
  else if (!abonelikler.length) kanallar.push = "abonelik-yok";
  else if (sessiz) kanallar.push = "sessiz";
  else {
    const yuk = { baslik: yeni.baslik, metin: yeni.metin, adres: yeni.adres ?? "/panel/build/sohbet", etiket: yeni.kaynak ? `${yeni.kaynak.tur}-${yeni.kaynak.id}` : yeni.id, id: yeni.id };
    const sonuc = await Promise.all(abonelikler.map((a) => pushGonder(a, yuk, v)));
    kanallar.push = sonuc.some((x) => x === "ok") ? "gonderildi" : "hata";
    await degistir(oz, (k) => {
      k.abonelikler = k.abonelikler.filter((a) => { const i = abonelikler.findIndex((x) => x.endpoint === a.endpoint); return i < 0 || sonuc[i] !== "olu"; }).map((a) => {
        const i = abonelikler.findIndex((x) => x.endpoint === a.endpoint);
        if (i < 0) return a;
        return sonuc[i] === "ok" ? { ...a, sonBasari: Date.now(), sonHata: undefined } : { ...a, sonHata: sonuc[i] };
      });
    });
  }
  // E-posta
  if (!tercih.eposta) kanallar.eposta = "kapali";
  else if (!ayar.eposta) kanallar.eposta = "abonelik-yok";
  else if (!epostaKurulu()) kanallar.eposta = "kurulu-degil";
  else if (sessiz) kanallar.eposta = "sessiz";
  else {
    const r = await epostaGonder({ kime: ayar.eposta, konu: `Vayra: ${yeni.baslik}`, metin: yeni.metin, ...(yeni.adres ? { dugme: { ad: "Vayra'da aç", adres: `${kok()}${yeni.adres}` } } : {}) });
    kanallar.eposta = r.ok ? "gonderildi" : "hata";
  }
  await degistir(oz, (k) => { const x = k.bildirimler.find((y) => y.id === yeni.id); if (x) x.kanallar = kanallar; });
  return { ...yeni, kanallar };
}
export const bildirimGonder = (sahip: string, b: YeniBildirim) => bildirimOz(sahipOzeti(sahip), b);

/* ───────────── Sahibin işlemleri ───────────── */
export async function bildirimleriGetir(sahip: string) {
  const k = await oku(sahipOzeti(sahip));
  return { bildirimler: k.bildirimler, okunmamis: k.bildirimler.filter((b) => !b.okundu).length, ayar: k.ayar, abonelikler: k.abonelikler.map((a) => ({ endpoint: a.endpoint, cihaz: a.cihaz, ekleme: a.ekleme, sonBasari: a.sonBasari, sonHata: a.sonHata })) };
}
export async function okunmamisSayisi(sahip: string): Promise<number> {
  return (await oku(sahipOzeti(sahip))).bildirimler.filter((b) => !b.okundu).length;
}
/** Okundu işaretle: id verilmezse hepsi; okundu false ise okunmadı yapar. */
export function okunduYap(sahip: string, id?: string, okundu = true) {
  return degistir(sahipOzeti(sahip), (k) => { for (const b of k.bildirimler) if (!id || b.id === id) b.okundu = okundu || undefined; });
}
export function bildirimSil(sahip: string, id?: string) {
  return degistir(sahipOzeti(sahip), (k) => { k.bildirimler = id ? k.bildirimler.filter((b) => b.id !== id) : k.bildirimler.filter((b) => !b.okundu); });
}

const SAAT = /^\d{2}:\d{2}$/;
const EPOSTA = /^[^\s@<>()",;:]{1,64}@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;
export function ayarGuncelle(sahip: string, g: { eposta?: unknown; turler?: unknown; sessiz?: unknown }): Promise<BildirimAyari | { hata: string }> {
  return degistir(sahipOzeti(sahip), (k) => {
    if (typeof g.eposta === "string") {
      const e = g.eposta.trim().toLowerCase();
      if (e && !EPOSTA.test(e)) return { hata: "Geçerli bir e-posta adresi yaz." };
      k.ayar.eposta = e.slice(0, 200);
    }
    if (g.turler && typeof g.turler === "object") {
      for (const t of BILDIRIM_TURLERI) {
        const x = (g.turler as Record<string, Partial<TurTercihi>>)[t.id];
        if (!x || typeof x !== "object") continue;
        k.ayar.turler[t.id] = { push: typeof x.push === "boolean" ? x.push : k.ayar.turler[t.id].push, eposta: typeof x.eposta === "boolean" ? x.eposta : k.ayar.turler[t.id].eposta };
      }
    }
    if (g.sessiz && typeof g.sessiz === "object") {
      const s = g.sessiz as Partial<BildirimAyari["sessiz"]>;
      k.ayar.sessiz = { acik: typeof s.acik === "boolean" ? s.acik : k.ayar.sessiz.acik, bas: typeof s.bas === "string" && SAAT.test(s.bas) ? s.bas : k.ayar.sessiz.bas, bit: typeof s.bit === "string" && SAAT.test(s.bit) ? s.bit : k.ayar.sessiz.bit };
    }
    return k.ayar;
  });
}

export function abonelikEkle(sahip: string, a: { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } }, cihaz: string): Promise<{ ok: true } | { hata: string }> {
  const endpoint = typeof a.endpoint === "string" ? a.endpoint.trim() : "";
  const p256dh = typeof a.keys?.p256dh === "string" ? a.keys.p256dh : "", auth = typeof a.keys?.auth === "string" ? a.keys.auth : "";
  if (!pushAdresiGecerli(endpoint)) return Promise.resolve({ hata: "Bu tarayıcının push adresi tanınmadı." });
  if (!/^[A-Za-z0-9_-]{80,100}$/.test(p256dh) || !/^[A-Za-z0-9_-]{16,32}$/.test(auth)) return Promise.resolve({ hata: "Abonelik anahtarları geçersiz." });
  return degistir(sahipOzeti(sahip), (k) => {
    k.abonelikler = [{ endpoint, p256dh, auth, ekleme: Date.now(), cihaz: cihaz.slice(0, 80) }, ...k.abonelikler.filter((x) => x.endpoint !== endpoint)].slice(0, 10);
    return { ok: true as const };
  });
}
export function abonelikSil(sahip: string, endpoint?: string) {
  return degistir(sahipOzeti(sahip), (k) => { k.abonelikler = endpoint ? k.abonelikler.filter((x) => x.endpoint !== endpoint) : []; });
}

/** User-Agent'tan kısa cihaz adı ("Chrome · Windows"). */
export function cihazAdi(ua: string): string {
  const t = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Tarayıcı";
  const i = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  return i ? `${t} · ${i}` : t;
}
