"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { ModalKabuk } from "@/components/panel/ModalKabuk";
import type { Proje } from "@/store/useSinema";
import { YanPanel } from "@/components/panel/proje/calisma/YanPanel";
import { MacKlasor } from "@/components/panel/proje/calisma/ortak";
import { OzelGirdi } from "@/components/film/ortak";

const TURLER = [
  { tur: "Genel", img: "" },
  { tur: "Kısa film", img: "/gercek/galeri/sinematik6.webp" },
  { tur: "Reklam", img: "/gercek/galeri/urun3.webp" },
  { tur: "Müzik videosu", img: "/gercek/sinema/ps-rapflex.webp" },
  { tur: "Karakter", img: "/gercek/element/nova-on.webp" },
  { tur: "Belgesel", img: "/gercek/galeri/manzara4.webp" },
];
const RENKLER = ["#55d6fd", "#a78bfa", "#f472b6", "#fb923c", "#facc15", "#4ade80", "#38bdf8", "#f87171"];

const KUTU = "overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]";
const KUTU_ZEMIN = { background: "rgba(255,255,255,0.035)" };
const KUTU_SERIT = "flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-2.5 text-[13px] font-semibold text-white";

/** Yeni proje: ortada pencere değil, sağdan açılan panel. Canlı önizleme + ad + tür (Özel dahil) + renk. */
export function YeniProjeModal({ baslangic, onKapat, onOlustur }: { baslangic: { tur?: string; renk?: string; ad?: string }; onKapat: () => void; onOlustur: (ad: string, tur: string, renk: string) => void }) {
  const [ad, setAd] = useState(baslangic.ad ?? "");
  const [tur, setTur] = useState(baslangic.tur ?? "Genel");
  const [renk, setRenk] = useState(baslangic.renk ?? RENKLER[0]);
  const listede = TURLER.some((t) => t.tur === tur);
  const [ozel, setOzel] = useState(listede ? "" : tur);
  const gonder = () => onOlustur(ad.trim() || (tur === "Genel" ? "Yeni proje" : tur), tur, renk);
  return (
    <YanPanel baslik="Yeni proje" ust="Projeler" onKapat={onKapat} genislik={460}
      alt={<>
        <button onClick={onKapat} className="h-10 rounded-full px-4 text-[13.5px] text-white/70 transition hover:text-white">Vazgeç</button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={gonder} className="flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black transition hover:bg-white/90">Oluştur ve aç<ArrowRight className="h-4 w-4" /></motion.button>
      </>}>
      <div className={cn(KUTU, "flex items-center gap-3.5 p-3.5")} style={KUTU_ZEMIN}>
        <motion.span key={renk} initial={{ scale: 0.85, rotate: -4 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 420, damping: 22 }}><MacKlasor renk={renk} className="h-[46px] w-[60px]" /></motion.span>
        <span className="min-w-0 flex-1">
          <input autoFocus value={ad} onChange={(e) => setAd(e.target.value.slice(0, 60))} onKeyDown={(e) => e.key === "Enter" && gonder()} placeholder={tur === "Genel" ? "Yeni proje" : tur} aria-label="Proje adı"
            className="w-full bg-transparent text-[18px] font-semibold tracking-[-0.01em] text-white outline-none placeholder:text-white/40" />
          <span className="mt-0.5 block truncate text-[12.5px] text-white/55">{tur} · Yalnız sen · Boş proje</span>
        </span>
      </div>

      <section className={cn(KUTU, "mt-3")} style={KUTU_ZEMIN}>
        <header className={KUTU_SERIT}>Tür<span className="text-[12px] font-normal text-white/50">Projenin türü listede görünür</span></header>
        <div className="p-2.5">
          <div className="grid grid-cols-3 gap-2">
            {TURLER.map((t) => (
              <button key={t.tur} onClick={() => setTur(t.tur)} aria-pressed={tur === t.tur} className="group relative aspect-[16/11] overflow-hidden rounded-[12px] text-left transition active:scale-[0.97]">
                {t.img
                  /* eslint-disable-next-line @next/next/no-img-element */
                  ? <img src={t.img} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  : <span className="absolute inset-0 flex items-center justify-center bg-[#1a1c20]"><Folder className="mb-4 h-6 w-6 text-white/45" /></span>}
                <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <span className="absolute bottom-1.5 left-2 right-2 truncate text-[12.5px] font-semibold text-white">{t.tur}</span>
                <span className={cn("pointer-events-none absolute inset-0 rounded-[12px] ring-inset transition", tur === t.tur ? "ring-2 ring-white" : "ring-1 ring-white/[0.08] group-hover:ring-white/30")} />
              </button>
            ))}
          </div>
          <div className="mt-2 [&>div]:mb-0">
            <OzelGirdi deger={ozel} set={setOzel} secili={!listede} ph="Ör. Belgesel dizi, ürün lansmanı" alt="Listede yoksa türü yaz" uygula={() => setTur(ozel.trim())} />
          </div>
        </div>
      </section>

      <section className={cn(KUTU, "mt-3")} style={KUTU_ZEMIN}>
        <header className={KUTU_SERIT}>Renk<span className="text-[12px] font-normal text-white/50">Klasör simgesinde görünür</span></header>
        <div className="flex flex-wrap items-center gap-2.5 p-3.5">
          {RENKLER.map((r) => (
            <button key={r} onClick={() => setRenk(r)} aria-label={`Renk ${r}`} aria-pressed={renk === r}
              className={cn("h-8 w-8 rounded-full ring-offset-[3px] ring-offset-[#151618] transition active:scale-90", renk === r ? "ring-2 ring-white" : "hover:scale-110")} style={{ background: r }} />
          ))}
        </div>
      </section>
    </YanPanel>
  );
}

export function AdDuzenleModal({ proje, onKapat, onKaydet }: { proje: Proje; onKapat: () => void; onKaydet: (ad: string) => void }) {
  const [ad, setAd] = useState(proje.ad);
  useScrollKilit(true);
  useEscKapat(true, onKapat);
  const kaydet = () => onKaydet(ad.trim() || proje.ad);
  return (
    <ModalKabuk baslik="Yeniden adlandır" onKapat={onKapat}>
      <input autoFocus value={ad} onChange={(e) => setAd(e.target.value)} onFocus={(e) => e.currentTarget.select()} onKeyDown={(e) => e.key === "Enter" && kaydet()} aria-label="Proje adı"
        className="w-full rounded-[12px] bg-white/[0.05] px-3.5 py-2.5 text-[14.5px] text-metin outline-none ring-1 ring-white/[0.08] focus:ring-aksan/50" />
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onKapat} className="h-10 rounded-full px-4 text-[13.5px] text-metin-2 hover:text-white">Vazgeç</button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={kaydet} className="hf-cta h-10 rounded-full px-5 text-[13.5px] font-semibold">Kaydet</motion.button>
      </div>
    </ModalKabuk>
  );
}
