"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Inbox, Loader2, Mail, RotateCw, Trash2 } from "lucide-react";
import { api } from "@/lib/build/istemci";
import type { FormGonderimi, Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { LayoutGroup, motion } from "framer-motion";
import { BarChart3, Database, Users } from "lucide-react";
import { Analitik } from "./Analitik";
import { Veritabani } from "./Veritabani";
import { Uyeler } from "./Uyeler";
import type { ProjeKanca } from "./useProje";

const tarih = (z: number) => new Date(z).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Veriler: sitedeki data-vayra-form formlarından gelen gönderimler (gelen kutusu), CSV dışa aktarma. */
export function GelenKutusu({ k, okunmamis }: { k: ProjeKanca; okunmamis: (n: number) => void }) {
  const p = k.proje as Proje;
  const [l, setL] = useState<FormGonderimi[] | null>(null);
  const [form, setForm] = useState<string>("hepsi");
  const [secili, setSecili] = useState<string | null>(null);
  const [yenileniyor, setYenileniyor] = useState(false);

  const getir = useCallback(async () => {
    setYenileniyor(true);
    try { const v = await api<{ gonderimler: FormGonderimi[] }>(`/api/build/form/${p.id}`); setL(v.gonderimler); okunmamis(v.gonderimler.filter((x) => !x.okundu).length); }
    catch { setL([]); } finally { setYenileniyor(false); }
  }, [p.id, okunmamis]);
  useEffect(() => { getir(); const t = setInterval(getir, 15000); return () => clearInterval(t); }, [getir]);

  const formlar = useMemo(() => [...new Set((l ?? []).map((x) => x.form))], [l]);
  const gorunen = (l ?? []).filter((x) => form === "hepsi" || x.form === form);
  const ac = gorunen.find((x) => x.id === secili) ?? null;
  const formVar = Object.values(p.dosyalar).some((d) => d.includes("data-vayra-form"));

  const isle = async (g: { okundu?: string[]; sil?: string[] }) => {
    const v = await api<{ gonderimler: FormGonderimi[] }>(`/api/build/form/${p.id}`, { method: "PATCH", govde: g });
    setL(v.gonderimler); okunmamis(v.gonderimler.filter((x) => !x.okundu).length);
  };
  const csv = () => {
    const anahtarlar = [...new Set(gorunen.flatMap((x) => Object.keys(x.alanlar)))];
    const kac = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const satirlar = [["Tarih", "Form", "Sayfa", ...anahtarlar].map(kac).join(","), ...gorunen.map((x) => [tarih(x.zaman), x.form, x.sayfa, ...anahtarlar.map((a) => x.alanlar[a] ?? "")].map(kac).join(","))];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + satirlar.join("\n")], { type: "text/csv;charset=utf-8" }));
    a.download = `${p.ayarlar.altAlan}-${form === "hepsi" ? "formlar" : form}.csv`; a.click();
  };

  if (l === null) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-white/[0.06] px-3">
        <p className="flex items-center gap-2 text-[13.5px] font-semibold text-white"><Inbox className="h-4 w-4 text-white/55" />Gelen kutusu</p>
        <span className="text-[12px] text-white/40">{l.length} gönderim</span>
        <span className="ml-auto" />
        {formlar.length > 1 && (
          <div className="flex rounded-full bg-white/[0.05] p-0.5">
            {["hepsi", ...formlar].map((f) => <button key={f} type="button" onClick={() => setForm(f)} className={cn("h-7 rounded-full px-2.5 text-[12px]", form === f ? "bg-white text-black" : "text-white/60 hover:text-white")}>{f === "hepsi" ? "Hepsi" : f}</button>)}
          </div>
        )}
        <button type="button" title="Yenile" onClick={getir} className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white"><RotateCw className={cn("h-3.5 w-3.5", yenileniyor && "animate-spin")} /></button>
        <button type="button" onClick={csv} disabled={!gorunen.length} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12.5px] text-white ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.12] disabled:opacity-30"><Download className="h-3.5 w-3.5" />CSV</button>
      </div>
      {!l.length ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-[14px] bg-white/[0.05]"><Mail className="h-5 w-5 text-white/50" /></span>
          <p className="text-[14.5px] text-white/80">Henüz gönderim yok</p>
          <p className="mt-1 max-w-[380px] text-[13px] leading-relaxed text-white/45">{formVar ? "Sitedeki formlar doldurulduğunda gönderimler burada görünür. Önizlemede formu doldurup deneyebilirsin." : "Projede henüz form yok. Ajana \"iletişim formu ekle\" ya da \"rezervasyon formu ekle\" diyebilirsin; gönderimler buraya düşer."}</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <div className="w-[300px] shrink-0 overflow-y-auto border-r border-white/[0.06] [scrollbar-width:thin] max-md:w-full">
            {gorunen.map((x) => {
              const ilk = Object.entries(x.alanlar)[0];
              return (
                <button key={x.id} type="button" onClick={() => { setSecili(x.id); if (!x.okundu) isle({ okundu: [x.id] }); }} className={cn("flex w-full items-start gap-2.5 border-b border-white/[0.04] px-3.5 py-3 text-left transition-colors", secili === x.id ? "bg-white/[0.06]" : "hover:bg-white/[0.03]")}>
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", x.okundu ? "bg-transparent" : "bg-[#55d6fd]")} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2"><span className={cn("truncate text-[13px]", x.okundu ? "text-white/70" : "font-semibold text-white")}>{ilk?.[1] || x.form}</span><span className="shrink-0 text-[11px] text-white/35">{tarih(x.zaman)}</span></span>
                    <span className="block truncate text-[12px] text-white/45">{x.form} · {x.sayfa}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="min-w-0 flex-1 overflow-y-auto p-5 max-md:hidden">
            {ac ? (
              <div>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div><p className="text-[16px] font-semibold text-white">{ac.form}</p><p className="text-[12.5px] text-white/45">{tarih(ac.zaman)} · {ac.sayfa}</p></div>
                  <button type="button" onClick={() => { isle({ sil: [ac.id] }); setSecili(null); }} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white/70 hover:bg-rose-500/15 hover:text-rose-200"><Trash2 className="h-3.5 w-3.5" />Sil</button>
                </div>
                <dl className="divide-y divide-white/[0.05] overflow-hidden rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
                  {Object.entries(ac.alanlar).map(([a, d]) => (
                    <div key={a} className="grid grid-cols-[140px_1fr] gap-3 px-4 py-3 text-[13px]"><dt className="text-white/45">{a}</dt><dd className="whitespace-pre-wrap break-words text-white/85">{d || "boş"}</dd></div>
                  ))}
                </dl>
              </div>
            ) : <p className="pt-10 text-center text-[13px] text-white/40">Ayrıntısını görmek için bir gönderim seç</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export type VeriBolum = "gelen" | "veritabani" | "uyeler" | "ziyaretci";
const yay = { type: "spring" as const, stiffness: 460, damping: 38 };

/** Veriler: gelen kutusu (formlar), veritabanı (Vayra Veri tabloları), ziyaretçiler (çerezsiz analitik). */
export function VerilerSekme({ k, okunmamis, bolum, setBolum, yayinla }: { k: ProjeKanca; okunmamis: (n: number) => void; bolum: VeriBolum; setBolum: (b: VeriBolum) => void; yayinla: () => void }) {
  const p = k.proje as Proje;
  const B: { id: VeriBolum; ad: string; ikon: typeof Inbox }[] = [{ id: "gelen", ad: "Gelen kutusu", ikon: Inbox }, { id: "veritabani", ad: "Veritabanı", ikon: Database }, { id: "uyeler", ad: "Üyeler", ikon: Users }, { id: "ziyaretci", ad: "Ziyaretçiler", ikon: BarChart3 }];
  return (
    <div className="flex h-full min-h-0 max-md:flex-col">
      <LayoutGroup id="veri-bolum">
        <nav className="w-[190px] shrink-0 space-y-0.5 border-r border-white/[0.06] p-2 max-md:flex max-md:w-full max-md:gap-1 max-md:space-y-0 max-md:overflow-x-auto max-md:border-b max-md:border-r-0 [scrollbar-width:none]">
          {B.map((b) => (
            <button key={b.id} type="button" onClick={() => setBolum(b.id)} className={cn("relative flex w-full items-center gap-2.5 rounded-[11px] px-3 py-2 text-left text-[13px] transition-colors max-md:w-auto max-md:shrink-0 max-md:whitespace-nowrap", bolum === b.id ? "text-white" : "text-white/55 hover:text-white")}>
              {bolum === b.id && <motion.span layoutId="veri-bolum-z" transition={yay} className="absolute inset-0 rounded-[11px] bg-white/[0.08]" />}
              <b.ikon className="relative h-4 w-4 shrink-0" /><span className="relative">{b.ad}</span>
            </button>
          ))}
        </nav>
      </LayoutGroup>
      <div className="min-h-0 min-w-0 flex-1">
        {bolum === "gelen" ? <GelenKutusu k={k} okunmamis={okunmamis} /> : bolum === "veritabani" ? <Veritabani p={p} /> : bolum === "uyeler" ? <div className="h-full overflow-y-auto p-4 [scrollbar-width:thin] sm:p-5"><Uyeler p={p} /></div> : <Analitik p={p} yayinla={yayinla} />}
      </div>
    </div>
  );
}
