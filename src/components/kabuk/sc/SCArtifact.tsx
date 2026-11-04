"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Code2, Eye, Maximize2, Download, RefreshCw, Copy, ExternalLink,
  Globe, Gamepad2, LayoutDashboard, Image as ImageIkon, FileText,
  Smartphone, Tablet, Monitor, type LucideIcon,
} from "lucide-react";
import { kopyala } from "@/lib/gercekEylem";
import { cn } from "@/lib/utils";

/* ============================================================
   ARTIFACT PANELİ — Claude'un sağdaki canlı çıktı görüntüleyicisi.

   Claude bir şey ürettiğinde (site, oyun, panel, doküman) onu sohbetin
   İÇİNDE değil sağdaki ayrı panelde canlı gösterir; üstte Önizleme/Kod
   sekmeleri, tam ekran, indir ve yenile eylemleri bulunur.

   Buradaki önizleme GERÇEK: üretilen HTML bir sandbox iframe'e yazılır
   (srcDoc), yani site/oyun panelde çalışır durumda görünür.
   ============================================================ */

export type ArtifactTur = "site" | "oyun" | "panel" | "gorsel" | "belge";

export interface ArtifactVeri {
  id: string;
  ad: string;
  tur: ArtifactTur;
  /** Çalıştırılabilir HTML (site/oyun/panel). */
  html?: string;
  /** Görsel/medya çıktısı. */
  url?: string | null;
  /** Yayın adresi görünümü (gerçek bir alan değil, üretim etiketi). */
  alan?: string;
}

const TUR_IKON: Record<ArtifactTur, LucideIcon> = {
  site: Globe, oyun: Gamepad2, panel: LayoutDashboard, gorsel: ImageIkon, belge: FileText,
};
const TUR_AD: Record<ArtifactTur, string> = {
  site: "Web sitesi", oyun: "Oyun", panel: "Panel", gorsel: "Görsel", belge: "Belge",
};

function ArtifactAraclar({
  onTamEkran, onIndir, onYenile, onKopyala,
}: { onTamEkran?: () => void; onIndir?: () => void; onYenile?: () => void; onKopyala?: () => void }) {
  const btn = "flex h-7 w-7 items-center justify-center rounded-md text-[var(--sc-metin-3)] transition-colors hover:bg-[var(--sc-cip)] hover:text-[var(--sc-metin)]";
  return (
    <div className="flex items-center gap-0.5">
      {onYenile && (
        <button onClick={onYenile} aria-label="Yenile" title="Yenile" className={btn}>
          <RefreshCw className="h-[15px] w-[15px]" strokeWidth={1.9} />
        </button>
      )}
      {onKopyala && (
        <button onClick={onKopyala} aria-label="Kodu kopyala" title="Kodu kopyala" className={btn}>
          <Copy className="h-[15px] w-[15px]" strokeWidth={1.9} />
        </button>
      )}
      {onIndir && (
        <button onClick={onIndir} aria-label="İndir" title="İndir" className={btn}>
          <Download className="h-[15px] w-[15px]" strokeWidth={1.9} />
        </button>
      )}
      {onTamEkran && (
        <button onClick={onTamEkran} aria-label="Tam ekran" title="Tam ekran" className={btn}>
          <Maximize2 className="h-[15px] w-[15px]" strokeWidth={1.9} />
        </button>
      )}
    </div>
  );
}

/** Cihaz genişlikleri — Claude'un duyarlılık önizlemesi. */
const CIHAZ: { id: "mobil" | "tablet" | "masaustu"; ad: string; px: number | null; ikon: LucideIcon }[] = [
  { id: "mobil", ad: "Mobil (390px)", px: 390, ikon: Smartphone },
  { id: "tablet", ad: "Tablet (820px)", px: 820, ikon: Tablet },
  { id: "masaustu", ad: "Masaüstü", px: null, ikon: Monitor },
];

export function SCArtifact({
  veri, onTamEkran, onIndir,
}: { veri: ArtifactVeri; onTamEkran?: () => void; onIndir?: () => void }) {
  const [sekme, setSekme] = useState<"onizleme" | "kod">("onizleme");
  /** Yenile: iframe'i yeniden kurmak için anahtar değiştirilir. */
  const [tazele, setTazele] = useState(0);
  /** Cihaz önizlemesi — Claude'daki duyarlılık denetimi. */
  const [cihaz, setCihaz] = useState<"mobil" | "tablet" | "masaustu">("masaustu");
  const Ikon = TUR_IKON[veri.tur];
  const kodVar = Boolean(veri.html);
  const aktifCihaz = CIHAZ.find((c) => c.id === cihaz)!;
  const satirSayisi = veri.html ? veri.html.split("\n").length : 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Başlık — çıktının kimliği */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-[var(--sc-kenar)] px-3.5 py-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--sc-cip)] text-[var(--sc-aksan)]">
          <Ikon className="h-[15px] w-[15px]" strokeWidth={1.9} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-medium text-[var(--sc-metin)]">{veri.ad}</span>
          <span className="block truncate text-[11.5px] text-[var(--sc-metin-3)]">
            {TUR_AD[veri.tur]}{kodVar ? ` · ${satirSayisi} satır` : ""}
          </span>
        </span>
        <ArtifactAraclar
          onTamEkran={onTamEkran}
          onIndir={onIndir}
          onYenile={kodVar ? () => setTazele((v) => v + 1) : undefined}
          onKopyala={kodVar ? () => void kopyala(veri.html!, "Kod kopyalandı") : undefined}
        />
      </div>

      {/* Önizleme / Kod sekmeleri + cihaz seçici — yalnızca çalıştırılabilir çıktıda */}
      {kodVar && (
        <div className="flex shrink-0 items-center gap-1 border-b border-[var(--sc-kenar)] px-3 py-2">
          {([["onizleme", "Önizleme", Eye], ["kod", "Kod", Code2]] as const).map(([id, ad, I]) => (
            <button key={id} onClick={() => setSekme(id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12.5px] transition-colors",
                sekme === id
                  ? "bg-[var(--sc-cip-2)] text-[var(--sc-metin)]"
                  : "text-[var(--sc-metin-3)] hover:bg-[var(--sc-cip)] hover:text-[var(--sc-metin)]",
              )}>
              <I className="h-[13px] w-[13px]" strokeWidth={2} /> {ad}
            </button>
          ))}

          {/* Cihaz genişliği — Claude üretilen sayfayı farklı kırılımlarda gösterir */}
          {sekme === "onizleme" && (
            <div className="ml-auto flex items-center gap-0.5">
              {CIHAZ.map((c) => (
                <button key={c.id} onClick={() => setCihaz(c.id)}
                  aria-label={c.ad} title={c.ad}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded transition-colors",
                    cihaz === c.id
                      ? "bg-[var(--sc-cip-2)] text-[var(--sc-metin)]"
                      : "text-[var(--sc-metin-3)] hover:bg-[var(--sc-cip)] hover:text-[var(--sc-metin)]",
                  )}>
                  <c.ikon className="h-[13px] w-[13px]" strokeWidth={2} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Gövde */}
      <div className="min-h-0 flex-1 overflow-hidden bg-[var(--sc-zemin)]">
        {kodVar && sekme === "onizleme" ? (
          /* GERÇEK çalışan önizleme — sandbox'lı iframe.
             allow-scripts: oyun/etkileşim çalışsın. allow-same-origin VERİLMEZ:
             üretilen kod sayfanın kendi kaynağına erişemesin.
             Cihaz seçiliyse iframe o genişlikte ortalanır (duyarlılık denetimi). */
          <div className={cn("h-full w-full", aktifCihaz.px && "flex justify-center overflow-auto p-3")}>
            <motion.iframe
              key={`${tazele}-${cihaz}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}
              srcDoc={veri.html}
              title={veri.ad}
              sandbox="allow-scripts allow-forms allow-popups"
              style={aktifCihaz.px ? { width: aktifCihaz.px, minWidth: aktifCihaz.px } : undefined}
              className={cn(
                "border-0 bg-white",
                aktifCihaz.px ? "h-full rounded-lg" : "h-full w-full",
              )}
            />
          </div>
        ) : kodVar ? (
          /* Kod görünümü — satır numaralı (Claude'un kod sekmesi gibi) */
          <div className="h-full overflow-auto [scrollbar-width:thin]">
            <table className="w-full border-collapse font-mono text-[11.5px] leading-[1.65]">
              <tbody>
                {veri.html!.split("\n").map((satir, i) => (
                  <tr key={i} className="hover:bg-white/[0.03]">
                    <td className="w-[44px] select-none border-r border-[var(--sc-kenar)] px-2 text-right align-top text-[var(--sc-metin-3)] opacity-60">
                      {i + 1}
                    </td>
                    <td className="whitespace-pre-wrap break-all px-3 text-[#c9d1d9]">{satir || " "}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : veri.url ? (
          <div className="flex h-full items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={veri.url} alt={veri.ad} className="max-h-full max-w-full rounded-lg object-contain" />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <Ikon className="h-7 w-7 text-[var(--sc-metin-3)]" strokeWidth={1.6} />
            <p className="text-[13px] text-[var(--sc-metin-3)]">Önizleme hazırlanıyor…</p>
          </div>
        )}
      </div>

      {/* Alt bilgi — Claude'da yayın adresi ve dış bağlantı */}
      {veri.alan && (
        <div className="flex shrink-0 items-center gap-2 border-t border-[var(--sc-kenar)] px-3.5 py-2">
          <Globe className="h-3.5 w-3.5 shrink-0 text-[var(--sc-metin-3)]" />
          <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-[var(--sc-metin-3)]">{veri.alan}</span>
          {onTamEkran && (
            <button onClick={onTamEkran}
              className="flex shrink-0 items-center gap-1 text-[12px] text-[var(--sc-aksan)] transition-opacity hover:opacity-80">
              Aç <ExternalLink className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
