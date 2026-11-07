"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, PenLine, Users } from "lucide-react";
import { api, ApiHatasi, sahipAnahtari } from "@/lib/build/istemci";
import { ROL_AD, VARLIK_ARALIK, basHarfler, kisiRengi, sekmeYeri, type VarlikKisi } from "@/lib/build/ekipOrtak";
import type { ProjeErisim } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";

export const yay = { type: "spring" as const, stiffness: 460, damping: 38 };
export const ROL_IKON: Record<ProjeErisim, typeof Eye> = { sahip: Users, duzenleyici: PenLine, izleyici: Eye };

/** Kişi avatarı: baş harfler, kimlikten sabit yumuşak renk. */
export function KisiAvatari({ ad, oz, boyut = 28, className, cevrimici }: { ad: string; oz?: string; boyut?: number; className?: string; cevrimici?: boolean }) {
  const r = kisiRengi(oz || ad);
  return (
    <span className={cn("relative inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold", className)}
      style={{ width: boyut, height: boyut, background: r.zemin, color: r.yazi, fontSize: Math.max(9, Math.round(boyut * 0.38)) }} aria-hidden>
      {basHarfler(ad)}
      {cevrimici && <span className="absolute -bottom-px -right-px h-[9px] w-[9px] rounded-full bg-[#55d6fd] ring-2 ring-[#0b0b0d]" />}
    </span>
  );
}

/** Rol hapı (proje kartlarında ve listelerde). */
export function RolHapi({ rol, className, koyu }: { rol: ProjeErisim; className?: string; koyu?: boolean }) {
  const I = ROL_IKON[rol];
  return (
    <span className={cn("flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[11.5px] font-medium", koyu ? "bg-black/60 text-white/90 backdrop-blur" : "bg-white/[0.07] text-white/75", className)}>
      <I className="h-3 w-3" />{ROL_AD[rol]}
    </span>
  );
}

/** İzleyici şeridi: üst çubuğun altında ince bilgi. */
export function IzleyiciSeridi({ ekibiAc }: { ekibiAc?: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={yay}
      className="mx-3 mb-2 flex shrink-0 items-center gap-2 rounded-[12px] bg-white/[0.04] px-3 py-1.5 text-[12.5px] text-white/75 ring-1 ring-inset ring-white/[0.07]">
      <Eye className="h-3.5 w-3.5 shrink-0 text-[#7fe0ff]" />
      <span className="min-w-0 flex-1 truncate">Bu projede izleyicisin; değişiklik yapamazsın.</span>
      {ekibiAc && <button type="button" onClick={ekibiAc} className="shrink-0 rounded-full px-2 py-0.5 text-[12px] text-white/60 hover:bg-white/[0.07] hover:text-white">Ekibi gör</button>}
    </motion.div>
  );
}

/**
 * Kim burada: 15 saniyede bir nabız gönderir, çevrimiçi kişileri ve isteği yapanın güncel rolünü döndürür.
 * Sekme değişince hemen bildirir; sayfa kapanırken ayrıldığını söyler. Erişim kalktıysa (çıkarıldı) kaldirildi olur.
 */
export function useVarlik(projeId: string | null, sekme: string, ad: string | undefined) {
  const [kisiler, setKisiler] = useState<VarlikKisi[]>([]);
  const [rol, setRol] = useState<ProjeErisim | null>(null);
  const [kaldirildi, setKaldirildi] = useState(false);
  const son = useRef({ sekme, ad });
  useEffect(() => { son.current = { sekme, ad }; });
  const gonderRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!projeId) return;
    let iptal = false;
    const gonder = async () => {
      try {
        const v = await api<{ kisiler: VarlikKisi[]; rol: ProjeErisim }>(`/api/build/proje/${projeId}/varlik`, { govde: { ad: son.current.ad || "", sekme: son.current.sekme } });
        if (!iptal) { setKisiler(v.kisiler); setRol(v.rol); }
      } catch (e) { if (!iptal && e instanceof ApiHatasi && (e.durum === 404 || e.durum === 403)) setKaldirildi(true); }
    };
    gonderRef.current = gonder;
    // İlk nabız biraz gecikir: hızlı yeniden bağlanmada önceki "ayrıldı" bildirimi önce işlensin.
    const ilk = setTimeout(gonder, 300);
    const t = setInterval(gonder, VARLIK_ARALIK);
    const ayril = () => {
      try { fetch(`/api/build/proje/${projeId}/varlik`, { method: "POST", keepalive: true, headers: { "x-build-sahip": sahipAnahtari(), "Content-Type": "application/json" }, body: JSON.stringify({ ayril: true }) }).catch(() => {}); } catch { /* yok */ }
    };
    addEventListener("pagehide", ayril);
    return () => { iptal = true; clearTimeout(ilk); clearInterval(t); removeEventListener("pagehide", ayril); ayril(); };
  }, [projeId]);

  useEffect(() => { const t = setTimeout(() => gonderRef.current(), 500); return () => clearTimeout(t); }, [sekme]);
  return { kisiler, rol, kaldirildi };
}

/** Üst çubuktaki çevrimiçi kişiler: üst üste binen küçük avatarlar; üstüne gelince ad, rol ve sekme. */
export function VarlikAvatarlari({ kisiler, ekibiAc, enCok = 3 }: { kisiler: VarlikKisi[]; ekibiAc: () => void; enCok?: number }) {
  const digerleri = kisiler.filter((k) => !k.sen);
  const gorunen = digerleri.slice(0, enCok);
  const kalan = digerleri.length - gorunen.length;
  return (
    <div className="flex shrink-0 items-center" aria-label={digerleri.length ? `Çevrimiçi: ${digerleri.map((k) => k.ad).join(", ")}` : undefined}>
      <AnimatePresence initial={false}>
        {gorunen.map((k, i) => (
          <motion.span key={k.oz} layout initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={yay}
            className={cn("group relative", i > 0 && "-ml-2")}>
            <button type="button" onClick={ekibiAc} className="block rounded-full ring-2 ring-[#0b0b0d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" aria-label={`${k.ad}, ${ROL_AD[k.rol]}, ${sekmeYeri(k.sekme)}`}>
              <KisiAvatari ad={k.ad} oz={k.oz} boyut={28} />
            </button>
            <span role="tooltip" className="pointer-events-none absolute right-0 top-[calc(100%+8px)] z-50 w-max max-w-[220px] rounded-[12px] bg-[#1b1c1f] px-3 py-2 text-left opacity-0 ring-1 ring-inset ring-white/[0.1] transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100">
              <span className="block truncate text-[12.5px] font-medium text-white">{k.ad}</span>
              <span className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-white/55"><span className="h-1.5 w-1.5 rounded-full bg-[#55d6fd]" />{sekmeYeri(k.sekme)}</span>
              <span className="mt-0.5 block text-[11.5px] text-white/45">{ROL_AD[k.rol]}</span>
            </span>
          </motion.span>
        ))}
      </AnimatePresence>
      {kalan > 0 && (
        <button type="button" onClick={ekibiAc} title={digerleri.slice(enCok).map((k) => k.ad).join(", ")} className="-ml-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-white/[0.1] px-1.5 text-[11px] font-semibold tabular-nums text-white/80 ring-2 ring-[#0b0b0d]">+{kalan}</button>
      )}
    </div>
  );
}

/** Üst çubuktaki Ekip düğmesi (yanında avatarlar). */
export function EkipDugmesi({ ac, sayi }: { ac: () => void; sayi: number }) {
  return (
    <button type="button" onClick={ac} title="Ekip" className="flex h-9 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[13px] text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white active:scale-[0.97]">
      <Users className="h-4 w-4" /><span className="hidden md:inline">Ekip</span>
      {sayi > 0 && <span className="hidden min-w-[20px] rounded-full bg-white/[0.1] px-1.5 text-center text-[11px] font-semibold tabular-nums text-white/85 md:inline">{sayi}</span>}
    </button>
  );
}
