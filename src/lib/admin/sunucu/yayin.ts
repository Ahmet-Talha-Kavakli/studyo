import "server-only";
import { existsSync } from "fs";
import { mkdir, readFile, rm, statfs, writeFile } from "fs/promises";
import path from "path";
import { epostaKurulu } from "@/lib/build/bulutEposta";
import { saglayiciKurulu } from "@/lib/hesap/saglayiciAyar";
import { rolHesapla } from "@/lib/hesap/hesap";
import { ayarUyarilari, iyzicoAyar, stripeAyar } from "@/lib/odeme/ayar";
import { saglayiciDurumu } from "@/lib/saglayicilar";
import { zamanlayicilariIzle, zamanlayiciDurumlari } from "@/lib/admin/zamanlayiciIzle";
import { DEPO, tumHesaplar } from "./veri";

/**
 * Yayın hazırlığı: sunucunun canlıya çıkmaya hazır olup olmadığını madde madde denetler.
 * Ortam değişkenlerinin değeri hiçbir zaman dönmez; yalnız tanımlı olup olmadığı.
 */

export type Durum = "hazir" | "eksik" | "uyari";
export interface Madde { id: string; baslik: string; durum: Durum; ozet: string; yapilacak?: string; ayrinti?: { ad: string; deger: string }[] }
export interface Bolum { id: string; baslik: string; aciklama: string; maddeler: Madde[] }

const env = (ad: string) => (process.env[ad] ?? "").trim();
const var_ = (ad: string) => !!env(ad);
const uretim = () => process.env.NODE_ENV === "production";

/* ── Ortam değişkeni kataloğu: grup, ne işe yarar, zorunluluk ── */

export interface OrtamDegiskeni { ad: string; aciklama: string; zorunlu?: boolean; gizli?: boolean }
export interface OrtamGrubu { id: string; baslik: string; ozellik: string; degiskenler: OrtamDegiskeni[]; /** Grubun açılması için hepsi mi, biri mi yeter. */ kural: "hepsi" | "biri" | "istege-bagli" }

export const ORTAM_GRUPLARI: OrtamGrubu[] = [
  { id: "temel", baslik: "Sunucu ve alan adı", ozellik: "Bağlantılı e-postalar, sosyal giriş dönüş adresleri, Build sitelerinin alan adına yönlenmesi.", kural: "hepsi", degiskenler: [
    { ad: "VAYRA_KOKEN", aciklama: "Herkese açık kök adres (ör. https://vayra.ai).", zorunlu: true },
    { ad: "VAYRA_ANA_ALAN", aciklama: "Ana uygulamanın alan adları; diğer alan adları Build sitelerine yönlenir.", zorunlu: true },
    { ad: "VAYRA_VERI_DIZINI", aciklama: "Kalıcı veri klasörü (Docker birimi).", zorunlu: true },
    { ad: "VAYRA_IZINLI_KOKENLER", aciklama: "İsteğe bağlı ek kökenler (CSRF denetimi)." },
  ] },
  { id: "gizli", baslik: "Gizli anahtarlar", ozellik: "Kasa şifrelemesi, hediye kodu imzası, kredi işlem anahtarları.", kural: "hepsi", degiskenler: [
    { ad: "VAYRA_SIFRE_ANAHTARI", aciklama: "Build kasası ve OAuth belirteçleri bu anahtarla şifrelenir.", zorunlu: true, gizli: true },
    { ad: "VAYRA_HEDIYE_SIRRI", aciklama: "Hediye kodlarını imzalar.", zorunlu: true, gizli: true },
    { ad: "VAYRA_KREDI_TUZU", aciklama: "Kredi işlem anahtarlarının tuzu (yoksa veri klasöründe üretilir).", gizli: true },
  ] },
  { id: "eposta", baslik: "E-posta (Resend)", ozellik: "Üyelik doğrulama, şifre sıfırlama, güvenlik bildirimleri, destek yanıtları.", kural: "hepsi", degiskenler: [
    { ad: "RESEND_API_KEY", aciklama: "Resend API anahtarı.", zorunlu: true, gizli: true },
    { ad: "RESEND_FROM", aciklama: "Doğrulanmış alan adından gönderen adres.", zorunlu: true },
    { ad: "BUILD_EPOSTA_GONDEREN", aciklama: "Build sitelerinin üyelik e-postaları için ayrı gönderen." },
    { ad: "NEXT_PUBLIC_BUILD_EPOSTA_ALAN", aciklama: "Sistemlerin e-posta tetikleyicisi için gelen kutusu alan adı." },
  ] },
  { id: "odeme", baslik: "Ödeme", ozellik: "Plan, kredi, sınırsız ve hız satışları. Global satış Stripe ile; iyzico Türkiye'de taksit için isteğe bağlı ek.", kural: "biri", degiskenler: [
    { ad: "VAYRA_STRIPE_SECRET_KEY", aciklama: "Stripe gizli anahtarı (global, çok para birimli).", zorunlu: true, gizli: true }, { ad: "VAYRA_STRIPE_WEBHOOK_SECRET", aciklama: "Stripe webhook imza sırrı (whsec_).", zorunlu: true, gizli: true },
    { ad: "VAYRA_IYZICO_API_KEY", aciklama: "iyzico API anahtarı (Türkiye, isteğe bağlı).", gizli: true }, { ad: "VAYRA_IYZICO_SECRET_KEY", aciklama: "iyzico gizli anahtarı.", gizli: true },
    { ad: "VAYRA_IYZICO_ORTAM", aciklama: "sandbox ya da canli." },
    { ad: "VAYRA_ODEME_ZAMANLAYICI_SIRRI", aciklama: "Dış zamanlayıcıdan abonelik denetimi (isteğe bağlı).", gizli: true },
  ] },
  { id: "model", baslik: "Model sağlayıcıları", ozellik: "Stüdyolarda gerçek üretim. Anahtarı olmayan tür örnek çıktıyla çalışır ve kredi düşmez.", kural: "biri", degiskenler: [
    { ad: "OPENAI_API_KEY", aciklama: "Görsel (gpt-image) ve yardımcı modeller.", gizli: true },
    { ad: "GEMINI_API_KEY", aciklama: "Gemini görsel ve video (Veo, Nano Banana).", gizli: true },
    { ad: "BYTEPLUS_API_KEY", aciklama: "Seedream görsel ve Seedance video.", gizli: true },
    { ad: "REPLICATE_API_TOKEN", aciklama: "Replicate video modelleri.", gizli: true }, { ad: "REPLICATE_VIDEO_MODEL", aciklama: "Replicate video modeli." },
    { ad: "FAL_KEY", aciklama: "fal.ai modelleri.", gizli: true },
    { ad: "KLING_API_KEY", aciklama: "Kling video.", gizli: true }, { ad: "MINIMAX_API_KEY", aciklama: "Hailuo video.", gizli: true },
    { ad: "ELEVENLABS_API_KEY", aciklama: "Ses üretimi ve klonlama.", gizli: true }, { ad: "MESHY_API_KEY", aciklama: "3D modelleme.", gizli: true },
  ] },
  { id: "build", baslik: "Vayra Build yapay zekâ", ozellik: "Build ajanları, sohbet ve site üretimi.", kural: "biri", degiskenler: [
    { ad: "ANTHROPIC_API_KEY", aciklama: "Claude modelleri (varsayılan ajan).", gizli: true }, { ad: "ANTHROPIC_AUTH_TOKEN", aciklama: "Anthropic kimlik belirteci (anahtar yerine).", gizli: true },
    { ad: "OPENROUTER_API_KEY", aciklama: "Tek anahtarla diğer modeller.", gizli: true }, { ad: "OPENROUTER_BASE_URL", aciklama: "OpenAI uyumlu başka ağ geçidi." },
    { ad: "MOONSHOT_API_KEY", aciklama: "Kimi (doğrudan).", gizli: true }, { ad: "DEEPSEEK_API_KEY", aciklama: "DeepSeek (doğrudan).", gizli: true }, { ad: "XAI_API_KEY", aciklama: "Grok (doğrudan).", gizli: true },
    { ad: "ANTHROPIC_MODEL", aciklama: "Yönetim asistanının modeli." },
  ] },
  { id: "hesap", baslik: "Hesaplar ve giriş", ozellik: "İlk yöneticiler ve yeni hesap planı.", kural: "istege-bagli", degiskenler: [
    { ad: "VAYRA_ADMIN_EPOSTALARI", aciklama: "İlk yöneticiler (e-posta doğrulanınca yönetici olur)." },
    { ad: "VAYRA_YENI_HESAP_PLAN", aciklama: "Yeni hesabın planı (boşsa Başlangıç)." },
    { ad: "VAYRA_ANONIM_BUILD", aciklama: "Girişsiz Build kullanımı (üretimde önerilmez)." },
    { ad: "VAYRA_DENEME_ODEME", aciklama: "Ödeme altyapısı yokken deneme yüklemesi (yalnız deneme ortamı)." },
  ] },
  { id: "sosyal", baslik: "Sosyal giriş", ozellik: "Google, Microsoft ve Apple ile giriş.", kural: "istege-bagli", degiskenler: [
    { ad: "VAYRA_GOOGLE_CLIENT_ID", aciklama: "Google OAuth istemci kimliği." }, { ad: "VAYRA_GOOGLE_CLIENT_SECRET", aciklama: "Google OAuth gizli anahtarı.", gizli: true },
    { ad: "VAYRA_MICROSOFT_CLIENT_ID", aciklama: "Microsoft istemci kimliği." }, { ad: "VAYRA_MICROSOFT_CLIENT_SECRET", aciklama: "Microsoft gizli anahtarı.", gizli: true },
    { ad: "VAYRA_MICROSOFT_TENANT", aciklama: "Microsoft kiracı (isteğe bağlı)." },
    { ad: "VAYRA_APPLE_CLIENT_ID", aciklama: "Apple hizmet kimliği." }, { ad: "VAYRA_APPLE_TEAM_ID", aciklama: "Apple ekip kimliği." },
    { ad: "VAYRA_APPLE_KEY_ID", aciklama: "Apple anahtar kimliği." }, { ad: "VAYRA_APPLE_PRIVATE_KEY", aciklama: "Apple özel anahtarı.", gizli: true },
  ] },
  { id: "buildYayin", baslik: "Build yayın alanı", ozellik: "Sitelerin ad.alan adresinde yayınlanması ve özel alan adları.", kural: "istege-bagli", degiskenler: [
    { ad: "NEXT_PUBLIC_BUILD_ALAN", aciklama: "Sitelerin yayın alanı (ör. vayra.app)." },
    { ad: "BUILD_ALANADI_IP", aciklama: "Özel alan adlarının A kaydı hedefi." }, { ad: "BUILD_ALANADI_CNAME", aciklama: "Alt alan adlarının CNAME hedefi." },
    { ad: "CRON_SECRET", aciklama: "Süreç içi zamanlayıcı olmayan ortamlarda dakikalık çağrı sırrı.", gizli: true },
  ] },
  { id: "bildirim", baslik: "Tarayıcı bildirimleri", ozellik: "Build sohbet ve sistem bildirimleri (Web Push).", kural: "hepsi", degiskenler: [
    { ad: "VAPID_PUBLIC_KEY", aciklama: "VAPID açık anahtarı." }, { ad: "VAPID_PRIVATE_KEY", aciklama: "VAPID özel anahtarı.", gizli: true }, { ad: "VAPID_SUBJECT", aciklama: "İletişim adresi (mailto:)." },
  ] },
  { id: "buyume", baslik: "Build Büyüme", ozellik: "Sosyal hesaplardan paylaşım, yapay zekâ anılma testi, İYS.", kural: "istege-bagli", degiskenler: [
    { ad: "META_APP_ID", aciklama: "Meta uygulaması." }, { ad: "META_APP_SECRET", aciklama: "Meta gizli anahtarı.", gizli: true },
    { ad: "X_CLIENT_ID", aciklama: "X istemci kimliği." }, { ad: "X_CLIENT_SECRET", aciklama: "X gizli anahtarı.", gizli: true },
    { ad: "LINKEDIN_CLIENT_ID", aciklama: "LinkedIn istemci kimliği." }, { ad: "LINKEDIN_CLIENT_SECRET", aciklama: "LinkedIn gizli anahtarı.", gizli: true },
    { ad: "TIKTOK_CLIENT_KEY", aciklama: "TikTok istemci anahtarı." }, { ad: "TIKTOK_CLIENT_SECRET", aciklama: "TikTok gizli anahtarı.", gizli: true },
    { ad: "GOOGLE_ISLETME_ISTEMCI_ID", aciklama: "Google İşletme Profili." }, { ad: "GOOGLE_ISLETME_ISTEMCI_GIZLI", aciklama: "Google İşletme gizli anahtarı.", gizli: true },
    { ad: "PERPLEXITY_API_KEY", aciklama: "Anılma testi.", gizli: true },
    { ad: "IYS_KULLANICI", aciklama: "İleti Yönetim Sistemi kullanıcısı." }, { ad: "IYS_SIFRE", aciklama: "İYS şifresi.", gizli: true }, { ad: "IYS_KOD", aciklama: "İYS kodu." },
  ] },
  { id: "earn", baslik: "Vayra Earn", ozellik: "Kreatör doğrulama ve ödeme.", kural: "istege-bagli", degiskenler: [
    { ad: "YOUTUBE_API_KEY", aciklama: "YouTube Data API.", gizli: true }, { ad: "X_BEARER_TOKEN", aciklama: "X API.", gizli: true },
    { ad: "META_ACCESS_TOKEN", aciklama: "Instagram Graph API.", gizli: true }, { ad: "META_IG_USER_ID", aciklama: "Instagram işletme hesabı kimliği." },
    { ad: "TIKTOK_RESEARCH_TOKEN", aciklama: "TikTok Research API.", gizli: true }, { ad: "PAPARA_API_KEY", aciklama: "Papara toplu ödeme.", gizli: true },
  ] },
];

/** .env.example'daki ama katalogda olmayan değişkenler (dosya varsa). */
async function digerDegiskenler(): Promise<string[]> {
  try {
    const ham = await readFile(path.join(process.cwd(), ".env.example"), "utf8");
    const bilinen = new Set(ORTAM_GRUPLARI.flatMap((g) => g.degiskenler.map((d) => d.ad)));
    return [...new Set(ham.split(/\r?\n/).map((s) => /^\s*#?\s*([A-Z][A-Z0-9_]{2,})=/.exec(s)?.[1]).filter((x): x is string => !!x))].filter((x) => !bilinen.has(x));
  } catch { return []; }
}

export async function ortamDurumu() {
  const diger = await digerDegiskenler();
  return {
    gruplar: ORTAM_GRUPLARI.map((g) => {
      const tanimli = g.degiskenler.filter((d) => var_(d.ad)).length;
      const zorunluEksik = g.degiskenler.filter((d) => d.zorunlu && !var_(d.ad)).map((d) => d.ad);
      const acik = g.kural === "hepsi" ? zorunluEksik.length === 0 && tanimli > 0 : tanimli > 0;
      return { id: g.id, baslik: g.baslik, ozellik: g.ozellik, kural: g.kural, acik, tanimli, toplam: g.degiskenler.length, degiskenler: g.degiskenler.map((d) => ({ ...d, tanimli: var_(d.ad) })) };
    }),
    diger: diger.map((ad) => ({ ad, tanimli: var_(ad) })),
  };
}

/* ── Denetimler ── */

async function veriDiziniDenetle(): Promise<Madde> {
  let yazilabilir = false, hata = "";
  try {
    const d = path.join(DEPO, ".saglik");
    await mkdir(d, { recursive: true });
    const f = path.join(d, `yayin-${process.pid}.txt`);
    await writeFile(f, String(Date.now()));
    await rm(f, { force: true });
    yazilabilir = true;
  } catch (e) { hata = (e as Error).message.slice(0, 120); }
  let bos = -1, toplam = -1;
  try { const s = await statfs(DEPO); bos = s.bavail * s.bsize; toplam = s.blocks * s.bsize; } catch { /* desteklenmiyor */ }
  const gb = (n: number) => `${(n / 1024 ** 3).toFixed(1).replace(".", ",")} GB`;
  const ayrinti = [{ ad: "Konum", deger: process.env.VAYRA_VERI_DIZINI ? "VAYRA_VERI_DIZINI ile ayarlı" : "Proje klasöründeki .veri" }, ...(bos >= 0 ? [{ ad: "Boş alan", deger: `${gb(bos)} (toplam ${gb(toplam)})` }] : [])];
  if (!yazilabilir) return { id: "veri", baslik: "Veri klasörü", durum: "eksik", ozet: "Veri klasörüne yazılamıyor.", yapilacak: `Klasörün yazma iznini ver ya da VAYRA_VERI_DIZINI ile yazılabilir bir disk göster. Hata: ${hata}`, ayrinti };
  if (bos >= 0 && bos < 2 * 1024 ** 3) return { id: "veri", baslik: "Veri klasörü", durum: bos < 512 * 1024 ** 2 ? "eksik" : "uyari", ozet: `Diskte ${gb(bos)} boş alan kaldı.`, yapilacak: "Diski büyüt ya da eski medya dosyalarını temizle. Üretilen ses, video ve görseller bu klasöre yazılır.", ayrinti };
  if (!process.env.VAYRA_VERI_DIZINI) return { id: "veri", baslik: "Veri klasörü", durum: uretim() ? "uyari" : "hazir", ozet: "Yazılabilir; veri proje klasöründe tutuluyor.", yapilacak: uretim() ? "Üretimde VAYRA_VERI_DIZINI ile kalıcı bir disk bağla; konteyner yenilenince .veri silinir." : undefined, ayrinti };
  return { id: "veri", baslik: "Veri klasörü", durum: "hazir", ozet: "Yazılabilir ve kalıcı diskte.", ayrinti };
}

function kalicilikDenetle(): Madde | null {
  if (!process.env.VERCEL) return null;
  return { id: "kalicilik", baslik: "Barındırma", durum: "eksik", ozet: "Sunucu Vercel üzerinde çalışıyor; disk kalıcı değil.", yapilacak: "Hesaplar, krediler, ödemeler ve Build verisi diske yazılır. Kalıcı diskli bir sunucuya (Docker, VPS) taşı; Vercel'de her dağıtımda veri kaybolur." };
}

function alanDenetle(): Madde[] {
  const l: Madde[] = [];
  const koken = env("VAYRA_KOKEN");
  if (!koken) l.push({ id: "koken", baslik: "Kök adres (VAYRA_KOKEN)", durum: uretim() ? "eksik" : "uyari", ozet: "Tanımlı değil.", yapilacak: "VAYRA_KOKEN değişkenine sitenin https ile başlayan kök adresini yaz. Doğrulama ve şifre sıfırlama e-postaları ile sosyal giriş dönüşleri bu adresi kullanır; üretimde yoksa bağlantılı e-posta gönderilmez." });
  else if (!/^https:\/\//.test(koken) && uretim()) l.push({ id: "koken", baslik: "Kök adres (VAYRA_KOKEN)", durum: "uyari", ozet: "Adres https ile başlamıyor.", yapilacak: "Üretimde güvenli bağlantı (https) kullan; çerezler Secure olarak gönderilir." });
  else l.push({ id: "koken", baslik: "Kök adres (VAYRA_KOKEN)", durum: "hazir", ozet: "Tanımlı.", ayrinti: [{ ad: "Adres", deger: koken.replace(/\/+$/, "") }] });
  const ana = env("VAYRA_ANA_ALAN"), buildAlan = env("NEXT_PUBLIC_BUILD_ALAN");
  if (!ana) l.push({ id: "anaalan", baslik: "Alan adı ayarı (VAYRA_ANA_ALAN)", durum: uretim() ? "eksik" : "uyari", ozet: "Ana alan adı tanımlı değil.", yapilacak: "VAYRA_ANA_ALAN değişkenine ana alan adlarını virgülle yaz (ör. vayra.ai, www.vayra.ai). Tanımlı değilse kullanıcıların özel alan adları Build sitelerine yönlenmez." });
  else l.push({ id: "anaalan", baslik: "Alan adı ayarı (VAYRA_ANA_ALAN)", durum: "hazir", ozet: `${ana.split(",").filter(Boolean).length} alan adı tanımlı.`, ayrinti: [{ ad: "Alanlar", deger: ana }, ...(buildAlan ? [{ ad: "Build yayın alanı", deger: buildAlan }] : [])] });
  return l;
}

function gizliDenetle(): Madde {
  const eksik = ["VAYRA_SIFRE_ANAHTARI", "VAYRA_HEDIYE_SIRRI"].filter((a) => !var_(a));
  const kasaDosyasi = existsSync(path.join(DEPO, "build", ".kasa-anahtari"));
  if (!eksik.length) return { id: "gizli", baslik: "Gizli anahtarlar", durum: "hazir", ozet: "Kasa ve hediye anahtarları ortam değişkeninde." };
  return {
    id: "gizli", baslik: "Gizli anahtarlar", durum: uretim() ? "eksik" : "uyari", ozet: `${eksik.join(" ve ")} tanımlı değil.`,
    yapilacak: `Uzun rastgele değerler üret ve ortam değişkeni olarak ver.${kasaDosyasi && eksik.includes("VAYRA_SIFRE_ANAHTARI") ? " Kasa anahtarı şu an veri klasöründeki dosyada; taşırken aynı değeri ortam değişkenine koy, yoksa şifreli bağlantılar çözülemez." : ""}`,
  };
}

function epostaDenetle(): Madde {
  const kurulu = epostaKurulu();
  const from = var_("RESEND_FROM");
  if (!kurulu) return { id: "eposta", baslik: "E-posta servisi", durum: uretim() ? "eksik" : "uyari", ozet: "Resend anahtarı yok; e-posta gönderilmiyor.", yapilacak: "resend.com'da alan adını doğrula, RESEND_API_KEY ve RESEND_FROM ekle. Yoksa üyelik doğrulama ve şifre sıfırlama çalışmaz." };
  if (!from) return { id: "eposta", baslik: "E-posta servisi", durum: "uyari", ozet: "Anahtar var, gönderen adres tanımlı değil.", yapilacak: "RESEND_FROM değişkenine doğrulanmış alan adından bir gönderen yaz (ör. Vayra, bildirim@alanadin); doğrulanmamış adresten gönderim reddedilir." };
  return { id: "eposta", baslik: "E-posta servisi", durum: "hazir", ozet: "Resend kurulu.", ayrinti: [{ ad: "Gönderen", deger: env("RESEND_FROM").replace(/<.*>/, "").trim() || "Tanımlı" }] };
}

function odemeDenetle(): Madde[] {
  const iy = iyzicoAyar(), st = stripeAyar(), uyarilar = ayarUyarilari();
  const l: Madde[] = [];
  const ayr = (m: string | null | undefined) => (m === "canli" ? "Canlı" : m === "test" ? "Test" : "Yok");
  // Vayra global: ana ödeme sağlayıcısı Stripe (çok para birimli, her ülke). iyzico yalnız Türkiye'de taksit için isteğe bağlı ek.
  const skVar = var_("VAYRA_STRIPE_SECRET_KEY"), whVar = env("VAYRA_STRIPE_WEBHOOK_SECRET").startsWith("whsec_");
  l.push(st
    ? { id: "stripe", baslik: "Stripe (global, çok para birimli)", durum: st.mod === "canli" ? "hazir" : "uyari", ozet: st.mod === "canli" ? "Canlı anahtar ve webhook sırrı tanımlı." : "Test anahtarıyla kurulu.", yapilacak: st.mod === "canli" ? undefined : "Canlıya geçerken sk_live_ anahtarını ve canlı webhook sırrını ekle.", ayrinti: [{ ad: "Mod", deger: ayr(st.mod) }, { ad: "Webhook", deger: "/api/odeme/bildirim/stripe" }] }
    : { id: "stripe", baslik: "Stripe (global, çok para birimli)", durum: "eksik", ozet: skVar && !whVar ? "Anahtar var, webhook sırrı yok; Stripe satışı kapalı." : "Kurulu değil; dünya genelinde kartla satış yapılamaz.", yapilacak: skVar && !whVar ? "Stripe panelinde webhook uç noktası oluştur (VAYRA_KOKEN/api/odeme/bildirim/stripe) ve VAYRA_STRIPE_WEBHOOK_SECRET (whsec_) ekle." : "VAYRA_STRIPE_SECRET_KEY ve VAYRA_STRIPE_WEBHOOK_SECRET ekle. Webhook adresi: VAYRA_KOKEN/api/odeme/bildirim/stripe." });
  l.push(iy
    ? { id: "iyzico", baslik: "iyzico (Türkiye, isteğe bağlı)", durum: iy.mod === "canli" ? "hazir" : "uyari", ozet: iy.mod === "canli" ? "Canlı anahtarla kurulu." : "Sandbox anahtarıyla kurulu.", yapilacak: iy.mod === "canli" ? undefined : "Canlıya geçerken canlı anahtarları ekle, VAYRA_IYZICO_ORTAM değerini canli yap.", ayrinti: [{ ad: "Mod", deger: ayr(iy.mod) }, { ad: "Bildirim adresi", deger: "/api/odeme/bildirim/iyzico" }] }
    : { id: "iyzico", baslik: "iyzico (Türkiye, isteğe bağlı)", durum: "uyari", ozet: "Kurulu değil; Türkiye'deki ödemeler de Stripe'tan geçer.", yapilacak: "Türkiye'de yerel kartla taksit sunmak istersen VAYRA_IYZICO_API_KEY ve VAYRA_IYZICO_SECRET_KEY ekle. Zorunlu değil." });
  if (uyarilar.length) l.push({ id: "odeme-uyari", baslik: "Ödeme ayarı uyarıları", durum: "uyari", ozet: `${uyarilar.length} uyarı var.`, yapilacak: uyarilar.join(" ") });
  if (process.env.VAYRA_DENEME_ODEME === "1" && uretim()) l.push({ id: "deneme-odeme", baslik: "Deneme ödemesi açık", durum: "uyari", ozet: "VAYRA_DENEME_ODEME açık: ödeme alınmadan kredi ve plan verilebiliyor.", yapilacak: "Canlı ortamda bu değişkeni kaldır." });
  return l;
}

function modelDenetle(): Madde[] {
  const durum = saglayiciDurumu();
  const TUR: Record<string, string> = { gorsel: "Görsel", video: "Video", ses: "Ses", "3d": "3D" };
  const gercek = Object.entries(durum).filter(([, v]) => v.gercek);
  const l: Madde[] = [{
    id: "model", baslik: "Stüdyo model sağlayıcıları", durum: gercek.length === Object.keys(durum).length ? "hazir" : gercek.length ? "uyari" : "eksik",
    ozet: gercek.length ? `${gercek.length} üretim türü gerçek sağlayıcıya bağlı.` : "Hiçbir üretim türü gerçek sağlayıcıya bağlı değil; stüdyolar örnek çıktı veriyor.",
    yapilacak: gercek.length === Object.keys(durum).length ? undefined : `Bağlı olmayan türler: ${Object.entries(durum).filter(([, v]) => !v.gercek).map(([k]) => TUR[k] ?? k).join(", ")}. İlgili anahtarları ekle (Ortam değişkenleri, Model sağlayıcıları).`,
    ayrinti: Object.entries(durum).map(([k, v]) => ({ ad: TUR[k] ?? k, deger: v.gercek ? v.saglayici : "Bağlı değil" })),
  }];
  const claude = var_("ANTHROPIC_API_KEY") || var_("ANTHROPIC_AUTH_TOKEN"), or = var_("OPENROUTER_API_KEY");
  l.push({ id: "build-model", baslik: "Build yapay zekâ modelleri", durum: claude && or ? "hazir" : claude || or ? "uyari" : "eksik",
    ozet: claude && or ? "Claude ve OpenRouter anahtarları tanımlı." : claude ? "Yalnız Claude tanımlı." : or ? "Yalnız OpenRouter tanımlı." : "Build ajanları ve sohbet için model anahtarı yok.",
    yapilacak: claude && or ? undefined : `${claude ? "" : "ANTHROPIC_API_KEY "}${or ? "" : "OPENROUTER_API_KEY "}ekle. Varsayılan ajan Claude; diğer modeller OpenRouter üzerinden.`.trim() });
  return l;
}

function sosyalDenetle(): Madde {
  const s = (["google", "microsoft", "apple"] as const).map((x) => ({ x, k: saglayiciKurulu(x) }));
  const n = s.filter((x) => x.k).length;
  const AD = { google: "Google", microsoft: "Microsoft", apple: "Apple" };
  return { id: "sosyal", baslik: "Sosyal giriş", durum: n ? "hazir" : "uyari", ozet: n ? `${n} sağlayıcı kurulu.` : "Kurulu sağlayıcı yok; yalnız e-posta ile giriş var.",
    yapilacak: n === 3 ? undefined : `Eksik: ${s.filter((x) => !x.k).map((x) => AD[x.x]).join(", ")}. Dönüş adresi: VAYRA_KOKEN/api/hesap/oauth/<sağlayıcı>/donus.`,
    ayrinti: s.map((x) => ({ ad: AD[x.x], deger: x.k ? "Kurulu" : "Yok" })) };
}

async function yoneticiDenetle(): Promise<Madde> {
  const hesaplar = await tumHesaplar();
  const adminler = hesaplar.filter((h) => rolHesapla(h) === "admin");
  const ikiAdimsiz = adminler.filter((h) => !h.ikiAdim);
  if (!adminler.length) return { id: "yonetici", baslik: "Yönetici hesapları", durum: "eksik", ozet: "Yönetici yok.", yapilacak: "VAYRA_ADMIN_EPOSTALARI ile ilk yöneticiyi belirle." };
  return { id: "yonetici", baslik: "Yönetici hesapları", durum: ikiAdimsiz.length ? "uyari" : "hazir", ozet: `${adminler.length} yönetici${ikiAdimsiz.length ? `, ${ikiAdimsiz.length} tanesinde iki adımlı doğrulama kapalı` : ", hepsinde iki adımlı doğrulama açık"}.`,
    yapilacak: ikiAdimsiz.length ? "Yöneticiler Ayarlar, Güvenlik bölümünden iki adımlı doğrulamayı açmalı." : undefined };
}

/** Tarayıcı motoru: playwright-core var mı, kullanılabilir bir Chromium, Edge ya da Chrome dosyası bulunuyor mu. */
async function tarayiciDenetle(dene: boolean): Promise<Madde> {
  type Pw = typeof import("playwright-core");
  const pw = (await import("playwright-core").catch(() => null)) as Pw | null;
  if (!pw) return { id: "tarayici", baslik: "Tarayıcı motoru", durum: "eksik", ozet: "playwright-core paketi yüklenemedi.", yapilacak: "npm install ile bağımlılıkları kur. Build kapak görselleri, mağaza ekran görüntüleri ve ajan tarayıcı testleri bunu kullanır." };
  const adaylar: { ad: string; yol: string }[] = [];
  try { adaylar.push({ ad: "Playwright Chromium", yol: pw.chromium.executablePath() }); } catch { /* yok */ }
  const sistem = process.platform === "win32"
    ? [["Edge", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"], ["Edge", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"], ["Chrome", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"]]
    : process.platform === "darwin"
      ? [["Chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"], ["Edge", "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"]]
      : [["Chrome", "/opt/google/chrome/chrome"], ["Chrome", "/usr/bin/google-chrome"], ["Edge", "/opt/microsoft/msedge/msedge"], ["Chromium", "/usr/bin/chromium"]];
  for (const [ad, yol] of sistem) adaylar.push({ ad, yol });
  const bulunan = adaylar.filter((a) => a.yol && existsSync(a.yol));
  const ayrinti = bulunan.length ? bulunan.map((b) => ({ ad: b.ad, deger: "Bulundu" })) : [{ ad: "Bulunan", deger: "Yok" }];
  if (dene) {
    const bas = Date.now();
    let t: import("playwright-core").Browser | null = null, son = "";
    for (const kanal of ["msedge", "chrome", undefined]) {
      try { t = await pw.chromium.launch({ ...(kanal ? { channel: kanal } : {}), timeout: 20_000 }); break; } catch (e) { son = (e as Error).message.split("\n")[0].slice(0, 160); }
    }
    if (t) { await t.close().catch(() => {}); return { id: "tarayici", baslik: "Tarayıcı motoru", durum: "hazir", ozet: `Tarayıcı başlatıldı (${((Date.now() - bas) / 1000).toFixed(1).replace(".", ",")} sn).`, ayrinti }; }
    return { id: "tarayici", baslik: "Tarayıcı motoru", durum: "eksik", ozet: "Tarayıcı başlatılamadı.", yapilacak: `Sunucuda npx playwright install --with-deps chromium çalıştır. Son hata: ${son}`, ayrinti };
  }
  if (!bulunan.length) return { id: "tarayici", baslik: "Tarayıcı motoru", durum: "eksik", ozet: "Chromium, Edge ya da Chrome bulunamadı.", yapilacak: "Sunucuda npx playwright install --with-deps chromium çalıştır. Yoksa Build kapak görselleri ve tarayıcı testleri çalışmaz.", ayrinti };
  return { id: "tarayici", baslik: "Tarayıcı motoru", durum: "hazir", ozet: `${bulunan[0].ad} bulundu. Kesin sonuç için başlatarak dene.`, ayrinti };
}

function zamanlayiciDenetle(): Madde[] {
  zamanlayicilariIzle();
  return zamanlayiciDurumlari().map((z) => {
    const ayr = [{ ad: "Aralık", deger: z.aralikSn >= 3600 ? `${z.aralikSn / 3600} saat` : z.aralikSn >= 60 ? `${z.aralikSn / 60} dakika` : `${z.aralikSn} saniye` }];
    if (!z.kurulu) return { id: `z-${z.id}`, baslik: z.ad, durum: "eksik" as Durum, ozet: "Başlatılmamış.", yapilacak: process.env.VERCEL ? "Vercel'de süreç içi zamanlayıcı çalışmaz; dış zamanlayıcı (cron) kur." : "Sunucu instrumentation ile açılmamış olabilir; sunucuyu yeniden başlat.", ayrinti: ayr };
    if (!z.izlenebilir) return { id: `z-${z.id}`, baslik: z.ad, durum: "hazir" as Durum, ozet: "Çalışıyor. Bu zamanlayıcının son çalışma zamanı ayrıca kaydedilmiyor.", ayrinti: ayr };
    const d = z.damga;
    if (!d) return { id: `z-${z.id}`, baslik: z.ad, durum: "uyari" as Durum, ozet: "Başlatıldı, izleme başladığından beri henüz çalışma görülmedi.", yapilacak: "Birkaç dakika sonra yeniden bak. Sunucu yeni açıldıysa ilk tur gecikmeli başlar.", ayrinti: ayr };
    const gec = Date.now() - d.son > Math.max(3 * z.aralikSn * 1000, 5 * 60_000);
    const sonHata = d.hata && d.hataZamani === d.son;
    return {
      id: `z-${z.id}`, baslik: z.ad, durum: (gec || sonHata ? "uyari" : "hazir") as Durum,
      ozet: sonHata ? `Son çalışma hatayla bitti: ${d.hata}` : gec ? "Son çalışma beklenenden eski." : `Son çalışma ${Math.max(0, Math.round((Date.now() - d.son) / 1000))} saniye önce.`,
      yapilacak: gec ? "Sunucu günlüklerini denetle; zamanlayıcı takılmış olabilir." : undefined,
      ayrinti: [...ayr, { ad: "Son çalışma", deger: new Date(d.son).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }) }, { ad: "Süre", deger: `${d.sure} ms` }, { ad: "Çalışma sayısı", deger: String(d.sayac) }],
    };
  });
}

async function saglikDenetle(req: Request): Promise<Madde> {
  const bas = Date.now();
  try {
    const r = await fetch(new URL("/api/saglik", req.url), { cache: "no-store", signal: AbortSignal.timeout(8000) });
    const j = (await r.json().catch(() => null)) as { ok?: boolean; depo?: string; calismaSuresi?: number } | null;
    const sure = Date.now() - bas;
    const ayrinti = [{ ad: "Yanıt", deger: `${r.status}, ${sure} ms` }, ...(j?.calismaSuresi !== undefined ? [{ ad: "Çalışma süresi", deger: `${Math.round(j.calismaSuresi / 60)} dakika` }] : [])];
    if (r.ok && j?.ok) return { id: "saglik", baslik: "Sağlık ucu (/api/saglik)", durum: "hazir", ozet: "Sunucu ayakta, veri klasörü yazılabilir.", ayrinti };
    return { id: "saglik", baslik: "Sağlık ucu (/api/saglik)", durum: "eksik", ozet: `Sağlık ucu ${r.status} döndü.`, yapilacak: "Veri klasörünün yazılabilir olduğunu denetle.", ayrinti };
  } catch (e) {
    const zamanAsimi = /abort|timeout/i.test((e as Error).name + (e as Error).message);
    return zamanAsimi
      ? { id: "saglik", baslik: "Sağlık ucu (/api/saglik)", durum: "uyari", ozet: "Sağlık ucu 8 saniyede yanıt vermedi.", yapilacak: "Sunucu aşırı yüklü olabilir. Yeniden denetle; sürerse işlemci ve bellek kullanımına Sistem sayfasından bak." }
      : { id: "saglik", baslik: "Sağlık ucu (/api/saglik)", durum: "eksik", ozet: "Sağlık ucuna ulaşılamadı.", yapilacak: `Sunucu kendi adresine bağlanamıyor (${(e as Error).message.slice(0, 120)}). Ters vekil ya da güvenlik duvarı ayarını denetle.` };
  }
}

function ortamModuDenetle(): Madde {
  if (uretim()) return { id: "mod", baslik: "Çalışma modu", durum: "hazir", ozet: "Üretim modu." };
  return { id: "mod", baslik: "Çalışma modu", durum: "uyari", ozet: "Geliştirme modu.", yapilacak: "Canlıda npm run build ve npm start ile üretim modunda çalıştır. Geliştirme modunda deneme ödemesi ve geliştirme bağlantıları açıktır." };
}

export async function yayinHazirligi(req: Request, g: { tarayiciDene?: boolean } = {}) {
  const bolumler: Bolum[] = [
    { id: "sunucu", baslik: "Sunucu ve depolama", aciklama: "Çalışma modu, kalıcı veri klasörü ve sağlık ucu.", maddeler: [ortamModuDenetle(), ...[kalicilikDenetle()].filter((x): x is Madde => !!x), await veriDiziniDenetle(), await saglikDenetle(req)] },
    { id: "odeme", baslik: "Ödeme sağlayıcıları", aciklama: "Global satış Stripe ile (çok para birimli); iyzico Türkiye için isteğe bağlı ek.", maddeler: odemeDenetle() },
    { id: "iletisim", baslik: "E-posta ve giriş", aciklama: "Üyelik e-postaları ve sosyal giriş.", maddeler: [epostaDenetle(), sosyalDenetle()] },
    { id: "model", baslik: "Yapay zekâ sağlayıcıları", aciklama: "Stüdyo üretimleri ve Build ajanları.", maddeler: modelDenetle() },
    { id: "alan", baslik: "Alan adı ve güvenlik", aciklama: "Kök adres, alan adı yönlendirmesi, gizli anahtarlar ve yöneticiler.", maddeler: [...alanDenetle(), gizliDenetle(), await yoneticiDenetle()] },
    { id: "arka", baslik: "Arka plan işleri", aciklama: "Sunucu içi zamanlayıcılar ve tarayıcı motoru.", maddeler: [...zamanlayiciDenetle(), await tarayiciDenetle(!!g.tarayiciDene)] },
  ];
  const tum = bolumler.flatMap((b) => b.maddeler);
  const sayi = { hazir: tum.filter((m) => m.durum === "hazir").length, uyari: tum.filter((m) => m.durum === "uyari").length, eksik: tum.filter((m) => m.durum === "eksik").length };
  return { zaman: Date.now(), uretim: uretim(), genel: (sayi.eksik ? "eksik" : sayi.uyari ? "uyari" : "hazir") as Durum, sayi, bolumler, ortam: await ortamDurumu() };
}
