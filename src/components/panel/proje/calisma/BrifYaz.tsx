"use client";

/**
 * Brif yazım yardımcısı paneli (Notion AI gibi). İki kullanım:
 *  1. "/" menüsünden: devam et, sayfayı özetle, fikir üret, yapılacakları çıkar ya da serbest istek; sonuç blok olarak eklenir.
 *  2. Biçim çubuğundan seçili metinle: düzelt, kısalt, uzat, profesyonelleştir, çevir, maddele; sonuç seçimin yerine geçer ya da altına eklenir.
 * Akışlı yanıt (/api/proje/yaz). Claude bağlı değilken yerel örnek sonuç üretilir ve "Demo" diye işaretlenir.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp, Check, CornerDownLeft, Languages, ListChecks, Lightbulb, ListTree, Loader2, Minimize2, Maximize2, PenLine, RotateCcw, Sparkles, SpellCheck, Briefcase, List, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type YazIslem = "devam" | "ozetle" | "fikir" | "eylem" | "duzelt" | "kisalt" | "uzat" | "profesyonel" | "ingilizce" | "turkce" | "maddele" | "serbest";

export const SECIM_ISLEMLERI: { id: YazIslem; ad: string; ikon: React.ElementType }[] = [
  { id: "duzelt", ad: "Yazımı düzelt", ikon: SpellCheck },
  { id: "kisalt", ad: "Kısalt", ikon: Minimize2 },
  { id: "uzat", ad: "Uzat", ikon: Maximize2 },
  { id: "profesyonel", ad: "Profesyonelleştir", ikon: Briefcase },
  { id: "maddele", ad: "Maddelere böl", ikon: List },
  { id: "ingilizce", ad: "İngilizceye çevir", ikon: Languages },
  { id: "turkce", ad: "Türkçeye çevir", ikon: Languages },
];
const SAYFA_ISLEMLERI: { id: YazIslem; ad: string; ikon: React.ElementType }[] = [
  { id: "devam", ad: "Yazmaya devam et", ikon: PenLine },
  { id: "ozetle", ad: "Sayfayı özetle", ikon: ListTree },
  { id: "fikir", ad: "Fikir üret", ikon: Lightbulb },
  { id: "eylem", ad: "Yapılacakları çıkar", ikon: ListChecks },
];
const ad = (i: YazIslem) => [...SECIM_ISLEMLERI, ...SAYFA_ISLEMLERI].find((x) => x.id === i)?.ad ?? "Serbest istek";

/** Bağlantı yokken dürüst yerel sonuç: yapılabileni yapar, yapamayacağını söyler. */
function demoSonuc(islem: YazIslem, metin: string, sayfa: string): string {
  const cumleler = (s: string) => s.replace(/\s+/g, " ").split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);
  const satirlar = sayfa.split("\n").map((x) => x.trim()).filter((x) => x && !x.startsWith("#"));
  switch (islem) {
    case "duzelt": { const t = metin.replace(/\s+/g, " ").trim(); return t ? t[0].toLocaleUpperCase("tr") + t.slice(1) + (/[.!?]$/.test(t) ? "" : ".") : ""; }
    case "kisalt": { const c = cumleler(metin); return c.slice(0, Math.max(1, Math.ceil(c.length / 2))).join(" "); }
    case "maddele": return cumleler(metin).map((c) => `- ${c.replace(/[.]$/, "")}`).join("\n");
    case "ozetle": return satirlar.slice(0, 5).map((s) => `- ${cumleler(s)[0] ?? s}`).join("\n") || "- Sayfada özetlenecek metin yok.";
    case "eylem": return satirlar.filter((s) => /^-\s\[\s\]/.test(s)).slice(0, 6).join("\n") || "- [ ] Bağlam bölümünü doldur\n- [ ] Hedef kitleyi netleştir\n- [ ] Teslim tarihini belirle";
    default: return "";
  }
}

export function YazPaneli({ islemIlk, secim, sayfa, proje, onEkle, onDegistir, onKapat }: {
  islemIlk?: YazIslem; secim?: string; sayfa: string; proje: string;
  onEkle: (metin: string) => void; onDegistir?: (metin: string) => void; onKapat: () => void;
}) {
  const [istek, setIstek] = useState("");
  const [islem, setIslem] = useState<YazIslem | null>(islemIlk ?? null);
  const [sonuc, setSonuc] = useState("");
  const [durum, setDurum] = useState<"bos" | "yaziyor" | "bitti" | "hata">("bos");
  const [hata, setHata] = useState("");
  const [demo, setDemo] = useState(false);
  const iptal = useRef<AbortController | null>(null);
  const girdi = useRef<HTMLInputElement>(null);

  const calistir = useCallback(async (i: YazIslem, serbest?: string) => {
    iptal.current?.abort();
    const ac = new AbortController(); iptal.current = ac;
    setIslem(i); setSonuc(""); setHata(""); setDemo(false); setDurum("yaziyor");
    try {
      const r = await fetch("/api/proje/yaz", { method: "POST", headers: { "Content-Type": "application/json" }, signal: ac.signal,
        body: JSON.stringify({ islem: i, metin: secim, istek: serbest, sayfa, proje }) });
      if ((r.headers.get("content-type") ?? "").includes("text/event-stream") && r.body) {
        const ok = r.body.getReader(), coz = new TextDecoder();
        let tampon = "";
        for (;;) {
          const { value, done } = await ok.read();
          if (done) break;
          tampon += coz.decode(value, { stream: true });
          const p = tampon.split("\n\n"); tampon = p.pop() ?? "";
          for (const s of p) {
            if (!s.startsWith("data: ")) continue;
            let e: { t: string; d?: string; m?: string };
            try { e = JSON.parse(s.slice(6)); } catch { continue; }
            if (e.t === "metin") setSonuc((x) => x + (e.d ?? ""));
            else if (e.t === "hata") { setHata(e.m ?? "Yanıt alınamadı."); setDurum("hata"); return; }
          }
        }
        setDurum("bitti");
        return;
      }
      const v = await r.json();
      if (!v.ok) { setHata(v.hata ?? "Yanıt alınamadı."); setDurum("hata"); return; }
      if (v.demo) {
        setDemo(true);
        const m = demoSonuc(i, secim ?? "", sayfa);
        if (!m) { setHata("Claude bağlı değil; bu işlem için yazım yardımcısının bağlanması gerekiyor."); setDurum("hata"); return; }
        for (const k of m.split(/(?<=\s)/)) { if (ac.signal.aborted) return; setSonuc((x) => x + k); await new Promise((z) => setTimeout(z, 18)); }
        setDurum("bitti");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") { setHata("Bağlantı koptu. Yeniden dene."); setDurum("hata"); }
    }
  }, [secim, sayfa, proje]);

  useEffect(() => { if (islemIlk) void calistir(islemIlk); else setTimeout(() => girdi.current?.focus(), 30); return () => iptal.current?.abort(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); iptal.current?.abort(); onKapat(); } };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [onKapat]);

  const islemler = secim ? SECIM_ISLEMLERI : SAYFA_ISLEMLERI;
  return (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
      className="overflow-hidden rounded-[16px] border border-white/[0.1] bg-[#18191c]" onMouseDown={(e) => e.stopPropagation()}>
      <header className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2">
        <Sparkles className="h-4 w-4 text-white" />
        <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-white">Yapay zekâ{islem ? ` · ${ad(islem)}` : ""}</p>
        
        <button onClick={() => { iptal.current?.abort(); onKapat(); }} aria-label="Kapat" className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></button>
      </header>

      {durum === "bos" ? (
        <div className="p-2">
          <form onSubmit={(e) => { e.preventDefault(); if (istek.trim()) void calistir("serbest", istek.trim()); }} className="flex items-center gap-2 rounded-[12px] bg-white/[0.04] px-3 ring-1 ring-inset ring-white/[0.07] focus-within:ring-white/20">
            <input ref={girdi} value={istek} onChange={(e) => setIstek(e.target.value)} placeholder={secim ? "Seçili metinle ne yapayım?" : "Yapay zekâya ne yazdırmak istersin?"} aria-label="Yapay zekâ isteği"
              className="h-10 min-w-0 flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/35" />
            <button disabled={!istek.trim()} aria-label="Gönder" className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-black transition disabled:bg-white/[0.1] disabled:text-white/40"><ArrowUp className="h-4 w-4" /></button>
          </form>
          <div className="mt-1.5 grid grid-cols-2 gap-0.5">
            {islemler.map((x) => (
              <button key={x.id} onClick={() => void calistir(x.id)} className="flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] text-white/85 transition hover:bg-white/[0.06] hover:text-white"><x.ikon className="h-4 w-4 text-white/55" />{x.ad}</button>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3">
          {durum === "hata" ? <p className="rounded-[12px] bg-rose-500/[0.08] px-3 py-2.5 text-[13px] text-rose-100 ring-1 ring-inset ring-rose-400/20">{hata}</p> : (
            <div className="max-h-[300px] overflow-y-auto whitespace-pre-wrap rounded-[12px] bg-white/[0.03] px-3.5 py-3 text-[14px] leading-relaxed text-white/90 ring-1 ring-inset ring-white/[0.06] [scrollbar-width:thin]">
              {sonuc}{durum === "yaziyor" && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-[3px] animate-pulse bg-white/70" />}
              {durum === "yaziyor" && !sonuc && <span className="flex items-center gap-2 text-white/50"><Loader2 className="h-4 w-4 animate-spin" />Yazıyor</span>}
            </div>
          )}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {durum === "bitti" && secim && onDegistir && <button onClick={() => onDegistir(sonuc.trim())} className="flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black active:scale-[0.97]"><Check className="h-3.5 w-3.5" />Seçimi değiştir</button>}
            {durum === "bitti" && <button onClick={() => onEkle(sonuc.trim())} className={cn("flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-semibold active:scale-[0.97]", secim ? "bg-white/[0.08] text-white hover:bg-white/[0.13]" : "bg-white text-black")}><CornerDownLeft className="h-3.5 w-3.5" />Altına ekle</button>}
            {durum === "yaziyor" && <button onClick={() => { iptal.current?.abort(); setDurum("bitti"); }} className="h-8 rounded-full bg-white/[0.08] px-3.5 text-[12.5px] font-medium text-white/90 hover:bg-white/[0.13]">Durdur</button>}
            {(durum === "bitti" || durum === "hata") && islem && <button onClick={() => void calistir(islem, islem === "serbest" ? istek.trim() : undefined)} className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-white/70 hover:bg-white/[0.06] hover:text-white"><RotateCcw className="h-3.5 w-3.5" />Yeniden dene</button>}
            <button onClick={() => { setDurum("bos"); setSonuc(""); setIslem(null); setTimeout(() => girdi.current?.focus(), 30); }} className="h-8 rounded-full px-3 text-[12.5px] text-white/55 hover:bg-white/[0.06] hover:text-white">Başka bir şey iste</button>
            <span className="ml-auto text-[11.5px] text-white/35">Yapay zekâ hata yapabilir; eklemeden önce oku.</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
