import "server-only";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { sahipOzeti } from "./depo";
import { modelBul } from "./modeller";
import { sonrakiZaman, zamanMetni, type Zamanlama } from "./sistemKatalog";
import { calismaOku, calismaOzetleri, sistemGetir, sistemGuncelle, sistemOlustur, sistemSil, surumEkle, yeniKimlik, type Sistem } from "./sistemDepo";
import { sistemCalistir } from "./sistemMotoru";
import { sohbetGetir, sohbetKaydet, sohbetOlustur, yeniMesajId, type SohbetMesaji, type SohbetParca } from "./sohbetDepo";
import { GOREV_SINIRI } from "./sohbetGorevOrtak";
import type { GorevSonucu } from "./sohbetTipler";
import { yayinlar } from "./sohbetYayin";
import { etkinYol, secimiAyarla } from "./sohbetYol";

/**
 * Zamanlanmış sohbet görevleri (ChatGPT Scheduled, Gemini Schedules gibi). Her görev Sistemler altyapısında zaman
 * tetikli, tek "ajan" adımlı bir sistemdir (zamanlayıcı, çalışma geçmişi, duraklatma ve kredi tavanı oradan gelir).
 * Görevin sohbeti vardır; biten çalışmalar o sohbete "görev çalıştı" mesajı + yanıt olarak aktarılır (sohbet ya da
 * görev listesi açılınca). Kayıt: .veri/build/sohbet-gorev/<özet>.json
 */
export type GorevKaydi = { id: string; sohbet: string; ad: string; istem: string; zaman: Zamanlama; model: string; olusturma: number; aktarilan: string[]; okunmamis: number; sablon?: string };
export type GorevGorunumu = GorevKaydi & { durum: "acik" | "duraklatildi" | "taslak" | "yok"; aciklama: string; sonraki?: number; calisma: number; basarili: number; basarisiz: number; sonCalisma?: number; sonDurum?: string; calisiyor: boolean; sohbetBaslik?: string };

const dosya = (sahip: string) => path.join(DEPO_KOK, "build", "sohbet-gorev", `${sahipOzeti(sahip)}.json`);
const kilitler = new Map<string, Promise<unknown>>();
async function oku(sahip: string): Promise<GorevKaydi[]> { try { return (JSON.parse(await readFile(dosya(sahip), "utf8")) as { gorevler: GorevKaydi[] }).gorevler ?? []; } catch { return []; } }
function degistir<T>(sahip: string, f: (l: GorevKaydi[]) => Promise<T> | T): Promise<T> {
  const k = sahipOzeti(sahip);
  const once = kilitler.get(k) ?? Promise.resolve();
  const is = once.then(async () => {
    const l = await oku(sahip);
    const r = await f(l);
    await mkdir(path.dirname(dosya(sahip)), { recursive: true });
    await writeFile(dosya(sahip), JSON.stringify({ gorevler: l }));
    return r;
  });
  kilitler.set(k, is.catch(() => {}));
  return is;
}
export const gorevleriOku = oku;

/** Zamanlamanın denetimi (geçmişte kalan tek seferlik, geçersiz cron). */
export function zamanDenetle(z: Zamanlama): string | null {
  if (!["gunluk", "haftalik", "aylik", "ozel"].includes(z.siklik)) return "Görevler en sık günde bir kez çalışır.";
  if (z.saat && !/^\d{2}:\d{2}$/.test(z.saat)) return "Saati SS:DD biçiminde yaz.";
  if (!sonrakiZaman(z)) return z.baslangic && z.baslangic === z.bitis ? "Bu tarih ve saat geçmişte kalıyor; ileri bir zaman seç." : "Bu zamanlamayla görev hiç çalışmaz; ayarları kontrol et.";
  return null;
}

/** Sistemin akışı: zaman tetiği + tek ajan adımı. */
function akis(z: Zamanlama, istem: string, model: string) {
  return { tetikler: [{ id: "zaman", tur: "zaman" as const, zaman: z }], adimlar: [{ id: "gorev", ad: "Görevi yap", tur: "ajan" as const, ayar: { istem, model }, hata: "durdur" as const }] };
}
/** Taslağı yayınlar ve açar (Sistemler'deki "Yayınla ve aç" ile aynı). */
async function yayinla(id: string, sahip: string, ac: boolean) {
  let surum: Parameters<typeof surumEkle>[1] | null = null;
  const r = await sistemGuncelle(id, sahip, (s) => {
    const no = Math.max(s.surumSayaci ?? 0, s.yayin?.surum ?? 0) + 1, zaman = Date.now();
    surum = { no, ad: `Sürüm ${no}`, not: "Sohbet görevinden", zaman, tetikler: JSON.parse(JSON.stringify(s.tetikler)), adimlar: JSON.parse(JSON.stringify(s.adimlar)), model: s.ayar.model };
    s.yayin = { surum: no, zaman, tetikler: surum.tetikler, adimlar: surum.adimlar };
    s.surumSayaci = no;
    if (ac) { if (s.durum !== "acik") s.acilis = Date.now(); s.durum = "acik"; s.duraklatmaNedeni = undefined; s.ayar.ustUsteHata = 0; }
  });
  if (surum) await surumEkle(id, surum);
  return r?.sistem ?? null;
}

export async function gorevOlustur(sahip: string, g: { ad: string; istem: string; zaman: Zamanlama; model?: string; sohbet?: string; sablon?: string }): Promise<{ gorev: GorevKaydi } | { hata: string }> {
  const ad = g.ad.trim().slice(0, 80), istem = g.istem.trim().slice(0, 6000);
  if (!ad || !istem) return { hata: "Görevin adı ve ne yapılacağı gerekli." };
  const h = zamanDenetle(g.zaman);
  if (h) return { hata: h };
  const l = await oku(sahip);
  const acik = (await Promise.all(l.map((x) => sistemGetir(x.id, sahip)))).filter((s) => s?.durum === "acik").length;
  if (acik >= GOREV_SINIRI) return { hata: `En çok ${GOREV_SINIRI} etkin görev olabilir. Birini duraklat ya da sil.` };
  const model = modelBul(g.model).id;
  let sohbetId = g.sohbet && (await sohbetGetir(g.sohbet, sahip)) ? g.sohbet : undefined;
  if (!sohbetId) sohbetId = (await sohbetOlustur(sahip, model, { baslik: ad })).id;
  const a = akis(g.zaman, istem, model);
  const s = await sistemOlustur(sahip, { ad: `Görev: ${ad}`, aciklama: `Sohbet görevi. ${zamanMetni(g.zaman)}.`, tetikler: a.tetikler, adimlar: a.adimlar, ayar: { model, krediTavani: 100, ustUsteHata: 0, esZamanli: 1 } });
  await sistemGuncelle(s.id, sahip, (x) => { x.etiketler = ["Sohbet görevi"]; });
  await yayinla(s.id, sahip, true);
  const kayit: GorevKaydi = { id: s.id, sohbet: sohbetId, ad, istem, zaman: g.zaman, model, olusturma: Date.now(), aktarilan: [], okunmamis: 0, ...(g.sablon ? { sablon: g.sablon.slice(0, 40) } : {}) };
  await degistir(sahip, (x) => { x.unshift(kayit); });
  const so = await sohbetGetir(sohbetId, sahip);
  if (so) { so.gorevler = [...new Set([...(so.gorevler ?? []), s.id])]; await sohbetKaydet(so, sahip); }
  return { gorev: kayit };
}

export async function gorevGuncelle(sahip: string, id: string, g: { ad?: string; istem?: string; zaman?: Zamanlama; model?: string; durum?: "acik" | "duraklatildi" }): Promise<{ gorev: GorevKaydi } | { hata: string }> {
  const l = await oku(sahip);
  const x = l.find((k) => k.id === id);
  if (!x) return { hata: "Görev bulunamadı." };
  if (g.zaman) { const h = zamanDenetle(g.zaman); if (h) return { hata: h }; }
  const yeni: GorevKaydi = { ...x, ad: g.ad?.trim().slice(0, 80) || x.ad, istem: g.istem?.trim().slice(0, 6000) || x.istem, zaman: g.zaman ?? x.zaman, model: g.model ? modelBul(g.model).id : x.model };
  if (g.durum === "acik" && x && !(await sistemGetir(id, sahip))) return { hata: "Görevin sistemi silinmiş." };
  if (g.durum === "acik") {
    const acik = (await Promise.all(l.filter((k) => k.id !== id).map((k) => sistemGetir(k.id, sahip)))).filter((s) => s?.durum === "acik").length;
    if (acik >= GOREV_SINIRI) return { hata: `En çok ${GOREV_SINIRI} etkin görev olabilir.` };
  }
  const akisDegisti = g.zaman || g.istem || g.model;
  const r = await sistemGuncelle(id, sahip, (s) => {
    if (akisDegisti) { const a = akis(yeni.zaman, yeni.istem, yeni.model); s.tetikler = a.tetikler; s.adimlar = a.adimlar; s.ayar.model = yeni.model; }
    if (g.ad) s.ad = `Görev: ${yeni.ad}`;
    s.aciklama = `Sohbet görevi. ${zamanMetni(yeni.zaman)}.`;
    if (g.durum === "duraklatildi") s.durum = "duraklatildi";
  });
  if (!r?.sistem) return { hata: "Görevin sistemi bulunamadı." };
  if (akisDegisti || g.durum === "acik") await yayinla(id, sahip, g.durum === "acik" || r.sistem.durum === "acik");
  await degistir(sahip, (l2) => { const i = l2.findIndex((k) => k.id === id); if (i >= 0) l2[i] = { ...l2[i], ...yeni, aktarilan: l2[i].aktarilan, okunmamis: l2[i].okunmamis }; });
  return { gorev: yeni };
}

export async function gorevSil(sahip: string, id: string): Promise<boolean> {
  const x = (await oku(sahip)).find((k) => k.id === id);
  if (!x) return false;
  await sistemSil(id, sahip).catch(() => false);
  await degistir(sahip, (l) => { const i = l.findIndex((k) => k.id === id); if (i >= 0) l.splice(i, 1); });
  const s = await sohbetGetir(x.sohbet, sahip);
  if (s?.gorevler?.includes(id)) { s.gorevler = s.gorevler.filter((k) => k !== id); await sohbetKaydet(s, sahip); }
  return true;
}

/** Şimdi çalıştır (arka planda; sonuç biraz sonra sohbete düşer). */
export async function gorevCalistir(sahip: string, id: string): Promise<boolean> {
  if (!(await oku(sahip)).some((k) => k.id === id) || !(await sistemGetir(id, sahip))) return false;
  sistemCalistir(id, sahipOzeti(sahip), { tur: "elle", veri: { kaynak: "sohbet-gorevi" } }, true).catch(() => {});
  return true;
}

/**
 * Biten çalışmaları görevlerin sohbetlerine aktarır (yeniden eskiye sırayla, en çok 10). Yanıt süren sohbete
 * dokunulmaz (tur kaydı aktarımı ezmesin). sohbet verilirse yalnız o sohbetin görevleri; okundu: okunmamış sıfırlanır.
 */
export async function gorevleriEsitle(sahip: string, o: { sohbet?: string; okundu?: boolean } = {}): Promise<number> {
  const l = await oku(sahip);
  const hedef = l.filter((x) => !o.sohbet || x.sohbet === o.sohbet);
  if (!hedef.length) return 0;
  let toplam = 0;
  await degistir(sahip, async (kayitlar) => {
    for (const g of kayitlar) {
      if (o.sohbet && g.sohbet !== o.sohbet) continue;
      if (o.okundu) g.okunmamis = 0;
      const y = yayinlar.get(g.sohbet);
      if (y && !y.bitti) continue;
      const oz = await calismaOzetleri(g.id).catch(() => []);
      const yeni = oz.filter((c) => (c.durum === "basarili" || c.durum === "basarisiz") && !g.aktarilan.includes(c.id)).slice(0, 10).reverse();
      if (!yeni.length) continue;
      let s = await sohbetGetir(g.sohbet, sahip);
      if (!s) { s = await sohbetOlustur(sahip, g.model, { baslik: g.ad }); g.sohbet = s.id; s.gorevler = [g.id]; }
      for (const c0 of yeni) {
        const c = await calismaOku(g.id, c0.id);
        if (!c) { g.aktarilan.push(c0.id); continue; }
        const adim = c.adimlar.find((a) => a.tur === "ajan");
        const metin = (adim?.cikti ?? "").trim();
        const gorseller = adim?.ek?.gorseller ?? [];
        const yol = etkinYol(s.mesajlar, s.secim);
        const k: SohbetMesaji = { id: yeniMesajId(), rol: "kullanici", zaman: c.baslangic, ust: yol[yol.length - 1]?.id ?? null, metin: g.istem, istek: { gorev: { id: g.id, ad: g.ad } } };
        const parcalar: SohbetParca[] = [];
        if (metin) parcalar.push({ tur: "metin", metin });
        if (gorseller.length) parcalar.push({ tur: "arac", id: `g-${c.id}`, ad: "gorsel_uret", baslik: "Görsel üretildi", durum: "bitti", sonuc: { tur: "gorsel", urller: gorseller } });
        const basarili = c.durum === "basarili" && !!metin;
        const a: SohbetMesaji = {
          id: yeniMesajId(), rol: "asistan", zaman: c.bitis ?? Date.now(), ust: k.id, model: g.model, parcalar, durum: basarili ? "bitti" : "hata",
          ...(basarili ? {} : { hata: c.hata ?? adim?.hata ?? "Görev bu çalışmada tamamlanamadı." }), kredi: Math.round(c.kredi * 100) / 100,
          sureMs: (c.bitis ?? c.baslangic) - c.baslangic, api: metin ? [{ role: "assistant", content: [{ type: "text", text: metin }] }] : [],
        };
        s.mesajlar.push(k, a);
        s.secim = secimiAyarla(s.mesajlar, s.secim ?? {}, a.id);
        g.aktarilan.push(c.id);
        if (!o.okundu) g.okunmamis += 1;
        toplam++;
      }
      g.aktarilan = g.aktarilan.slice(-300);
      s.guncelleme = Date.now();
      await sohbetKaydet(s, sahip);
    }
  });
  return toplam;
}

/** Liste görünümü: sistemin durumu, sonraki çalışma ve sayaçlarla. */
export async function gorevGorunumleri(sahip: string): Promise<GorevGorunumu[]> {
  const l = await oku(sahip);
  const o: GorevGorunumu[] = [];
  for (const g of l) {
    const s: Sistem | null = await sistemGetir(g.id, sahip);
    const so = await sohbetGetir(g.sohbet, sahip);
    const calisiyor = (await calismaOzetleri(g.id).catch(() => [])).some((c) => c.durum === "calisiyor" || c.durum === "kuyrukta");
    o.push({
      ...g, durum: s ? (s.durum as GorevGorunumu["durum"]) : "yok", aciklama: zamanMetni(g.zaman), sonraki: s?.durum === "acik" ? sonrakiZaman(g.zaman) ?? undefined : undefined,
      calisma: s?.ozet.calisma ?? 0, basarili: s?.ozet.basarili ?? 0, basarisiz: s?.ozet.basarisiz ?? 0, sonCalisma: s?.ozet.sonCalisma, sonDurum: s?.ozet.sonDurum, calisiyor, sohbetBaslik: so?.baslik,
    });
  }
  return o;
}

/** Sohbet aracının sonucu (kart). */
export const gorevSonucu = (g: GorevKaydi, durum: "acik" | "duraklatildi" = "acik"): GorevSonucu => ({ tur: "gorev", id: g.id, ad: g.ad, istem: g.istem, aciklama: zamanMetni(g.zaman), sonraki: sonrakiZaman(g.zaman) ?? undefined, durum });
export { yeniKimlik };
