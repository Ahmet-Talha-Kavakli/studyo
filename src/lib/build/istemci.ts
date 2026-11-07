"use client";

import type { ProjeOzet, ProjeTur } from "./tipler";

/**
 * Vayra Build istemci yardımcıları: sahip anahtarı (tarayıcıda kalıcı), API çağrısı, NDJSON akış okuyucu.
 * Sahip anahtarı yalnız bu tarayıcıda saklanır; sunucu özetini tutar. Hesap bağlanınca anahtar hesaba taşınır.
 */

const ANAHTAR = "vayra-build-sahip";

export function sahipAnahtari(): string {
  try {
    let a = localStorage.getItem(ANAHTAR);
    if (!a || !/^[A-Za-z0-9_-]{24,80}$/.test(a)) {
      const b = new Uint8Array(24);
      crypto.getRandomValues(b);
      a = btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      localStorage.setItem(ANAHTAR, a);
    }
    return a;
  } catch {
    return "gecici-oturum-anahtari-000000000000";
  }
}

export class ApiHatasi extends Error {
  constructor(public durum: number, mesaj: string) { super(mesaj); }
}

/** JSON API çağrısı; { ok:false, hata } yanıtını ApiHatasi'na çevirir. */
export async function api<T = Record<string, unknown>>(yol: string, g: { method?: string; govde?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const r = await fetch(yol, {
    method: g.method ?? (g.govde ? "POST" : "GET"),
    headers: { "x-build-sahip": sahipAnahtari(), ...(g.govde ? { "Content-Type": "application/json" } : {}) },
    body: g.govde ? JSON.stringify(g.govde) : undefined,
    signal: g.signal,
    cache: "no-store",
  });
  let v: { ok?: boolean; hata?: string } & Record<string, unknown> = {};
  try { v = await r.json(); } catch { /* boş yanıt */ }
  if (!r.ok || v.ok === false) throw new ApiHatasi(r.status, v.hata ?? `İstek başarısız (${r.status}).`);
  return v as T;
}

/** NDJSON akışını satır satır okur; her olay için geri çağırır. JSON yanıt gelirse onu döndürür. */
export async function akisOku(yol: string, govde: unknown, olay: (o: Record<string, unknown> & { t: string }) => void, signal?: AbortSignal): Promise<Record<string, unknown> | null> {
  const r = await fetch(yol, { method: "POST", headers: { "x-build-sahip": sahipAnahtari(), "Content-Type": "application/json" }, body: JSON.stringify(govde), signal });
  const tur = r.headers.get("content-type") ?? "";
  if (!tur.includes("ndjson")) {
    let v: { ok?: boolean; hata?: string } & Record<string, unknown> = {};
    try { v = await r.json(); } catch { /* boş */ }
    if (!r.ok || v.ok === false) throw new ApiHatasi(r.status, v.hata ?? `İstek başarısız (${r.status}).`);
    return v;
  }
  const okuyucu = r.body!.getReader(), coz = new TextDecoder();
  let tampon = "";
  for (;;) {
    const { done, value } = await okuyucu.read();
    if (done) break;
    tampon += coz.decode(value, { stream: true });
    let n: number;
    while ((n = tampon.indexOf("\n")) >= 0) {
      const satir = tampon.slice(0, n).trim();
      tampon = tampon.slice(n + 1);
      if (!satir) continue;
      try { olay(JSON.parse(satir)); } catch { /* bozuk satır */ }
    }
  }
  return null;
}

export const projeleriGetir = () => api<{ projeler: ProjeOzet[] }>("/api/build/proje").then((v) => v.projeler);
export const projeOlustur = (g: { sablon?: string; kopya?: string; tur?: ProjeTur; ad?: string; istem?: string }) => api<{ id: string }>("/api/build/proje", { govde: g }).then((v) => v.id);

/** "3 dk önce", "dün", "12 Eki" */
export function gorece(zaman: number): string {
  const s = (Date.now() - zaman) / 1000;
  if (s < 45) return "az önce";
  if (s < 3600) return `${Math.round(s / 60)} dk önce`;
  if (s < 86400) return `${Math.round(s / 3600)} saat önce`;
  if (s < 172800) return "dün";
  if (s < 604800) return `${Math.round(s / 86400)} gün önce`;
  return new Date(zaman).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

/**
 * Yayın adresi. Üretimde NEXT_PUBLIC_BUILD_ALAN (ör. vayra.app) tanımlıysa <altAlan>.<alan>;
 * tanımlı değilse bu sunucudaki çalışan yol (/b/<altAlan>/). Arayüz her zaman gerçekten açılan adresi gösterir.
 */
export function yayinAdresi(altAlan: string): { tam: string; gorunen: string } {
  const alan = process.env.NEXT_PUBLIC_BUILD_ALAN;
  if (alan) return { tam: `https://${altAlan}.${alan}/`, gorunen: `${altAlan}.${alan}` };
  const koken = typeof location !== "undefined" ? location.origin : "";
  return { tam: `${koken}/b/${altAlan}/`, gorunen: `${koken.replace(/^https?:\/\//, "")}/b/${altAlan}` };
}
