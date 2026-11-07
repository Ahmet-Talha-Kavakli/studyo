"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Yönetim panelinin istemci tarafı: veri çekme kancası, işlem çağrısı ve biçimlendirme.
 * Arayüzde simge kullanılmaz: yüzde "yüzde 12", aralık "ile" ya da virgülle yazılır.
 */

export interface VeriDurumu<T> { veri: T | null; hata: string | null; yukleniyor: boolean; yenile: () => void }

/** GET /api/admin/... ; yol null ise istek atılmaz. aralikMs verilirse o sıklıkla yenilenir. */
export function useAdminVeri<T>(yol: string | null, aralikMs?: number): VeriDurumu<T> {
  const [veri, setVeri] = useState<T | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(!!yol);
  const [sayac, setSayac] = useState(0);
  const iptal = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!yol) return;
    iptal.current?.abort();
    const ac = new AbortController();
    iptal.current = ac;
    setYukleniyor(true);
    fetch(yol, { credentials: "same-origin", cache: "no-store", signal: ac.signal })
      .then(async (r) => {
        const j = await r.json().catch(() => null);
        if (r.status === 401) { window.location.href = `/giris?geri=${encodeURIComponent(window.location.pathname)}`; return; }
        if (!r.ok || !j?.ok) throw new Error(j?.hata ?? `Sunucu ${r.status} döndü.`);
        setVeri(j as T); setHata(null);
      })
      .catch((e) => { if ((e as Error).name !== "AbortError") setHata((e as Error).message); })
      .finally(() => { if (!ac.signal.aborted) setYukleniyor(false); });
    return () => ac.abort();
  }, [yol, sayac]);

  useEffect(() => {
    if (!aralikMs || !yol) return;
    const t = setInterval(() => { if (document.visibilityState === "visible") setSayac((s) => s + 1); }, aralikMs);
    return () => clearInterval(t);
  }, [aralikMs, yol]);

  const yenile = useCallback(() => setSayac((s) => s + 1), []);
  return { veri, hata, yukleniyor, yenile };
}

export async function adminIslem(yol: string, govde: Record<string, unknown>): Promise<{ ok: true; veri: Record<string, unknown> } | { ok: false; hata: string }> {
  try {
    const r = await fetch(yol, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(govde) });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j?.ok) return { ok: false, hata: j?.hata ?? `Sunucu ${r.status} döndü.` };
    return { ok: true, veri: j };
  } catch { return { ok: false, hata: "Sunucuya ulaşılamadı." }; }
}

/** Sorgu dizesi (boş değerler atlanır). */
export function sorgu(yol: string, p: Record<string, string | number | undefined | null | boolean>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== null && v !== "" && v !== false) u.set(k, String(v));
  const s = u.toString();
  return s ? `${yol}?${s}` : yol;
}

/* ── Biçimlendirme ── */

const tr = new Intl.NumberFormat("tr-TR");
const tr2 = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const sayi = (n: number | null | undefined) => (n === null || n === undefined || !Number.isFinite(n) ? "Yok" : tr.format(Math.round(n)));
/** Kuruş ya da sent tutarı, para birimi koduyla: 12.340,50 USD, 99,00 EUR. Varsayılan para birimi yoktur. */
export function para(kurus: number, birim: string): string {
  return `${tr2.format(kurus / 100)} ${birim}`;
}
/** Para birimi başına toplamlar: "120,00 USD, 45,00 EUR"; boşsa "Yok". */
export function paraListe(m: Record<string, number> | null | undefined, sira?: string[]): string {
  const l = Object.entries(m ?? {}).filter(([, v]) => v);
  if (!l.length) return "Yok";
  const s = sira ?? [];
  l.sort((a, b) => (s.indexOf(a[0]) + 1 || 99) - (s.indexOf(b[0]) + 1 || 99) || b[1] - a[1]);
  return l.map(([p, v]) => para(v, p)).join(", ");
}
export function yuzde(n: number | null | undefined, basamak = 1): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "Yok";
  return `yüzde ${n.toFixed(basamak).replace(".", ",").replace(/,0+$/, "")}`;
}
export function bayt(n: number): string {
  if (n < 1024) return `${n} B`;
  const b = ["KB", "MB", "GB", "TB"];
  let i = -1, x = n;
  do { x /= 1024; i++; } while (x >= 1024 && i < b.length - 1);
  return `${x.toFixed(x >= 100 ? 0 : 1).replace(".", ",")} ${b[i]}`;
}
const AY = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const ist = (t: number) => new Date(t + 3 * 3_600_000);
export function tarih(t: number | null | undefined): string {
  if (!t) return "Yok";
  const d = ist(t);
  return `${d.getUTCDate()} ${AY[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
export function tarihSaat(t: number | null | undefined): string {
  if (!t) return "Yok";
  const d = ist(t);
  return `${d.getUTCDate()} ${AY[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}
/** "2026-11-07" → "7 Kas" */
export function gunEtiket(g: string): string {
  const [, a, gun] = g.split("-").map(Number);
  return `${gun} ${AY[(a ?? 1) - 1]}`;
}
export function gorece(t: number | null | undefined): string {
  if (!t) return "Hiç";
  const fark = Date.now() - t;
  if (fark < 0) { const s = -fark; return s < 3_600_000 ? `${Math.max(1, Math.round(s / 60_000))} dakika sonra` : s < 86_400_000 ? `${Math.round(s / 3_600_000)} saat sonra` : `${Math.round(s / 86_400_000)} gün sonra`; }
  if (fark < 60_000) return "az önce";
  if (fark < 3_600_000) return `${Math.floor(fark / 60_000)} dakika önce`;
  if (fark < 86_400_000) return `${Math.floor(fark / 3_600_000)} saat önce`;
  if (fark < 30 * 86_400_000) return `${Math.floor(fark / 86_400_000)} gün önce`;
  return tarih(t);
}
export function sure(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "Yok";
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1).replace(".", ",")} sn`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)} dk ${Math.round((ms % 60_000) / 1000)} sn`;
  return `${Math.floor(ms / 3_600_000)} sa ${Math.round((ms % 3_600_000) / 60_000)} dk`;
}

export const PLAN_AD: Record<string, string> = { baslangic: "Başlangıç", arti: "Artı", ultra: "Ultra", kurumsal: "Kurumsal" };
export const PLAN_RENK: Record<string, string> = { baslangic: "#94a3b8", arti: "#55d6fd", ultra: "#a78bfa", kurumsal: "#fbbf24" };
