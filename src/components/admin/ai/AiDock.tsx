"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { AiSohbet } from "./Sohbet";
import { SPRING } from "@/lib/admin/animasyon";
import { AD } from "@/components/admin/ui/temel";
import { cn } from "@/lib/utils";

/* Her admin sayfasında sağ-altta yüzen AI asistan dock'u.
   AI tam-sayfasında (/admin/ai) gizlenir — orada zaten sohbet var. */
export function AiDock() {
  const [acik, setAcik] = useState(false);
  const path = usePathname();
  if (path === "/admin/ai") return null;
  return (
    <>
      <AnimatePresence>
        {acik && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.96 }} transition={SPRING}
            className="ad-panel fixed bottom-24 right-5 z-[70] flex h-[560px] w-[380px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden !p-0">
            <div className="flex items-center justify-between border-b border-[color:var(--ad-kenar)] px-4 py-3">
              <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[color:var(--ad-aksan)]" /><span className={cn("text-[14px] font-bold", AD.metin)}>AI Asistan</span></div>
              <button onClick={() => setAcik(false)} className="text-[color:var(--ad-metin-3)] hover:text-[color:var(--ad-metin)]"><X className="h-4.5 w-4.5" /></button>
            </div>
            <div className="min-h-0 flex-1"><AiSohbet kompakt /></div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setAcik((v) => !v)}
        className="fixed bottom-5 right-5 z-[70] flex h-13 w-13 items-center justify-center rounded-2xl"
        style={{ width: 52, height: 52, background: "linear-gradient(135deg, #7de0ff, #1ea8d6)", boxShadow: "0 8px 24px -6px rgba(85,214,253,0.5)" }}>
        {acik ? <X className="h-5 w-5 text-[#04222c]" /> : <Sparkles className="h-5 w-5 text-[#04222c]" />}
      </motion.button>
    </>
  );
}
