"use client";

import { useRef, useState } from "react";
import { Play, Pause, Heart, Copy, Download } from "lucide-react";
import { toast } from "@/lib/toast";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { useSecim } from "@/store/useSecim";
import { cn } from "@/lib/utils";

import { kopyala } from "@/lib/gercekEylem";
/* ============================================================
   SesUretimKarti — Higgsfield /audio üretim kartı BİREBİR.
   Geniş waveform kartı: üstte dalga, altında prompt + LED-font
   ses adı + süre. Sağda hover'da ♡ / kopya / indir dikey rayı.
   Sol-üstte seçim kutusu. Tıklayınca oynat/durdur (waveform ilerler).
   ============================================================ */

// Deterministik waveform barları (SSR güvenli) — her kart tohumundan üretilir.
function barlarUret(tohum: string, adet = 88): number[] {
  let h = 0;
  for (let i = 0; i < tohum.length; i++) h = (h * 31 + tohum.charCodeAt(i)) >>> 0;
  return Array.from({ length: adet }, (_, i) => {
    const x = Math.sin((i + h % 50) * 0.5) * Math.cos((i + h % 30) * 0.21);
    return 12 + Math.round(Math.abs(x) * 74);
  });
}

// LED nokta-matris tarzı ses adı için ses preseti çıkar (meta.ses veya başlıktan).
function sesAdi(u: Uretim): string {
  const m = u.meta?.ses;
  if (m) return m.toUpperCase();
  const parca = u.baslik.split(":").pop()?.trim() ?? u.baslik;
  return parca.toUpperCase().slice(0, 16);
}

function sureFormat(u: Uretim): string {
  // Prompt uzunluğundan deterministik "00:0X" süre türet (gerçek ses yoksa).
  let h = 0;
  const t = u.prompt || u.baslik;
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0;
  const sn = 5 + (h % 8);
  return `00:${String(sn).padStart(2, "0")}`;
}

export function SesUretimKarti({ u, onAc }: { u: Uretim; onAc: () => void }) {
  const { favoriToggle } = useProjeler();
  const secili = useSecim((s) => s.secililer.includes(u.id));
  const secimToggle = useSecim((s) => s.toggle);
  const [oynat, setOynat] = useState(false);
  const [ilerleme, setIlerleme] = useState(0);
  const sesRef = useRef<HTMLAudioElement | null>(null);
  const barlar = barlarUret(u.id + u.prompt);
  const gercekSes = Boolean(u.sesUrl);
  const isleniyor = u.durum !== "tamam";

  const oynatDurdur = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (gercekSes && sesRef.current) {
      if (oynat) sesRef.current.pause();
      else sesRef.current.play().catch(() => toast.error("Ses oynatılamadı", { description: "Tarayıcı oynatmayı engelledi ya da dosyaya ulaşılamadı. Yeniden dene." }));
    }
    setOynat((v) => !v);
  };

  const indir = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (gercekSes && u.sesUrl) {
      const a = document.createElement("a");
      a.href = u.sesUrl;
      a.download = `${sesAdi(u).toLowerCase()}.mp3`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Ses indiriliyor", { description: a.download });
    } else {
      toast.info("Örnek ses indirilemez", { description: "Bu bir önizleme. Gerçek üretim için sağlayıcı anahtarı gerekli." });
    }
  };

  const promptuKopyala = (e: React.MouseEvent) => {
    e.stopPropagation();
    void kopyala(u.prompt, "İstem kopyalandı");
  };

  return (
    <div
      className="group relative flex cursor-pointer flex-col justify-end overflow-hidden rounded-lg border border-white/[0.06] bg-gradient-to-b from-white/[0.02] to-transparent px-6 pb-4 pt-6 transition-colors hover:border-white/12"
      style={{ minHeight: 300 }}
      onClick={onAc}
    >
      {gercekSes && (
        <audio
          ref={sesRef}
          src={u.sesUrl}
          preload="none"
          onEnded={() => { setOynat(false); setIlerleme(0); }}
          onTimeUpdate={(e) => {
            const el = e.currentTarget;
            setIlerleme(el.duration ? (el.currentTime / el.duration) * 100 : 0);
          }}
        />
      )}

      {isleniyor ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/15 border-t-cyan-glow" />
          <span className="text-xs text-white/50">{u.durum === "kuyrukta" ? "Kuyrukta…" : `Üretiliyor · %${u.ilerleme}`}</span>
        </div>
      ) : (
        <>
          {/* WAVEFORM — kartı yatay olarak dolduran ince dikey barlar (Higgsfield birebir) */}
          <button
            onClick={oynatDurdur}
            className="absolute inset-0 flex items-center justify-center gap-[2px] px-6"
            aria-label={oynat ? "Duraklat" : "Oynat"}
          >
            {barlar.map((barH, i) => {
              const gecti = (i / barlar.length) * 100 <= ilerleme;
              return (
                <span
                  key={i}
                  className={cn(
                    "w-[3px] shrink-0 rounded-full transition-colors",
                    gecti ? "bg-cyan-glow/80" : "bg-white/25 group-hover:bg-white/35",
                  )}
                  style={{ height: `${barH}%`, maxHeight: 120 }}
                />
              );
            })}
            {/* Ortada oynat/durdur dairesi (hover'da) */}
            <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 opacity-0 backdrop-blur-md transition-all group-hover:opacity-100">
              {oynat ? <Pause className="h-5 w-5 fill-white text-white" /> : <Play className="h-5 w-5 translate-x-0.5 fill-white text-white" />}
            </span>
          </button>

          {/* Alt bilgi: prompt (tek satır) + LED-font ses adı + süre */}
          <div className="pointer-events-none relative z-10">
            <p className="mb-2 truncate text-sm text-white/55">{u.prompt || u.baslik}</p>
            <div className="flex items-end justify-between">
              <span className="hf-led text-[30px] leading-none text-white/85" style={{ textShadow: "0 0 12px rgba(34,211,238,0.25)" }}>
                {sesAdi(u)}
              </span>
              <span className="text-sm tabular-nums text-white/45">{sureFormat(u)}</span>
            </div>
          </div>

          {/* Sol-üst seçim kutusu */}
          <button
            onClick={(e) => { e.stopPropagation(); secimToggle(u.id); }}
            className={cn(
              "absolute left-3 top-3 z-20 flex h-5 w-5 items-center justify-center rounded-[5px] border-2 backdrop-blur-md transition-all",
              secili ? "border-cyan-glow bg-cyan-glow opacity-100" : "border-white/60 bg-black/30 opacity-0 group-hover:opacity-100",
            )}
            aria-label="Seç"
          >
            {secili && <span className="h-2 w-2 rounded-[2px] bg-ink-950" />}
          </button>

          {/* Sağ dikey hover rayı: ♡ / kopya / indir (Higgsfield birebir) */}
          <div className="pointer-events-none absolute right-3 top-3 z-20 flex flex-col gap-1.5 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
            <button onClick={(e) => { e.stopPropagation(); favoriToggle(u.id); }}
              className={cn("flex h-8 w-8 items-center justify-center rounded-full glass-ikon text-white/90  transition-colors", u.favori && "text-rose-400")}
              aria-label="Favori">
              <Heart className={cn("h-4 w-4", u.favori && "fill-current")} />
            </button>
            <button onClick={promptuKopyala}
              className="flex h-8 w-8 items-center justify-center rounded-full glass-ikon text-white/90  transition-colors" aria-label="Prompt'u kopyala">
              <Copy className="h-4 w-4" />
            </button>
            <button onClick={indir}
              className="flex h-8 w-8 items-center justify-center rounded-full glass-ikon text-white/90  transition-colors" aria-label="İndir">
              <Download className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
