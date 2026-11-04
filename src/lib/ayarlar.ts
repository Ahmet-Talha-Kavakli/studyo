/* Ayar sayfalarının ortak yardımcıları (genel bakış ve bölümler aynı hesabı kullanır). */
import type { HesapKaydi, OlayTur } from "@/store/useHesap";

export const tarih = (t: number) => new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

/** "3 dk önce", "2 gün önce" … */
export function goreli(t: number, simdi = Date.now()) {
  const s = Math.max(0, Math.round((simdi - t) / 1000));
  if (s < 60) return "az önce";
  const dk = Math.round(s / 60); if (dk < 60) return `${dk} dk önce`;
  const sa = Math.round(dk / 60); if (sa < 24) return `${sa} sa önce`;
  const g = Math.round(sa / 24); if (g < 30) return `${g} gün önce`;
  return tarih(t);
}

/** Başlangıçtan itibaren dönem adımlarıyla ilerleyip şu andan sonraki ilk yenileme anı. */
export function sonrakiYenileme(baslangic: number, donem: "aylik" | "yillik", simdi = Date.now()) {
  const d = new Date(baslangic);
  const adim = donem === "yillik" ? 12 : 1;
  let i = 1;
  for (;;) {
    const t = new Date(d.getFullYear(), d.getMonth() + adim * i, Math.min(d.getDate(), 28), d.getHours(), d.getMinutes()).getTime();
    if (t > simdi) return t;
    i++;
  }
}

export const OLAY_AD: Record<OlayTur, string> = {
  giris: "Giriş yapıldı", "giris-hatali": "Hatalı giriş denemesi", cikis: "Çıkış yapıldı", kayit: "Hesap oluşturuldu",
  sifre: "Şifre güncellendi", "2fa-ac": "İki adımlı doğrulama açıldı", "2fa-kapat": "İki adımlı doğrulama kapatıldı",
  "yedek-kod": "Yedek kodla giriş", "yedek-yenile": "Yedek kodlar yenilendi", eposta: "E-posta değiştirildi",
  "oturum-kapat": "Oturum kapatıldı", "veri-indir": "Veriler indirildi",
};

/** Hesap güvenliği adımları — genel bakış ve güvenlik sayfası aynı puanı gösterir. */
export function guvenlikAdimlari(k: HesapKaydi | undefined) {
  const yedekKalan = k?.ikiAdim?.yedekler.filter((y) => !y.kullanildi).length ?? 0;
  return [
    { id: "sifre", ad: k?.saglayici && !k.sifre ? "Sosyal girişle korunuyor" : "Şifre belirlendi", tamam: !!k?.sifre || !!k?.saglayici, href: "/panel/ayarlar/guvenlik#sifre" },
    { id: "2fa", ad: "İki adımlı doğrulama açık", tamam: !!k?.ikiAdim?.aktif, href: "/panel/ayarlar/guvenlik#iki-adim" },
    { id: "yedek", ad: "Yedek kodlar hazır", tamam: !!k?.ikiAdim?.aktif && yedekKalan >= 3, href: "/panel/ayarlar/guvenlik#iki-adim" },
    { id: "oturum", ad: "Oturumlar gözden geçirildi", tamam: (k?.oturumlar.length ?? 0) <= 3, href: "/panel/ayarlar/guvenlik#oturumlar" },
  ];
}
