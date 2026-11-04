"use client";

/**
 * Vayra mesaj sistemi — anlık bildirimlerin (toast) tek dili.
 *
 * KILAVUZ (her toast için):
 *  1. Başlık sonucu söyler, kısa ve geçmiş zaman: "Bağlantı kopyalandı", "Proje silindi".
 *     En çok ~40 karakter, emoji / ✓ / ünlem yok, sonunda nokta yok. "Olmadı", "Hata", "İşlem uygulandı" gibi belirsiz başlık yok.
 *  2. Açıklama (isteğe bağlı) tam cümle, nokta ile biter: ne oldu + neden + ne yapmalı.
 *     Hata ve uyarıda açıklama ZORUNLU: nedeni ve çözümü söyle ("En çok 20 MB. Daha küçük bir dosya seç.").
 *  3. Geri alınabilen her yıkıcı işlem (sil, kaldır, arşivle) "Geri al" eylemi taşır.
 *  4. Kullanıcıyı bir yere yönlendirmek gerekiyorsa tek eylem: "Kredi yükle", "Görüntüle", "Ayarlar".
 *  5. Tür: success = iş bitti; error = yapılamadı; warning = yapıldı ama dikkat / engel; info = bilgi;
 *     loading = süren iş (aynı id ile success/error'a güncelle).
 *  6. Sessiz eylem bırakma: kopyala, indir, kaydet, sil, paylaş, yükle, gönder, bağla, iptal — hepsi bildirim verir.
 *  7. Demo çıktıda gerçek gibi davranma: açıklamada "Demo" olduğunu söyle.
 *
 * Sık kullanılan mesajlar aşağıdaki yardımcılarla verilir; böylece her yerde aynı metin çıkar.
 */

import { toast } from "@/lib/toast";

type Eylem = { label: string; onClick: () => void };
const git = (yol: string) => () => { if (typeof window !== "undefined") window.location.assign(yol); };
const sayi = (n: number) => n.toLocaleString("tr-TR");

export const mesaj = {
  /** "İstem kopyalandı" — ne kopyalandıysa onu söyle. */
  kopyalandi: (ne = "Bağlantı", aciklama?: string) => toast.success(`${ne} kopyalandı`, aciklama ? { description: aciklama } : undefined),
  kopyalanamadi: () => toast.error("Kopyalanamadı", { description: "Tarayıcı panoya erişime izin vermedi. Metni seçip elle kopyala." }),

  /** Panoya yazar ve sonucu bildirir. */
  kopyala: async (metin: string, ne = "Bağlantı") => {
    try { await navigator.clipboard.writeText(metin); mesaj.kopyalandi(ne); return true; }
    catch { mesaj.kopyalanamadi(); return false; }
  },

  indiriliyor: (ad?: string) => toast(ad ? `${ad} indiriliyor` : "İndiriliyor", { description: "Dosya birkaç saniye içinde indirilenler klasörüne düşer." }),
  indirildi: (ad?: string) => toast.success(ad ? `${ad} indirildi` : "İndirildi"),
  indirilemedi: (neden = "Dosyaya şu an ulaşılamıyor.") => toast.error("İndirilemedi", { description: `${neden} Biraz sonra yeniden dene.` }),

  kaydedildi: (ne?: string, aciklama?: string) => toast.success(ne ? `${ne} kaydedildi` : "Değişiklikler kaydedildi", aciklama ? { description: aciklama } : undefined),
  kaydedilemedi: (neden = "Tarayıcı deposu dolu ya da kapalı olabilir.") => toast.error("Kaydedilemedi", { description: `${neden} Sayfayı yenileyip yeniden dene.` }),

  /** Yıkıcı işlem + Geri al. */
  silindi: (ne: string, geriAl?: () => void) => toast(`${ne} silindi`, geriAl ? { action: { label: "Geri al", onClick: geriAl } } : undefined),
  kaldirildi: (ne: string, geriAl?: () => void) => toast(`${ne} kaldırıldı`, geriAl ? { action: { label: "Geri al", onClick: geriAl } } : undefined),

  yetersizKredi: (gerekli: number, mevcut: number) =>
    toast.error("Kredin yetmiyor", {
      description: `Bu işlem ${sayi(gerekli)} kredi, bakiyende ${sayi(mevcut)} var.`,
      action: { label: "Kredi yükle", onClick: git("/panel/kredi?sekme=kredi") },
    }),

  dosyaCokBuyuk: (sinirMb: number) => toast.error("Dosya çok büyük", { description: `En çok ${sinirMb} MB yükleyebilirsin. Daha küçük bir dosya seç.` }),
  desteklenmeyenDosya: (turler: string) => toast.error("Bu dosya türü desteklenmiyor", { description: `${turler} dosyası seç.` }),
  dosyaOkunamadi: () => toast.error("Dosya okunamadı", { description: "Dosya bozuk olabilir. Başka bir dosyayla dene." }),
  yuklendi: (ne = "Dosya") => toast.success(`${ne} yüklendi`),
  yuklenemedi: (ne = "Dosya", neden = "Bağlantı kesildi.") => toast.error(`${ne} yüklenemedi`, { description: `${neden} Yeniden dene.` }),

  baglantiHatasi: () => toast.error("Sunucuya ulaşılamadı", { description: "İnternet bağlantını kontrol edip yeniden dene." }),
  /** Genel hata: neden ve çözüm zorunlu. */
  hata: (baslik: string, neden: string, eylem?: Eylem) => toast.error(baslik, { description: neden, action: eylem }),
  uyari: (baslik: string, aciklama: string, eylem?: Eylem) => toast.warning(baslik, { description: aciklama, action: eylem }),
  bilgi: (baslik: string, aciklama?: string, eylem?: Eylem) => toast.info(baslik, { description: aciklama, action: eylem }),
  basari: (baslik: string, aciklama?: string, eylem?: Eylem) => toast.success(baslik, { description: aciklama, action: eylem }),

  /** Üretim başladı: model · bedel (demo ise kredi düşmez). */
  uretimBasladi: (ne: string, model: string, kredi: number, demo?: boolean) =>
    toast(`${ne} üretiliyor`, { description: `${model} · ${demo || !kredi ? "Kredi düşmez." : `${sayi(kredi)} kredi.`} Bitince bildirim gelir.` }),

  izinGerekli: (ne: "Mikrofon" | "Kamera" | "Bildirim" | "Pano") =>
    toast.error(`${ne} izni gerekli`, { description: "Tarayıcının adres çubuğundaki kilit simgesinden izin ver ve yeniden dene." }),
  acilirPencereEngellendi: () => toast.error("Açılır pencere engellendi", { description: "Tarayıcının adres çubuğundan bu site için açılır pencerelere izin ver." }),
  girisGerekli: (ac?: () => void) => toast("Önce giriş yap", { description: "Bu işlem için hesabınla giriş yapman gerekiyor.", action: ac ? { label: "Giriş yap", onClick: ac } : undefined }),
};
