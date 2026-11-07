import "server-only";
import { readdir, stat, statfs } from "fs/promises";
import os from "os";
import path from "path";
import { KATALOG, TUR_AD } from "@/lib/modelKatalogu";
import { saglayiciDurumu, saglayiciHazirlik } from "@/lib/saglayicilar";
import { zamanlayicilariIzle, zamanlayiciDurumlari } from "@/lib/admin/zamanlayiciIzle";
import { apiAnahtarSahipleri, DEPO, GUN_MS, hareketlerOku, kaynakEtiket, kaynakKisa, kaynakSinifi, tumHesaplar } from "./veri";

/* Sistem, sağlayıcı, model ve geliştirici raporları. */

const BASLANGIC = (globalThis as unknown as { __vayraSurecBaslangic?: number }).__vayraSurecBaslangic ??= Date.now();

/** Klasör boyutu (en çok n dosya; büyük ağaçlarda yaklaşık değil, sınıra ulaştı diye işaretlenir). */
async function klasorBoyutu(d: string, sinir = 40_000): Promise<{ bayt: number; dosya: number; tam: boolean }> {
  let bayt = 0, dosya = 0;
  const yigin = [d];
  while (yigin.length) {
    const x = yigin.pop()!;
    let l;
    try { l = await readdir(x, { withFileTypes: true }); } catch { continue; }
    for (const e of l) {
      if (dosya >= sinir) return { bayt, dosya, tam: false };
      const p = path.join(x, e.name);
      if (e.isDirectory()) yigin.push(p);
      else { try { bayt += (await stat(p)).size; dosya++; } catch { /* silinmiş */ } }
    }
  }
  return { bayt, dosya, tam: true };
}

type DepoBoyut = { z: number; v: { ad: string; bayt: number; dosya: number; tam: boolean }[] };
const G = globalThis as unknown as { __vayraDepoBoyut?: DepoBoyut; __vayraDepoHesap?: Promise<void> | null };

/** Klasör boyutları arka planda hesaplanır (büyük depoda saniyeler sürebilir); istek beklemez. */
function boyutHesapla() {
  if (G.__vayraDepoHesap) return;
  G.__vayraDepoHesap = (async () => {
    const adlar = (await readdir(DEPO, { withFileTypes: true }).catch(() => [])).filter((e) => e.isDirectory() && !e.name.startsWith(".")).map((e) => e.name);
    const v = [];
    for (const ad of adlar) v.push({ ad, ...(await klasorBoyutu(path.join(DEPO, ad))) });
    G.__vayraDepoBoyut = { z: Date.now(), v: v.sort((a, b) => b.bayt - a.bayt) };
  })().catch(() => {}).finally(() => { G.__vayraDepoHesap = null; });
}
const KLASOR_AD: Record<string, string> = {
  hesap: "Hesaplar ve kredi defterleri", odeme: "Ödemeler", build: "Vayra Build", ses: "Ses dosyaları", video: "Video dosyaları", muzik: "Müzik dosyaları",
  gorsel: "Görseller", element: "Elementler", upscale: "Büyütmeler", paylasim: "Paylaşım bağlantıları", yonetim: "Yönetim günlükleri", destek: "Destek talepleri",
};

export async function sistemRaporu(yenile = false) {
  const mem = process.memoryUsage();
  let disk: { bos: number; toplam: number } | null = null;
  try { const s = await statfs(DEPO); disk = { bos: s.bavail * s.bsize, toplam: s.blocks * s.bsize }; } catch { /* yok */ }
  if (yenile || !G.__vayraDepoBoyut || G.__vayraDepoBoyut.z < Date.now() - 10 * 60_000) boyutHesapla();
  zamanlayicilariIzle();
  return {
    surec: {
      node: process.version, platform: `${os.type()} ${os.release()}`, mimari: process.arch, pid: process.pid, mod: process.env.NODE_ENV ?? "development",
      calismaSn: Math.round(process.uptime()), izlemeBaslangic: BASLANGIC,
      bellek: { rss: mem.rss, heapKullanilan: mem.heapUsed, heapToplam: mem.heapTotal, harici: mem.external },
      sistemBellek: { bos: os.freemem(), toplam: os.totalmem() }, cpu: os.cpus().length, yuk: os.loadavg(),
    },
    disk,
    depo: { hesap: G.__vayraDepoBoyut?.z ?? null, hesaplaniyor: !!G.__vayraDepoHesap, klasorler: (G.__vayraDepoBoyut?.v ?? []).map((k) => ({ ...k, etiket: KLASOR_AD[k.ad] ?? k.ad })) },
    zamanlayicilar: zamanlayiciDurumlari(),
  };
}

/* ── Kullanım istatistiği: kredi defterlerinden kaynak bazında (stüdyo ve API) ── */

async function kullanimIstatistigi(gun: number) {
  const bas = Date.now() - gun * GUN_MS;
  const hesaplar = await tumHesaplar();
  const m: Record<string, { adet: number; kredi: number; iade: number; aciklamalar: string[] }> = {};
  for (const h of hesaplar) {
    for (const x of await hareketlerOku(h.uid)) {
      if (x.zaman < bas) continue;
      const s = kaynakSinifi(x.kaynak);
      if (s !== "studyo" && s !== "api") continue;
      const k = (m[kaynakKisa(x.kaynak)] ??= { adet: 0, kredi: 0, iade: 0, aciklamalar: [] });
      if (x.tur === "harcama") { k.adet++; k.kredi += -x.miktar; if (k.aciklamalar.length < 400) k.aciklamalar.push(x.aciklama); }
      else if (x.tur === "iade") k.iade++;
    }
  }
  return m;
}

export async function saglayiciRaporu() {
  const hazirlik = saglayiciHazirlik();
  const tur = saglayiciDurumu();
  const ANAHTAR: Record<string, string[]> = {
    openai: ["OPENAI_API_KEY"], gemini: ["GEMINI_API_KEY"], omni: ["GEMINI_API_KEY"], byteplus: ["BYTEPLUS_API_KEY"], seedance: ["BYTEPLUS_API_KEY"], seedream: ["BYTEPLUS_API_KEY"],
    replicate: ["REPLICATE_API_TOKEN"], fal: ["FAL_KEY"], luma: ["FAL_KEY"], kling: ["KLING_API_KEY"], minimax: ["MINIMAX_API_KEY"], eleven: ["ELEVENLABS_API_KEY"], meshy: ["MESHY_API_KEY"],
  };
  const yapay = [
    { ad: "Anthropic (Claude)", anahtar: ["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN"], kullanim: "Build ajanları, sohbet, yönetim asistanı" },
    { ad: "OpenRouter", anahtar: ["OPENROUTER_API_KEY"], kullanim: "Build'de diğer modeller" },
    { ad: "DeepSeek", anahtar: ["DEEPSEEK_API_KEY"], kullanim: "Build (doğrudan)" }, { ad: "Moonshot (Kimi)", anahtar: ["MOONSHOT_API_KEY"], kullanim: "Build (doğrudan)" },
    { ad: "xAI (Grok)", anahtar: ["XAI_API_KEY"], kullanim: "Build (doğrudan)" }, { ad: "Perplexity", anahtar: ["PERPLEXITY_API_KEY"], kullanim: "Büyüme anılma testi" },
  ].map((x) => ({ ...x, hazir: x.anahtar.some((a) => !!process.env[a]?.trim()), anahtar: x.anahtar }));
  const k = await kullanimIstatistigi(30);
  return {
    turler: Object.entries(tur).map(([t, v]) => ({ tur: t, saglayici: v.saglayici, gercek: v.gercek })),
    adaptorler: hazirlik.map((h) => ({ ad: h.ad, hazir: h.hazir, anahtar: ANAHTAR[h.ad] ?? [] })),
    yapay,
    kullanim: Object.entries(k).map(([kaynak, v]) => ({ kaynak, etiket: kaynakEtiket(kaynak), adet: v.adet, kredi: v.kredi, iade: v.iade, hataOrani: v.adet ? Math.round((v.iade / v.adet) * 1000) / 10 : 0 })).sort((a, b) => b.adet - a.adet),
  };
}

export async function modelRaporu() {
  const k = await kullanimIstatistigi(30);
  const tumAciklama = Object.values(k).flatMap((v) => v.aciklamalar.map((a) => a.toLocaleLowerCase("tr")));
  const hazir = new Map(saglayiciHazirlik().map((h) => [h.ad, h.hazir]));
  // Modelin hangi adaptörden geçtiği (yaklaşık): geliştiren şirkete ve türe göre; diğerleri fal üzerinden.
  const adaptor = (s: string, tur: string) => s === "OpenAI" ? (tur === "video" ? "fal" : "openai") : s === "Google" ? (tur === "video" ? "omni" : "gemini") : s === "ByteDance" ? (tur === "video" ? "seedance" : "seedream")
    : s === "Kuaishou" ? "kling" : s === "MiniMax" ? "minimax" : s === "ElevenLabs" ? "eleven" : s === "Vayra" ? "meshy" : "fal";
  const modeller = KATALOG.map((m) => {
    const ad = m.ad.toLocaleLowerCase("tr");
    const kullanim = ad.length >= 4 ? tumAciklama.filter((a) => a.includes(ad)).length : 0;
    const a = adaptor(m.saglayici, m.tur);
    return { slug: m.slug, ad: m.ad, aile: m.aile, saglayici: m.saglayici, tur: m.tur, turAd: TUR_AD[m.tur], kredi: m.kredi, bedel: m.bedel, oneCikan: !!m.oneCikan, kullanim30: kullanim, adaptor: a, bagli: hazir.get(a) ?? null };
  });
  const turSayisi: Record<string, number> = {};
  for (const m of modeller) turSayisi[m.turAd] = (turSayisi[m.turAd] ?? 0) + 1;
  return { modeller, turSayisi, toplam: modeller.length };
}

export async function gelistiriciRaporu() {
  const [sahipler, hesaplar] = await Promise.all([apiAnahtarSahipleri(), tumHesaplar()]);
  const email = new Map(hesaplar.map((h) => [h.uid, h.email]));
  const bas = Date.now() - 30 * GUN_MS;
  const gunluk = new Map<string, number>();
  const anahtar: Record<string, { kid: string; uid: string; email: string; adet: number; kredi: number; iade: number; son: number }> = {};
  const model: Record<string, number> = {};
  for (const h of hesaplar) {
    for (const x of await hareketlerOku(h.uid)) {
      if (!x.kaynak.startsWith("sunucu:api:")) continue;
      const kid = x.kaynak.slice("sunucu:api:".length);
      const a = (anahtar[kid] ??= { kid: kid.slice(0, 10), uid: h.uid, email: h.email, adet: 0, kredi: 0, iade: 0, son: 0 });
      if (x.tur === "harcama") { a.adet++; a.kredi += -x.miktar; a.son = Math.max(a.son, x.zaman); const md = x.aciklama.replace(/^API · /, ""); model[md] = (model[md] ?? 0) + 1; if (x.zaman >= bas) { const g = new Date(x.zaman + 3 * 3_600_000).toISOString().slice(0, 10); gunluk.set(g, (gunluk.get(g) ?? 0) + 1); } }
      else if (x.tur === "iade") a.iade++;
    }
  }
  const gunler = Array.from({ length: 30 }, (_, i) => new Date(Date.now() - (29 - i) * GUN_MS + 3 * 3_600_000).toISOString().slice(0, 10));
  return {
    bagliAnahtar: sahipler.length, bagliHesap: new Set(sahipler.map((s) => s.uid)).size,
    sahipler: sahipler.map((s) => ({ uid: s.uid, email: email.get(s.uid) ?? "Silinmiş hesap", baglanma: s.baglanma })).sort((a, b) => b.baglanma - a.baglanma),
    anahtarlar: Object.values(anahtar).sort((a, b) => b.adet - a.adet),
    modeller: Object.entries(model).map(([ad, adet]) => ({ ad, adet })).sort((a, b) => b.adet - a.adet).slice(0, 15),
    gunluk: gunler.map((g) => ({ gun: g, adet: gunluk.get(g) ?? 0 })),
  };
}
