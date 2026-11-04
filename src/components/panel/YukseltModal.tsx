"use client";

/**
 * YukseltModal — Higgsfield UPGRADE/KREDİ paywall modalı birebir Türkçe.
 * 3 sekme: Planı Yükselt | Kredi Yükle | Sınırsız Modeller.
 * Referans: /tmp/diger2-analiz/{B,C,D}.md (Higgsfield görselleri 24-57).
 * Lime → cyan, pembe indirim rozetleri (#ff2d6f) korunur.
 * SSR güvenli: Date.now/Math.random render'da YOK; kapak görseli deterministik.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket, Coins, Infinity as InfinityIcon, X, Check, RefreshCw, Sparkles,
  Clock, FastForward, ArrowUpRight,
} from "lucide-react";
import { toast } from "@/lib/toast";
import {
  PLANLAR, KREDI_PAKETLERI, UNLIMITED_MODELLER, UNLIMITED_HEPSI, UNLIMITED_SURELER,
  type UnlimitedModel,
} from "@/lib/hesapVeri";
import { useAuth, type Kullanici } from "@/store/useAuth";
import { useTercih } from "@/store/useTercih";
import { cn, formatKredi } from "@/lib/utils";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { rastgeleStok } from "@/lib/stok-gorseller";

type Sekme = "plan" | "kredi" | "sinirsiz";

const SEKMELER: { id: Sekme; ad: string; ikon: typeof Rocket }[] = [
  { id: "plan", ad: "Planı Yükselt", ikon: Rocket },
  { id: "kredi", ad: "Kredi Yükle", ikon: Coins },
  { id: "sinirsiz", ad: "Sınırsız Modeller", ikon: InfinityIcon },
];

// hesapVeri.PLANLAR ad'ları → useAuth plan id eşlemesi.
const PLAN_ID: Record<string, Kullanici["plan"]> = {
  "PLUS": "arti",
  "ULTRA": "ultra",
  "EKİPLER İÇİN": "kurumsal",
};

// ULTRA planı kredi kaydırıcı seçenekleri (Higgsfield 3k/6k/9k).
const ULTRA_KREDILER = [3000, 6000, 9000];

// Para birimi — Higgsfield $ kullanır; Vayra ürününde $ korunur (referansla birebir).
const $ = (n: number) => `$${n.toLocaleString("en-US")}`;

interface Props {
  acik: boolean;
  kapat: () => void;
  /** Açılışta gösterilecek sekme (varsayılan plan). */
  baslangicSekme?: Sekme;
}

export default function YukseltModal({ acik, kapat, baslangicSekme = "plan" }: Props) {
  useScrollKilit(acik);
  useEscKapat(acik, kapat);

  return (
    <AnimatePresence>
      {acik && <ModalIcerik key="yukselt" kapat={kapat} baslangicSekme={baslangicSekme} />}
    </AnimatePresence>
  );
}

/* İçerik ayrı bileşen: modal kapanınca state sıfırlansın (unmount olsun). */
function ModalIcerik({ kapat, baslangicSekme }: { kapat: () => void; baslangicSekme: Sekme }) {
  const [sekme, setSekme] = useState<Sekme>(baslangicSekme);
  // Sınırsız modeller sekmesinde tıklanan modelin alt-modalı.
  const [unlModel, setUnlModel] = useState<UnlimitedModel | "hepsi" | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={kapat}
      className="perde fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-md sm:p-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 16 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="relative my-auto w-full max-w-5xl rounded-3xl border border-white/10 bg-ink-900"
      >
        {/* Sekme pill toggle (ortalı) + kapat */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-white/8 bg-ink-900/90 px-5 py-4 backdrop-blur">
          <span className="w-9" />
          <div className="flex gap-1 rounded-full border border-white/10 bg-ink-850/70 p-1">
            {SEKMELER.map((s) => (
              <button key={s.id} onClick={() => setSekme(s.id)}
                className={cn("relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors sm:px-5",
                  sekme === s.id ? "text-ink-950" : "text-white/60 hover:text-white")}>
                {sekme === s.id && <motion.span layoutId="yukseltSekme" className="absolute inset-0 rounded-full bg-white" />}
                <s.ikon className="relative h-4 w-4" />
                <span className="relative hidden sm:inline">{s.ad}</span>
              </button>
            ))}
          </div>
          <button onClick={kapat} aria-label="Kapat"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-7 sm:px-8 sm:py-8">
          <AnimatePresence mode="wait">
            {sekme === "plan" && <PlanSekmesi key="plan" kapat={kapat} />}
            {sekme === "kredi" && <KrediSekmesi key="kredi" gecUnlimited={() => setSekme("sinirsiz")} />}
            {sekme === "sinirsiz" && <SinirsizSekmesi key="sinirsiz" ac={setUnlModel} />}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Sınırsız model satın-alma alt-modalı */}
      <AnimatePresence>
        {unlModel && (
          <UnlimitedAltModal
            model={unlModel}
            kapat={() => setUnlModel(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════ SEKME 1 — PLANI YÜKSELT ═══════════════════════ */
function PlanSekmesi({ kapat }: { kapat: () => void }) {
  const kullanici = useAuth((s) => s.kullanici);
  const profilGuncelle = useAuth((s) => s.profilGuncelle);
  const [yillik, setYillik] = useState(true);
  // ULTRA kredi kaydırıcısı (3k/6k/9k) — sadece görsel/fiyat çarpanı.
  const [ultraKredi, setUltraKredi] = useState(3000);

  const planYukselt = (p: (typeof PLANLAR)[number]) => {
    const id = PLAN_ID[p.ad];
    if (id === "kurumsal") {
      toast("Kurumsal plan için bize yaz", { description: "Ekip planları satış ekibiyle ayarlanır. İletişim sayfasından ulaşabilirsin.", action: { label: "İletişim", onClick: () => window.location.assign("/iletisim") } });
      return;
    }
    profilGuncelle({ plan: id });
    toast.success(`${p.ad} planına geçtin`, { description: "Ödeme alınmadı, plan yalnızca bu hesapta güncellendi." });
    kapat();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      {/* Başlık */}
      <div className="mb-5 text-center">
        <h2 className="text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">Planı Yükselt veya Kredi Al</h2>
        <p className="mt-1.5 text-sm text-white/55">Daha yüksek limit için üst plan seç ya da ekstra kredi ekle</p>
      </div>

      {/* Auto-refill yeşil şerit */}
      <AutoRefillSerit />

      {/* Aylık/Yıllık toggle */}
      <div className="mb-6 mt-5 flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-yuzey p-1">
          <button onClick={() => setYillik(false)}
            className={cn("rounded-full px-5 py-1.5 text-sm font-medium transition-colors", !yillik ? "bg-white text-ink-950" : "text-white/60")}>Aylık</button>
          <button onClick={() => setYillik(true)}
            className={cn("flex items-center gap-1.5 rounded-full px-5 py-1.5 text-sm font-medium transition-colors", yillik ? "bg-white text-ink-950" : "text-white/60")}>
            Yıllık <span className="rounded-full bg-[#ff2d6f] px-1.5 py-0.5 text-[10px] font-bold text-white">%30 İNDİRİM</span>
          </button>
        </div>
      </div>

      {/* 3 plan kartı */}
      <div className="grid gap-4 lg:grid-cols-3">
        {PLANLAR.map((p) => {
          const mevcut = PLAN_ID[p.ad] === kullanici?.plan;
          // ULTRA'da kredi kaydırıcı fiyatı ölçekler (3k baz, 6k=2×, 9k=3×).
          const olcek = p.ad === "ULTRA" ? ultraKredi / 3000 : 1;
          const ayFiyat = Math.round((yillik ? p.ayFiyat : p.eskiFiyat) * olcek);
          const eski = Math.round(p.eskiFiyat * olcek);

          return (
            <div key={p.ad} className={cn("relative flex flex-col overflow-hidden rounded-3xl border p-6",
              p.tema === "bordo" ? "border-[#ff2d6f]/40 bg-gradient-to-b from-[#3a0f22] to-[#1a0a12]" :
              p.tema === "yesil" ? "border-cyan-glow/35 bg-cyan-glow/[0.04]" :
              "border-white/12 bg-yuzey")}>

              {/* En İyi Değer rozeti */}
              {p.enIyiDeger && (
                <span className={cn("absolute right-5 top-5 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                  p.tema === "bordo" ? "bg-[#ff2d6f] text-white" : "bg-sky-500 text-white")}>
                  <Sparkles className="h-3 w-3" /> En İyi Değer
                </span>
              )}

              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold uppercase">{p.ad}</h3>
                {p.rozet && (
                  <span className="rounded-full bg-[#ff2d6f]/20 px-2 py-0.5 text-[10px] font-bold text-[#ff6b98]">{p.rozet}</span>
                )}
              </div>
              <p className="mt-1 text-xs text-white/55">{p.ozet}</p>

              {/* Kredi özeti */}
              <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 p-3">
                <div className="text-sm font-bold">
                  {p.ad === "ULTRA" ? `${formatKredi(ultraKredi)} kredi/ay` : p.kredi}
                </div>
                <div className="mt-0.5 text-[11px] text-white/45">{p.krediNot}</div>

                {/* ULTRA kredi kaydırıcısı */}
                {p.ad === "ULTRA" && (
                  <div className="mt-3 flex gap-1.5">
                    {ULTRA_KREDILER.map((k) => (
                      <button key={k} onClick={() => setUltraKredi(k)}
                        className={cn("flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors",
                          ultraKredi === k ? "bg-[#ff2d6f] text-white" : "bg-white/8 text-white/60 hover:bg-white/12")}>
                        {formatKredi(k)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fiyat */}
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold">{$(ayFiyat)}</span>
                <span className="text-sm text-white/45">{p.ad === "EKİPLER İÇİN" ? "/koltuk/ay" : "/ay"}</span>
                {yillik && <span className="text-sm text-white/30 line-through">{$(eski)}</span>}
              </div>
              <p className="mt-0.5 text-[11px] text-white/40">{p.fiyatSonek}</p>

              {/* CTA */}
              <button onClick={() => planYukselt(p)} disabled={mevcut}
                className={cn("mt-4 rounded-xl py-2.5 text-sm font-bold transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:translate-y-0 disabled:opacity-40",
                  mevcut ? "border border-emerald-400/40 bg-emerald-400/10 text-emerald-300" :
                  p.ctaRenk === "pembe" ? "bg-[#ff2d6f] text-white hover:brightness-110" :
                  p.ctaRenk === "mavi" ? "bg-sky-500 text-white hover:brightness-110" :
                  "bg-cyan-glow text-ink-950 hover:brightness-110")}>
                {mevcut ? "Mevcut planın" : p.cta}
              </button>

              {/* Özellik listesi */}
              <ul className="mt-5 space-y-2.5">
                {p.ozellikler.map((o) => (
                  <li key={o.ad} className={cn("flex items-start gap-2 text-xs", o.var ? "text-white/75" : "text-white/30")}>
                    {o.var
                      ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-glow" />
                      : <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/25" />}
                    <span className="flex-1">{o.ad}</span>
                    {o.deger && <span className="rounded bg-cyan-glow/15 px-1.5 py-0.5 text-[10px] font-bold text-cyan-glow">{o.deger}</span>}
                  </li>
                ))}
              </ul>

              {/* SEEDANCE 2.0 bölümü */}
              <div className="mt-5 border-t border-white/8 pt-4">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-white/40">Seedance 2.0</p>
                <ul className="space-y-1.5">
                  {["Seedance 2.0", "Seedance 2.0 Fast"].map((m) => (
                    <li key={m} className="flex items-center justify-between text-xs text-white/70">
                      <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-cyan-glow" />{m}</span>
                      <span className="rounded bg-white/8 px-1.5 py-0.5 text-[10px] text-white/60">Tam erişim</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* SINIRSIZ & ÜCRETSİZ ÜRETİM bölümü */}
              <div className="mt-4 border-t border-white/8 pt-4">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/40">
                  <span aria-hidden>🔒</span> Sınırsız & Ücretsiz Üretim
                </p>
                <ul className="space-y-1.5">
                  {(p.ad === "PLUS"
                    ? [["Nano Banana Pro", null], ["Nano Banana 2", "2K · 7 gün sınırsız"], ["Kling 3.0", "7 gün sınırsız"]]
                    : [["Nano Banana Pro", "2K · 7 gün sınırsız"], ["Nano Banana 2", "2K · 7 gün sınırsız"], ["Kling 3.0", "7 gün sınırsız"]]
                  ).map(([ad, deger]) => (
                    <li key={ad as string} className="flex items-center justify-between text-xs">
                      <span className={cn("flex items-center gap-2", deger ? "text-white/70" : "text-white/30")}>
                        {deger ? <Check className="h-3 w-3 text-cyan-glow" /> : <X className="h-3 w-3 text-white/25" />}
                        {ad}
                      </span>
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px]", deger ? "bg-cyan-glow/15 text-cyan-glow" : "bg-white/5 text-white/35")}>
                        {deger ?? "Sınırsız yok"}
                      </span>
                    </li>
                  ))}
                </ul>
                <button className="mt-2.5 flex items-center gap-1 text-[11px] font-medium text-white/50 hover:text-white/80">
                  + 7 sınırsız & ücretsiz üretim modeli ›
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-center text-[11px] text-white/35">
        Not: Sınırsız modeller ve ücretsiz üretimler yalnızca Vayra üzerinden erişilebilir; MCP/CLI, Canvas veya Usta üzerinden erişilemez.
      </p>
    </motion.div>
  );
}

/* ═══════════════════════ SEKME 2 — KREDİ YÜKLE ═══════════════════════ */
function KrediSekmesi({ gecUnlimited }: { gecUnlimited: () => void }) {
  const krediEkle = useAuth((s) => s.krediEkle);
  // En büyük pakette (5000) kaydırıcı — Higgsfield 5k…25k.
  const KADEMELER = [5000, 7000, 9000, 11000, 13000, 15000, 17000, 19000, 21000, 23000, 25000];
  const [sliderIdx, setSliderIdx] = useState(0);

  const satinAl = (kredi: number, fiyat: number) => {
    krediEkle(kredi);
    toast.success(`${formatKredi(kredi)} kredi eklendi`, { description: `${$(fiyat)} tutarında tek seferlik satın alma, ödeme alınmadı.` });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      {/* Başlık */}
      <div className="mb-5 text-center">
        <h2 className="text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">Planı Yükselt veya Kredi Al</h2>
        <p className="mt-1.5 text-sm text-white/55">Daha yüksek limit için üst plan seç ya da ekstra kredi ekle</p>
      </div>

      {/* Auto-refill şeridi */}
      <AutoRefillSerit />

      {/* Pembe gradyan banner */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-[#ff2d6f] via-[#c026d3] to-[#7c3aed] p-5">
        <div>
          <div className="text-base font-extrabold uppercase tracking-tight text-white sm:text-lg">
            En iyi modellere $5'den sınırsız erişim
          </div>
          <div className="mt-0.5 text-xs text-white/85">Seedance 2.0, Nano Banana Pro, Kling 3.0 ve daha fazlası</div>
        </div>
        <button onClick={gecUnlimited}
          className="flex items-center gap-1.5 rounded-xl bg-cyan-glow px-4 py-2 text-sm font-bold text-ink-950 transition-transform hover:-translate-y-0.5">
          Sınırsız Erişim Al <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      {/* 7 kredi paketi kartı */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {KREDI_PAKETLERI.map((p) => {
          const enBuyuk = p.kredi === 5000;
          const kredi = enBuyuk ? KADEMELER[sliderIdx] : p.kredi;
          // Slider kademesinde fiyat lineer ölçeklenir (birim fiyat sabit).
          const fiyat = enBuyuk ? Math.round(p.fiyat * (kredi / 5000)) : p.fiyat;
          const eski = enBuyuk ? Math.round(p.eskiFiyat * (kredi / 5000)) : p.eskiFiyat;
          const nbp = Math.round(p.nbp * (kredi / p.kredi));
          const seedance = Math.round(p.seedance * (kredi / p.kredi));

          return (
            <div key={p.kredi} className={cn("relative flex flex-col rounded-2xl border p-5",
              p.populer ? "border-cyan-glow/60 bg-cyan-glow/[0.06] shadow-[0_0_28px_-4px_var(--color-cyan-glow)]" : "border-white/10 bg-yuzey")}>

              {p.rozet && (
                <span className={cn("absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                  p.populer ? "bg-cyan-glow text-ink-950" : "bg-white/90 text-ink-950")}>
                  {p.populer ? <Sparkles className="h-3 w-3" /> : "🏷"} {p.rozet}
                </span>
              )}

              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold">{formatKredi(kredi)}</span>
                <span className="text-sm text-white/50">kredi</span>
              </div>
              <p className="mt-0.5 text-[11px] text-white/40">$1 = {p.birim} kredi</p>

              <div className="mt-3 flex items-center gap-2">
                <span className="text-base text-white/30 line-through">{$(eski)}</span>
                <span className="text-2xl font-extrabold">{$(fiyat)}</span>
                <span className="rounded-full bg-[#ff2d6f]/20 px-1.5 py-0.5 text-xs font-bold text-[#ff6b98]">%{p.indirim} indirim</span>
              </div>

              {/* En büyük pakette kaydırıcı */}
              {enBuyuk && (
                <div className="mt-3">
                  <input type="range" min={0} max={KADEMELER.length - 1} step={1} value={sliderIdx}
                    onChange={(e) => setSliderIdx(Number(e.target.value))}
                    aria-label="Kredi miktarı" className="w-full cursor-pointer accent-cyan-glow" />
                  <div className="mt-0.5 flex justify-between text-[10px] text-white/35"><span>5k</span><span>15k</span><span>25k</span></div>
                </div>
              )}

              <button onClick={() => satinAl(kredi, fiyat)}
                className={cn("mt-4 w-full rounded-xl py-2.5 text-sm font-bold transition-all hover:-translate-y-0.5 active:scale-[0.98]",
                  p.populer ? "bg-white text-ink-950 hover:brightness-95" : "bg-cyan-glow text-ink-950 hover:brightness-110")}>
                Satın Al
              </button>

              <ul className="mt-4 space-y-1.5 text-[11px] text-white/55">
                <li className="flex gap-1.5"><Check className="mt-0.5 h-3 w-3 shrink-0 text-cyan-glow" /> {formatKredi(nbp)} Nano Banana Pro üretimine kadar</li>
                <li className="flex gap-1.5"><Check className="mt-0.5 h-3 w-3 shrink-0 text-cyan-glow" /> {formatKredi(seedance)} Seedance 2.0 720p, 5sn videoya kadar</li>
              </ul>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <p className="text-xs text-white/40">Ekstra krediler 90 gün geçerlidir</p>
        <button className="rounded-xl bg-white px-5 py-2 text-sm font-bold text-ink-950 transition hover:brightness-95">
          Tüm Fiyatlandırma Detayları
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════ SEKME 3 — SINIRSIZ MODELLER ═══════════════════════ */
function SinirsizSekmesi({ ac }: { ac: (m: UnlimitedModel | "hepsi") => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">Tüm Sınırsız Teklifler</h2>
        <p className="mt-1.5 text-sm text-white/55">En güçlü görsel ve video modellerine sınırsız erişim satın al.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {UNLIMITED_MODELLER.map((m) => {
          const kapak = rastgeleStok(m.tohum, m.tur === "video" ? "sinematik" : "soyut");
          const enDusuk = m.cozunurlukler[0];
          const bas = m.fiyatlar[enDusuk][0]; // 1 günlük en düşük çöz. = "…$X'den"
          return (
            <button key={m.ad} onClick={() => ac(m)}
              className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-yuzey text-left transition-all hover:-translate-y-0.5 hover:border-cyan-glow/40">
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <img src={kapak} alt={m.ad} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                <span className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-1 text-[11px] font-bold text-cyan-glow backdrop-blur">
                  {m.cozunurlukler[0]}
                </span>
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-white/70">Sınırsız</div>
                  <div className="text-base font-extrabold uppercase leading-tight text-white">{m.ad}</div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="text-xs text-white/50">{m.tur === "video" ? "Video" : "Görsel"}</span>
                <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-ink-950">{$(bas)}'den</span>
              </div>
            </button>
          );
        })}

        {/* TÜM MODELLER paketi (geniş kart) */}
        <button onClick={() => ac("hepsi")}
          className="group relative flex flex-col overflow-hidden rounded-2xl border border-cyan-glow/40 bg-gradient-to-br from-cyan-glow/10 to-transparent p-5 text-left transition-all hover:-translate-y-0.5 sm:col-span-2 lg:col-span-3">
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-lg font-extrabold uppercase text-white sm:text-xl">
                <span className="text-cyan-glow">Tüm</span> Sınırsız Modellere Erişim
              </div>
              <p className="mt-1 max-w-xl text-xs text-white/60">{UNLIMITED_HEPSI.aciklama}</p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/8 px-2.5 py-1 text-[11px] text-white/70">
                <FastForward className="h-3 w-3" /> {UNLIMITED_HEPSI.concurrent}
              </span>
            </div>
            <span className="rounded-xl bg-cyan-glow px-4 py-2.5 text-sm font-bold text-ink-950">{$(UNLIMITED_HEPSI.fiyatlar[0])}'den</span>
          </div>
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════ UNLIMITED SATIN-ALMA ALT-MODALI ═══════════════════════ */
function UnlimitedAltModal({ model, kapat }: { model: UnlimitedModel | "hepsi"; kapat: () => void }) {
  const hepsi = model === "hepsi";
  const m = hepsi ? null : (model as UnlimitedModel);

  // Çözünürlük state — fiyatları gerçek zamanlı günceller.
  const cozunurlukler = m ? m.cozunurlukler : [];
  const [coz, setCoz] = useState(m ? m.cozunurlukler[0] : "");
  const [sureIdx, setSureIdx] = useState(1); // 7 günlük varsayılan seçili

  useScrollKilit(true);
  useEscKapat(true, kapat);

  const ad = hepsi ? UNLIMITED_HEPSI.ad : m!.ad;
  const kapak = rastgeleStok(hepsi ? "unl-hepsi" : m!.tohum, hepsi ? "3d" : m!.tur === "video" ? "sinematik" : "soyut");
  const fiyatlar = hepsi ? UNLIMITED_HEPSI.fiyatlar : m!.fiyatlar[coz];
  const concurrent = hepsi ? UNLIMITED_HEPSI.concurrent : m!.concurrent;
  const sure = hepsi ? undefined : m!.sure;
  const not = hepsi ? UNLIMITED_HEPSI.aciklama : m!.not;
  const seciliFiyat = fiyatlar[sureIdx];

  const satinAl = () => {
    toast.success(`${ad} sınırsız erişimi açıldı`, { description: `${UNLIMITED_SURELER[sureIdx].ad}, ${$(seciliFiyat)} tek seferlik. Ödeme alınmadı.` });
    kapat();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={kapat}
      className="perde fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ type: "spring", stiffness: 340, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="my-auto w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-ink-900"
      >
        {/* Kapak */}
        <div className="relative aspect-video w-full overflow-hidden">
          <img src={kapak} alt={ad} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/30 to-transparent" />
          <button onClick={kapat} aria-label="Kapat"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full glass-ikon text-white/80 backdrop-blur transition hover:text-white">
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-3 left-4 right-4">
            <div className="text-[11px] font-medium uppercase italic tracking-widest text-white/70">Sınırsız</div>
            <div className="text-2xl font-extrabold uppercase leading-none text-cyan-glow">{ad}</div>
          </div>
        </div>

        <div className="p-5">
          {/* Çözünürlük toggle (sadece tekil modelde) */}
          {!hepsi && (
            <div className="mb-3 flex gap-1 rounded-xl border border-white/10 bg-yuzey p-1">
              {cozunurlukler.map((c) => (
                <button key={c} onClick={() => setCoz(c)}
                  className={cn("flex-1 rounded-lg py-2 text-center transition-colors",
                    coz === c ? "bg-white text-ink-950" : "text-white/60 hover:text-white")}>
                  <span className="block text-[10px] text-white/45">Şuna kadar</span>
                  <span className={cn("block text-sm font-bold", coz === c ? "text-ink-950" : c === "4K" ? "text-cyan-glow" : "text-white")}>{c}</span>
                </button>
              ))}
            </div>
          )}

          {/* Concurrent + süre çipleri */}
          <div className="mb-4 flex flex-wrap justify-center gap-2">
            {sure && (
              <span className="flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1 text-xs text-white/70">
                <Clock className="h-3.5 w-3.5" /> {sure}
              </span>
            )}
            <span className="flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1 text-xs text-white/70">
              <FastForward className="h-3.5 w-3.5" /> {concurrent}
            </span>
          </div>

          {/* 3 süre planı */}
          <div className="space-y-2.5">
            {UNLIMITED_SURELER.map((s) => {
              const secili = sureIdx === s.idx;
              const fiyat = fiyatlar[s.idx];
              // 1 günlükte indirim yok; 7/14 günde eski fiyat = günlük ücret × gün sayısı
              // (indirimsiz taban), üstü çizili gösterilir. Örn NBP 2K: $5×7=$35, $5×14=$70.
              const eskiVar = s.idx > 0;
              const gunSayisi = s.idx === 1 ? 7 : 14;
              const eski = eskiVar ? fiyatlar[0] * gunSayisi : 0;
              return (
                <button key={s.ad} onClick={() => setSureIdx(s.idx)}
                  className={cn("flex w-full items-center justify-between rounded-2xl border p-3.5 text-left transition-colors",
                    secili ? "border-cyan-glow/60 bg-cyan-glow/[0.06]" : "border-white/10 hover:bg-white/5")}>
                  <div className="flex items-center gap-3">
                    <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                      secili ? "border-cyan-glow bg-cyan-glow text-ink-950" : "border-white/25")}>
                      {secili && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <div>
                      <div className="text-sm font-bold">{s.ad}</div>
                      <div className="text-[11px] text-white/45">{s.ozet}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    {eskiVar && <div className="text-xs text-white/30 line-through">{$(eski)}</div>}
                    <div className="text-lg font-extrabold">{$(fiyat)}</div>
                    <div className="text-[10px] text-white/45">Tek seferlik</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* CTA — gerçek zamanlı fiyat */}
          <button onClick={satinAl}
            className="mt-4 w-full rounded-xl bg-cyan-glow py-3 text-sm font-bold text-ink-950 transition-all hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.98]">
            {$(seciliFiyat)} için Sınırsız Al
          </button>

          {/* Alt not */}
          <p className="mt-3 text-center text-[11px] leading-relaxed text-white/40">{not}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════ ORTAK — Auto-refill yeşil şerit ═══════════════════════
   GERÇEK anahtar: useTercih.otomatikYukleme (persist'li). Eskiden buton hiçbir şey
   yapmadan "kurulum açıldı" diyordu; artık tercihi gerçekten aç/kapat eder. */
function AutoRefillSerit() {
  const acik = useTercih((s) => s.otomatikYukleme);
  const toggle = useTercih((s) => s.otomatikYuklemeToggle);
  return (
    <div className={cn(
      "flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3",
      acik ? "border-emerald-400/60 bg-emerald-400/[0.14]" : "border-emerald-400/30 bg-emerald-400/[0.07]",
    )}>
      <span className="flex items-center gap-2 text-sm text-emerald-200">
        <RefreshCw className="h-4 w-4" />
        {acik ? "Otomatik kredi yenileme açık — bakiyen bitince paket yenilenir" : "Otomatik kredi yenilemeyi aç & iş akışın kesintisiz kalsın"}
      </span>
      <button
        onClick={() => {
          const yeni = toggle();
          if (yeni) toast.success("Otomatik yenileme açıldı", { description: "Bakiyen bitince paketin otomatik yenilenir." });
          else toast.success("Otomatik yenileme kapatıldı", { description: "Krediyi artık elle yüklemen gerekir." });
        }}
        className="rounded-lg bg-white px-4 py-1.5 text-xs font-bold text-ink-950 transition hover:brightness-95">
        {acik ? "Kapat" : "Kur"}
      </button>
    </div>
  );
}
