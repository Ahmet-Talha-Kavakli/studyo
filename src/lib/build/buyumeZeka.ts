import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { ciktiKalicilastir, dosyaKaydet } from "@/lib/dosyaDepo";
import { gorselUret } from "@/lib/saglayicilar/gorselMotor";
import { yardimciModel, zekaJson } from "./ajanZeka";
import { baglantiBul, disTur } from "./disAjan";
import { krediHesapla } from "./modeller";
import {
  bugunTR, gonderiKanalAdi, gonderiNormalize, gonderiOrani, gonderiSiniri, hedefAdi, HEDEFLER, icerikKanali, konuNormalize, makaleNormalize, META_CTA,
  oranSayi, planKanali, planNormalize, PLAN_KANALLARI, reklamNormalize, simgeTemizle, slugUret, TONLAR,
  type BlogKonu, type BlogMakale, type BuyumePlan, type Gonderi, type HedefId, type IcerikKanalId, type OzelKanal, type ReklamSeti,
} from "./buyumeTipler";
import type { Proje } from "./tipler";

/**
 * Büyüme ajanının model çağrıları. Bütün JSON görevlerinin sistem istemi IMZA ile başlar (yerel sahte model sunucusu
 * görevleri bu cümleden tanır). Model bağlı değilse ModelYok atılır; arayüz bunu dürüstçe söyler, sahte içerik üretilmez.
 */
export class ModelYok extends Error { constructor() { super("Bu sunucuya bağlı bir yapay zekâ modeli yok."); } }
export class UretimHatasi extends Error {}

const IMZA = "Sen Vayra Build'in Büyüme ajanısın: kullanıcının Vayra Build ile yaptığı siteyi ya da uygulamayı tanıtan pazarlama stratejisti ve metin yazarı.";
const ORTAK_KURAL = [
  "Türkçe yaz; Türkiye pazarını, Türk kullanıcı alışkanlıklarını ve TL'yi esas al.",
  "Projede geçmeyen ürün, fiyat, adres, ödül, müşteri sayısı ya da yorum uydurma. Bilmediğin yerde genel konuş.",
  "Metinlerde ≈, ~, %, →, ≠ gibi simgeler kullanma; 'yüzde 20', 'yaklaşık 30' gibi düz kelimeyle yaz.",
  "Abartılı vaat ('bir numara', 'garanti') ve yanıltıcı ifade kullanma.",
].map((s) => `- ${s}`).join("\n");
const TUR_AD: Record<Proje["tur"], string> = { site: "web sitesi", uygulama: "web uygulaması", oyun: "tarayıcı oyunu", mobil: "mobil uygulama" };

const temizMetin = (h: string) => h.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();

/** Ajanın okuduğu proje bağlamı: tür, ad, SEO, sayfalar (başlık, h1, görünen metin), talimatlar ve notlar. */
export function projeOzeti(p: Proje, sinir = 9000): string {
  const sayfalar = Object.entries(p.dosyalar).filter(([y]) => y.endsWith(".html")).sort(([a], [b]) => (a === "index.html" ? -1 : b === "index.html" ? 1 : a.localeCompare(b)));
  const s: string[] = [
    `Proje adı: ${p.ad}`, `Proje türü: ${TUR_AD[p.tur]}`,
    `SEO başlığı: ${p.ayarlar.seo.baslik || "yok"}`, `SEO açıklaması: ${p.ayarlar.seo.aciklama || "yok"}`,
    `Yayın durumu: ${p.yayin ? "yayında" : "henüz yayında değil"}${p.alanAdlari.find((a) => a.durum === "bagli") ? `, alan adı ${p.alanAdlari.find((a) => a.durum === "bagli")!.ad}` : ""}`,
    `Sayfalar: ${sayfalar.map(([y]) => y).join(", ") || "yok"}`,
  ];
  if (p.ayarlar.talimat.trim()) s.push(`Sahibin marka talimatları:\n${p.ayarlar.talimat.trim().slice(0, 1500)}`);
  if (p.ayarlar.hafiza?.length) s.push(`Sahibin tercihleri:\n${p.ayarlar.hafiza.slice(-15).map((n) => `- ${n.metin}`).join("\n")}`);
  let kalan = sinir - s.join("\n").length;
  for (const [yol, h] of sayfalar) {
    if (kalan < 200) break;
    const title = h.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? "";
    const h1 = temizMetin(h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "");
    const govde = temizMetin(h.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? h).slice(0, Math.min(1800, kalan - 120));
    const parca = `\n--- ${yol}${title ? ` (başlık: ${title})` : ""}${h1 ? `\nAna başlık: ${h1}` : ""}\n${govde}`;
    s.push(parca); kalan -= parca.length;
  }
  return s.join("\n");
}

const gunAdi = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const planOzeti = (pl: BuyumePlan | null) => !pl ? "" : [
  `Büyüme hedefi: ${hedefAdi(pl)}`, `Konumlandırma: ${pl.konumlandirma}`,
  `Hedef kitle: ${pl.personalar.map((x) => `${x.ad} (${x.yas}): ${x.tanim}`).join(" | ")}`,
].join("\n");

/** JSON görevi; model yoksa ModelYok, yanıt yoksa ya da çözülemezse UretimHatasi. */
async function jsonGorev<T>(gorev: string, kurallar: string, bicim: string, istem: string, enCok: number): Promise<{ veri: T; kredi: number; model: string }> {
  const m = yardimciModel();
  if (!m) throw new ModelYok();
  const sistem = `${IMZA}\nGÖREV: ${gorev}\n\nKurallar:\n${ORTAK_KURAL}\n${kurallar}\n\nJSON biçimi:\n${bicim}`;
  const y = await zekaJson<T>({ sistem, istem, enCok, signal: AbortSignal.timeout(170_000) });
  if (!y) throw new UretimHatasi(`${m.ad} yanıt vermedi. Biraz sonra yeniden dene.`);
  if (!y.veri) throw new UretimHatasi(`${m.ad} okunabilir bir yanıt döndürmedi; istenen biçimde değildi. Yeniden dene ya da başka bir model bağla.`);
  return { veri: y.veri, kredi: y.kredi, model: m.ad };
}

/** Düz metin (Markdown) görevi: zekaJson ile aynı model seçimi, JSON zorlaması yok. */
async function metinGorev(sistem: string, istem: string, enCok: number): Promise<{ metin: string; kredi: number; model: string }> {
  const m = yardimciModel();
  if (!m) throw new ModelYok();
  const signal = AbortSignal.timeout(170_000);
  try {
    if (m.saglayici === "anthropic") {
      const r = await new Anthropic().messages.create({ model: m.id, max_tokens: enCok, system: sistem, messages: [{ role: "user", content: istem }] }, { signal });
      const metin = r.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
      return { metin, kredi: krediHesapla(m, { girdi: r.usage.input_tokens, cikti: r.usage.output_tokens }), model: m.ad };
    }
    let metin = "";
    const y = await disTur({ model: m, baglanti: baglantiBul(m)!, sistem, gecmis: [{ role: "user", content: [{ type: "text", text: istem }] }], araclar: [], efor: "low", signal,
      olay: { dusunce: () => {}, metin: (s) => { metin += s; }, aracBasla: () => {}, aracGirdi: () => {} } });
    return { metin: metin.trim(), kredi: krediHesapla(m, y.kullanim), model: m.ad };
  } catch (e) {
    if (e instanceof ModelYok) throw e;
    throw new UretimHatasi(`${m.ad} yanıt vermedi. Biraz sonra yeniden dene.`);
  }
}

/* ── Plan ── */
export async function planUret(p: Proje, g: { hedef: HedefId; hedefOzel?: string; butceSiniri?: number; not?: string }) {
  const baslangic = bugunTR();
  const kanalListe = PLAN_KANALLARI.filter((k) => k.id !== "ozel").map((k) => `${k.id} (${k.ad})`).join(", ");
  const kurallar = [
    `- Kanal kimlikleri yalnız şunlar: ${kanalListe}. Projeye uyan 4 ile 7 kanal seç; her birine neden, öncelik (yuksek, orta, dusuk), sıklık ve aylık TL bütçe yaz. Organik kanalın bütçesi 0 olabilir.`,
    "- 2 ya da 3 persona: ad (kısa tanımlayıcı ad, gerçek kişi adı değil), yaş aralığı, kısa tanım, 2 ile 4 ihtiyaç, vakit geçirdiği kanallar.",
    "- Konumlandırma tek cümle: kime, ne sunduğu, rakiplerden farkı.",
    "- Takvim 1'den 30'a kadar gün numarası kullanır; 1. gün planın başladığı gündür. Toplam 18 ile 30 öğe, bir güne en çok 2 öğe. tur: gonderi, reklam, eposta, blog ya da gorev.",
    "- 4 ile 6 metrik; olcum alanı Vayra Analitik'te ölçülebilen kaynağı söyler: ziyaretci, sosyal, ucretli, eposta, arama, form ya da yok.",
    `- Bütçe kalemleri TL ve tam sayı.${g.butceSiniri ? ` Toplam aylık bütçe ${g.butceSiniri} TL'yi geçmesin.` : " Küçük işletme için gerçekçi bir başlangıç bütçesi öner."}`,
    "- 4 ile 8 görev: tur site ise ajanIstemi alanına Vayra Build ajanına verilecek açık bir istek yaz (siteye eklenecek bölüm, form, sayfa); tur icerik ise kanal yaz (instagram, hikaye, tiktok, linkedin, x, whatsapp, eposta).",
  ].join("\n");
  const bicim = `{"ozet":"2 cümle","konumlandirma":"","personalar":[{"ad":"","yas":"25-34","tanim":"","ihtiyaclar":[""],"kanallar":[""]}],"kanallar":[{"kanal":"instagram","oncelik":"yuksek","neden":"","siklik":"haftada 4 gönderi","butce":1500}],"takvim":[{"gun":1,"kanal":"instagram","tur":"gonderi","baslik":"","aciklama":""}],"metrikler":[{"ad":"","hedef":"","neden":"","olcum":"ziyaretci"}],"butce":{"kalemler":[{"ad":"","kanal":"meta","tutar":1500,"not":""}],"not":""},"gorevler":[{"baslik":"","aciklama":"","tur":"site","kanal":"","ajanIstemi":""}]}`;
  const hedef = g.hedef === "ozel" ? `Özel hedef: ${g.hedefOzel || "belirtilmedi"}` : `${HEDEFLER.find((h) => h.id === g.hedef)?.ad}: ${HEDEFLER.find((h) => h.id === g.hedef)?.alt}`;
  const istem = `${projeOzeti(p)}\n\n=== İstek ===\nHedef: ${hedef}\nPlanın ilk günü: ${gunAdi(baslangic)}\n${g.butceSiniri ? `Aylık bütçe sınırı: ${g.butceSiniri} TL\n` : ""}${g.not ? `Sahibin notu: ${g.not}\n` : ""}Bu projeye 30 günlük büyüme planı çıkar.`;
  const y = await jsonGorev<unknown>("plan", kurallar, bicim, istem, 7000);
  const plan = planNormalize(y.veri, { hedef: g.hedef, hedefOzel: g.hedefOzel, butceSiniri: g.butceSiniri, not: g.not, baslangic, olusturma: Date.now(), model: y.model });
  plan.hedef = g.hedef; plan.hedefOzel = g.hedef === "ozel" ? g.hedefOzel : undefined; plan.baslangic = baslangic; plan.model = y.model;
  if (!plan.kanallar.length || !plan.konumlandirma) throw new UretimHatasi(`${y.model} eksik bir plan döndürdü (kanal ya da konumlandırma yok). Yeniden dene.`);
  return { plan, kredi: y.kredi };
}

/* ── Gönderiler ── */
export async function gonderiUret(p: Proje, plan: BuyumePlan | null, g: { kanal: IcerikKanalId; ozelKanal?: OzelKanal; konu: string; ton: string; adet: number; ornek?: Gonderi; tarih?: string; takvimId?: string }) {
  const k = icerikKanali(g.kanal);
  const taslak = { kanal: g.kanal, ozelKanal: g.ozelKanal };
  const sinir = gonderiSiniri(taslak), oran = gonderiOrani(taslak), ad = gonderiKanalAdi(taslak);
  const tonAd = TONLAR.find((t) => t.id === g.ton)?.ad ?? g.ton;
  const kurallar = [
    `- Kanal: ${ad}. Metin ve hashtag'ler birlikte en çok ${sinir} karakter; sınırın epey altında kal.${k.konu ? ` Konu satırı (baslik) en çok ${k.konu} karakter.` : ""}`,
    k.hashtag[1] > 0 ? `- ${k.hashtag[0]} ile ${k.hashtag[1]} hashtag; Türkçe ve konuya özgü, yerel olanları da kat.` : "- Hashtag kullanma (hashtagler boş dizi).",
    `- Ton: ${tonAd}. Emoji ölçülü. İlk satır kaydırmayı durduracak bir kanca olsun; sonda tek bir net çağrı (siteye git, rezervasyon yap gibi).`,
    `- Her gönderi farklı bir açıdan girsin. gorselIstemi: ${oran} oranında, üstünde yazı ve logo olmayan, markaya uygun fotoğraf gerçekçiliğinde bir görselin Türkçe ayrıntılı tarifi (ışık, kadraj, nesneler, renkler).`,
  ].join("\n");
  const bicim = `{"gonderiler":[{${k.konu ? '"baslik":"konu satırı",' : ""}"metin":"","hashtagler":["#ornek"],"gorselIstemi":""}]}`;
  const istem = [projeOzeti(p, 6000), planOzeti(plan), `=== İstek ===\nKonu: ${g.konu || "markayı ve en güçlü yanını tanıtan bir gönderi"}`,
    g.ornek ? `Bu gönderiyi beğendim; aynı kanal ve tonda, aynı konuya yakın ama farklı açılardan ${g.adet} yeni gönderi yaz. Kelimesi kelimesine tekrar etme:\n${g.ornek.baslik ? `Konu satırı: ${g.ornek.baslik}\n` : ""}${g.ornek.metin}\n${g.ornek.hashtagler.join(" ")}` : `${g.adet} gönderi yaz.`].filter(Boolean).join("\n\n");
  const y = await jsonGorev<{ gonderiler?: unknown[] }>("icerik", kurallar, bicim, istem, Math.min(6000, 900 + g.adet * 700));
  const ham = Array.isArray(y.veri.gonderiler) ? y.veri.gonderiler : [];
  const liste = ham.slice(0, g.adet).map((x) => gonderiNormalize(x, { kanal: g.kanal, ozelKanal: g.ozelKanal, konu: g.konu, ton: tonAd, durum: "taslak", tarih: g.tarih, takvimId: g.takvimId })).filter((x) => x.metin);
  if (!liste.length) throw new UretimHatasi(`${y.model} gönderi döndürmedi. Konuyu biraz açıp yeniden dene.`);
  return { gonderiler: liste, kredi: y.kredi };
}

/* ── Gönderi görseli: Vayra görsel stüdyosu, kanal oranında, kalıcı depoya ── */
const DESTEKLI = ["1:1", "4:5", "5:4", "3:4", "4:3", "2:3", "3:2", "9:16", "16:9"];
export async function gonderiGorseli(p: Proje, g: Gonderi): Promise<string> {
  const oran = gonderiOrani(g);
  const hedef = oranSayi(oran);
  const uretim = DESTEKLI.includes(oran) ? oran : DESTEKLI.reduce((a, b) => (Math.abs(oranSayi(b) - hedef) < Math.abs(oranSayi(a) - hedef) ? b : a));
  const istem = `${g.gorselIstemi || g.konu || g.metin.slice(0, 200)}. ${p.ad} için ${icerikKanali(g.kanal).ad.toLocaleLowerCase("tr-TR")} görseli. Görselin üstünde yazı, logo, filigran ya da arayüz öğesi olmasın.`;
  let s: Awaited<ReturnType<typeof gorselUret>>;
  try { s = await gorselUret({ tur: "gorsel", model: "Auto", prompt: istem, meta: { oran: uretim } }); }
  catch (e) { throw new UretimHatasi(`Görsel üretilemedi: ${e instanceof Error ? e.message.slice(0, 160) : "sağlayıcı hata verdi"}.`); }
  const kaynak = s?.ciktiUrl || s?.dataUri;
  if (!kaynak) throw new UretimHatasi("Görsel üretilemedi: bu sunucuya bağlı bir görsel sağlayıcısı yok.");
  if (uretim === oran) return ciktiKalicilastir("gorsel", kaynak);
  // Desteklenmeyen oran (LinkedIn 1.91:1, e-posta 2:1): en yakın oranda üretilir, ortadan kırpılır.
  const bayt = kaynak.startsWith("data:") ? Buffer.from(kaynak.split(",")[1] ?? "", "base64") : Buffer.from(await (await fetch(kaynak)).arrayBuffer());
  const sharp = (await import("sharp")).default;
  const m = await sharp(bayt).metadata();
  const w = m.width ?? 0, h = m.height ?? 0;
  if (!w || !h) return ciktiKalicilastir("gorsel", kaynak);
  const [kw, kh] = w / h > hedef ? [Math.round(h * hedef), h] : [w, Math.round(w / hedef)];
  const kesik = await sharp(bayt).extract({ left: Math.round((w - kw) / 2), top: Math.round((h - kh) / 2), width: kw, height: kh }).webp({ quality: 88 }).toBuffer();
  return dosyaKaydet("gorsel", kesik, "image/webp");
}

/* ── Reklam metinleri ── */
export async function reklamUret(p: Proje, plan: BuyumePlan | null) {
  const kurallar = [
    "- Google Ads duyarlı arama reklamı: tam 15 başlık, her biri en çok 30 karakter; tam 4 açıklama, her biri en çok 90 karakter. Başlıklar birbirini tekrar etmesin: marka, fayda, özellik, yer, güven, çağrı karışık olsun.",
    "- Görünen yol yol1 ve yol2 en çok 15 karakter, boşluksuz, küçük harf.",
    `- Meta reklamı: birincil metin ilk 125 karakterde asıl mesajı versin; başlık en çok 40, açıklama en çok 30 karakter; cta şunlardan biri: ${META_CTA.join(", ")}.`,
    "- 15 ile 25 anahtar kelime: kelime, eslesme (genis, sirali, tam) ve niyet (bilgi, karsilastirma, satin-alma, yerel, marka). Gerçekte aranan, doğal Türkçe sorgular yaz.",
    "- 5 ile 10 negatif anahtar kelime (bedava, iş ilanı gibi istenmeyen tıklamalar).",
  ].join("\n");
  const bicim = `{"google":{"basliklar":[""],"aciklamalar":[""],"yol1":"","yol2":""},"meta":{"birincil":"","baslik":"","aciklama":"","cta":"${META_CTA[0]}"},"anahtarKelimeler":[{"kelime":"","eslesme":"sirali","niyet":"satin-alma"}],"negatifler":[""]}`;
  const y = await jsonGorev<unknown>("reklam", kurallar, bicim, `${projeOzeti(p, 7000)}\n\n${planOzeti(plan)}\n\n=== İstek ===\nBu proje için Google Ads ve Meta reklam metinlerini yaz.`, 4000);
  const r: ReklamSeti = reklamNormalize(y.veri, { olusturma: Date.now(), model: y.model });
  r.model = y.model;
  if (!r.google.basliklar.length && !r.meta.birincil) throw new UretimHatasi(`${y.model} reklam metni döndürmedi. Yeniden dene.`);
  return { reklam: r, kredi: y.kredi };
}

/* ── Blog ── */
export async function blogKonulari(p: Proje, plan: BuyumePlan | null, mevcut: BlogKonu[]) {
  const kurallar = [
    "- Tam 10 blog konusu: projenin müşterisinin Google'da gerçekten aradığı sorulara cevap veren, projeye trafik ve müşteri getirecek konular.",
    "- Her biri için başlık (en çok 70 karakter, merak uyandıran ama tık tuzağı olmayan), hedef anahtar kelime (doğal Türkçe arama sorgusu), niyet (bilgi, karsilastirma, satin-alma, yerel, marka) ve bir cümlelik neden.",
    "- Niyetleri karıştır; en az 2 satın alma ya da yerel niyetli konu olsun.",
  ].join("\n");
  const istem = `${projeOzeti(p, 7000)}\n\n${planOzeti(plan)}${mevcut.length ? `\n\nBunları önermiştin, tekrar etme:\n${mevcut.map((k) => `- ${k.baslik}`).join("\n")}` : ""}\n\n=== İstek ===\n10 blog konusu öner.`;
  const y = await jsonGorev<{ konular?: unknown[] }>("blog-konu", kurallar, `{"konular":[{"baslik":"","anahtarKelime":"","niyet":"bilgi","neden":""}]}`, istem, 2500);
  const konular = (Array.isArray(y.veri.konular) ? y.veri.konular : []).slice(0, 10).map(konuNormalize).filter((k) => k.baslik && k.anahtarKelime);
  if (!konular.length) throw new UretimHatasi(`${y.model} konu önermedi. Yeniden dene.`);
  return { konular, kredi: y.kredi };
}

export async function makaleYaz(p: Proje, konu: BlogKonu): Promise<{ makale: BlogMakale; kredi: number }> {
  const sayfalar = Object.keys(p.dosyalar).filter((y) => y.endsWith(".html"));
  const sistem = [
    "Sen deneyimli bir Türkçe SEO içerik yazarısın. Verilen işletme ya da ürün için arama motorunda üst sıralara çıkacak, okura gerçekten yararlı bir blog yazısı yazarsın.",
    "Yalnız Markdown yaz, açıklama ekleme. Biçim: tek bir # başlık; 2 ya da 3 cümlelik giriş; 4 ile 6 tane ## ara başlık (gerekirse ### alt başlık); yerinde madde listesi; 'Sık sorulan sorular' başlıklı kısa bir bölüm; sonda siteye çağıran bir kapanış paragrafı.",
    `Uzunluk 900 ile 1400 kelime. Hedef anahtar kelimeyi başlıkta, ilk paragrafta ve bir ara başlıkta doğal geçir; doldurma yapma. Sitenin sayfalarına (${sayfalar.join(", ")}) uygun yerde Markdown bağlantısı ver.`,
    "Projede geçmeyen fiyat, adres, ödül ya da istatistik uydurma. ≈, ~, %, → gibi simgeler kullanma; 'yüzde 20' gibi yaz.",
  ].join("\n");
  const y = await metinGorev(sistem, `${projeOzeti(p, 6000)}\n\n=== Yazı ===\nBaşlık: ${konu.baslik}\nHedef anahtar kelime: ${konu.anahtarKelime}\nArama niyeti: ${konu.niyet}\n${konu.neden ? `Neden bu konu: ${konu.neden}\n` : ""}`, 5000);
  const md = simgeTemizle(y.metin.replace(/^```(?:markdown|md)?\s*/i, "").replace(/```\s*$/i, "")).trim();
  if (md.length < 200) throw new UretimHatasi(`${y.model} yazıyı tamamlamadı. Yeniden dene.`);
  const ilkBaslik = md.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const baslik = ilkBaslik && ilkBaslik.length <= 120 ? ilkBaslik : konu.baslik;
  const paragraf = md.split(/\n{2,}/).map((x) => x.trim()).find((x) => x && !/^[#>\-*|`\d]/.test(x)) ?? konu.baslik;
  const duz = paragraf.replace(/[*_`[\]]/g, "").replace(/\((?:https?:\/\/|\/)?[^)]*\)/g, "").replace(/\s+/g, " ").trim();
  const metaAciklama = duz.length <= 155 ? duz : duz.slice(0, 152).replace(/\s+\S*$/, "") + "...";
  const markaEki = ` | ${p.ad}`;
  const metaBaslik = baslik.length + markaEki.length <= 60 ? baslik + markaEki : baslik.slice(0, 60);
  return { makale: makaleNormalize({ konuId: konu.id, baslik, anahtarKelime: konu.anahtarKelime, slug: slugUret(konu.anahtarKelime || baslik), metaBaslik, metaAciklama, markdown: md, model: y.model }), kredi: y.kredi };
}

export const kanalAdi = (id: string) => planKanali(id).ad;
