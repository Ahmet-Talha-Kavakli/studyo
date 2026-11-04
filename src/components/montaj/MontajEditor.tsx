"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ChevronLeft, Undo2, Redo2, Download, Keyboard, Pencil, SlidersHorizontal, X, LayoutGrid, Search, History, Cloud, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { Tooltip } from "@/components/ui/Tooltip";
import { Yuzen } from "@/components/ui/Yuzen";
import { AltSayfa } from "@/components/studyo/hf";
import { useMasaustu } from "@/hooks/useMasaustu";
import { useMontaj, montajToplamSure, type MontajProje } from "@/store/useMontaj";
import { MedyaHavuzu } from "@/lib/montajMotor";
import { MontajOnizleme } from "./MontajOnizleme";
import { MontajZaman } from "./MontajZaman";
import { MontajKutuphane, PANELLER, type PanelId } from "./MontajKutuphane";
import { MontajDenetleyici } from "./MontajDenetleyici";
import { MontajDisaAktar } from "./MontajDisaAktar";
import { rippleSil, katmanaTasi, sesiAyir, surumKaydet } from "./ortak";
import { MontajKomut } from "./MontajKomut";
import { PKart } from "./ui";
import { MontajSurumler } from "./MontajSurumler";
import { MontajAsistan } from "./MontajAsistan";

const KISAYOLLAR: { baslik: string; liste: [string, string][] }[] = [
  { baslik: "Oynatma", liste: [["Boşluk", "Oynat / duraklat"], ["Sol / sağ ok", "Bir kare"], ["Shift + sol / sağ ok", "Bir saniye"], ["Home / End", "Başa / sona"], ["M", "İşaretçi ekle"]] },
  { baslik: "Düzenleme", liste: [["S", "Oynatma çizgisinde böl"], ["Delete", "Seçiliyi sil"], ["Ctrl+Del", "Sil, boşluğu kapat"], ["Ctrl+D", "Çoğalt"], ["Ctrl+C / V", "Kopyala / yapıştır"], ["Ctrl+] / [", "Üst / alt katman"], ["Ctrl+Shift+A", "Sesi ayır"], ["Alt+Sürükle", "Kaynağı kaydır (slip)"], ["Ctrl+Z", "Geri al"], ["Ctrl+Shift+Z", "Yinele"]] },
  { baslik: "Seçim ve görünüm", liste: [["Shift + tık", "Çoklu seçim"], ["Ctrl+A", "Tümünü seç"], ["+ / −", "Yakınlaştır"], ["Ctrl+Teker", "Çizelge zoom"], ["Çift tık", "Yazıyı düzenle"], ["Shift+Sürükle", "Serbest taşı"]] },
];

export function MontajEditor({ proje }: { proje: MontajProje }) {
  const st = useMontaj.getState;
  const playhead = useMontaj((s) => s.playhead);
  const oynuyor = useMontaj((s) => s.oynuyor);
  const seciliKlipId = useMontaj((s) => s.seciliKlipId);
  const gecmis = useMontaj((s) => s.gecmis[proje.id]);
  const masaustu = useMasaustu();
  const [panel, setPanel] = useState<PanelId | null>("medya");
  const [mobilPanel, setMobilPanel] = useState<PanelId | "duzenle" | "daha" | "asistan" | "surum" | null>(null);
  const [seritYuk, setSeritYuk] = useState(300);
  const [disaAktar, setDisaAktar] = useState(false);
  const [kisayol, setKisayol] = useState(false);
  const [komut, setKomut] = useState(false);
  const [surum, setSurum] = useState(false);
  const [dongu, setDongu] = useState(false);
  const [sessiz, setSessiz] = useState(false);
  const havuz = useMemo(() => new MedyaHavuzu(true), []);
  const toplam = montajToplamSure(proje);

  useEffect(() => () => havuz.kapat(), [havuz]);
  useEffect(() => { havuz.anaSes(sessiz ? 0 : 1); }, [havuz, sessiz]);

  /* Oynatma döngüsü: gerçek zamana göre playhead ilerler; medya öğeleri ona senkron oynar. */
  useEffect(() => {
    if (!oynuyor) return;
    if (toplam <= 0) { st().oynatDurdur(false); return; }
    let ram = 0, onceki = performance.now();
    const tik = (t: number) => {
      const fark = Math.min(0.1, (t - onceki) / 1000); onceki = t;
      let su = st().playhead + fark;
      if (su >= toplam) {
        if (dongu) su = 0; else { st().playheadAyarla(toplam); st().oynatDurdur(false); return; }
      }
      st().playheadAyarla(su);
      ram = requestAnimationFrame(tik);
    };
    ram = requestAnimationFrame(tik);
    return () => cancelAnimationFrame(ram);
  }, [oynuyor, toplam, dongu]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { havuz.senkronla(proje, playhead, oynuyor); }, [havuz, proje, playhead, oynuyor]);
  useEffect(() => () => { st().oynatDurdur(false); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Kısayollar — yakalama fazında (kabuğun tek tuşlu gezinmesine sızmasın). */
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      const h = e.target as HTMLElement;
      if (h && (/^(INPUT|TEXTAREA|SELECT)$/.test(h.tagName) || h.isContentEditable)) return;
      if (disaAktar || komut) return;
      const yut = () => { e.preventDefault(); e.stopPropagation(); };
      const kts = e.ctrlKey || e.metaKey;
      if (kts && e.key.toLowerCase() === "k") { yut(); setKomut(true); return; }
      if (kts && e.key.toLowerCase() === "s") { yut(); surumKaydet(proje.id); return; }
      const s = st();
      const sec = seciliKlipId;
      if (e.code === "Space") { yut(); havuz.sesBaslat(); if (!s.oynuyor && s.playhead >= toplam - 0.02) s.playheadAyarla(0); s.oynatDurdur(); return; }
      if (e.key.toLowerCase() === "s" && !kts) { yut(); if (sec) s.klipBol(proje.id, sec, s.playhead); else toast.error("Klip seçilmedi", { description: "Bölmek için önce zaman çizelgesinde bir klip seç." }); return; }
      if ((e.key === "Delete" || e.key === "Backspace") && (sec || s.secimler.length)) {
        yut();
        const l = s.secimler.length ? s.secimler : [sec!];
        s.anlikKaydet(proje.id);
        const dalga = s.ripple || kts;
        for (const id of l) (dalga ? rippleSil(proje.id, id) : s.klipSil(proje.id, id));
        if (l.length > 1 || dalga) toast(dalga ? `${l.length > 1 ? `${l.length} klip` : "Klip"} silindi, boşluk kapatıldı` : `${l.length} klip silindi`, { description: "Ctrl+Z ile geri alabilirsin." });
        return;
      }
      if (kts && (e.key === "]" || e.key === "[") && sec) { yut(); katmanaTasi(proje.id, sec, e.key === "]" ? -1 : 1); return; }
      if (kts && e.shiftKey && e.key.toLowerCase() === "a" && sec) { yut(); sesiAyir(proje.id, sec); return; }
      if (kts && !e.shiftKey && e.key.toLowerCase() === "a") { yut(); s.secimAyarla(proje.katmanlar.filter((k) => !k.kilitli).flatMap((k) => k.klipler.map((x) => x.id))); return; }
      if (e.key.toLowerCase() === "m" && !kts) {
        yut();
        const l = proje.isaretler ?? [];
        if (l.some((m) => Math.abs(m.t - s.playhead) < 0.05)) return void toast.info("Bu konumda zaten işaretçi var", { description: "Yeni işaretçi için oynatma çizgisini başka bir yere taşı." });
        s.projeGuncelle(proje.id, { isaretler: [...l, { t: s.playhead }].sort((a, b) => a.t - b.t) });
        toast.success("İşaretçi eklendi", { description: "Kaldırmak için işaretçiye sağ tıkla." });
        return;
      }
      if (kts && e.key.toLowerCase() === "d" && sec) { yut(); s.klipCogalt(proje.id, sec); return; }
      if (kts && e.key.toLowerCase() === "c" && sec) { yut(); s.klipKopyala(proje.id, sec); toast.success("Klip kopyalandı", { description: "Ctrl+V ile yapıştırabilirsin." }); return; }
      if (kts && e.key.toLowerCase() === "v") {
        yut();
        const pano = s.pano; if (!pano) return void toast.error("Yapıştırılacak klip yok", { description: "Önce bir klip seçip Ctrl+C ile kopyala." });
        const hedefTur = pano.tur === "ses" ? "ses" : pano.tur === "metin" ? "metin" : "video";
        const kat = proje.katmanlar.find((k) => k.klipler.some((x) => x.id === sec) && k.tur === hedefTur) ?? proje.katmanlar.find((k) => k.tur === hedefTur);
        if (kat) { const id = s.klipYapistir(proje.id, kat.id, s.playhead); if (id) s.klipSec(id); }
        return;
      }
      if (kts && e.key.toLowerCase() === "z") { yut(); if (e.shiftKey) s.yinele(proje.id); else s.geriAl(proje.id); return; }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") { yut(); s.oynatDurdur(false); const d = (e.shiftKey ? 1 : 1 / proje.fps) * (e.key === "ArrowLeft" ? -1 : 1); s.playheadAyarla(Math.max(0, Math.min(toplam, s.playhead + d))); return; }
      if (e.key === "Home") { yut(); s.playheadAyarla(0); return; }
      if (e.key === "End") { yut(); s.playheadAyarla(toplam); return; }
      if (e.key === "+" || e.key === "=") { yut(); s.zoomAyarla(s.zoom * 1.25); return; }
      if (e.key === "-") { yut(); s.zoomAyarla(s.zoom / 1.25); return; }
      if (e.key === "Escape") { s.klipSec(null); return; }
      if (!kts && !e.altKey && e.key.length === 1) e.stopPropagation();
    };
    document.addEventListener("keydown", f, true);
    return () => document.removeEventListener("keydown", f, true);
  }, [proje, seciliKlipId, toplam, havuz, disaAktar, komut]); // eslint-disable-line react-hooks/exhaustive-deps

  const seritSurukle = (e: React.PointerEvent) => {
    e.preventDefault();
    const tasi = (ev: PointerEvent) => setSeritYuk(Math.max(190, Math.min(Math.round(window.innerHeight * 0.6), window.innerHeight - ev.clientY - 8)));
    const birak = () => { window.removeEventListener("pointermove", tasi); window.removeEventListener("pointerup", birak); document.body.style.cursor = ""; };
    document.body.style.cursor = "row-resize";
    window.addEventListener("pointermove", tasi); window.addEventListener("pointerup", birak);
  };
  const panelAc = (p: PanelId) => (masaustu ? setPanel(p) : setMobilPanel(p));
  const disaAc = () => { if (toplam <= 0) return void toast.error("Montaj boş", { description: "Dışa aktarmak için önce zaman çizelgesine medya ekle." }); st().oynatDurdur(false); setDisaAktar(true); };
  const ib = "flex h-9 w-9 items-center justify-center rounded-[10px] text-metin-2 transition-colors hover:bg-white/[0.07] hover:text-metin disabled:pointer-events-none disabled:opacity-30";

  const ust = (
    <header className="flex h-14 shrink-0 items-center gap-1 px-2 sm:px-3">
      <Tooltip label="Montajlara dön"><button onClick={() => st().projeSec(null)} aria-label="Montajlara dön" className={ib}><ChevronLeft className="h-5 w-5" /></button></Tooltip>
      <label className="group flex min-w-0 flex-1 items-center gap-1.5 rounded-[10px] px-2 py-1.5 transition-colors hover:bg-white/[0.05] focus-within:bg-white/[0.07] sm:flex-none">
        <input value={proje.ad} onChange={(e) => st().projeGuncelle(proje.id, { ad: e.target.value.slice(0, 60) })} aria-label="Montaj adı"
          className="w-full min-w-0 bg-transparent text-[15px] font-semibold text-metin outline-none sm:w-[240px]" />
        <Pencil className="h-3.5 w-3.5 shrink-0 text-metin-3 opacity-0 transition-opacity group-hover:opacity-100" />
      </label>
      <span className="hidden items-center gap-1.5 text-[12.5px] text-metin-3 md:flex"><Cloud className="h-3.5 w-3.5" />Kaydedildi</span>
      <span className="mx-2 hidden h-5 w-px bg-white/[0.08] sm:block" />
      <Tooltip label="Geri al · Ctrl+Z"><button onClick={() => st().geriAl(proje.id)} disabled={!gecmis?.geri.length} aria-label="Geri al" className={ib}><Undo2 className="h-[18px] w-[18px]" /></button></Tooltip>
      <Tooltip label="Yinele · Ctrl+Shift+Z"><button onClick={() => st().yinele(proje.id)} disabled={!gecmis?.ileri.length} aria-label="Yinele" className={ib}><Redo2 className="h-[18px] w-[18px]" /></button></Tooltip>
      <div className="ml-auto flex shrink-0 items-center gap-1">
        <button onClick={() => setKomut(true)} className="hidden h-9 items-center gap-2 rounded-[10px] px-3 text-[13px] text-metin-2 transition-colors hover:bg-white/[0.07] hover:text-metin xl:flex">
          <Search className="h-4 w-4" />Araçlarda ara<kbd className="rounded-md bg-white/[0.08] px-1.5 py-0.5 text-[11px] font-medium text-white/70">Ctrl K</kbd>
        </button>
        <Tooltip label="Araçlarda ara · Ctrl+K"><button onClick={() => setKomut(true)} aria-label="Araçlarda ara" className={cn(ib, "max-sm:hidden xl:hidden")}><Search className="h-[18px] w-[18px]" /></button></Tooltip>
        <div className="relative max-sm:hidden">
          <Tooltip label="Sürümler · Ctrl+S"><button onClick={() => setSurum((v) => !v)} aria-label="Sürümler" className={cn(ib, "relative", surum && "bg-white/[0.085] text-metin")}>
            <History className="h-[18px] w-[18px]" />{!!proje.surumler?.length && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#55d6fd]" />}
          </button></Tooltip>
          <AnimatePresence>
            <Yuzen acik={surum} onKapat={() => setSurum(false)} yerlesim="alt-sag" bosluk={8} etiket="Sürümler" className="overflow-hidden rounded-[18px] border border-white/[0.09] bg-[#1b1c1f]">
              <MontajSurumler proje={proje} />
            </Yuzen>
          </AnimatePresence>
        </div>
        <div className="relative hidden sm:block">
          <Tooltip label="Klavye kısayolları"><button onClick={() => setKisayol((v) => !v)} aria-label="Klavye kısayolları" className={cn(ib, kisayol && "bg-white/[0.085] text-metin")}><Keyboard className="h-[18px] w-[18px]" /></button></Tooltip>
          <AnimatePresence>
            <Yuzen acik={kisayol} onKapat={() => setKisayol(false)} yerlesim="alt-sag" bosluk={8} etiket="Klavye kısayolları" className="w-[min(92vw,780px)] overflow-hidden rounded-[18px] border border-white/[0.09] bg-[#1b1c1f]">
              <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.085]"><Keyboard className="h-4 w-4 text-white" /></span>
                <span className="min-w-0 flex-1 leading-tight"><span className="block text-[14.5px] font-semibold text-metin">Klavye kısayolları</span><span className="mt-0.5 block text-[12px] text-metin-3">Önizleme ya da zaman çizelgesi odaktayken çalışır</span></span>
              </div>
              <div className="grid grid-cols-3 items-start gap-3 p-3">
                {KISAYOLLAR.map((g) => (
                  <PKart key={g.baslik} baslik={g.baslik} govde="p-0">
                    <div className="divide-y divide-white/[0.05]">
                      {g.liste.map(([t, a]) => (
                        <div key={t} className="flex items-center justify-between gap-2 px-3 py-2 text-[12.5px]"><span className="truncate text-metin-2">{a}</span><kbd className="shrink-0 rounded-md bg-white/[0.085] px-1.5 py-0.5 font-sans text-[11px] font-medium text-metin">{t}</kbd></div>
                      ))}
                    </div>
                  </PKart>
                ))}
              </div>
            </Yuzen>
          </AnimatePresence>
        </div>
        <button onClick={disaAc} className="hf-cta ml-1.5 flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13.5px] font-semibold sm:px-4">
          <Download className="h-4 w-4" /><span className="hidden sm:inline">Dışa aktar</span>
        </button>
      </div>
    </header>
  );

  const ray = (
    <LayoutGroup id="montaj-ray">
    <nav aria-label="Araçlar" className="gizli-scroll flex w-[64px] shrink-0 flex-col items-center gap-1 overflow-y-auto py-1">
      {PANELLER.map((p) => {
        const a = panel === p.id;
        return (
          <button key={p.id} onClick={() => setPanel(a ? null : p.id)} aria-pressed={a} title={p.ad}
            className={cn("relative flex w-[58px] shrink-0 flex-col items-center gap-1 rounded-[14px] py-2 text-[11px] font-medium transition-colors active:scale-[0.96]", a ? "text-white" : "text-metin-3 hover:bg-white/[0.04] hover:text-metin")}>
            {a && <motion.span layoutId="ray-secim" className="absolute inset-0 rounded-[14px] bg-white/[0.1] ring-1 ring-inset ring-white/[0.08]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <p.ikon className="relative h-5 w-5" strokeWidth={1.8} /><span className="relative">{p.ad}</span>
          </button>
        );
      })}
    </nav>
    </LayoutGroup>
  );

  const onizleme = <MontajOnizleme proje={proje} havuz={havuz} dongu={dongu} setDongu={setDongu} sessiz={sessiz} setSessiz={setSessiz} onMedyaAc={(p = "medya") => panelAc(p)}
    asistan={masaustu ? <MontajAsistan proje={proje} onPanel={panelAc} /> : undefined} />;
  const pencereler = (
    <>
      <AnimatePresence>{disaAktar && <MontajDisaAktar proje={proje} onKapat={() => setDisaAktar(false)} />}</AnimatePresence>
      <AnimatePresence>{komut && <MontajKomut proje={proje} onKapat={() => setKomut(false)} onPanel={panelAc} onDisaAktar={() => { if (toplam > 0) { st().oynatDurdur(false); setDisaAktar(true); } }} />}</AnimatePresence>
    </>
  );

  if (!masaustu) {
    const MOBIL: { id: PanelId | "duzenle" | "daha" | "asistan" | "surum"; ad: string; ikon: typeof Search }[] = [
      { id: "medya", ad: "Medya", ikon: PANELLER[0].ikon }, { id: "yazi", ad: "Yazı", ikon: PANELLER.find((p) => p.id === "yazi")!.ikon },
      { id: "ses", ad: "Ses", ikon: PANELLER.find((p) => p.id === "ses")!.ikon }, { id: "asistan", ad: "Asistan", ikon: Sparkles },
      { id: "daha", ad: "Araçlar", ikon: LayoutGrid }, { id: "duzenle", ad: "Düzenle", ikon: SlidersHorizontal },
    ];
    const baslik = mobilPanel === "duzenle" ? "Düzenle" : mobilPanel === "daha" ? "Araçlar" : mobilPanel === "asistan" ? "Kurgu asistanı" : mobilPanel === "surum" ? "Sürümler" : PANELLER.find((p) => p.id === mobilPanel)?.ad ?? "";
    return (
      <div className="fixed inset-0 z-50 flex h-[100dvh] flex-col overflow-hidden bg-[#0e0f11] pt-[env(safe-area-inset-top)]">
        {ust}
        <div className="flex min-h-0 flex-[1.1] flex-col">{onizleme}</div>
        <div className="min-h-0 flex-1 border-t border-white/[0.06]"><MontajZaman proje={proje} yukseklik={0} dar /></div>
        <nav className="flex shrink-0 items-stretch justify-around border-t border-white/[0.06] bg-[#0e0f11] px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1">
          {MOBIL.map((p) => (
            <button key={p.id} onClick={() => setMobilPanel(p.id)} className={cn("flex flex-1 flex-col items-center gap-1 rounded-[10px] py-1.5 text-[11px] font-medium active:bg-white/[0.06]", p.id === "asistan" ? "text-[#7fe2ff]" : "text-metin-2")}>
              <p.ikon className="h-5 w-5" strokeWidth={1.8} />{p.ad}
            </button>
          ))}
        </nav>
        <AltSayfa acik={!!mobilPanel} baslik={baslik} onKapat={() => setMobilPanel(null)}>
          <div className="flex max-h-[70dvh] min-h-[50dvh] flex-col">
            {mobilPanel === "duzenle" ? <MontajDenetleyici proje={proje} />
              : mobilPanel === "asistan" ? <div className="p-4"><MontajAsistan proje={proje} mobil onPanel={(p) => setMobilPanel(p)} /></div>
              : mobilPanel === "surum" ? <MontajSurumler proje={proje} sade />
              : mobilPanel === "daha" ? (
                <div className="grid grid-cols-3 gap-2 p-4">
                  {PANELLER.map((p) => (
                    <button key={p.id} onClick={() => setMobilPanel(p.id)} className="flex flex-col items-center gap-2 rounded-[14px] bg-white/[0.055] py-4 text-[12.5px] font-medium text-metin ring-1 ring-inset ring-white/[0.06] active:bg-white/[0.08]">
                      <p.ikon className="h-5 w-5 text-metin-2" strokeWidth={1.8} />{p.ad}
                    </button>
                  ))}
                  <button onClick={() => { setMobilPanel(null); setKomut(true); }} className="flex flex-col items-center gap-2 rounded-[14px] bg-white/[0.055] py-4 text-[12.5px] font-medium text-metin ring-1 ring-inset ring-white/[0.06] active:bg-white/[0.08]"><Search className="h-5 w-5 text-metin-2" strokeWidth={1.8} />Ara</button>
                  <button onClick={() => setMobilPanel("surum")} className="flex flex-col items-center gap-2 rounded-[14px] bg-white/[0.055] py-4 text-[12.5px] font-medium text-metin ring-1 ring-inset ring-white/[0.06] active:bg-white/[0.08]"><History className="h-5 w-5 text-metin-2" strokeWidth={1.8} />Sürümler</button>
                </div>
              ) : mobilPanel ? <MontajKutuphane proje={proje} panel={mobilPanel} /> : null}
          </div>
        </AltSayfa>
        {pencereler}
      </div>
    );
  }

  const kart = "overflow-hidden rounded-[16px] bg-[#18191c] ring-1 ring-inset ring-white/[0.05]";
  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#0e0f11]">
      {ust}
      <div className="flex min-h-0 flex-1 gap-2 pb-2 pr-2">
        {ray}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 gap-2">
            <AnimatePresence initial={false}>
            {panel && (
              <motion.aside key="kutuphane" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className={cn(kart, "relative flex w-[316px] shrink-0 flex-col xl:w-[332px]")}>
                <button onClick={() => setPanel(null)} aria-label="Paneli kapat" title="Paneli kapat" className="absolute right-2.5 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-metin-3 transition hover:bg-white/[0.07] hover:text-metin active:scale-90"><X className="h-4 w-4" /></button>
                <motion.div key={panel} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="flex min-h-0 flex-1 flex-col"><MontajKutuphane proje={proje} panel={panel} /></motion.div>
              </motion.aside>
            )}
            </AnimatePresence>
            <main className={cn(kart, "flex min-w-0 flex-1 flex-col bg-[#111214]")}>{onizleme}</main>
            <aside className={cn(kart, "flex w-[316px] shrink-0 flex-col xl:w-[332px]")}>
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-width:thin]"><MontajDenetleyici proje={proje} /></div>
            </aside>
          </div>
          <div onPointerDown={seritSurukle} onDoubleClick={() => setSeritYuk(300)} title="Sürükleyerek yükseklik ayarla · çift tıkla sıfırla"
            className="group flex h-2 shrink-0 cursor-row-resize items-center justify-center">
            <span className="h-[3px] w-10 rounded-full bg-white/10 transition-colors group-hover:bg-white/50" />
          </div>
          <div className={kart}><MontajZaman proje={proje} yukseklik={seritYuk} /></div>
        </div>
      </div>
      {pencereler}
    </div>
  );
}
