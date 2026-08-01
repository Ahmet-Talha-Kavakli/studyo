"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown, ChevronRight, Check, Sparkles, Circle, Hand, X, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   SUPERCOMPUTER — sohbet ekranının tekrar eden parçaları.
   Referans: higg-supercomputer/ (00.17.x, 00.23.x, 00.26.x, 00.27.x)

   TİPOGRAFİ KURALI (referansta çok net): asistan düz metni SERİF,
   arayüzün geri kalanı SANS. Beceri kimlikleri serif içinde monospace.
   ============================================================ */

/* ── 1. Durum satırı — "Yanıtını bekliyorum" / "27sn'dir çalışıyor" ── */
export function SCDurumSatiri({
  ikon: Ikon = Circle, metin, ek, lime = true,
}: { ikon?: typeof Circle; metin: string; ek?: string; lime?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 py-1">
      <span className={cn(
        "glass-ikon flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
        lime && "glass-ikon-lime",
      )}>
        <Ikon className="h-3.5 w-3.5" />
      </span>
      <span className={cn("text-[16px] font-medium", lime ? "text-[var(--sc-aksan)]" : "text-[var(--sc-metin)]")}>
        {metin}
      </span>
      {ek && (
        <>
          <span className="text-[var(--sc-metin-3)]">·</span>
          <span className="flex items-center gap-1.5 text-[14px] text-[var(--sc-metin-3)]">
            <Sparkles className="h-3.5 w-3.5" /> {ek}
          </span>
        </>
      )}
    </div>
  );
}

/* ── 2. Zaman çizelgesi adımı — sol ray + ikon + etiket + gri argüman ── */
export function SCAdim({
  ikon: Ikon, etiket, arg, aktif, acilir, children,
}: {
  ikon: typeof Circle; etiket: string; arg?: string; aktif?: boolean;
  acilir?: boolean; children?: React.ReactNode;
}) {
  const [acik, setAcik] = useState(false);
  return (
    <div className="relative pl-6">
      {/* dikey ray */}
      <span className="absolute left-[9px] top-0 h-full w-px bg-[var(--sc-cip)]" aria-hidden />
      <button
        onClick={() => acilir && setAcik((v) => !v)}
        disabled={!acilir}
        className={cn(
          "relative -ml-6 flex w-full items-center gap-2 rounded-lg py-1.5 pl-6 pr-2 text-left transition-colors",
          acilir && "hover:bg-[var(--sc-cip-2)]",
        )}
      >
        <span className={cn(
          "absolute left-0 flex h-[18px] w-[18px] items-center justify-center rounded-full",
          aktif ? "bg-[var(--sc-aksan)] text-[var(--sc-aksan-metin)]" : "bg-[var(--sc-yukselti)] text-[var(--sc-metin-3)]",
        )}>
          <Ikon className="h-2.5 w-2.5" />
        </span>
        <span className={cn("text-[14.5px]", aktif ? "text-[var(--sc-aksan)]" : "text-[var(--sc-metin-3)]")}>
          {etiket}
        </span>
        {arg && <span className="truncate text-[14px] text-[var(--sc-metin-3)]/70">{arg}</span>}
        {acilir && (acik
          ? <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 text-[var(--sc-metin-3)]" />
          : <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 text-[var(--sc-metin-3)]" />)}
      </button>
      <AnimatePresence initial={false}>
        {acik && children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Akıl yürütme metni GRİ SANS — asistanın serif cevabından bilinçli olarak ayrı. */}
            <div className="py-2 pr-4 text-[14px] leading-relaxed text-[var(--sc-metin-3)]">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── 3. Parametre çipi satırı — "Foundation position: TOP-LEFT" ── */
export function SCParamCipler({ paramlar }: { paramlar: { ad: string; deger: string }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5 py-2">
      {paramlar.map((p) => (
        <span key={p.ad} className="glass-cip rounded-lg px-2.5 py-1 text-[12.5px]">
          <span className="text-[var(--sc-metin-3)]">{p.ad}: </span>
          <span className="text-[var(--sc-metin)]">{p.deger}</span>
        </span>
      ))}
    </div>
  );
}

/* ── 4. macOS pencere çerçevesi — kod görüntüleyici + çalışan kartı ── */
export function SCPencere({ baslik, sag, children }: { baslik?: string; sag?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="hf-kart overflow-hidden bg-[var(--sc-kart)]">
      <div className="flex items-center gap-2 border-b border-[var(--sc-kenar)] px-3.5 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </span>
        {baslik && <span className="ml-1 truncate text-[13px] text-[var(--sc-metin-2)]">{baslik}</span>}
        {sag && <span className="ml-auto">{sag}</span>}
      </div>
      {children}
    </div>
  );
}

/* ── 5. İlerleme çipi — donut 2/6 → tamamlanınca ✓ 7/7 ── */
export function SCIlerlemeCipi({ tamam, toplam }: { tamam: number; toplam: number }) {
  const bitti = tamam >= toplam;
  const oran = toplam > 0 ? tamam / toplam : 0;
  const R = 7, C = 2 * Math.PI * R;
  return (
    <span className="flex items-center gap-2">
      {bitti ? (
        <Check className="h-4 w-4" style={{ color: "var(--sc-aksan)" }} strokeWidth={3} />
      ) : (
        <svg viewBox="0 0 18 18" className="h-4 w-4 -rotate-90" aria-hidden>
          <circle cx="9" cy="9" r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" />
          <circle cx="9" cy="9" r={R} fill="none" stroke="var(--sc-aksan)" strokeWidth="2.5"
            strokeDasharray={C} strokeDashoffset={C * (1 - oran)} strokeLinecap="round" />
        </svg>
      )}
      <span className="text-[14.5px] tabular-nums text-[var(--sc-metin)]">{tamam}/{toplam}</span>
    </span>
  );
}

/* ── 6. Kredi uyarı bandı — amber nokta + Yükle + kapat ── */
export function SCKrediBandi({ yuzde = 95, onKapat, onYukle }: { yuzde?: number; onKapat: () => void; onYukle: () => void }) {
  return (
    /* Referans: h≈56px · var(--sc-kart) · sarı dolu nokta · beyaz "Yükle" pill · ✕ */
    <div className="mb-2 flex h-[56px] items-center gap-3 rounded-[14px] border border-[var(--sc-kenar)] bg-[var(--sc-kart)] px-[18px]">
      <span className="h-4 w-4 shrink-0 rounded-full bg-[#f5c518]" aria-hidden />
      <span className="min-w-0 flex-1 text-[14.5px]">
        <span className="font-medium text-[var(--sc-metin)]">Kredin azalıyor</span>
        <span className="ml-2 text-[var(--sc-metin-3)]">%{yuzde}&apos;inden fazlası kullanıldı</span>
      </span>
      <button onClick={onYukle}
        className="shrink-0 rounded-full bg-white px-[22px] py-2.5 text-[14px] font-medium text-[var(--sc-kart)] transition-all hover:brightness-95">
        Yükle
      </button>
      <button onClick={onKapat} className="shrink-0 text-[var(--sc-metin-3)] transition-colors hover:text-[var(--sc-metin)]" aria-label="Kapat">
        <X className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
}

/* ── 7. Onay modu açılır menüsü — Otomatik / Onay iste ── */
export const SC_ONAY_MODLARI = [
  { id: "oto", ad: "Onaysız otomatik çalıştır", ikon: Circle },
  { id: "onay", ad: "Üretimden önce onay iste", ikon: Hand },
] as const;
export type SCOnayModu = (typeof SC_ONAY_MODLARI)[number]["id"];

export function SCOnayMenu({ deger, onSec }: { deger: SCOnayModu; onSec: (m: SCOnayModu) => void }) {
  return (
    <div className="menu-surface w-[300px] rounded-xl p-1.5">
      {SC_ONAY_MODLARI.map((m) => (
        <button key={m.id} onClick={() => onSec(m.id)}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[14px] text-[var(--sc-metin)] transition-colors hover:bg-[var(--sc-cip-2)]">
          <m.ikon className="h-4 w-4 shrink-0 text-[var(--sc-metin-3)]" />
          <span className="flex-1">{m.ad}</span>
          {deger === m.id && <Check className="h-4 w-4 shrink-0" style={{ color: "var(--sc-aksan)" }} />}
        </button>
      ))}
    </div>
  );
}

/* ── 8. Çalışma süresi etiketi — "8dk 21sn çalıştı" ── */
export function SCSureEtiketi({ saniye, calisiyor }: { saniye: number; calisiyor?: boolean }) {
  const dk = Math.floor(saniye / 60), sn = saniye % 60;
  const metin = dk > 0 ? `${dk}dk ${sn}sn` : `${sn}sn`;
  return (
    <span className="flex items-center gap-1.5 text-[14px] text-[var(--sc-metin-3)]">
      <Clock className="h-3.5 w-3.5" />
      {calisiyor ? `${metin}dir çalışıyor` : `${metin} çalıştı`}
    </span>
  );
}
