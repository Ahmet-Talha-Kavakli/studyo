import { AD, skillMd, yetenekGuncelle, yetenekKaydi, yetenekSil, type Yetenek } from "@/lib/build/yetenekDepo";
import { baglantilariListele } from "@/lib/build/baglantiDepo";
import { katalogBul } from "@/lib/build/baglantiKatalog";
import { sohbetSil } from "@/lib/build/sohbetDepo";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { icerikDenetle } from "@/lib/moderasyon";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const yok = () => hata("Yetenek bulunamadı.", 404);

/** Gereken bağlantıların durumu: bağlı ve sağlıklı, bağlı ama sorunlu, ya da eksik. */
async function bagimliliklar(y: Yetenek, sahip: string) {
  if (!y.gerekenBaglantilar?.length) return [];
  const l = await baglantilariListele(sahip);
  return y.gerekenBaglantilar.map((g) => {
    const url = g.startsWith("url:") ? g.slice(4) : undefined;
    const k = url ? undefined : katalogBul(g);
    const b = l.find((x) => (url ? x.url === url : x.katalogId === g));
    return { id: g, ad: k?.ad ?? url ?? g, logo: k?.logo, logoAcik: k?.logoAcik, logoGenis: k?.logoGenis, durum: !b ? "eksik" : b.durum === "etkin" ? "bagli" : "sorunlu", baglantiId: b?.id };
  });
}

/** Yetenek (ham kayıt) + SKILL.md metni + gereken bağlantıların durumu. */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const y = await yetenekKaydi((await params).id, sahip);
  if (!y) return yok();
  return Response.json({ ok: true, yetenek: y, skillMd: skillMd(y), bagimliliklar: await bagimliliklar(y, sahip) });
}

const SIMGE = /^(\/gercek\/[\w/.-]+\.(webp|png|jpg)|data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+)$/;
const YOL = /^[\w.-]+(\/[\w.-]+)*$/;
const BAG = /^([a-z0-9-]{2,40}|url:https:\/\/[^\s]{4,300})$/;
type Yama = Partial<Yetenek> & { geri?: number; sabitSurum?: number | null; surumKaydet?: string };

/**
 * Alanları günceller. { geri: no } eski sürümü taslağa geri yükler; { sabitSurum: no | null } sürümü sabitler ya da
 * sabitlemeyi kaldırır; { surumKaydet: "not" } taslağı notlu yeni sürüm olarak kaydeder. Kritik güvenlik bulgusu
 * olan yetenek "her sohbette" açılamaz.
 */
export async function PATCH(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  let g: Yama;
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const metin = [g.baslik, g.aciklama, g.govde].filter((x): x is string => typeof x === "string").join("\n").slice(0, 30000);
  if (metin) { const d = icerikDenetle(metin); if (!d.izin) return hata(d.mesaj, 422); }
  const r = await yetenekGuncelle((await params).id, sahip, (y) => {
    if (typeof g.geri === "number") {
      const s = y.surumler.find((x) => x.no === g.geri);
      if (!s) return "Sürüm bulunamadı.";
      y.govde = s.govde; y.aciklama = s.aciklama; if (s.dosyalar) y.dosyalar = s.dosyalar.map((d) => ({ ...d }));
      return;
    }
    if (g.sabitSurum === null) y.sabitSurum = undefined;
    else if (typeof g.sabitSurum === "number") { if (!y.surumler.some((s) => s.no === g.sabitSurum)) return "Sürüm bulunamadı."; y.sabitSurum = g.sabitSurum; }
    if (typeof g.baslik === "string") y.baslik = g.baslik.trim().slice(0, 80) || "Adsız yetenek";
    if (typeof g.ad === "string") { const a = g.ad.trim().toLowerCase(); if (!AD.test(a) || a.length > 64) return "Ad yalnız küçük harf, rakam ve tire içerebilir."; y.ad = a; }
    if (typeof g.aciklama === "string") y.aciklama = g.aciklama.slice(0, 1024);
    if (typeof g.govde === "string") y.govde = g.govde.slice(0, 80_000);
    if (typeof g.herSohbette === "boolean") { if (g.herSohbette && y.tarama?.sonuc === "kritik") return "Güvenlik taramasında kritik bulgu var; düzeltmeden açılamaz."; y.herSohbette = g.herSohbette; }
    if (g.cagri && ["model", "elle", "her-zaman"].includes(g.cagri)) y.cagri = g.cagri;
    if (Array.isArray(g.gerekenBaglantilar)) y.gerekenBaglantilar = [...new Set(g.gerekenBaglantilar.filter((x): x is string => typeof x === "string" && BAG.test(x)))].slice(0, 10);
    if (Array.isArray(g.tetikTestleri)) y.tetikTestleri = g.tetikTestleri.filter((x) => x && typeof x.sorgu === "string" && x.sorgu.trim()).slice(0, 20).map((x) => ({ sorgu: x.sorgu.trim().slice(0, 300), beklenen: !!x.beklenen }));
    if (typeof g.simge === "string") { if (!SIMGE.test(g.simge) || g.simge.length > 500_000) return "Simge geçersiz."; y.simge = g.simge; }
    if (Array.isArray(g.betikAg)) y.betikAg = [...new Set(g.betikAg.filter((x): x is string => typeof x === "string").map((x) => x.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "")).filter((x) => /^(\*\.)?[a-z0-9.-]+\.[a-z]{2,}$/.test(x)))].slice(0, 20);
    if (Array.isArray(g.ornekler)) y.ornekler = g.ornekler.filter((x): x is string => typeof x === "string").slice(0, 8).map((x) => x.slice(0, 200));
    if (Array.isArray(g.dosyalar)) {
      const l = g.dosyalar.filter((d) => d && typeof d.yol === "string" && typeof d.icerik === "string" && YOL.test(d.yol) && !d.yol.split("/").includes("..")).slice(0, 40);
      if (l.reduce((t, d) => t + d.icerik.length, 0) > 2_000_000) return "Dosyalar toplamı 2 milyon karakteri aşamaz.";
      y.dosyalar = l.map((d) => ({ yol: d.yol.slice(0, 160), icerik: d.icerik }));
    }
  }, typeof g.surumKaydet === "string" ? { surumNotu: g.surumKaydet.trim().slice(0, 200) } : {});
  if (!r) return yok();
  if (!r.yetenek) return hata(r.hata);
  // Taramada kritik bulgu çıktıysa "her sohbette" kapatılır.
  const son = r.yetenek.tarama?.sonuc === "kritik" && r.yetenek.herSohbette ? (await yetenekGuncelle(r.yetenek.id, sahip, (y) => { y.herSohbette = false; }))?.yetenek ?? r.yetenek : r.yetenek;
  return Response.json({ ok: true, yetenek: son, skillMd: skillMd(son), bagimliliklar: await bagimliliklar(son, sahip) });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const y = await yetenekKaydi(id, sahip);
  if (!y) return yok();
  if (y.testSohbet) await sohbetSil(y.testSohbet, sahip).catch(() => {});
  await yetenekSil(id, sahip);
  return Response.json({ ok: true });
}
