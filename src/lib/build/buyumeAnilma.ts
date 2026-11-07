import "server-only";
import { isletmeOku, listeOku } from "./isletme";
import { yayindakiler } from "./isletmeIcerik";
import { urunler } from "./isletmeMagaza";
import { GUNLER, ISLETME_TURLERI, type Yazi } from "./isletmeTipler";
import { siteAdresi } from "./bulutKimlik";
import { gorev, ozetIle, t } from "./buyumeAnaliz";
import { kimlikUret, type EkVeri } from "./buyumeEkTipler";
import { anilmaDenetle, MOTORLAR, type AnilmaMotor, type AnilmaSonuc } from "./buyumeGorunurluk";
import type { Proje } from "./tipler";

/**
 * Yapay zekâ görünürlüğü: gerçek anılma testi ve llms.txt üretimi.
 * Anılma testi, sahibin yazdığı soruları web araması açık yanıt motorlarına sorar ve yanıtta ya da kaynak listesinde
 * sitenin alan adı veya işletme adı geçiyor mu bakar. Her soru her motorda bir ücretli API çağrısıdır; anahtar yoksa
 * o motor çalıştırılmaz ve "anahtar yok" denir (tahmin ya da sahte sonuç üretilmez).
 */
export const motorDurumlari = () => MOTORLAR.map((m) => ({ id: m.id, anahtar: !!process.env[m.anahtar], eksik: process.env[m.anahtar] ? [] : [m.anahtar] }));

async function sor(motor: AnilmaMotor, soru: string): Promise<{ metin: string; kaynaklar: string[] }> {
  const zaman = AbortSignal.timeout(60_000);
  if (motor === "perplexity") {
    const r = await fetch("https://api.perplexity.ai/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.BUYUME_PERPLEXITY_MODELI || "sonar", messages: [{ role: "user", content: soru }] }), signal: zaman });
    const j = (await r.json().catch(() => ({}))) as { choices?: { message?: { content?: string } }[]; citations?: string[]; search_results?: { url?: string }[]; error?: { message?: string } };
    if (!r.ok) throw new Error(`Perplexity ${r.status}: ${j.error?.message ?? "yanıt yok"}`);
    return { metin: j.choices?.[0]?.message?.content ?? "", kaynaklar: [...new Set([...(j.citations ?? []), ...(j.search_results ?? []).map((x) => x.url ?? "")].filter(Boolean))] };
  }
  if (motor === "chatgpt") {
    const r = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.BUYUME_OPENAI_ARAMA_MODELI || "gpt-4.1-mini", tools: [{ type: "web_search" }], input: soru }), signal: zaman });
    const j = (await r.json().catch(() => ({}))) as { output?: { type?: string; content?: { type?: string; text?: string; annotations?: { type?: string; url?: string }[] }[] }[]; error?: { message?: string } };
    if (!r.ok) throw new Error(`OpenAI ${r.status}: ${j.error?.message ?? "yanıt yok"}`);
    const parca = (j.output ?? []).filter((o) => o.type === "message").flatMap((o) => o.content ?? []);
    return { metin: parca.map((c) => c.text ?? "").join("\n"), kaynaklar: [...new Set(parca.flatMap((c) => (c.annotations ?? []).filter((a) => a.type === "url_citation").map((a) => a.url ?? "")).filter(Boolean))] };
  }
  const model = process.env.BUYUME_GEMINI_MODELI || "gemini-2.5-flash";
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: "POST", headers: { "x-goog-api-key": process.env.GEMINI_API_KEY ?? "", "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: soru }] }], tools: [{ google_search: {} }] }), signal: zaman });
  const j = (await r.json().catch(() => ({}))) as { candidates?: { content?: { parts?: { text?: string }[] }; groundingMetadata?: { groundingChunks?: { web?: { uri?: string; title?: string } }[] } }[]; error?: { message?: string } };
  if (!r.ok) throw new Error(`Gemini ${r.status}: ${j.error?.message ?? "yanıt yok"}`);
  const c = j.candidates?.[0];
  // Gemini kaynak adresleri yönlendirme bağlantısıdır; başlık alanı çoğunlukla alan adını taşır.
  return { metin: (c?.content?.parts ?? []).map((x) => x.text ?? "").join("\n"), kaynaklar: (c?.groundingMetadata?.groundingChunks ?? []).map((x) => (x.web?.title && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(x.web.title) ? `https://${x.web.title}` : x.web?.uri ?? "")).filter(Boolean) };
}

/** Projenin alan adları (yayın adresi ve bağlı alan adları). */
export function projeAlanlari(p: Proje, koken: string): string[] {
  const l = [new URL(siteAdresi(p, koken)).hostname, ...p.alanAdlari.filter((a) => a.durum === "bagli").map((a) => a.ad)];
  return [...new Set(l.map((x) => x.replace(/^www\./, "")).filter((x) => x && x !== "localhost"))];
}

/** Soruları anahtarı olan motorlara sorar (soru başına motor başına bir çağrı, en çok 8 soru). */
export async function anilmaTesti(p: Proje, koken: string, sorular: string[], motorlar: AnilmaMotor[], ad: string): Promise<AnilmaSonuc[]> {
  const acik = motorlar.filter((m) => !!process.env[MOTORLAR.find((x) => x.id === m)!.anahtar]);
  if (!acik.length) throw new Error("Seçilen yanıt motorlarının hiçbirinin API anahtarı tanımlı değil.");
  const alanlar = projeAlanlari(p, koken);
  const l: AnilmaSonuc[] = [];
  for (const soru of sorular.slice(0, 8)) for (const motor of acik) {
    try {
      const y = await sor(motor, soru);
      const d = anilmaDenetle(y.metin, y.kaynaklar, alanlar, ad);
      l.push({ id: kimlikUret(), motor, soru, anildi: d.kaynakta || d.adGecti, kaynakta: d.kaynakta, adGecti: d.adGecti, sira: d.sira, kaynaklar: y.kaynaklar.slice(0, 10), ozet: y.metin.replace(/\s+/g, " ").slice(0, 600), zaman: Date.now() });
    } catch (e) { l.push({ id: kimlikUret(), motor, soru, anildi: false, kaynakta: false, adGecti: false, kaynaklar: [], ozet: "", zaman: Date.now(), hata: (e as Error).message.slice(0, 240) }); }
  }
  return l;
}

/** Projeden soru önerileri (modelsiz): işletme türü, şehir ve hizmetlerden. */
export async function soruOner(p: Proje): Promise<string[]> {
  const v = await isletmeOku(p.id).catch(() => null);
  const pr = v?.profil;
  const tur = ISLETME_TURLERI.find((x) => x.id === pr?.tur)?.ad?.toLocaleLowerCase("tr-TR") ?? "";
  const yer = [pr?.adres.ilce, pr?.adres.il].filter(Boolean).join(" ") || "";
  const ad = pr?.ad || p.ad;
  const hizmet = v?.randevu.hizmetler?.find((h) => h.aktif)?.ad?.toLocaleLowerCase("tr-TR");
  const l = [
    yer && tur ? `${yer} en iyi ${tur} önerileri neler?` : "",
    yer && tur ? `${yer} civarında ${tur} arıyorum, nereye gitmeliyim?` : "",
    hizmet && yer ? `${yer} ${hizmet} için nereye gidilir?` : "",
    `${ad} nedir, nerede ve ne zaman açık?`,
    `${ad} hakkında yorumlar nasıl?`,
    p.ayarlar.seo.aciklama ? `${p.ayarlar.seo.aciklama.split(/[.!?]/)[0].slice(0, 90)} için hangi siteyi önerirsin?` : "",
  ].filter(Boolean);
  return [...new Set(l)].slice(0, 6);
}
/** Yapay zekâyla soru önerisi (model yoksa ModelYok2 atar). */
export async function soruOnerAi(p: Proje, ek: EkVeri): Promise<{ sorular: string[]; kredi: number }> {
  const y = await gorev<{ sorular?: unknown[] }>("anilma-soru", "- 6 soru: bu işletmenin müşterisinin ChatGPT, Perplexity ya da Gemini'ye gerçekten soracağı, işletme adını içermeyen doğal Türkçe sorular. Şehir ya da semt biliniyorsa kullan.\n- En az 2 soru karşılaştırma ya da öneri istesin.", `{"sorular":[""]}`, `${ozetIle(p, ek, 4000)}\n\nSoruları yaz.`, 800);
  return { sorular: (Array.isArray(y.veri.sorular) ? y.veri.sorular : []).map((x) => t(x, 160)).filter(Boolean).slice(0, 8), kredi: y.kredi };
}

const md = (s: string) => s.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
const etiketsiz = (h: string) => md(h.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&[a-z#0-9]+;/gi, " "));
/**
 * llms.txt (llmstxt.org): başlık, özet, işletme bilgileri, sayfalar, ürünler, yazılar ve sitedeki soru cevaplar.
 * Yalnız projede ve İşletme profilinde olan bilgiler yazılır.
 */
export async function llmsUret(p: Proje, koken: string): Promise<string> {
  const site = siteAdresi(p, koken).replace(/\/$/, "");
  const v = await isletmeOku(p.id).catch(() => null);
  const pr = v?.profil;
  const ad = pr?.ad || p.ayarlar.seo.baslik || p.ad;
  const metaAciklama = (h: string) => { const m = h.match(/<meta[^>]+name=["']description["'][^>]*>/i)?.[0] ?? ""; return md(m.match(/content="([^"]*)"/i)?.[1] ?? m.match(/content='([^']*)'/i)?.[1] ?? ""); };
  const ozet = md(pr?.aciklama || p.ayarlar.seo.aciklama || metaAciklama(p.dosyalar["index.html"] ?? ""));
  const profilVar = !!pr?.ad && (pr.guncelleme ?? 0) > 0;
  const s: string[] = [`# ${md(ad)}`, ""];
  if (ozet) s.push(`> ${ozet.slice(0, 300)}`, "");
  const bilgi: string[] = [];
  const tur = ISLETME_TURLERI.find((x) => x.id === pr?.tur)?.ad;
  if (tur && pr?.ad) bilgi.push(`- Tür: ${tur}`);
  if (pr && !pr.adresGizli && (pr.adres.sokak || pr.adres.il)) bilgi.push(`- Adres: ${[pr.adres.sokak, pr.adres.ilce, pr.adres.il, pr.adres.postaKodu].filter(Boolean).join(", ")}`);
  if (pr?.adresGizli && pr.hizmetBolgesi) bilgi.push(`- Hizmet bölgesi: ${pr.hizmetBolgesi}`);
  if (pr?.telefon) bilgi.push(`- Telefon: ${pr.telefon}`);
  if (pr?.eposta) bilgi.push(`- E-posta: ${pr.eposta}`);
  if (profilVar && pr?.saatler?.some((g) => g.acik)) bilgi.push(`- Çalışma saatleri: ${pr.saatler.map((g, i) => (g.acik ? `${GUNLER[i]} ${g.bas}-${g.bit}` : `${GUNLER[i]} kapalı`)).join("; ")}`);
  if (profilVar && pr?.fiyatAraligi) bilgi.push(`- Fiyat aralığı: ${pr.fiyatAraligi}`);
  const sosyal = Object.entries(pr?.sosyal ?? {}).filter(([, u]) => u);
  if (pr?.googleProfil) sosyal.push(["Google İşletme Profili", pr.googleProfil]);
  if (bilgi.length) s.push("## İşletme bilgileri", "", ...bilgi, "");
  if (sosyal.length) s.push("## Hesaplar", "", ...sosyal.map(([k, u]) => `- [${k}](${u})`), "");
  const sayfalar = Object.keys(p.dosyalar).filter((y) => y.endsWith(".html") && y !== "404.html" && !/-b\.html$/.test(y) && !/^blog\//.test(y)).sort((a, b) => (a === "index.html" ? -1 : b === "index.html" ? 1 : a.localeCompare(b)));
  s.push("## Sayfalar", "", ...sayfalar.map((y) => { const h = p.dosyalar[y]; const b = etiketsiz(h.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "") || y; const a = metaAciklama(h); return `- [${b}](${site}/${y === "index.html" ? "" : y})${a ? `: ${a}` : ""}`; }), "");
  const u = await urunler(p.id, "canli").catch(() => null);
  const ul = (u?.urunler ?? []).filter((x) => x.aktif !== false).slice(0, 30);
  if (ul.length) s.push("## Ürünler ve hizmetler", "", ...ul.map((x) => `- ${md(x.ad)}: ${x.fiyat.toLocaleString("tr-TR")} TL${x.kategori ? ` (${md(x.kategori)})` : ""}`), "");
  const hiz = (v?.randevu.hizmetler ?? []).filter((h) => h.aktif).slice(0, 20);
  if (hiz.length) s.push("## Randevulu hizmetler", "", ...hiz.map((h) => `- ${md(h.ad)}: ${h.sure} dakika${h.fiyat ? `, ${h.fiyat.toLocaleString("tr-TR")} TL` : ""}`), "");
  const yazilar = yayindakiler(await listeOku<Yazi>(p.id, "yazilar").catch(() => [] as Yazi[])).slice(0, 15);
  if (yazilar.length) s.push("## Yazılar", "", ...yazilar.map((y) => `- [${md(y.baslik)}](${site}/blog/${y.slug}.html)${y.ozet ? `: ${md(y.ozet).slice(0, 160)}` : ""}`), "");
  const sss: string[] = [];
  for (const y of sayfalar) for (const m of p.dosyalar[y].matchAll(/<(summary|dt|h3)[^>]*>([\s\S]*?)<\/\1>\s*(?:<\/?[a-z]+[^>]*>\s*)*?([\s\S]{0,600}?)<\/(p|dd|div|details)>/gi)) {
    const q = etiketsiz(m[2]); const c = etiketsiz(m[3]);
    if (/\?\s*$/.test(q) && c.length > 15 && sss.length < 12) sss.push(`- ${q} ${c.slice(0, 300)}`);
  }
  if (sss.length) s.push("## Sık sorulan sorular", "", ...sss, "");
  return s.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}
