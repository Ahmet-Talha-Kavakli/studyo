"use client";

/**
 * Uzun video stüdyosu girişi — "1 · Stüdyo" (2026-11-01, kullanıcı seçimi; Video, Shorts ve Explainer'ın onaylı kalıbı).
 *  Başlık kartı (Oluştur / Filmlerim kayan segment), mekanizmayı canlı gösteren vitrin (hikâye → perdeler → kareler →
 *  oynayan film; seçilen tür ve süreyle değişir), oynayan türlerle başla kartı ve altta yüzen cam istemci
 *  (hikâye + büyük çipler + beyaz Filmi planla). Plan ücretsizdir: planlayıcı bağlıysa AI yönetmen yazar, değilse türün perde şablonu.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, Check, Clapperboard, Clock, Copy, FileText, Film, Image as ImageIcon, LayoutGrid, Loader2, MessageSquareText, Music2, Play, Plus, Sparkles, Trash2, Upload,
} from "lucide-react";
import { cn, saltUrl } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { videoKrediHesap } from "@/lib/videoModelVeri";
import { Yuzen } from "@/components/ui/Yuzen";
import { KrediJeton } from "@/components/ui/KrediHap";
import { MarkaKare } from "@/components/studyo/hf";
import { useProjeler } from "@/store/useProjeler";
import { useFilm, type FilmProje } from "@/store/useFilm";
import { FILM_TURLERI, turBul, filmSn, sureYaz, type FilmTur } from "@/lib/filmMotor";
import { FILM_STILLER, stilBul, planKur, planlayiciHazir, cekimTake, KARE_KREDI } from "./filmUretim";
import { OzelGirdi, Cip, FILM_MODELLER, FORMATLAR, IkonKaro, Kart, MUZIKLER, MUZIK_IKON, MenuBaslik, MenuSatiri, TON_IKON, ORNEKLER, OranSimge, PANO, SURELER, Segment, TONLAR, TUR_MEDYA, VH, ease, goreli, perdeRengi, yay, zaman } from "./ortak";

export { FILM_MODELLER } from "./ortak";

type Pop = null | "tur" | "sure" | "stil" | "format" | "ton" | "muzik" | "model";

export function FilmGiris() {
  const projeler = useFilm((s) => s.projeler);
  const uretimler = useProjeler((s) => s.uretimler);
  const [sekme, setSekme] = useState<"olustur" | "filmler">("olustur");
  const [logline, setLogline] = useState("");
  const [tur, setTur] = useState<FilmTur>("kisa");
  const [hedefDk, setHedefDk] = useState(3);
  const [oran, setOran] = useState<FilmProje["oran"]>("16:9");
  const [stil, setStil] = useState("sinema");
  const [ozelTur, setOzelTur] = useState("");
  const [ozelTurGirdi, setOzelTurGirdi] = useState("");
  const [ozelStilGirdi, setOzelStilGirdi] = useState("");
  const [model, setModel] = useState("Kling 3.0");
  const [ton, setTon] = useState("sinematik");
  const [muzik, setMuzik] = useState<FilmProje["muzik"]>("duygusal");
  const [pop, setPop] = useState<Pop>(null);
  const [mesgul, setMesgul] = useState(false);
  const [ai, setAi] = useState<boolean | null>(null);
  const kutuRef = useRef<HTMLTextAreaElement>(null);
  const dosyaRef = useRef<HTMLInputElement>(null);
  useEffect(() => { void planlayiciHazir().then(setAi); }, []);

  const T = turBul(tur);
  const sn = hedefDk * 60;
  const cekim = Math.round(sn / T.ortCekim);
  const bolum = Math.max(T.bolumler.length, T.bolumler.length * Math.ceil(sn / (T.bolumler.length * 360)));
  const videoKredi = cekim * videoKrediHesap(model);
  const kareKredi = cekim * KARE_KREDI;
  const hazir = logline.trim().length >= 8;
  const ac = (x: Pop) => setPop((v) => (v === x ? null : x));
  const odak = () => { setSekme("olustur"); setTimeout(() => kutuRef.current?.focus(), 50); };

  const olustur = async () => {
    if (!hazir) { kutuRef.current?.focus(); return void toast.error("Hikâye çok kısa", { description: "Ne olduğunu, kimin başına geldiğini ve nerede geçtiğini bir iki cümleyle anlat." }); }
    setMesgul(true);
    try {
      const hikaye = ozelTur ? `${logline.trim()} (Tür: ${ozelTur})` : logline.trim();
      const r = await planKur({ logline: hikaye, tur, hedefDk, ton });
      const ilk = logline.trim().split(/[.,:;!?]/)[0].trim();
      const ad = ilk.length <= 44 ? ilk : `${ilk.slice(0, 44).replace(/\s+\S*$/, "")}…`;
      useFilm.getState().olustur({ ad, logline: hikaye, tur, hedefDk, oran, stil, model, kareModel: "Nano Banana Pro", muzik, bolumler: r.bolumler, plan: r.kaynak });
      const n = r.bolumler.reduce((a, b) => a + b.cekimler.length, 0);
      toast.success(`${n} çekim planlandı`, { description: r.kaynak === "ai" ? `${r.bolumler.length} perde, AI yönetmen planı. Ücretsiz.` : `${r.bolumler.length} perde, ${T.ad} yapısı. Çekimleri dilediğin gibi düzenleyebilirsin.` });
    } catch (e) { toast.error("Plan kurulamadı", { description: e instanceof Error ? e.message : "Yönetmen planı oluşturulamadı. Biraz sonra yeniden dene." }); }
    finally { setMesgul(false); }
  };

  const senaryoYukle = async (d?: File | null) => {
    if (!d) return;
    if (d.size > 400_000) return void toast.error("Dosya çok büyük", { description: "En fazla 400 KB'lık bir metin dosyası yükle." });
    const metin = (await d.text()).replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
    if (!metin) return void toast.error("Dosya boş", { description: "Metin içeren bir .txt ya da .md dosyası seç." });
    setLogline(metin.slice(0, 1200)); odak();
    toast.success("Senaryo yüklendi", { description: metin.length > 1200 ? "İlk 1.200 karakter hikâye olarak alındı; plan bunun üzerine kurulur." : "Plan bu metnin üzerine kurulur." });
  };

  /** Film kartının kareleri: üretilmiş çekimlerin ilk beşi (yoksa stil kapağı). */
  const kareler = useMemo(() => (p: FilmProje) => {
    const l: string[] = [];
    for (const b of p.bolumler) for (const c of b.cekimler) {
      const { video, kare } = cekimTake(c, uretimler); const g = saltUrl(video?.gorselUrl) ?? saltUrl(kare?.gorselUrl);
      if (g && !l.includes(g)) l.push(g);
      if (l.length >= 5) return l;
    }
    return l;
  }, [uretimler]);

  const segSecenekleri = [{ id: "olustur" as const, ad: "Oluştur", ikon: Sparkles }, { id: "filmler" as const, ad: <>Filmlerim{projeler.length > 0 && <span className="text-[11.5px] tabular-nums opacity-50">{projeler.length}</span>}</>, ikon: Film }];
  const M = TUR_MEDYA[tur];
  const sStil = stilBul(stil);

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col px-4 pb-24 pt-4 sm:block sm:px-6 sm:pb-[220px] sm:pt-5">
      <input ref={dosyaRef} type="file" accept=".txt,.md,text/plain,text/markdown" hidden onChange={(e) => { void senaryoYukle(e.target.files?.[0]); e.target.value = ""; }} />

      {/* Başlık kartı */}
      <div className="flex min-h-[64px] items-center gap-3 rounded-[22px] bg-[#121315] px-3 py-2.5 ring-1 ring-inset ring-white/[0.07] sm:px-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.07] text-white"><Clapperboard className="h-5 w-5" /></span>
        <span className="min-w-0 max-sm:hidden"><h1 className="truncate text-[15.5px] font-semibold tracking-[-0.01em] text-white">Uzun video stüdyosu</h1><p className="truncate text-[12.5px] text-white/50 max-sm:hidden">Hikâyeden perde perde film, 1 dakikadan 1 saate</p></span>
        <Segment id="film-sekme" deger={sekme} set={setSekme} secenekler={segSecenekleri} className="ml-auto" />
      </div>

      <div className="order-2 sm:contents"><AnimatePresence mode="wait" initial={false}>
        {sekme === "olustur" ? (
          <motion.div key="olustur" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease }} className="mt-4 flex flex-col gap-4">
            {/* Vitrin: arkada türün örnek filmi oynar, solda başlık, sağda buzlu cam storyboard (hikâye → perdeler → kareler, oynatma çizgisiyle) */}
            <section className="relative isolate overflow-hidden rounded-[28px] bg-[#0b0c0e] ring-1 ring-inset ring-white/[0.08] lg:min-h-[460px]">
              <AnimatePresence initial={false}>
                <motion.video key={M.klip} src={VH(M.klip).video} poster={VH(M.klip).poster} autoPlay muted loop playsInline aria-hidden
                  initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.1, ease }}
                  className="absolute inset-0 -z-10 h-full w-full object-cover" />
              </AnimatePresence>
              <span aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#0b0c0e_0%,rgba(11,12,14,0.92)_30%,rgba(11,12,14,0.45)_62%,rgba(11,12,14,0.25)_100%)] max-lg:bg-[linear-gradient(180deg,rgba(11,12,14,0.55)_0%,rgba(11,12,14,0.85)_55%,#0b0c0e_100%)]" />
              <span aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-[#0b0c0e]/80 to-transparent" />
              <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1 text-[11.5px] font-medium text-white/90 ring-1 ring-inset ring-white/15 backdrop-blur-xl max-lg:hidden"><Play className="h-3 w-3 fill-current" />Örnek film · {T.ad}</span>
              <div className="grid grid-cols-[minmax(0,1fr)] gap-6 px-5 py-7 sm:px-10 lg:min-h-[460px] lg:grid-cols-[minmax(0,1fr)_minmax(0,600px)] lg:items-end lg:gap-10 lg:py-10">
                <div className="lg:self-center">
                  <h2 className="text-[40px] font-semibold leading-[1.02] tracking-[-0.05em] text-white sm:text-[58px]">Bir fikir yaz.<br /><span className="hero-isilti">Film olsun.</span></h2>
                  <p className="mt-4 max-w-[440px] text-[15.5px] leading-relaxed text-white/70">Hikâyeni yaz; perdeler ve çekimler ücretsiz planlanır. Kareleri gör, beğendiklerini videoya çevir, montaja aktar.</p>
                  <ol className="mt-6 flex flex-wrap gap-2">
                    {([["Hikâyeni yaz", FileText], ["Kareleri gör", ImageIcon], ["Filme çevir", Film]] as const).map(([a, I], n) => (
                      <li key={a} className="flex h-9 items-center gap-2 rounded-full bg-white/[0.07] pl-1 pr-3.5 text-[12.5px] text-white/85 ring-1 ring-inset ring-white/[0.1] backdrop-blur-xl">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.1] text-[12px] font-semibold tabular-nums text-white">{n + 1}</span><I className="h-3.5 w-3.5 text-white/60" />{a}
                      </li>
                    ))}
                  </ol>
                </div>
                <Mekanizma key={tur} tur={tur} sn={sn} logline={logline.trim() || ORNEKLER.find((o) => o.tur === tur)?.metin || ORNEKLER[0].metin} />
              </div>
            </section>

            {/* Türle başla */}
            <Kart baslik="Türle başla" alt="Perde yapısı türe göre kurulur" ikon={LayoutGrid}
              sag={<button onClick={() => dosyaRef.current?.click()} className="flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 text-[13px] font-medium text-white/85 transition hover:bg-white/[0.12] active:scale-[0.97]"><Upload className="h-4 w-4" /><span className="max-sm:hidden">Senaryo yükle</span></button>}>
              <div className="grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-3 sm:p-4 xl:grid-cols-6">
                {FILM_TURLERI.map((t) => <TurKarti key={t.id} id={t.id} ad={t.ad} alt={TUR_MEDYA[t.id].sure} secili={t.id === tur} onSec={() => { setTur(t.id); if (!logline.trim()) kutuRef.current?.focus(); }} />)}
              </div>
            </Kart>
          </motion.div>
        ) : (
          <motion.div key="filmler" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease }} className="mt-4">
            <Kart baslik="Filmlerim" ikon={Film} alt={projeler.length ? `${projeler.length} film · en son düzenlenen önce` : undefined}
              sag={projeler.length ? <button onClick={odak} className="flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-black active:scale-[0.97]"><Plus className="h-4 w-4" />Yeni film</button> : undefined}>
              {projeler.length ? (
                <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-3 2xl:grid-cols-4">
                  {[...projeler].sort((a, b) => b.guncelleme - a.guncelleme).map((p, i) => <FilmKarti key={p.id} p={p} k={kareler(p)} i={i} />)}
                </div>
              ) : (
                <div className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
                  <span className="relative flex h-14 w-24 shrink-0">
                    {TUR_MEDYA.kisa.kareler.slice(0, 3).map((g, n) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={g} src={g} alt="" className="absolute top-0 h-14 w-12 rounded-[10px] object-cover ring-2 ring-[#121315]" style={{ left: n * 22, transform: `rotate(${(n - 1) * 7}deg)`, zIndex: 3 - Math.abs(n - 1) }} />
                    ))}
                  </span>
                  <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold text-white">Henüz filmin yok</span><span className="block text-[13px] text-white/55">Hikâyeni yaz; perdeler ve çekimler saniyeler içinde, ücretsiz planlanır.</span></span>
                  <button onClick={odak} className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black active:scale-[0.97]">İlk filmini planla<ArrowRight className="h-4 w-4" /></button>
                </div>
              )}
            </Kart>
          </motion.div>
        )}
      </AnimatePresence></div>

      {/* Yüzen cam istemci (telefonda başlığın altında, akışın içinde) */}
      <div className="pointer-events-none order-1 mt-3 flex flex-col items-center gap-2 sm:fixed sm:inset-x-4 sm:bottom-4 sm:z-[41] sm:mt-0">
        <AnimatePresence initial={false}>
          {!logline && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.25, ease }} className="pointer-events-auto w-full max-w-[1160px]">
              <div className="gizli-scroll flex gap-1.5 overflow-x-auto px-1 pb-0.5 sm:justify-center">
                {ORNEKLER.map((o, k) => (
                  <motion.button key={o.metin} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * k, duration: 0.3, ease }}
                    onClick={() => { setLogline(o.metin); setTur(o.tur); kutuRef.current?.focus(); }} title={o.metin}
                    className="cam-istemci flex h-9 shrink-0 items-center gap-2 rounded-full pl-1 pr-3.5 text-[12.5px] font-medium text-white/85 transition hover:text-white active:scale-[0.97]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={TUR_MEDYA[o.tur].kareler[0]} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />{o.ad}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, ease, delay: 0.1 }}
          className="cam-istemci pointer-events-auto relative w-full max-w-[1160px] rounded-[26px] p-3"
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void olustur(); } }}>
          <div className="relative px-2 pt-1">
            <textarea ref={kutuRef} value={logline} onChange={(e) => setLogline(e.target.value.slice(0, 1200))} rows={2} aria-label="Hikâye"
              placeholder="Filmin ne anlatıyor? Kim, nerede, ne oluyor; bir iki cümle yeter."
              className="block max-h-[132px] min-h-[52px] w-full resize-none bg-transparent pr-8 text-[15.5px] leading-relaxed text-white outline-none placeholder:text-white/45 sm:text-[16px]" />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className="gizli-scroll min-w-0 flex-1 overflow-x-auto max-sm:-mx-3 max-sm:basis-full max-sm:px-3 sm:pr-5 sm:[mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)]">
              <div className="flex w-max items-center gap-1.5">
                <div className="relative">
                  <Cip etiket="Tür" deger={ozelTur || T.ad} gorsel={VH(TUR_MEDYA[tur].klip).poster} acik={pop === "tur"} onClick={() => ac("tur")} />
                  <Yuzen acik={pop === "tur"} onKapat={() => setPop(null)} yerlesim="ust-sol" bosluk={10} etiket="Tür" className={PANO} style={{ width: "min(360px, calc(100vw - 24px))" }}>
                    <MenuBaslik>Tür</MenuBaslik>
                    <OzelGirdi deger={ozelTurGirdi} set={setOzelTurGirdi} secili={!!ozelTur} ph="Ör. distopik bilim kurgu, romantik komedi" alt={`Yapı: ${T.ad}`}
                      uygula={() => { setOzelTur(ozelTurGirdi.trim()); setPop(null); }} />
                    {FILM_TURLERI.map((t) => (
                      <MenuSatiri key={t.id} secili={!ozelTur && t.id === tur} onClick={() => { setTur(t.id); setOzelTur(""); setPop(null); }} ad={t.ad} alt={`${t.alt} · ${t.bolumler.length} perde`}
                        // eslint-disable-next-line @next/next/no-img-element
                        on={<img src={VH(TUR_MEDYA[t.id].klip).poster} alt="" className="h-10 w-14 shrink-0 rounded-[10px] object-cover" />} />
                    ))}
                  </Yuzen>
                </div>
                <div className="relative">
                  <Cip etiket="Süre" deger={hedefDk < 60 ? `${hedefDk} dk` : "1 saat"} ikon={<Clock className="h-4 w-4" />} acik={pop === "sure"} onClick={() => ac("sure")} />
                  <Yuzen acik={pop === "sure"} onKapat={() => setPop(null)} yerlesim="ust-sol" bosluk={10} etiket="Süre" className={cn(PANO, "p-4")} style={{ width: "min(360px, calc(100vw - 24px))" }}>
                    <SurePaneli hedefDk={hedefDk} setHedefDk={setHedefDk} bolum={bolum} cekim={cekim} kareKredi={kareKredi} videoKredi={videoKredi} model={model} plan={ai ? "AI yönetmen planlar" : `${T.ad} yapısıyla planlanır`} />
                  </Yuzen>
                </div>
                <div className="relative">
                  <Cip etiket="Stil" deger={sStil.ad} gorsel={sStil.kapak} acik={pop === "stil"} onClick={() => ac("stil")} />
                  <Yuzen acik={pop === "stil"} onKapat={() => setPop(null)} yerlesim="ust-sol" bosluk={10} etiket="Stil" className={cn(PANO, "p-2.5")} style={{ width: "min(420px, calc(100vw - 24px))" }}>
                    <p className="px-1 pb-2 text-[13px] font-semibold text-white">Görsel stil</p>
                    <OzelGirdi deger={ozelStilGirdi} set={setOzelStilGirdi} secili={stil.startsWith("ozel:")} ph="Ör. 90'lar VHS, sıcak tonlu analog film"
                      uygula={() => { setStil(`ozel:${ozelStilGirdi.trim()}`); setPop(null); }} />
                    <div className="grid grid-cols-4 gap-2">
                      {FILM_STILLER.map((s) => (
                        <button key={s.id} onClick={() => { setStil(s.id); setPop(null); }} aria-pressed={s.id === stil} className="group text-left">
                          <span className={cn("relative block aspect-square overflow-hidden rounded-[12px] outline outline-2 -outline-offset-2 transition-[outline-color]", s.id === stil ? "outline-white" : "outline-transparent")}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={s.kapak} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          </span>
                          <span className={cn("mt-1 block truncate text-[12px] font-medium", s.id === stil ? "text-white" : "text-white/60")}>{s.ad}</span>
                        </button>
                      ))}
                    </div>
                  </Yuzen>
                </div>
                <div className="relative">
                  <Cip etiket="Format" deger={oran} ikon={<OranSimge o={oran} />} acik={pop === "format"} onClick={() => ac("format")} />
                  <Yuzen acik={pop === "format"} onKapat={() => setPop(null)} yerlesim="ust-sol" bosluk={10} etiket="Format" className={PANO} style={{ width: "min(280px, calc(100vw - 24px))" }}>
                    <MenuBaslik>Format</MenuBaslik>
                    {FORMATLAR.map((f) => <MenuSatiri key={f.deger} secili={f.deger === oran} onClick={() => { setOran(f.deger); setPop(null); }} ad={f.ad} alt={f.alt} on={<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.07]"><OranSimge o={f.deger} /></span>} />)}
                  </Yuzen>
                </div>
                <div className="relative">
                  <Cip etiket="Ton" deger={TONLAR.find((t) => t.deger === ton)?.ad} ikon={<MessageSquareText className="h-4 w-4" />} acik={pop === "ton"} onClick={() => ac("ton")} />
                  <Yuzen acik={pop === "ton"} onKapat={() => setPop(null)} yerlesim="ust-sol" bosluk={10} etiket="Ton" className={PANO} style={{ width: "min(300px, calc(100vw - 24px))" }}>
                    <MenuBaslik alt="planın anlatım dili">Ton</MenuBaslik>
                    {TONLAR.map((t) => <MenuSatiri key={t.deger} secili={t.deger === ton} onClick={() => { setTon(t.deger); setPop(null); }} ad={t.ad} alt={t.alt} on={<IkonKaro ikon={TON_IKON[t.deger] ?? Clapperboard} />} />)}
                  </Yuzen>
                </div>
                <div className="relative">
                  <Cip etiket="Müzik" deger={MUZIKLER.find((m) => m.deger === muzik)?.ad} ikon={<Music2 className="h-4 w-4" />} acik={pop === "muzik"} onClick={() => ac("muzik")} />
                  <Yuzen acik={pop === "muzik"} onKapat={() => setPop(null)} yerlesim="ust-sol" bosluk={10} etiket="Müzik" className={PANO} style={{ width: "min(300px, calc(100vw - 24px))" }}>
                    <MenuBaslik>Müzik</MenuBaslik>
                    {MUZIKLER.map((m) => <MenuSatiri key={m.deger} secili={m.deger === muzik} onClick={() => { setMuzik(m.deger); setPop(null); }} ad={m.ad} alt={m.alt} on={<IkonKaro ikon={MUZIK_IKON[m.deger] ?? Music2} />} />)}
                    <p className="mt-1 border-t border-white/[0.06] px-2.5 pb-1 pt-2.5 text-[12px] leading-snug text-white/50">Müzik, montaja aktarırken filmin süresine göre bestelenir.</p>
                  </Yuzen>
                </div>
                <div className="relative">
                  <button type="button" onClick={() => ac("model")} aria-expanded={pop === "model"} className={cn("flex h-12 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full pl-1.5 pr-3.5 text-left transition-[background-color,transform] duration-200 active:scale-[0.97]", pop === "model" ? "bg-white/[0.13]" : "bg-white/[0.07] hover:bg-white/[0.11]")}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full [&>span]:!h-9 [&>span]:!w-9 [&>span]:!rounded-full"><MarkaKare ad={model} boyut={36} /></span>
                    <span className="flex flex-col items-start leading-none"><span className="text-[11px] text-white/55">Model</span><span className="mt-1 text-[13px] font-medium text-white">{FILM_MODELLER.find((m) => m.deger === model)?.ad}</span></span>
                  </button>
                  <Yuzen acik={pop === "model"} onKapat={() => setPop(null)} yerlesim="ust-sol" bosluk={10} etiket="Model" className={PANO} style={{ width: "min(380px, calc(100vw - 24px))" }}>
                    <MenuBaslik>Çekimlerin video modeli</MenuBaslik>
                    {FILM_MODELLER.map((m) => (
                      <MenuSatiri key={m.deger} secili={m.deger === model} onClick={() => { setModel(m.deger); setPop(null); }} ad={m.ad} alt={m.alt} rozet={m.rozet} on={<MarkaKare ad={m.deger} boyut={38} />}
                        sag={<span className="flex shrink-0 items-center gap-1 text-[12.5px] font-semibold tabular-nums text-white/80"><KrediJeton boyut={11} />{videoKrediHesap(m.deger)}</span>} />
                    ))}
                    <p className="mt-1 border-t border-white/[0.06] px-2.5 pb-1 pt-2.5 text-[12px] leading-snug text-white/50">Bedel çekim başına; her çekimde ayrıca değiştirebilirsin.</p>
                  </Yuzen>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3 max-sm:w-full">
              <button onClick={() => void olustur()} disabled={mesgul}
                className={cn("flex h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-[15px] font-semibold text-black transition-[transform,opacity,background-color] hover:bg-white/90 active:scale-[0.97] max-sm:flex-1")}>
                {mesgul ? <><Loader2 className="h-4 w-4 animate-spin" />Planlanıyor</> : <><Sparkles className="h-4 w-4" />Filmi planla</>}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/** Vitrin mekanizması (buzlu cam storyboard): hikâye → türün oranlarıyla perdeler (üstünde akan oynatma çizgisi) → kareler (çizginin geçtiği kare yanar). */
const DONGU = 9;
function Mekanizma({ tur, sn, logline }: { tur: FilmTur; sn: number; logline: string }) {
  const T = turBul(tur), M = TUR_MEDYA[tur];
  const [aktif, setAktif] = useState(0);
  useEffect(() => { const t = setInterval(() => setAktif((v) => (v + 1) % M.kareler.length), (DONGU * 1000) / M.kareler.length); return () => clearInterval(t); }, [M.kareler.length]);
  const giris = (d: number) => ({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.55, ease, delay: d } });
  const baslangic = (k: number) => zaman(T.bolumler.slice(0, k).reduce((x, y) => x + y.oran, 0) * sn);
  const n = T.bolumler.length;
  return (
    <motion.div {...giris(0.1)} className="relative overflow-hidden rounded-[24px] bg-[#111214]/85 ring-1 ring-inset ring-white/[0.1] backdrop-blur-2xl">
      <div className="flex items-center gap-2.5 px-4 pb-3 pt-3.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.08] text-white"><Clapperboard className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1 leading-tight"><span className="block text-[13.5px] font-semibold text-white">Yönetmen planı</span><span className="block text-[11.5px] text-white/50">{T.ad} yapısı · otomatik planlanır</span></span>
        <span className="flex items-center gap-1.5 rounded-full bg-white/[0.08] px-2.5 py-1 text-[12px] font-medium tabular-nums text-white/85"><Clock className="h-3.5 w-3.5 text-white/55" />{hedefYazi(sn)}</span>
      </div>
      <div className="mx-4 rounded-[14px] bg-white/[0.05] px-3.5 py-3 ring-1 ring-inset ring-white/[0.07]">
        <p className="text-[11px] font-medium text-white/45">Hikâye</p>
        <p className="mt-0.5 line-clamp-2 text-[13.5px] leading-snug text-white/90">{logline}</p>
      </div>
      <div className="relative m-4 mt-3">
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${n}, minmax(0,1fr))` }}>
          {T.bolumler.map((b, k) => {
            const g = M.kareler[k % M.kareler.length];
            const on = k === aktif % n;
            return (
              <motion.div key={b.ad} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease, delay: 0.25 + k * 0.07 }} className="min-w-0">
                <span className="block h-[3px] rounded-full" style={{ background: perdeRengi(k) }} />
                <span className={cn("relative mt-1.5 block aspect-[4/3] overflow-hidden rounded-[10px] outline outline-2 -outline-offset-2 transition-[outline-color] duration-300", on ? "outline-white" : "outline-transparent")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g} alt="" className={cn("h-full w-full object-cover transition-opacity duration-500", on ? "opacity-100" : "opacity-60")} />
                  <span className="absolute left-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10.5px] font-bold tabular-nums text-black" style={{ background: perdeRengi(k) }}>{k + 1}</span>
                </span>
                <span className="mt-1.5 block truncate text-[12px] font-semibold text-white" title={b.ad}>{b.ad}</span>
                <span className="block text-[11px] tabular-nums text-white/45">{baslangic(k)}</span>
              </motion.div>
            );
          })}
        </div>
        <motion.span aria-hidden className="pointer-events-none absolute -top-1 bottom-9 w-[2px] rounded-full bg-white" initial={{ left: "0%" }} animate={{ left: "100%" }} transition={{ duration: DONGU, ease: "linear", repeat: Infinity, delay: 0.9 }} style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.35)" }}>
          <span className="absolute -left-[4px] -top-[3px] h-[10px] w-[10px] rounded-full bg-white" />
        </motion.span>
      </div>
    </motion.div>
  );
}
const hedefYazi = (sn: number) => (sn >= 3600 ? "1 saat" : `${Math.round(sn / 60)} dk`);

/** Tür kartı: poster durur; üzerine gelince ya da seçiliyken örnek klip oynar. */
function TurKarti({ id, ad, alt, secili, onSec }: { id: FilmTur; ad: string; alt: string; secili: boolean; onSec: () => void }) {
  const [ustunde, setUstunde] = useState(false);
  const m = VH(TUR_MEDYA[id].klip);
  return (
    <button type="button" onClick={onSec} aria-pressed={secili} onPointerEnter={(e) => { if (e.pointerType === "mouse") setUstunde(true); }} onPointerLeave={() => setUstunde(false)}
      className="group relative aspect-[4/3] overflow-hidden rounded-[18px] bg-black text-left outline outline-2 -outline-offset-2 transition-[outline-color,transform] duration-300 active:scale-[0.98]" style={{ outlineColor: secili ? "#fff" : "transparent" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={m.poster} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
      {(ustunde || secili) && <video src={m.video} poster={m.poster} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />}
      <span className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 to-transparent" />
      <span className="absolute inset-x-3 bottom-3"><span className="block text-[15px] font-semibold tracking-[-0.01em] text-white">{ad}</span><span className="block truncate text-[12px] text-white/65">{alt}</span></span>
    </button>
  );
}

/** Süre paneli: kaydırıcı (1 dk ile 1 saat) + plan ve kredi özeti (kredi yalnız burada görünür). */
function SurePaneli({ hedefDk, setHedefDk, bolum, cekim, kareKredi, videoKredi, model, plan }: { hedefDk: number; setHedefDk: (n: number) => void; bolum: number; cekim: number; kareKredi: number; videoKredi: number; model: string; plan: string }) {
  const i = Math.max(0, SURELER.indexOf(hedefDk));
  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-3.5 py-2.5"><Clock className="h-4 w-4 text-white/55" /><span className="text-[13px] font-semibold text-white">Hedef süre</span>
          <motion.span key={hedefDk} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="ml-auto text-[20px] font-semibold tabular-nums tracking-[-0.02em] text-white">{hedefDk < 60 ? `${hedefDk} dk` : "1 saat"}</motion.span></div>
        <div className="px-3.5 pb-3 pt-3.5">
          <input type="range" min={0} max={SURELER.length - 1} step={1} value={i} onChange={(e) => setHedefDk(SURELER[Number(e.target.value)])} aria-label="Hedef süre"
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full accent-white" style={{ background: `linear-gradient(90deg,#fff ${(i / (SURELER.length - 1)) * 100}%,rgba(255,255,255,0.12) 0)` }} />
          <div className="mt-2.5 grid gap-1" style={{ gridTemplateColumns: `repeat(${SURELER.length}, minmax(0,1fr))` }}>
            {SURELER.map((d) => <button key={d} onClick={() => setHedefDk(d)} className={cn("h-7 rounded-full text-[11.5px] font-semibold tabular-nums transition-colors", d === hedefDk ? "bg-white text-black" : "text-white/55 hover:bg-white/[0.06] hover:text-white")}>{d < 60 ? d : "60"}</button>)}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {([[LayoutGrid, "Perde", `${bolum}`], [Film, "Çekim", `${cekim}`], [ImageIcon, "Taslak kareler", <><KrediJeton boyut={11} />{kareKredi.toLocaleString("tr-TR")}</>], [Play, "Tüm videolar", <><KrediJeton boyut={11} />{videoKredi.toLocaleString("tr-TR")}</>]] as const).map(([I, k, v]) => (
          <div key={k} className="flex items-center gap-2.5 rounded-[14px] bg-white/[0.03] px-3 py-2.5 ring-1 ring-inset ring-white/[0.06]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-white/70"><I className="h-4 w-4" /></span>
            <span className="min-w-0 leading-tight"><span className="block text-[11px] text-white/50">{k}</span><span className="mt-0.5 flex items-center gap-1 text-[14px] font-semibold tabular-nums text-white">{v}</span></span>
          </div>
        ))}
      </div>
      <p className="rounded-[14px] bg-white/[0.03] px-3 py-2.5 text-[12px] leading-snug text-white/60 ring-1 ring-inset ring-white/[0.06]">{plan}; planlamak ücretsiz. Önce taslak kareleri görürsün, yalnız beğendiklerini {model} ile videoya çevirirsin.</p>
    </div>
  );
}

/** Film kartı: kapak + kare şeridi + tür/süre hapları + video ilerlemesi; üzerine gelince Devam et, çoğalt, sil. */
function FilmKarti({ p, k, i }: { p: FilmProje; k: string[]; i: number }) {
  const n = p.bolumler.reduce((a, b) => a + b.cekimler.length, 0), video = p.bolumler.reduce((a, b) => a + b.cekimler.filter((c) => c.secili).length, 0);
  const yuzde = n ? Math.round((video / n) * 100) : 0;
  const kapak = k[0] ?? stilBul(p.stil).kapak;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04, ease, duration: 0.4 }}
      className="group relative overflow-hidden rounded-[20px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.05]">
      <button onClick={() => useFilm.getState().sec(p.id)} aria-label={`${p.ad} filmini aç`} className="block w-full text-left">
        <span className="relative block aspect-[16/9] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={kapak} alt="" className={cn("absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]", !k.length && "opacity-60")} />
          <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25" />
          <span className="absolute left-3 top-3 flex gap-1.5">
            <span className="rounded-full bg-black/45 px-2.5 py-1 text-[11.5px] font-medium text-white ring-1 ring-inset ring-white/15 backdrop-blur-xl">{turBul(p.tur).ad}</span>
            <span className="flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[11.5px] font-medium tabular-nums text-white ring-1 ring-inset ring-white/15 backdrop-blur-xl"><Clock className="h-3 w-3" />{sureYaz(filmSn(p.bolumler))}</span>
          </span>
          {k.length > 1 && <span className="absolute bottom-3 left-3 flex gap-1">{k.slice(1, 5).map((g) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={g} src={g} alt="" className="h-9 w-14 rounded-[7px] object-cover ring-1 ring-white/25" />)}</span>}
          <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="flex h-11 translate-y-1 items-center gap-2 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition-transform duration-300 group-hover:translate-y-0"><Play className="h-3.5 w-3.5 fill-current" />Devam et</span>
          </span>
        </span>
        <span className="block p-3.5 pt-3">
          <span className="block truncate text-[15px] font-semibold text-white">{p.ad}</span>
          <span className="mt-0.5 block truncate text-[12.5px] text-white/50">{p.bolumler.length} perde · {n} çekim · {goreli(p.guncelleme)}</span>
          <span className="mt-3 flex items-center gap-2.5">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]"><span className="block h-full rounded-full bg-white transition-[width] duration-500" style={{ width: `${Math.max(yuzde, video ? 4 : 0)}%` }} /></span>
            <span className="shrink-0 text-[12px] tabular-nums text-white/60">{video}/{n} video</span>
          </span>
        </span>
      </button>
      <span className="absolute right-2.5 top-2.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100">
        <button onClick={() => { useFilm.getState().cogalt(p.id); toast.success("Film çoğaltıldı", { description: p.ad }); }} aria-label="Çoğalt" title="Çoğalt" className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-inset ring-white/15 backdrop-blur hover:bg-black/75 active:scale-90"><Copy className="h-3.5 w-3.5" /></button>
        <button onClick={() => { useFilm.getState().sil(p.id); toast("Film silindi", { description: p.ad, action: { label: "Geri al", onClick: () => useFilm.setState((s) => ({ projeler: [p, ...s.projeler] })) } }); }} aria-label="Sil" title="Sil" className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-inset ring-white/15 backdrop-blur hover:bg-rose-500/80 active:scale-90"><Trash2 className="h-3.5 w-3.5" /></button>
      </span>
    </motion.div>
  );
}
