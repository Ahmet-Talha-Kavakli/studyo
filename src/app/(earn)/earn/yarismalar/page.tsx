"use client";

import { useState } from "react";
import { Trophy, Clock, Users, Send, Award, X } from "lucide-react";
import { useEarn, tl, type Yarisma } from "@/store/useEarn";
import { YARISMALAR } from "@/lib/earn/katalog";
import { SayfaBaslik, Kart, DurumRozet, YesilDugme, Rozet, cn } from "@/components/earn/UI";
import { toast } from "@/lib/toast";

export default function Yarismalar() {
  const s = useEarn();
  const [modal, setModal] = useState<Yarisma | null>(null);
  const [link, setLink] = useState("");

  const gunKaldi = (t: number) => Math.max(0, Math.ceil((t - Date.now()) / 864e5));
  const katilimBul = (yid: string) => s.yarismaKatilimlar.find((k) => k.yarismaId === yid);

  const katil = () => {
    if (!modal || !link.trim()) { toast.error("İçerik linkini gir."); return; }
    s.yarismaKatil(modal, link.trim());
    toast.success("Yarışmaya katıldın! Değerlendirme sonrası sıralaman belli olacak.");
    setModal(null); setLink("");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <SayfaBaslik baslik="Yarışmalar" ozet="Temalı yarışmalara katıl, ödül havuzundan pay kazan. Creator Fund'a giden yol." />

      <div className="space-y-4">
        {YARISMALAR.map((y) => {
          const k = katilimBul(y.id);
          const aktif = y.durum === "aktif";
          return (
            <Kart key={y.id} className={cn(!aktif && "opacity-70")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {aktif ? <Rozet ton="yesil">Aktif</Rozet> : <Rozet>Bitti</Rozet>}
                    {aktif && <span className="flex items-center gap-1 text-[11px] text-white/40"><Clock className="h-3 w-3" /> {gunKaldi(y.bitis)} gün kaldı</span>}
                    <span className="flex items-center gap-1 text-[11px] text-white/40"><Users className="h-3 w-3" /> {y.katilimci} katılımcı</span>
                  </div>
                  <h3 className="mt-2 flex items-center gap-2 text-lg font-bold text-white"><Trophy className="h-5 w-5 text-sky-400" /> {y.ad}</h3>
                  <p className="mt-1 text-sm text-white/55">Tema: {y.tema}</p>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-white/40">Ödül havuzu</div>
                  <div className="text-xl font-bold text-sky-300">{tl(y.odulHavuzu)}</div>
                  <div className="text-[11px] text-white/40">{y.odulHavuzu.toLocaleString("tr-TR")} kredi</div>
                </div>
              </div>

              {/* ödül dağılımı */}
              <div className="mt-3 flex flex-wrap gap-2 border-t border-white/[0.06] pt-3 text-xs">
                <span className="rounded-lg bg-amber-500/10 px-2.5 py-1 font-semibold text-amber-300">1.: %40</span>
                <span className="rounded-lg bg-white/[0.05] px-2.5 py-1 font-semibold text-white/70">2.: %25</span>
                <span className="rounded-lg bg-orange-500/10 px-2.5 py-1 font-semibold text-orange-300">3.: %15</span>
                <span className="rounded-lg bg-white/[0.05] px-2.5 py-1 text-white/50">4-10.: kalan pay</span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                {k ? (
                  <div className="flex items-center gap-2">
                    <DurumRozet durum={k.durum} />
                    {k.siralama && <span className="flex items-center gap-1 text-xs text-sky-300"><Award className="h-3.5 w-3.5" /> {k.siralama}. sıra</span>}
                  </div>
                ) : <span className="text-xs text-white/40">{aktif ? "Katılmadın" : "Katılım kapandı"}</span>}
                {aktif && !k && <YesilDugme onClick={() => setModal(y)}>Katıl</YesilDugme>}
                {k && <span className="text-xs text-white/40">{k.oy} oy</span>}
              </div>
            </Kart>
          );
        })}
      </div>

      {/* katıl modal */}
      {modal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={() => setModal(null)}>
          <div className="w-full max-w-md rounded-3xl border border-white/[0.1] bg-[#14151799] shadow-2xl backdrop-blur-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 flex items-center justify-between">
              <h3 className="font-bold text-white">{modal.ad}</h3>
              <button onClick={() => setModal(null)} className="text-white/50"><X className="h-5 w-5" /></button>
            </div>
            <p className="mb-4 text-xs text-white/50">Tema: {modal.tema}</p>
            <label className="mb-1.5 block text-xs font-semibold text-white/60">Yarışma içeriğinin linki</label>
            <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Flow gönderisi veya yayın linki" className="mb-4 h-10 w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 text-sm text-white outline-none placeholder:text-white/30" />
            <YesilDugme onClick={katil} className="w-full"><Send className="mr-1 inline h-4 w-4" /> Yarışmaya Katıl</YesilDugme>
          </div>
        </div>
      )}
    </div>
  );
}
