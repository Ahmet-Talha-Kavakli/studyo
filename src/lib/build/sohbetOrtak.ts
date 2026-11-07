import "server-only";
import { createHash, randomBytes } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { coz } from "./sifre";
import { D, epostaNormal, hesapOkuSync, jsonOku, ozet } from "@/lib/hesap/depo";
import { oturumOkuSync } from "@/lib/hesap/oturum";
import { bildirimOz, type YeniBildirim } from "./bildirim";
import { epostaGonder, epostaKurulu } from "./bulutEposta";
import { sahipOzeti } from "./depo";
import { sahipAl } from "./sunucu";

/**
 * Kişiye özel paylaşım ve iş birliğinin ortak altyapısı (sohbet paylaşımı ve klasör ekibi):
 *  - İsteği yapanın kimliği: Vayra oturumundaki hesabın e-postası ve adı (davetler e-postaya bağlıdır).
 *  - "Benimle paylaşılanlar" dizini: e-posta özeti başına davet edildiği sohbetler ve klasörler.
 *  - Davet bildirimi: davet edilenin Vayra hesabı varsa bildirim merkezine düşer; e-posta servisi kuruluysa e-posta
 *    da gider. Servis kurulu değilse gönderilmiş gibi davranılmaz (arayüz bağlantıyı elle iletmeyi söyler).
 * Dosyalar: .veri/build/sohbet-ortak/<e-posta özeti>.json
 */
export type Kimlik = { eposta: string; ad: string; uid: string };
export const EPOSTA = /^[^\s@<>()",;:]{1,64}@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;
export const epostaTemizle = (e: unknown) => (typeof e === "string" ? epostaNormal(e).slice(0, 200) : "");

/** Oturumdaki hesabın kimliği (oturum yoksa null). */
export function istekKimligi(req: Request): Kimlik | null {
  try {
    const o = oturumOkuSync(req);
    if (!o) return null;
    const h = hesapOkuSync(o.uid);
    if (!h?.email) return null;
    return { eposta: epostaNormal(h.email), ad: h.profil?.ad || h.email.split("@")[0], uid: h.uid };
  } catch { return null; }
}
/** Sunucu bileşenleri için: çerez başlığından sahte istek kurup kimliği ve Build sahibini çözer. */
export function cerezdenIstek(cerez: string): Request { return new Request("http://yerel/", { headers: { cookie: cerez } }); }
export const istekSahipOzeti = (req: Request) => { const s = sahipAl(req); return s ? sahipOzeti(s) : null; };

/** E-postanın Vayra hesabı varsa o hesabın Build sahip özeti (davet bildirimi için). */
export async function epostaSahipOzeti(eposta: string): Promise<string | null> {
  try {
    const d = await jsonOku<{ uid?: string }>(path.join(D.eposta, `${ozet(`eposta:${epostaNormal(eposta)}`)}.json`));
    if (!d?.uid) return null;
    const h = hesapOkuSync(d.uid);
    const a = h?.build ? coz(h.build.anahtar) : null;
    return a ? sahipOzeti(a) : null;
  } catch { return null; }
}

/* ───────────── Benimle paylaşılanlar ───────────── */
export type OrtakOge = { tur: "sohbet" | "klasor"; id: string; baslik: string; sahipAd: string; rol: string; zaman: number; adres: string };
const dizinDosyasi = (eposta: string) => path.join(DEPO_KOK, "build", "sohbet-ortak", `${createHash("sha256").update(`ortak:${epostaNormal(eposta)}`).digest("hex").slice(0, 40)}.json`);
const kilit = new Map<string, Promise<unknown>>();
async function dizinOku(eposta: string): Promise<OrtakOge[]> { try { return (JSON.parse(await readFile(dizinDosyasi(eposta), "utf8")) as { ogeler: OrtakOge[] }).ogeler ?? []; } catch { return []; } }
function dizinDegistir(eposta: string, f: (l: OrtakOge[]) => OrtakOge[]) {
  const k = dizinDosyasi(eposta);
  const is = (kilit.get(k) ?? Promise.resolve()).then(async () => {
    const l = f(await dizinOku(eposta));
    if (!l.length) { await rm(k, { force: true }); return; }
    await mkdir(path.dirname(k), { recursive: true });
    await writeFile(k, JSON.stringify({ ogeler: l.slice(0, 500) }));
  });
  kilit.set(k, is.catch(() => {}));
  return is;
}
export const ortakListe = (eposta: string) => dizinOku(eposta);
export const ortakEkle = (eposta: string, o: OrtakOge) => dizinDegistir(eposta, (l) => [o, ...l.filter((x) => !(x.tur === o.tur && x.id === o.id))]);
export const ortakSil = (eposta: string, tur: OrtakOge["tur"], id: string) => dizinDegistir(eposta, (l) => l.filter((x) => !(x.tur === tur && x.id === id)));

const kok = (req?: Request) => {
  const o = req?.headers.get("origin");
  if (o && /^https?:\/\/[^/]+$/.test(o)) return o;
  return process.env.VAYRA_ANA_ALAN ? `https://${process.env.VAYRA_ANA_ALAN}` : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3100";
};

/**
 * Davet bildirimi: hesabı varsa bildirim merkezine, e-posta servisi kuruluysa e-postayla.
 * Dönüş: e-posta durumu ("gonderildi" | "kurulu-degil" | "hata") ve hesabı olup olmadığı.
 */
export async function davetBildir(req: Request, eposta: string, b: { baslik: string; metin: string; adres: string; tur: YeniBildirim["tur"]; kaynak: YeniBildirim["kaynak"] }): Promise<{ eposta: "gonderildi" | "kurulu-degil" | "hata"; hesap: boolean }> {
  const oz = await epostaSahipOzeti(eposta);
  if (oz) await bildirimOz(oz, { tur: b.tur, baslik: b.baslik, metin: b.metin, adres: b.adres, kaynak: b.kaynak, yalnizUygulama: true }).catch(() => {});
  if (!epostaKurulu()) return { eposta: "kurulu-degil", hesap: !!oz };
  const r = await epostaGonder({ kime: eposta, konu: b.baslik, metin: `${b.metin}\n\nGörmek için bu e-posta adresiyle Vayra'ya giriş yapman gerekir.`, dugme: { ad: "Vayra'da aç", adres: `${kok(req)}${b.adres}` } });
  return { eposta: r.ok ? "gonderildi" : "hata", hesap: !!oz };
}

/* ───────────── Yorumlar (paylaşılan sohbet) ───────────── */
export type Yorum = { id: string; mesajId: string; alinti?: string; metin: string; yazar: { eposta?: string; ad: string; sahip?: boolean }; zaman: number; ust?: string; cozuldu?: boolean; duzenleme?: number };
const yorumDosyasi = (pid: string) => path.join(DEPO_KOK, "build", "sohbet-yorum", `${pid}.json`);
const ykilit = new Map<string, Promise<unknown>>();
export async function yorumlariOku(pid: string): Promise<Yorum[]> { try { return JSON.parse(await readFile(yorumDosyasi(pid), "utf8")) as Yorum[]; } catch { return []; } }
export function yorumlariDegistir<T>(pid: string, f: (l: Yorum[]) => T): Promise<T> {
  const k = yorumDosyasi(pid);
  const is = (ykilit.get(k) ?? Promise.resolve()).then(async () => {
    const l = await yorumlariOku(pid);
    const r = f(l);
    await mkdir(path.dirname(k), { recursive: true });
    await writeFile(k, JSON.stringify(l.slice(-2000)));
    return r;
  });
  ykilit.set(k, is.catch(() => {}));
  return is;
}
export const yorumlariSil = (pid: string) => rm(yorumDosyasi(pid), { force: true });
export const yorumKimligi = () => randomBytes(6).toString("base64url");

/* ───────────── Paylaşılan klasör erişimi ───────────── */
import { klasorGetirOz, type SohbetKlasoru } from "./sohbetKlasor";
export type KlasorErisimi = { k: SohbetKlasoru; oz: string; rol: "sahip" | "duzenleyici" | "izleyici"; kimlik: Kimlik | null };
/**
 * Klasöre erişim: ?sahip=<özet> verilmezse çağıranın kendi klasörü; verilirse oturumdaki e-posta klasörün ekibinde
 * olmalı. Rol: sahip, düzenleyici (talimat ve dosya değiştirir) ya da izleyici.
 */
export async function klasorErisimi(req: Request, kid: string): Promise<KlasorErisimi | null> {
  const benim = istekSahipOzeti(req);
  const hedef = new URL(req.url).searchParams.get("sahip") || benim;
  if (!hedef) return null;
  const k = await klasorGetirOz(hedef, kid);
  if (!k) return null;
  const kimlik = istekKimligi(req);
  if (hedef === benim) return { k, oz: hedef, rol: "sahip", kimlik };
  const u = kimlik ? k.ekip?.find((x) => x.eposta === kimlik.eposta) : undefined;
  return u ? { k, oz: hedef, rol: u.rol, kimlik } : null;
}
