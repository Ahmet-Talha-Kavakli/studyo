"use client";

import { type ReactNode, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Wand2, Zap, AtSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { ElementSecici } from "./ElementSecici";
import { ElementCip } from "./ElementCip";
import { useElements } from "@/store/useElements";
import { toast } from "@/lib/toast";

/**
 * Higgsfield tarzı merkezi glass prompt bar.
 * Sol'da mod ikonu, ortada input, altta seçenek pill'leri, sağda Generate.
 */
export function PromptBar({
  deger,
  onDeger,
  placeholder,
  secenekler,
  kredi,
  onUret,
  butonEtiket = "Üret",
  solIkon,
  vurgu = "cyan",
  elementDestegi = false,
}: {
  deger: string;
  onDeger: (v: string) => void;
  placeholder: string;
  secenekler?: ReactNode;
  kredi: number;
  onUret: () => void;
  butonEtiket?: string;
  solIkon?: ReactNode;
  vurgu?: "cyan" | "amber" | "emerald" | "vayra" | "iris";
  elementDestegi?: boolean;
}) {
  const vurguRenk = {
    cyan: "bg-cyan-glow text-ink-950 shadow-cyan-glow/30",
    amber: "bg-amber-glow text-ink-950 shadow-amber-glow/30",
    emerald: "bg-emerald-400 text-ink-950 shadow-emerald-400/30",
    vayra: "bg-vayra-500 text-ink-950 shadow-vayra-500/30",
    iris: "bg-iris-500 text-white shadow-iris-500/30",
  }[vurgu];

  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const [mentionFiltre, setMentionFiltre] = useState<string | null>(null);
  const elementEkle = useElements((s) => s.ekle);
  const kayitliAdlar = useElements((s) => s.elementler);

  // `deger` = ham prompt + sonuna eklenmiş "@e1 @e2" element etiketleri.
  // Textarea sadece HAM kısmı gösterir; elementler ayrı çipler olarak render edilir.
  // Böylece parent tek `deger` string'i alır (elementler dahil), UI ise çip gösterir.
  const secilenAdlar: string[] = [];
  {
    const gorulen = new Set<string>();
    for (const m of deger.matchAll(/@(\w+)/g)) {
      const ad = m[1];
      if (!gorulen.has(ad) && kayitliAdlar.some((e) => e.ad === ad)) {
        gorulen.add(ad); secilenAdlar.push(ad);
      }
    }
  }
  // Textarea'nın gösterdiği ham metin: @element etiketlerini çıkar.
  const hamMetin = elementDestegi
    ? deger.replace(/(?:^|\s)@\w+(?=\s|$)/g, (t) => (kayitliAdlar.some((e) => "@" + e.ad === t.trim()) ? "" : t)).replace(/\s{2,}/g, " ").trim()
    : deger;
  // Ham metin + çip etiketlerini birleştirip parent'a yaz.
  const birlestir = (ham: string, adlar: string[]) => {
    const etiket = adlar.map((a) => `@${a}`).join(" ");
    onDeger(etiket ? (ham ? `${ham.trim()} ${etiket}` : etiket) : ham);
  };

  // @ sonrası kelimeyi yakala (imleç konumuna göre).
  const mentionKontrol = (v: string, imlec: number) => {
    if (!elementDestegi) return;
    const oncesi = v.slice(0, imlec);
    const eslesme = oncesi.match(/@(\w*)$/);
    setMentionFiltre(eslesme ? eslesme[1] : null);
  };

  const mentionSec = (ad: string) => {
    // Yeni elementi çip listesine ekle; ham metinden yarım @parça'yı temizle.
    const temizHam = hamMetin.replace(/@\w*$/, "").trim();
    const yeniAdlar = secilenAdlar.includes(ad) ? secilenAdlar : [...secilenAdlar, ad];
    birlestir(temizHam, yeniAdlar);
    setMentionFiltre(null);
    setTimeout(() => taRef.current?.focus(), 0);
  };

  const yeniElement = () => {
    const ad = (mentionFiltre || "").trim() || `Element${Math.floor(performance.now()) % 1000}`;
    elementEkle({ ad, tur: "karakter", aciklama: "Yeni özel element", tohum: "el-" + ad });
    mentionSec(ad);
    toast.success(`@${ad} elementi oluşturuldu`);
  };

  // Çipi kaldır.
  const cipKaldir = (ad: string) => {
    birlestir(hamMetin, secilenAdlar.filter((a) => a !== ad));
    setTimeout(() => taRef.current?.focus(), 0);
  };

  // Textarea değişince: ham metni al, çipleri koru.
  const hamDegisti = (v: string) => birlestir(v, secilenAdlar);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong mx-auto w-full max-w-4xl rounded-3xl p-3 shadow-2xl shadow-black/50"
    >
      <div className="flex items-start gap-3">
        {/* Sol mod ikonu */}
        {solIkon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl glass-ikon text-white/70">
            {solIkon}
          </div>
        )}

        {/* Input alanı */}
        <div className="relative min-w-0 flex-1">
          <AnimatePresence>
            {elementDestegi && mentionFiltre !== null && (
              <ElementSecici filtre={mentionFiltre} onSec={mentionSec} onYeni={yeniElement} />
            )}
          </AnimatePresence>
          {/* Seçili element çipleri — Higgsfield birebir: avatar + @isim + × + hover önizleme */}
          {elementDestegi && secilenAdlar.length > 0 && (
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              {secilenAdlar.map((ad) => (
                <ElementCip key={ad} ad={ad} onKaldir={() => cipKaldir(ad)} />
              ))}
            </div>
          )}
          <textarea
            ref={taRef}
            value={hamMetin}
            onChange={(e) => { hamDegisti(e.target.value); mentionKontrol(e.target.value, e.target.selectionStart ?? 0); }}
            onKeyUp={(e) => mentionKontrol(e.currentTarget.value, e.currentTarget.selectionStart ?? 0)}
            onBlur={() => setTimeout(() => setMentionFiltre(null), 150)}
            rows={1}
            placeholder={placeholder}
            className="w-full resize-none bg-transparent py-2.5 text-sm outline-none placeholder:text-white/35"
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 120) + "px";
            }}
          />
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {elementDestegi && (
              <button onClick={() => { hamDegisti(hamMetin + (hamMetin && !hamMetin.endsWith(" ") ? " @" : "@")); setMentionFiltre(""); taRef.current?.focus(); }}
                className="inline-flex items-center gap-1 rounded-lg bg-white/6 px-2 py-1.5 text-xs font-medium text-white/60 transition-colors hover:bg-white/12 hover:text-white">
                <AtSign className="h-3.5 w-3.5" /> Element
              </button>
            )}
            {secenekler}
          </div>
        </div>

        {/* Generate */}
        <button
          onClick={onUret}
          className={cn(
            "flex h-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-6 font-bold shadow-lg transition-all hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.97]",
            vurguRenk,
          )}
        >
          <span className="flex items-center gap-1.5 text-sm">
            <Wand2 className="h-4 w-4" /> {butonEtiket}
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold opacity-75">
            <Zap className="h-3 w-3" /> {kredi}
          </span>
        </button>
      </div>
    </motion.div>
  );
}

/** Prompt bar altındaki seçenek pill'i — Higgsfield tarzı tam-pill, ince kenarlıklı koyu. */
export function PromptPill({
  ikon,
  children,
  onClick,
}: {
  ikon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/75 transition-colors hover:border-white/20 hover:bg-white/8 hover:text-white"
    >
      {ikon}
      {children}
    </button>
  );
}

export { Plus };
