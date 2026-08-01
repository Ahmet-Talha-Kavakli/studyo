"use client";

import { useState } from "react";
import Link from "next/link";
import { Link2, Check, ShieldCheck, X, Loader2, Unlink } from "lucide-react";
import { useEarn, PLATFORMLAR, type Platform } from "@/store/useEarn";
import { SayfaBaslik, Kart, Rozet, YesilDugme, cn } from "@/components/earn/UI";
import { toast } from "@/lib/toast";

export default function HesapBaglama() {
  const s = useEarn();
  const [modal, setModal] = useState<Platform | null>(null);
  const [kadi, setKadi] = useState("");
  const [dogrulaniyor, setDogrulaniyor] = useState<Platform | null>(null);

  const bagla = () => {
    if (!modal || !kadi.trim()) { toast.error("Kullanıcı adını gir."); return; }
    s.hesapBagla(modal, kadi.trim());
    toast.success("Hesap bağlandı. Şimdi doğrula.");
    setModal(null); setKadi("");
  };

  const dogrula = (p: Platform) => {
    setDogrulaniyor(p);
    // gerçekçi doğrulama akışı: 2sn "kod kontrol ediliyor"
    setTimeout(() => { s.hesapDogrula(p); setDogrulaniyor(null); toast.success("Hesap doğrulandı"); }, 2000);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <SayfaBaslik baslik="Hesap Bağlama" ozet="Sosyal hesaplarını bağla ve doğrula — paylaşım kazancı için gerekli." />

      <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-sky-400/20 bg-sky-500/[0.06] p-4 text-sm text-white/70">
        <ShieldCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-sky-400" />
        <p>Hesabını bağlayıp doğruladıktan sonra o platformda yaptığın paylaşımları kazanç için gönderebilirsin. Doğrulama, hesabın gerçekten sana ait olduğunu teyit eder.</p>
      </div>

      <div className="space-y-3">
        {PLATFORMLAR.map((p) => {
          const bagli = s.bagliHesaplar.find((h) => h.platform === p.id);
          const dogr = dogrulaniyor === p.id;
          return (
            <Kart key={p.id}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold" style={{ background: `${p.renk}20`, color: p.renk }}>{p.ad[0]}</span>
                  <div>
                    <div className="font-semibold text-white">{p.ad}</div>
                    {bagli ? (
                      <div className="flex items-center gap-2 text-xs text-white/45">
                        @{bagli.kullaniciAdi} · {bagli.takipci.toLocaleString("tr-TR")} takipçi
                        {bagli.dogrulandi ? <Rozet ton="yesil"><Check className="h-3 w-3" /> Doğrulandı</Rozet> : <Rozet ton="sari">Doğrulanmadı</Rozet>}
                      </div>
                    ) : <div className="text-xs text-white/40">Bağlı değil</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!bagli ? (
                    <YesilDugme onClick={() => setModal(p.id)} tur="hafif"><Link2 className="mr-1 inline h-4 w-4" /> Bağla</YesilDugme>
                  ) : !bagli.dogrulandi ? (
                    <YesilDugme onClick={() => dogrula(p.id)} disabled={dogr}>{dogr ? <><Loader2 className="mr-1 inline h-4 w-4 animate-spin" /> Doğrulanıyor</> : "Doğrula"}</YesilDugme>
                  ) : (
                    <>
                      <Link href="/earn/sosyal" className="rounded-xl bg-sky-400 px-3.5 py-2 text-sm font-bold text-[#04141a] hover:bg-sky-300">Paylaşım Gönder</Link>
                      <button onClick={() => { s.hesapKaldir(p.id); toast.success("Bağlantı kaldırıldı"); }} className="flex items-center gap-1 rounded-xl border border-white/[0.1] px-3 py-2 text-sm text-white/50 hover:text-rose-400"><Unlink className="h-4 w-4" /> Kaldır</button>
                    </>
                  )}
                </div>
              </div>
            </Kart>
          );
        })}
      </div>

      {/* bağla modal */}
      {modal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={() => setModal(null)}>
          <div className="w-full max-w-sm rounded-3xl border border-white/[0.1] bg-[#14151799] shadow-2xl backdrop-blur-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-white">{PLATFORMLAR.find((p) => p.id === modal)?.ad} bağla</h3>
              <button onClick={() => setModal(null)} className="text-white/50"><X className="h-5 w-5" /></button>
            </div>
            <label className="mb-1.5 block text-xs font-semibold text-white/60">Kullanıcı adın</label>
            <input value={kadi} onChange={(e) => setKadi(e.target.value)} onKeyDown={(e) => e.key === "Enter" && bagla()} autoFocus placeholder="@kullaniciadi" className="mb-4 h-11 w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 text-sm text-white outline-none placeholder:text-white/30" />
            <YesilDugme onClick={bagla} className="w-full">Bağla</YesilDugme>
          </div>
        </div>
      )}
    </div>
  );
}
