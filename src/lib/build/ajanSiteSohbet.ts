import "server-only";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { projeOkuHam } from "./depo";
import { listeDegistir, listeOku, isletmeOku } from "./isletme";
import type { Sohbet } from "./isletmeTipler";
import { duzMetin } from "./ajanKanal";

/**
 * Vayra İşletme sitelerinin canlı sohbet eklentisi ile ajan arasındaki köprü. Eklenti ziyaretçi mesajlarını işletme
 * kaydına (sohbetler) yazar ve yanıtları oradan yoklar; bu köprü bağlı projelerin sohbetlerini birkaç saniyede bir
 * okur, yeni ziyaretçi mesajını ajana iletir ve yanıtı "işletme" mesajı olarak aynı kayda ekler. Ajan devrederse
 * konuşma gelen kutusuna düşer; temsilci yanıtı da aynı yoldan siteye gider. Sahip İşletme panelinden kendisi
 * yazarsa ajan o sohbette 30 dakika susar (insan devraldı sayılır).
 * Dizin: .veri/build/ajan-site-sohbet.json  { projeId: { ajanId, sahipOz, islenen: { sohbetId: z }, bizim: { sohbetId: z[] } } }
 */
type Kayit = { ajanId: string; sahipOz: string; islenen: Record<string, number>; bizim: Record<string, number[]>; baglanma: number };
type Dizin = Record<string, Kayit>;
const DOSYA = path.join(DEPO_KOK, "build", "ajan-site-sohbet.json");
let zincir: Promise<unknown> = Promise.resolve();
async function oku(): Promise<Dizin> { try { return JSON.parse(await readFile(DOSYA, "utf8")) as Dizin; } catch { return {}; } }
function degistir<T>(f: (d: Dizin) => T): Promise<T> {
  const p = zincir.catch(() => {}).then(async () => { const d = await oku(); const r = f(d); await mkdir(path.dirname(DOSYA), { recursive: true }); await writeFile(DOSYA, JSON.stringify(d)); return r; });
  zincir = p;
  return p;
}
export const siteSohbetDizini = oku;

/** Projeyi ajana bağlar (proje sahibin olmalı). Var olan sohbetlerin eski mesajları yanıtlanmaz. */
export async function siteSohbetBagla(projeId: string, ajanId: string, sahipOz: string): Promise<string | null> {
  const p = await projeOkuHam(projeId);
  if (!p || p.sahip !== sahipOz) return "Proje bulunamadı.";
  const l = await listeOku<Sohbet>(projeId, "sohbetler");
  await degistir((d) => { d[projeId] = { ajanId, sahipOz, islenen: Object.fromEntries(l.map((s) => [s.id, s.mesajlar.at(-1)?.z ?? 0])), bizim: {}, baglanma: Date.now() }; });
  siteSohbetDongusu();
  return null;
}
export const siteSohbetKopar = (projeId: string, ajanId: string) => degistir((d) => { if (d[projeId]?.ajanId === ajanId) delete d[projeId]; });

/** Temsilci ya da ajan yanıtını sitenin sohbet kaydına yazar. adres: "projeId:sohbetId". */
export async function siteSohbetGonder(adres: string, metin: string, _temsilci?: string): Promise<string | null> {
  const [projeId, sohbetId] = adres.split(":");
  if (!projeId || !sohbetId) return "Site sohbeti adresi geçersiz.";
  const z = Date.now();
  const tamam = await listeDegistir<Sohbet, boolean>(projeId, "sohbetler", (l) => {
    const s = l.find((x) => x.id === sohbetId);
    if (!s) return false;
    s.mesajlar.push({ z, kim: "isletme", metin: duzMetin(metin).slice(0, 2000) });
    s.guncelleme = z;
    return true;
  }, 2000).catch(() => false);
  if (!tamam) return "Sitedeki sohbet bulunamadı (silinmiş olabilir).";
  await degistir((d) => { const k = d[projeId]; if (k) k.bizim[sohbetId] = [...(k.bizim[sohbetId] ?? []), z].slice(-200); });
  return null;
}

let calisiyor = false;
/** Tek tur: bağlı projelerde yanıtlanmamış ziyaretçi mesajlarını ajana iletir. Dönüş: işlenen sohbet sayısı. */
export async function siteSohbetTuru(): Promise<number> {
  if (calisiyor) return 0;
  calisiyor = true;
  let n = 0;
  try {
    const d = await oku();
    const { yayindakiAjan } = await import("./ajanDepo");
    const { kanalMesaji } = await import("./ajanMesajKanal");
    for (const [projeId, k] of Object.entries(d)) {
      const y = await yayindakiAjan(k.ajanId);
      if (!y || y.sahipOzeti !== k.sahipOz || !y.ajan.yayin.kanallar.site) continue;
      const v = await isletmeOku(projeId);
      if (!v.eklentiler.sohbet.acik) continue;
      for (const s of await listeOku<Sohbet>(projeId, "sohbetler")) {
        if (s.kapali) continue;
        const son = k.islenen[s.id] ?? (s.olusturma < k.baglanma ? Number.MAX_SAFE_INTEGER : 0);
        const yeniler = s.mesajlar.filter((m) => m.kim === "ziyaretci" && m.z > son);
        if (!yeniler.length) continue;
        const bizim = new Set(k.bizim[s.id] ?? []);
        const insan = s.mesajlar.filter((m) => m.kim === "isletme" && !bizim.has(m.z)).at(-1);
        await degistir((x) => { if (x[projeId]) x[projeId].islenen[s.id] = yeniler.at(-1)!.z; });
        if (insan && Date.now() - insan.z < 30 * 60_000) continue;
        const adres = `${projeId}:${s.id}`;
        await kanalMesaji({
          y, kaynak: "site", kimlik: `site:${projeId}:${s.id}`.slice(0, 80), adres, metin: yeniler.map((m) => m.metin).join("\n").slice(0, 4000),
          iletisim: s.ad || s.eposta ? { ...(s.ad ? { ad: s.ad } : {}), ...(s.eposta ? { eposta: s.eposta } : {}), zaman: Date.now() } : undefined,
          hazirla: (kk) => { kk.site = s.sayfa || undefined; },
          gonder: (m) => siteSohbetGonder(adres, m),
        }).catch(() => null);
        n++;
      }
    }
  } finally { calisiyor = false; }
  return n;
}
/** Süreç içi döngü (4 saniye): ilk bağlantıda ve sunucu açılışında başlar. */
export function siteSohbetDongusu() {
  const g = globalThis as unknown as { __vayraSiteSohbet?: ReturnType<typeof setInterval> };
  if (g.__vayraSiteSohbet) return;
  g.__vayraSiteSohbet = setInterval(() => { siteSohbetTuru().catch(() => {}); }, 4000);
}
