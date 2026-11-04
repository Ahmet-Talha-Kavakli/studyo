"use client";

import { Yuzen } from "@/components/ui/Yuzen";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Info, MessageSquare, Copy, ChevronUp, RotateCw, Download, Heart,
  Share2, MoreHorizontal, Play, Pause, Volume2, Maximize2, Captions,
  ChevronDown, Check, Trash2, Languages, AudioLines, TrendingUp, Link2,
  Upload, FolderInput, Clock3, Smile, PenLine, ArrowUp, Search, SlidersHorizontal,
  CheckCircle2, EyeOff, ArrowDownUp, MoreVertical,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import type { Uretim } from "@/store/useProjeler";
import { saltUrl, onizlemeArka, cn } from "@/lib/utils";
import { uretimIndir } from "@/lib/gercekEylem";

/* ============================================================
   PAZARLAMA IŞIK KUTUSU (lightbox) — referanslar/marketing/generations birebir.

   Referans yapısı:
     · arka plan = varlığın BULANIK, karartılmış büyütülmüş kopyası
       (düz siyah perde DEĞİL — renk varlığa göre değişir)
     · ortada 9:16 video sahnesi
     · SAĞDA yüzen yuvarlak bilgi paneli (yaklaşık 225px, flush değil)
         başlık: avatar + kullanıcı adı / "Yazar" + ✕
         sekmeler: Bilgi | Yorumlar
         Bilgi → İSTEM (Kopyala) · DETAYLAR (Model/Tür/Mod/Kalite/Boyut/Oluşturulma)
         alt: lime "Yeniden üret" + [İndir][♥][↗][•••]
     · altta oynatıcı: lime dolgu ilerleme çubuğu + kontroller
   ============================================================ */

interface PazYorum {
  id: string;
  ad: string;
  zaman: string;
  metin: string;
  /** Bağlı olduğu video aralığı (saniye). */
  bas: number;
  son: number;
  cozuldu: boolean;
  tepki: string | null;
}

/* Hızlı art arda yorumlarda Date.now() çakışabilir — artan sayaç ekle. */
let yorumSayac = 0;
const yeniYorumId = () => `y-${Date.now().toString(36)}-${++yorumSayac}`;

export function PazIsikKutusu({
  uretim, onKapat, onFavori, onSil, onYenidenUret,
}: {
  uretim: Uretim | null;
  onKapat: () => void;
  onFavori: () => void;
  onSil: () => void;
  onYenidenUret: () => void;
}) {
  const [sekme, setSekme] = useState<"bilgi" | "yorum">("bilgi");
  const [oynuyor, setOynuyor] = useState(true);
  const [ilerleme, setIlerleme] = useState(25);
  const [hiz, setHiz] = useState(1);
  const [hizAcik, setHizAcik] = useState(false);
  const [zamanAcik, setZamanAcik] = useState(false);
  const [zamanBicim, setZamanBicim] = useState<"standart" | "kod">("standart");
  const [ustAcik, setUstAcik] = useState(false);
  const [yorumlar, setYorumlar] = useState<PazYorum[]>([]);
  const [yorumMetin, setYorumMetin] = useState("");
  /** Yorumun bağlanacağı zaman aralığı — lime seçici (referans: 00:05 – 00:06). */
  const [aralik, setAralik] = useState<{ bas: number; son: number } | null>(null);
  const [yorumAra, setYorumAra] = useState("");
  const [filtreAcik, setFiltreAcik] = useState(false);
  const [yalnizCozulen, setYalnizCozulen] = useState(false);
  const [yorumlarGizli, setYorumlarGizli] = useState(false);
  const [siraTarih, setSiraTarih] = useState(false);
  const [yorumMenu, setYorumMenu] = useState<string | null>(null);
  const [duzenlenen, setDuzenlenen] = useState<string | null>(null);
  const [duzenMetin, setDuzenMetin] = useState("");
  const [detayAcik, setDetayAcik] = useState(true);

  const acik = Boolean(uretim);
  useScrollKilit(acik);
  useEscKapat(acik, onKapat);

  useEffect(() => {
    if (!acik) { setSekme("bilgi"); setUstAcik(false); }
  }, [acik]);

  if (!uretim) return null;

  const url = saltUrl(uretim.gorselUrl);
  const tarih = new Date(uretim.olusturma).toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  });

  const sn = (v: number) => `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(Math.floor(v % 60)).padStart(2, "0")}`;

  const yorumEkle = () => {
    const t = yorumMetin.trim();
    if (!t) return;
    const a = aralik ?? { bas: Math.round((ilerleme / 100) * 8), son: Math.round((ilerleme / 100) * 8) + 1 };
    setYorumlar((y) => [...y, {
      id: yeniYorumId(), ad: "Sen", zaman: "şimdi", metin: t,
      bas: a.bas, son: a.son, cozuldu: false, tepki: null,
    }]);
    setYorumMetin("");
    setAralik(null);
  };

  const yorumSil = (id: string) => setYorumlar((y) => y.filter((x) => x.id !== id));
  const cozuldu = (id: string) => setYorumlar((y) => y.map((x) => (x.id === id ? { ...x, cozuldu: !x.cozuldu } : x)));
  const tepkiVer = (id: string) => setYorumlar((y) => y.map((x) => (x.id === id ? { ...x, tepki: x.tepki ? null : "👍" } : x)));

  /* Süzme + sıralama (Filtre menüsü) */
  const gorunenYorumlar = (() => {
    let l = yorumlar;
    if (yalnizCozulen) l = l.filter((x) => x.cozuldu);
    const q = yorumAra.trim().toLocaleLowerCase("tr");
    if (q) l = l.filter((x) => `${x.ad} ${x.metin}`.toLocaleLowerCase("tr").includes(q));
    return siraTarih ? [...l].reverse() : l;
  })();

  return (
    <AnimatePresence>
      {acik && (
        <div className="fixed inset-0 z-[210]">
          {/* ── arka plan: varlığın bulanık kopyası ── */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onKapat} className="absolute inset-0 overflow-hidden bg-[#141414]">
            {url && (
              <img src={url} alt="" aria-hidden
                className="h-full w-full scale-125 object-cover"
                style={{ filter: "blur(80px) brightness(0.55)" }} />
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.18 }}
            className="relative flex h-full items-stretch gap-5 p-5">

            {/* ── sahne ── */}
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex min-h-0 flex-1 items-center justify-center">
                <div className="relative h-full max-h-[calc(100vh-190px)] overflow-hidden"
                  style={{ aspectRatio: "9/16" }}>
                  {url
                    ? <img src={url} alt={uretim.baslik} className="h-full w-full object-cover" />
                    : <span className="block h-full w-full" style={{ background: uretim.gorselUrl }} />}
                </div>
              </div>

              {/* ── oynatıcı ── */}
              <div className="shrink-0 pt-4">
                <div className="relative h-[3px] w-full cursor-pointer rounded-full bg-white/25"
                  onClick={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    setIlerleme(Math.round(((e.clientX - r.left) / r.width) * 100));
                  }}>
                  <span className="absolute inset-y-0 left-0 rounded-full"
                    style={{ width: `${ilerleme}%`, background: "var(--sn-lime,#dff641)" }} />
                  <span className="absolute top-1/2 h-[14px] w-[4px] -translate-y-1/2 rounded-[2px] bg-white"
                    style={{ left: `calc(${ilerleme}% - 2px)` }} />

                  {/* Yorum işaretçileri — çizelge üzerinde avatar noktaları */}
                  {!yorumlarGizli && yorumlar.map((y) => (
                    <button key={y.id}
                      onClick={(e) => { e.stopPropagation(); setSekme("yorum"); setIlerleme(Math.round((y.bas / 8) * 100)); }}
                      title={`${sn(y.bas)} · ${y.metin}`}
                      className="absolute top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-[#F2662C] text-[10px] font-bold text-white ring-2 ring-white"
                      style={{ left: `calc(${(y.bas / 8) * 100}% - 10px)` }}>
                      {y.ad.charAt(0)}
                    </button>
                  ))}
                </div>

                {/* ── Aralık seçici şeridi (lime) — yorum için zaman aralığı ── */}
                <AnimatePresence>
                  {aralik && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 26 }} exit={{ opacity: 0, height: 0 }}
                      className="relative mt-1.5 w-full">
                      <span className="absolute inset-y-0 rounded-[4px] border"
                        style={{
                          left: `${(aralik.bas / 8) * 100}%`,
                          width: `${((aralik.son - aralik.bas) / 8) * 100}%`,
                          background: "rgba(223,246,65,0.16)",
                          borderColor: "var(--sn-lime,#dff641)",
                        }}>
                        <span className="absolute inset-y-0 left-0 w-[3px] rounded-l-[3px]" style={{ background: "var(--sn-lime,#dff641)" }} />
                        <span className="absolute inset-y-0 right-0 w-[3px] rounded-r-[3px]" style={{ background: "var(--sn-lime,#dff641)" }} />
                      </span>
                      <button onClick={() => setAralik(null)} aria-label="Aralığı kaldır"
                        className="absolute right-0 top-0 flex h-[22px] w-[22px] items-center justify-center rounded-[5px] bg-[#3A3A3A] text-white transition-colors hover:bg-[#4A4A4A]"
                        style={{ left: `calc(${(aralik.son / 8) * 100}% + 6px)` }}>
                        <X className="h-3 w-3" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-3.5 flex items-center gap-4">
                  <button onClick={() => setOynuyor((v) => !v)} aria-label={oynuyor ? "Duraklat" : "Oynat"}
                    className="text-white transition-opacity hover:opacity-75">
                    {oynuyor ? <Pause className="h-[18px] w-[18px]" fill="currentColor" /> : <Play className="h-[18px] w-[18px]" fill="currentColor" />}
                  </button>

                  {/* hız */}
                  <div className="relative">
                    <button onClick={() => setHizAcik((v) => !v)}
                      className="flex h-[22px] items-center rounded-[6px] border border-[#8A8A8A] px-2 text-[13px] text-white">
                      {hiz}×
                    </button>
                    <AnimatePresence>
                      <Yuzen acik={!!(hizAcik)} onKapat={() => setHizAcik(false)} alt={"tam"} sol={0} bosluk={12}><motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                            className="w-[285px] rounded-[16px] bg-[#3A3A3A] p-4">
                            <p className="text-[15px] font-semibold text-white">Oynatma hızı</p>
                            <div className="mt-3 flex justify-between text-[13px]">
                              {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75].map((h) => (
                                <button key={h} onClick={() => { setHiz(h); setHizAcik(false); }}
                                  className={cn(h === hiz ? "text-white" : "text-[#9A9A9A] hover:text-white")}>
                                  {h}
                                </button>
                              ))}
                            </div>
                          </motion.div></Yuzen>
                    </AnimatePresence>
                  </div>

                  <button aria-label="Ses" className="text-white transition-opacity hover:opacity-75">
                    <Volume2 className="h-[18px] w-[18px]" />
                  </button>

                  {/* zaman */}
                  <div className="relative ml-auto mr-auto flex items-center gap-1">
                    <span className="text-[15px] tabular-nums text-white">
                      {zamanBicim === "standart" ? "0:02 / 0:08" : "00:00:02:120 / 00:00:08:000"}
                    </span>
                    <button onClick={() => setZamanAcik((v) => !v)} aria-label="Zaman biçimi">
                      <ChevronDown className="h-4 w-4 text-white/70" />
                    </button>
                    <AnimatePresence>
                      <Yuzen acik={!!(zamanAcik)} onKapat={() => setZamanAcik(false)} alt={"tam"} ortala bosluk={12}><motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                            className="w-[200px] rounded-[14px] bg-[#4A4A4A] p-2.5">
                            <p className="px-1 pb-1.5 text-[13px] text-[#9A9A9A]">Zaman biçimi</p>
                            {([["standart", "Standart", "1:23"], ["kod", "Zaman kodu", "00:01:23:456"]] as const).map(([k, ad, alt]) => (
                              <button key={k} onClick={() => { setZamanBicim(k); setZamanAcik(false); }}
                                className={cn("flex w-full items-center gap-2 rounded-[8px] px-2 py-1.5 text-left transition-colors",
                                  zamanBicim === k ? "bg-[#5A5A5A]" : "hover:bg-white/10")}>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-[15px] text-white">{ad}</span>
                                  <span className="block text-[12px] text-[#A5A5A5]">{alt}</span>
                                </span>
                                {zamanBicim === k && <Check className="h-4 w-4 text-white" />}
                              </button>
                            ))}
                          </motion.div></Yuzen>
                    </AnimatePresence>
                  </div>

                  <button aria-label="Altyazı" className="text-white transition-opacity hover:opacity-75">
                    <Captions className="h-[17px] w-[17px]" />
                  </button>
                  <button aria-label="Tam ekran" className="text-white transition-opacity hover:opacity-75">
                    <Maximize2 className="h-[17px] w-[17px]" />
                  </button>
                </div>
              </div>
            </div>

            {/* ── sağ yüzen panel ── */}
            <div className="flex w-[300px] shrink-0 flex-col overflow-hidden rounded-[16px] border border-white/[0.06] bg-[#181818]/72 backdrop-blur-xl">
              {/* başlık */}
              <div className="flex items-center gap-2.5 p-3.5">
                <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-[#101207]"
                  style={{ background: "radial-gradient(circle at 30% 30%, #fff, var(--sn-lime,#dff641))" }}>
                  V
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-white">vayra</span>
                  <span className="block text-[13px] text-[#8E8E8E]">Yazar</span>
                </span>
                <button onClick={onKapat} aria-label="Kapat"
                  className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-[#2A2A2A] text-white/80 transition-colors hover:text-white">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* sekmeler */}
              <div className="mx-3.5 flex gap-1 rounded-[10px] bg-[#232323] p-[3px]">
                {([["bilgi", "Bilgi", Info], ["yorum", "Yorumlar", MessageSquare]] as const).map(([k, ad, Ik]) => (
                  <button key={k} onClick={() => setSekme(k)}
                    className={cn(
                      "flex h-[30px] flex-1 items-center justify-center gap-1.5 rounded-[8px] text-[14px] transition-colors",
                      sekme === k ? "bg-[#3A3A3A] font-medium text-white" : "text-[#8E8E8E] hover:text-white",
                    )}>
                    <Ik className="h-[14px] w-[14px]" /> {ad}
                  </button>
                ))}
              </div>

              {/* gövde */}
              <div className="min-h-0 flex-1 overflow-y-auto p-3.5 [scrollbar-width:thin]">
                {sekme === "bilgi" ? (
                  <>
                    {/* İSTEM */}
                    <div className="flex items-center gap-2">
                      <PenLine className="h-3.5 w-3.5 text-[#9A9A9A]" />
                      <span className="flex-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9A9A9A]">İstem</span>
                      <button onClick={() => { void mesaj.kopyala(uretim.prompt, "İstem"); }}
                        className="flex items-center gap-1 rounded-[7px] bg-[#2A2A2A] px-2 py-1 text-[13px] text-white transition-colors hover:bg-[#343434]">
                        <Copy className="h-3 w-3" /> Kopyala
                      </button>
                    </div>
                    <p className="mt-2.5 text-[13.5px] leading-[1.55] text-[#E4E4E4]">{uretim.prompt}</p>

                    {/* DETAYLAR */}
                    <div className="mt-5 flex items-center gap-2">
                      <Info className="h-3.5 w-3.5 text-[#9A9A9A]" />
                      <span className="flex-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9A9A9A]">Detaylar</span>
                      <button onClick={() => setDetayAcik((v) => !v)} aria-label="Detayları aç/kapat">
                        <ChevronUp className={cn("h-4 w-4 text-[#9A9A9A] transition-transform", !detayAcik && "rotate-180")} />
                      </button>
                    </div>
                    {detayAcik && (
                      <div className="mt-2 rounded-[12px] bg-[#1F1F1F] p-2.5">
                        <Detay etiket="Model" deger={uretim.model} />
                        {/* Görseller — üretimde kullanılan kaynak küçük resimleri (referans) */}
                        <div className="flex items-center gap-3 py-[3px]">
                          <span className="shrink-0 text-[13px] text-[#8E8E8E]">Görseller</span>
                          <span className="flex min-w-0 flex-1 justify-end gap-[2px] overflow-hidden">
                            {[0, 1, 2, 3, 4].map((i) => (
                              <span key={i} className="h-[20px] w-[24px] shrink-0 rounded-[3px]"
                                style={{ background: onizlemeArka(`${uretim.id}-kaynak-${i}`, "urun") }} />
                            ))}
                          </span>
                        </div>
                        <Detay etiket="Tür" deger={uretim.arac?.includes("Uygulama") ? "Uygulama" : "Ürün"} />
                        <Detay etiket="Mod" deger={uretim.meta?.oran ? uretim.baslik.split("·")[0].trim() : uretim.baslik} />
                        <Detay etiket="Kalite" deger={uretim.meta?.cozunurluk ?? "720p"} />
                        <Detay etiket="Boyut" deger={uretim.meta?.oran === "16:9" ? "1280x720" : "720x1280"} />
                        <Detay etiket="Oluşturulma" deger={tarih} son />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex h-full flex-col">
                    {/* Ara + Filtre — yalnız yorum varken (referans) */}
                    {yorumlar.length > 0 && (
                      <div className="flex shrink-0 items-center gap-2 pb-2.5">
                        <span className="flex min-w-0 flex-1 items-center gap-2">
                          <Search className="h-4 w-4 shrink-0 text-[#8E8E8E]" />
                          <input value={yorumAra} onChange={(e) => setYorumAra(e.target.value)}
                            placeholder="Ara"
                            className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-[#8E8E8E]" />
                        </span>
                        <div className="relative shrink-0">
                          <button onClick={() => setFiltreAcik((v) => !v)}
                            className="flex h-8 items-center gap-1.5 rounded-[8px] bg-[#2A2A2A] px-2.5 text-[13px] text-white transition-colors hover:bg-[#343434]">
                            <SlidersHorizontal className="h-3.5 w-3.5" /> Filtrele
                          </button>
                          <AnimatePresence>
                            <Yuzen acik={!!(filtreAcik)} onKapat={() => setFiltreAcik(false)} sag={0} ust={"tam"} bosluk={6}><motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                                  transition={{ duration: 0.13 }}
                                  className="w-[280px] rounded-[14px] bg-[#2E2E2E] p-2"
                                  style={{ boxShadow: "none" }}>
                                  <button onClick={() => { setYalnizCozulen((v) => !v); setFiltreAcik(false); }}
                                    className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2.5 text-left text-[15px] text-white transition-colors hover:bg-[#3F3F3F]">
                                    <CheckCircle2 className="h-[18px] w-[18px] text-white/70" />
                                    <span className="flex-1">Yalnızca çözülenleri göster</span>
                                    {yalnizCozulen && <Check className="h-4 w-4" style={{ color: "var(--sn-lime,#dff641)" }} />}
                                  </button>
                                  <button onClick={() => { setYorumlarGizli((v) => !v); setFiltreAcik(false); }}
                                    className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2.5 text-left text-[15px] text-white transition-colors hover:bg-[#3F3F3F]">
                                    <EyeOff className="h-[18px] w-[18px] text-white/70" />
                                    <span className="flex-1">Yorumları gizle</span>
                                    <kbd className="rounded-[5px] bg-[#3F3F3F] px-1.5 py-0.5 text-[11px] text-white/70">⌘ C</kbd>
                                  </button>
                                  <div className="my-1 h-px bg-white/10" />
                                  <button onClick={() => { setSiraTarih((v) => !v); setFiltreAcik(false); }}
                                    className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2.5 text-left text-[15px] text-white transition-colors hover:bg-[#3F3F3F]">
                                    <ArrowDownUp className="h-[18px] w-[18px] text-white/70" />
                                    <span className="flex-1">Eklenme tarihine göre sırala</span>
                                    {siraTarih && <Check className="h-4 w-4" style={{ color: "var(--sn-lime,#dff641)" }} />}
                                  </button>
                                </motion.div></Yuzen>
                          </AnimatePresence>
                        </div>
                      </div>
                    )}

                    {gorunenYorumlar.length === 0 ? (
                      <div className="flex flex-1 flex-col items-center justify-center">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2B2B2B]">
                          <MessageSquare className="h-6 w-6 text-[#8E8E8E]" />
                        </span>
                        <p className="mt-3.5 text-[15px] text-[#A8A8A8]">
                          {yorumlar.length === 0 ? "Henüz yorum yok" : "Eşleşen yorum yok"}
                        </p>
                      </div>
                    ) : (
                      <div className="flex-1 space-y-2.5">
                        {gorunenYorumlar.map((y) => (
                          <div key={y.id} className="rounded-[10px] bg-[#2B2B2B] p-2.5">
                            {/* zaman damgası başlığı */}
                            <p className="mb-1.5 text-[13px] text-[#9A9A9A]">{sn(y.bas)}</p>
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F2662C] text-[11px] font-bold text-white">
                                {y.ad.charAt(0)}
                              </span>
                              <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-white">{y.ad}</span>
                              <span className="shrink-0 text-[13px] text-[#9A9A9A]">{y.zaman}</span>

                              {/* emoji tepki · çözüldü · ⋮ */}
                              <button onClick={() => tepkiVer(y.id)} aria-label="Tepki ver"
                                className="shrink-0 text-[#9A9A9A] transition-colors hover:text-white">
                                <Smile className="h-[15px] w-[15px]" />
                              </button>
                              <button onClick={() => cozuldu(y.id)} aria-label="Çözüldü"
                                className={cn("shrink-0 transition-colors hover:text-white",
                                  y.cozuldu ? "text-[#7bd93f]" : "text-[#9A9A9A]")}>
                                <CheckCircle2 className="h-[15px] w-[15px]" />
                              </button>
                              <div className="relative shrink-0">
                                <button onClick={() => setYorumMenu(yorumMenu === y.id ? null : y.id)} aria-label="Yorum menüsü"
                                  className="text-[#9A9A9A] transition-colors hover:text-white">
                                  <MoreVertical className="h-[15px] w-[15px]" />
                                </button>
                                <AnimatePresence>
                                  <Yuzen acik={!!(yorumMenu === y.id)} onKapat={() => setYorumMenu(null)} sag={0} ust={"tam"} bosluk={4}><motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                                        className="w-[150px] rounded-[12px] bg-[#2E2E2E] p-1.5"
                                        style={{ boxShadow: "none" }}>
                                        <button onClick={() => { setDuzenlenen(y.id); setDuzenMetin(y.metin); setYorumMenu(null); }}
                                          className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-left text-[14px] text-white transition-colors hover:bg-[#3F3F3F]">
                                          <PenLine className="h-4 w-4 text-white/70" /> Düzenle
                                        </button>
                                        <button onClick={() => { const sira = yorumlar.findIndex((x) => x.id === y.id); yorumSil(y.id); setYorumMenu(null); mesaj.silindi("Yorum", () => setYorumlar((l) => (l.some((x) => x.id === y.id) ? l : [...l.slice(0, sira), y, ...l.slice(sira)]))); }}
                                          className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-left text-[14px] text-[#F04438] transition-colors hover:bg-[#F04438]/10">
                                          <Trash2 className="h-4 w-4" /> Sil
                                        </button>
                                      </motion.div></Yuzen>
                                </AnimatePresence>
                              </div>
                            </div>

                            {/* aralık çipi + gövde */}
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              <span className="rounded-[5px] bg-[#1C1C1C] px-1.5 py-[2px] text-[12px] tabular-nums text-white">
                                {sn(y.bas)} – {sn(y.son)}
                              </span>
                              {duzenlenen === y.id ? (
                                <input value={duzenMetin} onChange={(e) => setDuzenMetin(e.target.value)}
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      setYorumlar((l) => l.map((x) => (x.id === y.id ? { ...x, metin: duzenMetin } : x)));
                                      setDuzenlenen(null);
                                    }
                                    if (e.key === "Escape") setDuzenlenen(null);
                                  }}
                                  onBlur={() => {
                                    setYorumlar((l) => l.map((x) => (x.id === y.id ? { ...x, metin: duzenMetin } : x)));
                                    setDuzenlenen(null);
                                  }}
                                  className="min-w-0 flex-1 rounded bg-white/10 px-1.5 py-0.5 text-[14px] text-white outline-none" />
                              ) : (
                                <span className={cn("text-[14px] text-white", y.cozuldu && "line-through opacity-55")}>
                                  {y.metin}
                                </span>
                              )}
                            </div>

                            <div className="mt-1 flex items-center gap-2">
                              <button className="text-[13px] text-[#9A9A9A] transition-colors hover:text-white">Yanıtla</button>
                              {y.tepki && <span className="text-[13px]">{y.tepki}</span>}
                              {y.cozuldu && (
                                <span className="rounded-full bg-[#7bd93f]/15 px-2 py-[1px] text-[11px] font-medium text-[#7bd93f]">
                                  Çözüldü
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* yorum yazma */}
                    <div className="mt-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="flex shrink-0 items-center gap-1 rounded-[5px] px-1.5 py-[3px] text-[12px] font-semibold tabular-nums"
                          style={{ background: "#4A4C1E", color: "var(--sn-lime,#dff641)" }}>
                          {aralik ? `${sn(aralik.bas)} – ${sn(aralik.son)}` : sn((ilerleme / 100) * 8)}
                          {aralik && (
                            <button onClick={() => setAralik(null)} aria-label="Aralığı kaldır" className="ml-0.5">
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </span>
                        <input value={yorumMetin} onChange={(e) => setYorumMetin(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") yorumEkle(); }}
                          placeholder="Yorum ekle"
                          className="min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-[#8E8E8E]" />
                      </div>
                      <div className="mt-2 flex items-center gap-4">
                        <button
                          onClick={() => {
                            const b = Math.round((ilerleme / 100) * 8);
                            setAralik(aralik ? null : { bas: b, son: Math.min(8, b + 1) });
                          }}
                          title="Aralık ekle (⇧R)" aria-label="Aralık ekle">
                          <Clock3 className="h-[18px] w-[18px] transition-colors"
                            style={{ color: aralik ? "var(--sn-lime,#dff641)" : "#9A9A9A" }} />
                        </button>
                        <button aria-label="Çizim ekle" onClick={() => toast.info("Çizim aracı yakında", { description: "Şimdilik yorumu metin olarak yazabilirsin." })}>
                          <PenLine className="h-[18px] w-[18px] text-[#9A9A9A] transition-colors hover:text-white" />
                        </button>
                        <button aria-label="Emoji" onClick={() => setYorumMetin((v) => v + " 🙂")}>
                          <Smile className="h-[18px] w-[18px] text-[#9A9A9A] transition-colors hover:text-white" />
                        </button>
                        {yorumMetin.trim() && (
                          <button onClick={yorumEkle} aria-label="Gönder"
                            className="ml-auto flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#8A9A2E] text-white transition-transform hover:scale-105">
                            <ArrowUp className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* alt eylemler */}
              <div className="shrink-0 space-y-1.5 p-3.5 pt-0">
                <button onClick={onYenidenUret}
                  className="hf-uret flex h-8 w-full items-center justify-center gap-2 rounded-[10px] text-[15px]">
                  <RotateCw className="h-4 w-4" /> Yeniden üret
                </button>
                <div className="flex gap-1.5">
                  <button onClick={() => uretimIndir(uretim)}
                    className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-[#2A2A2A] text-[15px] text-white transition-colors hover:bg-[#343434]">
                    <Download className="h-4 w-4" /> İndir
                  </button>
                  <button onClick={onFavori} aria-label="Beğen"
                    className="flex h-8 w-10 items-center justify-center rounded-[10px] bg-[#2A2A2A] transition-colors hover:bg-[#343434]">
                    <Heart className={cn("h-4 w-4", uretim.favori ? "fill-rose-500 text-rose-500" : "text-white")} />
                  </button>
                  <button onClick={() => { void mesaj.kopyala(location.href, "Bağlantı"); }}
                    aria-label="Paylaş"
                    className="flex h-8 w-10 items-center justify-center rounded-[10px] bg-[#2A2A2A] transition-colors hover:bg-[#343434]">
                    <Share2 className="h-4 w-4 text-white" />
                  </button>
                  <div className="relative">
                    <button onClick={() => setUstAcik((v) => !v)} aria-label="Daha fazla"
                      className={cn("flex h-8 w-10 items-center justify-center rounded-[10px] transition-colors",
                        ustAcik ? "bg-[#3E3E3E]" : "bg-[#2A2A2A] hover:bg-[#343434]")}>
                      <MoreHorizontal className="h-4 w-4 text-white" />
                    </button>
                    <AnimatePresence>
                      <Yuzen acik={!!(ustAcik)} onKapat={() => setUstAcik(false)} alt={"tam"} sag={0} bosluk={8}><motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                            className="w-[280px] rounded-[12px] bg-[#2E2E2E] p-2">
                            {[
                              { ad: "Yayınla", ikon: Upload },
                              { ad: "Şuraya taşı", ikon: FolderInput, ok: true },
                              { ad: "Çevir", ikon: Languages },
                              { ad: "Sesi değiştir", ikon: AudioLines },
                              { ad: "Viralite tahmincisi", ikon: TrendingUp },
                              { ad: "Video URL'sini kopyala", ikon: Link2 },
                            ].map((m) => (
                              <button key={m.ad} onClick={() => { setUstAcik(false); toast.info(`${m.ad} yakında`, { description: "Bu eylem henüz ışık kutusunda çalışmıyor." }); }}
                                className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-[15px] text-white transition-colors hover:bg-[#3F3F3F]">
                                <m.ikon className="h-[18px] w-[18px] text-white/70" />
                                <span className="flex-1">{m.ad}</span>
                                {m.ok && <ChevronDown className="h-4 w-4 -rotate-90 text-white/40" />}
                              </button>
                            ))}
                            <div className="my-1 h-px bg-white/10" />
                            <button onClick={() => { setUstAcik(false); onSil(); }}
                              className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-[15px] text-[#F04438] transition-colors hover:bg-[#F04438]/10">
                              <Trash2 className="h-[18px] w-[18px]" /> Sil
                            </button>
                          </motion.div></Yuzen>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Detay({ etiket, deger, son }: { etiket: string; deger: string; son?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3 py-[3px]", !son && "mb-0.5")}>
      <span className="shrink-0 text-[13px] text-[#8E8E8E]">{etiket}</span>
      <span className="min-w-0 flex-1 truncate text-right text-[13px] text-white">{deger}</span>
    </div>
  );
}
