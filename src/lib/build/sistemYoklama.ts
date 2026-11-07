import "server-only";
import { projeOkuHam } from "./depo";
import { calismaDegiskenleri, maskeleyici } from "./sistemDegisken";
import { canliAkis, sistemGuncelleOz, sistemHam, tetikDinleyenler } from "./sistemDepo";
import type { Tetikleyici } from "./sistemKatalog";
import { sistemBaslat } from "./sistemMotoru";
import { servisOlayBul, type IsletmeOlay } from "./sistemTetikKatalog";
import { eylemBul, uygulamaBul } from "./sistemUygulama";
import { UygHata, uygulamaCalistir } from "./sistemUygulamaCalistir";

/**
 * Yoklamalı tetikler: servis olayları (servisin okuma eylemi aralıklarla çağrılır) ve Vayra İşletme olayları
 * (sipariş, aşama değişimi, randevu, iptal, yorum, abone, terk edilen sepet; dakikada bir). İlk okumada mevcut
 * öğeler yalnız işaretlenir (eski kayıtlar için çalışma açılmaz); ayar değişirse taban yeniden kurulur. Bir yoklamada
 * en çok 20 yeni öğe işlenir, eskiden yeniye. Durum sistemin yoklama alanında (son 1000 kimlik).
 */
type Servis = Extract<Tetikleyici, { tur: "servis" }>;
type Isletme = Extract<Tetikleyici, { tur: "isletme" }>;
const G = globalThis as unknown as { __vayraYoklama?: Set<string> };
const SURUYOR: Set<string> = (G.__vayraYoklama ??= new Set());
const ISLETME_ARALIK = 60_000;

type Oge = { kimlik: string; veri: unknown; durum?: string };

async function servisOgeleri(sahipOz: string, t: Servis, signal: AbortSignal): Promise<{ l: Oge[]; ilkteCalis: boolean }> {
  const o = servisOlayBul(t.olay);
  const u = uygulamaBul(o?.servis), e = eylemBul(u, o?.eylem);
  if (!o || !u || !e) throw new UygHata("Bu servis olayı artık yok; tetiği yeniden seç.", true);
  const ayar: Record<string, unknown> = { ...(t.ayar ?? {}) };
  const g: Record<string, unknown> = {};
  for (const f of e.alanlar) g[f.ad] = ayar[f.ad] ?? f.varsayilan ?? "";
  Object.assign(g, o.sabit?.(ayar, Date.now()) ?? {});
  const { sir } = await calismaDegiskenleri(sahipOz).catch(() => ({ sir: {} as Record<string, string> }));
  const r = await uygulamaCalistir({ u, e, g, sir, sahipOz, signal, baglantiId: t.baglanti });
  const l = o.ogeler(r.veri).map((x, i) => ({ kimlik: o.kimlik(x, i), veri: o.veri ? o.veri(x, ayar) : x }));
  return { l, ilkteCalis: o.id === "takvim-baslangic" };
}

async function isletmeOgeleri(projeId: string, olay: IsletmeOlay): Promise<Oge[]> {
  const mag = await import("./isletmeMagaza");
  const ist = await import("./isletme");
  switch (olay) {
    case "siparis": return (await mag.siparisler(projeId, "canli")).filter((s) => s.durum === "odendi").slice(0, 300).map((s) => ({ kimlik: String(s.siparisNo ?? s.id), veri: mag.siparisPanel(s) }));
    case "siparisAsama": return (await mag.siparisler(projeId, "canli")).filter((s) => s.durum === "odendi" || s.durum === "iade").slice(0, 500).map((s) => ({ kimlik: String(s.siparisNo ?? s.id), veri: mag.siparisPanel(s), durum: mag.asamaBul(s) }));
    case "terkSepet": return (await mag.terkEdilenler(projeId)).map((s) => ({ kimlik: String(s.siparisNo), veri: s }));
    case "randevu": case "randevuIptal": {
      const l = await ist.listeOku<import("./isletmeTipler").Randevu>(projeId, "randevular");
      return l.slice(-500).map((r) => ({ kimlik: r.id, veri: { ...r, baslangic: new Date(r.bas).toISOString(), bitis: new Date(r.bit).toISOString() }, durum: r.durum }));
    }
    case "yorum": return (await ist.listeOku<import("./isletmeTipler").Yorum>(projeId, "yorumlar")).slice(-500).map(({ ip: _ip, ...y }) => ({ kimlik: y.id, veri: y }));
    case "abone": return (await ist.listeOku<import("./isletmeTipler").Abone>(projeId, "aboneler")).slice(-500).map((a) => ({ kimlik: a.id, veri: a }));
  }
}

/** Tek tetiği yoklar; yeni öğe başına çalışma başlatır. */
export async function tetikYokla(sistemId: string, sahipOz: string, t: Servis | Isletme): Promise<{ yeni: number; hata?: string }> {
  const k = `${sistemId}:${t.id}`;
  if (SURUYOR.has(k)) return { yeni: 0 };
  SURUYOR.add(k);
  const imza = t.tur === "servis" ? JSON.stringify([t.olay, t.ayar ?? {}, t.baglanti ?? ""]) : JSON.stringify([t.projeId, t.olay]);
  try {
    await sistemGuncelleOz(sistemId, sahipOz, (x) => { x.yoklama ??= {}; x.yoklama[t.id] = { ...(x.yoklama[t.id] ?? { gorulen: [] }), son: Date.now() }; });
    let l: Oge[], ilkteCalis = false;
    try {
      if (t.tur === "servis") ({ l, ilkteCalis } = await servisOgeleri(sahipOz, t, AbortSignal.timeout(60_000)));
      else {
        const p = await projeOkuHam(t.projeId);
        if (!p || p.sahip !== sahipOz) throw new UygHata("İşletme projesi bulunamadı ya da senin değil.", true);
        l = await isletmeOgeleri(t.projeId, t.olay);
      }
    } catch (e) {
      const { sir } = await calismaDegiskenleri(sahipOz).catch(() => ({ sir: {} as Record<string, string> }));
      const hata = maskeleyici(sir)((e as Error).message).slice(0, 400);
      await sistemGuncelleOz(sistemId, sahipOz, (x) => { x.yoklama ??= {}; x.yoklama[t.id] = { ...(x.yoklama[t.id] ?? { gorulen: [], son: Date.now() }), hata }; });
      return { yeni: 0, hata };
    }
    let yeni: Oge[] = [];
    let degisen: (Oge & { onceki: string })[] = [];
    await sistemGuncelleOz(sistemId, sahipOz, (x) => {
      x.yoklama ??= {};
      const d = x.yoklama[t.id] ?? { son: Date.now(), gorulen: [] };
      const ilk = !d.okunan || d.imza !== imza;
      const gorulen = new Set(ilk ? [] : d.gorulen);
      if (t.tur === "isletme" && (t.olay === "siparisAsama" || t.olay === "randevuIptal")) {
        const onceki = ilk ? {} : d.durumlar ?? {};
        const durumlar: Record<string, string> = {};
        for (const o of l) durumlar[o.kimlik] = o.durum ?? "";
        degisen = ilk ? [] : l.filter((o) => onceki[o.kimlik] !== undefined && onceki[o.kimlik] !== o.durum && (t.olay === "siparisAsama" || o.durum === "iptal")).map((o) => ({ ...o, onceki: onceki[o.kimlik] }));
        d.durumlar = Object.fromEntries(Object.entries(durumlar).slice(-1000));
      } else yeni = ilk && !ilkteCalis ? [] : l.filter((o) => !gorulen.has(o.kimlik));
      const simdikiler = l.map((o) => o.kimlik);
      d.gorulen = [...simdikiler, ...[...gorulen].filter((z) => !simdikiler.includes(z))].slice(0, 1000);
      d.hata = undefined; d.okunan = (d.okunan ?? 0) + 1; d.son = Date.now(); d.imza = imza; d.yeni = (d.yeni ?? 0) + yeni.length + degisen.length;
      x.yoklama[t.id] = d;
    });
    const tur = t.tur;
    const isler = [...yeni.slice(0, 20).reverse().map((o) => o.veri), ...degisen.slice(0, 20).map((o) => ({ ...(o.veri as object), oncekiDurum: o.onceki, yeniDurum: o.durum }))];
    for (const v of isler) await sistemBaslat(sistemId, sahipOz, { tur, veri: v }).then((r) => { r?.bitti.catch(() => {}); });
    return { yeni: isler.length };
  } finally { SURUYOR.delete(k); }
}

/** Zamanlayıcı turu: süresi gelen servis ve işletme tetiklerini yoklar. */
export async function yoklamaTuru(simdi = Date.now()): Promise<number> {
  let n = 0;
  for (const id of await tetikDinleyenler("yoklama")) {
    const h = await sistemHam(id);
    if (!h || h.s.durum !== "acik") continue;
    for (const t of canliAkis(h.s).tetikler) {
      if (t.tur !== "servis" && t.tur !== "isletme") continue;
      const d = h.s.yoklama?.[t.id];
      const aralik = t.tur === "servis" ? Math.max(1, Math.min(1440, Number(t.aralik) || 5)) * 60_000 : ISLETME_ARALIK;
      if (d && simdi - d.son < aralik - 2000) continue;
      tetikYokla(id, h.sahipOz, t).catch(() => {});
      n++;
    }
  }
  return n;
}

/** Düzenleyicide "Şimdi oku": tetiğin şu anki öğelerini çalıştırmadan döner (deneme verisi seçmek için). */
export async function tetikOnizle(sahipOz: string, t: Servis | Isletme): Promise<{ ogeler: unknown[]; toplam: number }> {
  let l: Oge[];
  if (t.tur === "servis") l = (await servisOgeleri(sahipOz, t, AbortSignal.timeout(45_000))).l;
  else {
    const p = await projeOkuHam(t.projeId);
    if (!p || p.sahip !== sahipOz) throw new UygHata("İşletme projesi bulunamadı ya da senin değil.", true);
    l = await isletmeOgeleri(t.projeId, t.olay);
    if (t.olay !== "siparis" && t.olay !== "siparisAsama" && t.olay !== "terkSepet") l = l.slice().reverse();
  }
  return { ogeler: l.slice(0, 10).map((o) => (t.tur === "isletme" && (t.olay === "siparisAsama" || t.olay === "randevuIptal") ? { ...(o.veri as object), oncekiDurum: "", yeniDurum: o.durum } : o.veri)), toplam: l.length };
}
