"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, FlaskConical, ChevronDown, Cpu } from "lucide-react";

type Durum = Record<string, { saglayici: string; gercek: boolean }>;

const TUR_ETIKET: Record<string, string> = {
  gorsel: "Görsel",
  video: "Video",
  ses: "Ses",
  "3d": "3D",
};

const SAGLAYICI_ETIKET: Record<string, string> = {
  eleven: "ElevenLabs",
  meshy: "Meshy AI",
  openai: "OpenAI",
  replicate: "Replicate",
  simulasyon: "Demo motoru",
};

/**
 * Sağlayıcı durum rozeti — her üretim türünün gerçek API mı yoksa demo
 * (simülasyon) motoruyla mı çalıştığını şeffafça gösterir. Anahtar girilince
 * ilgili tür "Canlı" olur. Fake yok kuralının görünür kanıtı.
 */
export function SaglayiciDurum() {
  const [durum, setDurum] = useState<Durum | null>(null);
  const [acik, setAcik] = useState(false);

  useEffect(() => {
    let iptal = false;
    fetch("/api/saglayici-durum")
      .then((r) => r.json())
      .then((d) => !iptal && setDurum(d.durum))
      .catch(() => {});
    return () => {
      iptal = true;
    };
  }, []);

  if (!durum) return null;

  const turler = Object.keys(durum);
  const canliSayi = turler.filter((t) => durum[t].gercek).length;
  const hepsiCanli = canliSayi === turler.length;

  return (
    <div className="relative">
      <button
        onClick={() => setAcik((v) => !v)}
        className="group flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs transition-colors hover:bg-white/10"
        title="AI sağlayıcı durumu"
      >
        <Cpu className={`h-3.5 w-3.5 ${hepsiCanli ? "text-emerald-400" : canliSayi > 0 ? "text-cyan-glow" : "text-white/40"}`} />
        <span className="text-white/70">
          {canliSayi > 0 ? `${canliSayi}/${turler.length} canlı` : "Demo"}
        </span>
        <ChevronDown className={`h-3 w-3 text-white/40 transition-transform ${acik ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {acik && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setAcik(false)} />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="menu-surface absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl p-3 shadow-2xl shadow-black/50"
            >
              <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-white/35">
                AI Sağlayıcı Durumu
              </p>
              <div className="space-y-1">
                {turler.map((t) => {
                  const d = durum[t];
                  return (
                    <div key={t} className="flex items-center justify-between rounded-lg px-2 py-1.5">
                      <span className="text-sm text-white/80">{TUR_ETIKET[t] ?? t}</span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-xs text-white/45">
                          {SAGLAYICI_ETIKET[d.saglayici] ?? d.saglayici}
                        </span>
                        {d.gercek ? (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                            <Zap className="h-2.5 w-2.5" /> Canlı
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-white/8 px-1.5 py-0.5 text-[10px] font-semibold text-white/50">
                            <FlaskConical className="h-2.5 w-2.5" /> Demo
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 border-t border-white/8 px-1 pt-2 text-[11px] leading-relaxed text-white/40">
                Demo türleri, ilgili API anahtarı{" "}
                <code className="rounded bg-white/8 px-1 text-white/60">.env.local</code>'e
                girilince otomatik canlıya geçer.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
