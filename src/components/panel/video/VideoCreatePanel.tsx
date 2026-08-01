"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Sparkles, ChevronDown, Check, Zap, Wand2, AtSign, Film, Pencil, X, Search, Clock, Gem, RectangleHorizontal, Volume2, VolumeX } from "lucide-react";
import { toast } from "@/lib/toast";
import { MODELLER } from "@/lib/catalog";
import {
  VIDEO_MODLARI, VIDEO_COZUNURLUKLER, VIDEO_SURELER, VIDEO_ORANLAR,
  VIDEO_PRESETLER, VIDEO_PRESET_KATEGORILERI, type VideoMod,
} from "@/lib/video-studyo";
import { onizlemeArka, cn } from "@/lib/utils";
import { origArka } from "@/lib/gercekVeri";
import { ElementMentionInput } from "@/components/panel/ElementMentionInput";

const videoModelleri = MODELLER.filter((m) => m.tur === "video");

/**
 * Video Stüdyo sol paneli — Higgsfield birebir: Create/Edit/Motion sekmeleri +
 * kaynak görsel + prompt + model + süre/çözünürlük/aspect + Üret CTA. Cyan tema.
 */
export function VideoCreatePanel({
  mod, onMod, prompt, onPrompt, onUret, preset, onPresetSecici,
}: {
  mod: VideoMod;
  onMod: (m: VideoMod) => void;
  prompt: string;
  onPrompt: (v: string) => void;
  onUret: (ayar: { modelId: string; cozunurluk: string; sure: number; oran: string; cokCekim: boolean }) => void;
  /** Higgsfield birebir: preset seçici modal DEĞİL — sağ alanı kaplayan duvar. Durum sayfada. */
  preset: (typeof VIDEO_PRESETLER)[number];
  onPresetSecici: () => void;
}) {
  const [modelId, setModelId] = useState(videoModelleri[0].id);
  const [modelMenu, setModelMenu] = useState(false);
  const [cozunurluk, setCozunurluk] = useState("1080p");
  const [sure, setSure] = useState(4);
  const [oran, setOran] = useState("16:9");
  const [cokCekim, setCokCekim] = useState(false);
  const [otoAyar, setOtoAyar] = useState(true);
  const [kaynak, setKaynak] = useState<string | null>(null);
  const [sonKare, setSonKare] = useState<string | null>(null);
  // Higgsfield "Enhance on / Off(ses)" çipleri — GERÇEK kontroller, üretime geçer.
  const [iyilestir, setIyilestir] = useState(true);
  const [sesli, setSesli] = useState(true);

  const model = MODELLER.find((m) => m.id === modelId)!;

  const uret = () => {
    if (mod === "olustur" && prompt.trim().length < 3 && !kaynak && preset.ad === "Genel") return toast.error("Videoyu tanımla, preset seç ya da bir görsel yükle.");
    if (mod !== "olustur" && !kaynak) return toast.error("Düzenlenecek/hareket kopyalanacak bir video yükle.");
    // Preset ekPrompt'u + İyileştir + Ses çipleri prompt'a GERÇEKTEN katkı sağlar.
    let tam = prompt;
    if (preset.ekPrompt && !tam.toLowerCase().includes(preset.ekPrompt.slice(0, 12))) {
      tam = tam ? `${tam}, ${preset.ekPrompt}` : preset.ekPrompt;
    }
    if (iyilestir) tam += " · sinematik detay iyileştirme, zengin doku ve ışık";
    tam += sesli ? " · ortam sesi ve müzik dahil" : " · sessiz (ses yok)";
    onPrompt(tam);
    onUret({ modelId, cozunurluk, sure, oran, cokCekim });
  };

  const yukle = (setter: (v: string) => void, mesaj: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setter(f.name.slice(0, 28)); toast.success(mesaj); }
  };

  return (
    <div className="flex h-full w-[360px] shrink-0 flex-col border-r border-white/8 bg-yuzey">
      {/* Sekmeler */}
      <div className="flex gap-1 border-b border-white/8 p-3">
        {VIDEO_MODLARI.map((m) => (
          <button key={m.id} onClick={() => onMod(m.id)} data-vmod={m.id} title={m.ozet}
            className={cn("flex-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors",
              mod === m.id ? "bg-cyan-glow/15 text-cyan-glow" : "bg-white/6 text-white/55 hover:bg-white/12")}>
            {m.ad}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 [scrollbar-width:thin]">
        {/* Preset seçici kartı — büyük görsel + "Değiştir" */}
        {mod === "olustur" && (
          <button onClick={onPresetSecici}
            style={{ background: origArka(preset.ad, "sinematik") }}
            className="group relative flex h-24 w-full items-end overflow-hidden rounded-2xl border border-white/10 p-3 text-left transition-colors hover:border-cyan-glow/40">
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/30 to-transparent" />
            <div className="relative z-10">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/70">Preset</div>
              <div className="text-base font-bold text-white">{preset.ad}</div>
            </div>
            <span className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-lg bg-ink-950/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-md">
              <Pencil className="h-3 w-3" /> Değiştir
            </span>
          </button>
        )}

        {/* Kaynak yükleme (moda göre etiket) */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-white/60">
            {mod === "olustur" ? "Kaynak görsel (opsiyonel)" : mod === "duzenle" ? "Düzenlenecek video" : "Hareketi kopyalanacak video"}
          </label>
          {kaynak ? (
            <div className="flex items-center gap-3 rounded-xl border border-cyan-glow/25 bg-cyan-glow/8 p-3">
              <div className="h-14 w-14 shrink-0 rounded-lg" style={{ background: onizlemeArka(kaynak) }} />
              <div className="min-w-0 flex-1"><div className="truncate text-xs font-medium">{kaynak}</div><div className="mt-0.5 text-[11px] text-emerald-400">✓ hazır</div></div>
              <button onClick={() => setKaynak(null)} className="text-xs text-white/50 hover:text-white">Değiştir</button>
            </div>
          ) : (
            <label className="flex h-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-white/15 text-center transition-colors hover:border-cyan-glow/40">
              <input type="file" accept={mod === "olustur" ? "image/*" : "video/*"} className="hidden" onChange={yukle(setKaynak, "Yüklendi ✓")} />
              <Upload className="h-5 w-5 text-cyan-glow" />
              <span className="text-xs text-white/60">Tıkla · Sürükle-bırak</span>
              <span className="text-[10px] text-white/35">{mod === "olustur" ? ".png .jpg .webp" : ".mp4 · 3–10 sn"}</span>
            </label>
          )}
        </div>

        {/* Create modunda: son kare (opsiyonel) + çok çekim */}
        {mod === "olustur" && (
          <>
            {!sonKare ? (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/12 py-2.5 text-xs text-white/55 transition-colors hover:border-cyan-glow/40 hover:text-white">
                <input type="file" accept="image/*" className="hidden" onChange={yukle(setSonKare, "Son kare eklendi ✓")} />
                <Upload className="h-3.5 w-3.5" /> Son kare ekle (opsiyonel)
              </label>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-white/12 px-3 py-2 text-xs">
                <Film className="h-3.5 w-3.5 text-cyan-glow" /> <span className="flex-1 truncate">{sonKare}</span>
                <button onClick={() => setSonKare(null)} className="text-white/40 hover:text-white">×</button>
              </div>
            )}
            <ToggleSatir ad="Çok çekimli" ipucu="Tek prompttan çok sahneli video" acik={cokCekim} onToggle={() => setCokCekim((v) => !v)} />
          </>
        )}
        {mod === "duzenle" && <ToggleSatir ad="Otomatik ayarlar" acik={otoAyar} onToggle={() => setOtoAyar((v) => !v)} />}

        {/* Prompt */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-white/60">Prompt</label>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 focus-within:border-cyan-glow/40">
            <ElementMentionInput
              deger={prompt}
              onDeger={onPrompt}
              cokSatir
              placeholder={mod === "hareket" ? "Karakteri ve sahneyi tanımla…  (@ ile element)" : "Videonu tanımla, örn: gün batımında sahilde koşan kişi…  (@ ile element)"}
              className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-white/30"
            />
          </div>
          {/* Higgsfield birebir: "Enhance on · Off · @Elements" — GERÇEK butonlar */}
          <div className="mt-1.5 flex flex-wrap gap-2 text-[11px]">
            <button onClick={() => setIyilestir((v) => !v)} title="Prompt'u AI ile zenginleştir"
              className={cn("flex items-center gap-1 rounded-full px-2.5 py-1.5",
                iyilestir ? "glass-cip-aktif text-cyan-glow" : "glass-cip text-white/60 hover:text-white")}>
              <Zap className="h-3 w-3" /> İyileştir {iyilestir ? "açık" : "kapalı"}
            </button>
            <button onClick={() => setSesli((v) => !v)} title="Videoda ses olsun mu"
              className={cn("flex items-center gap-1 rounded-full px-2.5 py-1.5",
                sesli ? "glass-cip-aktif text-cyan-glow" : "glass-cip text-white/60 hover:text-white")}>
              {sesli ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />} Ses {sesli ? "açık" : "kapalı"}
            </button>
            <button onClick={() => { onPrompt(prompt + (prompt.endsWith(" ") || !prompt ? "" : " ") + "@"); toast("@ ile element ekle — kimlik kütüphanenden seç"); }}
              title="Element ekle (@mention)"
              className="glass-cip flex items-center gap-1 rounded-full px-2.5 py-1.5 text-white/60 hover:text-white">
              <AtSign className="h-3 w-3" /> Element
            </button>
          </div>
        </div>

        {/* Model seçici */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-white/60">Model</label>
          <div className="relative">
            <button onClick={() => setModelMenu((v) => !v)}
              className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm hover:bg-white/6">
              <span className="flex items-center gap-2">{model.ad}
                {model.rozet && <span className="rounded bg-cyan-glow px-1.5 py-0.5 text-[9px] font-bold text-ink-950">{model.rozet.toUpperCase()}</span>}
              </span>
              <ChevronDown className={cn("h-4 w-4 text-white/40 transition-transform", modelMenu && "rotate-180")} />
            </button>
            {modelMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setModelMenu(false)} />
                <div className="menu-surface absolute left-0 right-0 top-11 z-50 max-h-80 overflow-y-auto rounded-xl p-1.5 shadow-2xl [scrollbar-width:thin]">
                  <div className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/35">Öne çıkan modeller</div>
                  {videoModelleri.map((m) => (
                    <button key={m.id} onClick={() => { setModelId(m.id); setModelMenu(false); }}
                      className={cn("flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/8", modelId === m.id && "bg-cyan-glow/8")}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-sm">{m.ad}
                          {m.rozet && <span className="rounded bg-cyan-glow px-1 py-0.5 text-[8px] font-bold text-ink-950">{m.rozet.toUpperCase()}</span>}
                          <span className="text-[10px] text-white/35">· {m.saglayici}</span>
                        </div>
                        {/* Yetenek çipleri — Higgsfield "4K · 4s-15s" muadili */}
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          {m.yetenekler.slice(0, 3).map((y) => (
                            <span key={y} className="rounded bg-white/8 px-1.5 py-0.5 text-[9px] font-medium text-white/60">{y}</span>
                          ))}
                          <span className="ml-auto flex items-center gap-0.5 text-[10px] font-medium text-cyan-glow"><Sparkles className="h-2.5 w-2.5" />{m.kredi}</span>
                        </div>
                      </div>
                      {modelId === m.id && <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-cyan-glow" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Süre · Çözünürlük · Oran — Higgsfield birebir: yan yana kompakt açılır pill'ler */}
        <div className="flex gap-2">
          <PillSecici ikon={Clock} deger={`${sure}sn`} secenekler={VIDEO_SURELER.map((s) => ({ id: String(s), ad: `${s}sn` }))}
            onSec={(v) => setSure(Number(v))} baslik="Süre" />
          <PillSecici ikon={Gem} deger={cozunurluk} secenekler={VIDEO_COZUNURLUKLER.map((c) => ({ id: c, ad: c }))}
            onSec={setCozunurluk} baslik="Kalite" />
          <PillSecici ikon={RectangleHorizontal} deger={VIDEO_ORANLAR.find((o) => o.id === oran)?.ad ?? oran}
            secenekler={VIDEO_ORANLAR.map((o) => ({ id: o.id, ad: o.ad }))} onSec={setOran} baslik="En-boy oranı" />
        </div>
      </div>

      {/* Footer: maliyet + Üret */}
      <div className="shrink-0 border-t border-white/8 p-3">
        <div className="mb-2 flex items-center justify-center gap-1.5 text-[11px] text-white/45">
          <span>{sure}sn · {cozunurluk}</span><span className="text-amber-glow">🪙 {model.kredi}</span>
        </div>
        <button onClick={uret}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-glow py-3 text-sm font-semibold text-ink-950 transition-transform hover:scale-[1.02] active:scale-[0.97]">
          <Sparkles className="h-4 w-4" /> Üret ✦{model.kredi}
        </button>
      </div>

    </div>
  );
}

/** Higgsfield birebir kompakt açılır pill (⏱ 4sn ˅ / ◇ 1080p ˅ / ▭ 16:9 ˅). */
function PillSecici({
  ikon: Ikon, deger, secenekler, onSec, baslik,
}: {
  ikon: typeof Clock; deger: string; secenekler: { id: string; ad: string }[]; onSec: (v: string) => void; baslik: string;
}) {
  const [acik, setAcik] = useState(false);
  return (
    <div className="relative flex-1">
      <button onClick={() => setAcik((v) => !v)} title={baslik}
        className={cn("flex w-full items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-medium transition-colors",
          acik ? "border-cyan-glow/40 bg-cyan-glow/8 text-cyan-glow" : "border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/8")}>
        <Ikon className="h-3.5 w-3.5 shrink-0 opacity-70" />
        {deger}
      </button>
      {acik && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAcik(false)} />
          <div className="menu-surface absolute bottom-full left-0 z-50 mb-1.5 w-full min-w-[110px] rounded-xl p-1.5">
            <p className="px-2 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/35">{baslik}</p>
            {secenekler.map((s) => (
              <button key={s.id} onClick={() => { onSec(s.id); setAcik(false); }}
                className={cn("flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-white/8",
                  s.ad === deger && "bg-white/6")}>
                {s.ad}
                {s.ad === deger && <Check className="h-3.5 w-3.5 text-cyan-glow" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ToggleSatir({ ad, ipucu, acik, onToggle }: { ad: string; ipucu?: string; acik: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} title={ipucu} className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm">
      <span className="text-white/75">{ad}</span>
      <span className={cn("relative h-5 w-9 rounded-full transition-colors", acik ? "bg-cyan-glow" : "bg-white/15")}>
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", acik ? "left-[18px]" : "left-0.5")} />
      </span>
    </button>
  );
}
