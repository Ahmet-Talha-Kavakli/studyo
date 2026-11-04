/**
 * Vayra Earn — sunucu tarafı platform entegrasyonları.
 *
 * Her fonksiyon gerçek API'yi çağırır. Gerekli anahtar .env.local'de yoksa
 * `{ gercek: false }` döner; istemci bu durumda simülasyona düşer ve arayüzde
 * bunu belirtir. Anahtar gerektirmeyen uçlar (YouTube / TikTok / X oEmbed,
 * NVİ kimlik doğrulama) her zaman gerçek çalışır.
 *
 * Anahtarlar (.env.example'da açıklamalı):
 *   YOUTUBE_API_KEY                     → kanal açıklaması + abone, video görüntülenme
 *   X_BEARER_TOKEN                      → profil açıklaması + takipçi, gönderi gösterim sayısı
 *   META_ACCESS_TOKEN + META_IG_USER_ID → Instagram business_discovery (bio + takipçi)
 *   META_OEMBED_TOKEN                   → Instagram oEmbed (gönderi sahibi kontrolü)
 *   TIKTOK_RESEARCH_TOKEN               → TikTok Research API (bio + takipçi)
 *   PAPARA_API_KEY                      → Papara toplu ödeme (çekimler)
 */
import "server-only";

export type Platform = "instagram" | "tiktok" | "youtube" | "x";

const ZAMAN_ASIMI = 8000;

async function getir(url: string, init?: RequestInit) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ZAMAN_ASIMI);
  try {
    return await fetch(url, { ...init, signal: ac.signal, cache: "no-store" });
  } finally {
    clearTimeout(t);
  }
}

const temizKadi = (k: string) => k.trim().replace(/^@/, "").toLowerCase();

/* ── 1. Hesap doğrulama: bio'da doğrulama kodu var mı? ── */

export type HesapSonuc =
  | { gercek: false }
  | { gercek: true; bulundu: false; hata: string }
  | { gercek: true; bulundu: true; kodVar: boolean; takipci: number; ad?: string };

export async function hesapDogrula(platform: Platform, kadiHam: string, kod: string): Promise<HesapSonuc> {
  const kadi = temizKadi(kadiHam);
  const kodVar = (metin?: string) => !!metin && metin.toUpperCase().includes(kod.toUpperCase());

  if (platform === "youtube") {
    const key = process.env.YOUTUBE_API_KEY;
    if (!key) return { gercek: false };
    const r = await getir(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${encodeURIComponent("@" + kadi)}&key=${key}`);
    if (!r.ok) return { gercek: true, bulundu: false, hata: `YouTube API hatası (${r.status}).` };
    const j = await r.json();
    const k = j.items?.[0];
    if (!k) return { gercek: true, bulundu: false, hata: `@${kadi} adında bir YouTube kanalı bulunamadı.` };
    return { gercek: true, bulundu: true, kodVar: kodVar(k.snippet?.description), takipci: Number(k.statistics?.subscriberCount ?? 0), ad: k.snippet?.title };
  }

  if (platform === "x") {
    const token = process.env.X_BEARER_TOKEN;
    if (!token) return { gercek: false };
    const r = await getir(`https://api.x.com/2/users/by/username/${encodeURIComponent(kadi)}?user.fields=description,public_metrics,name`, { headers: { Authorization: `Bearer ${token}` } });
    if (r.status === 404) return { gercek: true, bulundu: false, hata: `@${kadi} adında bir X hesabı bulunamadı.` };
    if (!r.ok) return { gercek: true, bulundu: false, hata: `X API hatası (${r.status}).` };
    const j = await r.json();
    if (!j.data) return { gercek: true, bulundu: false, hata: `@${kadi} adında bir X hesabı bulunamadı.` };
    return { gercek: true, bulundu: true, kodVar: kodVar(j.data.description), takipci: Number(j.data.public_metrics?.followers_count ?? 0), ad: j.data.name };
  }

  if (platform === "instagram") {
    const token = process.env.META_ACCESS_TOKEN, igId = process.env.META_IG_USER_ID;
    if (!token || !igId) return { gercek: false };
    const alan = `business_discovery.username(${kadi}){biography,followers_count,name}`;
    const r = await getir(`https://graph.facebook.com/v21.0/${igId}?fields=${encodeURIComponent(alan)}&access_token=${token}`);
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.business_discovery) {
      return { gercek: true, bulundu: false, hata: "Instagram hesabı bulunamadı. Doğrulama için hesabın İşletme ya da İçerik Üreticisi hesabı olmalı." };
    }
    const b = j.business_discovery;
    return { gercek: true, bulundu: true, kodVar: kodVar(b.biography), takipci: Number(b.followers_count ?? 0), ad: b.name };
  }

  // TikTok — Research API (kurumsal erişim gerektirir)
  const token = process.env.TIKTOK_RESEARCH_TOKEN;
  if (!token) return { gercek: false };
  const r = await getir("https://open.tiktokapis.com/v2/research/user/info/?fields=display_name,bio_description,follower_count", {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ username: kadi }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.data) return { gercek: true, bulundu: false, hata: `@${kadi} adında bir TikTok hesabı bulunamadı.` };
  return { gercek: true, bulundu: true, kodVar: kodVar(j.data.bio_description), takipci: Number(j.data.follower_count ?? 0), ad: j.data.display_name };
}

/* ── 2. Gönderi kontrolü: gönderi var mı, doğrulanmış hesaba mı ait? (oEmbed) ── */

export type GonderiSonuc =
  | { gercek: false }
  | { gercek: true; var: false; hata: string }
  | { gercek: true; var: true; /** null: platform yazar bilgisi vermedi, incelemede kontrol edilir */ sahibiMi: boolean | null; yazar: string; baslik?: string; kucukResim?: string };

export async function gonderiKontrol(platform: Platform, link: string, kadiHam: string): Promise<GonderiSonuc> {
  const kadi = temizKadi(kadiHam);
  let url: string;
  if (platform === "youtube") url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(link)}`;
  else if (platform === "tiktok") url = `https://www.tiktok.com/oembed?url=${encodeURIComponent(link)}`;
  else if (platform === "x") url = `https://publish.twitter.com/oembed?omit_script=1&url=${encodeURIComponent(link)}`;
  else {
    const token = process.env.META_OEMBED_TOKEN;
    if (!token) return { gercek: false };
    url = `https://graph.facebook.com/v21.0/instagram_oembed?fields=author_name,title,thumbnail_url&url=${encodeURIComponent(link)}&access_token=${token}`;
  }

  let r: Response;
  try {
    r = await getir(url);
  } catch {
    return { gercek: false }; // ağ erişimi yoksa simülasyona düş
  }
  if (r.status === 404 || r.status === 400 || r.status === 401 || r.status === 403) {
    return { gercek: true, var: false, hata: "Gönderi bulunamadı. Bağlantının herkese açık bir gönderiye ait olduğundan emin ol." };
  }
  if (!r.ok) return { gercek: false };
  const j = await r.json().catch(() => null);
  if (!j) return { gercek: true, var: false, hata: "Gönderi bilgisi okunamadı." };

  // Yazar eşleşmesi: platforma göre en güvenilir alan
  const adaylar: string[] = [];
  if (platform === "youtube") adaylar.push(String(j.author_url ?? "").split("/").pop() ?? "");
  if (platform === "tiktok") adaylar.push(String(j.author_unique_id ?? ""), String(j.author_url ?? "").split("@").pop() ?? "");
  if (platform === "x") adaylar.push(String(j.author_url ?? "").split("/").pop() ?? "");
  if (platform === "instagram") adaylar.push(String(j.author_name ?? ""));
  const dolu = adaylar.map(temizKadi).filter(Boolean);
  const sahibiMi = dolu.length ? dolu.includes(kadi) : null;

  return {
    gercek: true, var: true, sahibiMi,
    yazar: String(j.author_unique_id ?? j.author_name ?? adaylar[0] ?? ""),
    baslik: typeof j.title === "string" ? j.title.slice(0, 200) : undefined,
    kucukResim: typeof j.thumbnail_url === "string" ? j.thumbnail_url : undefined,
  };
}

/* ── 3. İstatistik: güncel görüntülenme ── */

export type IstatistikSonuc = { gercek: false } | { gercek: true; goruntulenme: number | null };

export async function istatistik(platform: Platform, link: string): Promise<IstatistikSonuc> {
  if (platform === "youtube") {
    const key = process.env.YOUTUBE_API_KEY;
    if (!key) return { gercek: false };
    const id = link.match(/(?:shorts\/|v=|youtu\.be\/)([\w-]{6,})/)?.[1];
    if (!id) return { gercek: true, goruntulenme: null };
    const r = await getir(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${id}&key=${key}`);
    const j = await r.json().catch(() => ({}));
    const v = j.items?.[0]?.statistics?.viewCount;
    return { gercek: true, goruntulenme: v != null ? Number(v) : null };
  }
  if (platform === "x") {
    const token = process.env.X_BEARER_TOKEN;
    if (!token) return { gercek: false };
    const id = link.match(/status\/(\d+)/)?.[1];
    if (!id) return { gercek: true, goruntulenme: null };
    const r = await getir(`https://api.x.com/2/tweets/${id}?tweet.fields=public_metrics`, { headers: { Authorization: `Bearer ${token}` } });
    const j = await r.json().catch(() => ({}));
    const v = j.data?.public_metrics?.impression_count;
    return { gercek: true, goruntulenme: v != null ? Number(v) : null };
  }
  if (platform === "tiktok") {
    const token = process.env.TIKTOK_RESEARCH_TOKEN;
    if (!token) return { gercek: false };
    const id = link.match(/video\/(\d+)/)?.[1];
    if (!id) return { gercek: true, goruntulenme: null };
    const r = await getir("https://open.tiktokapis.com/v2/research/video/query/?fields=id,view_count", {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: { and: [{ operation: "EQ", field_name: "video_id", field_values: [id] }] }, max_count: 1 }),
    });
    const j = await r.json().catch(() => ({}));
    const v = j.data?.videos?.[0]?.view_count;
    return { gercek: true, goruntulenme: v != null ? Number(v) : null };
  }
  // Instagram: başka bir hesabın Reels görüntülenmesi Graph API'de yalnız hesap sahibinin
  // izniyle (Instagram Login) okunabilir; o akış eklenene kadar simülasyon.
  return { gercek: false };
}

/* ── 4. Kimlik doğrulama: NVİ KPSPublic (anahtarsız, resmi servis) ── */

export type KimlikSonuc = { gercek: false } | { gercek: true; dogru: boolean };

export async function kimlikDogrula(tckn: string, ad: string, soyad: string, dogumYili: number): Promise<KimlikSonuc> {
  const buyuk = (s: string) => s.trim().toLocaleUpperCase("tr-TR");
  const govde = `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <TCKimlikNoDogrula xmlns="http://tckimlik.nvi.gov.tr/WS">
      <TCKimlikNo>${tckn}</TCKimlikNo>
      <Ad>${xmlKacis(buyuk(ad))}</Ad>
      <Soyad>${xmlKacis(buyuk(soyad))}</Soyad>
      <DogumYili>${dogumYili}</DogumYili>
    </TCKimlikNoDogrula>
  </soap12:Body>
</soap12:Envelope>`;
  try {
    const r = await getir("https://tckimlik.nvi.gov.tr/Service/KPSPublic.asmx", {
      method: "POST", headers: { "Content-Type": "application/soap+xml; charset=utf-8" }, body: govde,
    });
    if (!r.ok) return { gercek: false };
    const metin = await r.text();
    const m = metin.match(/<TCKimlikNoDogrulaResult>(true|false)<\/TCKimlikNoDogrulaResult>/);
    return m ? { gercek: true, dogru: m[1] === "true" } : { gercek: false };
  } catch {
    return { gercek: false };
  }
}
const xmlKacis = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

/* ── 5. Ödeme: Papara toplu ödeme ── */

export type OdemeSonuc = { gercek: false } | { gercek: true; ok: boolean; referans?: string; hata?: string };

export async function paparaOdeme(o: { hesapNo: string; tutar: number; referans: string; tckn?: string }): Promise<OdemeSonuc> {
  const key = process.env.PAPARA_API_KEY;
  if (!key) return { gercek: false };
  const taban = process.env.PAPARA_SANDBOX ? "https://merchant-api.test.papara.com" : "https://merchant-api.papara.com";
  const r = await getir(`${taban}/masspayment`, {
    method: "POST",
    headers: { ApiKey: key, "Content-Type": "application/json" },
    body: JSON.stringify({ accountNumber: o.hesapNo, amount: o.tutar, massPaymentId: o.referans, turkishNationalId: o.tckn, description: "Vayra Earn kazanç ödemesi" }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.succeeded === false) return { gercek: true, ok: false, hata: j.error?.message ?? `Papara hatası (${r.status}).` };
  return { gercek: true, ok: true, referans: j.data?.id ?? o.referans };
}
