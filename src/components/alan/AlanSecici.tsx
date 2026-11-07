"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronsUpDown, Loader2, LogIn, Plus, Settings2, UserPlus } from "lucide-react";
import { useAlan } from "@/store/useAlan";
import { useAuth } from "@/store/useAuth";
import * as A from "@/lib/alan/istemci";
import { ROL_AD, type AlanOzet } from "@/lib/alan/tipler";
import { KullaniciAvatar } from "@/components/ui/KullaniciAvatar";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { AlanLogo, sayiYaz } from "./ortak";
import { YeniAlanPenceresi } from "./YeniAlanPenceresi";

/**
 * Alan seçici (Vercel, Linear, Lovable takım değiştiricisi dili): üst menüde logonun yanında etkin alanın logosu ve adı.
 * Menüde kişisel alan, üye olunan alanlar (rol ve üye sayısı), e-posta alan adıyla katılabilecek alan, yeni alan ve
 * alan ayarları. Seçili satır beyaz halkalı.
 */
export function AlanSecici({ className, mobil }: { className?: string; mobil?: boolean }) {
  const girisYapildi = useAuth((s) => s.girisYapildi);
  const { etkin, yuklendi } = useAlan();
  const [acik, setAcik] = useState(false);
  const [yeni, setYeni] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (girisYapildi && !yuklendi) void useAlan.getState().yukle(); }, [girisYapildi, yuklendi]);
  useEffect(() => {
    if (!acik) return;
    const f = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setAcik(false); };
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setAcik(false); };
    addEventListener("mousedown", f); addEventListener("keydown", k);
    return () => { removeEventListener("mousedown", f); removeEventListener("keydown", k); };
  }, [acik]);
  if (!girisYapildi) return null;
  return (
    <div ref={ref} className={cn("relative", className)}>
      <button type="button" onClick={() => { setAcik((v) => !v); if (!acik) void useAlan.getState().yukle(); }} aria-haspopup="menu" aria-expanded={acik}
        aria-label={`Çalışma alanı: ${etkin?.ad ?? "Kişisel"}`}
        className={cn("flex h-9 max-w-[220px] items-center gap-2 rounded-[11px] pl-1.5 pr-2 text-left transition-colors hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-[#55d6fd]/70", acik && "bg-white/[0.06]")}>
        {etkin ? <AlanLogo ad={etkin.ad} logo={etkin.logo} renk={etkin.renk} boyut={24} /> : <KullaniciAvatar boyut={24} />}
        <span className={cn("min-w-0 truncate text-[14px] font-medium text-white", mobil ? "hidden" : "hidden max-w-[150px] min-[1600px]:block")}>{etkin?.ad ?? "Kişisel"}</span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-white/45" />
      </button>
      <AnimatePresence>
        {acik && (
          <motion.div role="menu" initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className={cn("bd-panel z-50 origin-top-left overflow-hidden rounded-[20px] p-1.5", mobil ? "fixed inset-x-3 top-[58px]" : "absolute left-0 top-[calc(100%+8px)] w-[300px]")}>
            <AlanListesi kapat={() => setAcik(false)} yeniAc={() => { setAcik(false); setYeni(true); }} />
          </motion.div>
        )}
      </AnimatePresence>
      <YeniAlanPenceresi acik={yeni} onKapat={() => setYeni(false)} />
    </div>
  );
}

/** Menü içeriği: üst menüde ve hesap menüsünde aynı liste. */
export function AlanListesi({ kapat, yeniAc, sikistir }: { kapat: () => void; yeniAc: () => void; sikistir?: boolean }) {
  const kullanici = useAuth((s) => s.kullanici);
  const { alanlar, etkin, katilabilir, geciliyor } = useAlan();
  const gec = async (id: string | null) => { const ok = await useAlan.getState().gec(id); if (ok) kapat(); };
  const katil = async () => {
    if (!katilabilir) return;
    const r = await A.alanAdiylaKatil(katilabilir.id);
    if (!r.ok) return toast.error("Katılınamadı", { description: r.hata });
    await useAlan.getState().yukle();
    await useAlan.getState().gec(r.alan.id, true);
    toast.success(`${r.alan.ad} alanına katıldın`);
    kapat();
  };
  const Satir = ({ id, ad, alt, on }: { id: string | null; ad: string; alt: string; on: React.ReactNode }) => {
    const sec = (etkin?.id ?? null) === id;
    const bekle = geciliyor === (id ?? "kisisel");
    return (
      <button type="button" role="menuitemradio" aria-checked={sec} onClick={() => void gec(id)}
        className={cn("flex w-full items-center gap-3 rounded-[13px] px-2.5 py-2 text-left transition-colors hover:bg-white/[0.06]", sec && "outline outline-[1.5px] -outline-offset-[1.5px] outline-white")}>
        {on}
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[14px] font-medium text-white">{ad}</span>
          <span className="mt-0.5 block truncate text-[12px] text-white/50">{alt}</span>
        </span>
        {bekle && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white/50" />}
      </button>
    );
  };
  return (
    <div>
      {!sikistir && <p className="px-2.5 pb-1.5 pt-1.5 text-[12px] text-white/40">Çalışma alanları</p>}
      <Satir id={null} ad="Kişisel" alt={`${kullanici?.ad ?? "Sen"} · kişisel bakiye`} on={<KullaniciAvatar boyut={30} />} />
      <div className="max-h-[300px] overflow-y-auto [scrollbar-width:none]">
        {alanlar.map((a: AlanOzet) => (
          <Satir key={a.id} id={a.id} ad={a.ad} alt={`${ROL_AD[a.rol]} · ${sayiYaz(a.uyeSayisi)} üye${etkin?.id === a.id ? ` · ${sayiYaz(etkin.kredi.kullanilabilir)} kredi` : ""}`}
            on={<AlanLogo ad={a.ad} logo={a.logo} renk={a.renk} boyut={30} />} />
        ))}
      </div>
      {katilabilir && (
        <div className="mx-1 my-1.5 flex items-center gap-3 rounded-[13px] bg-[#55d6fd]/[0.07] px-2.5 py-2 ring-1 ring-inset ring-[#55d6fd]/20">
          <AlanLogo ad={katilabilir.ad} logo={katilabilir.logo} renk={katilabilir.renk} boyut={30} />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[13.5px] font-medium text-white">{katilabilir.ad}</span>
            <span className="mt-0.5 block truncate text-[12px] text-white/55">@{katilabilir.alanAdi} adresinle katılabilirsin</span>
          </span>
          <button type="button" onClick={() => void katil()} className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-white px-3 text-[12.5px] font-semibold text-black active:scale-[0.97]"><LogIn className="h-3.5 w-3.5" />Katıl</button>
        </div>
      )}
      <div className="mt-1 border-t border-white/[0.06] pt-1">
        <button type="button" onClick={yeniAc} className="flex h-10 w-full items-center gap-3 rounded-[12px] px-2.5 text-[13.5px] font-medium text-white/85 transition-colors hover:bg-white/[0.06] hover:text-white">
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-white/[0.06]"><Plus className="h-4 w-4" /></span>Yeni çalışma alanı
        </button>
        {etkin && (
          <>
            <Link href="/panel/ayarlar/alan/uyeler?davet=1" onClick={kapat} className="flex h-10 w-full items-center gap-3 rounded-[12px] px-2.5 text-[13.5px] font-medium text-white/85 transition-colors hover:bg-white/[0.06] hover:text-white">
              <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-white/[0.06]"><UserPlus className="h-4 w-4" /></span>Üye davet et
            </Link>
            <Link href="/panel/ayarlar/alan" onClick={kapat} className="flex h-10 w-full items-center gap-3 rounded-[12px] px-2.5 text-[13.5px] font-medium text-white/85 transition-colors hover:bg-white/[0.06] hover:text-white">
              <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-white/[0.06]"><Settings2 className="h-4 w-4" /></span>Alan ayarları
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
