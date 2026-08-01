"use client";

/**
 * MuzikOlusturModal — /panel/muzik kütüphanesine KENDİ stilini/sesini ekleme.
 *
 * Kullanıcı isteği (2026-07-31):
 *  • Stil kütüphanesinde kendi stilini oluşturabilmek — yazıyla (prompt)
 *    VEYA bir ses dosyası yükleyerek.
 *  • Ses kütüphanesinde kendi sesini ekleyebilmek — akış /panel/ses'teki
 *    "Ses ekle" (klonlama) ile aynı: ad + ton + örnek yükle/kaydet.
 *
 * Öncesinde kütüphane yalnız "Keşfet / Kayıtlı" listesiydi; kullanıcı hiçbir
 * şey ekleyemiyordu — "Kayıtlı" sekmesi de ancak bir parçanın ⋯ menüsünden
 * dolabiliyordu.
 */

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, Mic, Upload, Square, Wand2, Waves } from "lucide-react";
import { useMuzik, TURLER } from "@/store/useMuzik";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const LIME = "var(--sn-lime)";

/** Ortak kabuk — ortalanmış, karartmalı, portal. */
function Kabuk({ baslik, ozet, onKapat, children, genislik = 620 }: {
  baslik: string; ozet: string; onKapat: () => void; children: React.ReactNode; genislik?: number;
}) {
  useScrollKilit(true);
  useEscKapat(true, onKapat);
  if (typeof document === "undefined") return null;
  return createPortal(
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onKapat} className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 360, damping: 30 }}
        style={{ width: `min(94vw, ${genislik}px)` }}
        className="sinema-kapsam fixed left-1/2 top-1/2 z-[101] flex max-h-[88vh] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[20px] border border-white/10 bg-[var(--sn-yuzey)]">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--sn-kenar)] p-5">
          <div className="min-w-0">
            <h3 className="hf-baslik text-[18px] text-white">{baslik}</h3>
            <p className="mt-1 text-[13px] text-[var(--sn-metin-2)]">{ozet}</p>
          </div>
          <button onClick={onKapat} aria-label="Kapat"
            className="hf-btn glass-cip flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--sn-metin-2)]">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </>,
    document.body,
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* STİL OLUŞTUR — prompt ile VEYA ses dosyasından                             */
/* ══════════════════════════════════════════════════════════════════════════ */
export function StilOlusturModal({ onKapat, onOlustu }: {
  onKapat: () => void;
  onOlustu?: (id: string) => void;
}) {
  const stilKaydet = useMuzik((s) => s.stilKaydet);
  const [yontem, setYontem] = useState<"istem" | "dosya">("istem");
  const [ad, setAd] = useState("");
  const [istem, setIstem] = useState("");
  const [tur, setTur] = useState(TURLER.find((t) => t !== "Tümü") ?? "Elektronik");
  const [dosya, setDosya] = useState<string | null>(null);
  const dosyaRef = useRef<HTMLInputElement>(null);

  const olustur = () => {
    const temizAd = ad.trim();
    if (temizAd.length < 2) { toast.error("Stile bir ad ver."); return; }
    if (yontem === "istem" && istem.trim().length < 6) {
      toast.error("Stili tarif et", { description: "Örn: sıcak analog synth, yavaş tempo, nostaljik." });
      return;
    }
    if (yontem === "dosya" && !dosya) {
      toast.error("Referans ses gerekli", { description: "Stilin öğrenileceği bir parça yükle." });
      return;
    }
    const id = stilKaydet({
      ad: temizAd,
      tur,
      tohum: "stil-" + temizAd.toLocaleLowerCase("tr").replace(/\s+/g, "-"),
      kaydedilmis: true,
    });
    toast.success(`${temizAd} stili oluşturuldu 🎛`, {
      description: yontem === "istem" ? "İsteminden öğrenildi" : `${dosya} referansından öğrenildi`,
    });
    onOlustu?.(id);
    onKapat();
  };

  return (
    <Kabuk baslik="YENİ STİL" ozet="Kendi stilini yazıyla tarif et ya da bir parçadan öğret." onKapat={onKapat}>
      <input ref={dosyaRef} type="file" accept="audio/*" hidden
        onChange={(e) => {
          const d = e.target.files?.[0]; e.target.value = "";
          if (!d) return;
          if (d.size > 25 * 1024 * 1024) { toast.error("Dosya çok büyük", { description: "En fazla 25MB." }); return; }
          setDosya(d.name);
          toast.success("Referans parça yüklendi 🎵", { description: d.name });
        }} />

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
        {/* Yöntem seçimi */}
        <div className="glass-cip inline-flex rounded-full p-1">
          {([["istem", "Yazıyla tarif et", Wand2], ["dosya", "Parçadan öğret", Waves]] as const).map(([id, etiket, Ik]) => (
            <button key={id} onClick={() => setYontem(id)} aria-pressed={yontem === id}
              className={cn("hf-btn flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
                yontem === id ? "bg-white text-[#111114]" : "text-[var(--sn-metin-2)] hover:text-white")}>
              <Ik className="h-3.5 w-3.5" /> {etiket}
            </button>
          ))}
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[var(--sn-metin-2)]">
            <span className="text-rose-400">*</span> Ad
          </label>
          <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Örn. Gece Sürüşü" autoFocus
            className="h-11 w-full rounded-xl border border-[var(--sn-kenar)] bg-[var(--sn-yuzey-2)] px-3.5 text-[14px] text-white outline-none focus:border-[var(--sn-lime)]" />
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[var(--sn-metin-2)]">Tür</label>
          <div className="flex flex-wrap gap-1.5">
            {TURLER.filter((t) => t !== "Tümü").map((t) => (
              <button key={t} onClick={() => setTur(t)} aria-pressed={tur === t}
                className={cn("hf-btn rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                  tur === t ? "text-[#0a0a0a]" : "glass-cip text-[var(--sn-metin-2)] hover:text-white")}
                style={tur === t ? { background: LIME } : undefined}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {yontem === "istem" ? (
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[var(--sn-metin-2)]">Stili tarif et</label>
            <textarea value={istem} onChange={(e) => setIstem(e.target.value)} rows={4}
              placeholder="Örn: sıcak analog synth katmanları, yavaş tempo, vinil cızırtısı, nostaljik ve puslu bir atmosfer…"
              className="w-full resize-none rounded-xl border border-[var(--sn-kenar)] bg-[var(--sn-yuzey-2)] px-3.5 py-3 text-[14px] text-white outline-none focus:border-[var(--sn-lime)]" />
            <p className="mt-1.5 text-[12px] text-[var(--sn-metin-3)]">
              Enstrüman, tempo, ruh hâli ve kayıt dokusunu yazarsan stil daha isabetli olur.
            </p>
          </div>
        ) : (
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[var(--sn-metin-2)]">Referans parça</label>
            <button onClick={() => dosyaRef.current?.click()}
              className={cn("flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 transition-colors",
                dosya ? "border-[var(--sn-lime)]/60 bg-[var(--sn-lime)]/[0.06]" : "border-[var(--sn-kenar-2)] hover:border-white/30")}>
              <Upload className="h-6 w-6 text-[var(--sn-metin-2)]" />
              <span className="text-[13.5px] font-medium text-white">{dosya ?? "Bir parça yükle"}</span>
              <span className="text-[11.5px] text-[var(--sn-metin-3)]">MP3 / WAV · en fazla 25MB</span>
            </button>
            <p className="mt-1.5 text-[12px] text-[var(--sn-metin-3)]">
              Yüklediğin parçanın tınısı, tempo hissi ve düzenlemesi stil olarak öğrenilir.
            </p>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-[var(--sn-kenar)] px-5 py-4">
        <button onClick={onKapat} className="hf-btn glass-cip rounded-xl px-5 py-2.5 text-[14px] font-medium text-white">İptal</button>
        <button onClick={olustur} className="rounded-xl px-6 py-2.5 text-[14px] font-bold text-[#0a0a0a] transition-transform hover:scale-[1.02]"
          style={{ background: LIME }}>Stili oluştur</button>
      </div>
    </Kabuk>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* SES OLUŞTUR — /panel/ses "Ses ekle" akışıyla AYNI                          */
/* ══════════════════════════════════════════════════════════════════════════ */
export function MuzikSesOlusturModal({ onKapat, onOlustu }: {
  onKapat: () => void;
  onOlustu?: (id: string) => void;
}) {
  const sesler = useMuzik((s) => s.sesler);
  const sesKaydet = useMuzik((s) => s.sesKaydet);
  const [ad, setAd] = useState("");
  const [cinsiyet, setCinsiyet] = useState<"Kadın" | "Erkek" | "Nötr">("Kadın");
  const [dosya, setDosya] = useState<string | null>(null);
  const [kayit, setKayit] = useState(false);
  const [kayitSn, setKayitSn] = useState(0);
  const dosyaRef = useRef<HTMLInputElement>(null);
  const sayacRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const kayitDurdur = () => {
    setKayit(false);
    if (sayacRef.current) { clearInterval(sayacRef.current); sayacRef.current = null; }
  };
  const kayitBaslat = () => {
    setDosya(null); setKayitSn(0); setKayit(true);
    sayacRef.current = setInterval(() => setKayitSn((n) => n + 1), 1000);
  };

  const olustur = () => {
    const temiz = ad.trim();
    if (temiz.length < 2) { toast.error("Sese bir ad ver."); return; }
    if (!dosya && kayitSn < 3) {
      toast.error("Örnek ses gerekli", { description: "Bir ses dosyası yükle ya da en az 3 sn kaydet." });
      return;
    }
    if (sesler.some((s) => s.ad.toLocaleLowerCase("tr") === temiz.toLocaleLowerCase("tr"))) {
      toast.error("Bu adda bir ses zaten var"); return;
    }
    kayitDurdur();
    const id = sesKaydet({ ad: temiz, cinsiyet, tohum: "ses-" + temiz.toLocaleLowerCase("tr"), kaydedilmis: true });
    toast.success(`${temiz} sesi eklendi 🎙`, { description: "Artık kütüphanende görünüyor." });
    onOlustu?.(id);
    onKapat();
  };

  return (
    <Kabuk baslik="SES EKLE" ozet="Klonlamak için bir ses örneği kaydet ya da yükle." onKapat={() => { kayitDurdur(); onKapat(); }}>
      <input ref={dosyaRef} type="file" accept="audio/*" hidden
        onChange={(e) => {
          const d = e.target.files?.[0]; e.target.value = "";
          if (!d) return;
          if (d.size > 11 * 1024 * 1024) { toast.error("Dosya çok büyük", { description: "En fazla 11MB (MP3/WAV)." }); return; }
          kayitDurdur(); setKayitSn(0); setDosya(d.name);
          toast.success("Örnek ses yüklendi 🎧", { description: d.name });
        }} />

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[var(--sn-metin-2)]">
            <span className="text-rose-400">*</span> İsim
          </label>
          <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Sesini adlandır" autoFocus
            className="h-11 w-full rounded-xl border border-[var(--sn-kenar)] bg-[var(--sn-yuzey-2)] px-3.5 text-[14px] text-white outline-none focus:border-[var(--sn-lime)]" />
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[12px] text-[var(--sn-metin-3)]">Ton:</span>
            {(["Kadın", "Erkek", "Nötr"] as const).map((c) => (
              <button key={c} onClick={() => setCinsiyet(c)} aria-pressed={cinsiyet === c}
                className={cn("hf-btn rounded-full px-3 py-1 text-[12px] font-semibold transition-colors",
                  cinsiyet === c ? "text-[#0a0a0a]" : "glass-cip text-[var(--sn-metin-2)] hover:text-white")}
                style={cinsiyet === c ? { background: LIME } : undefined}>{c}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button onClick={() => dosyaRef.current?.click()}
            className={cn("flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-7 transition-colors",
              dosya ? "border-[var(--sn-lime)]/60 bg-[var(--sn-lime)]/[0.06]" : "border-[var(--sn-kenar-2)] hover:border-white/30")}>
            <Upload className="h-6 w-6 text-[var(--sn-metin-2)]" />
            <span className="text-[13px] font-medium text-white">{dosya ? "Örnek yüklendi" : "Ses yükle"}</span>
            <span className="max-w-full truncate text-[11px] text-[var(--sn-metin-3)]">{dosya ?? "MP3 / WAV · en fazla 11MB"}</span>
          </button>
          <button onClick={() => (kayit ? kayitDurdur() : kayitBaslat())}
            className={cn("flex flex-col items-center justify-center gap-2 rounded-xl border px-4 py-7 transition-colors",
              kayit ? "border-rose-400/60 bg-rose-500/[0.08]"
                : kayitSn >= 3 ? "border-[var(--sn-lime)]/60 bg-[var(--sn-lime)]/[0.06]"
                : "border-[var(--sn-kenar-2)] hover:border-white/30")}>
            {kayit ? <Square className="h-6 w-6 fill-rose-400 text-rose-400" /> : <Mic className="h-6 w-6 text-[var(--sn-metin-2)]" />}
            <span className="text-[13px] font-medium text-white">{kayit ? "Kaydı durdur" : kayitSn >= 3 ? "Kayıt hazır" : "Kendi sesini kaydet"}</span>
            <span className="text-[11px] tabular-nums text-[var(--sn-metin-3)]">
              {kayit || kayitSn > 0 ? `${Math.floor(kayitSn / 60)}:${String(kayitSn % 60).padStart(2, "0")}` : "en az 3 sn"}
            </span>
          </button>
        </div>

        <div className="rounded-xl border border-[var(--sn-kenar)] bg-black/25 p-4">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--sn-metin-3)]">Örnek metin</p>
          <p className="text-[13.5px] leading-relaxed text-[var(--sn-metin-2)]">
            &ldquo;Bugün hava çok güzel. Sabah erkenden kalkıp sahil boyunca yürüdüm; martıların sesi
            ve dalgaların ritmi bana eşlik etti.&rdquo;
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--sn-kenar)] px-5 py-4">
        <span className="text-[12px] text-[var(--sn-metin-3)]">Klonlama 40 kredi</span>
        <div className="flex items-center gap-2.5">
          <button onClick={() => { kayitDurdur(); onKapat(); }} className="hf-btn glass-cip rounded-xl px-5 py-2.5 text-[14px] font-medium text-white">İptal</button>
          <button onClick={olustur} className="rounded-xl px-6 py-2.5 text-[14px] font-bold text-[#0a0a0a] transition-transform hover:scale-[1.02]"
            style={{ background: LIME }}>Sesi Klonla</button>
        </div>
      </div>
    </Kabuk>
  );
}
