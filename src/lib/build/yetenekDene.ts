import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { baglantiBul, claudeBagli, disTur } from "./disAjan";
import { modelBul } from "./modeller";
import { sohbetSistemi } from "./sohbetAjan";
import type { Yetenek } from "./yetenekDepo";

/**
 * Yetenek denemeleri (skill-creator akışının hafif karşılığı):
 *  - karsilastir: aynı istem yetenek yüklü ve yüklü değilken aynı modelle yan yana çalışır.
 *  - tetikTesti: her sorgu, sohbetteki gerçek düzenle (yetenek listesi sistem isteminde + yetenek_oku aracı) modele
 *    sorulur; modelin ilk adımında bu yeteneği yükleyip yüklemediği okunur. Yanında açıklamayla sözcük örtüşmesi verilir.
 */
export type TurSonuc = { metin: string; sure: number; girdi: number; cikti: number; cagrilar: { ad: string; girdi: unknown }[]; hata?: string };

async function tur(modelId: string, sistem: string, istem: string, araclar: Anthropic.Beta.BetaTool[] = []): Promise<TurSonuc> {
  const m = modelBul(modelId);
  const bas = Date.now();
  try {
    if (m.saglayici === "anthropic") {
      if (!claudeBagli()) return { metin: "", sure: 0, girdi: 0, cikti: 0, cagrilar: [], hata: "Claude bu sunucuda bağlı değil; başka bir model seç." };
      const r = await new Anthropic().messages.create({ model: m.id, max_tokens: 2000, system: sistem, messages: [{ role: "user", content: istem }], ...(araclar.length ? { tools: araclar as Anthropic.Tool[] } : {}) });
      return {
        metin: r.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim(), sure: Date.now() - bas, girdi: r.usage.input_tokens, cikti: r.usage.output_tokens,
        cagrilar: r.content.filter((b) => b.type === "tool_use").map((b) => (b.type === "tool_use" ? { ad: b.name, girdi: b.input } : { ad: "", girdi: {} })),
      };
    }
    const b = baglantiBul(m);
    if (!b) return { metin: "", sure: 0, girdi: 0, cikti: 0, cagrilar: [], hata: `${m.ad} bu sunucuda bağlı değil; başka bir model seç.` };
    const r = await disTur({ model: m, baglanti: b, sistem, gecmis: [{ role: "user", content: istem }], araclar, efor: "low", signal: AbortSignal.timeout(90_000), olay: { dusunce: () => {}, metin: () => {}, aracBasla: () => {}, aracGirdi: () => {} } });
    const metin = (Array.isArray(r.ileti.content) ? r.ileti.content : []).map((x) => (x.type === "text" ? String(x.text ?? "") : "")).join("").trim();
    return { metin, sure: Date.now() - bas, girdi: r.kullanim.girdi + r.kullanim.onbellek, cikti: r.kullanim.cikti, cagrilar: r.cagrilar.map((c) => ({ ad: c.name, girdi: c.input })) };
  } catch (e) {
    return { metin: "", sure: Date.now() - bas, girdi: 0, cikti: 0, cagrilar: [], hata: (e as Error).name === "TimeoutError" ? "Model zamanında yanıt vermedi." : (e as Error).message.slice(0, 300) };
  }
}

/** Aynı istem: yetenek yüklüyken ve yokken. */
export async function karsilastir(y: Yetenek, istem: string, modelId: string): Promise<{ ile: TurSonuc; olmadan: TurSonuc }> {
  const taban = sohbetSistemi("");
  const yuklu = `${taban}\n<yuklenen_yetenek ad="${y.ad}">\nBu yetenek görevle eşleşti ve yüklendi; talimatına uy.\n${y.govde.slice(0, 40_000)}${y.dosyalar.length ? `\nEk dosyalar: ${y.dosyalar.map((d) => d.yol).join(", ")}` : ""}\n</yuklenen_yetenek>`;
  const [ile, olmadan] = await Promise.all([tur(modelId, yuklu, istem), tur(modelId, taban, istem)]);
  return { ile, olmadan };
}

const KOK = (s: string) => s.toLocaleLowerCase("tr").normalize("NFKD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9ğüşıöç]+/).filter((x) => x.length > 2).map((x) => x.slice(0, 5));
const DURAK = new Set(["icin", "gibi", "olan", "olar", "kull", "zaman", "yapa", "veya", "ile", "bir", "bu", "and", "the", "with", "when", "this", "that", "your", "from"]);
/** Açıklama ile sorgu arasındaki sözcük kökü örtüşmesi (0-100). Modelden bağımsız yardımcı ölçü. */
export function ortusme(aciklama: string, sorgu: string): number {
  const a = new Set(KOK(aciklama).filter((x) => !DURAK.has(x))), s = [...new Set(KOK(sorgu).filter((x) => !DURAK.has(x)))];
  if (!s.length) return 0;
  return Math.round((s.filter((x) => a.has(x)).length / s.length) * 100);
}

export type TetikSonuc = { sorgu: string; beklenen: boolean; tetiklendi: boolean | null; baska?: string; ortusme: number; hata?: string };
/** Tetiklenme testi: tüm etkin yetenekler listede (gerçek seçim ortamı), model bu yeteneği yüklüyor mu. */
export async function tetikTesti(y: Yetenek, digerleri: Pick<Yetenek, "ad" | "aciklama">[], sorgular: { sorgu: string; beklenen: boolean }[], modelId: string): Promise<TetikSonuc[]> {
  const liste = [{ ad: y.ad, aciklama: y.aciklama }, ...digerleri.filter((x) => x.ad !== y.ad)].slice(0, 30);
  const sistem = sohbetSistemi("", liste);
  const arac: Anthropic.Beta.BetaTool = { name: "yetenek_oku", description: "Bir yeteneğin talimatını (SKILL.md gövdesi) ve ek dosyalarının listesini yükler.", input_schema: { type: "object", properties: { ad: { type: "string", description: "Yeteneğin adı" } }, required: ["ad"] } };
  const sonuc: TetikSonuc[] = [];
  for (let i = 0; i < sorgular.length; i += 4) {
    const parca = await Promise.all(sorgular.slice(i, i + 4).map(async (q) => {
      const r = await tur(modelId, sistem, q.sorgu, [arac]);
      const yuklenen = r.cagrilar.filter((c) => c.ad === "yetenek_oku").map((c) => String((c.girdi as { ad?: unknown })?.ad ?? ""));
      return { sorgu: q.sorgu, beklenen: q.beklenen, tetiklendi: r.hata ? null : yuklenen.includes(y.ad), baska: yuklenen.find((x) => x !== y.ad), ortusme: ortusme(y.aciklama, q.sorgu), hata: r.hata };
    }));
    sonuc.push(...parca);
  }
  return sonuc;
}

const jsonAl = <T,>(m: string): T | null => { const a = m.indexOf("{"), b = m.lastIndexOf("}"); if (a < 0 || b <= a) return null; try { return JSON.parse(m.slice(a, b + 1)) as T; } catch { return null; } };

/** Tetik testi için sorgu önerisi: tetiklemesi gereken çeşitli istekler ve yakın ama tetiklememesi gerekenler. */
export async function sorguUret(y: Yetenek, modelId: string): Promise<{ sorgular: { sorgu: string; beklenen: boolean }[]; hata?: string }> {
  const r = await tur(modelId, "Bir yapay zekâ yeteneğinin (SKILL.md) tetiklenme testine sorgu yazıyorsun. Gerçek kullanıcıların yazacağı gibi, kısa ve çeşitli Türkçe istekler üret: 8 tane bu yeteneği GEREKTİREN (farklı söyleyişler, dolaylı anlatımlar dahil) ve 8 tane konu olarak yakın ama bu yeteneği GEREKTİRMEYEN istek. Yalnız JSON döndür: {\"tetiklemeli\": [\"...\"], \"tetiklememeli\": [\"...\"]}",
    `Yetenek adı: ${y.ad}\nAçıklama: ${y.aciklama}\n\nTalimatın başı:\n${y.govde.slice(0, 3000)}`);
  if (r.hata) return { sorgular: [], hata: r.hata };
  const j = jsonAl<{ tetiklemeli?: unknown[]; tetiklememeli?: unknown[] }>(r.metin);
  const al = (l: unknown[] | undefined, beklenen: boolean) => (l ?? []).filter((x): x is string => typeof x === "string" && !!x.trim()).slice(0, 10).map((sorgu) => ({ sorgu: sorgu.trim().slice(0, 300), beklenen }));
  const sorgular = [...al(j?.tetiklemeli, true), ...al(j?.tetiklememeli, false)];
  return sorgular.length ? { sorgular } : { sorgular: [], hata: "Model geçerli bir sorgu listesi döndürmedi." };
}

/**
 * Açıklamayı iyileştir: yanlış sonuçlanan sorgulara bakıp yeni açıklama önerir, öneriyi aynı sorgularla aynı ortamda
 * yeniden test eder. Dönüş: öneri, eski ve yeni doğru sayısı, yeni sonuçlar.
 */
export async function aciklamaIyilestir(y: Yetenek, digerleri: Pick<Yetenek, "ad" | "aciklama">[], sorgular: { sorgu: string; beklenen: boolean }[], onceki: TetikSonuc[], modelId: string): Promise<{ oneri?: string; neden?: string; sonra?: TetikSonuc[]; hata?: string }> {
  const yanlis = onceki.filter((s) => s.tetiklendi !== null && s.tetiklendi !== s.beklenen);
  const r = await tur(modelId, "Bir yapay zekâ yeteneğinin açıklamasını (SKILL.md description) iyileştiriyorsun. Açıklama, modelin bu yeteneği ne zaman yükleyeceğine karar verdiği tek metindir. Ne yaptığını ve HANGİ durumlarda kullanılacağını somut sözcüklerle anlat; tetiklememesi gereken yakın durumları ayıran sınırı açıkça yaz. Türkçe, en çok 1024 karakter, üçüncü tekil kişi. Yalnız JSON döndür: {\"aciklama\": \"...\", \"neden\": \"neyi değiştirdiğini anlatan tek cümle\"}",
    `Yetenek adı: ${y.ad}\nŞimdiki açıklama: ${y.aciklama}\n\nTalimatın başı:\n${y.govde.slice(0, 2500)}\n\nTest sorguları ve sonuçlar:\n${onceki.map((s) => `- "${s.sorgu}": ${s.beklenen ? "tetiklemeli" : "tetiklememeli"}, model ${s.tetiklendi === null ? "ölçülemedi" : s.tetiklendi ? "yükledi" : "yüklemedi"}`).join("\n")}\n\nYanlış olanlar: ${yanlis.length ? yanlis.map((s) => `"${s.sorgu}"`).join(", ") : "yok; açıklamayı yine de daha net yap"}`);
  if (r.hata) return { hata: r.hata };
  const j = jsonAl<{ aciklama?: string; neden?: string }>(r.metin);
  const oneri = typeof j?.aciklama === "string" ? j.aciklama.trim().slice(0, 1024) : "";
  if (!oneri) return { hata: "Model geçerli bir açıklama döndürmedi." };
  const sonra = await tetikTesti({ ...y, aciklama: oneri }, digerleri, sorgular, modelId);
  return { oneri, neden: typeof j?.neden === "string" ? j.neden.slice(0, 300) : undefined, sonra };
}
