import "server-only";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { mkdir, readFile, rename, rm, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { projeOkuHam } from "./depo";
import { isletmeOku, listeOku } from "./isletme";
import { siparisler, terkEdilenler } from "./isletmeMagaza";
import { para, type Randevu } from "./isletmeTipler";
import { dilimTarih, dilimZaman } from "./bolge";
import { siteAdresi } from "./bulutKimlik";
import { belirtecUret, cikBelirteci, ekGuncelle, ekOku } from "./buyumeEkDepo";
import { kisileriKur } from "./buyumeKisiler";
import { davetBaglantisi, epostaDurumu, markaOzeti, tekGonder } from "./buyumeEposta";
import { davetKodu, etiketDoldur, kampanyaBaglantilari, kampanyaHtml, kampanyaMetni, saatProfiliHesapla, type EkVeri, type Kisi, type SaatProfili } from "./buyumeEkTipler";
import {
  adimAl, akisBloklari, akisDoldur, bekleMs, bosAkisDosya, bosIstatistik, bosSayac, butunAdimlar, dalaGir, ilkKonum, sessizKaydir, sonrakiKonum, sonrakiSaat,
  type Adim, type AdimEposta, type Akis, type AkisBag, type AkisDosya, type AkisGonderim, type AkisIstemci, type AkisKayit,
} from "./buyumeAkisTipler";
import type { Proje } from "./tipler";

/**
 * E-posta otomasyon akışlarının çalıştırıcısı. Büyüme zamanlayıcısı (buyumeEposta.zamanlayiciKur) dakikada bir açık akışı
 * olan projeleri tarar: tetiklere göre yeni kişileri akışa alır (İşletme aboneleri, siparişler, terk edilen sepetler,
 * randevular, doğum günleri, uzun süre gelmeyenler, etiketler), süresi gelen adımları işler, e-postaları imzalı izleme
 * bağlantılarıyla gönderir ve akıştan gelen siparişleri (açılma ya da tıktan sonraki 5 gün) akışa yazar.
 * İzin kuralı her e-postada yeniden denetlenir: reddeden ve çıkan kişiye hiçbir zaman gönderilmez.
 * Çalışma durumu: .veri/build/buyume-akis/<proje>.json. Açık akışı olan projeler: .veri/build/buyume-akis-dizin.json.
 */
const KOK = path.join(DEPO_KOK, "build", "buyume-akis");
const DIZIN = path.join(DEPO_KOK, "build", "buyume-akis-dizin.json");
const KIMLIK = /^[A-Za-z0-9_-]{12}$/;
const dosya = (id: string) => path.join(KOK, `${id}.json`);
type GA = { __vayraAkisKilit?: Map<string, Promise<unknown>>; __vayraAkisSuren?: Set<string>; __vayraAkisDizin?: Record<string, number> };
const G = globalThis as unknown as GA;
const kilit = (G.__vayraAkisKilit ??= new Map());
const suren = (G.__vayraAkisSuren ??= new Set());

export async function akisOku(id: string): Promise<AkisDosya> {
  if (!KIMLIK.test(id)) return bosAkisDosya();
  try { return { ...bosAkisDosya(), ...(JSON.parse(await readFile(dosya(id), "utf8")) as Partial<AkisDosya>) }; } catch { return bosAkisDosya(); }
}
/** Oku, değiştir, yaz (proje başına sıralı; izleme uçları ve çalıştırıcı aynı sıradan geçer). */
export function akisGuncelle<T>(id: string, f: (d: AkisDosya) => T | Promise<T>): Promise<T> {
  if (!KIMLIK.test(id)) return Promise.reject(new Error("Geçersiz proje."));
  const onceki = kilit.get(id) ?? Promise.resolve();
  const is = onceki.then(async () => {
    const d = await akisOku(id);
    const s = await f(d);
    const ham = JSON.stringify(d);
    await mkdir(KOK, { recursive: true });
    const gecici = `${dosya(id)}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(gecici, ham);
    try { await rename(gecici, dosya(id)); } catch { await writeFile(dosya(id), ham); await rm(gecici, { force: true }); }
    return s;
  });
  kilit.set(id, is.catch(() => {}));
  return is;
}
export async function akisDosyaSil(id: string) { if (KIMLIK.test(id)) await rm(dosya(id), { force: true }); dizinCikar(id); }

/* ── Açık akışı olan projeler dizini ── */
function dizin(): Record<string, number> { if (!G.__vayraAkisDizin) { try { G.__vayraAkisDizin = JSON.parse(readFileSync(DIZIN, "utf8")); } catch { G.__vayraAkisDizin = {}; } } return G.__vayraAkisDizin!; }
const dizinYaz = () => { try { mkdirSync(path.dirname(DIZIN), { recursive: true }); writeFileSync(DIZIN, JSON.stringify(dizin())); } catch { /* yok */ } };
export function dizinEkle(id: string) { if (!dizin()[id]) { dizin()[id] = Date.now(); dizinYaz(); } }
function dizinCikar(id: string) { if (dizin()[id]) { delete dizin()[id]; dizinYaz(); } }
export const akisProjeleri = () => Object.keys(dizin());

/* ── Yardımcılar ── */
const SAAT = 3600_000, GUN = 864e5;
/** Tarih ve saatler işletmenin saat diliminde (Baglam.tz). */
const trTarih = (z: number, tz = "UTC") => dilimTarih(z, tz);
const trAn = (tarih: string, saat: string, tz = "UTC") => dilimZaman(tarih, saat, tz);
const tutarYaz = (n: number, p: { kod: string; yerel: string }) => para(n, p.kod, p.yerel);
const sayac = (d: AkisDosya, akis: string, adim?: string) => {
  const i = (d.istatistik[akis] ??= bosIstatistik());
  return { i, a: adim ? (i.adim[adim] ??= bosSayac()) : null };
};
const logla = (k: AkisKayit, olay: string) => { k.log = [...k.log, { z: Date.now(), olay }].slice(-12); };
const kokenBul = (ek: EkVeri) => ek.kampanyalar.find((k) => k.koken)?.koken || (process.env.VAYRA_ANA_ALAN ? `https://${process.env.VAYRA_ANA_ALAN}` : "http://localhost:3100");

/** Gönderim saati profili: kampanya ve akış e-postalarının açılma ve tık anları. */
export function saatProfili(ek: EkVeri, d: AkisDosya, tz = "Europe/Istanbul"): SaatProfili {
  const o: { e: string; z: number; tik?: boolean }[] = [];
  for (const k of ek.kampanyalar) for (const a of k.alicilar) { if (a.a) o.push({ e: a.e, z: a.a }); if (a.t && a.t !== a.a) o.push({ e: a.e, z: a.t, tik: true }); }
  for (const g of d.gonderimler) { if (g.a) o.push({ e: g.e, z: g.a }); if (g.t && g.t !== g.a) o.push({ e: g.e, z: g.t, tik: true }); }
  return saatProfiliHesapla(o, tz);
}
/** Kişiye son pazarlama e-postasının gittiği an (akıllı gönderim). */
function sonGonderimler(ek: EkVeri, d: AkisDosya): Map<string, number> {
  const m = new Map<string, number>();
  const yaz = (e: string, z: number) => { if (z > (m.get(e) ?? 0)) m.set(e, z); };
  for (const k of ek.kampanyalar) for (const a of k.alicilar) if (a.d === "gonderildi") yaz(a.e, a.g ?? k.gonderimBas ?? 0);
  for (const g of d.gonderimler) if (g.d === "gonderildi") yaz(g.e, g.z);
  return m;
}

type Aday = { anahtar: string; e: string; ad: string; z: number; bag?: Record<string, string> };
type Baglam = { p: Proje; ek: EkVeri; kisiler: Kisi[]; kisi: Map<string, Kisi>; odenen: { e: string; z: number; no: string; tutar: number }[]; simdi: number; tz: string; para: { kod: string; yerel: string } };

/** Tetiğe uyan adaylar (olay zamanı bas'tan sonra olanlar). */
async function adaylar(a: Akis, b: Baglam): Promise<Aday[]> {
  const ac = a.acilis ?? b.simdi;
  const bas = ac - (a.gecmis ? (a.tetik === "geri-kazan" ? 365 : 7) * GUN : 0);
  const l: Aday[] = [];
  const s = a.ayar;
  switch (a.tetik) {
    case "hosgeldin": {
      const kaynak = s.kaynak?.length ? s.kaynak : ["abone", "uye", "form"];
      for (const k of b.kisiler) {
        if (!k.eposta) continue;
        const z = Math.min(...k.olaylar.filter((o) => (o.tur === "abone" && kaynak.includes("abone")) || (o.tur === "uye" && kaynak.includes("uye")) || (o.tur === "form" && kaynak.includes("form") && k.izin === "onay" && /form/i.test(k.izinKaynak ?? ""))).map((o) => o.z), Infinity);
        if (Number.isFinite(z) && z >= bas) l.push({ anahtar: `hg:${k.eposta}`, e: k.eposta, ad: k.ad, z });
      }
      break;
    }
    case "siparis": {
      const sirali = [...b.odenen].sort((x, y) => x.z - y.z);
      const ilkler = new Set<string>(); const gorulen = new Set<string>();
      for (const o of sirali) { if (!gorulen.has(o.e)) { ilkler.add(o.no); gorulen.add(o.e); } }
      for (const o of sirali) {
        if (o.z < bas || (s.ilk && !ilkler.has(o.no)) || (s.enAzTutar && o.tutar < s.enAzTutar)) continue;
        l.push({ anahtar: `sp:${o.no}`, e: o.e, ad: b.kisi.get(o.e)?.ad ?? o.e.split("@")[0], z: o.z, bag: { siparis_no: o.no, tutar: tutarYaz(o.tutar, b.para) } });
      }
      break;
    }
    case "terk-sepet": {
      for (const t of await terkEdilenler(b.p.id).catch(() => [])) {
        const e = (t.eposta ?? "").toLocaleLowerCase("tr-TR");
        if (!e || t.olusturma < bas) continue;
        l.push({ anahtar: `ts:${t.siparisNo}`, e, ad: t.ad || b.kisi.get(e)?.ad || e.split("@")[0], z: t.olusturma + 30 * 60_000, bag: { sepet: t.kalemler.filter((x) => !String(x.ad).startsWith("Kargo")).map((x) => `${x.adet} x ${x.ad}`).join("\n"), tutar: tutarYaz(t.tutar, b.para), siparis_no: t.siparisNo } });
      }
      break;
    }
    case "dogum-gunu": {
      const saat = s.saat || "10:00", once = Math.min(14, Math.max(0, s.gunOnce ?? 0));
      const yil = Number(trTarih(b.simdi, b.tz).slice(0, 4));
      for (const k of b.kisiler) {
        if (!k.eposta || !k.dogum) continue;
        let ag = k.dogum.slice(-5);
        for (const y of [yil, yil + 1]) {
          if (ag === "02-29" && !(y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0))) ag = "02-28";
          const z = trAn(`${y}-${ag}`, saat, b.tz) - once * GUN;
          if (z <= b.simdi && b.simdi - z < 2 * GUN && z >= bas - 2 * GUN) l.push({ anahtar: `dg:${k.eposta}:${y}`, e: k.eposta, ad: k.ad, z });
        }
      }
      break;
    }
    case "geri-kazan": {
      const gun = Math.min(365, Math.max(14, s.gun ?? 90)), saat = s.saat || "11:00";
      const son = new Map<string, number>();
      for (const o of b.odenen) son.set(o.e, Math.max(son.get(o.e) ?? 0, o.z));
      for (const [e, z0] of son) {
        const z = trAn(trTarih(z0 + gun * GUN, b.tz), saat, b.tz);
        if (z <= b.simdi && z >= bas) l.push({ anahtar: `gk:${e}:${z0}`, e, ad: b.kisi.get(e)?.ad ?? e.split("@")[0], z });
      }
      break;
    }
    case "randevu": {
      for (const r of await listeOku<Randevu>(b.p.id, "randevular").catch(() => [] as Randevu[])) {
        const e = (r.eposta ?? "").toLocaleLowerCase("tr-TR");
        if (!e || (s.hizmet && r.hizmetId !== s.hizmet)) continue;
        if (!(r.durum === "geldi" || (r.durum === "onaylandi" && r.bit < b.simdi))) continue;
        if (r.bit < bas || r.bit > b.simdi) continue;
        l.push({ anahtar: `rv:${r.id}`, e, ad: r.ad || e.split("@")[0], z: r.bit, bag: { hizmet: r.hizmetAd } });
      }
      break;
    }
    case "etiket": {
      const et = (s.etiket ?? "").trim().toLocaleLowerCase("tr-TR");
      if (!et) break;
      for (const k of b.kisiler) if (k.eposta && k.etiketler.includes(et)) l.push({ anahtar: `et:${et}:${k.eposta}`, e: k.eposta, ad: k.ad, z: b.simdi });
      break;
    }
  }
  return l;
}

/** Akış açılırken: etiket tetiğinde var olan etiketliler "görüldü" sayılır (geçmiş katılmıyorsa). */
export async function akisTohumla(id: string, a: Akis) {
  if (a.tetik !== "etiket" || a.gecmis) return;
  const ek = await ekOku(id);
  const kisiler = await kisileriKur(id, ek);
  const et = (a.ayar.etiket ?? "").trim().toLocaleLowerCase("tr-TR");
  await akisGuncelle(id, (d) => { for (const k of kisiler) if (k.eposta && k.etiketler.includes(et)) d.gorulen[`${a.id}|et:${et}:${k.eposta}`] ??= Date.now(); });
}

function kosulDegerlendir(adim: Extract<Adim, { tur: "kosul" }>, k: AkisKayit, b: Baglam, d: AkisDosya): boolean {
  const kisi = b.kisi.get(k.e);
  const benim = d.gonderimler.filter((g) => g.kayit === k.id);
  switch (adim.kosul) {
    case "siparis-verdi": return b.odenen.some((o) => o.e === k.e && o.z > k.giris);
    case "acti": return benim.some((g) => g.a);
    case "tikladi": return benim.some((g) => g.t);
    case "etiket-var": return !!kisi?.etiketler.includes((adim.deger ?? "").trim().toLocaleLowerCase("tr-TR"));
    case "harcama": return (kisi?.harcama ?? 0) >= Number(adim.deger || 0);
    case "siparis-sayisi": return (kisi?.siparisSayisi ?? 0) >= Number(adim.deger || 1);
    case "izin-onay": return kisi?.izin === "onay" && !kisi.cikti;
  }
}

/** E-postanın gideceği an (Türkiye saati kuralları). */
function gonderimAni(adim: AdimEposta, a: Akis, e: string, prof: SaatProfili, simdi: number): number {
  let z = simdi;
  if (adim.saat === "kisisel") { const h = prof.kisiSaat[e] ?? prof.enIyiSaat; z = sonrakiSaat(simdi - 30 * 60_000, `${String(h).padStart(2, "0")}:00`, prof.tz); if (z < simdi) z = simdi; }
  else if (adim.saat === "sabit" && adim.sabitSaat) { z = sonrakiSaat(simdi - 60_000, adim.sabitSaat, prof.tz); if (z < simdi) z = simdi; }
  if (a.sessiz && adim.saat !== "sabit") z = sessizKaydir(z, prof.tz);
  return z;
}

type Ortam = Baglam & { koken: string; site: string; marka: ReturnType<typeof markaOzeti>; prof: SaatProfili; son: Map<string, number>; servis: boolean; kuponlar: Set<string>; yorum: string; etiketler: [string, string][]; gonderilen: number };

async function epostaAdimi(a: Akis, adim: AdimEposta, k: AkisKayit, d: AkisDosya, o: Ortam): Promise<"bekle" | "devam"> {
  const { i, a: s } = sayac(d, a.id, adim.id);
  const kisi = o.kisi.get(k.e);
  const cikti = !!o.ek.cikanlar[k.e] || !!kisi?.cikti;
  const izin = kisi?.izin ?? "bilinmiyor";
  const atla = (neden: string) => { s!.atlanan++; i.atlanan++; logla(k, `${adim.ad || "E-posta"} atlandı: ${neden}`); d.gonderimler.push({ n: ++d.sayac, akis: a.id, adim: adim.id, kayit: k.id, e: k.e, z: Date.now(), konu: adim.konu, d: "atlandi", h: neden, baglantilar: [] }); return "devam" as const; };
  if (cikti || izin === "ret") return atla("abonelikten çıktı ya da izni reddetti");
  if (!(izin === "onay" || (a.izin === "belirsiz-dahil" && a.izinBeyan && izin === "bilinmiyor"))) return atla("ticari ileti onayı yok");
  if (a.akilli && (o.son.get(k.e) ?? 0) > Date.now() - 16 * SAAT) return atla("son 16 saatte e-posta aldı (akıllı gönderim)");
  if (!o.marka.iletisim) { k.neden = "Marka kitinde gönderen bilgisi yok; ticari iletide zorunlu."; k.sonraki = Date.now() + SAAT; return "bekle"; }
  if (!o.servis) { k.neden = "E-posta servisi kurulu değil."; k.sonraki = Date.now() + 30 * 60_000; return "bekle"; }
  if (adim.kupon && !o.kuponlar.has(adim.kupon)) return atla(`${adim.kupon} kuponu artık etkin değil`);
  if (o.gonderilen >= 40) { k.sonraki = Date.now() + 30_000; return "bekle"; }
  k.neden = undefined;
  const n = ++d.sayac;
  const t = belirtecUret(o.p.id, `A${a.id}`, n);
  const iz = { piksel: `${o.koken}/api/build/buyume-genel/e/a/${t}`, tik: (x: number) => `${o.koken}/api/build/buyume-genel/e/t/${t}?i=${x}`, cik: `${o.koken}/api/build/buyume-genel/e/c/${t}` };
  const bag: AkisBag = { ...(k.bag ?? {}), kupon: adim.kupon ?? "", yorum_baglantisi: o.yorum };
  const bloklar = akisBloklari(adim.bloklar, bag);
  const dold = { ad: k.ad, eposta: k.e, davetKodu: davetKodu(k.e), davetBaglantisi: davetBaglantisi(o.p, o.koken, k.e) };
  const baglantilar = kampanyaBaglantilari(bloklar.map((b) => ({ ...b, metin: b.metin ? etiketDoldur(b.metin, o.marka.site, dold) : b.metin, adres: b.adres ? etiketDoldur(b.adres, o.marka.site, dold) : b.adres })));
  const konu = akisDoldur(adim.konu, bag).replace(/\{ad\}/g, k.ad).replace(/\{site\}/g, o.marka.site).replace(/\s+,/g, ",").trim();
  const r = await tekGonder({ kime: k.e, konu, html: kampanyaHtml({ konu, onMetin: akisDoldur(adim.onMetin, bag).replace(/\{ad\}/g, k.ad), bloklar }, o.marka, dold, iz), metin: kampanyaMetni({ bloklar }, o.marka.site, dold, iz.cik), cik: iz.cik, cikPost: iz.cik, site: o.marka.site });
  o.gonderilen++;
  const g: AkisGonderim = { n, akis: a.id, adim: adim.id, kayit: k.id, e: k.e, z: Date.now(), konu, d: r.ok ? "gonderildi" : "hata", h: r.ok ? undefined : r.hata, baglantilar };
  d.gonderimler.push(g);
  if (r.ok) { s!.gonderilen++; i.gonderilen++; o.son.set(k.e, Date.now()); logla(k, `${adim.ad || "E-posta"} gönderildi`); }
  else { s!.hata++; i.hata++; logla(k, `${adim.ad || "E-posta"} gönderilemedi: ${r.hata}`); }
  await new Promise((x) => setTimeout(x, 520));
  return "devam";
}

async function ilerlet(a: Akis, k: AkisKayit, d: AkisDosya, o: Ortam) {
  for (let n = 0; n < 12 && k.durum === "aktif" && k.sonraki <= Date.now(); n++) {
    const { i } = sayac(d, a.id);
    const kisi = o.kisi.get(k.e);
    if (o.ek.cikanlar[k.e] || kisi?.cikti) { k.durum = "cikti"; k.neden = "Abonelikten çıktı"; i.cikan++; logla(k, "Abonelikten çıktığı için akıştan çıktı"); return; }
    if (a.siparisCikis && o.odenen.some((x) => x.e === k.e && x.z > k.giris)) { k.durum = "cikti"; k.neden = "Sipariş verdi"; i.cikan++; logla(k, "Sipariş verdiği için akıştan çıktı"); return; }
    const adim = adimAl(a.adimlar, k.konum);
    if (!adim) { k.durum = "bitti"; k.konum = null; i.biten++; logla(k, "Akışı tamamladı"); return; }
    const { a: s } = sayac(d, a.id, adim.id);
    if (adim.tur === "bekle") {
      if (!k.bekliyor) { k.bekliyor = true; k.sonraki = Date.now() + bekleMs(adim); return; }
      k.bekliyor = false; s!.gecen++; k.konum = sonrakiKonum(a.adimlar, k.konum!);
    } else if (adim.tur === "eposta") {
      if (!k.bekliyor) {
        const z = gonderimAni(adim, a, k.e, o.prof, Date.now());
        if (z > Date.now() + 30_000) { k.bekliyor = true; k.sonraki = z; logla(k, `${adim.ad || "E-posta"} ${new Date(z).toLocaleString("tr-TR", { timeZone: o.prof.tz, day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} için sıraya girdi`); return; }
      }
      if ((await epostaAdimi(a, adim, k, d, o)) === "bekle") return;
      k.bekliyor = false; s!.gecen++; k.konum = sonrakiKonum(a.adimlar, k.konum!);
    } else if (adim.tur === "kosul") {
      const evet = kosulDegerlendir(adim, k, o, d);
      if (evet) s!.evet++; else s!.hayir++;
      s!.gecen++; logla(k, `Koşul: ${evet ? "evet" : "hayır"}`);
      k.konum = dalaGir(a.adimlar, k.konum!, evet);
    } else if (adim.tur === "etiket") {
      if (adim.etiket.trim()) o.etiketler.push([k.e, adim.etiket.trim().toLocaleLowerCase("tr-TR")]);
      s!.gecen++; logla(k, `"${adim.etiket}" etiketi eklendi`);
      k.konum = sonrakiKonum(a.adimlar, k.konum!);
    }
    k.sonraki = Date.now();
    if (k.konum === null) { k.durum = "bitti"; i.biten++; logla(k, "Akışı tamamladı"); return; }
  }
}

/** Projenin akış turu: girişler, adımlar, dönüşümler, budama. */
export async function akisTuru(id: string): Promise<void> {
  if (suren.has(id)) return;
  suren.add(id);
  try {
    const p = await projeOkuHam(id);
    if (!p) { await akisDosyaSil(id); return; }
    const ek = await ekOku(id);
    const acik = ek.akislar.filter((a) => a.durum === "acik");
    const d0 = await akisOku(id);
    if (!acik.length && !d0.kayitlar.some((k) => k.durum === "aktif")) { dizinCikar(id); return; }
    const simdi = Date.now();
    const kisiler = await kisileriKur(id, ek);
    const kisi = new Map(kisiler.filter((k) => k.eposta).map((k) => [k.eposta!, k]));
    const odenen = (await siparisler(id, "canli").catch(() => [])).filter((s) => s.durum === "odendi" && s.eposta).map((s) => ({ e: s.eposta.toLocaleLowerCase("tr-TR"), z: s.olusturma, no: s.siparisNo, tutar: s.tutar }));
    const isletme = await isletmeOku(id).catch(() => null);
    const tz = isletme?.profil.saatDilimi || "UTC";
    const paraB = { kod: isletme?.magaza.paraBirimi || "TRY", yerel: isletme?.profil.yerel || "tr-TR" };
    const koken = kokenBul(ek);
    const site = siteAdresi(p, koken);
    const etiketler: [string, string][] = [];
    await akisGuncelle(id, async (d) => {
      const o: Ortam = {
        p, ek, kisiler, kisi, odenen, simdi, tz, para: paraB, koken, site, marka: markaOzeti(p, ek), prof: saatProfili(ek, d, tz), son: sonGonderimler(ek, d), servis: epostaDurumu().kurulu,
        kuponlar: new Set((isletme?.kuponlar ?? []).filter((k) => k.aktif && (!k.bitis || k.bitis >= trTarih(simdi, tz))).map((k) => k.kod)),
        yorum: isletme?.profil.googleProfil || site, etiketler, gonderilen: 0,
      };
      // 1. Girişler
      for (const a of acik) {
        let yeni = 0;
        for (const x of await adaylar(a, o)) {
          const anahtar = `${a.id}|${x.anahtar}`;
          if (d.gorulen[anahtar] || yeni >= 200) continue;
          d.gorulen[anahtar] = simdi;
          if (d.kayitlar.some((k) => k.akis === a.id && k.e === x.e && k.durum === "aktif")) continue;
          const son = d.gorulen[`son|${a.id}|${x.e}`];
          if (a.yeniden > 0 && son && simdi - son < a.yeniden * GUN) continue;
          d.gorulen[`son|${a.id}|${x.e}`] = simdi;
          const k: AkisKayit = { id: `${a.id.slice(0, 4)}${(++d.sayac).toString(36)}`, akis: a.id, e: x.e, ad: x.ad, giris: simdi, konum: ilkKonum(a.adimlar), sonraki: simdi, durum: "aktif", anahtar: x.anahtar, bag: x.bag, log: [{ z: simdi, olay: "Akışa girdi" }] };
          d.kayitlar.push(k); yeni++;
          sayac(d, a.id).i.giren++;
        }
      }
      // 2. Adımlar
      for (const k of d.kayitlar) {
        if (k.durum !== "aktif" || k.sonraki > Date.now()) continue;
        const a = ek.akislar.find((x) => x.id === k.akis);
        if (!a) { k.durum = "cikti"; k.neden = "Akış silindi"; continue; }
        if (a.durum !== "acik") continue;
        await ilerlet(a, k, d, o);
      }
      // 3. Dönüşüm: açılan ya da tıklanan akış e-postasından sonraki 5 gün içinde verilen sipariş
      for (const s of odenen) {
        if (s.z < simdi - 6 * GUN || d.gorulen[`don|${s.no}`]) continue;
        const g = [...d.gonderimler].reverse().find((x) => x.e === s.e && x.d === "gonderildi" && (x.a || x.t) && x.z < s.z && s.z - x.z < 5 * GUN);
        d.gorulen[`don|${s.no}`] = simdi;
        if (!g) continue;
        const ist = sayac(d, g.akis).i; ist.siparis++; ist.ciro += s.tutar;
      }
      // 4. Budama
      d.kayitlar = d.kayitlar.filter((k) => k.durum === "aktif" || simdi - k.sonraki < 60 * GUN).slice(-20_000);
      d.gonderimler = d.gonderimler.slice(-8000);
      const anahtarlar = Object.keys(d.gorulen);
      if (anahtarlar.length > 120_000) for (const x of anahtarlar.filter((y) => y.startsWith("don|")).slice(0, 20_000)) delete d.gorulen[x];
      d.son = simdi; d.uyari = o.servis ? undefined : "E-posta servisi kurulu değil; e-posta adımları bekliyor.";
    });
    if (etiketler.length) await ekGuncelle(id, (v) => { for (const [e, t] of etiketler) { const m = (v.kisiMeta[e] ??= { etiketler: [] }); if (!m.etiketler.includes(t)) m.etiketler = [...m.etiketler, t].slice(-20); } });
  } catch { /* bir sonraki turda yeniden denenir */ } finally { suren.delete(id); }
}

/** İzleme ucu: akış e-postasının açılması, tıklanması, çıkma. */
export async function akisIzle(p: string, akis: string, n: number, tur: "a" | "t" | "c", i?: number) {
  await akisGuncelle(p, (d) => {
    const g = d.gonderimler.find((x) => x.n === n && x.akis === akis);
    if (!g) return;
    const { i: ist, a: s } = sayac(d, akis, g.adim);
    const z = Date.now();
    if ((tur === "a" || tur === "t") && !g.a) { g.a = z; ist.acilan++; s!.acilan++; }
    if (tur === "t") { if (!g.t) { g.t = z; ist.tiklayan++; s!.tiklayan++; } if (i !== undefined) g.tl = [...new Set([...(g.tl ?? []), i])]; }
    if (tur === "c" && !g.c) { g.c = z; ist.cikis++; s!.cikis++; }
  });
}
export async function akisGonderimBul(p: string, akis: string, n: number) { return (await akisOku(p)).gonderimler.find((x) => x.n === n && x.akis === akis) ?? null; }

/** İstemciye giden akışlar: istatistik, aktif kişi sayısı ve son kayıtlar. */
export async function akisIstemci(id: string, ek: EkVeri): Promise<{ akislar: AkisIstemci[]; son?: number; uyari?: string; saat: SaatProfili }> {
  const d = await akisOku(id);
  return {
    son: d.son, uyari: d.uyari, saat: { ...saatProfili(ek, d, (await isletmeOku(id).catch(() => null))?.profil.saatDilimi || "UTC"), kisiSaat: {} },
    akislar: ek.akislar.map((a) => {
      const ist = { ...(d.istatistik[a.id] ?? bosIstatistik()) };
      const l = d.kayitlar.filter((k) => k.akis === a.id);
      ist.aktif = l.filter((k) => k.durum === "aktif").length;
      return { ...a, ist, sonKayitlar: l.slice(-40).reverse().map(({ id: kid, e, ad, giris, durum, neden, konum, sonraki }) => ({ id: kid, e, ad, giris, durum, neden, konum, sonraki })) };
    }),
  };
}
/** Akış silinince çalışma kayıtları (istatistik, kayıtlar, gönderimler) da silinir. */
export async function akisKayitlariniSil(id: string, akis: string) {
  await akisGuncelle(id, (d) => {
    d.kayitlar = d.kayitlar.filter((k) => k.akis !== akis);
    d.gonderimler = d.gonderimler.filter((g) => g.akis !== akis);
    delete d.istatistik[akis];
    for (const x of Object.keys(d.gorulen)) if (x.startsWith(`${akis}|`) || x.startsWith(`son|${akis}|`)) delete d.gorulen[x];
  });
}
/** Akıştaki bir kişiyi elle çıkarır. */
export async function akistanCikar(id: string, akis: string, kayit: string) {
  await akisGuncelle(id, (d) => { const k = d.kayitlar.find((x) => x.id === kayit && x.akis === akis); if (k && k.durum === "aktif") { k.durum = "cikti"; k.neden = "Sahip elle çıkardı"; sayac(d, akis).i.cikan++; logla(k, "Sahip akıştan çıkardı"); } });
}

/** Adımın deneme gönderimi: tek adrese, izleme olmadan, örnek değerlerle. */
export async function akisDenemesi(id: string, a: Akis, adimId: string, kime: string, koken: string): Promise<{ ok: true } | { ok: false; hata: string }> {
  const p = await projeOkuHam(id);
  if (!p) return { ok: false, hata: "Proje bulunamadı." };
  const adim = butunAdimlar(a.adimlar).find((x) => x.id === adimId);
  if (!adim || adim.tur !== "eposta") return { ok: false, hata: "E-posta adımı bulunamadı." };
  const ek = await ekOku(id);
  const marka = { ...markaOzeti(p, ek), koken };
  const isletme = await isletmeOku(id).catch(() => null);
  const site = siteAdresi(p, koken);
  const bag: AkisBag = { kupon: adim.kupon || "KUPONKODU", sepet: "1 x Sepetteki ürün\n2 x Başka bir ürün", tutar: "450 TL", siparis_no: "SP-DENEME", hizmet: "Seçilen hizmet", yorum_baglantisi: isletme?.profil.googleProfil || site };
  const cik = `${koken}/api/build/buyume-genel/e/c/${cikBelirteci(id, kime.toLocaleLowerCase("tr-TR"))}`;
  const d = { ad: "Deneme", eposta: kime, davetKodu: davetKodu(kime), davetBaglantisi: davetBaglantisi(p, koken, kime) };
  const konu = `Deneme: ${akisDoldur(adim.konu, bag).replace(/\{ad\}/g, "Deneme").replace(/\{site\}/g, p.ad)}`;
  const bloklar = akisBloklari(adim.bloklar, bag);
  return tekGonder({ kime, konu, html: kampanyaHtml({ konu, onMetin: akisDoldur(adim.onMetin, bag), bloklar }, marka, d).replace('href="#abonelikten-cik"', `href="${cik}"`), metin: kampanyaMetni({ bloklar }, p.ad, d, cik), cik, cikPost: cik, site: p.ad });
}

/** Unutulma hakkı: bir kişinin bütün akış kayıtları, gönderimleri ve görüldü işaretleri silinir. */
export async function kisiAkislariniSil(id: string, eposta: string) {
  const e = eposta.trim().toLowerCase();
  await akisGuncelle(id, (d) => {
    d.kayitlar = d.kayitlar.filter((k) => k.e.toLowerCase() !== e);
    d.gonderimler = d.gonderimler.filter((g) => g.e.toLowerCase() !== e);
    for (const x of Object.keys(d.gorulen)) if (x.toLowerCase().endsWith(e)) delete d.gorulen[x];
  });
}
