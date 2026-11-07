"use client";

/**
 * Kitaplık sol rayı (Higgsfield / Runway / Midjourney Organize düzeni). Düzen:
 * üstte Yükle + Yeni proje; bölümler (Kitaplık, Projeler, Akıllı klasörler, Kaynaklar) aynı başlık şeridiyle,
 * satırlar aynı yükseklik ve simge sütununda; altta Çöp kutusu + cihaz depolaması tek kartta.
 * Seçim beyaz kayan zemin; projeler sürükle-bırak hedefi; genişlik sürüklenerek ayarlanır.
 */

import { useState } from "react";
import { AnimatePresence, motion, type MotionValue } from "framer-motion";
import { ChevronRight, Clock, FolderPlus, HardDrive, Star, Keyboard, LayoutGrid, Loader2, Plus, Sparkles, Trash2, Upload, X } from "lucide-react";
import { KenarTutamac } from "@/components/ui/KenarTutamac";
import { MacKlasor } from "@/components/panel/proje/calisma/ortak";
import { cn } from "@/lib/utils";

export const URETIM_SURUKLE = "application/x-vayra-uretim";
const YAY = { type: "spring", stiffness: 440, damping: 36 } as const;

export type RayProje = { id: string; ad: string; renk?: string; n: number; kapak?: string };
export type RayKaynak = { id: string; ad: string; ikon: React.ElementType; n: number };
export type RayAkilli = { id: string; ad: string; n: number };

export function KitaplikRayi({
  en, aktif, sayilar, projeler, akilli, kaynaklar, depolamaKb, yukleniyor,
  onSec, onYukle, onYeniProje, onBirak, onAkilliSil, onKisayol,
}: {
  en: MotionValue<number>; aktif: string;
  sayilar: { tumu: number; favori: number; son7: number; cop: number };
  projeler: RayProje[]; akilli: RayAkilli[]; kaynaklar: RayKaynak[]; depolamaKb: number; yukleniyor: number;
  onSec: (id: string) => void; onYukle: () => void; onYeniProje: () => void; onBirak: (projeId: string, ids: string[]) => void;
  onAkilliSil: (id: string, ad: string) => void; onKisayol: () => void;
}) {
  const [acik, setAcik] = useState({ proje: true, akilli: true, kaynak: true });
  const [hepsi, setHepsi] = useState(false);
  const [uzerinde, setUzerinde] = useState<string | null>(null);
  const depoYuzde = Math.min(100, (depolamaKb / 10240) * 100);
  const degis = (k: keyof typeof acik) => () => setAcik((x) => ({ ...x, [k]: !x[k] }));
  const yukleme = kaynaklar.find((k) => k.id === "yukleme")?.n ?? 0;
  const studyolar = kaynaklar.filter((k) => k.id !== "yukleme");
  const PROJE_SINIR = 6;
  const gorunenProjeler = hepsi ? projeler : projeler.slice(0, PROJE_SINIR);
  const s = { aktif, onSec };

  return (
    <motion.aside style={{ width: en }} aria-label="Kitaplık bölümleri"
      className="sticky top-[var(--ust-nav)] hidden h-[calc(100vh-var(--ust-nav))] shrink-0 flex-col border-r border-white/[0.06] bg-[#0f1012] lg:flex">
      <KenarTutamac en={en} anahtar="kitaplik-ray" varsayilan={264} min={220} max={380} taraf="sol" etiket="Rayın genişliği" />

      <div className="flex gap-1.5 border-b border-white/[0.06] p-3">
        <motion.button whileTap={{ scale: 0.97 }} onClick={onYukle}
          className="flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-white text-[13.5px] font-semibold text-[#0a0a0b] transition hover:bg-white/90">
          {yukleniyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{yukleniyor ? `${yukleniyor} yükleniyor` : "Yükle"}
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={onYeniProje} title="Yeni proje" aria-label="Yeni proje"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-white/85 ring-1 ring-inset ring-white/[0.08] transition hover:bg-white/[0.12] hover:text-white"><FolderPlus className="h-4 w-4" /></motion.button>
      </div>

      <nav className="min-h-0 flex-1 divide-y divide-white/[0.06] overflow-y-auto [scrollbar-width:thin]">
        <Bolum ad="Kitaplık">
          <RaySatiri {...s} id="tumu" ad="Tüm üretimler" ikon={<LayoutGrid className="h-4 w-4" />} n={sayilar.tumu} />
          <RaySatiri {...s} id="favori" ad="Favoriler" ikon={<Star className={cn("h-4 w-4", aktif === "favori" && "fill-current")} />} n={sayilar.favori} />
          <RaySatiri {...s} id="son7" ad="Son 7 gün" ikon={<Clock className="h-4 w-4" />} n={sayilar.son7} />
        </Bolum>

        <Bolum ad="Projeler" n={projeler.length} acik={acik.proje} onDegis={degis("proje")}
          eylem={<button onClick={onYeniProje} aria-label="Yeni proje" title="Yeni proje" className="flex h-6 w-6 items-center justify-center rounded-[7px] text-white/45 transition hover:bg-white/[0.08] hover:text-white"><Plus className="h-3.5 w-3.5" /></button>}>
          {gorunenProjeler.map((p) => {
            const id = `proje:${p.id}`, sec = aktif === id, hedef = uzerinde === p.id;
            return (
              <button key={p.id} onClick={() => onSec(id)} aria-current={sec ? "page" : undefined}
                onDragOver={(e) => { if (e.dataTransfer.types.includes(URETIM_SURUKLE)) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setUzerinde(p.id); } }}
                onDragLeave={() => setUzerinde((u) => (u === p.id ? null : u))}
                onDrop={(e) => { e.preventDefault(); setUzerinde(null); try { onBirak(p.id, JSON.parse(e.dataTransfer.getData(URETIM_SURUKLE))); } catch { /* geçersiz veri */ } }}
                className={cn(SATIR, sec ? "text-[#0a0a0b]" : "text-white/80 hover:bg-white/[0.05] hover:text-white", hedef && "bg-white/[0.08] ring-1 ring-inset ring-white/50")}>
                {sec && <motion.span layoutId="kitaplik-ray" transition={YAY} className="absolute inset-0 rounded-[9px] bg-white" />}
                <span className="relative flex w-5 shrink-0 justify-center"><MacKlasor renk={p.renk} kapali={!hedef} className={cn("h-[15px] w-5 transition-transform", hedef && "scale-125")} /></span>
                <span className="relative min-w-0 flex-1 truncate font-medium">{p.ad}</span>
                <Sayi sec={sec}>{hedef ? "Bırak" : p.n}</Sayi>
              </button>
            );
          })}
          {projeler.length > PROJE_SINIR && (
            <button onClick={() => setHepsi((v) => !v)} className={cn(SATIR, "text-white/50 hover:bg-white/[0.05] hover:text-white")}>
              <span className="flex w-5 justify-center"><ChevronRight className={cn("h-4 w-4 transition-transform", hepsi && "-rotate-90")} /></span>
              <span className="flex-1 font-medium">{hepsi ? "Daha az göster" : `${projeler.length - PROJE_SINIR} proje daha`}</span>
            </button>
          )}
          {!projeler.length && <BosSatir ikon={<FolderPlus className="h-4 w-4" />} metin="İlk projeni oluştur" onClick={onYeniProje} />}
        </Bolum>

        <Bolum ad="Akıllı klasörler" n={akilli.length} acik={acik.akilli} onDegis={degis("akilli")}>
          {akilli.map((a) => (
            <RaySatiri key={a.id} {...s} id={`akilli:${a.id}`} ad={a.ad} ikon={<Sparkles className="h-4 w-4" />} n={a.n}
              sag={<button onClick={(e) => { e.stopPropagation(); onAkilliSil(a.id, a.ad); }} aria-label={`${a.ad} sil`} title="Akıllı klasörü sil" className="flex h-6 w-6 items-center justify-center rounded-[7px] text-white/50 hover:bg-white/[0.1] hover:text-white"><X className="h-3.5 w-3.5" /></button>} />
          ))}
          {!akilli.length && <BosSatir ikon={<Sparkles className="h-4 w-4" />} metin="Aramayı ⋯ menüsünden kaydet" />}
        </Bolum>

        <Bolum ad="Kaynaklar" n={studyolar.length + 1} acik={acik.kaynak} onDegis={degis("kaynak")}>
          <RaySatiri {...s} id="yukleme" ad="Yüklemeler" ikon={<Upload className="h-4 w-4" />} n={yukleme} />
          {studyolar.map((k) => { const I = k.ikon; return <RaySatiri key={k.id} {...s} id={k.id} ad={k.ad} ikon={<I className="h-4 w-4" />} n={k.n} />; })}
        </Bolum>
      </nav>

      <div className="border-t border-white/[0.06] p-3">
        <div className="overflow-hidden rounded-[14px] bg-white/[0.035] ring-1 ring-inset ring-white/[0.06]">
          <div className="p-1">
            <RaySatiri {...s} id="cop" ad="Çöp kutusu" ikon={<Trash2 className="h-4 w-4" />} n={sayilar.cop} />
          </div>
          <div className="border-t border-white/[0.06] px-3 pb-3 pt-2.5" title="Kitaplık bu cihazın tarayıcı depolamasında tutulur; sınır yaklaşık 10 MB.">
            <div className="flex items-center gap-1.5 text-[12px] text-white/55"><HardDrive className="h-3.5 w-3.5" />Depolama
              <span className="ml-auto tabular-nums text-white/80">{depolamaKb < 1024 ? `${depolamaKb} KB` : `${(depolamaKb / 1024).toFixed(1)} MB`}<span className="text-white/40"> / 10 MB</span></span>
            </div>
            <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
              <motion.span initial={{ width: 0 }} animate={{ width: `${Math.max(2, depoYuzde)}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className={cn("block h-full rounded-full", depoYuzde > 80 ? "bg-amber-300" : "bg-white")} />
            </span>
            <button onClick={onKisayol} className="mt-2.5 flex w-full items-center gap-1.5 text-[12px] text-white/45 transition hover:text-white">
              <Keyboard className="h-3.5 w-3.5" />Kısayollar<kbd className="ml-auto rounded-[5px] bg-white/[0.08] px-1.5 text-[11px] text-white/60">?</kbd>
            </button>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

const SATIR = "relative flex h-9 w-full items-center gap-2.5 rounded-[9px] px-2.5 text-left text-[13.5px] transition-colors active:scale-[0.99]";

function Sayi({ sec, children, gizle }: { sec: boolean; children: React.ReactNode; gizle?: boolean }) {
  return <span className={cn("relative min-w-[18px] text-right text-[12px] tabular-nums transition-opacity", sec ? "text-black/50" : "text-white/40", gizle && "group-hover/s:opacity-0")}>{children}</span>;
}

function Bolum({ ad, n, acik = true, onDegis, eylem, children }: { ad: string; n?: number; acik?: boolean; onDegis?: () => void; eylem?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="px-2 py-2.5">
      <div className="flex h-7 items-center gap-1 px-2.5">
        {onDegis ? (
          <button onClick={onDegis} aria-expanded={acik} className="group/b flex min-w-0 flex-1 items-center gap-1.5 text-[12px] font-semibold text-white/45 transition-colors hover:text-white/80">
            {ad}{n !== undefined && <span className="tabular-nums text-white/25">{n}</span>}
            <ChevronRight className={cn("h-3.5 w-3.5 opacity-0 transition group-hover/b:opacity-100", acik && "rotate-90")} />
          </button>
        ) : <span className="flex-1 text-[12px] font-semibold text-white/45">{ad}</span>}
        {eylem}
      </div>
      <AnimatePresence initial={false}>
        {acik && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="space-y-px pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function BosSatir({ ikon, metin, onClick }: { ikon: React.ReactNode; metin: string; onClick?: () => void }) {
  const ic = <><span className="flex w-5 shrink-0 justify-center">{ikon}</span><span className="min-w-0 flex-1 truncate">{metin}</span></>;
  return onClick
    ? <button onClick={onClick} className={cn(SATIR, "text-white/45 hover:bg-white/[0.05] hover:text-white")}>{ic}</button>
    : <p className={cn(SATIR, "cursor-default text-[12.5px] text-white/35 active:scale-100")}>{ic}</p>;
}

function RaySatiri({ id, ad, ikon, n, sag, aktif, onSec }: { id: string; ad: string; ikon: React.ReactNode; n?: number; sag?: React.ReactNode; aktif: string; onSec: (id: string) => void }) {
  const sec = aktif === id;
  return (
    <div className="group/s relative">
      <button onClick={() => onSec(id)} aria-current={sec ? "page" : undefined} className={cn(SATIR, sec ? "text-[#0a0a0b]" : "text-white/80 hover:bg-white/[0.05] hover:text-white")}>
        {sec && <motion.span layoutId="kitaplik-ray" transition={YAY} className="absolute inset-0 rounded-[9px] bg-white" />}
        <span className={cn("relative flex w-5 shrink-0 justify-center", sec ? "text-[#0a0a0b]" : "text-white/55 group-hover/s:text-white/85")}>{ikon}</span>
        <span className="relative min-w-0 flex-1 truncate font-medium">{ad}</span>
        {n !== undefined && <Sayi sec={sec} gizle={!!sag}>{n}</Sayi>}
      </button>
      {sag && <span className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover/s:opacity-100">{sag}</span>}
    </div>
  );
}
