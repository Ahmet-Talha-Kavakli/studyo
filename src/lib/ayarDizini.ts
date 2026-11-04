/**
 * Ayarlar dizini: sol menüdeki sayfalar ve aramada bulunan tek tek ayarlar.
 * Arama sonucuna gidilince sayfa açılır, ilgili satır (`id`) kısa süre parlar.
 */
import type { LucideIcon } from "lucide-react";
import {
  UserRound, KeyRound, ShieldCheck, Wand2, Lock, HardDrive, CreditCard, Coins, ReceiptText, Gift, Palette, Bell, Code2, Database,
} from "lucide-react";

export type AyarSayfa = { id: string; ad: string; href: string; ikon: LucideIcon; ozet: string; rozet?: string };
export const AYAR_GRUPLARI: { ad: string; sayfalar: AyarSayfa[] }[] = [
  { ad: "Hesap", sayfalar: [
    { id: "hesap", ad: "Giriş ve hesap", href: "/panel/ayarlar/hesap", ikon: KeyRound, ozet: "E-posta, giriş yöntemleri, hesabı sil" },
    { id: "guvenlik", ad: "Güvenlik", href: "/panel/ayarlar/guvenlik", ikon: ShieldCheck, ozet: "Şifre, iki adımlı doğrulama, oturumlar" },
  ] },
  { ad: "Üretim", sayfalar: [
    { id: "uretim", ad: "Üretim varsayılanları", href: "/panel/ayarlar/uretim", ikon: Wand2, ozet: "Model, oran, adet, süre", rozet: "Yeni" },
    { id: "gizlilik", ad: "Gizlilik ve yayın", href: "/panel/ayarlar/gizlilik", ikon: Lock, ozet: "Görünürlük, remiks, hassas içerik" },
    { id: "depolama", ad: "Depolama", href: "/panel/ayarlar/depolama", ikon: HardDrive, ozet: "Alan, çöp kutusu, indirme" },
  ] },
  { ad: "Faturalama", sayfalar: [
    { id: "abonelik", ad: "Plan", href: "/panel/ayarlar/abonelik", ikon: CreditCard, ozet: "Plan, yenileme, iptal" },
    { id: "kullanim", ad: "Kredi ve kullanım", href: "/panel/ayarlar/kullanim", ikon: Coins, ozet: "Harcama, otomatik yükleme, uyarılar" },
    { id: "faturalar", ad: "Faturalar", href: "/panel/ayarlar/faturalar", ikon: ReceiptText, ozet: "Makbuzlar ve fatura bilgileri" },
    { id: "hediye", ad: "Kodlar ve hediyeler", href: "/panel/ayarlar/hediye", ikon: Gift, ozet: "Promosyon kodu, hediye kredisi" },
  ] },
  { ad: "Tercihler", sayfalar: [
    { id: "gorunum", ad: "Görünüm ve dil", href: "/panel/ayarlar/gorunum", ikon: Palette, ozet: "Vurgu rengi, hareket, dil, kısayollar" },
    { id: "bildirimler", ad: "Bildirimler", href: "/panel/ayarlar/bildirimler", ikon: Bell, ozet: "E-posta, tarayıcı, ses" },
  ] },
  { ad: "Geliştirici ve veri", sayfalar: [
    { id: "gelistirici", ad: "API ve bağlantılar", href: "/panel/ayarlar/gelistirici", ikon: Code2, ozet: "API anahtarları, MCP, bağlı uygulamalar" },
    { id: "veriler", ad: "Verilerim", href: "/panel/ayarlar/veriler", ikon: Database, ozet: "Verileri indir, çerezler, silme" },
  ] },
];
export const AYAR_SAYFALARI = AYAR_GRUPLARI.flatMap((g) => g.sayfalar);

/** Aramada bulunan tek tek ayarlar: [sayfa id, satır id, ad, ek anahtar kelimeler]. */
const S: [string, string, string, string?][] = [
  ["hesap", "eposta", "E-posta adresi", "mail değiştir"],
  ["hesap", "giris-yontemleri", "Giriş yöntemleri", "google apple microsoft sosyal"],
  ["hesap", "kimlik", "Hesap kimliği", "destek id"],
  ["hesap", "sil", "Hesabı sil", "kapat kaldır"],
  ["guvenlik", "sifre", "Şifre", "parola değiştir"],
  ["guvenlik", "iki-adim", "İki adımlı doğrulama", "2fa totp authenticator"],
  ["guvenlik", "yedek", "Yedek kodlar", "kurtarma"],
  ["guvenlik", "gecis-anahtari", "Geçiş anahtarı", "passkey parmak izi yüz"],
  ["guvenlik", "oturumlar", "Açık oturumlar", "cihaz tarayıcı çıkış"],
  ["guvenlik", "gecmis", "Güvenlik geçmişi", "giriş kayıtları"],
  ["uretim", "gorsel-model", "Varsayılan görsel modeli", "model"],
  ["uretim", "oran", "Varsayılan en-boy oranı", "16:9 9:16 kare"],
  ["uretim", "adet", "Bir seferde üretilecek görsel", "adet sayı"],
  ["uretim", "gelistir", "İstemi geliştir", "prompt iyileştir"],
  ["uretim", "video-model", "Varsayılan video modeli"],
  ["uretim", "sure", "Video süresi"],
  ["uretim", "cozunurluk", "Video çözünürlüğü", "1080p 4k"],
  ["uretim", "hatirla", "Son ayarları hatırla"],
  ["gizlilik", "gorunurluk", "Yeni üretimlerin görünürlüğü", "özel herkese açık yayınla keşfet"],
  ["gizlilik", "remiks", "Remiks izni", "istem paylaş"],
  ["gizlilik", "hassas", "Hassas içerik", "bulanıklaştır nsfw filtre"],
  ["gizlilik", "filigran", "Vayra filigranı", "logo"],
  ["gizlilik", "kimlik-bilgisi", "Yapay zekâ etiketi", "c2pa meta veri"],
  ["gizlilik", "egitim", "Model eğitimi", "veri kullanımı"],
  ["depolama", "alan", "Depolama alanı"],
  ["depolama", "cop", "Çöp kutusu süresi", "silinenler"],
  ["depolama", "indirme", "İndirme biçimi", "png jpg webp mp4"],
  ["depolama", "oto-indir", "Bitince otomatik indir"],
  ["abonelik", "plan", "Mevcut plan", "yükselt düşür"],
  ["abonelik", "donem", "Ödeme dönemi", "aylık yıllık"],
  ["abonelik", "iptal", "Aboneliği iptal et"],
  ["kullanim", "bakiye", "Kredi bakiyesi"],
  ["kullanim", "harcama", "Kredi harcaması", "grafik model"],
  ["kullanim", "oto-yukleme", "Otomatik kredi yükleme", "auto top up"],
  ["kullanim", "esik", "Düşük kredi uyarısı", "eşik"],
  ["abonelik", "hiz", "Üretim hızı ve eşzamanlı iş", "turbo öncelik kuyruk"],
  ["faturalar", "makbuzlar", "Makbuzlar", "fatura indir pdf"],
  ["faturalar", "bilgi", "Fatura bilgileri", "vkn tckn vergi dairesi adres e-fatura"],
  ["hediye", "kod", "Kod kullan", "promosyon kupon"],
  ["hediye", "gonder", "Hediye kredisi gönder"],
  ["gorunum", "vurgu", "Vurgu rengi", "renk tema"],
  ["gorunum", "hareket", "Hareket", "animasyon azalt"],
  ["gorunum", "dil", "Dil", "türkçe english"],
  ["gorunum", "saat-dilimi", "Saat dilimi"],
  ["gorunum", "tarih", "Tarih biçimi"],
  ["gorunum", "kisayollar", "Klavye kısayolları", "tuş"],
  ["bildirimler", "olaylar", "Bildirim türleri", "e-posta tarayıcı kanal"],
  ["bildirimler", "masaustu", "Tarayıcı bildirimleri", "masaüstü push"],
  ["bildirimler", "ses", "Bildirim sesi"],
  ["gelistirici", "anahtarlar", "API anahtarları", "token"],
  ["gelistirici", "mcp", "MCP bağlantıları", "claude cursor"],
  ["veriler", "indir", "Verilerimi indir", "json kvkk dışa aktar"],
  ["veriler", "cerezler", "Çerez tercihleri"],
  ["veriler", "yerel", "Bu tarayıcıdaki veriler", "önbellek temizle"],
];

export type AyarSonuc = { ad: string; href: string; sayfa: AyarSayfa; satir?: string };
const sade = (s: string) => s.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");

export function ayarAra(q: string): AyarSonuc[] {
  const t = sade(q.trim());
  if (!t) return [];
  const kelimeler = t.split(/\s+/);
  const uyar = (m: string) => kelimeler.every((k) => sade(m).includes(k));
  const sonuc: AyarSonuc[] = [];
  for (const p of AYAR_SAYFALARI) if (uyar(`${p.ad} ${p.ozet}`)) sonuc.push({ ad: p.ad, href: p.href, sayfa: p });
  for (const [sid, id, ad, ek] of S) {
    const p = AYAR_SAYFALARI.find((x) => x.id === sid)!;
    if (uyar(`${ad} ${ek ?? ""} ${p.ad}`)) sonuc.push({ ad, href: `${p.href}#${id}`, sayfa: p, satir: id });
  }
  return sonuc.slice(0, 12);
}
