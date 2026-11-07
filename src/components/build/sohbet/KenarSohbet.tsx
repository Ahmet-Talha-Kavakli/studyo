"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MessageSquare, Pin } from "lucide-react";
import { studyoYenile } from "@/components/build/kabuk/useStudyo";
import { api } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { SohbetMenusu } from "./SohbetListesi";

/**
 * Kenar çubuğundaki sohbet satırı: üzerine gelince menü (adlandır, sabitle, arşivle, sil); adlandırma yerinde.
 * degisti(silindi) kenar çubuğunun listesini yeniler; açık sohbet silindiyse çağıran yönlendirir.
 */
export function KenarSohbetSatiri({ id, baslik, aktif, calisiyor, sabit, degisti }: { id: string; baslik: string; aktif: boolean; calisiyor?: boolean; sabit?: boolean; degisti: (silindi?: boolean) => void }) {
  const [ad, setAd] = useState<string | null>(null);
  const I = sabit ? Pin : MessageSquare;
  if (ad !== null) return (
    <form className="flex h-9 items-center px-1" onSubmit={async (e) => { e.preventDefault(); const b = ad.trim(); setAd(null); if (b && b !== baslik) { await api(`/api/build/sohbet/${id}`, { method: "PATCH", govde: { baslik: b } }).catch(() => {}); studyoYenile(); degisti(); } }}>
      <input autoFocus value={ad} onChange={(e) => setAd(e.target.value)} onBlur={(e) => e.currentTarget.form?.requestSubmit()} onKeyDown={(e) => { if (e.key === "Escape") setAd(null); }} maxLength={80} aria-label="Sohbetin adı"
        className="h-8 w-full rounded-[9px] bg-white/[0.07] px-2.5 text-[13.5px] text-white outline-none ring-1 ring-inset ring-[#55d6fd]/50" />
    </form>
  );
  return (
    <div className={cn("group/satir relative flex h-9 items-center rounded-[10px] transition-colors", aktif ? "bg-white/[0.08] text-white" : "text-white/65 hover:bg-white/[0.04] hover:text-white")}>
      <Link href={`/panel/build/sohbet/${id}`} title={baslik} className="flex h-full min-w-0 flex-1 items-center gap-2.5 pl-2.5 text-[13.5px]">
        <I className={cn("h-[15px] w-[15px] shrink-0", sabit ? "text-[#55d6fd]/80" : "opacity-60")} strokeWidth={1.8} />
        <span className="min-w-0 flex-1 truncate">{baslik}</span>
        {calisiyor && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#55d6fd]" />}
      </Link>
      <span className="shrink-0 pr-0.5">
        <SohbetMenusu o={{ id, baslik, sabit, guncelleme: 0, olusturma: 0, model: "", ozet: "", mesaj: 0 }} klasorler={[]} klasorsuz degisti={degisti} adlandir={() => setAd(baslik)} />
      </span>
    </div>
  );
}
