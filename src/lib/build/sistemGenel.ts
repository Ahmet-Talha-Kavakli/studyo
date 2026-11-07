import "server-only";
import { randomBytes, timingSafeEqual } from "crypto";
import { mkdir, readdir, readFile, rename, rm, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { anahtarBul, canliAkis, kilitle, sistemGuncelleOz, sistemHam, yeniKimlik, type Calisma, type Sistem } from "./sistemDepo";
import { girdiDogrula, type GirdiAlani, type Tetikleyici } from "./sistemKatalog";
import { calismaSonucu, sistemBaslat, yanitBekle } from "./sistemMotoru";
import { sablonDoldur } from "./sistemSablon";

/**
 * Herkese açık sistem yüzleri: form sayfası (/s/f/<anahtar>) ve sohbet (/s/c/<anahtar>, gömülü kutu). Canlıda sistem
 * açık olmalı ve yayındaki sürüm çalışır; ?test=<test anahtarı> ile taslak deneme olarak çalışır ve gelen veri deneme
 * verisi olur. Yanıt: Yanıt ver adımı çalışınca hemen, yoksa çalışma bitince son adımın çıktısı.
 */
type Bulunan = { s: Sistem; sahipOz: string };
export const ANAHTAR_DESENI = /^[a-z0-9]{12,24}$/;
export const yeniGenelAnahtar = () => randomBytes(12).toString("base64url").toLowerCase().replace(/[^a-z0-9]/g, "").padEnd(16, "0").slice(0, 16);

async function bul(tur: "form" | "sohbet", anahtar: string): Promise<Bulunan | null> {
  if (!ANAHTAR_DESENI.test(anahtar)) return null;
  const id = await anahtarBul(`${tur}:${anahtar}`);
  const h = id ? await sistemHam(id) : null;
  const k = tur === "form" ? h?.s.formAnahtari : h?.s.sohbetAnahtari;
  if (!h || !k) return null;
  const a = Buffer.from(k), b = Buffer.from(anahtar);
  return a.length === b.length && timingSafeEqual(a, b) ? h : null;
}
export const formBul = (a: string) => bul("form", a);
export const sohbetBul = (a: string) => bul("sohbet", a);
export function testMi(h: Bulunan, test: string | null | undefined): boolean {
  if (!test || !h.s.testAnahtari) return false;
  const a = Buffer.from(h.s.testAnahtari), b = Buffer.from(test);
  return a.length === b.length && timingSafeEqual(a, b);
}
/** Canlıda yayındaki tetik, denemede taslaktaki. */
function tetikBul<T extends Tetikleyici["tur"]>(s: Sistem, tur: T, test: boolean): Extract<Tetikleyici, { tur: T }> | undefined {
  const l = test ? s.tetikler : s.durum === "acik" ? canliAkis(s).tetikler : [];
  return l.find((t) => t.tur === tur) as Extract<Tetikleyici, { tur: T }> | undefined;
}

/* ───────────── Form sayfası ───────────── */
export type FormTanimi = { sistem: string; baslik: string; aciklama: string; dugme: string; alanlar: GirdiAlani[]; acik: boolean; test: boolean; tekrar: boolean; bitis: string };
export function formTanimi(h: Bulunan, test: boolean): FormTanimi {
  const t = tetikBul(h.s, "formSayfasi", test) ?? (h.s.tetikler.find((x) => x.tur === "formSayfasi") as Extract<Tetikleyici, { tur: "formSayfasi" }> | undefined);
  const acik = test || (!!tetikBul(h.s, "formSayfasi", false) && !!h.s.yayin);
  return { sistem: h.s.ad, baslik: t?.baslik || h.s.ad, aciklama: t?.aciklama ?? h.s.aciklama ?? "", dugme: t?.dugme || "Gönder", alanlar: h.s.girdi ?? [], acik, test, tekrar: t?.tekrar !== false, bitis: t?.bitis ?? "mesaj" };
}
export type FormSonuc = { ok: boolean; durum: number; hata?: string; hatalar?: string[]; mesaj?: string; sonuc?: string; yonlendir?: string; calisma?: string; suruyor?: boolean };
export async function formGonder(h: Bulunan, ham: Record<string, unknown>, test: boolean, sorgu: Record<string, string>): Promise<FormSonuc> {
  const t = tetikBul(h.s, "formSayfasi", test);
  if (!t) return { ok: false, durum: 409, hata: test ? "Taslakta form sayfası tetiği yok." : "Bu form şu an yanıt almıyor." };
  if (!test && (!h.s.yayin || h.s.durum !== "acik")) return { ok: false, durum: 409, hata: "Bu form şu an yanıt almıyor." };
  const alanlar = h.s.girdi ?? [];
  // Gizli alanlar: sorgu parametresi ya da varsayılan; diğer alanlar yalnız tanımlıysa alınır.
  const girdi: Record<string, unknown> = {};
  for (const a of alanlar) girdi[a.ad] = a.tur === "gizli" ? (sorgu[a.ad] ?? ham[a.ad] ?? a.varsayilan ?? "") : ham[a.ad];
  const g = girdiDogrula(alanlar, girdi);
  if (g.hatalar.length) return { ok: false, durum: 400, hata: "Bazı alanlar eksik ya da hatalı.", hatalar: g.hatalar };
  const veri = { ...g.veri, _form: { sayfa: "form", gonderim: new Date().toISOString(), ...(Object.keys(sorgu).length ? { sorgu } : {}) } };
  if (JSON.stringify(veri).length > 60_000) return { ok: false, durum: 413, hata: "Gönderilen veri çok büyük." };
  if (test) await testOlayiYaz(h, "formSayfasi-test", veri);
  const r = await sistemBaslat(h.s.id, h.sahipOz, { tur: test ? "deneme" : "formSayfasi", veri }, { zorla: test });
  if (!r) return { ok: false, durum: 409, hata: "Bu form şu an yanıt almıyor." };
  r.bitti.catch(() => {});
  const bitis = t.bitis ?? "mesaj";
  const mesaj = sablonDoldur(t.mesaj || "Teşekkürler, yanıtın alındı.", { tetik: veri, adim: () => undefined });
  if (bitis === "yonlendir" && t.yonlendir) return { ok: true, durum: 200, yonlendir: sablonDoldur(t.yonlendir, { tetik: veri, adim: () => undefined }), calisma: r.c.id };
  if (bitis !== "sonuc") return { ok: true, durum: 200, mesaj, calisma: r.c.id };
  const y = await yanitBekle(r, 30_000);
  if (y.tur === "yanit") return { ok: true, durum: 200, mesaj, sonuc: y.yanit.metin, calisma: r.c.id };
  if (y.tur === "bitti") {
    if (y.c.durum === "basarisiz") return { ok: false, durum: 500, hata: "Gönderin alındı ama işlenirken sorun çıktı. Biraz sonra yeniden dene.", calisma: r.c.id };
    return { ok: true, durum: 200, mesaj, sonuc: calismaSonucu(y.c, h.s.ad).cikti, calisma: r.c.id };
  }
  return { ok: true, durum: 202, mesaj, suruyor: true, calisma: r.c.id };
}

async function testOlayiYaz(h: Bulunan, tur: string, veri: unknown) {
  await sistemGuncelleOz(h.s.id, h.sahipOz, (s) => {
    s.test ??= {};
    s.test.tetik = veri; s.test.sonTetik = veri;
    s.test.olaylar = [{ id: yeniKimlik(8), zaman: Date.now(), tur, veri }, ...(s.test.olaylar ?? [])].slice(0, 10);
  });
}

/* ───────────── Sohbet ───────────── */
export type SohbetMesaji = { rol: "kullanici" | "asistan"; metin: string; zaman: number; calisma?: string; hata?: boolean };
type Oturum = { oturum: string; olusturma: number; guncelleme: number; test?: boolean; mesajlar: SohbetMesaji[] };
export const OTURUM_DESENI = /^[A-Za-z0-9_-]{8,40}$/;
const KOK = path.join(DEPO_KOK, "build", "sistem-sohbet");
const oturumDosyasi = (sid: string, o: string) => path.join(KOK, sid, `${o}.json`);
async function oturumOku(sid: string, o: string): Promise<Oturum | null> { try { return JSON.parse(await readFile(oturumDosyasi(sid, o), "utf8")) as Oturum; } catch { return null; } }
async function oturumYaz(sid: string, x: Oturum) {
  const f = oturumDosyasi(sid, x.oturum);
  await mkdir(path.dirname(f), { recursive: true });
  const g = `${f}.${randomBytes(4).toString("hex")}.tmp`;
  await writeFile(g, JSON.stringify(x));
  try { await rename(g, f); } catch { await writeFile(f, JSON.stringify(x)); await rm(g, { force: true }); }
}
function oturumDegistir(sid: string, o: string, f: (x: Oturum) => void): Promise<Oturum> {
  return kilitle(`sohbet:${sid}:${o}`, async () => {
    const x = (await oturumOku(sid, o)) ?? { oturum: o, olusturma: Date.now(), guncelleme: Date.now(), mesajlar: [] };
    f(x);
    x.mesajlar = x.mesajlar.slice(-60);
    x.guncelleme = Date.now();
    await oturumYaz(sid, x);
    return x;
  });
}
export type SohbetTanimi = { sistem: string; baslik: string; altBaslik: string; karsilama: string; oneriler: string[]; yerTutucu: string; acik: boolean; test: boolean; alanAdlari: string[] };
export function sohbetTanimi(h: Bulunan, test: boolean): SohbetTanimi {
  const t = tetikBul(h.s, "sohbet", test) ?? (h.s.tetikler.find((x) => x.tur === "sohbet") as Extract<Tetikleyici, { tur: "sohbet" }> | undefined);
  const acik = test || (!!tetikBul(h.s, "sohbet", false) && !!h.s.yayin);
  return {
    sistem: h.s.ad, baslik: t?.baslik || h.s.ad, altBaslik: t?.altBaslik ?? "", karsilama: t?.karsilama ?? "Merhaba, nasıl yardımcı olabilirim?", oneriler: t?.oneriler ?? [], yerTutucu: t?.yerTutucu || "Mesajını yaz",
    acik, test, alanAdlari: (t?.alanAdlari ?? "").split(/[,\s]+/).map((x) => x.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "")).filter(Boolean),
  };
}
export async function oturumMesajlari(h: Bulunan, oturum: string): Promise<SohbetMesaji[]> {
  if (!OTURUM_DESENI.test(oturum)) return [];
  return (await oturumOku(h.s.id, oturum))?.mesajlar ?? [];
}
const yanitMetni = (c: Calisma, ad: string): { metin: string; hata?: boolean } => {
  if (c.yanit) return { metin: c.yanit.metin };
  if (c.durum === "basarisiz" || c.durum === "iptal") return { metin: "Şu an yanıt veremiyorum; biraz sonra yeniden dene.", hata: true };
  return { metin: c.durum === "durdu" ? "" : calismaSonucu(c, ad).cikti };
};
/** Yanıtı oturuma bir kez yazar (aynı çalışmanın yanıtı yinelenmez). */
async function yanitYaz(h: Bulunan, oturum: string, cid: string, y: { metin: string; hata?: boolean }) {
  if (!y.metin.trim()) return;
  await oturumDegistir(h.s.id, oturum, (x) => { if (!x.mesajlar.some((m) => m.rol === "asistan" && m.calisma === cid)) x.mesajlar.push({ rol: "asistan", metin: y.metin.slice(0, 20_000), zaman: Date.now(), calisma: cid, ...(y.hata ? { hata: true } : {}) }); });
}
export type SohbetSonuc = { ok: boolean; durum: number; hata?: string; yanit?: string; calisma?: string; bekliyor?: boolean; mesajlar?: SohbetMesaji[] };
export async function sohbetMesaj(h: Bulunan, oturum: string, mesaj: string, test: boolean, kaynak: string): Promise<SohbetSonuc> {
  const t = tetikBul(h.s, "sohbet", test);
  if (!t || (!test && (!h.s.yayin || h.s.durum !== "acik"))) return { ok: false, durum: 409, hata: "Bu sohbet şu an kapalı." };
  if (!OTURUM_DESENI.test(oturum)) return { ok: false, durum: 400, hata: "Oturum geçersiz." };
  const metin = mesaj.trim().slice(0, 4000);
  if (!metin) return { ok: false, durum: 400, hata: "Mesaj boş." };
  const once = (await oturumOku(h.s.id, oturum))?.mesajlar ?? [];
  const n = Math.max(0, Math.min(30, t.gecmis ?? 10));
  const gecmis = once.filter((m) => !m.hata).slice(-n).map((m) => ({ rol: m.rol, metin: m.metin }));
  await oturumDegistir(h.s.id, oturum, (x) => { if (test) x.test = true; x.mesajlar.push({ rol: "kullanici", metin, zaman: Date.now() }); });
  const veri = { mesaj: metin, oturum, gecmis, gecmisMetni: gecmis.map((m) => `${m.rol === "kullanici" ? "Kullanıcı" : "Asistan"}: ${m.metin}`).join("\n"), ilkMesaj: !once.some((m) => m.rol === "kullanici"), mesajSayisi: once.filter((m) => m.rol === "kullanici").length + 1, kaynak };
  if (test) await testOlayiYaz(h, "sohbet-test", veri);
  const r = await sistemBaslat(h.s.id, h.sahipOz, { tur: test ? "deneme" : "sohbet", veri }, { zorla: test });
  if (!r) return { ok: false, durum: 409, hata: "Bu sohbet şu an kapalı." };
  // Uzun süren çalışmanın yanıtı da sonradan oturuma yazılsın.
  r.bitti.then((c) => yanitYaz(h, oturum, c.id, yanitMetni(c, h.s.ad))).catch(() => {});
  const y = await yanitBekle(r, 45_000);
  if (y.tur === "zaman") return { ok: true, durum: 202, bekliyor: true, calisma: r.c.id };
  const ym = y.tur === "yanit" ? { metin: y.yanit.metin } : yanitMetni(y.c, h.s.ad);
  await yanitYaz(h, oturum, r.c.id, ym);
  return { ok: true, durum: 200, yanit: ym.metin, calisma: r.c.id };
}
/** Düzenleyicideki son konuşmalar (en yeni 30). */
export async function sohbetOturumlari(sid: string): Promise<{ oturum: string; guncelleme: number; mesaj: number; son: string; test: boolean }[]> {
  let l: string[] = [];
  try { l = (await readdir(path.join(KOK, sid))).filter((x) => x.endsWith(".json")); } catch { return []; }
  const o: { oturum: string; guncelleme: number; mesaj: number; son: string; test: boolean }[] = [];
  for (const f of l.slice(-400)) {
    const x = await oturumOku(sid, f.replace(/\.json$/, ""));
    if (x) o.push({ oturum: x.oturum, guncelleme: x.guncelleme, mesaj: x.mesajlar.length, son: (x.mesajlar.filter((m) => m.rol === "kullanici").at(-1)?.metin ?? "").slice(0, 120), test: !!x.test });
  }
  return o.sort((a, b) => b.guncelleme - a.guncelleme).slice(0, 30);
}
export async function sohbetOturumuSahip(sid: string, oturum: string): Promise<SohbetMesaji[] | null> {
  if (!OTURUM_DESENI.test(oturum)) return null;
  return (await oturumOku(sid, oturum))?.mesajlar ?? null;
}
export async function sohbetOturumuSil(sid: string, oturum: string) { if (OTURUM_DESENI.test(oturum)) await rm(oturumDosyasi(sid, oturum), { force: true }); }
