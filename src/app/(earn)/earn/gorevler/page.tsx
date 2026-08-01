"use client";

import { useState } from "react";
import Link from "next/link";
import { Target, Clock, Users, Send, Check } from "lucide-react";
import { useEarn, tl, type Gorev } from "@/store/useEarn";
import { ACIK_GOREVLER } from "@/lib/earn/katalog";
import { SayfaBaslik, Kart, DurumRozet, YesilDugme, Rozet, cn } from "@/components/earn/UI";
import { toast } from "@/lib/toast";

export default function Gorevler() {
  const s = useEarn();
  const [teslimModal, setTeslimModal] = useState<string | null>(null);
  const [link, setLink] = useState("");

  const basvurBul = (gorevId: string) => s.gorevBasvurular.find((b) => b.gorevId === gorevId);

  const gunKaldi = (t: number) => Math.max(0, Math.ceil((t - Date.now()) / 864e5));

  const basvur = (g: Gorev) => { s.gorevBasvur(g); toast.success("Göreve başvuruldu. Şimdi teslim edebilirsin."); };
  const teslimEt = () => {
    const b = s.gorevBasvurular.find((x) => x.gorevId === teslimModal);
    if (!b || !link.trim()) { toast.error("Teslim linkini gir."); return; }
    s.gorevTeslim(b.id, link.trim());
    toast.success("Teslim edildi — moderasyon onayı sonrası ödül yatar.");
    setTeslimModal(null); setLink("");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <SayfaBaslik baslik="Görev Pazarı" ozet="Vayra'nın açtığı özel görevleri tamamla, sabit ödül kazan." />

      <div className="space-y-3">
        {ACIK_GOREVLER.map((g) => {
          const b = basvurBul(g.id);
          return (
            <Kart key={g.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Rozet ton="yesil">{g.kategori}</Rozet>
                    <span className="flex items-center gap-1 text-[11px] text-white/40"><Clock className="h-3 w-3" /> {gunKaldi(g.sonTarih)} gün kaldı</span>
                    <span className="flex items-center gap-1 text-[11px] text-white/40"><Users className="h-3 w-3" /> {g.kotaKalan} kişilik kota</span>
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-white">{g.baslik}</h3>
                  <p className="mt-1 text-sm text-white/55">{g.aciklama}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-sky-300">+{g.odul.toLocaleString("tr-TR")}</div>
                  <div className="text-[11px] text-white/40">{tl(g.odul)} · {g.xp.toLocaleString("tr-TR")} XP</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
                {b ? <DurumRozet durum={b.durum} /> : gunKaldi(g.sonTarih) === 0 || g.kotaKalan === 0 ? <span className="text-xs text-rose-300">Kapandı</span> : <span className="text-xs text-white/40">Henüz başvurmadın</span>}
                {!b ? (
                  gunKaldi(g.sonTarih) === 0 || g.kotaKalan === 0
                    ? <span className="rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm font-bold text-white/30">Süre/kota doldu</span>
                    : <YesilDugme onClick={() => basvur(g)} tur="hafif">Göreve Başvur</YesilDugme>
                ) : b.durum === "taslak" ? (
                  <YesilDugme onClick={() => setTeslimModal(g.id)}>İçeriği Teslim Et</YesilDugme>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-sky-300"><Check className="h-3.5 w-3.5" /> Teslim edildi</span>
                )}
              </div>
            </Kart>
          );
        })}
      </div>

      {/* teslim modal */}
      {teslimModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={() => setTeslimModal(null)}>
          <div className="w-full max-w-md rounded-3xl border border-white/[0.1] bg-[#14151799] p-5 shadow-2xl backdrop-blur-2xl" onClick={(e) => e.stopPropagation()}>
            {(() => { const gr = ACIK_GOREVLER.find((x) => x.id === teslimModal); return gr ? (
              <>
                <h3 className="font-bold text-white">İçeriği Teslim Et</h3>
                <p className="mt-0.5 mb-3 text-sm text-sky-300">{gr.baslik}</p>
                <div className="mb-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-white/60">
                  <p className="mb-1 font-semibold text-white/80">Gereksinim</p>{gr.aciklama}
                </div>
                <div className="mb-3 flex items-center gap-2 text-xs text-white/50">
                  Henüz üretmedin mi? <Link href="/flow/olustur" className="font-semibold text-sky-400">Flow'da üret →</Link>
                </div>
              </>
            ) : <h3 className="mb-3 font-bold text-white">İçeriği Teslim Et</h3>; })()}
            <label className="mb-1.5 block text-xs font-semibold text-white/60">Yayınladığın içeriğin linki</label>
            <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" className="mb-4 h-10 w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-sky-400/40 placeholder:text-white/30" />
            <div className="flex gap-2">
              <button onClick={() => setTeslimModal(null)} className="flex-1 rounded-xl border border-white/[0.12] py-2.5 text-sm text-white/60 hover:bg-white/[0.04]">Vazgeç</button>
              <YesilDugme onClick={teslimEt} className="flex-1"><Send className="mr-1 inline h-4 w-4" /> Teslim Et</YesilDugme>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
