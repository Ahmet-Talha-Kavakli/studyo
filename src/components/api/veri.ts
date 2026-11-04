"use client";

import { useEffect, useState } from "react";
import type { ApiUretim } from "@/store/useApiAnahtar";
import { toast } from "@/lib/toast";
import { modelBulKatalog } from "./katalog";
import { SERI_RENK, gunKovalari, type Cubuk } from "./grafik";

/** Hidrasyon sonrası true — persist edilmiş veriyi SSR çıktısıyla çakıştırmamak için. */
export function useHazir() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}

export function yuzdelik(degerler: number[], p: number): number | null {
  if (!degerler.length) return null;
  const s = [...degerler].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
}

export function ozet(l: ApiUretim[]) {
  const biten = l.filter((u) => u.status === "succeeded" || u.status === "failed");
  const basarili = l.filter((u) => u.status === "succeeded").length;
  const sureler = l.map((u) => u.metrics.run_ms).filter((x): x is number => typeof x === "number");
  return {
    toplam: l.length,
    basarili,
    basarisiz: l.filter((u) => u.status === "failed").length,
    oran: biten.length ? basarili / biten.length : null,
    kredi: l.filter((u) => u.environment === "live" && u.status === "succeeded").reduce((t, u) => t + u.credits, 0),
    p50: yuzdelik(sureler, 50),
    p95: yuzdelik(sureler, 95),
  };
}

export function gunlukIstek(l: ApiUretim[], gun: number): Cubuk[] {
  return gunKovalari(gun).map((k) => {
    const g = l.filter((u) => { const t = Date.parse(u.created_at); return t >= k.bas && t < k.bit; });
    return {
      anahtar: String(k.bas), etiket: k.etiket, uzunEtiket: k.uzun,
      parcalar: [
        { ad: "Başarılı", deger: g.filter((u) => u.status !== "failed").length, renk: SERI_RENK.basarili },
        { ad: "Başarısız", deger: g.filter((u) => u.status === "failed").length, renk: SERI_RENK.basarisiz },
      ],
    };
  });
}

export function gunlukKredi(l: ApiUretim[], gun: number): Cubuk[] {
  return gunKovalari(gun).map((k) => ({
    anahtar: String(k.bas), etiket: k.etiket, uzunEtiket: k.uzun,
    parcalar: [{ ad: "Kredi", deger: l.filter((u) => { const t = Date.parse(u.created_at); return t >= k.bas && t < k.bit && u.environment === "live" && u.status === "succeeded"; }).reduce((t, u) => t + u.credits, 0), renk: SERI_RENK.basarili }],
  }));
}

export function modelKirilimi(l: ApiUretim[], olcu: "istek" | "kredi") {
  const m = new Map<string, number>();
  for (const u of l) {
    if (olcu === "kredi" && !(u.environment === "live" && u.status === "succeeded")) continue;
    m.set(u.model, (m.get(u.model) ?? 0) + (olcu === "kredi" ? u.credits : 1));
  }
  return Array.from(m.entries()).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([id, deger]) => ({ id, ad: modelBulKatalog(id)?.ad ?? id, deger }));
}

/** CSV indir (Excel Türkçe karakterler için BOM'lu). */
export function csvIndir(ad: string, satirlar: (string | number | null)[][]) {
  const kac = (v: string | number | null) => { const s = v === null ? "" : String(v); return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const metin = "﻿" + satirlar.map((r) => r.map(kac).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([metin], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = ad; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast.success("CSV dosyası indirildi", { description: ad });
}
