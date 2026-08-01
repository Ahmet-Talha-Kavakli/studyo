"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

/** Panoya GERÇEKTEN kopyalar (navigator.clipboard, yoksa execCommand yedeği). */
export async function panoyaKopyala(metin: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(metin);
      return true;
    }
  } catch { /* izin yoksa yedeğe düş */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = metin;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function KopyalaDugme({
  metin, etiket, sinif, kucuk,
}: { metin: string; etiket?: string; sinif?: string; kucuk?: boolean }) {
  const [kopyalandi, setKopyalandi] = useState(false);
  return (
    <button
      type="button"
      data-kopyala
      onClick={async () => {
        const ok = await panoyaKopyala(metin);
        if (!ok) return toast.error("Kopyalanamadı");
        setKopyalandi(true);
        toast.success(etiket ? `${etiket} kopyalandı` : "Panoya kopyalandı");
        setTimeout(() => setKopyalandi(false), 1600);
      }}
      aria-label={etiket ? `${etiket} kopyala` : "Kopyala"}
      className={cn(
        "hf-btn glass-cip inline-flex items-center gap-1.5 rounded-lg font-medium text-metin-2 hover:text-metin",
        kucuk ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-xs",
        sinif,
      )}
    >
      {kopyalandi ? <Check className="h-3.5 w-3.5 text-aksan" /> : <Copy className="h-3.5 w-3.5" />}
      {etiket && <span className="max-sm:hidden">{kopyalandi ? "Kopyalandı" : "Kopyala"}</span>}
    </button>
  );
}

/** Kod bloğu — satır numaralı, yatay kaydırmalı, kopyala düğmeli. */
export function KodBlok({
  kod, baslik, satirNo = true,
}: { kod: string; baslik?: ReactNode; satirNo?: boolean }) {
  const satirlar = kod.split("\n");
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0b0d0e]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
        <div className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-wider text-metin-3">
          {baslik ?? "Kod"}
        </div>
        <KopyalaDugme metin={kod} kucuk />
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-[1.7] [scrollbar-width:thin]">
        <code className="font-mono">
          {satirlar.map((s, i) => (
            <div key={i} className="flex">
              {satirNo && (
                <span className="mr-3 w-6 shrink-0 select-none text-right text-metin-3">{i + 1}</span>
              )}
              <span className="whitespace-pre text-metin-2">{s}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

/** Sayfa başlığı — Higgsfield Cloud'daki büyük başlık + alt açıklama. */
export function SayfaBaslik({
  baslik, ozet, sag,
}: { baslik: string; ozet?: string; sag?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-metin">{baslik}</h1>
        {ozet && <p className="mt-1 text-sm text-metin-2">{ozet}</p>}
      </div>
      {sag}
    </div>
  );
}

/** Metrik kartı — Genel Bakış / Kullanım üstündeki büyük sayı kutuları. */
export function MetrikKart({
  deger, etiket, ikon, vurgulu, alt,
}: { deger: string; etiket: string; ikon?: ReactNode; vurgulu?: boolean; alt?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        vurgulu ? "border-aksan/30 bg-aksan/[0.06]" : "border-white/[0.06] bg-yuzey",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-2xl font-bold text-metin">{deger}</div>
          <div className="mt-1 text-xs text-metin-2">{etiket}</div>
          {alt && <div className="mt-0.5 text-[11px] text-metin-3">{alt}</div>}
        </div>
        {ikon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl glass-ikon">
            {ikon}
          </span>
        )}
      </div>
    </div>
  );
}

/** Boş durum kutusu. */
export function BosDurum({
  ikon, baslik, ozet, aksiyon,
}: { ikon: ReactNode; baslik: string; ozet?: string; aksiyon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] py-14 text-center">
      <span className="text-metin-3">{ikon}</span>
      <p className="mt-3 text-sm font-medium text-metin-2">{baslik}</p>
      {ozet && <p className="mt-1 text-xs text-metin-3">{ozet}</p>}
      {aksiyon && <div className="mt-4">{aksiyon}</div>}
    </div>
  );
}
