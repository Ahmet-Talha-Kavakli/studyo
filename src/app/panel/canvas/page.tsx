"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, X, MoreHorizontal, SquareArrowOutUpRight,
  Forward, PenLine, Copy, Trash2, Workflow, LayoutTemplate, Users,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { onizlemeArka, saltUrl, cn } from "@/lib/utils";
import { CanvasYakindaEkran } from "@/components/panel/CanvasYakindaEkran";

/* GERÇEK canvas görselleri — hero node (cv-hero-*) + 6 iş akışı şablonu (sablon-*).
 * Tohum dosya adıyla birebir. */
const CANVAS_GERCEK = new Set([
  "cv-hero-portre", "cv-hero-video",
  "sablon-uzun", "sablon-seed", "sablon-ext", "sablon-ref", "sablon-ses", "sablon-sb",
]);
/** Tohum için gerçek canvas görseli (yoksa undefined). */
function canvasGercek(tohum: string): string | undefined {
  return CANVAS_GERCEK.has(tohum) ? `/gercek/canvas/${tohum}.webp` : undefined;
}
/** Gerçek varsa CSS background, yoksa stok. */
function canvasArka(tohum: string, kat: string): string {
  const g = canvasGercek(tohum);
  return g ? `url("${g}") center/cover no-repeat` : onizlemeArka(tohum, kat);
}
import { baglantiyiKopyala } from "@/lib/gercekEylem";
import { useCanvas } from "@/store/useCanvas";
import { CV, CV_LIME, CV_OLCU, noktaIzgara } from "@/lib/canvasTema";

/* ============================================================
   CANVAS ANASAYFA — referans birebir (referanslar/canvas/anasayfa).

   Yapı (ölçülen):
     · HERO ~500px — mavi RADYAL gradyan (#1E3A7A merkez → #0E131D kenar)
       + nokta ızgarası + node-graph kolajı + dev condensed başlık
     · Sekme çubuğu 30px pill'ler — "Tüm Tuvaller | Şablonlar(Hızlı Başlangıç)"
       sağda genişleyen arama (32px daire → 220px input)
     · Kart ızgarası: Tüm Tuvaller 4 SÜTUN (16:10), Şablonlar 3 SÜTUN (16:9)
       kart 278px · pitch 302px · gap 24px · radius 16px
     · Hover → sağ-altta BEYAZ ⋯ butonu → bağlam menüsü
       (Aç · Paylaş · Yeniden adlandır · Çoğalt · ─ · Sil[kırmızı])
   ============================================================ */

function gorecelizaman(ts: number): string {
  const fark = Date.now() - ts;
  const dk = Math.floor(fark / 60000);
  if (dk < 1) return "az önce";
  if (dk < 60) return `${dk} dk önce`;
  const sa = Math.floor(dk / 60);
  if (sa < 24) return `${sa} sa önce`;
  return `${Math.floor(sa / 24)} gün önce`;
}

type Sablon = { id: string; ad: string; tohum: string };
const SABLONLAR: Sablon[] = [
  { id: "uzun-video", ad: "Uzun Video Örneği", tohum: "sablon-uzun" },
  { id: "seedance", ad: "Basit Seedance 2.0", tohum: "sablon-seed" },
  { id: "genislet", ad: "Videoyu Genişlet", tohum: "sablon-ext" },
  { id: "referans", ad: "Referanstan Kur", tohum: "sablon-ref" },
  { id: "seslendirme", ad: "Seslendirme Akışı", tohum: "sablon-ses" },
  { id: "storyboard", ad: "Storyboard Kurgusu", tohum: "sablon-sb" },
];

/* Canvas şimdilik YAKINDA. Tam işlevsel kod aşağıda korunuyor
   (CanvasAnasayfaEski); yayına hazır olunca export'u geri al.

   2026-07-30: ortak YakindaSayfa yerine Canvas'a özel ekran — kahraman görsel
   çalışan bir düğüm grafiği (bezier bağlantılar + akış animasyonu), yani
   ürünün vaadini anlatmak yerine gösteriyor. */
export default function CanvasYakinda() {
  return <CanvasYakindaEkran />;
}

function CanvasAnasayfaEski() {
  const router = useRouter();
  const arama = useSearchParams();
  const sablonModu = arama.get("kategori") === "sablonlar";

  const boardlar = useCanvas((s) => s.boardlar);
  const boardOlustur = useCanvas((s) => s.boardOlustur);
  const boardCogalt = useCanvas((s) => s.boardCogalt);
  const boardSil = useCanvas((s) => s.boardSil);
  const boardYenidenAdlandir = useCanvas((s) => s.boardYenidenAdlandir);

  const [ara, setAra] = useState("");
  const [aramaAcik, setAramaAcik] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const [adDuzenle, setAdDuzenle] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const aramaRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (aramaAcik) aramaRef.current?.focus(); }, [aramaAcik]);

  /* Menü dışına tıkla → kapat */
  useEffect(() => {
    if (!menu) return;
    const kapat = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-kart-menu]")) setMenu(null);
    };
    document.addEventListener("mousedown", kapat);
    return () => document.removeEventListener("mousedown", kapat);
  }, [menu]);

  const q = ara.trim().toLocaleLowerCase("tr");
  const gorunenBoardlar = useMemo(() => {
    const s = [...boardlar].sort((a, b) => b.sonDuzenleme - a.sonDuzenleme);
    return q ? s.filter((b) => b.ad.toLocaleLowerCase("tr").includes(q)) : s;
  }, [boardlar, q]);
  const gorunenSablonlar = useMemo(
    () => (q ? SABLONLAR.filter((s) => s.ad.toLocaleLowerCase("tr").includes(q)) : SABLONLAR),
    [q],
  );

  const yeniTuval = () => {
    const id = boardOlustur("İsimsiz");
    router.push(`/panel/canvas/${id}`);
  };
  const sablonAc = (s: Sablon) => {
    const id = boardOlustur(s.ad);
    router.push(`/panel/canvas/${id}`);
  };
  const sekmeGit = (sablon: boolean) =>
    router.push(sablon ? "/panel/canvas?kategori=sablonlar" : "/panel/canvas");

  return (
    <div className="min-h-screen" style={{ background: CV.sayfa }}>
      {/* ══════════ HERO ══════════ */}
      <div className="relative overflow-hidden" style={{ height: 500 }}>
        {/* radyal mavi gradyan — merkez üstte */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 90% 120% at 50% 8%, ${CV.heroMerkez} 0%, ${CV.heroOrta} 34%, ${CV.heroAlt} 62%, ${CV.heroKenar} 100%)`,
          }}
        />
        <div className="absolute inset-0" style={noktaIzgara("rgba(255,255,255,0.045)", 10)} />

        {/* node-graph kolajı — dekoratif */}
        <HeroKolaj />

        {/* merkez başlık — mavi seçim çerçevesi içinde.
            z-10: referansta başlık node'u kolajın ÖNÜNDE duruyor (seçili node). */}
        <div className="absolute inset-x-0 top-[152px] z-10 flex flex-col items-center px-6 text-center">
          <div className="relative px-8 py-6"
            style={{
              outline: `1px solid ${CV.secim}`,
              /* Kolaj kartları arkadan geçmesin: hafif koyu zemin + bulanık örtü */
              background: "rgba(14,19,29,0.55)",
              backdropFilter: "blur(3px)",
            }}>
            <TutamacDort />
            <p className="text-[15px] font-bold uppercase tracking-[0.2em] text-white/95">
              Vayra Canvas
            </p>
            <h1
              className="mt-3 text-[40px] font-extrabold uppercase leading-[0.95] tracking-[-0.01em] text-white md:text-[54px]"
              style={{ fontStretch: "condensed" }}>
              Yapay zekâ tuvaliyle<br />çarpıcı medya üret
            </h1>
          </div>
        </div>
      </div>

      {/* ══════════ SEKME ÇUBUĞU ══════════ */}
      <div
        className="relative -mt-[46px] mx-auto flex items-center justify-between gap-3 px-4"
        style={{ maxWidth: CV_OLCU.konteyner + 32 }}>
        <div className="flex items-center gap-2">
          <SekmePill aktif={!sablonModu} onTikla={() => sekmeGit(false)}>
            Tüm Tuvaller
          </SekmePill>
          <span className="h-4 w-px" style={{ background: CV.ayrac }} />
          <SekmePill aktif={sablonModu} onTikla={() => sekmeGit(true)}>
            Şablonlar
            <span
              className="ml-2 rounded-full px-2 py-[3px] text-[13px] font-semibold"
              style={{
                background: sablonModu ? CV.rozetZeminAktif : CV.rozetZemin,
                color: CV_LIME,
              }}>
              Hızlı Başlangıç
            </span>
          </SekmePill>
        </div>

        {/* arama — 32px daire ⇄ 220px input */}
        <div className="flex items-center gap-2">
          <AnimatePresence initial={false} mode="wait">
            {aramaAcik ? (
              <motion.div key="acik" initial={{ width: 32, opacity: 0 }}
                animate={{ width: 220, opacity: 1 }} exit={{ width: 32, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex h-8 items-center gap-2 overflow-hidden rounded-full px-3"
                style={{ background: CV.kartMavi }}>
                <Search className="h-4 w-4 shrink-0" style={{ color: CV.metinGri }} />
                <input ref={aramaRef} value={ara} onChange={(e) => setAra(e.target.value)}
                  placeholder="Ara"
                  className="w-full bg-transparent text-[16px] text-white outline-none"
                  style={{ caretColor: CV_LIME }} />
              </motion.div>
            ) : (
              <motion.button key="kapali" onClick={() => setAramaAcik(true)} aria-label="Ara"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                style={{ background: CV.pillAktif }}>
                <Search className="h-4 w-4" style={{ color: "#C9CACC" }} />
              </motion.button>
            )}
          </AnimatePresence>
          {aramaAcik && (
            <button onClick={() => { setAramaAcik(false); setAra(""); }} aria-label="Aramayı kapat"
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: "#272B31" }}>
              <X className="h-4 w-4 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* ══════════ KART IZGARASI ══════════ */}
      <div className="mx-auto px-4 pb-24 pt-6" style={{ maxWidth: CV_OLCU.konteyner + 32 }}>
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${sablonModu ? 3 : 4}, minmax(0,1fr))`,
            gap: CV_OLCU.kartBosluk,
          }}>
          {sablonModu ? (
            gorunenSablonlar.map((s) => (
              <SablonKart key={s.id} sablon={s} onAc={() => sablonAc(s)} />
            ))
          ) : (
            <>
              <button
                onClick={yeniTuval}
                className="group text-left"
                aria-label="Yeni tuval oluştur">
                <span
                  className="flex items-center justify-center transition-colors"
                  style={{
                    aspectRatio: CV_OLCU.thumbOran,
                    borderRadius: CV_OLCU.kartRadius,
                    background: CV.kart,
                    border: `1px solid ${CV.kartKenar}`,
                  }}>
                  <span
                    className="flex items-center justify-center rounded-full transition-colors group-hover:border-white"
                    style={{ width: 36, height: 36, border: "1px solid #5E5F62" }}>
                    <Plus className="h-4 w-4 text-white" />
                  </span>
                </span>
                <span className="mt-3 block text-[17px] font-semibold" style={{ color: CV.metin }}>
                  Yeni tuval oluştur
                </span>
              </button>

              {hydrated && gorunenBoardlar.map((b) => (
                <TuvalKart
                  key={b.id}
                  ad={b.ad}
                  altMetin={`Son düzenleme ${gorecelizaman(b.sonDuzenleme)}`}
                  tohum={b.tohum}
                  menuAcik={menu === b.id}
                  adDuzenleniyor={adDuzenle === b.id}
                  onAc={() => router.push(`/panel/canvas/${b.id}`)}
                  onMenu={() => setMenu((m) => (m === b.id ? null : b.id))}
                  onMenuKapat={() => setMenu(null)}
                  onPaylas={() => {
                    void baglantiyiKopyala(`/panel/canvas/${b.id}`);
                    setMenu(null);
                  }}
                  onAdBasla={() => { setAdDuzenle(b.id); setMenu(null); }}
                  onAdBitir={(yeni) => {
                    if (yeni.trim()) boardYenidenAdlandir(b.id, yeni.trim());
                    setAdDuzenle(null);
                  }}
                  onCogalt={() => { boardCogalt(b.id); toast.success("Tuval çoğaltıldı"); setMenu(null); }}
                  onSil={() => {
                    setMenu(null);
                    if (boardlar.length <= 1) {
                      toast.error("Son tuval silinemez", { description: "En az bir tuval kalmalı." });
                      return;
                    }
                    boardSil(b.id);
                    toast.success("Tuval silindi");
                  }}
                />
              ))}
            </>
          )}
        </div>

        {((sablonModu && gorunenSablonlar.length === 0) ||
          (!sablonModu && q && gorunenBoardlar.length === 0)) && (
          <p className="py-16 text-center text-[15px]" style={{ color: CV.metinIkincil }}>
            “{ara}” için sonuç yok.
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Sekme pill'i — aktif #272A30 + beyaz 600, pasif şeffaf + #8F9094 ── */
function SekmePill({ aktif, onTikla, children }: {
  aktif: boolean; onTikla: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onTikla}
      className="flex items-center rounded-full px-4 text-[17px] transition-colors"
      style={{
        height: CV_OLCU.pillYukseklik,
        background: aktif ? CV.pillAktifMavi : "transparent",
        color: aktif ? "#FFFFFF" : CV.pillPasif,
        fontWeight: aktif ? 600 : 500,
      }}>
      {children}
    </button>
  );
}

/* ── Mavi seçim çerçevesinin 4 köşe tutamacı ── */
function TutamacDort() {
  const k = "absolute h-[7px] w-[7px] rounded-[1px]";
  const st = { background: CV.secim } as React.CSSProperties;
  return (
    <>
      <span className={cn(k, "-left-[4px] -top-[4px]")} style={st} />
      <span className={cn(k, "-right-[4px] -top-[4px]")} style={st} />
      <span className={cn(k, "-bottom-[4px] -left-[4px]")} style={st} />
      <span className={cn(k, "-bottom-[4px] -right-[4px]")} style={st} />
    </>
  );
}

/* ── Hero node-graph kolajı — bezier bağlantılı dekoratif kartlar ── */
function HeroKolaj() {
  const kart = (tohum: string, kat: string): React.CSSProperties => ({
    background: canvasArka(tohum, kat),
    backgroundSize: "cover",
    backgroundPosition: "center",
  });
  return (
    <div className="pointer-events-none absolute inset-0 z-0 select-none">
      {/* bezier bağlantılar */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        <path d="M 210 250 C 300 250, 330 210, 420 210" fill="none" stroke="#4A5568" strokeWidth="1" />
        <path d="M 1090 230 C 1180 230, 1210 270, 1300 270" fill="none" stroke="#4A5568" strokeWidth="1" />
        <circle cx="210" cy="250" r="3.5" fill="#4A5568" />
        <circle cx="1300" cy="270" r="3.5" fill="#4A5568" />
      </svg>

      {/* sol: ürün kartı (yarım kesik) */}
      <div className="absolute left-[-40px] top-[130px] h-[190px] w-[210px] rounded-[14px] bg-white/95 shadow-2xl" />
      {/* yeşil yorum baloncuğu */}
      <div className="absolute left-[186px] top-[118px] flex items-center gap-1.5 rounded-full bg-[#4ADE80] px-2.5 py-1 text-[11px] font-semibold text-[#08240F]">
        Gloria · Bu harika!
      </div>
      {/* sol prompt node'u */}
      <div className="absolute left-[112px] top-[330px] h-[92px] w-[230px] rounded-[12px] px-3 py-2.5 text-[10px] leading-[1.5] text-white/35"
        style={{ background: "#161A22", border: "1px solid #232838" }}>
        …arkadaşlar güneşli bir günde açık hava kortunda… kadın şort ve uyumlu üst giymiş, ön planda…
      </div>
      {/* portre node */}
      <div className="absolute left-[352px] top-[96px] h-[250px] w-[188px] rotate-[-3deg] rounded-[14px] shadow-2xl"
        style={kart("cv-hero-portre", "portre")} />
      {/* sağ: koşan çocuk (yatay) */}
      <div className="absolute right-[212px] top-[128px] h-[172px] w-[268px] rotate-[2deg] rounded-[14px] shadow-2xl"
        style={kart("cv-hero-video", "sinematik")} />
      {/* sağ üst: el yazısı ok + kullanıcı etiketi */}
      <div className="absolute right-[178px] top-[86px] flex items-center gap-1.5 rounded-full bg-[#4ADE80] px-2.5 py-1 text-[11px] font-semibold text-[#08240F]">
        Mito
      </div>
      {/* sağ kenar: yarım kesik node */}
      <div className="absolute right-[-46px] top-[210px] h-[168px] w-[196px] rounded-[14px]"
        style={{ background: "#16221C", border: "1px solid #24352B" }} />
    </div>
  );
}

/* ── Tuval kartı — hover'da beyaz ⋯ + bağlam menüsü ── */
function TuvalKart(p: {
  ad: string; altMetin: string; tohum: string;
  menuAcik: boolean; adDuzenleniyor: boolean;
  onAc: () => void; onMenu: () => void; onMenuKapat: () => void;
  onPaylas: () => void; onAdBasla: () => void; onAdBitir: (yeni: string) => void;
  onCogalt: () => void; onSil: () => void;
}) {
  const [hover, setHover] = useState(false);
  const [taslak, setTaslak] = useState(p.ad);
  useEffect(() => setTaslak(p.ad), [p.ad]);

  return (
    <div className="relative" data-kart-menu
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <button onClick={p.onAc} className="block w-full text-left">
        <span
          className="relative flex items-center justify-center overflow-hidden transition-colors"
          style={{
            aspectRatio: CV_OLCU.thumbOran,
            borderRadius: CV_OLCU.kartRadius,
            background: hover ? CV.kartHover : CV.kartMavi,
            border: `1px solid ${CV.kartKenar}`,
          }}>
          <span className="absolute inset-0" style={noktaIzgara("rgba(255,255,255,0.05)", 14)} />
          {/* referans birebir: thumbnail bir canvas ekran görüntüsü mock'u —
              mavi seçim çerçevesi + 4 köşe tutamacı içinde marka metni */}
          <span className="relative flex items-center justify-center px-6 py-4"
            style={{ outline: `1px solid ${CV.secim}` }}>
            <TutamacDort />
            <span className="text-center text-[13px] font-medium leading-[1.4]"
              style={{ color: CV.kartMock }}>
              Vayra<br />Canvas
            </span>
          </span>
        </span>
      </button>

      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          {p.adDuzenleniyor ? (
            <input
              autoFocus value={taslak}
              onChange={(e) => setTaslak(e.target.value)}
              onBlur={() => p.onAdBitir(taslak)}
              onKeyDown={(e) => {
                if (e.key === "Enter") p.onAdBitir(taslak);
                if (e.key === "Escape") p.onAdBitir(p.ad);
              }}
              className="w-full rounded-[6px] bg-white/10 px-1.5 text-[17px] font-semibold text-white outline-none"
            />
          ) : (
            <p className="truncate text-[17px] font-semibold" style={{ color: CV.metin }}>{p.ad}</p>
          )}
          <p className="mt-0.5 truncate text-[14px]" style={{ color: CV.metinIkincil }}>{p.altMetin}</p>
        </div>

        {/* ⋯ — hover'da beliren BEYAZ daire */}
        <AnimatePresence>
          {(hover || p.menuAcik) && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.12 }}
              onClick={p.onMenu} aria-label="Tuval menüsü"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white">
              <MoreHorizontal className="h-4 w-4 text-[#1A1D22]" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* bağlam menüsü */}
      <AnimatePresence>
        {p.menuAcik && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }} transition={{ duration: 0.14 }}
            className="absolute right-0 z-30 overflow-hidden rounded-[12px] py-1.5"
            style={{
              bottom: 52, width: 138,
              background: `linear-gradient(180deg, ${CV.menu}, ${CV.menuAlt})`,
              border: `1px solid ${CV.menuKenar}`,
              boxShadow: "0 18px 50px rgba(0,0,0,0.55)",
            }}>
            <MenuOge ikon={SquareArrowOutUpRight} label="Aç" onTikla={p.onAc} />
            <MenuOge ikon={Forward} label="Paylaş" onTikla={p.onPaylas} />
            <MenuOge ikon={PenLine} label="Yeniden adlandır" onTikla={p.onAdBasla} />
            <MenuOge ikon={Copy} label="Çoğalt" onTikla={p.onCogalt} />
            <div className="my-1.5 h-px" style={{ background: CV.menuAyrac }} />
            <MenuOge ikon={Trash2} label="Sil" tehlike onTikla={p.onSil} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuOge({ ikon: Ik, label, tehlike, onTikla }: {
  ikon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string; tehlike?: boolean; onTikla: () => void;
}) {
  return (
    <button
      onClick={onTikla}
      className="flex h-8 w-full items-center gap-3 px-3.5 text-left text-[17px] font-medium transition-colors hover:bg-white/[0.06]"
      style={{ color: tehlike ? CV.tehlike : "#FFFFFF" }}>
      <Ik className="h-[15px] w-[15px] shrink-0" />
      <span className="truncate text-[14px]">{label}</span>
    </button>
  );
}

/* ── Şablon kartı — 16:9, gerçek sinematik görsel, ⋯ YOK ── */
function SablonKart({ sablon, onAc }: { sablon: Sablon; onAc: () => void }) {
  const arka = canvasArka(sablon.tohum, "sinematik");
  const url = canvasGercek(sablon.tohum) ?? saltUrl(arka);
  return (
    <button onClick={onAc} className="group block text-left">
      <span
        className="relative block overflow-hidden"
        style={{
          aspectRatio: "16 / 9",
          borderRadius: CV_OLCU.kartRadius,
          background: arka,
          border: `1px solid ${CV.kartKenar}`,
        }}>
        {url && (
          <img src={url} alt="" loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        )}
      </span>
      <span className="mt-3 block truncate text-[17px] font-semibold" style={{ color: CV.metin }}>
        {sablon.ad}
      </span>
      <span className="mt-0.5 block text-[14px]" style={{ color: CV.metinIkincil }}>
        Tuval şablonu
      </span>
    </button>
  );
}
