"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, ChevronDown, ArrowUp, Cpu, Zap, ExternalLink } from "lucide-react";
import { toast } from "@/lib/toast";
import { useSupercomputer } from "@/store/useSupercomputer";
import { cn } from "@/lib/utils";

/**
 * Detay sayfalarına gömülü composer — Higgsfield "TRY X IN SUPERCOMPUTER" birebir (F.md 313-322, G.md 257-260).
 * Başlık + Usta/MCP toggle + composer (+ / Akıllı mod / Sor / lime gönder) + dipnot.
 * Gönder = GERÇEK: useSupercomputer.getState().sohbetAc → mesajEkle → calisiyorAyarla → router.push.
 */
export function SCGomuluComposer({
  baslik,
  ornek,
  cip,
  cipTipi = "calisan",
  studyoLink,
}: {
  baslik: string;               // "SHORTS ÜRETİCİ'Yİ SUPERCOMPUTER'DA DENE"
  ornek: string;                // composer placeholder örnek istem
  cip: string;                  // element chip metni (çalışan/beceri adı)
  cipTipi?: "calisan" | "beceri";
  studyoLink?: string;          // Studio'da aç dış-link rotası
}) {
  const router = useRouter();
  const [hedef, setHedef] = useState<"sc" | "mcp">("sc");
  const [metin, setMetin] = useState("");
  const [mod, setMod] = useState<"Sor" | "Ajan">("Sor");
  const [cipVar, setCipVar] = useState(true);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [metin]);

  const gonder = () => {
    const t = (metin.trim() || ornek).trim();
    if (t.length < 3) return toast.error("İstem çok kısa", { description: "Ne üretmek istediğini birkaç kelimeyle yaz." });
    if (hedef === "mcp") {
      toast.success("MCP'ye gönderildi", { description: `${cip} · ${t.slice(0, 48)}${t.length > 48 ? "…" : ""}` });
    }
    const cipParça = cipVar ? (cipTipi === "beceri" ? `/${cip} ` : `@${cip} `) : "";
    const tamIstem = `${cipParça}${t}`;
    const sc = useSupercomputer.getState();
    const baslikKisa = t.length > 40 ? t.slice(0, 40) + "…" : t;
    const id = sc.sohbetAc(`${cip} · ${baslikKisa}`, { onayModu: mod === "Ajan" ? "otomatik" : "onayli" });
    sc.mesajEkle(id, { rol: "kullanici", metin: tamIstem });
    sc.calisiyorAyarla(id, true);
    router.push(`/panel/supercomputer/${id}`);
  };

  return (
    <div className="mx-auto max-w-3xl text-center">
      <h2 className="hf-baslik text-[26px] leading-tight sm:text-[30px]">{baslik}</h2>

      {/* Hedef seçici toggle: Usta / MCP (+ opsiyonel Studio dış link) */}
      <div className="mt-5 flex items-center justify-center gap-2">
        <div className="flex items-center gap-1 rounded-full border border-kenar bg-yuzey-2 p-1">
          <button
            onClick={() => setHedef("sc")}
            className={cn("flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] transition-colors",
              hedef === "sc" ? "bg-white text-zemin" : "text-metin-2 hover:text-metin")}
          >
            <Cpu className="h-3.5 w-3.5" /> Usta
          </button>
          <button
            onClick={() => setHedef("mcp")}
            className={cn("flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] transition-colors",
              hedef === "mcp" ? "bg-white text-zemin" : "text-metin-2 hover:text-metin")}
          >
            <Zap className="h-3.5 w-3.5" /> MCP
          </button>
        </div>
        {studyoLink && (
          <button
            onClick={() => router.push(studyoLink)}
            className="flex items-center gap-1.5 rounded-full border border-kenar bg-yuzey-2 px-3.5 py-2 text-[13px] text-metin-2 transition-colors hover:text-metin"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Studio
          </button>
        )}
      </div>

      {/* Composer */}
      <div className="mt-5 rounded-[22px] border border-kenar-2 bg-[#171717] p-3 text-left">
        {/* Element chip satırı — idle: nokta/slash, hover: × kaldır */}
        {cipVar && (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCipVar(false)}
              className="group flex items-center gap-1.5 rounded-[9px] border border-kenar-2 bg-white/[0.04] px-2 py-1 text-[12px] font-medium"
            >
              {cipTipi === "beceri" ? (
                <span className="text-metin-3 group-hover:hidden">/</span>
              ) : (
                <span className="h-2 w-2 rounded-full bg-rose-400 group-hover:hidden" />
              )}
              <span className="hidden text-metin-3 group-hover:inline">×</span>
              {cip}
            </button>
          </div>
        )}
        <textarea
          ref={taRef}
          value={metin}
          onChange={(e) => setMetin(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); gonder(); } }}
          rows={1}
          placeholder={ornek}
          className="w-full resize-none bg-transparent px-1 py-1.5 text-[14px] leading-relaxed outline-none placeholder:text-metin-3"
        />
        {/* Alt araç satırı */}
        <div className="mt-1 flex items-center gap-2">
          <button className="flex h-8 w-8 items-center justify-center rounded-full border border-kenar-2 text-metin-2 transition-colors hover:bg-white/8 hover:text-metin" aria-label="Ekle">
            <Plus className="h-4 w-4" />
          </button>
          <button className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] text-metin-2 transition-colors hover:bg-white/6 hover:text-metin">
            <Sparkles className="h-3.5 w-3.5 text-aksan" /> Akıllı mod <ChevronDown className="h-3 w-3" />
          </button>
          <button
            onClick={() => setMod((m) => (m === "Sor" ? "Ajan" : "Sor"))}
            className="ml-auto flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[13px] text-metin-2 transition-colors hover:bg-white/6 hover:text-metin"
          >
            {mod} <ChevronDown className="h-3 w-3" />
          </button>
          <button
            onClick={gonder}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-aksan text-zemin transition-all hover:brightness-110 active:scale-95"
            aria-label="Gönder"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="mt-2.5 text-[12px] text-metin-3">LLM&apos;ler hata yapabilir ve çağrılar kredi harcar.</p>
    </div>
  );
}
