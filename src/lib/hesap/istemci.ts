/**
 * Hesap API'sinin tarayıcı tarafı. Hiçbir çağrı hata fırlatmaz: { ok: true, ... } ya da { ok: false, hata, durum, kod? }.
 * Oturum httpOnly çerezde; JavaScript belirteci görmez.
 */
import type {
  BenYaniti, EpostaSonucu, GuvenlikOlayiBilgisi, HesapOzeti, KrediHareketi, KrediOzeti, KullaniciVerisi, OturumBilgisi, SaglayiciKimligi, SunucuDurumu,
} from "./tipler";

export type Hata = { ok: false; hata: string; durum: number; kod?: string; alan?: string; bekle?: number; bakiye?: number; sunucu?: SunucuDurumu };
export type Sonuc<T> = ({ ok: true } & T) | Hata;

export async function hesapIstek<T = Record<string, unknown>>(yol: string, g: { method?: string; govde?: unknown; keepalive?: boolean; signal?: AbortSignal } = {}): Promise<Sonuc<T>> {
  const govdeVar = g.govde !== undefined;
  try {
    const r = await fetch(yol, {
      method: g.method ?? (govdeVar ? "POST" : "GET"),
      headers: govdeVar ? { "Content-Type": "application/json" } : undefined,
      body: govdeVar ? JSON.stringify(g.govde) : undefined,
      credentials: "same-origin", cache: "no-store", keepalive: g.keepalive, signal: g.signal,
    });
    let v: Record<string, unknown> = {};
    try { v = await r.json(); } catch { /* boş yanıt */ }
    if (!r.ok || v.ok === false) return { ...v, ok: false, hata: typeof v.hata === "string" ? v.hata : `İstek başarısız (${r.status}).`, durum: r.status } as Hata;
    return { ...v, ok: true } as { ok: true } & T;
  } catch (e) {
    if ((e as Error).name === "AbortError") return { ok: false, hata: "İstek iptal edildi.", durum: 0, kod: "iptal" };
    return { ok: false, hata: "Sunucuya ulaşılamadı. Bağlantını kontrol et.", durum: 0, kod: "ag" };
  }
}

type Ben = Omit<BenYaniti, "ok">;

export const benGetir = () => hesapIstek<Ben>("/api/hesap/ben");
export const epostaKontrol = (email: string) => hesapIstek<{ adim: "sifre" | "kayit" | "sosyal"; saglayicilar?: SaglayiciKimligi[] }>("/api/hesap/kontrol", { govde: { email } });
export const girisIstek = (email: string, sifre: string) => hesapIstek<Ben & { ikiAdim?: false } | { ikiAdim: true; bekleyen: string }>("/api/hesap/giris", { govde: { email, sifre } });
export const kayitIstek = (ad: string, email: string, sifre: string) => hesapIstek<Ben & { dogrulama: EpostaSonucu }>("/api/hesap/kayit", { govde: { ad, email, sifre } });
export const ikiAdimGiris = (kod: string, bekleyen?: string) => hesapIstek<Ben>("/api/hesap/iki-adim/giris", { govde: { kod, ...(bekleyen ? { bekleyen } : {}) } });
export const cikisIstek = () => hesapIstek("/api/hesap/cikis", { govde: {}, keepalive: true });
export const profilYaz = (patch: Record<string, unknown>) => hesapIstek<{ kullanici: KullaniciVerisi }>("/api/hesap/profil", { method: "PATCH", govde: patch });
export const saglayicilarGetir = () => hesapIstek<{ sunucu: SunucuDurumu }>("/api/hesap/oauth");

export const sifirlamaIste = (email: string) => hesapIstek<{ mesaj: string; gelistirmeBaglantisi?: string }>("/api/hesap/sifirla", { govde: { email } });
export const sifirlamaKontrol = (belirtec: string) => hesapIstek<{ gecerli: true; email: string }>("/api/hesap/sifirla", { govde: { belirtec, kontrol: true } });
export const sifirla = (belirtec: string, yeni: string) => hesapIstek<{ email: string }>("/api/hesap/sifirla", { govde: { belirtec, yeni } });
export const dogrulamaKontrol = (belirtec: string) => hesapIstek<{ tur: "dogrula" | "eposta"; email: string }>("/api/hesap/dogrula", { govde: { belirtec, kontrol: true } });
export const dogrula = (belirtec: string) => hesapIstek<{ tur: "dogrula" | "eposta"; email: string }>("/api/hesap/dogrula", { govde: { belirtec } });
export const dogrulamaGonder = () => hesapIstek<{ dogrulama?: EpostaSonucu; zatenDogrulandi?: boolean }>("/api/hesap/dogrula", { govde: { islem: "gonder" } });
export const epostaDegistirIste = (yeni: string, sifre?: string) => hesapIstek<{ dogrulama: EpostaSonucu; bekleyenEposta: string }>("/api/hesap/eposta", { govde: { yeni, sifre } });

export const sifreDegistir = (g: { mevcut?: string; yeni: string; digerleriniKapat: boolean }) => hesapIstek<{ kapatilan: number; hesap: HesapOzeti | null; oturumlar: OturumBilgisi[] }>("/api/hesap/sifre", { govde: g });
export const ikiAdimKur = () => hesapIstek<{ sir: string; otpauth: string }>("/api/hesap/iki-adim", { govde: { islem: "kur" } });
export const ikiAdimAc = (kod: string) => hesapIstek<{ yedekKodlar: string[]; hesap: HesapOzeti }>("/api/hesap/iki-adim", { govde: { islem: "ac", kod } });
export const ikiAdimKapat = (kod: string) => hesapIstek<{ hesap: HesapOzeti | null }>("/api/hesap/iki-adim", { govde: { islem: "kapat", kod } });
export const yedekYenile = (kod: string) => hesapIstek<{ yedekKodlar: string[]; hesap: HesapOzeti | null }>("/api/hesap/iki-adim", { govde: { islem: "yedek-yenile", kod } });
export const oturumlarGetir = () => hesapIstek<{ oturumlar: OturumBilgisi[]; olaylar: GuvenlikOlayiBilgisi[] }>("/api/hesap/oturumlar");
export const oturumKapat = (id: string) => hesapIstek<{ kapatilan: number; oturumlar: OturumBilgisi[] }>("/api/hesap/oturumlar", { method: "DELETE", govde: { id } });
export const digerOturumlariKapat = () => hesapIstek<{ kapatilan: number; oturumlar: OturumBilgisi[] }>("/api/hesap/oturumlar", { method: "DELETE", govde: { digerleri: true } });
export const hesapSilIstek = (g: { onay: string; sifre?: string; kod?: string }) => hesapIstek<{ silindi: true }>("/api/hesap/sil", { govde: g });
export const saglayiciKaldir = (s: SaglayiciKimligi) => hesapIstek(`/api/hesap/oauth/${s}`, { method: "DELETE", govde: {} });
/** Sosyal giriş tam sayfa yönlendirmeyle başlar (sağlayıcının sayfasına gidilir). */
export const oauthAdresi = (s: SaglayiciKimligi, geri: string, bagla = false) => `/api/hesap/oauth/${s}?${new URLSearchParams({ geri, ...(bagla ? { bagla: "1" } : {}) })}`;

export const krediGetir = (adet = 50) => hesapIstek<{ ozet: KrediOzeti; hareketler: KrediHareketi[] }>(`/api/hesap/kredi?adet=${adet}`);
type KrediYaniti = { bakiye: number; ozet: KrediOzeti; tekrar: boolean };
export const krediHarcaIstek = (g: { miktar: number; anahtar: string; kaynak?: string; aciklama?: string }) => hesapIstek<KrediYaniti>("/api/hesap/kredi/harca", { govde: g });
export const krediIadeIstek = (g: { anahtar: string; kaynak?: string }) => hesapIstek<KrediYaniti & { miktar: number }>("/api/hesap/kredi/iade", { govde: g });
export const krediYukleIstek = (g: { miktar: number; anahtar: string; kaynak?: string; aciklama?: string }) => hesapIstek<KrediYaniti>("/api/hesap/kredi/yukle", { govde: g });

/** Tarayıcıda işlem anahtarı (idempotency): 24 rastgele bayt. */
export function islemAnahtari(on = "k"): string {
  const b = new Uint8Array(18);
  crypto.getRandomValues(b);
  return `${on}_${btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
}

/** OAuth ve sunucu hata kodlarının Türkçe açıklaması. */
export function oauthHataMetni(kod: string | null, s?: string | null): string | null {
  if (!kod) return null;
  const ad = s === "google" ? "Google" : s === "apple" ? "Apple" : s === "microsoft" ? "Microsoft" : "Sosyal";
  const m: Record<string, string> = {
    "kurulu-degil": `${ad} ile giriş bu sunucuda kurulu değil. E-postayla devam edebilirsin.`,
    iptal: `${ad} girişi iptal edildi.`,
    durum: "Giriş isteğinin süresi doldu ya da başka bir tarayıcıda başlatıldı. Yeniden dene.",
    dogrulanamadi: `${ad} hesabın doğrulanamadı. Yeniden dene.`,
    baglanamadi: `Bu e-postayla açılmış bir Vayra hesabı var. Şifrenle giriş yapıp Ayarlar, Giriş ve hesap bölümünden ${ad} hesabını bağla.`,
    "eposta-yok": `${ad} hesabın bir e-posta adresi paylaşmadı. E-postayla devam et.`,
    "baska-hesap": `Bu ${ad} hesabı başka bir Vayra hesabına bağlı.`,
    "hesap-yok": "Hesap bulunamadı.",
    hiz: "Çok fazla deneme yapıldı. Biraz sonra yeniden dene.",
  };
  return m[kod] ?? `${ad} girişi tamamlanamadı.`;
}
