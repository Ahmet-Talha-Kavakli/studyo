import { denetle } from "./denetim";

/**
 * Paylaşım ve topluluk güvenlik denetimi (istemci + sunucu, saf işlev).
 * Gizli anahtar desenleri denetim.ts'deki yayın denetiminden gelir (kritik "kodda açıkta" bulguları); buna ek olarak
 * yaygın sağlayıcı anahtarları, şifreli veritabanı adresleri, gizli bilgi dosyaları ve tehlikeli kod kalıpları aranır.
 * Herhangi bir bulgu topluluğa eklemeyi durdurur; paylaşım bağlantısında yalnız sır ve dosya bulguları durdurur.
 */
export type GuvenlikBulgusu = { tur: "sir" | "tehlike" | "dosya"; baslik: string; ayrinti: string; dosya?: string; satir?: number };

const EK_SIRLAR: [RegExp, string][] = [
  [/\bAIza[0-9A-Za-z_-]{35}\b/, "Google API anahtarı"],
  [/\bsk_test_[A-Za-z0-9]{16,}/, "Stripe gizli test anahtarı"],
  [/\brk_(?:live|test)_[A-Za-z0-9]{16,}/, "Stripe kısıtlı anahtarı"],
  [/\bgithub_pat_[A-Za-z0-9_]{40,}/, "GitHub erişim belirteci"],
  [/\bgh[ousr]_[A-Za-z0-9]{30,}\b/, "GitHub belirteci"],
  [/\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{30,}/, "SendGrid API anahtarı"],
  [/\b\d{8,10}:AA[0-9A-Za-z_-]{33}\b/, "Telegram bot belirteci"],
  [/https:\/\/hooks\.slack\.com\/services\/T[A-Za-z0-9]+\/B[A-Za-z0-9]+\/[A-Za-z0-9]+/, "Slack web kancası adresi"],
  [/https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+/, "Discord web kancası adresi"],
  [/\b(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis|amqp):\/\/[^\s"'`/:@]+:[^\s"'`@]{3,}@/, "Şifreli veritabanı bağlantı adresi"],
];

/** Kodda değer olarak yazılmış olası sır: anahtar adı + en az 16 karakterlik harf ve rakam karışık değer. */
const ATAMA = /\b(api[_-]?key|apikey|secret[_-]?key|client[_-]?secret|access[_-]?token|auth[_-]?token|private[_-]?key|service[_-]?role[_-]?key)\b["']?\s*[:=]\s*["'`]([^"'`\s]{16,})["'`]/i;
const YER_TUTUCU = /^(your|senin|ornek|örnek|example|xxx|placeholder|test|demo|changeme|buraya)/i;

const TEHLIKE: [RegExp, string, string][] = [
  [/coinhive|coin-hive|cryptonight|coinimp|webminepool|jsecoin|crypto-loot|minero\.cc|webmine\.pro|deepminer/i, "Kripto para madencisi", "Ziyaretçinin işlemcisini izinsiz kullanan madenci kodu."],
  [/\beval\s*\(\s*(?:atob|unescape|decodeURIComponent|escape|String\.fromCharCode)\s*\(/, "Gizlenmiş kod çalıştırma", "Şifrelenmiş bir metni çözüp eval ile çalıştırıyor; ne yaptığı okunamıyor."],
  [/\bnew\s+Function\s*\(\s*(?:atob|unescape|decodeURIComponent)\s*\(/, "Gizlenmiş kod çalıştırma", "Şifrelenmiş bir metinden işlev üretip çalıştırıyor."],
  [/document\.write\s*\(\s*(?:unescape|atob)\s*\(/, "Gizlenmiş sayfa yazımı", "Şifrelenmiş HTML'i sayfaya yazıyor."],
  [/(?:\\x[0-9a-fA-F]{2}){80,}/, "Gizlenmiş kod", "Uzun bir onaltılık kaçış dizisi var; kodun ne yaptığı okunamıyor."],
  [/String\.fromCharCode\s*\((?:\s*\d{2,3}\s*,){40,}/, "Gizlenmiş kod", "Karakter kodlarından metin üretiliyor; kodun ne yaptığı okunamıyor."],
  [/<iframe\b[^>]*(?:\bwidth=["']?0["'\s>]|\bheight=["']?0["'\s>]|display\s*:\s*none|visibility\s*:\s*hidden)[^>]*>/i, "Gizli çerçeve", "Görünmeyen bir iframe, ziyaretçiye fark ettirmeden başka bir sayfa yüklüyor."],
  [/<script\b[^>]*\bsrc=["']https?:\/\/\d{1,3}(?:\.\d{1,3}){3}/i, "IP adresinden betik", "Alan adı olmayan bir sunucudan betik yükleniyor."],
  [/(?:sendBeacon|fetch|XMLHttpRequest)[^;]{0,200}document\.cookie|document\.cookie[^;]{0,200}(?:sendBeacon|fetch\s*\()/, "Çerez sızdırma", "Tarayıcı çerezleri bir adrese gönderiliyor."],
  [/addEventListener\s*\(\s*["']key(?:down|press|up)["'][\s\S]{0,400}?(?:sendBeacon|fetch|new Image\(\)\.src\s*=)\s*\(?\s*["'`]https?:\/\//, "Tuş kaydedici", "Basılan tuşlar dış bir adrese gönderiliyor."],
];

const GIZLI_DOSYA = /(^|\/)\.env(\.[a-z]+)?$|\.(pem|key|p12|pfx|keystore|jks)$|(^|\/)id_(rsa|ed25519|ecdsa)$|(^|\/)\.npmrc$|(^|\/)\.git\//i;

const satirBul = (s: string, i: number) => s.slice(0, i).split("\n").length;

/** Supabase gibi sistemlerin "service_role" belirteci: herkese açık anon anahtar değil, her kuralı aşan sunucu anahtarı. */
function servisRolu(icerik: string): number {
  for (const m of icerik.matchAll(/eyJ[A-Za-z0-9_-]{10,}\.(eyJ[A-Za-z0-9_-]{10,})\.[A-Za-z0-9_-]{10,}/g)) {
    try {
      const b = m[1].replace(/-/g, "+").replace(/_/g, "/");
      const metin = typeof atob === "function" ? atob(b + "=".repeat((4 - (b.length % 4)) % 4)) : Buffer.from(b, "base64").toString("utf8");
      if (/"role"\s*:\s*"service_role"/.test(metin)) return m.index ?? 0;
    } catch { /* bozuk */ }
  }
  return -1;
}

export function guvenlikDenetimi(dosyalar: Record<string, string>, g: { yalnizSir?: boolean } = {}): GuvenlikBulgusu[] {
  const b: GuvenlikBulgusu[] = [];
  const ekle = (x: GuvenlikBulgusu) => { if (!b.some((y) => y.baslik === x.baslik && y.dosya === x.dosya)) b.push(x); };
  // Yayın denetimindeki gizli anahtar desenleri (denetim.ts): kritik "… kodda açıkta" bulguları.
  for (const x of denetle(dosyalar)) if (x.seviye === "kritik" && x.dosya && / kodda açıkta$/.test(x.baslik)) ekle({ tur: "sir", baslik: x.baslik, ayrinti: "Herkes görebilir. Anahtarı koddan çıkar, Ortam ve sırlar bölümüne sunucu sırrı olarak ekle ve sağlayıcısında yenile.", dosya: x.dosya });
  for (const [yol, icerik] of Object.entries(dosyalar)) {
    if (GIZLI_DOSYA.test(yol)) ekle({ tur: "dosya", baslik: "Gizli bilgi dosyası", ayrinti: "Ortam dosyaları, özel anahtarlar ve sertifikalar paylaşılamaz. Dosyayı projeden sil.", dosya: yol });
    for (const [re, ad] of EK_SIRLAR) {
      const m = re.exec(icerik);
      if (m) ekle({ tur: "sir", baslik: `${ad} kodda açıkta`, ayrinti: "Herkes görebilir. Değeri koddan çıkar, sunucu sırrı olarak sakla ve sağlayıcısında yenile.", dosya: yol, satir: satirBul(icerik, m.index) });
    }
    const sr = servisRolu(icerik);
    if (sr >= 0) ekle({ tur: "sir", baslik: "Sunucu rolü belirteci kodda açıkta", ayrinti: "service_role belirteci bütün veri kurallarını aşar. Koddan çıkar ve yenile.", dosya: yol, satir: satirBul(icerik, sr) });
    const a = ATAMA.exec(icerik);
    if (a && /[A-Za-z]/.test(a[2]) && /\d/.test(a[2]) && !YER_TUTUCU.test(a[2]) && !a[2].includes("${")) ekle({ tur: "sir", baslik: "Olası gizli değer kodda açıkta", ayrinti: `"${a[1]}" adlı alana gerçek bir değer yazılmış görünüyor. Değeri koddan çıkar ya da yer tutucuyla değiştir.`, dosya: yol, satir: satirBul(icerik, a.index) });
    if (g.yalnizSir) continue;
    for (const [re, ad, ayrinti] of TEHLIKE) {
      const m = re.exec(icerik);
      if (m) ekle({ tur: "tehlike", baslik: ad, ayrinti, dosya: yol, satir: satirBul(icerik, m.index) });
    }
    if (/\.html?$/i.test(yol)) {
      for (const f of icerik.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)) {
        if (/\baction=["']https?:\/\//i.test(f[1]) && /type=["']?password/i.test(f[2])) ekle({ tur: "tehlike", baslik: "Şifre başka bir adrese gönderiliyor", ayrinti: "Şifre alanı olan form dış bir sunucuya gönderiliyor; kimlik avı sayfası gibi davranabilir.", dosya: yol, satir: satirBul(icerik, f.index ?? 0) });
      }
    }
  }
  return b;
}

/** Bulguyu tek satıra çevirir: "Google API anahtarı kodda açıkta (app.js, satır 12)". */
export const bulguSatiri = (x: GuvenlikBulgusu) => `${x.baslik}${x.dosya ? ` (${x.dosya}${x.satir ? `, satır ${x.satir}` : ""})` : ""}`;
