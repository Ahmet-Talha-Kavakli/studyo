"use client";

import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronLeft, ChevronRight, Sparkles, ImageIcon, Play, Zap,
  RectangleHorizontal, Square, RectangleVertical, Crown, Share2, Users, Heart, Coins,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { useAktifProje } from "@/lib/useAktifProje";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { gradientOnizleme, onizlemeArka, saltUrl, cn } from "@/lib/utils";
import { PRESETLER, PRESET_KATEGORILER, HAZIR_VIDEOLAR, type Preset } from "@/lib/presetVeri";
import { usePaylasim, toplulukPaylasimlar, type Paylasim } from "@/store/usePaylasim";
import { PaylasimModal } from "@/components/panel/PaylasimModal";

/**
 * Viral Presetler — Vayra düzenine getirildi (element/kazan stüdyolarıyla aynı dil).
 * Kompakt hero (lime ikon + başlık) + sticky kategori filtre bar + temiz 9:16 kart
 * galeri (2→6 sütun, hover'da "Şimdi dene") + PanelFooter. Detay modal + gerçek Üret.
 */

const ORANLAR = [
  { id: "16:9", ikon: RectangleHorizontal },
  { id: "1:1", ikon: Square },
  { id: "9:16", ikon: RectangleVertical },
] as const;

function rozetMetin(p: Preset) { return p.rozet === "marka" ? `${p.marka} ile` : p.rozet; }

export default function PresetlerPage() {
  const { aktifProjeId } = useAktifProje();
  const [kategori, setKategori] = useState("TÜMÜ");
  const [acikIdx, setAcikIdx] = useState<number | null>(null);
  const [oran, setOran] = useState("16:9");
  const [medya, setMedya] = useState<string | null>(null);
  const [uretiliyor, setUretiliyor] = useState(false);
  const [sekme, setSekme] = useState<"resmi" | "topluluk">("resmi"); // M20 topluluk
  const [paylasAcik, setPaylasAcik] = useState(false);
  const dosyaRef = useRef<HTMLInputElement>(null);

  const gorunen = useMemo(() =>
    kategori === "TÜMÜ" ? PRESETLER : PRESETLER.filter((p) => p.kategoriler.includes(kategori)),
    [kategori]);
  const acik = acikIdx !== null ? gorunen[acikIdx] : null;

  useScrollKilit(acik !== null);
  useEscKapat(acik !== null, () => setAcikIdx(null));

  const modalAc = (p: Preset) => { setAcikIdx(gorunen.indexOf(p)); setOran("16:9"); setMedya(null); };
  const gez = (yon: 1 | -1) => {
    if (acikIdx === null) return;
    const y = (acikIdx + yon + gorunen.length) % gorunen.length;
    setAcikIdx(y); setOran("16:9"); setMedya(null);
  };
  const dosyaSecildi = (f: FileList | null) => {
    if (!f?.length) return;
    setMedya(f[0].name);
    toast.success("Medya yüklendi 📎", { description: f[0].name });
  };

  const uret = () => {
    if (!acik) return;
    if (!medya) return toast.error("Önce bir medya yükle.");
    setUretiliyor(true);
    const sonuc = uretimBaslat({
      baslik: `${acik.ad} preset`, tur: "video", model: "Vayra Preset", prompt: `${acik.ad}: ${acik.aciklama} · ${oran}`,
      kredi: acik.kredi, arac: "Viral Presetler", projeId: aktifProjeId ?? undefined, meta: { oran },
    });
    if (!sonuc.ok) { setUretiliyor(false); return uretimHataToast(sonuc); }
    toast.success("Preset üretiliyor ✦", { description: `${acik.ad} · ${oran} · ${acik.kredi} kredi` });
    setTimeout(() => { setUretiliyor(false); setAcikIdx(null); }, 1600);
  };

  return (
    <div className="sinema-kapsam min-h-[calc(100vh-3rem)] bg-[var(--sn-zemin)] text-[var(--sn-metin)]">
      <input ref={dosyaRef} type="file" accept="image/*,video/*" hidden onChange={(e) => { dosyaSecildi(e.target.files); e.target.value = ""; }} />

      {/* ═══ KOMPAKT HERO (element/kazan dili) ═══ */}
      <div className="mx-auto max-w-[1500px] px-4 pt-8 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-aksan to-emerald-400 text-zemin">
              <Zap className="h-6 w-6" strokeWidth={2.4} />
            </span>
            <div>
              <h1 className="text-[26px] font-extrabold tracking-tight text-white sm:text-[30px]">Viral Presetler</h1>
              <p className="mt-0.5 max-w-2xl text-[14.5px] text-metin-3">
                Sinematik oyun girişlerinden Y2K paparazzi kliplerine — <span className="text-aksan">tek tık</span> trend format.
              </p>
            </div>
          </div>
          {/* m26: Preset oluştur — belirgin CTA (AI ile preset oluşturma akışı) */}
          <button onClick={() => setPaylasAcik(true)}
            className="flex shrink-0 items-center gap-2 rounded-full bg-aksan px-5 py-2.5 text-[14px] font-bold text-zemin transition-transform hover:scale-105">
            <Sparkles className="h-4 w-4" /> Preset oluştur
          </button>
        </div>

        {/* m26: Resmi / Topluluk sekmesi — BELİRGİN büyük segment (sağ üstte küçük
            değil; sola, başlık altına, dikkat çeker). */}
        <div className="mt-6 flex items-center gap-1 rounded-full bg-white/[0.05] p-1 ring-1 ring-inset ring-white/10 sm:w-fit">
          {([["resmi", "Resmi Presetler", Sparkles], ["topluluk", "Topluluk", Users]] as const).map(([id, et, Ik]) => (
            <button key={id} onClick={() => setSekme(id)}
              className={cn("flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-2.5 text-[14px] font-semibold transition-colors sm:flex-initial",
                sekme === id ? "bg-aksan text-zemin shadow-[0_1px_10px_-2px_rgba(85, 214, 253,0.5)]" : "text-white/70 hover:text-white")}>
              <Ik className="h-4 w-4" /> {et}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ STICKY KATEGORİ FİLTRE BAR (yalnız Resmi sekmesinde) ═══ */}
      {sekme === "resmi" && (
        <div className="sticky top-12 z-20 mt-6 border-y border-white/[0.06] bg-[var(--sn-zemin)]/85 backdrop-blur-md">
          <div className="mx-auto max-w-[1500px] px-4 sm:px-8">
            <div className="flex items-center gap-1.5 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {PRESET_KATEGORILER.map((k) => (
                <button key={k} onClick={() => setKategori(k)}
                  className={cn("h-9 shrink-0 rounded-full px-4 text-[13px] font-semibold uppercase tracking-wide transition-colors",
                    kategori === k ? "bg-aksan text-zemin" : "bg-white/[0.04] text-metin-2 hover:bg-white/[0.08] hover:text-white")}>
                  {k}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TOPLULUK GRID (M20) ═══ */}
      {sekme === "topluluk" ? (
        <ToplulukGrid onPaylas={() => setPaylasAcik(true)} />
      ) : (
      /* ═══ GALERİ — temiz 9:16 dikey kartlar (2→6 sütun) ═══ */
      <div className="mx-auto max-w-[1500px] px-4 pb-12 pt-6 sm:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {gorunen.map((p) => (
            <motion.button key={p.ad} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              onClick={() => modalAc(p)}
              className="group/kart relative aspect-[9/16] overflow-hidden rounded-2xl ring-1 ring-white/10 transition-all hover:ring-2 hover:ring-aksan"
              style={{ background: gradientOnizleme(p.ad) }}>
              {/* GERÇEK preset videosu — sayfa açılınca sürekli döngüde oynar (yoksa gradyan zemin kalır) */}
              {HAZIR_VIDEOLAR.has(p.video) && (
                <video
                  src={`/gercek/preset-video/${p.video}.mp4`}
                  autoPlay muted loop playsInline preload="auto"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              {/* okunabilirlik gradyanı */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/25" />
              {p.premium && (
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 backdrop-blur-sm">
                  <Crown className="h-2.5 w-2.5 fill-current" /> PREMIUM
                </span>
              )}
              {/* hover: karart + "Şimdi dene" + preset adı overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/45 opacity-0 backdrop-blur-[1px] transition-opacity group-hover/kart:opacity-100">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-aksan text-zemin shadow-lg">
                  <Play className="ml-0.5 h-5 w-5 fill-current" />
                </span>
                <span className="rounded-full bg-aksan px-3 py-1 text-[12px] font-bold text-zemin">Şimdi dene</span>
              </div>
              {/* alt bilgi */}
              <div className="absolute inset-x-0 bottom-0 p-2.5">
                <span className="block truncate text-[12.5px] font-bold leading-tight text-white drop-shadow">{p.ad}</span>
                <span className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-white/70">
                  <Sparkles className="h-2.5 w-2.5 text-aksan" />{p.kredi} kredi
                </span>
              </div>
            </motion.button>
          ))}
        </div>
        {gorunen.length === 0 && <p className="py-20 text-center text-sm text-metin-3">Bu kategoride preset yok.</p>}
      </div>
      )}


      {/* ═══ PRESET DETAY MODALI ═══ */}
      <AnimatePresence>
        {acik && (
          <div className="fixed inset-0 z-[70] flex flex-col overflow-y-auto md:items-center md:justify-center md:overflow-hidden md:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setAcikIdx(null)} />
            <button onClick={() => setAcikIdx(null)} aria-label="Kapat"
              className="fixed right-4 top-4 z-[10] flex h-11 w-11 items-center justify-center rounded-full border border-aksan/60 bg-black/50 text-white backdrop-blur-sm md:hidden">
              <X className="h-5 w-5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); gez(-1); }} className="absolute left-4 top-1/2 hf-btn glass-cip z-10 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full text-white md:flex" aria-label="Önceki"><ChevronLeft className="h-6 w-6" /></button>
            <button onClick={(e) => { e.stopPropagation(); gez(1); }} className="absolute right-4 top-1/2 hf-btn glass-cip z-10 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full text-white md:flex" aria-label="Sonraki"><ChevronRight className="h-6 w-6" /></button>

            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
              className="relative flex min-h-full w-full flex-col overflow-hidden bg-[#161616] md:grid md:min-h-0 md:max-w-5xl md:grid-cols-[1.4fr_1fr] md:rounded-2xl md:border md:border-[var(--sn-kenar)]">
              <div className="relative aspect-[3/4] overflow-hidden bg-black md:aspect-auto" style={{ background: gradientOnizleme(acik.ad) }}>
                {/* GERÇEK preset videosu — modal açıkken otomatik oynar (yoksa gradyan) */}
                {HAZIR_VIDEOLAR.has(acik.video) && (
                  <video
                    key={acik.video}
                    src={`/gercek/preset-video/${acik.video}.mp4`}
                    autoPlay muted loop playsInline
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
              </div>
              <div className="flex flex-col p-5 md:p-6">
                <div className="mb-3 flex items-start justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-metin-3">{rozetMetin(acik)}</span>
                  <button onClick={() => setAcikIdx(null)} className="hf-btn glass-cip hidden h-8 w-8 items-center justify-center rounded-full text-metin-2 hover:text-metin md:flex" aria-label="Kapat"><X className="h-5 w-5" /></button>
                </div>
                <h2 className="hf-baslik text-2xl text-metin sm:text-3xl">{acik.ad}</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-metin-2">{acik.aciklama}</p>

                <button onClick={() => dosyaRef.current?.click()}
                  className="hf-btn glass-cip mt-5 flex aspect-[16/7] w-full flex-col items-center justify-center gap-2 rounded-2xl text-center">
                  <span className="glass-cip flex h-11 w-11 items-center justify-center rounded-full text-metin-2"><ImageIcon className="h-5 w-5" /></span>
                  <span className="text-[14px] font-semibold text-metin">{medya ?? "Medya yükle"}</span>
                  {!medya && <span className="text-[12px] text-metin-3">Sürükle-bırak veya tıklayarak yükle</span>}
                </button>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {ORANLAR.map((o) => (
                    <button key={o.id} onClick={() => setOran(o.id)}
                      className={cn("hf-btn flex flex-col items-center gap-1.5 rounded-xl py-3",
                        oran === o.id ? "glass-cip-aktif text-aksan" : "glass-cip text-metin-2 hover:text-metin")}>
                      <o.ikon className="h-5 w-5" />
                      <span className="text-[12px] font-medium">{o.id}</span>
                    </button>
                  ))}
                </div>

                <button onClick={uret} disabled={!medya || uretiliyor}
                  className="hf-uret mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold disabled:cursor-not-allowed">
                  {uretiliyor ? <RefreshingDots /> : <><Sparkles className="h-4 w-4" /> Üret ✦ {acik.kredi}</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {paylasAcik && <PaylasimModal onKapat={() => setPaylasAcik(false)} varsayilan={{ tur: "preset" }} />}
      </AnimatePresence>
    </div>
  );
}

/** Topluluk paylaşımları grid'i (M20) — kullanıcı + kurgusal paylaşımlar. */
function ToplulukGrid({ onPaylas }: { onPaylas: () => void }) {
  const benimPaylasimlar = usePaylasim((s) => s.benimPaylasimlar);
  const gizlenen = usePaylasim((s) => s.gizlenen);
  const begenilenler = usePaylasim((s) => s.begenilenler);
  const begeniToggle = usePaylasim((s) => s.begeniToggle);
  const kullanildi = usePaylasim((s) => s.kullanildi);
  const paylasimKaldir = usePaylasim((s) => s.paylasimKaldir);

  const liste = useMemo(() => toplulukPaylasimlar(benimPaylasimlar, gizlenen, begenilenler)
    .filter((p) => p.tur === "preset"), [benimPaylasimlar, gizlenen, begenilenler]);

  return (
    <div className="mx-auto max-w-[1500px] px-4 pb-12 pt-6 sm:px-8">
      {/* CTA bandı */}
      <div className="mb-5 flex flex-col items-start justify-between gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300"><Coins className="h-5 w-5" /></span>
          <div>
            <p className="text-[15px] font-bold text-white">Kendi preset'ini paylaş, kazan</p>
            <p className="text-[13px] text-metin-3">Paylaşımın kullanıldıkça Para Kazan'da kredi biriktirir.</p>
          </div>
        </div>
        <button onClick={onPaylas} className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-[14px] font-bold text-white hover:scale-[1.02]"><Share2 className="h-4 w-4" /> Paylaş</button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {liste.map((p) => (
          <ToplulukKart key={p.id} p={p} begenili={begenilenler.includes(p.id)}
            onBegen={() => begeniToggle(p.id)} onKullan={() => { kullanildi(p.id); toast.success(`"${p.ad}" uygulanıyor ✦`, { description: p.benimMi ? "Kendi presetin" : `${p.yazar} tarafından` }); }}
            onKaldir={p.benimMi ? () => { paylasimKaldir(p.id); toast.success("Paylaşımın kaldırıldı"); } : undefined} />
        ))}
      </div>
      {liste.length === 0 && <p className="py-20 text-center text-sm text-metin-3">Henüz topluluk preseti yok. İlk paylaşan sen ol!</p>}
    </div>
  );
}

function ToplulukKart({ p, begenili, onBegen, onKullan, onKaldir }: {
  p: Paylasim; begenili: boolean; onBegen: () => void; onKullan: () => void; onKaldir?: () => void;
}) {
  const arka = onizlemeArka(p.tohum, p.kategori);
  return (
    <div className="group/kart relative aspect-[9/16] overflow-hidden rounded-2xl ring-1 ring-white/10 transition-all hover:ring-2 hover:ring-aksan"
      style={{ background: arka }}>
      {(() => { const u = saltUrl(arka); return u ? <img src={u} alt={p.ad} className="absolute inset-0 h-full w-full object-cover" /> : null; })()}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/25" />
      {p.benimMi && <span className="absolute left-2 top-2 rounded-md bg-aksan px-1.5 py-0.5 text-[9px] font-bold text-zemin">SENİN</span>}
      {onKaldir && (
        <button onClick={onKaldir} className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover/kart:opacity-100 hover:bg-rose-500/70"><X className="h-3.5 w-3.5" /></button>
      )}
      {/* hover: kullan */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/45 opacity-0 backdrop-blur-[1px] transition-opacity group-hover/kart:opacity-100">
        <button onClick={onKullan} className="flex items-center gap-1.5 rounded-full bg-aksan px-4 py-2 text-[12px] font-bold text-zemin"><Play className="h-3.5 w-3.5 fill-current" /> Kullan</button>
      </div>
      {/* alt bilgi */}
      <div className="absolute inset-x-0 bottom-0 p-2.5">
        <span className="block truncate text-[12.5px] font-bold leading-tight text-white drop-shadow">{p.ad}</span>
        <span className="block truncate text-[10px] text-white/60">{p.yazar}</span>
        <div className="mt-1 flex items-center justify-between">
          <span className="flex items-center gap-1 text-[10px] text-white/70"><Play className="h-2.5 w-2.5" /> {p.kullanim >= 1000 ? (p.kullanim / 1000).toFixed(1) + "K" : p.kullanim}</span>
          <button onClick={onBegen} className="flex items-center gap-1 text-[10px] text-white/70 hover:text-rose-300">
            <Heart className={cn("h-3 w-3", begenili && "fill-rose-500 text-rose-500")} /> {p.begeni >= 1000 ? (p.begeni / 1000).toFixed(1) + "K" : p.begeni}
          </button>
        </div>
      </div>
    </div>
  );
}

function RefreshingDots() {
  return <span className="flex items-center gap-1">{[0, 1, 2].map((i) => <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-zemin" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />)}</span>;
}
