"use client";

/**
 * VideoComposer — Higgsfield video üretim paneli, SIFIRDAN ve BİREBİR.
 *
 * Referans: ~/Desktop/referanslar/modeller/video/* + video-model-secici/*
 *
 * Mimari: tek bir motor, `videoModelSpec.ts`'teki 46 model spec'ini render eder.
 * Model değişince çipler/kutular/prompt durumu TAMAMEN değişir — sabit JSX yok.
 *
 * Yapı (referans birebir, soldan sağa):
 *   [Görsel/Video dikey anahtarı]  [ composer: prompt satırı + çip satırı ]  [yükleme kutuları]  [ÜRET]
 *
 * Dinamik kurallar:
 *   - Mode=Ingredients/Elements → kare kutuları kaybolur
 *   - Çok çekim=Özel → composer ÜSTÜNDE çekim şeridi açılır, süre çipi kaybolur
 *   - Motion Control → prompt kilitli, MOTION+CHARACTER kutuları
 *   - Grok → composer üstünde amber uyarı bandı
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { seciciKonumHesapla, seciciStil, type SeciciKonum } from "@/lib/seciciKonum";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, AtSign, Clock, Gem, Sparkles, Volume2, VolumeX, Minus,
  ChevronDown, SlidersHorizontal, Lock, Image as ImageIcon, Video as VideoIcon,
  RectangleHorizontal, RectangleVertical, Square, Scan, Layers, X,
  AlertCircle, Zap, Grid3x3, User, Clapperboard, Check, Aperture, Palette, Info, Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type VideoModelSpec, type CipTuru, type KutuTuru,
  modelBul, gorunenKutular, sureGorunur, cipVar, ORAN_SINEMATIK,
} from "@/lib/videoModelSpec";
import { MarkaIkon } from "./MarkaIkon";
import {
  ElementListesi, DuyguCarki, MentionHapi, ReferansMenu, KadroTokeni,
  type MentionElement, type Duygu,
} from "./ElementMention";
import {
  HareketKarakterModal, KadroModal, KameraModal, YuklemeModal,
  VarlikSeciciModal, RenkAktarimModal, HEX_PALETLER, type KameraKurulum,
} from "./StudyoModallari";
import { kadroTokenlari, alanSecenekleri } from "@/lib/kadroVeri";

/* ------------------------------------------------------------------ */
/* Çekim (shot) tipi — Multi-shot Özel modunda                         */
/* ------------------------------------------------------------------ */
export type Cekim = { id: string; sure: number; istem: string };

/* ------------------------------------------------------------------ */
/* Oran ikonu — referanstaki gibi orana göre şekil değişir             */
/* ------------------------------------------------------------------ */
function OranIkon({ oran, className }: { oran: string; className?: string }) {
  if (oran === "Auto") return <Scan className={className} />;
  const [a, b] = oran.split(":").map(Number);
  if (!a || !b || a === b) return <Square className={className} />;
  return a > b ? <RectangleHorizontal className={className} /> : <RectangleVertical className={className} />;
}

/* ------------------------------------------------------------------ */
/* Popover — çipin ÜSTÜNE açılır, portal ile (kırpılma yok)            */
/* ------------------------------------------------------------------ */
function CipPopover({
  acik, kapat, cipRef, baslik, children, genislik = 240,
}: {
  acik: boolean; kapat: () => void; cipRef: React.RefObject<HTMLElement | null>;
  baslik: string; children: React.ReactNode; genislik?: number;
}) {
  const [konum, setKonum] = useState<SeciciKonum | null>(null);
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  useEffect(() => {
    if (!acik) return;
    /* Ortak hesap: yukarı sığmazsa AŞAĞI açar, yatayda ekran içine
       sıkıştırır, max yükseklik verir (2026-08-02). */
    const k = seciciKonumHesapla(cipRef.current, genislik);
    if (k) setKonum(k);
  }, [acik, cipRef, genislik]);

  if (!hazir) return null;
  return createPortal(
    <AnimatePresence>
      {acik && konum && (
        <>
          <div className="fixed inset-0 z-[130]" onClick={kapat} />
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            style={{ ...seciciStil(konum), width: genislik }}
            /* body'ye portallandığı için `.sinema-kapsam` dışında kalır — lime
               tokenleri tanımsız olmasın diye kapsamı burada yeniden veriyoruz. */
            className="sinema-kapsam hf-pop z-[131] overflow-hidden rounded-2xl">
            <p className="px-4 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-wider text-metin-3">{baslik}</p>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ------------------------------------------------------------------ */
/* Çip kabuğu                                                          */
/* ------------------------------------------------------------------ */
const Cip = ({ children, onClick, aktif, className, innerRef, ...p }: {
  children: React.ReactNode; onClick?: () => void; aktif?: boolean; className?: string;
  innerRef?: React.Ref<HTMLButtonElement>; "aria-label"?: string;
}) => (
  <button ref={innerRef} onClick={onClick} {...p}
    className={cn("hf-cip flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-[14px] text-metin transition-colors",
      aktif && "hf-cip-aktif", className)}>
    {children}
  </button>
);

/* ------------------------------------------------------------------ */
/* Yükleme kutusu — START/END FRAME, VIDEO REFERENCE, MOTION, CHARACTER */
/* ------------------------------------------------------------------ */
const KUTU_ETIKET: Record<KutuTuru, { ad: string; ikon: React.ElementType }> = {
  baslangic: { ad: "BAŞLANGIÇ KARESİ", ikon: Plus },
  bitis: { ad: "SON KARE", ikon: Plus },
  videoRef: { ad: "VİDEO REFERANSI", ikon: Plus },
  hareket: { ad: "HAREKET", ikon: Grid3x3 },
  karakter: { ad: "KARAKTER", ikon: User },
  preset: { ad: "GENEL", ikon: Plus },
  /* Görsel modu kutuları */
  kadroKur: { ad: "Kadronu Kur", ikon: User },
  kameraKurulum: { ad: "Kamera", ikon: Aperture },
  gKarakter: { ad: "KARAKTER", ikon: Plus },
  gStil: { ad: "STİL", ikon: Plus },
};

function YuklemeKutusu({
  tur, opsiyonel, deger, onSec, onTemizle, presetAd, presetArka,
}: {
  tur: KutuTuru; opsiyonel?: boolean; deger: string | null;
  onSec: () => void; onTemizle: () => void; presetAd?: string; presetArka?: string;
}) {
  const { ad, ikon: Ik } = KUTU_ETIKET[tur];
  // Preset kutusu DOLU görünür (Higgsfield "GENERAL" küçük resmi).
  if (tur === "preset") {
    return (
      <button onClick={onSec}
        className="hf-kutu group relative h-[88px] w-[104px] shrink-0 overflow-hidden rounded-2xl text-left"
        style={{ background: presetArka ?? "linear-gradient(135deg,#3a3f45,#1b1d20)" }}
        aria-label="Ön ayar seç">
        <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <span className="absolute inset-x-2 bottom-2 truncate text-[13px] font-bold text-white drop-shadow">
          {presetAd ?? "GENEL"}
        </span>
      </button>
    );
  }
  return (
    <button onClick={deger ? onTemizle : onSec}
      className="hf-kutu group relative flex h-[88px] w-[92px] shrink-0 flex-col justify-between overflow-hidden rounded-2xl p-2.5 text-left"
      style={deger ? { background: `url("${deger}") center/cover` } : undefined}
      aria-label={ad}>
      {deger && <span className="absolute inset-0 bg-black/45" />}
      {/* Üst satır: + / × ikonu (+ varsa "Opsiyonel" etiketi) */}
      <span className="relative flex items-center gap-1.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/12 text-white/90">
          {deger ? <X className="h-3.5 w-3.5" /> : <Ik className="h-3.5 w-3.5" />}
        </span>
        {opsiyonel && !deger && <span className="text-[11px] text-metin-3">Opsiyonel</span>}
      </span>
      {/* Alt satır: etiket — HER KUTUDA aynı hizada (iki satırlık yer ayrılır,
          böylece "BAŞLANGIÇ KARESİ" 2 satır olsa da "SON KARE" ile aynı
          taban çizgisinde durur). */}
      <span className="relative flex min-h-[30px] items-end text-[12px] font-bold leading-tight text-metin">{ad}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Çekim şeridi — Multi-shot "Özel" iken composer ÜSTÜNDE              */
/* ------------------------------------------------------------------ */
/** Çekim süresi sınırları — kenardan sürükleyerek ayarlanır. */
const CEKIM_MIN = 1, CEKIM_MAX = 9;
/** 1sn başına piksel — kartın genişliği süreyi görsel olarak temsil eder. */
const SN_PX = 26;

function CekimSeridi({
  cekimler, secili, onSec, onEkle, onSil, onSure, onSirala,
}: {
  cekimler: Cekim[]; secili: string | null;
  onSec: (id: string) => void; onEkle: () => void; onSil: (id: string) => void;
  onSure: (id: string, sure: number) => void;
  onSirala: (yeni: Cekim[]) => void;
}) {
  // Sürükle-bırak sıralama durumu
  const [surukID, setSurukID] = useState<string | null>(null);
  // Kenardan süre ayarı sürerken kart genişliğini anlık göstermek için
  const [gecici, setGecici] = useState<{ id: string; sure: number } | null>(null);

  /** Kartın SOL/SAĞ kenarından çekerek süreyi ayarla (1–9sn). */
  const kenarSurukle = (e: React.PointerEvent, c: Cekim, yon: "sol" | "sag") => {
    e.preventDefault(); e.stopPropagation();
    const baslaX = e.clientX;
    const baslaSure = c.sure;
    const tasi = (ev: PointerEvent) => {
      const fark = (ev.clientX - baslaX) / SN_PX;
      // Sol kenardan sağa çekmek süreyi KISALTIR, sağ kenardan sağa çekmek UZATIR.
      const ham = yon === "sag" ? baslaSure + fark : baslaSure - fark;
      setGecici({ id: c.id, sure: Math.max(CEKIM_MIN, Math.min(CEKIM_MAX, Math.round(ham))) });
    };
    const birak = () => {
      window.removeEventListener("pointermove", tasi);
      window.removeEventListener("pointerup", birak);
      setGecici((g) => { if (g) onSure(g.id, g.sure); return null; });
    };
    window.addEventListener("pointermove", tasi);
    window.addEventListener("pointerup", birak);
  };

  /** Sürüklenen kartı hedefin yerine taşı (sıralama). */
  const birak = (hedefId: string) => {
    if (!surukID || surukID === hedefId) { setSurukID(null); return; }
    const a = cekimler.findIndex((x) => x.id === surukID);
    const b = cekimler.findIndex((x) => x.id === hedefId);
    if (a < 0 || b < 0) { setSurukID(null); return; }
    const yeni = [...cekimler];
    const [tasinan] = yeni.splice(a, 1);
    yeni.splice(b, 0, tasinan);
    onSirala(yeni);
    setSurukID(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="mb-2.5 flex items-end gap-2">
      {cekimler.map((c, i) => {
        const aktif = secili === c.id;
        const sure = gecici?.id === c.id ? gecici.sure : c.sure;
        // Genişlik süreye göre: seçilide taban 150px + süre payı, kapalıda dar.
        const genislik = aktif ? 150 + sure * SN_PX : 74;
        return (
          <motion.div key={c.id} layout
            draggable
            onDragStart={() => setSurukID(c.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => birak(c.id)}
            onDragEnd={() => setSurukID(null)}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            onClick={() => onSec(c.id)}
            animate={{ width: genislik, opacity: surukID === c.id ? 0.4 : 1 }}
            /* NOT: kartlar galerinin ÜSTÜNDE yüzdüğü için opak zemin şart —
               yarı saydam bırakılınca arkadaki videolar okunmayı bozuyordu. */
            style={{ background: aktif ? "rgba(38,44,26,0.94)" : "rgba(28,30,32,0.92)" }}
            className={cn("group/ck relative h-[86px] cursor-grab overflow-hidden rounded-2xl border-2 px-3 py-2.5 backdrop-blur-xl transition-colors active:cursor-grabbing",
              aktif ? "border-aksan" : "border-white/12 hover:border-white/25")}>
            {aktif ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[15px] font-bold text-aksan">Çekim {i + 1}</span>
                  <span className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-metin">
                    {sure}sn
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 pr-1 text-[12px] leading-snug text-metin-3">{c.istem || "…"}</p>
                <button onClick={(e) => { e.stopPropagation(); onSil(c.id); }}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover/ck:opacity-100"
                  aria-label="Çekimi sil"><X className="h-3 w-3" /></button>
                {/* Süre tutamakları — SOL ve SAĞ kenar, çekince süre değişir */}
                {(["sol", "sag"] as const).map((yon) => (
                  <span key={yon} onPointerDown={(e) => kenarSurukle(e, c, yon)}
                    title="Süreyi ayarla"
                    className={cn("absolute inset-y-0 flex w-3 cursor-ew-resize items-center justify-center opacity-0 transition-opacity group-hover/ck:opacity-100",
                      yon === "sol" ? "left-0" : "right-0")}>
                    <span className="h-8 w-[3px] rounded-full bg-aksan/70" />
                  </span>
                ))}
              </>
            ) : (
              /* Kapalı kart — referanstaki gibi iki dikey çubuk + nokta */
              <span className="flex h-full items-center justify-center gap-1.5 text-white/25">
                <span className="h-6 w-[3px] rounded-full bg-current" />
                <span className="flex flex-col items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-aksan/70" />
                  <span className="h-1 w-1 rounded-full bg-current" />
                </span>
                <span className="h-6 w-[3px] rounded-full bg-current" />
              </span>
            )}
          </motion.div>
        );
      })}
      <button onClick={onEkle}
        style={{ background: "rgba(28,30,32,0.92)" }}
        className="hf-kutu flex h-[86px] w-[74px] shrink-0 items-center justify-center rounded-2xl text-metin-2 backdrop-blur-xl transition-colors hover:text-metin"
        aria-label="Çekim ekle"><Plus className="h-5 w-5" /></button>
    </motion.div>
  );
}

/* ================================================================== */
/* Ana bileşen                                                         */
/* ================================================================== */

export type VideoComposerDeger = {
  istem: string; model: string; oran: string; coz: string; sure: number;
  cokCekim: string; mod: string; iyilestir: boolean; ses: boolean;
  adet: number; bitrate: string; sabitLens: boolean; otoAyar: boolean;
  sahneKontrol: string; adim: number; tohum: string;
  baslangic: string | null; bitis: string | null; videoRef: string | null;
  hareket: string | null; karakter: string | null;
  cekimler: Cekim[];
  /** Sinema: tür çipi (2.5) ve çekim kontrolü (2.5/3.0). */
  tur: string; cekimKontrol: string;
  /** Prompt'a @ ile eklenmiş elementler (her biri kendi duygusuyla). */
  mentionlar: { ad: string; gorselUrl?: string; duygu: Duygu }[];
  /* ── Görsel modu alanları ── */
  kalite: string; izgara: string; sinirsiz: boolean; vektor: boolean;
  renkAktarim: boolean; gorselKip: string; cfg: number;
  /** Ruh 2.0 — KARAKTER ve STİL kutularının içerikleri. */
  gKarakter: string | null; gStil: string | null;
};

export function VideoComposer({
  modelAd, deger, onDeger, onModelAc, onPresetAc, onUret, uretiliyor, presetAd, presetArka, mod: kip, onKip, modelCipRef, onTurAc, onMentionAc, elementler = [],
}: {
  modelAd: string;
  deger: VideoComposerDeger;
  onDeger: (y: Partial<VideoComposerDeger>) => void;
  onModelAc: () => void;
  onPresetAc: () => void;
  onUret: () => void;
  uretiliyor?: boolean;
  presetAd?: string;
  presetArka?: string;
  mod?: "gorsel" | "video";
  onKip?: (m: "gorsel" | "video") => void;
  /** Model seçicinin konumlanacağı çip — sayfa seviyesinden verilir. */
  modelCipRef?: React.Ref<HTMLButtonElement>;
  /** Sinema 2.5 tür çipi → tür seçici modalını açar. */
  onTurAc?: () => void;
  /** `@` çipi → element/karakter seçiciyi açar (dış modal; artık iç liste var). */
  onMentionAc?: () => void;
  /** Prompt'ta @ ile eklenebilecek elementler. */
  elementler?: MentionElement[];
}) {
  const spec = modelBul(modelAd);
  const [acik, setAcik] = useState<CipTuru | null>(null);
  const kapat = () => setAcik(null);
  const ref = {
    oran: useRef<HTMLButtonElement>(null), cozunurluk: useRef<HTMLButtonElement>(null),
    sure: useRef<HTMLButtonElement>(null), cokCekim: useRef<HTMLButtonElement>(null),
    mod: useRef<HTMLButtonElement>(null), bitrate: useRef<HTMLButtonElement>(null),
    gelismis: useRef<HTMLButtonElement>(null), sahneKontrol: useRef<HTMLButtonElement>(null),
    cekimKontrol: useRef<HTMLButtonElement>(null),
    kalite: useRef<HTMLButtonElement>(null), izgara: useRef<HTMLButtonElement>(null),
    cfgAdim: useRef<HTMLButtonElement>(null), gorselKip: useRef<HTMLButtonElement>(null),
  };
  const dosyaRef = useRef<HTMLInputElement>(null);
  const [hedefKutu, setHedefKutu] = useState<KutuTuru | null>(null);

  /* ── @element sistemi (Higgsfield birebir) ───────────────────────── */
  const promptRef = useRef<HTMLTextAreaElement>(null);

  /* Prompt kutusu elle-yükseklik — tutamak kutunun TEPESİNDE.
     null = otomatik büyüme (görsel stüdyosuyla birebir aynı mantık). */
  const [promptYuk, setPromptYuk] = useState<number | null>(null);
  const promptSurukle = (e: React.PointerEvent) => {
    e.preventDefault();
    const ta = promptRef.current;
    const baslaY = e.clientY;
    const baslaH = ta ? ta.getBoundingClientRect().height : (promptYuk ?? 48);
    const tasi = (ev: PointerEvent) =>
      setPromptYuk(Math.max(44, Math.min(340, baslaH + (baslaY - ev.clientY))));
    const birak = () => {
      window.removeEventListener("pointermove", tasi);
      window.removeEventListener("pointerup", birak);
    };
    window.addEventListener("pointermove", tasi);
    window.addEventListener("pointerup", birak);
  };
  const mentionCipRef = useRef<HTMLButtonElement>(null);
  const ekleCipRef = useRef<HTMLButtonElement>(null);
  const [mentionAcik, setMentionAcik] = useState(false);
  const [mentionKonum, setMentionKonum] = useState<SeciciKonum | null>(null);
  /** Prompt'ta yazılan `@…` parçasının başlangıç indeksi (yazarak tetiklendiyse). */
  const [mentionYaziBas, setMentionYaziBas] = useState<number | null>(null);
  const [duyguAcik, setDuyguAcik] = useState<string | null>(null);   // element adı
  const [duyguKonum, setDuyguKonum] = useState<SeciciKonum | null>(null);
  const [refMenuAcik, setRefMenuAcik] = useState(false);
  const [refMenuKonum, setRefMenuKonum] = useState<SeciciKonum | null>(null);

  /* ── Higgsfield modalları (referans: yeni/ kadro/ kamera/ ruh/ arti/ renk/) ── */
  const [hkModal, setHkModal] = useState(false);        // Hareket/Karakter
  const [kadroModal, setKadroModal] = useState(false);  // Kadronu Oluştur
  const [kameraModal, setKameraModal] = useState(false);// Kamera kurulumu
  const [varlikModal, setVarlikModal] = useState(false);// `+` varlık seçici
  const [renkModal, setRenkModal] = useState(false);    // Renk aktarımı
  /** Karakter/Stil (Ruh 2.0) yükleme akışı — hangi kutu açtıysa o. */
  const [yukleModal, setYukleModal] = useState<null | "gKarakter" | "gStil">(null);
  const [kadroSecim, setKadroSecim] = useState<Record<string, string>>({});
  const [kamera, setKamera] = useState<KameraKurulum>({
    kamera: "Temiz Dijital", lens: "Klinik Keskin", odak: 50, diyafram: "f/5.6 Dengeli",
  });
  const [renkPalet, setRenkPalet] = useState<string | null>(null);
  /** Kadro seçimlerinden üretilen composer token'ları (yalnız AI Kadro modelinde). */
  const kadroToken = useMemo(
    () => (modelAd === "AI Kadro" ? kadroTokenlari(kadroSecim) : []),
    [modelAd, kadroSecim]);

  /** Kutuya tıklanınca doğru modalı aç (referans birebir — medya seçici DEĞİL). */
  const kutuAc = (k: KutuTuru) => {
    switch (k) {
      case "hareket": case "karakter": setHkModal(true); break;
      case "kadroKur": setKadroModal(true); break;
      case "kameraKurulum": setKameraModal(true); break;
      case "gKarakter": setYukleModal("gKarakter"); break;
      case "gStil": setYukleModal("gStil"); break;
      case "preset": onPresetAc(); break;
      default: dosyaSec(k);
    }
  };

  /** Element listesini bir öğenin altında aç. */
  /** Element listesini bir öğenin ÜSTÜNDE aç (top = alt kenardan mesafe). */
  const mentionAc = (el: HTMLElement | null, yaziBas: number | null = null) => {
    const r = el?.getBoundingClientRect();
    setMentionKonum(seciciKonumHesapla(el, 320));
    setMentionYaziBas(yaziBas);
    setMentionAcik(true);
  };

  /** Prompt değişince: imlecin solunda `@kelime` varsa listeyi aç (Higgsfield birebir). */
  const promptDegisti = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    if (ozelCekim && seciliCekim) {
      onDeger({ cekimler: deger.cekimler.map((c) => c.id === seciliCekim ? { ...c, istem: v } : c) });
    } else onDeger({ istem: v });

    const imlec = e.target.selectionStart ?? v.length;
    const sol = v.slice(0, imlec);
    const m = /(^|\s)@(\w*)$/.exec(sol);
    if (m) mentionAc(e.target, imlec - m[2].length - 1);
    else if (mentionYaziBas !== null) { setMentionAcik(false); setMentionYaziBas(null); }
  };

  /** Elementi ekle: yazarak tetiklendiyse `@…` parçasını metinden sil. */
  const elementEkle = (el: MentionElement) => {
    if (deger.mentionlar.some((m) => m.ad === el.ad)) { setMentionAcik(false); return; }
    if (mentionYaziBas !== null) {
      const ta = promptRef.current;
      const v = ozelCekim && seciliCekim
        ? (deger.cekimler.find((c) => c.id === seciliCekim)?.istem ?? "")
        : deger.istem;
      const imlec = ta?.selectionStart ?? v.length;
      const yeni = v.slice(0, mentionYaziBas) + v.slice(imlec);
      if (ozelCekim && seciliCekim) {
        onDeger({ cekimler: deger.cekimler.map((c) => c.id === seciliCekim ? { ...c, istem: yeni } : c) });
      } else onDeger({ istem: yeni });
    }
    onDeger({ mentionlar: [...deger.mentionlar, { ad: el.ad, gorselUrl: el.gorselUrl, duygu: "Nötr" as Duygu }] });
    setMentionAcik(false); setMentionYaziBas(null);
  };

  const kutular = gorunenKutular(spec, deger.mod);
  const sureVar = sureGorunur(spec, deger.cokCekim);
  /** Çekim şeridi YALNIZCA model çok-çekim destekliyorsa ve "Özel" seçiliyse.
      spec kontrolü olmadan, çok-çekimsiz bir modele geçince şerit ekranda
      asılı kalıyordu (bug). */
  const cokCekimDestek = cipVar(spec, "cokCekim") && spec?.cokCekimTipi === "dropdown";
  const ozelCekim = cokCekimDestek && deger.cokCekim === "Özel";
  const [seciliCekim, setSeciliCekim] = useState<string | null>(null);

  // Model değişince: yeni model çok-çekim desteklemiyorsa şeridi ve seçimi temizle.
  useEffect(() => {
    if (!cokCekimDestek && deger.cekimler.length > 0) {
      onDeger({ cekimler: [] });
      setSeciliCekim(null);
    }
  }, [cokCekimDestek, deger.cekimler.length, onDeger]);

  // Çok çekim "Özel" seçilince ilk iki çekimi hazırla (referans: 2 kart + `+`).
  useEffect(() => {
    if (ozelCekim && deger.cekimler.length === 0) {
      const yeni: Cekim[] = [
        { id: "c1", sure: 3, istem: "" },
        { id: "c2", sure: 3, istem: "" },
      ];
      onDeger({ cekimler: yeni });
      setSeciliCekim("c1");
    }
  }, [ozelCekim, deger.cekimler.length, onDeger]);

  const dosyaSec = (k: KutuTuru) => { setHedefKutu(k); dosyaRef.current?.click(); };
  const dosyaGeldi = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f || !hedefKutu) return;
    const url = URL.createObjectURL(f);
    onDeger({ [hedefKutu]: url } as Partial<VideoComposerDeger>);
  };

  /* ── Çip render'ı — spec sırasına göre ── */
  const cipCiz = (c: CipTuru) => {
    switch (c) {
      /* `+` ve `@` — referansta TEK çip gövdesi içinde, aralarında ince dikey
         çizgi. İkisi ayrı tıklama alanı: + medya yükler, @ element ekler. */
      case "ekle":
        if (cipVar(spec, "mention")) {
          return (
            <div key="ekle" className="hf-cip flex h-10 shrink-0 items-center rounded-xl px-1">
              <button ref={ekleCipRef} onClick={(e) => {
                // Görsel modunda `+` → varlık seçici modalı (referans: arti/).
                // Video modunda → Referans/Başlangıç/Son kare menüsü.
                if (kip === "gorsel") { setVarlikModal(true); return; }
                const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setRefMenuKonum(seciciKonumHesapla(e.currentTarget as HTMLElement, 240));
                setRefMenuAcik(true);
              }} aria-label="Medya ekle"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-metin transition-colors hover:bg-white/10">
                <Plus className="h-4 w-4" />
              </button>
              <span className="h-5 w-px bg-white/15" />
              <button ref={mentionCipRef} onClick={(e) => mentionAc(e.currentTarget as HTMLElement)} aria-label="Element ekle"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-metin transition-colors hover:bg-white/10">
                <AtSign className="h-4 w-4" />
              </button>
            </div>
          );
        }
        return (
          <Cip key="ekle" innerRef={ekleCipRef} onClick={() => {
            if (kip === "gorsel") { setVarlikModal(true); return; }
            const r = ekleCipRef.current?.getBoundingClientRect();
            setRefMenuKonum(seciciKonumHesapla(ekleCipRef.current, 240)); setRefMenuAcik(true);
          }} aria-label="Medya ekle" className="px-2.5">
            <Plus className="h-4 w-4" />
          </Cip>
        );
      case "mention":
        return null; // `ekle` çipinin içinde birleşik render ediliyor (referans birebir)
      case "model":
        return (
          <Cip key="model" innerRef={modelCipRef} onClick={onModelAc} aria-label="Model seç">
            <MarkaIkon marka={spec?.marka ?? ""} className="h-[18px] w-[18px]" />
            <span className="font-medium">{modelAd}</span>
          </Cip>
        );
      case "oran":
        return (
          <Cip key="oran" innerRef={ref.oran} onClick={() => setAcik(acik === "oran" ? null : "oran")} aktif={acik === "oran"}>
            <OranIkon oran={deger.oran} className="h-4 w-4" />{deger.oran}
          </Cip>
        );
      case "cozunurluk":
        return (
          <Cip key="coz" innerRef={ref.cozunurluk} onClick={() => setAcik(acik === "cozunurluk" ? null : "cozunurluk")} aktif={acik === "cozunurluk"}>
            <Gem className="h-4 w-4" />{deger.coz}
          </Cip>
        );
      case "sure":
        if (!sureVar) return null;
        return (
          <Cip key="sure" innerRef={ref.sure} onClick={() => setAcik(acik === "sure" ? null : "sure")} aktif={acik === "sure"}>
            <Clock className="h-4 w-4" />{deger.sure}sn
          </Cip>
        );
      case "cokCekim":
        // Wan 2.6 / Veo → düz switch; Kling 3.0 / Seedance Pro → dropdown
        if (spec?.cokCekimTipi === "switch") {
          return (
            <Cip key="cc" onClick={() => onDeger({ cokCekim: deger.cokCekim === "Açık" ? "Kapalı" : "Açık" })}>
              <span>Çok çekimli</span>
              <span className={cn("relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors",
                deger.cokCekim === "Açık" ? "bg-aksan" : "bg-white/20")}>
                <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 32 }}
                  className="absolute top-[3px] h-4 w-4 rounded-full bg-white"
                  style={{ left: deger.cokCekim === "Açık" ? 19 : 3 }} />
              </span>
            </Cip>
          );
        }
        return (
          <Cip key="cc" innerRef={ref.cokCekim} onClick={() => setAcik(acik === "cokCekim" ? null : "cokCekim")} aktif={acik === "cokCekim"}>
            <Layers className="h-4 w-4" />
            <span>Çok çekimli <span className={cn(deger.cokCekim !== "Kapalı" && "text-aksan")}>{deger.cokCekim}</span></span>
            <ChevronDown className="h-3.5 w-3.5 text-metin-3" />
          </Cip>
        );
      case "mod":
        return (
          <Cip key="mod" innerRef={ref.mod} onClick={() => setAcik(acik === "mod" ? null : "mod")} aktif={acik === "mod"}>
            <Layers className="h-4 w-4" />
            <span>Kip <span className="text-aksan">{deger.mod}</span></span>
            <ChevronDown className="h-3.5 w-3.5 text-metin-3" />
          </Cip>
        );
      case "iyilestir":
        return (
          <Cip key="iy" onClick={() => onDeger({ iyilestir: !deger.iyilestir })}>
            <Sparkles className={cn("h-4 w-4", deger.iyilestir && "text-aksan")} />
            {deger.iyilestir ? "Açık" : "Kapalı"}
          </Cip>
        );
      case "ses":
        return (
          <Cip key="ses" onClick={() => onDeger({ ses: !deger.ses })}>
            {deger.ses ? <Volume2 className="h-4 w-4 text-aksan" /> : <VolumeX className="h-4 w-4" />}
            {deger.ses ? "Açık" : "Kapalı"}
          </Cip>
        );
      case "sayac":
        return (
          <div key="sy" className="hf-cip flex h-10 shrink-0 items-center gap-2.5 rounded-xl px-2.5 text-[14px] text-metin">
            <button onClick={() => onDeger({ adet: Math.max(1, deger.adet - 1) })} aria-label="Azalt"
              className="text-metin-2 transition-colors hover:text-metin"><Minus className="h-4 w-4" /></button>
            <span className="tabular-nums">{deger.adet}/{spec?.adetMax ?? 4}</span>
            <button onClick={() => onDeger({ adet: Math.min(spec?.adetMax ?? 4, deger.adet + 1) })} aria-label="Artır"
              className="text-metin-2 transition-colors hover:text-metin"><Plus className="h-4 w-4" /></button>
          </div>
        );
      case "bitrate":
        return (
          <Cip key="br" innerRef={ref.bitrate} onClick={() => setAcik(acik === "bitrate" ? null : "bitrate")} aktif={acik === "bitrate"}>
            <Sparkles className="h-4 w-4" />{deger.bitrate}
          </Cip>
        );
      case "sabitLens":
        return (
          <Cip key="sl" onClick={() => onDeger({ sabitLens: !deger.sabitLens })}>
            <span>Sabit lens</span>
            <span className={cn("relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors", deger.sabitLens ? "bg-aksan" : "bg-white/20")}>
              <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 32 }}
                className="absolute top-[3px] h-4 w-4 rounded-full bg-white" style={{ left: deger.sabitLens ? 19 : 3 }} />
            </span>
          </Cip>
        );
      case "otoAyar":
        return (
          <Cip key="oa" onClick={() => onDeger({ otoAyar: !deger.otoAyar })}>
            <span>Otomatik ayarlar</span>
            <span className={cn("relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors", deger.otoAyar ? "bg-aksan" : "bg-white/20")}>
              <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 32 }}
                className="absolute top-[3px] h-4 w-4 rounded-full bg-white" style={{ left: deger.otoAyar ? 19 : 3 }} />
            </span>
          </Cip>
        );
      case "gelismis":
        return (
          <Cip key="gl" innerRef={ref.gelismis} onClick={() => setAcik(acik === "gelismis" ? null : "gelismis")} aktif={acik === "gelismis"}
            aria-label="Gelişmiş ayarlar" className="px-2.5">
            <SlidersHorizontal className="h-4 w-4" />
          </Cip>
        );
      case "sahneKontrol":
        return (
          <Cip key="sk" innerRef={ref.sahneKontrol} onClick={() => setAcik(acik === "sahneKontrol" ? null : "sahneKontrol")} aktif={acik === "sahneKontrol"}>
            <Layers className="h-4 w-4" />
            <span>Sahne kontrolü <span className="text-aksan">{deger.sahneKontrol}</span></span>
          </Cip>
        );
      /* Sinema 2.5 — Tür çipi: renk örneği + tür adı (referans: "General") */
      case "tur":
        return (
          <Cip key="tur" onClick={onTurAc} aria-label="Tür seç">
            <span className="h-4 w-4 shrink-0 rounded-[5px]"
              style={{ background: "linear-gradient(135deg,#8a2f1e,#d4642f)" }} />
            {deger.tur}
          </Cip>
        );
      /* ── GÖRSEL modu çipleri (referans: modeller/gorsel/*) ── */
      case "kalite":
        return (
          <Cip key="kal" innerRef={ref.kalite} onClick={() => setAcik(acik === "kalite" ? null : "kalite")} aktif={acik === "kalite"}>
            <Gem className="h-4 w-4" />{deger.kalite}
          </Cip>
        );
      case "izgara":
        return (
          <Cip key="izg" innerRef={ref.izgara} onClick={() => setAcik(acik === "izgara" ? null : "izgara")} aktif={acik === "izgara"}>
            <Grid3x3 className="h-4 w-4" />{deger.izgara}
          </Cip>
        );
      case "sinirsiz":
        return (
          <Cip key="snr" onClick={() => onDeger({ sinirsiz: !deger.sinirsiz })}>
            <span className="text-aksan">Sınırsız</span>
            <span className={cn("relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors", deger.sinirsiz ? "bg-aksan" : "bg-white/20")}>
              <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 32 }}
                className="absolute top-[3px] h-4 w-4 rounded-full bg-white" style={{ left: deger.sinirsiz ? 19 : 3 }} />
            </span>
          </Cip>
        );
      case "vektor":
        return (
          <Cip key="vkt" onClick={() => onDeger({ vektor: !deger.vektor })}>
            <Info className="h-4 w-4 text-metin-3" /><span>Vektör kipi</span>
            <span className={cn("relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors", deger.vektor ? "bg-aksan" : "bg-white/20")}>
              <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 32 }}
                className="absolute top-[3px] h-4 w-4 rounded-full bg-white" style={{ left: deger.vektor ? 19 : 3 }} />
            </span>
          </Cip>
        );
      /* Renk aktarımı — Hex palet modalını açar (referans: renk/).
         Palet seçiliyse çipin etiketi palet adına döner. */
      case "renkAktarim":
        return (
          <Cip key="rnk" onClick={() => setRenkModal(true)} aktif={!!renkPalet}>
            {renkPalet ? (
              <span className="flex h-4 w-4 shrink-0 overflow-hidden rounded-[3px]">
                {(HEX_PALETLER.find((p) => p.ad === renkPalet)?.renkler ?? []).slice(0, 4).map((c) => (
                  <span key={c} className="flex-1" style={{ background: c }} />
                ))}
              </span>
            ) : <Palette className="h-4 w-4" />}
            {renkPalet ?? "Renk aktarımı"}
            {!renkPalet && modelAd === "Ruh 2.0" && (
              <span className="ml-0.5 rounded-[5px] bg-aksan px-1.5 py-[2px] text-[10px] font-black italic text-zemin">YENİ</span>
            )}
          </Cip>
        );
      case "cfgAdim":
        return (
          <Cip key="cfg" innerRef={ref.cfgAdim} onClick={() => setAcik(acik === "cfgAdim" ? null : "cfgAdim")} aktif={acik === "cfgAdim"}
            aria-label="Gelişmiş" className="px-2.5">
            <SlidersHorizontal className="h-4 w-4" />
          </Cip>
        );
      case "gorselKip":
        return (
          <Cip key="gkp" innerRef={ref.gorselKip} onClick={() => setAcik(acik === "gorselKip" ? null : "gorselKip")} aktif={acik === "gorselKip"}>
            {deger.gorselKip}
          </Cip>
        );
      /* Çekim kontrolü — 3.0: Akıllı/Özel Çoklu-çekim · 2.5: Tek/Çoklu Oto/Çoklu Manuel */
      case "cekimKontrol":
        return (
          <Cip key="ck2" innerRef={ref.cekimKontrol} onClick={() => setAcik(acik === "cekimKontrol" ? null : "cekimKontrol")} aktif={acik === "cekimKontrol"}>
            <Clapperboard className="h-4 w-4" />{deger.cekimKontrol}
          </Cip>
        );
      default:
        return null;
    }
  };

  // Kredi gösterimi: indirimli (üstü çizili) · ücretsiz kota metni · düz sayı
  const krediGoster = spec?.bedavaKota
    ? <span className="flex items-center gap-1 text-[12px]"><Sparkles className="h-3 w-3 shrink-0" />{spec.bedavaKota}</span>
    : spec?.krediEski
      ? <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /><span className="text-black/40 line-through">{spec.krediEski}</span><span>{spec.kredi}</span></span>
      : <span className="flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" />{spec?.kredi ?? 0}</span>;

  return (
    <div className="w-full">
      <input ref={dosyaRef} type="file" accept="image/*,video/*" hidden onChange={dosyaGeldi} />

      {/* Grok — açık içerik uyarı bandı (referans birebir) */}
      <AnimatePresence>
        {spec?.uyariBandi && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="mb-2 flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-2 text-[13px] text-amber-200/90">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Açık içerik sağlayıcı tarafından reddedilebilir ve krediler iade edilmez.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Çekim şeridi — Çok çekim "Özel" iken */}
      <AnimatePresence>
        {ozelCekim && deger.cekimler.length > 0 && (
          <CekimSeridi
            cekimler={deger.cekimler} secili={seciliCekim} onSec={setSeciliCekim}
            onEkle={() => {
              const id = `c${Date.now()}`;
              onDeger({ cekimler: [...deger.cekimler, { id, sure: 3, istem: "" }] });
              setSeciliCekim(id);
            }}
            onSil={(id) => onDeger({ cekimler: deger.cekimler.filter((x) => x.id !== id) })}
            onSure={(id, sure) => onDeger({
              cekimler: deger.cekimler.map((x) => x.id === id ? { ...x, sure } : x),
            })}
            onSirala={(yeni) => onDeger({ cekimler: yeni })}
          />
        )}
      </AnimatePresence>

      <div className="flex items-stretch gap-2.5">
        {/* Sol dikey anahtar — Görsel / Video.
            `self-center`: composer büyüyünce (element hapı/çekim şeridi) ray
            yukarı yapışıp altında boşluk bırakıyordu; artık dikeyde ortalanır. */}
        {onKip && (
          <div className="hf-kabuk flex shrink-0 flex-col gap-1 self-center rounded-[22px] p-1.5">
            {([["gorsel", "Görsel", ImageIcon], ["video", "Video", VideoIcon]] as const).map(([id, ad, Ik]) => (
              <button key={id} onClick={() => onKip(id)}
                className={cn("flex h-[52px] w-[64px] flex-col items-center justify-center gap-1 rounded-2xl text-[12px] transition-colors",
                  kip === id ? "hf-cip-aktif font-semibold text-metin" : "text-metin-3 hover:text-metin")}>
                <Ik className="h-[18px] w-[18px]" />{ad}
              </button>
            ))}
          </div>
        )}

        {/* Composer gövdesi — prompt + çipler SOLDA, yükleme kutuları SAĞDA
            ve İÇERİDE sabit (Higgsfield birebir; dışarıda ayrı kart değil).
            NOT: kutular `items-center` ile dikeyde ORTALANIR — `items-stretch`
            ile yukarı yapışıp çip satırıyla hizasız kalıyordu. */}
        <div className="hf-kabuk relative flex min-w-0 flex-1 items-center gap-3 rounded-[22px] p-3">
          {/* Boyut tutamağı — kutunun EN ÜSTÜNDE, ortada. Yukarı çek = büyüt,
              aşağı = küçült. LIME renk: beyaz/gri tonda fark edilmiyordu. */}
          <div onPointerDown={promptSurukle}
            className="group/tut absolute -top-1.5 left-1/2 z-20 flex h-5 w-24 -translate-x-1/2 cursor-ns-resize items-center justify-center"
            aria-label="Kutu boyutunu ayarla" title="Sürükleyerek kutuyu büyüt/küçült">
            <span className="h-[5px] w-12 rounded-full transition-all group-hover/tut:h-[6px] group-hover/tut:w-14"
              style={{ background: "var(--sn-lime,#55d6fd)", opacity: 0.75 }} />
          </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
          {/* Prompt satırı */}
          {spec?.promptKilitli ? (
            <div className="flex items-center gap-2 px-1 py-2 text-[16px] text-metin-3">
              <Lock className="h-[18px] w-[18px]" /> İstem kapalı
            </div>
          ) : (
            <div>
              {/* @element hapları + kadro token'ları — prompt'un ÜSTÜNDE
                  (Higgsfield birebir). Altta olunca metin üstlerine biniyordu. */}
              {(deger.mentionlar.length > 0 || kadroToken.length > 0) && (
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5 px-1">
                  {/* AI Kadro token'ları — hover'da önizleme, tıkla → değiştir */}
                  {kadroToken.map((t) => (
                    <KadroTokeni key={t.alanId} ad={t.ad} tohum={t.tohum}
                      secenekler={alanSecenekleri(t.alanId)}
                      onDegis={(yeni) => setKadroSecim((s) => ({ ...s, [t.alanId]: yeni }))}
                      onKaldir={() => setKadroSecim((s) => { const y = { ...s }; delete y[t.alanId]; return y; })}
                      onElementKaydet={() => onDeger({
                        mentionlar: [...deger.mentionlar, { ad: t.ad, duygu: "Nötr" as Duygu }],
                      })} />
                  ))}
                  {deger.mentionlar.map((m) => (
                    <MentionHapi key={m.ad}
                      element={{ id: m.ad, ad: m.ad, gorselUrl: m.gorselUrl }}
                      duygu={m.duygu}
                      onKaldir={() => onDeger({ mentionlar: deger.mentionlar.filter((x) => x.ad !== m.ad) })}
                      onDuygu={(k) => { setDuyguKonum(k); setDuyguAcik(m.ad); }} />
                  ))}
                </div>
              )}
              <textarea
                ref={promptRef}
                value={ozelCekim && seciliCekim
                  ? (deger.cekimler.find((c) => c.id === seciliCekim)?.istem ?? "")
                  : deger.istem}
                onChange={promptDegisti}
                rows={1}
                placeholder={spec?.yerTutucu ?? (kip === "gorsel" ? "Oluşturmak istediğini anlat…" : "Oluşturmak istediğin videoyu anlat…")}
                style={promptYuk !== null ? { height: promptYuk, overflowY: "auto" } : undefined}
                className="prompt-alan max-h-[40vh] w-full resize-none bg-transparent px-1 py-1.5 text-[16px] leading-relaxed text-metin outline-none placeholder:text-metin-3" />
            </div>
          )}

          {/* Çip satırı — spec sırasıyla. Higgsfield'da tek satır kalır ve
              sığmazsa YATAY KAYAR (sarmaz); scrollbar global olarak gizli. */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5"
            style={{ scrollbarWidth: "none" }}>
            {spec?.cipler.map(cipCiz)}
          </div>
        </div>

        {/* Yükleme kutuları — composer'ın İÇİNDE, en sağda sabit */}
        {kutular.map((k, i) => {
          // "Opsiyonel" etiketi: iki kare kutusu varsa SONdakinde, tek kutu varsa onda.
          const kareler = kutular.filter((x) => x === "baslangic" || x === "bitis");
          const opsiyonel = (k === "baslangic" && kareler.length === 1)
            || (k === "bitis")
            || (k === "baslangic" && spec?.ad.startsWith("Sora"))
            || (k === "baslangic" && spec?.ad === "Wan 2.7");
          // Kutunun dolu değeri — preset ve eylem kutularının (kadroKur,
          // kameraKurulum) kendi durumu yok, hep boş görünür.
          const alan = (k === "preset" || k === "kadroKur" || k === "kameraKurulum")
            ? null : (deger[k as "baslangic"] ?? null);
          return (
            <YuklemeKutusu key={`${k}-${i}`} tur={k} opsiyonel={opsiyonel} deger={alan}
              onSec={() => kutuAc(k)}
              onTemizle={() => onDeger({ [k]: null } as Partial<VideoComposerDeger>)}
              presetAd={presetAd} presetArka={presetArka} />
          );
        })}
        </div>{/* composer gövdesi kapanışı */}

        {/* ÜRET — composer'ın DIŞINDA, sağda ayrı buton (referans birebir) */}
        <button onClick={onUret} disabled={uretiliyor}
          /* SABİT yükseklik: prompt kutusu büyüyünce (tutamaktan sürüklenince)
             flex esnemesiyle ÜRET de uzuyordu — Higgsfield'da boyu sabit kalır. */
          className="hf-uret flex h-[104px] w-[150px] shrink-0 self-center flex-col items-center justify-center gap-1 rounded-2xl px-4 disabled:opacity-60">
          <span className="text-[16px] font-black tracking-wide">ÜRET</span>
          <span className="text-[14px] font-bold">{krediGoster}</span>
        </button>
      </div>

      {/* ─── Higgsfield modalları ─── */}
      <HareketKarakterModal acik={hkModal} kapat={() => setHkModal(false)}
        hareket={deger.hareket} karakter={deger.karakter}
        onHareket={(u) => onDeger({ hareket: u })} onKarakter={(u) => onDeger({ karakter: u })} />
      <KadroModal acik={kadroModal} kapat={() => setKadroModal(false)}
        secim={kadroSecim} onSecim={setKadroSecim} />
      <KameraModal acik={kameraModal} kapat={() => setKameraModal(false)}
        kurulum={kamera} onKurulum={setKamera} />
      <VarlikSeciciModal acik={varlikModal} kapat={() => setVarlikModal(false)}
        elementler={elementler}
        onSec={(u) => onDeger({ [kutular[0] ?? "baslangic"]: u } as Partial<VideoComposerDeger>)} />
      <RenkAktarimModal acik={renkModal} kapat={() => setRenkModal(false)}
        secili={renkPalet} onSec={(ad) => { setRenkPalet(ad); onDeger({ renkAktarim: !!ad }); }} />
      <YuklemeModal acik={yukleModal !== null} kapat={() => setYukleModal(null)}
        baslik={yukleModal === "gStil" ? "Moodboard'unu oluştur" : "Kendi karakterini oluştur"}
        altBaslik={yukleModal === "gStil" ? "Devam etmek için en az 5 fotoğraf yükle." : "Devam etmek için en fazla 5 fotoğraf yükle."}
        iyiMetin="20+ fotoğraf, tek bir bütünlüklü stil, yüz yok."
        kotuMetin="Yüzler, karışık stiller, bulanık veya düşük kaliteli görseller."
        onDosya={(u) => onDeger({ [yukleModal === "gStil" ? "gStil" : "gKarakter"]: u } as unknown as Partial<VideoComposerDeger>)} />

      {/* ─── @element sistemi (liste · duygu çarkı · referans menüsü) ─── */}
      <ElementListesi acik={mentionAcik} kapat={() => { setMentionAcik(false); setMentionYaziBas(null); }}
        elementler={elementler} secili={deger.mentionlar.map((m) => m.ad)}
        onSec={elementEkle} konum={mentionKonum} />
      <DuyguCarki acik={duyguAcik !== null} kapat={() => setDuyguAcik(null)}
        element={(() => { const m = deger.mentionlar.find((x) => x.ad === duyguAcik); return m ? { id: m.ad, ad: m.ad, gorselUrl: m.gorselUrl } : null; })()}
        deger={deger.mentionlar.find((x) => x.ad === duyguAcik)?.duygu ?? "Nötr"}
        onDeger={(d) => onDeger({ mentionlar: deger.mentionlar.map((x) => x.ad === duyguAcik ? { ...x, duygu: d } : x) })}
        konum={duyguKonum} />
      <ReferansMenu acik={refMenuAcik} kapat={() => setRefMenuAcik(false)} konum={refMenuKonum}
        bitisVar={kutular.includes("bitis")}
        onSec={(tip) => dosyaSec(tip === "referans" ? (kutular[0] ?? "baslangic") : tip === "baslangic" ? "baslangic" : "bitis")} />

      {/* ─── Popover'lar ─── */}
      {/* Oran — Sinema modellerinde TEK sütun + seçilide lime ✓ (referans birebir);
          diğerlerinde iki sütunlu ızgara. 16:9 ve 21:9'da "Sinematik" rozeti. */}
      <CipPopover acik={acik === "oran"} kapat={kapat} cipRef={ref.oran} baslik="En-boy oranı"
        genislik={spec?.secici ? 300 : 260}>
        <div className={cn("p-1", spec?.secici ? "space-y-px" : "grid grid-cols-2 gap-px")}>
          {(spec?.oranlar ?? []).map((o) => {
            const secili = deger.oran === o;
            return (
              <button key={o} onClick={() => { onDeger({ oran: o }); kapat(); }}
                className={cn("flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors",
                  secili ? "bg-white/[0.10] text-metin" : "text-metin-2 hover:bg-white/[0.06]")}>
                <OranIkon oran={o} className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{o}</span>
                {spec?.secici && ORAN_SINEMATIK.includes(o) && (
                  <span className="shrink-0 rounded-md bg-aksan/15 px-1.5 py-[3px] text-[11px] font-semibold text-aksan">Sinematik</span>
                )}
                {secili && <Check className="h-4 w-4 shrink-0 text-aksan" />}
              </button>
            );
          })}
        </div>
      </CipPopover>

      {/* ── GÖRSEL modu popover'ları ── */}
      <CipPopover acik={acik === "kalite"} kapat={kapat} cipRef={ref.kalite} baslik="Kalite" genislik={230}>
        <div className="p-1">
          {(spec?.kaliteler ?? spec?.cozler ?? []).map((k) => (
            <button key={k} onClick={() => { onDeger({ kalite: k }); kapat(); }}
              className={cn("flex w-full items-center rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors",
                deger.kalite === k ? "bg-white/[0.10] text-metin" : "text-metin-2 hover:bg-white/[0.06]")}>
              {k}
            </button>
          ))}
        </div>
      </CipPopover>

      <CipPopover acik={acik === "izgara"} kapat={kapat} cipRef={ref.izgara} baslik="Izgara üretimi" genislik={230}>
        <div className="p-1">
          {["1x1", "2x2", "3x3", "4x4"].map((g) => (
            <button key={g} onClick={() => { onDeger({ izgara: g }); kapat(); }}
              className={cn("flex w-full items-center rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors",
                deger.izgara === g ? "bg-white/[0.10] text-metin" : "text-metin-2 hover:bg-white/[0.06]")}>
              <span className="flex-1 text-left">{g}</span>
              {deger.izgara === g && <Check className="h-4 w-4 shrink-0 text-aksan" />}
            </button>
          ))}
        </div>
      </CipPopover>

      <CipPopover acik={acik === "gorselKip"} kapat={kapat} cipRef={ref.gorselKip} baslik="Kip" genislik={280}>
        <div className="p-1">
          {[["Standart", "Standart üretim kipi"], ["Kalite", "Kaliteli üretim kipi"]].map(([ad, ozet]) => (
            <button key={ad} onClick={() => { onDeger({ gorselKip: ad }); kapat(); }}
              className={cn("flex w-full flex-col items-start rounded-xl px-3 py-2.5 text-left transition-colors",
                deger.gorselKip === ad ? "bg-white/[0.10]" : "hover:bg-white/[0.06]")}>
              <span className="text-[15px] font-medium text-metin">{ad}</span>
              <span className="text-[12px] text-metin-3">{ozet}</span>
            </button>
          ))}
        </div>
      </CipPopover>

      {/* FLUX.2 Flex — CFG + Adım kaydırıcıları */}
      <CipPopover acik={acik === "cfgAdim"} kapat={kapat} cipRef={ref.cfgAdim} baslik="Gelişmiş" genislik={300}>
        <div className="space-y-3 p-3 pt-1">
          <label className="block">
            <span className="mb-1.5 flex items-center justify-between text-[14px] text-metin"><span>CFG</span><span className="text-metin-2">{deger.cfg}</span></span>
            <input type="range" min={1} max={20} step={0.5} value={deger.cfg}
              onChange={(e) => onDeger({ cfg: Number(e.target.value) })} className="h-1 w-full cursor-pointer accent-aksan" />
          </label>
          <label className="block">
            <span className="mb-1.5 flex items-center justify-between text-[14px] text-metin"><span>Adım</span><span className="text-metin-2">{deger.adim}</span></span>
            <input type="range" min={10} max={60} step={1} value={deger.adim}
              onChange={(e) => onDeger({ adim: Number(e.target.value) })} className="h-1 w-full cursor-pointer accent-aksan" />
          </label>
        </div>
      </CipPopover>

      {/* Çekim kontrolü — 3.0: Akıllı / Özel Çoklu-çekim · 2.5: Tek / Çoklu Oto / Çoklu Manuel */}
      <CipPopover acik={acik === "cekimKontrol"} kapat={kapat} cipRef={ref.cekimKontrol} baslik="Çekim kontrolü" genislik={260}>
        <div className="p-1">
          {(modelAd === "Sinema Stüdyo 2.5"
            ? ["Tek çekim", "Çoklu çekim Oto", "Çoklu çekim Manuel"]
            : ["Akıllı", "Özel çoklu çekim"]
          ).map((v) => (
            <button key={v} onClick={() => { onDeger({ cekimKontrol: v }); kapat(); }}
              className={cn("flex w-full items-center rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors",
                deger.cekimKontrol === v ? "bg-white/[0.10] text-metin" : "text-metin-2 hover:bg-white/[0.06]")}>
              <span className="flex-1 text-left">{v}</span>
              {deger.cekimKontrol === v && <Check className="h-4 w-4 shrink-0 text-aksan" />}
            </button>
          ))}
        </div>
      </CipPopover>

      <CipPopover acik={acik === "cozunurluk"} kapat={kapat} cipRef={ref.cozunurluk} baslik="Çözünürlük" genislik={200}>
        <div className="p-1">
          {(spec?.cozler ?? []).map((c) => (
            <button key={c} onClick={() => { onDeger({ coz: c }); kapat(); }}
              className={cn("flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors",
                deger.coz === c ? "bg-white/[0.10] text-metin" : "text-metin-2 hover:bg-white/[0.06]")}>
              <Gem className="h-4 w-4" />{c}
            </button>
          ))}
        </div>
      </CipPopover>

      <CipPopover acik={acik === "sure"} kapat={kapat} cipRef={ref.sure} baslik="Süre" genislik={200}>
        <div className="p-1">
          {(spec?.sureler ?? []).map((s) => (
            <button key={s} onClick={() => { onDeger({ sure: s }); kapat(); }}
              className={cn("flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors",
                deger.sure === s ? "bg-white/[0.10] text-metin" : "text-metin-2 hover:bg-white/[0.06]")}>
              <Clock className="h-4 w-4" />{s}sn
            </button>
          ))}
        </div>
      </CipPopover>

      <CipPopover acik={acik === "cokCekim"} kapat={kapat} cipRef={ref.cokCekim} baslik="Çok çekimli" genislik={220}>
        <div className="p-1">
          {["Kapalı", "Oto", "Özel"].map((v) => (
            <button key={v} onClick={() => { onDeger({ cokCekim: v }); kapat(); }}
              className={cn("flex w-full items-center rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors",
                deger.cokCekim === v ? "bg-white/[0.10] text-metin" : "text-metin-2 hover:bg-white/[0.06]")}>
              {v}
            </button>
          ))}
        </div>
      </CipPopover>

      <CipPopover acik={acik === "mod"} kapat={kapat} cipRef={ref.mod} baslik="Kip" genislik={220}>
        <div className="p-1">
          {(spec?.modlar ?? []).map((v) => (
            <button key={v} onClick={() => { onDeger({ mod: v }); kapat(); }}
              className={cn("flex w-full items-center rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors",
                deger.mod === v ? "bg-white/[0.10] text-metin" : "text-metin-2 hover:bg-white/[0.06]")}>
              {v}
            </button>
          ))}
        </div>
      </CipPopover>

      <CipPopover acik={acik === "bitrate"} kapat={kapat} cipRef={ref.bitrate} baslik="Bit hızı" genislik={280}>
        <div className="p-1">
          {[
            { ad: "Yüksek", ozet: "Az sıkıştırma · büyük boyut", Ik: Sparkles },
            { ad: "Standart", ozet: "Çok sıkıştırma · küçük boyut", Ik: Zap },
          ].map(({ ad, ozet, Ik }) => (
            <button key={ad} onClick={() => { onDeger({ bitrate: ad }); kapat(); }}
              className={cn("flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors",
                deger.bitrate === ad ? "bg-white/[0.10]" : "hover:bg-white/[0.06]")}>
              <Ik className="mt-0.5 h-4 w-4 shrink-0 text-metin-2" />
              <span>
                <span className="block text-[15px] font-medium text-metin">{ad}</span>
                <span className="block text-[12px] text-metin-3">{ozet}</span>
              </span>
            </button>
          ))}
        </div>
      </CipPopover>

      <CipPopover acik={acik === "sahneKontrol"} kapat={kapat} cipRef={ref.sahneKontrol} baslik="Sahne kontrolü" genislik={220}>
        <div className="p-1">
          {(spec?.sahneKontrolSecenek ?? []).map((v) => (
            <button key={v} onClick={() => { onDeger({ sahneKontrol: v }); kapat(); }}
              className={cn("flex w-full items-center rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors",
                deger.sahneKontrol === v ? "bg-white/[0.10] text-metin" : "text-metin-2 hover:bg-white/[0.06]")}>
              {v}
            </button>
          ))}
        </div>
      </CipPopover>

      {/* Gelişmiş: Adım + Tohum (Wan / Vayra / Motion Control) */}
      <CipPopover acik={acik === "gelismis"} kapat={kapat} cipRef={ref.gelismis} baslik="Gelişmiş ayarlar" genislik={300}>
        <div className="space-y-3 p-3 pt-1">
          {spec?.promptKilitli ? (
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium text-metin">İstem</span>
              <textarea value={deger.istem} onChange={(e) => onDeger({ istem: e.target.value })} rows={4}
                placeholder="Hayalindeki sahneyi ayrıntılarıyla anlat."
                className="prompt-alan w-full resize-none rounded-xl bg-black/40 p-2.5 text-[14px] text-metin outline-none placeholder:text-metin-3" />
            </label>
          ) : null}
          {spec?.adim !== undefined && (
            <label className="block">
              <span className="mb-1.5 flex items-center justify-between text-[14px] text-metin"><span>Adım</span><span className="text-metin-2">{deger.adim}</span></span>
              <input type="range" min={10} max={100} step={1} value={deger.adim}
                onChange={(e) => onDeger({ adim: Number(e.target.value) })}
                className="h-1 w-full cursor-pointer accent-aksan" />
            </label>
          )}
          <label className="block">
            <span className="mb-1.5 block text-[14px] text-metin">Tohum</span>
            <input value={deger.tohum} onChange={(e) => onDeger({ tohum: e.target.value })}
              className="w-full rounded-xl bg-black/40 px-3 py-2 text-[14px] text-metin outline-none" />
          </label>
        </div>
      </CipPopover>
    </div>
  );
}
