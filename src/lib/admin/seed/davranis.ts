/**
 * Davranış analitiği türetme katmanı — oturumlar.ts ham olaylarından GERÇEK metrikler.
 * Kullanıcının "en kritik" dediği modül: path akışı, exit sayfaları, dwell,
 * tıklama ısı haritası, aynı-IP hesap kümeleri, lead skorlama, sayfa funnel'ı.
 * Hiçbir rakam sabit değil — hepsi oturum evreninden .reduce/.filter ile hesaplanır.
 */
import { veri } from "./index";
import { ROTA_HARITA, ROTALAR } from "./rotalar";
import { BUGUN, GUN } from "../cekirdek";
import { kullaniciOturumlari } from "./oturumlar";
import type { Oturum } from "./oturumlar";

/* ── Sayfa bazlı özet: görüntüleme, benzersiz, ort. dwell, çıkış oranı, giriş oranı ── */
export interface SayfaMetrik {
  yol: string;
  ad: string;
  goruntuleme: number;
  benzersiz: number;
  ortDwellSn: number;
  cikisOran: number; // bu sayfada biten oturum / bu sayfayı gören oturum
  girisOran: number; // bu sayfada başlayan oturum / toplam
  donusumKatki: number; // bu sayfayı gören oturumların dönüşüm oranı
}

let _sayfa: SayfaMetrik[] | null = null;
export function sayfaMetrikleri(): SayfaMetrik[] {
  if (_sayfa) return _sayfa;
  const { oturumlar } = veri();
  const acc: Record<string, { gor: number; dwell: number; dwellN: number; cikis: number; giris: number; gorenOturum: Set<string>; donusenOturum: number }> = {};
  for (const r of ROTALAR) acc[r.yol] = { gor: 0, dwell: 0, dwellN: 0, cikis: 0, giris: 0, gorenOturum: new Set(), donusenOturum: 0 };

  for (const o of oturumlar) {
    const gorulen = new Set<string>();
    let ilk = true;
    for (const e of o.olaylar) {
      if (e.tur !== "sayfa") continue;
      const a = acc[e.yol];
      if (!a) continue;
      a.gor++;
      a.gorenOturum.add(o.id);
      if (e.sureSn) { a.dwell += e.sureSn; a.dwellN++; }
      if (ilk) { a.giris++; ilk = false; }
      gorulen.add(e.yol);
    }
    const c = acc[o.cikisYol];
    if (c) c.cikis++;
    if (o.donusti) for (const y of gorulen) acc[y].donusenOturum++;
  }

  const toplamOturum = oturumlar.length;
  _sayfa = ROTALAR.map((r) => {
    const a = acc[r.yol];
    const goren = a.gorenOturum.size;
    return {
      yol: r.yol, ad: r.ad,
      goruntuleme: a.gor,
      benzersiz: goren,
      ortDwellSn: a.dwellN ? Math.round(a.dwell / a.dwellN) : 0,
      cikisOran: goren ? (a.cikis / goren) * 100 : 0,
      girisOran: toplamOturum ? (a.giris / toplamOturum) * 100 : 0,
      donusumKatki: goren ? (a.donusenOturum / goren) * 100 : 0,
    };
  }).sort((x, y) => y.goruntuleme - x.goruntuleme);
  return _sayfa;
}

/* ── Path akışı: hangi sayfadan hangi sayfaya (Sankey/geçiş matrisi) ── */
export interface Gecis { kaynak: string; hedef: string; sayi: number }
let _gecis: Gecis[] | null = null;
export function pathAkisi(): Gecis[] {
  if (_gecis) return _gecis;
  const { oturumlar } = veri();
  const say: Record<string, number> = {};
  for (const o of oturumlar) {
    const sayfalar = o.olaylar.filter((e) => e.tur === "sayfa").map((e) => e.yol);
    for (let i = 0; i < sayfalar.length - 1; i++) {
      const key = `${sayfalar[i]}»${sayfalar[i + 1]}`;
      say[key] = (say[key] || 0) + 1;
    }
  }
  _gecis = Object.entries(say)
    .map(([k, sayi]) => { const [kaynak, hedef] = k.split("»"); return { kaynak, hedef, sayi }; })
    .sort((a, b) => b.sayi - a.sayi);
  return _gecis;
}

/** Belli bir sayfadan sonraki en olası sayfalar (drill-down). */
export function sonrakiSayfalar(yol: string, limit = 6): Gecis[] {
  return pathAkisi().filter((g) => g.kaynak === yol).slice(0, limit);
}

/* ── Exit funnel: en çok terk edilen sayfalar ── */
export interface ExitSatir { yol: string; ad: string; cikis: number; oran: number }
export function exitSayfalari(): ExitSatir[] {
  const { oturumlar } = veri();
  const say: Record<string, number> = {};
  for (const o of oturumlar) say[o.cikisYol] = (say[o.cikisYol] || 0) + 1;
  const toplam = oturumlar.length;
  return Object.entries(say)
    .map(([yol, cikis]) => ({ yol, ad: ROTA_HARITA[yol]?.ad ?? yol, cikis, oran: (cikis / toplam) * 100 }))
    .sort((a, b) => b.cikis - a.cikis);
}

/* ── Tıklama ısı haritası: hangi buton/model/araç en çok tıklanıyor ── */
export interface TikHedef { hedef: string; yol: string; sayi: number }
let _tik: TikHedef[] | null = null;
export function tiklamaHaritasi(): TikHedef[] {
  if (_tik) return _tik;
  const { oturumlar } = veri();
  const say: Record<string, number> = {};
  for (const o of oturumlar) {
    for (const e of o.olaylar) {
      if (e.tur !== "tiklama" || !e.hedef) continue;
      const key = `${e.hedef}§${e.yol}`;
      say[key] = (say[key] || 0) + 1;
    }
  }
  _tik = Object.entries(say)
    .map(([k, sayi]) => { const [hedef, yol] = k.split("§"); return { hedef, yol, sayi }; })
    .sort((a, b) => b.sayi - a.sayi);
  return _tik;
}

/** Sadece model seçim tıklamaları (hangi model tercih ediliyor). */
export function modelTercihleri(): { model: string; sayi: number }[] {
  return tiklamaHaritasi()
    .filter((t) => t.hedef.startsWith("Model:"))
    .map((t) => ({ model: t.hedef.replace("Model: ", ""), sayi: t.sayi }))
    .reduce((acc, cur) => {
      const v = acc.find((a) => a.model === cur.model);
      if (v) v.sayi += cur.sayi; else acc.push(cur);
      return acc;
    }, [] as { model: string; sayi: number }[])
    .sort((a, b) => b.sayi - a.sayi);
}

/* ── Sayfa funnel'ı: ziyaret → kayıt → ilk üretim → ödeme ── */
export interface FunnelAdim { ad: string; sayi: number; oran: number }
export function davranisFunnel(): FunnelAdim[] {
  const { oturumlar } = veri();
  const ziyaret = oturumlar.length;
  const kayitGoren = oturumlar.filter((o) => o.olaylar.some((e) => e.yol === "/kayit" && e.tur === "sayfa")).length;
  const kayitOldu = oturumlar.filter((o) => o.olaylar.some((e) => e.tur === "kayit")).length;
  const uretti = oturumlar.filter((o) => o.olaylar.some((e) => e.tur === "uretim")).length;
  const odedi = oturumlar.filter((o) => o.olaylar.some((e) => e.tur === "odeme")).length;
  const ham = [
    ["Ziyaret", ziyaret],
    ["Kayıt sayfası", kayitGoren],
    ["Kayıt tamamlandı", kayitOldu],
    ["İlk üretim", uretti],
    ["Ödeme", odedi],
  ] as const;
  return ham.map(([ad, sayi]) => ({ ad, sayi, oran: ziyaret ? (sayi / ziyaret) * 100 : 0 }));
}

/* ── Aynı IP / parmak-izi kümeleri: çoklu hesap tespiti (GERÇEK eşleşme) ── */
export interface IpKume { ip: string; kullanicilar: { id: string; ad: string; durum: string }[]; oturumSayi: number }
let _ipKume: IpKume[] | null = null;
export function ayniIpKumeleri(): IpKume[] {
  if (_ipKume) return _ipKume;
  const { kullanicilar } = veri();
  const grup: Record<string, typeof kullanicilar> = {};
  for (const k of kullanicilar) (grup[k.ip] ??= []).push(k);
  _ipKume = Object.entries(grup)
    .filter(([, ks]) => ks.length > 1)
    .map(([ip, ks]) => ({
      ip,
      kullanicilar: ks.map((k) => ({ id: k.id, ad: k.ad, durum: k.durum })),
      oturumSayi: ks.length,
    }))
    .sort((a, b) => b.kullanicilar.length - a.kullanicilar.length);
  return _ipKume;
}

/* ── Lead skorlama: kayıt olmamış ama yüksek niyet gösteren oturumlar + kayıtlı ama ödememiş sıcak kullanıcılar ── */
export interface Lead {
  kaynak: string;
  ulkeKod: string;
  cihaz: string;
  skor: number; // 0-100 satın alma niyeti
  sinyal: string[];
  tip: "anonim" | "kayitli";
  kullaniciId?: string;
  ad?: string;
}
export function leadler(): Lead[] {
  const { oturumlar, kullanicilar } = veri();
  const kmap = new Map(kullanicilar.map((k) => [k.id, k]));
  const leadler: Lead[] = [];

  // Anonim yüksek-niyet: fiyat/kayıt sayfası gördü ama dönüşmedi + çok dwell
  const anonGor: Record<string, { skor: number; sinyal: Set<string>; kaynak: string; ulke: string; cihaz: string; oturum: Oturum }> = {};
  for (const o of oturumlar) {
    if (o.kullaniciId || o.donusti) continue;
    let skor = 0; const sinyal = new Set<string>();
    if (o.olaylar.some((e) => e.yol === "/fiyatlandirma")) { skor += 30; sinyal.add("Fiyat sayfasını gördü"); }
    if (o.olaylar.some((e) => e.yol === "/kayit")) { skor += 34; sinyal.add("Kayıt sayfasına geldi"); }
    if (o.olaylar.some((e) => e.yol.startsWith("/urunler"))) { skor += 14; sinyal.add("Ürün sayfası inceledi"); }
    if (o.toplamSn > 180) { skor += 12; sinyal.add("Uzun süre gezindi"); }
    if (o.olaylar.filter((e) => e.tur === "sayfa").length >= 4) { skor += 10; sinyal.add("Çok sayfa gezdi"); }
    if (skor >= 40) {
      const key = o.anonimId;
      if (!anonGor[key] || anonGor[key].skor < skor)
        anonGor[key] = { skor: Math.min(100, skor), sinyal, kaynak: o.kaynak, ulke: o.ulkeKod, cihaz: o.cihaz, oturum: o };
    }
  }
  for (const a of Object.values(anonGor))
    leadler.push({ tip: "anonim", kaynak: a.kaynak, ulkeKod: a.ulke, cihaz: a.cihaz, skor: a.skor, sinyal: [...a.sinyal] });

  // Kayıtlı sıcak: ücretsiz plan + çok üretim + fiyat/kredi sayfası gördü (upsell adayı)
  const kullaniciOturum: Record<string, Oturum[]> = {};
  for (const o of oturumlar) if (o.kullaniciId) (kullaniciOturum[o.kullaniciId] ??= []).push(o);
  for (const [uid, ots] of Object.entries(kullaniciOturum)) {
    const k = kmap.get(uid);
    if (!k || k.plan !== "baslangic" || k.durum !== "aktif") continue;
    let skor = 0; const sinyal = new Set<string>();
    const uretim = ots.reduce((a, o) => a + o.olaylar.filter((e) => e.tur === "uretim").length, 0);
    const fiyatGor = ots.some((o) => o.olaylar.some((e) => e.yol === "/fiyatlandirma" || e.yol === "/panel/kredi"));
    if (uretim >= 6) { skor += 34; sinyal.add(`${uretim} üretim yaptı (limit zorluyor)`); }
    if (fiyatGor) { skor += 30; sinyal.add("Fiyat/kredi sayfası gördü"); }
    if (k.krediBakiye < 30) { skor += 20; sinyal.add("Kredisi bitiyor"); }
    if (k.jobSayisi > 50) { skor += 12; sinyal.add("Yoğun kullanıcı"); }
    if (skor >= 45)
      leadler.push({ tip: "kayitli", kullaniciId: uid, ad: k.ad, kaynak: k.kaynak, ulkeKod: k.ulkeKod, cihaz: k.cihaz, skor: Math.min(100, skor), sinyal: [...sinyal] });
  }

  return leadler.sort((a, b) => b.skor - a.skor);
}

/* ── Genel davranış özeti (üst metrik kartları) ── */
export interface DavranisOzet {
  toplamOturum: number;
  anonimOturum: number;
  kayitliOturum: number;
  ortOturumSn: number;
  ortSayfaOturum: number;
  bounceOran: number; // tek sayfalık oturum oranı
  donusumOran: number;
  leadSayi: number;
  cokluHesapIp: number;
}
let _dozet: DavranisOzet | null = null;
export function davranisOzet(): DavranisOzet {
  if (_dozet) return _dozet;
  const { oturumlar } = veri();
  const anon = oturumlar.filter((o) => !o.kullaniciId).length;
  const tekSayfa = oturumlar.filter((o) => o.olaylar.filter((e) => e.tur === "sayfa").length <= 1).length;
  const donusen = oturumlar.filter((o) => o.donusti).length;
  const toplamSn = oturumlar.reduce((a, o) => a + o.toplamSn, 0);
  const toplamSayfa = oturumlar.reduce((a, o) => a + o.olaylar.filter((e) => e.tur === "sayfa").length, 0);
  _dozet = {
    toplamOturum: oturumlar.length,
    anonimOturum: anon,
    kayitliOturum: oturumlar.length - anon,
    ortOturumSn: Math.round(toplamSn / Math.max(1, oturumlar.length)),
    ortSayfaOturum: +(toplamSayfa / Math.max(1, oturumlar.length)).toFixed(1),
    bounceOran: (tekSayfa / Math.max(1, oturumlar.length)) * 100,
    donusumOran: (donusen / Math.max(1, oturumlar.length)) * 100,
    leadSayi: leadler().length,
    cokluHesapIp: ayniIpKumeleri().length,
  };
  return _dozet;
}

/* ── Tek kullanıcının yolculuğu: oturum oturum sayfa gezinme + tıklama + dönüşüm ── */
export interface KullaniciYolculuk {
  oturumId: string;
  baslangic: number;
  cihaz: string;
  kaynak: string;
  toplamSn: number;
  donusti: boolean;
  adimlar: { tur: string; yol?: string; hedef?: string; ad: string; sureSn?: number }[];
}
export function kullaniciYolculugu(kullaniciId: string): KullaniciYolculuk[] {
  const { oturumlar, kullanicilar } = veri();
  let benimki = oturumlar.filter((o) => o.kullaniciId === kullaniciId);
  // Global evrende örneklenmemişse talep üzerine üret
  if (!benimki.length) {
    const k = kullanicilar.find((x) => x.id === kullaniciId);
    if (k) benimki = kullaniciOturumlari(k);
  }
  return benimki
    .sort((a, b) => b.baslangic - a.baslangic)
    .slice(0, 12)
    .map((o) => ({
      oturumId: o.id,
      baslangic: o.baslangic,
      cihaz: o.cihaz,
      kaynak: o.kaynak,
      toplamSn: o.toplamSn,
      donusti: o.donusti,
      adimlar: o.olaylar.map((e) => ({
        tur: e.tur,
        yol: e.yol,
        hedef: e.hedef,
        sureSn: e.sureSn,
        ad: ROTA_HARITA[e.yol]?.ad ?? e.yol,
      })),
    }));
}

/** Bir kullanıcının davranış özeti (detay sayfası kartı için). */
export function kullaniciDavranisOzet(kullaniciId: string): { oturumSayi: number; toplamSn: number; enCokSayfa: string; sonZiyaret: number } | null {
  const yol = kullaniciYolculugu(kullaniciId);
  if (!yol.length) return null;
  const toplamSn = yol.reduce((a, o) => a + o.toplamSn, 0);
  const sayfaSay: Record<string, number> = {};
  for (const o of yol) for (const a of o.adimlar) if (a.tur === "sayfa" && a.yol) sayfaSay[a.ad] = (sayfaSay[a.ad] || 0) + 1;
  const enCok = Object.entries(sayfaSay).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  return { oturumSayi: yol.length, toplamSn, enCokSayfa: enCok, sonZiyaret: yol[0].baslangic };
}

/* ── Saatlik aktivite (gün×saat gerçek trafik ısı haritası) ── */
let _saatlik: number[][] | null = null;
export function trafikHeatmap(): number[][] {
  if (_saatlik) return _saatlik;
  const izgara: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  const { oturumlar } = veri();
  for (const o of oturumlar) {
    const d = new Date(o.baslangic);
    izgara[d.getUTCDay()][d.getUTCHours()]++;
  }
  _saatlik = izgara;
  return _saatlik;
}

/** Kayıt/dönüşüm günü kırılımı (son 30 gün) — davranış trendi. */
export function gunlukTrafik(): { gun: string; oturum: number; donusum: number }[] {
  const { oturumlar } = veri();
  const gunMap: Record<number, { oturum: number; donusum: number }> = {};
  for (const o of oturumlar) {
    const g = Math.floor((BUGUN - o.baslangic) / GUN);
    if (g < 0 || g > 29) continue;
    (gunMap[g] ??= { oturum: 0, donusum: 0 }).oturum++;
    if (o.donusti) gunMap[g].donusum++;
  }
  const out: { gun: string; oturum: number; donusum: number }[] = [];
  for (let g = 29; g >= 0; g--) {
    const v = gunMap[g] ?? { oturum: 0, donusum: 0 };
    out.push({ gun: `${g}g`, oturum: v.oturum, donusum: v.donusum });
  }
  return out;
}
