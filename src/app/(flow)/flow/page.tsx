"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { seninIcinAkis, flowVeri, kullaniciBul, type FlowGonderi } from "@/lib/flow/seed";
import { sayiKisa } from "@/lib/flow/cekirdek";
import { useFlow } from "@/store/useFlow";
import { useAuth } from "@/store/useAuth";
import { Gonderi } from "@/components/flow/Gonderi";
import { YorumModal } from "@/components/flow/YorumModal";
import { StoryCubugu, StoryGoruntuleyici } from "@/components/flow/Story";
import { Avatar, KullaniciAdi, MaviDugme, cn } from "@/components/flow/UI";

export default function FlowAnaSayfa() {
  const s = useFlow();
  const { kullanici } = useAuth();
  const [sekme, setSekme] = useState<"senin" | "takip">("senin");
  const [yorumGonderi, setYorumGonderi] = useState<FlowGonderi | null>(null);
  const [storyId, setStoryId] = useState<string | null>(null);

  const takipSet = useMemo(() => new Set(Object.keys(s.takipler).filter((k) => s.takipler[k])), [s.takipler]);
  const gizliSet = useMemo(() => new Set([...Object.keys(s.gizlenenler).filter((k) => s.gizlenenler[k])]), [s.gizlenenler]);
  const engelliSet = useMemo(() => new Set(Object.keys(s.engellenenler).filter((k) => s.engellenenler[k])), [s.engellenenler]);

  const akis = useMemo(() => {
    const tum = seninIcinAkis(undefined, takipSet.size ? takipSet : undefined);
    const filtreli = tum.filter((g) => !gizliSet.has(g.id) && !engelliSet.has(g.sahipId));
    if (sekme === "takip") return filtreli.filter((g) => takipSet.has(g.sahipId)).sort((a, b) => b.zaman - a.zaman);
    return filtreli;
  }, [sekme, takipSet, gizliSet, engelliSet]);

  // sağ öneri paneli
  const oneriler = useMemo(() => flowVeri().kullanicilar.filter((k) => !takipSet.has(k.id)).slice(0, 5), [takipSet]);

  return (
    <div className="mx-auto flex max-w-[935px] gap-8 px-2 py-4 lg:px-6">
      {/* ana kolon */}
      <div className="mx-auto w-full max-w-[470px]">
        {/* sekme */}
        <div className="mb-1 flex justify-center gap-8 border-b border-white/[0.08] pb-3 md:hidden">
          <button onClick={() => setSekme("senin")} className={cn("text-[15px]", sekme === "senin" ? "font-bold" : "text-white/50")}>Senin için</button>
          <button onClick={() => setSekme("takip")} className={cn("text-[15px]", sekme === "takip" ? "font-bold" : "text-white/50")}>Takip ettiklerin</button>
        </div>
        <div className="mb-1 hidden justify-start gap-6 md:flex">
          <button onClick={() => setSekme("senin")} className={cn("text-[15px]", sekme === "senin" ? "font-bold" : "text-white/50")}>Senin için</button>
          <button onClick={() => setSekme("takip")} className={cn("text-[15px]", sekme === "takip" ? "font-bold" : "text-white/50")}>Takip ettiklerin</button>
        </div>

        <StoryCubugu onAc={setStoryId} />

        <div className="pt-4">
          {akis.length === 0 ? (
            <div className="py-20 text-center text-[14px] text-white/45">{sekme === "takip" ? "Takip ettiklerinden yeni gönderi yok. Arama'ya göz at 👀" : "Gönderi yok."}</div>
          ) : akis.map((g) => <Gonderi key={g.id} g={g} onYorum={setYorumGonderi} />)}
        </div>
      </div>

      {/* sağ öneri paneli (desktop) */}
      <aside className="hidden w-[320px] shrink-0 pt-6 lg:block">
        <div className="mb-5 flex items-center gap-3">
          <Avatar tohum={kullanici?.email ?? "ben"} ad={kullanici?.ad} boyut={44} />
          <div className="flex-1">
            <div className="text-[14px] font-semibold">{kullanici?.ad?.toLowerCase().replace(/\s/g, "_") ?? "sen"}</div>
            <div className="text-[14px] text-white/50">{kullanici?.ad ?? "Vayra Kullanıcısı"}</div>
          </div>
          <Link href="/flow/dogrulama" className="text-[12px] font-semibold text-[#0095f6]">Geç</Link>
        </div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[14px] font-semibold text-white/50">Senin için önerilenler</span>
          <Link href="/flow/oneriler" className="text-[12px] font-semibold">Tümünü gör</Link>
        </div>
        <div className="space-y-3">
          {oneriler.map((u) => (
            <div key={u.id} className="flex items-center gap-3">
              <Avatar tohum={u.avatarTohum} ad={u.ad} boyut={40} />
              <div className="min-w-0 flex-1">
                <Link href={`/flow/u/${u.kadi}`}><KullaniciAdi kadi={u.kadi} onayli={u.onayli} className="text-[13px]" /></Link>
                <div className="truncate text-[12px] text-white/45">{sayiKisa(u.takipci)} takipçi</div>
              </div>
              <button onClick={() => s.takipEt(u.id)} className="text-[12px] font-semibold text-[#0095f6] hover:text-white">{s.takipler[u.id] ? "Takip ediliyor" : "Takip et"}</button>
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-2 text-[11px] text-white/30">
          <div>Hakkında · Yardım · API · Gizlilik · Koşullar</div>
          <div>© 2026 VAYRA FLOW</div>
        </div>
      </aside>

      {yorumGonderi && <YorumModal gonderi={yorumGonderi} kapat={() => setYorumGonderi(null)} />}
      {storyId && <StoryGoruntuleyici baslangicId={storyId} kapat={() => setStoryId(null)} />}
    </div>
  );
}
