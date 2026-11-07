import "server-only";
import { randomBytes } from "crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { bildirimOz } from "./bildirim";
import { sahipOzeti } from "./depo";
import { modelBagli } from "./disAjan";
import { modelBul } from "./modeller";
import { jsonBul, tekSeferlik } from "./sohbetCagri";

/**
 * Ses kaydı ve toplantı dökümü (ChatGPT Record, Otter, Gemini Notes gibi): yüklenen ya da tarayıcıda kaydedilen ses
 * OpenAI konuşma tanımayla metne dökülür, konuşmacılar ayrılır (gpt-4o-transcribe-diarize; olmazsa whisper-1 ile
 * ayrımsız döküm), sonra seçilen modelle özet, kararlar, eylem maddeleri ve bölüm başlıkları çıkarılır.
 * Sağlayıcı yoksa uydurma döküm üretilmez: yüklenen dosya reddedilir; canlı kayıtta tarayıcının kendi tanıması
 * (konuşmacı ayrımı olmadan, açıkça belirtilerek) kullanılabilir. Kayıtlar: .veri/build/sohbet-dokum/<sahip>/<id>.json
 */
export type Konusmaci = { id: string; ad: string };
export type DokumParcasi = { k: string; bas: number; son: number; metin: string };
export type Eylem = { metin: string; sorumlu?: string; tarih?: string; bitti?: boolean };
export type Dokum = {
  id: string; baslik: string; olusturma: number; sure: number; boyut: number; mime: string; ses?: string;
  kaynak: "yukleme" | "kayit"; durum: "isleniyor" | "ozetleniyor" | "bitti" | "hata"; hata?: string; adim?: string;
  saglayici?: "openai-ayrimli" | "openai" | "tarayici"; tanimaModeli?: string; uyari?: string;
  konusmacilar: Konusmaci[]; parcalar: DokumParcasi[];
  ozet?: string; kararlar?: string[]; eylemler?: Eylem[]; bolumler?: { baslik: string; bas: number }[]; ozetModel?: string; ozetHata?: string; kredi?: number;
};
export const DOKUM_SINIRI = { bayt: 25 * 1024 * 1024, adet: 200 };
const KOK = path.join(DEPO_KOK, "build", "sohbet-dokum");
const dizin = (oz: string) => path.join(KOK, oz);
const KIMLIK = /^[A-Za-z0-9_-]{10,16}$/;
const UZANTI: Record<string, string> = { "audio/webm": "webm", "audio/ogg": "ogg", "audio/mpeg": "mp3", "audio/mp3": "mp3", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/m4a": "m4a", "audio/wav": "wav", "audio/x-wav": "wav", "audio/wave": "wav", "audio/flac": "flac", "video/mp4": "mp4", "video/webm": "webm" };
export const sesMime = (ad: string) => ({ webm: "audio/webm", ogg: "audio/ogg", mp3: "audio/mpeg", m4a: "audio/mp4", wav: "audio/wav", flac: "audio/flac", mp4: "video/mp4" } as Record<string, string>)[ad.split(".").pop() ?? ""] ?? "application/octet-stream";

export const tanimaKurulu = () => !!process.env.OPENAI_API_KEY;
async function yaz(oz: string, d: Dokum) { await mkdir(dizin(oz), { recursive: true }); await writeFile(path.join(dizin(oz), `${d.id}.json`), JSON.stringify(d)); }
export async function dokumOku(oz: string, id: string): Promise<Dokum | null> {
  if (!KIMLIK.test(id)) return null;
  try { return JSON.parse(await readFile(path.join(dizin(oz), `${id}.json`), "utf8")) as Dokum; } catch { return null; }
}
export const dokumGetir = (sahip: string, id: string) => dokumOku(sahipOzeti(sahip), id);
export async function dokumleriListele(sahip: string) {
  const oz = sahipOzeti(sahip);
  let l: string[] = [];
  try { l = (await readdir(dizin(oz))).filter((f) => f.endsWith(".json")); } catch { return []; }
  const o: (Omit<Dokum, "parcalar"> & { kelime: number })[] = [];
  for (const f of l) { const d = await dokumOku(oz, f.slice(0, -5)); if (d) { const { parcalar, ...x } = d; o.push({ ...x, kelime: parcalar.reduce((t, p) => t + p.metin.split(/\s+/).length, 0) }); } }
  return o.sort((a, b) => b.olusturma - a.olusturma);
}
export async function dokumGuncelle(sahip: string, id: string, f: (d: Dokum) => void): Promise<Dokum | null> {
  const oz = sahipOzeti(sahip);
  const d = await dokumOku(oz, id);
  if (!d) return null;
  f(d);
  await yaz(oz, d);
  return d;
}
export async function dokumSil(sahip: string, id: string): Promise<boolean> {
  const oz = sahipOzeti(sahip);
  const d = await dokumOku(oz, id);
  if (!d) return false;
  await rm(path.join(dizin(oz), `${id}.json`), { force: true });
  if (d.ses) await rm(path.join(dizin(oz), d.ses), { force: true });
  return true;
}
export async function sesDosyasi(sahip: string, id: string): Promise<{ veri: Buffer; mime: string } | null> {
  const oz = sahipOzeti(sahip);
  const d = await dokumOku(oz, id);
  if (!d?.ses) return null;
  try { return { veri: await readFile(path.join(dizin(oz), d.ses)), mime: d.mime }; } catch { return null; }
}

/* ───────────── Konuşma tanıma ───────────── */
type OpenAISegment = { speaker?: string; start: number; end: number; text: string };
async function openaiTani(bayt: Buffer, ad: string, mime: string, dil: string | undefined, model: string, bicim: string): Promise<{ segmentler: OpenAISegment[]; metin: string; sure?: number }> {
  const fd = new FormData();
  fd.append("file", new Blob([new Uint8Array(bayt)], { type: mime }), ad);
  fd.append("model", model);
  fd.append("response_format", bicim);
  if (model.includes("diarize")) fd.append("chunking_strategy", "auto");
  if (bicim === "verbose_json") fd.append("timestamp_granularities[]", "segment");
  if (dil) fd.append("language", dil);
  const r = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: fd, signal: AbortSignal.timeout(15 * 60_000) });
  const t = await r.text();
  if (!r.ok) { let m = t.slice(0, 300); try { m = (JSON.parse(t) as { error?: { message?: string } }).error?.message ?? m; } catch { /* düz */ } throw Object.assign(new Error(`Konuşma tanıma ${r.status}: ${m}`), { durum: r.status }); }
  const v = JSON.parse(t) as { text?: string; segments?: OpenAISegment[]; duration?: number };
  return { segmentler: v.segments ?? [], metin: v.text ?? "", sure: v.duration };
}

const KONUSMACI_ADLARI = (i: number) => `Konuşmacı ${i + 1}`;
function parcalaraCevir(seg: OpenAISegment[], metin: string, ayrimli: boolean): { parcalar: DokumParcasi[]; konusmacilar: Konusmaci[] } {
  const harita = new Map<string, string>();
  const parcalar: DokumParcasi[] = [];
  for (const s of seg) {
    const ham = ayrimli ? String(s.speaker ?? "A") : "A";
    if (!harita.has(ham)) harita.set(ham, String.fromCharCode(65 + harita.size));
    const k = harita.get(ham)!;
    const son = parcalar[parcalar.length - 1];
    // Aynı konuşmacının art arda kısa parçaları birleştirilir (okunurluk).
    if (son && son.k === k && s.start - son.son < 1.5 && son.metin.length < 600) { son.metin = `${son.metin} ${s.text.trim()}`; son.son = s.end; }
    else parcalar.push({ k, bas: Math.max(0, s.start), son: s.end, metin: s.text.trim() });
  }
  if (!parcalar.length && metin.trim()) { parcalar.push({ k: "A", bas: 0, son: 0, metin: metin.trim() }); harita.set("A", "A"); }
  return { parcalar: parcalar.filter((p) => p.metin), konusmacilar: [...harita.values()].map((id, i) => ({ id, ad: KONUSMACI_ADLARI(i) })) };
}

/* ───────────── Özet ───────────── */
const sureYaz = (sn: number) => `${Math.floor(sn / 60)}.${String(Math.floor(sn % 60)).padStart(2, "0")}`;
export function dokumMetni(d: Pick<Dokum, "parcalar" | "konusmacilar">, zamanli = true): string {
  const ad = (k: string) => d.konusmacilar.find((x) => x.id === k)?.ad ?? k;
  return d.parcalar.map((p) => `${zamanli ? `[${sureYaz(p.bas)}] ` : ""}${ad(p.k)}: ${p.metin}`).join("\n");
}
export async function dokumuOzetle(sahip: string, id: string, modelId?: string): Promise<Dokum | null> {
  const oz = sahipOzeti(sahip);
  const d = await dokumOku(oz, id);
  if (!d || !d.parcalar.length) return d;
  const model = modelBul(modelId || d.ozetModel);
  if (!modelBagli(model)) { d.ozetHata = `${model.ad} bu sunucuya bağlı değil; özet çıkarılamadı. Döküm hazır.`; d.durum = "bitti"; await yaz(oz, d); return d; }
  d.durum = "ozetleniyor"; d.adim = "Özet ve eylem maddeleri çıkarılıyor"; await yaz(oz, d);
  const r = await tekSeferlik({
    model: model.id, efor: "low",
    sistem: `Sen Vayra'nın toplantı dökümünü özetliyorsun. Dökümü dikkatle oku ve yalnız şu JSON'u döndür (Türkçe, uydurma bilgi ekleme):
{"baslik": "en çok 8 kelimelik başlık", "ozet": "3 ile 6 cümlelik özet", "kararlar": ["alınan kararlar"], "eylemler": [{"metin": "yapılacak iş", "sorumlu": "dökümde geçiyorsa kişi ya da konuşmacı", "tarih": "dökümde geçiyorsa son tarih"}], "bolumler": [{"baslik": "konu başlığı", "bas": saniye}], "adlar": {"A": "konuşmacı kendini tanıttıysa adı"}}
Karar ya da eylem yoksa boş dizi ver. adlar yalnız dökümde açıkça geçen adlardır; emin değilsen yazma.`,
    ileti: `Kayıt süresi: ${sureYaz(d.sure)} dakika. Konuşmacılar: ${d.konusmacilar.map((k) => `${k.id} (${k.ad})`).join(", ")}.\n\n<dokum>\n${dokumMetni(d).slice(0, 120_000)}\n</dokum>`,
  });
  const son = (await dokumOku(oz, id)) ?? d;
  if ("hata" in r) { son.ozetHata = r.hata; son.durum = "bitti"; son.adim = undefined; await yaz(oz, son); return son; }
  const j = jsonBul<{ baslik?: string; ozet?: string; kararlar?: unknown[]; eylemler?: { metin?: string; sorumlu?: string; tarih?: string }[]; bolumler?: { baslik?: string; bas?: number }[]; adlar?: Record<string, string> }>(r.metin);
  if (!j) { son.ozetHata = "Model geçerli bir özet döndürmedi. Yeniden dene."; son.durum = "bitti"; son.adim = undefined; await yaz(oz, son); return son; }
  if (j.baslik && /^(Kayıt|Ses kaydı|Toplantı) \d/.test(son.baslik)) son.baslik = String(j.baslik).slice(0, 100);
  son.ozet = String(j.ozet ?? "").slice(0, 3000);
  son.kararlar = (Array.isArray(j.kararlar) ? j.kararlar : []).map((x) => String(x).slice(0, 400)).filter(Boolean).slice(0, 30);
  son.eylemler = (Array.isArray(j.eylemler) ? j.eylemler : []).map((x) => ({ metin: String(x?.metin ?? "").slice(0, 400), ...(x?.sorumlu ? { sorumlu: String(x.sorumlu).slice(0, 80) } : {}), ...(x?.tarih ? { tarih: String(x.tarih).slice(0, 60) } : {}) })).filter((x) => x.metin).slice(0, 40);
  son.bolumler = (Array.isArray(j.bolumler) ? j.bolumler : []).map((x) => ({ baslik: String(x?.baslik ?? "").slice(0, 120), bas: Math.max(0, Number(x?.bas) || 0) })).filter((x) => x.baslik).slice(0, 20);
  for (const [k, v] of Object.entries(j.adlar ?? {})) { const x = son.konusmacilar.find((y) => y.id === k); if (x && typeof v === "string" && v.trim() && /^Konuşmacı \d+$/.test(x.ad)) x.ad = v.trim().slice(0, 40); }
  son.ozetModel = model.id; son.ozetHata = undefined; son.kredi = (son.kredi ?? 0) + r.kredi;
  son.durum = "bitti"; son.adim = undefined;
  await yaz(oz, son);
  return son;
}

/** Canlı kayıtta tarayıcının tanıdığı metin (sağlayıcı yoksa ya da kullanıcı isterse). */
export type TarayiciParcasi = { bas: number; son: number; metin: string };

/**
 * Yeni döküm: ses kaydedilir, tanıma ve özet arka planda sürer (istemci yoklar; bitince bildirim de düşer).
 * Sağlayıcı yoksa: tarayıcı metni varsa onunla devam edilir, yoksa açık hata döner.
 */
export async function dokumBaslat(sahip: string, g: { bayt: Buffer; ad: string; mime: string; sure: number; kaynak: "yukleme" | "kayit"; dil?: string; model?: string; tarayici?: TarayiciParcasi[]; baslik?: string }): Promise<{ dokum: Dokum } | { hata: string; durum?: number }> {
  if (g.bayt.length > DOKUM_SINIRI.bayt) return { hata: "Dosya 25 MB sınırını aşıyor. Daha kısa bir kayıt ya da sıkıştırılmış (mp3, m4a) dosya yükle.", durum: 413 };
  const tarayici = (g.tarayici ?? []).filter((p) => p && typeof p.metin === "string" && p.metin.trim()).slice(0, 3000);
  if (!tanimaKurulu() && !tarayici.length) return { hata: g.kaynak === "kayit" ? "Konuşma tanıma sağlayıcısı bağlı değil (sunucuda OPENAI_API_KEY yok) ve bu tarayıcı canlı tanıma yapmadı. Kayıt metne dökülemedi." : "Konuşma tanıma sağlayıcısı bağlı değil (sunucuda OPENAI_API_KEY yok); yüklenen ses metne dökülemez. Tarayıcıda canlı kayıt alırsan tarayıcının kendi tanımasıyla döküm çıkarılabilir.", durum: 503 };
  const oz = sahipOzeti(sahip);
  const uz = UZANTI[g.mime.split(";")[0]] ?? (g.ad.split(".").pop()?.toLowerCase() || "webm");
  if (!/^(webm|ogg|mp3|m4a|wav|flac|mp4|mpeg|mpga|oga)$/.test(uz)) return { hata: "Bu dosya türü desteklenmiyor. mp3, m4a, wav, webm, ogg ya da flac yükle.", durum: 415 };
  try { if ((await readdir(dizin(oz))).filter((f) => f.endsWith(".json")).length >= DOKUM_SINIRI.adet) return { hata: `En çok ${DOKUM_SINIRI.adet} döküm saklanabilir; eskileri sil.` }; } catch { /* ilk */ }
  const id = randomBytes(8).toString("base64url").slice(0, 12);
  const ses = `${id}.${uz}`;
  await mkdir(dizin(oz), { recursive: true });
  await writeFile(path.join(dizin(oz), ses), g.bayt);
  const tarih = new Date().toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  const d: Dokum = {
    id, baslik: g.baslik?.trim().slice(0, 100) || `${g.kaynak === "kayit" ? "Kayıt" : "Ses kaydı"} ${tarih}`, olusturma: Date.now(), sure: Math.max(0, g.sure || 0), boyut: g.bayt.length, mime: sesMime(ses), ses,
    kaynak: g.kaynak, durum: "isleniyor", adim: tanimaKurulu() ? "Konuşma metne dökülüyor" : "Tarayıcı dökümü işleniyor", konusmacilar: [], parcalar: [], ozetModel: modelBul(g.model).id,
  };
  await yaz(oz, d);
  void (async () => {
    try {
      if (tanimaKurulu()) {
        let r: Awaited<ReturnType<typeof openaiTani>>, ayrimli = true, tanimaModeli = "gpt-4o-transcribe-diarize";
        try { r = await openaiTani(g.bayt, ses, d.mime, g.dil, tanimaModeli, "diarized_json"); }
        catch (e) {
          // Ayrımlı model erişilemezse ayrımsız Whisper ile denenir (dürüst uyarıyla).
          if ((e as { durum?: number }).durum === 401) throw e;
          ayrimli = false; tanimaModeli = "whisper-1";
          r = await openaiTani(g.bayt, ses, d.mime, g.dil, tanimaModeli, "verbose_json");
        }
        const x = parcalaraCevir(r.segmentler, r.metin, ayrimli);
        const son = (await dokumOku(oz, id)) ?? d;
        Object.assign(son, { parcalar: x.parcalar, konusmacilar: x.konusmacilar, saglayici: ayrimli ? "openai-ayrimli" : "openai", tanimaModeli, sure: r.sure ?? son.sure ?? x.parcalar[x.parcalar.length - 1]?.son ?? 0, ...(ayrimli ? {} : { uyari: "Konuşmacı ayrımı yapılamadı (ayrımlı tanıma modeline erişilemedi); döküm tek konuşmacı olarak gösteriliyor." }) });
        await yaz(oz, son);
      } else {
        const son = (await dokumOku(oz, id)) ?? d;
        Object.assign(son, { parcalar: tarayici.map((p) => ({ k: "A", bas: Math.max(0, p.bas), son: Math.max(p.bas, p.son), metin: p.metin.trim().slice(0, 4000) })), konusmacilar: [{ id: "A", ad: "Konuşmacı 1" }], saglayici: "tarayici", tanimaModeli: "Tarayıcının konuşma tanıması", uyari: "Sunucuda konuşma tanıma sağlayıcısı yok; döküm tarayıcının canlı tanımasından alındı. Konuşmacı ayrımı yapılmadı, doğruluk düşük olabilir." });
        await yaz(oz, son);
      }
      const o = await dokumuOzetle(sahip, id);
      if (o && o.parcalar.length) await bildirimOz(oz, { tur: "dokum", baslik: `${o.baslik} hazır`, metin: o.ozet ? o.ozet.slice(0, 200) : `${o.parcalar.length} bölümlük döküm hazır.`, adres: `/panel/build/sohbet/yeni?dokum=${id}`, kaynak: { tur: "dokum", id, ad: o.baslik } }).catch(() => {});
    } catch (e) {
      const son = (await dokumOku(oz, id)) ?? d;
      son.durum = "hata"; son.adim = undefined; son.hata = (e as Error).message.slice(0, 400) || "Döküm çıkarılamadı.";
      await yaz(oz, son);
    }
  })();
  return { dokum: d };
}
