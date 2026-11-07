"use client";

import { useEffect, useState } from "react";
import { Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { SagPanel } from "./ortak";
import type { Mesaj } from "./tipler";

/**
 * Uzun sohbetin ana hattı (ChatGPT 2026 gibi): sağ kenarda her soru için bir çizgi; üzerine gelince sorular açılır,
 * tıklayınca o mesaja kayar. Görünen soru vurgulanır.
 */
export function AnaHat({ yol, kutu }: { yol: Mesaj[]; kutu: React.RefObject<HTMLDivElement | null> }) {
  const sorular = yol.filter((m) => m.rol === "kullanici" && (m.metin || m.istek?.gorev));
  const [aktif, setAktif] = useState<string | null>(null);
  const [acik, setAcik] = useState(false);
  useEffect(() => {
    const k = kutu.current;
    if (!k) return;
    const f = () => {
      const ust = k.getBoundingClientRect().top + 80;
      let son: string | null = null;
      for (const m of sorular) { const el = k.querySelector(`[data-mesaj="${m.id}"]`); if (el && el.getBoundingClientRect().top <= ust + 40) son = m.id; }
      setAktif(son ?? sorular[0]?.id ?? null);
    };
    f();
    k.addEventListener("scroll", f, { passive: true });
    return () => k.removeEventListener("scroll", f);
  }, [kutu, sorular]);
  if (sorular.length < 3) return null;
  const git = (id: string) => kutu.current?.querySelector(`[data-mesaj="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  return (
    <nav aria-label="Sohbetin ana hattı" onMouseEnter={() => setAcik(true)} onMouseLeave={() => setAcik(false)}
      className="absolute right-3 top-1/2 z-20 hidden max-h-[60vh] -translate-y-1/2 xl:block">
      <div className={cn("overflow-y-auto rounded-[16px] p-1.5 transition-colors [scrollbar-width:none]", acik ? "max-h-[60vh] w-[260px] bg-[#141416] ring-1 ring-inset ring-white/[0.1]" : "w-6")}>
        {sorular.map((m, i) => (
          <button key={m.id} type="button" onClick={() => git(m.id)} title={acik ? undefined : (m.metin ?? "").slice(0, 80)}
            className={cn("flex w-full items-center gap-2 rounded-[10px] text-left", acik ? "px-2 py-1.5 hover:bg-white/[0.06]" : "justify-end py-[5px]")}>
            {acik && <span className={cn("min-w-0 flex-1 truncate text-[12.5px]", aktif === m.id ? "text-white" : "text-white/55")}>{i + 1}. {m.istek?.gorev ? `Görev: ${m.istek.gorev.ad}` : m.metin}</span>}
            <span className={cn("h-[3px] shrink-0 rounded-full transition-all", aktif === m.id ? "w-4 bg-[#55d6fd]" : "w-2.5 bg-white/25")} />
          </button>
        ))}
      </div>
    </nav>
  );
}

export const KISAYOLLAR: { tus: string[]; ad: string }[] = [
  { tus: ["Ctrl", "K"], ad: "Ara" },
  { tus: ["Ctrl", "Shift", "O"], ad: "Yeni sohbet" },
  { tus: ["Shift", "Esc"], ad: "Yazı kutusuna odaklan" },
  { tus: ["Ctrl", "Shift", "C"], ad: "Son yanıtı kopyala" },
  { tus: ["Ctrl", "Shift", ";"], ad: "Son kod bloğunu kopyala" },
  { tus: ["Ctrl", "Shift", "S"], ad: "Paylaş" },
  { tus: ["Ctrl", "Shift", "E"], ad: "Konuşma kipi" },
  { tus: ["Ctrl", "Shift", "I"], ad: "İstem kitaplığı" },
  { tus: ["Ctrl", "Shift", "Y"], ad: "Son yanıtı yeniden dene" },
  { tus: ["Esc"], ad: "Yanıtı durdur" },
  { tus: ["Ctrl", "/"], ad: "Bu listeyi aç" },
  { tus: ["/"], ad: "Komutlar (yazı kutusunda)" },
  { tus: ["@"], ad: "Ajan, yetenek, bağlantı ya da sohbet an" },
];

export function KisayolPaneli({ acik, kapat }: { acik: boolean; kapat: () => void }) {
  return (
    <SagPanel acik={acik} kapat={kapat} baslik="Klavye kısayolları" alt="Mac'te Ctrl yerine Cmd" ikon={<Keyboard className="h-[18px] w-[18px]" />} genislik={460}>
      <div className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
        {KISAYOLLAR.map((k, i) => (
          <div key={k.ad} className={cn("flex items-center gap-3 px-4 py-2.5", i && "border-t border-white/[0.05]")}>
            <span className="flex-1 text-[13.5px] text-white/85">{k.ad}</span>
            <span className="flex gap-1">{k.tus.map((t) => <kbd key={t} className="min-w-[28px] rounded-[7px] bg-white/[0.08] px-1.5 py-0.5 text-center text-[12px] text-white/80 ring-1 ring-inset ring-white/[0.1]">{t}</kbd>)}</span>
          </div>
        ))}
      </div>
    </SagPanel>
  );
}
