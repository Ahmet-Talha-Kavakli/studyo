"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Scissors, Trash2, Copy, Magnet, ZoomIn, ZoomOut, Maximize, Plus, Eye, EyeOff, Lock, Unlock, Volume2, VolumeX,
  Blend, Headphones, Wand2, ClipboardCopy, MoveHorizontal, Film, Music2, Type as TypeIcon, Waves, ArrowUp, ArrowDown, AudioLines, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { Tooltip } from "@/components/ui/Tooltip";
import { Yuzen } from "@/components/ui/Yuzen";
import { useMontaj, klipSure, montajToplamSure, MONTAJ_GECIS_META, type MontajGecis, type MontajProje, type MontajKlip, type MontajKatman, type MedyaOge, type KatmanTur } from "@/store/useMontaj";
import { dalgaFormu, gorselKaynak, kareSeridi, videoKaynak } from "@/lib/montajMotor";
import { KATMAN, MEDYA_SURUKLE, medyayiEkle, zamanKodu, kisaSure, rippleSil, sonrakileriKaydir, katmanaTasi, sesiAyir, ritimIsaretle } from "./ortak";

const BASLIK_GENIS = 188;   // katman başlığı genişliği (px)
const PAY = 16;       // 0 saniyenin soldan payı
const CETVEL = 30;

type Surukle = { id: string; mod: "tasi" | "sol" | "sag" | "slip"; x0: number; y0: number; asil: MontajKlip; katmanId: string; hedefKatman: string; onizleme: Partial<MontajKlip>; oynadi: boolean };

/** Cetvel adımı: etiketler arası en az ~76px. */
function cetvelAdim(zoom: number): number {
  for (const a of [0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120]) if (a * zoom >= 76) return a;
  return 300;
}

export function MontajZaman({ proje, yukseklik, dar }: { proje: MontajProje; yukseklik: number; dar?: boolean }) {
  const BASLIK = dar ? 52 : BASLIK_GENIS;
  const zoom = useMontaj((s) => s.zoom);
  const playhead = useMontaj((s) => s.playhead);
  const oynuyor = useMontaj((s) => s.oynuyor);
  const seciliKlipId = useMontaj((s) => s.seciliKlipId);
  const secimler = useMontaj((s) => s.secimler);
  const st = useMontaj.getState;
  const [yapisCizgi, setYapisCizgi] = useState<number | null>(null);
  const [miknatis, setMiknatis] = useState(true);
  const ripple = useMontaj((s) => s.ripple);
  const vurgular = useMontaj((s) => s.vurgular);
  const [surukle, setSurukle] = useState<Surukle | null>(null);
  const [katmanMenu, setKatmanMenu] = useState(false);
  const [sagMenu, setSagMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const [gecisMenu, setGecisMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const [birakHedef, setBirakHedef] = useState<string | null>(null);
  const [hayalet, setHayalet] = useState<number | null>(null);   // fare altındaki an (hayalet playhead)
  const boslukluSil = (id: string) => { st().anlikKaydet(proje.id); rippleSil(proje.id, id); toast("Klip silindi, boşluk kapatıldı", { description: "Ctrl+Z ile geri alabilirsin." }); };
  const kaydirRef = useRef<HTMLDivElement>(null);

  const toplam = montajToplamSure(proje);
  const genislik = Math.max((toplam + 30) * zoom + PAY * 2, (kaydirRef.current?.clientWidth ?? 1200) - BASLIK);
  const x = (t: number) => PAY + t * zoom;
  const tAt = (px: number) => Math.max(0, (px - PAY) / zoom);
  const secili = useMemo(() => proje.katmanlar.flatMap((k) => k.klipler).find((k) => k.id === seciliKlipId) ?? null, [proje.katmanlar, seciliKlipId]);

  /* Oynarken playhead görünür alanda kalsın. */
  useEffect(() => {
    const el = kaydirRef.current; if (!el || !oynuyor) return;
    const px = BASLIK + x(playhead);
    if (px > el.scrollLeft + el.clientWidth - 80 || px < el.scrollLeft + BASLIK) el.scrollLeft = px - BASLIK - 80;
  }, [playhead, oynuyor]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Ctrl + tekerlek: imleç çevresinde yakınlaş. */
  useEffect(() => {
    const el = kaydirRef.current; if (!el) return;
    const f = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const imlecT = tAt(e.clientX - r.left + el.scrollLeft - BASLIK);
      const z0 = st().zoom;
      const z = Math.max(10, Math.min(200, z0 * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
      st().zoomAyarla(z);
      requestAnimationFrame(() => { el.scrollLeft = PAY + imlecT * z - (e.clientX - r.left - BASLIK); });
    };
    el.addEventListener("wheel", f, { passive: false });
    return () => el.removeEventListener("wheel", f);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Playhead sürükleme (cetvel + tutamak) ── */
  const playheadSurukle = (e: React.PointerEvent) => {
    e.preventDefault();
    const el = kaydirRef.current!; const r = el.getBoundingClientRect();
    const ayarla = (cx: number) => st().playheadAyarla(Math.min(Math.max(toplam, 0.01), tAt(cx - r.left + el.scrollLeft - BASLIK)));
    st().oynatDurdur(false);
    ayarla(e.clientX);
    const tasi = (ev: PointerEvent) => ayarla(ev.clientX);
    const birak = () => { window.removeEventListener("pointermove", tasi); window.removeEventListener("pointerup", birak); };
    window.addEventListener("pointermove", tasi); window.addEventListener("pointerup", birak);
  };

  /* ── Klip sürükleme: taşı / sol kırp / sağ kırp (mıknatıslı) ── */
  const yapisma = (t: number, haric: string): number => {
    if (!miknatis) return t;
    const noktalar = [0, st().playhead, ...proje.katmanlar.flatMap((k) => k.klipler).filter((k) => k.id !== haric).flatMap((k) => [k.baslangic, k.baslangic + klipSure(k)])];
    let en = t, fark = 9 / zoom;
    for (const n of [...noktalar, ...(proje.isaretler ?? []).map((m) => m.t)]) if (Math.abs(n - t) < fark) { fark = Math.abs(n - t); en = n; }
    if (en !== t) setYapisCizgi(en);
    return en;
  };
  const klipBasla = (e: React.PointerEvent, k: MontajKlip, kat: MontajKatman, mod: Surukle["mod"]) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      const l = st().secimler;
      st().secimAyarla(l.includes(k.id) ? l.filter((x) => x !== k.id) : [...l, k.id]);
      return;
    }
    if (!st().secimler.includes(k.id) || st().secimler.length < 2) st().klipSec(k.id);
    if (kat.kilitli) return void toast.warning("Katman kilitli", { description: "Bu katmana ekleme yapılamaz. Kilidi açıp yeniden dene." });
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    // Alt + sürükle (klip gövdesi): slip — klibin yeri ve süresi sabit, gösterilen kaynak bölümü kayar
    const slip = mod === "tasi" && e.altKey && (k.tur === "video" || k.tur === "ses");
    setSurukle({ id: k.id, mod: slip ? "slip" : mod, x0: e.clientX, y0: e.clientY, asil: k, katmanId: kat.id, hedefKatman: kat.id, onizleme: {}, oynadi: false });
  };
  const klipTasi = (e: React.PointerEvent) => {
    if (!surukle) return;
    setYapisCizgi(null);
    const dx = (e.clientX - surukle.x0) / zoom;
    if (!surukle.oynadi && Math.abs(e.clientX - surukle.x0) < 3 && Math.abs(e.clientY - surukle.y0) < 3) return;
    const k = surukle.asil;
    const gorunen = klipSure(k);
    const hiz = Math.max(0.25, k.hiz);
    const esnek = k.tur === "gorsel" || k.tur === "metin";
    let onizleme: Partial<MontajKlip> = {};
    let hedefKatman = surukle.hedefKatman;
    if (surukle.mod === "slip") {
      const kay = -dx * hiz;
      const toplamKirp = k.basKirp + k.sonKirp;
      const basKirp = Math.max(0, Math.min(toplamKirp, k.basKirp + kay));
      onizleme = { basKirp, sonKirp: toplamKirp - basKirp };
    } else if (surukle.mod === "tasi") {
      let bas = Math.max(0, k.baslangic + dx);
      const basY = yapisma(bas, k.id), sonY = yapisma(bas + gorunen, k.id);
      bas = Math.abs(basY - bas) <= Math.abs(sonY - (bas + gorunen)) ? basY : sonY - gorunen;
      onizleme = { baslangic: Math.max(0, bas) };
      const alt = document.elementsFromPoint(e.clientX, e.clientY).find((n) => (n as HTMLElement).dataset?.katman) as HTMLElement | undefined;
      const hk = alt && proje.katmanlar.find((x) => x.id === alt.dataset.katman);
      if (hk && hk.tur === proje.katmanlar.find((x) => x.id === surukle.katmanId)?.tur && !hk.kilitli) hedefKatman = hk.id;
    } else if (surukle.mod === "sag") {
      let son = yapisma(k.baslangic + gorunen + dx, k.id);
      son = Math.max(k.baslangic + 0.2, son);
      const yeniGorunen = son - k.baslangic;
      const sonKirp = k.sure - k.basKirp - yeniGorunen * hiz;
      onizleme = sonKirp >= 0 ? { sonKirp } : esnek ? { sonKirp: 0, sure: k.basKirp + yeniGorunen * hiz } : { sonKirp: 0 };
    } else {
      let bas = yapisma(k.baslangic + dx, k.id);
      bas = Math.min(k.baslangic + gorunen - 0.2, bas);
      let fark = bas - k.baslangic;
      let basKirp = k.basKirp + fark * hiz;
      if (basKirp < 0 && !esnek) { fark = -k.basKirp / hiz; basKirp = 0; bas = k.baslangic + fark; }
      if (bas < 0) { fark -= bas; bas = 0; basKirp = k.basKirp + fark * hiz; }
      onizleme = esnek && basKirp < 0 ? { baslangic: bas, basKirp: 0, sure: k.sure - basKirp } : { baslangic: bas, basKirp };
    }
    setSurukle({ ...surukle, onizleme, hedefKatman, oynadi: true });
  };
  const klipBirak = () => {
    if (!surukle) return;
    if (surukle.oynadi && Object.keys(surukle.onizleme).length) {
      st().anlikKaydet(proje.id);
      const { baslangic, ...geri } = surukle.onizleme;
      if (surukle.mod === "tasi") st().klipTasi(proje.id, surukle.id, baslangic ?? surukle.asil.baslangic, surukle.hedefKatman !== surukle.katmanId ? surukle.hedefKatman : undefined);
      else {
        const a = surukle.asil, eskiSon = a.baslangic + klipSure(a);
        st().klipGuncelle(proje.id, surukle.id, { ...(baslangic !== undefined ? { baslangic } : {}), ...geri });
        if (st().ripple && surukle.mod !== "slip") {
          // Ripple: sağ kırpmada sonrakiler bitiş farkı kadar, sol kırpmada klip yerinde kalıp sonrakiler kayar
          const yeni = { ...a, ...surukle.onizleme };
          if (surukle.mod === "sol") { st().klipGuncelle(proje.id, surukle.id, { baslangic: a.baslangic }); sonrakileriKaydir(proje.id, surukle.katmanId, a.id, eskiSon, (a.baslangic + klipSure(yeni)) - eskiSon); }
          else sonrakileriKaydir(proje.id, surukle.katmanId, a.id, eskiSon, (yeni.baslangic + klipSure(yeni)) - eskiSon);
        }
      }
    }
    setSurukle(null);
    setYapisCizgi(null);
  };

  /* ── Kitaplıktan bırak ── */
  const birak = (e: React.DragEvent, kat: MontajKatman) => {
    e.preventDefault(); setBirakHedef(null);
    const ham = e.dataTransfer.getData(MEDYA_SURUKLE); if (!ham) return;
    const oge = JSON.parse(ham) as MedyaOge;
    // Bir klibin üstüne bırakıldıysa: kaynağı değiştir (zamanlama, kırpma ve efektler korunur)
    const ust = document.elementsFromPoint(e.clientX, e.clientY).find((n) => (n as HTMLElement).dataset?.klip) as HTMLElement | undefined;
    const hedefK = ust && proje.katmanlar.flatMap((k) => k.klipler).find((k) => k.id === ust.dataset.klip);
    if (hedefK && (hedefK.tur === "video" || hedefK.tur === "gorsel") && oge.tur !== "ses") {
      st().anlikKaydet(proje.id);
      const gorunen = klipSure(hedefK);
      const kaynakSure = oge.tur === "gorsel" ? gorunen * hedefK.hiz : Math.max(0.5, oge.sure ?? gorunen);
      st().klipGuncelle(proje.id, hedefK.id, {
        ad: oge.ad, tur: oge.tur, gorselUrl: oge.poster ?? (oge.tur === "gorsel" ? oge.url : undefined),
        videoUrl: oge.tur === "video" ? oge.url : undefined, sesUrl: oge.tur === "video" ? oge.url : undefined, kaynakId: oge.kaynakId,
        sure: Math.max(kaynakSure, gorunen * hedefK.hiz), basKirp: 0, sonKirp: Math.max(0, Math.max(kaynakSure, gorunen * hedefK.hiz) - gorunen * hedefK.hiz),
      });
      st().klipSec(hedefK.id);
      return void toast.success("Klip değiştirildi", { description: `${oge.ad} yerleştirildi; zamanlama ve efektler korundu.` });
    }
    const el = kaydirRef.current!; const r = el.getBoundingClientRect();
    const t = yapisma(tAt(e.clientX - r.left + el.scrollLeft - BASLIK), "");
    const uygun = (oge.tur === "ses" ? "ses" : "video") === kat.tur && !kat.kilitli;
    const id = medyayiEkle(proje.id, oge, t, uygun ? kat.id : undefined);
    if (id) { st().klipSec(id); toast.success(`${oge.ad} eklendi`, { description: `${zamanKodu(t, proje.fps)} konumuna yerleştirildi.` }); }
  };

  const bol = () => {
    if (!secili) return void toast.error("Klip seçilmedi", { description: "Bölmek için önce zaman çizelgesinde bir klip seç." });
    if (playhead <= secili.baslangic + 0.1 || playhead >= secili.baslangic + klipSure(secili) - 0.1) return void toast.error("Oynatma çizgisi klibin dışında", { description: "Bölmek için oynatma çizgisini seçili klibin içine getir." });
    st().klipBol(proje.id, secili.id, playhead); toast.success("Klip bölündü", { description: "Ctrl+Z ile geri alabilirsin." });
  };
  const sigdir = () => {
    const el = kaydirRef.current; if (!el || toplam <= 0) return;
    st().zoomAyarla((el.clientWidth - BASLIK - PAY * 3) / toplam);
    el.scrollLeft = 0;
  };
  // Otomatik sığdırma: kullanıcı elle yakınlaştırana dek, montaj büyüdükçe/küçüldükçe tümü görünür kalır.
  const otoZoom = useRef<{ id: string; z: number } | null>(null);
  useEffect(() => {
    const el = kaydirRef.current; if (!el || toplam <= 0) return;
    const o = otoZoom.current;
    if (o && o.id === proje.id && Math.abs(o.z - zoom) > 0.01) return; // elle değiştirildi
    const z = Math.max(10, Math.min(200, (el.clientWidth - BASLIK - PAY * 3) / (toplam * 1.12)));
    otoZoom.current = { id: proje.id, z };
    if (Math.abs(z - zoom) > 0.01) { st().zoomAyarla(z); el.scrollLeft = 0; }
  }, [proje.id, toplam]); // eslint-disable-line react-hooks/exhaustive-deps

  const adim = cetvelAdim(zoom);
  const isaretler = useMemo(() => {
    const l: number[] = []; const son = genislik / zoom;
    for (let t = 0; t <= son; t += adim / 4) l.push(Math.round(t * 1000) / 1000);
    return l;
  }, [genislik, zoom, adim]);

  const btn = "flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-[9px] px-2 text-[12.5px] font-medium text-metin-2 transition-colors hover:bg-white/[0.07] hover:text-metin disabled:pointer-events-none disabled:opacity-30";
  const acikBtn = "bg-white/[0.1] text-white hover:bg-white/[0.14] hover:text-white";

  return (
    <div className={cn("flex min-h-0 flex-col", !yukseklik && "h-full")} style={yukseklik ? { height: yukseklik } : undefined}>
      {/* Araç çubuğu */}
      <div className="flex h-12 shrink-0 items-center gap-1 overflow-hidden border-b border-white/[0.06] px-2.5">
        <Tooltip label="Oynatma çizgisinde böl · S"><button onClick={bol} disabled={!secili} className={btn}><Scissors className="h-4 w-4" /> Böl</button></Tooltip>
        <Tooltip label="Çoğalt · Ctrl+D"><button onClick={() => secili && (st().klipCogalt(proje.id, secili.id), toast.success("Klip çoğaltıldı"))} disabled={!secili} className={btn}><Copy className="h-4 w-4" /></button></Tooltip>
        <Tooltip label="Sil · Delete"><button onClick={() => secili && (st().klipSil(proje.id, secili.id), toast("Klip silindi", { action: { label: "Geri al", onClick: () => useMontaj.getState().geriAl(proje.id) } }))} disabled={!secili} className={cn(btn, "hover:text-rose-300")}><Trash2 className="h-4 w-4" /></button></Tooltip>
        <span className="mx-1 h-5 w-px bg-white/10" />
        <Tooltip label={miknatis ? "Mıknatıs açık: kenarlara ve oynatma çizgisine yapışır" : "Mıknatıs kapalı"}>
          <button onClick={() => setMiknatis((v) => !v)} aria-pressed={miknatis} className={cn(btn, miknatis && acikBtn)}><Magnet className="h-4 w-4" /></button>
        </Tooltip>
        <Tooltip label={ripple ? "Ripple açık: silince ve kırpınca sonraki klipler kayar" : "Ripple kapalı: silince boşluk kalır"}>
          <button onClick={() => { st().rippleAyarla(!ripple); toast(ripple ? "Ripple kapatıldı" : "Ripple açıldı", { description: ripple ? "Silme ve kırpma boşluk bırakır." : "Silme ve kırpmada sonraki klipler kayar." }); }} aria-pressed={ripple} className={cn(btn, ripple && acikBtn)}><Waves className="h-4 w-4" />{!dar && <span className="hidden lg:inline">Ripple</span>}</button>
        </Tooltip>
        <span className="hidden sm:contents"><Tooltip label="Seçili klibin katmanında boşlukları kapat">
          <button onClick={() => { const kat = proje.katmanlar.find((k) => k.klipler.some((x) => x.id === secili?.id)); if (kat) { st().klipleriSirala(proje.id, kat.id); toast.success("Boşluklar kapatıldı", { description: "Ctrl+Z ile geri alabilirsin." }); } }} disabled={!secili} className={btn}><MoveHorizontal className="h-4 w-4" /> <span className="hidden xl:inline">Boşlukları kapat</span></button>
        </Tooltip></span>
        <span className="ml-2 hidden h-7 items-center rounded-full bg-white/[0.08] px-2.5 text-[12px] font-medium tabular-nums text-metin-2 md:flex">{proje.katmanlar.reduce((a, k) => a + k.klipler.length, 0)} klip · {kisaSure(toplam)}</span>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => st().zoomAyarla(zoom / 1.3)} aria-label="Uzaklaş" title="Uzaklaş" className={btn}><ZoomOut className="h-4 w-4" /></button>
          {!dar && (
            <span className="relative mx-1 flex h-4 w-24 items-center">
              <span className="absolute inset-x-0 h-1 rounded-full bg-white/[0.09]" />
              <span className="absolute left-0 h-1 rounded-full bg-white/40" style={{ width: `${((zoom - 10) / 190) * 100}%` }} />
              <span className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 rounded-full bg-white" style={{ left: `${((zoom - 10) / 190) * 100}%` }} />
              <input type="range" min={10} max={200} value={zoom} onChange={(e) => st().zoomAyarla(Number(e.target.value))} aria-label="Yakınlaştırma" className="absolute inset-0 cursor-pointer opacity-0" />
            </span>
          )}
          <button onClick={() => st().zoomAyarla(zoom * 1.3)} aria-label="Yakınlaş" title="Yakınlaş" className={btn}><ZoomIn className="h-4 w-4" /></button>
          <Tooltip label="Tümünü sığdır"><button onClick={sigdir} aria-label="Tümünü sığdır" className={btn}><Maximize className="h-4 w-4" /></button></Tooltip>
        </div>
      </div>

      {/* Gövde: tek kaydırma alanı — başlıklar solda, cetvel üstte yapışık */}
      <div ref={kaydirRef} className="relative min-h-0 flex-1 overflow-auto [scrollbar-width:thin]" onPointerDown={(e) => { if (e.target === e.currentTarget) st().klipSec(null); }}
        onPointerMove={(e) => { if (e.pointerType !== "mouse" || surukle) return; const el = kaydirRef.current!; const r = el.getBoundingClientRect(); const px = e.clientX - r.left + el.scrollLeft - BASLIK; setHayalet(px > 0 ? tAt(px) : null); }}
        onPointerLeave={() => setHayalet(null)}>
        <div className="relative" style={{ width: BASLIK + genislik, minHeight: "100%" }}>
          {/* Cetvel */}
          <div className="sticky top-0 z-30 flex" style={{ height: CETVEL }}>
            <div className="sticky left-0 z-10 flex shrink-0 items-center border-b border-r border-white/[0.06] bg-[#18191c] px-2" style={{ width: BASLIK }}>
              <div className="relative">
                <button onClick={() => setKatmanMenu((v) => !v)} aria-label="Katman ekle" className="flex h-7 items-center gap-1 rounded-[8px] px-2 text-[12px] font-medium text-metin-2 hover:bg-white/[0.07] hover:text-metin"><Plus className="h-3.5 w-3.5" />{dar ? "" : "Katman ekle"}</button>
                <AnimatePresence>
                  <Yuzen acik={katmanMenu} onKapat={() => setKatmanMenu(false)} yerlesim="alt-sol" bosluk={6} etiket="Katman ekle" className="w-48 rounded-[14px] border border-white/[0.09] bg-[#1b1c1f] p-1.5">
                    {(["video", "ses", "metin"] as KatmanTur[]).map((t) => {
                      const I = KATMAN[t].ikon;
                      return (
                        <button key={t} onClick={() => { st().katmanEkle(proje.id, t); setKatmanMenu(false); }} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] text-metin hover:bg-white/[0.06]">
                          <I className={cn("h-4 w-4", KATMAN[t].renk)} />{KATMAN[t].ad} katmanı
                        </button>
                      );
                    })}
                  </Yuzen>
                </AnimatePresence>
              </div>
            </div>
            <div className="relative flex-1 cursor-pointer border-b border-white/[0.06] bg-[#18191c]" onPointerDown={playheadSurukle}>
              {isaretler.map((t) => {
                const ana = Math.abs(t / adim - Math.round(t / adim)) < 1e-6;
                return (
                  <span key={t} className="absolute bottom-0" style={{ left: x(t) }}>
                    <span className={cn("block w-px", ana ? "h-2.5 bg-white/30" : "h-1.5 bg-white/[0.12]")} />
                    {ana && t > 0 && <span className="absolute bottom-3 left-1 whitespace-nowrap text-[10.5px] tabular-nums text-metin-3">{t >= 60 ? `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, "0")}` : adim < 1 ? `${t.toFixed(t % 1 ? 1 : 0)}s` : `0:${String(Math.round(t)).padStart(2, "0")}`}</span>}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Katmanlar */}
          {proje.katmanlar.map((kat) => {
            const g = KATMAN[kat.tur];
            const I = g.ikon;
            return (
              <div key={kat.id} className="flex border-b border-white/[0.04]" style={{ height: g.yukseklik + 14 }}>
                <div className={cn("group/kb sticky left-0 z-20 flex shrink-0 items-center gap-2 border-r border-white/[0.06] bg-[#18191c]", dar ? "justify-center" : "px-3")} style={{ width: BASLIK }} title={dar ? kat.ad : undefined}>
                  <I className={cn("h-4 w-4 shrink-0", g.renk)} />
                  <input hidden={dar} value={kat.ad} onChange={(e) => st().katmanGuncelle(proje.id, kat.id, { ad: e.target.value.slice(0, 20) })} aria-label="Katman adı"
                    className="min-w-0 flex-1 truncate bg-transparent text-[12.5px] font-medium text-metin-2 outline-none focus:text-metin" />
                  <span className={cn("flex items-center", dar && "hidden")}>
                    {kat.tur !== "ses" && (
                      <Tooltip label={kat.gizli ? "Göster" : "Gizle"}><button onClick={() => st().katmanGuncelle(proje.id, kat.id, { gizli: !kat.gizli })} className={cn("flex h-6 w-6 items-center justify-center rounded-md hover:bg-white/[0.08]", !kat.gizli && "hidden group-hover/kb:flex", kat.gizli ? "text-amber-300" : "text-metin-3 hover:text-metin")}>{kat.gizli ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button></Tooltip>
                    )}
                    {kat.tur !== "metin" && (
                      <Tooltip label={kat.solo ? "Soloyu kapat" : "Yalnız bu katmanı dinle (solo)"}><button onClick={() => st().katmanGuncelle(proje.id, kat.id, { solo: !kat.solo })} aria-pressed={!!kat.solo} className={cn("flex h-6 w-6 items-center justify-center rounded-md hover:bg-white/[0.08]", !kat.solo && "hidden group-hover/kb:flex", kat.solo ? "bg-amber-300/15 text-amber-300" : "text-metin-3 hover:text-metin")}><Headphones className="h-3.5 w-3.5" /></button></Tooltip>
                    )}
                    {kat.tur !== "metin" && (
                      <Tooltip label={kat.sessiz ? "Sesi aç" : "Sessize al"}><button onClick={() => st().katmanGuncelle(proje.id, kat.id, { sessiz: !kat.sessiz })} className={cn("flex h-6 w-6 items-center justify-center rounded-md hover:bg-white/[0.08]", !kat.sessiz && "hidden group-hover/kb:flex", kat.sessiz ? "text-amber-300" : "text-metin-3 hover:text-metin")}>{kat.sessiz ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}</button></Tooltip>
                    )}
                    <Tooltip label={kat.kilitli ? "Kilidi aç" : "Kilitle"}><button onClick={() => st().katmanGuncelle(proje.id, kat.id, { kilitli: !kat.kilitli })} className={cn("flex h-6 w-6 items-center justify-center rounded-md hover:bg-white/[0.08]", !kat.kilitli && "hidden group-hover/kb:flex", kat.kilitli ? "text-amber-300" : "text-metin-3 hover:text-metin")}>{kat.kilitli ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}</button></Tooltip>
                    {proje.katmanlar.length > 1 && (
                      <Tooltip label="Katmanı sil"><button onClick={() => { st().katmanSil(proje.id, kat.id); toast("Katman silindi", { action: { label: "Geri al", onClick: () => useMontaj.getState().geriAl(proje.id) } }); }} className="flex h-6 w-0 items-center justify-center overflow-hidden rounded-md text-metin-3 transition-all hover:bg-white/[0.08] hover:text-rose-300 group-hover/kb:w-6"><Trash2 className="h-3.5 w-3.5" /></button></Tooltip>
                    )}
                  </span>
                </div>
                <div data-katman={kat.id} className={cn("group/kt relative flex-1", kat.kilitli && "bg-[repeating-linear-gradient(135deg,transparent,transparent_8px,rgba(255,255,255,0.02)_8px,rgba(255,255,255,0.02)_16px)]", birakHedef === kat.id && "bg-aksan/[0.06]")}
                  onPointerDown={(e) => { if (e.target === e.currentTarget) st().klipSec(null); }}
                  onDragOver={(e) => { if (e.dataTransfer.types.includes(MEDYA_SURUKLE)) { e.preventDefault(); setBirakHedef(kat.id); } }}
                  onDragLeave={() => setBirakHedef(null)}
                  onDrop={(e) => birak(e, kat)}>
                  {!kat.klipler.length && (
                    <span className="pointer-events-none absolute inset-y-[7px] flex items-center gap-1.5 rounded-[8px] bg-white/[0.025] ring-1 ring-inset ring-white/[0.07] px-3 text-[12px] text-metin-3" style={{ left: x(0), width: Math.min(360, genislik - PAY * 2) }}>
                      <Plus className="h-3.5 w-3.5" /> {kat.tur === "ses" ? "Ses ya da müzik sürükle" : kat.tur === "metin" ? "Soldaki Yazı panelinden ekle" : "Medyayı buraya sürükle"}
                    </span>
                  )}
                  {kat.klipler.map((k0) => {
                    const ayni = surukle?.id === k0.id;
                    const k = ayni ? { ...k0, ...surukle!.onizleme } : k0;
                    if (ayni && surukle!.hedefKatman !== kat.id && surukle!.mod === "tasi") return null;
                    return <KlipKutu key={k.id} k={k} kat={kat} sol={x(k.baslangic)} gen={Math.max(6, klipSure(k) * zoom)} yuk={g.yukseklik} secili={seciliKlipId === k.id || secimler.includes(k.id)} surukleniyor={ayni && surukle!.oynadi}
                      onBasla={(e, m) => klipBasla(e, k0, kat, m)} onTasi={klipTasi} onBirak={klipBirak}
                      onSag={(e) => { e.preventDefault(); st().klipSec(k.id); setSagMenu({ x: e.clientX, y: e.clientY, id: k.id }); }} />;
                  })}
                  {/* Kesim işaretleri: bitişik iki klibin arasında; tıklayınca geçiş seçilir */}
                  {kat.tur === "video" && !surukle?.oynadi && (() => {
                    const sirali = [...kat.klipler].sort((a, b) => a.baslangic - b.baslangic);
                    return sirali.map((k, i) => {
                      const once = sirali[i - 1];
                      const bitisik = !!once && Math.abs(once.baslangic + klipSure(once) - k.baslangic) < 0.05;
                      const var_ = k.gecis !== "yok" && k.gecis !== "kesme";
                      if (!bitisik && !var_) return null;
                      if (klipSure(k) * zoom < 64 || (once && klipSure(once) * zoom < 64 && bitisik)) return null;
                      return (
                        <button key={`g-${k.id}`} title={var_ ? `Geçiş: ${MONTAJ_GECIS_META[k.gecis].ad}` : "Geçiş ekle"} aria-label={var_ ? `Geçiş: ${MONTAJ_GECIS_META[k.gecis].ad}` : "Geçiş ekle"}
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); st().klipSec(k.id); setGecisMenu({ x: r.left + r.width / 2, y: r.top, id: k.id }); }}
                          className={cn("absolute top-1/2 z-20 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ring-2 ring-[#18191c] transition-transform hover:scale-110",
                            var_ ? "bg-aksan text-[#06232a]" : "bg-white text-[#0b0c0e] opacity-0 hover:opacity-100 group-hover/kt:opacity-90")}
                          style={{ left: x(k.baslangic) }}>
                          {var_ ? <Blend className="h-3 w-3" /> : <Plus className="h-3 w-3" strokeWidth={2.75} />}
                        </button>
                      );
                    });
                  })()}
                  {/* Başka katmana taşınırken hayalet */}
                  {surukle?.oynadi && surukle.mod === "tasi" && surukle.hedefKatman === kat.id && surukle.katmanId !== kat.id && (() => {
                    const k = { ...surukle.asil, ...surukle.onizleme };
                    return <KlipKutu k={k} kat={kat} sol={x(k.baslangic)} gen={Math.max(6, klipSure(k) * zoom)} yuk={g.yukseklik} secili surukleniyor onBasla={() => {}} onTasi={klipTasi} onBirak={klipBirak} onSag={() => {}} />;
                  })()}
                </div>
              </div>
            );
          })}

          {/* İncelenen aralıklar (ör. bulunan sessizlikler) */}
          {vurgular.map((v, i) => (
            <div key={i} className={cn("pointer-events-none absolute bottom-0 z-[25] border-x", v.etkin ? "border-violet-300/70 bg-violet-500/25" : "border-white/20 bg-white/[0.055] [background-image:repeating-linear-gradient(135deg,transparent,transparent_5px,rgba(255,255,255,0.06)_5px,rgba(255,255,255,0.06)_10px)]")}
              style={{ left: BASLIK + x(v.bas), width: Math.max(2, (v.son - v.bas) * zoom), top: CETVEL }} />
          ))}
          {/* Yapışma çizgisi */}
          {yapisCizgi !== null && surukle?.oynadi && (
            <div className="pointer-events-none absolute bottom-0 top-0 z-30 w-px bg-amber-300 shadow-[0_0_6px_rgba(252,211,77,0.8)]" style={{ left: BASLIK + x(yapisCizgi) }} />
          )}
          {/* İşaretçiler */}
          {(proje.isaretler ?? []).map((m, i) => m.ad === "Ritim" ? (
            // Ritim vuruşu: ince, sessiz çizgi (yapışma noktası) — bayrak kalabalığı yapmasın
            <div key={i} className="pointer-events-none absolute top-0 z-[29]" style={{ left: BASLIK + x(m.t), height: "100%" }}>
              <span className="absolute top-[20px] h-2 w-[3px] -translate-x-1/2 rounded-full bg-orange-300/90" />
              <div className="absolute bottom-0 top-[30px] w-px bg-orange-300/[0.13]" />
            </div>
          ) : (
            <div key={i} className="absolute top-0 z-30" style={{ left: BASLIK + x(m.t), height: "100%" }}>
              <div className="pointer-events-none absolute bottom-0 top-[30px] w-px bg-amber-300/35" />
              <button onClick={() => { st().oynatDurdur(false); st().playheadAyarla(m.t); }}
                onContextMenu={(e) => { e.preventDefault(); st().projeGuncelle(proje.id, { isaretler: (proje.isaretler ?? []).filter((_, j) => j !== i) }); toast("İşaretçi kaldırıldı", { action: { label: "Geri al", onClick: () => st().projeGuncelle(proje.id, { isaretler: proje.isaretler }) } }); }}
                title={`${m.ad ?? `İşaretçi ${i + 1}`} · ${zamanKodu(m.t, proje.fps)} · sağ tık: kaldır`}
                className="absolute top-[14px] h-3.5 w-3 -translate-x-1/2 bg-amber-300 [clip-path:polygon(0_0,100%_0,100%_65%,50%_100%,0_65%)] hover:bg-amber-200" />
            </div>
          ))}
          {/* Hayalet playhead — fare konumu */}
          {hayalet !== null && !surukle && Math.abs(hayalet - playhead) * zoom > 4 && (
            <div className="pointer-events-none absolute bottom-0 top-0 z-30" style={{ left: BASLIK + x(hayalet) }}>
              <div className="absolute bottom-0 top-0 w-px bg-white/25" />
              <span className="absolute left-1 top-1 whitespace-nowrap rounded bg-black/75 px-1 text-[10px] tabular-nums text-white/85">{zamanKodu(hayalet, proje.fps)}</span>
            </div>
          )}
          {/* Playhead */}
          <div className="pointer-events-none absolute bottom-0 top-0 z-40" style={{ left: BASLIK + x(playhead) }}>
            <div className="absolute bottom-0 top-0 w-[2px] -translate-x-1/2 bg-white" />
            <div onPointerDown={playheadSurukle} className="pointer-events-auto absolute -top-px flex h-[22px] w-[14px] -translate-x-1/2 cursor-ew-resize items-start justify-center">
              <svg viewBox="0 0 14 22" className="h-full w-full"><path d="M2 1h10a1 1 0 0 1 1 1v10.5l-6 7.5-6-7.5V2a1 1 0 0 1 1-1z" fill="#fff" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Geçiş menüsü (kesim işaretinden) */}
      {gecisMenu && <EscKapat onKapat={() => setGecisMenu(null)} />}
      {gecisMenu && (() => {
        const gk = proje.katmanlar.flatMap((x) => x.klipler).find((x) => x.id === gecisMenu.id);
        if (!gk) return null;
        const sec = (g: MontajGecis) => { st().anlikKaydet(proje.id); st().klipGuncelle(proje.id, gk.id, { gecis: g, gecisSure: gk.gecisSure || 0.5 }); };
        return (
          <div className="fixed inset-0 z-[120]" onPointerDown={() => setGecisMenu(null)} onKeyDown={(e) => e.key === "Escape" && setGecisMenu(null)}>
            <div className="absolute w-[280px] -translate-x-1/2 -translate-y-full overflow-hidden rounded-[16px] border border-white/[0.09] bg-[#1b1c1f]"
              style={{ left: Math.max(146, Math.min(gecisMenu.x, window.innerWidth - 146)), top: gecisMenu.y - 8 }} onPointerDown={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-3 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.085]"><Blend className="h-3.5 w-3.5 text-white" /></span>
                <span className="min-w-0 flex-1 leading-tight"><span className="block text-[13.5px] font-semibold text-metin">Geçiş</span><span className="block truncate text-[11.5px] text-metin-3">{gk.ad} başlarken</span></span>
                {gk.gecis !== "yok" && <button onClick={() => sec("yok")} className="flex h-7 items-center rounded-full bg-white/[0.085] px-2.5 text-[12px] font-medium text-white/85 transition hover:bg-white/[0.14] hover:text-white">Kaldır</button>}
              </div>
              <div className="space-y-3 p-3">
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(MONTAJ_GECIS_META) as MontajGecis[]).filter((g) => g !== "yok").map((g) => (
                    <button key={g} onClick={() => sec(g)} aria-pressed={gk.gecis === g}
                      className={cn("h-9 truncate rounded-full px-2 text-[12.5px] font-medium transition-colors", gk.gecis === g ? "bg-white text-[#0b0c0e]" : "bg-white/[0.085] text-metin-2 hover:bg-white/[0.12] hover:text-metin")}>{MONTAJ_GECIS_META[g].ad}</button>
                  ))}
                </div>
                {gk.gecis !== "yok" && gk.gecis !== "kesme" && (
                  <div>
                    <p className="mb-1.5 text-[12px] font-medium text-metin-2">Uzunluk</p>
                    <div className="grid grid-cols-4 gap-0.5 rounded-full bg-white/[0.085] p-1 ring-1 ring-inset ring-white/[0.06]">
                      {[0.3, 0.5, 0.8, 1.2].map((d) => (
                        <button key={d} onClick={() => st().klipGuncelle(proje.id, gk.id, { gecisSure: d })} className={cn("h-7 rounded-full text-[12px] tabular-nums transition-colors", Math.abs(gk.gecisSure - d) < 0.01 ? "bg-white font-semibold text-black" : "text-metin-2 hover:text-metin")}>{String(d).replace(".", ",")} sn</button>
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={() => { if (gk.gecis === "yok" || gk.gecis === "kesme") return; st().anlikKaydet(proje.id); let n = 0; for (const kt of proje.katmanlar.filter((x) => x.tur === "video")) for (const c of [...kt.klipler].sort((a, b) => a.baslangic - b.baslangic).slice(1)) { st().klipGuncelle(proje.id, c.id, { gecis: gk.gecis, gecisSure: gk.gecisSure }); n++; } toast.success(`Geçiş ${n} kesime uygulandı`, { description: "Ctrl+Z ile geri alabilirsin." }); setGecisMenu(null); }}
                  disabled={gk.gecis === "yok" || gk.gecis === "kesme"} className="flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-white/[0.085] text-[12.5px] font-medium text-white transition hover:bg-white/[0.14] disabled:opacity-40">Tüm kesimlere uygula</button>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Sağ tık menüsü */}
      {sagMenu && (
        <div className="fixed inset-0 z-[120]" onPointerDown={() => setSagMenu(null)} onContextMenu={(e) => { e.preventDefault(); setSagMenu(null); }}>
          <div className="absolute w-[264px] rounded-[14px] border border-white/[0.09] bg-[#1b1c1f] p-1.5" style={{ left: Math.min(sagMenu.x, window.innerWidth - 274), top: Math.min(sagMenu.y, window.innerHeight - 340) }} onPointerDown={(e) => e.stopPropagation()}>
            {(() => {
              const mk = proje.katmanlar.flatMap((k) => k.klipler).find((x) => x.id === sagMenu.id);
              const l: [typeof Scissors, string, string, () => void][] = [
                [Scissors, "Oynatma çizgisinde böl", "S", () => bol()],
                [Copy, "Çoğalt", "Ctrl+D", () => st().klipCogalt(proje.id, sagMenu.id)],
                [ClipboardCopy, "Kopyala", "Ctrl+C", () => { st().klipKopyala(proje.id, sagMenu.id); toast.success("Klip kopyalandı", { description: "Ctrl+V ile yapıştırabilirsin." }); }],
                [ArrowUp, "Üst katmana taşı", "Ctrl+]", () => katmanaTasi(proje.id, sagMenu.id, -1)],
                [ArrowDown, "Alt katmana taşı", "Ctrl+[", () => katmanaTasi(proje.id, sagMenu.id, 1)],
              ];
              if (mk?.tur === "video" && mk.sesDuzey > 0) l.push([AudioLines, "Sesi ayır", "Ctrl+Shift+A", () => sesiAyir(proje.id, sagMenu.id)]);
              if (mk?.tur === "ses" || (mk?.tur === "video" && mk.sesDuzey > 0)) l.push([Activity, "Ritimleri işaretle", "", () => { const id = sagMenu.id; void ritimIsaretle(proje.id, id).then((n) => (n ? toast.success(`${n} vuruş işaretlendi`, { description: "İşaretçiler yapışma noktası olur; Akıllı panelinden ritme göre kesebilirsin." }) : toast.warning("Belirgin vuruş bulunamadı", { description: "Bu klipte ritim seçilemedi. Daha belirgin vuruşlu bir müzik dene." }))); }]);
              l.push([MoveHorizontal, "Sil ve boşluğu kapat", "Ctrl+Del", () => boslukluSil(sagMenu.id)], [Trash2, "Sil", "Del", () => st().klipSil(proje.id, sagMenu.id)]);
              return l;
            })().map(([I, ad, kisa, fn]) => (
              <button key={ad} onClick={() => { fn(); setSagMenu(null); }} className={cn("flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-1.5 text-left text-[13px] hover:bg-white/[0.06]", ad === "Sil" ? "text-rose-300" : "text-metin")}>
                <I className="h-3.5 w-3.5 shrink-0" /><span className="flex-1 truncate">{ad}</span>{kisa && <kbd className="shrink-0 text-[11px] text-metin-3">{kisa}</kbd>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════ Klip kutusu ═══════════ */

function KlipKutu({ k, kat, sol, gen, yuk, secili, surukleniyor, onBasla, onTasi, onBirak, onSag }: {
  k: MontajKlip; kat: MontajKatman; sol: number; gen: number; yuk: number; secili: boolean; surukleniyor: boolean;
  onBasla: (e: React.PointerEvent, mod: "tasi" | "sol" | "sag") => void; onTasi: (e: React.PointerEvent) => void; onBirak: () => void; onSag: (e: React.MouseEvent) => void;
}) {
  const g = KATMAN[kat.tur];
  const poster = gorselKaynak(k.gorselUrl);
  const I = k.tur === "ses" ? Music2 : k.tur === "metin" ? TypeIcon : Film;
  return (
    <div
      className={cn("group/k absolute top-[7px] select-none overflow-hidden rounded-[8px] ring-1 ring-inset transition-shadow", g.klip,
        secili ? "z-10 ring-2 ring-aksan" : "ring-white/[0.1] hover:ring-white/30",
        surukleniyor && "cursor-grabbing opacity-90", kat.kilitli && "opacity-60", kat.gizli && "opacity-40")}
      style={{ left: sol, width: gen, height: yuk }} data-klip={k.id}
      onPointerDown={(e) => onBasla(e, "tasi")} onPointerMove={onTasi} onPointerUp={onBirak} onContextMenu={onSag}>
      {/* İçerik */}
      {k.tur === "ses" ? (
        <DalgaSerit k={k} gen={gen} yuk={yuk} />
      ) : k.tur === "metin" ? (
        <span className="absolute inset-0 flex min-w-0 items-center gap-1.5 px-2.5 text-[12px] font-semibold text-amber-50"><TypeIcon className={cn("h-3.5 w-3.5 shrink-0 text-amber-300", gen < 34 && "hidden")} />{gen >= 46 && <span className="truncate">{k.metin || k.ad}</span>}</span>
      ) : k.tur === "video" && videoKaynak(k) ? (
        <KareSerit k={k} gen={gen} yuk={yuk} poster={poster} />
      ) : poster ? (
        <span className="absolute inset-0 opacity-90" style={{ backgroundImage: `url("${poster}")`, backgroundSize: `auto 100%`, backgroundRepeat: "repeat-x" }} />
      ) : null}
      {k.tur !== "metin" && (
        <span className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-1 bg-gradient-to-b from-black/70 to-transparent px-2 pb-2 pt-1">
          {gen > 40 && <I className="h-3 w-3 shrink-0 text-white/80" />}
          {gen > 70 && <span className="truncate text-[10.5px] font-semibold text-white">{k.ad}</span>}
          {k.hiz !== 1 && gen > 110 && <span className="ml-auto shrink-0 rounded bg-black/50 px-1 text-[9.5px] font-bold tabular-nums text-amber-200">{k.hiz}×</span>}
        </span>
      )}
      {gen > 60 && k.tur !== "metin" && <span className="pointer-events-none absolute bottom-1 right-4 rounded-full bg-black/55 px-1.5 py-px text-[10px] font-medium tabular-nums text-white backdrop-blur">{kisaSure(klipSure(k))}</span>}
      {(() => {
        const zamanlar = [...new Set(Object.values(k.keyframeler ?? {}).flatMap((l) => (l ?? []).map((f) => Math.round(f.t * 100) / 100)))];
        return zamanlar.map((t) => <span key={t} className="pointer-events-none absolute bottom-0.5 h-2 w-2 -translate-x-1/2 rotate-45 bg-amber-300 ring-1 ring-black/40" style={{ left: (t / Math.max(0.01, klipSure(k))) * gen }} />);
      })()}
      {k.efektler.length > 0 && gen > 46 && <span className="pointer-events-none absolute bottom-1 left-1.5 flex h-4 items-center gap-0.5 rounded-full bg-black/55 px-1.5 text-[10px] font-medium tabular-nums text-white" title={`${k.efektler.length} efekt`}><Wand2 className="h-2.5 w-2.5" />{k.efektler.length > 1 && k.efektler.length}</span>}
      {/* Kırpma tutamakları */}
      {!kat.kilitli && (["sol", "sag"] as const).map((m) => (
        <span key={m} onPointerDown={(e) => onBasla(e, m)}
          className={cn("absolute inset-y-0 z-10 flex w-2.5 cursor-ew-resize items-center justify-center transition-opacity", m === "sol" ? "left-0 rounded-l-[8px]" : "right-0 rounded-r-[8px]",
            secili ? "bg-aksan opacity-100" : "bg-white/70 opacity-0 group-hover/k:opacity-100")}>
          <span className="h-4 w-0.5 rounded-full bg-black/50" />
        </span>
      ))}
    </div>
  );
}

/** Video klibinin gerçek kare şeridi: her döşeme, kaynağın o konumdaki karesi (kırpma ve hız hesaba katılır). */
function KareSerit({ k, gen, yuk, poster }: { k: MontajKlip; gen: number; yuk: number; poster?: string }) {
  const [s, setS] = useState<{ kareler: string[]; sure: number; oran: number } | null>(null);
  const src = videoKaynak(k)!;
  useEffect(() => { let iptal = false; void kareSeridi(src).then((x) => { if (!iptal) setS(x); }); return () => { iptal = true; }; }, [src]);
  const doseme = Math.round(yuk * (s?.oran ?? 1.6));
  const n = Math.max(1, Math.ceil(gen / doseme));
  if (!s?.kareler.length) return poster ? <span className="absolute inset-0 opacity-90" style={{ backgroundImage: `url("${poster}")`, backgroundSize: "auto 100%", backgroundRepeat: "repeat-x" }} /> : null;
  const goster = k.sure - k.basKirp - k.sonKirp;
  return (
    <span className="absolute inset-0 flex overflow-hidden">
      {Array.from({ length: Math.min(n, 200) }, (_, i) => {
        const kt = k.basKirp + ((i + 0.5) / n) * goster;
        const idx = Math.max(0, Math.min(s.kareler.length - 1, Math.floor((kt / Math.max(0.01, s.sure)) * s.kareler.length)));
        // eslint-disable-next-line @next/next/no-img-element
        return <img key={i} src={s.kareler[idx]} alt="" draggable={false} className="h-full shrink-0 object-cover opacity-95" style={{ width: doseme }} />;
      })}
    </span>
  );
}

/** Ses klibinin gerçek dalga formu (kırpılan bölüm). */
function DalgaSerit({ k, gen, yuk }: { k: MontajKlip; gen: number; yuk: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [veri, setVeri] = useState<{ tepeler: Float32Array; sure: number } | null>(null);
  useEffect(() => { let iptal = false; if (k.sesUrl) void dalgaFormu(k.sesUrl).then((d) => { if (!iptal) setVeri(d); }); return () => { iptal = true; }; }, [k.sesUrl]);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(Math.min(gen, 6000))), h = yuk;
    c.width = w * dpr; c.height = h * dpr;
    const ctx = c.getContext("2d")!; ctx.scale(dpr, dpr); ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(110,231,183,0.85)";
    const orta = h / 2 + 4;
    for (let px = 0; px < w; px += 3) {
      let v = 0.18;
      if (veri) {
        const kaynakT = k.basKirp + (px / w) * (k.sure - k.basKirp - k.sonKirp);
        v = veri.tepeler[Math.min(veri.tepeler.length - 1, Math.floor((kaynakT / Math.max(0.01, veri.sure)) * veri.tepeler.length))] ?? 0;
      }
      const bh = Math.max(1.5, v * (h - 16) * (k.sesDuzey / 100));
      ctx.fillRect(px, orta - bh / 2, 2, bh);
    }
  }, [veri, gen, yuk, k.basKirp, k.sonKirp, k.sure, k.sesDuzey]);
  return <canvas ref={ref} className="absolute inset-0" style={{ width: Math.min(gen, 6000), height: yuk }} aria-hidden />;
}

/** Açık açılır menüyü Esc ile kapatır. */
function EscKapat({ onKapat }: { onKapat: () => void }) {
  useEffect(() => { const f = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onKapat(); } }; window.addEventListener("keydown", f, true); return () => window.removeEventListener("keydown", f, true); }, [onKapat]);
  return null;
}
