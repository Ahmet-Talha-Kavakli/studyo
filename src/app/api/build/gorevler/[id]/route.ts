import { randomBytes } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { POST as ajanTuru } from "@/app/api/build/ajan/[id]/route";
import { ajanCalisiyor } from "@/lib/build/ajanCalisan";
import { projeOku, projeOlustur, projeSil, projeYaz, sahipProjeleri } from "@/lib/build/depo";
import { izleyiciEngeli } from "@/lib/build/ekipRota";
import { gunlukYaz } from "@/lib/build/gunluk";
import { BUILD_MODELLERI, modelBul } from "@/lib/build/modeller";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import type { BuildMesaj, Proje, TaslakGorev } from "@/lib/build/tipler";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Aynı anda süren görev sınırı (proje başına) ve bir istekte açılabilecek görev (model karşılaştırması). */
const ESZAMANLI = 4;
const KARSILASTIRMA = 3;

export type GorevDurum = "sirada" | "calisiyor" | "bekliyor" | "hazir" | "hata" | "durdu";
export type GorevOzet = {
  id: string; istem: string; model: string; mod: "yap" | "plan"; grup?: string;
  olusturma: number; guncelleme: number; durum: GorevDurum;
  ozet: string; hataMetni?: string; kredi: number; adim: number; mesajId?: string;
  degisen: { yol: string; tur: "eklendi" | "silindi" | "degisti" }[];
  anaDegisti: boolean; onizleme: string;
};

function farklar(a: Record<string, string>, b: Record<string, string>) {
  const yollar = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...yollar].filter((y) => a[y] !== b[y]).map((y) => ({ yol: y, tur: !(y in a) ? "eklendi" as const : !(y in b) ? "silindi" as const : "degisti" as const }));
}

/** Görev dalının durumu: sürüyor mu, soru ya da plan onayı mı bekliyor, bitti mi, hata mı. */
function durumu(d: Proje): { durum: GorevDurum; son?: BuildMesaj } {
  const son = [...d.mesajlar].reverse().find((m) => m.rol === "asistan");
  if (ajanCalisiyor(d.id)) return { durum: "calisiyor", son };
  if (!son) return { durum: "sirada" };
  if (son.durum === "suruyor") return { durum: Date.now() - d.guncelleme > 10 * 60_000 ? "durdu" : "calisiyor", son };
  if (son.soru?.durum === "bekliyor" || son.plan?.durum === "bekliyor" || son.tasarim?.durum === "bekliyor") return { durum: "bekliyor", son };
  if (son.durum === "hata" || son.durum === "anahtar-yok") return { durum: "hata", son };
  if (son.durum === "durduruldu") return { durum: "durdu", son };
  return { durum: "hazir", son };
}

function ozetle(ana: Proje, d: Proje): GorevOzet {
  const g = d.taslak!.gorev!;
  const { durum, son } = durumu(d);
  const taban = ana.surumler.find((s) => s.no === d.taslak!.anaSurumNo)?.dosyalar ?? ana.dosyalar;
  const asistan = d.mesajlar.filter((m) => m.rol === "asistan");
  return {
    id: d.id, istem: g.istem, model: g.model, mod: g.mod, grup: g.grup,
    olusturma: g.olusturma, guncelleme: d.guncelleme, durum,
    ozet: son?.durum === "anahtar-yok" ? "" : (son?.metin ?? "").replace(/\s+/g, " ").trim().slice(0, 320),
    hataMetni: durum !== "hata" ? undefined : son?.durum === "anahtar-yok" ? `${modelBul(son.metin).ad} bu sunucuda bağlı değil; bağlı bir modelle yeniden dene.` : (son?.metin || "Ajan hata verdi.").slice(0, 240),
    kredi: Math.round(asistan.reduce((t, m) => t + (m.kredi ?? 0), 0) * 10) / 10,
    adim: asistan.reduce((t, m) => t + (m.adimlar?.length ?? 0), 0),
    mesajId: son?.id,
    degisen: farklar(taban, d.dosyalar),
    anaDegisti: (ana.surumler.at(-1)?.no ?? 0) > d.taslak!.anaSurumNo,
    onizleme: `/api/build/onizleme/${d.id}/${d.onizlemeBelirteci}/`,
  };
}

async function anaProje(req: Request, ctx: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return { yanit: yetkisiz() } as const;
  const id = (await ctx.params).id;
  const ana = await projeOku(id, sahip);
  if (!ana) return { yanit: bulunamadi() } as const;
  if (ana.taslak) return { yanit: hata("Görevler ana projede çalışır; deneme dalında görev açılmaz.") } as const;
  return { sahip, ana } as const;
}

/**
 * Görev dizini (.veri/build/gorev/<anaId>.json): ana projenin görev dallarının kimlikleri. Yoklama her birkaç saniyede
 * gelir; sahibin bütün projelerini okumamak için yalnız bu dallar okunur. Dizin yoksa (eski kayıt) bir kez taranır.
 */
const gorevDizini = (anaId: string) => path.join(DEPO_KOK, "build", "gorev", `${anaId}.json`);
async function dizinOku(anaId: string): Promise<string[] | null> {
  try { return JSON.parse(await readFile(gorevDizini(anaId), "utf8")) as string[]; } catch { return null; }
}
async function dizinYaz(anaId: string, l: string[]) {
  await mkdir(path.dirname(gorevDizini(anaId)), { recursive: true });
  await writeFile(gorevDizini(anaId), JSON.stringify(l.slice(0, 200)));
}
async function gorevDallari(sahip: string, anaId: string) {
  let ids = await dizinOku(anaId);
  if (!ids) ids = (await sahipProjeleri(sahip)).filter((o) => o.taslak?.anaId === anaId && o.taslak.gorev).map((o) => o.id);
  const l = (await Promise.all(ids.map((id) => projeOku(id, sahip)))).filter((x): x is Proje => !!x && x.taslak?.anaId === anaId && !!x.taslak.gorev);
  // Uygulanan ya da silinen dallar dizinden düşer.
  if (l.length !== ids.length) await dizinYaz(anaId, l.map((d) => d.id)).catch(() => {});
  return l;
}

/** Ana projenin paralel görevleri (en yeni önce). */
export async function GET(req: Request, ctx: Ctx) {
  const a = await anaProje(req, ctx);
  if ("yanit" in a) return a.yanit;
  const l = (await gorevDallari(a.sahip, a.ana.id)).map((d) => ozetle(a.ana, d)).sort((x, y) => y.olusturma - x.olusturma);
  return Response.json({ ok: true, gorevler: l, sinir: ESZAMANLI, anaSurumNo: a.ana.surumler.at(-1)?.no ?? 0 });
}

/**
 * Yeni görev: { istem, modeller: string[] (1-3; birden çoksa aynı görev her modelle ayrı dalda, karşılaştırma),
 * mod?: "yap" | "plan", yazar? }. Her görev ana projenin kopyası olan bir deneme dalında arka planda çalışır;
 * sekme kapansa da sürer. Bitince dal ana projeye /api/build/dal ile uygulanır.
 */
export async function POST(req: Request, ctx: Ctx) {
  const a = await anaProje(req, ctx);
  if ("yanit" in a) return a.yanit;
  const { sahip, ana } = a;
  const engel = await izleyiciEngeli(ana.id, sahip);
  if (engel) return engel;
  let g: { istem?: string; modeller?: string[]; mod?: string; yazar?: unknown };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const istem = String(g.istem ?? "").trim().slice(0, 8000);
  if (istem.length < 3) return hata("Görevi birkaç kelimeyle anlat.");
  const modeller = [...new Set((Array.isArray(g.modeller) ? g.modeller : []).map(String))].slice(0, KARSILASTIRMA);
  if (!modeller.length) modeller.push(BUILD_MODELLERI[0].id);
  for (const m of modeller) if (modelBul(m).id !== m && !m.startsWith("ozel:")) return hata("Bilinmeyen model.");
  const mod = g.mod === "plan" ? "plan" : "yap";
  const suren = (await gorevDallari(sahip, ana.id)).filter((d) => ["calisiyor", "sirada"].includes(durumu(d).durum)).length;
  if (suren + modeller.length > ESZAMANLI) return hata(`Aynı anda en çok ${ESZAMANLI} görev çalışır; ${suren} görev sürüyor. Birinin bitmesini bekle ya da durdur.`, 429);

  const grup = modeller.length > 1 ? randomBytes(6).toString("base64url") : undefined;
  const kisa = istem.replace(/\s+/g, " ").slice(0, 40);
  const acilan: string[] = [];
  const hatalar: string[] = [];
  for (const model of modeller) {
    const d = await projeOlustur({ ad: `${ana.ad} · ${kisa}`.slice(0, 60), tur: ana.tur, dosyalar: { ...ana.dosyalar }, sahip, kapak: ana.kapak, aciklama: `${ana.ad} projesinde paralel görev` });
    const gorev: TaslakGorev = { istem, model, mod, olusturma: Date.now(), ...(grup ? { grup } : {}) };
    d.taslak = { anaId: ana.id, anaAd: ana.ad, anaSurumNo: ana.surumler.at(-1)?.no ?? 0, olusturma: Date.now(), gorev };
    d.ayarlar.talimat = ana.ayarlar.talimat;
    d.ayarlar.seo = { ...ana.ayarlar.seo, indeks: false };
    d.klasor = ana.klasor;
    await projeYaz(d, sahip);
    // Ajan turu sunucuda başlar ve istemciden bağımsız sürer; akış burada boşaltılır.
    // Kök, gelen isteğinki: ajanın tarayıcı testi önizlemeyi bu adresten açar.
    const r = await ajanTuru(new Request(`${new URL(req.url).origin}/api/build/ajan/${d.id}`, {
      method: "POST", headers: { "x-build-sahip": sahip, "Content-Type": "application/json" },
      body: JSON.stringify({ istem, mod, model, ...(g.yazar ? { yazar: g.yazar } : {}) }),
    }), { params: Promise.resolve({ id: d.id }) });
    if (!r.ok) {
      const j = await r.json().catch(() => ({})) as { hata?: string };
      hatalar.push(j.hata ?? "Görev başlatılamadı.");
      await projeSil(d.id, sahip).catch(() => {});
      continue;
    }
    r.body?.pipeTo(new WritableStream()).catch(() => {});
    acilan.push(d.id);
    await dizinYaz(ana.id, [d.id, ...((await dizinOku(ana.id)) ?? [])]).catch(() => {});
  }
  if (!acilan.length) return hata(hatalar[0] ?? "Görev başlatılamadı.", 400);
  gunlukYaz(ana.id, { t: "yayin", m: `${acilan.length > 1 ? `${acilan.length} modelle karşılaştırmalı görev` : "Paralel görev"} başladı: ${kisa}` });
  return Response.json({ ok: true, gorevler: acilan, ...(hatalar.length ? { uyari: hatalar[0] } : {}) });
}
