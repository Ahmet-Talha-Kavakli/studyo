"use client";

/**
 * MOODBOARD — iki kabuk:
 *  • Masaüstü (Higgsfield /moodboard BİREBİR): hero + hazır moodboard galerisi
 *    + "Ruh panonu oluştur" → build modu (görsel yükle + Üret).
 *  • Mobil (crete-moodboard birebir): referans tepsisi + doğrulama + Oluştur.
 */

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/lib/toast";
import { X, Plus, Images, Tag, Sparkles, Upload, FolderOpen, ArrowLeft } from "lucide-react";
import { MobilIpucuBloku } from "@/components/panel/MobilComposer";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { useAktifProje } from "@/lib/useAktifProje";
import { onizlemeArka, saltUrl, cn } from "@/lib/utils";

/* GERÇEK moodboard görselleri — 12 stil + 4 hero + 4 iyi/4 kötü örnek.
 * Tohum dosya adıyla birebir (mood-*, mb-iyi-*, mb-kotu-*). */
const MOODBOARD_GERCEK = new Set([
  "mood-warm", "mood-y2k", "mood-swag", "mood-theatr", "mood-y2kstreet", "mood-flash",
  "mood-oldphone", "mood-street", "mood-night", "mood-pastel", "mood-retro", "mood-minimal",
  "mood-h1", "mood-h2", "mood-h3", "mood-h4",
  "mb-iyi-0", "mb-iyi-1", "mb-iyi-2", "mb-iyi-3",
  "mb-kotu-0", "mb-kotu-1", "mb-kotu-2", "mb-kotu-3",
]);
/** Tohum için gerçek moodboard görseli (yoksa undefined). */
function moodGercek(tohum: string): string | undefined {
  return MOODBOARD_GERCEK.has(tohum) ? `/gercek/moodboard/${tohum}.webp` : undefined;
}
/** Gerçek varsa CSS background, yoksa stok. */
function moodArka(tohum: string, kat: string): string {
  const g = moodGercek(tohum);
  return g ? `url("${g}") center/cover no-repeat` : onizlemeArka(tohum, kat);
}

export default function MoodboardPage() {
  return (
    <>
      {/* Masaüstü */}
      <div className="hidden sm:block"><MasaustuMoodboard /></div>
      {/* Mobil */}
      <div className="sm:hidden"><MobilMoodboard /></div>
    </>
  );
}

/* ═══════════════════ MASAÜSTÜ ═══════════════════ */

const HAZIR = [
  { ad: "Sıcak Ambiyans", tohum: "mood-warm", kat: "portre" },
  { ad: "Y2K Stüdyo", tohum: "mood-y2k", kat: "portre" },
  { ad: "Swag Dönemi", tohum: "mood-swag", kat: "portre" },
  { ad: "Teatral Işık", tohum: "mood-theatr", kat: "sinematik" },
  { ad: "Y2K Sokak", tohum: "mood-y2kstreet", kat: "portre" },
  { ad: "Flaş Editöryel", tohum: "mood-flash", kat: "portre" },
  { ad: "Eski Telefon", tohum: "mood-oldphone", kat: "sinematik" },
  { ad: "Sokak Fotoğrafı", tohum: "mood-street", kat: "manzara" },
  { ad: "Sinematik Gece", tohum: "mood-night", kat: "sinematik" },
  { ad: "Pastel Rüya", tohum: "mood-pastel", kat: "soyut" },
  { ad: "Retro Film", tohum: "mood-retro", kat: "sinematik" },
  { ad: "Minimal Portre", tohum: "mood-minimal", kat: "portre" },
];

function MasaustuMoodboard() {
  const [mod, setMod] = useState<"galeri" | "build">("galeri");
  return mod === "build" ? <BuildModu onGeri={() => setMod("galeri")} /> : <GaleriModu onBuild={() => setMod("build")} />;
}

function GaleriModu({ onBuild }: { onBuild: () => void }) {
  return (
    <div className="sinema-kapsam min-h-[calc(100vh-3rem)] bg-zemin">
      <div className="mx-auto max-w-4xl px-6 pt-14 text-center">
        <div className="mb-8 flex justify-center gap-2">
          {["mood-h1", "mood-h2", "mood-h3", "mood-h4"].map((t, i) => (
            <motion.div key={t}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, rotate: (i - 1.5) * 5 }}
              transition={{ delay: i * 0.08 }}
              className="h-28 w-24 shrink-0 overflow-hidden rounded-xl sm:h-36 sm:w-32"
              style={{ background: moodArka(t, i % 2 ? "portre" : "sinematik") }} />
          ))}
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">RUH PANONU OLUŞTUR</h1>
        <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-metin-2">
          Referanslarını; stil, ton, tutarlı detaylar ve yaratıcı yön belirleyen odaklı bir ruh panosuna çevir.
        </p>
        <button onClick={onBuild}
          className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-aksan px-8 py-3.5 text-[15px] font-bold text-zemin transition-transform hover:scale-[1.03]">
          Ruh panonu oluştur <Sparkles className="h-4.5 w-4.5" />
        </button>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {HAZIR.map((m) => <HazirKart key={m.tohum} m={m} onBuild={onBuild} />)}
        </div>
      </div>
    </div>
  );
}

function HazirKart({ m, onBuild }: { m: (typeof HAZIR)[number]; onBuild: () => void }) {
  const arka = useMemo(() => moodArka(m.tohum, m.kat), [m.tohum, m.kat]);
  const src = useMemo(() => moodGercek(m.tohum) ?? saltUrl(arka), [m.tohum, arka]);
  return (
    <div className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-ink-900" style={{ background: arka }}>
      {src && <img src={src} alt={m.ad} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
        <button onClick={onBuild} className="flex items-center gap-2 rounded-full bg-aksan px-5 py-2.5 text-[14px] font-bold text-zemin transition-transform hover:scale-105">
          <Sparkles className="h-4 w-4" /> Üret
        </button>
      </div>
      <span className="absolute bottom-3 left-3 text-[14px] font-semibold text-white drop-shadow">{m.ad}</span>
    </div>
  );
}

type MoodGorsel = { id: string; url: string };

function BuildModu({ onGeri }: { onGeri: () => void }) {
  const { aktifProjeId } = useAktifProje();
  const router = useRouter();
  const dosyaRef = useRef<HTMLInputElement>(null);
  const [gorseller, setGorseller] = useState<MoodGorsel[]>([]);
  const [menu, setMenu] = useState(false);
  const sayacRef = useRef(0);

  const dosyaEkle = (files: FileList | null) => {
    if (!files) return;
    const yeni = Array.from(files).map((f) => ({ id: `mg_${Date.now()}_${sayacRef.current++}`, url: URL.createObjectURL(f) }));
    setGorseller((v) => [...v, ...yeni]);
    setMenu(false);
  };
  const stokEkle = () => {
    setGorseller((v) => [...v, { id: `mg_${Date.now()}_${sayacRef.current++}`, url: saltUrl(onizlemeArka("mood-asset" + v.length, "portre"))! }]);
    setMenu(false);
  };
  const cikar = (id: string) => setGorseller((v) => v.filter((g) => g.id !== id));

  const uret = () => {
    if (gorseller.length === 0) { toast.error("Önce en az bir referans görsel ekle"); return; }
    const sonuc = uretimBaslat({
      baslik: "Ruh Panosu", tur: "gorsel", model: "Vayra Moodboard",
      prompt: `${gorseller.length} referanstan ruh panosu`, kredi: 2, arac: "Moodboard",
      projeId: aktifProjeId ?? undefined,
    });
    if (!sonuc.ok) return uretimHataToast(sonuc, "Pano oluşturulamadı");
    toast.success("Ruh panosu üretiliyor ✦", { description: "Kitaplığına ekleniyor.", action: { label: "Kitaplığa git", onClick: () => router.push("/panel/kitaplik") } });
  };

  return (
    <div className="sinema-kapsam min-h-[calc(100vh-3rem)] bg-zemin px-4 py-6 lg:px-8">
      <nav className="mb-6 flex items-center gap-2 text-[15px]">
        <button onClick={onGeri} className="flex items-center gap-1.5 text-metin-3 hover:text-white"><ArrowLeft className="h-4 w-4" /> Moodboard</button>
        <span className="text-metin-3">/</span>
        <span className="font-semibold text-white">Yeni</span>
      </nav>

      <div className="flex flex-wrap items-start gap-4">
        <div className="relative">
          <button onClick={() => setMenu((v) => !v)}
            className="flex h-56 w-52 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] transition-colors hover:bg-white/[0.04]">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/8"><Plus className="h-6 w-6 text-metin-2" /></span>
            <span className="text-[15px] text-metin-2">Görsel yükle</span>
          </button>
          <input ref={dosyaRef} type="file" accept="image/*" multiple hidden onChange={(e) => dosyaEkle(e.target.files)} />
          <AnimatePresence>
            {menu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="menu-surface absolute left-0 top-full z-50 mt-2 w-60 rounded-2xl p-2">
                  <p className="px-2.5 py-1.5 text-[13px] text-metin-3">Görsel seç</p>
                  <button onClick={() => dosyaRef.current?.click()} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-[15px] text-white hover:bg-white/8"><Upload className="h-4.5 w-4.5 text-metin-2" /> Görsel yükle</button>
                  <button onClick={stokEkle} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-[15px] text-white hover:bg-white/8"><FolderOpen className="h-4.5 w-4.5 text-metin-2" /> Varlıklardan seç</button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {gorseller.map((g) => (
          <div key={g.id} className="group relative h-56 w-52 overflow-hidden rounded-2xl bg-ink-900">
            <img src={g.url} alt="" className="h-full w-full object-cover" />
            <button onClick={() => cikar(g.id)}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/70 group-hover:opacity-100"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>

      {gorseller.length > 0 && (
        <button onClick={uret}
          className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-aksan px-8 py-3.5 text-[15px] font-bold text-zemin shadow-2xl transition-transform hover:scale-[1.03]">
          <Sparkles className="h-4.5 w-4.5" /> Üret <span className="opacity-70">2</span>
        </button>
      )}
    </div>
  );
}

/* ═══════════════════ MOBİL (crete-moodboard birebir) ═══════════════════ */

function MobilMoodboard() {
  const router = useRouter();
  const [gorseller, setGorseller] = useState<string[]>([]);
  const [ad, setAd] = useState("");

  const yukle = (dosyalar: FileList) => {
    Array.from(dosyalar).slice(0, 80 - gorseller.length).forEach((d) => {
      const r = new FileReader();
      r.onload = () => setGorseller((v) => (v.length >= 80 ? v : [...v, String(r.result)]));
      r.readAsDataURL(d);
    });
  };

  const sayi = gorseller.length;
  const yeterli = sayi >= 20;

  const uret = () => {
    const s = uretimBaslat({
      baslik: ad.trim() || "Moodboard", tur: "gorsel", model: "Vayra Moodboard",
      prompt: `${sayi} referans görselden moodboard stili: ${ad.trim() || "adsız"}`, kredi: 25, arac: "Moodboard",
    });
    if (!s.ok) return uretimHataToast(s, "Oluşturulamadı");
    toast.success("Moodboard oluşturuluyor ✦", { description: `${sayi} referans` });
    router.push("/panel/kitaplik");
  };

  return (
    <div className="mobil-lime flex min-h-[100dvh] flex-col bg-zemin pb-[env(safe-area-inset-bottom)]">
      <header className="flex h-[52px] shrink-0 items-center px-3">
        <button onClick={() => router.push("/panel/gorsel")} aria-label="Kapat" className="flex h-9 w-9 items-center justify-center rounded-full text-white"><X className="h-[22px] w-[22px]" /></button>
        <span className="flex-1 text-center text-[17px] font-semibold text-white">Moodboard</span>
        <span className="w-9" aria-hidden />
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
        <div className="rounded-[16px] bg-yuzey-2 p-3">
          <p className="mb-2.5 text-[13px] text-metin-2">Referans görseller</p>
          <div className="flex flex-wrap gap-2.5">
            <label className="flex h-[104px] w-[104px] shrink-0 cursor-pointer items-center justify-center rounded-[12px] border border-dashed border-white/20">
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) yukle(e.target.files); e.target.value = ""; }} />
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-white"><Plus className="h-5 w-5" /></span>
            </label>
            {gorseller.map((g, i) => (
              <div key={i} className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-[12px] bg-cover bg-center" style={{ backgroundImage: `url(${g})` }}>
                <button onClick={() => setGorseller((v) => v.filter((_, j) => j !== i))} aria-label="Kaldır" className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[16px] bg-yuzey-2">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3.5">
            <span className="flex items-center gap-2.5 text-[15px] text-white"><Images className="h-[18px] w-[18px] text-metin-2" /> Görsel sayısı</span>
            <span className="flex items-center gap-2 text-[15px] font-medium text-white">{sayi}/80
              <span className={cn("rounded-[6px] px-2 py-[3px] text-[11px] font-bold", yeterli ? "bg-aksan text-zemin" : "bg-[#5a2530] text-[#ff9aa8]")}>{yeterli ? "İyi" : "Kötü"}</span>
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="flex items-center gap-2.5 text-[15px] text-white"><Tag className="h-[18px] w-[18px] text-metin-2" /> Kalite</span>
            <span className="flex items-center gap-2 text-[15px] font-medium text-white">{sayi ? "1964px" : "—"}
              {sayi > 0 && <span className="rounded-[6px] bg-aksan px-2 py-[3px] text-[11px] font-bold text-zemin">Mükemmel</span>}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-[16px] bg-yuzey-2 px-4 py-3.5">
          <span className="text-[15px] text-white">Moodboard adı</span>
          <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Adsız" className="min-w-0 flex-1 bg-transparent text-right text-[15px] font-medium text-white outline-none placeholder:text-metin-3" />
        </div>

        <MobilIpucuBloku
          olumluMetin="20+ fotoğraf, tek tutarlı stil"
          olumsuzMetin="Karışık stiller, tutarsız kalite"
          olumluKapaklar={[0, 1, 2, 3].map((i) => moodArka("mb-iyi-" + i, "moda"))}
          olumsuzKapaklar={[0, 1, 2, 3].map((i) => moodArka("mb-kotu-" + i, "portre"))}
        />
      </div>

      <div className="shrink-0 px-3 pb-4">
        <button onClick={uret} disabled={!yeterli} className="hf-uret flex h-14 w-full items-center justify-center gap-2 rounded-[14px] text-[17px] font-bold disabled:opacity-45">
          Moodboard Oluştur <span className="flex items-center gap-1">✦ 25</span>
        </button>
      </div>
    </div>
  );
}
