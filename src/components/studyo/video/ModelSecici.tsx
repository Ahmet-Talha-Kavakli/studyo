"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MODEL_AILELERI, videoModelBul, videoModelOzellik } from "@/lib/videoModelVeri";
import { videoErisim } from "@/lib/videoSaglayici";
import { MarkaKare } from "@/components/studyo/hf";
import { KrediHap } from "@/components/ui/KrediHap";
import { kaliteSira, kapaliModeller, kullanilabilirModeller, modelHiz, modelKalite, referansSure, videoKredi } from "./veri";

/** Üç noktalı gösterge (Krea tarzı): dolu nokta = seviye. */
function Nokta({ n, etiket }: { n: number; etiket: string }) {
  return (
    <span className="flex items-center gap-1" title={`${etiket}: ${["", "düşük", "orta", "yüksek"][n]}`}>
      <span className="text-[10px] text-metin-3">{etiket}</span>
      <span className="flex gap-[3px]">{[1, 2, 3].map((i) => <span key={i} className={cn("h-[5px] w-[5px] rounded-full", i <= n ? "bg-white" : "bg-white/15")} />)}</span>
    </span>
  );
}

const SUZGECLER: [string, string][] = [["ses", "Sesli"], ["bitis", "Bitiş karesi"], ["cok", "Çok çekim"], ["hd", "1080p+"], ["uzun", "10 sn+"]];
const QHD = ["1080p", "2K", "4K"];

/** Modelin kartta gösterilen yetenekleri (sağlayıcının gerçek izinli değerlerinden). */
export function modelYetenek(ad: string) {
  const o = videoModelOzellik(ad);
  const e = videoErisim(ad);
  const enUzun = o.sureler.length ? Math.max(...o.sureler) : null;
  const enIyi = [...o.cozler].sort((x, y) => kaliteSira(y) - kaliteSira(x))[0];
  return { enUzun, enIyi, ses: o.sesToggle, bitis: o.kutu === "kareler", cok: o.cokCekim, gorselGerekli: e.durum === "gercek" && !!e.gorselGerekli };
}
const aileOzet = (ad: string) => MODEL_AILELERI.find((a) => a.varyantlar.some((v) => v.ad === ad))?.ozet ?? "";

export function ModelSecici({ model, onSec, saglayicilar, favoriler, onFavori }: {
  model: string; onSec: (ad: string) => void;
  saglayicilar: Record<string, boolean> | null;
  favoriler: string[]; onFavori: (ad: string) => void;
}) {
  const [ara, setAra] = useState("");
  const [suzgec, setSuzgec] = useState<string[]>([]);
  const [kapaliAcik, setKapaliAcik] = useState(false);
  const modeller = useMemo(() => kullanilabilirModeller(), []);
  const kapali = useMemo(() => kapaliModeller(), []);
  const q = ara.trim().toLowerCase();
  const uyar = (ad: string) => {
    if (q && !ad.toLowerCase().includes(q)) return false;
    const y = modelYetenek(ad);
    return suzgec.every((s) => (s === "ses" ? y.ses : s === "bitis" ? y.bitis : s === "cok" ? y.cok : s === "hd" ? QHD.includes(y.enIyi) : s === "uzun" ? (y.enUzun ?? 0) >= 10 : true));
  };
  const liste = modeller.filter(uyar);
  // Tüm modeller demoysa rozet her satırda tekrarlanmaz; üstte tek not gösterilir.
  const demoMu = (ad: string) => { const e = videoErisim(ad); return e.durum === "gercek" && !!saglayicilar && !saglayicilar[e.saglayici]; };
  const hepsiDemo = modeller.length > 0 && modeller.every(demoMu);
  const favListe = liste.filter((ad) => favoriler.includes(ad));
  const digerListe = liste.filter((ad) => !favoriler.includes(ad));

  const satir = (ad: string) => {
    const sec = ad === model;
    const y = modelYetenek(ad);
    const e = videoErisim(ad);
    const demo = e.durum === "gercek" && saglayicilar && !saglayicilar[e.saglayici];
    const rozet = videoModelBul(ad)?.rozet;
    const etiketler = [y.enUzun ? `${y.enUzun} sn'ye kadar` : "Süreyi model seçer", y.enIyi, y.ses && "Sesli", y.bitis && "Bitiş karesi", y.cok && "Çok çekim", y.gorselGerekli && "Yalnız görselden"].filter(Boolean) as string[];
    const fav = favoriler.includes(ad);
    return (
      <div key={ad} className={cn("group flex items-center gap-3 rounded-[12px] p-2 ring-1 ring-inset transition-colors", sec ? "bg-white/[0.07] ring-white/50" : "ring-transparent hover:bg-white/[0.04]")}>
        <button onClick={() => onSec(ad)} aria-pressed={sec} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <MarkaKare ad={ad} boyut={38} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-[13.5px] font-semibold text-metin">{ad}</span>
              {rozet === "Yeni" && <span className="shrink-0 rounded-full bg-white px-1.5 py-px text-[9.5px] font-bold text-[#0a0a0b]">Yeni</span>}
              
            </span>
            <span className="block text-[11.5px] leading-snug text-metin-3">{aileOzet(ad)}</span>
            <span className="mt-1 flex items-center gap-3"><Nokta n={modelHiz(ad)} etiket="Hız" /><Nokta n={modelKalite(ad)} etiket="Kalite" /></span>
            <span className="mt-1 flex flex-wrap gap-1">
              {etiketler.map((t) => <span key={t} className="rounded-full bg-white/[0.05] px-1.5 py-px text-[10.5px] text-metin-2 ring-1 ring-inset ring-white/[0.06]">{t}</span>)}
            </span>
          </span>
          <span className="flex shrink-0 flex-col items-end gap-1">
            {demo ? null : <KrediHap deger={videoKredi(ad, { sure: referansSure(ad) })} secili={sec} />}
            <span className="text-[10px] tabular-nums text-metin-3">{referansSure(ad)} sn'den</span>
          </span>
        </button>
        <span className="flex w-6 shrink-0 flex-col items-center">
          <button onClick={() => onFavori(ad)} aria-pressed={fav} aria-label={fav ? `${ad} favorilerden çıkar` : `${ad} favorilere ekle`}
            className={cn("flex h-5 w-5 items-center justify-center rounded-full transition-opacity", fav ? "text-amber-300" : "text-metin-3 opacity-0 hover:text-metin focus-visible:opacity-100 group-hover:opacity-100")}>
            <Star className={cn("h-3.5 w-3.5", fav && "fill-amber-300")} />
          </button>
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <Kutu baslik="Video modeli" sag={<span className="text-[11.5px] tabular-nums text-metin-3">{modeller.length} model</span>}>
        <div className="p-2">
          <label className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-metin-3" />
            <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Model ara" aria-label="Model ara" autoFocus
              className="h-9 w-full rounded-[11px] bg-white/[0.04] pl-8 pr-8 text-[13px] text-metin outline-none ring-1 ring-inset ring-white/[0.07] placeholder:text-metin-3 focus:ring-white/20" />
            {ara && <button onClick={() => setAra("")} aria-label="Aramayı temizle" className="absolute right-2 flex h-5 w-5 items-center justify-center rounded-full text-metin-3 hover:text-metin"><X className="h-3.5 w-3.5" /></button>}
          </label>
          <div className="mt-2 flex flex-wrap gap-1">
            {SUZGECLER.map(([id, ad]) => {
              const on = suzgec.includes(id);
              return (
                <button key={id} onClick={() => setSuzgec((l) => (on ? l.filter((x) => x !== id) : [...l, id]))} aria-pressed={on}
                  className={cn("h-7 rounded-full px-2.5 text-[11.5px] font-medium ring-1 ring-inset transition-colors active:scale-95", on ? "bg-white text-[#0a0a0b] ring-white" : "text-metin-2 ring-white/[0.08] hover:text-metin")}>{ad}</button>
              );
            })}
          </div>
        </div>
      </Kutu>
      {favListe.length > 0 && <Kutu baslik="Favoriler" sag={<span className="text-[11.5px] tabular-nums text-metin-3">{favListe.length}</span>}><div className="space-y-0.5 p-1.5">{favListe.map(satir)}</div></Kutu>}
      {(digerListe.length > 0 || !liste.length) && (
        <Kutu baslik={favListe.length ? "Tüm modeller" : "Modeller"} sag={<span className="text-[11.5px] tabular-nums text-metin-3">{digerListe.length}</span>}>
          <div className="space-y-0.5 p-1.5">
            {digerListe.map(satir)}
            {!liste.length && <p className="px-2 py-6 text-center text-[12.5px] text-metin-3">Bu süzgeçlere uyan model yok.</p>}
          </div>
        </Kutu>
      )}
      {kapali.length > 0 && !q && !suzgec.length && (
        <Kutu baslik="Bağlı olmayan ve kapanan" sag={
          <button onClick={() => setKapaliAcik((v) => !v)} aria-expanded={kapaliAcik} className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium text-metin-2 transition-colors hover:bg-white/[0.06] hover:text-metin">
            {kapaliAcik ? "Gizle" : `${kapali.length} model`}<ChevronDown className={cn("h-3.5 w-3.5 transition-transform", kapaliAcik && "rotate-180")} />
          </button>}>
          {kapaliAcik ? (
            <div className="space-y-0.5 p-1.5">
              {kapali.map((k) => (
                <div key={k.ad} className="flex items-center gap-3 rounded-[12px] px-2 py-1.5 opacity-60" title={k.neden}>
                  <MarkaKare ad={k.ad} boyut={28} />
                  <span className="min-w-0 flex-1"><span className="block truncate text-[12.5px] text-metin-2">{k.ad}</span><span className="block text-[11px] leading-snug text-metin-3">{k.neden}</span></span>
                  <span className={cn("shrink-0 rounded-full px-1.5 py-px text-[10.5px] font-semibold", k.durum === "kapandi" ? "bg-rose-500/15 text-rose-300" : "bg-white/10 text-metin-2")}>{k.durum === "kapandi" ? "Kapandı" : "Bağlı değil"}</span>
                </div>
              ))}
            </div>
          ) : <p className="px-3 py-2 text-[12px] text-metin-3">Erişimi kapanan ya da yakında gelecek modeller.</p>}
        </Kutu>
      )}
    </div>
  );
}

function Kutu({ baslik, sag, children }: { baslik: React.ReactNode; sag?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex min-h-[38px] items-center gap-2 border-b border-white/[0.06] px-3 py-2"><span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-metin">{baslik}</span>{sag}</div>
      {children}
    </div>
  );
}
