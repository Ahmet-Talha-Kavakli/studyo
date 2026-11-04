/* Durum ölçümleri — yalnız sunucuda. Gerçek uç noktaları yoklar ve günlük sonuçları tutar.
   Kayıt işletim sisteminin geçici klasöründe JSON olarak saklanır (sunucu yeniden başlasa da
   geçmiş korunur). Ölçüm, sayfa açıldığında (en çok dakikada bir) ve sunucu açıkken 5 dakikada bir yapılır. */
import fs from "fs";
import os from "os";
import path from "path";
import { saglayiciDurumu, saglayiciHazirlik } from "@/lib/saglayicilar";
import { TUM_BILESENLER, gunAnahtari, type BilesenDurumu, type DurumKodu, type DurumYaniti, type GunKaydi, type Olcum } from "@/lib/durum";

const DOSYA = path.join(os.tmpdir(), "vayra-durum.json");
const YAVAS_MS = 1500;
const GUN_SAYISI = 90;

type Sonuc = { durum: DurumKodu; ms?: number; not?: string };
type Kayit = { baslangic: number; gunler: Record<string, Record<string, GunKaydi>> };

const g = globalThis as unknown as { __vayraDurum?: { kayit: Kayit; son: number; sonuc: Record<string, Sonuc>; origin?: string; zamanlayici?: boolean; suruyor?: Promise<void>; isindi?: boolean; ham: Record<string, DurumKodu> } };

function yukle(): Kayit {
  try { const k = JSON.parse(fs.readFileSync(DOSYA, "utf8")) as Kayit; if (k.baslangic && k.gunler) return k; } catch { /* ilk çalıştırma */ }
  return { baslangic: Date.now(), gunler: {} };
}
// Geliştirmede modül yeniden yüklenince eski biçimli durum nesnesi yenisiyle değiştirilir.
if (g.__vayraDurum && !("ham" in g.__vayraDurum)) g.__vayraDurum = undefined;
const durum = (g.__vayraDurum ??= { kayit: yukle(), son: 0, sonuc: {}, ham: {}, isindi: false });

function yaz() {
  // 90 günden eski günleri at
  const sinir = gunAnahtari(Date.now() - (GUN_SAYISI + 1) * 86_400_000);
  for (const gun of Object.keys(durum.kayit.gunler)) if (gun < sinir) delete durum.kayit.gunler[gun];
  try { fs.writeFileSync(DOSYA, JSON.stringify(durum.kayit)); } catch { /* yazılamazsa bellekte kalır */ }
}

async function zamanla(url: string, init?: RequestInit): Promise<{ ok: boolean; ms: number; govde?: unknown }> {
  const t0 = performance.now();
  try {
    const r = await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(8000) });
    const govde = await r.json().catch(() => undefined);
    return { ok: r.ok, ms: Math.round(performance.now() - t0), govde };
  } catch { return { ok: false, ms: Math.round(performance.now() - t0) }; }
}
const hiz = (r: { ok: boolean; ms: number }, notOk?: string): Sonuc =>
  !r.ok ? { durum: "kesinti", ms: r.ms, not: notOk ?? "Yanıt alınamadı" } : r.ms > YAVAS_MS ? { durum: "yavas", ms: r.ms, not: `Yanıt ${r.ms} ms` } : { durum: "calisiyor", ms: r.ms };

/** Tüm gerçek ölçümleri yapar. */
async function olc(origin: string): Promise<Record<Olcum, Sonuc>> {
  const [web, api, mcp] = await Promise.all([
    zamanla(`${origin}/manifest.webmanifest`),
    zamanla(`${origin}/api/v1/ping`),
    zamanla(`${origin}/api/mcp`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "vayra-durum", version: "1" } } }) }),
  ]);
  const s: Record<string, Sonuc> = {
    web: hiz(web), api: hiz(api),
    mcp: hiz({ ok: mcp.ok && !!(mcp.govde as { result?: unknown } | undefined)?.result, ms: mcp.ms }, "initialize yanıtı alınamadı"),
  };
  const turler = saglayiciDurumu();
  for (const [tur, d] of Object.entries(turler)) {
    s[`tur:${tur}`] = d.gercek ? { durum: "calisiyor", not: `${d.saglayici} ile` } : { durum: "demo", not: "Gerçek sağlayıcı bağlı değil; üretimler önizlemeyle tamamlanıyor" };
  }
  for (const a of saglayiciHazirlik()) {
    s[`saglayici:${a.ad}`] = a.hazir ? { durum: "calisiyor", not: "Bağlı" } : { durum: "demo", not: "Bu ortamda anahtar tanımlı değil" };
  }
  return s as Record<Olcum, Sonuc>;
}

async function olcVeKaydet(origin: string) {
  // Sürecin ilk turu ısınmadır (soğuk derleme/bağlantı); sonucu kaydedilmez, ölçüm hemen tekrarlanır.
  if (!durum.isindi) { await olc(origin); durum.isindi = true; }
  const s = await olc(origin);
  const gun = gunAnahtari(Date.now());
  const gunKayit = (durum.kayit.gunler[gun] ??= {});
  let tekrar = false;
  for (const b of TUM_BILESENLER) {
    const r = s[b.olcum] ?? { durum: "demo" as DurumKodu };
    // Doğrulama: yavaşlık/kesinti ancak art arda iki ölçüm aynıysa ilan edilir; tek kötü ölçümde
    // görünen durum korunur ve kısa süre sonra yeniden ölçülür (ham sonuç günlük kayda yine yazılır).
    const once = durum.ham[b.id];
    durum.ham[b.id] = r.durum;
    const kotu = r.durum === "yavas" || r.durum === "kesinti";
    if (kotu && once !== r.durum) {
      const onceki = durum.sonuc[b.id];
      durum.sonuc[b.id] = { durum: onceki && onceki.durum !== r.durum ? onceki.durum : "calisiyor", ms: r.ms, not: `Son ölçümde ${r.durum === "yavas" ? `yavaş yanıt (${r.ms} ms)` : "yanıt alınamadı"}; doğrulanıyor` };
      tekrar = true;
    } else durum.sonuc[b.id] = r;
    if (r.durum === "demo") continue; // ölçülemeyen bileşen için çalışma süresi yazılmaz
    const k = (gunKayit[b.id] ??= { gun, olcum: 0, basarisiz: 0, yavas: 0 });
    k.olcum++;
    if (r.durum === "kesinti") k.basarisiz++;
    if (r.durum === "yavas") k.yavas++;
  }
  durum.son = Date.now();
  yaz();
  if (tekrar) setTimeout(() => { void olcVeKaydet(origin).catch(() => {}); }, 15_000);
}

/** Güncel durum; son ölçüm 60 sn'den eskiyse yeniden ölçer. */
export async function durumGetir(origin: string): Promise<DurumYaniti> {
  durum.origin = origin;
  if (!durum.zamanlayici) {
    durum.zamanlayici = true;
    setInterval(() => { if (durum.origin) void olcVeKaydet(durum.origin).catch(() => {}); }, 5 * 60_000).unref?.();
  }
  if (Date.now() - durum.son > 60_000) {
    durum.suruyor ??= olcVeKaydet(origin).finally(() => { durum.suruyor = undefined; });
    await durum.suruyor;
  }
  const bilesenler: BilesenDurumu[] = TUM_BILESENLER.map((b) => {
    const r = durum.sonuc[b.id] ?? { durum: "demo" as DurumKodu };
    const gunler = Object.entries(durum.kayit.gunler).map(([, kay]) => kay[b.id]).filter(Boolean);
    return { id: b.id, durum: r.durum, ms: r.ms, not: r.not, gunler };
  });
  return { zaman: durum.son, olcumBaslangic: durum.kayit.baslangic, bilesenler };
}

/* ── Abonelikler (bellekte) ── */
export type AboneKanal = "eposta" | "slack" | "webhook";
const ga = globalThis as unknown as { __vayraDurumAbone?: Map<string, { kanal: AboneKanal; hedef: string; bilesenler: string[]; zaman: number }> };
export const durumAboneleri = (ga.__vayraDurumAbone ??= new Map());
