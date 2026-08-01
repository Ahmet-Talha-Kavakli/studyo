"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Uye { ad: string; renk: string }

const ekipDemo: Uye[] = [
  { ad: "Sen", renk: "from-cyan-glow to-blue-500" },
  { ad: "Deniz", renk: "from-iris-400 to-purple-600" },
  { ad: "Elif", renk: "from-emerald-400 to-teal-500" },
];

/**
 * Gerçek zamanlı işbirliği göstergesi — canvas'ta online üye avatarları + canlı
 * yazıyor animasyonu. Backend gerektirmeyen demo (deterministik); UI tam çalışır.
 */
export function IsbirlikciGosterge() {
  const [yazan, setYazan] = useState<number | null>(null);

  // Deterministik "birisi düzenliyor" animasyonu — canlı işbirliği hissi.
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setYazan(i % 5 === 0 ? 1 + (i % 2) : null);
    }, 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {ekipDemo.map((u, i) => (
          <div key={u.ad} className="group relative">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${u.renk} text-[10px] font-bold ring-2 ring-ink-950`}>
              {u.ad.charAt(0).toUpperCase()}
            </span>
            <AnimatePresence>
              {yazan === i && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute -bottom-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-400 ring-2 ring-ink-950"
                >
                  <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-200" />
                </motion.span>
              )}
            </AnimatePresence>
            <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink-950/90 px-1.5 py-0.5 text-[10px] opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
              {u.ad}{yazan === i ? " · yazıyor…" : ""}
            </span>
          </div>
        ))}
      </div>
      <span className="flex items-center gap-1 text-[11px] text-white/45">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {ekipDemo.length} çevrimiçi
      </span>
    </div>
  );
}
