"use client";

import { Yuzen } from "@/components/ui/Yuzen";

/**
 * Tetikleyicisi serbest seçici: komut kutusundaki görsel slotlar ve hafif metin çipleri aynı
 * popover kabuğunu (başlık + kaydırılabilir içerik) kullanır.
 */
export function Secici({ etiket, acik, setAcik, genislik = 420, tetik, children }: {
  etiket: string; acik: boolean; setAcik: (v: boolean) => void; genislik?: number;
  tetik: (p: { acik: boolean; ac: () => void }) => React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="relative">
      {tetik({ acik, ac: () => setAcik(!acik) })}
      <Yuzen acik={acik} onKapat={() => setAcik(false)} yerlesim="ust-sol" bosluk={10} etiket={etiket}
        className="flex max-h-[min(70vh,620px)] flex-col overflow-hidden rounded-[18px] border border-white/[0.09] bg-[#1b1c1f]" style={{ width: `min(${genislik}px, calc(100vw - 24px))` }}>
        <p className="flex min-h-[44px] shrink-0 items-center border-b border-white/[0.06] px-3.5 py-2 text-[13.5px] font-semibold text-metin">{etiket}</p>
        <div className="min-h-0 flex-1 overflow-y-auto p-2.5 [scrollbar-width:thin]">{children}</div>
      </Yuzen>
    </div>
  );
}
