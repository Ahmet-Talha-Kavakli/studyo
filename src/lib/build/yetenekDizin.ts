/**
 * Yetenek dizini: Anthropic'in resmî örnek yetenekleri (github.com/anthropics/skills, skills/ klasörü, 19 yetenek).
 * Lisanslar 2026-11-05'te her klasörün LICENSE.txt dosyasından okundu: Apache 2.0 olanlar SKILL.md ve metin dosyalarıyla
 * (lisans dosyası dahil) içe aktarılabilir; kaynağı açık ama tescilli olanlar (docx, pdf, pptx, xlsx) ile lisansı
 * belirtilmeyen doc-coauthoring yalnız bağlantıyla gösterilir. İçerik uydurulmaz: içe aktarma ve önizleme dosyayı
 * GitHub'dan o anda okur. İstemci ve sunucu ortak.
 */
export type DizinLisans = "apache" | "tescilli" | "belirsiz";
export type DizinYetenegi = { ad: string; baslik: string; aciklama: string; lisans: DizinLisans; tur: "belge" | "tasarim" | "gelistirme" | "yazim" | "diger" };

export const ANTHROPIC_DEPO = "anthropics/skills";
export const ANTHROPIC_DAL = "main";
export const dizinUrl = (ad: string) => `https://github.com/${ANTHROPIC_DEPO}/tree/${ANTHROPIC_DAL}/skills/${ad}`;
export const LISANS_AD: Record<DizinLisans, string> = { apache: "Apache 2.0", tescilli: "Kaynağı açık, tescilli", belirsiz: "Lisans belirtilmemiş" };
export const iceAktarilabilir = (y: DizinYetenegi) => y.lisans === "apache";

export const ANTHROPIC_YETENEKLERI: DizinYetenegi[] = [
  { ad: "skill-creator", baslik: "Yetenek yaratıcı", tur: "gelistirme", lisans: "apache", aciklama: "Yetenek oluşturur ve iyileştirir; değerlendirme çalıştırır, sürümleri kıyaslar, açıklamayı tetiklenmeye göre iyileştirir." },
  { ad: "frontend-design", baslik: "Özgün arayüz tasarımı", tur: "tasarim", lisans: "apache", aciklama: "Şablon gibi görünmeyen, özgün estetikte ön yüz arayüzleri için yönlendirme." },
  { ad: "mcp-builder", baslik: "MCP sunucusu kurma", tur: "gelistirme", lisans: "apache", aciklama: "Kaliteli MCP sunucusu kurma rehberi (FastMCP ve TypeScript SDK)." },
  { ad: "webapp-testing", baslik: "Web uygulaması testi", tur: "gelistirme", lisans: "apache", aciklama: "Playwright ile yerel web uygulamasını test eder, ekran görüntüsü ve kayıt toplar." },
  { ad: "web-artifacts-builder", baslik: "Çok bileşenli HTML", tur: "gelistirme", lisans: "apache", aciklama: "React, Tailwind ve shadcn/ui ile çok bileşenli tek HTML paketi kurar." },
  { ad: "claude-api", baslik: "Claude API başvurusu", tur: "gelistirme", lisans: "apache", aciklama: "Claude API ve SDK başvurusu: modeller, fiyatlar, araçlar, önbellek." },
  { ad: "doc-coauthoring", baslik: "Belgeyi birlikte yazma", tur: "yazim", lisans: "belirsiz", aciklama: "Belge, teklif ve teknik şartname için ortak yazım akışı: bağlamı aktar, yinele, okuyucu testi yap." },
  { ad: "internal-comms", baslik: "Şirket içi iletişim", tur: "yazim", lisans: "apache", aciklama: "Durum raporu, yönetici güncellemesi, bülten, olay raporu ve SSS yazımı." },
  { ad: "brand-guidelines", baslik: "Marka kılavuzu", tur: "tasarim", lisans: "apache", aciklama: "Marka renk ve tipografisini çıktılara uygular; kendi marka kitin için şablon." },
  { ad: "theme-factory", baslik: "Tema fabrikası", tur: "tasarim", lisans: "apache", aciklama: "On hazır tema (renk ve yazı tipi) ile çıktıları biçimlendirir ya da anında tema üretir." },
  { ad: "canvas-design", baslik: "Tuval tasarımı", tur: "tasarim", lisans: "apache", aciklama: "Bir tasarım anlayışıyla png ve pdf afiş ya da sanat eseri üretir." },
  { ad: "algorithmic-art", baslik: "Algoritmik sanat", tur: "tasarim", lisans: "apache", aciklama: "p5.js ve tohumlu rastgelelikle etkileşimli parametreli üretken sanat." },
  { ad: "slack-gif-creator", baslik: "Slack GIF'i", tur: "tasarim", lisans: "apache", aciklama: "Slack için boyut sınırlarına uygun animasyonlu GIF üretir ve doğrular." },
  { ad: "discernment-nudge", baslik: "Sorgulayıcı takip soruları", tur: "diger", lisans: "apache", aciklama: "Önemli yanıtlardan sonra iki üç sorgulayıcı takip sorusu ekler." },
  { ad: "academy-guide", baslik: "Claude Academy rehberi", tur: "diger", lisans: "apache", aciklama: "Claude ürün sorularında ilgili Claude Academy kurslarını önerir." },
  { ad: "docx", baslik: "Word belgeleri", tur: "belge", lisans: "tescilli", aciklama: "Word belgesi oluşturur, okur ve düzenler; izlenen değişiklikler ve şablonlar." },
  { ad: "pdf", baslik: "PDF işlemleri", tur: "belge", lisans: "tescilli", aciklama: "PDF'ten metin ve tablo çıkarır, birleştirir, böler, form doldurur, filigran ekler." },
  { ad: "pptx", baslik: "Sunumlar", tur: "belge", lisans: "tescilli", aciklama: "PowerPoint sunusu oluşturur, okur ve düzenler; şablonlarla çalışır." },
  { ad: "xlsx", baslik: "Excel tabloları", tur: "belge", lisans: "tescilli", aciklama: "Excel ve CSV dosyalarını açar, düzenler, formül ve grafik ekler, veriyi temizler." },
];
export const DIZIN_TUR: Record<DizinYetenegi["tur"], string> = { belge: "Belgeler", tasarim: "Tasarım", gelistirme: "Geliştirme", yazim: "Yazım", diger: "Diğer" };
