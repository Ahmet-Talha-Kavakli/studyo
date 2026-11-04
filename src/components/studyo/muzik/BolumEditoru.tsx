"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Copy, ListMusic, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BOLUM_MAX_MS, BOLUM_MIN_MS, PLAN_MAX_BOLUM, bolumRengi, planSuresi, type MuzikPlan, type PlanBolumu } from "@/lib/muzikVeri";
import { sureBicim } from "@/store/useMuzik";
import { Kaydirici } from "@/components/montaj/ui";
import { StilGirdisi } from "./ortak";

const YAY = { type: "spring", stiffness: 420, damping: 32 } as const;
const IKON = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/[0.085] hover:text-metin disabled:pointer-events-none disabled:opacity-30";
const HIZLI_AD = ["Intro", "Verse", "Pre-Chorus", "Chorus", "Bridge", "Drop", "Outro"];

const yeniId = () => `b_${Math.random().toString(36).slice(2, 9)}`;
const dolgu = (renk: string, guc = 34) => `color-mix(in srgb, ${renk} ${guc}%, #16171a)`;

/** Plan düzenleme işlemleri — liste, çizelge ve editör aynı işlemleri kullanır. */
function planIslem(plan: MuzikPlan, onDegis: (p: MuzikPlan) => void, onSec: (id: string | null) => void) {
  const dolu = plan.bolumler.length >= PLAN_MAX_BOLUM;
  return {
    dolu,
    guncelle: (id: string, d: Partial<PlanBolumu>) => onDegis({ ...plan, bolumler: plan.bolumler.map((b) => (b.id === id ? { ...b, ...d } : b)) }),
    tasi: (i: number, y: -1 | 1) => {
      const l = [...plan.bolumler]; const j = i + y;
      if (j < 0 || j >= l.length) return;
      [l[i], l[j]] = [l[j], l[i]]; onDegis({ ...plan, bolumler: l });
    },
    ekle: (sonra?: number) => {
      if (dolu) return;
      const b: PlanBolumu = { id: yeniId(), ad: "Verse", sureMs: 20000, satirlar: [], pozitif: [], negatif: [] };
      const l = [...plan.bolumler]; l.splice(sonra === undefined ? l.length : sonra + 1, 0, b);
      onDegis({ ...plan, bolumler: l }); onSec(b.id);
    },
    kopyala: (i: number) => {
      if (dolu) return;
      const b = { ...plan.bolumler[i], id: yeniId() };
      const l = [...plan.bolumler]; l.splice(i + 1, 0, b); onDegis({ ...plan, bolumler: l }); onSec(b.id);
    },
    sil: (i: number) => {
      if (plan.bolumler.length <= 1) return;
      const l = plan.bolumler.filter((_, k) => k !== i);
      onDegis({ ...plan, bolumler: l }); onSec(l[Math.min(i, l.length - 1)].id);
    },
  };
}

/**
 * Zaman çizelgesi — bölümler süreleriyle orantılı bloklar. Küçük görünüm (panel, görüntüleyici) yalnızca
 * renkli şerit; `buyuk` görünümde blokta ad + süre (sığmazsa yalnız renk, ad ipucunda) ve altta zaman cetveli.
 */
export function PlanSeridi({ plan, secili, onSec, yukseklik = 56, buyuk }: { plan: MuzikPlan; secili?: string | null; onSec?: (id: string) => void; yukseklik?: number; buyuk?: boolean }) {
  const toplamMs = Math.max(1, planSuresi(plan));
  const toplamSn = toplamMs / 1000;
  const adim = toplamSn > 240 ? 60 : toplamSn > 90 ? 30 : 15;
  const isaretler = Array.from({ length: Math.floor(toplamSn / adim) + 1 }, (_, i) => i * adim);
  return (
    <div>
      <div className="flex w-full gap-[3px]" style={{ height: yukseklik }} role={onSec ? "tablist" : undefined} aria-label="Bölüm zaman çizelgesi">
        {plan.bolumler.map((b) => {
          const renk = bolumRengi(b.ad);
          const pay = b.sureMs / toplamMs;
          const sec = secili === b.id;
          const yazi = buyuk && pay >= 0.045;
          return (
            <motion.button transition={YAY} key={b.id} onClick={onSec ? () => onSec(b.id) : undefined} disabled={!onSec} role={onSec ? "tab" : undefined} aria-selected={sec}
              title={`${b.ad} · ${sureBicim(b.sureMs / 1000)}`}
              className={cn("relative min-w-[8px] overflow-hidden text-left outline-offset-2 transition-[outline-color,filter] disabled:cursor-default", buyuk ? "rounded-[12px]" : "rounded-[6px]",
                sec ? "outline outline-2 outline-white" : "outline outline-2 outline-transparent enabled:hover:brightness-125")}
              style={{ flexGrow: pay, flexBasis: 0, background: buyuk ? dolgu(renk, sec ? 46 : 32) : renk }}>
              {buyuk && <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: renk }} />}
              {yazi && (
                <span className="relative flex h-full flex-col justify-between px-2.5 pb-2 pt-2.5">
                  <span className="block truncate text-[12.5px] font-semibold leading-tight text-metin">{pay < 0.08 && b.ad.length > 6 ? b.ad.split(/[\s-]+/).filter(Boolean).map((k) => /\d/.test(k) ? k : k[0]).join("").toLocaleUpperCase("tr") : b.ad}</span>
                  <span className="text-[11.5px] tabular-nums text-metin-2">{sureBicim(b.sureMs / 1000)}</span>
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
      {buyuk && (
        <div className="relative mt-1.5 h-4 text-[11px] tabular-nums text-metin-3" aria-hidden>
          {isaretler.map((sn, i) => (
            <span key={sn} className={cn("absolute top-0", i === 0 ? "" : "-translate-x-1/2", sn / toplamSn > 0.97 && "hidden")} style={{ left: `${(sn / toplamSn) * 100}%` }}>{sureBicim(sn)}</span>
          ))}
          <span className="absolute right-0 top-0">{sureBicim(toplamSn)}</span>
        </div>
      )}
    </div>
  );
}

/** Seçili bölümün editörü: ad (hızlı çipler), süre, sözler, stil ve hariç tut. */
export function BolumDetay({ plan, onDegis, secili, onSec, dar }: { plan: MuzikPlan; onDegis: (p: MuzikPlan) => void; secili: string | null; onSec: (id: string | null) => void; dar?: boolean }) {
  const i = plan.bolumler.findIndex((b) => b.id === secili);
  const b = plan.bolumler[i];
  const is = planIslem(plan, onDegis, onSec);
  if (!b) return null;
  const renk = bolumRengi(b.ad);
  const satir = b.satirlar.filter((x) => x.trim()).length;
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={b.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.16 }}>
        <div className="flex items-center gap-2.5">
          <span className="h-7 w-1.5 shrink-0 rounded-full" style={{ background: renk }} />
          <input value={b.ad} onChange={(e) => is.guncelle(b.id, { ad: e.target.value.slice(0, 100) })} placeholder="Bölüm adı" aria-label="Bölüm adı" spellCheck={false}
            className="min-w-0 flex-1 rounded-[10px] bg-transparent px-1.5 py-1 text-[17px] font-semibold tracking-tight text-metin outline-none transition-colors placeholder:text-metin-2 hover:bg-white/[0.055] focus:bg-white/[0.065]" />
          <span className="shrink-0 rounded-full bg-white/[0.085] px-2 py-0.5 text-[12px] tabular-nums text-metin-2">{i + 1}/{plan.bolumler.length}</span>
          <div className="flex shrink-0 items-center">
            <button onClick={() => is.tasi(i, -1)} disabled={i === 0} aria-label="Öne taşı" title="Öne taşı" className={IKON}><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => is.tasi(i, 1)} disabled={i === plan.bolumler.length - 1} aria-label="Sona taşı" title="Sona taşı" className={IKON}><ChevronRight className="h-4 w-4" /></button>
            <button onClick={() => is.kopyala(i)} disabled={is.dolu} aria-label="Çoğalt" title="Çoğalt" className={IKON}><Copy className="h-4 w-4" /></button>
            <button onClick={() => is.sil(i)} disabled={plan.bolumler.length <= 1} aria-label="Sil" title="Sil" className={cn(IKON, "hover:text-rose-300")}><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
          {HIZLI_AD.map((ad) => {
            const sec = b.ad.toLowerCase().replace(/\s*\d+$/, "") === ad.toLowerCase();
            return (
              <motion.button whileTap={{ scale: 0.95 }} key={ad} onClick={() => is.guncelle(b.id, { ad })} aria-pressed={sec}
                className={cn("flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-medium ring-1 ring-inset transition-colors",
                  sec ? "bg-white/[0.1] text-metin ring-white/20" : "text-metin-2 ring-white/[0.07] hover:bg-white/[0.065] hover:text-metin")}>
                <span className="h-2 w-2 rounded-full" style={{ background: bolumRengi(ad) }} />{ad}
              </motion.button>
            );
          })}
        </div>
        <div className={cn("mt-3 grid gap-3", !dar && "md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]")}>
          <label className="flex flex-col rounded-[14px] bg-white/[0.045] ring-1 ring-inset ring-white/[0.07] transition-shadow focus-within:ring-white/[0.16]">
            <span className="flex items-center justify-between px-3.5 pt-2.5 text-[13px] font-semibold text-metin">Sözler<span className="text-[12px] font-normal text-metin-2">{satir ? `${satir}/30 satır` : "Boşsa enstrümantal"}</span></span>
            <textarea value={b.satirlar.join("\n")} onChange={(e) => is.guncelle(b.id, { satirlar: e.target.value.split("\n").slice(0, 30) })} rows={5} spellCheck={false}
              placeholder={"Her satıra bir dize yaz…"}
              className="block min-h-[132px] w-full flex-1 resize-none bg-transparent px-3.5 pb-3 pt-1.5 text-[14.5px] leading-relaxed text-metin outline-none placeholder:text-metin-2 [field-sizing:content] max-h-[260px]" />
          </label>
          <div className="divide-y divide-white/[0.06] rounded-[14px] bg-white/[0.045] ring-1 ring-inset ring-white/[0.07]">
            <div className="px-3.5 py-3">
              <Kaydirici ad="Süre" deger={Math.round(b.sureMs / 1000)} min={BOLUM_MIN_MS / 1000} max={BOLUM_MAX_MS / 1000} adim={1}
                onDegis={(v) => is.guncelle(b.id, { sureMs: v * 1000 })} yaz={(v) => sureBicim(v)} />
            </div>
            <div className="px-3.5 py-2.5">
              <p className="mb-1 text-[13px] text-metin-2">Bu bölümün stili</p>
              <StilGirdisi etiket={`${b.ad} stili`} degerler={b.pozitif} onDegis={(l) => is.guncelle(b.id, { pozitif: l })} yerTutucu="build-up, drums only…" />
            </div>
            <div className="px-3.5 py-2.5">
              <p className="mb-1 text-[13px] text-metin-2">Bu bölümde olmasın</p>
              <StilGirdisi etiket={`${b.ad} hariç`} ton="negatif" degerler={b.negatif} onDegis={(l) => is.guncelle(b.id, { negatif: l })} yerTutucu="vocals, bass…" />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/** Sağ alandaki çizelge kartı: başlık, büyük şerit + cetvel, altında seçili bölümün editörü. */
export function PlanCizelgesi({ plan, onDegis, secili, onSec, baslik }: { plan: MuzikPlan; onDegis: (p: MuzikPlan) => void; secili: string | null; onSec: (id: string | null) => void; baslik?: string }) {
  const is = planIslem(plan, onDegis, onSec);
  const i = plan.bolumler.findIndex((b) => b.id === secili);
  useEffect(() => { if (i < 0 && plan.bolumler[0]) onSec(plan.bolumler[0].id); }, [i, plan.bolumler]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <section className="rounded-[20px] bg-white/[0.045] ring-1 ring-inset ring-white/[0.07]">
      <div className="p-4 pb-3">
        <div className="mb-3 flex items-center gap-2">
          <ListMusic className="h-4 w-4 text-metin-2" />
          <span className="truncate text-[14px] font-semibold text-metin">{baslik ?? "Zaman çizelgesi"}</span>
          <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[12px] tabular-nums text-metin-2">{plan.bolumler.length} bölüm · {sureBicim(planSuresi(plan) / 1000)}</span>
          <button onClick={() => is.ekle(i < 0 ? undefined : i)} disabled={is.dolu}
            className="ml-auto flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium text-metin-2 ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.075] hover:text-metin disabled:opacity-40">
            <Plus className="h-3.5 w-3.5" />Bölüm ekle
          </button>
        </div>
        <PlanSeridi plan={plan} secili={secili} onSec={onSec} yukseklik={72} buyuk />
      </div>
      <div className="border-t border-white/[0.06] p-4 pt-3.5">
        <BolumDetay plan={plan} onDegis={onDegis} secili={secili} onSec={onSec} />
      </div>
    </section>
  );
}

/**
 * Sol panel: genel stil kartı + kompakt bölüm listesi (renk çizgisi, ad, satır, süre). Geniş ekranda düzenleme
 * sağdaki çizelgede yapılır; dar ekranda (`satirIci`) seçili bölümün editörü listenin altında açılır.
 */
export function BolumEditoru({ plan, onDegis, secili, onSec, satirIci }: {
  plan: MuzikPlan; onDegis: (p: MuzikPlan) => void; secili: string | null; onSec: (id: string | null) => void; satirIci?: boolean;
}) {
  const is = planIslem(plan, onDegis, onSec);
  useEffect(() => { if (!plan.bolumler.some((b) => b.id === secili)) onSec(plan.bolumler[0]?.id ?? null); }, [plan.bolumler, secili]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <section className="divide-y divide-white/[0.06] rounded-[18px] bg-white/[0.045] ring-1 ring-inset ring-white/[0.07]">
        <div className="px-3.5 py-2.5">
          <p className="mb-1 text-[13px] font-semibold text-metin">Genel stil</p>
          <StilGirdisi etiket="Genel stil" degerler={plan.pozitif} onDegis={(l) => onDegis({ ...plan, pozitif: l })} yerTutucu="pop, upbeat, female vocals…" />
        </div>
        <div className="px-3.5 py-2.5">
          <p className="mb-1 text-[13px] font-semibold text-metin">Hariç tut</p>
          <StilGirdisi etiket="Genel olarak hariç tut" ton="negatif" degerler={plan.negatif} onDegis={(l) => onDegis({ ...plan, negatif: l })} yerTutucu="metal, autotune…" />
        </div>
      </section>

      <section className="rounded-[18px] bg-white/[0.045] ring-1 ring-inset ring-white/[0.07]">
        <div className="flex min-h-[38px] items-center gap-2 px-3.5 pt-2.5">
          <span className="text-[13px] font-semibold text-metin">Bölümler</span>
          <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[12px] tabular-nums text-metin-2">{plan.bolumler.length} · {sureBicim(planSuresi(plan) / 1000)}</span>
        </div>
        {satirIci && <div className="px-3.5 pt-2"><PlanSeridi plan={plan} secili={secili} onSec={onSec} yukseklik={10} /></div>}
        <div className="p-1.5" role="listbox" aria-label="Bölümler">
          {plan.bolumler.map((b) => {
            const sec = secili === b.id;
            const satir = b.satirlar.filter((x) => x.trim()).length;
            return (
              <motion.button transition={YAY} key={b.id} role="option" aria-selected={sec} onClick={() => onSec(b.id)}
                className={cn("relative flex w-full items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-left transition-colors", sec ? "text-metin" : "text-metin-2 hover:bg-white/[0.055] hover:text-metin")}>
                {sec && <motion.span layoutId="bolum-secili" transition={YAY} className="absolute inset-0 rounded-[12px] bg-white/[0.085]" />}
                <span className="relative h-6 w-1 shrink-0 rounded-full" style={{ background: bolumRengi(b.ad) }} />
                <span className="relative min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium">{b.ad || "Adsız bölüm"}</span>
                  <span className="block truncate text-[12px] text-metin-2">{satir ? `${satir} satır` : "Sözsüz"}{b.pozitif[0] ? ` · ${b.pozitif[0]}` : ""}</span>
                </span>
                <span className="relative shrink-0 text-[12.5px] tabular-nums text-metin-2">{sureBicim(b.sureMs / 1000)}</span>
              </motion.button>
            );
          })}
        </div>
        <div className="border-t border-white/[0.06] px-2 py-1.5">
          <button onClick={() => is.ekle()} disabled={is.dolu}
            className="flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-medium text-metin-2 transition-colors hover:bg-white/[0.075] hover:text-metin disabled:opacity-40">
            <Plus className="h-4 w-4" />Bölüm ekle<span className="text-metin-3">{plan.bolumler.length}/{PLAN_MAX_BOLUM}</span>
          </button>
        </div>
      </section>

      {satirIci && (
        <section className="rounded-[18px] bg-white/[0.045] p-3.5 ring-1 ring-inset ring-white/[0.07]">
          <BolumDetay plan={plan} onDegis={onDegis} secili={secili} onSec={onSec} dar />
        </section>
      )}
    </>
  );
}
