import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { AJAN_SIMGELERI, ARAC_KATALOG, type AracIzni } from "./ajanKatalog";
import type { AjanAyar } from "./ajanDepo";
import { claudeBagli } from "./disAjan";

/**
 * "Ne yapsın, anlat" kutusundan ajan taslağı. Claude bağlıysa model ad, açıklama, ayrıntılı talimat, araçlar,
 * başlangıç önerileri ve karşılama cümlesini kurar; bağlı değilse tariften anahtar kelimelerle dürüst bir taslak
 * çıkar (talimat = kullanıcının tarifi). Her iki durumda da kullanıcı düzenleyicide her alanı değiştirebilir.
 */
export type Taslak = Pick<AjanAyar, "ad" | "aciklama" | "talimat" | "araclar" | "baslangiclar" | "karsilama" | "simge"> & { yapayZeka: boolean };

const ANAHTAR: [RegExp, string][] = [
  [/araştır|kaynak|güncel|haber|web|internet|rakip|fiyat|piyasa/i, "web_search"],
  [/oku|site|sayfa|makale|adres|link/i, "web_fetch"],
  [/analiz|veri|csv|excel|tablo|grafik|hesap|kod|python|istatistik/i, "code_execution"],
  [/görsel|logo|fotoğraf|resim|kapak|illüstrasyon|afiş|tasarım/i, "gorsel_uret"],
  [/video|reels|klip|tiktok|shorts|film/i, "video_uret"],
  [/müzik|şarkı|jenerik|beste|fon müziği/i, "muzik_uret"],
  [/seslendir|podcast|sesli|ses kaydı|okusun/i, "ses_uret"],
  [/3d|üç boyut|model/i, "model_3d_uret"],
  [/site|uygulama|oyun|mobil|landing|sayfası yap/i, "proje_olustur"],
];

function sezgisel(tarif: string): Taslak {
  const t = tarif.trim();
  const araclar: Record<string, AracIzni> = {};
  for (const [re, id] of ANAHTAR) if (re.test(t)) araclar[id] = ARAC_KATALOG.find((a) => a.id === id)!.varsayilan;
  if (!Object.keys(araclar).length) araclar.web_search = "her-zaman";
  const ilk = t.split(/[.!?\n]/)[0].replace(/^(bir|bana|benim için)\s+/i, "").trim();
  const ad = (ilk.length > 34 ? `${ilk.slice(0, 34).replace(/\s+\S*$/, "")}` : ilk).replace(/^\p{Ll}/u, (h) => h.toLocaleUpperCase("tr")) || "Yeni ajan";
  return {
    ad, aciklama: t.length > 160 ? `${t.slice(0, 160).replace(/\s+\S*$/, "")}…` : t,
    talimat: `Görevin: ${t}\n\nÇalışma biçimin:\n1. İstek belirsizse önce en fazla iki kısa soru sor.\n2. Cevabı net, uygulanabilir ve kısa tut.\n3. Gerektiğinde açık olan araçları kullan; sonucu kullanıcıya özetle.`,
    araclar, baslangiclar: [], karsilama: "", simge: AJAN_SIMGELERI[Math.floor(Math.random() * AJAN_SIMGELERI.length)], yapayZeka: false,
  };
}

export async function taslakKur(tarif: string): Promise<Taslak> {
  if (!claudeBagli()) return sezgisel(tarif);
  try {
    const client = new Anthropic();
    const r = await client.messages.create({
      model: "claude-sonnet-5-5", max_tokens: 4000,
      system: "Sen Vayra Build'de kullanıcılar için yapay zekâ ajanı kuran bir uzmansın. Kullanıcının tarifinden eksiksiz, Türkçe bir ajan yapılandırması çıkar. Talimat ikinci tekil şahısla, rol + amaç + adım adım çalışma biçimi + sınırlar içersin. Yalnız gerçekten gereken araçları aç.",
      tools: [{
        name: "ajan_kur", description: "Ajan yapılandırmasını kaydeder.",
        input_schema: {
          type: "object", additionalProperties: false, required: ["ad", "aciklama", "talimat", "araclar", "baslangiclar", "karsilama"],
          properties: {
            ad: { type: "string", description: "En çok 4 kelimelik ad" },
            aciklama: { type: "string", description: "Tek cümle: ne yapar" },
            talimat: { type: "string", description: "Ayrıntılı sistem talimatı" },
            araclar: { type: "array", items: { type: "string", enum: ARAC_KATALOG.map((a) => a.id) } },
            baslangiclar: { type: "array", items: { type: "string" }, maxItems: 4, description: "Kullanıcının tıklayabileceği 4 örnek istek" },
            karsilama: { type: "string", description: "Sohbet açılınca ajanın ilk cümlesi" },
          },
        },
      }],
      tool_choice: { type: "tool", name: "ajan_kur" },
      messages: [{ role: "user", content: `Ajanın tarifi:\n<tarif>\n${tarif.slice(0, 4000)}\n</tarif>` }],
    });
    const b = r.content.find((x) => x.type === "tool_use");
    const g = (b && b.type === "tool_use" ? b.input : null) as Record<string, unknown> | null;
    if (!g || typeof g.ad !== "string" || typeof g.talimat !== "string") return sezgisel(tarif);
    const araclar: Record<string, AracIzni> = {};
    for (const id of Array.isArray(g.araclar) ? g.araclar : []) { const t = ARAC_KATALOG.find((a) => a.id === id); if (t) araclar[t.id] = t.varsayilan; }
    return {
      ad: g.ad.slice(0, 60), aciklama: String(g.aciklama ?? "").slice(0, 300), talimat: g.talimat.slice(0, 32000), araclar,
      baslangiclar: (Array.isArray(g.baslangiclar) ? g.baslangiclar : []).filter((x): x is string => typeof x === "string").slice(0, 4).map((x) => x.slice(0, 120)),
      karsilama: String(g.karsilama ?? "").slice(0, 300), simge: AJAN_SIMGELERI[Math.floor(Math.random() * AJAN_SIMGELERI.length)], yapayZeka: true,
    };
  } catch { return sezgisel(tarif); }
}
