"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bulut veri bölümlerinin (Ortamlar, Yedekler, Kuyruk, Odalar) ortak küçük parçaları. Seçim beyaz halkayla gösterilir
 * (tik yok); hazır seçenek listelerinin sonunda her zaman "Özel" vardır.
 */

export const boyut = (b: number) => (b < 1024 ? `${b} B` : b < 1024 ** 2 ? `${(b / 1024).toLocaleString("tr-TR", { maximumFractionDigits: 0 })} KB` : b < 1024 ** 3 ? `${(b / 1024 ** 2).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} MB` : `${(b / 1024 ** 3).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} GB`);
export const tarihSaat = (z: number) => new Date(z).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
export const sayiYaz = (n: number) => n.toLocaleString("tr-TR");

/** Düğme: birincil (beyaz), ikincil (yarı saydam), tehlikeli (gül). */
export function Dugme({ tur = "ikincil", kucuk, yukleniyor, className, children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { tur?: "birincil" | "ikincil" | "tehlike"; kucuk?: boolean; yukleniyor?: boolean }) {
  return (
    <button type="button" {...p} disabled={p.disabled || yukleniyor} className={cn("inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full font-medium transition-colors disabled:opacity-45", kucuk ? "h-8 px-3 text-[12.5px]" : "h-9 px-3.5 text-[13px]",
      tur === "birincil" ? "bg-white font-semibold text-black enabled:hover:bg-white/90" : tur === "tehlike" ? "bg-rose-500/[0.14] text-rose-100 enabled:hover:bg-rose-500/[0.22]" : "bg-white/[0.08] text-white enabled:hover:bg-white/[0.13]", className)}>
      {yukleniyor && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{children}
    </button>
  );
}

/** İki adımlı onay düğmesi: ilk tıklamada onay metnine döner (4 sn), ikincide çalışır. Açılır pencere kullanılmaz. */
export function OnayDugme({ onay, calistir, children, ...p }: Omit<React.ComponentProps<typeof Dugme>, "onClick"> & { onay: string; calistir: () => void }) {
  const [bekliyor, setBekliyor] = useState(false);
  return (
    <Dugme {...p} tur={bekliyor ? "tehlike" : p.tur} onClick={() => { if (bekliyor) { setBekliyor(false); calistir(); } else { setBekliyor(true); setTimeout(() => setBekliyor(false), 4000); } }}>
      {bekliyor ? onay : children}
    </Dugme>
  );
}

/** Seçim halkası: seçiliyse beyaz halka içinde dolu nokta (tik yok). */
export function SecimHalka({ secili, degis, etiket, yarim }: { secili: boolean; degis: () => void; etiket: string; yarim?: boolean }) {
  return (
    <button type="button" role="checkbox" aria-checked={yarim ? "mixed" : secili} aria-label={etiket} onClick={(e) => { e.stopPropagation(); degis(); }}
      className={cn("flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ring-1 ring-inset transition-colors", secili || yarim ? "ring-2 ring-white" : "ring-white/30 hover:ring-white/60")}>
      {secili && <span className="h-2 w-2 rounded-full bg-white" />}{!secili && yarim && <span className="h-0.5 w-2 rounded-full bg-white" />}
    </button>
  );
}

/** Seçilebilir hap (beyaz halka seçim). */
export function SecHap({ secili, onClick, children, kapali }: { secili: boolean; onClick: () => void; children: React.ReactNode; kapali?: boolean }) {
  return (
    <button type="button" disabled={kapali} onClick={onClick} aria-pressed={secili} className={cn("inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] transition-colors disabled:opacity-35", secili ? "bg-white/[0.08] text-white ring-2 ring-inset ring-white" : "bg-white/[0.05] text-white/65 ring-1 ring-inset ring-white/[0.08] enabled:hover:bg-white/[0.08] enabled:hover:text-white")}>
      {children}
    </button>
  );
}

/**
 * Hazır değerler + "Özel" (sayı girişi). deger hazırlardan biri değilse "Özel" seçili görünür.
 */
export function HazirSecim({ deger, set, l, birim, en = 1, cok = 100000 }: { deger: number; set: (n: number) => void; l: { d: number; ad: string }[]; birim?: string; en?: number; cok?: number }) {
  const hazir = l.some((x) => x.d === deger);
  const [ozel, setOzel] = useState(!hazir);
  const [metin, setMetin] = useState(String(deger));
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {l.map((x) => <SecHap key={x.d} secili={!ozel && deger === x.d} onClick={() => { setOzel(false); set(x.d); }}>{x.ad}</SecHap>)}
      <SecHap secili={ozel} onClick={() => { setOzel(true); setMetin(String(deger)); }}>Özel</SecHap>
      {ozel && (
        <label className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.05] pl-3 pr-2 text-[12.5px] text-white/60 ring-1 ring-inset ring-white/[0.1]">
          <input value={metin} inputMode="numeric" onChange={(e) => { setMetin(e.target.value.replace(/[^\d]/g, "")); const n = Number(e.target.value.replace(/[^\d]/g, "")); if (n >= en && n <= cok) set(n); }} className="w-14 bg-transparent text-white outline-none" aria-label="Özel değer" />
          {birim}
        </label>
      )}
    </div>
  );
}

export function Rozet({ ton = "notr", children }: { ton?: "notr" | "imza" | "uyari" | "tehlike" | "iyi"; children: React.ReactNode }) {
  return <span className={cn("inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium", ton === "imza" ? "bg-[#55d6fd]/[0.12] text-[#8be6ff]" : ton === "uyari" ? "bg-amber-400/[0.12] text-amber-200" : ton === "tehlike" ? "bg-rose-500/[0.14] text-rose-200" : ton === "iyi" ? "bg-emerald-400/[0.1] text-emerald-200" : "bg-white/[0.07] text-white/60")}>{children}</span>;
}

/** Küçük sayı kutusu. */
export function Olcu({ ad, deger, alt, ton }: { ad: string; deger: React.ReactNode; alt?: string; ton?: "uyari" | "tehlike" | "imza" }) {
  return (
    <div className="min-w-0 rounded-[16px] bg-[#121315] p-3.5 ring-1 ring-inset ring-white/[0.07]">
      <p className={cn("truncate text-[19px] font-semibold tabular-nums", ton === "tehlike" ? "text-rose-200" : ton === "uyari" ? "text-amber-200" : ton === "imza" ? "text-[#8be6ff]" : "text-white")}>{deger}</p>
      <p className="truncate text-[12px] text-white/45">{ad}</p>
      {alt && <p className="mt-0.5 truncate text-[11.5px] text-white/35">{alt}</p>}
    </div>
  );
}

/** Hata ya da bilgi satırı. */
export function Uyari({ ton = "tehlike", children }: { ton?: "tehlike" | "uyari" | "bilgi"; children: React.ReactNode }) {
  return <p className={cn("rounded-[12px] px-3 py-2 text-[12.5px] leading-relaxed ring-1 ring-inset", ton === "tehlike" ? "bg-rose-500/[0.07] text-rose-200 ring-rose-300/10" : ton === "uyari" ? "bg-amber-400/[0.07] text-amber-100/90 ring-amber-300/10" : "bg-white/[0.04] text-white/65 ring-white/[0.07]")}>{children}</p>;
}

/** Kopyalanabilir kod bloğu. */
export function KodBlok({ kod }: { kod: string }) {
  const [oldu, setOldu] = useState(false);
  return (
    <div className="relative">
      <pre className="max-h-[320px] overflow-auto rounded-[14px] bg-black/40 p-3.5 pr-20 font-mono text-[12px] leading-relaxed text-white/80 ring-1 ring-inset ring-white/[0.07] [scrollbar-width:thin]">{kod}</pre>
      <button type="button" onClick={() => { navigator.clipboard?.writeText(kod).then(() => { setOldu(true); setTimeout(() => setOldu(false), 1400); }).catch(() => {}); }} className="absolute right-2 top-2 inline-flex h-7 items-center rounded-full bg-white/[0.08] px-2.5 text-[11.5px] text-white/75 hover:bg-white/[0.14]">{oldu ? "Kopyalandı" : "Kopyala"}</button>
    </div>
  );
}

export const KURAL_AD: Record<string, string> = { herkes: "Herkes", uyeler: "Üyeler", sahibi: "Kaydın sahibi", kapali: "Yalnız sen" };
export const KURALLAR = ["herkes", "uyeler", "sahibi", "kapali"] as const;
export type KuralUc = { okuma: string; ekleme: string; duzenleme: string };
export const KURAL_HAZIR: { id: string; ad: string; alt: string; k?: KuralUc }[] = [
  { id: "kapali", ad: "Kapalı", alt: "Yalnız sen, önizleme ve sunucu fonksiyonları", k: { okuma: "kapali", ekleme: "kapali", duzenleme: "kapali" } },
  { id: "katalog", ad: "Herkese açık liste", alt: "Herkes okur, yalnız sen yazarsın (ürünler, menü)", k: { okuma: "herkes", ekleme: "kapali", duzenleme: "kapali" } },
  { id: "form", ad: "Herkes gönderir", alt: "Herkes ekler, yalnız sen okursun (iletişim, başvuru)", k: { okuma: "kapali", ekleme: "herkes", duzenleme: "kapali" } },
  { id: "kisisel", ad: "Kişisel", alt: "Her üye yalnız kendi kayıtlarını görür ve düzenler", k: { okuma: "sahibi", ekleme: "uyeler", duzenleme: "sahibi" } },
  { id: "topluluk", ad: "Topluluk", alt: "Herkes okur, üyeler ekler, herkes yalnız kendininkini düzenler", k: { okuma: "herkes", ekleme: "uyeler", duzenleme: "sahibi" } },
  { id: "ozel", ad: "Özel", alt: "Okuma, ekleme ve düzenlemeyi ayrı ayrı seç" },
];
/** Erişim kuralı seçici: hazır kalıplar + Özel (üç ayrı seçim). */
export function KuralSecici({ k, set }: { k: KuralUc; set: (k: KuralUc) => void }) {
  const eslesen = KURAL_HAZIR.find((h) => h.k && h.k.okuma === k.okuma && h.k.ekleme === k.ekleme && h.k.duzenleme === k.duzenleme)?.id ?? "ozel";
  const [ozel, setOzel] = useState(eslesen === "ozel");
  const secili = ozel ? "ozel" : eslesen;
  return (
    <div className="space-y-2">
      <div className="grid gap-1.5 sm:grid-cols-2">
        {KURAL_HAZIR.map((h) => (
          <button key={h.id} type="button" onClick={() => { if (h.k) { setOzel(false); set({ ...h.k }); } else setOzel(true); }} aria-pressed={secili === h.id}
            className={cn("rounded-[14px] px-3 py-2.5 text-left transition-colors", secili === h.id ? "bg-white/[0.07] ring-2 ring-inset ring-white" : "bg-white/[0.03] ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.06]")}>
            <span className="block text-[13px] font-medium text-white">{h.ad}</span><span className="block text-[11.5px] leading-snug text-white/45">{h.alt}</span>
          </button>
        ))}
      </div>
      {secili === "ozel" && (
        <div className="space-y-2 rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
          {(["okuma", "ekleme", "duzenleme"] as const).map((a) => (
            <div key={a} className="flex flex-wrap items-center gap-1.5">
              <span className="w-[76px] text-[12px] text-white/50">{a === "okuma" ? "Okuma" : a === "ekleme" ? "Ekleme" : "Düzenleme"}</span>
              {KURALLAR.map((x) => <SecHap key={x} secili={k[a] === x} onClick={() => set({ ...k, [a]: x })}>{KURAL_AD[x]}</SecHap>)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
