import { m, type UygAlan } from "./sistemUygulamaOrtak";

/**
 * Servis tetikleri (Zapier "New Order", n8n tetik düğümleri gibi). İki yol:
 *  1. Yoklama: servisin okuma eylemi aralıklarla çağrılır (sistemUygulama kimliği ve bağlantısıyla); ilk okumada
 *     mevcut öğeler yalnız işaretlenir, sonra görülmemiş her öğe için bir çalışma başlar (yoklama başına en çok 20).
 *  2. İmzalı web kancası: servis olayı sistemin web kancası adresine gönderir; gövde servisin resmî imza kuralıyla
 *     doğrulanır, imzası tutmayan istek 401 alır (sistemKancaImza.ts).
 * İşletme tetikleri: Vayra İşletme mağazası, randevu, yorum ve abone kayıtları yoklanır (dakikada bir).
 * İstemci ve sunucu ortaktır.
 */
export type ServisOlay = {
  id: string; servis: string; ad: string; alt: string;
  /** Yoklamada çağrılan okuma eylemi (servisin eylem kimliği). */
  eylem: string;
  /** Kullanıcının dolduracağı alanlar (eylemin alanlarından); verilmezse eylemin zorunlu alanları sorulur. */
  alanlar?: string[];
  /** Eyleme sabit giden değerler ya da her yoklamada hesaplananlar (ör. takvim penceresi). */
  sabit?: (ayar: Record<string, unknown>, simdi: number) => Record<string, unknown>;
  ogeler: (yanit: unknown) => unknown[];
  kimlik: (oge: unknown, sira: number) => string;
  /** Çalışmaya giden tetik verisi; verilmezse öğenin kendisi. */
  veri?: (oge: unknown, ayar: Record<string, unknown>) => unknown;
};

/** Yanıtta verilen yollardan ilk diziyi bulur (ör. "content", "data.listOrder.data"). */
const yol = (y: unknown, p: string) => p.split(".").reduce<unknown>((v, k) => (v && typeof v === "object" ? (v as Record<string, unknown>)[k] : undefined), y);
const dizi = (...yollar: string[]) => (y: unknown): unknown[] => { for (const p of yollar) { const v = p ? yol(y, p) : y; if (Array.isArray(v)) return v; if (v && typeof v === "object" && p) return [v]; } return []; };
const alan = (...adlar: string[]) => (o: unknown, i: number) => { for (const a of adlar) { const v = yol(o, a); if (v !== undefined && v !== null && v !== "") return m(v); } return `#${i}`; };
const trSaat = (t: number) => new Date(t + 3 * 3600_000).toISOString().slice(0, 16).replace("T", " ");

export const SERVIS_OLAYLARI: ServisOlay[] = [
  { id: "trendyol-siparis", servis: "trendyol", ad: "Yeni Trendyol siparişi", alt: "Yeni (Created) sipariş paketi gelince", eylem: "siparisler", sabit: () => ({ durum: "Created", boyut: "100" }), ogeler: dizi("content"), kimlik: alan("shipmentPackageId", "id") },
  { id: "trendyol-soru", servis: "trendyol", ad: "Yeni müşteri sorusu", alt: "Yanıt bekleyen soru gelince", eylem: "sorular", sabit: () => ({ durum: "WAITING_FOR_ANSWER", boyut: "100" }), ogeler: dizi("content"), kimlik: alan("id") },
  { id: "n11-siparis", servis: "n11", ad: "Yeni n11 siparişi", alt: "Yeni sipariş paketi gelince", eylem: "siparisler", sabit: () => ({ durum: "Created", boyut: "100" }), ogeler: dizi("content", ""), kimlik: alan("id", "shipmentPackageId", "orderNumber") },
  { id: "ikas-siparis", servis: "ikas", ad: "Yeni ikas siparişi", alt: "Mağazaya sipariş düşünce", eylem: "siparisler", sabit: () => ({ adet: "50" }), ogeler: dizi("data.listOrder.data"), kimlik: alan("id") },
  { id: "ticimax-siparis", servis: "ticimax", ad: "Yeni Ticimax siparişi", alt: "Entegrasyona aktarılmamış sipariş gelince", eylem: "siparisler", sabit: () => ({ aktarilan: "-1", adet: "50" }), ogeler: (y) => { const v = yol(y, "SelectSiparisResponse.SelectSiparisResult.WebSiparis"); return Array.isArray(v) ? v : v ? [v] : []; }, kimlik: alan("SiparisID", "SiparisNo") },
  { id: "shopier-siparis", servis: "shopier", ad: "Yeni Shopier siparişi", alt: "Gönderilmemiş sipariş gelince", eylem: "siparisler", sabit: () => ({ durum: "unfulfilled", boyut: "50" }), ogeler: dizi("", "data", "orders"), kimlik: alan("id") },
  { id: "shopify-siparis", servis: "shopify", ad: "Yeni Shopify siparişi", alt: "Mağazaya sipariş düşünce", eylem: "siparisler", sabit: () => ({ durum: "any", adet: "50" }), ogeler: dizi("orders"), kimlik: alan("id") },
  { id: "woo-siparis", servis: "woocommerce", ad: "Yeni WooCommerce siparişi", alt: "Herhangi bir durumdaki yeni sipariş", eylem: "siparisler", sabit: () => ({ durum: "any", adet: "50" }), ogeler: dizi(""), kimlik: alan("id") },
  { id: "sheets-satir", servis: "google-sheets", ad: "Yeni E-Tablolar satırı", alt: "Tablonun sonuna satır eklenince", eylem: "oku", alanlar: ["tablo", "aralik"], ogeler: (y) => { const v = (yol(y, "values") as unknown[][] | undefined) ?? []; return v.map((satir, i) => ({ satir: i + 1, degerler: satir, baslik: v[0] })); }, kimlik: (o) => `satir-${(o as { satir: number }).satir}`,
    veri: (o) => { const x = o as { satir: number; degerler: unknown[]; baslik: unknown[] }; return { satir: x.satir, degerler: x.degerler, alanlar: Object.fromEntries((x.baslik ?? []).map((b, i) => [m(b) || `sutun${i + 1}`, x.degerler[i] ?? ""])) }; } },
  { id: "gmail-ileti", servis: "gmail", ad: "Gmail'de yeni ileti", alt: "Aramaya uyan yeni e-posta gelince", eylem: "ara", alanlar: ["sorgu"], sabit: () => ({ adet: "25" }), ogeler: dizi("messages"), kimlik: alan("id") },
  { id: "takvim-baslangic", servis: "google-calendar", ad: "Etkinlik başlamak üzere", alt: "Takvimdeki etkinlik başlamadan önce", eylem: "listele", alanlar: ["ara", "takvim"],
    sabit: (a, z) => ({ baslangic: trSaat(z), bitis: trSaat(z + Math.max(1, Math.min(1440, Number(a.dakika) || 15)) * 60_000) }), ogeler: dizi("items"), kimlik: (o, i) => `${alan("id")(o, i)}@${alan("start.dateTime", "start.date")(o, i)}` },
  { id: "drive-dosya", servis: "google-drive", ad: "Drive klasörüne yeni dosya", alt: "Klasöre dosya eklenince", eylem: "ara", alanlar: ["klasor", "ad"], ogeler: dizi("files"), kimlik: alan("id") },
  { id: "outlook-ileti", servis: "outlook", ad: "Outlook'ta yeni okunmamış ileti", alt: "Gelen kutusuna e-posta düşünce", eylem: "gelen", sabit: () => ({ adet: "25" }), ogeler: dizi("value"), kimlik: alan("id") },
  { id: "github-cekme", servis: "github", ad: "Yeni çekme isteği", alt: "Depoda çekme isteği açılınca", eylem: "cekme", alanlar: ["depo"], ogeler: dizi(""), kimlik: alan("id") },
  { id: "jira-kayit", servis: "jira", ad: "JQL'e uyan yeni Jira kaydı", alt: "Sorguya yeni kayıt girince", eylem: "ara", alanlar: ["jql"], sabit: () => ({ adet: "50" }), ogeler: dizi("issues"), kimlik: alan("id", "key") },
  { id: "airtable-kayit", servis: "airtable", ad: "Yeni Airtable kaydı", alt: "Tabloya kayıt eklenince", eylem: "ara", alanlar: ["taban", "tablo", "formul"], sabit: () => ({ sinir: "100" }), ogeler: dizi("records"), kimlik: alan("id") },
  { id: "notion-sayfa", servis: "notion", ad: "Notion veritabanında yeni sayfa", alt: "Veritabanına sayfa eklenince", eylem: "ara", alanlar: ["veritabani", "suzgec"], sabit: () => ({ adet: "50" }), ogeler: dizi("results"), kimlik: alan("id") },
  { id: "typeform-yanit", servis: "typeform", ad: "Yeni Typeform yanıtı", alt: "Form doldurulunca", eylem: "yanitlar", alanlar: ["form"], sabit: () => ({ adet: "50" }), ogeler: dizi("items"), kimlik: alan("response_id", "token") },
  { id: "jotform-gonderim", servis: "jotform", ad: "Yeni Jotform gönderimi", alt: "Form gönderilince", eylem: "gonderimler", alanlar: ["form"], sabit: () => ({ adet: "50" }), ogeler: dizi("content"), kimlik: alan("id") },
  { id: "calendly-randevu", servis: "calendly", ad: "Yeni Calendly randevusu", alt: "Biri randevu alınca", eylem: "randevular", sabit: () => ({ adet: "50" }), ogeler: dizi("collection"), kimlik: alan("uri") },
  { id: "calcom-rezervasyon", servis: "cal-com", ad: "Yeni Cal.com rezervasyonu", alt: "Yaklaşan rezervasyon eklenince", eylem: "rezervasyonlar", sabit: () => ({ durum: "upcoming" }), ogeler: dizi("data"), kimlik: alan("uid", "id") },
  { id: "todoist-gorev", servis: "todoist", ad: "Yeni Todoist görevi", alt: "Projeye görev eklenince", eylem: "listele", alanlar: ["proje"], ogeler: dizi("results"), kimlik: alan("id") },
  { id: "clickup-gorev", servis: "clickup", ad: "Yeni ClickUp görevi", alt: "Listeye görev eklenince", eylem: "listele", alanlar: ["liste"], ogeler: dizi("tasks"), kimlik: alan("id") },
  { id: "supabase-satir", servis: "supabase", ad: "Supabase tablosunda yeni satır", alt: "Tabloya satır eklenince", eylem: "oku", alanlar: ["tablo", "suzgec"], sabit: () => ({ sinir: "100" }), ogeler: dizi(""), kimlik: alan("id") },
];
export const SERVIS_OLAY_SAYISI = SERVIS_OLAYLARI.length;
export const servisOlayBul = (id: unknown) => SERVIS_OLAYLARI.find((x) => x.id === id);
export const YOKLAMA_ARALIKLARI = [1, 5, 15, 30, 60];
/** Takvim olayının ek ayarı: kaç dakika önce. */
export const OLAY_EK_ALANLARI: Record<string, UygAlan[]> = { "takvim-baslangic": [{ ad: "dakika", etiket: "Kaç dakika önce", tur: "sayi", varsayilan: "15", yer: "15" }] };

/* ───────────── İşletme olayları ───────────── */
export type IsletmeOlay = "siparis" | "siparisAsama" | "randevu" | "randevuIptal" | "yorum" | "abone" | "terkSepet";
export const ISLETME_OLAYLARI: { id: IsletmeOlay; ad: string; alt: string }[] = [
  { id: "siparis", ad: "Yeni sipariş", alt: "Mağazada ödemesi alınan sipariş" },
  { id: "siparisAsama", ad: "Sipariş aşaması değişti", alt: "Hazırlanıyor, kargoda, teslim edildi ya da iptal" },
  { id: "randevu", ad: "Yeni randevu", alt: "Siteden ya da panelden randevu alınınca" },
  { id: "randevuIptal", ad: "Randevu iptal edildi", alt: "Müşteri ya da işletme iptal edince" },
  { id: "yorum", ad: "Yeni yorum", alt: "Ürüne ya da işletmeye yorum gelince" },
  { id: "abone", ad: "Yeni abone", alt: "Bülten ya da açılır pencereden abone olununca" },
  { id: "terkSepet", ad: "Terk edilen sepet", alt: "Ödeme sayfası açılıp 30 dakikada tamamlanmayınca" },
];

/* ───────────── İmzalı web kancaları ───────────── */
export type KancaImza = { id: string; ad: string; logo: string; sir: string; nasil: string; baslik: string };
export const KANCA_IMZALARI: KancaImza[] = [
  { id: "shopify", ad: "Shopify", logo: "/marka/baglanti/shopify.svg", sir: "SHOPIFY_WEBHOOK_SECRET", baslik: "X-Shopify-Hmac-Sha256", nasil: "Ayarlar, Bildirimler, Web kancaları bölümünün altındaki imza anahtarı (ya da uygulamanın istemci gizli anahtarı)." },
  { id: "woocommerce", ad: "WooCommerce", logo: "/marka/uyg/woocommerce.svg", sir: "WOO_WEBHOOK_SECRET", baslik: "X-WC-Webhook-Signature", nasil: "WooCommerce, Ayarlar, Gelişmiş, Web kancaları; web kancasını eklerken yazdığın gizli anahtar." },
  { id: "stripe", ad: "Stripe", logo: "/marka/baglanti/stripe.svg", sir: "STRIPE_WEBHOOK_SECRET", baslik: "Stripe-Signature", nasil: "Geliştiriciler, Web kancaları, uç noktanın whsec_ ile başlayan imza gizli anahtarı." },
  { id: "github", ad: "GitHub", logo: "/marka/github.svg", sir: "GITHUB_WEBHOOK_SECRET", baslik: "X-Hub-Signature-256", nasil: "Depo, Settings, Webhooks; eklerken yazdığın Secret." },
  { id: "meta", ad: "WhatsApp, Instagram, Messenger", logo: "/marka/whatsapp.svg", sir: "META_APP_SECRET", baslik: "X-Hub-Signature-256", nasil: "Meta geliştirici panelinde Uygulama ayarları, Temel; App Secret. Doğrulama belirteci tetikte ayrıca yazılır." },
  { id: "slack", ad: "Slack", logo: "/marka/baglanti/slack.svg", sir: "SLACK_SIGNING_SECRET", baslik: "X-Slack-Signature", nasil: "api.slack.com/apps, Basic Information, Signing Secret." },
  { id: "typeform", ad: "Typeform", logo: "/marka/baglanti/typeform.svg", sir: "TYPEFORM_WEBHOOK_SECRET", baslik: "Typeform-Signature", nasil: "Form, Connect, Webhooks; Edit ile gizli anahtar ekle." },
  { id: "calendly", ad: "Calendly", logo: "/marka/baglanti/calendly.svg", sir: "CALENDLY_WEBHOOK_SECRET", baslik: "Calendly-Webhook-Signature", nasil: "Web kancası aboneliğini oluştururken verdiğin signing_key." },
  { id: "calcom", ad: "Cal.com", logo: "/marka/uyg/cal-com.svg", sir: "CALCOM_WEBHOOK_SECRET", baslik: "X-Cal-Signature-256", nasil: "Settings, Developer, Webhooks; Secret alanı." },
  { id: "linear", ad: "Linear", logo: "/marka/linear.svg", sir: "LINEAR_WEBHOOK_SECRET", baslik: "Linear-Signature", nasil: "Settings, API, Webhooks; web kancasının Signing secret değeri." },
  { id: "paddle", ad: "Paddle", logo: "/marka/uyg/paddle.svg", sir: "PADDLE_WEBHOOK_SECRET", baslik: "Paddle-Signature", nasil: "Developer tools, Notifications; bildirim hedefinin gizli anahtarı." },
  { id: "lemonsqueezy", ad: "Lemon Squeezy", logo: "/marka/uyg/lemon-squeezy.svg", sir: "LEMONSQUEEZY_WEBHOOK_SECRET", baslik: "X-Signature", nasil: "Settings, Webhooks; eklerken yazdığın Signing secret." },
  { id: "telegram", ad: "Telegram", logo: "/marka/telegram.svg", sir: "TELEGRAM_WEBHOOK_SECRET", baslik: "X-Telegram-Bot-Api-Secret-Token", nasil: "setWebhook çağrısında secret_token olarak verdiğin değer." },
  { id: "ozel", ad: "Özel HMAC", logo: "", sir: "WEBHOOK_SECRET", baslik: "X-Signature", nasil: "Gönderen servisin HMAC-SHA256 imzasını yazdığı başlık ve gizli anahtar; imza onaltılık ya da base64, isteğe bağlı sha256= önekiyle." },
];
export const kancaImzaBul = (id: unknown) => KANCA_IMZALARI.find((x) => x.id === id);
