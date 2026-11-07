import "server-only";
import { createHash } from "crypto";
import path from "path";
import { coz } from "@/lib/build/sifre";
import type { HesapKaydi } from "@/lib/hesap/depo";
import type { KrediHareketi } from "@/lib/hesap/tipler";
import { DEPO, dizin, hareketlerOku, jsonDosya, kaynakEtiket, kaynakKisa, kaynakSinifi, surenIsler, tumHesaplar } from "./veri";

/**
 * İşler (joblar) üç kaynaktan gelir, hepsi gerçek kayıt:
 *  1) Stüdyo ve API üretimleri: kredi defterindeki harcama hareketleri (kaynak "sunucu:<rota>", "sunucu:api:<anahtar>").
 *     Aynı kaynak ve tutarla 30 dakika içinde gelen iade hareketi, sağlayıcı hatası nedeniyle geri verilmiş iş demektir.
 *     Sonucu henüz bildirilmemiş zaman uyumsuz işler (hesap/kredi-is) "sürüyor" sayılır.
 *  2) Vayra Build ajan çalışmaları (build/ajan-calisma/<ajan>/dizin.json).
 *  3) Vayra Build sistem çalışmaları (build/sistem-calisma/<sistem>.json).
 * Hiçbir kayıt değiştirilmez.
 */

export type JobTur = "studyo" | "api" | "build" | "ajan" | "sistem";
export type JobDurum = "tamam" | "iade" | "suruyor" | "bekliyor" | "hata" | "durdu";

export interface JobSatiri {
  id: string;
  tur: JobTur;
  ad: string;
  kaynak: string;
  durum: JobDurum;
  zaman: number;
  sure?: number;
  kredi: number;
  uid?: string;
  email?: string;
  ayrinti?: string;
}

const IADE_PENCERE = 30 * 60_000;
const sahipOzeti = (a: string) => createHash("sha256").update(`vayra-build:${a}`).digest("hex").slice(0, 40);

function studyoIsleri(h: HesapKaydi, hareketler: KrediHareketi[], suren: { kaynak: string; tutar: number; zaman: number }[]): JobSatiri[] {
  const l: JobSatiri[] = [];
  const iadeler = hareketler.filter((x) => x.tur === "iade");
  const kullanilan = new Set<string>();
  for (const x of hareketler) {
    if (x.tur !== "harcama") continue;
    const sinif = kaynakSinifi(x.kaynak);
    if (sinif !== "studyo" && sinif !== "api" && sinif !== "build") continue;
    const tutar = -x.miktar;
    const iade = iadeler.find((y) => !kullanilan.has(y.id) && y.kaynak === x.kaynak && y.miktar === tutar && y.zaman >= x.zaman && y.zaman - x.zaman < IADE_PENCERE);
    if (iade) kullanilan.add(iade.id);
    let durum: JobDurum = iade ? "iade" : "tamam";
    let sure: number | undefined = iade ? iade.zaman - x.zaman : undefined;
    if (!iade) {
      const s = suren.find((y) => `sunucu:${y.kaynak}` === x.kaynak && y.tutar === tutar && Math.abs(y.zaman - x.zaman) < 10_000);
      if (s) { durum = Date.now() - s.zaman < 3_600_000 ? "suruyor" : "bekliyor"; sure = undefined; }
    }
    l.push({
      id: `s~${h.uid}~${x.sira}`, tur: sinif === "api" ? "api" : sinif === "build" ? "build" : "studyo", ad: x.aciklama || kaynakEtiket(x.kaynak),
      kaynak: kaynakKisa(x.kaynak), durum, zaman: x.zaman, ...(sure !== undefined ? { sure } : {}), kredi: tutar, uid: h.uid, email: h.email,
      ...(iade ? { ayrinti: iade.aciklama } : {}),
    });
  }
  return l;
}

interface AjanOzet { id: string; durum: string; baslangic: number; sure: number; kredi: number; kanal: string; model: string; girdi: string; hata?: string; tetik?: { ad: string } }
interface SistemOzet { id: string; sistemId?: string; durum: string; baslangic: number; bitis?: number; kredi?: number; hata?: string; tetikTur?: string; adimSayisi?: number }

const AJAN_DURUM: Record<string, JobDurum> = { tamamlandi: "tamam", hata: "hata", calisiyor: "suruyor", "girdi-bekliyor": "bekliyor", durduruldu: "durdu", reddedildi: "durdu", devredildi: "tamam", engellendi: "durdu", atlandi: "durdu" };
const SISTEM_DURUM: Record<string, JobDurum> = { basarili: "tamam", basarisiz: "hata", calisiyor: "suruyor", kuyrukta: "bekliyor", bekliyor: "bekliyor", durdu: "durdu", iptal: "durdu" };

async function buildIsleri(sahipler: Map<string, { uid: string; email: string }>): Promise<JobSatiri[]> {
  const l: JobSatiri[] = [];
  const ajanKok = path.join(DEPO, "build", "ajanlar");
  for (const ad of await dizin(ajanKok)) {
    if (!ad.endsWith(".json")) continue;
    const ajanId = ad.slice(0, -5);
    const ajan = await jsonDosya<{ ad?: string; sahip?: string }>(path.join(ajanKok, ad));
    const calismalar = (await jsonDosya<AjanOzet[]>(path.join(DEPO, "build", "ajan-calisma", ajanId, "dizin.json"))) ?? [];
    const sahip = ajan?.sahip ? sahipler.get(ajan.sahip) : undefined;
    for (const c of calismalar.slice(0, 2000)) {
      l.push({
        id: `a~${ajanId}~${c.id}`, tur: "ajan", ad: `${ajan?.ad ?? "Ajan"}${c.tetik?.ad ? ` · ${c.tetik.ad}` : ""}`, kaynak: `${c.kanal} · ${c.model}`,
        durum: AJAN_DURUM[c.durum] ?? "tamam", zaman: c.baslangic, sure: c.sure, kredi: c.kredi ?? 0, ...(sahip ? sahip : {}),
        ...(c.hata ? { ayrinti: c.hata.slice(0, 200) } : c.girdi ? { ayrinti: c.girdi.slice(0, 160) } : {}),
      });
    }
  }
  const sisKok = path.join(DEPO, "build", "sistemler");
  for (const ad of await dizin(sisKok)) {
    if (!ad.endsWith(".json")) continue;
    const sid = ad.slice(0, -5);
    const sistem = await jsonDosya<{ ad?: string; sahip?: string }>(path.join(sisKok, ad));
    const calismalar = (await jsonDosya<SistemOzet[]>(path.join(DEPO, "build", "sistem-calisma", `${sid}.json`))) ?? [];
    const sahip = sistem?.sahip ? sahipler.get(sistem.sahip) : undefined;
    for (const c of (Array.isArray(calismalar) ? calismalar : []).slice(0, 2000)) {
      l.push({
        id: `y~${sid}~${c.id}`, tur: "sistem", ad: sistem?.ad ?? "Sistem", kaynak: c.tetikTur ? `Tetik: ${c.tetikTur}` : "Sistem",
        durum: SISTEM_DURUM[c.durum] ?? "tamam", zaman: c.baslangic, ...(c.bitis ? { sure: c.bitis - c.baslangic } : {}), kredi: c.kredi ?? 0, ...(sahip ? sahip : {}),
        ...(c.hata ? { ayrinti: c.hata.slice(0, 200) } : {}),
      });
    }
  }
  return l;
}

export async function tumJoblar(): Promise<JobSatiri[]> {
  const [hesaplar, suren] = await Promise.all([tumHesaplar(), surenIsler()]);
  const sahipler = new Map<string, { uid: string; email: string }>();
  for (const h of hesaplar) { const a = h.build ? coz(h.build.anahtar) : null; if (a) sahipler.set(sahipOzeti(a), { uid: h.uid, email: h.email }); }
  const studyo = (await Promise.all(hesaplar.map(async (h) => studyoIsleri(h, await hareketlerOku(h.uid), suren.filter((s) => s.uid === h.uid))))).flat();
  const build = await buildIsleri(sahipler);
  return [...studyo, ...build].sort((a, b) => b.zaman - a.zaman);
}

export interface JobSorgu { q?: string; tur?: string; durum?: string; gun?: number; sayfa?: number; boyut?: number }

export async function jobListesi(s: JobSorgu) {
  const tum = await tumJoblar();
  const simdi = Date.now();
  const bas = s.gun && s.gun > 0 ? simdi - s.gun * 86_400_000 : 0;
  const q = (s.q ?? "").trim().toLocaleLowerCase("tr");
  const l = tum.filter((j) => j.zaman >= bas && (!s.tur || s.tur === "hepsi" || j.tur === s.tur) && (!s.durum || s.durum === "hepsi" || j.durum === s.durum)
    && (!q || j.ad.toLocaleLowerCase("tr").includes(q) || (j.email ?? "").includes(q) || j.kaynak.toLocaleLowerCase("tr").includes(q) || j.id.includes(q)));
  const boyut = Math.min(100, Math.max(10, s.boyut ?? 30));
  const sayfaSayisi = Math.max(1, Math.ceil(l.length / boyut));
  const sayfa = Math.min(sayfaSayisi, Math.max(1, s.sayfa ?? 1));

  // Özet (süzgeçten bağımsız, son 24 saat ve 7 gün)
  const gun1 = tum.filter((j) => j.zaman > simdi - 86_400_000);
  const gun7 = tum.filter((j) => j.zaman > simdi - 7 * 86_400_000);
  const basariOrani = (l2: JobSatiri[]) => { const b = l2.filter((j) => j.durum === "tamam").length, h = l2.filter((j) => j.durum === "iade" || j.durum === "hata").length; return b + h ? Math.round((b / (b + h)) * 1000) / 10 : null; };
  const kaynakDagilim: Record<string, { adet: number; kredi: number; hata: number }> = {};
  for (const j of gun7) { const k = (kaynakDagilim[j.tur === "ajan" || j.tur === "sistem" ? j.tur : j.kaynak] ??= { adet: 0, kredi: 0, hata: 0 }); k.adet++; k.kredi += j.kredi; if (j.durum === "iade" || j.durum === "hata") k.hata++; }
  const saatlik = Array.from({ length: 24 }, (_, i) => ({ saat: i, adet: 0 }));
  for (const j of gun1) saatlik[23 - Math.min(23, Math.floor((simdi - j.zaman) / 3_600_000))].adet++;
  const sureler = gun7.filter((j) => j.sure && j.durum === "tamam" && (j.tur === "ajan" || j.tur === "sistem")).map((j) => j.sure!).sort((a, b) => a - b);
  return {
    satirlar: l.slice((sayfa - 1) * boyut, sayfa * boyut), toplam: l.length, sayfa, sayfaSayisi, boyut,
    ozet: {
      toplam: tum.length, gun1: gun1.length, gun7: gun7.length, basari24: basariOrani(gun1), basari7: basariOrani(gun7),
      suruyor: tum.filter((j) => j.durum === "suruyor").length, bekliyor: tum.filter((j) => j.durum === "bekliyor").length,
      hata24: gun1.filter((j) => j.durum === "iade" || j.durum === "hata").length, kredi7: gun7.reduce((a, j) => a + j.kredi, 0),
      turler: { studyo: tum.filter((j) => j.tur === "studyo").length, api: tum.filter((j) => j.tur === "api").length, build: tum.filter((j) => j.tur === "build").length, ajan: tum.filter((j) => j.tur === "ajan").length, sistem: tum.filter((j) => j.tur === "sistem").length },
      medyanSure: sureler.length ? sureler[Math.floor(sureler.length / 2)] : null,
    },
    kaynakDagilim: Object.entries(kaynakDagilim).map(([k, v]) => ({ kaynak: k, etiket: k === "ajan" ? "Build ajanları" : k === "sistem" ? "Build sistemleri" : kaynakEtiket(k), ...v })).sort((a, b) => b.adet - a.adet),
    saatlik,
  };
}

/** Tek iş ayrıntısı. Build çalışmalarında adımlar dosyadan okunur. */
export async function jobAyrinti(id: string) {
  const [tur, a, b] = id.split("~");
  if (!a || !b) return null;
  if (tur === "s") {
    if (!/^u_[A-Za-z0-9_-]{16}$/.test(a)) return null;
    const hareketler = await hareketlerOku(a);
    const sira = Number(b);
    const x = hareketler.find((y) => y.sira === sira);
    if (!x) return null;
    const tum = (await tumJoblar()).find((j) => j.id === id) ?? null;
    const yakin = hareketler.filter((y) => Math.abs(y.zaman - x.zaman) < IADE_PENCERE && y.kaynak === x.kaynak).slice(0, 10);
    return { tur: "studyo" as const, satir: tum, hareket: x, ilgili: yakin };
  }
  if (!/^[A-Za-z0-9_-]{4,40}$/.test(a) || !/^[A-Za-z0-9_-]{4,40}$/.test(b)) return null;
  if (tur === "a") {
    const c = await jsonDosya<Record<string, unknown>>(path.join(DEPO, "build", "ajan-calisma", a, `${b}.json`));
    if (!c) return null;
    const ajan = await jsonDosya<{ ad?: string }>(path.join(DEPO, "build", "ajanlar", `${a}.json`));
    const adimlar = (Array.isArray(c.adimlar) ? c.adimlar : []).slice(0, 60).map((x: Record<string, unknown>) => ({
      tur: String(x.tur ?? ""), ad: String(x.ad ?? ""), baslik: String(x.baslik ?? x.ad ?? ""), durum: String(x.durum ?? ""), sure: Number(x.sure ?? 0),
      ...(x.hata ? { hata: String(x.hata).slice(0, 300) } : {}), ...(x.cikti ? { cikti: String(typeof x.cikti === "string" ? x.cikti : JSON.stringify(x.cikti)).slice(0, 400) } : {}),
    }));
    return {
      tur: "ajan" as const, satir: (await tumJoblar()).find((j) => j.id === id) ?? null, ajan: ajan?.ad ?? "Ajan",
      calisma: { durum: c.durum, kanal: c.kanal, model: c.model, baslangic: c.baslangic, bitis: c.bitis, sure: c.sure, kredi: c.kredi, kullanim: c.kullanim,
        girdi: String(c.girdi ?? "").slice(0, 2000), cikti: String(c.cikti ?? "").slice(0, 4000), hata: c.hata ? String(c.hata).slice(0, 1000) : undefined },
      adimlar,
    };
  }
  if (tur === "y") {
    const c = await jsonDosya<Record<string, unknown>>(path.join(DEPO, "build", "sistem-calisma", a, `${b}.json`));
    const sistem = await jsonDosya<{ ad?: string }>(path.join(DEPO, "build", "sistemler", `${a}.json`));
    const satir = (await tumJoblar()).find((j) => j.id === id) ?? null;
    if (!c && !satir) return null;
    const adimlar = (Array.isArray(c?.adimlar) ? (c!.adimlar as Record<string, unknown>[]) : []).slice(0, 60).map((x) => ({
      tur: String(x.tur ?? ""), ad: String(x.ad ?? ""), baslik: String(x.ad ?? ""), durum: String(x.durum ?? ""), sure: Number(x.sure ?? 0),
      ...(x.hata ? { hata: String(x.hata).slice(0, 300) } : {}),
    }));
    return { tur: "sistem" as const, satir, sistem: sistem?.ad ?? "Sistem", calisma: c ? { durum: c.durum, baslangic: c.baslangic, bitis: c.bitis, kredi: c.kredi, hata: c.hata ? String(c.hata).slice(0, 1000) : undefined } : null, adimlar };
  }
  return null;
}
