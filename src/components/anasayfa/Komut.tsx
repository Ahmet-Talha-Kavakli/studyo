"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Image as ImageIcon, Film, AudioLines, Music, Box, Plus, ChevronDown, Check, Dice5, X, SlidersHorizontal, ArrowUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { KATALOG, type KatalogModel, type KatalogTur } from "@/lib/modelKatalogu";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { cn } from "@/lib/utils";

/* ── Tür tanımları: komut kutusunun ayar seçenekleri ve örnek istemleri ── */
type Secenek = { ad: string; degerler: string[]; carpan?: number[] };
export type TurTanim = {
  id: KatalogTur; ad: string; ikon: LucideIcon; studyo: string;
  /** Başlıkta dönen ad ("Hayalindeki ___"). */
  isim: string;
  /** "Vayra ___ çevirsin" kalıbı için yönelme hâli. */
  donusum: string;
  tercih: RegExp[];
  secenekler: Secenek[];
  ornekler: { kisa: string; metin: string; gorsel: string }[];
  referans: boolean;
};

const G = "/gercek";
export const TURLER: TurTanim[] = [
  {
    id: "video", isim: "video", ad: "Video", ikon: Film, studyo: "/panel/video", donusum: "videoya", referans: true,
    tercih: [/^seedance 2\.5/i, /^kling 3\.0 turbo/i, /^gemini omni/i],
    secenekler: [{ ad: "Oran", degerler: ["16:9", "9:16", "1:1"] }, { ad: "Süre", degerler: ["5 sn", "10 sn"], carpan: [1, 2] }],
    ornekler: [
      { kisa: "Zirvede gün doğumu", metin: "Karlı bir zirvede gün doğumu, drone yavaşça yükselip etrafında dönüyor", gorsel: `${G}/video-hareket/drone-orbit-poster.webp` },
      { kisa: "Neon sokakta yağmur", metin: "Neon ışıklı bir sokakta yağmur altında yürüyen kadın, el kamerası", gorsel: `${G}/video-hareket/viral-spin-poster.webp` },
      { kisa: "Buğday tarlası", metin: "Buğday tarlasının ortasında duran adam, kamera yukarıdan yavaşça iniyor", gorsel: `${G}/video-hareket/jib-down-poster.webp` },
      { kisa: "Kayalıkta dalgalar", metin: "Kayalıklara vuran dalgalar, ağır çekim, altın saat ışığı", gorsel: `${G}/video-hareket/crane-up-poster.webp` },
    ],
  },
  {
    id: "gorsel", isim: "görsel", ad: "Görsel", ikon: ImageIcon, studyo: "/panel/gorsel", donusum: "görsele", referans: true,
    tercih: [/^nano banana pro/i, /^gpt image 2\.5/i, /^seedream 5\.0 pro/i],
    secenekler: [{ ad: "Oran", degerler: ["1:1", "4:5", "16:9", "9:16"] }, { ad: "Adet", degerler: ["1", "2", "4"], carpan: [1, 2, 4] }],
    ornekler: [
      { kisa: "Parfüm çekimi", metin: "Islak mermerde parfüm şişesi, su sıçraması, lüks ürün çekimi", gorsel: `${G}/panel/gal-gpt-0.webp` },
      { kisa: "Tokyo ara sokağı", metin: "Yağmurlu Tokyo ara sokağı, kırmızı fenerler, ıslak asfaltta yansımalar", gorsel: `${G}/proje-kesfet/kesfet-04.webp` },
      { kisa: "Kafede kitap", metin: "Pencere kenarında kitap okuyan kadın, sıcak kafe ışığı, belgesel tarzı", gorsel: `${G}/panel/gal-gpt-1.webp` },
      { kisa: "Hamburger çekimi", metin: "Erimiş peynirli hamburger, koyu zemin, stüdyo yemek fotoğrafı", gorsel: `${G}/galeri/urun3.webp` },
    ],
  },
  {
    id: "muzik", isim: "şarkı", ad: "Müzik", ikon: Music, studyo: "/panel/muzik", donusum: "şarkıya", referans: false,
    tercih: [/suno/i, /eleven.*music/i, /lyria/i],
    secenekler: [{ ad: "Vokal", degerler: ["Vokalli", "Enstrümantal"] }, { ad: "Süre", degerler: ["1 dk", "2 dk", "3 dk"] }],
    ornekler: [
      { kisa: "Anadolu elektronik", metin: "Anadolu ezgileriyle elektronik bir sahne müziği, 120 BPM", gorsel: `${G}/muzik/ms-anadolu.webp` },
      { kisa: "Gece lo-fi", metin: "Yağmurlu bir gece için yavaş lo-fi, piyano ve vinil cızırtısı", gorsel: `${G}/muzik/ms-rain.webp` },
      { kisa: "Yaz pop şarkısı", metin: "Yaz akşamı için neşeli pop şarkı, kadın vokal, Türkçe sözler", gorsel: `${G}/muzik/ms-summer.webp` },
      { kisa: "Synthwave", metin: "Neon şehir için synthwave, güçlü bas ve 80'ler davulu", gorsel: `${G}/muzik/ms-neon.webp` },
    ],
  },
  {
    id: "ses", isim: "seslendirme", ad: "Ses", ikon: AudioLines, studyo: "/panel/ses", donusum: "sese", referans: false,
    tercih: [/^eleven v4$/i, /^eleven v3$/i],
    secenekler: [{ ad: "Ses", degerler: ["Deniz", "Elif", "Kaan"] }, { ad: "Dil", degerler: ["Türkçe", "İngilizce"] }],
    ornekler: [
      { kisa: "Ürün tanıtımı", metin: "Merhaba, ben Deniz. Bugün sana yeni ürünümüzü tanıtmak istiyorum.", gorsel: `${G}/galeri/portre4.webp` },
      { kisa: "Masal anlatımı", metin: "Bir zamanlar, bozkırın ortasında unutulmuş bir yemin vardı…", gorsel: `${G}/galeri/sinematik2.webp` },
      { kisa: "Kampanya duyurusu", metin: "Kampanyamız bu hafta sonu bitiyor, sepetini şimdi tamamla.", gorsel: `${G}/galeri/urun1.webp` },
    ],
  },
  {
    id: "3d", isim: "3D model", ad: "3D", ikon: Box, studyo: "/panel/3d", donusum: "3D modele", referans: true,
    tercih: [/meshy/i],
    secenekler: [{ ad: "Doku", degerler: ["Dokulu", "Dokusuz"] }, { ad: "Detay", degerler: ["Orta", "Yüksek"] }],
    ornekler: [
      { kisa: "Oyuncak robot", metin: "Pastel renklerde sevimli robot, oyuncak tarzı, temiz kaplama", gorsel: `${G}/galeri/3d1.webp` },
      { kisa: "Yüzen ada", metin: "Bulutların üstünde yüzen küçük ada, ağaçlar ve şelale", gorsel: `${G}/galeri/3d4.webp` },
      { kisa: "Masal kulübesi", metin: "Şeker renklerinde masalsı kulübe, yumuşak kil dokusu", gorsel: `${G}/galeri/3d5.webp` },
    ],
  },
];

/** Bir türün kutuda gösterilecek modelleri: tercih sırası önce, sonra öne çıkanlar. */
export function turModelleri(t: TurTanim, adet = 7): KatalogModel[] {
  // Yalnız şu an kullanılabilen modeller: "Yakında" ve "Kapandı" olanlar listelenmez.
  const hepsi = KATALOG.filter((m) => m.tur === t.id && m.rozet !== "Yakında" && m.rozet !== "Kapandı");
  const sirali: KatalogModel[] = [];
  for (const r of t.tercih) { const m = hepsi.find((x) => r.test(x.ad) && !sirali.includes(x)); if (m) sirali.push(m); }
  for (const m of hepsi.filter((x) => x.oneCikan)) if (!sirali.includes(m)) sirali.push(m);
  for (const m of hepsi) if (!sirali.includes(m)) sirali.push(m);
  return sirali.slice(0, adet);
}

/* ── Paylaşılan durum: hero kutusu ve yüzen çubuk aynı durumu kullanır ── */
export function useKomut() {
  const [turId, setTurId] = useState<KatalogTur>("video");
  const tur = TURLER.find((t) => t.id === turId)!;
  const modeller = useMemo(() => turModelleri(tur), [tur]);
  const [modelAd, setModelAd] = useState<Record<string, string>>({});
  const model = modeller.find((m) => m.ad === modelAd[turId]) ?? modeller[0];
  const [secim, setSecim] = useState<Record<string, number[]>>({});
  const ayar = secim[turId] ?? tur.secenekler.map(() => 0);
  const [metin, setMetin] = useState("");
  const [referans, setReferans] = useState<string | null>(null);
  const [dokundu, setDokundu] = useState(false);
  const [bekle, setBekle] = useState(false);

  const carpan = tur.secenekler.reduce((c, s, i) => c * (s.carpan?.[ayar[i]] ?? 1), 1);
  const kredi = model ? Math.max(1, Math.round(model.kredi * carpan)) : 0;

  return {
    tur, turId, modeller, model, ayar, metin, referans, kredi, dokundu, bekle,
    /** İmleç kutunun üstündeyken tanıtım döngüsü durur. */
    beklet: setBekle,
    /** Kullanıcı dokunmadan önceki tanıtım döngüsü: türü değiştirir ama "dokundu" saymaz. */
    otoTur: (id: KatalogTur) => setTurId(id),
    dokun: () => setDokundu(true),
    setTur: (id: KatalogTur) => { setTurId(id); setDokundu(true); if (!TURLER.find((t) => t.id === id)!.referans) setReferans(null); },
    setModel: (ad: string) => { setModelAd((s) => ({ ...s, [turId]: ad })); setDokundu(true); },
    setAyar: (i: number, v: number) => { setSecim((s) => ({ ...s, [turId]: ayar.map((x, j) => (j === i ? v : x)) })); setDokundu(true); },
    setMetin: (m: string) => { setMetin(m); if (m) setDokundu(true); },
    setReferans,
  };
}
export type KomutDurum = ReturnType<typeof useKomut>;

/**
 * Boş kutuda örnekleri yazıp silen yer tutucu. React durumu kullanmaz: her harfte bütün kutuyu
 * yeniden çizmek yerine yalnız textarea'nın placeholder özniteliği güncellenir; kutu ekranda değilse durur.
 */
function useDaktilo(alan: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>, ornekler: string[], aktif: boolean) {
  useEffect(() => {
    const el = alan.current;
    if (!el || !aktif) return;
    let i = 0, n = 0, sil = false, t: ReturnType<typeof setTimeout> | undefined, gorunur = true;
    const adim = () => {
      if (!gorunur) return;
      const h = ornekler[i % ornekler.length];
      if (!sil) { n++; el.placeholder = h.slice(0, n); if (n >= h.length) { sil = true; t = setTimeout(adim, 2400); return; } t = setTimeout(adim, 34); }
      else { n = Math.max(0, n - 4); el.placeholder = h.slice(0, n); if (!n) { sil = false; i++; t = setTimeout(adim, 350); return; } t = setTimeout(adim, 16); }
    };
    const io = new IntersectionObserver(([e]) => { const once = gorunur; gorunur = e.isIntersecting; if (gorunur && !once) { clearTimeout(t); t = setTimeout(adim, 200); } });
    io.observe(el);
    t = setTimeout(adim, 500);
    return () => { clearTimeout(t); io.disconnect(); };
  }, [alan, ornekler, aktif]);
}

function useDisTik(acik: boolean, kapat: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!acik) return;
    const f = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) kapat(); };
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") kapat(); };
    document.addEventListener("mousedown", f); document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", f); document.removeEventListener("keydown", k); };
  }, [acik, kapat]);
  return ref;
}

const yay = { type: "spring" as const, stiffness: 520, damping: 38 };

/** Üret: seçili modelin stüdyosuna istemle gider (stüdyo girişi kendisi ister). */
function useUret(k: KomutDurum) {
  const router = useRouter();
  return () => {
    const href = k.model?.href ?? k.tur.studyo;
    const m = k.metin.trim();
    router.push(m ? `${href}${href.includes("?") ? "&" : "?"}prompt=${encodeURIComponent(m)}` : href);
  };
}

/* ── Açılır menü kabuğu ── */
function Acilir({ acik, children, className, yukari }: { acik: boolean; children: React.ReactNode; className?: string; yukari?: boolean }) {
  return (
    <AnimatePresence>
      {acik && (
        <motion.div
          initial={{ opacity: 0, y: yukari ? 6 : -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: yukari ? 4 : -4, scale: 0.98 }}
          transition={{ duration: 0.16 }}
          className={cn("bd-panel absolute z-40 rounded-[18px] p-1.5", yukari ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]", className)}>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Açılır menünün yönü: altta yer yoksa yukarı açılır. */
function useYon(yukari?: boolean) {
  const [y, setY] = useState(!!yukari);
  return [y, (el: HTMLElement | null, yukseklik: number) => setY(yukari ?? (!!el && innerHeight - el.getBoundingClientRect().bottom < yukseklik + 16))] as const;
}

function ModelSecici({ k, yukari }: { k: KomutDurum; yukari?: boolean }) {
  const [acik, setAcik] = useState(false);
  const [yon, yonBul] = useYon(yukari);
  const ref = useDisTik(acik, () => setAcik(false));
  if (!k.model) return null;
  return (
    <div ref={ref} className="relative">
      <button onClick={(e) => { yonBul(e.currentTarget, 60 + k.modeller.length * 54); setAcik((a) => !a); }} aria-expanded={acik}
        className="flex h-9 items-center gap-2 rounded-full pl-2 pr-2.5 text-[13.5px] font-medium text-white/90 transition-colors hover:bg-white/[0.08] active:scale-[0.97]">
        <ModelLogo ad={k.model.ad} boyut={18} />
        <span className="max-w-[92px] truncate sm:max-w-[140px]">{k.model.ad}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-white/50 transition-transform", acik && "rotate-180")} />
      </button>
      <Acilir acik={acik} yukari={yon} className="left-0 w-[300px]">
        <p className="px-2.5 pb-1.5 pt-1 text-[12px] text-white/45">{k.tur.ad} modelleri</p>
        {k.modeller.map((m) => {
          const s = m.ad === k.model?.ad;
          return (
            <button key={m.slug} onClick={() => { k.setModel(m.ad); setAcik(false); }}
              className={cn("flex w-full items-center gap-3 rounded-[12px] px-2.5 py-2 text-left transition-colors", s ? "bg-white/[0.08]" : "hover:bg-white/[0.05]")}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-white/[0.06]"><ModelLogo ad={m.ad} boyut={18} /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-medium text-white">{m.ad}</span>
                <span className="block truncate text-[12px] text-white/50">{m.saglayici} · {m.bedel}</span>
              </span>
              {s && <Check className="h-4 w-4 shrink-0 text-[#55d6fd]" />}
            </button>
          );
        })}
      </Acilir>
    </div>
  );
}

function AyarSecici({ k, yukari }: { k: KomutDurum; yukari?: boolean }) {
  const [acik, setAcik] = useState(false);
  const [yon, yonBul] = useYon(yukari);
  const ref = useDisTik(acik, () => setAcik(false));
  const ozet = k.tur.secenekler.map((s, i) => s.degerler[k.ayar[i]]).join(" · ");
  return (
    <div ref={ref} className="relative">
      <button onClick={(e) => { yonBul(e.currentTarget, 170); setAcik((a) => !a); }} aria-expanded={acik}
        className="flex h-9 items-center gap-1.5 rounded-full px-2.5 text-[13.5px] font-medium text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white active:scale-[0.97]">
        <SlidersHorizontal className="h-3.5 w-3.5 text-white/55" />{ozet}
      </button>
      <Acilir acik={acik} yukari={yon} className="left-0 w-[264px] p-3">
        {k.tur.secenekler.map((s, i) => (
          <div key={s.ad} className={cn(i > 0 && "mt-3")}>
            <p className="mb-1.5 text-[12px] text-white/50">{s.ad}</p>
            <div className="flex rounded-[12px] bg-white/[0.05] p-0.5">
              {s.degerler.map((d, j) => (
                <button key={d} onClick={() => k.setAyar(i, j)} className="relative flex-1 rounded-[10px] py-1.5 text-[12.5px] font-medium">
                  {k.ayar[i] === j && <motion.span layoutId={`ayar-${s.ad}`} transition={yay} className="absolute inset-0 rounded-[10px] bg-white/[0.12]" />}
                  <span className={cn("relative", k.ayar[i] === j ? "text-white" : "text-white/55")}>{d}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </Acilir>
    </div>
  );
}

/** Tür seçici: kayan zeminli bölümlü kontrol. */
export function TurSecici({ k, id = "tur", kucuk }: { k: KomutDurum; id?: string; kucuk?: boolean }) {
  return (
    <div className="gizli-scroll flex shrink-0 items-center gap-0.5 overflow-x-auto rounded-full bg-black/30 p-[3px]" role="group" aria-label="Üretim türü">
      {TURLER.map((t) => {
        const s = t.id === k.turId;
        return (
          <button key={t.id} onClick={() => k.setTur(t.id)} aria-pressed={s} title={t.ad}
            className={cn("relative flex shrink-0 items-center gap-1.5 rounded-full text-[13px] font-medium transition-colors", kucuk ? "h-10 w-10 justify-center" : "h-8 px-2.5 sm:px-3.5", s ? "text-white" : "text-white/55 hover:text-white/85")}>
            {s && <motion.span layoutId={`${id}-zemin`} transition={yay} className="absolute inset-0 rounded-full bg-white/[0.15] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]" />}
            <t.ikon className="relative h-[15px] w-[15px]" strokeWidth={2} />
            {!kucuk && <span className={cn("relative", !s && "sr-only sm:not-sr-only")}>{t.ad}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Gönder: Apple Mesajlar gibi yuvarlak ok; istem yazılınca camgöbeğine döner. Bedeli yanında yazar. */
function UretDugme({ k, onClick, kucuk }: { k: KomutDurum; onClick: () => void; kucuk?: boolean }) {
  const dolu = k.metin.trim().length > 0;
  return (
    <div className="flex shrink-0 items-center gap-2.5">
      <span className={cn("items-center gap-1 text-[13px] tabular-nums text-white/50", kucuk ? "hidden sm:flex" : "hidden min-[400px]:flex")}>
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="#55d6fd" aria-hidden><path d="M12 2c.6 4.6 2.6 7.6 7.4 8.6.5.1.5.7 0 .8C14.6 12.4 12.6 15.4 12 20c-.6-4.6-2.6-7.6-7.4-8.6-.5-.1-.5-.7 0-.8C9.4 9.6 11.4 6.6 12 2Z" /></svg>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={k.kredi} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} transition={{ duration: 0.18 }}>{k.kredi}</motion.span>
        </AnimatePresence>
        kredi
      </span>
      <button onClick={onClick} aria-label={`Üret, ${k.kredi} kredi`} title="Üret"
        className={cn("flex items-center justify-center rounded-full transition-[background-color,color,transform] duration-300 active:scale-[0.9]", kucuk ? "h-[46px] w-[46px]" : "h-10 w-10",
          dolu ? "bg-[#55d6fd] text-[#06141a] hover:brightness-110" : "bg-white/[0.14] text-white hover:bg-white/[0.2]")}>
        <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </div>
  );
}

/**
 * Komut kutusu — ana sayfanın kalbi. Kling/Hailuo düzeni:
 * istem alanı; altta referans, tür, model, ayar, zar ve kredili Üret.
 */
export function Komut({ k, className, alanRef }: { k: KomutDurum; className?: string; alanRef?: React.RefObject<HTMLTextAreaElement | null> }) {
  const [odak, setOdak] = useState(false);
  const [surukle, setSurukle] = useState(false);
  const icRef = useRef<HTMLTextAreaElement>(null);
  const ref = alanRef ?? icRef;
  const dosyaRef = useRef<HTMLInputElement>(null);
  const ornekler = useMemo(() => k.tur.ornekler.map((o) => o.metin), [k.tur]);
  useDaktilo(ref, ornekler, !odak && !k.metin);
  const uret = useUret(k);
  const [zarDon, setZarDon] = useState(0);

  const zar = () => {
    const l = k.tur.ornekler.filter((o) => o.metin !== k.metin);
    k.setMetin(l[Math.floor(Math.random() * l.length)].metin);
    setZarDon((d) => d + 1);
    ref.current?.focus({ preventScroll: true });
  };
  /** Sürüklenen ya da yapıştırılan görsel referans olur; referans almayan türde Görsel'e geçer. */
  const gorselAl = (f?: File | null) => {
    if (!f || !f.type.startsWith("image/")) return false;
    if (!k.tur.referans) k.setTur("gorsel"); else k.dokun();
    k.setReferans(URL.createObjectURL(f));
    return true;
  };

  return (
    <div
      onMouseEnter={() => k.beklet(true)} onMouseLeave={() => k.beklet(false)}
      onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setSurukle(true); } }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setSurukle(false); }}
      onDrop={(e) => { e.preventDefault(); setSurukle(false); gorselAl(e.dataTransfer.files[0]); }}
      className={cn("cam-istemci relative z-20 rounded-[30px] p-2.5", surukle && "ring-1 ring-[#55d6fd]/70", className)}>
      <AnimatePresence>
        {surukle && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-[30px] bg-[#0b1a20]/90 text-[15px] font-medium text-[#9ff0ff]">
            <Plus className="mr-2 h-4 w-4" />Görseli referans olarak bırak
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center justify-between gap-2 px-1 pt-0.5">
        <TurSecici k={k} />
      </div>
      <div className="flex items-start gap-2.5 px-2 pt-3">
        <AnimatePresence initial={false}>
          {k.referans && (
            <motion.div initial={{ width: 0, opacity: 0, scale: 0.8 }} animate={{ width: 56, opacity: 1, scale: 1 }} exit={{ width: 0, opacity: 0, scale: 0.8 }} className="relative mt-1 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={k.referans} alt="Referans" className="h-14 w-14 rounded-[14px] object-cover ring-1 ring-white/15" />
              <button onClick={() => k.setReferans(null)} aria-label="Referansı kaldır"
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-110"><X className="h-3 w-3" strokeWidth={3} /></button>
            </motion.div>
          )}
        </AnimatePresence>
        <textarea
          ref={ref}
          value={k.metin}
          onChange={(e) => k.setMetin(e.target.value)}
          onFocus={() => { setOdak(true); k.dokun(); }} onBlur={() => setOdak(false)}
          onPaste={(e) => { const f = [...e.clipboardData.files].find((x) => x.type.startsWith("image/")); if (gorselAl(f)) e.preventDefault(); }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); uret(); } }}
          placeholder={odak ? `${k.tur.ad} için ne istediğini anlat…` : undefined}
          rows={2}
          aria-label="Ne üretmek istiyorsun?"
          className="block min-h-[76px] w-full resize-none bg-transparent px-1.5 pt-1 text-[17px] leading-relaxed tracking-[-0.01em] text-white placeholder:text-white/38 focus:outline-none"
        />
      </div>
      <div className="mt-1 flex items-center gap-1.5 px-1 pb-0.5">
        <input ref={dosyaRef} type="file" accept="image/*" hidden onChange={(e) => { gorselAl(e.target.files?.[0]); e.target.value = ""; }} />
        <button onClick={() => dosyaRef.current?.click()} disabled={!k.tur.referans} aria-label="Referans görsel ekle" title={k.tur.referans ? "Referans görsel ekle, sürükle ya da yapıştır" : "Bu türde referans yok"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white/80 transition-colors hover:bg-white/[0.14] hover:text-white disabled:opacity-35">
          <Plus className="h-4 w-4" />
        </button>
        <ModelSecici k={k} />
        <div className="hidden min-[420px]:block"><AyarSecici k={k} /></div>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={zar} aria-label="Bana bir fikir ver" title="Bana bir fikir ver"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/[0.08] hover:text-white">
            <motion.span key={zarDon} initial={{ rotate: -200, scale: 0.6 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}><Dice5 className="h-[18px] w-[18px]" /></motion.span>
          </button>
          <UretDugme k={k} onClick={uret} />
        </div>
      </div>
    </div>
  );
}

/** Örnek istem çipleri: küçük görsel + metin, tıklayınca kutuyu doldurur. */
export function OrnekCipleri({ k, className, ortala }: { k: KomutDurum; className?: string; ortala?: boolean }) {
  return (
    <div className={cn("gizli-scroll -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0", ortala && "sm:justify-center", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        {k.tur.ornekler.map((o, i) => (
          <motion.button key={o.metin} layout
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }} exit={{ opacity: 0, y: -6 }}
            onClick={() => k.setMetin(o.metin)}
            title={o.metin}
            className="flex h-9 shrink-0 items-center gap-2 rounded-full bg-[#1c1c1e]/[0.82] pl-1 pr-3.5 text-[13px] text-white/75 ring-1 ring-white/[0.1] transition-colors hover:bg-[#2c2c2e]/70 hover:text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={o.gorsel} alt="" className="h-7 w-7 rounded-full object-cover" />
            <span className="truncate">{o.kisa}</span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Yüzen komut çubuğu — hero kutusu ekrandan çıkınca altta belirir (Kling).
 * Apple Spotlight hissi: tam opak, ince kenarlı tek parça kapsül; odaklanınca genişler,
 * kenarı camgöbeğine döner. Boşken örnek istemler daktiloyla yazılır; "/" tuşu çubuğa odaklar.
 * Mobilde alt menünün üstünde durur.
 */
export function YuzenKomut({ k, hedef }: { k: KomutDurum; hedef: React.RefObject<HTMLElement | null> }) {
  const [gorunur, setGorunur] = useState(false);
  const [odak, setOdak] = useState(false);
  const alan = useRef<HTMLInputElement>(null);
  const uret = useUret(k);
  const ornekler = useMemo(() => k.tur.ornekler.map((o) => o.metin), [k.tur]);
  useDaktilo(alan, ornekler, gorunur && !odak && !k.metin);
  useEffect(() => {
    const el = hedef.current;
    if (!el) return;
    // Hero kutusu yukarıda kaldıysa görünür; altbilgiye gelince çekilir (bağlantıların üstüne binmesin).
    let ust = false, alt = false;
    const guncelle = () => setGorunur(ust && !alt);
    const io = new IntersectionObserver(([e]) => { ust = !e.isIntersecting && e.boundingClientRect.top < 0; guncelle(); }, { threshold: 0 });
    io.observe(el);
    const io2 = new IntersectionObserver((l) => { alt = l.some((e) => e.isIntersecting); guncelle(); }, { threshold: 0 });
    document.querySelectorAll("[data-altbilgi]").forEach((f) => io2.observe(f));
    return () => { io.disconnect(); io2.disconnect(); };
  }, [hedef]);
  // "/" kısayolu: yazı alanında değilken çubuğa odaklar.
  useEffect(() => {
    if (!gorunur) return;
    const f = (e: KeyboardEvent) => {
      const h = e.target as HTMLElement;
      if (e.key !== "/" || e.metaKey || e.ctrlKey || h.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(h.tagName)) return;
      e.preventDefault(); alan.current?.focus();
    };
    addEventListener("keydown", f); return () => removeEventListener("keydown", f);
  }, [gorunur]);
  // Odak giderken boş placeholder kalmasın.
  useEffect(() => { const el = alan.current; if (el && odak) el.placeholder = `${k.tur.ad} için ne istediğini anlat…`; }, [odak, k.tur]);

  // Çubuk body'ye taşınır: hero'nun yığın bağlamında kalırsa sonraki bölümler üstüne biniyor, içinden görünüyordu.
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  if (!hazir) return null;
  return createPortal(
    <AnimatePresence>
      {gorunur && (
        <motion.div
          initial={{ y: 48, opacity: 0, scale: 0.94 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 40, opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.8 }}
          className="kesfet-tema pointer-events-none fixed inset-x-0 bottom-[calc(84px+env(safe-area-inset-bottom))] z-40 flex !bg-transparent justify-center px-3 sm:bottom-6">
          {/* Tam opak yüzey: arkadaki video/kartlar içinden görünmez, bulanıklık hesabı yok. */}
          <div onMouseDown={(e) => { if (e.target === e.currentTarget) { e.preventDefault(); alan.current?.focus(); } }}
            className={cn("yuzen-kapsul pointer-events-auto relative flex h-[60px] w-full items-center gap-1 rounded-full p-[7px] pr-[7px] transition-[max-width,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              odak ? "max-w-[780px] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.09),0_0_0_1px_rgba(85,214,253,0.45),0_0_0_5px_rgba(85,214,253,0.08)]" : "max-w-[700px] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_1px_rgba(255,255,255,0.1)]")}>
            {/* Üst kenarda ince ışık: odakta parlar */}
            <span aria-hidden className={cn("pointer-events-none absolute inset-x-14 -top-px h-px bg-gradient-to-r from-transparent via-[#55d6fd] to-transparent transition-opacity duration-500", odak ? "opacity-90" : "opacity-40")} />
            <div className="hidden sm:block"><TurSecici k={k} id="yuzen" kucuk /></div>
            <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-white/[0.07] sm:hidden"><k.tur.ikon className="h-[18px] w-[18px] text-white" /></span>
            <input ref={alan} value={k.metin} onChange={(e) => k.setMetin(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") uret(); if (e.key === "Escape") alan.current?.blur(); }}
              onFocus={() => { setOdak(true); k.dokun(); }} onBlur={() => setOdak(false)}
              aria-label="Ne üretmek istiyorsun?"
              className="h-full min-w-0 flex-1 bg-transparent pl-3 pr-1 text-[15.5px] tracking-[-0.01em] text-white placeholder:text-white/40 focus:outline-none" />
            <AnimatePresence initial={false}>
              {!odak && !k.metin && (
                <motion.kbd initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.18 }}
                  aria-hidden className="mr-1 hidden h-6 min-w-6 items-center justify-center rounded-[7px] bg-white/[0.06] px-1.5 font-sans text-[12px] font-medium text-white/40 ring-1 ring-white/[0.08] lg:flex">/</motion.kbd>
              )}
            </AnimatePresence>
            {k.model && (
              <span title={k.model.ad} className="mr-1 hidden h-[34px] shrink-0 items-center gap-1.5 rounded-full bg-white/[0.05] pl-1.5 pr-3 text-[13px] font-medium text-white/70 ring-1 ring-white/[0.06] md:flex">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.07]"><ModelLogo ad={k.model.ad} boyut={14} /></span>
                <span className="max-w-[120px] truncate">{k.model.ad}</span>
              </span>
            )}
            <UretDugme k={k} onClick={uret} kucuk />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
