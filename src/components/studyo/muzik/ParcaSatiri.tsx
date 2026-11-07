"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  AlertTriangle, ChevronLeft, ChevronRight, Clock, Download, FolderInput, GitBranch, Layers, ListMusic, Loader2, Mic, MoreHorizontal, Piano, Quote, RefreshCw, RotateCcw, Star, Trash2, XCircle,
} from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { useProjeler } from "@/store/useProjeler";
import { IndirDugmesi } from "@/components/galeri/IndirMenusu";
import { KlasoreTasiListesi } from "@/components/galeri/Klasorler";
import { cn } from "@/lib/utils";
import { Yuzen } from "@/components/ui/Yuzen";
import { ModelLogo } from "@/components/kitaplik/Simgeler";

import { goreliZaman } from "@/components/studyo/ses/ortak";
import { sureBicim, type Parca } from "@/store/useMuzik";
import { istemdenStiller, stilEtiketi } from "@/lib/muzikVeri";
import { sesCalici, useCalici } from "@/lib/sesCalici";
import { CalanCubuklar, Kapak, KapakOynat, parcaKaynagi } from "./ortak";

/** Parçayı çalar ya da duraklatır (demo sesi gerekiyorsa önce sentezler). */
export async function parcaCal(p: Parca) {
  const d = sesCalici.durum();
  if (d.id === p.id && d.calisiyor) return sesCalici.duraklat();
  const k = await parcaKaynagi(p);
  if (k) void sesCalici.cal(p.id, k);
}

export type ParcaEylemleri = {
  onAc: () => void; onBegen: () => void; onIndir: () => void; onYenidenKullan: () => void;
  onPlan?: () => void; onVaryasyon: () => void; onStem?: () => void; onSil: () => void; onYenidenDene?: () => void;
};

/** Model adının kısa hali: "Eleven Music v2.5" → "Eleven v2.5". */
export const modelKisa = (m: string) => m.replace(/^Eleven Music\s*/i, "Eleven ").replace(/^Google\s*/i, "").trim() || m;
/** Türetme etiketi (yeni değilse). */
export const turetmeAdi = (p: Parca) => (p.turetme === "duzenle" ? "Düzenleme" : p.turetme === "remix" ? "Varyasyon" : p.turetme === "uzat" ? "Uzatma" : null);

/** Eylem menüsü (satır, panel ve çubukta ortak): ikon kutulu satırlar, en altta sil. */
export function ParcaMenusu({ p, e, acik, onKapat, yerlesim = "alt-sag" }: {
  p: Parca; e: ParcaEylemleri; acik: boolean; onKapat: () => void; yerlesim?: "alt-sag" | "ust-sol" | "alt-sol";
}) {
  const bitti = p.durum === "tamam";
  const [klasorGor, setKlasorGor] = useState(false);
  const kapat = () => { setKlasorGor(false); onKapat(); };
  const ogeler = ([
    [ListMusic, "Ayarları yeniden kullan", "Formu bu şarkıyla doldur", e.onYenidenKullan, true, "cyan"],
    [GitBranch, "Bölümleri düzenle", "Yapı, süre ve sözler", e.onPlan, !!e.onPlan && bitti, "gok"],
    [RefreshCw, "Varyasyon üret", "Aynı ayarlarla yeni sürüm", e.onVaryasyon, bitti, "mor"],
    [Layers, "Kanallara ayır", "Vokal, davul, bas, diğer", e.onStem, !!e.onStem && bitti, "kehribar"],
    [Download, "İndir", p.sesUrl ? "Ses dosyası" : "Örnek WAV", e.onIndir, bitti, "yesil"],
  ] as const).filter((o) => o[4]);
  return (
    <AnimatePresence>
      <Yuzen acik={acik} onKapat={kapat} yerlesim={yerlesim} bosluk={6} etiket="Şarkı eylemleri" className="galeri-cam w-[260px] rounded-[16px] border border-white/[0.09] p-1.5">
        {klasorGor && p.uretimId ? (
          <>
            <button onClick={() => setKlasorGor(false)} className="flex items-center gap-1.5 px-2 pb-0.5 pt-1 text-[12.5px] font-medium text-metin-2 hover:text-metin"><ChevronLeft className="h-3.5 w-3.5" />Geri</button>
            <KlasoreTasiListesi uretimIdler={[p.uretimId]} onBitti={kapat} />
          </>
        ) : (<>
        {ogeler.map(([I, ad, alt, fn, , renk]) => (
          <button key={ad} onClick={() => { onKapat(); fn?.(); }} className="flex w-full items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left transition-colors hover:bg-white/[0.075]">
            <I className="h-4 w-4 shrink-0 text-metin-2" />
            <span className="min-w-0"><span className="block text-[13px] font-medium text-metin">{ad}</span><span className="block truncate text-[11px] text-metin-3">{alt}</span></span>
          </button>
        ))}
        {bitti && p.uretimId && (
          <button onClick={() => setKlasorGor(true)} className="flex w-full items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left transition-colors hover:bg-white/[0.075]">
            <FolderInput className="h-4 w-4 shrink-0 text-metin-2" />
            <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-metin">Klasöre taşı</span><span className="block truncate text-[11px] text-metin-3">Kitaplıkta düzenle</span></span>
            <ChevronRight className="h-3.5 w-3.5 text-metin-2" />
          </button>
        )}
        <div className="my-1 h-px bg-white/8" />
        <button onClick={() => { onKapat(); e.onSil(); }} className="flex w-full items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left transition-colors hover:bg-rose-500/10">
          <Trash2 className="h-4 w-4 shrink-0 text-rose-300" />
          <span className="text-[13px] font-medium text-rose-300">Sil</span>
        </button>
        </>)}
      </Yuzen>
    </AnimatePresence>
  );
}

const cip = "inline-flex shrink-0 items-center gap-1 text-[12px] text-metin-3";
// Dokunmatikte eylemler hep görünür; farede satırın üzerine gelince.
const gizliEylem = "opacity-0 focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100";
const ikonDugme = "flex h-8 w-8 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/[0.085] hover:text-metin";

/**
 * Şarkı satırı — bg-white/[0.045] ring-1 ring-inset ring-white/[0.07] kart: kapak üstünde çal, ad + rozetler (varyant, sürüm, DEMO), ikonlu
 * cam çipler (model logosu, süre, vokal/enstrümantal, göreli zaman), sağda cam eylem düğmeleri.
 * Çalarken kart camgöbeği halkalanır ve altında ilerleme çizgisi akar.
 */
export function ParcaSatiri({ p, varyant, secili, ...e }: { p: Parca; varyant?: string; secili?: boolean } & ParcaEylemleri) {
  const cal = useCalici();
  const [menu, setMenu] = useState(false);
  /* Kitaplıktaki karşılığı: indirme menüsü (filigran, biçim) ve klasör bunun üstünden çalışır. */
  const uretim = useProjeler((s) => (p.uretimId ? s.uretimler.find((x) => x.id === p.uretimId) : undefined));
  const benim = cal.id === p.id;
  const calisiyor = benim && cal.calisiyor;
  const oran = benim && cal.toplam ? cal.an / cal.toplam : 0;
  const bitti = p.durum === "tamam";
  const demo = bitti && !p.sesUrl;
  const etiket = varyant ?? p.varyantEtiketi;
  const stiller = (p.stiller?.length ? p.stiller : istemdenStiller(p.istem)).slice(0, 3);
  const turetme = turetmeAdi(p);

  if (p.durum === "uretiliyor") return (
    <div className="bg-white/[0.045] ring-1 ring-inset ring-white/[0.07] relative flex items-center gap-3 overflow-hidden rounded-2xl p-2 pr-3" aria-busy>
      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/[0.065]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.kapak && <img src={p.kapak} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35 blur-[2px]" />}
        <span className="absolute inset-0 animate-pulse bg-[linear-gradient(135deg,rgba(255,255,255,0.02),rgba(255,255,255,0.1),rgba(255,255,255,0.02))]" />
        <Loader2 className="absolute inset-0 m-auto h-5 w-5 animate-spin text-aksan" />
      </span>
      <div className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[14.5px] font-semibold text-metin">{p.ad}</span>
          {etiket && <span className={cn(cip, "text-aksan")}>{etiket}</span>}
        </span>
        <span className="mt-2 flex items-center gap-2">
          <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
            <span className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-aksan/50 to-aksan transition-[width] duration-700" style={{ width: `${Math.max(6, p.ilerleme)}%` }} />
          </span>
          <span className="bg-white/[0.075] rounded-full px-2 py-0.5 text-[10.5px] font-semibold tabular-nums text-aksan">yüzde {Math.round(p.ilerleme)}</span>
        </span>
        <span className="mt-1.5 flex items-center gap-1 text-[11px] text-metin-3"><ModelLogo ad={p.model} boyut={11} />{modelKisa(p.model)} · besteleniyor{p.saglayici === "demo" ? " (demo)" : ""}</span>
      </div>
    </div>
  );

  return (
    <div className={cn("group relative flex items-center gap-3 overflow-hidden rounded-[16px] p-2 pr-2.5 transition-colors",
      secili ? "bg-white/[0.085] ring-2 ring-inset ring-white" : benim ? "bg-white/[0.055]" : "hover:bg-white/[0.055]")}>
      <button onClick={() => (bitti ? void parcaCal(p) : undefined)} disabled={!bitti} aria-label={calisiyor ? `${p.ad} duraklat` : `${p.ad} çal`} className="group/k relative shrink-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-aksan">
        <Kapak src={p.kapak} boyut={56} yuvarlak={12} aktif={calisiyor}>
          {bitti ? <KapakOynat calisiyor={calisiyor} /> : (
            <span className="absolute inset-0 flex items-center justify-center bg-black/60"><XCircle className="h-5 w-5 text-rose-300" /></span>
          )}
        </Kapak>
        
      </button>

      <button onClick={e.onAc} className="min-w-0 flex-1 text-left outline-none">
        <span className="flex items-center gap-1.5">
          {calisiyor && <CalanCubuklar className="shrink-0" />}
          <span className={cn("min-w-0 truncate text-[14.5px] font-semibold leading-snug", benim ? "text-aksan" : "text-metin")}>{p.ad}</span>
          {etiket && <span className="rounded-full bg-aksan/15 px-1.5 py-px text-[11px] font-semibold text-aksan" title="Varyant">{etiket}</span>}
          {(p.surum > 1 || turetme) && <span className={cip} title={turetme ?? "Sürüm"}><GitBranch className="h-2.5 w-2.5" />v{p.surum}</span>}
        </span>
        {p.durum === "hata" ? (
          <span className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[11.5px]">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-rose-500/12 text-rose-300 ring-1 ring-inset ring-rose-400/25"><AlertTriangle className="h-3 w-3" /></span>
            <span className="truncate text-rose-200/90" title={p.hata}>{p.hata ?? "Üretim başarısız"}</span>
            <span className="shrink-0 text-metin-3">· {p.kredi ? "kredi iade edildi" : "kredi düşmedi"}</span>
          </span>
        ) : (
          <span className="mt-1 flex min-w-0 items-center gap-x-2.5 overflow-hidden">
            <span className={cip}><ModelLogo ad={p.model} boyut={11} />{modelKisa(p.model)}</span>
            <span className={cn(cip, "tabular-nums")}><Clock className="h-2.5 w-2.5" />{benim && cal.toplam ? sureBicim(cal.toplam) : sureBicim(p.sure)}</span>
            <span className={cip}>{p.enstrumantal ? <Piano className="h-2.5 w-2.5" /> : <Mic className="h-2.5 w-2.5" />}{p.enstrumantal ? "Enstrümantal" : "Vokal"}</span>
            {stiller.map((s) => <span key={s} className={cn(cip, "hidden text-metin-3 xl:inline-flex")}>{stilEtiketi(s)}</span>)}
          </span>
        )}
      </button>

      <div className="flex shrink-0 items-center gap-1">
        <span className="mr-1 hidden text-right text-[11px] tabular-nums text-metin-3 sm:block">{goreliZaman(p.olusturma)}</span>
        {p.durum === "hata" && e.onYenidenDene && (
          <button onClick={e.onYenidenDene} className="bg-white/[0.12] flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium text-aksan"><RotateCcw className="h-3.5 w-3.5" /> Tekrar dene</button>
        )}
        {bitti && (
          <>
            <Tooltip label={p.begeni === 1 ? "Favorilerden çıkar" : "Favorilere ekle"} side="top">
              <button onClick={e.onBegen} aria-pressed={p.begeni === 1} aria-label={p.begeni === 1 ? "Favorilerden çıkar" : "Favorilere ekle"}
                className={cn(ikonDugme, p.begeni === 1 ? "!text-aksan" : gizliEylem)}>
                <Star className={cn("h-3.5 w-3.5", p.begeni === 1 && "fill-current")} />
              </button>
            </Tooltip>
            {uretim && p.sesUrl ? (
              <span className={cn("hidden sm:flex", gizliEylem)}><IndirDugmesi u={uretim} side="top" className={ikonDugme} ikonSinif="h-3.5 w-3.5" /></span>
            ) : (
              <Tooltip label="İndir" side="top"><button onClick={e.onIndir} aria-label="İndir" className={cn(ikonDugme, "hidden sm:flex", gizliEylem)}><Download className="h-3.5 w-3.5" /></button></Tooltip>
            )}
            <Tooltip label="Yeniden kullan" side="top">
              <button onClick={e.onYenidenKullan} aria-label="Yeniden kullan" className={cn(ikonDugme, "hidden sm:flex", gizliEylem)}><Quote className="h-3.5 w-3.5" /></button>
            </Tooltip>
          </>
        )}
        <div className="relative">
          <Tooltip label="Daha fazla" side="top"><button onClick={() => setMenu((v) => !v)} aria-expanded={menu} aria-label="Daha fazla" className={cn(ikonDugme, !menu && gizliEylem, menu && "text-aksan ring-1 ring-aksan")}><MoreHorizontal className="h-4 w-4" /></button></Tooltip>
          <ParcaMenusu p={p} e={e} acik={menu} onKapat={() => setMenu(false)} />
        </div>
      </div>

      {benim && oran > 0 && (
        <span className="pointer-events-none absolute inset-x-3 bottom-0 h-[2px] overflow-hidden rounded-full bg-white/[0.075]">
          <span className="block h-full bg-aksan" style={{ width: `${oran * 100}%` }} />
        </span>
      )}
    </div>
  );
}
