"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   SC AYAR PARÇALARI — Claude'un ayar ekranı dili.

   Claude'un ayarları kart ızgarası değil, KENARLIKLI PANELLER içinde satır
   listeleridir: solda ad + gri açıklama, sağda kontrol. Bu dosya o dili
   tek yerde tanımlar ki tüm ayar sekmeleri (hafıza, çalışanlar, beceriler,
   bağlayıcılar) birebir aynı görünsün.
   ============================================================ */

/** Ayar bölümü — başlık + özet + kenarlıklı panel. */
export function AyarBolum({
  baslik, ozet, sagUst, children, panelsiz,
}: {
  baslik: string;
  ozet?: string;
  /** Başlığın sağındaki eylem (ör. "Tümünü sil"). */
  sagUst?: React.ReactNode;
  children: React.ReactNode;
  /** Panel çerçevesi olmadan (içerik kendi kartlarını çiziyorsa). */
  panelsiz?: boolean;
}) {
  /* Başlık ve özet her zaman kartın üst şeridinde durur (havada yazı yok). */
  return (
    <section className="overflow-hidden rounded-[20px] bg-[var(--sc-kart)] ring-1 ring-inset ring-white/[0.07] [&+&]:mt-4">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-[var(--sc-metin)]">{baslik}</h2>
          {ozet && <p className="mt-0.5 text-[12.5px] leading-snug text-[var(--sc-metin-3)]">{ozet}</p>}
        </div>
        {sagUst && <div className="shrink-0">{sagUst}</div>}
      </div>
      {panelsiz ? <div className="p-3 sm:p-4">{children}</div> : children}
    </section>
  );
}

/** Panel içi tek ayar satırı: solda ad+özet, sağda kontrol. */
export function AyarSatir({
  ad, ozet, children, dikey,
}: {
  ad: string; ozet?: string; children?: React.ReactNode;
  /** Kontrol geniş ise (select/textarea) alta alınır. */
  dikey?: boolean;
}) {
  return (
    <div className={cn(
      "border-b border-white/[0.06] px-4 py-3.5 last:border-b-0 sm:px-5",
      dikey ? "space-y-2.5" : "flex items-center justify-between gap-4",
    )}>
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-[var(--sc-metin)]">{ad}</p>
        {ozet && <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--sc-metin-3)]">{ozet}</p>}
      </div>
      {children && <div className={cn(dikey ? "" : "shrink-0")}>{children}</div>}
    </div>
  );
}

/**
 * Anahtar (toggle) — Claude'un ayar anahtarı.
 * Erişilebilirlik: gerçek `role="switch"` + `aria-checked`; sadece renkle değil
 * konumla da durum belli olur.
 */
export function Anahtar({
  acik, onDegis, etiket, kucuk,
}: { acik: boolean; onDegis: (v: boolean) => void; etiket: string; kucuk?: boolean }) {
  /* Ölçüler: ray (kapsül) + topuz. Topuz `left:0` çıpalı ve yalnızca
     translate-x kullanır — daha önce `top-1/2 -translate-y-1/2` ile birlikte
     yazıldığında ikisi de tek `transform` özelliğini ezip topuz kapsülden
     taşıyordu; artık dikey ortalama flex ile yapılır. */
  const g = kucuk
    ? { ray: "h-[20px] w-[34px]", t: "h-[15px] w-[15px]", x: acik ? "translate-x-[16.5px]" : "translate-x-[2.5px]" }
    : { ray: "h-[24px] w-[42px]", t: "h-[18px] w-[18px]", x: acik ? "translate-x-[21px]" : "translate-x-[3px]" };
  return (
    /* DOKUNMA HEDEFİ: buton en az 24px yüksekliğinde; görsel ray içindeki
       span'de çizilir. Küçük varyant 20px görünür ama tıklanabilir alan 24px
       kalır (WCAG 2.2 §2.5.8). Önce ::after ile denenmişti — pseudo-element
       tıklama alanını büyütmediği için çalışmıyordu. */
    <button
      type="button"
      role="switch"
      aria-checked={acik}
      aria-label={etiket}
      onClick={() => onDegis(!acik)}
      className="flex min-h-[24px] shrink-0 items-center justify-center">
      <span className={cn(
        "relative flex items-center rounded-full transition-colors duration-150",
        g.ray,
        acik ? "bg-white" : "bg-[var(--sc-cip-2)]",
      )}>
        <span className={cn(
          "rounded-full transition-transform duration-150",
          acik ? "bg-[#101012]" : "bg-white",
          g.t, g.x,
        )} />
      </span>
    </button>
  );
}

/** Panel içi boş durum — ikon + başlık + özet (+ isteğe bağlı eylem). */
export function BosDurum({
  ikon: Ikon, baslik, ozet, eylem,
}: { ikon: LucideIcon; baslik: string; ozet?: string; eylem?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-6 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.085] text-[var(--sc-metin)]">
        <Ikon className="h-[21px] w-[21px]" strokeWidth={1.7} />
      </span>
      <div>
        <p className="text-[14px] font-medium text-[var(--sc-metin)]">{baslik}</p>
        {ozet && <p className="mx-auto mt-1 max-w-[380px] text-[13px] leading-relaxed text-[var(--sc-metin-3)]">{ozet}</p>}
      </div>
      {eylem && <div className="mt-1">{eylem}</div>}
    </div>
  );
}

/** Birincil buton — Claude'un dolu aksan butonu. */
export function AyarButon({
  children, onClick, ikincil, tehlike, disabled, tam,
}: {
  children: React.ReactNode; onClick?: () => void;
  ikincil?: boolean; tehlike?: boolean; disabled?: boolean; tam?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-9 items-center justify-center gap-1.5 rounded-full px-4 text-[13.5px] font-semibold transition active:scale-[0.97] disabled:opacity-40",
        tam && "w-full",
        tehlike
          ? "text-[var(--sc-promo)] hover:bg-[var(--sc-promo)]/10"
          : ikincil
            ? "bg-white/[0.085] text-[var(--sc-metin)] ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.12]"
            : "bg-white text-[#0b0b0c] hover:bg-white/90",
      )}>
      {children}
    </button>
  );
}
