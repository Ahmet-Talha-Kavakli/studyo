import "server-only";
import { createHash } from "crypto";
import { baglantiGuncelleOz, baglantiHam, baglantiKullanilabilir, kimlikAlanlari, type Baglanti } from "./baglantiDepo";
import { adresGecerli } from "./kaynak";
import { tokenYenile, type Tokenlar } from "./mcpOauth";
import { coz, sifrele } from "./sifre";
import { degiskenDegistir } from "./sistemDegisken";
import { gerekenSirlar, turetilmis, type UygEylem, type Uygulama } from "./sistemUygulama";
import { xmlJson, type UygIstek } from "./sistemUygulamaOrtak";
import { AgHatasi, guvenliFetch } from "@/lib/guvenliAg";

/**
 * Uygulama eylemini sunucuda çalıştırır (sistem adımı ve yoklamalı tetikler ortak kullanır):
 *  1. Kimlik: seçilen bağlantıdaki değerler (ana anahtar, kimlik alanları, adres şablonu, OAuth erişim belirteci; süresi
 *     dolmak üzereyse yenilenip kasaya yazılır), yoksa hesabın sistem sırları.
 *  2. Kimlik adımı: eylem türetilmiş değer (ör. _GOOGLE_ERISIM) istiyorsa servisin belirteç isteği; sonuç süresi dolana
 *     kadar süreç içinde önbellekte kalır. Servis yeni yenileme belirteci verirse sistem sırrı kendiliğinden güncellenir.
 *  3. İstek: guvenliFetch (yerel ağ ve özel adresler kapalı), üretimde yalnız https; JSON, form, XML ya da ham gövde.
 *  4. Yanıt: JSON, XML (nesneye çevrilir) ya da metin; 401'de önbellekteki belirteç atılıp bir kez yeniden denenir.
 */
export class UygHata extends Error { constructor(m: string, public kalici: boolean) { super(m); this.name = "UygHata"; } }
export type UygSonuc = { durum: number; veri: unknown; ozet?: string; istek: { yontem: string; adres: string }; gizliler: string[]; kaynak: "baglanti" | "sir" };

type Onbellek = Map<string, { degerler: Record<string, string>; bitis: number }>;
const G = globalThis as unknown as { __vayraUygKimlik?: Onbellek };
const ONBELLEK: Onbellek = (G.__vayraUygKimlik ??= new Map());
const ozet = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 24);

/** Bağlantının OAuth erişim belirteci (bir dakikadan az kaldıysa yenilenir ve kaydedilir). */
async function oauthBelirteci(b: Baglanti, sahipOz: string): Promise<string | undefined> {
  const ham = coz(b.yetki.tokenlar);
  let tk: Tokenlar | null = null;
  try { tk = ham ? (JSON.parse(ham) as Tokenlar) : null; } catch { tk = null; }
  if (!tk?.erisim) return undefined;
  if (tk.bitis && tk.bitis - Date.now() < 60_000 && tk.yenileme && b.yetki.oauth) {
    try {
      const y = await tokenYenile(b.yetki.oauth, tk.yenileme);
      const yeni: Tokenlar = { ...y, yenileme: y.yenileme ?? tk.yenileme };
      const sifreli = sifrele(JSON.stringify(yeni));
      await baglantiGuncelleOz(b.id, sahipOz, (x) => { x.yetki.tokenlar = sifreli; x.sonYenileme = Date.now(); });
      return yeni.erisim;
    } catch { throw new UygHata(`"${b.ad}" bağlantısının oturumu yenilenemedi; Bağlantılar'da yeniden giriş yap.`, true); }
  }
  return tk.erisim;
}

/** Bağlantıdan sır değerleri (servisin eşleme tablosuna göre). */
export async function baglantiDegerleri(u: Uygulama, baglantiId: string, sahipOz: string): Promise<Record<string, string>> {
  const b = await baglantiHam(baglantiId, sahipOz);
  if (!b) throw new UygHata("Seçilen bağlantı bulunamadı; adımın kimlik ayarından başka bağlantı seç.", true);
  const es = u.baglanti?.find((x) => x.katalog === b.katalogId);
  if (!es) throw new UygHata(`"${b.ad}" bağlantısı ${u.ad} için kullanılamaz.`, true);
  if (!baglantiKullanilabilir(b, "sistem")) throw new UygHata(`"${b.ad}" bağlantısı sistemlerde kullanıma kapalı; Bağlantılar'dan aç.`, true);
  const alanlar = kimlikAlanlari(b);
  const o: Record<string, string> = {};
  for (const [ad, kaynak] of Object.entries(es.esle)) {
    let v: string | undefined;
    if (kaynak === "anahtar") v = coz(b.yetki.anahtar) ?? undefined;
    else if (kaynak === "oauth") v = await oauthBelirteci(b, sahipOz);
    else if (kaynak.startsWith("alan:")) v = alanlar[kaynak.slice(5)];
    else if (kaynak.startsWith("sablon:")) v = b.sablon?.[kaynak.slice(7)];
    if (v) o[ad] = v;
  }
  return o;
}

async function gonder(u: Uygulama, ist: UygIstek, signal: AbortSignal): Promise<{ r: Response; veri: unknown; metin: string; adres: URL }> {
  const adres = adresGecerli(ist.url);
  if (!adres || (process.env.NODE_ENV === "production" && adres.protocol !== "https:")) throw new UygHata(`${u.ad} adresi geçersiz; sırdaki adresi denetle.`, true);
  const govde = ist.form ? new URLSearchParams(ist.form).toString() : ist.metin !== undefined ? ist.metin : ist.json !== undefined ? JSON.stringify(ist.json) : undefined;
  const tur = ist.form ? "application/x-www-form-urlencoded" : ist.metin !== undefined ? ist.tur ?? "text/plain; charset=utf-8" : "application/json";
  let r: Response;
  try {
    r = await guvenliFetch(adres, {
      method: ist.yontem, signal: AbortSignal.any([signal, AbortSignal.timeout(30_000)]), body: ist.yontem === "GET" ? undefined : govde,
      headers: { "User-Agent": "VayraBuild-Sistem/2.0", Accept: ist.yanit === "xml" ? "text/xml, application/xml" : "application/json, text/plain, */*", ...(govde !== undefined && ist.yontem !== "GET" ? { "Content-Type": tur } : {}), ...(ist.basliklar ?? {}) },
    });
  } catch (er) {
    if (signal.aborted) throw er;
    if (er instanceof AgHatasi) throw new UygHata(`${er.message} Yalnız herkese açık adreslere istek gönderilir.`, true);
    const kod = String((er as { cause?: { code?: string } }).cause?.code ?? (er as Error).name);
    throw new UygHata(kod === "TimeoutError" ? `${u.ad} 30 saniyede yanıt vermedi.` : `${u.ad} servisine ulaşılamadı (${kod}).`, false);
  }
  const metin = (await r.text()).slice(0, 300_000);
  let veri: unknown = metin;
  const ct = r.headers.get("content-type") ?? "";
  if (ist.yanit === "xml" || /xml/i.test(ct) || /^\s*<\?xml|^\s*<[\w:]+:Envelope/i.test(metin)) { const x = xmlJson(metin); if (x !== null) veri = x; }
  else if (ist.yanit !== "metin" && /^\s*[[{]/.test(metin)) { try { veri = JSON.parse(metin); } catch { /* düz metin */ } }
  else if (!metin) veri = null;
  return { r, veri, metin, adres };
}

function hataMetni(u: Uygulama, r: Response, metin: string) {
  const m = `${u.ad} ${r.status} döndü: ${metin.replace(/\s+/g, " ").slice(0, 400) || r.statusText}`;
  return new UygHata(m, r.status >= 400 && r.status < 500 && r.status !== 408 && r.status !== 429);
}

/** Kimlik adımı (önbellekli). zorla: önbelleği atla. */
async function kimlikAl(u: Uygulama, sir: Record<string, string>, sahipOz: string, kaynak: "baglanti" | "sir", signal: AbortSignal, zorla = false): Promise<Record<string, string>> {
  const k = u.kimlik!;
  const anahtar = `${sahipOz}:${u.id}:${ozet(k.sirlar.map((x) => sir[x] ?? "").join("\u0000"))}`;
  const o = ONBELLEK.get(anahtar);
  if (!zorla && o && o.bitis - Date.now() > 60_000) return o.degerler;
  const s = (ad: string) => sir[ad] ?? "";
  const ist = await k.istek(s);
  const { r, veri, metin } = await gonder(u, ist, signal);
  if (!r.ok) throw new UygHata(`${u.ad} kimlik doğrulaması başarısız (${r.status}): ${metin.replace(/\s+/g, " ").slice(0, 300)}`, r.status >= 400 && r.status < 500);
  let c: ReturnType<typeof k.coz>;
  try { c = k.coz(veri, s); } catch (e) { throw new UygHata((e as Error).message, true); }
  ONBELLEK.set(anahtar, { degerler: c.degerler, bitis: Date.now() + Math.max(60_000, c.omur ?? 3_000_000) });
  if (c.yeniSirlar && kaynak === "sir") {
    for (const [ad, deger] of Object.entries(c.yeniSirlar)) { sir[ad] = deger; await degiskenDegistir(sahipOz, { islem: "sir", ad, deger }).catch(() => {}); }
  }
  if (ONBELLEK.size > 500) for (const [x, v] of ONBELLEK) if (v.bitis < Date.now()) ONBELLEK.delete(x);
  return c.degerler;
}

export async function uygulamaCalistir(o: { u: Uygulama; e: UygEylem; g: Record<string, unknown>; sir: Record<string, string>; sahipOz: string; signal: AbortSignal; baglantiId?: string }): Promise<UygSonuc> {
  const { u, e } = o;
  const sir: Record<string, string> = { ...o.sir };
  let kaynak: UygSonuc["kaynak"] = "sir";
  const gizliler: string[] = [];
  if (o.baglantiId) {
    const d = await baglantiDegerleri(u, o.baglantiId, o.sahipOz);
    Object.assign(sir, d); kaynak = "baglanti";
    gizliler.push(...Object.values(d));
  }
  const turetilenEksik = e.sirlar.filter((x) => turetilmis(x) && !sir[x]);
  const gerekli = turetilenEksik.length ? gerekenSirlar(u, e) : e.sirlar.filter((x) => !turetilmis(x));
  const eksik = gerekli.filter((x) => !sir[x]);
  if (eksik.length) throw new UygHata(`${u.ad} için şu ${eksik.length > 1 ? "sırlar" : "sır"} yok: ${eksik.join(", ")}. ${kaynak === "baglanti" ? "Bağlantıda bu değerler yok; eksikleri Değişkenler ve sırlar panelinden ekle." : "Düzenleyicideki Değişkenler ve sırlar panelinden ekle ya da adıma bir bağlantı seç."}`, true);
  let kimlikten = false;
  if (turetilenEksik.length) {
    if (!u.kimlik) throw new UygHata(`${u.ad} bağlantısı gerekli değerleri vermedi (${turetilenEksik.join(", ")}).`, true);
    const d = await kimlikAl(u, sir, o.sahipOz, kaynak, o.signal);
    Object.assign(sir, d); kimlikten = true;
    gizliler.push(...Object.values(d));
  }
  const s = (ad: string) => sir[ad] ?? "";
  let ist: UygIstek;
  try { ist = await e.istek(o.g, s); } catch (er) { throw new UygHata((er as Error).message, true); }
  let x = await gonder(u, ist, o.signal);
  if (x.r.status === 401 && kimlikten) {
    Object.assign(sir, await kimlikAl(u, sir, o.sahipOz, kaynak, o.signal, true));
    try { ist = await e.istek(o.g, s); } catch (er) { throw new UygHata((er as Error).message, true); }
    x = await gonder(u, ist, o.signal);
  }
  if (!x.r.ok) throw hataMetni(u, x.r, x.metin);
  if (e.devam) {
    let sonraki: UygIstek | null;
    try { sonraki = await e.devam(x.veri, o.g, s); } catch (er) { throw new UygHata((er as Error).message, true); }
    if (sonraki) { x = await gonder(u, sonraki, o.signal); if (!x.r.ok) throw hataMetni(u, x.r, x.metin); }
  }
  const sn = e.sonuc?.(x.veri) ?? {};
  if (sn.hata) throw new UygHata(`${u.ad}: ${sn.hata}`.slice(0, 600), true);
  for (const v of Object.values(sir)) if (v && v.length >= 6 && !gizliler.includes(v) && !Object.values(o.sir).includes(v)) gizliler.push(v);
  return { durum: x.r.status, veri: x.veri, ozet: sn.ozet, istek: { yontem: ist.yontem, adres: `${x.adres.origin}${x.adres.pathname}` }, gizliler, kaynak };
}
