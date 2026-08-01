"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Hash, X, Heart, MessageCircle, Play, Images } from "lucide-react";
import { onizlemeArka } from "@/lib/utils";
import { kesfetAkis, type FlowGonderi } from "@/lib/flow/seed";
import { flowVeri } from "@/lib/flow/seed";
import { sayiKisa } from "@/lib/flow/cekirdek";
import { Iskelet } from "@/components/ui/Iskelet";

/** Ara yükleme iskeleti — arama çubuğu + keşfet mozaik ızgarası izdüşümü. */
function AraIskelet() {
  return (
    <div className="mx-auto max-w-4xl px-3 py-4">
      <Iskelet className="mb-4 h-11 w-full rounded-xl" />
      <div className="grid grid-cols-3 gap-1">
        {Array.from({ length: 12 }).map((_, i) => <Iskelet key={i} className="aspect-square rounded-none" />)}
      </div>
    </div>
  );
}
import { HASHTAGLER } from "@/lib/flow/tablolar";
import { useFlow } from "@/store/useFlow";
import { YorumModal } from "@/components/flow/YorumModal";
import { Avatar, KullaniciAdi, cn } from "@/components/flow/UI";

function AraIc() {
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [secili, setSecili] = useState<FlowGonderi | null>(null);
  const [kisisel, setKisisel] = useState<"senin" | "genel">("senin");
  const s = useFlow();
  const e = flowVeri();
  useEffect(() => { const x = params.get("q"); if (x) setQ(x); }, [params]);

  const sonuc = useMemo(() => {
    const t = q.toLowerCase().replace("#", "");
    if (!t) return null;
    return {
      kullanicilar: e.kullanicilar.filter((k) => k.kadi.toLowerCase().includes(t) || k.ad.toLowerCase().includes(t)).slice(0, 10),
      hashtagler: HASHTAGLER.filter((h) => h.includes(t)).slice(0, 6),
    };
  }, [q, e]);

  // KEŞFET grid'i (arama boşken) — "senin için" takibe göre, "genel" kişiselleştirilmemiş
  const takipSet = useMemo(() => new Set(Object.keys(s.takipler).filter((k) => s.takipler[k])), [s.takipler]);
  const kesfet = useMemo(() => kesfetAkis(kisisel === "senin" ? takipSet : new Set()).filter((g) => !s.gizlenenler[g.id] && !s.engellenenler[g.sahipId]), [takipSet, kisisel, s.gizlenenler, s.engellenenler]);

  return (
    <div className="mx-auto max-w-[975px] px-1 py-6 md:px-4">
      {/* arama kutusu — büyük + apple glass (Instagram birebir) */}
      <div className="mx-auto mb-9 max-w-[640px] px-3 md:px-0">
        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 py-3.5 shadow-[0_4px_24px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-colors focus-within:border-white/[0.16] focus-within:bg-white/[0.06]">
          <Search className="h-5 w-5 text-white/50" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ara" className="flex-1 bg-transparent text-[16px] outline-none placeholder:text-white/40" />
          {q && <button onClick={() => setQ("")} className="text-white/40 hover:text-white/70"><X className="h-5 w-5" /></button>}
        </div>
      </div>

      {sonuc ? (
        /* ── ARAMA SONUÇLARI ── */
        <div className="mx-auto max-w-[600px] space-y-1 px-3 md:px-0">
          {sonuc.hashtagler.map((h) => (
            <Link key={h} href={`/flow/etiket/${h}`} className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-white/[0.06]">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.08]"><Hash className="h-5 w-5" /></span>
              <div><div className="text-[14px] font-semibold">#{h}</div><div className="text-[13px] text-white/45">{sayiKisa(tohumSayi(h))} gönderi</div></div>
            </Link>
          ))}
          {sonuc.kullanicilar.map((u) => (
            <Link key={u.id} href={`/flow/u/${u.kadi}`} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-white/[0.06]">
              <Avatar tohum={u.avatarTohum} ad={u.ad} boyut={44} />
              <div><KullaniciAdi kadi={u.kadi} onayli={u.onayli} className="text-[14px]" /><div className="text-[13px] text-white/45">{u.ad} · {sayiKisa(u.takipci)} takipçi</div></div>
            </Link>
          ))}
          {sonuc.kullanicilar.length === 0 && sonuc.hashtagler.length === 0 && <div className="py-10 text-center text-[14px] text-white/40">Sonuç bulunamadı</div>}
        </div>
      ) : (
        /* ── KEŞFET GRID (arama boşken) ── */
        <>
        <div className="mx-auto mb-4 flex max-w-[975px] items-center gap-5 px-1 text-[16px]">
          <button onClick={() => setKisisel("senin")} className={kisisel === "senin" ? "font-bold" : "text-white/45 hover:text-white/70"}>Senin için</button>
          <button onClick={() => setKisisel("genel")} className={kisisel === "genel" ? "font-bold" : "text-white/45 hover:text-white/70"}>Kişiselleştirilmemiş</button>
        </div>
        <div className="grid grid-cols-3 gap-0.5 md:gap-1">
          {kesfet.map((g, i) => {
            const buyuk = i % 10 === 4;
            return (
              <button key={g.id} onClick={() => setSecili(g)}
                className={cn("group relative overflow-hidden", buyuk ? "col-span-1 row-span-2 aspect-[1/2]" : "aspect-square")}
                style={{ background: onizlemeArka(g.medya[0].tohum, g.medya[0].kat) }}>
                {g.tur === "reels" && g.medya[0].video && (
                  <video src={`/gercek/preset-video/${g.medya[0].video}.mp4`} muted loop playsInline autoPlay className="absolute inset-0 h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                )}
                {g.tur === "reels" && <Play className="absolute right-2 top-2 h-4 w-4 fill-white text-white drop-shadow" />}
                {g.tur === "carousel" && <Images className="absolute right-2 top-2 h-4 w-4 text-white drop-shadow" />}
                <div className="absolute inset-0 flex items-center justify-center gap-5 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="flex items-center gap-1.5 font-semibold"><Heart className="h-5 w-5 fill-white" />{sayiKisa(g.begeni)}</span>
                  <span className="flex items-center gap-1.5 font-semibold"><MessageCircle className="h-5 w-5 -scale-x-100 fill-white" />{sayiKisa(g.yorumSayisi)}</span>
                </div>
              </button>
            );
          })}
        </div>
        </>
      )}
      {secili && <YorumModal gonderi={secili} kapat={() => setSecili(null)} />}
    </div>
  );
}

function tohumSayi(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return 1000 + (h % 90000); }

export default function AraPage() {
  return <Suspense fallback={<AraIskelet />}><AraIc /></Suspense>;
}
