import "server-only";
import { bulutAyarDegistir, bulutAyarOku, type EpostaAlan, type EpostaAlanKaydi } from "./bulutAyar";

/**
 * Sitenin kendi alan adından e-posta (sipariş, randevu, üyelik e-postaları "bilgi@kahvem.com" adresinden gider).
 * Resend Domains API: alan adı eklenir, Resend'in verdiği SPF (MX + TXT) ve DKIM (TXT) kayıtları DNS'e girilir,
 * "Doğrula" ile Resend kayıtları kontrol eder. Doğrulanınca bu projenin e-postaları (epostaGonder projeId ile
 * çağrılınca) bu adresten gönderilir; doğrulanmadıysa ortak gönderen kullanılır. RESEND_API_KEY yoksa hiçbir işlem
 * yapılmaz ve arayüz bunu açıkça söyler.
 */
export class EpostaAlanHatasi extends Error {}
const anahtar = () => process.env.RESEND_API_KEY;
type ResendAlan = { id: string; name: string; status: string; records?: EpostaAlanKaydi[]; message?: string; name_?: string };

async function resend(yol: string, method = "GET", govde?: unknown): Promise<ResendAlan> {
  const a = anahtar();
  if (!a) throw new EpostaAlanHatasi("E-posta servisi kurulu değil (RESEND_API_KEY yok); alan adı doğrulanamaz.");
  const r = await fetch(`https://api.resend.com${yol}`, { method, headers: { Authorization: `Bearer ${a}`, "Content-Type": "application/json" }, body: govde ? JSON.stringify(govde) : undefined, signal: AbortSignal.timeout(15_000) });
  const j = await r.json().catch(() => ({})) as ResendAlan & { message?: string };
  if (!r.ok) throw new EpostaAlanHatasi(`Resend: ${j.message ?? `istek başarısız (${r.status})`}`);
  return j;
}

export async function epostaAlanEkle(projeId: string, g: { alan: string; yerel?: string; ad?: string }): Promise<EpostaAlan> {
  const alan = g.alan.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!/^(?=.{3,253}$)(?!-)([a-z0-9-]{1,63}\.)+[a-z]{2,63}$/.test(alan)) throw new EpostaAlanHatasi("Geçerli bir alan adı yaz (kahvem.com ya da posta.kahvem.com).");
  const yerel = (g.yerel ?? "bilgi").trim().toLowerCase();
  if (!/^[a-z0-9._-]{1,40}$/.test(yerel)) throw new EpostaAlanHatasi("Gönderen adının @ öncesi yalnız harf, rakam, nokta, tire içerebilir.");
  const mevcut = (await bulutAyarOku(projeId)).epostaAlan;
  if (mevcut?.resendId) await resend(`/domains/${mevcut.resendId}`, "DELETE").catch(() => {});
  const r = await resend("/domains", "POST", { name: alan });
  const x: EpostaAlan = { alan, resendId: r.id, durum: r.status ?? "not_started", kayitlar: r.records ?? [], gonderen: `${yerel}@${alan}`, ad: g.ad?.trim().slice(0, 60) || undefined, sonKontrol: Date.now(), eklenme: Date.now() };
  await bulutAyarDegistir(projeId, (a) => { a.epostaAlan = x; });
  return x;
}

/** Resend'den doğrulamayı başlatır ve güncel durumu ve kayıtları okur. */
export async function epostaAlanDenetle(projeId: string): Promise<EpostaAlan> {
  const e = (await bulutAyarOku(projeId)).epostaAlan;
  if (!e) throw new EpostaAlanHatasi("Önce alan adı ekle.");
  await resend(`/domains/${e.resendId}/verify`, "POST").catch(() => {});
  const r = await resend(`/domains/${e.resendId}`);
  const x: EpostaAlan = { ...e, durum: r.status ?? e.durum, kayitlar: r.records ?? e.kayitlar, sonKontrol: Date.now() };
  await bulutAyarDegistir(projeId, (a) => { a.epostaAlan = x; });
  return x;
}

export async function epostaAlanKaldir(projeId: string) {
  const e = (await bulutAyarOku(projeId)).epostaAlan;
  if (e?.resendId && anahtar()) await resend(`/domains/${e.resendId}`, "DELETE").catch(() => {});
  await bulutAyarDegistir(projeId, (a) => { a.epostaAlan = null; });
}

/** Gönderen adresi (yalnız Resend'de doğrulanmışsa): "Kahvem <bilgi@kahvem.com>". */
export async function projeGondereni(projeId: string, ad?: string): Promise<string | null> {
  const e = (await bulutAyarOku(projeId)).epostaAlan;
  if (!e || e.durum !== "verified") return null;
  const gorunen = (e.ad || ad || "").replace(/[<>"\r\n]/g, "").slice(0, 60);
  return gorunen ? `${gorunen} <${e.gonderen}>` : e.gonderen;
}
