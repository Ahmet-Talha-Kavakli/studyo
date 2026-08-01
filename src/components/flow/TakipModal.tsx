"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { X, Search } from "lucide-react";
import { flowVeri } from "@/lib/flow/seed";
import { useFlow } from "@/store/useFlow";
import { Avatar, KullaniciAdi } from "./UI";
import { TakipButon } from "./TakipButon";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";

/**
 * Takipçiler / Takip Ettikleri modalı — Instagram birebir.
 * tur: "takipci" (alt açıklama satırı) · "takip" (arama çubuğu).
 */
export function TakipModal({ tur, sahipKadi, kapat }: { tur: "takipci" | "takip"; sahipKadi: string; kapat: () => void }) {
  const s = useFlow();
  const e = flowVeri();
  const [q, setQ] = useState("");
  useScrollKilit(true);
  useEscKapat(true, kapat);

  // deterministik liste: takipçiler tüm kullanıcılardan, takip = kullanıcının takip ettikleri
  const liste = useMemo(() => {
    const hepsi = e.kullanicilar;
    if (tur === "takip") {
      const takipEdilen = hepsi.filter((k) => s.takipler[k.id]);
      return takipEdilen.length ? takipEdilen : hepsi.slice(0, 12);
    }
    return hepsi;
  }, [e, tur, s.takipler]);

  const filtreli = useMemo(() => {
    const t = q.toLowerCase();
    if (!t) return liste;
    return liste.filter((k) => k.kadi.toLowerCase().includes(t) || k.ad.toLowerCase().includes(t));
  }, [liste, q]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md" onClick={kapat}>
      <div className="flex max-h-[70vh] w-full max-w-[400px] flex-col overflow-hidden rounded-xl bg-[#262626]" onClick={(ev) => ev.stopPropagation()}>
        {/* başlık */}
        <div className="relative flex items-center justify-center border-b border-white/[0.1] py-3">
          <span className="text-[16px] font-bold">{tur === "takipci" ? "Takipçiler" : "Takip Ettikleri"}</span>
          <button onClick={kapat} className="absolute right-3 text-white/80 hover:text-white"><X className="h-6 w-6" /></button>
        </div>

        {/* takip: arama · takipçi: alt açıklama */}
        {tur === "takip" ? (
          <div className="p-3">
            <div className="flex items-center gap-2 rounded-lg bg-white/[0.06] px-3 py-2">
              <Search className="h-4 w-4 text-white/50" />
              <input value={q} onChange={(ev) => setQ(ev.target.value)} placeholder="Ara" className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-white/40" />
            </div>
          </div>
        ) : (
          <div className="px-4 py-2.5 text-center text-[13px] text-white/50">Sadece <b className="text-white">{sahipKadi}</b> tüm takipçileri görebilir.</div>
        )}

        {/* liste */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 [scrollbar-width:thin]">
          {filtreli.map((u) => (
            <div key={u.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/[0.04]">
              <Link href={`/flow/u/${u.kadi}`} onClick={kapat}><Avatar tohum={u.avatarTohum} ad={u.ad} boyut={44} /></Link>
              <div className="min-w-0 flex-1">
                <Link href={`/flow/u/${u.kadi}`} onClick={kapat}><KullaniciAdi kadi={u.kadi} onayli={u.onayli} className="text-[14px]" /></Link>
                <div className="truncate text-[13px] text-white/45">{u.ad}</div>
              </div>
              <TakipButon kullaniciId={u.id} kadi={u.kadi} boyut="buton" />
            </div>
          ))}
          {filtreli.length === 0 && <div className="py-8 text-center text-[14px] text-white/40">Sonuç yok</div>}
        </div>
      </div>
    </div>
  );
}
