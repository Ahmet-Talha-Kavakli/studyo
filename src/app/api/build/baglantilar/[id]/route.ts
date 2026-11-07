import { acikGorunum, baglantiGetir, baglantiGuncelle, baglantiSil, baglantiTest, kimlikAlanlari, kimlikTanimlari, okumaAraci, varsayilanIzin, type AracSiniri, type AracYukleme } from "@/lib/build/baglantiDepo";
import { islemDogrula, openapiIndir, restAraclari } from "@/lib/build/baglantiRest";
import type { RestIslemTanim } from "@/lib/build/baglantiKatalog";
import { randomBytes } from "crypto";
import type { AracIzni } from "@/lib/build/ajanKatalog";
import { ADAPTORLER } from "@/lib/build/baglantiAdaptorTanim";
import { katalogBul } from "@/lib/build/baglantiKatalog";
import { sahipOzeti } from "@/lib/build/depo";
import { sifrele } from "@/lib/build/sifre";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const yok = () => hata("Bağlantı bulunamadı.", 404);
const IZIN = ["her-zaman", "sor", "kapali"];

export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const b = await baglantiGetir((await params).id, sahip);
  return b ? Response.json({ ok: true, baglanti: acikGorunum(b) }) : yok();
}

type Yama = {
  ad?: string; sohbette?: boolean; saltOkunur?: boolean; izinler?: Record<string, AracIzni>; anahtar?: string; basliklar?: { ad: string; deger: string }[];
  /** v2 */
  topluIzin?: { okuma?: AracIzni; yazma?: AracIzni };
  kullanim?: { sistemler?: boolean; ziyaretci?: boolean };
  aracYukleme?: AracYukleme;
  istemci?: { id?: string; gizli?: string } | null;
  alanlar?: Record<string, string>;
  /** v3 */
  sabitAlanlar?: Record<string, Record<string, unknown> | null>;
  sinirlar?: Partial<AracSiniri>[];
  yeniAraclar?: "varsayilan" | "beklet";
  /** İncelenen araçlar: listeden düşer; "yeni" nedeniyle bekletilen araç varsayılan iznine döner. */
  incele?: string[] | "hepsi";
  etiket?: string;
  /** Uç kullanıcı kipi: her kullanıcı kendi hesabını bağlar. */
  ucKullanici?: { acik?: boolean };
  rest?: { taban?: string; islemEkle?: Partial<RestIslemTanim>; islemSil?: string; semaYenile?: boolean };
};
const PENCERE = ["dakika", "saat", "gun"], KAPSAM = ["hepsi", "ziyaretci", "ajan", "sohbet", "sistem", "gecit"];

/**
 * { ad, sohbette, saltOkunur, izinler, topluIzin, kullanim, aracYukleme, anahtar, alanlar, istemci, basliklar }.
 * Anahtar, kimlik alanları ya da başlıklar değişirse yeniden denenir. Kendi OAuth istemcisi değişirse eski giriş
 * düşer (yeni istemciyle giriş gerekir).
 */
export async function PATCH(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  let g: Yama;
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  let tekrar = false;
  // Şemayı yenile: OpenAPI belgesi kilit dışında indirilir.
  let yeniSema: Awaited<ReturnType<typeof openapiIndir>> | null = null;
  if (g.rest?.semaYenile) {
    const b0 = await baglantiGetir(id, sahip);
    if (!b0?.rest?.kaynak) return hata("Bu bağlantının OpenAPI belgesi adresi yok.");
    try { yeniSema = await openapiIndir(b0.rest.kaynak); } catch (e) { return hata((e as Error).message); }
  }
  const r = await baglantiGuncelle(id, sahip, async (b) => {
    if (g.sabitAlanlar && typeof g.sabitAlanlar === "object") {
      b.sabitAlanlar ??= {};
      for (const [ad, v] of Object.entries(g.sabitAlanlar)) {
        if (!b.araclar.some((a) => a.name === ad)) continue;
        if (!v || typeof v !== "object" || !Object.keys(v).length) { delete b.sabitAlanlar[ad]; continue; }
        if (JSON.stringify(v).length > 20_000) return "Sabit alanlar çok büyük.";
        b.sabitAlanlar[ad] = v;
      }
    }
    if (Array.isArray(g.sinirlar)) {
      const l: AracSiniri[] = [];
      for (const x of g.sinirlar.slice(0, 30)) {
        const adet = Math.floor(Number(x.adet));
        if (!x.pencere || !PENCERE.includes(x.pencere) || !(adet > 0 && adet <= 1_000_000)) return "Sınır geçersiz: pencere ve adet gerekli.";
        const arac = typeof x.arac === "string" && (["*", "okuma", "yazma"].includes(x.arac) || b.araclar.some((a) => a.name === x.arac)) ? x.arac : "*";
        l.push({ id: typeof x.id === "string" && /^[\w-]{4,20}$/.test(x.id) ? x.id : randomBytes(5).toString("hex"), arac, pencere: x.pencere, adet, kapsam: x.kapsam && KAPSAM.includes(x.kapsam) ? x.kapsam : "hepsi" });
      }
      b.sinirlar = l;
    }
    if (g.yeniAraclar === "varsayilan" || g.yeniAraclar === "beklet") b.yeniAraclar = g.yeniAraclar;
    if (g.incele) {
      const l = b.incelenecek ?? [];
      const secilen = g.incele === "hepsi" ? l : l.filter((i) => (g.incele as string[]).includes(i.arac));
      for (const i of secilen) { const a = b.araclar.find((x) => x.name === i.arac); if (a && b.yeniAraclar === "beklet" && i.neden !== "enjeksiyon" && b.izinler[a.name] === "kapali") b.izinler[a.name] = varsayilanIzin(a); }
      b.incelenecek = l.filter((i) => !secilen.includes(i));
    }
    if (typeof g.etiket === "string") b.etiket = g.etiket.trim().slice(0, 30) || undefined;
    if (g.ucKullanici && typeof g.ucKullanici.acik === "boolean") b.ucKullanici = { acik: g.ucKullanici.acik };
    if (g.rest && b.rest) {
      if (typeof g.rest.taban === "string" && /^https?:\/\/[^\s/]+/.test(g.rest.taban.trim())) { b.rest.taban = g.rest.taban.trim().replace(/\/+$/, ""); b.url = b.rest.taban; tekrar = true; }
      if (g.rest.islemEkle) { const d = islemDogrula(g.rest.islemEkle); if (typeof d === "string") return d; b.rest.islemler = [...b.rest.islemler.filter((x) => x.ad !== d.ad), d].slice(0, 300); }
      if (typeof g.rest.islemSil === "string") b.rest.islemler = b.rest.islemler.filter((x) => x.ad !== g.rest!.islemSil);
      if (yeniSema) { b.rest.islemler = yeniSema.islemler; b.rest.surum = yeniSema.surum; }
      b.araclar = restAraclari(b.rest);
      for (const a of b.araclar) b.izinler[a.name] ??= varsayilanIzin(a);
    }
    if (typeof g.ad === "string" && g.ad.trim()) b.ad = g.ad.trim().slice(0, 60);
    if (typeof g.sohbette === "boolean") b.sohbette = g.sohbette;
    if (typeof g.saltOkunur === "boolean") { if (b.saltOkunur !== g.saltOkunur) tekrar = true; b.saltOkunur = g.saltOkunur; }
    if (g.izinler && typeof g.izinler === "object") {
      for (const [k, v] of Object.entries(g.izinler)) if (b.araclar.some((a) => a.name === k) && IZIN.includes(v)) b.izinler[k] = v;
    }
    if (g.topluIzin && typeof g.topluIzin === "object") {
      for (const a of b.araclar) {
        const v = okumaAraci(a) ? g.topluIzin.okuma : g.topluIzin.yazma;
        if (v && IZIN.includes(v)) b.izinler[a.name] = v;
      }
    }
    if (g.kullanim && typeof g.kullanim === "object") {
      b.kullanim = { sistemler: typeof g.kullanim.sistemler === "boolean" ? g.kullanim.sistemler : b.kullanim?.sistemler ?? true, ziyaretci: typeof g.kullanim.ziyaretci === "boolean" ? g.kullanim.ziyaretci : b.kullanim?.ziyaretci ?? true };
    }
    if (g.aracYukleme && ["otomatik", "hepsi", "istekle"].includes(g.aracYukleme)) b.aracYukleme = g.aracYukleme;
    if (typeof g.anahtar === "string" && g.anahtar.trim()) { b.yetki.tur = "anahtar"; b.yetki.anahtar = sifrele(g.anahtar.trim().slice(0, 4000)); tekrar = true; }
    if (g.alanlar && typeof g.alanlar === "object") {
      const tanimlar = kimlikTanimlari(b);
      if (!tanimlar.length) return "Bu bağlantının kimlik alanı yok.";
      const eski = kimlikAlanlari(b);
      for (const a of tanimlar) {
        const v = typeof g.alanlar[a.id] === "string" ? g.alanlar[a.id].trim().slice(0, 600) : undefined;
        if (v === undefined || (!v && a.gizli)) continue; // boş gizli alan: eskisi kalır
        if (v && a.desen && !new RegExp(a.desen).test(v)) return `${a.ad} geçersiz.`;
        if (v && a.secenekler && !a.secenekler.some((x) => x.id === v)) return `${a.ad} geçersiz.`;
        if (v) eski[a.id] = v; else delete eski[a.id];
      }
      b.yetki.alanlar = sifrele(JSON.stringify(eski));
      b.yetki.kimlikToken = undefined;
      tekrar = true;
    }
    if (g.istemci !== undefined) {
      const iid = typeof g.istemci?.id === "string" ? g.istemci.id.trim().slice(0, 300) : "";
      if (!iid) b.yetki.istemci = undefined;
      else b.yetki.istemci = sifrele(JSON.stringify({ id: iid, gizli: typeof g.istemci?.gizli === "string" && g.istemci.gizli.trim() ? g.istemci.gizli.trim().slice(0, 600) : undefined }));
      b.yetki.oauth = undefined; b.yetki.tokenlar = undefined;
      if (b.yetki.tur === "oauth") { b.durum = "giris-gerekli"; b.hata = "OAuth istemcisi değişti; yeniden giriş yap."; }
    }
    if (Array.isArray(g.basliklar)) { b.basliklar = g.basliklar.filter((h) => /^[A-Za-z0-9-]{1,60}$/.test(h.ad) && h.deger).slice(0, 10).map((h) => ({ ad: h.ad, deger: sifrele(h.deger) })); tekrar = true; }
  });
  if (!r) return yok();
  if (!r.baglanti) return hata(r.hata);
  const son = tekrar ? (await baglantiTest(id, sahipOzeti(sahip))) ?? r.baglanti : r.baglanti;
  return Response.json({ ok: true, baglanti: acikGorunum(son) });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  return (await baglantiSil((await params).id, sahip)) ? Response.json({ ok: true }) : yok();
}
