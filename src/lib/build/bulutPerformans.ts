import "server-only";
import { gunlukOku, kovaBoyu, type Gunluk } from "./gunluk";

/**
 * Performans (Vercel Observability, Convex Functions, Cloudflare Workers metrikleri benzeri): yayındaki siteye gelen
 * sayfa istekleri ve sunucu fonksiyonları için uç başına çağrı, hata oranı, p50/p95/p99 süre; zaman içinde süre ve hata;
 * fonksiyonların yaptığı dış istekler (alan adı başına p75); kural tabanlı öneriler. Kaynak: Bulut günlükleri (14 gün).
 */
export const yuzdelik = (l: number[], q: number) => { if (!l.length) return 0; const s = [...l].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.max(0, Math.ceil(q * s.length) - 1))]; };
const temizYol = (y: string) => y.replace(/ \((önizleme|deneme)\)$/, "").split("?")[0] || "/";
const onizlemeMi = (g: Gunluk) => / \((önizleme|deneme)\)$/.test(g.y ?? "") || !!g.f?.onizleme;

export type Uc = { yol: string; tur: "sayfa" | "fonksiyon"; adet: number; hata: number; uyari: number; hataOrani: number; p50: number; p95: number; p99: number; ort: number; son: number; bant: number };
export type DisApi = { alan: string; adet: number; hata: number; p75: number; ort: number };
export type Oneri = { seviye: "kritik" | "uyari" | "bilgi"; baslik: string; ayrinti: string; yol?: string; ajan?: string };

export async function performansOzeti(projeId: string, g: { bas: number; bit: number; yol?: string; tur?: "hepsi" | "sayfa" | "fonksiyon" }) {
  const l = (await gunlukOku(projeId, { turler: ["istek", "fonksiyon"], bas: g.bas, bit: g.bit, sinir: 200_000 }))
    .filter((x) => !onizlemeMi(x) && x.ms != null && !x.e)
    .filter((x) => !g.yol || temizYol(x.y ?? "").startsWith(g.yol))
    .filter((x) => !g.tur || g.tur === "hepsi" || (g.tur === "sayfa" ? x.t === "istek" : x.t === "fonksiyon"));
  const boy = kovaBoyu(g.bit - g.bas), n = Math.max(1, Math.ceil((g.bit - g.bas) / boy)), ilk = g.bit - n * boy;
  const kovalar = Array.from({ length: n }, (_, i) => ({ z: ilk + i * boy, sureler: [] as number[], hata: 0, uyari: 0, adet: 0 }));
  const uclar = new Map<string, { tur: Uc["tur"]; sureler: number[]; hata: number; uyari: number; son: number; bant: number }>();
  const dis = new Map<string, { sureler: number[]; hata: number }>();
  const durum = { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 };
  const hepsi: number[] = [];
  for (const x of l) {
    const d = x.d ?? 200, ms = x.ms ?? 0, y = temizYol(x.y ?? "/");
    hepsi.push(ms);
    durum[d >= 500 ? "5xx" : d >= 400 ? "4xx" : d >= 300 ? "3xx" : "2xx"]++;
    const k = kovalar[Math.floor((x.z - ilk) / boy)];
    if (k) { k.adet++; k.sureler.push(ms); if (d >= 500 || x.f?.hata) k.hata++; else if (d >= 400) k.uyari++; }
    const anahtar = `${x.t}:${y}`;
    const u = uclar.get(anahtar) ?? { tur: x.t === "fonksiyon" ? "fonksiyon" as const : "sayfa" as const, sureler: [], hata: 0, uyari: 0, son: 0, bant: 0 };
    u.sureler.push(ms); if (d >= 500 || x.f?.hata) u.hata++; else if (d >= 400) u.uyari++;
    u.son = Math.max(u.son, x.z); u.bant += x.b ?? 0;
    if (uclar.size < 2000 || uclar.has(anahtar)) uclar.set(anahtar, u);
    for (const di of x.f?.dis ?? []) {
      let alan = di.a; try { alan = new URL(di.a).hostname; } catch { /* düz */ }
      const v = dis.get(alan) ?? { sureler: [], hata: 0 };
      v.sureler.push(di.ms); if (!di.d || di.d >= 500 || di.h) v.hata++;
      dis.set(alan, v);
    }
  }
  const toplamHata = durum["5xx"] + l.filter((x) => (x.d ?? 200) < 500 && x.f?.hata).length;
  const ucListe: Uc[] = [...uclar.entries()].map(([a, u]) => ({
    yol: a.slice(a.indexOf(":") + 1), tur: u.tur, adet: u.sureler.length, hata: u.hata, uyari: u.uyari, hataOrani: u.sureler.length ? u.hata / u.sureler.length : 0,
    p50: yuzdelik(u.sureler, 0.5), p95: yuzdelik(u.sureler, 0.95), p99: yuzdelik(u.sureler, 0.99), ort: Math.round(u.sureler.reduce((t, s) => t + s, 0) / (u.sureler.length || 1)), son: u.son, bant: u.bant,
  })).sort((a, b) => b.adet - a.adet);
  const disListe: DisApi[] = [...dis.entries()].map(([alan, v]) => ({ alan, adet: v.sureler.length, hata: v.hata, p75: yuzdelik(v.sureler, 0.75), ort: Math.round(v.sureler.reduce((t, s) => t + s, 0) / (v.sureler.length || 1)) })).sort((a, b) => b.adet - a.adet).slice(0, 30);
  const ozet = { adet: l.length, hata: toplamHata, hataOrani: l.length ? toplamHata / l.length : 0, p50: yuzdelik(hepsi, 0.5), p95: yuzdelik(hepsi, 0.95), p99: yuzdelik(hepsi, 0.99), durum };
  const seri = kovalar.map((k) => ({ z: k.z, adet: k.adet, hata: k.hata, uyari: k.uyari, basarili: k.adet - k.hata - k.uyari, p50: yuzdelik(k.sureler, 0.5), p95: yuzdelik(k.sureler, 0.95) }));
  return { ozet, seri, kova: boy, uclar: ucListe.slice(0, 200), disApi: disListe, oneriler: oneriler(ucListe, disListe) };
}

/** Kural tabanlı performans önerileri (Supabase performans danışmanı, Convex Insights benzeri). */
function oneriler(uclar: Uc[], dis: DisApi[]): Oneri[] {
  const o: Oneri[] = [];
  for (const u of uclar.filter((x) => x.adet >= 5)) {
    if (u.hataOrani >= 0.2) o.push({ seviye: "kritik", yol: u.yol, baslik: `${u.yol} isteklerinin yüzde ${Math.round(u.hataOrani * 100)}'i hata veriyor`, ayrinti: `${u.adet} çağrıda ${u.hata} sunucu hatası.`, ajan: `${u.yol} ${u.tur === "fonksiyon" ? "sunucu fonksiyonu" : "sayfası"} çağrıların yüzde ${Math.round(u.hataOrani * 100)}'inde hata veriyor. Bulut günlüklerine bakıp nedeni bul ve düzelt.` });
    else if (u.hataOrani >= 0.05) o.push({ seviye: "uyari", yol: u.yol, baslik: `${u.yol} ara sıra hata veriyor`, ayrinti: `Hata oranı yüzde ${(u.hataOrani * 100).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} (${u.hata} / ${u.adet}).` });
    if (u.tur === "fonksiyon" && u.p95 >= 3000) o.push({ seviye: u.p95 >= 6000 ? "kritik" : "uyari", yol: u.yol, baslik: `${u.yol} yavaş: p95 ${Math.round(u.p95 / 100) / 10} sn`, ayrinti: u.p95 >= 6000 ? "Fonksiyonların süre sınırı 8 saniye; bu uç sınıra çok yakın ve zaman aşımına düşebilir." : "Kullanıcıların yüzde 5'i 3 saniyeden uzun bekliyor. Dış istekleri paralel yap ya da sonucu önbelleğe al.", ajan: `${u.yol} sunucu fonksiyonu yavaş (p95 ${u.p95} ms). Dış istekleri Promise.all ile paralelleştir, gereksiz veri okumalarını azalt, uygunsa sonucu vayra.veri ile kısa süre önbelleğe al.` });
    if (u.tur === "sayfa" && u.p95 >= 1500) o.push({ seviye: "bilgi", yol: u.yol, baslik: `${u.yol} sayfası yavaş yanıt veriyor`, ayrinti: `p95 ${u.p95} ms. Sayfa büyükse görselleri Bulut dosyalarına taşıyıp dönüşümlü (?w=) adresle kullan.` });
    if (u.tur === "sayfa" && u.adet >= 5 && u.bant / u.adet > 300_000) o.push({ seviye: "bilgi", yol: u.yol, baslik: `${u.yol} çok büyük (${Math.round(u.bant / u.adet / 1024)} KB)`, ayrinti: "Satır içi görseller ya da büyük betikler sayfayı ağırlaştırıyor.", ajan: `${u.yol} sayfası ${Math.round(u.bant / u.adet / 1024)} KB. Gömülü base64 görselleri ve büyük satır içi verileri ayrı dosyalara ya da Bulut dosya kovasına taşı; görselleri vayra.dosya.adres(kova, ad, { w: 800, fm: "webp" }) ile küçült.` });
  }
  for (const d of dis.filter((x) => x.adet >= 3)) {
    if (d.hata / d.adet >= 0.2) o.push({ seviye: "uyari", baslik: `${d.alan} isteklerinin çoğu başarısız`, ayrinti: `${d.adet} dış istekte ${d.hata} hata. Anahtar, kota ya da adres değişmiş olabilir.` });
    if (d.p75 >= 2000) o.push({ seviye: "bilgi", baslik: `${d.alan} yavaş (p75 ${d.p75} ms)`, ayrinti: "Bu servisin yanıtları fonksiyon süresinin çoğunu alıyor." });
  }
  return o.slice(0, 30);
}
