"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Heading, AlignLeft, ListChecks, BarChart3, Quote, Megaphone, Type as TypeIcon } from "lucide-react";
import { ArrowLeft, Download, Undo2, Plus, Combine, Captions, Image as ImageIcon, Mic, Check, Loader2, Wand2, X, Sparkles, Copy, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { Tooltip } from "@/components/ui/Tooltip";
import { Yuzen } from "@/components/ui/Yuzen";
import { useMontaj } from "@/store/useMontaj";
import { useExplainer, type ExProje, type ExSahne, type SahneTur } from "@/store/useExplainer";
import { explainerMontaj, sahneAnlari, toplamSure, gecisSesi, sahneSure, rakamBul, SAHNE_TURLERI } from "@/lib/explainerMotor";
import { kareAl } from "@/lib/montajMotor";
import { MontajDisaAktar } from "@/components/montaj/MontajDisaAktar";
import { altyaziMetni, kisaSure } from "@/components/montaj/ortak";
import { AltBaslik, Segment } from "@/components/montaj/ui";
import { Bolum } from "./ExParca";
import { ExOynatici, type OynaticiTutamak } from "./ExOynatici";
import { ExGorselPanel, ExSesPanel, ExVideoAyar } from "./ExDenetleyici";
import { SahneMini } from "./ExOnay";
import { useExUretimIzle, yazarHazir, muzikHazirla, sahneUret, sahneDonustur } from "./exUretim";

type Sekme = "sahne" | "gorsel" | "ses" | "video";
const TUR_IKON: Record<SahneTur, typeof Mic> = { baslik: Heading, anlatim: AlignLeft, liste: ListChecks, istatistik: BarChart3, alinti: Quote, cta: Megaphone };
const SERIT_W = { "16:9": 168, "9:16": 74, "1:1": 108 } as const;
const SERIT_H = { "16:9": 94.5, "9:16": 131.5, "1:1": 108 } as const;
const DONUSUM: [Parameters<typeof sahneDonustur>[2], string][] = [["kisalt", "Kısalt"], ["sadelestir", "Sadeleştir"], ["enerjik", "Daha enerjik"], ["genislet", "Genişlet"], ["yeniden", "Yeniden yaz"]];

/** Explainer editörü: ortada büyük önizleme ve gerçek karelerden hikâye şeridi, sağda seçili sahnenin düzenleyicisi. */
export function ExEditor({ p }: { p: ExProje }) {
  const router = useRouter();
  const seciliId = useExplainer((s) => s.seciliSahne);
  const gecmisVar = useExplainer((s) => (s.gecmis[p.id]?.length ?? 0) > 0);
  const marka = useMontaj((s) => s.marka);
  const st = useExplainer.getState;
  const [sekme, setSekme] = useState<Sekme>("sahne");
  const [disa, setDisa] = useState(false);
  const [yazar, setYazar] = useState(false);
  const [sfx, setSfx] = useState<string | undefined>();
  const [kareler, setKareler] = useState<Record<string, string>>({});
  const oynatici = useRef<OynaticiTutamak>(null);
  const seritRef = useRef<HTMLDivElement>(null);
  useExUretimIzle();
  useEffect(() => { void yazarHazir().then(setYazar); }, []);
  useEffect(() => { const z = setTimeout(() => oynatici.current?.git(Math.min(1.3, (p.sahneler[0] ? sahneSure(p.sahneler[0]) : 2) * 0.45)), 60); return () => clearTimeout(z); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (p.ayar.sfx) void gecisSesi().then(setSfx).catch(() => {}); }, [p.ayar.sfx]);

  const secili = p.sahneler.find((s) => s.id === seciliId) ?? p.sahneler[0];
  const si = Math.max(0, p.sahneler.findIndex((s) => s.id === secili?.id));
  const montaj = useMemo(() => explainerMontaj(p, { marka, sfxUrl: p.ayar.sfx ? sfx : undefined }), [p, marka, sfx]);
  const anlar = useMemo(() => sahneAnlari(p.sahneler), [p.sahneler]);
  const toplam = toplamSure(p.sahneler);

  /* Müzik: süre ya da ruh hali değişince yeniden bestelenir (gecikmeli) */
  const muzikAnahtar = `${p.ayar.muzik}|${Math.max(8, Math.ceil(toplam) + 1)}`;
  useEffect(() => {
    if (p.ayar.muzik === "yok" || p.ayar.muzikAnahtar === muzikAnahtar) return;
    const z = setTimeout(() => { const g = useExplainer.getState().projeler.find((x) => x.id === p.id); if (g) void muzikHazirla(g).catch(() => {}); }, 1200);
    return () => clearTimeout(z);
  }, [muzikAnahtar]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Hikâye şeridi kareleri: her sahnenin gerçek, işlenmiş karesi; yalnız değişen sahneler yeniden çizilir */
  const kareAnahtar = (s: ExSahne, i: number) => JSON.stringify([i, s.tur, s.baslik, s.deger, s.etiket, s.maddeler, s.gorselUrl, s.videoUrl, p.ayar.stil, p.ayar.oran, p.ayar.marka]);
  useEffect(() => {
    let iptal = false;
    const z = setTimeout(() => {
      void (async () => {
        for (const [i, s] of p.sahneler.entries()) {
          const k = kareAnahtar(s, i);
          if (iptal || kareler[k]) continue;
          try {
            const [W, H] = p.ayar.oran === "9:16" ? [180, 320] : p.ayar.oran === "1:1" ? [240, 240] : [320, 180];
            const b = await kareAl(montaj, anlar[i] + Math.min(1.6, sahneSure(s) * 0.5), W, H);
            if (!iptal) setKareler((m) => ({ ...m, [k]: URL.createObjectURL(b) }));
          } catch { /* stil karesi kalır */ }
        }
      })();
    }, 800);
    return () => { iptal = true; clearTimeout(z); };
  }, [montaj]); // eslint-disable-line react-hooks/exhaustive-deps

  const sahneSec = (i: number, git = true) => {
    const s = p.sahneler[i]; if (!s) return;
    st().sahneSec(s.id);
    if (git) oynatici.current?.git(anlar[i] + Math.min(1.3, sahneSure(s) * 0.45));
    requestAnimationFrame(() => seritRef.current?.querySelector(`[data-sahne="${s.id}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" }));
  };

  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      const h = e.target as HTMLElement;
      if (h && (/^(INPUT|TEXTAREA|SELECT)$/.test(h.tagName) || h.isContentEditable)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); st().geriAl(p.id); }
      if (e.key === "ArrowRight" && !e.ctrlKey) { e.preventDefault(); sahneSec(Math.min(p.sahneler.length - 1, si + 1)); }
      if (e.key === "ArrowLeft" && !e.ctrlKey) { e.preventDefault(); sahneSec(Math.max(0, si - 1)); }
    };
    document.addEventListener("keydown", f); return () => document.removeEventListener("keydown", f);
  }, [p.id, si, p.sahneler.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const topluUret = (tur: "gorsel" | "ses") => {
    const l = p.sahneler.filter((s) => (tur === "gorsel" ? !s.gorselUrl && !s.videoUrl && s.gorselDurum !== "uretiliyor" : s.anlatim.trim() && (!s.sesUrl || s.sesMetni !== s.anlatim)));
    let n = 0;
    for (const s of l) if (sahneUret(p, s, tur)) n++; else break;
    if (n) toast.success(tur === "gorsel" ? `${n} sahne görseli üretiliyor` : `${n} sahne seslendiriliyor`, { description: "Bittikçe önizlemeye düşer." });
  };
  const srt = () => {
    const kat = montaj.katmanlar.find((k) => k.ad === "Altyazı");
    if (!kat?.klipler.length) return void toast.error("Altyazı yok", { description: "SRT indirmek için video ayarlarından altyazıyı aç." });
    const blob = new Blob([altyaziMetni(kat.klipler, "srt")], { type: "application/x-subrip" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${p.ad.replace(/[\\/:*?"<>|]+/g, "-")}.srt`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast.success("SRT indirildi", { description: "Altyazı dosyası indirilenler klasörüne kaydedildi." });
  };
  const montajdaAc = () => {
    const ms = useMontaj.getState();
    const id = ms.projeOlustur({ ad: `Explainer · ${p.ad}`, katmanlar: JSON.parse(JSON.stringify(montaj.katmanlar)), enBoy: montaj.enBoy, arkaRenk: montaj.arkaRenk });
    ms.projeGuncelle(id, { kisma: true });
    st().guncelle(p.id, { montajId: id });
    toast.success("Montaj Stüdyosu'nda açıldı", { description: "Explainer projen olduğu gibi kalır." });
    router.push("/panel/montaj");
  };
  const sahneEkle = () => { const id = st().sahneEkle(p.id, secili?.id ?? null, { tur: "anlatim", baslik: "Yeni sahne", anlatim: "" }); setSekme("sahne"); requestAnimationFrame(() => { const i = useExplainer.getState().projeler.find((x) => x.id === p.id)?.sahneler.findIndex((x) => x.id === id) ?? 0; sahneSec(i); }); };

  const sesli = p.sahneler.filter((s) => s.sesUrl && s.sesMetni === s.anlatim).length;
  const gorselli = p.sahneler.filter((s) => s.gorselUrl || s.videoUrl).length;
  const ib = "flex h-10 w-10 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/[0.07] hover:text-metin disabled:opacity-30";
  const sahneEkran = secili && sekme !== "video";

  return (
    <div className="min-h-[calc(100dvh-var(--ust-nav))] bg-zemin lg:h-[calc(100dvh-var(--ust-nav))] lg:overflow-hidden">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-3 px-3 pb-24 pt-3 sm:px-4 lg:h-full lg:pb-3">
        {/* Üst bar: kart */}
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex shrink-0 flex-wrap items-center gap-2 rounded-[20px] px-2.5 py-2 ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
          <Tooltip label="Explainer'lara dön"><button onClick={() => st().sec(null)} aria-label="Explainer'lara dön" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-metin ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.1]"><ArrowLeft className="h-[18px] w-[18px]" /></button></Tooltip>
          <div className="min-w-0 flex-1 max-sm:order-last max-sm:basis-full">
            <input value={p.ad} onChange={(e) => st().guncelle(p.id, { ad: e.target.value.slice(0, 60) })} aria-label="Explainer adı" className="w-full truncate rounded-[8px] bg-transparent px-1 text-[18px] font-semibold tracking-[-0.01em] text-metin outline-none focus:bg-white/[0.04]" />
            <p className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap px-1 text-[12px] tabular-nums text-metin-2">
              <span className="rounded-full px-2 py-0.5 ring-1 ring-inset ring-white/[0.08]">{p.sahneler.length} sahne · {kisaSure(toplam)}</span>
              <span title="Görseli üretilen sahne" className="flex items-center gap-1 rounded-full px-2 py-0.5 ring-1 ring-inset ring-white/[0.08]"><ImageIcon className="h-3.5 w-3.5" />{gorselli}/{p.sahneler.length}</span>
              <span title="Seslendirilen sahne" className="flex items-center gap-1 rounded-full px-2 py-0.5 ring-1 ring-inset ring-white/[0.08]"><Mic className="h-3.5 w-3.5" />{sesli}/{p.sahneler.length}</span>
            </p>
          </div>
          <span className="flex-1 max-lg:hidden" />
          <Tooltip label="Geri al · Ctrl+Z"><button onClick={() => st().geriAl(p.id)} disabled={!gecmisVar} aria-label="Geri al" className={cn(ib, "ml-auto sm:ml-0")}><Undo2 className="h-[18px] w-[18px]" /></button></Tooltip>
          <Tooltip label="Altyazıyı SRT indir"><button onClick={srt} aria-label="SRT indir" className={ib}><Captions className="h-[18px] w-[18px]" /></button></Tooltip>
          <button onClick={montajdaAc} className="hidden h-10 items-center gap-1.5 rounded-full bg-white/[0.06] px-4 text-[13.5px] font-medium text-metin ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.1] sm:flex"><Combine className="h-4 w-4" />Montajda düzenle</button>
          <button onClick={() => { oynatici.current?.durdur(); setDisa(true); }} className="flex h-10 items-center gap-1.5 rounded-full bg-white text-black transition active:scale-95 disabled:opacity-45 px-4 text-[13.5px] font-semibold"><Download className="h-4 w-4" />Dışa aktar</button>
        </motion.div>

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_400px]">
          {/* Önizleme + hikâye şeridi */}
          <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[22px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
            <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
              <div className="w-[230px]"><Segment etiket="Format" deger={p.ayar.oran} onDegis={(v) => st().ayarGuncelle(p.id, { oran: v })} secenekler={[["16:9", "16:9"], ["9:16", "9:16"], ["1:1", "1:1"]]} /></div>
              <span className="flex-1" /><span title={sesli ? undefined : "Seslendirme eklenene kadar anlatım altyazıyla gösterilir"} className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] text-metin-2 ring-1 ring-inset ring-white/[0.08] max-sm:hidden"><span className={cn("h-1.5 w-1.5 rounded-full", sesli ? "bg-emerald-400" : "bg-white/40")} />{sesli ? "Seslendirmeli önizleme" : "Altyazılı önizleme"}</span><span className="rounded-full px-2.5 py-1 text-[12px] text-metin-2 ring-1 ring-inset ring-white/[0.08] max-sm:hidden">Önizleme ücretsiz</span>
            </div>
            <div className={cn("px-4 pb-1 pt-3 lg:min-h-0 lg:flex-1", p.ayar.oran === "16:9" ? "max-lg:h-[calc(56vw+96px)]" : "max-lg:h-[62vh]")}>
              <ExOynatici ref={oynatici} proje={montaj} anlar={anlar} basliklar={p.sahneler.map((s) => (s.tur === "istatistik" ? s.deger ?? "" : s.baslik) || "Sahne")} secili={si} onSahne={(i) => sahneSec(i, false)} sinif="h-full" ince />
            </div>
            <div className="shrink-0 border-t border-white/[0.06] px-4 pb-3.5 pt-3">
              <div className="mb-2.5 flex items-center gap-2"><span className="text-[13.5px] font-semibold text-metin">Hikâye şeridi</span><span className="flex items-center gap-1 text-[12px] text-metin-3 max-sm:hidden"><kbd>←</kbd><kbd>→</kbd>ile gez</span><span className="flex-1" /><span className="rounded-full px-2.5 py-0.5 text-[12px] tabular-nums text-metin-2 ring-1 ring-inset ring-white/[0.08]">Sahne {si + 1} / {p.sahneler.length}</span></div>
              <div ref={seritRef} className="flex gap-2.5 overflow-x-auto pb-1.5 [scrollbar-width:thin]">
                {p.sahneler.map((s, i) => {
                  const k = kareler[kareAnahtar(s, i)];
                  const aktif = i === si;
                  return (
                    <button key={s.id} data-sahne={s.id} onClick={() => sahneSec(i)} aria-pressed={aktif} title={`${i + 1}. ${SAHNE_TURLERI.find((x) => x.id === s.tur)?.ad}`} className="group shrink-0 text-left" style={{ width: SERIT_W[p.ayar.oran] }}>
                      <span className={cn("relative block overflow-hidden rounded-[10px] bg-black", p.ayar.oran === "9:16" ? "aspect-[9/16]" : p.ayar.oran === "1:1" ? "aspect-square" : "aspect-video", "")}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {k ? <img src={k} alt="" className="h-full w-full object-cover" /> : <SahneMini s={s} stil={p.ayar.stil} sinif="h-full w-full" />}
                        <span className={cn("pointer-events-none absolute inset-0 z-10 rounded-[10px] ring-inset transition", aktif ? "ring-2 ring-white" : "ring-1 ring-white/10 group-hover:ring-white/30")} />
                        <span className="absolute left-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-black/70 px-1 text-[11px] font-semibold tabular-nums text-white">{i + 1}</span>
                        <span className="absolute right-1.5 top-1.5 flex gap-0.5">
                          {s.gorselDurum === "uretiliyor" && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white"><Loader2 className="h-3 w-3 animate-spin" /></span>}
                          {s.sesUrl && s.sesMetni === s.anlatim && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-emerald-300" title="Seslendirildi"><Mic className="h-3 w-3" /></span>}
                        </span>
                      </span>
                      <span className="mt-1 flex items-center justify-between gap-1 text-[12px]">{p.ayar.oran !== "9:16" && <span className={cn("truncate", aktif ? "text-metin" : "text-metin-3")}>{SAHNE_TURLERI.find((x) => x.id === s.tur)?.ad}</span>}<span className={cn("shrink-0 tabular-nums", aktif ? "text-metin" : "text-metin-3", p.ayar.oran === "9:16" && "w-full text-center")}>{sahneSure(s).toFixed(1)} sn</span></span>
                    </button>
                  );
                })}
                <button onClick={sahneEkle} aria-label="Sahne ekle" className="flex shrink-0 flex-col items-center justify-center gap-1 rounded-[10px] border border-dashed border-white/[0.16] text-metin-2 transition-colors hover:border-white/35 hover:text-metin"
                  style={{ width: SERIT_W[p.ayar.oran], height: SERIT_H[p.ayar.oran] }}>
                  <Plus className="h-5 w-5" /><span className="text-[12px]">Sahne ekle</span>
                </button>
              </div>
            </div>
          </section>

          {/* Sağ panel */}
          <aside className="min-w-0 overflow-hidden rounded-[22px] bg-[#18191c] ring-1 ring-inset ring-white/[0.07] lg:h-full lg:overflow-y-auto lg:[scrollbar-width:thin]">
            <div className="sticky top-0 z-10 space-y-3 border-b border-white/[0.06] bg-[#18191c] p-3">
              <div role="tablist" className="grid grid-cols-2 gap-0.5 rounded-full bg-white/[0.04] p-[3px] ring-1 ring-inset ring-white/[0.06]">
                {([["sahne", `Sahne ${si + 1}`], ["video", "Video ayarları"]] as const).map(([id, ad]) => {
                  const a = id === "video" ? sekme === "video" : sekme !== "video";
                  return <button key={id} role="tab" aria-selected={a} onClick={() => setSekme(id === "video" ? "video" : sekme === "video" ? "sahne" : sekme)} className={cn("h-9 rounded-full text-[13.5px] font-medium transition-colors", a ? "bg-white/[0.12] text-metin" : "text-metin-2 hover:text-metin")}>{ad}</button>;
                })}
              </div>
              {sahneEkran && (
                <>
                  <div className="flex items-center gap-3">
                    <span className={cn("relative shrink-0 overflow-hidden rounded-[8px] bg-black outline outline-1 -outline-offset-1 outline-white/10", p.ayar.oran === "9:16" ? "h-[56px] w-[32px]" : p.ayar.oran === "1:1" ? "h-11 w-11" : "h-[42px] w-[75px]")}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {kareler[kareAnahtar(secili, si)] ? <img src={kareler[kareAnahtar(secili, si)]} alt="" className="h-full w-full object-cover" /> : <SahneMini s={secili} stil={p.ayar.stil} sinif="h-full w-full" />}
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-[14px] font-semibold text-metin">{(secili.tur === "istatistik" ? secili.deger : secili.baslik) || SAHNE_TURLERI.find((x) => x.id === secili.tur)?.ad}</span>
                      <span className="mt-0.5 block text-[12px] tabular-nums text-metin-3">{si + 1} / {p.sahneler.length} · {SAHNE_TURLERI.find((x) => x.id === secili.tur)?.ad} · {sahneSure(secili).toFixed(1)} sn</span>
                    </span>
                    <span className="flex items-center">
                      <Tooltip label="Önceki sahne · ←"><button onClick={() => sahneSec(Math.max(0, si - 1))} disabled={si === 0} aria-label="Önceki sahne" className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 hover:bg-white/[0.07] hover:text-metin disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button></Tooltip>
                      <Tooltip label="Sonraki sahne · →"><button onClick={() => sahneSec(Math.min(p.sahneler.length - 1, si + 1))} disabled={si === p.sahneler.length - 1} aria-label="Sonraki sahne" className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 hover:bg-white/[0.07] hover:text-metin disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button></Tooltip>
                      <Tooltip label="Çoğalt"><button onClick={() => st().sahneEkle(p.id, secili.id, { ...secili, sesUrl: undefined, sesSure: undefined, sesMetni: undefined })} aria-label="Çoğalt" className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 hover:bg-white/[0.07] hover:text-metin"><Copy className="h-4 w-4" /></button></Tooltip>
                      <Tooltip label="Sil"><button onClick={() => { if (p.sahneler.length <= 1) return void toast.error("Sahne silinemedi", { description: "Videoda en az bir sahne kalmalı." }); st().sahneSil(p.id, secili.id); toast("Sahne silindi", { action: { label: "Geri al", onClick: () => st().geriAl(p.id) } }); }} aria-label="Sil" className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 hover:bg-white/[0.07] hover:text-rose-300"><Trash2 className="h-4 w-4" /></button></Tooltip>
                    </span>
                  </div>
                  <div role="tablist" className="flex gap-5 px-1">
                    {([["sahne", "Metin", TypeIcon], ["gorsel", "Görsel", ImageIcon], ["ses", "Ses", Mic]] as const).map(([id, ad, I]) => (
                      <button key={id} role="tab" aria-selected={sekme === id} onClick={() => setSekme(id)} className={cn("relative -mb-3 flex items-center gap-1.5 pb-3 text-[13.5px] font-medium transition-colors", sekme === id ? "text-metin" : "text-metin-3 hover:text-metin-2")}>
                        <I className="h-4 w-4" />{ad}{sekme === id && <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-white" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            {sekme === "video" ? <ExVideoAyar p={p} yazar={yazar} onUretToplu={topluUret} />
              : secili && (sekme === "sahne" ? <SahneDuzen key={secili.id} p={p} s={secili} yazar={yazar} /> : sekme === "gorsel" ? <ExGorselPanel key={secili.id} p={p} s={secili} /> : <ExSesPanel key={secili.id} p={p} s={secili} />)}
          </aside>
        </div>
      </div>
      <AnimatePresence>{disa && <MontajDisaAktar proje={montaj} onKapat={() => setDisa(false)} onOran={(o) => { if (o === "4:5") return void toast.warning("Bu format desteklenmiyor", { description: "Explainer 16:9, 9:16 ve 1:1 formatlarını destekler. Bunlardan birini seç." }); st().ayarGuncelle(p.id, { oran: o }); }} />}</AnimatePresence>
    </div>
  );
}

/** Seçili sahnenin metni: tür, ekran yazısı, türe özel alanlar, anlatım, AI ile düzenleme. */
function SahneDuzen({ p, s, yazar }: { p: ExProje; s: ExSahne; yazar: boolean }) {
  const g = (patch: Partial<ExSahne>) => useExplainer.getState().sahneGuncelle(p.id, s.id, patch);
  const [aiMenu, setAiMenu] = useState(false);
  const [mesgul, setMesgul] = useState(false);
  const rakam = s.tur !== "istatistik" ? rakamBul(s.anlatim) : null;
  const girdi = "w-full rounded-[12px] bg-white/[0.05] px-3.5 text-metin outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-metin-2 focus:ring-white/25";
  const tur = (t: SahneTur) => {
    const ek: Partial<ExSahne> = { tur: t };
    if (t === "liste" && !s.maddeler?.length) ek.maddeler = s.anlatim.split(/,|\sve\s|\./).map((x) => x.trim()).filter((x) => x.length > 2).slice(0, 3).map((x) => x.split(" ").slice(0, 4).join(" "));
    if (t === "istatistik" && !s.deger) { const r = rakamBul(s.anlatim); ek.deger = r?.deger ?? "%0"; ek.etiket = r?.etiket ?? "açıklama"; }
    if (t === "cta" && !s.etiket) ek.etiket = "Hemen başla";
    g(ek);
  };
  const donustur = async (mod: Parameters<typeof sahneDonustur>[2]) => {
    setAiMenu(false); setMesgul(true);
    try { g(await sahneDonustur(p, s, mod)); toast.success("Sahne güncellendi", { description: "Ctrl+Z ile geri alabilirsin." }); }
    catch (e) { toast.error("Sahne dönüştürülemedi", { description: `${e instanceof Error ? e.message : "Beklenmeyen bir sorun çıktı."} Yeniden dene.` }); }
    finally { setMesgul(false); }
  };
  return (
    <>
      <Bolum baslik="Sahne türü">
        <div className="grid grid-cols-3 gap-1.5">
          {SAHNE_TURLERI.map((t) => {
            const I = TUR_IKON[t.id], sec = s.tur === t.id;
            return (
              <button key={t.id} onClick={() => tur(t.id)} aria-pressed={sec} title={t.alt}
                className={cn("flex h-[58px] flex-col items-center justify-center gap-1 rounded-[12px] text-[12.5px] font-medium ring-1 ring-inset transition-colors", sec ? "bg-white/[0.09] text-metin ring-white/40" : "bg-white/[0.03] text-metin-2 ring-white/[0.06] hover:bg-white/[0.06] hover:text-metin")}>
                <I className={cn("h-4 w-4", sec ? "text-metin" : "text-metin-3")} />{t.ad}
              </button>
            );
          })}
        </div>
      </Bolum>
      <Bolum baslik="Ekrandaki yazı">
        {s.tur === "istatistik" ? (
          <div className="grid grid-cols-[110px_1fr] gap-2">
            <input value={s.deger ?? ""} onChange={(e) => g({ deger: e.target.value.slice(0, 16) })} placeholder="%73" aria-label="Rakam" className={cn(girdi, "h-11 text-[17px] font-semibold tabular-nums")} />
            <input value={s.etiket ?? ""} onChange={(e) => g({ etiket: e.target.value.slice(0, 80) })} placeholder="Açıklama" aria-label="Açıklama" className={cn(girdi, "h-11 text-[14px]")} />
          </div>
        ) : (
          <input value={s.baslik} onChange={(e) => g({ baslik: e.target.value.slice(0, 70) })} placeholder={s.tur === "anlatim" ? "İsteğe bağlı üst etiket" : "Ekranda görünecek yazı"} aria-label="Ekran yazısı" className={cn(girdi, "h-11 text-[15px] font-semibold")} />
        )}
        {s.tur === "liste" && (
          <div className="space-y-1.5">
            <AltBaslik>Maddeler</AltBaslik>
            {(s.maddeler ?? []).map((m, j) => (
              <div key={j} className="flex items-center gap-2"><span className="w-4 text-center text-[12.5px] tabular-nums text-metin-3">{j + 1}</span>
                <input value={m} onChange={(e) => g({ maddeler: (s.maddeler ?? []).map((x, k) => (k === j ? e.target.value.slice(0, 40) : x)) })} aria-label={`Madde ${j + 1}`} placeholder={`${j + 1}. madde, kısa tut`} className={cn(girdi, "h-9 text-[13.5px]")} />
                <button onClick={() => g({ maddeler: (s.maddeler ?? []).filter((_, k) => k !== j) })} aria-label="Maddeyi sil" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-metin-3 hover:bg-white/[0.07] hover:text-metin"><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            {(s.maddeler?.length ?? 0) < 4 && <button onClick={() => g({ maddeler: [...(s.maddeler ?? []), ""] })} className="flex items-center gap-1 pl-6 text-[12.5px] font-medium text-metin-2 hover:text-metin"><Plus className="h-3.5 w-3.5" />Madde ekle</button>}
          </div>
        )}
        {s.tur === "cta" && <input value={s.etiket ?? ""} onChange={(e) => g({ etiket: e.target.value.slice(0, 30) })} placeholder="Düğme yazısı (ör. Hemen dene)" aria-label="Çağrı düğmesi" className={cn(girdi, "h-10 text-[14px]")} />}
      </Bolum>
      <Bolum baslik="Anlatım" sag={
        <div className="relative">
          <button onClick={() => (yazar ? setAiMenu((v) => !v) : toast.info("AI yazar bağlı değil", { description: "Metni elle düzenleyebilirsin." }))} disabled={mesgul} className="flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-medium text-metin-2 ring-1 ring-inset ring-white/[0.1] hover:bg-white/[0.06] hover:text-metin">
            {mesgul ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}AI ile düzenle
          </button>
          <Yuzen acik={aiMenu} onKapat={() => setAiMenu(false)} yerlesim="alt-sag" bosluk={6} etiket="AI ile düzenle" className="w-44 rounded-[14px] border border-white/[0.09] bg-[#1b1c1f] p-1.5">
            {DONUSUM.map(([m, ad]) => <button key={m} onClick={() => void donustur(m)} className="flex w-full rounded-[10px] px-2.5 py-2 text-left text-[13px] text-metin hover:bg-white/[0.06]">{ad}</button>)}
          </Yuzen>
        </div>}>
        <textarea value={s.anlatim} onChange={(e) => g({ anlatim: e.target.value.slice(0, 900) })} rows={5} placeholder="Bu sahnede anlatıcı ne söylesin?" aria-label="Anlatım"
          className="block w-full resize-none rounded-[12px] bg-white/[0.05] p-3.5 text-[14px] leading-relaxed text-metin outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-metin-2 focus:ring-white/25" />
        <p className="flex items-center justify-between text-[12px] tabular-nums text-metin-3"><span>{s.anlatim.trim().split(/\s+/).filter(Boolean).length} sözcük · altyazı olur</span>{s.sesUrl && s.sesMetni !== s.anlatim && <span className="text-amber-200">Metin değişti, yeniden seslendir</span>}</p>
        {rakam && (
          <button onClick={() => { g({ tur: "istatistik", deger: rakam.deger, etiket: rakam.etiket }); toast.success("Rakam sahnesine çevrildi"); }}
            className="flex w-full items-center gap-2 rounded-[12px] bg-white/[0.04] px-3 py-2.5 text-left text-[12.5px] text-metin-2 ring-1 ring-inset ring-white/[0.08] hover:text-metin">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-aksan" /><span className="min-w-0 flex-1">Rakam bulundu: <b className="font-semibold text-metin">{rakam.deger}</b> · büyük rakam sahnesi yap</span><Check className="h-3.5 w-3.5" />
          </button>
        )}
      </Bolum>
    </>
  );
}
