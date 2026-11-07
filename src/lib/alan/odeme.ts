import "server-only";
import { hesapOku } from "@/lib/hesap/depo";
import { ayEkle, krediEkle, planAyarla } from "@/lib/hesap/kredi";
import type { PlanKimligi } from "@/lib/hesap/tipler";
import { alanGuncelle, alanOku, gunlukEkle, uyeBul } from "./depo";
import { ROL_SIRA } from "./tipler";

/**
 * Alan için satın alma (ödeme motoru çağırır). Alan planı dönemlik ödenir: ödeme alınınca yeni dönem başlar, alan
 * defterine planın aylık kotası verilir; dönem bitince (yenilenmezse) alan kotasız Başlangıç planına döner. Kredi paketi
 * alan havuzunun süresi dolmayan kovasına eklenir. Satın almayı yalnız sahip ve yönetici başlatır; makbuz satın alanın.
 */
export async function alanSatinAlmaDenetle(alanId: string, uid: string): Promise<{ ad: string; plan: PlanKimligi; planBitis?: number }> {
  const a = await alanOku(alanId);
  const u = a && uyeBul(a, uid);
  if (!a || !u) throw Object.assign(new Error("Çalışma alanı bulunamadı ya da üyesi değilsin."), { durum: 404 });
  if (ROL_SIRA[u.rol] < ROL_SIRA.yonetici) throw Object.assign(new Error("Alan için satın almayı yalnız sahip ve yöneticiler yapabilir."), { durum: 403 });
  return { ad: a.ad, plan: a.plan, ...(a.planBitis ? { planBitis: a.planBitis } : {}) };
}

export async function alanKrediUygula(alanId: string, g: { kredi: number; no: string; ad: string; uid: string }) {
  const anahtar = `odeme:${g.no}`;
  const r = await krediEkle(alanId, g.kredi, { kaynak: anahtar, aciklama: g.ad, anahtar });
  if (!r.ok) throw new Error(`Alan kredisi eklenemedi: ${r.neden}`);
  if (!r.tekrar) await gunlukEkle(alanId, "satin", { uid: g.uid, ad: (await hesapOku(g.uid))?.profil.ad ?? "Üye" }, `${g.kredi} kredi satın alındı (sipariş ${g.no})`);
}

export async function alanPlanUygula(alanId: string, g: { plan: PlanKimligi; kota: number; donem: "aylik" | "yillik"; no: string; ad: string; uid: string }) {
  const bas = Date.now();
  let bit = bas;
  for (let i = 0; i < (g.donem === "yillik" ? 12 : 1); i++) bit = ayEkle(bit);
  const anahtar = `odeme:${g.no}`;
  const r = await planAyarla(alanId, { plan: g.plan, kota: g.kota, yeniDonem: true, planBitis: bit, otomatik: false, gecis: null, kaynak: anahtar, aciklama: `${g.ad} başladı`, anahtar });
  if (r.tekrar) return;
  await alanGuncelle(alanId, (a) => { a.plan = g.plan; a.planBitis = bit; });
  await gunlukEkle(alanId, "plan", { uid: g.uid, ad: (await hesapOku(g.uid))?.profil.ad ?? "Üye" }, `${g.ad} satın alındı; dönem sonu ${new Date(bit).toISOString().slice(0, 10)} (sipariş ${g.no})`);
}
