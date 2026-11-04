"use client";

import { useEffect, useRef, useState } from "react";
import { useTuval, type Tuval } from "@/store/useTuval";
import { useAuth } from "@/store/useAuth";
import type { Kisi, Koleksiyon, OrtakBelge, OrtakIslem } from "@/lib/tuvalOrtak";
import { ETIKET_RENK } from "./tema";

/**
 * Birlikte düzenleme istemcisi. Yerel tuval ile son eşitlenen hâl (taban) karşılaştırılır; fark varlık düzeyinde
 * işlem olarak gönderilir. Sunucudan gelen yeni sürüm uygulanırken henüz gönderilmemiş yerel değişiklikler korunur.
 * İmleç ve seçim ~8 kez/sn gönderilir; diğer kişiler her yoklamada gelir.
 */
const KOL: Koleksiyon[] = ["dugumler", "kenarlar", "gruplar", "yorumlar"];
type Taban = { ad: string } & Record<Koleksiyon, Map<string, string>>;
const tabanAl = (t: { ad: string } & Partial<Record<Koleksiyon, { id: string }[]>>): Taban => ({ ad: t.ad, ...Object.fromEntries(KOL.map((k) => [k, new Map((t[k] ?? []).map((v) => [v.id, JSON.stringify(v)]))])) } as Taban);
export const kisiRenk = (ad: string) => ETIKET_RENK[[...ad].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % ETIKET_RENK.length];

function benKimlik() {
  try { let v = sessionStorage.getItem("vayra-ortak-ben"); if (!v) { v = Math.random().toString(36).slice(2, 12); sessionStorage.setItem("vayra-ortak-ben", v); } return v; }
  catch { return Math.random().toString(36).slice(2, 12); }
}

export type OrtakDurum = "kapali" | "baglaniyor" | "bagli" | "koptu";

export function useOrtak(tuvalId: string, ortak?: { id: string; anahtar: string }) {
  const [kisiler, setKisiler] = useState<Kisi[]>([]);
  const [durum, setDurum] = useState<OrtakDurum>(ortak ? "baglaniyor" : "kapali");
  const imlec = useRef<{ x: number; y: number; secili: string[] }>({ x: 0, y: 0, secili: [] });
  const imlecDegisti = useRef(false);
  const ad = useAuth((s) => s.kullanici?.ad ?? "Misafir");

  useEffect(() => {
    if (!ortak) { setDurum("kapali"); return; }
    let kapali = false, surum = 0, taban: Taban | null = null, gonderiliyor = false, yeniden = false;
    const ben = benKimlik();
    const yerel = () => useTuval.getState().tuvaller.find((t) => t.id === tuvalId);
    const q = (p: Record<string, string | number>) => new URLSearchParams({ id: ortak.id, k: ortak.anahtar, ...Object.fromEntries(Object.entries(p).map(([a, b]) => [a, String(b)])) });

    const fark = (t: Tuval): OrtakIslem[] => {
      if (!taban) return [];
      const l: OrtakIslem[] = [];
      if (t.ad !== taban.ad) l.push({ t: "ad", v: t.ad });
      for (const k of KOL) {
        const yer = (t[k] ?? []) as { id: string }[]; const tb = taban[k];
        const ids = new Set(yer.map((v) => v.id));
        for (const v of yer) { const j = JSON.stringify(v); if (tb.get(v.id) !== j) l.push({ t: "ust", k, v }); }
        for (const id of tb.keys()) if (!ids.has(id)) l.push({ t: "sil", k, id });
      }
      return l;
    };
    const gonder = async () => {
      if (kapali || !taban) return;
      if (gonderiliyor) { yeniden = true; return; }
      const t = yerel(); if (!t) return;
      const islemler = fark(t); if (!islemler.length) return;
      gonderiliyor = true;
      try {
        const r = await fetch("/api/tuval/ortak", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ islem: "uygula", id: ortak.id, k: ortak.anahtar, islemler }) });
        if (r.ok) {
          // Gönderilenler artık tabanın parçası.
          for (const i of islemler) { if (i.t === "ad") taban.ad = i.v; else if (i.t === "ust") taban[i.k].set(i.v.id, JSON.stringify(i.v)); else taban[i.k].delete(i.id); }
        } else setDurum("koptu");
      } catch { setDurum("koptu"); }
      gonderiliyor = false;
      if (yeniden) { yeniden = false; void gonder(); }
    };
    const uygula = (b: OrtakBelge) => {
      const t = yerel(); if (!t) return;
      const once = taban;
      const sonuc: Partial<Tuval> = {};
      for (const k of KOL) {
        const yer = new Map(((t[k] ?? []) as { id: string }[]).map((v) => [v.id, v]));
        const bekleyen = (id: string) => { const v = yer.get(id); return once ? (v ? once[k].get(id) !== JSON.stringify(v) : once[k].has(id)) : false; };
        const uzak = b[k] as { id: string }[];
        const liste = uzak.filter((v) => !(once?.[k].has(v.id) && !yer.has(v.id))) // yerelde silinmiş, gönderilmeyi bekliyor
          .map((v) => (bekleyen(v.id) && yer.has(v.id) ? yer.get(v.id)! : v));
        for (const [id, v] of yer) if (!uzak.some((x) => x.id === id) && once && !once[k].has(id)) liste.push(v); // yerelde yeni
        (sonuc as Record<string, unknown>)[k] = liste;
      }
      const adBekliyor = once && t.ad !== once.ad;
      taban = tabanAl(b);
      useTuval.getState().guncelle(tuvalId, (x) => ({ ...x, ...sonuc, ad: adBekliyor ? x.ad : b.ad }), false);
    };
    const yokla = async () => {
      try {
        const r = await fetch(`/api/tuval/ortak?${q({ surum, kisi: ben })}`);
        if (!r.ok) { setDurum("koptu"); return; }
        const j = (await r.json()) as { surum: number; belge?: OrtakBelge; kisiler: Kisi[] };
        if (j.belge) { uygula(j.belge); surum = j.belge.surum; }
        setKisiler(j.kisiler); setDurum("bagli");
      } catch { setDurum("koptu"); }
    };
    const varlik = async () => {
      imlecDegisti.current = false;
      try {
        const r = await fetch("/api/tuval/ortak", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ islem: "varlik", id: ortak.id, k: ortak.anahtar, kisi: { id: ben, ad, renk: kisiRenk(ad), ...imlec.current } }) });
        if (r.ok) setKisiler(((await r.json()) as { kisiler: Kisi[] }).kisiler);
      } catch { /* sonraki turda */ }
    };

    let zaman: ReturnType<typeof setTimeout> | null = null;
    const abone = useTuval.subscribe((s, o) => {
      const a = s.tuvaller.find((t) => t.id === tuvalId), b0 = o.tuvaller.find((t) => t.id === tuvalId);
      if (a === b0) return;
      if (zaman) clearTimeout(zaman); zaman = setTimeout(() => void gonder(), 180);
    });
    void (async () => { await yokla(); void varlik(); })();
    const y = setInterval(() => void yokla(), 900);
    const v = setInterval(() => { if (imlecDegisti.current) void varlik(); }, 120);
    const kalp = setInterval(() => void varlik(), 3000);
    return () => { kapali = true; abone(); clearInterval(y); clearInterval(v); clearInterval(kalp); if (zaman) clearTimeout(zaman); };
  }, [tuvalId, ortak?.id, ortak?.anahtar, ad]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    kisiler, durum,
    imlecGonder: (x: number, y: number, secili: string[]) => { imlec.current = { x, y, secili }; imlecDegisti.current = true; },
  };
}
