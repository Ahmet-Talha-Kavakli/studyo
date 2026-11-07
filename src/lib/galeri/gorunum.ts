/**
 * Galeri görünüm ayarları — her sonuç ızgarası ve kitaplık için sayfa başına kalıcı.
 *
 *  yerlesim   özgün (kendi oranı, sütun akışı) · yatay (16:9 kartlar) · dikey (3:4 kartlar)
 *  boyut      kucuk · orta · buyuk · ozel (ozel: sütun sayısı elle)
 *  siralama   yeni · eski
 *  istemTemizle  gönderdikten sonra komut kutusunu boşalt
 *
 * Kayıt: localStorage "vayra-gorunum:<sayfa>". Okuma/yazma try/catch içinde; erişim yoksa
 * varsayılanla çalışır. Aynı sekmedeki bütün okuyucular "vayra-gorunum" olayıyla anında eşitlenir.
 */
export type Yerlesim = "ozgun" | "yatay" | "dikey";
export type KartBoyut = "kucuk" | "orta" | "buyuk" | "ozel";
export type GaleriSiralama = "yeni" | "eski";

export interface Gorunum {
  yerlesim: Yerlesim;
  boyut: KartBoyut;
  /** boyut "ozel" iken masaüstündeki sütun sayısı (2–8). */
  sutun: number;
  siralama: GaleriSiralama;
  istemTemizle: boolean;
}

export const VARSAYILAN_GORUNUM: Gorunum = { yerlesim: "ozgun", boyut: "orta", sutun: 5, siralama: "yeni", istemTemizle: false };

const anahtar = (sayfa: string) => `vayra-gorunum:${sayfa}`;
export const GORUNUM_OLAYI = "vayra-gorunum";

function temizle(h: Partial<Gorunum> | null | undefined, taban: Gorunum): Gorunum {
  const g = { ...taban, ...(h ?? {}) };
  return {
    yerlesim: (["ozgun", "yatay", "dikey"] as const).includes(g.yerlesim) ? g.yerlesim : taban.yerlesim,
    boyut: (["kucuk", "orta", "buyuk", "ozel"] as const).includes(g.boyut) ? g.boyut : taban.boyut,
    sutun: Math.min(8, Math.max(2, Math.round(Number(g.sutun) || taban.sutun))),
    siralama: g.siralama === "eski" ? "eski" : "yeni",
    istemTemizle: !!g.istemTemizle,
  };
}

export function gorunumOku(sayfa: string, taban: Partial<Gorunum> = {}): Gorunum {
  const t = { ...VARSAYILAN_GORUNUM, ...taban };
  if (typeof window === "undefined") return t;
  try {
    const ham = window.localStorage.getItem(anahtar(sayfa));
    return temizle(ham ? (JSON.parse(ham) as Partial<Gorunum>) : null, t);
  } catch {
    return t;
  }
}

export function gorunumYaz(sayfa: string, g: Gorunum) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(anahtar(sayfa), JSON.stringify(g)); } catch { /* depolama kapalı: bu oturumda bellekte kalır */ }
  try { window.dispatchEvent(new CustomEvent(GORUNUM_OLAYI, { detail: { sayfa, g } })); } catch { /* yoksay */ }
}

/** Komut kutusu gönderiminden sonra çağrılır: bu sayfada "istemi temizle" açık mı? */
export const istemTemizlensinMi = (sayfa: string) => gorunumOku(sayfa).istemTemizle;

/* ── Uygulayıcılar ── */

/** Kart genişliği hedefleri (px). Alan genişliğine bölünerek sütun sayısı bulunur. */
const HEDEF: Record<Exclude<KartBoyut, "ozel">, number> = { kucuk: 170, orta: 250, buyuk: 380 };

/** Alan genişliği ve görünüme göre sütun sayısı. Telefonda (640 altı) en fazla 3, büyükte 1. */
export function sutunSayisi(en: number, g: Pick<Gorunum, "boyut" | "sutun">, sinir: { en?: number; enCok?: number } = {}): number {
  const enAz = sinir.en ?? 1;
  const enCok = sinir.enCok ?? 10;
  if (en < 640) {
    const m = g.boyut === "kucuk" ? 3 : g.boyut === "buyuk" ? 1 : g.boyut === "ozel" ? Math.min(3, Math.max(1, Math.round(g.sutun / 2.5))) : 2;
    return Math.min(enCok, Math.max(enAz, m));
  }
  const n = g.boyut === "ozel" ? g.sutun : Math.round(en / HEDEF[g.boyut]);
  return Math.min(enCok, Math.max(Math.max(2, enAz), n));
}

/** Kart en-boy oranı: özgünde kendi oranı, yatayda 16:9, dikeyde 3:4. */
export function kartOrani(g: Pick<Gorunum, "yerlesim">, dogal: number): number {
  return g.yerlesim === "yatay" ? 16 / 9 : g.yerlesim === "dikey" ? 3 / 4 : dogal;
}

/** Oluşturma zamanına göre sırala (kopya döner). */
export function zamanaGoreSirala<T extends { olusturma: number }>(liste: T[], s: GaleriSiralama): T[] {
  return [...liste].sort((a, b) => (s === "eski" ? a.olusturma - b.olusturma : b.olusturma - a.olusturma));
}
