"use client";

/**
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  VAYRA UI KATALOĞU — /gelistirici/ui  (GELİŞTİRİCİYE ÖZEL, GİZLİ)     │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │  Amaç: sitenin her yerindeki UI parçalarını (buton, panel, sidebar,  │
 * │  kart, modal…) TEK yerde, adlandırılmış, canlı önizlemeli ve          │
 * │  kopyalanabilir kod'uyla toplamak. İleride tek tasarım diline         │
 * │  hizalamanın ve preset-AI üreticisine beslemenin kaynağı.             │
 * │                                                                       │
 * │  Nav'da GÖRÜNMEZ, link yok — yalnızca doğrudan URL ile açılır.        │
 * │  Kullanıcıya kapalı; robots noindex + panel dışı gizli rota.         │
 * │                                                                       │
 * │  YENİ ELEMENT EKLEME: KATEGORILER dizisine bir <KatalogOge> ekle;    │
 * │  `ad` = referans ismi, `onizleme` = canlı JSX, `kod` = kopyalanacak. │
 * └─────────────────────────────────────────────────────────────────────┘
 */

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Check, Copy, Search, LayoutGrid,
  Heart, Download, MoreHorizontal, ImagePlus, Video as VideoIcon, Box,
  ArrowUpRight, RefreshCw, AtSign, Share2, ChevronRight, FolderPlus, Upload, Trash2,
  Link2, MessageCircle, Pin, Briefcase, Sparkles, X,
  Info, Wand2, ChevronDown, UserSquare, Palette, Maximize2, Sun, Scissors, Crop, Eraser, RotateCcw,
  Send, VolumeX, User, MapPin, Package, SlidersHorizontal,
  Image as ImageIcon, Plus, Scan, Globe, Clock, Minus, Volume2,
  Home, Images, Shapes, ArrowDownUp, PanelLeft, Clapperboard, MoreVertical, Archive,
  Workflow,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────
   ELEMENT: hover-araclari/gorsel-kart
   Kaynak: /panel/gorsel — üretilen görselin ÜSTÜNE gelince çıkan araç barı.
   Sağ-üst ray (Beğen · İndir · Yeniden kullan · ⋯) + alt-orta hızlı eylemler
   (Referans · Animate · 3D) + hover vinyeti. Katalog için bağımsız/çalışır hale
   getirildi (sayfa state'i yok, tıklamalar demo). Gerçek kullanımda onBegen/
   onIndir… gibi eylem prop'ları bağlanır.
   ───────────────────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────────────────────
   GLASS PANEL DENEMESİ — kullanıcının verdiği glassmorphism reçetesi.
   Beğenilirse tüm panellerde/butonlarda kullanılacak.

   Arka plan HAREKETLİ olmak zorunda: `backdrop-filter` yalnızca arkasındaki
   içeriği bulanıklaştırır; düz tek renk zeminde hiçbir etkisi görünmez.
   Renkli lekeler dolaştıkça camın gerçekten bulanıklaştırdığı gözle
   doğrulanabilir.
   ───────────────────────────────────────────────────────────────────────── */
function GlassPanelDenemesi() {
  const [koyu, setKoyu] = useState(false);
  return (
    <div className="w-full">
      {/* Varyant anahtarı — orijinal reçete açık zemin içindi, koyu tema
          uyarlaması ayrı sınıf (.glass-panel-koyu). */}
      <div className="mb-3 flex gap-2">
        {([[false, "Orijinal reçete"], [true, "Koyu tema uyarlaması"]] as const).map(([v, ad]) => (
          <button key={ad} onClick={() => setKoyu(v)}
            className={cn("rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors",
              koyu === v ? "bg-white/15 text-white" : "bg-white/5 text-white/50 hover:text-white")}>
            {ad}
          </button>
        ))}
      </div>

      {/* Sahne: hareketli renk lekeleri + üstünde cam panel */}
      <div className="relative h-[300px] w-full overflow-hidden rounded-3xl bg-[#0d0f12]">
        <span aria-hidden className="gp-leke-1 absolute -left-10 top-4 h-52 w-52 rounded-full bg-cyan-400/50 blur-3xl" />
        <span aria-hidden className="gp-leke-2 absolute right-0 top-10 h-56 w-56 rounded-full bg-fuchsia-500/45 blur-3xl" />
        <span aria-hidden className="gp-leke-3 absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-amber-400/45 blur-3xl" />

        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className={cn("w-full max-w-[340px] p-6", koyu ? "glass-panel-koyu" : "glass-panel")}>
            <p className="text-[17px] font-bold text-white">Cam Panel</p>
            <p className="mt-1 text-[13px] leading-relaxed text-white/70">
              Arkadaki renkler bulanıklaşarak geçiyor — efekt çalışıyor.
            </p>
            <div className="mt-4 flex gap-2">
              <button className={cn("flex-1 rounded-full py-2 text-[13px] font-semibold text-white transition-transform hover:scale-[1.02]",
                koyu ? "glass-panel-koyu" : "glass-panel")} style={{ borderRadius: 999 }}>
                Cam Buton
              </button>
              <button className="flex-1 rounded-full bg-aksan py-2 text-[13px] font-bold text-zemin transition-transform hover:scale-[1.02]">
                Dolgulu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GorselKartHoverAraclari() {
  const [begenili, setBegenili] = useState(false);
  const glassIkon = "flex items-center justify-center rounded-full border border-white/15 bg-black/35 text-white backdrop-blur-md transition-colors hover:bg-black/55 active:scale-95";
  return (
    <div className="group relative w-[220px] overflow-hidden rounded-2xl">
      {/* örnek görsel (gradient — gerçekte üretilen görsel) */}
      <div className="aspect-[3/4] w-full" style={{ background: "linear-gradient(135deg,#3a2f5e 0%,#7c3aed 45%,#0891b2 100%)" }} />

      {/* hover vinyeti — kenarlar kararır, köşe ikonları okunur */}
      <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background: "radial-gradient(120% 100% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)" }} />

      {/* sağ-üst dikey ray */}
      <div className="pointer-events-none absolute right-2 top-2 z-20 flex flex-col gap-1.5 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
        <button onClick={() => setBegenili((v) => !v)} aria-label="Beğen" className={`${glassIkon} h-9 w-9 ${begenili ? "text-rose-400" : ""}`}><Heart className={`h-[18px] w-[18px] ${begenili ? "fill-current" : ""}`} /></button>
        <button aria-label="İndir" className={`${glassIkon} h-9 w-9`}><Download className="h-[18px] w-[18px]" /></button>
        <button aria-label="Yeniden kullan" className={`${glassIkon} h-9 w-9`}><Copy className="h-[18px] w-[18px]" /></button>
        <button aria-label="Daha fazla" className={`${glassIkon} h-9 w-9`}><MoreHorizontal className="h-[18px] w-[18px]" /></button>
      </div>

      {/* alt-orta hızlı eylemler */}
      <div className="pointer-events-none absolute inset-x-0 bottom-2 z-20 flex items-center justify-center gap-1.5 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
        <button aria-label="Referans olarak ekle" className={`${glassIkon} h-9 w-9 hover:!bg-aksan hover:text-zemin`}><ImagePlus className="h-4 w-4" /></button>
        <button aria-label="Animate" className={`${glassIkon} h-9 w-9 hover:!bg-aksan hover:text-zemin`}><VideoIcon className="h-4 w-4" /></button>
        <button aria-label="3D sahne" className={`${glassIkon} h-9 w-9 hover:!bg-aksan hover:text-zemin`}><Box className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ELEMENT: hover-araclari/gorsel-kart-menu
   Kaynak: /panel/gorsel — kart araçlarındaki ⋯ (Daha fazla) butonuna tıklayınca
   açılan menü. Sıra (Higgsfield birebir): Aç · Yeniden üret · Yeniden kullan ·
   Element oluştur · Beğen · Paylaş› (alt-menü) · Klasöre ekle · Yayınla · İndir
   · —— · Sil. Katalog için bağımsız/çalışır (tıkla-aç, alt-menü hover).
   ───────────────────────────────────────────────────────────────────────── */
function GorselKartMenu() {
  const [acik, setAcik] = useState(false);
  const [paylasAcik, setPaylasAcik] = useState(false);

  const satir = (Ikon: typeof ArrowUpRight, ad: string, tehlike = false) => (
    <button onClick={() => setAcik(false)}
      className={cn2("flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-[15px] font-medium transition-colors",
        tehlike ? "text-tehlike hover:bg-tehlike/10" : "text-white hover:bg-white/8")}>
      <Ikon className={cn2("h-[18px] w-[18px]", tehlike ? "" : "text-white/70")} /> {ad}
    </button>
  );
  const paylasHedefleri: [typeof Link2, string][] = [
    [Link2, "Bağlantıyı kopyala"], [AtSign, "X'te paylaş"], [MessageCircle, "WhatsApp'ta paylaş"],
    [Pin, "Pinterest'te paylaş"], [Briefcase, "LinkedIn'de paylaş"],
  ];

  return (
    <div className="relative">
      <button onClick={() => setAcik((v) => !v)} aria-label="Daha fazla"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white backdrop-blur-md transition-colors hover:bg-black/55">
        <MoreHorizontal className="h-[18px] w-[18px]" />
      </button>
      <AnimatePresence>
        {acik && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setAcik(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.97, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.13 }}
              className="menu-surface absolute left-full top-0 z-[61] ml-2 w-56 rounded-2xl p-1.5">
              {satir(ArrowUpRight, "Aç")}
              {satir(RefreshCw, "Yeniden üret")}
              {satir(Copy, "Yeniden kullan")}
              {satir(AtSign, "Element oluştur")}
              {satir(Heart, "Beğen")}
              {/* Paylaş → alt-menü */}
              <div className="relative" onMouseEnter={() => setPaylasAcik(true)} onMouseLeave={() => setPaylasAcik(false)}>
                <button className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-[15px] font-medium text-white transition-colors hover:bg-white/8">
                  <Share2 className="h-[18px] w-[18px] text-white/70" /> Paylaş
                  <ChevronRight className="ml-auto h-4 w-4 text-white/40" />
                </button>
                <AnimatePresence>
                  {paylasAcik && (
                    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.12 }}
                      className="menu-surface absolute left-full top-0 ml-1.5 w-56 rounded-2xl p-1.5">
                      {paylasHedefleri.map(([Ik, ad]) => (
                        <button key={ad} onClick={() => { setPaylasAcik(false); setAcik(false); }}
                          className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-[15px] font-medium text-white transition-colors hover:bg-white/8">
                          <Ik className="h-[18px] w-[18px] text-white/70" /> {ad}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {satir(FolderPlus, "Klasöre ekle")}
              {satir(Upload, "Yayınla")}
              {satir(Download, "İndir")}
              <div className="my-1 h-px bg-white/8" />
              {satir(Trash2, "Sil", true)}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ELEMENT: secim/kart-secme-kutusu
   Kaynak: /panel/gorsel — görselin ÜSTÜNE gelince sol-üstte çıkan seçim
   kutusu. Boşken hover'da beliren, tıklayınca dolu (aksan) çoklu-seçim
   checkbox'ı. Seçiliyken kalıcı görünür. Katalog için bağımsız/çalışır.
   ───────────────────────────────────────────────────────────────────────── */
function KartSecmeKutusu() {
  const [secili, setSecili] = useState(false);
  return (
    <div className="group relative w-[180px] overflow-hidden rounded-2xl">
      <div className="aspect-[3/4] w-full" style={{ background: "linear-gradient(135deg,#1e3a5f 0%,#0891b2 100%)" }} />
      <button onClick={() => setSecili((v) => !v)} aria-label="Seç"
        className={cn2(
          "absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-md border-2 backdrop-blur-sm transition-all",
          secili ? "border-aksan bg-aksan text-zemin opacity-100"
            : "pointer-events-none border-white/70 opacity-0 group-hover:pointer-events-auto group-hover:opacity-100",
        )}>
        {secili && <Check className="h-3 w-3" strokeWidth={3.5} />}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ELEMENT: secim/alt-toolbar
   Kaynak: /panel/gorsel — bir/birden çok görsel seçilince ALTTAN çıkan
   yüzen seçim toolbar'ı (X seçili · İndir · Yayınla · Ekle · Beğen · Sil ·
   Temizle). Katalog için her zaman görünür (gerçekte seçim varken belirir).
   ───────────────────────────────────────────────────────────────────────── */
function SecimAltToolbar() {
  return (
    <div className="glass-cip flex items-center gap-1.5 rounded-full py-2 pl-4 pr-2 shadow-2xl shadow-black/50">
      <span className="mr-1 text-[13px] font-medium text-metin">3 seçili</span>
      <span className="mx-1 h-5 w-px bg-kenar" />
      <button className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] text-metin-2 transition-colors hover:bg-white/8 hover:text-metin"><Download className="h-4 w-4" /> İndir</button>
      <button className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] text-metin-2 transition-colors hover:bg-white/8 hover:text-metin"><Sparkles className="h-4 w-4" /> Yayınla</button>
      <button className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] text-metin-2 transition-colors hover:bg-white/8 hover:text-metin"><FolderPlus className="h-4 w-4" /> Ekle</button>
      <button className="flex h-9 w-9 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/8 hover:text-rose-400" aria-label="Beğen"><Heart className="h-4 w-4" /></button>
      <button className="flex h-9 w-9 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/8 hover:text-tehlike" aria-label="Sil"><Trash2 className="h-4 w-4" /></button>
      <span className="mx-0.5 h-5 w-px bg-kenar" />
      <button className="flex h-9 w-9 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/8 hover:text-metin" aria-label="Seçimi temizle"><X className="h-4 w-4" /></button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ELEMENT: lightbox/sag-panel
   Kaynak: /panel/gorsel — üretilen görsele tıklayınca açılan lightbox'ın SAĞ
   panelinin tamamı: yazar başlığı + 3 sekme (Bilgi / Araçlar / Yorumlar).
   • Bilgi: İstem (Kopyala) + Detaylar (Model/Kalite/Boyut/…) + alt sabit CTA
     (Videoya çevir · Yeniden üret · Referans · İndir/♡/↗/⋯).
   • Araçlar: "Görseli Düzenle" editör araç listesi (Renk/Upscale/İyileştirici…).
   • Yorumlar: yorum listesi + yeni yorum girişi.
   Katalog için bağımsız/çalışır (kendi state'i).
   ───────────────────────────────────────────────────────────────────────── */
const LB_ARACLAR: [typeof Palette, string, string?][] = [
  [Palette, "Renk Derecelendirme", "Yeni"], [Maximize2, "Upscale"], [Wand2, "İyileştirici"],
  [Sun, "Yeniden Işıklandır"], [Scissors, "İç Boyama"], [Crop, "Yeniden Çerçevele"],
  [Eraser, "Arka Planı Kaldır"], [RotateCcw, "Açılar"],
];

function LightboxSagPanel() {
  const [sekme, setSekme] = useState<"info" | "araclar" | "yorumlar">("info");
  const [detayAcik, setDetayAcik] = useState(true);
  const [begenili, setBegenili] = useState(false);
  const [referansli, setReferansli] = useState(false);

  return (
    <div className="flex h-[560px] w-[340px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-yuzey shadow-[0_12px_36px_-12px_rgba(0,0,0,0.7)]">
      {/* Yazar başlığı */}
      <div className="flex items-center gap-2.5 border-b border-white/8 px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-aksan/15 text-[12px] font-bold text-aksan ring-1 ring-aksan/40">V</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-white">Vayra Kullanıcısı</span>
          <span className="block text-[11px] text-metin-3">Üretici</span>
        </span>
        <button className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/8 hover:text-metin" aria-label="Kapat"><X className="h-4 w-4" /></button>
      </div>

      {/* Segment sekmeler */}
      <div className="flex gap-1.5 border-b border-white/8 px-2.5 py-2.5">
        {([["info", "Bilgi", Info], ["araclar", "Araçlar", Wand2], ["yorumlar", "Yorumlar", MessageCircle]] as const).map(([id, ad, Ikon]) => (
          <button key={id} onClick={() => setSekme(id)}
            className={cn2("flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-[13px] font-medium transition-colors",
              sekme === id ? "glass-cip-aktif text-white" : "glass-cip text-metin-2 hover:text-metin")}>
            <Ikon className={cn2("h-3.5 w-3.5", sekme === id && "text-aksan")} /> {ad}
          </button>
        ))}
      </div>

      {/* BİLGİ */}
      {sekme === "info" && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto p-4">
            {/* İstem */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-metin-3"><Wand2 className="h-3.5 w-3.5" /> İstem</span>
                <button className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] text-metin-2 transition-colors hover:bg-white/8 hover:text-metin"><Copy className="h-3 w-3" /> Kopyala</button>
              </div>
              <div className="panel-ic rounded-[14px] p-3.5">
                <p className="text-[13.5px] leading-relaxed text-metin">temiz ürün fotoğrafı, yumuşak stüdyo ışığı, beyaz zemin, sinematik kalite</p>
              </div>
            </div>
            {/* Detaylar */}
            <div>
              <button onClick={() => setDetayAcik((v) => !v)} className="mb-2 flex w-full items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-metin-3">
                <Info className="h-3.5 w-3.5" /> Detaylar
                <ChevronDown className={cn2("ml-auto h-4 w-4 transition-transform", detayAcik && "rotate-180")} />
              </button>
              {detayAcik && (
                <div className="panel-ic space-y-2.5 rounded-[14px] p-3.5 text-[13.5px]">
                  {[["Model", "Nano Banana Pro"], ["Kalite", "2K"], ["Boyut", "1152x2048"], ["Oluşturma", "12 Temmuz 2026"]].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between"><span className="text-metin-3">{k}</span><span className="font-medium text-metin">{v}</span></div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Alt sabit CTA */}
          <div className="glass-cip shrink-0 space-y-2.5 border-t border-white/8 p-3">
            <button className="hf-cta flex w-full items-center justify-center gap-2 py-2.5 text-sm"><VideoIcon className="h-4 w-4" /> Videoya çevir</button>
            <div className="flex items-center gap-2">
              <button className="hf-btn glass-cip flex flex-1 items-center justify-center gap-1.5 rounded-[10px] py-2 text-[13px] text-metin"><RefreshCw className="h-3.5 w-3.5" /> Yeniden üret</button>
              <button onClick={() => setReferansli((v) => !v)}
                className={cn2("flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border py-2 text-[13px] transition-colors",
                  referansli ? "border-aksan/50 bg-aksan/10 text-aksan" : "glass-cip border-transparent text-metin")}>
                <UserSquare className="h-3.5 w-3.5" /> {referansli ? "Referans ✓" : "Referans"}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="hf-btn glass-cip flex flex-1 items-center justify-center gap-1.5 rounded-[10px] py-2 text-[13px] text-metin"><Download className="h-3.5 w-3.5" /> İndir</button>
              <button onClick={() => setBegenili((v) => !v)} aria-label="Beğen"
                className={cn2("flex h-9 w-10 items-center justify-center rounded-[10px] bg-white/6 transition-colors hover:bg-white/10", begenili ? "text-rose-400" : "text-metin-2 hover:text-rose-400")}>
                <Heart className={cn2("h-4 w-4", begenili && "fill-rose-400")} />
              </button>
              <button aria-label="Paylaş" className="flex h-9 w-10 items-center justify-center rounded-[10px] bg-white/6 text-metin-2 transition-colors hover:bg-white/10 hover:text-metin"><Share2 className="h-4 w-4" /></button>
              <button aria-label="Daha fazla" className="flex h-9 w-10 items-center justify-center rounded-[10px] bg-white/6 text-metin-2 transition-colors hover:bg-white/10 hover:text-metin"><MoreHorizontal className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      )}

      {/* ARAÇLAR */}
      {sekme === "araclar" && (
        <div className="flex-1 overflow-y-auto p-2">
          <p className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-metin-3"><Wand2 className="h-3.5 w-3.5" /> Görseli Düzenle</p>
          {LB_ARACLAR.map(([Ikon, ad, rozet]) => (
            <button key={ad} className="flex w-full items-center gap-3 rounded-[11px] px-3 py-2.5 text-left text-sm text-white transition-colors hover:bg-white/6">
              <Ikon className="h-[18px] w-[18px] shrink-0 text-metin-2" />
              <span className="flex-1 font-medium">{ad}</span>
              {rozet && <span className="rounded bg-aksan px-1.5 py-0.5 text-[9px] font-bold text-zemin">{rozet}</span>}
              <ChevronRight className="h-4 w-4 text-metin-3" />
            </button>
          ))}
        </div>
      )}

      {/* YORUMLAR */}
      {sekme === "yorumlar" && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div className="flex gap-2.5">
              <span className="h-8 w-8 shrink-0 rounded-full bg-aksan/15 ring-1 ring-aksan/30" />
              <div className="text-[13.5px] leading-snug"><span className="font-semibold text-white">deniz</span> <span className="text-metin-2">renk paleti harika olmuş</span><div className="mt-1 text-[11px] text-metin-3">2sa önce</div></div>
            </div>
            <div className="flex flex-col items-center justify-center py-8 text-center text-metin-3">
              <MessageCircle className="mb-2 h-6 w-6" />
              <p className="text-[13px]">İlk yorumu sen yaz</p>
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-white/8 p-3">
            <input placeholder="Yorum ekle…" className="flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-metin-3" />
            <button className="text-aksan disabled:opacity-40"><Send className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ELEMENT: composer/iyilestir-cipi · composer/ses-cipi · composer/element-cipi
   Kaynak: /panel/video — üretim panelindeki prompt altı çipler. Açık/kapalı
   toggle (aktif → glass-cip-aktif + aksan). Katalog için çalışır.
   ───────────────────────────────────────────────────────────────────────── */
function ComposerCip({ ikon: Ikon, acikMetin, kapaliMetin, baslangic = true }: {
  ikon: typeof Sparkles; acikMetin: string; kapaliMetin: string; baslangic?: boolean;
}) {
  const [acik, setAcik] = useState(baslangic);
  return (
    <button onClick={() => setAcik((v) => !v)}
      className={cn2("flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] transition-colors",
        acik ? "glass-cip-aktif text-aksan" : "glass-cip text-metin-2 hover:text-metin")}>
      <Ikon className="h-3 w-3" /> {acik ? acikMetin : kapaliMetin}
    </button>
  );
}
function ElementAcCip() {
  return (
    <button className="glass-cip flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] text-metin-2 transition-colors hover:text-metin">
      <AtSign className="h-3 w-3" /> Element
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ELEMENT: composer/element-cipi-eklendi
   Kaynak: /components/panel/ElementCip — element eklendikten sonra prompt
   içinde beliren çip (avatar + @isim yeşil + ×). Üstüne gelince BÜYÜK referans
   önizleme kartı açılır (avatar + tür rozeti + açıklama). Katalog için çalışır.
   ───────────────────────────────────────────────────────────────────────── */
function ElementEklenmisChip() {
  const [hover, setHover] = useState(false);
  const arka = "linear-gradient(135deg,#3a2f5e,#7c3aed)";
  return (
    <span className="relative inline-flex" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {/* Büyük hover önizleme */}
      <AnimatePresence>
        {hover && (
          <motion.span initial={{ opacity: 0, y: 6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.96 }} transition={{ duration: 0.14 }}
            className="menu-surface pointer-events-none absolute bottom-full left-0 z-[70] mb-2 w-64 overflow-hidden rounded-2xl shadow-2xl shadow-black/60">
            <span className="relative block aspect-[4/5] w-full" style={{ background: arka }}>
              <span className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-black/85 to-transparent p-3 pt-8">
                <User className="h-3.5 w-3.5 text-white/80" />
                <span className="text-sm font-semibold text-white">@Talha</span>
                <span className="ml-auto rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] text-white/80">Karakter</span>
              </span>
            </span>
            <span className="block px-3 py-2 text-xs text-white/55">Tutarlı ana karakter — koyu saçlı, gözlüklü.</span>
          </motion.span>
        )}
      </AnimatePresence>
      {/* Çip */}
      <span className="group inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] py-0.5 pl-0.5 pr-2 transition-colors hover:border-lime-400/40 hover:bg-white/[0.1]">
        <span className="h-5 w-5 shrink-0 overflow-hidden rounded-full ring-1 ring-white/15" style={{ background: arka }} />
        <span className="text-xs font-semibold text-lime-300">@Talha</span>
        <button aria-label="kaldır" className="flex h-4 w-4 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/15 hover:text-white"><X className="h-3 w-3" /></button>
      </span>
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ELEMENT: composer/element-secici-modal
   Kaynak: /components/panel/element/ElementSeciciModal — "Element" çipine
   tıklayınca açılan ekleme akışı: üst bar + filtre + element grid + Kullan.
   Katalog için sadeleştirilmiş temsili görünüm (tam modal kaynak dosyada).
   ───────────────────────────────────────────────────────────────────────── */
function ElementSeciciTemsili() {
  const turler: [typeof User, string][] = [[User, "Karakter"], [MapPin, "Mekan"], [Package, "Obje"], [Palette, "Stil"]];
  return (
    <div className="w-[420px] overflow-hidden rounded-[22px] border border-white/10 bg-[#151517] shadow-2xl">
      <div className="flex items-center justify-between px-5 pt-4">
        <span className="rounded-full bg-white px-3.5 py-1.5 text-[13px] font-bold text-black">Elementler</span>
        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-metin-2 hover:bg-white/12 hover:text-white"><X className="h-4 w-4" /></button>
      </div>
      <div className="flex items-center justify-between gap-3 px-5 py-3.5">
        <p className="text-[13px] font-medium text-metin-2">Elementlerim</p>
        <button className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] text-white hover:bg-white/[0.07]"><SlidersHorizontal className="h-3.5 w-3.5" /> Filtre</button>
      </div>
      <div className="grid grid-cols-3 gap-2.5 px-5 pb-5">
        {turler.map(([Ikon, ad], i) => (
          <button key={ad} className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-colors hover:border-white/15">
            <span className="relative block aspect-[4/5] w-full" style={{ background: `linear-gradient(${120 + i * 40}deg,#2a2350,#0891b2)` }}>
              <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-black/45 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm"><Ikon className="h-3 w-3" /> {ad}</span>
            </span>
            <span className="truncate px-2.5 py-2 text-left text-[12.5px] font-semibold text-white">@{ad}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ELEMENT: composer/sure-secici
   Kaynak: /panel/video → SureKaydirici — üretim panelindeki süre seçici
   (segment/kaydırıcı). Katalog için çalışır kopya.
   ───────────────────────────────────────────────────────────────────────── */
function SureSecici() {
  const secenekler = ["3sn", "5sn", "8sn", "10sn", "12sn", "15sn"];
  const [deger, setDeger] = useState("5sn");
  return (
    <div className="w-[320px]">
      <p className="mb-2 text-[13px] font-medium text-metin">Süre seç</p>
      <div className="flex gap-1.5 rounded-full bg-white/[0.04] p-1">
        {secenekler.map((s) => (
          <button key={s} onClick={() => setDeger(s)}
            className={cn2("flex-1 rounded-full py-1.5 text-[12.5px] font-semibold transition-colors",
              deger === s ? "bg-aksan text-zemin" : "text-metin-2 hover:text-white")}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ELEMENT: composer/sinema-uretim-paneli
   Kaynak: /panel/sinema → VideoComposer — ana sayfadaki tam üretim paneli.
   Sol Görsel/Video dikey anahtarı (hf-kabuk + hf-cip-aktif) · prompt kutusu +
   boyut tutamağı + alt çip şeridi (+, @, model, oran, çözünürlük, süre, adet,
   ses) + sağda büyük ÜRET butonu (hf-uret, 104×150, kredi rozetli).
   .sinema-kapsam ile mavi aksan uygulanır. Katalog için çalışır kopya.
   ───────────────────────────────────────────────────────────────────────── */
function SinemaUretimPaneli() {
  const [kip, setKip] = useState<"gorsel" | "video">("video");
  const [ses, setSes] = useState(true);
  const cip = "hf-btn flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-2 text-[13px] text-metin transition-colors hover:bg-white/[0.1]";
  return (
    <div className="sinema-kapsam w-full">
      <div className="flex items-stretch gap-2.5">
        {/* Sol dikey Görsel/Video anahtarı */}
        <div className="hf-kabuk flex shrink-0 flex-col gap-1 self-center rounded-[22px] bg-white/[0.03] p-1.5 ring-1 ring-white/[0.06]">
          {([["gorsel", "Görsel", ImageIcon], ["video", "Video", VideoIcon]] as const).map(([id, ad, Ik]) => (
            <button key={id} onClick={() => setKip(id)}
              className={cn2("flex h-[52px] w-[64px] flex-col items-center justify-center gap-1 rounded-2xl text-[12px] transition-colors",
                kip === id ? "bg-white/[0.1] font-semibold text-metin" : "text-metin-3 hover:text-metin")}>
              <Ik className="h-[18px] w-[18px]" />{ad}
            </button>
          ))}
        </div>

        {/* Composer gövdesi */}
        <div className="relative flex min-w-0 flex-1 flex-col justify-center gap-2 rounded-[22px] bg-white/[0.03] p-3 ring-1 ring-white/[0.06]">
          {/* boyut tutamağı */}
          <div className="absolute -top-1.5 left-1/2 flex h-5 w-24 -translate-x-1/2 items-center justify-center">
            <span className="h-[5px] w-12 rounded-full" style={{ background: "var(--sn-lime,#55d6fd)", opacity: 0.75 }} />
          </div>
          <textarea rows={1} placeholder="Oluşturmak istediğin videoyu anlat…"
            className="max-h-[40vh] w-full resize-none bg-transparent px-1 py-1.5 text-[16px] leading-relaxed text-metin outline-none placeholder:text-metin-3" />
          {/* çip satırı */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
            <button className={cn2(cip, "!px-2.5")}><Plus className="h-4 w-4" /></button>
            <button className={cn2(cip, "!px-2.5")}><AtSign className="h-4 w-4" /></button>
            <button className={cip}><Sparkles className="h-3.5 w-3.5 text-aksan" /> Sinema Stüdyo 3.5</button>
            <button className={cip}><Scan className="h-3.5 w-3.5" /> Auto</button>
            <button className={cip}><Globe className="h-3.5 w-3.5" /> 1080p</button>
            <button className={cip}><Clock className="h-3.5 w-3.5" /> 4sn</button>
            <span className="flex items-center gap-1 rounded-full bg-white/[0.06] px-1.5 py-1 text-[13px] text-metin">
              <button className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/10"><Minus className="h-3.5 w-3.5" /></button>
              2/4
              <button className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/10"><Plus className="h-3.5 w-3.5" /></button>
            </span>
            <button onClick={() => setSes((v) => !v)} className={cip}><Volume2 className="h-3.5 w-3.5" /> {ses ? "Açık" : "Kapalı"}</button>
          </div>
        </div>

        {/* ÜRET butonu */}
        <button className="hf-uret flex h-[104px] w-[150px] shrink-0 flex-col items-center justify-center gap-1 self-center rounded-2xl px-4">
          <span className="text-[16px] font-black tracking-wide">ÜRET</span>
          <span className="flex items-center gap-1 text-[14px] font-bold"><Sparkles className="h-3.5 w-3.5" /> <span className="text-black/40 line-through">96</span> 80</span>
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ELEMENT: sidebar/studyo-sidebar
   Kaynak: /panel/sinema → StudyoSidebar — dar sol stüdyo sidebar'ı.
   Başlık (aksan rozet + ad + daralt) · 4 gradyan-rozet menü (Ana Sayfa /
   Üretimlerim / Elementlerim / Favorilerim) · PROJELER (ara/sırala) · Yeni
   proje · proje listesi (hover'da ⋮) · Tüm projeleri gör · Çalışma alanı.
   Katalog için çalışır kopya (aktif satır seçilebilir).
   ───────────────────────────────────────────────────────────────────────── */
const SIDEBAR_MENU = [
  { ad: "Ana Sayfa", ikon: Home, grad: "linear-gradient(180deg,#eef0f2,#c4c8cd)", renk: "#3a3d42" },
  { ad: "Üretimlerim", ikon: Images, grad: "linear-gradient(180deg,#7fe3f5,#22b8d6)", renk: "#0a3540" },
  { ad: "Elementlerim", ikon: Shapes, grad: "linear-gradient(180deg,#8ea0ff,#5a5cf0)", renk: "#fff" },
  { ad: "Favorilerim", ikon: Heart, grad: "linear-gradient(180deg,#ff9ecb,#f0568f)", renk: "#fff" },
];
const SIDEBAR_PROJELER = ["asd", "Çöl Yolculuğu", "İlk proje", "Neon Şehir", "Uzun Video Örneği"];

function StudyoSidebarDemo() {
  const [aktif, setAktif] = useState("Ana Sayfa");
  const [sira, setSira] = useState(false);
  return (
    <div className="sinema-kapsam flex h-[560px] w-[248px] flex-col overflow-hidden rounded-2xl border border-[#171717] bg-[#0f1113]">
      {/* Başlık */}
      <div className="flex items-center gap-2 px-3 pb-1 pt-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-aksan text-zemin shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"><Clapperboard className="h-3.5 w-3.5" /></span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-metin">Sinema Stüdyosu</span>
        <button className="text-metin-3 transition-colors hover:text-metin"><PanelLeft className="h-4 w-4" /></button>
      </div>
      {/* Menü — gradyan rozet ikonlar */}
      <nav className="mt-2 space-y-0.5 px-2">
        {SIDEBAR_MENU.map((m) => (
          <button key={m.ad} onClick={() => setAktif(m.ad)}
            className={cn2("flex h-10 w-full items-center gap-2.5 rounded-lg px-2 text-sm transition-colors",
              aktif === m.ad ? "bg-[#1e1e1e] text-metin" : "text-metin-2 hover:bg-white/5 hover:text-metin")}>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_1px_2px_rgba(0,0,0,0.35)]" style={{ background: m.grad }}>
              <m.ikon className="h-[15px] w-[15px]" strokeWidth={2.2} style={{ color: m.renk }} />
            </span>
            {m.ad}
          </button>
        ))}
      </nav>
      {/* PROJELER başlığı */}
      <div className="relative mt-5 px-3">
        <div className="flex items-center justify-between">
          <span className="text-[12px] uppercase tracking-wide text-metin-3">Projeler</span>
          <div className="flex items-center gap-1 text-metin-3">
            <button className="rounded-md p-1 transition-colors hover:text-metin"><Search className="h-3.5 w-3.5" /></button>
            <button onClick={() => setSira((v) => !v)} className={cn2("rounded-md p-1 transition-colors hover:text-metin", sira && "bg-white/10 text-metin")}><ArrowDownUp className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>
      {/* Yeni proje + liste */}
      <div className="mt-1.5 flex-1 space-y-0.5 overflow-y-auto px-2">
        <button className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2 text-sm text-metin-2 transition-colors hover:bg-white/5 hover:text-metin">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border border-dashed border-white/25 text-metin-3"><Plus className="h-3.5 w-3.5" /></span>
          Yeni proje
        </button>
        {SIDEBAR_PROJELER.map((p, i) => (
          <div key={p} className="group/pr relative">
            <button className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2 pr-8 text-sm text-metin-2 transition-colors hover:bg-[#1c1c1e] hover:text-metin">
              <span className="h-6 w-6 shrink-0 overflow-hidden rounded-[7px] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]" style={{ background: `linear-gradient(${120 + i * 35}deg,#2a2350,#0891b2)` }} />
              <span className="min-w-0 flex-1 truncate text-left">{p}</span>
            </button>
            <button className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-metin-2 opacity-0 transition-all hover:bg-white/10 hover:text-metin group-hover/pr:opacity-100"><MoreVertical className="h-4 w-4" /></button>
          </div>
        ))}
        <button className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2 text-[13px] text-metin-3 transition-colors hover:bg-white/5 hover:text-metin">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] bg-white/[0.06]"><Archive className="h-3.5 w-3.5" /></span>
          Tüm projeleri gör
        </button>
      </div>
      {/* Çalışma alanı */}
      <div className="px-3 pb-3">
        <button className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-metin-2 transition-colors hover:bg-white/5">
          <span className="h-5 w-5 shrink-0 rounded-full bg-yuzey-3" />
          <span className="flex-1 truncate text-left">Çalışma alanı</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ÇEKİRDEK — kategori & öğe render altyapısı
   ═══════════════════════════════════════════════════════════════════════ */

/** cn — küçük sınıf birleştirici (katalog kendi içinde bağımsız). */
function cn2(...s: (string | false | undefined | null)[]) { return s.filter(Boolean).join(" "); }

type Oge = {
  /** Referans ismi — sen "şu elementi ekle" derken kullanacağın ad. */
  ad: string;
  /** Nereden geldiği / ne işe yaradığı (kısa not). */
  not?: string;
  /** Canlı, çalışan önizleme. */
  onizleme: ReactNode;
  /** Kopyalanabilir JSX/kod. */
  kod: string;
  /** Önizleme zemini koyu mu açık mı (kontrast için). */
  zemin?: "koyu" | "acik";
};

type Kategori = { id: string; ad: string; ogeler: Oge[] };

function KodBlok({ kod }: { kod: string }) {
  const [kopyalandi, setKopyalandi] = useState(false);
  const kopyala = () => {
    navigator.clipboard?.writeText(kod).then(() => {
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 1400);
    }).catch(() => {});
  };
  return (
    <div className="group/kod relative mt-3 overflow-hidden rounded-xl border border-white/10 bg-[#0c0d0f]">
      <button onClick={kopyala}
        className="absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-[12px] font-medium text-metin-2 opacity-0 transition-all hover:bg-white/[0.1] hover:text-white group-hover/kod:opacity-100">
        {kopyalandi ? <><Check className="h-3.5 w-3.5 text-aksan" /> Kopyalandı</> : <><Copy className="h-3.5 w-3.5" /> Kopyala</>}
      </button>
      <pre className="overflow-x-auto p-4 text-[12.5px] leading-relaxed text-metin-2"><code>{kod}</code></pre>
    </div>
  );
}

function KatalogOge({ oge }: { oge: Oge }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-yuzey p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <code className="rounded-md bg-aksan/12 px-2 py-0.5 text-[13px] font-semibold text-aksan">{oge.ad}</code>
          {oge.not && <span className="ml-2 text-[12.5px] text-metin-3">{oge.not}</span>}
        </div>
      </div>
      {/* Canlı önizleme */}
      <div className={cnZemin(oge.zemin)}>
        {oge.onizleme}
      </div>
      {/* Kopyalanabilir kod */}
      <KodBlok kod={oge.kod} />
    </div>
  );
}

function cnZemin(zemin?: "koyu" | "acik") {
  const taban = "flex min-h-[96px] items-center justify-center gap-4 rounded-xl p-6";
  return zemin === "acik" ? `${taban} bg-white` : `${taban} bg-zemin`;
}

/* ═══════════════════════════════════════════════════════════════════════
   KATALOG — kategoriler ve öğeler
   (Buraya sen söyledikçe gerçek elementleri ekleyeceğiz.)
   ═══════════════════════════════════════════════════════════════════════ */

const KATEGORILER: Kategori[] = [
  {
    id: "butonlar",
    ad: "Butonlar",
    ogeler: [
      {
        ad: "ornek/ilk-buton",
        not: "yapı gösterimi — birazdan gerçek elementlerle değiştireceğiz",
        onizleme: (
          <button className="flex items-center gap-2 rounded-2xl bg-aksan px-5 py-3 text-[15px] font-bold text-zemin transition-transform hover:scale-[1.02]">
            Örnek Buton
          </button>
        ),
        kod: `<button className="flex items-center gap-2 rounded-2xl bg-aksan px-5 py-3 text-[15px] font-bold text-zemin transition-transform hover:scale-[1.02]">
  Örnek Buton
</button>`,
      },
    ],
  },
  {
    id: "paneller",
    ad: "Paneller & Kartlar",
    ogeler: [
      {
        ad: "glass-panel (deneme)",
        not: "kullanıcının verdiği glassmorphism reçetesi — beğenilirse her yerde kullanılacak. Arka plan HAREKETLİ: backdrop-filter yalnız arkasında içerik varken görünür.",
        zemin: "koyu",
        onizleme: <GlassPanelDenemesi />,
        kod: `/* globals.css */
.glass-panel {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 24px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
}

/* Koyu tema uyarlaması — Vayra yüzeylerinde orijinali fazla parlak kalıyor */
.glass-panel-koyu {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(15px) saturate(1.2);
  -webkit-backdrop-filter: blur(15px) saturate(1.2);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.35);
}

{/* Kullanım — panel */}
<div className="glass-panel p-6">…</div>

{/* Kullanım — buton (yuvarlak istiyorsan borderRadius'u ez) */}
<button className="glass-panel px-5 py-2" style={{ borderRadius: 999 }}>Cam Buton</button>

{/* UYARI: arkasında düz tek renk varsa efekt GÖRÜNMEZ.
    Gradyan, görsel, video ya da renkli lekeler gerekir. */}`,
      },
      {
        ad: "hover-araclari/gorsel-kart",
        not: "/panel/gorsel — üretilen görselin üstüne gelince çıkan araçlar",
        zemin: "koyu",
        onizleme: <GorselKartHoverAraclari />,
        kod: `{/* Kart .group olmalı; hover'da araçlar belirir. Eylemleri
    onBegen / onIndir / onKopyala / onReferans / onAnimate / on3d'ye bağla. */}
{/* ⋯ (Daha fazla) menüsü için ayrı element: hover-araclari/gorsel-kart-menu */}
<div className="group relative w-[220px] overflow-hidden rounded-2xl">
  <img src={url} alt="" className="block w-full" />

  {/* hover vinyeti — köşe ikonları okunur kalsın */}
  <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
    style={{ background: "radial-gradient(120% 100% at 50% 50%, transparent 55%, rgba(0,0,0,.55) 100%)" }} />

  {/* sağ-üst dikey ray */}
  <div className="pointer-events-none absolute right-2 top-2 z-20 flex flex-col gap-1.5 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
    <button onClick={onBegen} className="glass-ikon hf-btn flex h-9 w-9 items-center justify-center rounded-full text-white"><Heart className="h-[18px] w-[18px]" /></button>
    <button onClick={onIndir} className="glass-ikon hf-btn flex h-9 w-9 items-center justify-center rounded-full text-white"><Download className="h-[18px] w-[18px]" /></button>
    <button onClick={onKopyala} className="glass-ikon hf-btn flex h-9 w-9 items-center justify-center rounded-full text-white"><Copy className="h-[18px] w-[18px]" /></button>
    <button onClick={menuAc} className="glass-ikon hf-btn flex h-9 w-9 items-center justify-center rounded-full text-white"><MoreHorizontal className="h-[18px] w-[18px]" /></button>
  </div>

  {/* alt-orta hızlı eylemler */}
  <div className="pointer-events-none absolute inset-x-0 bottom-2 z-20 flex items-center justify-center gap-1.5 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
    <button onClick={onReferans} className="glass-ikon hf-btn flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-aksan hover:text-zemin"><ImagePlus className="h-4 w-4" /></button>
    <button onClick={onAnimate} className="glass-ikon hf-btn flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-aksan hover:text-zemin"><Video className="h-4 w-4" /></button>
    <button onClick={on3d} className="glass-ikon hf-btn flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-aksan hover:text-zemin"><Box className="h-4 w-4" /></button>
  </div>
</div>`,
      },
      {
        ad: "hover-araclari/gorsel-kart-menu",
        not: "/panel/gorsel — kart ⋯ butonuna tıklayınca açılan menü (paylaş alt-menülü)",
        zemin: "koyu",
        onizleme: (
          <div className="flex min-h-[300px] w-full items-start justify-center pt-2">
            <GorselKartMenu />
          </div>
        ),
        kod: `{/* ⋯ menüsü — açık/kapalı state + paylaş alt-menüsü.
    Satır eylemlerini onAc / onYenidenUret / onKopyala / onElement /
    onBegen / onKlasor / onYayinla / onIndir / onSil'e bağla. */}
const [acik, setAcik] = useState(false);
const [paylasAcik, setPaylasAcik] = useState(false);

<div className="relative">
  <button onClick={() => setAcik(v => !v)} className="glass-ikon hf-btn flex h-9 w-9 items-center justify-center rounded-full text-white">
    <MoreHorizontal className="h-[18px] w-[18px]" />
  </button>
  <AnimatePresence>
    {acik && (
      <>
        <div className="fixed inset-0 z-[60]" onClick={() => setAcik(false)} />
        <motion.div initial={{ opacity: 0, scale: .97, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .97 }} transition={{ duration: .13 }}
          className="menu-surface absolute left-full top-0 z-[61] ml-2 w-56 rounded-2xl p-1.5">
          <MenuSatir ikon={ArrowUpRight} ad="Aç" onClick={onAc} />
          <MenuSatir ikon={RefreshCw} ad="Yeniden üret" onClick={onYenidenUret} />
          <MenuSatir ikon={Copy} ad="Yeniden kullan" onClick={onKopyala} />
          <MenuSatir ikon={AtSign} ad="Element oluştur" onClick={onElement} />
          <MenuSatir ikon={Heart} ad="Beğen" onClick={onBegen} />
          {/* Paylaş → alt-menü (hover) */}
          <div className="relative" onMouseEnter={() => setPaylasAcik(true)} onMouseLeave={() => setPaylasAcik(false)}>
            <button className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-[15px] font-medium text-white hover:bg-white/8">
              <Share2 className="h-[18px] w-[18px] text-white/70" /> Paylaş
              <ChevronRight className="ml-auto h-4 w-4 text-white/40" />
            </button>
            {paylasAcik && (
              <motion.div className="menu-surface absolute left-full top-0 ml-1.5 w-56 rounded-2xl p-1.5">
                {/* Bağlantıyı kopyala · X · WhatsApp · Pinterest · LinkedIn */}
              </motion.div>
            )}
          </div>
          <MenuSatir ikon={FolderPlus} ad="Klasöre ekle" onClick={onKlasor} />
          <MenuSatir ikon={Upload} ad="Yayınla" onClick={onYayinla} />
          <MenuSatir ikon={Download} ad="İndir" onClick={onIndir} />
          <div className="my-1 h-px bg-white/8" />
          <MenuSatir ikon={Trash2} ad="Sil" onClick={onSil} tehlike />
        </motion.div>
      </>
    )}
  </AnimatePresence>
</div>`,
      },
    ],
  },
  {
    id: "secim",
    ad: "Seçim & Toplu İşlem",
    ogeler: [
      {
        ad: "secim/kart-secme-kutusu",
        not: "/panel/gorsel — görselin üstüne gelince sol-üstte çıkan seçim kutusu (tıkla)",
        zemin: "koyu",
        onizleme: (
          <div className="flex items-center gap-4">
            <KartSecmeKutusu />
            <span className="text-[12.5px] text-metin-3">← hover et, kutuya tıkla</span>
          </div>
        ),
        kod: `{/* Kart .group; boşken hover'da belirir, seçiliyken kalıcı (aksan dolu). */}
<button onClick={() => secimToggle(id)} aria-label="Seç"
  className={cn(
    "absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-md border-2 backdrop-blur-sm transition-all",
    secili
      ? "border-aksan bg-aksan text-zemin opacity-100"
      : "pointer-events-none border-white/70 opacity-0 group-hover:pointer-events-auto group-hover:opacity-100",
  )}>
  {secili && <Check className="h-3 w-3" strokeWidth={3.5} />}
</button>`,
      },
      {
        ad: "secim/alt-toolbar",
        not: "/panel/gorsel — seçim yapınca alttan çıkan yüzen toplu-işlem çubuğu",
        zemin: "koyu",
        onizleme: <SecimAltToolbar />,
        kod: `{/* Seçim varken composer yerine alttan yükselir (AnimatePresence). */}
<AnimatePresence>
  {secimVar && (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
      <div className="glass-cip flex items-center gap-1.5 rounded-full py-2 pl-4 pr-2 shadow-2xl shadow-black/50">
        <span className="mr-1 text-[13px] font-medium text-metin">{sayi} seçili</span>
        <span className="mx-1 h-5 w-px bg-kenar" />
        <button onClick={onIndir} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] text-metin-2 hover:bg-white/8 hover:text-metin"><Download className="h-4 w-4" /> İndir</button>
        <button onClick={onYayinla} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] text-metin-2 hover:bg-white/8 hover:text-metin"><Sparkles className="h-4 w-4" /> Yayınla</button>
        <button onClick={onEkle} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] text-metin-2 hover:bg-white/8 hover:text-metin"><FolderPlus className="h-4 w-4" /> Ekle</button>
        <button onClick={onBegen} className="flex h-9 w-9 items-center justify-center rounded-full text-metin-2 hover:bg-white/8 hover:text-rose-400"><Heart className="h-4 w-4" /></button>
        <button onClick={onSil} className="flex h-9 w-9 items-center justify-center rounded-full text-metin-2 hover:bg-white/8 hover:text-tehlike"><Trash2 className="h-4 w-4" /></button>
        <span className="mx-0.5 h-5 w-px bg-kenar" />
        <button onClick={onTemizle} className="flex h-9 w-9 items-center justify-center rounded-full text-metin-2 hover:bg-white/8 hover:text-metin"><X className="h-4 w-4" /></button>
      </div>
    </motion.div>
  )}
</AnimatePresence>`,
      },
    ],
  },
  {
    id: "lightbox",
    ad: "Lightbox & Detay Panelleri",
    ogeler: [
      {
        ad: "lightbox/sag-panel",
        not: "/panel/gorsel — görsele tıklayınca açılan sağ panelin tamamı (Bilgi/Araçlar/Yorumlar)",
        zemin: "koyu",
        onizleme: (
          <div className="flex justify-center">
            <LightboxSagPanel />
          </div>
        ),
        kod: `{/* Lightbox sağ paneli — 340px, border-l, bg-yuzey. 3 sekme.
    Kaynak yapı: src/app/panel/gorsel/page.tsx  (aside ~1964, InfoSekmesi ~2770)

    İSKELET:
    <motion.aside className="flex w-[340px] shrink-0 flex-col border-l border-white/10 bg-yuzey">
      {/* 1) Yazar başlığı: avatar + ad + "Üretici" + kapat (X) */}
      {/* 2) Segment sekmeler: Bilgi(Info) · Araçlar(Wand2) · Yorumlar(MessageCircle)
             aktif → glass-cip-aktif, pasif → glass-cip */}

      {/* BİLGİ sekmesi */}
      {sekme === "info" && (
        <>
          {/* İstem kutusu (panel-ic) + Kopyala */}
          {/* Detaylar (toggle): Model · Kalite · Boyut · Oluşturma (DetaySatir) */}
          {/* Alt SABİT CTA (glass-cip, border-t):
               • Videoya çevir (hf-cta, tam genişlik)
               • Yeniden üret | Referans (referansli → aksan)
               • İndir | ♡ | ↗ | ⋯  */}
        </>
      )}

      {/* ARAÇLAR sekmesi — "Görseli Düzenle" başlığı + ARACLAR listesi:
           Renk Derecelendirme(Yeni) · Upscale · İyileştirici · Yeniden Işıklandır
           · İç Boyama · Yeniden Çerçevele · Arka Planı Kaldır · Açılar
           her satır: ikon + ad + (rozet) + ChevronRight, tıkla → alt-panel aç */}

      {/* YORUMLAR sekmesi — YorumSekmesi: yorum listesi + yeni yorum girişi (Send) */}
    </motion.aside>

    NOT: Araçlar'daki her araç ayrı bir SAĞ ALT-PANEL açar (RenkPaneli,
    UpscalePaneli, IyilestiriciPaneli, IsikPaneli, InpaintPaneli, ReframePaneli,
    ArkaplanPaneli, AcilarPaneli) — onları da ayrı element olarak ekleyebiliriz. */}`,
      },
    ],
  },
  {
    id: "sidebarlar",
    ad: "Sidebar'lar",
    ogeler: [
      {
        ad: "sidebar/studyo-sidebar",
        not: "/panel/sinema → StudyoSidebar — dar sol stüdyo sidebar'ı (tüm parçalarıyla)",
        zemin: "koyu",
        onizleme: <div className="flex justify-center"><StudyoSidebarDemo /></div>,
        kod: `{/* Kaynak: src/components/kabuk/StudyoSidebar.tsx — ~215px, fixed, .sinema-kapsam.
    Sinema/Pazarlama/Shorts vb. stüdyolar bu ORTAK sidebar'ı kullanır. */}
<StudyoSidebar
  baslik="Sinema Stüdyosu"
  ikon={<Clapperboard className="h-3.5 w-3.5" />}
  temel="/panel/sinema"
  projeler={sinemaProjeler}
  onYeniProje={() => setYeniProjeModal(true)}
  onProjeIslem={projeIslem}
/>

{/* İç yapı (yukarıdan aşağı):
   • Başlık: aksan rozet + ad + daralt (PanelLeft)
   • 4 gradyan-rozet menü: Ana Sayfa · Üretimlerim · Elementlerim · Favorilerim
     (her biri kendi 3D gradyan rozeti; aktif → bg-[#1e1e1e])
   • PROJELER başlığı + Ara(Search) / Sırala(ArrowDownUp) menüsü
   • Yeni proje (dashed + ikonu) + proje listesi (hover'da ⋮ İşlemler menüsü:
     Sabitle/Düzenle/Klasör ekle/Bağlantı kopyala/Sil)
   • Tüm projeleri gör (Archive)
   • Alt: Çalışma alanı (ChevronDown)
   • Sağ kenar: sürükle-genişlet tutamağı (180–360px) + çok sola çekince dar mod */}`,
      },
    ],
  },
  {
    id: "composer",
    ad: "Composer (Üretim Paneli)",
    ogeler: [
      {
        ad: "composer/sinema-uretim-paneli",
        not: "/panel/sinema → VideoComposer — ana sayfadaki TAM üretim paneli (Görsel/Video · prompt · çipler · ÜRET)",
        zemin: "koyu",
        onizleme: <SinemaUretimPaneli />,
        kod: `{/* Kaynak: /panel/sinema (VideoComposer.tsx ~787). .sinema-kapsam → mavi aksan.
    3 blok: [Görsel/Video dikey anahtar] [prompt + çip satırı] [ÜRET].
    Gerçek kullanımda çipler modeldeki spec.cipler'e göre dinamik gelir. */}
<div className="flex items-stretch gap-2.5">
  {/* Sol dikey anahtar (hf-kabuk) */}
  <div className="hf-kabuk flex shrink-0 flex-col gap-1 self-center rounded-[22px] p-1.5">
    {["Görsel","Video"].map(ad => (
      <button className={cn("flex h-[52px] w-[64px] flex-col items-center justify-center gap-1 rounded-2xl text-[12px]",
        kip===ad ? "hf-cip-aktif font-semibold text-metin" : "text-metin-3 hover:text-metin")}>
        <Ikon className="h-[18px] w-[18px]" />{ad}
      </button>
    ))}
  </div>

  {/* Gövde: prompt + boyut tutamağı + çip satırı */}
  <div className="hf-kabuk relative flex min-w-0 flex-1 flex-col justify-center gap-2 rounded-[22px] p-3">
    <div className="absolute -top-1.5 left-1/2 h-5 w-24 -translate-x-1/2 cursor-ns-resize" /* tutamak */ />
    <textarea rows={1} placeholder="Oluşturmak istediğin videoyu anlat…"
      className="prompt-alan w-full resize-none bg-transparent px-1 py-1.5 text-[16px] text-metin outline-none" />
    <div className="flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
      {/* + · @ · model · Auto · 1080p · 4sn · adet(−/+) · Ses — spec.cipler'den */}
    </div>
  </div>

  {/* ÜRET (hf-uret) — composer DIŞINDA, sağda sabit 104×150 */}
  <button onClick={onUret} className="hf-uret flex h-[104px] w-[150px] shrink-0 flex-col items-center justify-center gap-1 self-center rounded-2xl px-4">
    <span className="text-[16px] font-black tracking-wide">ÜRET</span>
    <span className="text-[14px] font-bold">{kredi}</span>
  </button>
</div>`,
      },
      {
        ad: "composer/iyilestir-cipi",
        not: "/panel/video — prompt altı 'İstemi iyileştir' toggle çipi",
        zemin: "koyu",
        onizleme: <ComposerCip ikon={Sparkles} acikMetin="İyileştir açık" kapaliMetin="İyileştir kapalı" baslangic />,
        kod: `const [iyilestir, setIyilestir] = useState(true);

<button onClick={() => { setIyilestir(v => !v); toast(iyilestir ? "İstem iyileştirme kapalı" : "İstem iyileştirme açık ✨"); }}
  className={cn("flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px]",
    iyilestir ? "glass-cip-aktif text-aksan" : "glass-cip text-metin-2 hover:text-metin")}>
  <Sparkles className="h-3 w-3" /> İyileştir {iyilestir ? "açık" : "kapalı"}
</button>`,
      },
      {
        ad: "composer/ses-cipi",
        not: "/panel/video — prompt altı 'Ses açık/kapalı' toggle çipi (ses üreten modeller)",
        zemin: "koyu",
        onizleme: <ComposerCip ikon={VolumeX} acikMetin="Ses açık" kapaliMetin="Ses kapalı" baslangic={false} />,
        kod: `const [sesli, setSesli] = useState(false);

<button onClick={() => { setSesli(v => !v); toast(sesli ? "Ses kapalı" : "Ortam sesi açık 🔊"); }}
  className={cn("flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px]",
    sesli ? "glass-cip-aktif text-aksan" : "glass-cip text-metin-2 hover:text-metin")}>
  <VolumeX className="h-3 w-3" /> Ses {sesli ? "açık" : "kapalı"}
</button>`,
      },
      {
        ad: "composer/element-cipi",
        not: "/panel/video — prompt altı '@ Element' ekle butonu (modalı açar)",
        zemin: "koyu",
        onizleme: <ElementAcCip />,
        kod: `<button onClick={() => setElementModal(true)}
  className="glass-cip flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] text-metin-2 hover:text-metin">
  <AtSign className="h-3 w-3" /> Element
</button>`,
      },
      {
        ad: "composer/element-secici-modal",
        not: "/components/panel/element/ElementSeciciModal — '@ Element'e tıklayınca açılan EKLEME akışı",
        zemin: "koyu",
        onizleme: <div className="flex justify-center"><ElementSeciciTemsili /></div>,
        kod: `{/* '@ Element' → modal açılır. Kaynak: ElementSeciciModal.tsx
    Akış: üst bar (Elementler + kapat) → Filtre (sırala/kategori) →
    element GRID (her kart: tür rozetli görsel + @isim, tıkla → Kullan) →
    "Yeni element" ile oluşturma. Seçince onSec(ad) → prompt'a @isim eklenir. */}
<ElementSeciciModal onSec={(ad) => mentionEkle(ad)} onKapat={() => setElementModal(false)} />`,
      },
      {
        ad: "composer/element-cipi-eklendi",
        not: "/components/panel/ElementCip — eklendikten sonraki çip + üstüne gelince büyük önizleme",
        zemin: "koyu",
        onizleme: (
          <div className="flex min-h-[220px] items-end justify-center pb-2">
            <div className="flex items-center gap-2">
              <ElementEklenmisChip />
              <span className="text-[12.5px] text-metin-3">← üstüne gel (önizleme)</span>
            </div>
          </div>
        ),
        kod: `{/* Prompt'a @ ile eklenen element ÇİP olur: avatar + @isim (lime) + ×.
    Üstüne gelince yukarıda büyük referans önizleme kartı açılır. */}
<ElementCip ad="Talha" onKaldir={() => mentionKaldir("Talha")} />

{/* Çip iç yapısı: */}
<span className="group inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] py-0.5 pl-0.5 pr-2 hover:border-lime-400/40 hover:bg-white/[0.1]">
  <span className="h-5 w-5 rounded-full ring-1 ring-white/15" style={{ background: arka }} />
  <span className="text-xs font-semibold text-lime-300">@{ad}</span>
  <button onClick={onKaldir} className="flex h-4 w-4 items-center justify-center rounded-full text-white/40 hover:bg-white/15 hover:text-white"><X className="h-3 w-3" /></button>
</span>`,
      },
      {
        ad: "composer/sure-secici",
        not: "/panel/video → SureKaydirici — üretim panelindeki süre seçici",
        zemin: "koyu",
        onizleme: <div className="flex justify-center"><SureSecici /></div>,
        kod: `{/* Kaynak bileşen: src/components/ui/SureKaydirici.tsx */}
<SureKaydirici
  secenekler={oz.sureler.map(s => \`\${s}sn\`)}
  deger={sure}
  onDegis={setSure}
  baslik="Süre seç"
/>`,
      },
    ],
  },
  { id: "girdiler", ad: "Girdiler & Formlar", ogeler: [] },
  { id: "modaller", ad: "Modallar & Overlay", ogeler: [] },
  {
    id: "durum",
    ad: "Durum Ekranları",
    ogeler: [
      {
        ad: "durum/yakinda-ekrani",
        not: "/panel/canvas — 'Yakında' boş-durum ekranı (ikon rozeti + Yakında etiketi + başlık + CTA'lar)",
        zemin: "koyu",
        onizleme: (
          <div className="flex w-full flex-col items-center justify-center px-6 py-8 text-center">
            <div className="relative mb-6">
              <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-600/10 ring-1 ring-inset ring-cyan-400/25">
                <Workflow className="h-9 w-9 text-aksan" strokeWidth={1.6} />
              </span>
              <span className="absolute -right-1 -top-1 flex h-6 items-center rounded-full bg-aksan px-2 text-[10px] font-bold text-zemin">Yakında</span>
            </div>
            <h1 className="hf-baslik text-2xl text-metin">Canvas yakında geliyor</h1>
            <p className="mt-3 max-w-md text-[14px] leading-relaxed text-metin-2">
              Düğüm tabanlı sonsuz tuval — moodboard oluştur, iş akışlarını zincirle ve ekibinle paylaş.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button className="hf-btn glass-cip-aktif flex items-center gap-2 rounded-xl px-5 py-2.5 text-[14px] font-semibold text-aksan">Görsel Stüdyosuna git</button>
              <button className="hf-btn glass-cip flex items-center gap-2 rounded-xl px-5 py-2.5 text-[14px] font-medium text-metin-2 hover:text-metin">Keşfet'e dön</button>
            </div>
          </div>
        ),
        kod: `{/* Kaynak: src/app/panel/canvas/page.tsx → CanvasYakinda.
    Bir sayfa henüz hazır değilse bu ekranı export default yaparsın;
    hazır olunca gerçek sayfayı export'a alırsın. */}
<div className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center px-6 text-center">
  <div className="relative mb-6">
    <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-600/10 ring-1 ring-inset ring-cyan-400/25">
      <Workflow className="h-9 w-9 text-aksan" strokeWidth={1.6} />
    </span>
    <span className="absolute -right-1 -top-1 flex h-6 items-center rounded-full bg-aksan px-2 text-[10px] font-bold text-zemin">Yakında</span>
  </div>
  <h1 className="hf-baslik text-2xl text-metin sm:text-3xl">Canvas yakında geliyor</h1>
  <p className="mt-3 max-w-md text-[14px] leading-relaxed text-metin-2">
    Düğüm tabanlı sonsuz tuval — moodboard oluştur, iş akışlarını zincirle ve ekibinle paylaş.
  </p>
  <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
    <Link href="/panel/gorsel" className="hf-btn glass-cip-aktif flex items-center gap-2 rounded-xl px-5 py-2.5 text-[14px] font-semibold text-aksan">Görsel Stüdyosuna git</Link>
    <Link href="/panel" className="hf-btn glass-cip flex items-center gap-2 rounded-xl px-5 py-2.5 text-[14px] font-medium text-metin-2 hover:text-metin">Keşfet'e dön</Link>
  </div>
</div>`,
      },
    ],
  },
  { id: "rozetler", ad: "Rozetler & Etiketler", ogeler: [] },
];

/* ═══════════════════════════════════════════════════════════════════════
   SAYFA
   ═══════════════════════════════════════════════════════════════════════ */

export default function UiKatalogu() {
  const [ara, setAra] = useState("");

  const q = ara.trim().toLocaleLowerCase("tr");
  const gorunen = KATEGORILER
    .map((k) => ({
      ...k,
      ogeler: q ? k.ogeler.filter((o) => `${o.ad} ${o.not ?? ""}`.toLocaleLowerCase("tr").includes(q)) : k.ogeler,
    }))
    .filter((k) => k.ogeler.length > 0 || !q);

  const toplam = KATEGORILER.reduce((n, k) => n + k.ogeler.length, 0);

  return (
    <div className="min-h-screen bg-zemin text-metin">
      {/* Üst bar */}
      <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-zemin/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-aksan/15 text-aksan"><LayoutGrid className="h-5 w-5" /></span>
            <div>
              <h1 className="text-[18px] font-bold text-white">Vayra UI Kataloğu</h1>
              <p className="text-[12px] text-metin-3">Geliştiriciye özel · {toplam} element</p>
            </div>
          </div>
          <label className="ml-auto flex h-10 w-full max-w-xs items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3">
            <Search className="h-4 w-4 shrink-0 text-metin-3" />
            <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Element ara (ada göre)…"
              className="w-full bg-transparent text-[14px] text-white outline-none placeholder:text-metin-3" />
          </label>
        </div>
      </header>

      {/* İçerik — kategoriler */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {gorunen.map((kat) => (
          <section key={kat.id} className="mb-10">
            <div className="mb-4 flex items-baseline gap-3">
              <h2 className="text-[20px] font-bold tracking-tight text-white">{kat.ad}</h2>
              <span className="text-[13px] text-metin-3">{kat.ogeler.length} element</span>
            </div>
            {kat.ogeler.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-[13.5px] text-metin-3">
                Bu kategori boş — eklemek için bana “{kat.ad.toLowerCase()} kategorisine şu elementi ekle” de.
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {kat.ogeler.map((oge) => <KatalogOge key={oge.ad} oge={oge} />)}
              </div>
            )}
          </section>
        ))}
      </main>
    </div>
  );
}
