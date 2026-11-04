"use client";

import { useState } from "react";
import { Check, FileLock2, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { girdiSinif } from "./ortak";
import { cn } from "@/lib/utils";

const BELGELER = [
  { id: "paket", ad: "Güvenlik değerlendirme paketi", ozet: "Doldurulmuş CAIQ ve SIG Lite anketleri", tur: "PDF · XLSX" },
  { id: "pentest", ad: "Sızma testi özeti", ozet: "Bağımsız firma, son 12 ay", tur: "PDF" },
  { id: "dpa", ad: "Veri işleme sözleşmesi (DPA)", ozet: "GDPR md. 28 ve KVKK uyumlu", tur: "PDF" },
  { id: "soc2", ad: "SOC 2 köprü mektubu", ozet: "Denetim süreci ve kapsam", tur: "PDF" },
  { id: "politika", ad: "Bilgi güvenliği politikaları", ozet: "Erişim, şifreleme, olay müdahalesi", tur: "PDF" },
];

/** Gizli güvenlik belgeleri için erişim talebi — NDA sonrası e-postayla paylaşılır. */
export function BelgeTalebi() {
  const [secili, setSecili] = useState<string[]>(["paket"]);
  const [email, setEmail] = useState("");
  const [sirket, setSirket] = useState("");
  const [durum, setDurum] = useState<"bos" | "gonderiliyor" | "tamam">("bos");
  const gecerli = secili.length > 0 && /^\S+@\S+\.\S+$/.test(email) && sirket.trim().length >= 2;

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gecerli) return;
    setDurum("gonderiliyor");
    try {
      const r = await fetch("/api/iletisim", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad: sirket, email, konu: "Güvenlik belgesi talebi", mesaj: `Talep edilen belgeler: ${BELGELER.filter((b) => secili.includes(b.id)).map((b) => b.ad).join(", ")}` }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.hata ?? "Sunucu isteği kabul etmedi. Biraz sonra yeniden dene.");
      setDurum("tamam");
    } catch (err) {
      setDurum("bos");
      toast.error("Talep gönderilemedi", { description: err instanceof Error && !(err instanceof TypeError) ? err.message : "Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip yeniden dene." });
    }
  };

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <div className="divide-y divide-white/[0.06] overflow-hidden rounded-[22px] border border-white/[0.07]">
        {BELGELER.map((b) => {
          const a = secili.includes(b.id);
          return (
            <label key={b.id} className="flex cursor-pointer items-center gap-4 bg-yuzey px-5 py-4 transition-colors hover:bg-[#151518]">
              <input type="checkbox" checked={a} onChange={() => setSecili(a ? secili.filter((x) => x !== b.id) : [...secili, b.id])} className="h-4 w-4 accent-[var(--vurgu-renk)]" />
              <FileLock2 className="h-5 w-5 shrink-0 text-metin-3" />
              <span className="min-w-0 flex-1"><span className="block text-[14.5px] font-medium text-white">{b.ad}</span><span className="block text-[12.5px] text-metin-3">{b.ozet}</span></span>
              <span className="shrink-0 text-[12px] text-metin-3">{b.tur}</span>
            </label>
          );
        })}
      </div>
      {durum === "tamam" ? (
        <div className="flex flex-col justify-center rounded-[22px] border border-white/[0.07] bg-yuzey p-7">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-tur-3d/15 text-tur-3d"><Check className="h-5 w-5" /></span>
          <p className="mt-4 text-[18px] font-semibold text-white">Talebin alındı</p>
          <p className="mt-2 text-[14px] leading-relaxed text-metin-2">Güvenlik ekibimiz 2 iş günü içinde gizlilik sözleşmesini (NDA) ve belgeleri {email} adresine gönderecek.</p>
        </div>
      ) : (
        <form onSubmit={gonder} className="flex flex-col rounded-[22px] border border-white/[0.07] bg-yuzey p-6">
          <p className="text-[15px] font-semibold text-white">Erişim iste</p>
          <p className="mt-1 text-[13px] leading-relaxed text-metin-2">Belgeler, gizlilik sözleşmesi imzalandıktan sonra e-postayla paylaşılır.</p>
          <input value={sirket} onChange={(e) => setSirket(e.target.value)} placeholder="Şirket" aria-label="Şirket" className={cn(girdiSinif, "mt-5")} />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="İş e-postası" aria-label="İş e-postası" className={cn(girdiSinif, "mt-2")} />
          <button disabled={!gecerli || durum === "gonderiliyor"} className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white text-[14px] font-semibold text-zemin hover:opacity-90 disabled:opacity-40">
            {durum === "gonderiliyor" ? <Loader2 className="h-4 w-4 animate-spin" /> : `${secili.length} belge iste`}
          </button>
        </form>
      )}
    </div>
  );
}
