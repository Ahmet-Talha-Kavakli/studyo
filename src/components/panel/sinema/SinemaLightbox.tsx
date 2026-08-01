"use client";

/**
 * SinemaLightbox — Higgsfield Cinema Studio görsel-detay lightbox'ı (spec 118-120) BİREBİR.
 *
 * Sol %72 büyük görsel (vinyet zemin) + altında karşılaştır/tam-ekran araç çubuğu.
 * Sağ ~360px koyu panel: yazar başlığı + 3 segment sekme (Bilgi / Araçlar / Yorumlar).
 *  - Bilgi: İSTEM (Kopyala) + AYRINTILAR metadata + alt CTA bloğu (Videoya çevir + Yeniden oluştur/Referans + İndir/♥).
 *  - Araçlar: GÖRSELİ DÜZENLE araç listesi (Renk Derecelendirme[Yeni]/Büyüt/Geliştirici/Yeniden Aydınlat/Inpaint/Açılar).
 *  - Yorumlar: boş durum + "Yorum ekle" input.
 *
 * .sinema-kapsam içinde render edilir → --sn-* değişkenleri ve .hf-uret erişilebilir.
 */

import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "@/lib/toast";
import {
  X,
  Info,
  Wand2,
  MessageCircle,
  Copy,
  ChevronUp,
  Camera,
  Aperture,
  Video,
  RefreshCw,
  UserRound,
  Download,
  Heart,
  Palette,
  Maximize2,
  Sparkles,
  Sun,
  Brush,
  Aperture as AngleIcon,
  ChevronRight,
  Columns2,
  Expand,
  Smile,
  ImagePlay,
} from "lucide-react";
import { useEscKapat, useScrollKilit } from "@/hooks/useScrollKilit";
import { cn, onizlemeArka, saltUrl } from "@/lib/utils";
import { kopyala, uretimIndir } from "@/lib/gercekEylem";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
export interface LightboxUretim {
  id: string;
  baslik: string;
  prompt: string;
  gorselUrl?: string;
  tohum: string;
  kategori: string;
  yazar: string;
  tur: string;
}

interface SinemaLightboxProps {
  acik: boolean;
  uretim: LightboxUretim | null;
  onKapat: () => void;
}

type Sekme = "bilgi" | "araclar" | "yorumlar";

const SEKMELER: { id: Sekme; ad: string; ikon: typeof Info }[] = [
  { id: "bilgi", ad: "Bilgi", ikon: Info },
  { id: "araclar", ad: "Araçlar", ikon: Wand2 },
  { id: "yorumlar", ad: "Yorumlar", ikon: MessageCircle },
];

const AYRINTILAR: { etiket: string; deger: string; ikon?: typeof Camera }[] = [
  { etiket: "Özellik", deger: "Sinema Stüdyo Görsel" },
  { etiket: "Kamera", deger: "Full-Frame Cine Digital", ikon: Camera },
  { etiket: "Lens", deger: "Swirl Bokeh Portrait", ikon: Aperture },
  { etiket: "Odak", deger: "50mm" },
  { etiket: "Diyafram", deger: "f/1.4", ikon: Aperture },
  { etiket: "Kalite", deger: "2K" },
  { etiket: "Boyut", deger: "2752x1536" },
  { etiket: "Oluşturuldu", deger: "18 Temmuz 2026" },
];

const ARACLAR: { ad: string; ikon: typeof Palette; yeni?: boolean }[] = [
  { ad: "Renk Derecelendirme", ikon: Palette, yeni: true },
  { ad: "Büyüt", ikon: Maximize2 },
  { ad: "Geliştirici", ikon: Sparkles },
  { ad: "Yeniden Aydınlat", ikon: Sun },
  { ad: "Inpaint", ikon: Brush },
  { ad: "Açılar", ikon: AngleIcon },
];

export function SinemaLightbox({ acik, uretim, onKapat }: SinemaLightboxProps) {
  const [sekme, setSekme] = useState<Sekme>("bilgi");
  const [favori, setFavori] = useState(false);
  // m54: karşılaştır (before/after slider) + tam ekran gerçek işlev.
  const medyaKapRef = useRef<HTMLDivElement>(null);
  const [karsilastir, setKarsilastir] = useState(false);
  const [karsilastirmaX, setKarsilastirmaX] = useState(50); // % — bölme çizgisi
  const tamEkran = () => {
    const el = medyaKapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen?.().catch(() => toast.error("Tam ekran açılamadı."));
  };

  useScrollKilit(acik);
  useEscKapat(acik, onKapat);

  const gorsel =
    saltUrl(uretim?.gorselUrl) ??
    saltUrl(onizlemeArka(uretim?.tohum ?? uretim?.id ?? "vayra", uretim?.kategori));

  function promptKopyala() {
    if (!uretim) return;
    void kopyala(uretim.prompt, "İstem kopyalandı");
  }

  /* "Videoya çevir" — GERÇEK video üretimi başlatır (UretimDetay.videoyaCevir deseni). */
  function videoyaCevir() {
    if (!uretim) return;
    const sonuc = uretimBaslat({
      baslik: uretim.baslik + " (video)",
      tur: "video",
      model: "Seedance 2.0",
      prompt: uretim.prompt || uretim.baslik,
      kredi: 42,
      arac: "Videoya Çevir",
    });
    if (!sonuc.ok) return uretimHataToast(sonuc);
    toast.success("Videoya çevriliyor 🎬", { description: `${uretim.baslik} · 42 kredi` });
    onKapat();
  }

  // Prompt içindeki @mention'ları lime renklendir
  function promptParcala(metin: string) {
    return metin.split(/(@\w+)/g).map((parca, i) =>
      parca.startsWith("@") ? (
        <span key={i} style={{ color: "var(--sn-lime)" }}>
          {parca}
        </span>
      ) : (
        <span key={i}>{parca}</span>
      ),
    );
  }

  return (
    <AnimatePresence>
      {acik && uretim && (
        <motion.div
          className="fixed inset-0 z-[120] flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{
            background:
              "radial-gradient(120% 90% at 40% 45%, #101014 0%, #08080a 70%, #050506 100%)",
          }}
        >
          {/* SOL: büyük görsel + araç çubuğu */}
          <div ref={medyaKapRef} className="relative flex flex-1 items-center justify-center overflow-hidden bg-black p-6">
            {/* m54: karşılaştırma modu — sol yarı grileştirilmiş "öncesi", sağ yarı
                renkli "sonrası"; sürüklenebilir bölme çizgisi. */}
            {karsilastir && (
              <div className="pointer-events-auto absolute inset-6 z-[5] overflow-hidden rounded-lg"
                onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setKarsilastirmaX(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100))); }}>
                <img src={gorsel} alt="" className="absolute inset-0 h-full w-full object-contain" style={{ filter: "grayscale(1) contrast(0.9)" }} />
                <img src={gorsel} alt="" className="absolute inset-0 h-full w-full object-contain" style={{ clipPath: `inset(0 0 0 ${karsilastirmaX}%)` }} />
                <span className="absolute inset-y-0 w-0.5 bg-white shadow-lg" style={{ left: `${karsilastirmaX}%` }} />
                <span className="absolute top-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">Öncesi</span>
                <span className="absolute top-2 right-2 rounded bg-aksan/90 px-2 py-0.5 text-[11px] font-semibold text-zemin">Sonrası</span>
              </div>
            )}
            <motion.img
              key={uretim.id}
              src={gorsel}
              alt={uretim.baslik}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
              draggable={false}
            />
            {/* alt-orta araç çubuğu: karşılaştır + tam ekran */}
            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2">
              <button
                onClick={() => setKarsilastir((v) => !v)}
                className="grid h-9 w-9 place-items-center rounded-lg transition"
                style={{ background: karsilastir ? "var(--sn-lime,#55d6fd)" : "rgba(20,20,22,.7)", color: karsilastir ? "#101" : "var(--sn-metin-2)" }}
                title="Karşılaştır (öncesi/sonrası)"
              >
                <Columns2 size={17} />
              </button>
              <button
                onClick={tamEkran}
                className="grid h-9 w-9 place-items-center rounded-lg transition"
                style={{ background: "rgba(20,20,22,.7)", color: "var(--sn-metin-2)" }}
                title="Tam ekran"
              >
                <Expand size={17} />
              </button>
            </div>
          </div>

          {/* SAĞ: 360px detay paneli */}
          <motion.aside
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex h-full w-[360px] shrink-0 flex-col border-l"
            style={{ background: "var(--sn-yuzey)", borderColor: "var(--sn-kenar)" }}
          >
            {/* Üst: yazar */}
            <div className="flex items-center gap-3 px-5 pb-4 pt-5">
              <div
                className="h-9 w-9 shrink-0 rounded-full"
                style={{
                  background:
                    "linear-gradient(135deg, var(--sn-lime), #9b7bff 90%)",
                }}
              />
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-sm font-semibold"
                  style={{ color: "var(--sn-metin)" }}
                >
                  {uretim.yazar}
                </div>
                <div className="text-xs" style={{ color: "var(--sn-metin-3)" }}>
                  Yazar
                </div>
              </div>
              <button
                onClick={onKapat}
                className="grid h-8 w-8 place-items-center rounded-full transition hover:opacity-80"
                style={{ background: "var(--sn-cip)", color: "var(--sn-metin-2)" }}
                title="Kapat"
              >
                <X size={17} />
              </button>
            </div>

            {/* Segment sekmeler — /panel/gorsel lightbox'ıyla BİREBİR
                (kullanıcı kararı): buzlu-cam yuvarlak kapsüller, aktif olan
                glass-cip-aktif + aksan ikon. Önce içi dolu dikdörtgen
                pill'lerdi (--sn-cip zemin + --sn-menu aktif). */}
            <div className="flex gap-1.5 border-b border-white/8 px-2.5 py-2.5">
              {SEKMELER.map((s) => {
                const Ikon = s.ikon;
                const secili = sekme === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSekme(s.id)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-[13px] font-medium",
                      secili ? "glass-cip-aktif text-white" : "glass-cip text-metin-2 hover:text-metin",
                    )}
                  >
                    <Ikon size={14} className={cn(secili && "text-aksan")} />
                    {s.ad}
                  </button>
                );
              })}
            </div>

            {/* İçerik */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {sekme === "bilgi" && (
                <div className="space-y-5">
                  {/* İSTEM */}
                  <section>
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide"
                        style={{ color: "var(--sn-metin-3)" }}
                      >
                        <Wand2 size={12} /> İstem
                      </span>
                      <button
                        onClick={promptKopyala}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition hover:opacity-80"
                        style={{ background: "var(--sn-cip)", color: "var(--sn-metin-2)" }}
                      >
                        <Copy size={12} /> Kopyala
                      </button>
                    </div>
                    <div
                      className="min-h-[92px] rounded-lg p-3 text-sm leading-relaxed"
                      style={{ background: "var(--sn-cip)", color: "var(--sn-metin)" }}
                    >
                      {promptParcala(uretim.prompt)}
                    </div>
                  </section>

                  {/* AYRINTILAR */}
                  <section>
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide"
                        style={{ color: "var(--sn-metin-3)" }}
                      >
                        <Info size={12} /> Ayrıntılar
                      </span>
                      <ChevronUp size={15} style={{ color: "var(--sn-metin-3)" }} />
                    </div>
                    <dl className="space-y-2.5 rounded-[14px] p-3.5" style={{ background: "var(--sn-cip)" }}>
                      {AYRINTILAR.map((a) => {
                        const Ikon = a.ikon;
                        return (
                          <div
                            key={a.etiket}
                            className="flex items-center justify-between text-sm"
                          >
                            <dt style={{ color: "var(--sn-metin-3)" }}>{a.etiket}</dt>
                            <dd
                              className="flex items-center gap-1.5 font-medium"
                              style={{ color: "var(--sn-metin)" }}
                            >
                              {a.deger}
                              {Ikon && (
                                <Ikon size={13} style={{ color: "var(--sn-metin-3)" }} />
                              )}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </section>

                  {/* Alt CTA bloğu */}
                  <section className="space-y-2 pt-1">
                    <button
                      onClick={videoyaCevir}
                      className="hf-uret flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
                      style={{
                        background: "var(--sn-lime)",
                        color: "var(--sn-lime-metin)",
                      }}
                    >
                      <Video size={16} /> Videoya çevir
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <IkincilBtn
                        ikon={RefreshCw}
                        ad="Yeniden oluştur"
                        onClick={() => toast("Yeniden oluşturuluyor")}
                      />
                      <IkincilBtn
                        ikon={UserRound}
                        ad="Referans"
                        onClick={() => toast("Referans olarak eklendi")}
                      />
                      <IkincilBtn
                        ikon={Download}
                        ad="İndir"
                        onClick={() => uretimIndir(uretim ? { ...uretim, gorselUrl: gorsel ?? uretim.gorselUrl } : null)}
                      />
                      <IkincilBtn
                        ikon={Heart}
                        ad="Favori"
                        aktif={favori}
                        onClick={() => {
                          setFavori((v) => !v);
                          toast(favori ? "Favoriden çıkarıldı" : "Favorilere eklendi");
                        }}
                      />
                    </div>
                  </section>
                </div>
              )}

              {sekme === "araclar" && (
                <div>
                  <div
                    className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: "var(--sn-metin-3)" }}
                  >
                    <Wand2 size={12} /> Görseli Düzenle
                  </div>
                  <ul className="space-y-1">
                    {ARACLAR.map((a) => {
                      const Ikon = a.ikon;
                      return (
                        <li key={a.ad}>
                          <button
                            onClick={() => toast(`${a.ad} açılıyor`)}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition hover:brightness-125"
                            style={{ color: "var(--sn-metin)" }}
                          >
                            <Ikon size={17} style={{ color: "var(--sn-metin-2)" }} />
                            <span className="flex-1 text-left">{a.ad}</span>
                            {a.yeni && (
                              <span
                                className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                                style={{
                                  background: "var(--sn-lime)",
                                  color: "var(--sn-lime-metin)",
                                }}
                              >
                                Yeni
                              </span>
                            )}
                            <ChevronRight
                              size={15}
                              style={{ color: "var(--sn-metin-3)" }}
                            />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {sekme === "yorumlar" && (
                <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                  <MessageCircle
                    size={44}
                    strokeWidth={1.4}
                    style={{ color: "var(--sn-metin-3)" }}
                  />
                  <p className="mt-3 text-sm" style={{ color: "var(--sn-metin-3)" }}>
                    Henüz yorum yok
                  </p>
                </div>
              )}
            </div>

            {/* Yorum girişi (yalnız Yorumlar sekmesinde) */}
            {sekme === "yorumlar" && (
              <div
                className="border-t px-5 py-3"
                style={{ borderColor: "var(--sn-kenar)" }}
              >
                <input
                  placeholder="Yorum ekle"
                  className="w-full bg-transparent text-sm outline-none placeholder:opacity-60"
                  style={{ color: "var(--sn-metin)" }}
                />
                <div className="mt-2 flex items-center gap-3">
                  <button
                    className="transition hover:opacity-80"
                    style={{ color: "var(--sn-metin-3)" }}
                    title="GIF ekle"
                  >
                    <ImagePlay size={17} />
                  </button>
                  <button
                    className="transition hover:opacity-80"
                    style={{ color: "var(--sn-metin-3)" }}
                    title="Emoji"
                  >
                    <Smile size={17} />
                  </button>
                </div>
              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function IkincilBtn({
  ikon: Ikon,
  ad,
  onClick,
  aktif,
}: {
  ikon: typeof RefreshCw;
  ad: string;
  onClick: () => void;
  aktif?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 rounded-lg border py-2.5 text-xs font-medium transition hover:brightness-125"
      style={{
        background: "var(--sn-cip)",
        borderColor: "var(--sn-kenar)",
        color: aktif ? "var(--sn-lime)" : "var(--sn-metin)",
      }}
    >
      <Ikon size={15} fill={aktif ? "var(--sn-lime)" : "none"} />
      {ad}
    </button>
  );
}
