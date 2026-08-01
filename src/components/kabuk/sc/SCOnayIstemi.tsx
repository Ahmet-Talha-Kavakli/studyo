"use client";

import { motion } from "framer-motion";
import {
  ShieldQuestion, Check, X, Infinity as Sonsuz, Globe, Code2, FilePlus2,
  SquareTerminal, Sparkles, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   ONAY İSTEMİ — Claude'un araç izni kartı.

   Claude bir araç çağırmadan önce izin ister ve kart şunları gösterir:
     · hangi ARAÇ çağrılıyor (ikon + ad)
     · ne yapacağı (tek satır, somut)
     · isteğe bağlı parametre önizlemesi (monospace)
     · üç seçenek: Bir kez izin ver · Her zaman izin ver · Reddet

   Önceki kart Higgsfield'ın "üretimi onayla" kutusuydu: kredi çipleri +
   tek "Onayla" düğmesi. Claude'un izin modeli farklıdır — kalıcı izin
   (allowlist) ve reddetme ayrı eylemlerdir.
   ============================================================ */

export type OnayAraci = "site" | "gorsel" | "komut" | "dosya" | "web";

const ARAC_META: Record<OnayAraci, { ad: string; ikon: LucideIcon }> = {
  site: { ad: "site_uretici", ikon: Code2 },
  gorsel: { ad: "gorsel_uretici", ikon: Sparkles },
  komut: { ad: "komut_calistir", ikon: SquareTerminal },
  dosya: { ad: "dosya_yaz", ikon: FilePlus2 },
  web: { ad: "web_ara", ikon: Globe },
};

export function SCOnayIstemi({
  arac, aciklama, parametre, kredi, onBirKez, onHerZaman, onReddet,
}: {
  arac: OnayAraci;
  /** Ne yapacağı — somut tek cümle. */
  aciklama: string;
  /** Araç parametresi önizlemesi (istem, komut, dosya yolu…). */
  parametre?: string;
  /** Tahmini maliyet — Claude'da yok ama bizde kredi gerçek. */
  kredi?: number;
  onBirKez: () => void;
  onHerZaman: () => void;
  onReddet: () => void;
}) {
  const meta = ARAC_META[arac];
  const Ikon = meta.ikon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      role="group"
      aria-label="Araç izni isteniyor"
      className="overflow-hidden rounded-xl border border-[var(--sc-aksan)]/35 bg-[var(--sc-kart)]">
      {/* Başlık — hangi araç */}
      <div className="flex items-center gap-2.5 border-b border-[var(--sc-kenar)] px-4 py-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--sc-aksan-zayif)] text-[var(--sc-aksan)]">
          <ShieldQuestion className="h-[15px] w-[15px]" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-medium text-[var(--sc-metin)]">İzin isteniyor</span>
          <span className="flex items-center gap-1.5 text-[12px] text-[var(--sc-metin-3)]">
            <Ikon className="h-3 w-3 shrink-0" strokeWidth={2} />
            <code className="font-mono">{meta.ad}</code>
          </span>
        </span>
        {kredi != null && (
          <span className="shrink-0 rounded-md bg-[var(--sc-cip)] px-2 py-0.5 text-[11.5px] tabular-nums text-[var(--sc-metin-2)]">
            ~{kredi} kredi
          </span>
        )}
      </div>

      {/* Ne yapacağı */}
      <div className="space-y-2.5 px-4 py-3.5">
        <p className="text-[14px] leading-relaxed text-[var(--sc-metin-2)]">{aciklama}</p>
        {parametre && (
          <pre className="max-h-[110px] overflow-auto rounded-lg border border-[var(--sc-kenar)] bg-[var(--sc-zemin)] px-3 py-2 font-mono text-[12px] leading-[1.55] text-[var(--sc-metin-3)] [scrollbar-width:thin]">
            {parametre}
          </pre>
        )}
      </div>

      {/* Üç seçenek — Claude'un izin modeli */}
      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--sc-kenar)] px-4 py-3">
        <button onClick={onBirKez}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-[var(--sc-aksan)] px-3.5 text-[13.5px] font-medium text-[var(--sc-aksan-metin)] transition-opacity hover:opacity-90">
          <Check className="h-4 w-4" strokeWidth={2.4} /> Bir kez izin ver
        </button>
        <button onClick={onHerZaman}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-[var(--sc-kenar)] bg-[var(--sc-kart)] px-3.5 text-[13.5px] text-[var(--sc-metin-2)] transition-colors hover:bg-[var(--sc-cip)] hover:text-[var(--sc-metin)]">
          <Sonsuz className="h-4 w-4" strokeWidth={2} /> Her zaman izin ver
        </button>
        <button onClick={onReddet}
          className={cn(
            "ml-auto flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13.5px] transition-colors",
            "text-[var(--sc-metin-3)] hover:bg-[var(--sc-promo)]/10 hover:text-[var(--sc-promo)]",
          )}>
          <X className="h-4 w-4" strokeWidth={2} /> Reddet
          <kbd className="ml-0.5 rounded bg-[var(--sc-cip)] px-1.5 text-[11px] text-[var(--sc-metin-3)]">ESC</kbd>
        </button>
      </div>
    </motion.div>
  );
}
