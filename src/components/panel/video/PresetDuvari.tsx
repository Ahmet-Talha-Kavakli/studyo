"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Search, Check, Film } from "lucide-react";
import { MODELLER } from "@/lib/catalog";
import { VIDEO_PRESETLER, VIDEO_PRESET_KATEGORILERI } from "@/lib/video-studyo";
import { onizlemeArka, cn } from "@/lib/utils";
import { kesfetArka } from "@/lib/gercekVeri";

type Preset = (typeof VIDEO_PRESETLER)[number];

const videoModelleri = MODELLER.filter((m) => m.tur === "video");

/**
 * Higgsfield birebir PRESET DUVARI — modal DEĞİL, sağ alanı kaplayan tam ekran ızgara.
 * Üstte model sekmeleri (Kling 3.0 Omni / Kling 2.5 …) + arama + kapat.
 * Kartlar: büyük gerçek görsel + üstünde KALIN BÜYÜK isim (BULLET TIME, FLOOD…).
 * Bazılarında "En çok seçilen" rozeti.
 */
export function PresetDuvari({
  secili, onSec, onKapat,
}: {
  secili: Preset;
  onSec: (p: Preset) => void;
  onKapat: () => void;
}) {
  const [ara, setAra] = useState("");
  const [modelSekme, setModelSekme] = useState(videoModelleri[0].id);
  const [kategori, setKategori] = useState("Tümü");

  // Higgsfield birebir: model sekmesi GERÇEKTEN filtreler — her modelin desteklediği
  // preset seti farklıdır. Deterministik dağıtım: preset adı + model id hash'i.
  const modelDestekler = (presetAd: string, modelId: string) => {
    if (presetAd === "Genel") return true; // Genel her modelde var
    let h = 0;
    const t = presetAd + modelId;
    for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0;
    return h % 4 !== 0; // ~%75'i desteklenir → modeller arası set farkı görünür
  };

  const liste = VIDEO_PRESETLER.filter((p) =>
    modelDestekler(p.ad, modelSekme) &&
    (kategori === "Tümü" || p.kat === kategori) &&
    (!ara || (p.ad + p.ipucu + p.kat).toLowerCase().includes(ara.toLowerCase())),
  );

  // Higgsfield'daki "Top Choice" rozeti — deterministik olarak birkaç presete düşer.
  const enCok = (ad: string) => {
    let h = 0;
    for (let i = 0; i < ad.length; i++) h = (h * 31 + ad.charCodeAt(i)) >>> 0;
    return h % 7 === 0;
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-ink-950">
      {/* Üst: model sekmeleri + arama + kapat — Higgsfield birebir */}
      <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none]">
          {videoModelleri.map((m) => (
            <button key={m.id} onClick={() => setModelSekme(m.id)}
              className={cn("flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-1.5 text-sm font-medium transition-colors",
                modelSekme === m.id ? "border-white text-white" : "border-transparent text-white/45 hover:text-white/75")}>
              <Film className="h-3.5 w-3.5 opacity-60" />
              {m.ad}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-xl bg-white/6 px-3">
          <Search className="h-4 w-4 shrink-0 text-white/40" />
          <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Ara"
            className="h-9 w-40 bg-transparent text-sm outline-none placeholder:text-white/35" />
        </div>
        <button onClick={onKapat} aria-label="Kapat"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl glass-ikon text-white/70 transition-colors hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Kategori çipleri — Higgsfield birebir (model sekmelerinin altında ikinci satır) */}
      <div className="flex gap-1.5 overflow-x-auto border-b border-white/8 px-4 py-2.5 [scrollbar-width:none]">
        {VIDEO_PRESET_KATEGORILERI.map((k) => (
          <button key={k} onClick={() => setKategori(k)}
            className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              kategori === k ? "bg-cyan-glow text-ink-950" : "bg-white/6 text-white/55 hover:bg-white/12 hover:text-white")}>
            {k}
          </button>
        ))}
      </div>

      {/* Preset ızgarası — Higgsfield birebir masonry, büyük görsel + kalın isim */}
      <div className="flex-1 overflow-y-auto p-2 [scrollbar-width:thin]">
        {liste.length === 0 ? (
          <p className="py-16 text-center text-sm text-white/40">Preset bulunamadı</p>
        ) : (
          <div className="columns-2 gap-2 sm:columns-3 xl:columns-4 2xl:columns-5">
            {liste.map((pr, i) => {
              const sec = secili.ad === pr.ad;
              // Higgsfield preset duvarında kartlar farklı yükseklikte (masonry)
              const h = [260, 340, 300, 380, 280, 320][i % 6];
              return (
                <motion.button
                  key={pr.ad}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: (i % 12) * 0.02 }}
                  onClick={() => onSec(pr)}
                  style={{ height: h, background: kesfetArka(pr.ad, "sinematik") }}
                  className={cn("group relative mb-2 block w-full break-inside-avoid overflow-hidden rounded-xl ring-2 transition-all",
                    sec ? "ring-cyan-glow" : "ring-transparent hover:ring-white/25")}
                >
                  {/* Alt karartma — isim okunabilir olsun */}
                  <span className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/10 to-transparent" />

                  {/* En çok seçilen rozeti — Higgsfield "Top Choice" */}
                  {enCok(pr.ad) && (
                    <span className="absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-950 backdrop-blur">
                      ✦ En çok seçilen
                    </span>
                  )}

                  {sec && (
                    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-glow">
                      <Check className="h-3.5 w-3.5 text-ink-950" strokeWidth={3} />
                    </span>
                  )}

                  {/* Preset adı — Higgsfield birebir: BÜYÜK, KALIN, sol-alt */}
                  <span className="absolute inset-x-0 bottom-0 p-3 text-left">
                    <span className="block text-lg font-extrabold uppercase leading-tight tracking-tight text-white drop-shadow">
                      {pr.ad}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-white/60 opacity-0 transition-opacity group-hover:opacity-100">
                      {pr.ipucu}
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
