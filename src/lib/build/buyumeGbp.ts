import "server-only";
import { isletmeOku, listeOku } from "./isletme";
import { yayindakiler } from "./isletmeIcerik";
import { urunler } from "./isletmeMagaza";
import type { Yazi } from "./isletmeTipler";
import { siteAdresi } from "./bulutKimlik";
import { projeOkuHam } from "./depo";
import { gorev, ozetIle, t } from "./buyumeAnaliz";
import { ekGuncelle, ekOku } from "./buyumeEkDepo";
import { kimlikUret, type EkVeri } from "./buyumeEkTipler";
import { GBP_SINIR, type GbpCta, type GbpGonderi, type GbpTur } from "./buyumeKanalTipler";
import { anahtarDurumu, belirtecAl, kasaProjeleri, tazeBelirtec } from "./buyumeSosyal";
import type { Proje } from "./tipler";

/**
 * Google İşletme Profili gönderileri (Business Profile API, localPosts). OAuth anahtarı (GOOGLE_ISLETME_ISTEMCI_ID ve
 * GOOGLE_ISLETME_ISTEMCI_GIZLI) yoksa ya da Google API erişimi onaylanmadıysa gönderiler taslak olarak hazırlanır ve
 * elle paylaşım için kopyalanır; sahte başarı gösterilmez. Taslaklar projenin ürünlerinden, blog yazılarından ve
 * indirim kodlarından ya da yapay zekâyla yazılır. Zamanlanan gönderiler dakikalık Büyüme turunda yayımlanır.
 */
export async function gbpDurumu(p: string, ek: EkVeri) {
  const a = anahtarDurumu("google");
  const tok = a.anahtar ? await belirtecAl(p, "google") : null;
  return { anahtar: a.anahtar, eksik: a.eksik, bagli: !!tok, konum: ek.gbp.konum ?? null };
}

async function gapi(p: string, u: string, init: RequestInit = {}) {
  const tok = await tazeBelirtec(p, "google");
  const r = await fetch(u, { ...init, headers: { Authorization: `Bearer ${tok.erisim}`, "Content-Type": "application/json", ...(init.headers ?? {}) }, signal: AbortSignal.timeout(25_000) });
  const metin = await r.text();
  let j: Record<string, unknown> = {};
  try { j = JSON.parse(metin); } catch { /* boş */ }
  if (!r.ok) {
    const m = String((j.error as Record<string, unknown> | undefined)?.message ?? metin.slice(0, 200));
    if (r.status === 403 || r.status === 429) throw new Error(`Google ${r.status}: ${m}. Business Profile API erişimi Google'dan ayrıca onay ister (kota başvurusu); onay gelene kadar gönderiler taslak kalır.`);
    throw new Error(`Google ${r.status}: ${m}`);
  }
  return j;
}

/** Hesaplar ve konumlar (işletmeler). */
export async function gbpKonumlari(p: string): Promise<{ hesap: string; konum: string; ad: string; adres?: string }[]> {
  const h = await gapi(p, "https://mybusinessaccountmanagement.googleapis.com/v1/accounts?pageSize=20");
  const l: { hesap: string; konum: string; ad: string; adres?: string }[] = [];
  for (const a of ((h.accounts as Record<string, unknown>[]) ?? []).slice(0, 10)) {
    const k = await gapi(p, `https://mybusinessbusinessinformation.googleapis.com/v1/${a.name}/locations?readMask=name,title,storefrontAddress&pageSize=100`);
    for (const x of (k.locations as Record<string, unknown>[]) ?? []) {
      const ad = x.storefrontAddress as { addressLines?: string[]; locality?: string } | undefined;
      l.push({ hesap: String(a.name), konum: String(x.name), ad: String(x.title ?? "İşletme"), adres: ad ? [...(ad.addressLines ?? []), ad.locality].filter(Boolean).join(", ") : undefined });
    }
  }
  return l;
}

const tarihParca = (s: string) => { const [y, m, d] = s.split("-").map(Number); return { year: y, month: m, day: d }; };
/** Gönderiyi seçili konumda yayımlar. */
export async function gbpYayinla(p: string, id: string): Promise<GbpGonderi> {
  const ek = await ekOku(p);
  const g = ek.gbp.gonderiler.find((x) => x.id === id);
  if (!g) throw new Error("Gönderi bulunamadı.");
  if (!ek.gbp.konum) throw new Error("Önce gönderilerin yayımlanacağı işletmeyi seç.");
  if (!g.metin.trim()) throw new Error("Gönderi metni boş.");
  const govde: Record<string, unknown> = { languageCode: "tr", summary: g.metin.slice(0, GBP_SINIR), topicType: g.tur };
  if (g.cta && g.cta !== "CALL" && g.adres) govde.callToAction = { actionType: g.cta, url: g.adres };
  if (g.cta === "CALL") govde.callToAction = { actionType: "CALL" };
  if (g.gorsel && /^https:\/\//.test(g.gorsel) && !/localhost/.test(g.gorsel)) govde.media = [{ mediaFormat: "PHOTO", sourceUrl: g.gorsel }];
  if ((g.tur === "EVENT" || g.tur === "OFFER") && g.etkinlik?.bas) govde.event = { title: (g.etkinlik.baslik || g.metin.split("\n")[0]).slice(0, 58), schedule: { startDate: tarihParca(g.etkinlik.bas), endDate: tarihParca(g.etkinlik.bit || g.etkinlik.bas) } };
  if (g.tur === "OFFER") govde.offer = { ...(g.teklif?.kod ? { couponCode: g.teklif.kod } : {}), ...(g.teklif?.kosullar ? { termsConditions: g.teklif.kosullar } : {}), ...(g.adres ? { redeemOnlineUrl: g.adres } : {}) };
  try {
    const y = await gapi(p, `https://mybusiness.googleapis.com/v4/${ek.gbp.konum.hesap}/${ek.gbp.konum.konum}/localPosts`, { method: "POST", body: JSON.stringify(govde) });
    const { v } = await ekGuncelle(p, (v) => { const x = v.gbp.gonderiler.find((q) => q.id === id); if (x) { x.durum = "yayinda"; x.hata = undefined; x.yayin = { ad: String(y.name ?? ""), adres: y.searchUrl as string | undefined, z: Date.now() }; x.guncelleme = Date.now(); } });
    return v.gbp.gonderiler.find((q) => q.id === id)!;
  } catch (e) {
    await ekGuncelle(p, (v) => { const x = v.gbp.gonderiler.find((q) => q.id === id); if (x) { x.durum = "hata"; x.hata = (e as Error).message.slice(0, 300); x.guncelleme = Date.now(); } });
    throw e;
  }
}

/** Projeden hazır taslaklar (modelsiz): yeni ürünler, son yazılar, etkin indirim kodları. */
export async function gbpKaynakTaslaklari(p: Proje, koken: string): Promise<GbpGonderi[]> {
  const site = siteAdresi(p, koken).replace(/\/$/, "");
  const z = Date.now();
  const l: GbpGonderi[] = [];
  const [u, yazilar, v] = await Promise.all([urunler(p.id, "canli").catch(() => null), listeOku<Yazi>(p.id, "yazilar").catch(() => [] as Yazi[]), isletmeOku(p.id).catch(() => null)]);
  for (const x of (u?.urunler ?? []).filter((r) => r.aktif !== false).slice(0, 2)) l.push({ id: kimlikUret(), tur: "STANDARD", metin: `${x.ad} şimdi ${site.replace(/^https?:\/\//, "")} adresinde.${x.aciklama ? ` ${String(x.aciklama).slice(0, 220)}` : ""} Fiyat: ${x.fiyat.toLocaleString("tr-TR")} TL.`, cta: "SHOP", adres: `${site}/`, gorsel: x.gorsel && /^https:/.test(x.gorsel) ? x.gorsel : undefined, durum: "taslak", olusturma: z, guncelleme: z, kaynak: `Ürün: ${x.ad}` });
  for (const y of yayindakiler(yazilar).slice(0, 2)) l.push({ id: kimlikUret(), tur: "STANDARD", metin: `Yeni yazımız: ${y.baslik}. ${y.ozet.slice(0, 260)}`, cta: "LEARN_MORE", adres: `${site}/blog/${y.slug}.html`, gorsel: y.kapak && /^https:/.test(y.kapak) ? y.kapak : undefined, durum: "taslak", olusturma: z, guncelleme: z, kaynak: `Blog: ${y.baslik}` });
  const bugun = new Date(z + 3 * 3600_000).toISOString().slice(0, 10);
  for (const k of (v?.kuponlar ?? []).filter((x) => x.aktif && (!x.bitis || x.bitis >= bugun)).slice(0, 1)) l.push({ id: kimlikUret(), tur: "OFFER", metin: `${k.aciklama || "Sana özel indirim"}: ${k.kod} koduyla ${k.tur === "yuzde" ? `yüzde ${k.deger}` : k.tur === "tutar" ? `${k.deger} TL` : "ücretsiz kargo"} indirim.`, cta: "SHOP", adres: `${site}/`, teklif: { kod: k.kod, kosullar: k.minSepet ? `En az ${k.minSepet} TL alışverişte geçerli.` : "" }, etkinlik: { baslik: k.aciklama || `${k.kod} indirimi`, bas: k.baslangic || bugun, bit: k.bitis || bugun }, durum: "taslak", olusturma: z, guncelleme: z, kaynak: `Kupon: ${k.kod}` });
  return l;
}

/** Yapay zekâyla 3 taslak (model yoksa ModelYok2 atılır). */
export async function gbpTaslakYaz(p: Proje, ek: EkVeri, g: { konu: string; tur: GbpTur; koken: string }) {
  const site = siteAdresi(p, g.koken);
  const kurallar = [
    `- 3 farklı Google İşletme Profili gönderisi. Her biri en çok 600 karakter (sınır ${GBP_SINIR}); ilk cümle tek başına anlaşılır olsun, yerel müşteriye konuşsun.`,
    "- Hashtag kullanma; Google gönderilerinde işe yaramaz. Telefon numarası yazma; Google bunu reddedebilir.",
    "- cta şunlardan biri: LEARN_MORE, BOOK, ORDER, SHOP, SIGN_UP, CALL.",
  ].join("\n");
  const y = await gorev<{ gonderiler?: unknown[] }>("gbp", kurallar, `{"gonderiler":[{"metin":"","cta":"LEARN_MORE"}]}`, `${ozetIle(p, ek, 5000)}\n\n=== İstek ===\nGönderi türü: ${g.tur}\nKonu: ${g.konu || "işletmenin bu haftaki haberi"}\nSite adresi: ${site}\nGoogle İşletme Profili gönderisi yaz.`, 1800);
  const z = Date.now();
  const l: GbpGonderi[] = (Array.isArray(y.veri.gonderiler) ? y.veri.gonderiler : []).slice(0, 3).map((x) => { const n = (x ?? {}) as Record<string, unknown>; const cta = (["LEARN_MORE", "BOOK", "ORDER", "SHOP", "SIGN_UP", "CALL"].includes(String(n.cta)) ? n.cta : "LEARN_MORE") as GbpCta; return { id: kimlikUret(), tur: g.tur, metin: t(n.metin, GBP_SINIR), cta, adres: cta === "CALL" ? undefined : site, durum: "taslak" as const, olusturma: z, guncelleme: z, model: y.model, kaynak: g.konu ? `Konu: ${g.konu.slice(0, 60)}` : "Yapay zekâ" }; }).filter((x) => x.metin);
  return { gonderiler: l, kredi: y.kredi, model: y.model };
}

/** Dakikalık tur: zamanı gelen gönderiler. */
export async function gbpTuru() {
  for (const p of await kasaProjeleri()) {
    try {
      const ek = await ekOku(p);
      if (!ek.gbp.konum) continue;
      for (const g of ek.gbp.gonderiler) if (g.durum === "zamanlandi" && g.zaman && g.zaman <= Date.now()) { if (!(await projeOkuHam(p))) break; await gbpYayinla(p, g.id).catch(() => {}); }
    } catch { /* sonraki tur */ }
  }
}
