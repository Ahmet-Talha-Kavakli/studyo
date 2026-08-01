"use client";

/**
 * StudyoModallari — Higgsfield composer modallarının tamamı, BİREBİR.
 *
 * Referanslar:
 *  yeni/   → Hareket/Karakter modalı (Kling Motion Control)
 *  kadro/  → "KADRONU OLUŞTUR" (AI Kadro)
 *  kamera/ → Kamera kurulumu çarkı (Sinematik Kameralar)
 *  ruh/    → Karakter/Moodboard yükleme (Ruh 2.0)
 *  arti/   → `+` varlık seçici (4 sekme)
 *  renk/   → Renk aktarımı (Hex palet)
 */

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronLeft, ChevronUp, ChevronDown, Check, Plus, Search, Image as ImageIcon,
  Video as VideoIcon, VolumeX, Sparkles, Shuffle, SlidersHorizontal, Heart,
  Trash2, MoreHorizontal, Dices, AtSign, Lock, Globe, UserRound,
} from "lucide-react";
import { cn, onizlemeArka } from "@/lib/utils";
import { kabukArka } from "@/lib/gercekVeri";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { KADRO_SEKMELERI, type KadroSekme, type KadroAltOge } from "@/lib/kadroVeri";
import { KAMERALAR, LENSLER, ODAK_UZAKLIKLARI, DIYAFRAMLAR } from "@/lib/sinemaSecici";

/* ------------------------------------------------------------------ */
/* Ortak modal kabuğu                                                  */
/* ------------------------------------------------------------------ */
function ModalKabuk({
  acik, kapat, children, genislik = 980, className,
}: {
  acik: boolean; kapat: () => void; children: React.ReactNode; genislik?: number; className?: string;
}) {
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  useScrollKilit(acik);
  useEscKapat(acik, kapat);
  if (!hazir) return null;
  return createPortal(
    <AnimatePresence>
      {acik && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[180] bg-black/55 backdrop-blur-sm" onClick={kapat} />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: `min(${genislik}px, 94vw)` }}
            className={cn("sinema-kapsam hf-cam fixed left-1/2 top-1/2 z-[181] flex max-h-[86vh] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[26px]", className)}>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Yuvarlak kapat düğmesi */
const Kapat = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} aria-label="Kapat"
    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-metin transition-colors hover:bg-white/20">
    <X className="h-[18px] w-[18px]" />
  </button>
);

/** Sekme hapı (beyaz dolu = seçili) */
const SekmeHap = ({ ad, aktif, onClick }: { ad: string; aktif: boolean; onClick: () => void }) => (
  <button onClick={onClick}
    className={cn("shrink-0 rounded-full px-4 py-2 text-[14px] font-medium transition-colors",
      aktif ? "bg-white text-zemin" : "text-metin-2 hover:text-metin")}>
    {ad}
  </button>
);

/* ================================================================== */
/* 1) HAREKET / KARAKTER — Kling Motion Control (referans: yeni/)      */
/* ================================================================== */
export function HareketKarakterModal({
  acik, kapat, hareket, karakter, onHareket, onKarakter,
}: {
  acik: boolean; kapat: () => void;
  hareket: string | null; karakter: string | null;
  onHareket: (u: string | null) => void; onKarakter: (u: string | null) => void;
}) {
  const [sekme, setSekme] = useState<"yukle" | "kutuphane">("yukle");
  // Hareket kütüphanesi — 21 örnek (referansta 5 sütunlu sonsuz ızgara)
  const kutuphane = useMemo(() => Array.from({ length: 21 }, (_, i) => `hareket-${i}`), []);

  return (
    <ModalKabuk acik={acik} kapat={kapat} genislik={980}>
      {/* Başlık — 2 satır büyük harf + 2 satır alt metin, sağ üstte foto yelpazesi */}
      <div className="relative shrink-0 px-7 pb-4 pt-7">
        <div className="max-w-[58%]">
          <h3 className="hf-baslik text-[30px] leading-[1.05] text-metin">HAREKETİ KENDİ<br />KARAKTERİNLE KOPYALA</h3>
          <p className="mt-3 text-[14px] leading-relaxed text-metin-3">
            Herhangi bir videodan hareketi kopyala ve<br />karakterini aynı harekete yerleştir
          </p>
        </div>
        {/* Sağ üst foto yelpazesi (3 eğik kart) */}
        <div className="pointer-events-none absolute right-16 top-4 hidden h-[150px] w-[240px] sm:block">
          {[-12, 0, 12].map((r, i) => (
            <span key={i} className="absolute left-1/2 top-2 h-[138px] w-[92px] -translate-x-1/2 overflow-hidden rounded-xl ring-1 ring-white/15"
              style={{ transform: `translateX(${(i - 1) * 62}px) rotate(${r}deg)`, background: kabukArka(`yelpaze-${i}`, "portre") }} />
          ))}
        </div>
        <span className="absolute right-5 top-5"><Kapat onClick={kapat} /></span>
      </div>

      {/* Sekmeler */}
      <div className="shrink-0 px-7 pb-3">
        <div className="inline-flex gap-1 rounded-full bg-white/[0.05] p-1">
          <SekmeHap ad="Yükle" aktif={sekme === "yukle"} onClick={() => setSekme("yukle")} />
          <SekmeHap ad="Hareket kütüphanesi" aktif={sekme === "kutuphane"} onClick={() => setSekme("kutuphane")} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-7">
        {sekme === "yukle" ? (
          /* İki eşit yükleme alanı — sol hareket videosu, sağ karakter görseli */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {([
              { deger: hareket, ayar: onHareket, Ik: VideoIcon, ad: "Kopyalanacak hareketi ekle", alt: "Video süresi: 3–30 saniye", kabul: "video/*" },
              { deger: karakter, ayar: onKarakter, Ik: Plus, ad: "Karakterini ekle", alt: "Yüzü ve vücudu görünen görsel", kabul: "image/*" },
            ] as const).map((k) => (
              <label key={k.ad}
                className={cn("relative flex aspect-[1.45] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl transition-colors",
                  k.deger ? "border border-white/12 bg-black/40" : "border border-dashed border-white/15 hover:border-white/30")}>
                <input type="file" accept={k.kabul} hidden onChange={(e) => {
                  const f = e.target.files?.[0]; e.target.value = "";
                  if (f) k.ayar(URL.createObjectURL(f));
                }} />
                {k.deger ? (
                  <>
                    <span className="absolute inset-3 rounded-xl" style={{ background: `url("${k.deger}") center/contain no-repeat` }} />
                    <button onClick={(e) => { e.preventDefault(); k.ayar(null); }}
                      className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white"
                      aria-label="Kaldır"><X className="h-4 w-4" /></button>
                  </>
                ) : (
                  <>
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08] text-metin">
                      <k.Ik className="h-5 w-5" />
                    </span>
                    <span className="text-[15px] font-semibold text-metin">{k.ad}</span>
                    <span className="-mt-2 text-[13px] text-metin-3">{k.alt}</span>
                  </>
                )}
              </label>
            ))}
          </div>
        ) : (
          /* Hareket kütüphanesi — 5 sütun, 9:16 kartlar, sağ altta sessiz ikonu */
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
            {kutuphane.map((k) => (
              <button key={k} onClick={() => { onHareket(k); kapat(); }}
                className="group relative aspect-[9/16] overflow-hidden rounded-xl ring-1 ring-white/10 transition-all hover:ring-white/40"
                style={{ background: kabukArka(k, "portre") }}>
                <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white/90">
                  <VolumeX className="h-3.5 w-3.5" />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </ModalKabuk>
  );
}

/* ================================================================== */
/* 2) KADRONU OLUŞTUR — AI Kadro (referans: kadro/)                    */
/* ================================================================== */
function Cetvel({
  baslik, degerler, deger, onDeger,
}: {
  baslik: string; degerler: string[]; deger: string; onDeger: (v: string) => void;
}) {
  const i = Math.max(0, degerler.indexOf(deger));
  return (
    <div className="flex flex-col items-center py-10">
      <p className="mb-10 text-[20px] text-metin">{baslik}</p>
      {/* Cetvel — çentikler + lime tutamak; komşu değerler soluk */}
      <div className="relative w-full max-w-3xl">
        <div className="flex items-end justify-center gap-[6px]">
          {Array.from({ length: 41 }, (_, k) => {
            const j = i - 20 + k;
            const gecerli = j >= 0 && j < degerler.length;
            const buyuk = k % 5 === 0;
            return <span key={k} className="w-[2px] rounded-full transition-all"
              style={{ height: buyuk ? 26 : 15, background: gecerli ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.06)" }} />;
          })}
        </div>
        {/* lime tutamak (ortada sabit) */}
        <span className="pointer-events-none absolute left-1/2 top-0 h-[34px] w-[4px] -translate-x-1/2 rounded-full"
          style={{ background: "var(--sn-lime,#55d6fd)" }} />
        {/* değer şeridi */}
        <div className="mt-5 flex items-center justify-center gap-10">
          {[-2, -1, 0, 1, 2].map((d) => {
            const j = i + d;
            if (j < 0 || j >= degerler.length) return <span key={d} className="w-16" />;
            return (
              <button key={d} onClick={() => onDeger(degerler[j])}
                className={cn("whitespace-nowrap transition-all",
                  d === 0 ? "text-[30px] font-semibold text-metin" : Math.abs(d) === 1 ? "text-[22px] text-metin-2/60" : "text-[18px] text-metin-3/35")}>
                {degerler[j]}
              </button>
            );
          })}
        </div>
        {/* gezinme */}
        <input type="range" min={0} max={degerler.length - 1} value={i}
          onChange={(e) => onDeger(degerler[Number(e.target.value)])}
          aria-label={baslik}
          className="mt-6 h-1 w-full cursor-pointer accent-aksan" />
      </div>
    </div>
  );
}

function KadroIzgaraGorunum({
  icerik, deger, onDeger, tohumOnEk,
}: {
  icerik: { ozel?: string; ogeler: string[] }; deger: string; onDeger: (v: string) => void; tohumOnEk: string;
}) {
  const [ozelAcik, setOzelAcik] = useState(false);
  const [ozelMetin, setOzelMetin] = useState("");
  return (
    <div className="py-2">
      {/* "Özel" metin alanı — ızgaranın ÜSTÜNDE yerinde açılır */}
      <AnimatePresence>
        {ozelAcik && icerik.ozel && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className="relative mb-4 rounded-2xl border-[1.5px] border-white/70 bg-black/40 p-3">
              <textarea value={ozelMetin} onChange={(e) => setOzelMetin(e.target.value.slice(0, 300))}
                placeholder={icerik.ozel} rows={5}
                className="prompt-alan w-full resize-none bg-transparent text-[15px] text-metin outline-none placeholder:text-metin-3" />
              <button onClick={() => setOzelAcik(false)} aria-label="Kapat"
                className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-metin"><X className="h-3.5 w-3.5" /></button>
              <button onClick={() => { if (ozelMetin.trim()) onDeger(ozelMetin.trim().slice(0, 24)); setOzelAcik(false); }}
                className="absolute bottom-2.5 right-2.5 rounded-full bg-white px-4 py-1.5 text-[14px] font-semibold text-zemin">Uygula</button>
            </div>
            <p className="mb-3 text-center text-[14px] text-metin">Özel</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {icerik.ozel && (
          <button onClick={() => setOzelAcik(true)} className="group text-left">
            <span className="flex aspect-[3/3.6] w-full items-center justify-center rounded-xl bg-white/[0.05] ring-1 ring-white/10 transition-colors group-hover:bg-white/[0.09]">
              <Sparkles className="h-6 w-6 text-metin-2" />
            </span>
            <span className="mt-2 block text-center text-[14px] text-metin-2">Özel</span>
          </button>
        )}
        {icerik.ogeler.map((o) => {
          const aktif = o === deger;
          return (
            <button key={o} onClick={() => onDeger(o)} className="group text-left">
              <span className="relative block aspect-[3/3.6] w-full overflow-hidden rounded-xl transition-all"
                style={{
                  background: kabukArka(`${tohumOnEk}-${o}`, "portre"),
                  boxShadow: aktif ? "0 0 0 2px var(--sn-lime,#55d6fd)" : "inset 0 0 0 1px rgba(255,255,255,0.08)",
                }}>
                {aktif && (
                  <span className="absolute bottom-2 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full text-zemin"
                    style={{ background: "var(--sn-lime,#55d6fd)" }}><Check className="h-4 w-4" strokeWidth={3} /></span>
                )}
              </span>
              <span className={cn("mt-2 block truncate text-center text-[14px]", aktif ? "font-medium text-metin" : "text-metin-2")}>{o}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function KadroModal({
  acik, kapat, secim, onSecim,
}: {
  acik: boolean; kapat: () => void;
  secim: Record<string, string>; onSecim: (y: Record<string, string>) => void;
}) {
  const [sekmeId, setSekmeId] = useState(KADRO_SEKMELERI[0].id);
  const [altId, setAltId] = useState<string | null>(null);
  const sekme = KADRO_SEKMELERI.find((s) => s.id === sekmeId) ?? KADRO_SEKMELERI[0];
  const aktifAlt: KadroAltOge | null = sekme.tip === "altMenu"
    ? (sekme.altlar.find((a) => a.id === altId) ?? sekme.altlar[0])
    : null;

  /** Rastgele doldur — her sekmeden rastgele bir değer seçer. */
  const rastgele = () => {
    const y: Record<string, string> = { ...secim };
    const doldur = (id: string, s: KadroSekme | KadroAltOge) => {
      if (s.tip === "izgara") y[id] = s.icerik.ogeler[Math.floor(Math.random() * s.icerik.ogeler.length)];
      else if (s.tip === "cetvel") y[id] = s.icerik.degerler[Math.floor(Math.random() * s.icerik.degerler.length)];
    };
    for (const s of KADRO_SEKMELERI) {
      if (s.tip === "altMenu") s.altlar.forEach((a) => doldur(a.id, a));
      else doldur(s.id, s);
    }
    onSecim(y);
  };

  return (
    <ModalKabuk acik={acik} kapat={kapat} genislik={1150}>
      <div className="flex shrink-0 items-start gap-3 px-7 pt-7">
        <div className="min-w-0 flex-1">
          <h3 className="hf-baslik text-[30px] leading-tight text-metin">KADRONU OLUŞTUR</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-metin-3">
            Filminin kadrosunu sıfırdan kur — tür, bütçe, görünüm<br />ve arasındaki her detay.
          </p>
        </div>
        <button onClick={rastgele}
          className="hf-cip flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-[14px] text-metin-2 hover:text-metin">
          <Shuffle className="h-4 w-4" /> Rastgele
        </button>
        <Kapat onClick={kapat} />
      </div>

      {/* Sekme satırı */}
      <div className="shrink-0 overflow-x-auto px-7 py-4">
        <div className="inline-flex gap-1 rounded-full bg-white/[0.05] p-1">
          {KADRO_SEKMELERI.map((s) => (
            <SekmeHap key={s.id} ad={s.ad} aktif={s.id === sekmeId}
              onClick={() => { setSekmeId(s.id); setAltId(null); }} />
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-5 overflow-hidden px-7 pb-7">
        {/* Sol alt-menü (Kimlik / Fiziksel Görünüm) */}
        {sekme.tip === "altMenu" && (
          <div className="w-[190px] shrink-0 space-y-1 overflow-y-auto">
            {sekme.altlar.map((a) => (
              <button key={a.id} onClick={() => setAltId(a.id)}
                className={cn("w-full rounded-xl px-3.5 py-2.5 text-left text-[15px] transition-colors",
                  a.id === (aktifAlt?.id) ? "bg-white/[0.10] font-medium text-metin" : "text-metin-2 hover:bg-white/[0.05]")}>
                {a.ad}
              </button>
            ))}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {(() => {
            const hedef = aktifAlt ?? sekme;
            const id = aktifAlt ? aktifAlt.id : sekme.id;
            if (hedef.tip === "cetvel") {
              return <Cetvel baslik={hedef.icerik.baslik} degerler={hedef.icerik.degerler}
                deger={secim[id] ?? hedef.icerik.varsayilan} onDeger={(v) => onSecim({ ...secim, [id]: v })} />;
            }
            if (hedef.tip === "izgara") {
              return <KadroIzgaraGorunum icerik={hedef.icerik} tohumOnEk={id}
                deger={secim[id] ?? hedef.icerik.varsayilan} onDeger={(v) => onSecim({ ...secim, [id]: v })} />;
            }
            return null;
          })()}
        </div>
      </div>
    </ModalKabuk>
  );
}

/* ================================================================== */
/* 3) KAMERA KURULUMU — Sinematik Kameralar (referans: kamera/)        */
/* ================================================================== */
export type KameraKurulum = { kamera: string; lens: string; odak: number; diyafram: string };

export function KameraModal({
  acik, kapat, kurulum, onKurulum,
}: {
  acik: boolean; kapat: () => void;
  kurulum: KameraKurulum; onKurulum: (k: KameraKurulum) => void;
}) {
  const [sekme, setSekme] = useState<"tumu" | "onerilen" | "kayitli">("tumu");
  const [kayitlilar, setKayitlilar] = useState<KameraKurulum[]>([]);

  const sutunlar = [
    { baslik: "KAMERA", ogeler: KAMERALAR.map((k) => k.ad), deger: kurulum.kamera, rozet: (i: number) => (i % 2 === 0 ? "DİJİTAL" : "FİLM"), ayar: (v: string) => onKurulum({ ...kurulum, kamera: v }) },
    { baslik: "LENS", ogeler: LENSLER.map((l) => l.ad), deger: kurulum.lens, rozet: () => "SFERİK", ayar: (v: string) => onKurulum({ ...kurulum, lens: v }) },
    { baslik: "ODAK UZAKLIĞI", ogeler: ODAK_UZAKLIKLARI.map(String), deger: String(kurulum.odak), rozet: () => null, ayar: (v: string) => onKurulum({ ...kurulum, odak: Number(v) }) },
    { baslik: "DİYAFRAM", ogeler: DIYAFRAMLAR.map((d) => d.ad), deger: kurulum.diyafram, rozet: () => null, ayar: (v: string) => onKurulum({ ...kurulum, diyafram: v }) },
  ];

  return (
    <ModalKabuk acik={acik} kapat={kapat} genislik={1050}>
      <div className="flex shrink-0 items-center gap-2 px-6 py-5">
        <div className="inline-flex gap-1 rounded-full bg-white/[0.05] p-1">
          <SekmeHap ad="Tümü" aktif={sekme === "tumu"} onClick={() => setSekme("tumu")} />
          <SekmeHap ad="Önerilen" aktif={sekme === "onerilen"} onClick={() => setSekme("onerilen")} />
          <SekmeHap ad="Kayıtlı" aktif={sekme === "kayitli"} onClick={() => setSekme("kayitli")} />
        </div>
        <span className="flex-1" />
        <Kapat onClick={kapat} />
      </div>

      {/* 4 bağımsız çark, ortak seçim bandı.
          NOT: sabit yükseklik ŞART — `flex-1` ile modal içeriği kadar küçülüp
          çark satırları sıfır yükseklikte kalıyor ve sütunlar BOŞ görünüyordu. */}
      <div className="relative mx-6 mb-6 h-[420px] shrink-0 overflow-hidden rounded-[22px] bg-white/[0.03]">
        {/* seçim bandı çizgileri — merkez satırı kuşatır */}
        <span className="pointer-events-none absolute inset-x-0 top-[92px] h-px bg-white/10" />
        <span className="pointer-events-none absolute inset-x-0 bottom-[64px] h-px bg-white/10" />

        <div className="flex h-full items-stretch">
          {sutunlar.map((s, si) => {
            const i = Math.max(0, s.ogeler.indexOf(s.deger));
            const n = s.ogeler.length;
            const kaydir = (yon: 1 | -1) => s.ayar(s.ogeler[(i + yon + n) % n]);
            const mesafe = (j: number) => { let d = j - i; if (d > n / 2) d -= n; if (d < -n / 2) d += n; return d; };
            return (
              <div key={s.baslik} className={cn("relative flex flex-1 flex-col items-center py-4", si > 0 && "border-l border-white/[0.07]")}>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-metin-3">{s.baslik}</p>
                <button onClick={() => kaydir(-1)} aria-label="Önceki"
                  className="mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"><ChevronUp className="h-4 w-4" /></button>
                <div className="relative w-full flex-1 overflow-hidden">
                  {s.ogeler.map((o, j) => {
                    const d = mesafe(j);
                    // Kısa listelerde (n≤4) eşik kırpması sütunu boşaltıyordu.
                    if (Math.abs(d) > (n <= 4 ? n : 1.2)) return null;
                    const merkez = d === 0;
                    const sayi = s.baslik === "ODAK UZAKLIĞI";
                    return (
                      <motion.button key={o} onClick={() => s.ayar(o)} initial={false}
                        animate={{ y: d * 190, opacity: merkez ? 1 : 0.22, scale: merkez ? 1 : 0.88 }}
                        transition={{ type: "spring", stiffness: 380, damping: 34 }}
                        className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center">
                        <span className="relative flex h-[104px] w-[104px] items-center justify-center rounded-2xl bg-white/[0.06]">
                          {sayi
                            ? <span className="text-[34px] font-bold text-metin">{o}</span>
                            : <Aperture2 tur={s.baslik} />}
                          {s.rozet(j) && (
                            <span className="absolute bottom-1.5 rounded-md bg-black/60 px-1.5 py-[2px] text-[9px] font-semibold tracking-wider text-metin-2">
                              {s.rozet(j)}
                            </span>
                          )}
                        </span>
                        <span className={cn("mt-2 max-w-[150px] text-center text-[15px]", merkez ? "text-metin" : "text-metin-3")}>
                          {sayi ? "mm" : o}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
                <button onClick={() => kaydir(1)} aria-label="Sonraki"
                  className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"><ChevronDown className="h-4 w-4" /></button>
              </div>
            );
          })}
        </div>

        {/* + Kurulumu kaydet — bandın alt çizgisinde, ortada */}
        <button onClick={() => setKayitlilar((k) => [...k, kurulum])}
          className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/[0.12] px-5 py-2 text-[15px] text-metin backdrop-blur-md transition-colors hover:bg-white/20">
          <Plus className="h-4 w-4" /> Kurulumu kaydet
        </button>
      </div>
    </ModalKabuk>
  );
}

/** Kamera/lens/diyafram için basit simge (gerçek render yerine siluet). */
function Aperture2({ tur }: { tur: string }) {
  if (tur === "LENS") return (
    <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="2" opacity=".8">
      <rect x="10" y="14" width="28" height="20" rx="4" /><circle cx="24" cy="24" r="6" />
    </svg>
  );
  if (tur === "DİYAFRAM") return (
    <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="2" opacity=".8">
      <circle cx="24" cy="24" r="14" />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <line key={a} x1="24" y1="24" x2={24 + 14 * Math.cos((a * Math.PI) / 180)} y2={24 + 14 * Math.sin((a * Math.PI) / 180)} />
      ))}
    </svg>
  );
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="2" opacity=".8">
      <rect x="8" y="16" width="26" height="18" rx="3" /><path d="m34 22 8-4v14l-8-4z" />
    </svg>
  );
}

/* ================================================================== */
/* 4) YÜKLEME AKIŞI — Karakter / Moodboard / Hex (referans: ruh/)      */
/* ================================================================== */
export function YuklemeModal({
  acik, kapat, baslik, altBaslik, iyiMetin, kotuMetin, onDosya, geriDon,
}: {
  acik: boolean; kapat: () => void;
  baslik: string; altBaslik: string;
  iyiMetin?: string; kotuMetin?: string;
  onDosya: (u: string) => void;
  geriDon?: () => void;
}) {
  return (
    <ModalKabuk acik={acik} kapat={kapat} genislik={1000}>
      <div className="relative shrink-0 px-7 py-6 text-center">
        {geriDon && (
          <button onClick={geriDon} aria-label="Geri"
            className="absolute left-6 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-metin hover:bg-white/20"><ChevronLeft className="h-5 w-5" /></button>
        )}
        <h3 className="text-[20px] font-semibold text-metin">{baslik}</h3>
        <p className="mt-1 text-[14px] text-metin-3">{altBaslik}</p>
        <span className="absolute right-6 top-6"><Kapat onClick={kapat} /></span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-7">
        {/* İki eşit yükleme kutusu */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex h-[210px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl bg-white/[0.04] transition-colors hover:bg-white/[0.07]">
            <input type="file" accept="image/*" multiple hidden onChange={(e) => {
              const f = e.target.files?.[0]; e.target.value = "";
              if (f) { onDosya(URL.createObjectURL(f)); kapat(); }
            }} />
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08] text-metin"><Plus className="h-5 w-5" /></span>
            <span className="text-[15px] text-metin">Cihazdan yükle</span>
          </label>
          <button onClick={() => { onDosya(`varlik-${Date.now()}`); kapat(); }}
            className="flex h-[210px] flex-col items-center justify-center gap-3 rounded-2xl bg-white/[0.04] transition-colors hover:bg-white/[0.07]">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08] text-metin"><ImageIcon className="h-5 w-5" /></span>
            <span className="text-[15px] text-metin">Varlıklardan yükle</span>
          </button>
        </div>

        {/* İyi / kötü örnek satırları */}
        {(iyiMetin || kotuMetin) && (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {[{ metin: iyiMetin, iyi: true }, { metin: kotuMetin, iyi: false }].map((g, gi) => g.metin && (
              <div key={gi}>
                <p className="mb-2.5 flex items-center gap-2 text-[13.5px] text-metin-2">
                  <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white",
                    g.iyi ? "bg-emerald-500" : "bg-rose-500")}>
                    {g.iyi ? <Check className="h-3 w-3" strokeWidth={3} /> : <X className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  {g.metin}
                </p>
                <div className="flex gap-2">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={cn("h-[112px] flex-1 rounded-lg", !g.iyi && "ring-2 ring-rose-500/80")}
                      style={{ background: kabukArka(`ornek-${gi}-${i}`, "portre") }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ModalKabuk>
  );
}

/* ================================================================== */
/* 5) VARLIK SEÇİCİ — `+` menüsü (referans: arti/)                     */
/* ================================================================== */
export function VarlikSeciciModal({
  acik, kapat, onSec, elementler, baslangicSekme = "yuklemeler",
}: {
  acik: boolean; kapat: () => void;
  onSec: (url: string) => void;
  elementler: { id: string; ad: string; kategori?: string }[];
  /** Hangi sekmede açılsın — "/Element" doğrudan Elementler'e düşsün. */
  baslangicSekme?: "yuklemeler" | "elementler" | "uretimler" | "begeni";
}) {
  const [sekme, setSekme] = useState<"yuklemeler" | "elementler" | "uretimler" | "begeni">(baslangicSekme);
  // Modal her açılışta istenen sekmeye döner.
  useEffect(() => { if (acik) setSekme(baslangicSekme); }, [acik, baslangicSekme]);
  const ornekler = useMemo(() => Array.from({ length: 24 }, (_, i) => `varlik-${i}`), []);

  return (
    <ModalKabuk acik={acik} kapat={kapat} genislik={1180}>
      <div className="flex shrink-0 items-center gap-2 px-6 py-5">
        <div className="inline-flex gap-1 rounded-full bg-white/[0.05] p-1">
          <SekmeHap ad="Yüklemeler" aktif={sekme === "yuklemeler"} onClick={() => setSekme("yuklemeler")} />
          <SekmeHap ad="Elementler" aktif={sekme === "elementler"} onClick={() => setSekme("elementler")} />
          <SekmeHap ad="Görsel Üretimleri" aktif={sekme === "uretimler"} onClick={() => setSekme("uretimler")} />
          <SekmeHap ad="Beğenilenler" aktif={sekme === "begeni"} onClick={() => setSekme("begeni")} />
        </div>
        <span className="flex-1" />
        <Kapat onClick={kapat} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
        {sekme === "begeni" ? (
          /* Boş durum — pembe kalp rozeti */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-[20px] bg-gradient-to-br from-pink-400 to-fuchsia-600 text-white">
              <Heart className="h-8 w-8" />
            </span>
            <p className="text-[20px] font-semibold text-metin">Favori üretimlerin burada görünecek</p>
            <p className="mt-1 text-[15px] text-metin-3">Beğendiklerini işaretleyerek buraya kaydet</p>
          </div>
        ) : sekme === "elementler" ? (
          <>
            <div className="mb-3 flex items-center gap-2">
              <p className="flex-1 text-[14px] text-metin-3">Elementlerim</p>
              <button className="hf-cip flex h-9 items-center gap-2 rounded-xl px-3 text-[14px] text-metin-2"><SlidersHorizontal className="h-4 w-4" /> Filtre</button>
              <span className="hf-cip flex h-9 items-center gap-2 rounded-xl px-3 text-[14px] text-metin-3"><Search className="h-4 w-4" /> Ara</span>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
              <button className="group text-left">
                <span className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-white/[0.05] ring-1 ring-white/10 group-hover:bg-white/[0.09]">
                  <Plus className="h-6 w-6 text-metin-2" />
                </span>
                <span className="mt-2 block text-center text-[14px] font-medium text-metin">Yeni Element</span>
              </button>
              {elementler.map((el) => (
                <button key={el.id} onClick={() => { onSec(`element-${el.ad}`); kapat(); }} className="group text-left">
                  <span className="block aspect-[4/3] w-full rounded-xl ring-1 ring-white/10 transition-all group-hover:ring-white/40"
                    style={{ background: onizlemeArka(`el-${el.ad}`, "portre") }} />
                  <span className="mt-2 block truncate text-[14px] font-medium text-metin">@{el.ad}</span>
                  <span className="block truncate text-[12px] text-metin-3">{el.kategori ?? "Karakter"}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            {sekme === "yuklemeler" && (
              <div className="mb-3 flex items-center gap-2">
                <p className="flex-1 text-[14px] text-metin-3">Yüklemeler</p>
                <button className="hf-cip flex h-9 items-center gap-2 rounded-xl px-3 text-[14px] text-metin-2"><SlidersHorizontal className="h-4 w-4" /> Filtre</button>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
              {sekme === "yuklemeler" && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl bg-white/[0.05] ring-1 ring-white/10 hover:bg-white/[0.09]">
                  <input type="file" accept="image/*,video/*" hidden onChange={(e) => {
                    const f = e.target.files?.[0]; e.target.value = "";
                    if (f) { onSec(URL.createObjectURL(f)); kapat(); }
                  }} />
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-metin"><Plus className="h-5 w-5" /></span>
                  <span className="text-[13px] text-metin-2">Medya yükle</span>
                </label>
              )}
              {/* Yüklemelerde HOVER ÖNİZLEME YOK (2026-08-01): kartlar zaten
                  büyük gösteriliyor, üstüne çıkan kopya gereksizdi ve
                  komşu kartları kapatıyordu. */}
              {ornekler.map((o) => (
                <button key={o} onClick={() => { onSec(o); kapat(); }}
                  className="relative aspect-square rounded-xl ring-1 ring-white/10 transition-all hover:ring-white/40"
                  style={{ background: kabukArka(o, "sinematik") }} />
              ))}
            </div>
          </>
        )}
      </div>
    </ModalKabuk>
  );
}

/* ================================================================== */
/* 6) RENK AKTARIMI — Hex paleti (referans: renk/)                     */
/* ================================================================== */
export const HEX_PALETLER = [
  { ad: "Film renkleri", renkler: ["#8d9b6a", "#c7d2a8", "#e8e0c4", "#7f8f5e", "#4a5a38", "#2d3524"] },
  { ad: "Limon reçeli", renkler: ["#d9f24c", "#a8c93a", "#e9fb7a", "#6f8a22", "#f4ffb0", "#3d4d12"] },
  { ad: "Şeker pembe", renkler: ["#ff5fa2", "#ffa8cc", "#c92a6e", "#ffd6e7", "#8f1046", "#ff85b8"] },
  { ad: "Nostaljik mavi", renkler: ["#1e3a6e", "#3f6bb5", "#8fb4e8", "#0d1f3d", "#c5d9f5", "#5680c9"] },
  { ad: "Yumuşak palet", renkler: ["#e8ddd0", "#c9b8a3", "#a89880", "#f5efe6", "#8a7a63", "#d6c9b6"] },
  { ad: "Siyah parlak", renkler: ["#1a1a1a", "#3d3d3d", "#0a0a0a", "#5c5c5c", "#2a2a2a", "#7a7a7a"] },
];

export function RenkAktarimModal({
  acik, kapat, secili, onSec,
}: {
  acik: boolean; kapat: () => void;
  secili: string | null; onSec: (ad: string | null) => void;
}) {
  const [ekran, setEkran] = useState<"ana" | "olustur" | "manuel">("ana");
  const [palet, setPalet] = useState<string[]>(["#5ac36a", "#ffffff", "#55d6fd", "#141414"]);

  useEffect(() => { if (!acik) setEkran("ana"); }, [acik]);

  return (
    <ModalKabuk acik={acik} kapat={kapat} genislik={1050}>
      {ekran === "ana" ? (
        <>
          <div className="flex shrink-0 items-start gap-6 px-8 pt-8">
            <div className="min-w-0 flex-1">
              <h3 className="hf-baslik text-[30px] leading-[1.05] text-metin">RENKLERİNİ<br />HEX İLE YÖNET</h3>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-metin-3">
                Bir referans görsel yükle, Hex onun renklerini kendi stiline taşısın
              </p>
              <button onClick={() => setEkran("olustur")}
                className="mt-5 flex items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-bold text-zemin"
                style={{ background: "var(--sn-lime,#55d6fd)" }}>
                Yükle & Oluştur <Sparkles className="h-4 w-4" />
              </button>
            </div>
            {/* sağda örnek kart */}
            <div className="hidden w-[290px] shrink-0 overflow-hidden rounded-2xl bg-gradient-to-b from-violet-200/20 to-white/5 p-3 sm:block">
              <span className="block h-[150px] rounded-xl" style={{ background: kabukArka("hex-ornek", "portre") }} />
              <span className="mt-2 flex h-4 overflow-hidden rounded">
                {["#1e2a4a", "#7fa8d9", "#c9a0a8", "#8f9ed6", "#efe6d5", "#141414"].map((c) => (
                  <span key={c} className="flex-1" style={{ background: c }} />
                ))}
              </span>
            </div>
            <Kapat onClick={kapat} />
          </div>

          {/* Hazır paletler */}
          <div className="min-h-0 flex-1 overflow-y-auto px-8 pb-8 pt-6">
            <div className="grid grid-cols-2 gap-4 rounded-2xl bg-white/[0.03] p-4 sm:grid-cols-3 lg:grid-cols-6">
              {HEX_PALETLER.map((p) => {
                const aktif = secili === p.ad;
                return (
                  <button key={p.ad} onClick={() => { onSec(aktif ? null : p.ad); kapat(); }} className="group text-left">
                    <span className="relative block aspect-[3/3.4] w-full overflow-hidden rounded-xl transition-all"
                      style={{
                        background: kabukArka(`palet-${p.ad}`, "sinematik"),
                        boxShadow: aktif ? "0 0 0 2px var(--sn-lime,#55d6fd)" : "inset 0 0 0 1px rgba(255,255,255,0.08)",
                      }}>
                      {aktif && (
                        <span className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-zemin"
                          style={{ background: "var(--sn-lime,#55d6fd)" }}><Check className="h-4 w-4" strokeWidth={3} /></span>
                      )}
                      {/* alt renk şeridi */}
                      <span className="absolute inset-x-0 bottom-0 flex h-3.5">
                        {p.renkler.map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}
                      </span>
                    </span>
                    <span className={cn("mt-2 block truncate text-center text-[14px]", aktif ? "font-medium text-metin" : "text-metin-2")}>{p.ad}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : ekran === "olustur" ? (
        <>
          <div className="relative shrink-0 px-7 py-6 text-center">
            <button onClick={() => setEkran("ana")} aria-label="Geri"
              className="absolute left-6 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-metin hover:bg-white/20"><ChevronLeft className="h-5 w-5" /></button>
            <h3 className="text-[20px] font-semibold text-metin">Vayra Hex</h3>
            <p className="mt-1 text-[14px] text-metin-3">Devam etmek için fotoğraf yükle ya da elle oluştur</p>
            <span className="absolute right-6 top-6"><Kapat onClick={kapat} /></span>
          </div>
          <div className="grid grid-cols-1 gap-4 px-7 pb-8 sm:grid-cols-2">
            <label className="flex h-[220px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07]">
              <input type="file" accept="image/*" hidden onChange={() => { onSec("Özel palet"); kapat(); }} />
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08] text-metin"><Plus className="h-5 w-5" /></span>
              <span className="text-[15px] text-metin">Cihazdan yükle</span>
            </label>
            <button onClick={() => setEkran("manuel")}
              className="flex h-[220px] flex-col items-center justify-center gap-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07]">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08] text-metin"><Palette2 /></span>
              <span className="text-[15px] text-metin">Renkleri elle seç</span>
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="relative flex shrink-0 items-center px-7 py-6">
            <button onClick={() => setEkran("olustur")} aria-label="Geri"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-metin hover:bg-white/20"><ChevronLeft className="h-5 w-5" /></button>
            <span className="flex-1 text-center">
              <h3 className="text-[20px] font-semibold text-metin">Vayra Hex</h3>
              <p className="mt-1 text-[14px] text-metin-3">Devam etmek için elle oluştur</p>
            </span>
            <button onClick={() => { onSec("Özel palet"); kapat(); }}
              className="rounded-full bg-white px-4 py-2 text-[14px] font-semibold text-zemin">Paleti kaydet</button>
          </div>
          <div className="grid grid-cols-1 gap-4 px-7 pb-8 sm:grid-cols-2">
            {/* Mevcut palet */}
            <div className="rounded-2xl bg-white/[0.04] p-5">
              <div className="mb-4 flex items-center">
                <span className="flex-1 text-[15px] font-semibold text-metin">Mevcut palet</span>
                <button onClick={() => setPalet([])} className="text-[13px] text-metin-3 hover:text-metin">Tümünü temizle</button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-dashed border-white/25 text-metin-3 hover:text-metin">
                  <input type="color" hidden onChange={(e) => setPalet((p) => [...p, e.target.value])} />
                  <Plus className="h-4 w-4" />
                </label>
                {palet.map((c, i) => (
                  <button key={i} onClick={() => setPalet((p) => p.filter((_, j) => j !== i))}
                    className={cn("h-12 w-12 rounded-full", i === 0 && "ring-2 ring-white")}
                    style={{ background: c }} aria-label={`Renk ${i + 1}`} />
                ))}
              </div>
            </div>
            {/* Rastgele paletler */}
            <div className="rounded-2xl bg-white/[0.04] p-5">
              <div className="mb-4 flex items-center">
                <span className="flex-1 text-[15px] font-semibold text-metin">Rastgele paletler</span>
                <Dices className="h-[18px] w-[18px] text-metin-3" />
              </div>
              <div className="space-y-2.5">
                {HEX_PALETLER.slice(0, 4).map((p) => (
                  <button key={p.ad} onClick={() => setPalet(p.renkler)}
                    className="flex h-9 w-full overflow-hidden rounded-full ring-1 ring-white/10 transition-all hover:ring-white/40">
                    {p.renkler.map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </ModalKabuk>
  );
}

/* ================================================================== */
/* 7) YENİ PROJE — sidebar "Yeni proje" (referans: sidebar/)           */
/* ================================================================== */
export function YeniProjeModalHF({
  acik, kapat, onOlustur,
}: {
  acik: boolean; kapat: () => void; onOlustur: (ad: string, ozel: boolean) => void;
}) {
  const [ad, setAd] = useState("");
  const [ozel, setOzel] = useState(true);
  useEffect(() => { if (!acik) { setAd(""); setOzel(true); } }, [acik]);

  return (
    <ModalKabuk acik={acik} kapat={kapat} genislik={630}>
      <div className="flex shrink-0 items-center px-6 pt-6">
        <h3 className="flex-1 text-[19px] font-bold text-metin">Yeni proje</h3>
        <Kapat onClick={kapat} />
      </div>
      <div className="px-6 pb-6 pt-8">
        {/* Ortada büyük ad girişi */}
        <input value={ad} onChange={(e) => setAd(e.target.value)} autoFocus placeholder="Projem"
          className="w-full bg-transparent text-center text-[38px] font-bold text-metin outline-none placeholder:text-metin-3" />
        {/* Görünürlük hapı */}
        <div className="mt-6 flex justify-center">
          <button onClick={() => setOzel((v) => !v)}
            className="flex items-center gap-2 rounded-full bg-white/[0.08] px-4 py-2 text-[15px] text-metin transition-colors hover:bg-white/[0.13]">
            {ozel ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
            {ozel ? "Özel proje" : "Herkese açık proje"}
          </button>
        </div>
        {/* Yükseltme bandı */}
        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white/[0.06] p-4">
          <UserRound className="h-5 w-5 shrink-0 text-metin-3" />
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-medium text-metin">Ekibinle çalışmak ister misin?</span>
            <span className="block text-[13.5px] text-metin-3">Kişi davet etmek için planını yükselt</span>
          </span>
          <button className="shrink-0 rounded-full px-4 py-1.5 text-[14px] font-bold text-zemin"
            style={{ background: "var(--sn-lime,#55d6fd)" }}>Yükselt</button>
        </div>
        {/* Oluştur — ad boşken pasif */}
        <button onClick={() => { if (ad.trim()) { onOlustur(ad.trim(), ozel); kapat(); } }}
          disabled={!ad.trim()}
          className={cn("mt-5 h-[58px] w-full rounded-2xl text-[18px] font-semibold transition-colors",
            ad.trim() ? "bg-white text-zemin hover:bg-white/90" : "cursor-not-allowed bg-white/[0.08] text-metin-3")}>
          Oluştur
        </button>
      </div>
    </ModalKabuk>
  );
}

function Palette2() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="9" cy="9" r="5" /><circle cx="15" cy="9" r="5" /><circle cx="12" cy="15" r="5" />
    </svg>
  );
}
