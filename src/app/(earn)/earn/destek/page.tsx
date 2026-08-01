"use client";

import { useState } from "react";
import { LifeBuoy, Plus, Send, MessageSquare, X, ChevronRight } from "lucide-react";
import { useEarn } from "@/store/useEarn";
import { SayfaBaslik, Kart, DurumRozet, YesilDugme, cn } from "@/components/earn/UI";
import { toast } from "@/lib/toast";

const KATEGORILER = ["Ödeme & Çekim", "Kazanç onayı", "Hesap bağlama", "Teknik sorun", "Diğer"];

export default function Destek() {
  const s = useEarn();
  const [modal, setModal] = useState(false);
  const [acik, setAcik] = useState<string | null>(null);
  const [konu, setKonu] = useState("");
  const [kategori, setKategori] = useState(KATEGORILER[0]);
  const [mesaj, setMesaj] = useState("");
  const [yanit, setYanit] = useState("");

  const ac = () => {
    if (!konu.trim() || !mesaj.trim()) { toast.error("Konu ve mesaj gerekli."); return; }
    s.destekAc(konu.trim(), kategori, mesaj.trim());
    toast.success("Destek talebin oluşturuldu. Ekibimiz en kısa sürede yanıtlar.");
    setModal(false); setKonu(""); setMesaj("");
  };
  const yanitla = (id: string) => {
    if (!yanit.trim()) return;
    s.destekYanitla(id, yanit.trim());
    setYanit("");
  };

  const secili = s.destekTalepler.find((t) => t.id === acik);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <SayfaBaslik baslik="Destek" ozet="Kazanç, ödeme veya hesabınla ilgili her konuda yardım al."
        sag={<YesilDugme onClick={() => setModal(true)}><Plus className="mr-1 inline h-4 w-4" /> Yeni Talep</YesilDugme>} />

      {s.destekTalepler.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/[0.1] py-16 text-center">
          <LifeBuoy className="h-10 w-10 text-white/25" />
          <div className="text-[15px] font-semibold text-white">Henüz destek talebin yok</div>
          <p className="max-w-sm text-sm text-white/45">Bir sorun mu yaşıyorsun? Talep oluştur, ekibimiz yardımcı olsun.</p>
          <YesilDugme onClick={() => setModal(true)}>Talep Oluştur</YesilDugme>
        </div>
      ) : (
        <div className="space-y-2">
          {s.destekTalepler.map((t) => (
            <button key={t.id} onClick={() => setAcik(t.id)} className="flex w-full items-center justify-between rounded-2xl border border-white/[0.06] bg-[#14151799] backdrop-blur-xl p-4 text-left transition-colors hover:border-sky-400/25">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10"><MessageSquare className="h-4.5 w-4.5 text-sky-400" /></span>
                <div>
                  <div className="font-semibold text-white">{t.konu}</div>
                  <div className="text-xs text-white/45">{t.kategori} · {t.yanitlar.length} mesaj · {new Date(t.tarih).toLocaleDateString("tr")}</div>
                </div>
              </div>
              <div className="flex items-center gap-2"><DurumRozet durum={t.durum} /><ChevronRight className="h-4 w-4 text-white/30" /></div>
            </button>
          ))}
        </div>
      )}

      {/* yeni talep modal */}
      {modal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={() => setModal(false)}>
          <div className="w-full max-w-md rounded-3xl border border-white/[0.1] bg-[#14151799] shadow-2xl backdrop-blur-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between"><h3 className="font-bold text-white">Yeni Destek Talebi</h3><button onClick={() => setModal(false)} className="text-white/50"><X className="h-5 w-5" /></button></div>
            <label className="mb-1.5 block text-xs font-semibold text-white/60">Kategori</label>
            <div className="mb-3 flex flex-wrap gap-2">
              {KATEGORILER.map((k) => <button key={k} onClick={() => setKategori(k)} className={cn("rounded-lg border px-2.5 py-1.5 text-xs", kategori === k ? "border-sky-400/40 bg-sky-500/10 text-white" : "border-white/[0.08] text-white/50")}>{k}</button>)}
            </div>
            <label className="mb-1.5 block text-xs font-semibold text-white/60">Konu</label>
            <input value={konu} onChange={(e) => setKonu(e.target.value)} placeholder="Kısa başlık" className="mb-3 h-10 w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 text-sm text-white outline-none placeholder:text-white/30" />
            <label className="mb-1.5 block text-xs font-semibold text-white/60">Mesaj</label>
            <textarea value={mesaj} onChange={(e) => setMesaj(e.target.value)} rows={4} placeholder="Sorununu detaylıca anlat…" className="mb-4 w-full resize-none rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-white/30" />
            <YesilDugme onClick={ac} className="w-full">Talebi Gönder</YesilDugme>
          </div>
        </div>
      )}

      {/* talep detay modal */}
      {secili && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={() => setAcik(null)}>
          <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-3xl border border-white/[0.1] bg-[#14151799] shadow-2xl backdrop-blur-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/[0.06] p-4">
              <div><h3 className="font-bold text-white">{secili.konu}</h3><span className="text-xs text-white/45">{secili.kategori}</span></div>
              <button onClick={() => setAcik(null)} className="text-white/50"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {secili.yanitlar.map((y, i) => (
                <div key={i} className={cn("flex", y.kimden === "ben" ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[80%] rounded-2xl px-3.5 py-2 text-sm", y.kimden === "ben" ? "bg-sky-400 text-[#04141a]" : "bg-white/[0.06] text-white")}>
                    {y.metin}
                    <div className={cn("mt-0.5 text-[10px]", y.kimden === "ben" ? "text-[#04141a]/60" : "text-white/40")}>{new Date(y.tarih).toLocaleString("tr", { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                </div>
              ))}
            </div>
            {secili.durum !== "kapandi" && (
              <div className="flex items-center gap-2 border-t border-white/[0.06] p-3">
                <input value={yanit} onChange={(e) => setYanit(e.target.value)} onKeyDown={(e) => e.key === "Enter" && yanitla(secili.id)} placeholder="Yanıt yaz…" className="h-10 flex-1 rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 text-sm text-white outline-none placeholder:text-white/30" />
                <button onClick={() => yanitla(secili.id)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400 text-[#04141a]"><Send className="h-4 w-4" /></button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
