"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownWideNarrow, Check, ChevronDown, Search, Shapes, X } from "lucide-react";
import { MODELLER, type ModelTur } from "@/lib/catalog";
import { useApiAnahtar } from "@/store/useApiAnahtar";
import { TUR_ADI } from "@/lib/api/sema";
import { ModelKarti } from "@/components/api/ModelKarti";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { Yuzen } from "@/components/ui/Yuzen";
import { BosDurum, SayfaBaslik, SecimSerit } from "@/components/api/ui";
import { cn } from "@/lib/utils";

const TURLER: ModelTur[] = ["gorsel", "video", "ses", "muzik", "3d"];
type Sira = "onerilen" | "ucuz" | "pahali" | "ad";
const SIRA_AD: Record<Sira, string> = { onerilen: "Önerilen", ucuz: "En uygun", pahali: "En yüksek kalite", ad: "Ada göre" };

function Acilir({ etiket, ikon, children, acik, setAcik }: { etiket: React.ReactNode; ikon?: React.ReactNode; children: React.ReactNode; acik: boolean; setAcik: (v: boolean) => void }) {
  return (
    <div className="relative">
      <button onClick={() => setAcik(!acik)} aria-expanded={acik} className="flex h-10 items-center gap-2 rounded-full bg-white/[0.045] pl-3 pr-2.5 text-[13px] font-medium text-white ring-1 ring-white/[0.09] transition hover:ring-white/[0.18] active:scale-[0.98]">
        {ikon}{etiket}<ChevronDown className={cn("h-3.5 w-3.5 text-white/55 transition-transform", acik && "rotate-180")} />
      </button>
      <Yuzen acik={acik} onKapat={() => setAcik(false)} sag={0} alt="tam" bosluk={6} className="max-h-[360px] w-[240px] overflow-y-auto rounded-[18px] bg-[#17181b] p-1.5 ring-1 ring-white/[0.1]">
        {children}
      </Yuzen>
    </div>
  );
}

export default function ModellerSayfasi() {
  const uretimler = useApiAnahtar((s) => s.uretimler);
  const [q, setQ] = useState("");
  const [tur, setTur] = useState<ModelTur | "tumu">("tumu");
  const [saglayici, setSaglayici] = useState("tumu");
  const [sira, setSira] = useState<Sira>("onerilen");
  const [menu, setMenu] = useState<"saglayici" | "sira" | null>(null);
  const saglayicilar = Array.from(new Set(MODELLER.map((m) => m.saglayici))).sort((a, b) => a.localeCompare(b, "tr"));

  const liste = useMemo(() => {
    const s = q.trim().toLocaleLowerCase("tr");
    const l = MODELLER.filter((m) => (tur === "tumu" || m.tur === tur) && (saglayici === "tumu" || m.saglayici === saglayici)
      && (!s || `${m.ad} ${m.id} ${m.saglayici} ${m.aciklama} ${m.yetenekler.join(" ")}`.toLocaleLowerCase("tr").includes(s)));
    if (sira === "ucuz") l.sort((a, b) => a.kredi - b.kredi);
    if (sira === "pahali") l.sort((a, b) => b.kredi - a.kredi);
    if (sira === "ad") l.sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
    return l;
  }, [q, tur, saglayici, sira]);

  const ornekModel = (sag: string) => MODELLER.find((m) => m.saglayici === sag)!;

  return (
    <>
      <SayfaBaslik baslik="Modeller" aciklama={<>Her model aynı uç noktadan çağrılır: <code className="font-mono text-[13px] text-white/85">POST /v1/generations</code>. Bir modele tıkla; oyun alanında dene, şemasını incele, kodunu kopyala.</>} />
      <div className="mb-6 flex flex-wrap items-center gap-2.5">
        <label className="flex h-10 w-full items-center gap-2 rounded-full bg-white/[0.045] px-3.5 ring-1 ring-white/[0.09] transition focus-within:ring-[#55d6fd]/55 hover:ring-white/[0.16] sm:w-[280px]">
          <Search className="h-4 w-4 shrink-0 text-white/55" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Model, sağlayıcı, yetenek ara" aria-label="Model ara" className="h-full min-w-0 flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/40" />
          <AnimatePresence>{q && <motion.button initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} onClick={() => setQ("")} aria-label="Aramayı temizle" className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.08] text-white/70 hover:text-white"><X className="h-3 w-3" /></motion.button>}</AnimatePresence>
        </label>
        <div className="-mx-4 max-w-[calc(100%+32px)] overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:max-w-full sm:px-0">
          <SecimSerit id="mdl-tur" className="flex-nowrap" deger={tur} onDegis={setTur}
            secenek={(["tumu", ...TURLER] as const).map((t) => {
              const n = t === "tumu" ? MODELLER.length : MODELLER.filter((m) => m.tur === t).length;
              return { id: t, ad: <>{t === "tumu" ? "Tümü" : TUR_ADI[t]}<span className={cn("ml-1.5 tabular-nums", tur === t ? "text-black/50" : "text-white/40")}>{n}</span></> };
            })} />
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <Acilir acik={menu === "saglayici"} setAcik={(v) => setMenu(v ? "saglayici" : null)}
            ikon={saglayici !== "tumu" ? <ModelLogo ad={`${ornekModel(saglayici).ad} ${saglayici}`} boyut={15} /> : undefined}
            etiket={saglayici === "tumu" ? "Tüm sağlayıcılar" : saglayici}>
            {["tumu", ...saglayicilar].map((sg) => (
              <button key={sg} onClick={() => { setSaglayici(sg); setMenu(null); }} className="flex w-full items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-left text-[13px] text-white transition hover:bg-white/[0.06]">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">{sg === "tumu" ? <Shapes className="h-3.5 w-3.5 text-white/70" /> : <ModelLogo ad={`${ornekModel(sg).ad} ${sg}`} boyut={15} />}</span>
                <span className="min-w-0 flex-1 truncate">{sg === "tumu" ? "Tüm sağlayıcılar" : sg}</span>
                <span className="text-[12px] tabular-nums text-white/45">{sg === "tumu" ? MODELLER.length : MODELLER.filter((m) => m.saglayici === sg).length}</span>
                {saglayici === sg && <Check className="h-3.5 w-3.5 text-[#55d6fd]" />}
              </button>
            ))}
          </Acilir>
          <Acilir acik={menu === "sira"} setAcik={(v) => setMenu(v ? "sira" : null)} ikon={<ArrowDownWideNarrow className="h-3.5 w-3.5 text-white/60" />} etiket={SIRA_AD[sira]}>
            {(Object.keys(SIRA_AD) as Sira[]).map((k) => (
              <button key={k} onClick={() => { setSira(k); setMenu(null); }} className="flex w-full items-center justify-between rounded-[12px] px-3 py-2.5 text-left text-[13px] text-white transition hover:bg-white/[0.06]">
                {SIRA_AD[k]}{sira === k && <Check className="h-3.5 w-3.5 text-[#55d6fd]" />}
              </button>
            ))}
          </Acilir>
        </div>
      </div>
      {liste.length ? (
        <motion.div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {liste.map((m, i) => <ModelKarti key={m.id} m={m} i={i} istek={uretimler.filter((u) => u.model === m.id).length} />)}
          </AnimatePresence>
        </motion.div>
      ) : (
        <BosDurum ikon={Shapes} baslik="Eşleşen model yok" aciklama="Aramayı ya da süzgeçleri değiştir." />
      )}
    </>
  );
}
