"use client";

import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";

/**
 * Önizleme modu şeridi — sağlayıcı bağlı değilken sayfada TEK yerde, dürüstçe söylenir:
 * üretimler tarayıcıda sentezlenir ve kredi düşmez. Oturum boyunca kapatılabilir; CTA, satır ve
 * bildirimlerde ayrıca tekrar edilmez.
 */
export function DemoSeridi({ anahtar, metin }: { anahtar: string; metin: string }) {
  const [kapali, setKapali] = useState(true);
  useEffect(() => { try { setKapali(sessionStorage.getItem(`vayra-demo-seridi-${anahtar}`) === "1"); } catch { setKapali(false); } }, [anahtar]);
  if (kapali) return null;
  return (
    <div role="note" className="flex min-h-9 items-center gap-2.5 border-b border-white/[0.06] bg-white/[0.025] px-5 py-2 text-[12.5px] text-metin-2">
      <Info className="h-3.5 w-3.5 shrink-0 text-metin-3" aria-hidden />
      <span className="min-w-0 flex-1"><span className="font-medium text-metin">Önizleme modu.</span> {metin}</span>
      <button onClick={() => { setKapali(true); try { sessionStorage.setItem(`vayra-demo-seridi-${anahtar}`, "1"); } catch { /* yok say */ } }}
        aria-label="Şeridi kapat" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-metin-3 transition-colors hover:bg-white/[0.06] hover:text-metin">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
