import { ajanGetir, ajanGuncelle, ajanSil, istemciAjan, taslakFarkli, type Ajan, type Devir, type Koruma, type KutuAyar, type OnayPolitika, kutuDosyaTemizle } from "@/lib/build/ajanDepo";
import { calismalariSil } from "@/lib/build/ajanCalismaDepo";
import { testleriSil } from "@/lib/build/ajanTest";
import { ajanKonusmalariniSil } from "@/lib/build/ziyaretciDepo";
import { ARAC_KATALOG, type AracIzni } from "@/lib/build/ajanKatalog";
import { modelBul } from "@/lib/build/modeller";
import { sohbetSil } from "@/lib/build/sohbetDepo";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { icerikDenetle } from "@/lib/moderasyon";
import { prosedurTemizle } from "@/lib/build/ajanProsedurTip";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const yok = () => hata("Ajan bulunamadı.", 404);

/** Ajanın tamamı + yayınlanmamış değişiklik var mı. */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const a = await ajanGetir((await params).id, sahip);
  if (!a) return yok();
  return Response.json({ ok: true, ajan: istemciAjan(a), degisiklik: taslakFarkli(a) });
}

const IZINLER: AracIzni[] = ["her-zaman", "sor", "kapali"];
const SIMGE = /^(\/gercek\/[\w/.-]+\.(webp|png|jpg)|data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+|https:\/\/[^\s"']+)$/;
const ALAN = /^(\*\.)?[a-z0-9-]+(\.[a-z0-9-]+)+$/;
const yazi = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : undefined);

const KIM = /^[A-Za-z0-9_-]{10}$/;
const RENK = /^#[0-9a-f]{6}$/i;
const kimlikler = (v: unknown, n = 20) => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === "string" && KIM.test(x)))].slice(0, n) : undefined);
const adresMi = (v: string) => /^https:\/\/[^\s"'<>]{4,300}$/.test(v);
type Govde = Partial<Omit<Ajan, "yayin" | "onay" | "bellek" | "koruma" | "devir" | "yonlendirme" | "konular" | "kalite">> & {
  yonlendirme?: Partial<Ajan["yonlendirme"]>; konular?: Partial<Ajan["konular"]>; kalite?: Partial<Ajan["kalite"]>;
  yayin?: Partial<Omit<Ajan["yayin"], "kutu" | "kanallar" | "tema">> & { kutu?: Partial<KutuAyar>; kanallar?: Partial<Ajan["yayin"]["kanallar"]>; tema?: Partial<Ajan["yayin"]["tema"]> };
  onay?: Partial<OnayPolitika>; bellek?: Partial<Ajan["bellek"]>; koruma?: Partial<Koruma>; devir?: Partial<Devir>;
};

/** Gönderilen alanları doğrulayıp taze ajana uygular; hata metni döndürürse hiçbir şey yazılmaz. */
function uygula(a: Ajan, g: Govde): string | void {
  if (g.ad !== undefined) a.ad = yazi(g.ad, 60)?.trim() || "Adsız ajan";
  if (g.aciklama !== undefined) a.aciklama = yazi(g.aciklama, 300) ?? a.aciklama;
  if (g.talimat !== undefined) a.talimat = yazi(g.talimat, 32000) ?? a.talimat;
  if (g.karsilama !== undefined) a.karsilama = yazi(g.karsilama, 300) ?? a.karsilama;
  if (typeof g.simge === "string") { if (!SIMGE.test(g.simge) || g.simge.length > 500_000) return "Simge geçersiz ya da çok büyük."; a.simge = g.simge; }
  if (typeof g.model === "string") a.model = modelBul(g.model).id;
  if (typeof g.yedekModel === "string") a.yedekModel = g.yedekModel ? modelBul(g.yedekModel).id : undefined;
  if (a.yedekModel === a.model) a.yedekModel = undefined;
  if (g.efor && ["low", "medium", "high"].includes(g.efor)) a.efor = g.efor;
  if (g.araclar && typeof g.araclar === "object") {
    const yeni: Record<string, AracIzni> = {};
    for (const t of ARAC_KATALOG) {
      const v = (g.araclar as Record<string, unknown>)[t.id];
      if (typeof v === "string" && IZINLER.includes(v as AracIzni) && v !== "kapali") yeni[t.id] = !t.onaylanabilir && v === "sor" ? "her-zaman" : (v as AracIzni);
    }
    a.araclar = yeni;
  }
  const y1 = kimlikler(g.yetenekler); if (y1) a.yetenekler = y1;
  const b1 = kimlikler(g.baglantilar); if (b1) a.baglantilar = b1;
  const e1 = kimlikler(g.ekip, 8); if (e1) a.ekip = e1.filter((x) => x !== a.id);
  if (Array.isArray(g.prosedurler)) {
    if (g.prosedurler.length > 30) return "Bir ajanda en çok 30 prosedür olabilir.";
    a.prosedurler = g.prosedurler.map((p) => ({ ...prosedurTemizle(p), guncelleme: Date.now() }));
  }
  if (typeof g.isletmeProje === "string") a.isletmeProje = /^[A-Za-z0-9_-]{4,64}$/.test(g.isletmeProje) ? g.isletmeProje : undefined;
  if (Array.isArray(g.baslangiclar)) a.baslangiclar = g.baslangiclar.filter((x): x is string => typeof x === "string" && !!x.trim()).slice(0, 4).map((x) => x.slice(0, 120));
  if (g.bellek && typeof g.bellek === "object") {
    if (typeof g.bellek.acik === "boolean") a.bellek.acik = g.bellek.acik;
    if (typeof g.bellek.ziyaretci === "boolean") a.bellek.ziyaretci = g.bellek.ziyaretci;
  }
  if (g.koruma && typeof g.koruma === "object") {
    const k = g.koruma;
    if (typeof k.kisisel === "boolean") a.koruma.kisisel = k.kisisel;
    if (typeof k.enjeksiyon === "boolean") a.koruma.enjeksiyon = k.enjeksiyon;
    if (Array.isArray(k.yasakKonular)) a.koruma.yasakKonular = [...new Set(k.yasakKonular.filter((x): x is string => typeof x === "string").map((x) => x.trim().slice(0, 60)).filter(Boolean))].slice(0, 30);
    if (typeof k.yasakYanit === "string") a.koruma.yasakYanit = k.yasakYanit.slice(0, 300);
  }
  if (g.devir && typeof g.devir === "object") {
    if (typeof g.devir.acik === "boolean") a.devir.acik = g.devir.acik;
    if (typeof g.devir.kurallar === "string") a.devir.kurallar = g.devir.kurallar.slice(0, 2000);
    if (typeof g.devir.mesaj === "string") a.devir.mesaj = g.devir.mesaj.slice(0, 300);
    const m = g.devir.mesai;
    if (m && typeof m === "object") {
      const s = a.devir.mesai!;
      const SAAT = /^([01]\d|2[0-3]):[0-5]\d$/;
      if (typeof m.acik === "boolean") s.acik = m.acik;
      if (Array.isArray(m.gunler)) s.gunler = [...new Set(m.gunler.filter((x): x is number => Number.isInteger(x) && x >= 0 && x <= 6))].sort();
      if (typeof m.bas === "string" && SAAT.test(m.bas)) s.bas = m.bas;
      if (typeof m.bit === "string" && SAAT.test(m.bit)) s.bit = m.bit;
      if (typeof m.disari === "string") s.disari = m.disari.slice(0, 300);
    }
  }
  if (g.yonlendirme && typeof g.yonlendirme === "object") {
    const y = g.yonlendirme;
    if (typeof y.acik === "boolean") a.yonlendirme.acik = y.acik;
    if (typeof y.geriDonus === "boolean") a.yonlendirme.geriDonus = y.geriDonus;
    if (Array.isArray(y.uzmanlar)) a.yonlendirme.uzmanlar = y.uzmanlar.filter((u) => u && typeof u.id === "string" && KIM.test(u.id) && u.id !== a.id).slice(0, 8).map((u) => ({ id: u.id, ne: String(u.ne ?? "").slice(0, 400) }));
  }
  if (g.konular && typeof g.konular === "object") {
    if (typeof g.konular.otomatik === "boolean") a.konular.otomatik = g.konular.otomatik;
    if (Array.isArray(g.konular.etiketler)) {
      const gor = new Set<string>();
      a.konular.etiketler = g.konular.etiketler.filter((e) => e && typeof e.ad === "string").map((e) => ({ ad: e.ad.trim().slice(0, 40), ...(typeof e.tarif === "string" && e.tarif.trim() ? { tarif: e.tarif.trim().slice(0, 200) } : {}) })).filter((e) => e.ad && !gor.has(e.ad.toLocaleLowerCase("tr")) && gor.add(e.ad.toLocaleLowerCase("tr"))).slice(0, 30);
    }
  }
  if (g.kalite && Array.isArray(g.kalite.kurallar)) a.kalite.kurallar = g.kalite.kurallar.filter((x): x is string => typeof x === "string").map((x) => x.trim().slice(0, 300)).filter(Boolean).slice(0, 12);
  if (g.onay && typeof g.onay === "object") {
    const o = g.onay;
    if (typeof o.otomatikTavan === "number") a.onay.otomatikTavan = Math.max(0, Math.min(10000, Math.round(o.otomatikTavan)));
    if (typeof o.tetikTavan === "number") a.onay.tetikTavan = Math.max(0, Math.min(5000, Math.round(o.tetikTavan)));
    if (Array.isArray(o.birDahaSorma)) a.onay.birDahaSorma = o.birDahaSorma.filter((x): x is string => typeof x === "string" && /^[A-Za-z0-9_-]{1,80}$/.test(x)).slice(0, 100);
    if (o.baglantiIzin && typeof o.baglantiIzin === "object") {
      const y: Record<string, "baglanti" | "yazmada" | "hep"> = {};
      for (const [k, v] of Object.entries(o.baglantiIzin)) if (KIM.test(k) && (v === "yazmada" || v === "hep")) y[k] = v;
      a.onay.baglantiIzin = y;
    }
  }
  if (g.yayin && typeof g.yayin === "object") {
    const y = g.yayin;
    if (y.kanallar) { const k = y.kanallar; a.yayin.kanallar = { sayfa: k.sayfa ?? a.yayin.kanallar.sayfa, widget: k.widget ?? a.yayin.kanallar.widget, api: k.api ?? a.yayin.kanallar.api, telegram: k.telegram ?? a.yayin.kanallar.telegram, whatsapp: k.whatsapp ?? a.yayin.kanallar.whatsapp, slack: k.slack ?? a.yayin.kanallar.slack, eposta: k.eposta ?? a.yayin.kanallar.eposta, messenger: k.messenger ?? a.yayin.kanallar.messenger, instagram: k.instagram ?? a.yayin.kanallar.instagram, telefon: k.telefon ?? a.yayin.kanallar.telefon, sms: k.sms ?? a.yayin.kanallar.sms, discord: k.discord ?? a.yayin.kanallar.discord, teams: k.teams ?? a.yayin.kanallar.teams, line: k.line ?? a.yayin.kanallar.line, site: k.site ?? a.yayin.kanallar.site }; }
    if (Array.isArray(y.alanlar)) a.yayin.alanlar = y.alanlar.map((x) => String(x).trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "")).filter((x) => ALAN.test(x) || x === "localhost").slice(0, 20);
    if (y.tema) a.yayin.tema = { vurgu: typeof y.tema.vurgu === "string" && RENK.test(y.tema.vurgu) ? y.tema.vurgu : a.yayin.tema.vurgu, koyu: typeof y.tema.koyu === "boolean" ? y.tema.koyu : a.yayin.tema.koyu };
    if (typeof y.gunlukTavan === "number") a.yayin.gunlukTavan = Math.max(10, Math.min(5000, Math.round(y.gunlukTavan)));
    if (y.kutu && typeof y.kutu === "object") {
      const k = y.kutu, m = a.yayin.kutu;
      if (k.font && ["sistem", "inter", "serif", "yuvarlak", "ozel"].includes(k.font)) m.font = k.font;
      if (typeof k.ozelFont === "string") m.ozelFont = k.ozelFont.replace(/[^\p{L}\p{N} ]/gu, "").slice(0, 40);
      if (k.konum === "sag" || k.konum === "sol") m.konum = k.konum;
      if (typeof k.bosluk === "number") m.bosluk = Math.max(0, Math.min(80, Math.round(k.bosluk)));
      if (k.baslatici && typeof k.baslatici === "object") {
        const b = k.baslatici;
        if (b.tur && ["simge", "etiket", "gorsel"].includes(b.tur)) m.baslatici.tur = b.tur;
        if (typeof b.etiket === "string") m.baslatici.etiket = b.etiket.slice(0, 30);
        if (typeof b.gorsel === "string") { if (b.gorsel && (!SIMGE.test(b.gorsel) || b.gorsel.length > 300_000)) return "Başlatıcı görseli geçersiz ya da çok büyük."; m.baslatici.gorsel = b.gorsel || undefined; }
      }
      if (typeof k.baslik === "string") m.baslik = k.baslik.slice(0, 60);
      if (k.proaktif && typeof k.proaktif === "object") {
        if (typeof k.proaktif.acik === "boolean") m.proaktif.acik = k.proaktif.acik;
        if (typeof k.proaktif.metin === "string") m.proaktif.metin = k.proaktif.metin.slice(0, 160);
        if (typeof k.proaktif.gecikme === "number") m.proaktif.gecikme = Math.max(0, Math.min(120, Math.round(k.proaktif.gecikme)));
      }
      if (k.form && typeof k.form === "object") {
        if (typeof k.form.acik === "boolean") m.form.acik = k.form.acik;
        if (typeof k.form.baslik === "string") m.form.baslik = k.form.baslik.slice(0, 100);
        if (Array.isArray(k.form.alanlar)) m.form.alanlar = (["ad", "eposta", "telefon"] as const).filter((x) => k.form!.alanlar!.includes(x));
      }
      if (typeof k.aciklama === "string") m.aciklama = k.aciklama.slice(0, 200);
      if (typeof k.gizlilik === "string") { const u = k.gizlilik.trim(); if (u && !adresMi(u)) return "Gizlilik bağlantısı https:// ile başlayan bir adres olmalı."; m.gizlilik = u; }
      if (typeof k.oneriler === "boolean") m.oneriler = k.oneriler;
      if (k.dosya && typeof k.dosya === "object") m.dosya = kutuDosyaTemizle({ ...(m.dosya ?? {}), ...k.dosya });
      if (typeof k.ses === "boolean") m.ses = k.ses;
      if (typeof k.csat === "boolean") m.csat = k.csat;
      if (typeof k.begeni === "boolean") m.begeni = k.begeni;
      if (Array.isArray(k.kurallar)) m.kurallar = k.kurallar.filter((x) => x && typeof x.yol === "string" && typeof x.metin === "string").map((x) => ({ yol: (x.yol.trim().startsWith("/") ? x.yol.trim() : `/${x.yol.trim()}`).slice(0, 120), metin: x.metin.slice(0, 160) })).filter((x) => x.metin.trim()).slice(0, 12);
    }
  }
}

/** Taslağı günceller (yalnız gönderilen alanlar; hepsi doğrulanır). */
export async function PATCH(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  let g: Govde;
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const pm = Array.isArray(g.prosedurler) ? g.prosedurler.flatMap((p) => [p?.ad, p?.ne, ...(Array.isArray(p?.adimlar) ? p.adimlar.flatMap((x) => [x?.metin, x?.talimat, ...(Array.isArray(x?.alanlar) ? x.alanlar.map((f) => f?.soru) : [])]) : [])]) : [];
  const metinler = [...pm, g.ad, g.aciklama, g.talimat, g.karsilama, g.devir?.kurallar, g.devir?.mesaj, g.devir?.mesai?.disari, ...(g.yonlendirme?.uzmanlar ?? []).map((u) => u?.ne), ...(Array.isArray(g.baslangiclar) ? g.baslangiclar : [])].filter((x): x is string => typeof x === "string").join("\n");
  if (metinler) { const d = icerikDenetle(metinler); if (!d.izin) return hata(d.mesaj, 422); }
  const r = await ajanGuncelle((await params).id, sahip, (a) => uygula(a, g));
  if (!r) return yok();
  if (!r.ajan) return hata(r.hata);
  return Response.json({ ok: true, ajan: istemciAjan(r.ajan), degisiklik: taslakFarkli(r.ajan) });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const a = await ajanGetir(id, sahip);
  if (!a) return yok();
  if (a.testSohbet) await sohbetSil(a.testSohbet, sahip).catch(() => {});
  await ajanSil(id, sahip);
  await calismalariSil(id).catch(() => {});
  await ajanKonusmalariniSil(id).catch(() => {});
  await testleriSil(id).catch(() => {});
  return Response.json({ ok: true });
}
