"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Copy, Trash2, Plus, X, Wand2, Loader2, RefreshCw, Sparkles, FileText, ChevronDown, ChevronRight, Check, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { Yuzen } from "@/components/ui/Yuzen";
import { SESLER } from "@/lib/sesVeri";
import { KrediYildiz } from "@/components/ui/KrediHap";
import { Grup, Satir } from "@/components/film/Satir";
import { useExplainer, type ExProje, type ExSahne, type SahneTur, type ExMuzik } from "@/store/useExplainer";
import { SAHNE_TURLERI, EX_STILLER, MUZIK_RUH, sahneSure, toplamSure, stilPoster, stilVideo, rakamBul } from "@/lib/explainerMotor";
import { kisaSure } from "@/components/montaj/ortak";
import { senaryoOlustur, sahneDonustur, yazarHazir, KREDI } from "./exUretim";

const DONUSUM: [Parameters<typeof sahneDonustur>[2], string][] = [["kisalt", "Kısalt"], ["sadelestir", "Sadeleştir"], ["enerjik", "Daha enerjik"], ["genislet", "Genişlet"], ["yeniden", "Yeniden yaz"]];

/** Sahnenin küçük önizlemesi: stil karesi üstünde türüne göre ekran yazısı. */
export function SahneMini({ s, stil, sinif }: { s: ExSahne; stil: string; sinif?: string }) {
  const ic = s.tur === "istatistik" ? <span className="text-[22px] font-extrabold leading-none text-[#facc15] [text-shadow:0_2px_10px_rgba(0,0,0,0.7)]">{s.deger || "%0"}</span>
    : s.tur === "liste" ? <span className="w-full space-y-0.5 px-1 text-left">{(s.maddeler ?? []).filter((m) => m.trim()).slice(0, 3).map((m, i) => <span key={i} className="block truncate rounded-[3px] bg-black/70 px-1 text-[8.5px] font-semibold text-white">{i + 1}  {m}</span>)}</span>
    : s.tur === "cta" ? <span className="space-y-1 text-center"><span className="line-clamp-2 text-[10px] font-extrabold leading-tight text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.8)]">{s.baslik}</span>{s.etiket && <span className="inline-block rounded-full bg-[#55d6fd] px-1.5 py-px text-[8px] font-bold text-[#06232a]">{s.etiket}</span>}</span>
    : s.tur === "alinti" ? <span className="line-clamp-3 font-serif text-[10px] italic leading-tight text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.8)]">“{s.baslik}”</span>
    : s.tur === "anlatim" ? (s.baslik ? <span className="absolute left-1/2 top-[14%] max-w-[90%] -translate-x-1/2 truncate rounded-[3px] bg-[#facc15] px-1 text-[8.5px] font-bold text-[#06121a]">{s.baslik}</span> : null)
    : <span className="line-clamp-3 text-[11px] font-extrabold leading-tight text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.8)]">{s.baslik}</span>;
  return (
    <span className={cn("relative block overflow-hidden bg-black", sinif)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={s.gorselUrl ?? stilPoster(stil)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
      <span className="absolute inset-0 flex items-center justify-center p-1.5 text-center">{ic}</span>
    </span>
  );
}

/** İki adımlı akış göstergesi: Senaryo → Video (tamamlanan adım tıklanabilir). */
export function Adimlar({ adim, onSenaryo, onVideo }: { adim: 1 | 2; onSenaryo?: () => void; onVideo?: () => void }) {
  const A = ({ n, ad, aktif, bitti, onClick }: { n: number; ad: string; aktif: boolean; bitti: boolean; onClick?: () => void }) => (
    <button onClick={onClick} disabled={!onClick} aria-current={aktif ? "step" : undefined}
      className={cn("flex h-9 items-center gap-2 rounded-full pl-1.5 pr-3.5 text-[13px] font-medium transition-colors", aktif ? "bg-white/[0.1] text-metin" : "text-metin-2 enabled:hover:text-metin")}>
      <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold tabular-nums", bitti ? "bg-white/[0.14] text-metin" : aktif ? "bg-white text-[#0b0c0e]" : "bg-white/[0.08] text-metin-2")}>{bitti ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : n}</span>{ad}
    </button>
  );
  return (
    <nav aria-label="Adımlar" className="flex shrink-0 items-center gap-1 rounded-full bg-white/[0.04] p-1 ring-1 ring-inset ring-white/[0.07]">
      <A n={1} ad="Senaryo" aktif={adim === 1} bitti={adim === 2} onClick={adim === 2 ? onSenaryo : undefined} />
      <span className="h-px w-4 bg-white/15" />
      <A n={2} ad="Video" aktif={adim === 2} bitti={false} onClick={adim === 1 ? onVideo : undefined} />
    </nav>
  );
}

/** Senaryo onayı: sahneleri gözden geçir, düzenle; sonra videoyu kur. */
export function ExOnay({ p }: { p: ExProje }) {
  const st = useExplainer.getState;
  const [yazar, setYazar] = useState(false);
  const [yeniden, setYeniden] = useState(false);
  const [odak, setOdak] = useState<string | null>(p.sahneler[0]?.id ?? null);
  useEffect(() => { void yazarHazir().then(setYazar); }, []);
  const toplam = toplamSure(p.sahneler);
  const sesKredi = p.sahneler.reduce((a, s) => a + (s.anlatim.trim() ? KREDI.ses(s.anlatim) : 0), 0);
  const fark = toplam - p.ayar.hedefSn;

  const yenidenYaz = async () => {
    setYeniden(true);
    try { const r = await senaryoOlustur(p); st().sahneleriAyarla(p.id, r.sahneler, r.kaynak); toast.success("Senaryo yeniden yazıldı", { description: "Ctrl+Z ile öncekine dönebilirsin." }); }
    catch (e) { toast.error("Senaryo yeniden yazılamadı", { description: `${e instanceof Error ? e.message : "Beklenmeyen bir sorun çıktı."} Yeniden dene.` }); }
    finally { setYeniden(false); }
  };
  const kur = () => { st().guncelle(p.id, { onayBekliyor: false }); st().sahneSec(p.sahneler[0]?.id ?? null); window.scrollTo({ top: 0 }); toast.success("Video kuruldu", { description: "Önizleme ücretsiz; görsel ve sesi sahne sahne üretebilirsin." }); };

  useEffect(() => {
    const f = (e: KeyboardEvent) => { const h = e.target as HTMLElement; if (/^(INPUT|TEXTAREA)$/.test(h.tagName)) return; if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); st().geriAl(p.id); } };
    document.addEventListener("keydown", f); return () => document.removeEventListener("keydown", f);
  }, [p.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const uyari = Math.abs(fark) > p.ayar.hedefSn * 0.25;
  const git = (id: string) => { setOdak(id); document.getElementById(`sahne-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); };
  return (
    <div className="min-h-[calc(100dvh-var(--ust-nav))] bg-zemin">
      <div className="mx-auto w-full max-w-[1320px] space-y-4 px-4 pb-28 pt-5 sm:px-6">
        {/* Başlık + storyboard şeridi */}
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden rounded-[24px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
          <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
            <button onClick={() => st().sec(null)} aria-label="Geri" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-metin ring-1 ring-inset ring-white/[0.1] transition hover:bg-white/[0.06] active:scale-90"><ArrowLeft className="h-[18px] w-[18px]" /></button>
            <div className="min-w-0 flex-1 max-sm:order-last max-sm:basis-full">
              <input value={p.ad} onChange={(e) => st().guncelle(p.id, { ad: e.target.value.slice(0, 60) })} aria-label="Explainer adı"
                className="w-full min-w-0 truncate rounded-[8px] bg-transparent px-1 text-[21px] font-semibold tracking-[-0.02em] text-metin outline-none transition hover:bg-white/[0.03] focus:bg-white/[0.05]" />
              <p className="px-1 text-[13px] text-metin-3">Sahneleri gözden geçir; metinleri, türleri ve sırayı düzenle. Sonra videoyu kur.</p>
            </div>
            <Adimlar adim={1} onVideo={kur} />
          </div>
          <div className="flex gap-2 overflow-x-auto p-3 [scrollbar-width:thin] sm:px-5">
            {p.sahneler.map((x, i) => (
              <motion.button key={x.id} onClick={() => git(x.id)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }}
                className="group min-w-[118px] text-left" style={{ flex: `${sahneSure(x)} 1 0` }}>
                <SahneMini s={x} stil={p.ayar.stil} sinif={cn("h-[72px] w-full rounded-[10px] transition", odak === x.id ? "outline outline-2 -outline-offset-2 outline-white" : "outline outline-1 -outline-offset-1 outline-white/10 group-hover:outline-white/35")} />
                <span className="mt-1.5 flex items-center gap-1.5 text-[12px]"><span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/[0.08] px-1 text-[11px] font-semibold tabular-nums text-metin">{i + 1}</span><span className="truncate text-metin-2">{SAHNE_TURLERI.find((t) => t.id === x.tur)?.ad}</span><span className="ml-auto tabular-nums text-metin-3">{sahneSure(x).toFixed(1)} sn</span></span>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {p.senaryoKaynak !== "ai" && (
          <p className="flex items-start gap-2.5 rounded-[16px] bg-amber-300/[0.07] px-4 py-3 text-[13px] leading-snug text-amber-100/90 ring-1 ring-inset ring-amber-300/20">
            <FileText className="mt-0.5 h-4 w-4 shrink-0" />
            {p.senaryoKaynak === "metin" ? "Metnin sözcükleri korunarak sahnelere bölündü. Ekran yazılarını ve sahne türlerini kontrol et." : "AI senaryo yazarı bağlı olmadığı için konudan bir taslak kuruldu. Sarı çerçeveli boş alanları kendi bilgilerinle doldur; boş kalanlar videoda görünmez."}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-3">
            {p.sahneler.map((x, i) => <OnaySahne key={x.id} p={p} s={x} i={i} yazar={yazar} odak={odak === x.id} onOdak={() => setOdak(x.id)} />)}
            <motion.button whileTap={{ scale: 0.99 }} onClick={() => st().sahneEkle(p.id, p.sahneler[p.sahneler.length - 2]?.id ?? null, { tur: "anlatim", baslik: "Yeni sahne", anlatim: "" })}
              className="group flex h-14 w-full items-center justify-center gap-2 rounded-[20px] border border-dashed border-white/[0.14] text-[14px] font-medium text-metin-2 transition hover:border-white/30 hover:text-metin">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] transition-transform duration-300 group-hover:rotate-90"><Plus className="h-4 w-4" /></span>Sahne ekle
            </motion.button>
          </div>

          <aside className="lg:sticky lg:top-[72px] lg:self-start">
            <div className="overflow-hidden rounded-[24px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
              <div className="relative aspect-video overflow-hidden bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={stilPoster(p.ayar.stil)} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <video key={p.ayar.stil} src={stilVideo(p.ayar.stil)} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white backdrop-blur">Stil örneği</span>
                <span className="absolute inset-x-3 bottom-3 text-[15px] font-semibold text-white">{EX_STILLER.find((x) => x.tohum === p.ayar.stil)?.ad}</span>
              </div>
              <div className="p-4">
                <dl className="grid grid-cols-3 gap-2">
                  {([["Sahne", String(p.sahneler.length)], ["Süre", kisaSure(toplam)], ["Hedef", kisaSure(p.ayar.hedefSn)]] as const).map(([a, d]) => (
                    <div key={a} className="rounded-[14px] px-3 py-2.5 ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}><dt className="text-[11.5px] text-metin-3">{a}</dt><dd className="mt-0.5 text-[17px] font-semibold tabular-nums text-metin">{d}</dd></div>
                  ))}
                </dl>
                <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                  <motion.span animate={{ width: `${Math.min(100, (toplam / Math.max(1, p.ayar.hedefSn)) * 100)}%` }} transition={{ duration: 0.5 }} className={cn("absolute inset-y-0 left-0 rounded-full", uyari ? "bg-amber-300" : "bg-white")} />
                </div>
                <p className={cn("mt-1.5 text-[12.5px]", uyari ? "text-amber-200" : "text-metin-3")}>{uyari ? (fark > 0 ? "Hedeften uzun: bazı sahneleri kısalt ya da sil." : "Hedeften kısa: sahne ekle ya da anlatımı genişlet.") : "Süre hedefe uygun."}</p>
                <div className="mt-4">
                  <Grup>
                    <Satir ad="Görsel stil" deger={p.ayar.stil} onSec={(v) => st().ayarGuncelle(p.id, { stil: v })} izgara={2} genislik={380} oran="aspect-[16/10]"
                      secenekler={EX_STILLER.map((x) => ({ deger: x.tohum, ad: x.ad, alt: x.kisa, kapak: stilPoster(x.tohum) }))} />
                    <Satir ad="Format" deger={p.ayar.oran} onSec={(v) => st().ayarGuncelle(p.id, { oran: v })} genislik={260}
                      on={<span className="flex h-full w-full items-center justify-center rounded-[9px] bg-white/[0.08]"><span className="block rounded-[3px]" style={{ border: "1.5px solid rgba(255,255,255,0.85)", ...(p.ayar.oran === "9:16" ? { width: 11, height: 19 } : p.ayar.oran === "1:1" ? { width: 16, height: 16 } : { width: 20, height: 12 }) }} /></span>}
                      secenekler={[{ deger: "16:9", ad: "16:9 yatay", alt: "YouTube · sunum" }, { deger: "9:16", ad: "9:16 dikey", alt: "Reels · Shorts" }, { deger: "1:1", ad: "1:1 kare", alt: "Gönderi" }]} />
                    <Satir ad="Anlatıcı" deger={p.ayar.ses} onSec={(v) => { const x = SESLER.find((y) => y.ad === v); st().ayarGuncelle(p.id, { ses: v, sesId: x?.sesId }); }} genislik={320}
                      on={<span className="flex h-full w-full items-center justify-center rounded-[9px] text-[14px] font-semibold text-white" style={{ background: `linear-gradient(140deg, ${SESLER.find((y) => y.ad === p.ayar.ses)?.renk ?? "#55d6fd"}, #00000055)` }}>{p.ayar.ses.slice(0, 1)}</span>}
                      secenekler={SESLER.map((x) => ({ deger: x.ad, ad: x.ad, alt: [x.cinsiyet, x.aksan ?? x.dil, x.tanim].filter(Boolean).join(" · "), on: <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white" style={{ background: `linear-gradient(140deg, ${x.renk}, ${x.renk}55)` }}>{x.ad.slice(0, 1)}</span> }))} />
                    <Satir ad="Müzik" deger={p.ayar.muzik} onSec={(v) => st().ayarGuncelle(p.id, { muzik: v })} genislik={260} on={<Music2 className="h-4 w-4 text-metin-2" />}
                      secenekler={(["kurumsal", "sakin", "enerjik", "duygusal", "yok"] as ExMuzik[]).map((m) => ({ deger: m, ad: m === "yok" ? "Müzik yok" : MUZIK_RUH[m].ad, alt: m === "yok" ? "Yalnız anlatım" : `${MUZIK_RUH[m].bpm} BPM` }))} />
                  </Grup>
                </div>
                <motion.button whileTap={{ scale: 0.98 }} onClick={kur} className="group mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-[15px] font-semibold text-black">Videoyu kur<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></motion.button>
                <button onClick={() => void yenidenYaz()} disabled={yeniden} className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-full text-[13.5px] font-medium text-metin-2 ring-1 ring-inset ring-white/[0.08] transition hover:text-metin hover:ring-white/20 disabled:opacity-60">
                  {yeniden ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Senaryoyu yeniden yaz
                </button>
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-3 text-[12px]">
                  <span className="rounded-[12px] px-3 py-2 ring-1 ring-inset ring-white/[0.07]"><span className="block text-metin-3">Görseller</span><span className="flex items-center gap-1 font-semibold tabular-nums text-metin"><KrediYildiz className="h-3 w-3" />{p.sahneler.length * KREDI.gorsel}</span></span>
                  <span className="rounded-[12px] px-3 py-2 ring-1 ring-inset ring-white/[0.07]"><span className="block text-metin-3">Seslendirme</span><span className="flex items-center gap-1 font-semibold tabular-nums text-metin"><KrediYildiz className="h-3 w-3" />{sesKredi}</span></span>
                  <span className="col-span-2 flex items-center gap-1.5 rounded-[12px] px-3 py-2 text-metin-2 ring-1 ring-inset ring-white/[0.07]"><Check className="h-3.5 w-3.5 text-emerald-300" />Kurulum ve önizleme ücretsiz</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function OnaySahne({ p, s, i, yazar, odak, onOdak }: { p: ExProje; s: ExSahne; i: number; yazar: boolean; odak: boolean; onOdak: () => void }) {
  const st = useExplainer.getState;
  const g = (patch: Partial<ExSahne>) => st().sahneGuncelle(p.id, s.id, patch);
  const [turMenu, setTurMenu] = useState(false);
  const [aiMenu, setAiMenu] = useState(false);
  const [mesgul, setMesgul] = useState(false);
  const rakam = s.tur !== "istatistik" ? rakamBul(s.anlatim) : null;
  const tur = (t: SahneTur) => {
    const ek: Partial<ExSahne> = { tur: t };
    if (t === "liste" && !s.maddeler?.length) ek.maddeler = s.anlatim.split(/,|\sve\s|\./).map((x) => x.trim()).filter((x) => x.length > 2).slice(0, 3).map((x) => x.split(" ").slice(0, 4).join(" "));
    if (t === "istatistik" && !s.deger) { const r = rakamBul(s.anlatim); ek.deger = r?.deger ?? "%0"; ek.etiket = r?.etiket ?? "açıklama"; }
    if (t === "cta" && !s.etiket) ek.etiket = "Hemen başla";
    g(ek); setTurMenu(false);
  };
  const donustur = async (mod: Parameters<typeof sahneDonustur>[2]) => {
    setAiMenu(false); setMesgul(true);
    try { g(await sahneDonustur(p, s, mod)); toast.success("Sahne güncellendi", { description: "Ctrl+Z ile geri alabilirsin." }); }
    catch (e) { toast.error("Sahne dönüştürülemedi", { description: `${e instanceof Error ? e.message : "Beklenmeyen bir sorun çıktı."} Yeniden dene.` }); }
    finally { setMesgul(false); }
  };
  const girdi = "w-full rounded-[12px] bg-white/[0.035] outline-none ring-1 ring-inset ring-white/[0.07] transition placeholder:text-metin-3 hover:ring-white/[0.13] focus:bg-white/[0.05] focus:ring-white/25";
  const etiket = "mb-1.5 block text-[12px] font-medium text-metin-3";
  const ib = "flex h-8 w-8 items-center justify-center rounded-full text-metin-3 transition-colors hover:bg-white/[0.07] hover:text-metin disabled:opacity-30";
  return (
    <motion.div id={`sahne-${s.id}`} onFocusCapture={onOdak} onClick={onOdak} transition={{ duration: 0.2 }}
      className={cn("group min-w-0 scroll-mt-24 overflow-hidden rounded-[22px] ring-1 ring-inset transition-shadow", odak ? "ring-white/[0.22]" : "ring-white/[0.07]")} style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
        <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white/[0.09] px-1.5 text-[12.5px] font-semibold tabular-nums text-metin">{i + 1}</span>
        <span className="rounded-full px-2.5 py-0.5 text-[12px] tabular-nums text-metin-3 ring-1 ring-inset ring-white/[0.08]">{sahneSure(s).toFixed(1)} sn</span>
        {(!s.anlatim.trim() || (s.tur === "liste" && (s.maddeler ?? []).some((m) => !m.trim())) || (s.tur === "istatistik" && !s.deger?.trim())) && <span className="rounded-full bg-amber-300/[0.14] px-2 py-0.5 text-[11.5px] font-semibold text-amber-200">Doldur</span>}
          <div className="relative">
            <button onClick={() => setTurMenu((v) => !v)} className="flex h-7 items-center gap-1 rounded-full bg-white/[0.07] pl-2.5 pr-2 text-[12.5px] font-medium text-metin hover:bg-white/[0.1]">
              {SAHNE_TURLERI.find((x) => x.id === s.tur)?.ad}<ChevronDown className="h-3.5 w-3.5 text-metin-3" />
            </button>
            <Yuzen acik={turMenu} onKapat={() => setTurMenu(false)} yerlesim="alt-sol" bosluk={6} etiket="Sahne türü" className="w-56 rounded-[14px] border border-white/[0.09] bg-[#1b1c1f] p-1.5">
              {SAHNE_TURLERI.map((t) => (
                <button key={t.id} onClick={() => tur(t.id)} className={cn("flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left hover:bg-white/[0.06]", s.tur === t.id && "bg-white/[0.05]")}>
                  <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-metin">{t.ad}</span><span className="block text-[12px] text-metin-3">{t.alt}</span></span>
                  {s.tur === t.id && <Check className="h-4 w-4 text-metin" />}
                </button>
              ))}
            </Yuzen>
          </div>
          <span className="ml-auto flex items-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 max-sm:opacity-100 [@media(hover:none)]:opacity-100">
            <div className="relative">
              <button onClick={() => (yazar ? setAiMenu((v) => !v) : toast.info("AI yazar bağlı değil", { description: "Metni elle düzenleyebilirsin." }))} disabled={mesgul} className="flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12.5px] font-medium text-metin-2 hover:bg-white/[0.07] hover:text-metin">
                {mesgul ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}AI ile
              </button>
              <Yuzen acik={aiMenu} onKapat={() => setAiMenu(false)} yerlesim="alt-sag" bosluk={6} etiket="AI ile düzenle" className="w-44 rounded-[14px] border border-white/[0.09] bg-[#1b1c1f] p-1.5">
                {DONUSUM.map(([m, ad]) => <button key={m} onClick={() => void donustur(m)} className="flex w-full rounded-[10px] px-2.5 py-2 text-left text-[13px] text-metin hover:bg-white/[0.06]">{ad}</button>)}
              </Yuzen>
            </div>
            <button onClick={() => st().sahneTasi(p.id, s.id, -1)} disabled={i === 0} aria-label="Yukarı" title="Yukarı" className={ib}><ArrowUp className="h-4 w-4" /></button>
            <button onClick={() => st().sahneTasi(p.id, s.id, 1)} disabled={i === p.sahneler.length - 1} aria-label="Aşağı" title="Aşağı" className={ib}><ArrowDown className="h-4 w-4" /></button>
            <button onClick={() => st().sahneEkle(p.id, s.id, { ...s, sesUrl: undefined, sesSure: undefined, sesMetni: undefined })} aria-label="Çoğalt" title="Çoğalt" className={ib}><Copy className="h-4 w-4" /></button>
            <button onClick={() => { if (p.sahneler.length <= 1) return void toast.error("Sahne silinemedi", { description: "Videoda en az bir sahne kalmalı." }); st().sahneSil(p.id, s.id); toast("Sahne silindi", { action: { label: "Geri al", onClick: () => st().geriAl(p.id) } }); }} aria-label="Sil" title="Sil" className={cn(ib, "hover:text-rose-300")}><Trash2 className="h-4 w-4" /></button>
          </span>
      </div>
      <div className="flex min-w-0 gap-4 p-4 max-sm:flex-col max-sm:gap-3">
      <div className="w-[240px] shrink-0 max-sm:w-full">
        <SahneMini s={s} stil={p.ayar.stil} sinif="aspect-video rounded-[14px] outline outline-1 -outline-offset-1 outline-white/10" />
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        {s.tur === "istatistik" ? (
          <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-2">
            <label><span className={etiket}>Rakam</span><input value={s.deger ?? ""} onChange={(e) => g({ deger: e.target.value.slice(0, 16) })} placeholder="%73" aria-label="Rakam" className={cn(girdi, "h-12 px-3 text-[24px] font-semibold tabular-nums text-metin")} /></label>
            <label><span className={etiket}>Açıklama</span><input value={s.etiket ?? ""} onChange={(e) => g({ etiket: e.target.value.slice(0, 80) })} placeholder="Rakamın açıklaması" aria-label="Açıklama" className={cn(girdi, "h-12 px-3 text-[14px] text-metin")} /></label>
          </div>
        ) : (
          <label className="block"><span className={etiket}>Ekran yazısı{s.tur === "anlatim" ? ", isteğe bağlı" : ""}</span>
            <input value={s.baslik} onChange={(e) => g({ baslik: e.target.value.slice(0, 70) })} placeholder={s.tur === "anlatim" ? "Örneğin: Neden önemli?" : "Ekrandaki yazı"} aria-label="Ekran yazısı"
              className={cn(girdi, "h-11 px-3 text-[15.5px] font-semibold text-metin")} /></label>
        )}
        {s.tur === "liste" && (
          <div className="space-y-1.5"><span className={etiket}>Maddeler</span>
            {(s.maddeler ?? []).map((m, j) => (
              <div key={j} className="flex items-center gap-2"><span className="w-4 text-center text-[12.5px] tabular-nums text-metin-3">{j + 1}</span>
                <input value={m} onChange={(e) => g({ maddeler: (s.maddeler ?? []).map((x, k) => (k === j ? e.target.value.slice(0, 40) : x)) })} aria-label={`Madde ${j + 1}`} placeholder={`${j + 1}. madde, kısa tut`} className={cn(girdi, "h-9 px-3 text-[13.5px] text-metin", !m.trim() && "ring-amber-300/40")} />
                <button onClick={() => g({ maddeler: (s.maddeler ?? []).filter((_, k) => k !== j) })} aria-label="Maddeyi sil" className="text-metin-3 hover:text-metin"><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            {(s.maddeler?.length ?? 0) < 4 && <button onClick={() => g({ maddeler: [...(s.maddeler ?? []), ""] })} className="flex items-center gap-1 pl-6 text-[12.5px] text-metin-2 hover:text-metin"><Plus className="h-3.5 w-3.5" />Madde ekle</button>}
          </div>
        )}
        {s.tur === "cta" && <label className="block"><span className={etiket}>Düğme yazısı</span><input value={s.etiket ?? ""} onChange={(e) => g({ etiket: e.target.value.slice(0, 30) })} placeholder="Örneğin: Hemen dene" aria-label="Çağrı düğmesi" className={cn(girdi, "h-10 px-3 text-[13.5px] text-metin")} /></label>}
        <label className="block"><span className={cn(etiket, "flex items-center justify-between")}>Anlatım<span className="tabular-nums">{s.anlatim.trim().split(/\s+/).filter(Boolean).length} sözcük</span></span>
        <textarea value={s.anlatim} onChange={(e) => g({ anlatim: e.target.value.slice(0, 900) })} rows={2} placeholder="Bu sahnede anlatıcı ne söylesin?" aria-label="Anlatım"
          className={cn(girdi, "block resize-none px-3 py-2.5 text-[14px] leading-relaxed text-metin [field-sizing:content]", !s.anlatim.trim() && "ring-amber-300/40")} /></label>
        <AnimatePresence>
          {rakam && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { g({ tur: "istatistik", deger: rakam.deger, etiket: rakam.etiket }); toast.success("Rakam sahnesine çevrildi"); }}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1 text-[12.5px] text-metin-2 ring-1 ring-inset ring-white/[0.08] hover:text-metin">
              <Sparkles className="h-3.5 w-3.5" />Rakam bulundu: <b className="font-semibold text-metin">{rakam.deger}</b> · büyük rakam sahnesi yap
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      </div>
    </motion.div>
  );
}
