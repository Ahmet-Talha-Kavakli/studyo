"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/lib/toast";
import {
  X, Rocket, Zap, Infinity as InfinityIcon, Check, RefreshCw, Sparkles,
  ChevronRight, ChevronDown, Clock, FastForward, Layers, Cpu, Coins,
} from "lucide-react";
import { useKrediModal, type KrediSekme } from "@/store/useKrediModal";
import { useAuth } from "@/store/useAuth";
import { useTercih } from "@/store/useTercih";
import { useScrollKilit } from "@/hooks/useScrollKilit";
import { cn, onizlemeArka, saltUrl } from "@/lib/utils";
import { kabukArka } from "@/lib/gercekVeri";

/**
 * KrediModal — Higgsfield "Upgrade Plan / Top-up Credits / Unlimited Models /
 * Boost" ekranları BİREBİR (masaüstü `fiyat` referans klasörü, 35 görsel).
 * Avatar menüsü + "Yükselt" butonundan açılır.
 *
 * 4 sekme:
 *  - Plan Yükselt: başlık + geri sayım + auto-refill + Aylık/Yıllık + PLUS/ULTRA
 *    kartları (kredi, özellik listesi, ALL MODELS 7-GÜN SINIRSIZ çipleri).
 *  - Kredi Yükle (Top-up): auto-refill + Sınırsız bandı + KREDİ PAKETİ LİSTESİ
 *    (5000/4000/2000/1000/500/200/100 — her biri kendi oran/indirim/fiyat).
 *  - Sınırsız Modeller: hero (geri sayım) + görselli model kart GRID + "ALL
 *    UNLIMITED OFFERS" filtre bölümü → per-model detay (kalite toggle fiyatı
 *    değiştirir + 1/7/14 gün + "Get Unlimited for $X").
 *  - Hız Artır: 3X hero + bakiye + paralel + boost + Nasıl Çalışır + SSS.
 */

const SEKMELER: { id: KrediSekme; ad: string; ikon: typeof Rocket }[] = [
  { id: "plan", ad: "Plan Yükselt", ikon: Rocket },
  { id: "kredi", ad: "Kredi Yükle", ikon: Coins },
  { id: "sinirsiz", ad: "Sınırsız Modeller", ikon: InfinityIcon },
  { id: "hiz", ad: "Hız Artır", ikon: Zap },
];

/**
 * KrediPano — sekme şeridi + aktif sekme gövdesi. Hem KrediModal (overlay) hem
 * `/panel/kredi` (tam sayfa) bunu kullanır; böylece tek kaynaktan iki sunum.
 * `sekme`/`setSekme` dışarıdan verilir (modalda store, sayfada local state).
 * `onKapat` verilmişse kapatma "X"i çıkar (modal); yoksa gizli (sayfa).
 */
export function KrediPano({ sekme, setSekme, onKapat }: {
  sekme: KrediSekme; setSekme: (s: KrediSekme) => void; onKapat?: () => void;
}) {
  return (
    <>
      {/* Sekme şeridi — üstte ortalı hap (referans birebir) */}
      <div className="relative">
        <div className="mx-auto mb-5 flex w-fit flex-wrap items-center justify-center gap-1 rounded-full bg-white/[0.06] p-1 ring-1 ring-inset ring-white/10 backdrop-blur-xl">
          {SEKMELER.map((s) => (
            <button key={s.id} onClick={() => setSekme(s.id)}
              className={cn("flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13.5px] font-semibold transition-colors",
                sekme === s.id ? "bg-white text-black" : "text-white/70 hover:text-white")}>
              <s.ikon className="h-3.5 w-3.5" /> {s.ad}
            </button>
          ))}
        </div>
        {onKapat && (
          <button onClick={onKapat} aria-label="Kapat"
            className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-metin-2 hover:bg-white/12 hover:text-white"><X className="h-[18px] w-[18px]" /></button>
        )}
      </div>

      {sekme === "hiz" ? <HizArtir onKapat={onKapat ?? (() => {})} />
        : sekme === "sinirsiz" ? <SinirsizModeller onKapat={onKapat ?? (() => {})} />
        : sekme === "kredi" ? <KrediYukle onKapat={onKapat ?? (() => {})} />
        : <PlanYukselt onKapat={onKapat ?? (() => {})} />}
    </>
  );
}

export function KrediModal() {
  const { acik, sekme, kapat, ac } = useKrediModal();
  useScrollKilit(acik);

  return (
    <AnimatePresence>
      {acik && (
        <div className="sinema-kapsam fixed inset-0 z-[170] overflow-y-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={kapat} className="fixed inset-0 bg-black/80 backdrop-blur-md" />
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            className="relative mx-auto my-6 w-full max-w-4xl px-4">
            <KrediPano sekme={sekme} setSekme={ac} onKapat={kapat} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════ PLAN YÜKSELT ═══════════════════════ */

type PlanTip = {
  ad: string; plan: "arti" | "ultra"; renk: "yesil" | "kirmizi"; indirim: number; ozet: string;
  krediAy: number; gorselAdet: number; videoAdet: number;
  aylik: number; yillik: number;
  buton: string; enIyi?: boolean;
  ozellikler: string[]; krediSlider?: number[]; // ULTRA: 3000/6000/9000
};

const PLANLAR: PlanTip[] = [
  {
    ad: "PLUS", plan: "arti", renk: "yesil", indirim: 20, ozet: "Tutarlı ve kolay AI içerik üretimi için",
    krediAy: 1200, gorselAdet: 600, videoAdet: 53, aylik: 59, yillik: 47, buton: "Planı Değiştir",
    ozellikler: ["Paralel üretim: 6 Video, 8 Görsel'e kadar", "Supercomputer erişimi", "Tüm Seedance modelleri", "Tüm model ve özellikler", "Gelişmiş AI'lara erken erişim", "Sınırsız pazar yerine erişim"],
  },
  {
    ad: "ULTRA", plan: "ultra", renk: "kirmizi", indirim: 23, ozet: "AI projeleri kuran yaratıcılar için", enIyi: true,
    krediAy: 3000, gorselAdet: 1500, videoAdet: 133, aylik: 129, yillik: 99, buton: "Planı Yükselt", krediSlider: [3000, 6000, 9000],
    ozellikler: ["Paralel üretim: 8 Video, 8 Görsel'e kadar", "Supercomputer erişimi", "Tüm Seedance modelleri", "Tüm model ve özellikler", "Gelişmiş AI'lara erken erişim", "Sınırsız pazar yerine erişim", "Kredi başına en düşük maliyet"],
  },
];

// ALL MODELS 7-GÜN SINIRSIZ — model çipleri (gruplu, ∞)
const SINIRSIZ_GRUPLARI: { grup: string; modeller: string[] }[] = [
  { grup: "ByteDance", modeller: ["Seedance 2.0", "Seedance 2.0 Fast & Mini", "Seedream 5.0 Pro"] },
  { grup: "Google (2K'ya kadar)", modeller: ["Nano Banana Pro", "Nano Banana 2", "Gemini Omni Flash"] },
  { grup: "Kling", modeller: ["Kling 3.0", "Kling 3.0 Motion Control"] },
  { grup: "Ses", modeller: ["Seed Audio 1.0", "Eleven v3", "MiniMax Speech 2.8 HD", "VibeVoice", "Seed Speech"] },
  { grup: "Diğer", modeller: ["GPT Image 2", "Wan 2.7"] },
];

/**
 * Otomatik yükleme bandı — GERÇEK tercih anahtarı.
 * Eskiden buton hiçbir şey yapmadan "Otomatik yükleme açıldı" diyordu.
 * Artık useTercih.otomatikYukleme'yi (persist'li) aç/kapat yapar; etiket ve
 * toast mesajı gerçek duruma göre değişir.
 */
function OtomatikYuklemeBandi({ genis }: { genis?: boolean }) {
  const acik = useTercih((s) => s.otomatikYukleme);
  const toggle = useTercih((s) => s.otomatikYuklemeToggle);
  return (
    <div className={cn(
      "mx-auto flex items-center justify-between gap-3 rounded-2xl border px-4 py-3",
      acik ? "border-aksan/50 bg-aksan/[0.12]" : "border-aksan/25 bg-aksan/[0.06]",
      genis ? "mt-6 max-w-2xl" : "mt-4 max-w-xl",
    )}>
      <span className={cn("flex items-center gap-2 font-medium text-aksan", genis ? "text-[14px]" : "text-[13.5px]")}>
        <RefreshCw className="h-4 w-4" />
        {acik ? "Otomatik yükleme açık — bakiyen bitince paket yenilenir" : "Otomatik yüklemeyi aç, akışın hiç kesilmesin"}
      </span>
      <button
        onClick={() => {
          const yeni = toggle();
          if (yeni) toast.success("Otomatik yükleme açıldı", { description: "Bakiyen bitince paketin otomatik yenilenecek." });
          else toast.success("Otomatik yükleme kapatıldı", { description: "Kredi yüklemesi artık elle yapılacak." });
        }}
        className="shrink-0 rounded-full bg-white px-4 py-1.5 text-[13px] font-bold text-black hover:scale-105">
        {acik ? "Kapat" : "Kur"}
      </button>
    </div>
  );
}

function PlanYukselt({ onKapat }: { onKapat: () => void }) {
  const mevcutPlan = useAuth((s) => s.kullanici?.plan ?? "baslangic");
  const profilGuncelle = useAuth((s) => s.profilGuncelle);
  const [yillik, setYillik] = useState(true);
  const [ultraKredi, setUltraKredi] = useState(0); // slider indexi

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0c0c0e] p-6 shadow-2xl sm:p-8">
      <h2 className="text-center text-[26px] font-extrabold uppercase leading-tight tracking-tight text-white sm:text-[34px]">
        Yükselt, tüm üst modelleri<br />7 gün sınırsız kullan <span className="text-fusya">%30'a varan indirim</span>
      </h2>
      <p className="mt-2.5 text-center text-[14.5px] text-metin-3">Daha üst planla premium araç ve özelliklere eriş.</p>

      {/* Geri sayım kutusu */}
      <div className="mx-auto mt-6 max-w-xl overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02]">
        <p className="border-b border-white/[0.06] py-2 text-center text-[12.5px] font-medium text-fusya">⏳ Plan indirimi bitişine…</p>
        <div className="grid grid-cols-2 divide-x divide-white/[0.06]">
          <div className="py-4 text-center">
            <p className="text-[26px] font-extrabold text-fusya">%30 İNDİRİM</p>
            <p className="text-[11px] text-metin-3">Özel teklif için</p>
          </div>
          <div className="flex items-center justify-center gap-2 py-4">
            {[["07", "saat"], ["20", "dakika"], ["33", "saniye"]].map(([v, e]) => (
              <div key={e} className="text-center">
                <p className="text-[24px] font-bold tabular-nums text-white">{v}</p>
                <p className="text-[10px] text-metin-3">{e}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* auto-refill — GERÇEK tercih anahtarı */}
      <OtomatikYuklemeBandi />

      {/* Aylık/Yıllık toggle */}
      <div className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-full bg-white/[0.05] p-1 ring-1 ring-inset ring-white/10">
        <button onClick={() => setYillik(false)} className={cn("rounded-full px-4 py-1.5 text-[13.5px] font-semibold transition-colors", !yillik ? "bg-white text-black" : "text-white/60 hover:text-white")}>Aylık</button>
        <button onClick={() => setYillik(true)} className={cn("flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13.5px] font-semibold transition-colors", yillik ? "bg-white text-black" : "text-white/60 hover:text-white")}>
          Yıllık <span className="rounded bg-fusya px-1.5 py-0.5 text-[10px] font-bold text-white">%30 İNDİRİM</span>
        </button>
      </div>

      {/* Plan kartları */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {PLANLAR.map((p) => {
          const aktif = p.plan === mevcutPlan;
          const fiyat = yillik ? p.yillik : p.aylik;
          const eski = yillik ? p.aylik : Math.round(p.aylik * 1.25);
          const yesil = p.renk === "yesil";
          const kredi = p.krediSlider ? p.krediSlider[ultraKredi] : p.krediAy;
          return (
            <div key={p.ad} className={cn("relative overflow-hidden rounded-3xl border p-5",
              yesil ? "border-aksan/40 bg-gradient-to-b from-aksan/[0.06] to-transparent" : "border-fusya/40 bg-gradient-to-b from-fusya/[0.08] to-transparent")}>
              <div className="flex items-center gap-2">
                <span className="text-[20px] font-extrabold text-white">{p.ad}</span>
                <span className="rounded bg-fusya px-1.5 py-0.5 text-[10px] font-bold text-white">%{p.indirim} İNDİRİM</span>
                {p.enIyi && <span className="rounded bg-sky-400/20 px-1.5 py-0.5 text-[10px] font-bold text-sky-300">💎 EN İYİ DEĞER</span>}
              </div>
              <p className="mt-1 text-[12.5px] text-metin-3">{p.ozet}</p>

              {/* kredi kutusu */}
              <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <p className="flex items-center gap-1.5 text-[16px] font-bold text-white"><Sparkles className="h-4 w-4 text-aksan" /> {kredi.toLocaleString("tr-TR")} kredi/ay</p>
                <p className="mt-1 text-[12.5px] text-metin-3">= {Math.round(kredi / 2).toLocaleString("tr-TR")} Nano Banana Pro üretimi</p>
                <p className="text-[12.5px] text-metin-3">~ {Math.round(kredi / 22.5)} Seedance 2.0 videosu</p>
                {p.krediSlider ? (
                  <div className="mt-3">
                    <input type="range" min={0} max={p.krediSlider.length - 1} step={1} value={ultraKredi}
                      onChange={(e) => setUltraKredi(Number(e.target.value))} className="kredi-slider w-full" />
                    <div className="mt-1.5 flex justify-between text-[11px] text-metin-3">
                      {p.krediSlider.map((k, i) => <span key={k} className={cn("tabular-nums", i === ultraKredi && "font-bold text-aksan")}>{k.toLocaleString("tr-TR")}</span>)}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-white/[0.03] px-3 py-2 text-[12px] text-metin-2"><Check className="h-3.5 w-3.5 text-aksan" /> Sabit {p.krediAy.toLocaleString("tr-TR")} kredi/ay</p>
                )}
              </div>

              {/* fiyat */}
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-[16px] text-fusya line-through">${eski}</span>
                <span className="text-[30px] font-extrabold text-white">${fiyat}</span>
                <span className="text-[12.5px] text-metin-3">/ay{yillik ? ", yıllık faturalanır" : ""}</span>
              </div>

              <button onClick={() => { if (!aktif) { profilGuncelle({ plan: p.plan }); toast.success(`${p.ad} planına yükseltildi 🎉`); onKapat(); } }} disabled={aktif}
                className={cn("mt-3 w-full rounded-xl py-3 text-[14px] font-bold transition-transform",
                  aktif ? "bg-white/10 text-metin-3" : yesil ? "bg-aksan text-zemin hover:scale-[1.02]" : "bg-fusya text-white hover:scale-[1.02]")}>
                {aktif ? "Mevcut plan" : p.buton}
              </button>
              {yillik && !aktif && <p className="mt-1.5 text-center text-[12px] text-metin-3">Aylığa göre <span className="font-semibold text-white">${(p.aylik - p.yillik) * 12}</span> tasarruf</p>}

              {/* özellikler */}
              <ul className="mt-4 space-y-2">
                {p.ozellikler.map((o) => (
                  <li key={o} className="flex items-start gap-2 text-[12.5px] text-metin-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-aksan" /> {o}</li>
                ))}
              </ul>

              {/* ALL MODELS 7-GÜN SINIRSIZ */}
              <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <p className="flex items-center gap-2 text-[13px] font-bold text-white">TÜM MODELLER <span className="text-aksan">7 GÜN SINIRSIZ</span>
                  <span className={cn("ml-auto rounded px-1.5 py-0.5 text-[9px] font-bold", yesil ? "bg-aksan text-zemin" : "bg-fusya text-white")}>TAM GÜÇ</span></p>
                <p className="mt-0.5 text-[11.5px] text-metin-3">Uzatılmış süre ve çözünürlükle tam güç</p>
                <div className="mt-3 space-y-2.5">
                  {SINIRSIZ_GRUPLARI.map((g) => (
                    <div key={g.grup}>
                      <p className="mb-1 text-[11px] font-medium text-metin-3">{g.grup}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {g.modeller.map((m) => (
                          <span key={m} className="flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-1 text-[11px] text-metin-2"><InfinityIcon className="h-2.5 w-2.5 shrink-0" /> {m}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-center text-[11.5px] leading-relaxed text-metin-3">
        Not: Sınırsız modeller ve Ücretsiz Üretimler yalnızca vayra.app üzerinden erişilebilir; MCP/CLI, Canvas veya Supercomputer'da geçerli değildir. Fiyatlara KDV dahil değildir.
      </p>
    </div>
  );
}

/* ═══════════════════════ KREDİ YÜKLE (TOP-UP) ═══════════════════════
   Referans birebir: SLIDER DEĞİL — kredi paketi LİSTESİ. Her paket kendi
   $1=oran / −%indirim / eski→yeni fiyatına sahip. İlk paket (5000) slider
   detaylı; diğerleri satır kart. "En Popüler" rozeti 4000 pakette. */

type KrediPaket = {
  kredi: number; oran: number; indirim: number; eski: number; yeni: number;
  nanoGorsel: number; seedanceVideo: number; populer?: boolean;
};

const KREDI_PAKETLERI: KrediPaket[] = [
  { kredi: 5000, oran: 21, indirim: 45, eski: 425, yeni: 235, nanoGorsel: 2500, seedanceVideo: 222 },
  { kredi: 4000, oran: 21, indirim: 44, eski: 340, yeni: 190, nanoGorsel: 2000, seedanceVideo: 177, populer: true },
  { kredi: 2000, oran: 21, indirim: 44, eski: 470, yeni: 95, nanoGorsel: 1000, seedanceVideo: 88 },
  { kredi: 1000, oran: 20, indirim: 42, eski: 85, yeni: 49, nanoGorsel: 500, seedanceVideo: 44 },
  { kredi: 500, oran: 19, indirim: 39, eski: 42.5, yeni: 26, nanoGorsel: 250, seedanceVideo: 22 },
  { kredi: 200, oran: 17, indirim: 27, eski: 47, yeni: 12, nanoGorsel: 100, seedanceVideo: 8 },
  { kredi: 100, oran: 16, indirim: 26, eski: 8.5, yeni: 6.25, nanoGorsel: 50, seedanceVideo: 4 },
];

function KrediYukle({ onKapat }: { onKapat: () => void }) {
  // Paket alımı KOTAYI da artırır (M10: avatar halkasının paydası).
  const ekKrediEkle = useAuth((s) => s.ekKrediEkle);

  const satinAl = (p: KrediPaket) => {
    ekKrediEkle(p.kredi);
    toast.success(`${p.kredi.toLocaleString("tr-TR")} kredi eklendi 🎉`, { description: `$${p.yeni} · Demo satın alma` });
    onKapat();
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0c0c0e] p-6 shadow-2xl sm:p-8">
      <h2 className="text-center text-[26px] font-extrabold uppercase tracking-tight text-white sm:text-[34px]">Planı Yükselt ya da Kredi Al</h2>
      <p className="mt-2 text-center text-[14.5px] text-metin-3">Daha yüksek limitler için üst plana geç, ya da ekstra kredi al.</p>

      {/* auto-refill — GERÇEK tercih anahtarı */}
      <OtomatikYuklemeBandi genis />

      {/* SINIRSIZ ERİŞİM bandı */}
      <div className="mx-auto mt-4 flex max-w-3xl flex-col items-start justify-between gap-3 overflow-hidden rounded-2xl p-5 sm:flex-row sm:items-center"
        style={{ background: "linear-gradient(120deg, #3a1530 0%, #2a1024 100%)" }}>
        <div>
          <p className="text-[19px] font-extrabold uppercase leading-tight text-white">SINIRSIZ ERİŞİM</p>
          <p className="text-[19px] font-extrabold uppercase leading-tight text-fusya">EN İYİ MODELLERE $5'DEN</p>
          <p className="mt-1 text-[13px] text-white/60">Seedance 2.0, Nano Banana Pro, Kling 3.0 ve daha fazlası</p>
        </div>
        <button onClick={() => useKrediModal.getState().ac("sinirsiz")}
          className="shrink-0 rounded-xl bg-aksan px-5 py-3 text-[14px] font-bold text-zemin hover:scale-105">Sınırsız Eriş →</button>
      </div>

      {/* KREDİ PAKETİ LİSTESİ */}
      <div className="mx-auto mt-4 max-w-3xl space-y-3">
        {KREDI_PAKETLERI.map((p) => (
          <div key={p.kredi}
            className={cn("grid grid-cols-1 gap-4 rounded-2xl border p-5 sm:grid-cols-[1fr_auto] sm:items-center",
              p.populer ? "border-aksan/50 bg-gradient-to-r from-aksan/[0.07] to-transparent" : "border-white/10 bg-white/[0.02]")}>
            {/* SOL: kredi + oran + indirim + özet satırları */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[24px] font-extrabold text-white">{p.kredi.toLocaleString("tr-TR")} kredi</span>
                <span className="flex items-center gap-1 rounded-full bg-white/8 px-2 py-0.5 text-[11px] text-metin-2"><Coins className="h-3 w-3" /> $1 = {p.oran} kredi</span>
                {p.populer && <span className="rounded-full bg-aksan px-2 py-0.5 text-[11px] font-bold text-zemin">En Popüler</span>}
                <span className="rounded-full bg-fusya px-2 py-0.5 text-[11px] font-bold text-white">−%{p.indirim}</span>
              </div>
              <ul className="mt-2.5 space-y-1">
                <li className="flex items-center gap-2 text-[13px] text-metin-2"><Check className="h-3.5 w-3.5 shrink-0 text-aksan" /> {p.nanoGorsel.toLocaleString("tr-TR")} adete kadar Nano Banana Pro görsel üretimi</li>
                <li className="flex items-center gap-2 text-[13px] text-metin-2"><Check className="h-3.5 w-3.5 shrink-0 text-aksan" /> {p.seedanceVideo} adete kadar Seedance 2.0 720p, 5sn video</li>
              </ul>
            </div>
            {/* SAĞ: fiyat + satın al */}
            <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-3">
              <div className="flex items-baseline gap-2">
                <span className="text-[15px] text-fusya line-through">${p.eski}</span>
                <span className="text-[28px] font-extrabold text-white">${p.yeni}</span>
              </div>
              <button onClick={() => satinAl(p)}
                className={cn("shrink-0 rounded-xl px-8 py-2.5 text-[14px] font-bold transition-transform hover:scale-[1.03] sm:w-40",
                  p.populer ? "bg-aksan text-zemin" : "bg-white text-black")}>Satın al</button>
            </div>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-5 max-w-3xl text-center text-[12px] text-metin-3">Ekstra krediler 90 gün geçerlidir</p>
    </div>
  );
}

/* ═══════════════════════ SINIRSIZ MODELLER ═══════════════════════
   Referans birebir: hero (dev görsel + geri sayım + "Get from $99") +
   görselli model kart GRID (kalite rozeti + "$X'den başla") + "TÜM SINIRSIZ
   TEKLİFLER" filtre bölümü. Kart → per-model detay modalı. */

type SinirsizModel = {
  ad: string; renk: string; kat: string;
  kaliteler: string[]; rozet: string; // ilk kartta gösterilen kalite rozeti
  ekstra: string[];
  kategori: ("gorsel" | "video")[];
  saglayici: "Google" | "OpenAI" | "Kling" | "Seedance";
  fiyatlar: number[][]; // [kaliteIdx][gunIdx] = fiyat ($)
  eski: number[][];     // eski fiyat (1gün=0)
  bastan: number;       // "$X'den başla" (ilk kalite 1-gün)
};

const SINIRSIZ_MODELLER: SinirsizModel[] = [
  {
    ad: "Nano Banana Pro", renk: "#55d6fd", kat: "manzara", kaliteler: ["2K", "4K"], rozet: "2K",
    ekstra: ["2 eşzamanlı"], kategori: ["gorsel"], saglayici: "Google",
    fiyatlar: [[5, 25, 50], [7, 35, 70]], eski: [[0, 35, 70], [0, 49, 98]], bastan: 5,
  },
  {
    ad: "Seedance 2.0", renk: "#7cc0ff", kat: "manzara", kaliteler: ["720p", "1080p"], rozet: "720p",
    ekstra: ["15sn'ye kadar", "1 eşzamanlı"], kategori: ["video"], saglayici: "Seedance",
    fiyatlar: [[73, 294, 588], [149, 630, 1270]], eski: [[0, 511, 1022], [0, 1040, 2079]], bastan: 73,
  },
  {
    ad: "GPT Image 2.0", renk: "#c9f24a", kat: "portre", kaliteler: ["1K", "2K", "4K"], rozet: "1K",
    ekstra: ["2 eşzamanlı"], kategori: ["gorsel"], saglayici: "OpenAI",
    fiyatlar: [[20, 100, 200], [20, 100, 200], [30, 150, 300]], eski: [[0, 140, 280], [0, 140, 280], [0, 210, 420]], bastan: 15,
  },
  {
    ad: "Kling 3.0", renk: "#c9a5ff", kat: "sinematik", kaliteler: ["1080p", "4K"], rozet: "1080p",
    ekstra: ["15sn'ye kadar", "1 eşzamanlı"], kategori: ["video"], saglayici: "Kling",
    fiyatlar: [[35, 175, 350], [60, 360, 720]], eski: [[0, 245, 490], [0, 420, 840]], bastan: 35,
  },
];

// GPT Image 1K fiyatını düzelt: 1K = [15,75,150], 2K = [20,100,200], 4K = [30,150,300]
SINIRSIZ_MODELLER[2].fiyatlar = [[15, 75, 150], [20, 100, 200], [30, 150, 300]];
SINIRSIZ_MODELLER[2].eski = [[0, 105, 210], [0, 140, 280], [0, 210, 420]];

const GUN_META = [
  { gun: 1, ad: "1 gün Sınırsız", ozet: "Dene, taahhüt yok" },
  { gun: 7, ad: "7 gün Sınırsız", ozet: "Bir proje veya kampanya için" },
  { gun: 14, ad: "14 gün Sınırsız", ozet: "Sürekli, yoğun çalışma için" },
];

const OFFER_FILTRELER: { id: string; ad: string }[] = [
  { id: "hepsi", ad: "Tümü" },
  { id: "gorsel", ad: "Görsel" },
  { id: "video", ad: "Video" },
  { id: "Google", ad: "Google" },
  { id: "OpenAI", ad: "OpenAI" },
  { id: "Kling", ad: "Kling" },
  { id: "Seedance", ad: "Seedance" },
];

/* GERÇEK sınırsız-model örnek görselleri — her model o modelin gücünü sergiler.
 * Nano Banana ile üretildi (statik önizleme kartları). */
const SINIRSIZ_GORSELLER: Record<string, string> = {
  "Nano Banana Pro": "/gercek/sinirsiz/unl-nano-banana-pro.webp",
  "Seedance 2.0": "/gercek/sinirsiz/unl-seedance.webp",
  "GPT Image 2.0": "/gercek/sinirsiz/unl-gpt-image.webp",
  "Kling 3.0": "/gercek/sinirsiz/unl-kling.webp",
};

function ModelGorsel({ m, className }: { m: SinirsizModel; className?: string }) {
  const gercek = SINIRSIZ_GORSELLER[m.ad];
  const arka = gercek ? `url("${gercek}") center/cover no-repeat` : onizlemeArka("unl-" + m.ad, m.kat);
  const url = gercek ?? saltUrl(arka);
  return (
    <span className={cn("absolute inset-0", className)} style={{ background: arka }}>
      {url && <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
    </span>
  );
}

function SinirsizModeller({ onKapat }: { onKapat: () => void }) {
  const [acikModel, setAcikModel] = useState<SinirsizModel | null>(null);
  const [filtre, setFiltre] = useState("hepsi");
  if (acikModel) return <SinirsizModelDetay model={acikModel} onGeri={() => setAcikModel(null)} onKapat={onKapat} />;

  const heroArka = `url("/gercek/sinirsiz/unl-hero-dragon.webp") center/cover no-repeat`;
  const heroUrl = "/gercek/sinirsiz/unl-hero-dragon.webp";
  const filtreli = SINIRSIZ_MODELLER.filter((m) =>
    filtre === "hepsi" || m.kategori.includes(filtre as "gorsel" | "video") || m.saglayici === filtre);

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0c0c0e] p-6 shadow-2xl sm:p-8">
      {/* HERO — dev görsel + başlık + geri sayım + "Get from $99" */}
      <div className="relative overflow-hidden rounded-3xl" style={{ background: heroArka }}>
        {heroUrl && <img src={heroUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
        <div className="relative flex min-h-[220px] flex-col justify-center p-6 sm:p-8">
          <p className="text-[26px] font-extrabold uppercase leading-[0.95] text-white sm:text-[32px]">
            <span className="text-aksan">TÜM ÜST MODELLERE</span><br />SINIRSIZ ERİŞİM
          </p>
          <p className="mt-2 max-w-xs text-[13px] text-white/70">Seedance 2.0, Kling 3.0, Nano Banana Pro, Gemini Omni Flash, GPT Image 2 ve daha fazlası</p>
          {/* geri sayım */}
          <div className="mt-4 flex w-fit items-center gap-2 rounded-xl bg-fusya/90 px-3 py-2">
            {[["07", "Saat"], ["20", "Dakika"], ["27", "Saniye"]].map(([v, e]) => (
              <div key={e} className="text-center">
                <p className="text-[20px] font-extrabold leading-none tabular-nums text-white">{v}</p>
                <p className="text-[9px] text-white/70">{e}</p>
              </div>
            ))}
          </div>
          <button onClick={() => setAcikModel(SINIRSIZ_MODELLER[3])}
            className="mt-4 w-fit rounded-xl bg-fusya px-6 py-2.5 text-[14px] font-bold text-white hover:scale-105">$99'dan başla</button>
        </div>
      </div>

      <h3 className="mt-8 text-center text-[24px] font-extrabold uppercase tracking-tight text-white">TÜM SINIRSIZ TEKLİFLER</h3>
      <p className="mt-1.5 text-center text-[14px] text-metin-3">En güçlü görsel ve video modellerine sınırsız erişim satın al.</p>

      {/* filtre çipleri */}
      <div className="mx-auto mt-5 flex w-fit flex-wrap items-center justify-center gap-2">
        {OFFER_FILTRELER.map((f) => (
          <button key={f.id} onClick={() => setFiltre(f.id)}
            className={cn("rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors",
              filtre === f.id ? "bg-white text-black" : "bg-white/[0.06] text-metin-2 hover:bg-white/[0.1] hover:text-white")}>{f.ad}</button>
        ))}
      </div>

      {/* MODEL KART GRID — her kalite ayrı kart (referans birebir) */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtreli.flatMap((m) =>
          m.kaliteler.map((k, ki) => (
            <button key={m.ad + k} onClick={() => setAcikModel(m)}
              className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-2xl border border-white/10 text-left transition-transform hover:scale-[1.02]">
              <ModelGorsel m={m} className="transition-transform duration-300 group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              {/* kalite rozeti sol-üst */}
              <span className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-1 text-[11px] font-bold text-white backdrop-blur-sm">◈ {k}</span>
              <div className="relative p-4">
                <p className="flex items-center gap-1.5 text-[15px] font-bold text-white">
                  <span className="text-[13px]" style={{ color: m.renk }}>●</span> {m.ad} <span style={{ color: m.renk }}>{k}</span>
                </p>
                <span className="mt-2.5 block w-full rounded-xl bg-white py-2.5 text-center text-[13px] font-bold text-black transition-colors group-hover:bg-aksan">
                  ${m.fiyatlar[ki][0]}'den başla
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function SinirsizModelDetay({ model, onGeri, onKapat }: { model: SinirsizModel; onGeri: () => void; onKapat: () => void }) {
  const [kalite, setKalite] = useState(model.kaliteler.length - 1); // en yüksek varsayılan
  const [gun, setGun] = useState(1); // 7-gün seçili (index 1)
  const fiyat = model.fiyatlar[kalite][gun];
  const eski = model.eski[kalite][gun];
  const heroArka = kabukArka("unlhero-" + model.ad, model.kat);
  const heroUrl = saltUrl(heroArka);

  return (
    <div className="mx-auto max-w-[560px] overflow-hidden rounded-3xl border border-white/10 bg-[#101012] shadow-2xl">
      {/* hero görsel + başlık */}
      <div className="relative">
        <button onClick={onGeri} aria-label="Geri" className="absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60"><ChevronRight className="h-4 w-4 rotate-180" /></button>
        <button onClick={onKapat} aria-label="Kapat" className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60"><X className="h-4 w-4" /></button>
        <div className="relative h-48 overflow-hidden" style={{ background: heroArka }}>
          {heroUrl && <img src={heroUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-[#101012] via-transparent to-black/20" />
          <div className="absolute inset-x-0 bottom-3 text-center">
            <p className="text-[14px] font-extrabold uppercase tracking-[0.2em]" style={{ color: model.renk }}>SINIRSIZ</p>
            <p className="text-[30px] font-extrabold uppercase leading-none text-white">{model.ad}</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* kalite toggle — fiyatı değiştirir */}
        <div className={cn("mx-auto grid w-fit gap-1 rounded-xl bg-white/[0.05] p-1 ring-1 ring-inset ring-white/10", model.kaliteler.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
          {model.kaliteler.map((k, i) => (
            <button key={k} onClick={() => setKalite(i)}
              className={cn("rounded-lg px-7 py-1.5 text-center transition-colors", kalite === i ? "bg-white text-black" : "text-white/60 hover:text-white")}>
              <span className="block text-[9.5px] font-normal text-metin-3">Şuna kadar</span>
              <span className="text-[14px] font-bold">{k}</span>
            </button>
          ))}
        </div>

        {/* ekstra rozetler */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {model.ekstra.map((e) => (
            <span key={e} className="flex items-center gap-1 rounded-lg bg-white/[0.05] px-3 py-1.5 text-[12px] text-metin-2"><Clock className="h-3 w-3" /> {e}</span>
          ))}
        </div>

        {/* gün paketleri */}
        <div className="mt-4 space-y-2.5">
          {GUN_META.map((g, i) => {
            const f = model.fiyatlar[kalite][i]; const e = model.eski[kalite][i];
            return (
              <button key={g.gun} onClick={() => setGun(i)}
                className={cn("flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-colors",
                  gun === i ? "border-aksan/60 bg-aksan/[0.06]" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]")}>
                <div className="flex items-center gap-3">
                  <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2", gun === i ? "border-aksan bg-aksan" : "border-white/25")}>
                    {gun === i && <Check className="h-3 w-3 text-zemin" />}
                  </span>
                  <div>
                    <p className="text-[15px] font-bold text-white">{g.ad}</p>
                    <p className="text-[12px] text-metin-3">{g.ozet}</p>
                  </div>
                </div>
                <div className="text-right">
                  {e > 0 && <p className="text-[12px] text-metin-3 line-through">${e}</p>}
                  <p className="text-[22px] font-extrabold text-white">${f}</p>
                  <p className="text-[10px] text-metin-3">Tek ödeme</p>
                </div>
              </button>
            );
          })}
        </div>

        <button onClick={() => { toast.success(`Sınırsız ${model.ad} etkinleştirildi ∞`, { description: `${GUN_META[gun].gun} gün · ${model.kaliteler[kalite]} · $${fiyat}` }); onKapat(); }}
          className="mt-4 w-full rounded-2xl bg-aksan py-4 text-[15px] font-bold text-zemin transition-transform hover:scale-[1.01]">
          ${fiyat} karşılığında Sınırsız Al {eski > 0 && <span className="text-[13px] text-zemin/50 line-through">${eski}</span>}
        </button>
        <p className="mt-2.5 text-center text-[11px] text-metin-3">Yalnızca standart üretim modları. MCP, Supercomputer, Canvas hariç.</p>
      </div>
    </div>
  );
}

/* ═══════════════════════ HIZ ARTIR ═══════════════════════ */

const PARALEL = [4, 8, 12, 16];
const BOOST = [500, 1000, 1500, 2000, 2500, 3000];
const SSS = [
  { s: "Eşzamanlılık Boost'u ne yapar", c: "Aynı anda çalışabilen üretim sayısını artırır — beklemeden daha fazla iş kuyruğa alırsın." },
  { s: "Boost kredisi ne zaman önerilir", c: "Yoğun üretim yaptığın, büyük partiler halinde çalıştığın dönemlerde iterasyonu hızlandırır." },
  { s: "Boost kredisini nerede uygulayabilirim", c: "Tüm 62 modelde ve Supercomputer görevlerinde geçerlidir." },
  { s: "Boost kredisini nasıl kontrol ederim", c: "Ayarlar → Kullanım'dan kalan boost kredini ve eşzamanlılık limitini görebilirsin." },
  { s: "Boost paketimi nasıl özelleştiririm", c: "Paralel üretim ve boost kredisini istediğin gibi birleştir; fiyat otomatik hesaplanır." },
  { s: "Boost kredilerimi nereden yönetirim", c: "Hesap ayarlarındaki Abonelik & Kullanım bölümünden yönetebilirsin." },
];

function HizArtir({ onKapat }: { onKapat: () => void }) {
  const krediEkle = useAuth((s) => s.krediEkle);
  const [paralel, setParalel] = useState(8);
  const [boost, setBoost] = useState(1000);
  const [acikSss, setAcikSss] = useState<number | null>(null);
  const fiyat = Math.round(paralel * 4 + boost * 0.06);
  const eski = Math.round(fiyat * 1.38);

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0c0c0e] p-6 shadow-2xl sm:p-8">
      {/* Hız hero — animasyonlu hız çizgileri + 3X rozeti (m59: düz metin yerine enerjik görsel) */}
      <div className="relative mx-auto mb-6 flex h-[132px] max-w-2xl items-center justify-center overflow-hidden rounded-3xl border border-aksan/20 bg-gradient-to-br from-aksan/[0.12] via-aksan/[0.04] to-transparent">
        {/* akan hız çizgileri */}
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 9 }).map((_, i) => (
            <motion.span key={i}
              className="absolute h-[2px] rounded-full bg-gradient-to-r from-transparent via-aksan/70 to-transparent"
              style={{ top: `${8 + i * 11}%`, width: `${40 + (i % 4) * 18}%`, left: "-45%" }}
              animate={{ x: ["0%", "260%"] }}
              transition={{ duration: 1.4 + (i % 3) * 0.5, repeat: Infinity, ease: "easeIn", delay: i * 0.16 }} />
          ))}
        </div>
        <div className="relative flex items-center gap-3">
          <motion.span
            animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-aksan text-zemin shadow-[0_0_40px_rgba(85,214,253,0.4)]">
            <Zap className="h-7 w-7 fill-current" />
          </motion.span>
          <span className="text-[52px] font-black leading-none tracking-tighter text-white sm:text-[64px]">
            3<span className="text-aksan">×</span>
          </span>
        </div>
      </div>
      <h2 className="text-center text-[24px] font-extrabold uppercase leading-tight tracking-tight text-white sm:text-[30px]">
        <span className="text-aksan">3 KATA KADAR HIZLI</span> ÜRET<br />DAHA FAZLA PARALEL ÜRETİMLE
      </h2>
      <p className="mt-2 text-center text-[14px] text-metin-3">Ek eşzamanlılıkla boost kredisi al, aynı anda daha fazla üretim çalıştır.</p>

      <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-white/8 bg-white/[0.02] p-5">
        {/* mevcut bakiye */}
        <p className="mb-3 text-[13px] font-medium text-metin-2">Mevcut bakiye & Paralel üretim</p>
        <div className="grid grid-cols-3 gap-2">
          {[{ v: "0", et: "Boost kredisi" }, { v: "6/22", et: "Video eşzamanlı", ek: "+8" }, { v: "8/24", et: "Görsel eşzamanlı", ek: "+8" }].map((b) => (
            <div key={b.et} className="rounded-2xl border border-white/8 bg-white/[0.02] p-3.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[20px] font-bold text-white">{b.v}</span>
                {b.ek && <span className="rounded bg-aksan/15 px-1.5 py-0.5 text-[11px] font-bold text-aksan">↑{b.ek}</span>}
              </div>
              <div className="mt-0.5 text-[12px] text-metin-3">{b.et}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-metin-3">Tüm 62 modele uygulanır</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {["Seedance 2.0", "GPT Image 2", "Kling 3.0", "Nano Banana Pro"].map((m) => (
            <span key={m} className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] text-metin-2">{m}</span>
          ))}
        </div>

        {/* paralel üretim */}
        <p className="mt-5 mb-2 text-[13px] font-medium text-metin-2">Paralel üretim ekle</p>
        <div className="grid grid-cols-4 gap-2">
          {PARALEL.map((p) => (
            <button key={p} onClick={() => setParalel(p)}
              className={cn("rounded-xl border py-3.5 text-[15px] font-bold transition-colors",
                paralel === p ? "border-aksan bg-aksan/10 text-aksan" : "border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]")}>+{p}</button>
          ))}
        </div>

        {/* boost kredisi */}
        <div className="mt-5 mb-2 flex items-center justify-between">
          <p className="text-[13px] font-medium text-metin-2">Boost kredisi ekle</p>
          <button onClick={() => toast("Boost kredisi hakkında", { description: "Aşağıdaki SSS'lere göz at." })} className="text-[12px] text-aksan hover:underline">Daha fazla bilgi</button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {BOOST.map((b) => (
            <button key={b} onClick={() => setBoost(b)}
              className={cn("rounded-xl border py-3.5 text-[15px] font-semibold transition-colors",
                boost === b ? "border-aksan bg-aksan/10 text-aksan" : "border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]")}>{b.toLocaleString("tr-TR")}</button>
          ))}
        </div>
      </div>

      <button onClick={() => { krediEkle(boost); toast.success(`Hız artırıldı ⚡`, { description: `+${paralel} paralel · ${boost} boost kredisi · $${fiyat}` }); onKapat(); }}
        className="mx-auto mt-4 flex w-full max-w-2xl items-center justify-center gap-2 rounded-2xl bg-aksan py-4 text-[16px] font-bold text-zemin transition-transform hover:scale-[1.01]">
        ${fiyat} <span className="text-[14px] text-zemin/60 line-through">${eski}</span> — Satın al
      </button>

      {/* Nasıl Çalışır */}
      <p className="mt-8 text-center text-[20px] font-bold text-white">Nasıl Çalışır</p>
      <div className="mx-auto mt-4 grid max-w-2xl gap-3 sm:grid-cols-3">
        {[
          { ik: Layers, b: "Tüm 62 modelde çalışır", a: "Nano Banana Pro, Seedance 2.0, Kling 3.0 ve tüm diğer modeller." },
          { ik: Cpu, b: "Supercomputer'da çalışır", a: "Tüm Vayra ürünlerine ve Supercomputer görevlerine uygulanır." },
          { ik: FastForward, b: "8 kata kadar hızlı üretim", a: "Paralelde 24 işe kadar. Daha büyük partiler, daha hızlı iterasyon." },
        ].map((k) => (
          <div key={k.b} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-aksan/12 text-aksan"><k.ik className="h-5 w-5" /></span>
            <p className="mt-3 text-[14px] font-bold text-white">{k.b}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-metin-3">{k.a}</p>
          </div>
        ))}
      </div>

      {/* SSS accordion */}
      <p className="mt-8 text-center text-[20px] font-bold text-white">Boost kredileri hakkında</p>
      <div className="mx-auto mt-4 max-w-2xl space-y-2">
        {SSS.map((q, i) => (
          <div key={q.s} className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02]">
            <button onClick={() => setAcikSss(acikSss === i ? null : i)} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left">
              <span className="text-[14px] font-medium text-white">{q.s}</span>
              <ChevronDown className={cn("h-4 w-4 shrink-0 text-metin-3 transition-transform", acikSss === i && "rotate-180")} />
            </button>
            <AnimatePresence>
              {acikSss === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"><p className="px-4 pb-3.5 text-[13px] leading-relaxed text-metin-2">{q.c}</p></motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
