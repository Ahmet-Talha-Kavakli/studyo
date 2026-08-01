"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Search, Zap, LogOut, User, Settings, Check, Gift, ArrowRight } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/store/useAuth";
import { useBildirim } from "@/store/useBildirim";
import { formatKredi } from "@/lib/utils";
import { cn } from "@/lib/utils";

function zamanFarki(t: number) {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "az önce";
  if (s < 3600) return `${Math.floor(s / 60)} dk önce`;
  if (s < 86400) return `${Math.floor(s / 3600)} sa önce`;
  return `${Math.floor(s / 86400)} gün önce`;
}

export function Topbar() {
  const router = useRouter();
  const { kullanici, cikisYap } = useAuth();
  const { bildirimler, okunduIsaretle, tumunuOku } = useBildirim();
  const [zilAcik, setZilAcik] = useState(false);
  const [profilAcik, setProfilAcik] = useState(false);

  const okunmamis = bildirimler.filter((b) => !b.okundu).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/10 bg-ink-900/70 px-6 backdrop-blur-xl">
      {/* Arama */}
      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <input
          placeholder="Model, araç veya proje ara…"
          className="h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-white/35 focus:border-vayra-400/50 focus:bg-white/8"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Kredi */}
        <Tooltip label="Kalan kredin — yükseltmek için tıkla">
          <Link
            href="/panel/kredi"
            className="flex h-10 items-center gap-1.5 rounded-xl border border-amber-glow/25 bg-amber-glow/10 px-3 text-sm font-semibold text-amber-glow transition-colors hover:bg-amber-glow/20"
          >
            <Zap className="h-4 w-4" />
            {formatKredi(kullanici?.krediler ?? 0)}
          </Link>
        </Tooltip>

        {/* Bildirim zili */}
        <div className="relative">
          <Tooltip label="Bildirimler">
            <button
              onClick={() => { setZilAcik((v) => !v); setProfilAcik(false); }}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-white/60 transition-colors hover:bg-white/8 hover:text-white"
              aria-label="Bildirimler"
            >
              <Bell className="h-5 w-5" />
              {okunmamis > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-vayra-500 px-1 text-[10px] font-bold text-white">
                  {okunmamis}
                </span>
              )}
            </button>
          </Tooltip>

          <AnimatePresence>
            {zilAcik && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setZilAcik(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  className="menu-surface absolute right-0 top-12 z-50 w-80 rounded-2xl p-2 shadow-2xl shadow-black/50"
                >
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-sm font-semibold">Bildirimler</span>
                    {okunmamis > 0 && (
                      <button onClick={tumunuOku} className="flex items-center gap-1 text-xs text-vayra-300 hover:text-vayra-200">
                        <Check className="h-3 w-3" /> Tümünü oku
                      </button>
                    )}
                  </div>

                  {/* Ödül promosyon kartı (Higgsfield tarzı) */}
                  <button
                    onClick={() => { setZilAcik(false); router.push("/panel/ayarlar?sekme=oduller"); }}
                    className="group relative mb-1.5 flex w-full items-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500/20 via-emerald-400/10 to-transparent p-3 text-left transition-all hover:from-emerald-500/30"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl glass-ikon glass-ikon-yesil">
                      <Gift className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-tight">Ödüllerin yakında açılıyor</p>
                      <p className="mt-0.5 text-xs text-white/55">Görevleri tamamla, bonus kredi kazan.</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-emerald-300 transition-transform group-hover:translate-x-0.5" />
                  </button>

                  <div className="max-h-80 overflow-y-auto">
                    {bildirimler.length === 0 ? (
                      <p className="px-2 py-8 text-center text-sm text-white/40">Bildirim yok</p>
                    ) : (
                      bildirimler.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => okunduIsaretle(b.id)}
                          className={cn(
                            "flex w-full gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-white/6",
                            !b.okundu && "bg-vayra-500/8",
                          )}
                        >
                          <span className={cn(
                            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                            b.tur === "basari" ? "bg-emerald-400" : b.tur === "uyari" ? "bg-amber-glow" : "bg-vayra-400",
                          )} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium leading-tight">{b.baslik}</p>
                            <p className="mt-0.5 text-xs text-white/50">{b.mesaj}</p>
                            <p className="mt-1 text-[11px] text-white/30">{zamanFarki(b.zaman)}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Profil */}
        <div className="relative">
          <button
            onClick={() => { setProfilAcik((v) => !v); setZilAcik(false); }}
            className="flex h-10 items-center gap-2 rounded-xl pl-1 pr-2.5 transition-colors hover:bg-white/8"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-vayra-400 to-vayra-600 text-sm font-semibold">
              {(kullanici?.ad ?? "V").charAt(0).toUpperCase()}
            </span>
            <span className="hidden text-sm font-medium sm:block">{kullanici?.ad ?? "Misafir"}</span>
          </button>

          <AnimatePresence>
            {profilAcik && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfilAcik(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  className="menu-surface absolute right-0 top-12 z-50 w-56 rounded-2xl p-2 shadow-2xl shadow-black/50"
                >
                  <div className="border-b border-white/10 px-3 py-2.5">
                    <p className="text-sm font-medium">{kullanici?.ad}</p>
                    <p className="text-xs text-white/45">{kullanici?.email}</p>
                    <span className="mt-1.5 inline-block rounded-full bg-vayra-500/20 px-2 py-0.5 text-[11px] font-medium capitalize text-vayra-200">
                      {kullanici?.plan} planı
                    </span>
                  </div>
                  <div className="pt-1">
                    <Link href="/panel/ayarlar" onClick={() => setProfilAcik(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-white/8">
                      <User className="h-4 w-4 text-white/60" /> Profilim
                    </Link>
                    <Link href="/panel/ayarlar" onClick={() => setProfilAcik(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-white/8">
                      <Settings className="h-4 w-4 text-white/60" /> Ayarlar
                    </Link>
                    <button
                      onClick={() => { cikisYap(); router.push("/"); }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/10"
                    >
                      <LogOut className="h-4 w-4" /> Çıkış yap
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
