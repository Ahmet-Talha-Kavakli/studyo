/**
 * Moderasyon & Destek verileri — inceleme kuyruğu, ihbarlar, blocklist, DMCA,
 * ihlal/yaptırım geçmişi + ticket, makro, SSS, destek metrikleri.
 */
import { prng, tohumla, tamsayi, sec, agirlikliSec, normal, BUGUN, GUN, SAAT } from "../cekirdek";
import { FLAG_SEBEP, TICKET_KATEGORI } from "../tablolar";
import type { AdminEvren } from "./index";

/* ── İnceleme kuyruğu ── */
export interface FlagOge {
  id: string;
  kullaniciId: string;
  kullanici: string;
  jobId: string;
  tur: string;
  prompt: string;
  sebep: string;
  guvenSkoru: number; // AI güven skoru
  ihbarSayisi: number;
  ihlalGecmisi: number;
  bekleme: number; // saat
  tarih: number;
}

export function inceleme(evren: AdminEvren): FlagOge[] {
  return Array.from({ length: 40 }, (_, i) => {
    const r = prng(tohumla(`flag-${i}`));
    const k = sec(r, evren.kullanicilar);
    return {
      id: `flag_${i}`,
      kullaniciId: k.id,
      kullanici: k.ad,
      jobId: `j_${(1000000 + tamsayi(r, 0, 42000)).toString(36)}`,
      tur: sec(r, ["video", "gorsel", "3d"]),
      prompt: sec(r, ["portre serisi", "moda editoryal", "ünlü benzeri karakter", "aksiyon sahnesi", "marka logolu ürün"]),
      sebep: sec(r, FLAG_SEBEP),
      guvenSkoru: +(0.5 + normal(r) * 0.5).toFixed(2),
      ihbarSayisi: agirlikliSec(r, [[0, 50], [1, 25], [2, 15], [3, 10]] as const),
      ihlalGecmisi: agirlikliSec(r, [[0, 60], [1, 25], [2, 10], [3, 5]] as const),
      bekleme: tamsayi(r, 1, 30),
      tarih: BUGUN - tamsayi(r, 1, 48) * SAAT,
    };
  }).sort((a, b) => b.guvenSkoru - a.guvenSkoru);
}

/* ── İhbarlar ── */
export interface Ihbar {
  id: string;
  ihbarEden: string;
  icerik: string;
  sebep: string;
  aciklama: string;
  cokluIhbar: number;
  tarih: number;
}

export function ihbarlar(evren: AdminEvren): Ihbar[] {
  return Array.from({ length: 18 }, (_, i) => {
    const r = prng(tohumla(`ihbar-${i}`));
    return {
      id: `rep_${i}`,
      ihbarEden: sec(r, evren.kullanicilar).ad,
      icerik: sec(r, ["Uygunsuz portre", "Telif ihlali", "Şiddet içeriği", "Spam içerik", "Yanıltıcı içerik"]),
      sebep: sec(r, ["NSFW", "Telif", "Şiddet", "Spam", "Taciz"]),
      aciklama: "Kullanıcı ihbar açıklaması...",
      cokluIhbar: agirlikliSec(r, [[1, 60], [2, 25], [4, 15]] as const),
      tarih: BUGUN - tamsayi(r, 1, 72) * SAAT,
    };
  }).sort((a, b) => b.cokluIhbar - a.cokluIhbar);
}

/* ── Blocklist ── */
export interface BlockKural {
  id: string;
  ifade: string;
  kategori: string;
  davranis: "engelle" | "uyar" | "flag";
  regex: boolean;
  eslesme: number;
}

export const BLOCKLIST: BlockKural[] = [
  { id: "b1", ifade: "ünlü isim listesi", kategori: "Ünlü", davranis: "engelle", regex: false, eslesme: 342 },
  { id: "b2", ifade: "marka/IP karakterleri", kategori: "Telif", davranis: "flag", regex: false, eslesme: 218 },
  { id: "b3", ifade: "nsfw kelime seti", kategori: "NSFW", davranis: "engelle", regex: false, eslesme: 1240 },
  { id: "b4", ifade: "\\b(kan|şiddet|silah)\\b", kategori: "Şiddet", davranis: "uyar", regex: true, eslesme: 89 },
  { id: "b5", ifade: "çocuk + uygunsuz kombinasyonlar", kategori: "Çocuk güvenliği", davranis: "engelle", regex: false, eslesme: 12 },
];

/* ── Blocklist test aracı ──
   Verilen prompt'u seed blocklist + panelden eklenen ekstra kurallara karşı
   GERÇEK string / regex eşleştirmeyle test eder, eşleşen kuralları döndürür. */
export interface BlocklistTestKural {
  id: string;
  ifade: string;
  kategori: string;
  davranis: string; // engelle | uyar | flag | flagle
  regex: boolean;
  kaynak: "seed" | "ek";
}

// Seed blocklist'in kaba (label) girişlerini gerçek eşleşebilir kelime setlerine bağlar.
const SEED_ESLESME_KELIMELERI: Record<string, string[]> = {
  b1: ["ünlü", "celebrity", "aktör", "aktris", "şarkıcı", "star"],
  b2: ["marka", "logo", "disney", "marvel", "nike", "mickey", "pokemon"],
  b3: ["nsfw", "çıplak", "müstehcen", "porn", "sex", "sexy"],
  // b4 zaten regex
  b5: ["çocuk", "child", "minör", "reşit değil"],
};

export interface BlocklistTestGirdi {
  id: string;
  ifade: string;
  kategori: string;
  davranis: string;
  regex: boolean;
}

export function blocklistTest(prompt: string, ekstraKurallar: BlocklistTestGirdi[] = []): BlocklistTestKural[] {
  const dusuk = prompt.toLowerCase();
  const eslesenler: BlocklistTestKural[] = [];

  const dene = (
    id: string, ifade: string, kategori: string, davranis: string, regex: boolean, kaynak: "seed" | "ek",
  ) => {
    let tuttu = false;
    if (regex) {
      try {
        tuttu = new RegExp(ifade, "i").test(prompt);
      } catch {
        tuttu = false;
      }
    } else {
      // Seed'in soyut label'ları için kelime setine bak; yoksa doğrudan ifadeyi ara.
      const kelimeler = SEED_ESLESME_KELIMELERI[id];
      if (kelimeler) {
        tuttu = kelimeler.some((w) => dusuk.includes(w.toLowerCase()));
      } else {
        tuttu = dusuk.includes(ifade.toLowerCase());
      }
    }
    if (tuttu) eslesenler.push({ id, ifade, kategori, davranis, regex, kaynak });
  };

  for (const b of BLOCKLIST) dene(b.id, b.ifade, b.kategori, b.davranis, b.regex, "seed");
  for (const e of ekstraKurallar) dene(e.id, e.ifade, e.kategori, e.davranis, e.regex, "ek");

  return eslesenler;
}

/* ── DMCA / Telif ── */
export interface DmcaTalep {
  id: string;
  hakSahibi: string;
  icerik: string;
  durum: "inceleniyor" | "kaldirildi" | "reddedildi" | "karsi_bildirim";
  tarih: number;
}

export function dmcaTalepler(): DmcaTalep[] {
  return Array.from({ length: 8 }, (_, i) => {
    const r = prng(tohumla(`dmca-${i}`));
    return {
      id: `dmca_${i}`,
      hakSahibi: sec(r, ["Warner Bros", "Disney", "Getty Images", "Sony Music", "Bireysel sanatçı"]),
      icerik: `Job #${tamsayi(r, 1000, 9999)}`,
      durum: agirlikliSec(r, [["kaldirildi", 45], ["inceleniyor", 30], ["reddedildi", 15], ["karsi_bildirim", 10]] as const),
      tarih: BUGUN - tamsayi(r, 1, 60) * GUN,
    };
  });
}

/* ── İhlal geçmişi / tekrarlayan ihlalciler ── */
export interface Ihlalci {
  kullaniciId: string;
  ad: string;
  ihlalSayisi: number;
  sonYaptirim: string;
  durum: string;
}

export function ihlalciler(evren: AdminEvren): Ihlalci[] {
  return evren.kullanicilar
    .filter((k) => k.guvenSkoru < 45)
    .slice(0, 15)
    .map((k) => {
      const r = prng(tohumla(`ihlal-${k.id}`));
      const sayi = tamsayi(r, 1, 5);
      return {
        kullaniciId: k.id, ad: k.ad, ihlalSayisi: sayi,
        sonYaptirim: ["Uyarı", "24s askı", "7 gün askı", "Kalıcı ban"][Math.min(3, sayi - 1)],
        durum: sayi >= 4 ? "Kalıcı ban" : "Aktif",
      };
    })
    .sort((a, b) => b.ihlalSayisi - a.ihlalSayisi);
}

/* ── Destek: Ticketlar ── */
export interface Ticket {
  id: string;
  kullaniciId: string;
  kullanici: string;
  konu: string;
  kategori: string;
  oncelik: "düşük" | "orta" | "yüksek" | "acil";
  durum: "acik" | "yanitlandi" | "beklemede" | "kapandi";
  atanan?: string;
  slaKalan: number; // saat
  sonMesaj: number;
  mesajSayisi: number;
}

export function ticketlar(evren: AdminEvren): Ticket[] {
  return Array.from({ length: 60 }, (_, i) => {
    const r = prng(tohumla(`ticket-${i}`));
    const k = sec(r, evren.kullanicilar);
    return {
      id: `TK-${(2026000 + i).toString()}`,
      kullaniciId: k.id, kullanici: k.ad,
      konu: sec(r, ["Ödeme sorunu", "Kredi iadesi talebi", "Üretim başarısız", "Plan değişikliği", "Hesap erişimi", "Fatura talebi", "Öneri"]),
      kategori: sec(r, TICKET_KATEGORI),
      oncelik: agirlikliSec(r, [["düşük", 30], ["orta", 40], ["yüksek", 20], ["acil", 10]] as const),
      durum: agirlikliSec(r, [["acik", 30], ["yanitlandi", 25], ["beklemede", 15], ["kapandi", 30]] as const),
      atanan: r() > 0.4 ? sec(r, ["destek", "moderator", "super"]) : undefined,
      slaKalan: tamsayi(r, -4, 24),
      sonMesaj: BUGUN - tamsayi(r, 1, 72) * SAAT,
      mesajSayisi: tamsayi(r, 1, 8),
    };
  }).sort((a, b) => a.slaKalan - b.slaKalan);
}

/* ── Hazır makrolar & SSS ── */
export const MAKROLAR = [
  { id: "m1", ad: "Kredi iade + özür", aksiyon: "Kredi iade et + özür maili gönder" },
  { id: "m2", ad: "Job yeniden + bilgilendir", aksiyon: "Job'u yeniden çalıştır + bilgilendir" },
  { id: "m3", ad: "Plan yükseltme rehberi", aksiyon: "Plan yükseltme adımlarını gönder" },
  { id: "m4", ad: "Şifre sıfırlama", aksiyon: "Şifre sıfırlama bağlantısı gönder" },
  { id: "m5", ad: "Fatura gönder", aksiyon: "Son fatura PDF'ini gönder" },
];

export const SSS_YONETIM = [
  { id: "s1", soru: "Kredilerim nasıl çalışır?", kategori: "Kredi", gorunum: 4200 },
  { id: "s2", soru: "Aboneliğimi nasıl iptal ederim?", kategori: "Abonelik", gorunum: 3100 },
  { id: "s3", soru: "Üretim neden başarısız oldu?", kategori: "Teknik", gorunum: 2800 },
  { id: "s4", soru: "İade politikanız nedir?", kategori: "Ödeme", gorunum: 1900 },
];

export function destekMetrik() {
  return { ilkYanit: "42dk", cozumSure: "6,2sa", acikTicket: 24, memnuniyet: 4.6, gunlukHacim: 38 };
}

/* ── Ticket mesaj thread'i (deterministik konuşma) ──
   Her ticket için ID'sinden türetilen 3-8 mesajlık kullanıcı↔destek diyaloğu.
   Store'daki yanıtlar bunun ÜSTÜNE eklenir. */
export interface TicketMesaj {
  id: string;
  kim: "kullanici" | "destek";
  metin: string;
  zaman: number;
}

const KULLANICI_ACILIS: Record<string, string[]> = {
  "Ödeme sorunu": [
    "Merhaba, kredi kartımdan çekim yapıldı ama planım aktifleşmedi. Yardımcı olur musunuz?",
    "Ödeme ekranında hata alıyorum, işlemi tamamlayamıyorum.",
  ],
  "Kredi iadesi talebi": [
    "Üretim başarısız oldu ama kredilerim geri gelmedi. İade edebilir misiniz?",
    "Yanlışlıkla iki kez üretim başlattım, birinin kredisini iade alabilir miyim?",
  ],
  "Üretim başarısız": [
    "Video üretimim sürekli başarısız oluyor, sebebini anlamadım.",
    "3D modelim %80'de takılıp hata veriyor. Ne yapmalıyım?",
  ],
  "Plan değişikliği": [
    "Ultra plana geçmek istiyorum ama mevcut kredilerim ne olacak?",
    "Planımı düşürürsem verilerim silinir mi?",
  ],
  "Hesap erişimi": [
    "Hesabıma giriş yapamıyorum, şifre sıfırlama maili gelmedi.",
    "İki faktörlü doğrulama telefonuma erişemiyorum, kilitlendim.",
  ],
  "Fatura talebi": [
    "Geçen ayki ödememin faturasını alabilir miyim? Muhasebe istiyor.",
    "Faturamda şirket bilgilerim eksik görünüyor, güncelleyebilir misiniz?",
  ],
  "Öneri": [
    "Toplu üretim özelliği ekleyebilir misiniz? İş akışımı çok hızlandırır.",
    "Karanlık tema için daha fazla kontrast rica ediyorum.",
  ],
};

const DESTEK_YANITLAR = [
  "Merhaba, mesajınız için teşekkürler. Konuyu inceliyorum, birazdan dönüş yapacağım.",
  "Durumu kontrol ettim. Detayları paylaşabilir misiniz? İşlem numaranız elinizde mi?",
  "Teşekkürler, gerekli düzeltmeyi yaptım. Kontrol edip bana bilgi verir misiniz?",
];

const KULLANICI_TAKIP = [
  "Teşekkürler, işlem numaram elimde. Hemen paylaşıyorum.",
  "Denedim ama hâlâ aynı sorun devam ediyor maalesef.",
  "Harika, sorun çözüldü. İlginiz için çok teşekkür ederim!",
];

/** Bir ticket'ın deterministik seed mesaj thread'i (3-8 mesaj). */
export function ticketMesajlari(ticketId: string, konu?: string): TicketMesaj[] {
  const r = prng(tohumla(`thread-${ticketId}`));
  const acilisSet = (konu && KULLANICI_ACILIS[konu]) || ["Merhaba, bir konuda yardıma ihtiyacım var."];
  const mesajSayisi = tamsayi(r, 3, 8);
  const mesajlar: TicketMesaj[] = [];
  const baslangic = BUGUN - tamsayi(r, 6, 72) * SAAT;
  let t = baslangic;

  mesajlar.push({ id: `${ticketId}-m0`, kim: "kullanici", metin: sec(r, acilisSet), zaman: t });

  for (let i = 1; i < mesajSayisi; i++) {
    t += tamsayi(r, 10, 240) * 60000; // 10dk–4sa arası
    const destekSirasi = i % 2 === 1;
    mesajlar.push({
      id: `${ticketId}-m${i}`,
      kim: destekSirasi ? "destek" : "kullanici",
      metin: destekSirasi ? sec(r, DESTEK_YANITLAR) : sec(r, KULLANICI_TAKIP),
      zaman: t,
    });
  }
  return mesajlar;
}
