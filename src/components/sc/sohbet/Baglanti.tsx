"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Coins, WifiOff, X } from "lucide-react";
import { useAuth, PLAN_AYLIK_KREDI } from "@/store/useAuth";
import { useKrediModal } from "@/store/useKrediModal";

/** Tarayıcının çevrimiçi durumu (SSR'de çevrimiçi varsayılır). */
export function useCevrimici() {
  const [acik, setAcik] = useState(true);
  useEffect(() => {
    const g = () => setAcik(navigator.onLine);
    g(); window.addEventListener("online", g); window.addEventListener("offline", g);
    return () => { window.removeEventListener("online", g); window.removeEventListener("offline", g); };
  }, []);
  return acik;
}

/** Komut kutusunun üstünde çevrimdışı şeridi: taslak kaybolmaz, bağlantı gelince gönderilebilir. */
export function BaglantiUyarisi({ cevrimici }: { cevrimici: boolean }) {
  return (
    <AnimatePresence>
      {!cevrimici && (
        <motion.div role="status" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
          className="mb-2 flex items-center gap-2 rounded-[14px] bg-amber-300/[0.08] px-3.5 py-2 text-[13px] text-amber-100 ring-1 ring-inset ring-amber-300/20">
          <WifiOff className="h-4 w-4 shrink-0 text-amber-300" />
          <span>İnternet bağlantın yok. Yazdıkların kutuda duruyor; bağlantı gelince gönderebilirsin.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Kredi uyarısı (Claude "Approaching limit"): kalan kredi aylık kotanın %15'inin altına inince bir kez,
 * bittiğinde her zaman görünür. Sohbet kredi harcamaz; uyarı yalnız görsel gibi kredili işler içindir.
 */
export function KrediUyarisi() {
  const k = useAuth((s) => s.kullanici);
  const [kapali, setKapali] = useState(true);
  useEffect(() => { try { setKapali(sessionStorage.getItem("sc-kredi-uyari") === "1"); } catch { setKapali(false); } }, []);
  if (!k) return null;
  const kota = PLAN_AYLIK_KREDI[k.plan] ?? 0;
  const bitti = k.krediler <= 0;
  const az = kota > 0 && k.krediler / kota < 0.15;
  if (!bitti && (!az || kapali)) return null;
  return (
    <motion.div role="status" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="mb-2 flex items-center gap-2 rounded-[14px] bg-amber-300/[0.07] px-3.5 py-2 text-[13px] text-amber-100 ring-1 ring-inset ring-amber-300/20">
      <Coins className="h-4 w-4 shrink-0 text-amber-300" />
      <span className="min-w-0 flex-1">{bitti ? "Kredin bitti. Sohbet devam eder; görsel ve video gibi kredili işler için yükleme gerekir." : `Kredin azalıyor: ${k.krediler.toLocaleString("tr")} kredi kaldı (aylık ${kota.toLocaleString("tr")}).`}</span>
      <button onClick={() => useKrediModal.getState().ac("kredi")} className="h-7 shrink-0 rounded-full bg-amber-300 px-3 text-[12.5px] font-semibold text-[#2a1d00]">Kredi yükle</button>
      {!bitti && <button onClick={() => { setKapali(true); try { sessionStorage.setItem("sc-kredi-uyari", "1"); } catch { /* yoksay */ } }} aria-label="Kapat" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-white/[0.06]"><X className="h-3.5 w-3.5" /></button>}
    </motion.div>
  );
}
