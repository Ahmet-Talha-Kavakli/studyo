"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Clapperboard, Music2, Type as TypeIcon, Sparkles, Wand2, Upload, Plus, Search, Film, Image as ImageIcon, Loader2, Play, Pause,
  Captions, Scissors, MoveHorizontal, Palette, Layers, Check, ArrowRight, AudioLines, Mic, X, Zap, LayoutTemplate, Shapes, SlidersHorizontal, RefreshCw, Activity, Flag,
} from "lucide-react";
import { cn, saltUrl } from "@/lib/utils";
import { useMasaustu } from "@/hooks/useMasaustu";
import { toast } from "@/lib/toast";
import { HapKaydirici, Rozet } from "@/components/studyo/hf";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { useSaglayicilar } from "@/hooks/useSaglayicilar";
import {
  useMontaj, montajToplamSure, klipSure, aiOnizle, AI_KOMUT_META, MONTAJ_EFEKT_META, MONTAJ_GECIS_META,
  type MontajProje, type MontajKlip, type MedyaOge, type MetinStil, type MontajGecis, type MontajEfekt, type AiKomutId,
} from "@/store/useMontaj";
import { medyaSuresi, sessizAraliklar, gorselKaynak, videoKaynak } from "@/lib/montajMotor";
import { dosyaYukle, MEDYA_SURUKLE, dosyalariIceAl, medyayiEkle, katmanBul, kisaSure, zamanKodu, tumKlipler, sonrakileriKaydir, ritimIsaretle, ritmeHizala } from "./ortak";
import { UretPanel, SablonPanel, AltyaziPanel, OgelerPanel } from "./MontajPanellerEk";
import { MontajKayit } from "./MontajKayit";
import { FONTLAR } from "./fontlar";
import { CipSecici } from "@/components/studyo/CipSecici";
import { Gauge as Gauge2 } from "lucide-react";
import { besteWavUrl } from "@/lib/muzikMotoru";
import { AnahtarSatir, PanelSerit, PKart, SayiHap, Segment } from "./ui";
import { FavoriKutusu, useKlasorIdleri } from "@/components/galeri/SuzgecCubugu";
import { KlasorMenusu } from "@/components/galeri/Klasorler";
import { GorunumAyari } from "@/components/galeri/GorunumAyari";
import { useGorunum } from "@/components/galeri/useGorunum";
import { zamanaGoreSirala } from "@/lib/galeri/gorunum";
import { Tooltip } from "@/components/ui/Tooltip";
import { Star } from "lucide-react";

export type PanelId = "medya" | "uret" | "sablon" | "ses" | "yazi" | "altyazi" | "ogeler" | "gecis" | "efekt" | "akilli";
export const PANELLER: { id: PanelId; ad: string; ikon: typeof Film }[] = [
  { id: "medya", ad: "Medya", ikon: Clapperboard },
  { id: "uret", ad: "AI Üret", ikon: Sparkles },
  { id: "sablon", ad: "Şablon", ikon: LayoutTemplate },
  { id: "ses", ad: "Ses", ikon: Music2 },
  { id: "yazi", ad: "Yazı", ikon: TypeIcon },
  { id: "altyazi", ad: "Altyazı", ikon: Captions },
  { id: "ogeler", ad: "Öğeler", ikon: Shapes },
  { id: "gecis", ad: "Geçiş", ikon: Layers },
  { id: "efekt", ad: "Efekt", ikon: Palette },
  { id: "akilli", ad: "Akıllı", ikon: Wand2 },
];

/** Yerel örnek klipler (gerçek dosyalar) — boş kitaplıkta denemek için. */
const ORNEKLER: { ad: string; dosya: string }[] = [
  { ad: "Drone yörünge", dosya: "drone-orbit" }, { ad: "Dolly geri", dosya: "dolly-out" }, { ad: "Vinç yukarı", dosya: "jib-up" },
  { ad: "Cama doğru", dosya: "push-to-glass" }, { ad: "Sola yörünge", dosya: "orbit-left" }, { ad: "El kamerası", dosya: "handheld" },
  { ad: "FPV dalış", dosya: "fpv-dive" }, { ad: "Yukarı tilt", dosya: "tilt-up" }, { ad: "Odak kayması", dosya: "focus-pull" },
  { ad: "Sağa yörünge", dosya: "orbit-right" }, { ad: "Geniş açı", dosya: "zoom-out" }, { ad: "Kaykay", dosya: "skate-cruise" },
];

const uretimdenMedya = (u: Uretim): MedyaOge | null => {
  const tur = u.tur === "video" ? "video" : u.tur === "gorsel" ? "gorsel" : u.tur === "ses" || u.tur === "muzik" ? "ses" : null;
  if (!tur) return null;
  const url = tur === "video" ? u.videoUrl : tur === "ses" ? u.sesUrl : saltUrl(u.gorselUrl);
  if (!url) return null;
  const m = u.meta?.sure?.match(/(\d+(?:\.\d+)?)/);
  return { id: `u_${u.id}`, ad: u.baslik || "Üretim", tur, url, poster: tur === "ses" ? undefined : saltUrl(u.gorselUrl) ?? saltUrl(u.thumbnailUrl), sure: m ? parseFloat(m[1]) : undefined, kaynakId: u.id };
};

export function MontajKutuphane({ proje, panel }: { proje: MontajProje; panel: PanelId }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {panel === "medya" && <MedyaPanel proje={proje} />}
      {panel === "uret" && <UretPanel proje={proje} />}
      {panel === "sablon" && <SablonPanel proje={proje} />}
      {panel === "altyazi" && <AltyaziPanel proje={proje} />}
      {panel === "ogeler" && <OgelerPanel proje={proje} />}
      {panel === "ses" && <SesPanel proje={proje} />}
      {panel === "yazi" && <YaziPanel proje={proje} />}
      {panel === "gecis" && <GecisPanel proje={proje} />}
      {panel === "efekt" && <EfektPanel proje={proje} />}
      {panel === "akilli" && <AkilliPanel proje={proje} />}
    </div>
  );
}

const PANEL_IKON: Record<string, typeof Film> = { Medya: Clapperboard, Ses: Music2, "Yazı": TypeIcon, "Geçiş": Layers, Efekt: Palette, "Akıllı araçlar": Wand2 };
function PanelBaslik({ baslik, alt, sag }: { baslik: string; alt?: string; sag?: React.ReactNode }) {
  const masaustu = useMasaustu();
  if (!masaustu) return sag ? <div className="flex shrink-0 justify-end px-4 pb-2">{sag}</div> : null;
  return <PanelSerit baslik={baslik} alt={alt} ikon={PANEL_IKON[baslik]} sag={sag} />;
}

/** Medyayı zaman çizelgesine ekler; süresi bilinmeyen video/sesin süresini önce okur. */
async function ekle(projeId: string, oge: MedyaOge) {
  let o = oge;
  if (o.tur !== "gorsel" && !o.sure) { const s = await medyaSuresi(o.url, o.tur); if (s) o = { ...o, sure: s }; }
  const id = medyayiEkle(projeId, o);
  if (id) { useMontaj.getState().klipSec(id); toast.success(`${o.ad} eklendi`); }
}

/* ═══════════ MEDYA ═══════════ */

function MedyaPanel({ proje }: { proje: MontajProje }) {
  const uretimler = useProjeler((s) => s.uretimler);
  const [sekme, setSekme] = useState<"proje" | "uretim" | "ornek">(() => (proje.medya ?? []).some((m) => m.tur !== "ses") ? "proje"
    : useProjeler.getState().uretimler.some((u) => u.durum === "tamam" && !u.id.startsWith("seed_") && (u.tur === "video" || u.tur === "gorsel")) ? "uretim" : "ornek");
  const [ara, setAra] = useState("");
  const [surukleUstu, setSurukleUstu] = useState(false);
  const dosyaRef = useRef<HTMLInputElement>(null);
  /* Üretimler sekmesi: favori ve klasör süzgeci, sıralama ve sütun yoğunluğu (görünüm ayarı "montaj"). */
  const [favori, setFavori] = useState(false);
  const [klasor, setKlasor] = useState<string | null>(null);
  const klasorIdleri = useKlasorIdleri(klasor);
  const [gorunum] = useGorunum("montaj");
  const sutun = gorunum.boyut === "kucuk" ? 3 : gorunum.boyut === "buyuk" ? 1 : gorunum.boyut === "ozel" ? Math.min(4, Math.max(1, Math.round(gorunum.sutun / 2))) : 2;

  const uretimMedya = useMemo(() => zamanaGoreSirala(uretimler.filter((u) => u.durum === "tamam" && !u.id.startsWith("seed_") && (u.tur === "video" || u.tur === "gorsel") && (!favori || u.favori) && (!klasorIdleri || klasorIdleri.has(u.id))), gorunum.siralama).map(uretimdenMedya).filter((x): x is MedyaOge => !!x), [uretimler, favori, klasorIdleri, gorunum.siralama]);
  const favoriler = useMemo(() => new Set(uretimler.filter((u) => u.favori).map((u) => u.id)), [uretimler]);
  const ornekMedya: MedyaOge[] = useMemo(() => ORNEKLER.map((o) => ({ id: `ornek_${o.dosya}`, ad: o.ad, tur: "video" as const, url: `/gercek/video-hareket/${o.dosya}.mp4`, poster: `/gercek/video-hareket/${o.dosya}-poster.webp` })), []);
  const projeMedya = (proje.medya ?? []).filter((m) => m.tur !== "ses");
  const liste = (sekme === "proje" ? projeMedya : sekme === "uretim" ? uretimMedya : ornekMedya).filter((m) => !ara.trim() || m.ad.toLocaleLowerCase("tr").includes(ara.trim().toLocaleLowerCase("tr")));

  return (
    <>
      <PanelBaslik baslik="Medya" alt="Sürükle bırak ya da + ile sona ekle" />
      <div className="space-y-3 px-4 pb-3">
        <input ref={dosyaRef} type="file" multiple accept="video/mp4,video/webm,video/quicktime,image/png,image/jpeg,image/webp,audio/*" hidden
          onChange={(e) => { const l = [...(e.target.files ?? [])]; e.target.value = ""; if (l.length) void dosyalariIceAl(proje.id, l).then((m) => m.length && setSekme("proje")); }} />
        <button onClick={() => dosyaRef.current?.click()}
          onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setSurukleUstu(true); } }} onDragLeave={() => setSurukleUstu(false)}
          onDrop={(e) => { e.preventDefault(); setSurukleUstu(false); const l = [...e.dataTransfer.files]; if (l.length) void dosyalariIceAl(proje.id, l).then((m) => m.length && setSekme("proje")); }}
          className={cn("group flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left ring-1 ring-inset transition-[background-color,box-shadow] active:scale-[0.99]", surukleUstu ? "bg-white/[0.08] ring-2 ring-white" : "bg-white/[0.045] ring-white/[0.08] hover:bg-white/[0.05] hover:ring-white/[0.16]")}>
          <span className="bg-white/[0.075] text-metin-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"><Upload className="h-[18px] w-[18px]" /></span>
          <span className="min-w-0"><span className="block text-[13.5px] font-semibold text-metin">Dosya yükle</span><span className="block text-[11.5px] text-metin-3">Video, görsel, ses · 300 MB'a kadar</span></span>
        </button>
        <MontajKayit proje={proje} />
        <Segment etiket="Medya kaynağı" deger={sekme} onDegis={setSekme} secenekler={[["proje", "Projede"], ["uretim", "Üretimler"], ["ornek", "Örnekler"]]} />
        {sekme === "uretim" && (
          <div className="gizli-scroll -mx-1 flex items-center gap-1.5 overflow-x-auto px-1">
            <FavoriKutusu acik={favori} onDegis={setFavori} />
            <KlasorMenusu secili={klasor} onSec={setKlasor} />
            <span className="flex-1" />
            <GorunumAyari sayfa="montaj" istemVar={false} yerlesimVar={false} />
          </div>
        )}
        <label className="flex h-10 items-center gap-2 rounded-full bg-white/[0.065] px-3.5 ring-1 ring-inset ring-white/[0.06] focus-within:ring-white/25">
          <Search className="h-3.5 w-3.5 text-metin-3" />
          <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Medyada ara" className="min-w-0 flex-1 bg-transparent text-[13px] text-metin outline-none placeholder:text-white/40" />
          {ara && <button onClick={() => setAra("")} aria-label="Aramayı temizle" className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.1] text-white/70 hover:text-white"><X className="h-3 w-3" /></button>}
        </label>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 [scrollbar-width:thin]">
        {liste.length ? (
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${sekme === "uretim" ? sutun : 2}, minmax(0, 1fr))` }}>
            {liste.map((m) => <MedyaKart key={m.id} m={m} onEkle={() => void ekle(proje.id, m)} favori={sekme === "uretim" && m.kaynakId ? favoriler.has(m.kaynakId) : undefined} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-white/[0.045] ring-1 ring-inset ring-white/[0.07] px-4 py-8 text-center">
            <span className="bg-white/[0.075] text-metin-2 flex h-10 w-10 items-center justify-center rounded-xl"><Film className="h-4 w-4 text-metin-2" /></span>
            <p className="text-[13px] font-semibold text-metin">{sekme === "proje" ? "Henüz dosya yüklemedin" : sekme === "uretim" ? (favori || klasor ? "Bu süzgece uyan üretim yok" : "Henüz video ya da görsel üretmedin") : "Sonuç yok"}</p>
            <p className="text-[11.5px] text-metin-3">{sekme === "uretim" ? "Video ya da Görsel stüdyosunda üret; burada hazır olur." : "Yukarıdan dosya yükle ya da örneklere göz at."}</p>
            {sekme !== "ornek" && <button onClick={() => setSekme("ornek")} className="mt-1 flex h-8 items-center rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black transition active:scale-[0.97]">Örnek kliplerle dene</button>}
          </div>
        )}
      </div>
    </>
  );
}

function MedyaKart({ m, onEkle, favori }: { m: MedyaOge; onEkle: () => void; favori?: boolean }) {
  const [oyna, setOyna] = useState(false);
  const poster = gorselKaynak(m.poster) ?? (m.tur === "gorsel" ? m.url : undefined);
  return (
    <div draggable onDragStart={(e) => { e.dataTransfer.setData(MEDYA_SURUKLE, JSON.stringify(m)); e.dataTransfer.effectAllowed = "copy"; }}
      onPointerEnter={(e) => { if (e.pointerType === "mouse" && m.tur === "video") setOyna(true); }} onPointerLeave={() => setOyna(false)}
      className="group relative aspect-video cursor-grab overflow-hidden rounded-xl bg-yuzey-2 ring-1 ring-white/[0.08] transition-shadow hover:ring-white/30 active:cursor-grabbing">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {poster && <img src={poster} alt="" loading="lazy" draggable={false} className="absolute inset-0 h-full w-full object-cover" />}
      {oyna && <video src={m.url} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />}
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <span className="pointer-events-none absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-md bg-black/55">{m.tur === "video" ? <Film className="h-3 w-3 text-white" /> : <ImageIcon className="h-3 w-3 text-white" />}</span>
      {m.sure ? <span className={cn("pointer-events-none absolute top-1.5 rounded-full bg-black/60 px-1.5 py-px text-[10.5px] font-medium tabular-nums text-white backdrop-blur", favori !== undefined ? "right-9" : "right-1.5")}>{kisaSure(m.sure)}</span> : null}
      {favori !== undefined && m.kaynakId && (
        <Tooltip label={favori ? "Favorilerden çıkar" : "Favorilere ekle"} side="bottom">
          <button onClick={(e) => { e.stopPropagation(); useProjeler.getState().favoriToggle(m.kaynakId!); }} aria-label={favori ? "Favorilerden çıkar" : "Favorilere ekle"} aria-pressed={favori}
            className={cn("absolute right-1.5 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 backdrop-blur transition-[opacity,transform] active:scale-90", favori ? "text-aksan" : "text-white opacity-0 group-hover:opacity-100 focus:opacity-100 [@media(hover:none)]:opacity-100")}>
            <Star className={cn("h-3.5 w-3.5", favori && "fill-current")} />
          </button>
        </Tooltip>
      )}
      <span className="pointer-events-none absolute bottom-1.5 left-2 right-10 truncate text-[11.5px] font-medium text-white">{m.ad}</span>
      <button onClick={onEkle} aria-label={`${m.ad} ekle`}
        className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white text-black opacity-0 transition-[opacity,transform] active:scale-90 group-hover:opacity-100 focus:opacity-100 [@media(hover:none)]:opacity-100"><Plus className="h-4 w-4" strokeWidth={2.5} /></button>
    </div>
  );
}

/* ═══════════ SES ═══════════ */

function SesPanel({ proje }: { proje: MontajProje }) {
  const uretimler = useProjeler((s) => s.uretimler);
  const dosyaRef = useRef<HTMLInputElement>(null);
  const [calan, setCalan] = useState<string | null>(null);
  const sesRef = useRef<HTMLAudioElement | null>(null);
  const uretimSes = useMemo(() => uretimler.filter((u) => u.durum === "tamam" && !u.id.startsWith("seed_") && (u.tur === "ses" || u.tur === "muzik")).map(uretimdenMedya).filter((x): x is MedyaOge => !!x), [uretimler]);
  const projeSes = (proje.medya ?? []).filter((m) => m.tur === "ses");
  const dinle = (m: MedyaOge) => {
    if (calan === m.id) { sesRef.current?.pause(); setCalan(null); return; }
    sesRef.current?.pause();
    const a = new Audio(m.url); sesRef.current = a; a.onended = () => setCalan(null);
    void a.play().then(() => setCalan(m.id)).catch(() => toast.error("Ses çalınamadı", { description: "Tarayıcı sesi oynatmaya izin vermedi. Sayfaya bir kez tıklayıp yeniden dene." }));
  };
  const Satir = ({ m }: { m: MedyaOge }) => (
    <div draggable onDragStart={(e) => { e.dataTransfer.setData(MEDYA_SURUKLE, JSON.stringify(m)); e.dataTransfer.effectAllowed = "copy"; }}
      className="group flex cursor-grab items-center gap-2.5 rounded-[12px] p-1.5 transition-colors hover:bg-white/[0.05]">
      <button onClick={() => dinle(m)} aria-label={calan === m.id ? "Durdur" : "Dinle"} className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition active:scale-90", calan === m.id ? "bg-white text-black" : "bg-white/[0.08] text-white hover:bg-white/[0.14]")}>
        {calan === m.id ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 translate-x-px fill-current" />}
      </button>
      <span className="min-w-0 flex-1"><span className="block truncate text-[12.5px] font-medium text-metin">{m.ad}</span><span className="block text-[11px] tabular-nums text-metin-3">{m.sure ? kisaSure(m.sure) : "Ses"}</span></span>
      <button onClick={() => void ekle(proje.id, m)} aria-label={`${m.ad} ekle`} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-black opacity-0 transition-[opacity,transform] active:scale-90 group-hover:opacity-100 focus:opacity-100 [@media(hover:none)]:opacity-100"><Plus className="h-4 w-4" strokeWidth={2.5} /></button>
    </div>
  );
  return (
    <>
      <PanelBaslik baslik="Ses" alt="Müzik, seslendirme ve efekt" />
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4 [scrollbar-width:thin]">
        <input ref={dosyaRef} type="file" multiple accept="audio/*" hidden onChange={(e) => { const l = [...(e.target.files ?? [])]; e.target.value = ""; if (l.length) void dosyalariIceAl(proje.id, l); }} />
        <button onClick={() => dosyaRef.current?.click()} className="group flex w-full items-center gap-3 rounded-2xl bg-white/[0.045] px-3.5 py-3 text-left ring-1 ring-inset ring-white/[0.08] transition-[background-color,transform] hover:bg-white/[0.05] active:scale-[0.99]">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.085] text-white transition-transform group-hover:scale-105"><Upload className="h-[18px] w-[18px]" /></span>
          <span className="min-w-0"><span className="block text-[13.5px] font-semibold text-metin">Ses dosyası yükle</span><span className="block text-[11.5px] text-metin-3">MP3, WAV, M4A, OGG</span></span>
        </button>
        <HazirMuzikler proje={proje} />
        <SesMikser proje={proje} />
        {projeSes.length > 0 && <PKart baslik="Projede" ikon={Layers} sag={<SayiHap n={projeSes.length} />} govde="p-1.5">{projeSes.map((m) => <Satir key={m.id} m={m} />)}</PKart>}
        <PKart baslik="Ses üretimlerin" ikon={AudioLines} sag={uretimSes.length > 0 ? <SayiHap n={uretimSes.length} /> : undefined} govde={uretimSes.length ? "p-1.5" : "p-3"}>
          {uretimSes.length ? uretimSes.map((m) => <Satir key={m.id} m={m} />) : (
            <div className="space-y-2.5">
              <p className="text-[12px] leading-snug text-white/55">Müzik ve seslendirme stüdyolarında ürettiklerin burada hazır olur.</p>
              <div className="grid grid-cols-2 gap-1.5">
                <Link href="/panel/muzik" className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-white/[0.085] text-[12.5px] font-medium text-white transition hover:bg-white/[0.12] active:scale-[0.97]"><Music2 className="h-3.5 w-3.5" />Müzik üret</Link>
                <Link href="/panel/ses" className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-white/[0.085] text-[12.5px] font-medium text-white transition hover:bg-white/[0.12] active:scale-[0.97]"><Mic className="h-3.5 w-3.5" />Seslendir</Link>
              </div>
            </div>
          )}
        </PKart>
      </div>
    </>
  );
}

/** Hazır müzikler: tarayıcıda bestelenen telifsiz parçalar (stok müzik kitaplığı). Dinle 15 sn önizler; Ekle montaj süresince besteler. */
const HAZIR_MUZIK: { id: string; ad: string; alt: string; bpm: number; minor: boolean; yogunluk: number; parlaklik: number; key: string; renk: string }[] = [
  { id: "sinema", ad: "Sinematik yükseliş", alt: "Geniş, duygusal", bpm: 76, minor: true, yogunluk: 0.45, parlaklik: 0.5, key: "D", renk: "#7dd3fc" },
  { id: "enerji", ad: "Enerjik vuruş", alt: "Reels, spor, tanıtım", bpm: 124, minor: false, yogunluk: 0.85, parlaklik: 0.75, key: "A", renk: "#fda4af" },
  { id: "lofi", ad: "Sakin lo-fi", alt: "Vlog, ders, arka plan", bpm: 82, minor: false, yogunluk: 0.35, parlaklik: 0.45, key: "F", renk: "#c4b5fd" },
  { id: "kurumsal", ad: "Temiz kurumsal", alt: "Sunum, ürün", bpm: 104, minor: false, yogunluk: 0.55, parlaklik: 0.6, key: "C", renk: "#86efac" },
  { id: "huzun", ad: "Hüzünlü piyano", alt: "Belgesel, anı", bpm: 70, minor: true, yogunluk: 0.3, parlaklik: 0.4, key: "E", renk: "#fde68a" },
  { id: "nese", ad: "Neşeli yaz", alt: "Seyahat, eğlence", bpm: 116, minor: false, yogunluk: 0.7, parlaklik: 0.8, key: "G", renk: "#fdba74" },
];
function HazirMuzikler({ proje }: { proje: MontajProje }) {
  const [calan, setCalan] = useState<string | null>(null);
  const [mesgul, setMesgul] = useState<string | null>(null);
  const ses = useRef<HTMLAudioElement | null>(null);
  const onbellek = useRef(new Map<string, string>());
  useEffect(() => () => ses.current?.pause(), []);
  const ayar = (m: (typeof HAZIR_MUZIK)[number], sure: number) => ({ tohum: `hazir-${m.id}`, bpm: m.bpm, key: m.key, minor: m.minor, sure, yogunluk: m.yogunluk, parlaklik: m.parlaklik, enstrumantal: true });
  const dinle = async (m: (typeof HAZIR_MUZIK)[number]) => {
    if (calan === m.id) { ses.current?.pause(); setCalan(null); return; }
    ses.current?.pause();
    setMesgul(m.id);
    try {
      let url = onbellek.current.get(m.id);
      if (!url) { url = await besteWavUrl(ayar(m, 15)); onbellek.current.set(m.id, url); }
      const a = new Audio(url); ses.current = a; a.onended = () => setCalan(null);
      await a.play(); setCalan(m.id);
    } catch { toast.error("Önizleme çalınamadı", { description: "Tarayıcı sesi oynatmaya izin vermedi. Sayfaya bir kez tıklayıp yeniden dene." }); }
    finally { setMesgul(null); }
  };
  const ekleMuzik = async (m: (typeof HAZIR_MUZIK)[number]) => {
    setMesgul(`e-${m.id}`);
    try {
      const sure = Math.min(180, Math.max(10, Math.ceil(montajToplamSure(proje)) || 30));
      const url = await dosyaYukle(await (await fetch(await besteWavUrl(ayar(m, sure)))).blob(), "audio/wav");
      const kat = katmanBul(proje.id, "ses", [0, sure]); if (!kat) return;
      const st = useMontaj.getState();
      st.anlikKaydet(proje.id);
      st.katmanGuncelle(proje.id, kat, { rol: "muzik" });
      const id = st.klipEkle(proje.id, kat, { ad: m.ad, tur: "ses", sesUrl: url, sure, baslangic: 0, sesDuzey: 70, sesGiris: 1, sesCikis: 2 });
      st.klipSec(id);
      toast.success(`${m.ad} eklendi`, { description: `Montajın ${kisaSure(sure)} süresi için bestelendi, müzik katmanına başa yerleşti.` });
    } catch (e) { toast.error("Müzik eklenemedi", { description: `${e instanceof Error ? e.message : "Beklenmeyen bir sorun çıktı."} Yeniden dene.` }); }
    finally { setMesgul(null); }
  };
  return (
    <PKart baslik="Hazır müzikler" alt="Telifsiz, montaj süresine göre bestelenir" ikon={Music2} govde="p-1.5">
      {HAZIR_MUZIK.map((m) => (
        <div key={m.id} className="group flex items-center gap-2.5 rounded-[12px] p-1.5 transition-colors hover:bg-white/[0.05]">
          <button onClick={() => void dinle(m)} aria-label={calan === m.id ? `${m.ad} durdur` : `${m.ad} dinle`}
            className={cn("relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full transition active:scale-90", calan === m.id ? "bg-white text-black" : "text-white")}
            style={calan === m.id ? undefined : { background: `color-mix(in srgb, ${m.renk} 22%, rgba(255,255,255,0.05))` }}>
            {mesgul === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : calan === m.id ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 translate-x-px fill-current" />}
          </button>
          <span className="min-w-0 flex-1"><span className="block truncate text-[12.5px] font-medium text-metin">{m.ad}</span><span className="block truncate text-[11px] text-metin-3">{m.alt} · {m.bpm} BPM</span></span>
          {calan === m.id && <span aria-hidden className="flex h-4 items-end gap-[2px]">{[0, 1, 2, 3].map((k) => <span key={k} className="w-[3px] animate-pulse rounded-full bg-white" style={{ height: `${40 + ((k * 37) % 60)}%`, animationDelay: `${k * 0.15}s` }} />)}</span>}
          <button onClick={() => void ekleMuzik(m)} disabled={!!mesgul} aria-label={`${m.ad} ekle`} className="flex h-7 shrink-0 items-center gap-1 rounded-full bg-white/[0.08] px-2.5 text-[12px] font-medium text-white transition hover:bg-white hover:text-black active:scale-95 disabled:opacity-50">
            {mesgul === `e-${m.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}Ekle
          </button>
        </div>
      ))}
    </PKart>
  );
}

/** Katman mikseri + konuşmada müziği otomatik kıs. */
function SesMikser({ proje }: { proje: MontajProje }) {
  const st = useMontaj.getState;
  const sesli = proje.katmanlar.filter((k) => k.tur !== "metin");
  return (
    <PKart baslik="Mikser" ikon={SlidersHorizontal} govde="p-0">
      <div className="space-y-3 p-3">
        {sesli.map((k) => {
          const d = k.sessiz ? 0 : k.duzey ?? 100;
          return (
            <div key={k.id} className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-white/80">{k.tur === "ses" ? <Music2 className="h-3.5 w-3.5" /> : <Film className="h-3.5 w-3.5" />}</span>
              <span className="w-16 truncate text-[12.5px] font-medium text-metin">{k.ad}</span>
              <span className="relative h-4 min-w-0 flex-1">
                <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/[0.1]" />
                <span className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-white" style={{ width: `${(d / 150) * 100}%` }} />
                <span className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" style={{ left: `${(d / 150) * 100}%` }} />
                <input type="range" min={0} max={150} value={d} onChange={(e) => st().katmanGuncelle(proje.id, k.id, { duzey: Number(e.target.value), sessiz: false })} aria-label={`${k.ad} ses düzeyi`} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
              </span>
              <span className="min-w-10 whitespace-nowrap text-right text-[11.5px] tabular-nums text-metin-2">{k.sessiz ? "Kapalı" : `yüzde ${d}`}</span>
              {k.tur !== "ses" ? <span className="w-[46px] shrink-0" /> : (
                <button onClick={() => st().katmanGuncelle(proje.id, k.id, { rol: k.rol === "muzik" ? undefined : "muzik" })} title="Müzik katmanı olarak işaretle (otomatik kısma için)" aria-pressed={k.rol === "muzik"}
                  className={cn("w-[46px] shrink-0 rounded-full py-0.5 text-center text-[11px] font-medium transition active:scale-95", k.rol === "muzik" ? "bg-white text-black" : "bg-white/[0.085] text-metin-3 hover:text-metin")}>Müzik</button>
              )}
            </div>
          );
        })}
      </div>
      <div className="border-t border-white/[0.06] px-3 py-2.5"><AnahtarSatir ad="Konuşmada müziği kıs" alt="Video sesi ya da konuşma varken müzik katmanı yüzde 22'ye iner" acik={!!proje.kisma} onDegis={() => st().projeGuncelle(proje.id, { kisma: !proje.kisma })} /></div>
    </PKart>
  );
}

/* ═══════════ YAZI ═══════════ */

const YAZI_STILLERI: { stil: MetinStil; ad: string; ornek: string; boyut: number; konum: "ust" | "orta" | "alt"; anim: MontajKlip["metinAnim"]; sinif: string }[] = [
  { stil: "baslik", ad: "Başlık", ornek: "Büyük başlık", boyut: 96, konum: "orta", anim: "pop", sinif: "text-[20px] font-extrabold" },
  { stil: "altbaslik", ad: "Alt başlık", ornek: "Alt başlık", boyut: 54, konum: "orta", anim: "yukari", sinif: "text-[15px] font-medium" },
  { stil: "altyazi", ad: "Altyazı", ornek: "Konuşma altyazısı", boyut: 44, konum: "alt", anim: "fade", sinif: "rounded bg-black/70 px-1.5 py-0.5 text-[12px] font-bold" },
  { stil: "etiket", ad: "Etiket", ornek: "YENİ", boyut: 40, konum: "ust", anim: "pop", sinif: "rounded bg-white px-1.5 py-0.5 text-[11px] font-bold tracking-widest text-black" },
  { stil: "alinti", ad: "Alıntı", ornek: "“Bir alıntı”", boyut: 58, konum: "orta", anim: "fade", sinif: "font-serif text-[16px] italic" },
  { stil: "sinematik", ad: "Sinematik", ornek: "S İ N E M A", boyut: 50, konum: "orta", anim: "fade", sinif: "text-[13px] font-light tracking-[0.3em]" },
];

/** Yazı tipi kombinasyonları (CapCut "metin şablonları" gibi): font + renk + kontur + animasyon hazır. */
const YAZI_KOMBO: { id: string; ad: string; ornek: string; font: string; renk: string; kontur?: number; konturRenk?: string; boyut: number; konum: "ust" | "orta" | "alt"; anim: MontajKlip["metinAnim"]; stil: MetinStil; buyuk?: boolean; kutu?: string; aralik?: number }[] = [
  { id: "viral", ad: "Viral", ornek: "BUNU İZLE", font: "anton", renk: "#facc15", kontur: 14, konturRenk: "#000000", boyut: 92, konum: "orta", anim: "pop", stil: "baslik", buyuk: true },
  { id: "zarif", ad: "Zarif", ornek: "Yeni sezon", font: "playfair", renk: "#ffffff", boyut: 76, konum: "orta", anim: "fade", stil: "alinti" },
  { id: "sinema", ad: "Sinema", ornek: "BÖLÜM BİR", font: "bebas", renk: "#ffffff", boyut: 110, konum: "orta", anim: "fade", stil: "sinematik", aralik: 24 },
  { id: "el", ad: "El yazısı", ornek: "teşekkürler", font: "caveat", renk: "#ffffff", boyut: 96, konum: "orta", anim: "daktilo", stil: "baslik" },
  { id: "rozet", ad: "Rozet", ornek: "YÜZDE 50 İNDİRİM", font: "archivo", renk: "#04131a", boyut: 54, konum: "ust", anim: "pop", stil: "etiket", kutu: "#22d3ee" },
  { id: "retro", ad: "Retro", ornek: "Yaz Partisi", font: "lobster", renk: "#f472b6", kontur: 8, konturRenk: "#1e1b4b", boyut: 88, konum: "orta", anim: "yukari", stil: "baslik" },
];

/** Marka seti: renkler, yazı tipi ve logo — tek tıkla tüm yazılara/montaja uygulanır (kalıcı). */
function MarkaSeti({ proje }: { proje: MontajProje }) {
  const marka = useMontaj((s) => s.marka);
  const ayarla = useMontaj.getState().markaAyarla;
  const logoRef = useRef<HTMLInputElement>(null);
  const [yuk, setYuk] = useState(false);
  const uygula = () => {
    const st = useMontaj.getState();
    const yazilar = tumKlipler(proje).filter((k) => k.tur === "metin");
    if (!yazilar.length) return void toast.error("Montajda yazı yok", { description: "Marka setini uygulamak için önce bir yazı ya da öğe ekle." });
    st.anlikKaydet(proje.id);
    for (const k of yazilar) {
      if (k.oge) st.klipGuncelle(proje.id, k.id, { oge: { ...k.oge, renk: marka.renkler[0] ?? k.oge.renk } });
      else st.klipGuncelle(proje.id, k.id, { ...(marka.font ? { metinFont: marka.font } : {}), ...(k.metinStil === "karaoke" ? { vurguRenk: marka.renkler[0] } : {}), ...(k.metinArka || k.metinStil === "etiket" ? { metinKutuRenk: marka.renkler[0] } : {}) });
    }
    toast.success("Marka seti uygulandı", { description: `${yazilar.length} yazı ve öğe güncellendi. Ctrl+Z ile geri alabilirsin.` });
  };
  const logoEkle = () => {
    if (!marka.logo) return logoRef.current?.click();
    const sure = Math.max(3, montajToplamSure(proje));
    const kat = katmanBul(proje.id, "metin", [0, sure]); if (!kat) return;
    const id = useMontaj.getState().klipEkle(proje.id, kat, { ad: "Logo", tur: "metin", oge: { tip: "logo", renk: "#ffffff" }, gorselUrl: marka.logo, sure, baslangic: 0, opaklik: 90 });
    useMontaj.getState().klipSec(id);
    toast.success("Logo eklendi", { description: "Tüm montaj boyunca köşede görünür." });
  };
  return (
    <PKart baslik="Marka seti" ikon={Palette} sag={<button onClick={uygula} className="flex h-7 items-center rounded-full bg-white/[0.08] px-2.5 text-[11.5px] font-semibold text-white transition hover:bg-white hover:text-black active:scale-95">Tüm yazılara uygula</button>} govde="space-y-2.5 p-3">
      <input ref={logoRef} type="file" accept="image/png,image/webp,image/svg+xml,image/jpeg" hidden onChange={async (e) => {
        const d = e.target.files?.[0]; e.target.value = ""; if (!d) return;
        setYuk(true); try { ayarla({ logo: await dosyaYukle(d, d.type) }); toast.success("Logo marka setine kaydedildi"); } catch { toast.error("Logo yüklenemedi", { description: "Dosya yüklenirken bağlantı kesildi. Yeniden dene." }); } finally { setYuk(false); }
      }} />
      <div className="flex flex-wrap items-center gap-1.5">
        {marka.renkler.map((c, i) => (
          <button key={`${c}${i}`} onClick={() => ayarla({ renkler: marka.renkler.filter((_, j) => j !== i) })} title="Kaldırmak için tıkla" aria-label={`Marka rengi ${c}`}
            className="group relative h-8 w-8 rounded-full ring-1 ring-inset ring-white/20 transition-transform hover:scale-105" style={{ background: c }}>
            <X className="absolute inset-0 m-auto h-3.5 w-3.5 text-white opacity-0 mix-blend-difference group-hover:opacity-100" />
          </button>
        ))}
        {marka.renkler.length < 6 && (
          <label className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/[0.075] text-white/60 ring-1 ring-inset ring-white/[0.1] transition hover:bg-white/[0.12] hover:text-white" title="Renk ekle">
            <Plus className="h-3.5 w-3.5" />
            <input type="color" className="sr-only" onChange={(e) => ayarla({ renkler: [...marka.renkler, e.target.value] })} aria-label="Marka rengi ekle" />
          </label>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {marka.logo && <img src={marka.logo} alt="Marka logosu" className="ml-auto h-8 w-8 rounded-[8px] bg-white/[0.065] object-contain ring-1 ring-white/10" />}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <CipSecici etiket="Marka yazı tipi" bosAd="Yazı tipi seç" deger={marka.font} onSec={(v) => ayarla({ font: v })} genislik={230}
          secenekler={FONTLAR.map((f) => ({ deger: f.id, ad: f.ad, alt: f.tur, stil: { fontFamily: f.aile, fontWeight: f.agirlik ?? 700, fontSize: 15 } }))} />
        <button onClick={logoEkle} disabled={yuk} className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-white/[0.085] text-[12.5px] font-medium text-white transition hover:bg-white/[0.12] active:scale-[0.97]">{yuk ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}{marka.logo ? "Logoyu ekle" : "Logo yükle"}</button>
      </div>
    </PKart>
  );
}

function YaziPanel({ proje }: { proje: MontajProje }) {
  const [metin, setMetin] = useState("");
  const marka = useMontaj((s) => s.marka);
  const komboEkle = (c: (typeof YAZI_KOMBO)[number]) => {
    const t = useMontaj.getState().playhead;
    const kat = katmanBul(proje.id, "metin", [t, t + 3]); if (!kat) return;
    const ham = metin.trim() || c.ornek;
    const icerik = c.buyuk ? ham.toLocaleUpperCase("tr") : ham;
    const id = useMontaj.getState().klipEkle(proje.id, kat, { ad: icerik.slice(0, 30), tur: "metin", metin: icerik, sure: 3, baslangic: t, metinStil: c.stil, metinBoyut: c.boyut, metinKonum: c.konum, metinAnim: c.anim, metinRenk: c.renk, metinFont: c.font, metinKontur: c.kontur, metinKonturRenk: c.konturRenk, metinKutuRenk: c.kutu, metinArka: c.kutu ? true : undefined, metinAralik: c.aralik });
    useMontaj.getState().klipSec(id);
    toast.success(`${c.ad} yazısı eklendi`, { description: `${zamanKodu(t, proje.fps)} konumuna eklendi. Sağ panelden düzenleyebilirsin.` });
  };
  const ekleYazi = (s: (typeof YAZI_STILLERI)[number]) => {
    const t = useMontaj.getState().playhead;
    const kat = katmanBul(proje.id, "metin", [t, t + 3]); if (!kat) return;
    const icerik = metin.trim() || (s.stil === "etiket" ? "YENİ" : s.stil === "altyazi" ? "Altyazı metni" : s.ad);
    const id = useMontaj.getState().klipEkle(proje.id, kat, { ad: icerik.slice(0, 30), tur: "metin", metin: icerik, sure: 3, baslangic: t, metinStil: s.stil, metinBoyut: s.boyut, metinKonum: s.konum, metinAnim: s.anim, metinRenk: "#ffffff", ...(marka.font ? { metinFont: marka.font } : {}) });
    useMontaj.getState().klipSec(id);
    toast.success(`${s.ad} eklendi`, { description: `${zamanKodu(t, proje.fps)} konumuna eklendi. Sağ panelden düzenleyebilirsin.` });
  };
  return (
    <>
      <PanelBaslik baslik="Yazı" alt="Oynatma çizgisinin olduğu yere eklenir" />
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-4 [scrollbar-width:thin]">
        <textarea value={metin} onChange={(e) => setMetin(e.target.value.slice(0, 200))} rows={2} placeholder="Yazacağın metin; boş bırakırsan örnek yazı eklenir"
          className="block w-full resize-none rounded-[14px] bg-white/[0.055] p-3 text-[13px] text-metin outline-none ring-1 ring-inset ring-white/[0.07] placeholder:text-white/40 focus:ring-white/25" />
        <MarkaSeti proje={proje} />
        <PKart baslik="Hazır kombinasyonlar" alt="Yazı tipi, renk ve animasyon hazır" ikon={Sparkles}>
        <div className="grid grid-cols-2 gap-2">
          {YAZI_KOMBO.map((c) => {
            const f = FONTLAR.find((x) => x.id === c.font);
            const goster = (metin.trim() || c.ornek).slice(0, 18);
            return (
              <button key={c.id} onClick={() => komboEkle(c)}
                className="group relative flex aspect-[16/10] flex-col overflow-hidden rounded-[12px] bg-[url(/gercek/video-hareket/drone-orbit-poster.webp)] bg-cover bg-center text-left shadow-[inset_0_0_0_999px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.08] transition-[box-shadow,transform] hover:ring-white/40 active:scale-[0.98]">
                <span className="flex flex-1 items-center justify-center px-2 text-center">
                  <span className={cn("leading-none", c.kutu && "rounded px-1.5 py-1")} style={{ fontFamily: f?.aile, fontWeight: f?.agirlik ?? 800, color: c.renk, fontSize: c.id === "rozet" ? 13 : 21, letterSpacing: c.aralik ? "0.18em" : undefined, background: c.kutu, WebkitTextStroke: c.kontur ? `${c.kontur / 6}px ${c.konturRenk}` : undefined, paintOrder: "stroke fill" }}>
                    {c.buyuk ? goster.toLocaleUpperCase("tr") : goster}
                  </span>
                </span>
                <span className="flex items-center justify-between bg-black/45 px-2 py-1 text-[11.5px] font-medium text-white/85 backdrop-blur">{c.ad}<Plus className="h-3.5 w-3.5 text-white/50 transition-colors group-hover:text-white" /></span>
              </button>
            );
          })}
        </div>
        </PKart>
        <PKart baslik="Temel stiller" ikon={TypeIcon}>
        <div className="grid grid-cols-2 gap-2">
          {YAZI_STILLERI.map((s) => (
            <button key={s.stil} onClick={() => ekleYazi(s)}
              className="group relative flex aspect-[16/10] flex-col overflow-hidden rounded-[12px] bg-[url(/gercek/video-hareket/drone-orbit-poster.webp)] bg-cover bg-center text-left shadow-[inset_0_0_0_999px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.08] transition-[box-shadow,transform] hover:ring-white/40 active:scale-[0.98]">
              <span className="flex flex-1 items-center justify-center px-2 text-center text-white">
                <span className={s.sinif}>{metin.trim() ? (s.stil === "sinematik" || s.stil === "etiket" ? metin.trim().toLocaleUpperCase("tr") : metin.trim()).slice(0, 24) : s.ornek}</span>
              </span>
              <span className="flex items-center justify-between bg-black/45 px-2 py-1 text-[11.5px] font-medium text-white/85 backdrop-blur">{s.ad}<Plus className="h-3.5 w-3.5 text-white/50 transition-colors group-hover:text-white" /></span>
            </button>
          ))}
        </div>
        </PKart>
      </div>
    </>
  );
}

/* ═══════════ GEÇİŞ ═══════════ */

const GECIS_DEMO: Record<MontajGecis, string> = {
  yok: "", kesme: "", fade: "animate-[mjFade_1.6s_ease-in-out_infinite]", kaydir: "animate-[mjKaydir_1.6s_ease-in-out_infinite]",
  yakinlas: "animate-[mjYakin_1.6s_ease-in-out_infinite]", bulanik: "animate-[mjBulanik_1.6s_ease-in-out_infinite]", beyazparla: "animate-[mjFade_1.6s_ease-in-out_infinite]",
};

function GecisPanel({ proje }: { proje: MontajProje }) {
  const seciliId = useMontaj((s) => s.seciliKlipId);
  const k = tumKlipler(proje).find((x) => x.id === seciliId && x.tur !== "ses" && x.tur !== "metin");
  const uygula = (g: MontajGecis) => {
    if (!k) return void toast.error("Klip seçilmedi", { description: "Geçiş eklemek için zaman çizelgesinde bir video ya da görsel klip seç." });
    useMontaj.getState().anlikKaydet(proje.id);
    useMontaj.getState().klipGuncelle(proje.id, k.id, { gecis: g });
    toast.success(`${MONTAJ_GECIS_META[g].ad} uygulandı`, { description: g === "yok" ? undefined : "Klibin başında oynar." });
  };
  const hepsine = (g: MontajGecis) => {
    useMontaj.getState().anlikKaydet(proje.id);
    let n = 0;
    for (const kat of proje.katmanlar.filter((x) => x.tur === "video")) for (const c of kat.klipler.slice(1)) { useMontaj.getState().klipGuncelle(proje.id, c.id, { gecis: g }); n++; }
    if (n) toast.success(`${n} kesime ${MONTAJ_GECIS_META[g].ad} uygulandı`); else toast.warning("Geçiş uygulanmadı", { description: "Geçiş için video katmanında en az iki klip gerekli." });
  };
  return (
    <>
      <PanelBaslik baslik="Geçiş" alt={k ? `Seçili: ${k.ad}` : "Önce zaman çizelgesinde bir klip seç"} />
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-4 [scrollbar-width:thin]">
        <style>{`@keyframes mjFade{0%,30%{opacity:0}70%,100%{opacity:1}}@keyframes mjKaydir{0%,30%{transform:translateX(100%)}70%,100%{transform:translateX(0)}}@keyframes mjYakin{0%,30%{transform:scale(1.35);opacity:0}70%,100%{transform:scale(1);opacity:1}}@keyframes mjBulanik{0%,30%{filter:blur(8px);opacity:.3}70%,100%{filter:blur(0);opacity:1}}`}</style>
        <PKart baslik="Geçişler" alt={k ? "Seçili klibin başında oynar" : "Önce zaman çizelgesinde bir klip seç"} ikon={Layers}
          sag={k && k.gecis !== "yok" ? <button onClick={() => uygula("yok")} className="flex h-7 items-center gap-1 rounded-full bg-white/[0.08] px-2.5 text-[12px] font-medium text-white/85 transition hover:bg-white/[0.14] hover:text-white active:scale-95"><X className="h-3 w-3" />Kaldır</button> : undefined}>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(MONTAJ_GECIS_META) as MontajGecis[]).filter((g) => g !== "yok").map((g) => {
            const sec = k?.gecis === g;
            return (
              <button key={g} onClick={() => uygula(g)} aria-pressed={sec}
                className="group relative overflow-hidden rounded-[12px] text-left ring-1 ring-inset ring-white/[0.08] transition-[box-shadow,transform] hover:ring-white/30 active:scale-[0.98]">
                <span className="relative block aspect-video overflow-hidden bg-[#1d4e5a]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/gercek/video-hareket/drone-orbit-poster.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
                  {g !== "kesme" && (
                    <span className={cn("absolute inset-0", GECIS_DEMO[g])} style={g === "beyazparla" ? { background: "#fff" } : undefined}>
                      {g !== "beyazparla" && /* eslint-disable-next-line @next/next/no-img-element */ <img src="/gercek/video-hareket/orbit-left-poster.webp" alt="" className="h-full w-full object-cover" />}
                    </span>
                  )}
                  {g === "kesme" && <span className="absolute inset-y-0 right-0 w-1/2 overflow-hidden">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/gercek/video-hareket/orbit-left-poster.webp" alt="" className="h-full w-[200%] max-w-none -translate-x-1/2 object-cover" /></span>}
                </span>
                <span className={cn("block px-2 py-1.5 text-[12px] font-medium", sec ? "text-white" : "text-metin-2")}>{MONTAJ_GECIS_META[g].ad}</span>
                {sec && <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[12px] ring-2 ring-inset ring-white" />}
              </button>
            );
          })}
        </div>
        </PKart>
        {k && k.gecis !== "yok" && k.gecis !== "kesme" && (
          <PKart baslik="Geçiş süresi" ikon={Gauge2} govde="p-3">
            <HapKaydirici ad="Uzunluk" deger={k.gecisSure} min={0.2} max={2} adim={0.1} onDegis={(v) => useMontaj.getState().klipGuncelle(proje.id, k.id, { gecisSure: v })} solUc="Hızlı" sagUc="Yavaş" yaz={(n) => `${n.toFixed(1)} sn`} />
          </PKart>
        )}
        <PKart baslik="Tüm kesimlere uygula" alt="Video katmanındaki her kesime aynı geçiş" ikon={Scissors} govde="p-3">
          <div className="flex flex-wrap gap-1.5">
            {(["fade", "kaydir", "yakinlas", "bulanik", "kesme"] as MontajGecis[]).map((g) => (
              <button key={g} onClick={() => hepsine(g)} className="h-8 rounded-full bg-white/[0.085] px-3 text-[12px] font-medium text-white/85 transition hover:bg-white/[0.13] hover:text-white active:scale-95">{MONTAJ_GECIS_META[g].ad}</button>
            ))}
          </div>
        </PKart>
      </div>
    </>
  );
}

/* ═══════════ EFEKT ═══════════ */

function EfektPanel({ proje }: { proje: MontajProje }) {
  const seciliId = useMontaj((s) => s.seciliKlipId);
  const k = tumKlipler(proje).find((x) => x.id === seciliId && (x.tur === "video" || x.tur === "gorsel"));
  const ornek = gorselKaynak(k?.gorselUrl) ?? "/gercek/video-hareket/jib-up-poster.webp";
  const gruplar: [string, (typeof MONTAJ_EFEKT_META)[MontajEfekt]["grup"]][] = [["Renk tarifleri", "renk"], ["Stil", "stil"], ["Hareket", "hareket"]];
  const tikla = (e: MontajEfekt) => {
    if (!k) return void toast.error("Klip seçilmedi", { description: "Efekt uygulamak için zaman çizelgesinde bir video ya da görsel klip seç." });
    useMontaj.getState().anlikKaydet(proje.id);
    // Renk tarifleri birbirini dışlar.
    if (MONTAJ_EFEKT_META[e].grup === "renk") for (const d of k.efektler) if (d !== e && MONTAJ_EFEKT_META[d].grup === "renk") useMontaj.getState().klipEfektToggle(proje.id, k.id, d);
    useMontaj.getState().klipEfektToggle(proje.id, k.id, e);
  };
  return (
    <>
      <PanelBaslik baslik="Efekt" alt={k ? `Seçili: ${k.ad}` : "Önce zaman çizelgesinde bir klip seç"} />
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4 [scrollbar-width:thin]">
        {gruplar.map(([baslik, grup]) => (
          <PKart key={grup} baslik={baslik} ikon={grup === "renk" ? Palette : grup === "stil" ? Sparkles : Activity}>
            <div className={cn("grid gap-2", grup === "renk" ? "grid-cols-3" : "grid-cols-2")}>
              {grup === "renk" && (() => {
                const yok = !k?.efektler.some((x) => MONTAJ_EFEKT_META[x].grup === "renk");
                return (
                  <button onClick={() => { if (!k) return void toast.error("Klip seçilmedi", { description: "Efekt uygulamak için zaman çizelgesinde bir video ya da görsel klip seç." }); useMontaj.getState().anlikKaydet(proje.id); for (const d of k.efektler) if (MONTAJ_EFEKT_META[d].grup === "renk") useMontaj.getState().klipEfektToggle(proje.id, k.id, d); }}
                    aria-pressed={!!k && yok} className="relative overflow-hidden rounded-[12px] text-left ring-1 ring-inset ring-white/[0.08] transition-[box-shadow,transform] hover:ring-white/30 active:scale-[0.97]">
                    <span className="relative block aspect-square overflow-hidden">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={ornek} alt="" className="h-full w-full object-cover" /></span>
                    <span className={cn("block truncate px-1.5 py-1 text-[11.5px] font-medium", k && yok ? "text-white" : "text-metin-2")}>Orijinal</span>
                    {!!k && yok && <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[12px] ring-2 ring-inset ring-white" />}
                  </button>
                );
              })()}
              {(Object.keys(MONTAJ_EFEKT_META) as MontajEfekt[]).filter((e) => MONTAJ_EFEKT_META[e].grup === grup).map((e) => {
                const acik = !!k?.efektler.includes(e);
                return (
                  <button key={e} onClick={() => tikla(e)} aria-pressed={acik} className="relative overflow-hidden rounded-[12px] text-left ring-1 ring-inset ring-white/[0.08] transition-[box-shadow,transform] hover:ring-white/30 active:scale-[0.97]">
                    <span className={cn("relative block overflow-hidden", grup === "renk" ? "aspect-square" : "aspect-video")}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ornek} alt="" className={cn("h-full w-full object-cover", e === "yakinlas" && "scale-110", e === "sarsinti" && "animate-[mjSars_0.2s_steps(2)_infinite]")} style={{ filter: MONTAJ_EFEKT_META[e].css || undefined }} />
                      {e === "vinyet" && <span className="absolute inset-0" style={{ boxShadow: "inset 0 0 30px 12px rgba(0,0,0,0.7)" }} />}
                    </span>
                    <span className={cn("block truncate px-1.5 py-1 text-[11.5px] font-medium", acik ? "text-white" : "text-metin-2")}>{MONTAJ_EFEKT_META[e].ad}</span>
                    {acik && <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[12px] ring-2 ring-inset ring-white" />}
                  </button>
                );
              })}
            </div>
          </PKart>
        ))}
        <style>{`@keyframes mjSars{0%{transform:translate(1px,-1px) scale(1.05)}100%{transform:translate(-1px,1px) scale(1.05)}}`}</style>

      </div>
    </>
  );
}

/* ═══════════ AKILLI ARAÇLAR ═══════════ */

const TARIFLER: AiKomutId[] = ["kurgu", "reel", "grade", "tempo", "gecis"];

function AkilliPanel({ proje }: { proje: MontajProje }) {
  const seciliId = useMontaj((s) => s.seciliKlipId);
  const saglayici = useSaglayicilar();
  const elevenBagli = saglayici?.eleven === true;
  const [mesgul, setMesgul] = useState<null | "altyazi" | "sessiz" | "ritim">(null);
  /* Sessizlik incelemesi: bulunan aralıklar tek tek onaylanır (kes / kalsın) */
  const [inceleme, setInceleme] = useState<{ klipId: string; araliklar: { a: number; b: number; kes: boolean }[] } | null>(null);
  const [hassas, setHassas] = useState({ esik: -38, min: 0.6 });
  const vurgula = (l: { a: number; b: number; kes: boolean }[] | null, k?: MontajKlip) => {
    if (!l || !k) return useMontaj.getState().vurguAyarla([]);
    const hiz = Math.max(0.25, k.hiz);
    useMontaj.getState().vurguAyarla(l.map((x) => ({ bas: k.baslangic + (x.a - k.basKirp) / hiz, son: k.baslangic + (x.b - k.basKirp) / hiz, etkin: x.kes })));
  };
  useEffect(() => () => useMontaj.getState().vurguAyarla([]), []);
  const [onay, setOnay] = useState<AiKomutId | null>(null);
  const klipler = tumKlipler(proje);
  const sesliKlipler = klipler.filter((k) => (k.tur === "ses" && k.sesUrl) || (k.tur === "video" && videoKaynak(k)));
  const hedef = sesliKlipler.find((k) => k.id === seciliId) ?? sesliKlipler[0];

  /* Gerçek konuşma tanıma (ElevenLabs Scribe) → sözcük zamanlamalı altyazı klipleri. */
  const altyazi = async () => {
    if (!hedef) return void toast.error("Konuşma içeren klip yok", { description: "Otomatik altyazı için konuşma içeren bir video ya da ses klibi ekle." });
    if (!elevenBagli) return void toast.error("ElevenLabs bağlı değil", { description: "Otomatik altyazı için ElevenLabs bağlantısı gerekli. Ayarlar'dan bağlayıp yeniden dene." });
    setMesgul("altyazi");
    try {
      const url = hedef.tur === "ses" ? hedef.sesUrl! : videoKaynak(hedef)!;
      const blob = await (await fetch(url)).blob();
      if (blob.size > 45 * 1024 * 1024) throw new Error("Dosya 45 MB'tan büyük; daha kısa bir klip seç.");
      const dataUrl = await new Promise<string>((ok, red) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => red(new Error("Okunamadı")); r.readAsDataURL(blob); });
      const yanit = await fetch("/api/uretim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tur: "ses", model: "Eleven Scribe", prompt: `Altyazı: ${hedef.ad}`, meta: { mod: "transkript", kaynakAd: hedef.ad }, girdi: { kaynak: dataUrl } }) });
      const j = (await yanit.json()) as { ok: boolean; gercek?: boolean; hata?: string; detay?: { kelimeler?: { k: string; b: number; s: number }[] } };
      if (!j.ok) throw new Error(j.hata ?? "Yazıya dökülemedi");
      if (!j.gercek) throw new Error("Ses sağlayıcısı bağlı değil");
      const kelimeler = (j.detay?.kelimeler ?? []).filter((w) => !/^\(.*\)$/.test(w.k));
      if (!kelimeler.length) throw new Error("Klipte konuşma bulunamadı");
      // Kaynak zamanını zaman çizelgesine çevir; ~6 kelimelik ya da 2.8 sn'lik parçalara böl.
      const hiz = Math.max(0.25, hedef.hiz);
      const parcalar: { metin: string; b: number; s: number }[] = [];
      let p: { metin: string[]; b: number; s: number } | null = null;
      for (const w of kelimeler) {
        if (w.b < hedef.basKirp || w.b > hedef.sure - hedef.sonKirp) continue;
        const b = hedef.baslangic + (w.b - hedef.basKirp) / hiz, s = hedef.baslangic + (w.s - hedef.basKirp) / hiz;
        if (!p) p = { metin: [], b, s };
        p.metin.push(w.k); p.s = s;
        if (p.metin.length >= 6 || p.s - p.b > 2.8 || /[.!?]$/.test(w.k)) { parcalar.push({ metin: p.metin.join(" "), b: p.b, s: p.s }); p = null; }
      }
      if (p) parcalar.push({ metin: p.metin.join(" "), b: p.b, s: p.s });
      const st = useMontaj.getState();
      st.katmanEkle(proje.id, "metin");
      const kat = useMontaj.getState().projeler.find((x) => x.id === proje.id)!.katmanlar.find((x) => x.tur === "metin")!;
      st.katmanGuncelle(proje.id, kat.id, { ad: "Altyazı" });
      for (const c of parcalar) st.klipEkle(proje.id, kat.id, { ad: c.metin.slice(0, 30), tur: "metin", metin: c.metin, baslangic: c.b, sure: Math.max(0.6, c.s - c.b + 0.15), metinStil: "altyazi", metinBoyut: 44, metinKonum: "alt", metinAnim: "fade", metinRenk: "#ffffff" });
      toast.success(`${parcalar.length} altyazı eklendi`, { description: `"${hedef.ad}" konuşmasından yeni Altyazı katmanına eklendi.` });
    } catch (e) {
      toast.error("Altyazı oluşturulamadı", { description: `${e instanceof Error ? e.message : "Beklenmeyen bir sorun çıktı."} Yeniden dene.` });
    } finally { setMesgul(null); }
  };

  /* 1. adım — gerçek ses analizi: sessiz bölümleri bulur, zaman çizelgesinde mor şeritle gösterir. */
  const sessizBul = async (esik = hassas.esik, min = hassas.min) => {
    if (!hedef) return void toast.error("Sesli klip seçilmedi", { description: "Sessizlikleri bulmak için sesli bir video ya da ses klibi seç." });
    setMesgul("sessiz");
    try {
      const url = hedef.tur === "ses" ? hedef.sesUrl! : videoKaynak(hedef)!;
      const aralik = await sessizAraliklar(url, esik, min);
      if (!aralik) throw new Error("Ses çözümlenemedi");
      const bas = hedef.basKirp, son = hedef.sure - hedef.sonKirp;
      // Kenarlarda 0,12 sn nefes payı bırak
      const l = aralik.filter(([a, b]) => b > bas && a < son).map(([a, b]) => ({ a: Math.max(bas, a + 0.12), b: Math.min(son, b - 0.12), kes: true })).filter((x) => x.b - x.a > 0.15);
      if (!l.length) { setInceleme(null); vurgula(null); return void toast.info("Kesilecek sessizlik bulunamadı", { description: "Hassasiyeti artırıp yeniden dene." }); }
      setInceleme({ klipId: hedef.id, araliklar: l });
      vurgula(l, hedef);
    } catch (e) {
      toast.error("Sessizlik taraması yapılamadı", { description: `${e instanceof Error ? e.message : "Beklenmeyen bir sorun çıktı."} Yeniden dene.` });
    } finally { setMesgul(null); }
  };

  /* 2. adım — onaylanan sessizlikleri çıkarıp klibi parçalara böler ve sıkıştırır. */
  const sessizlik = () => {
    const hedef = klipler.find((k) => k.id === inceleme?.klipId);
    if (!hedef || !inceleme) return;
    try {
      const bas = hedef.basKirp, son = hedef.sure - hedef.sonKirp;
      const kalan: [number, number][] = [];
      let imlec = bas;
      for (const x of inceleme.araliklar) { if (!x.kes) continue; if (x.a > imlec + 0.15) kalan.push([imlec, x.a]); imlec = Math.max(imlec, x.b); }
      if (son > imlec + 0.15) kalan.push([imlec, son]);
      if (!inceleme.araliklar.some((x) => x.kes)) return void toast.info("Kesilecek sessizlik seçilmedi", { description: "Listeden en az bir aralığı işaretle." });
      const st = useMontaj.getState();
      const kat = proje.katmanlar.find((x) => x.klipler.some((c) => c.id === hedef.id))!;
      st.anlikKaydet(proje.id);
      st.klipSil(proje.id, hedef.id);
      const hiz = Math.max(0.25, hedef.hiz);
      let t = hedef.baslangic;
      const yeni = useMontaj.getState().klipEkle;
      for (const [a, b] of kalan) {
        const id = yeni(proje.id, kat.id, { ...hedef, ad: hedef.ad, tur: hedef.tur, baslangic: t, sure: hedef.sure });
        useMontaj.getState().klipGuncelle(proje.id, id, { basKirp: a, sonKirp: hedef.sure - b, hiz: hedef.hiz, efektler: hedef.efektler, renk: hedef.renk, sesDuzey: hedef.sesDuzey, opaklik: hedef.opaklik });
        t += (b - a) / hiz;
      }
      const kazanc = klipSure(hedef) - (t - hedef.baslangic);
      // Ripple: aynı katmanda sonrası kısalma kadar sola kayar
      sonrakileriKaydir(proje.id, kat.id, "", hedef.baslangic + klipSure(hedef), -kazanc);
      setInceleme(null); vurgula(null);
      toast.success(`${kalan.length} parçaya bölündü`, { description: `${kazanc.toFixed(1)} sn sessizlik çıkarıldı. Ctrl+Z ile geri alabilirsin.` });
    } catch (e) {
      toast.error("Sessizlik kesilemedi", { description: `${e instanceof Error ? e.message : "Beklenmeyen bir sorun çıktı."} Yeniden dene.` });
    }
  };

  /* Ritme göre kurgu (Beat Sync): müzikteki vuruşları bulur, işaretler ve video kesimlerini vuruşlara hizalar. */
  const muzik = klipler.find((k) => k.tur === "ses" && k.sesUrl && proje.katmanlar.find((x) => x.klipler.includes(k))?.rol === "muzik") ?? klipler.find((k) => k.tur === "ses" && k.sesUrl);
  const ritim = async (hizala: boolean) => {
    if (!muzik) return void toast.error("Montajda müzik yok", { description: "Ritmi çıkarmak için Ses panelinden bir müzik ya da ses klibi ekle." });
    setMesgul("ritim");
    try {
      const n = await ritimIsaretle(proje.id, muzik.id);
      if (!n) throw new Error("Belirgin vuruş bulunamadı");
      if (!hizala) return void toast.success(`${n} vuruş işaretlendi`, { description: "Klipleri sürüklerken vuruşlara yapışır." });
      const vur = (useMontaj.getState().projeler.find((x) => x.id === proje.id)?.isaretler ?? []).filter((m) => m.ad === "Ritim").map((m) => m.t);
      const d = ritmeHizala(proje.id, vur);
      toast.success(d ? `${d} kesim vuruşa hizalandı` : "Vuruşlar işaretlendi", { description: d ? `${n} vuruş bulundu. Ctrl+Z ile geri alabilirsin.` : "Kaynak süreleri hizalamaya yetmedi; işaretçilere elle yapıştırabilirsin." });
    } catch (e) {
      toast.error("Ritim çıkarılamadı", { description: `${e instanceof Error ? e.message : "Beklenmeyen bir sorun çıktı."} Yeniden dene.` });
    } finally { setMesgul(null); }
  };

  const Arac = ({ ikon: I, renk, baslik, alt, onClick, rozet, kilit, yukleniyor }: { ikon: typeof Film; renk: string; baslik: string; alt: string; onClick: () => void; rozet?: React.ReactNode; kilit?: boolean; yukleniyor?: boolean }) => (
    <button onClick={onClick} disabled={!!mesgul}
      className="flex w-full items-start gap-3 rounded-[16px] bg-white/[0.045] p-3 text-left ring-1 ring-inset ring-white/[0.07] transition-[background-color,transform] hover:bg-white/[0.06] active:scale-[0.99] disabled:opacity-60">
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.085] text-white", renk && "")}>{yukleniyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <I className="h-4 w-4" />}</span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5 text-[13px] font-semibold text-metin">{baslik}{rozet}</span>
        <span className="block text-[11.5px] leading-snug text-metin-3">{alt}</span>
      </span>
      <ArrowRight className="mt-2.5 h-3.5 w-3.5 shrink-0 text-metin-3" />
    </button>
  );

  return (
    <>
      <PanelBaslik baslik="Akıllı araçlar" alt={hedef ? `Hedef klip: ${hedef.ad}` : "Seçili klip üzerinde çalışır"} />
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-4 [scrollbar-width:thin]">
        <Arac ikon={Captions} renk="text-aksan" baslik="Otomatik altyazı" alt="Konuşmayı yazıya döker, sözcük zamanlamasıyla altyazı katmanı ekler." onClick={() => void altyazi()}
          yukleniyor={mesgul === "altyazi"} />
        {!inceleme ? (
          <Arac ikon={Scissors} renk="text-emerald-300" baslik="Sessizlikleri bul ve kes" alt="Klibin sesini çözümler; bulunan sessizlikleri zaman çizelgesinde gösterir, sen onaylarsın." onClick={() => void sessizBul()} yukleniyor={mesgul === "sessiz"} />
        ) : (
          <div className="space-y-2.5 rounded-[16px] bg-white/[0.055] p-3 ring-1 ring-inset ring-white/[0.12]">
            <div className="flex items-center gap-2">
              <span className="bg-white/[0.075] text-metin-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"><Scissors className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold text-metin">{inceleme.araliklar.length} sessizlik bulundu</span>
                <span className="block text-[11px] tabular-nums text-metin-3">{inceleme.araliklar.filter((x) => x.kes).length} kesilecek · {kisaSure(inceleme.araliklar.filter((x) => x.kes).reduce((a, x) => a + x.b - x.a, 0))} kazanç</span></span>
              <button onClick={() => { setInceleme(null); vurgula(null); }} aria-label="İncelemeyi kapat" className="flex h-7 w-7 items-center justify-center rounded-md text-metin-3 hover:bg-white/[0.07] hover:text-metin"><X className="h-3.5 w-3.5" /></button>
            </div>
            <HapKaydirici ad="Hassasiyet" deger={-hassas.esik} min={28} max={52} adim={1} onDegis={(v) => setHassas((h) => ({ ...h, esik: -v }))} solUc="Yalnız sessiz" sagUc="Fısıltı da" yaz={(n) => `-${Math.round(n)} dB`} />
            <HapKaydirici ad="En kısa sessizlik" deger={hassas.min} min={0.3} max={2} adim={0.1} onDegis={(v) => setHassas((h) => ({ ...h, min: v }))} solUc="0,3 sn" sagUc="2 sn" yaz={(n) => `${n.toFixed(1)} sn`} />
            <button onClick={() => void sessizBul()} disabled={!!mesgul} className="flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-white/[0.085] text-[12.5px] font-medium text-white/85 transition hover:bg-white/[0.12] hover:text-white active:scale-[0.98]">{mesgul === "sessiz" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Bu ayarlarla yeniden bul</button>
            <div className="max-h-48 space-y-1 overflow-y-auto pr-0.5 [scrollbar-width:thin]">
              {inceleme.araliklar.map((x, i) => {
                const k = klipler.find((c) => c.id === inceleme.klipId);
                const tl = k ? k.baslangic + (x.a - k.basKirp) / Math.max(0.25, k.hiz) : 0;
                return (
                  <div key={i} className={cn("flex items-center gap-2 rounded-lg px-2 py-1.5", x.kes ? "bg-violet-400/10" : "bg-white/[0.045] opacity-70")}>
                    <button onClick={() => { useMontaj.getState().oynatDurdur(false); useMontaj.getState().playheadAyarla(Math.max(0, tl - 0.4)); }} className="text-[11px] tabular-nums text-violet-200 hover:underline">{zamanKodu(tl, proje.fps)}</button>
                    <span className="flex-1 text-[11px] tabular-nums text-metin-3">{(x.b - x.a).toFixed(1)} sn</span>
                    <button onClick={() => { const l = inceleme.araliklar.map((y, j) => (j === i ? { ...y, kes: !y.kes } : y)); setInceleme({ ...inceleme, araliklar: l }); vurgula(l, k); }}
                      className={cn("rounded-md px-2 py-0.5 text-[11.5px] font-medium", x.kes ? "bg-violet-400/25 text-violet-100" : "bg-white/[0.075] text-metin-3")}>{x.kes ? "Kes" : "Kalsın"}</button>
                  </div>
                );
              })}
            </div>
            <button onClick={sessizlik} className="flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-white text-[13px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.98]"><Scissors className="h-3.5 w-3.5" /> Seçilenleri kes</button>
          </div>
        )}
        <div className="space-y-2.5 rounded-[16px] bg-white/[0.045] p-3 ring-1 ring-inset ring-white/[0.07]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.085] text-white">{mesgul === "ritim" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}</span>
            <span className="min-w-0"><span className="block text-[13px] font-semibold text-metin">Ritme göre kurgu</span><span className="block truncate text-[11.5px] leading-snug text-metin-3">{muzik ? `Müzik: ${muzik.ad}` : "Önce bir müzik ekle"}</span></span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button onClick={() => void ritim(false)} disabled={!!mesgul || !muzik} className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-white/[0.085] text-[12px] font-medium text-white transition hover:bg-white/[0.12] active:scale-[0.97] disabled:opacity-40"><Flag className="h-3.5 w-3.5" /> Vuruşları işaretle</button>
            <button onClick={() => void ritim(true)} disabled={!!mesgul || !muzik} className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-white text-[12px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.97] disabled:bg-white/[0.07] disabled:text-white/40"><Zap className="h-3.5 w-3.5" /> Kesimleri hizala</button>
          </div>
        </div>
        <Arac ikon={MoveHorizontal} renk="text-sky-300" baslik="Tüm boşlukları kapat" alt="Her katmanda klipleri sırayla birbirine yanaştırır."
          onClick={() => { for (const kat of proje.katmanlar) useMontaj.getState().klipleriSirala(proje.id, kat.id); toast.success("Boşluklar kapatıldı", { description: "Ctrl+Z ile geri alabilirsin." }); }} />
        <PKart baslik="Hızlı kurgu tarifleri" alt="Tek dokunuşla kurgu, geri alınabilir" ikon={Zap} govde="space-y-1.5 p-1.5">
          <div className="space-y-1">
            {TARIFLER.map((id) => {
              const acik = onay === id;
              const on = acik ? aiOnizle(proje, id) : null;
              return (
                <div key={id} className={cn("overflow-hidden rounded-[12px] transition-colors", acik ? "bg-white/[0.075] ring-1 ring-inset ring-white/[0.14]" : "hover:bg-white/[0.04]")}>
                  <button onClick={() => setOnay(acik ? null : id)} className="flex w-full items-center gap-2.5 px-3 py-2 text-left">
                    <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", acik ? "bg-white text-black" : "bg-white/[0.085] text-white/70")}><Wand2 className="h-3.5 w-3.5" /></span>
                    <span className="min-w-0 flex-1"><span className="block text-[12.5px] font-medium text-metin">{AI_KOMUT_META[id].ad}</span><span className="block truncate text-[11px] text-metin-3">{AI_KOMUT_META[id].ozet}</span></span>
                  </button>
                  {on && (
                    <div className="space-y-2 border-t border-white/[0.06] px-3 pb-3 pt-2">
                      <ul className="space-y-0.5 text-[11.5px] text-metin-2">{on.notlar.map((n) => <li key={n} className="flex gap-2"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-white/70" />{n}</li>)}</ul>
                      <p className="text-[11px] tabular-nums text-metin-3">{on.etkilenen} klip · süre {kisaSure(on.sonrakiSure)}</p>
                      <div className="flex gap-1.5">
                        <button onClick={() => { const s = useMontaj.getState().aiUygula(proje.id, id); setOnay(null); if (s === "Önce klip ekle") toast.error("Montajda klip yok", { description: "Kurgu tarifini uygulamak için önce zaman çizelgesine klip ekle." }); else toast.success("Kurgu tarifi uygulandı", { description: `${AI_KOMUT_META[id].ad}: ${s}. Ctrl+Z ile geri alabilirsin.` }); }}
                          className="flex h-9 flex-1 items-center justify-center rounded-full bg-white text-[12.5px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.97]">Uygula</button>
                        <button onClick={() => setOnay(null)} aria-label="Vazgeç" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.085] text-white/70 transition hover:bg-white/[0.12] hover:text-white active:scale-95"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </PKart>
      </div>
    </>
  );
}
