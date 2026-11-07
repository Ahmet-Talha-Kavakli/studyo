/**
 * Vayra Build Büyüme: yapay zekâ görünürlüğü (GEO, AEO). ChatGPT arama, Perplexity, Gemini ve Google Yapay Zekâ Özeti
 * gibi yanıt motorlarının siteyi okuyup kaynak gösterebilmesine hazırlık denetimi. Saf: istemci ve sunucu kullanır.
 *
 * Ölçtüğü: erişim (robots, llms.txt, sunucuda metin), yapılandırılmış veri, yanıt hazırlığı (SSS, soru başlıkları, kısa
 * paragraflar), güven ve kaynak gösterilebilirlik (ad, adres, telefon, hakkımızda, yazar ve tarih), tazelik.
 * Ölçmediği: motorların seni gerçekten anıp anmadığı. Onu "anılma testi" ölçer (anahtar varsa gerçek API çağrısı).
 */
import type { Proje } from "./tipler";

export type GorunurlukKategori = "erisim" | "veri" | "yanit" | "guven" | "tazelik";
export const KATEGORILER: { id: GorunurlukKategori; ad: string; alt: string }[] = [
  { id: "erisim", ad: "Erişim", alt: "Yanıt motorları siteyi okuyabiliyor mu" },
  { id: "veri", ad: "Yapılandırılmış veri", alt: "İşletme, ürün ve SSS şema ile anlatılmış mı" },
  { id: "yanit", ad: "Yanıt hazırlığı", alt: "Sorulara doğrudan alıntılanacak cevap var mı" },
  { id: "guven", ad: "Güven ve kaynak", alt: "Kim olduğun, nerede olduğun ve kimin yazdığı açık mı" },
  { id: "tazelik", ad: "Tazelik", alt: "İçerik güncel mi" },
];
export type GorunurlukBulgu = {
  id: string; kategori: GorunurlukKategori; durum: "tamam" | "uyari" | "hata"; agirlik: number; baslik: string; ayrinti: string;
  /** Build ajanına giden düzeltme istemi. */ istem?: string;
  /** Sunucunun doğrudan yapabildiği düzeltme. */ dogrudan?: "llms";
};
export type GorunurlukSonuc = { puan: number; kategoriler: { id: GorunurlukKategori; puan: number; sorun: number }[]; bulgular: GorunurlukBulgu[]; zaman: number; sayfa: number };
export type AnilmaMotor = "chatgpt" | "perplexity" | "gemini";
export const MOTORLAR: { id: AnilmaMotor; ad: string; anahtar: string; alt: string }[] = [
  { id: "chatgpt", ad: "ChatGPT arama", anahtar: "OPENAI_API_KEY", alt: "OpenAI Responses API, web araması açık" },
  { id: "perplexity", ad: "Perplexity", anahtar: "PERPLEXITY_API_KEY", alt: "Sonar modeli, kaynak listesiyle" },
  { id: "gemini", ad: "Gemini", anahtar: "GEMINI_API_KEY", alt: "Google Arama dayanaklı yanıt" },
];
export type AnilmaSonuc = { id: string; motor: AnilmaMotor; soru: string; anildi: boolean; kaynakta: boolean; adGecti: boolean; sira?: number; kaynaklar: string[]; ozet: string; zaman: number; hata?: string };
export type GorunurlukVeri = { sorular: string[]; testler: AnilmaSonuc[]; gecmis: { z: number; puan: number; anilma?: number }[]; son?: GorunurlukSonuc };

/** Yanıt motoru tarayıcıları: arama (kaynak gösterme) ve eğitim ayrımıyla. */
export const AI_BOTLAR: { ad: string; amac: "arama" | "egitim"; sahip: string }[] = [
  { ad: "OAI-SearchBot", amac: "arama", sahip: "ChatGPT arama" }, { ad: "ChatGPT-User", amac: "arama", sahip: "ChatGPT kullanıcı ziyareti" },
  { ad: "PerplexityBot", amac: "arama", sahip: "Perplexity" }, { ad: "Bingbot", amac: "arama", sahip: "Bing ve Copilot (ChatGPT arama da Bing dizinini kullanır)" },
  { ad: "Googlebot", amac: "arama", sahip: "Google ve Yapay Zekâ Özeti" }, { ad: "Applebot", amac: "arama", sahip: "Siri ve Spotlight" },
  { ad: "GPTBot", amac: "egitim", sahip: "OpenAI model eğitimi" }, { ad: "Google-Extended", amac: "egitim", sahip: "Gemini eğitimi" },
  { ad: "ClaudeBot", amac: "egitim", sahip: "Anthropic eğitimi" }, { ad: "CCBot", amac: "egitim", sahip: "Common Crawl" },
];

/** robots.txt: verilen tarayıcı kök dizine erişemiyor mu (en özel grup kuralı; Allow: / varsa engel sayılmaz). */
export function robotsEngelli(robots: string, bot: string): boolean {
  const gruplar: { ajanlar: string[]; kurallar: { izin: boolean; yol: string }[] }[] = [];
  let g: (typeof gruplar)[number] | null = null, kuralGeldi = false;
  for (const ham of robots.split(/\r?\n/)) {
    const s = ham.replace(/#.*/, "").trim();
    const m = /^([a-z-]+)\s*:\s*(.*)$/i.exec(s);
    if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === "user-agent") { if (!g || kuralGeldi) { g = { ajanlar: [], kurallar: [] }; gruplar.push(g); kuralGeldi = false; } g.ajanlar.push(v.toLowerCase()); }
    else if ((k === "disallow" || k === "allow") && g) { kuralGeldi = true; g.kurallar.push({ izin: k === "allow", yol: v }); }
  }
  const b = bot.toLowerCase();
  const grup = gruplar.find((x) => x.ajanlar.includes(b)) ?? gruplar.find((x) => x.ajanlar.includes("*"));
  if (!grup) return false;
  const kok = grup.kurallar.filter((x) => x.yol === "/" || x.yol === "/*");
  return kok.some((x) => !x.izin) && !kok.some((x) => x.izin);
}

const etiketsiz = (h: string) => h.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
function jsonLdTurleri(h: string): string[] {
  const l: string[] = [];
  for (const m of h.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const gez = (x: unknown) => { if (Array.isArray(x)) x.forEach(gez); else if (x && typeof x === "object") { const o = x as Record<string, unknown>; const t = o["@type"]; if (typeof t === "string") l.push(t); else if (Array.isArray(t)) l.push(...t.map(String)); if (o["@graph"]) gez(o["@graph"]); if (o.mainEntity) gez(o.mainEntity); } };
      gez(JSON.parse(m[1]));
    } catch { l.push("?"); }
  }
  return l;
}
const YEREL = /LocalBusiness|Store|Restaurant|Cafe|Bakery|Salon|Dentist|Clinic|Gym|Service|Agent|Florist|Business|Repair|Lodging|Hotel|Educational|Organization/;

export type GorunurlukGirdi = {
  p: Pick<Proje, "ad" | "dosyalar" | "ayarlar" | "yayin">;
  profil?: { ad: string; telefon: string; adres: { sokak: string; il: string; ilce: string }; adresGizli: boolean; googleProfil: string; sosyal: Record<string, string>; aciklama: string };
  /** İşletme eklentisi LocalBusiness verisini tarayıcıda ekliyor mu. */ eklentiVeri?: boolean;
  yazilar?: { yayinZamani: number | null; guncelleme: number }[];
  simdi?: number;
};

/** Görünürlük denetimi (projenin taslak dosyaları ve İşletme profili üzerinden). */
export function gorunurlukDenetle(g: GorunurlukGirdi): GorunurlukSonuc {
  const { p } = g;
  const simdi = g.simdi ?? Date.now();
  const sayfalar = Object.keys(p.dosyalar).filter((y) => y.endsWith(".html") && y !== "404.html" && !/-b\.html$/.test(y));
  const ana = p.dosyalar["index.html"] ?? "";
  const hepsi = sayfalar.map((y) => p.dosyalar[y]).join("\n");
  const metinHepsi = etiketsiz(hepsi);
  const b: GorunurlukBulgu[] = [];
  const ekle = (x: GorunurlukBulgu) => b.push({ ...x, istem: x.durum === "tamam" ? undefined : x.istem });
  const UYDURMA = "Projede ya da İşletme profilinde olmayan adres, telefon, fiyat, ödül ya da istatistik uydurma; bilmediğin yeri boş bırak ve bana söyle.";

  /* Erişim */
  ekle({ id: "yayin", kategori: "erisim", agirlik: 10, durum: p.yayin ? "tamam" : "hata", baslik: "Site yayında", ayrinti: p.yayin ? "Yanıt motorları yayındaki adresi tarayabilir." : "Site yayında değil; hiçbir motor okuyamaz." });
  ekle({ id: "indeks", kategori: "erisim", agirlik: 10, durum: p.ayarlar.seo.indeks ? "tamam" : "hata", baslik: "Arama motorlarına açık", ayrinti: p.ayarlar.seo.indeks ? "robots.txt bütün tarayıcılara izin veriyor." : "SEO ayarında dizine eklenme kapalı; robots.txt bütün tarayıcıları engelliyor." });
  const robots = p.dosyalar["robots.txt"];
  if (robots && p.ayarlar.seo.indeks) {
    const engel = AI_BOTLAR.filter((x) => robotsEngelli(robots, x.ad));
    const arama = engel.filter((x) => x.amac === "arama"), egitim = engel.filter((x) => x.amac === "egitim");
    ekle({ id: "robots-arama", kategori: "erisim", agirlik: 9, durum: arama.length ? "hata" : "tamam", baslik: "Arama tarayıcılarına izin", ayrinti: arama.length ? `robots.txt şunları engelliyor: ${arama.map((x) => `${x.ad} (${x.sahip})`).join(", ")}. Engellenen motor siteyi kaynak gösteremez.` : "OAI-SearchBot, PerplexityBot, Bingbot ve Googlebot siteye erişebiliyor.", istem: `robots.txt dosyasında ${arama.map((x) => x.ad).join(", ")} tarayıcılarının engelini kaldır; diğer kuralları koru.` });
    ekle({ id: "robots-egitim", kategori: "erisim", agirlik: 2, durum: egitim.length ? "uyari" : "tamam", baslik: "Eğitim tarayıcıları", ayrinti: egitim.length ? `${egitim.map((x) => x.ad).join(", ")} engelli. Bu yalnız model eğitimini etkiler; arama görünürlüğünü doğrudan düşürmez. Bilinçli bir tercihse sorun yok.` : "Eğitim tarayıcılarına da izin var." });
  }
  const llms = p.dosyalar["llms.txt"];
  const llmsIyi = !!llms && /^#\s+\S/m.test(llms) && /^>\s+\S/m.test(llms) && (llms.match(/\]\(/g)?.length ?? 0) >= 1 && llms.length > 200;
  ekle({ id: "llms", kategori: "erisim", agirlik: 7, durum: llmsIyi ? "tamam" : "uyari", dogrudan: "llms", baslik: "llms.txt", ayrinti: llms ? (llmsIyi ? "Projede özet ve bağlantılarıyla bir llms.txt var." : "llms.txt var ama kısa; özet satırı, işletme bilgisi ve sayfa bağlantıları eksik.") : "Yayında yalnız sayfa listesinden oluşan otomatik llms.txt var. İşletme özeti, hizmetler, iletişim ve SSS eklenmiş bir dosya modellerin seni doğru anlatmasını kolaylaştırır.", istem: `Kök dizine llms.txt yaz (llmstxt.org biçimi): "# Ad", "> tek cümlelik özet", işletme bilgileri, hizmetler ve ürünler, iletişim, önemli sayfaların bağlantıları ve sık sorulan sorular. ${UYDURMA}` });
  const bos = sayfalar.filter((y) => { const h = p.dosyalar[y]; const k = etiketsiz(h.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? h).split(" ").filter(Boolean).length; return k < 60 && /<script/i.test(h); });
  ekle({ id: "sunucu-metin", kategori: "erisim", agirlik: 8, durum: bos.length ? "hata" : "tamam", baslik: "Metin sayfanın içinde", ayrinti: bos.length ? `${bos.slice(0, 4).join(", ")} sayfalarında metin betikle çiziliyor. Yanıt motorlarının çoğu betik çalıştırmaz; sayfayı boş görür.` : "Sayfa metinleri HTML'in içinde; betik çalıştırmayan tarayıcılar da okuyabilir.", istem: `${bos.slice(0, 4).join(", ")} sayfalarında ana metni (başlıklar, açıklamalar, ürün ve hizmet bilgisi) betikle sonradan çizmek yerine doğrudan HTML'e yaz; etkileşim için betik kalabilir.` });

  /* Yapılandırılmış veri */
  const anaTur = jsonLdTurleri(ana);
  const yerel = anaTur.some((t) => YEREL.test(t));
  ekle({ id: "ld-isletme", kategori: "veri", agirlik: 9, durum: yerel ? "tamam" : g.eklentiVeri ? "uyari" : "hata", baslik: "İşletme şeması (Organization ya da LocalBusiness)", ayrinti: yerel ? `Ana sayfada ${anaTur.filter((t) => YEREL.test(t)).join(", ")} şeması var.` : g.eklentiVeri ? "İşletme eklentisi LocalBusiness verisini tarayıcıda ekliyor. Google bunu okur ama betik çalıştırmayan motorlar göremez; şemayı sayfaya göm." : "Ana sayfada işletmeyi anlatan şema yok.", istem: `index.html sayfasının <head> bölümüne İşletme profilindeki bilgilerle schema.org ${g.profil?.adresGizli ? "Organization" : "LocalBusiness"} JSON-LD göm (name, url, description, telephone, address, openingHoursSpecification, sameAs). ${UYDURMA}` });
  const sssSayfa = sayfalar.filter((y) => /sıkça sorulan|sık sorulan|s\.s\.s|<details/i.test(p.dosyalar[y]));
  const faqLd = sayfalar.some((y) => jsonLdTurleri(p.dosyalar[y]).includes("FAQPage"));
  ekle({ id: "ld-sss", kategori: "veri", agirlik: 6, durum: faqLd ? "tamam" : sssSayfa.length ? "uyari" : "hata", baslik: "SSS şeması (FAQPage)", ayrinti: faqLd ? "FAQPage şeması var." : sssSayfa.length ? `${sssSayfa.join(", ")} sayfasında soru cevap bölümü var ama FAQPage şeması yok.` : "Soru cevap bölümü ve şeması yok.", istem: sssSayfa.length ? `${sssSayfa.join(", ")} sayfasındaki soru ve cevapları schema.org FAQPage JSON-LD olarak da ekle; metinler sayfadakiyle birebir aynı olsun.` : `Ana sayfaya ziyaretçilerin gerçekten sorduğu 5 ile 8 soruluk bir "Sıkça sorulan sorular" bölümü ekle (details ve summary ile), aynı içeriği FAQPage JSON-LD olarak da göm. ${UYDURMA}` });
  const urunSayfa = sayfalar.filter((y) => /(?:₺|\bTL\b)\s?\d|\d[\d.,]*\s?(?:₺|TL\b)/.test(etiketsiz(p.dosyalar[y])));
  const urunLd = sayfalar.some((y) => jsonLdTurleri(p.dosyalar[y]).some((t) => /Product|Offer|Menu/.test(t)));
  if (urunSayfa.length) ekle({ id: "ld-urun", kategori: "veri", agirlik: 5, durum: urunLd ? "tamam" : "uyari", baslik: "Ürün ve fiyat şeması", ayrinti: urunLd ? "Ürün ya da menü şeması var." : `${urunSayfa.slice(0, 3).join(", ")} sayfalarında fiyat var ama Product ya da Menu şeması yok; motorlar fiyatı güvenle alıntılayamaz.`, istem: `${urunSayfa.slice(0, 3).join(", ")} sayfalarındaki ürün ya da hizmetler için sayfadaki fiyatlarla birebir aynı schema.org Product (offers ile) ya da Menu JSON-LD ekle.` });
  const blog = sayfalar.filter((y) => /^blog\/.+\.html$/.test(y));
  if (blog.length) { const art = blog.filter((y) => jsonLdTurleri(p.dosyalar[y]).some((t) => /Article|BlogPosting/.test(t))).length; ekle({ id: "ld-yazi", kategori: "veri", agirlik: 4, durum: art === blog.length ? "tamam" : art ? "uyari" : "hata", baslik: "Yazı şeması (Article)", ayrinti: `${blog.length} yazının ${art} tanesinde Article şeması var.` }); }
  const sosyal = Object.values(g.profil?.sosyal ?? {}).filter(Boolean).length + (g.profil?.googleProfil ? 1 : 0);
  const sameAs = /"sameAs"/.test(ana);
  ekle({ id: "sameas", kategori: "veri", agirlik: 4, durum: sameAs ? "tamam" : "uyari", baslik: "Hesapların bağlantısı (sameAs)", ayrinti: sameAs ? "Şemada sosyal hesaplar ve profiller bağlı." : sosyal ? "İşletme profilinde sosyal hesaplar var ama şemada sameAs yok; motorlar hesapların aynı işletmeye ait olduğunu bilemez." : "Sosyal hesap ya da Google İşletme Profili bağlantısı yok.", istem: "Ana sayfadaki işletme şemasına İşletme profilindeki sosyal hesapları ve Google İşletme Profili adresini sameAs olarak ekle." });

  /* Yanıt hazırlığı */
  const sorular = [...hepsi.matchAll(/<(h2|h3|summary|dt)[^>]*>([\s\S]*?)<\/\1>/gi)].map((m) => etiketsiz(m[2])).filter((s) => /\?\s*$/.test(s));
  ekle({ id: "sss", kategori: "yanit", agirlik: 9, durum: sorular.length >= 4 ? "tamam" : sorular.length ? "uyari" : "hata", baslik: "Soru cevap bölümü", ayrinti: sorular.length ? `${sorular.length} soru biçimli başlık var: ${sorular.slice(0, 3).join(" ")}` : "Sitede soru biçiminde başlık yok. Yanıt motorları en çok soruya doğrudan cevap veren paragrafları alıntılar.", istem: `Siteye müşterilerin gerçekten sorduğu sorulara (fiyat, teslimat, çalışma saatleri, randevu, iade gibi) kısa ve doğrudan cevaplar veren bir SSS bölümü ekle; her cevap 40 ile 80 sözcük, ilk cümlesi soruyu tek başına cevaplasın. ${UYDURMA}` });
  const paragraflar = [...hepsi.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => etiketsiz(m[1]).split(" ").filter(Boolean).length).filter((n) => n >= 8);
  const uzun = paragraflar.filter((n) => n > 120).length;
  ekle({ id: "paragraf", kategori: "yanit", agirlik: 5, durum: !paragraflar.length ? "hata" : uzun > paragraflar.length / 3 ? "uyari" : "tamam", baslik: "Alıntılanabilir kısa paragraflar", ayrinti: !paragraflar.length ? "Sayfalarda paragraf metni yok denecek kadar az." : uzun ? `${paragraflar.length} paragraftan ${uzun} tanesi 120 sözcükten uzun; motorlar uzun metinden parça seçmekte zorlanır.` : `${paragraflar.length} paragraf var, çoğu kısa ve tek başına anlamlı.`, istem: "Uzun paragrafları her biri tek bir fikri anlatan 40 ile 90 sözcüklük paragraflara böl; her bölümün ilk cümlesi konuyu özetlesin." });
  const liste = /<(ul|ol|table)[\s>]/i.test(hepsi);
  ekle({ id: "liste", kategori: "yanit", agirlik: 3, durum: liste ? "tamam" : "uyari", baslik: "Liste ve tablolar", ayrinti: liste ? "Hizmetler, fiyatlar ya da adımlar listeyle verilmiş." : "Liste ya da tablo yok; karşılaştırma ve fiyat bilgisi listeyle daha kolay alıntılanır.", istem: "Hizmetleri, fiyatları ya da adımları uygun yerlerde madde listesi ya da tabloyla ver." });
  const ad = (g.profil?.ad || p.ad).trim().toLocaleLowerCase("tr-TR");
  const ilkP = etiketsiz(ana.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "").toLocaleLowerCase("tr-TR");
  const h1 = etiketsiz(ana.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "").toLocaleLowerCase("tr-TR");
  const tanim = !!ad && (ilkP.includes(ad) || h1.includes(ad));
  ekle({ id: "tanim", kategori: "yanit", agirlik: 5, durum: tanim ? "tamam" : "uyari", baslik: "Açık tanım cümlesi", ayrinti: tanim ? "Ana sayfa işletmenin adını ve ne yaptığını ilk bölümde söylüyor." : "Ana sayfanın ilk bölümünde işletmenin adı ve ne yaptığı tek cümleyle söylenmiyor.", istem: `index.html sayfasının ilk paragrafını "${g.profil?.ad || p.ad}, [şehir]'de [ne yaptığı] [kime hizmet veren] bir [işletme türü]." biçiminde açık bir tanım cümlesiyle başlat. ${UYDURMA}` });

  /* Güven ve kaynak */
  const rakam = (s: string) => s.replace(/\D/g, "").slice(-10);
  const tel = g.profil?.telefon ? rakam(g.profil.telefon) : "";
  const telVar = tel.length >= 7 && hepsi.replace(/\D/g, "").includes(tel);
  const adresVar = !!g.profil && !g.profil.adresGizli && !!g.profil.adres.il && metinHepsi.toLocaleLowerCase("tr-TR").includes(g.profil.adres.il.toLocaleLowerCase("tr-TR"));
  ekle({ id: "nap", kategori: "guven", agirlik: 8, durum: !g.profil?.ad ? "uyari" : telVar && (adresVar || g.profil.adresGizli) ? "tamam" : telVar || adresVar ? "uyari" : "hata", baslik: "Ad, adres ve telefon sayfada", ayrinti: !g.profil?.ad ? "İşletme profili doldurulmamış; ad, adres ve telefon tutarlılığı denetlenemedi." : `${telVar ? "Telefon sayfada geçiyor" : "Telefon sayfa metninde yok"}; ${g.profil.adresGizli ? "adres gizli (hizmet bölgesi)" : adresVar ? "şehir sayfada geçiyor" : "adres sayfa metninde yok"}.`, istem: `Sitenin alt bilgisine ve iletişim bölümüne İşletme profilindeki ad, ${g.profil?.adresGizli ? "hizmet bölgesi" : "açık adres"} ve telefonu düz metin olarak yaz; her sayfada aynı biçimde olsun.` });
  const hakkinda = sayfalar.some((y) => /hakkimizda|hakkinda|about|biz-kimiz/i.test(y)) || /hakkımızda|biz kimiz/i.test(metinHepsi);
  ekle({ id: "hakkinda", kategori: "guven", agirlik: 5, durum: hakkinda ? "tamam" : "uyari", baslik: "Hakkımızda bölümü", ayrinti: hakkinda ? "Kim olduğunu anlatan bir bölüm var." : "İşletmenin kim olduğunu, ne zamandır çalıştığını ve ekibini anlatan bir bölüm yok.", istem: `Bir "Hakkımızda" bölümü ya da sayfası ekle: işletmenin hikâyesi, ne yaptığı, kime hizmet verdiği ve nerede olduğu. ${UYDURMA}` });
  if (blog.length) { const yazar = blog.filter((y) => /<time|datetime=|yazar|author/i.test(p.dosyalar[y])).length; ekle({ id: "yazar", kategori: "guven", agirlik: 4, durum: yazar === blog.length ? "tamam" : yazar ? "uyari" : "hata", baslik: "Yazar ve tarih", ayrinti: `${blog.length} yazının ${yazar} tanesinde yazar ya da tarih görünüyor.` }); }
  const somut = (metinHepsi.match(/\b(19|20)\d{2}\b|\b\d+\s?(yıl|yıldır|müşteri|ürün|şube|dakika|gün)\b/gi)?.length ?? 0) >= 3;
  ekle({ id: "somut", kategori: "guven", agirlik: 3, durum: somut ? "tamam" : "uyari", baslik: "Somut bilgiler", ayrinti: somut ? "Yıl, süre ya da sayı gibi alıntılanabilir somut bilgiler var." : "Kuruluş yılı, teslim süresi, çalışma saatleri gibi somut bilgiler az; motorlar genel cümleleri alıntılamaz.", istem: `Sayfalara gerçek ve doğrulanabilir somut bilgiler ekle: kuruluş yılı, teslim ya da hizmet süresi, çalışma saatleri, hizmet bölgesi. ${UYDURMA}` });
  ekle({ id: "gbp", kategori: "guven", agirlik: 4, durum: g.profil?.googleProfil ? "tamam" : "uyari", baslik: "Google İşletme Profili", ayrinti: g.profil?.googleProfil ? "Google İşletme Profili bağlantısı kayıtlı." : "Google İşletme Profili bağlantısı yok. Gemini ve Google Yapay Zekâ Özeti yerel soruların çoğunda bu profili kullanır." });
  const bing = /<meta[^>]+name=["']msvalidate\.01["']/i.test(ana);
  ekle({ id: "bing", kategori: "guven", agirlik: 4, durum: bing ? "tamam" : "uyari", baslik: "Bing Webmaster doğrulaması", ayrinti: bing ? "Bing doğrulama etiketi var." : "ChatGPT arama ve Copilot büyük ölçüde Bing dizinini kullanır. Bing Webmaster Tools'ta siteyi doğrula ve site haritasını gönder.", istem: "Bing Webmaster Tools'un verdiği msvalidate.01 doğrulama etiketini index.html'in <head> bölümüne ekle. Etiketin değerini bana sor; uydurma." });

  /* Tazelik */
  const gun = p.yayin ? Math.floor((simdi - p.yayin.zaman) / 864e5) : null;
  ekle({ id: "guncel", kategori: "tazelik", agirlik: 4, durum: gun === null ? "uyari" : gun <= 90 ? "tamam" : "uyari", baslik: "Son yayın", ayrinti: gun === null ? "Henüz yayın yok." : gun <= 90 ? `Son yayın ${gun} gün önce.` : `Son yayın ${gun} gün önce; motorlar güncel kaynakları öne alır.` });
  const sonYazi = Math.max(0, ...(g.yazilar ?? []).map((y) => y.yayinZamani ?? 0));
  ekle({ id: "yazi-taze", kategori: "tazelik", agirlik: 4, durum: sonYazi && simdi - sonYazi < 60 * 864e5 ? "tamam" : "uyari", baslik: "Düzenli içerik", ayrinti: sonYazi ? `Son blog yazısı ${Math.floor((simdi - sonYazi) / 864e5)} gün önce yayımlandı.` : "Yayında blog yazısı yok; müşterilerin sorduğu sorulara cevap veren yazılar motorlarda kaynak olma şansını artırır." });
  const tarih = /dateModified|son güncelleme|güncellendi/i.test(hepsi);
  ekle({ id: "tarih", kategori: "tazelik", agirlik: 2, durum: tarih ? "tamam" : "uyari", baslik: "Güncelleme tarihi", ayrinti: tarih ? "Sayfalarda güncelleme tarihi var." : "Sayfalarda güncelleme tarihi görünmüyor.", istem: "Fiyat, menü ve hizmet sayfalarının altına görünür bir \"Son güncelleme\" tarihi ekle ve aynı tarihi şemada dateModified olarak ver." });

  const kazanc = (l: GorunurlukBulgu[]) => { const t = l.reduce((a, x) => a + x.agirlik, 0); return t ? Math.round((l.reduce((a, x) => a + (x.durum === "tamam" ? x.agirlik : x.durum === "uyari" ? x.agirlik * 0.45 : 0), 0) / t) * 100) : 100; };
  return {
    puan: kazanc(b), bulgular: b, zaman: simdi, sayfa: sayfalar.length,
    kategoriler: KATEGORILER.map((k) => { const l = b.filter((x) => x.kategori === k.id); return { id: k.id, puan: kazanc(l), sorun: l.filter((x) => x.durum !== "tamam").length }; }),
  };
}

/** Anılma testinde alan adı ve marka eşleşmesi. */
export function anilmaDenetle(metin: string, kaynaklar: string[], alanlar: string[], ad: string): { kaynakta: boolean; adGecti: boolean; sira?: number } {
  const al = alanlar.map((a) => a.replace(/^www\./, "").toLowerCase()).filter(Boolean);
  let sira: number | undefined;
  kaynaklar.forEach((u, i) => { const h = (() => { try { return new URL(u).hostname.replace(/^www\./, "").toLowerCase(); } catch { return u.toLowerCase(); } })(); if (sira === undefined && al.some((a) => h === a || h.endsWith(`.${a}`) || u.toLowerCase().includes(a))) sira = i + 1; });
  const n = ad.trim().toLocaleLowerCase("tr-TR");
  const adGecti = n.length >= 3 && metin.toLocaleLowerCase("tr-TR").includes(n);
  return { kaynakta: sira !== undefined, adGecti, sira };
}
