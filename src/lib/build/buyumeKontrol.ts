import type { Proje } from "./tipler";
import type { BuyumeVeri } from "./buyumeTipler";

/**
 * Lansman kontrol listesi (saf; istemcide hesaplanır). Projeden anlaşılabilen maddeler kendiliğinden işaretlenir
 * ve kanıtı yazılır; anlaşılamayanları kullanıcı işaretler (BuyumeVeri.kontrol).
 */
export type KontrolEylem =
  | { tur: "ayar"; ad: string; bolum: "seo" | "alan" | "genel" }
  | { tur: "ajan"; ad: string; istem: string }
  | { tur: "bolum"; ad: string; bolum: "plan" | "icerik" | "reklam" | "blog" }
  | { tur: "yayin"; ad: string }
  | { tur: "dis"; ad: string; adres: string };
export type KontrolMaddesi = {
  id: string; grup: "Site" | "Arama ve ölçüm" | "Kanallar";
  baslik: string; aciklama: string;
  /** Projeden anlaşıldı mı (true: kendiliğinden tamam). */
  otomatik: boolean;
  /** Kendiliğinden anlaşılamıyorsa kullanıcı işaretleyebilir. */
  elle: boolean;
  kanit?: string; ilerleme?: [number, number]; logo?: string;
  eylem?: KontrolEylem;
};

const metinAl = (h: string) => h.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");

export function lansmanListesi(p: Proje, v: BuyumeVeri): KontrolMaddesi[] {
  const sayfalar = Object.entries(p.dosyalar).filter(([y]) => y.endsWith(".html"));
  const tumHtml = sayfalar.map(([, h]) => h).join("\n");
  const ana = p.dosyalar["index.html"] ?? sayfalar[0]?.[1] ?? "";
  const seo = p.ayarlar.seo;
  const title = ana.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? "";
  /** Etiket özniteliği: tırnak türüne göre (içinde kesme işareti olan Türkçe metinler kesilmesin). */
  const oznitelik = (etiket: RegExp, ad: string) => {
    const e = ana.match(etiket)?.[0];
    const m = e?.match(new RegExp(ad + "=(?:\"([^\"]*)\"|'([^']*)')", "i"));
    return (m?.[1] ?? m?.[2] ?? "").trim();
  };
  const metaAcik = oznitelik(/<meta[^>]+name=["']description["'][^>]*>/i, "content");
  const baslik = seo.baslik.trim() && seo.baslik.trim() !== p.ad ? seo.baslik.trim() : title || seo.baslik.trim();
  const aciklama = seo.aciklama.trim() || metaAcik;
  const baslikIyi = baslik.length >= 15 && baslik.length <= 65;
  const aciklamaIyi = aciklama.length >= 50 && aciklama.length <= 170;
  const og = seo.ogGorsel?.trim() || oznitelik(/<meta[^>]+property=["']og:image["'][^>]*>/i, "content");
  const favicon = /<link[^>]+rel=["'][^"']*icon[^"']*["']/i.test(ana);
  const viewport = /<meta[^>]+name=["']viewport["']/i.test(ana);
  const gsc = /<meta[^>]+name=["']google-site-verification["']/i.test(tumHtml);
  const sosyalEslesme = [...new Set((metinAl(tumHtml).match(/https?:\/\/(?:www\.)?(instagram\.com|tiktok\.com|linkedin\.com|facebook\.com|x\.com|twitter\.com|youtube\.com|wa\.me|api\.whatsapp\.com)/gi) ?? []).map((u) => u.replace(/^https?:\/\/(www\.)?/i, "").split(/[./]/)[0].toLocaleLowerCase("tr-TR")))];
  const epostaFormu = sayfalar.find(([, h]) => /<form[\s\S]*?type=["']email["'][\s\S]*?<\/form>/i.test(h));
  const bagliAlan = p.alanAdlari.find((a) => a.durum === "bagli");
  const hazir = v.gonderiler.filter((g) => g.durum !== "taslak").length;
  const SOSYAL_AD: Record<string, string> = { instagram: "Instagram", tiktok: "TikTok", linkedin: "LinkedIn", facebook: "Facebook", x: "X", twitter: "X", youtube: "YouTube", wa: "WhatsApp", api: "WhatsApp" };

  return [
    { id: "yayin", grup: "Site", baslik: "Site yayında", aciklama: "Ziyaretçiler siteyi açabiliyor; ölçüm ve paylaşım bağlantıları yayından sonra çalışır.", otomatik: !!p.yayin, elle: false, kanit: p.yayin ? `Sürüm ${p.yayin.surumNo} yayında` : undefined, eylem: p.yayin ? undefined : { tur: "yayin", ad: "Yayınla" } },
    { id: "alan", grup: "Site", baslik: "Alan adı bağlı", aciklama: "Kendi alan adın güven verir, reklam ve paylaşımlarda akılda kalır.", otomatik: !!bagliAlan, elle: false, kanit: bagliAlan?.ad, eylem: bagliAlan ? undefined : { tur: "ayar", ad: "Alan adı bağla", bolum: "alan" } },
    { id: "seo", grup: "Site", baslik: "SEO başlığı ve açıklaması", aciklama: "Başlık 30 ile 60, açıklama 120 ile 155 karakter arası en iyisi.", otomatik: baslikIyi && aciklamaIyi, elle: false,
      kanit: baslikIyi && aciklamaIyi ? `${baslik.length} karakter başlık, ${aciklama.length} karakter açıklama${baslik.length < 30 || aciklama.length < 120 ? "; biraz uzatırsan aramada daha çok yer kaplar" : ""}` : !baslik ? "Başlık yok" : !aciklama ? "Açıklama yok" : !baslikIyi ? `Başlık ${baslik.length} karakter` : `Açıklama ${aciklama.length} karakter`,
      eylem: baslikIyi && aciklamaIyi ? undefined : { tur: "ayar", ad: "Arama ayarlarını aç", bolum: "seo" } },
    { id: "og", grup: "Site", baslik: "Paylaşım görseli", aciklama: "Bağlantı WhatsApp, LinkedIn ya da X'te paylaşıldığında görünen 1200 × 630 görsel.", otomatik: !!og, elle: false, kanit: og ? "Paylaşım görseli tanımlı" : undefined,
      eylem: og ? undefined : { tur: "ajan", ad: "Ajana hazırlat", istem: "Siteye 1200 x 630 boyutunda, markayı ve ana mesajı gösteren bir paylaşım görseli hazırla; og:image ve twitter:card etiketlerini bütün sayfalara ekle." } },
    { id: "favicon", grup: "Site", baslik: "Site simgesi", aciklama: "Tarayıcı sekmesinde ve yer imlerinde görünen küçük simge.", otomatik: favicon, elle: false, kanit: favicon ? "index.html içinde simge bağlantısı var" : undefined,
      eylem: favicon ? undefined : { tur: "ajan", ad: "Ajana ekle", istem: "Markaya uygun bir SVG site simgesi (favicon) hazırla ve bütün sayfaların head bölümüne bağla." } },
    { id: "mobil", grup: "Site", baslik: "Telefonda düzgün görünüyor", aciklama: "Ziyaretçilerin çoğu sosyal medyadan telefonla gelir.", otomatik: viewport, elle: false, kanit: viewport ? "Görünüm alanı etiketi var" : undefined,
      eylem: viewport ? undefined : { tur: "ajan", ad: "Ajana düzelt", istem: "Bütün sayfalara viewport etiketi ekle ve 390 piksel genişlikte yatay taşma olmayacak şekilde düzenle." } },
    { id: "analitik", grup: "Arama ve ölçüm", baslik: "Analitik açık", aciklama: "Vayra Analitik çerezsiz çalışır; yayındaki sitede kendiliğinden açılır, kampanya bağlantılarını da sayar.", otomatik: !!p.yayin, elle: false, kanit: p.yayin ? "Vayra Analitik yayında ölçüyor" : "Yayından sonra kendiliğinden açılır" },
    { id: "harita", grup: "Arama ve ölçüm", baslik: "Site haritası ve robots.txt", aciklama: "Arama motorlarının bütün sayfaları bulması için.", otomatik: !!p.yayin && seo.indeks, elle: false, kanit: !seo.indeks ? "Arama motorları kapalı" : p.yayin ? "Yayında kendiliğinden üretiliyor" : undefined,
      eylem: !seo.indeks ? { tur: "ayar", ad: "Arama motorlarını aç", bolum: "seo" } : undefined },
    { id: "gsc", grup: "Arama ve ölçüm", baslik: "Google Search Console", aciklama: "Siteyi Google'a tanıt, site haritasını gönder, hangi aramalarda göründüğünü izle.", otomatik: gsc, elle: !gsc, kanit: gsc ? "Doğrulama etiketi bulundu" : undefined, logo: "/marka/renkli/google-search-console.svg",
      eylem: gsc ? undefined : { tur: "dis", ad: "Search Console'u aç", adres: "https://search.google.com/search-console" } },
    { id: "plan", grup: "Kanallar", baslik: "Büyüme planı hazır", aciklama: "Hedef kitle, kanallar, 30 günlük takvim ve bütçe.", otomatik: !!v.plan, elle: false, kanit: v.plan ? "Plan kayıtlı" : undefined, eylem: v.plan ? undefined : { tur: "bolum", ad: "Plan çıkar", bolum: "plan" } },
    { id: "sosyal", grup: "Kanallar", baslik: "Sosyal hesaplar açıldı", aciklama: "Planındaki kanallarda işletme hesabı aç ve sitenin altına bağlantılarını koy.", otomatik: sosyalEslesme.length > 0, elle: sosyalEslesme.length === 0,
      kanit: sosyalEslesme.length ? `Sitede ${[...new Set(sosyalEslesme.map((s) => SOSYAL_AD[s] ?? s))].join(", ")} bağlantısı var` : undefined,
      eylem: sosyalEslesme.length ? undefined : { tur: "ajan", ad: "Bağlantıları ekle", istem: "Sitenin alt bilgisine sosyal medya hesap bağlantıları için gerçek marka simgeli bir bölüm ekle. Adresleri bilmiyorsan bana sor; uydurma adres yazma." } },
    { id: "gonderi", grup: "Kanallar", baslik: "İlk 10 gönderi hazır", aciklama: "Lansman haftasında boş görünmemek için en az 10 hazır gönderi.", otomatik: hazir >= 10, elle: false, ilerleme: [Math.min(10, hazir), 10],
      kanit: hazir >= 10 ? `${hazir} gönderi hazır` : undefined, eylem: hazir >= 10 ? undefined : { tur: "bolum", ad: "Gönderi üret", bolum: "icerik" } },
    { id: "eposta", grup: "Kanallar", baslik: "E-posta listesi formu", aciklama: "Bugün almayan ziyaretçiyi listene kat; kampanyayı sonra e-postayla duyurursun.", otomatik: !!epostaFormu, elle: false, kanit: epostaFormu ? `${epostaFormu[0]} içinde e-posta alanlı form var` : undefined,
      eylem: epostaFormu ? undefined : { tur: "ajan", ad: "Ajana ekle", istem: "Ana sayfaya kısa bir bülten kayıt formu ekle (e-posta alanı ve onay kutusu). Gönderimler Vayra gelen kutusuna düşsün; teşekkür mesajı göster." } },
  ];
}
