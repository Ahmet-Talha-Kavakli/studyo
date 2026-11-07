import "server-only";
import { randomBytes } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { sahipOzeti } from "./depo";
import type { Sohbet, SohbetMesaji, SohbetParca } from "./sohbetDepo";
import { etkinYol } from "./sohbetYol";

/**
 * Sohbet paylaşımı: etkin yolun salt okunur anlık görüntüsü (düşünce metni, onay girdileri ve API geçmişi alınmaz).
 * Sahip bağlantıyı günceller ya da kaldırır; alan kişi "Kendi sohbetinde devam et" ile kopyasını açar.
 * Artifact paylaşımı: tek HTML sayfası, kum havuzu başlığıyla sunulur.
 * Dosyalar: .veri/build/sohbet-paylasim/<id>.json, .veri/build/sohbet-sayfa/<id>.html
 */
export type PaylasilanMesaj = Pick<SohbetMesaji, "id" | "rol" | "zaman" | "metin" | "ekler" | "model" | "mod" | "kurul" | "ajan"> & { parcalar?: SohbetParca[] };
export type DavetRolu = "goruntule" | "yorum";
export type Davetli = { eposta: string; rol: DavetRolu; zaman: number; sonGorulme?: number; epostaDurumu?: "gonderildi" | "kurulu-degil" | "hata" };
/**
 * v5 kişiye özel paylaşım: erisim "herkes" (bağlantıyı alan görür, yorum yapamaz) ya da "davetli" (yalnız davet
 * edilen e-postalar; rolü görüntüleme ya da yorum). Sahip her zaman görür ve yorum yazar.
 */
export type Paylasim = { id: string; sahip: string; sohbet: string; baslik: string; model: string; mesajlar: PaylasilanMesaj[]; olusturma: number; guncelleme: number; erisim?: "herkes" | "davetli"; davetliler?: Davetli[]; sahipAd?: string };
export type PaylasimRolu = "sahip" | DavetRolu;
/** Görenin rolü: sahip, davetlinin rolü, herkese açıksa görüntüleme; erişimi yoksa null. */
export function paylasimRolu(p: Paylasim, g: { sahipOz?: string | null; eposta?: string | null }): PaylasimRolu | null {
  if (g.sahipOz && g.sahipOz === p.sahip) return "sahip";
  const d = g.eposta ? (p.davetliler ?? []).find((x) => x.eposta === g.eposta) : undefined;
  if (d) return d.rol;
  return p.erisim === "davetli" ? null : "goruntule";
}
/** Paylaşım bilgisinin değişen kısmını yazar (mesajlara dokunmadan). */
export async function paylasimGuncelle(id: string, f: (p: Paylasim) => void): Promise<Paylasim | null> {
  const p = await paylasimOku(id);
  if (!p) return null;
  f(p);
  await writeFile(pDosya(id), JSON.stringify(p));
  return p;
}

const KOK = path.join(DEPO_KOK, "build");
const pDosya = (id: string) => path.join(KOK, "sohbet-paylasim", `${id}.json`);
const sDosya = (id: string) => path.join(KOK, "sohbet-sayfa", `${id}.html`);
const PID = /^[A-Za-z0-9_-]{16}$/;
export const paylasimKimligiGecerli = (id: string) => PID.test(id);
const yeniPid = () => randomBytes(12).toString("base64url");

/** Paylaşılacak mesajlar: etkin yol; düşünce ve onay ayrıntıları çıkarılır. */
function anlikGoruntu(s: Sohbet): PaylasilanMesaj[] {
  return etkinYol(s.mesajlar, s.secim).filter((m) => m.rol === "kullanici" || m.durum !== "anahtar-yok").map((m) => ({
    id: m.id, rol: m.rol, zaman: m.zaman, metin: m.metin, ekler: m.ekler, model: m.model, mod: m.mod, kurul: m.kurul, ajan: m.ajan,
    parcalar: m.parcalar?.filter((p) => p.tur !== "dusunce" && !(p.tur === "arac" && (p.durum === "onay" || p.durum === "reddedildi"))).map((p) => (p.tur === "arac" ? { ...p, girdi: undefined, ayrinti: undefined } : p)),
  }));
}

export async function paylasimYaz(s: Sohbet, sahip: string): Promise<Paylasim> {
  const id = s.paylasim?.id && PID.test(s.paylasim.id) ? s.paylasim.id : yeniPid();
  const eski = await paylasimOku(id);
  const p: Paylasim = { id, sahip: sahipOzeti(sahip), sohbet: s.id, baslik: s.baslik, model: s.model, mesajlar: anlikGoruntu(s), olusturma: eski?.olusturma ?? Date.now(), guncelleme: Date.now(), erisim: eski?.erisim ?? "herkes", davetliler: eski?.davetliler ?? [], ...(eski?.sahipAd ? { sahipAd: eski.sahipAd } : {}) };
  await mkdir(path.dirname(pDosya(id)), { recursive: true });
  await writeFile(pDosya(id), JSON.stringify(p));
  return p;
}
export async function paylasimOku(id: string): Promise<Paylasim | null> {
  if (!PID.test(id)) return null;
  try { return JSON.parse(await readFile(pDosya(id), "utf8")) as Paylasim; } catch { return null; }
}
export async function paylasimSil(id: string) { if (PID.test(id)) await rm(pDosya(id), { force: true }); }

/* ── Artifact sayfası ── */
export async function sayfaYaz(html: string): Promise<string> {
  const id = yeniPid();
  await mkdir(path.dirname(sDosya(id)), { recursive: true });
  await writeFile(sDosya(id), html.slice(0, 2_000_000));
  return id;
}
export async function sayfaOku(id: string): Promise<string | null> {
  if (!PID.test(id)) return null;
  try { return await readFile(sDosya(id), "utf8"); } catch { return null; }
}
