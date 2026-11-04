"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { girdiSinif, etiketSinif } from "./ortak";
import { cn } from "@/lib/utils";

export const PROGRAMLAR = ["Kreatör ortaklığı", "Ajans ortaklığı", "Teknoloji ve API", "Eğitim kurumu"] as const;
type Program = (typeof PROGRAMLAR)[number];

/** Partner başvurusu — /api/iletisim'e "İş ortaklığı" konusuyla gider. */
export function PartnerFormu() {
  const [program, setProgram] = useState<Program>("Kreatör ortaklığı");
  const [f, setF] = useState({ ad: "", email: "", kurum: "", web: "", kitle: "", neden: "" });
  const [durum, setDurum] = useState<"bos" | "gonderiliyor" | "tamam">("bos");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const kreator = program === "Kreatör ortaklığı";
  const gecerli = f.ad.trim().length >= 3 && /^\S+@\S+\.\S+$/.test(f.email) && /^https?:\/\/\S+\.\S+/.test(f.web) && f.neden.trim().length >= 20;

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gecerli) return;
    setDurum("gonderiliyor");
    try {
      const r = await fetch("/api/iletisim", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ad: f.ad, email: f.email, konu: `İş ortaklığı · ${program}`,
          mesaj: [`Kurum/kanal: ${f.kurum || "-"}`, `Web/profil: ${f.web}`, `${kreator ? "Takipçi" : "Ekip/müşteri"}: ${f.kitle || "-"}`, "", f.neden.trim()].join("\n"),
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.hata ?? "Sunucu isteği kabul etmedi. Biraz sonra yeniden dene.");
      setDurum("tamam");
    } catch (err) {
      setDurum("bos");
      toast.error("Başvuru gönderilemedi", { description: err instanceof Error && !(err instanceof TypeError) ? err.message : "Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip yeniden dene." });
    }
  };

  if (durum === "tamam") {
    return (
      <div className="rounded-[24px] border border-white/[0.07] bg-yuzey p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-tur-3d/15 text-tur-3d"><Check className="h-6 w-6" /></span>
        <p className="mt-5 text-[22px] font-semibold tracking-[-0.02em] text-white">Başvurun alındı.</p>
        <p className="mt-2 text-[14.5px] leading-relaxed text-metin-2">Ortaklık ekibimiz başvurunu 3–5 iş günü içinde değerlendirip {f.email} adresine dönecek.</p>
      </div>
    );
  }

  return (
    <form onSubmit={gonder} className="rounded-[24px] border border-white/[0.07] bg-yuzey p-6 sm:p-8">
      <p className={etiketSinif}>Program</p>
      <div className="grid grid-cols-2 gap-2">
        {PROGRAMLAR.map((x) => (
          <button type="button" key={x} onClick={() => setProgram(x)} aria-pressed={program === x}
            className={cn("rounded-xl border px-3 py-2.5 text-left text-[13.5px] font-medium transition-colors", program === x ? "border-vurgu/60 bg-[color-mix(in_oklab,var(--vurgu-renk)_16%,#111113)] text-white" : "border-white/[0.08] text-metin-2 hover:text-white")}>{x}</button>
        ))}
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="pf-ad" className={etiketSinif}>Ad soyad</label><input id="pf-ad" value={f.ad} onChange={set("ad")} className={girdiSinif} /></div>
        <div><label htmlFor="pf-email" className={etiketSinif}>E-posta</label><input id="pf-email" type="email" value={f.email} onChange={set("email")} className={girdiSinif} /></div>
        <div><label htmlFor="pf-kurum" className={etiketSinif}>{kreator ? "Kanal adı" : "Kurum"}</label><input id="pf-kurum" value={f.kurum} onChange={set("kurum")} className={girdiSinif} /></div>
        <div><label htmlFor="pf-web" className={etiketSinif}>{kreator ? "En büyük profilin" : "Web sitesi"}</label><input id="pf-web" value={f.web} onChange={set("web")} placeholder="https://" className={girdiSinif} /></div>
        <div className="sm:col-span-2"><label htmlFor="pf-kitle" className={etiketSinif}>{kreator ? "Toplam takipçi" : "Ekip büyüklüğü ve müşteri sayısı"}</label><input id="pf-kitle" value={f.kitle} onChange={set("kitle")} className={girdiSinif} /></div>
      </div>
      <label htmlFor="pf-neden" className={cn(etiketSinif, "mt-5")}>Birlikte ne yapmak istersin?</label>
      <textarea id="pf-neden" value={f.neden} onChange={set("neden")} rows={4} className={cn(girdiSinif, "h-auto resize-none py-3")}
        placeholder={kreator ? "İçerik türün, kitlen ve Vayra'yı nasıl tanıtmayı düşündüğün." : "Müşterilerin, kullanım senaryon ve beklentilerin."} />
      <p className="mt-1.5 text-[12px] text-metin-3">En az 20 karakter</p>
      <button disabled={!gecerli || durum === "gonderiliyor"} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-[14.5px] font-semibold text-zemin hover:opacity-90 disabled:opacity-40">
        {durum === "gonderiliyor" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Başvur"}
      </button>
    </form>
  );
}
