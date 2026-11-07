import "server-only";
import type { IysSatir } from "./buyumeKanalTipler";

/**
 * İYS (İleti Yönetim Sistemi) entegrasyonu. 6563 sayılı Kanun ve Ticari İletişim ve Ticari Elektronik İletiler Hakkında
 * Yönetmelik gereği hizmet sağlayıcılar onaylarını İYS'ye aktarır; İYS'de kaydı olmayan alıcıya ticari ileti gönderilemez
 * ve İYS'ye yapılan retler 3 iş günü içinde uygulanır.
 * Entegratör ya da hizmet sağlayıcı API bilgileri (IYS_KULLANICI, IYS_SIFRE, IYS_KOD, IYS_MARKA_KODU) tanımlı değilse
 * yalnız İYS biçiminde dosya hazırlanır; "aktarıldı" denmez. Tanımlıysa onaylar İYS API'sinin toplu izin ucuna 500'lük
 * paketlerle gönderilir ve İYS'nin döndürdüğü istek kimliği saklanır.
 */
export const iysAdres = () => (process.env.IYS_API_ADRES || "https://api.iys.org.tr").replace(/\/$/, "");
export function iysDurumu() {
  const l = ["IYS_KULLANICI", "IYS_SIFRE", "IYS_KOD", "IYS_MARKA_KODU"];
  const eksik = l.filter((x) => !process.env[x]);
  return { anahtar: !eksik.length, eksik, iysKodu: process.env.IYS_KOD ?? "", markaKodu: process.env.IYS_MARKA_KODU ?? "", adres: iysAdres() };
}

async function belirtec(): Promise<string> {
  const r = await fetch(`${iysAdres()}/oauth2/token`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: process.env.IYS_KULLANICI, password: process.env.IYS_SIFRE, grant_type: "password" }), signal: AbortSignal.timeout(20_000) });
  const t = await r.text();
  if (!r.ok) throw new Error(`İYS oturumu açılamadı (${r.status}): ${t.slice(0, 200)}`);
  const j = JSON.parse(t) as { access_token?: string };
  if (!j.access_token) throw new Error("İYS oturum yanıtında belirteç yok.");
  return j.access_token;
}

/** Onayları ve retleri İYS'ye gönderir. Dönen: gönderilen satır sayısı ve İYS istek kimlikleri. */
export async function iysGonder(satirlar: IysSatir[]): Promise<{ adet: number; istekler: string[]; yanit: string }> {
  const d = iysDurumu();
  if (!d.anahtar) throw new Error(`İYS API bilgileri tanımlı değil: ${d.eksik.join(", ")}.`);
  if (!satirlar.length) return { adet: 0, istekler: [], yanit: "Aktarılacak kayıt yok." };
  const tok = await belirtec();
  const istekler: string[] = [];
  let yanit = "";
  for (let i = 0; i < satirlar.length; i += 500) {
    const paket = satirlar.slice(i, i + 500);
    const r = await fetch(`${iysAdres()}/sps/${encodeURIComponent(d.iysKodu)}/brands/${encodeURIComponent(d.markaKodu)}/consents/request`, { method: "POST", headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" }, body: JSON.stringify(paket), signal: AbortSignal.timeout(30_000) });
    const t = await r.text();
    if (!r.ok) throw new Error(`İYS ${r.status}: ${t.slice(0, 240)}${i ? ` (${i} kayıt gönderildikten sonra)` : ""}`);
    try { const j = JSON.parse(t) as { requestId?: string; transactionId?: string }; const k = j.requestId ?? j.transactionId; if (k) istekler.push(k); } catch { /* düz yanıt */ }
    yanit = t.slice(0, 300);
  }
  return { adet: satirlar.length, istekler, yanit };
}

/** Toplu istek sonucunu sorgular. */
export async function iysIstekDurumu(istek: string): Promise<string> {
  const d = iysDurumu();
  if (!d.anahtar) throw new Error("İYS API bilgileri tanımlı değil.");
  const tok = await belirtec();
  const r = await fetch(`${iysAdres()}/sps/${encodeURIComponent(d.iysKodu)}/brands/${encodeURIComponent(d.markaKodu)}/consents/request/${encodeURIComponent(istek)}`, { headers: { Authorization: `Bearer ${tok}` }, signal: AbortSignal.timeout(20_000) });
  const t = await r.text();
  if (!r.ok) throw new Error(`İYS ${r.status}: ${t.slice(0, 240)}`);
  return t.slice(0, 2000);
}
