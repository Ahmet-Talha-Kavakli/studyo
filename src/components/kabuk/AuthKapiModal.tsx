"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useAuthKapi } from "@/store/useAuthKapi";
import { useScrollKilit } from "@/hooks/useScrollKilit";
import { AuthAkis } from "@/components/auth/AuthAkis";
import { AuthSahne } from "@/components/auth/AuthSahne";

/**
 * Giriş kapısı penceresi — /giris sayfasıyla aynı kart ve akış ("B · Odak"), sayfanın üstünde.
 * Başarılı girişte bekleyen eylem (useAuthKapi.bekleyenEylem) çalışır.
 * Çağıran özel başlık verdiyse ("Paylaşmak için giriş yap") o gösterilir.
 */
const VARSAYILAN = ["Vayra'ya hoş geldin", "Tekrar hoş geldin"];

export function AuthKapiModal() {
  const { acik, baslik, altBaslik, kapat, girisBasarili } = useAuthKapi();
  useScrollKilit(acik);
  const niyet = baslik === "Tekrar hoş geldin" ? "giris" : "kayit";
  const ozel = !VARSAYILAN.includes(baslik);

  useEffect(() => {
    if (!acik) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") kapat(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [acik, kapat]);

  return (
    <AnimatePresence>
      {acik && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto p-4" role="dialog" aria-modal="true" aria-label={ozel ? baslik : niyet === "giris" ? "Giriş yap" : "Kaydol"}>
          {/* Arka plan: /giris sayfasıyla aynı akan üretim duvarı (kullanıcı seçimi; karakter perdesi yerine) */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} onClick={kapat} className="fixed inset-0">
            <AuthSahne />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }} className="relative my-auto w-full max-w-[420px]">
            <span aria-hidden className="absolute -inset-10 -z-10 rounded-full bg-[#55d6fd]/[0.07] blur-3xl" />
            <div className="auth-cerceve rounded-[30px] p-px">
              <div className="relative rounded-[29px] bg-[#0d0d0f] px-6 py-8 sm:px-9 sm:py-10" style={{ ["--auth-zemin" as string]: "#0d0d0f" }}>
                <button onClick={kapat} aria-label="Kapat"
                  className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/[0.08] hover:text-white">
                  <X className="h-[18px] w-[18px]" />
                </button>
                <AuthAkis niyet={niyet} onTamam={girisBasarili} baslik={ozel ? baslik : undefined} altBaslik={ozel ? altBaslik : undefined} />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
