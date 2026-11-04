"use client";

/* Explainer paneli parçaları: başlık şeritli kart bölümü ve yerinde açılan anlatıcı listesi. */
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { SesAvatar } from "@/components/studyo/ses/ortak";
import { SESLER, type SesModel } from "@/lib/sesVeri";
import { useMuzik } from "@/store/useMuzik";
import { Segment } from "@/components/montaj/ui";

const YUZ = { background: "rgba(255,255,255,0.025)" };

/** Kart bölüm: üstte başlık şeridi (başlık + sağ öğe), altta içerik. Havada başlık kalmaz. */
export function Bolum({ baslik, sag, children, className }: { baslik?: React.ReactNode; sag?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
      className={cn("mx-3 mt-3 overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.07] last:mb-3", className)} style={YUZ}>
      {(baslik || sag) && (
        <div className="flex min-h-[44px] items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
          {baslik && <h3 className="flex-1 text-[13.5px] font-semibold text-metin">{baslik}</h3>}
          {sag}
        </div>
      )}
      <div className="space-y-3 p-4">{children}</div>
    </motion.section>
  );
}

/** Başlık şeridinin sağındaki küçük bilgi hapı. */
export const Hap = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded-full px-2.5 py-0.5 text-[11.5px] text-metin-2 ring-1 ring-inset ring-white/[0.09]">{children}</span>
);

export const sesAvatar = (x: Pick<SesModel, "ad" | "renk"> | undefined, ad: string, b = 40) => (
  <SesAvatar ad={x?.ad ?? ad} renk={x?.renk ?? "#55d6fd"} boyut={b} />
);

/** Anlatıcı seçici: ortada pencere yok; kart içinde açılır, aranır, cinsiyete göre süzülür. */
export function AnlaticiSec({ secili, onSec, alt }: { secili: string; onSec: (x: SesModel) => void; alt?: string }) {
  const [acik, setAcik] = useState(false);
  const [ara, setAra] = useState("");
  const [cins, setCins] = useState<"hepsi" | "Kadın" | "Erkek">("hepsi");
  const ozel = useMuzik((s) => s.sesler);
  const liste: SesModel[] = [...ozel.map((x): SesModel => ({ ad: x.ad, cinsiyet: x.cinsiyet === "Erkek" ? "Erkek" : "Kadın", renk: "#55d6fd", dil: "Özel ses" })), ...SESLER];
  const suz = liste.filter((x) => (cins === "hepsi" || x.cinsiyet === cins) && (!ara.trim() || x.ad.toLocaleLowerCase("tr").includes(ara.trim().toLocaleLowerCase("tr"))));
  const sec = liste.find((x) => x.ad === secili);
  return (
    <div className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.08]" style={{ background: "rgba(255,255,255,0.03)" }}>
      <button onClick={() => setAcik((v) => !v)} aria-expanded={acik} className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-white/[0.03]">
        {sesAvatar(sec, secili)}
        <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold text-metin">{secili}</span><span className="mt-0.5 block truncate text-[12px] text-metin-3">{alt ?? [sec?.cinsiyet, sec?.aksan ?? sec?.dil, sec?.tanim].filter(Boolean).join(" · ")}</span></span>
        <span className="flex h-8 items-center gap-1 rounded-full px-3 text-[12.5px] font-medium text-metin ring-1 ring-inset ring-white/[0.12]">Değiştir<motion.span animate={{ rotate: acik ? 180 : 0 }}><ChevronDown className="h-3.5 w-3.5" /></motion.span></span>
      </button>
      <AnimatePresence initial={false}>
        {acik && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden border-t border-white/[0.06]">
            <div className="space-y-2 p-2.5">
              <label className="flex h-9 items-center gap-2 rounded-[10px] bg-white/[0.055] px-2.5 ring-1 ring-inset ring-white/[0.08] focus-within:ring-white/25">
                <Search className="h-3.5 w-3.5 text-metin-3" /><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Ses ara" aria-label="Ses ara" className="min-w-0 flex-1 bg-transparent text-[13px] text-metin outline-none placeholder:text-metin-3" />
              </label>
              <Segment etiket="Cinsiyet" deger={cins} onDegis={(v) => setCins(v)} secenekler={[["hepsi", "Tümü"], ["Kadın", "Kadın"], ["Erkek", "Erkek"]]} />
              <div className="max-h-[300px] space-y-0.5 overflow-y-auto [scrollbar-width:thin]">
                {suz.map((x) => (
                  <button key={x.ad} onClick={() => { onSec(x); setAcik(false); }} aria-pressed={secili === x.ad}
                    className={cn("flex w-full items-center gap-3 rounded-[12px] px-2 py-2 text-left transition-colors hover:bg-white/[0.055]", secili === x.ad && "bg-white/[0.085]")}>
                    {sesAvatar(x, x.ad, 34)}
                    <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-medium text-metin">{x.ad}</span><span className="block truncate text-[12px] text-metin-3">{[x.cinsiyet, x.aksan ?? x.dil, x.tanim].filter(Boolean).join(" · ")}</span></span>
                    {secili === x.ad && <Check className="h-4 w-4 shrink-0 text-metin" />}
                  </button>
                ))}
                {!suz.length && <p className="px-2 py-6 text-center text-[13px] text-metin-3">Eşleşen ses yok</p>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
