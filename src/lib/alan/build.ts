import "server-only";
import path from "path";
import { HESAP_KOK, jsonOku } from "@/lib/hesap/depo";
import { buildAnahtarHesabi } from "@/lib/hesap/build";
import { alanGuncelle, alanOku, gunlukEkle, projeAlani, projeAlaniYaz, uyeAlanlari, uyeBul, kisiAdi } from "./depo";
import { etkinAlanSunucu } from "./etkin";
import { ROL_SIRA } from "./tipler";

/**
 * Vayra Build ile alan bağı. Build'in proje ekibi (sahip, düzenleyici, izleyici) aynen kalır; üstüne alan düzeyi eklenir:
 * alana bağlı bir projeyi alanın sahip, yönetici ve üyeleri düzenleyici, izleyicileri izleyici olarak görür.
 * Proje sahipliği değişmez (Build'de sahiplik hiç değişmez). Sahip özeti → hesap eşlemesi buildKredi'nin build-oz dizinidir.
 */
const ozDosyasi = (oz: string) => path.join(HESAP_KOK, "build-oz", `${oz.replace(/[^a-f0-9]/g, "").slice(0, 40)}.json`);
const ozHesabi = async (oz: string) => (/^[a-f0-9]{40}$/.test(oz) ? (await jsonOku<{ uid: string }>(ozDosyasi(oz)))?.uid ?? null : null);

/** Ekip rolü yoksa alan üzerinden erişim (ekipDepo.ekipRolu çağırır). */
export async function alanProjeRolu(projeId: string, oz: string): Promise<"duzenleyici" | "izleyici" | null> {
  try {
    const id = await projeAlani(projeId);
    if (!id) return null;
    const uid = await ozHesabi(oz);
    if (!uid) return null;
    const a = await alanOku(id);
    const u = a && uyeBul(a, uid);
    if (!a || !u || !a.projeler.some((p) => p.id === projeId)) return null;
    return u.rol === "izleyici" ? "izleyici" : "duzenleyici";
  } catch { return null; }
}

/** Hesabın üye olduğu alanlardaki projeler (Build proje listesinde "paylaşılan" olarak görünür). */
export async function alanProjeleriListe(oz: string): Promise<{ id: string; rol: "duzenleyici" | "izleyici"; alanAd: string }[]> {
  try {
    const uid = await ozHesabi(oz);
    if (!uid) return [];
    const l: { id: string; rol: "duzenleyici" | "izleyici"; alanAd: string }[] = [];
    for (const id of await uyeAlanlari(uid)) {
      const a = await alanOku(id);
      const u = a && uyeBul(a, uid);
      if (!a || !u) continue;
      for (const p of a.projeler) l.push({ id: p.id, rol: u.rol === "izleyici" ? "izleyici" : "duzenleyici", alanAd: a.ad });
    }
    return l;
  } catch { return []; }
}

const projeAdi = async (pid: string) => (await import("@/lib/build/depo").then((m) => m.projeOkuHam(pid)).catch(() => null))?.ad ?? pid;

export async function projeyiAlanaBagla(pid: string, alanId: string, uid: string, ad: string) {
  const once = await projeAlani(pid);
  if (once && once !== alanId) throw new Error("Bu proje başka bir çalışma alanına bağlı.");
  await alanGuncelle(alanId, (a) => { if (!a.projeler.some((p) => p.id === pid)) a.projeler.unshift({ id: pid, ekleyen: uid, eklenme: Date.now() }); });
  await projeAlaniYaz(pid, alanId);
  await gunlukEkle(alanId, "proje", { uid, ad }, `"${await projeAdi(pid)}" Build projesi alana eklendi`);
}

export async function projeyiAlandanCikar(pid: string, alanId: string, uid: string, ad: string) {
  await alanGuncelle(alanId, (a) => { a.projeler = a.projeler.filter((p) => p.id !== pid); });
  if ((await projeAlani(pid)) === alanId) await projeAlaniYaz(pid, null);
  await gunlukEkle(alanId, "proje", { uid, ad }, `"${await projeAdi(pid)}" Build projesi alandan çıkarıldı`);
}

/** Yeni Build projesi: sahibi bir alanda çalışıyorsa (üye ve üstü, alan ayarı açık) proje o alana bağlanır. Hata fırlatmaz. */
export async function yeniProjeyiAlanaBagla(pid: string, sahipAnahtari: string) {
  try {
    const uid = buildAnahtarHesabi(sahipAnahtari);
    if (!uid) return;
    const e = await etkinAlanSunucu(uid);
    if (!e || ROL_SIRA[e.uye.rol] < ROL_SIRA.uye || !e.alan.ayar.yeniProjeAlana) return;
    await projeyiAlanaBagla(pid, e.alan.id, uid, (await kisiAdi(uid))?.ad ?? "Üye");
  } catch (e) { console.error("[alan] proje alana bağlanamadı:", (e as Error).message); }
}
