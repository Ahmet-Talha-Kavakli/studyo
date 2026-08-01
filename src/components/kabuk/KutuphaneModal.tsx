"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { X, Search, Check, Volume2, VolumeX, ScanText } from "lucide-react";
import { onizlemeArka, cn } from "@/lib/utils";
import { kabukArka } from "@/lib/gercekVeri";

/**
 * Higgsfield "kütüphane seçici" modalı — Marketing Setting/Style/Hook,
 * video preset seçici ve varlık seçici bunu paylaşır (HIGGSFIELD-ACILIR-PANELLER).
 * hero (aksan başlık + açıklama + kolaj) + sekmeler + arama + N sütun kart ızgarası.
 */

export type KutuphaneOge = {
  id: string;
  ad: string;
  ozet?: string;
  etiketler?: string[];  // hangi sekmelerde görünür
  tohum: string;
  kategori?: string;
  rozet?: string;
};

export function KutuphaneModal({
  acik, baslik, heroBaslik, heroOzet, sekmeler, ogeler, secili, onSec, onKapat, sutun = 4, kategori = "portre",
}: {
  acik: boolean;
  baslik: string;
  heroBaslik: string;
  heroOzet: string;
  sekmeler: string[];
  ogeler: KutuphaneOge[];
  secili?: string;
  onSec: (id: string) => void;
  onKapat: () => void;
  sutun?: number;
  kategori?: string;
}) {
  useScrollKilit(acik); // madde 10
  useEscKapat(acik, onKapat); // Escape ile kapat
  const [sekme, setSekme] = useState(sekmeler[0]);
  const [ara, setAra] = useState("");

  const liste = ogeler.filter((o) => {
    const sekmeUyum = sekme === sekmeler[0] || (o.etiketler ?? []).includes(sekme);
    const araUyum = o.ad.toLocaleLowerCase("tr").includes(ara.toLocaleLowerCase("tr"));
    return sekmeUyum && araUyum;
  });

  return (
    <AnimatePresence>
      {acik && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
            onClick={onKapat} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 14 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative flex max-h-[85vh] w-full max-w-[900px] flex-col overflow-hidden rounded-[16px] border border-kenar bg-[#131313] shadow-2xl shadow-black/60"
          >
            {/* Başlık */}
            <div className="flex items-center justify-between px-6 pt-4">
              <span className="text-[15px] font-medium">{baslik}</span>
              <button onClick={onKapat} className="flex h-8 w-8 items-center justify-center rounded-full bg-yuzey-3 text-metin-2 transition-colors hover:bg-white/10 hover:text-metin" aria-label="Kapat">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Hero */}
            <div className="flex items-center gap-6 px-6 py-5">
              <div className="min-w-0 flex-1">
                <h3 className="hf-baslik text-[24px] leading-tight text-aksan">{heroBaslik}</h3>
                <p className="mt-2 max-w-md text-[13px] text-metin-2">{heroOzet}</p>
              </div>
              <div className="relative hidden h-24 w-40 shrink-0 sm:block">
                {[0, 1, 2].map((k) => (
                  <div key={k} className="absolute h-20 w-28 overflow-hidden rounded-lg border border-white/15"
                    style={{ left: k * 22, top: k === 1 ? -4 : 6, zIndex: k === 1 ? 2 : 1, transform: `rotate(${(k - 1) * 5}deg)`, background: kabukArka(`${baslik}-kolaj-${k}`, kategori) }} />
                ))}
              </div>
            </div>

            {/* Sekmeler + arama */}
            <div className="flex items-center gap-3 border-b border-kenar px-6 pb-3">
              <div className="flex items-center gap-1.5">
                {sekmeler.map((s) => (
                  <button key={s} onClick={() => setSekme(s)}
                    className={cn("flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] transition-colors",
                      sekme === s ? "bg-white text-zemin" : "text-metin-2 hover:bg-white/6 hover:text-metin")}>
                    {s}
                    {s === "TikTok" && <span className="rounded bg-fusya px-1 text-[9px] font-bold text-white">YENİ</span>}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex h-8 w-48 items-center gap-2 rounded-full bg-yuzey-2 px-3">
                <Search className="h-3.5 w-3.5 text-metin-3" />
                <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Ara" className="w-full bg-transparent text-[13px] outline-none placeholder:text-metin-3" />
              </div>
            </div>

            {/* Kart ızgarası */}
            <div className="grid gap-3 overflow-y-auto p-6" style={{ gridTemplateColumns: `repeat(${sutun}, minmax(0, 1fr))` }}>
              {liste.map((o) => {
                const sec = secili === o.id;
                return (
                  <button key={o.id} onClick={() => { onSec(o.id); onKapat(); }} className="group text-left">
                    <div className={cn("relative aspect-[9/16] overflow-hidden rounded-xl", sec && "outline outline-2 outline-offset-[3px] outline-white")}
                      style={{ background: kabukArka(o.tohum, o.kategori ?? kategori) }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      {/* Cam aksiyon butonları */}
                      <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full glass-ikon text-white "><ScanText className="h-3 w-3" /></span>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full glass-ikon text-white "><VolumeX className="h-3 w-3" /></span>
                      </div>
                      {sec && <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-aksan text-zemin"><Check className="h-3.5 w-3.5" /></span>}
                      {o.rozet && <span className="absolute left-1.5 top-1.5 rounded bg-aksan px-1.5 py-0.5 text-[9px] font-bold text-zemin">{o.rozet}</span>}
                      <div className="absolute inset-x-0 bottom-0 p-2">
                        <div className="text-[13px] font-semibold text-white drop-shadow">{o.ad}</div>
                        {o.ozet && <div className="mt-0.5 line-clamp-2 text-[10px] text-white/70">{o.ozet}</div>}
                      </div>
                    </div>
                  </button>
                );
              })}
              {liste.length === 0 && <p className="col-span-full py-10 text-center text-sm text-metin-3">Sonuç yok</p>}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
