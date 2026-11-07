"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ArrowLeft, GitCompare, Minus, Plus } from "lucide-react";
import { duzListe, surumFarki, type Adim, type Tetikleyici } from "@/lib/build/sistemKatalog";
import { cn } from "@/lib/utils";
import { Tuval, FARK_GORUNUM, type FarkTuru, type Secim } from "./Tuval";
import { FarkListesi } from "./Paneller";
import { adimOzeti, Segment } from "./ortak";

/**
 * Görsel sürüm farkı: iki sürümün tuvali yan yana (dar ekranda sekmeyle). Eskide silinen, yenide eklenen adımlar,
 * iki tarafta da değişen ve taşınan adımlar renkli kenar ve etiketle işaretlenir; karta basınca ayrıntı sağ panelde.
 */
type Akis = { tetikler: Tetikleyici[]; adimlar: Adim[] };
const anlam = (a: Adim) => JSON.stringify([a.ad, a.ayar, a.hata, a.tekrar ?? null, a.kosullar ?? null, a.baglac ?? null, (a.dallar ?? []).map((d) => [d.ad, d.aciklama, d.kosullar, d.baglac]), a.alanlar ?? null, !!a.kapali, a.hataSonrasi ?? null]);

export function farkHaritasi(eski: Akis, yeni: Akis): { eski: Map<string, FarkTuru>; yeni: Map<string, FarkTuru>; sayi: Record<FarkTuru, number> } {
  const de = duzListe(eski.adimlar), dy = duzListe(yeni.adimlar);
  const me = new Map(de.map((x) => [x.a.id, x])), my = new Map(dy.map((x) => [x.a.id, x]));
  const E = new Map<string, FarkTuru>(), Y = new Map<string, FarkTuru>();
  const sira = (l: typeof de, x: (typeof de)[number]) => l.filter((z) => z.ebeveyn === x.ebeveyn && z.kol === x.kol).findIndex((z) => z.a.id === x.a.id);
  for (const x of dy) {
    const e = me.get(x.a.id);
    if (!e) { Y.set(x.a.id, "eklendi"); continue; }
    if (anlam(e.a) !== anlam(x.a)) { Y.set(x.a.id, "degisti"); E.set(x.a.id, "degisti"); }
    else if (e.ebeveyn !== x.ebeveyn || e.kol !== x.kol || sira(de, e) !== sira(dy, x)) { Y.set(x.a.id, "tasindi"); E.set(x.a.id, "tasindi"); }
  }
  for (const x of de) if (!my.has(x.a.id)) E.set(x.a.id, "silindi");
  const sayi = { eklendi: 0, silindi: 0, degisti: 0, tasindi: 0 } as Record<FarkTuru, number>;
  for (const v of Y.values()) if (v === "eklendi" || v === "degisti" || v === "tasindi") sayi[v]++;
  for (const v of E.values()) if (v === "silindi") sayi.silindi++;
  return { eski: E, yeni: Y, sayi };
}

function Taraf({ ad, akis, fark, secim, sec, olcek, tetikFark }: { ad: string; akis: Akis; fark: Map<string, FarkTuru>; secim: Secim; sec: (s: Secim) => void; olcek: number; tetikFark: boolean }) {
  const numara = useMemo(() => new Map(duzListe(akis.adimlar).map((x) => [x.a.id, x.no])), [akis]);
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-[22px] bg-white/[0.02] ring-1 ring-inset ring-white/[0.07]">
      <p className="flex shrink-0 items-center gap-2 border-b border-white/[0.06] px-4 py-2.5 text-[13px] font-semibold text-white">{ad}<span className="ml-auto text-[11.5px] font-normal text-white/45">{akis.adimlar.length ? `${duzListe(akis.adimlar).length} adım` : "Adım yok"}</span></p>
      <div className="min-h-0 flex-1 overflow-auto [scrollbar-width:thin]">
        <div style={{ zoom: olcek }}><Tuval tetikler={akis.tetikler} adimlar={akis.adimlar} secim={secim} sec={sec} ozet={(a) => adimOzeti(a)} numara={numara} fark={(id) => fark.get(id)} tetikFark={tetikFark} /></div>
      </div>
    </div>
  );
}

export function SurumKarsilastir({ a, b, aAd, bAd, kapat }: { a: Akis; b: Akis; aAd: string; bAd: string; kapat: () => void }) {
  const h = useMemo(() => farkHaritasi(a, b), [a, b]);
  const satirlar = useMemo(() => surumFarki(a, b), [a, b]);
  const tetikDegisti = useMemo(() => JSON.stringify(a.tetikler.map(({ id: _i, ...x }) => x)) !== JSON.stringify(b.tetikler.map(({ id: _i, ...x }) => x)), [a, b]);
  const [secim, setSecim] = useState<Secim>(null);
  const [olcek, setOlcek] = useState(0.85);
  const [mobil, setMobil] = useState<"a" | "b">("b");
  const secili = secim?.tur === "adim" ? duzListe([...b.adimlar]).find((x) => x.a.id === secim.id)?.a ?? duzListe(a.adimlar).find((x) => x.a.id === secim.id)?.a : undefined;
  const seciliSatir = secili ? satirlar.filter((x) => x.ad === secili.ad) : [];
  if (typeof document === "undefined") return null;
  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] flex flex-col bg-[#0b0b0c]" role="region" aria-label="Görsel sürüm farkı">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/[0.07] px-3 py-2.5 sm:px-5">
        <button type="button" onClick={kapat} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-white/75 hover:bg-white/[0.06]"><ArrowLeft className="h-4 w-4" />Sürümlere dön</button>
        <p className="flex min-w-0 items-center gap-2 text-[14px] font-semibold text-white"><GitCompare className="h-4 w-4 text-[#8be6ff]" /><span className="truncate">{aAd} ile {bAd}</span></p>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          {(Object.keys(FARK_GORUNUM) as FarkTuru[]).map((k) => <span key={k} className="flex items-center gap-1.5 rounded-full bg-white/[0.04] px-2.5 py-1 text-[11.5px] text-white/70"><span className={cn("h-2 w-2 rounded-full", FARK_GORUNUM[k].nokta)} />{FARK_GORUNUM[k].ad} {h.sayi[k]}</span>)}
          <span className="ml-1 hidden items-center gap-1 sm:flex"><button type="button" onClick={() => setOlcek((x) => Math.max(0.5, Math.round((x - 0.1) * 10) / 10))} aria-label="Uzaklaştır" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/75"><Minus className="h-3.5 w-3.5" /></button><span className="w-10 text-center text-[11.5px] tabular-nums text-white/55">{Math.round(olcek * 100)}</span><button type="button" onClick={() => setOlcek((x) => Math.min(1.2, Math.round((x + 0.1) * 10) / 10))} aria-label="Yakınlaştır" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/75"><Plus className="h-3.5 w-3.5" /></button></span>
        </div>
      </div>
      <div className="px-3 pt-2 sm:hidden"><Segment id="fark-taraf" kucuk deger={mobil} set={setMobil} l={[{ id: "a", ad: aAd }, { id: "b", ad: bAd }]} /></div>
      <div className="flex min-h-0 flex-1 gap-3 p-3 sm:p-4">
        <div className={cn("min-h-0 min-w-0 flex-1", mobil === "a" ? "flex" : "hidden sm:flex")}><Taraf ad={aAd} akis={a} fark={h.eski} secim={secim} sec={setSecim} olcek={olcek} tetikFark={tetikDegisti} /></div>
        <div className={cn("min-h-0 min-w-0 flex-1", mobil === "b" ? "flex" : "hidden sm:flex")}><Taraf ad={bAd} akis={b} fark={h.yeni} secim={secim} sec={setSecim} olcek={olcek} tetikFark={tetikDegisti} /></div>
        <aside className="hidden w-[320px] shrink-0 flex-col gap-3 overflow-y-auto rounded-[22px] bg-white/[0.02] p-3.5 ring-1 ring-inset ring-white/[0.07] lg:flex">
          <p className="text-[13px] font-semibold text-white">{secili ? secili.ad : "Değişiklikler"}</p>
          {secili ? (seciliSatir.length ? <FarkListesi l={seciliSatir} /> : <p className="text-[12.5px] text-white/50">Bu adım iki sürümde aynı.</p>) : <FarkListesi l={satirlar} />}
          {secili && <button type="button" onClick={() => setSecim(null)} className="self-start rounded-full bg-white/[0.07] px-3 py-1.5 text-[12px] text-white/80">Bütün değişiklikler</button>}
        </aside>
      </div>
      {secili && <div className="max-h-[35vh] overflow-y-auto border-t border-white/[0.07] p-3 lg:hidden">{seciliSatir.length ? <FarkListesi l={seciliSatir} /> : <p className="text-[12.5px] text-white/50">Bu adım iki sürümde aynı.</p>}</div>}
    </motion.div>,
    document.body,
  );
}
