import type { AdaptorAlan, AdaptorId } from "./baglantiAdaptorTanim";
import { BAGLANTILAR_DUNYA } from "./baglantiKatalogDunya";
import { BAGLANTILAR_TURKIYE } from "./baglantiKatalogTurkiye";

/**
 * Bağlantı kataloğu: uzak MCP sunucusu olan servisler + Vayra adaptörleri. Logolar resmî marka işaretleri
 * (public/marka/baglanti). İstemci ve sunucu ortak.
 * Yetki: "oauth" (MCP yetkilendirmesi), "anahtar" (servisin verdiği erişim belirteci; başlık ve önek ayarlanabilir),
 * "yok" (girişsiz). oauthKayit: sunucunun istemci kaydı yöntemi (2026-11-05'te sunucuların meta verisinden okundu):
 * "dcr" dinamik kayıt, "cimd" yayınlanmış istemci kimliği, "uygulama" servis panelinde kayıtlı uygulama gerekir.
 * Uç noktalar yalnız sağlayıcı belgesi, resmî MCP kayıt defteri ya da sağlayıcının kendi alan adındaki dizin
 * kaydından alınmıştır. populerlik: Claude bağlayıcı dizininin kullanım puanı; yayin: o dizine eklenme ayı.
 */
export type BaglantiKategori = "gelistirme" | "veri" | "odeme" | "eticaret" | "web" | "uretkenlik" | "iletisim" | "pazarlama" | "otomasyon" | "tasarim" | "arama" | "seyahat"
  | "satis" | "destek" | "yapayzeka" | "medya" | "lojistik" | "finans" | "guvenlik" | "ik" | "egitim" | "saglik" | "hukuk";
export const BAGLANTI_KATEGORI: Record<BaglantiKategori, string> = {
  uretkenlik: "Üretkenlik", gelistirme: "Geliştirme", veri: "Veri", odeme: "Ödeme ve muhasebe", eticaret: "E-ticaret", web: "Web ve site",
  iletisim: "İletişim", pazarlama: "Pazarlama ve analitik", tasarim: "Tasarım", otomasyon: "Otomasyon", arama: "Arama ve araştırma", seyahat: "Seyahat",
  satis: "Satış ve CRM", destek: "Müşteri desteği", yapayzeka: "Yapay zekâ", medya: "Medya ve içerik", lojistik: "Kargo ve lojistik", finans: "Finans ve bankacılık",
  guvenlik: "Güvenlik", ik: "İnsan kaynakları", egitim: "Eğitim", saglik: "Sağlık", hukuk: "Hukuk",
};

/** REST uç noktası tanımı: yol içindeki {ad} yer tutucuları "yol" konumlu parametrelerle dolar; govde JSON şemasıdır. */
export type RestParametre = { ad: string; konum: "yol" | "sorgu" | "baslik"; zorunlu?: boolean; tur?: "string" | "integer" | "number" | "boolean"; aciklama?: string; secenekler?: string[] };
export type RestIslemTanim = {
  /** Araç adı: küçük harf, rakam, alt çizgi. */
  ad: string; baslik: string; aciklama: string; yontem: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; yol: string;
  parametreler?: RestParametre[]; govde?: Record<string, unknown>; okuma?: boolean; yikici?: boolean;
};

/** Adres şablonu alanı: url içindeki {id} yer tutucusunu doldurur. secenekler varsa değer listeden seçilir. */
export type KatalogAlan = { id: string; ad: string; ipucu?: string; ornek?: string; desen?: string; secenekler?: { id: string; ad: string; deger: string }[]; yalniz?: "oauth" | "anahtar"; ozelDeger?: boolean };

export type KatalogBaglanti = {
  id: string; ad: string; yapan: string; logo: string; url: string; kategori: BaglantiKategori; aciklama: string;
  yetki: ("oauth" | "anahtar" | "yok")[]; anahtarIpucu?: string;
  /** Salt okunur mod: sunucunun kendi salt okunur adresi. */
  saltOkunurUrl?: string;
  /** Eski alan: adres kullanıcıya göre değişir ({host}). Yeni kayıtlar `alanlar` kullanır. */
  ozelAdres?: string;
  belge: string; one?: boolean;
  /* ── v2 ── */
  yapanUrl?: string;
  oauthKayit?: "dcr" | "cimd" | "uygulama";
  /** Kendi OAuth uygulamanı nerede oluşturacağın. */
  istemciIpucu?: string;
  /** Yönteme özel adres (ör. OAuth ve anahtar için farklı uç nokta). */
  oauthUrl?: string; anahtarUrl?: string;
  anahtarBaslik?: string; anahtarOnEk?: string;
  alanlar?: KatalogAlan[];
  /** Birden çok gizli değerle giriş (ör. ikas istemci kimliği + sırrı → token). */
  kimlikAlanlari?: AdaptorAlan[];
  istemciKimligi?: { tokenUrl: string };
  resmi?: boolean; turkiye?: boolean; etkilesimli?: boolean;
  populerlik?: number; yayin?: string;
  adaptor?: AdaptorId;
  /** Koyu logo açık karoda; geniş yazı logosu daha büyük gösterilir. */
  logoAcik?: boolean; logoGenis?: boolean;
  gizlilik?: string;
  /** Araç listesi girişsiz okunabiliyor (dizinde canlı önizleme). */
  acikListe?: boolean;
  /* ── v3 ── */
  /** Bağlantı yolu: uzak MCP (varsayılan), Vayra adaptörü ya da resmî MCP sunucusu olmayan servisler için REST API. */
  yol?: "mcp" | "adaptor" | "rest";
  /**
   * REST yolu (resmî MCP yok): resmî API kökü, kimlik biçimi ve varsa servisin yayımladığı resmî OpenAPI belgesi.
   * OpenAPI varsa araçlar ondan üretilir; yoksa kullanıcı belgedeki uç noktaları kendisi ekler.
   * yetki: bearer (Authorization: Bearer), baslik (anahtarAd başlığı), sorgu (anahtarAd sorgu parametresi), temel (Basic kullanıcı:şifre), yok.
   */
  rest?: {
    taban: string; yetki: "bearer" | "baslik" | "sorgu" | "temel" | "yok"; anahtarAd?: string; openapi?: string;
    /** Ana anahtar dışında istenen başlık ya da sorgu alanları (ör. ikinci gizli anahtar, zorunlu User-Agent). deger: sabit değer. */
    ekAlanlar?: { ad: string; konum: "baslik" | "sorgu"; gizli?: boolean; aciklama?: string; deger?: string }[];
    /** Resmî belgeden alınmış hazır uç noktalar (OpenAPI yoksa araçlar bunlardan kurulur). */
    islemler?: RestIslemTanim[];
  };
  /** Ayrıntı panelindeki örnek istemler. */
  ornekler?: string[];
};

const G = "https://developers.google.com/workspace/guides/configure-mcp-servers";
const GOOGLE_ISTEMCI = "Google Cloud Console › API'ler ve Hizmetler › Kimlik bilgileri › OAuth istemci kimliği (Web uygulaması); ilgili API'yi ve MCP sunucusunu projede etkinleştir.";
const google = (id: string, ad: string, alt: string, url: string, aciklama: string, populerlik?: number, kategori: BaglantiKategori = "uretkenlik"): KatalogBaglanti => ({
  id, ad, yapan: "Google", yapanUrl: "https://workspace.google.com", logo: `/marka/baglanti/${alt}`, url, kategori, aciklama, yetki: ["oauth"], oauthKayit: "uygulama", istemciIpucu: GOOGLE_ISTEMCI,
  belge: G, resmi: true, populerlik, yayin: populerlik ? "2026-03" : undefined, acikListe: true,
});

const TEMEL: KatalogBaglanti[] = [
  /* ── Geliştirme ── */
  { id: "github", ad: "GitHub", yapan: "GitHub", yapanUrl: "https://github.com", logo: "/marka/baglanti/github.svg", url: "https://api.githubcopilot.com/mcp/", saltOkunurUrl: "https://api.githubcopilot.com/mcp/readonly", kategori: "gelistirme", one: true,
    aciklama: "Depolar, dosyalar, issue ve pull request'ler; kodu oku, dal aç, değişiklik öner.", yetki: ["anahtar", "oauth"], oauthKayit: "uygulama", anahtarIpucu: "GitHub › Settings › Developer settings › Personal access tokens › Fine-grained token",
    istemciIpucu: "GitHub › Settings › Developer settings › OAuth Apps › New OAuth App", belge: "https://github.com/github/github-mcp-server/blob/main/docs/remote-server.md", resmi: true },
  { id: "vercel", ad: "Vercel", yapan: "Vercel", yapanUrl: "https://vercel.com", logo: "/marka/baglanti/vercel.svg", url: "https://mcp.vercel.com", kategori: "gelistirme",
    aciklama: "Projeler, dağıtımlar, alan adları ve kayıtlar; kendi Vercel hesabına yayın.", yetki: ["oauth"], oauthKayit: "cimd", belge: "https://vercel.com/docs/mcp/vercel-mcp", resmi: true, populerlik: 19944, yayin: "2025-11" },
  { id: "sentry", ad: "Sentry", yapan: "Sentry", yapanUrl: "https://sentry.io", logo: "/marka/baglanti/sentry.svg", url: "https://mcp.sentry.dev/mcp", kategori: "gelistirme",
    aciklama: "Hatalar, olaylar ve sürümler; hatanın kök nedenini bul.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://docs.sentry.io/product/sentry-mcp/", resmi: true, populerlik: 19009, yayin: "2025-11" },
  { id: "cloudflare", ad: "Cloudflare", yapan: "Cloudflare", yapanUrl: "https://cloudflare.com", logo: "/marka/baglanti/cloudflare.svg", url: "https://mcp.cloudflare.com/mcp", kategori: "gelistirme",
    aciklama: "Alan adları, DNS kayıtları, Workers ve depolama; Cloudflare API'nin tamamı.", yetki: ["oauth", "anahtar"], oauthKayit: "dcr", anahtarIpucu: "Cloudflare › My Profile › API Tokens", belge: "https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/", resmi: true, populerlik: 18758, yayin: "2025-11" },
  { id: "huggingface", ad: "Hugging Face", yapan: "Hugging Face", yapanUrl: "https://huggingface.co", logo: "/marka/baglanti/huggingface.svg", url: "https://huggingface.co/mcp", kategori: "gelistirme",
    aciklama: "Model, veri kümesi ve Space ara; Space'leri araç olarak çalıştır.", yetki: ["oauth", "anahtar"], oauthKayit: "dcr", anahtarIpucu: "huggingface.co › Settings › Access Tokens", belge: "https://huggingface.co/docs/hub/hf-mcp-server", resmi: true, populerlik: 18066, yayin: "2025-11", acikListe: true },
  { id: "netlify", ad: "Netlify", yapan: "Netlify", yapanUrl: "https://www.netlify.com", logo: "/marka/baglanti/netlify.svg", url: "https://mcp.netlify.com/mcp", kategori: "gelistirme",
    aciklama: "Siteleri oluştur, dağıt ve yönet; formlar, ortam değişkenleri ve alan adları.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://docs.netlify.com/build/build-with-ai/netlify-mcp-server/", resmi: true, populerlik: 18104, yayin: "2025-11" },
  { id: "render", ad: "Render", yapan: "Render", yapanUrl: "https://render.com", logo: "/marka/baglanti/render.svg", url: "https://mcp.render.com/mcp", kategori: "gelistirme",
    aciklama: "Servisler, veritabanları, dağıtımlar, kayıtlar ve ölçümler.", yetki: ["anahtar", "oauth"], oauthKayit: "uygulama", anahtarIpucu: "Render Dashboard › Account Settings › API Keys", belge: "https://render.com/docs/mcp-server", resmi: true, populerlik: 15652, yayin: "2026-07" },
  { id: "railway", ad: "Railway", yapan: "Railway", yapanUrl: "https://railway.com", logo: "/marka/baglanti/railway.svg", url: "https://mcp.railway.com/", kategori: "gelistirme",
    aciklama: "Projeler, servisler, dağıtımlar ve değişkenler; kayıtları oku.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://docs.railway.com/reference/mcp-server", resmi: true, populerlik: 16287, yayin: "2026-07" },
  { id: "v0", ad: "v0", yapan: "Vercel", yapanUrl: "https://v0.app", logo: "/marka/baglanti/v0.svg", url: "https://v0.app/api/mcp", kategori: "gelistirme",
    aciklama: "v0 sohbetleri ve projeleri; arayüz üret ve sürümlerini getir.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://v0.app/docs/api/platform/adapters/mcp-server", resmi: true, populerlik: 14935, yayin: "2026-07" },
  { id: "lovable", ad: "Lovable", yapan: "Lovable", yapanUrl: "https://lovable.dev", logo: "/marka/baglanti/lovable.svg", url: "https://mcp.lovable.dev/", kategori: "gelistirme",
    aciklama: "Lovable projelerini oluştur, düzenle ve durumlarını izle.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://docs.lovable.dev", resmi: true, populerlik: 18855, yayin: "2026-06" },
  { id: "postman", ad: "Postman", yapan: "Postman", yapanUrl: "https://www.postman.com", logo: "/marka/baglanti/postman.svg", url: "https://mcp.postman.com/minimal", kategori: "gelistirme",
    aciklama: "Çalışma alanları, koleksiyonlar, ortamlar ve API tanımları.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://learning.postman.com/docs/developer/postman-api/postman-mcp-server/", resmi: true, populerlik: 18570, yayin: "2026-03" },
  { id: "datadog", ad: "Datadog", yapan: "Datadog", yapanUrl: "https://www.datadoghq.com", logo: "/marka/baglanti/datadog.svg", url: "https://mcp.datadoghq.com/v1/mcp", kategori: "gelistirme", logoAcik: true,
    aciklama: "Kayıtlar, ölçümler, izler, monitörler ve olaylar; sorunu sorgula.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://docs.datadoghq.com/bits_ai/mcp_server/", resmi: true, etkilesimli: true, populerlik: 19099, yayin: "2026-05" },
  { id: "incident", ad: "incident.io", yapan: "incident.io", yapanUrl: "https://incident.io", logo: "/marka/baglanti/incident.svg", url: "https://mcp.incident.io/mcp", kategori: "gelistirme",
    aciklama: "Olaylar, nöbet çizelgeleri ve olay sonrası incelemeler.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://docs.incident.io", resmi: true, populerlik: 16615, yayin: "2026-04" },
  { id: "microsoft-learn", ad: "Microsoft Learn", yapan: "Microsoft", yapanUrl: "https://learn.microsoft.com", logo: "/marka/baglanti/microsoft-learn.svg", url: "https://learn.microsoft.com/api/mcp", kategori: "gelistirme",
    aciklama: "Microsoft ve Azure belgelerinde ara, sayfa ve kod örneklerini getir; giriş gerekmez.", yetki: ["yok"], belge: "https://learn.microsoft.com/training/support/mcp", resmi: true, populerlik: 19481, yayin: "2026-02", acikListe: true },
  { id: "context7", ad: "Context7", yapan: "Upstash", yapanUrl: "https://context7.com", logo: "/marka/baglanti/context7.svg", url: "https://mcp.context7.com/mcp", oauthUrl: "https://mcp.context7.com/mcp/oauth", kategori: "gelistirme",
    aciklama: "Kütüphanelerin güncel belgelerini ve kod örneklerini getirir; anahtarsız da çalışır, anahtarla sınır yükselir.", yetki: ["yok", "anahtar", "oauth"], oauthKayit: "dcr", anahtarIpucu: "context7.com › Dashboard › API Keys", belge: "https://context7.com/docs/resources/all-clients", resmi: true, acikListe: true },

  /* ── Veri ── */
  { id: "supabase", ad: "Supabase", yapan: "Supabase", yapanUrl: "https://supabase.com", logo: "/marka/baglanti/supabase.svg", url: "https://mcp.supabase.com/mcp", saltOkunurUrl: "https://mcp.supabase.com/mcp?read_only=true", kategori: "veri", one: true,
    aciklama: "Projelerin, tabloların, SQL sorguları, şema göçleri, kayıtlar ve ayarlar.", yetki: ["oauth", "anahtar"], oauthKayit: "dcr", anahtarIpucu: "Supabase › Account › Access Tokens", belge: "https://supabase.com/docs/guides/getting-started/mcp", resmi: true, populerlik: 20165, yayin: "2026-01" },
  { id: "neon", ad: "Neon", yapan: "Neon", yapanUrl: "https://neon.com", logo: "/marka/baglanti/neon.svg", url: "https://mcp.neon.tech/mcp", saltOkunurUrl: "https://mcp.neon.tech/mcp?readonly=true", kategori: "veri",
    aciklama: "Sunucusuz Postgres: veritabanı, dal, SQL ve şema göçleri.", yetki: ["oauth", "anahtar"], oauthKayit: "dcr", anahtarIpucu: "Neon Console › Account settings › API keys", belge: "https://neon.com/docs/ai/neon-mcp-server", resmi: true, populerlik: 15390, yayin: "2026-08" },
  { id: "airtable", ad: "Airtable", yapan: "Airtable", yapanUrl: "https://airtable.com", logo: "/marka/baglanti/airtable.svg", url: "https://mcp.airtable.com/mcp", kategori: "veri",
    aciklama: "Tabanlar, tablolar ve kayıtlar; tablo verisini sorgula ve güncelle.", yetki: ["oauth", "anahtar"], oauthKayit: "dcr", anahtarIpucu: "Airtable › Builder hub › Personal access tokens", belge: "https://support.airtable.com/docs/using-the-airtable-mcp-server", resmi: true, populerlik: 19283, yayin: "2026-02" },
  { id: "planetscale", ad: "PlanetScale", yapan: "PlanetScale", yapanUrl: "https://planetscale.com", logo: "/marka/baglanti/planetscale.svg", url: "https://mcp.pscale.dev/mcp/planetscale", kategori: "veri",
    aciklama: "MySQL ve Postgres veritabanları, dallar, sorgu içgörüleri ve şema.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://planetscale.com/docs/connect/mcp", resmi: true, populerlik: 13300, yayin: "2026-02" },
  { id: "mongodb", ad: "MongoDB Atlas", yapan: "MongoDB", yapanUrl: "https://mongodb.com", logo: "/marka/baglanti/mongodb.svg", url: "https://mcp.mongodb.com/", kategori: "veri",
    aciklama: "Atlas kümeleri, veritabanları ve koleksiyonlar; sorgu ve toplama çalıştır.", yetki: ["oauth"], oauthKayit: "cimd", belge: "https://www.mongodb.com/docs/mcp-server/", resmi: true, populerlik: 14989, yayin: "2026-07" },
  google("bigquery", "BigQuery", "bigquery.svg", "https://bigquery.googleapis.com/mcp", "Veri kümeleri ve tablolar; salt okuma SQL çalıştır, iş sonuçlarını getir.", 18729, "veri"),
  google("google-sheets", "Google E-Tablolar", "google-sheets.svg", "https://sheetsmcp.googleapis.com/mcp/v1", "E-tabloları oku, hücreleri güncelle, yeni sayfa ve tablo oluştur.", undefined, "veri"),

  /* ── Ödeme ve muhasebe ── */
  { id: "stripe", ad: "Stripe", yapan: "Stripe", yapanUrl: "https://stripe.com", logo: "/marka/baglanti/stripe.svg", url: "https://mcp.stripe.com", kategori: "odeme", one: true,
    aciklama: "Müşteriler, ödemeler, ürünler, fiyatlar, abonelikler ve ödeme bağlantıları.", yetki: ["oauth", "anahtar"], oauthKayit: "dcr", anahtarIpucu: "Stripe › Developers › API keys › Restricted key (rk_ ile başlar)", belge: "https://docs.stripe.com/mcp", resmi: true, populerlik: 18940, yayin: "2025-11" },
  { id: "paypal", ad: "PayPal", yapan: "PayPal", yapanUrl: "https://paypal.com", logo: "/marka/baglanti/paypal.svg", url: "https://mcp.paypal.com/http", kategori: "odeme",
    aciklama: "Faturalar, siparişler, ödemeler ve iadeler.", yetki: ["oauth", "anahtar"], anahtarIpucu: "PayPal Developer › Apps & Credentials ile alınan erişim belirteci", belge: "https://developer.paypal.com/tools/mcp-server/", resmi: true, populerlik: 16761, yayin: "2025-11" },
  { id: "square", ad: "Square", yapan: "Square", yapanUrl: "https://squareup.com", logo: "/marka/baglanti/square.svg", url: "https://mcp.squareup.com/mcp", kategori: "odeme", logoAcik: true,
    aciklama: "Ödemeler, siparişler, katalog, müşteriler ve stok.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://developer.squareup.com/docs/mcp", resmi: true, populerlik: 15669, yayin: "2025-11" },
  { id: "xero", ad: "Xero", yapan: "Xero", yapanUrl: "https://www.xero.com", logo: "/marka/baglanti/xero.svg", url: "https://mcp.xero.com/mcp", kategori: "odeme",
    aciklama: "Faturalar, kişiler, hesaplar ve finansal raporlar.", yetki: ["oauth"], oauthKayit: "uygulama", istemciIpucu: "developer.xero.com › My Apps › New app (Web app)", belge: "https://developer.xero.com", resmi: true, etkilesimli: true, populerlik: 17799, yayin: "2026-04" },
  { id: "iyzico", ad: "iyzico", yapan: "Vayra adaptörü", yapanUrl: "https://www.iyzico.com", logo: "/marka/baglanti/iyzico.svg", url: "vayra://adaptor/iyzico", kategori: "odeme", logoAcik: true, logoGenis: true,
    aciklama: "Ödeme sorgula, günlük işlemleri ve taksitleri getir, iyzico Link ile ödeme bağlantısı oluştur.", yetki: ["anahtar"], adaptor: "iyzico", turkiye: true, yayin: "2026-11",
    anahtarIpucu: "iyzico Merchant Panel › Ayarlar › Firma Ayarları › API Anahtarları", belge: "https://docs.iyzico.com" },
  { id: "paytr", ad: "PayTR", yapan: "Vayra adaptörü", yapanUrl: "https://www.paytr.com", logo: "/marka/baglanti/paytr.svg", url: "vayra://adaptor/paytr", kategori: "odeme",
    aciklama: "Ödeme durumu, işlem dökümü, taksit oranları ve BIN sorgusu; Link API ile ödeme linki oluştur.", yetki: ["anahtar"], adaptor: "paytr", turkiye: true, yayin: "2026-11",
    anahtarIpucu: "PayTR Mağaza Paneli › Destek ve Kurulum › Entegrasyon Bilgileri", belge: "https://dev.paytr.com" },
  { id: "parasut", ad: "Paraşüt", yapan: "Vayra adaptörü", yapanUrl: "https://www.parasut.com", logo: "/marka/baglanti/parasut.png", url: "vayra://adaptor/parasut", kategori: "odeme",
    aciklama: "Müşteriler, satış faturaları, ürünler ve kasa-banka hesapları; yeni müşteri ekle.", yetki: ["oauth"], adaptor: "parasut", oauthKayit: "uygulama", turkiye: true, yayin: "2026-11",
    istemciIpucu: "Paraşüt API istemci kimliği ve sırrı için destek@parasut.com'a yaz; geri dönüş adresini aşağıdan kopyala.", belge: "https://devhub.parasut.com" },

  /* ── E-ticaret ── */
  { id: "ikas", ad: "ikas", yapan: "ikas", yapanUrl: "https://ikas.com", logo: "/marka/baglanti/ikas.svg", url: "https://api.myikas.com/api/v2/admin/mcp", kategori: "eticaret", logoAcik: true, logoGenis: true,
    aciklama: "Mağazanın ürünleri, siparişleri, müşterileri ve stokları; ikas Admin GraphQL API ile sorgula ve güncelle.", yetki: ["anahtar"], resmi: true, turkiye: true, acikListe: true,
    alanlar: [{ id: "magaza", ad: "Mağaza adı", ornek: "magazam", desen: "^[a-z0-9-]{2,60}$", ipucu: "magazam.myikas.com adresindeki ilk bölüm" }],
    kimlikAlanlari: [{ id: "istemci_id", ad: "Client ID", ipucu: "ikas Yönetim Paneli › Uygulamalar › Özel uygulama oluştur" }, { id: "istemci_gizli", ad: "Client Secret", gizli: true }],
    istemciKimligi: { tokenUrl: "https://{magaza}.myikas.com/api/admin/oauth/token" }, anahtarIpucu: "ikas Yönetim Paneli › Uygulamalar › Özel uygulama: Client ID ve Client Secret", belge: "https://ikas.dev/docs/api/getting-started/authentication" },
  { id: "trendyol", ad: "Trendyol", yapan: "Vayra adaptörü", yapanUrl: "https://partner.trendyol.com", logo: "/marka/baglanti/trendyol.svg", url: "vayra://adaptor/trendyol", kategori: "eticaret", logoAcik: true, logoGenis: true,
    aciklama: "Siparişler, onaylı ürünler ve müşteri soruları; fiyat ve stok güncelle, soruları yanıtla.", yetki: ["anahtar"], adaptor: "trendyol", turkiye: true, yayin: "2026-11",
    anahtarIpucu: "Trendyol Satıcı Paneli › Hesap Bilgilerim › Entegrasyon Bilgileri", belge: "https://developers.trendyol.com" },
  { id: "shopify", ad: "Shopify", yapan: "Shopify", yapanUrl: "https://www.shopify.com", logo: "/marka/baglanti/shopify.svg", url: "https://setup.shopify.com/mcp", kategori: "eticaret",
    aciklama: "Mağaza kur ve yönet: ürünler, koleksiyonlar, siparişler, müşteriler, stok ve indirimler.", yetki: ["yok"], belge: "https://shopify.dev/docs/apps/build/devmcp", resmi: true, etkilesimli: true, populerlik: 20064, yayin: "2026-04", acikListe: true },
  { id: "shopify-vitrin", ad: "Shopify vitrini", yapan: "Shopify", yapanUrl: "https://www.shopify.com", logo: "/marka/baglanti/shopify.svg", url: "https://{magaza}/api/mcp", kategori: "eticaret",
    aciklama: "Bir Shopify mağazasının herkese açık kataloğunda ara, sepet oluştur ve mağaza politikalarını getir.", yetki: ["yok"], belge: "https://shopify.dev/docs/apps/build/storefront-mcp", resmi: true,
    alanlar: [{ id: "magaza", ad: "Mağaza alan adı", ornek: "magazam.myshopify.com", desen: "^[a-z0-9.-]+\\.[a-z]{2,}$", ipucu: "myshopify.com adresi ya da mağazanın kendi alan adı" }] },
  { id: "wix", ad: "Wix", yapan: "Wix", yapanUrl: "https://www.wix.com", logo: "/marka/baglanti/wix.svg", url: "https://mcp.wix.com/mcp", kategori: "web", logoAcik: true,
    aciklama: "Wix siteleri, mağaza ürünleri, randevular ve içerik koleksiyonları.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://dev.wix.com/docs/sdk/articles/use-the-wix-mcp/about-the-wix-mcp", resmi: true, populerlik: 17676, yayin: "2026-01" },

  /* ── Web ve site ── */
  { id: "webflow", ad: "Webflow", yapan: "Webflow", yapanUrl: "https://webflow.com", logo: "/marka/baglanti/webflow.svg", url: "https://mcp.webflow.com/mcp", kategori: "web",
    aciklama: "Siteler, sayfalar, CMS koleksiyonları ve yayın; tasarımcı öğelerini düzenle.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://developers.webflow.com/mcp/reference/overview", resmi: true, populerlik: 18274, yayin: "2026-01" },
  { id: "wordpress", ad: "WordPress.com", yapan: "Automattic", yapanUrl: "https://wordpress.com", logo: "/marka/baglanti/wordpress.svg", url: "https://public-api.wordpress.com/wpcom/v2/mcp/v1", kategori: "web", logoAcik: true,
    aciklama: "Yazılar, sayfalar, yorumlar ve site istatistikleri.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://developer.wordpress.com/docs/mcp/", resmi: true, populerlik: 18652, yayin: "2026-01" },
  { id: "godaddy", ad: "GoDaddy", yapan: "GoDaddy", yapanUrl: "https://www.godaddy.com", logo: "/marka/baglanti/godaddy.svg", url: "https://api.godaddy.com/v1/domains/mcp", kategori: "web",
    aciklama: "Alan adı öner ve uygunluğunu denetle; giriş gerekmez.", yetki: ["yok"], belge: "https://developer.godaddy.com", resmi: true, populerlik: 16680, yayin: "2026-01", acikListe: true },

  /* ── Üretkenlik ── */
  { id: "notion", ad: "Notion", yapan: "Notion", yapanUrl: "https://notion.com", logo: "/marka/baglanti/notion.svg", url: "https://mcp.notion.com/mcp", kategori: "uretkenlik", one: true,
    aciklama: "Sayfa ve veritabanlarını ara, oku, oluştur ve güncelle; içerik kaynağı olarak kullan.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://developers.notion.com/docs/mcp", resmi: true, etkilesimli: true, populerlik: 22524, yayin: "2025-11" },
  { id: "linear", ad: "Linear", yapan: "Linear", yapanUrl: "https://linear.app", logo: "/marka/baglanti/linear.svg", url: "https://mcp.linear.app/mcp", kategori: "uretkenlik",
    aciklama: "Görevler, projeler, döngüler ve yorumlar.", yetki: ["oauth", "anahtar"], oauthKayit: "dcr", anahtarIpucu: "Linear › Settings › Security & access › Personal API keys", belge: "https://linear.app/docs/mcp", resmi: true, populerlik: 21194, yayin: "2025-11" },
  { id: "atlassian", ad: "Jira ve Confluence", yapan: "Atlassian", yapanUrl: "https://atlassian.com", logo: "/marka/baglanti/atlassian.svg", url: "https://mcp.atlassian.com/v2/mcp", kategori: "uretkenlik",
    aciklama: "Jira kayıtları, Confluence sayfaları ve Compass; ara, oluştur, güncelle.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://support.atlassian.com/atlassian-rovo-mcp-server/docs/getting-started-with-the-atlassian-remote-mcp-server/", resmi: true, populerlik: 21994, yayin: "2025-11" },
  { id: "trello", ad: "Trello", yapan: "Atlassian", yapanUrl: "https://trello.com", logo: "/marka/baglanti/trello.svg", url: "https://mcp.trello.com/v1", kategori: "uretkenlik",
    aciklama: "Panolar, listeler ve kartlar; kart oluştur ve taşı.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://support.atlassian.com/trello/", resmi: true, populerlik: 18490, yayin: "2026-07" },
  { id: "asana", ad: "Asana", yapan: "Asana", yapanUrl: "https://asana.com", logo: "/marka/baglanti/asana.svg", url: "https://mcp.asana.com/v2/mcp", kategori: "uretkenlik",
    aciklama: "Görevler, projeler, hedefler ve portföyler.", yetki: ["oauth"], oauthKayit: "uygulama", istemciIpucu: "app.asana.com/0/my-apps › Create new app › OAuth", belge: "https://developers.asana.com/docs/using-asanas-mcp-server", resmi: true, etkilesimli: true, populerlik: 21211, yayin: "2025-11" },
  { id: "monday", ad: "monday.com", yapan: "monday.com", yapanUrl: "https://monday.com", logo: "/marka/baglanti/monday.svg", url: "https://mcp.monday.com/mcp", kategori: "uretkenlik",
    aciklama: "Panolar, öğeler, sütunlar ve güncellemeler; iş akışlarını yönet.", yetki: ["oauth", "anahtar"], oauthKayit: "dcr", anahtarIpucu: "monday.com › Profil › Developers › My access tokens", belge: "https://developer.monday.com/api-reference/docs/mcp-api-token", resmi: true, etkilesimli: true, populerlik: 21094, yayin: "2025-11" },
  { id: "clickup", ad: "ClickUp", yapan: "ClickUp", yapanUrl: "https://clickup.com", logo: "/marka/baglanti/clickup.svg", url: "https://mcp.clickup.com/mcp", kategori: "uretkenlik",
    aciklama: "Görevler, listeler, belgeler ve zaman kayıtları.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://developer.clickup.com/docs/connect-an-ai-assistant-to-clickups-mcp-server", resmi: true, populerlik: 19171, yayin: "2026-01" },
  { id: "todoist", ad: "Todoist", yapan: "Doist", yapanUrl: "https://todoist.com", logo: "/marka/baglanti/todoist.svg", url: "https://ai.todoist.net/mcp", kategori: "uretkenlik",
    aciklama: "Görevler, projeler ve etiketler; günün planını çıkar.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://www.todoist.com/help", resmi: true, populerlik: 18701, yayin: "2026-05" },
  google("google-drive", "Google Drive", "google-drive.svg", "https://drivemcp.googleapis.com/mcp/v1", "Dosyalarda ara, içerik ve izinleri oku, yeni dosya oluştur.", 24928),
  google("google-docs", "Google Dokümanlar", "google-docs.svg", "https://docsmcp.googleapis.com/mcp/v1", "Dokümanları oku, yeni doküman oluştur ve metni düzenle."),
  google("google-slides", "Google Slaytlar", "google-slides.svg", "https://slidesmcp.googleapis.com/mcp/v1", "Sunumları oku, slayt ekle ve içeriği güncelle."),
  google("google-calendar", "Google Takvim", "google-calendar.svg", "https://calendarmcp.googleapis.com/mcp/v1", "Etkinlikleri listele, boş zaman bul, toplantı oluştur.", 24194),
  { id: "calendly", ad: "Calendly", yapan: "Calendly", yapanUrl: "https://calendly.com", logo: "/marka/baglanti/calendly.svg", url: "https://mcp.calendly.com", kategori: "uretkenlik",
    aciklama: "Etkinlik türleri, randevular ve davetliler.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://developer.calendly.com/calendly-mcp-server", resmi: true, populerlik: 17714, yayin: "2026-03" },
  { id: "zoom", ad: "Zoom", yapan: "Zoom", yapanUrl: "https://zoom.com", logo: "/marka/baglanti/zoom.svg", url: "https://mcp.zoom.us/mcp/zoom/streamable", kategori: "uretkenlik",
    aciklama: "Toplantılar, kayıtlar ve toplantı özetleri.", yetki: ["oauth"], oauthKayit: "uygulama", istemciIpucu: "marketplace.zoom.us › Develop › Build App › General App (OAuth)", belge: "https://developers.zoom.us", resmi: true, populerlik: 19952, yayin: "2026-04" },
  { id: "granola", ad: "Granola", yapan: "Granola", yapanUrl: "https://www.granola.ai", logo: "/marka/baglanti/granola.svg", url: "https://mcp.granola.ai/mcp", kategori: "uretkenlik",
    aciklama: "Toplantı notları ve dökümleri; kararları ve yapılacakları çıkar.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://www.granola.ai", resmi: true, populerlik: 19777, yayin: "2026-01" },
  { id: "box", ad: "Box", yapan: "Box", yapanUrl: "https://www.box.com", logo: "/marka/baglanti/box.svg", url: "https://mcp.box.com", kategori: "uretkenlik", logoAcik: true,
    aciklama: "Dosya ve klasörler; belgelerde ara ve içerikten yanıt çıkar.", yetki: ["oauth"], oauthKayit: "uygulama", istemciIpucu: "Box Admin Console › Integrations › Box MCP Server › Integration Credentials", belge: "https://developer.box.com/guides/box-mcp/remote/", resmi: true, etkilesimli: true, populerlik: 20740, yayin: "2025-11" },
  { id: "docusign", ad: "Docusign", yapan: "Docusign", yapanUrl: "https://www.docusign.com", logo: "/marka/baglanti/docusign.png", url: "https://mcp.docusign.com/mcp", kategori: "uretkenlik",
    aciklama: "Zarflar, imza durumları ve sözleşme şablonları.", yetki: ["oauth"], oauthKayit: "uygulama", istemciIpucu: "Docusign Developer › Apps and Keys › Add App and Integration Key", belge: "https://developers.docusign.com", resmi: true, populerlik: 19069, yayin: "2026-02" },

  /* ── İletişim ── */
  { id: "slack", ad: "Slack", yapan: "Slack", yapanUrl: "https://slack.com", logo: "/marka/baglanti/slack.svg", url: "https://mcp.slack.com/mcp", kategori: "iletisim",
    aciklama: "Kanallarda ara, mesaj oku ve gönder.", yetki: ["oauth"], oauthKayit: "uygulama", istemciIpucu: "api.slack.com/apps › Create New App › OAuth & Permissions", belge: "https://docs.slack.dev/ai/mcp-server/", resmi: true, etkilesimli: true, populerlik: 22233, yayin: "2025-11" },
  google("gmail", "Gmail", "gmail.svg", "https://gmailmcp.googleapis.com/mcp/v1", "E-posta dizilerinde ara, oku, taslak hazırla ve etiketle.", 24412, "iletisim"),
  google("google-chat", "Google Chat", "google-chat.svg", "https://chatmcp.googleapis.com/mcp/v1", "Alanlardaki mesajları oku ve mesaj gönder.", undefined, "iletisim"),
  { id: "intercom", ad: "Intercom", yapan: "Intercom", yapanUrl: "https://intercom.com", logo: "/marka/baglanti/intercom.svg", url: "https://{bolge}/mcp", kategori: "iletisim", logoAcik: true,
    aciklama: "Müşteri konuşmaları, kişiler ve yardım makaleleri.", yetki: ["oauth", "anahtar"], oauthKayit: "dcr", anahtarIpucu: "Intercom Developer Hub › Your apps › Authentication › Access token", belge: "https://developers.intercom.com/docs/guides/mcp", resmi: true, populerlik: 20744, yayin: "2025-11",
    alanlar: [{ id: "bolge", ad: "Veri bölgesi", secenekler: [{ id: "us", ad: "ABD", deger: "mcp.intercom.com" }, { id: "eu", ad: "Avrupa", deger: "mcp.eu.intercom.com" }] }] },
  { id: "resend", ad: "Resend", yapan: "Resend", yapanUrl: "https://resend.com", logo: "/marka/baglanti/resend.svg", url: "https://mcp.resend.com/mcp", kategori: "iletisim",
    aciklama: "İşlemsel e-posta gönder, kitleleri ve alan adlarını yönet.", yetki: ["oauth", "anahtar"], oauthKayit: "dcr", anahtarIpucu: "Resend › API Keys", belge: "https://resend.com/docs/knowledge-base/mcp-server", resmi: true, populerlik: 16610, yayin: "2026-07" },
  { id: "netgsm", ad: "NetGSM", yapan: "Vayra adaptörü", yapanUrl: "https://www.netgsm.com.tr", logo: "/marka/baglanti/netgsm.png", url: "vayra://adaptor/netgsm", kategori: "iletisim",
    aciklama: "SMS gönder, iletim raporlarını, gelen SMS'leri, başlıkları ve bakiyeyi getir.", yetki: ["anahtar"], adaptor: "netgsm", turkiye: true, yayin: "2026-11",
    anahtarIpucu: "Netgsm paneli › Abonelik Bilgilerim › Alt Kullanıcı Hesapları › API kullanıcısı", belge: "https://www.netgsm.com.tr/dokuman" },

  /* ── Pazarlama ve analitik ── */
  { id: "hubspot", ad: "HubSpot", yapan: "HubSpot", yapanUrl: "https://www.hubspot.com", logo: "/marka/baglanti/hubspot.svg", url: "https://mcp.hubspot.com", kategori: "pazarlama",
    aciklama: "Kişiler, şirketler, fırsatlar ve CRM kayıtları.", yetki: ["oauth"], oauthKayit: "uygulama", istemciIpucu: "HubSpot › Development › Apps › Create app (MCP Auth app)", belge: "https://developers.hubspot.com/mcp", resmi: true, etkilesimli: true, populerlik: 21380, yayin: "2025-11" },
  { id: "posthog", ad: "PostHog", yapan: "PostHog", yapanUrl: "https://posthog.com", logo: "/marka/baglanti/posthog.svg", url: "https://mcp.posthog.com/mcp", kategori: "pazarlama",
    aciklama: "Ürün analitiği, huniler, özellik bayrakları ve deneyler.", yetki: ["oauth", "anahtar"], anahtarIpucu: "PostHog › Settings › Personal API keys", belge: "https://posthog.com/docs/model-context-protocol", resmi: true, etkilesimli: true, populerlik: 17982, yayin: "2026-02" },
  { id: "mixpanel", ad: "Mixpanel", yapan: "Mixpanel", yapanUrl: "https://mixpanel.com", logo: "/marka/baglanti/mixpanel.svg", url: "https://mcp.mixpanel.com/mcp", kategori: "pazarlama",
    aciklama: "Olaylar, huniler, elde tutma ve kullanıcı profilleri.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://docs.mixpanel.com/docs/features/mcp", resmi: true, etkilesimli: true, populerlik: 17281, yayin: "2026-03" },
  { id: "amplitude", ad: "Amplitude", yapan: "Amplitude", yapanUrl: "https://amplitude.com", logo: "/marka/baglanti/amplitude.svg", url: "https://mcp.amplitude.com/mcp", kategori: "pazarlama", logoAcik: true,
    aciklama: "Grafikler, panolar, deneyler ve kullanıcı davranışı.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://amplitude.com/docs/amplitude-ai/amplitude-mcp", resmi: true, etkilesimli: true, populerlik: 17887, yayin: "2025-11" },
  { id: "ahrefs", ad: "Ahrefs", yapan: "Ahrefs", yapanUrl: "https://ahrefs.com", logo: "/marka/baglanti/ahrefs.svg", url: "https://api.ahrefs.com/mcp/mcp", kategori: "pazarlama",
    aciklama: "Anahtar kelimeler, geri bağlantılar, site denetimi ve sıralamalar.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://docs.ahrefs.com/mcp/docs/introduction", resmi: true, populerlik: 18362, yayin: "2026-01" },
  { id: "apollo", ad: "Apollo.io", yapan: "Apollo.io", yapanUrl: "https://www.apollo.io", logo: "/marka/baglanti/apollo.svg", url: "https://mcp.apollo.io/mcp", kategori: "pazarlama",
    aciklama: "Kişi ve şirket arama, zenginleştirme ve satış dizileri.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://docs.apollo.io", resmi: true, populerlik: 19011, yayin: "2026-02" },
  { id: "typeform", ad: "Typeform", yapan: "Typeform", yapanUrl: "https://www.typeform.com", logo: "/marka/baglanti/typeform.svg", url: "https://{bolge}/mcp", kategori: "pazarlama",
    aciklama: "Formlar, yanıtlar ve anket sonuçları.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://www.typeform.com/developers/mcp/", resmi: true,
    alanlar: [{ id: "bolge", ad: "Veri bölgesi", secenekler: [{ id: "us", ad: "Genel", deger: "api.typeform.com" }, { id: "eu", ad: "Avrupa", deger: "api.eu.typeform.com" }] }] },
  { id: "surveymonkey", ad: "SurveyMonkey", yapan: "SurveyMonkey", yapanUrl: "https://www.surveymonkey.com", logo: "/marka/baglanti/surveymonkey.svg", url: "https://mcp.surveymonkey.com/mcp", kategori: "pazarlama",
    aciklama: "Anketler, yanıtlar ve sonuç özetleri.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://developer.surveymonkey.com", resmi: true, populerlik: 16568, yayin: "2026-04" },

  /* ── Tasarım ── */
  { id: "figma", ad: "Figma", yapan: "Figma", yapanUrl: "https://www.figma.com", logo: "/marka/baglanti/figma.svg", url: "https://mcp.figma.com/mcp", kategori: "tasarim",
    aciklama: "Tasarım dosyaları, bileşenler ve değişkenler; tasarımdan kod.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/", resmi: true, etkilesimli: true, populerlik: 22384, yayin: "2025-11" },
  { id: "canva", ad: "Canva", yapan: "Canva", yapanUrl: "https://canva.com", logo: "/marka/baglanti/canva.svg", url: "https://mcp.canva.com/mcp", kategori: "tasarim",
    aciklama: "Tasarımlarda ara, yeni tasarım oluştur, dışa aktar ve marka kitini kullan.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://www.canva.dev/docs/apps/mcp/access/", resmi: true, etkilesimli: true, populerlik: 23048, yayin: "2025-11" },
  { id: "adobe", ad: "Adobe Creative Cloud", yapan: "Adobe", yapanUrl: "https://www.adobe.com", logo: "/marka/baglanti/adobe.svg", url: "https://adobe-creativity.adobe.io/mcp", kategori: "tasarim",
    aciklama: "Görsel düzenleme, arka plan kaldırma, yeniden boyutlandırma ve Express tasarımları.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://developer.adobe.com", resmi: true, etkilesimli: true, populerlik: 20440, yayin: "2026-04" },
  { id: "miro", ad: "Miro", yapan: "Miro", yapanUrl: "https://miro.com", logo: "/marka/baglanti/miro.svg", url: "https://mcp.miro.com/", kategori: "tasarim",
    aciklama: "Panolar, yapışkan notlar, diyagramlar ve çerçeveler.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://developers.miro.com/docs/mcp-intro", resmi: true, etkilesimli: true, populerlik: 20160, yayin: "2026-02" },
  { id: "excalidraw", ad: "Excalidraw", yapan: "Excalidraw", yapanUrl: "https://excalidraw.com", logo: "/marka/baglanti/excalidraw.svg", url: "https://mcp.excalidraw.com/mcp", kategori: "tasarim",
    aciklama: "Elle çizim görünümünde diyagram ve şema oluştur; giriş gerekmez.", yetki: ["yok"], belge: "https://github.com/excalidraw", resmi: true, etkilesimli: true, populerlik: 18162, yayin: "2026-02", acikListe: true },

  /* ── Otomasyon ── */
  { id: "zapier", ad: "Zapier", yapan: "Zapier", yapanUrl: "https://zapier.com", logo: "/marka/baglanti/zapier.svg", url: "https://mcp.zapier.com/api/v1/connect", kategori: "otomasyon",
    aciklama: "Zapier hesabındaki binlerce uygulamanın eylemleri tek bağlantıda.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://docs.zapier.com/mcp/home", resmi: true, populerlik: 19476, yayin: "2025-11" },
  { id: "make", ad: "Make", yapan: "Make", yapanUrl: "https://www.make.com", logo: "/marka/baglanti/make.svg", url: "https://mcp.make.com", anahtarUrl: "https://{bolge}.make.com/mcp/v2", kategori: "otomasyon",
    aciklama: "Make senaryolarını araç olarak çalıştır.", yetki: ["oauth", "anahtar"], oauthKayit: "dcr", anahtarIpucu: "Make › Profil › API access › Add token (mcp:use kapsamı)", belge: "https://developers.make.com/mcp-server", resmi: true, populerlik: 18079, yayin: "2026-01",
    alanlar: [{ id: "bolge", ad: "Make bölgesi", yalniz: "anahtar", ozelDeger: true, desen: "^[a-z0-9-]{2,30}$", ipucu: "Make adresindeki bölge, ör. eu1.make.com", secenekler: [{ id: "eu1", ad: "eu1", deger: "eu1" }, { id: "eu2", ad: "eu2", deger: "eu2" }, { id: "us1", ad: "us1", deger: "us1" }, { id: "us2", ad: "us2", deger: "us2" }] }] },
  { id: "n8n", ad: "n8n", yapan: "n8n", yapanUrl: "https://n8n.io", logo: "/marka/baglanti/n8n.svg", url: "", ozelAdres: "https://{host}/mcp-server/http", kategori: "otomasyon",
    aciklama: "Kendi n8n sunucundaki iş akışlarını araç olarak kullan.", yetki: ["anahtar"], anahtarIpucu: "n8n › Settings › MCP Access", belge: "https://docs.n8n.io/advanced-ai/accessing-n8n-mcp-server/", resmi: true, populerlik: 17926, yayin: "2026-01",
    alanlar: [{ id: "host", ad: "Sunucu adresi", ornek: "n8n.sirketim.com", desen: "^[a-z0-9.-]+(:\\d{2,5})?$" }] },

  /* ── Arama ve araştırma ── */
  { id: "exa", ad: "Exa", yapan: "Exa", yapanUrl: "https://exa.ai", logo: "/marka/baglanti/exa.svg", url: "https://mcp.exa.ai/mcp", kategori: "arama",
    aciklama: "Yapay zekâ için web araması ve sayfa içeriği getirme; anahtarsız sınırlı, anahtarla tam.", yetki: ["yok", "anahtar"], anahtarBaslik: "x-api-key", anahtarOnEk: "", anahtarIpucu: "dashboard.exa.ai › API Keys", belge: "https://docs.exa.ai/reference/exa-mcp", resmi: true, populerlik: 18014, yayin: "2026-04", acikListe: true },
  { id: "firecrawl", ad: "Firecrawl", yapan: "Firecrawl", yapanUrl: "https://www.firecrawl.dev", logo: "/marka/baglanti/firecrawl.svg", url: "https://mcp.firecrawl.dev/v2/mcp-oauth", anahtarUrl: "https://mcp.firecrawl.dev/v2/mcp", kategori: "arama",
    aciklama: "Web sayfalarını tara, temiz Markdown'a çevir, siteyi gez ve yapılandırılmış veri çıkar.", yetki: ["oauth", "anahtar"], oauthKayit: "dcr", anahtarIpucu: "firecrawl.dev › Dashboard › API Keys (fc- ile başlar)", belge: "https://docs.firecrawl.dev/mcp-server", resmi: true, populerlik: 18449, yayin: "2026-07" },

  /* ── Seyahat ── */
  { id: "turkish-airlines", ad: "Türk Hava Yolları", yapan: "Turkish Airlines", yapanUrl: "https://www.turkishairlines.com", logo: "/marka/baglanti/turkish-airlines.svg", url: "https://mcp-app.turkishtechlab.com/mcp", kategori: "seyahat",
    aciklama: "Uçuş ara, rezervasyon ve uçuş durumunu sorgula, Miles&Smiles bilgilerini getir.", yetki: ["oauth"], oauthKayit: "dcr", belge: "https://www.turkishairlines.com", resmi: true, turkiye: true, etkilesimli: true, populerlik: 15096, yayin: "2026-05" },
];

/** Bütün katalog: temel kayıtlar + dünya servisleri + Türkiye servisleri (kimlik çakışmasında ilk kayıt kalır). */
export const BAGLANTI_KATALOGU: KatalogBaglanti[] = [...TEMEL, ...BAGLANTILAR_DUNYA, ...BAGLANTILAR_TURKIYE].filter((k, i, l) => l.findIndex((x) => x.id === k.id) === i);

/** Katalog kaydı (yoksa undefined). */
export const katalogBul = (id?: string) => (id ? BAGLANTI_KATALOGU.find((x) => x.id === id) : undefined);

/** Yönteme göre adres şablonu: OAuth ve anahtar için ayrı uç nokta tanımlıysa onu döner. */
export function katalogAdresi(k: KatalogBaglanti, yontem: "oauth" | "anahtar" | "yok"): string {
  return (yontem === "oauth" ? k.oauthUrl : yontem === "anahtar" ? k.anahtarUrl : undefined) || k.url || k.ozelAdres || "";
}

/** Şablondaki {alan} yer tutucularını doldurur. Eksik ya da geçersiz alan varsa hata metni döner. */
export function sablonDoldur(k: KatalogBaglanti, yontem: "oauth" | "anahtar" | "yok", degerler: Record<string, string>): { url: string } | { hata: string } {
  let url = katalogAdresi(k, yontem) || k.ozelAdres || "";
  for (const a of k.alanlar ?? []) {
    if (!url.includes(`{${a.id}}`)) continue;
    let v = String(degerler[a.id] ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (a.secenekler) {
      const s = a.secenekler.find((x) => x.id === v || x.deger === v) ?? (v ? undefined : a.secenekler[0]);
      if (s) v = s.deger;
      else if (!a.ozelDeger) return { hata: `${a.ad} geçersiz.` };
    }
    if (!v) return { hata: `${a.ad} gerekli.` };
    if (a.desen && !new RegExp(a.desen).test(v)) return { hata: `${a.ad} geçersiz${a.ornek ? `; örnek: ${a.ornek}` : ""}.` };
    url = url.split(`{${a.id}}`).join(v);
  }
  if (/\{[a-z_]+\}/.test(url)) return { hata: "Adres alanları eksik." };
  return { url };
}

/** Kartta gösterilen giriş rozetleri. */
export function yetkiRozetleri(k: KatalogBaglanti): ("Hesapla giriş" | "Anahtarla" | "Girişsiz")[] {
  const l: ("Hesapla giriş" | "Anahtarla" | "Girişsiz")[] = [];
  if (k.yetki.includes("oauth")) l.push("Hesapla giriş");
  if (k.yetki.includes("anahtar")) l.push("Anahtarla");
  if (k.yetki.includes("yok")) l.push("Girişsiz");
  return l;
}
